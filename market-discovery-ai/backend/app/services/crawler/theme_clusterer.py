"""
テーマクラスタリングサービス
未処理の RawPost をカテゴリ分類し、TF-IDF で同種投稿をグループ化してテーマ化する。
"""

import re
from collections import defaultdict
from datetime import date
from typing import Dict, List, Optional, Tuple

import structlog
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import Category, RawPost, Theme
from app.services.nlp.classifier import CategoryClassifier, TextPreprocessor

logger = structlog.get_logger()


class ThemeClusterer:
    """
    未処理投稿をクラスタリングしてテーマに変換するサービス。

    アルゴリズム:
        1. 未処理RawPostを取得
        2. TextPreprocessorで前処理
        3. CategoryClassifierでカテゴリ分類
        4. TF-IDFベクトル化
        5. コサイン類似度で既存テーマと照合 (>閾値なら既存に追加)
        6. 閾値未満なら新規テーマ作成
        7. テーマのキーワード・統計を更新
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.preprocessor = TextPreprocessor()
        self.classifier = CategoryClassifier()
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            min_df=1,
        )

    async def cluster_unprocessed_posts(self) -> int:
        """未処理投稿をクラスタリングしてテーマに変換する"""
        # 未処理投稿を取得
        stmt = (
            select(RawPost)
            .where(RawPost.is_processed == False)
            .order_by(RawPost.fetched_at)
            .limit(500)  # バッチサイズ
        )
        result = await self.db.execute(stmt)
        posts = result.scalars().all()

        if not posts:
            logger.info("No unprocessed posts found")
            return 0

        logger.info("Processing posts", count=len(posts))

        # テキスト前処理
        processed_texts = [
            self.preprocessor.preprocess(
                f"{p.title or ''} {p.body}"
            )
            for p in posts
        ]

        # カテゴリ分類
        categories = [
            self.classifier.classify(text)
            for text in processed_texts
        ]

        # 既存テーマを取得 (クラスタリングの比較対象)
        existing_themes = await self._load_existing_themes()

        # TF-IDFベクトル化 (新規投稿 + 既存テーマの結合テキスト)
        all_texts = processed_texts + [t["text"] for t in existing_themes]
        try:
            tfidf_matrix = self.vectorizer.fit_transform(all_texts)
        except Exception as e:
            logger.error("TF-IDF failed", error=str(e))
            return 0

        new_vectors = tfidf_matrix[:len(posts)]
        existing_vectors = tfidf_matrix[len(posts):]

        # 各投稿を最近傍テーマに割り当て
        assigned = 0
        for i, (post, text, (cat_name, cat_conf)) in enumerate(
            zip(posts, processed_texts, categories)
        ):
            theme_id = await self._assign_to_theme(
                post=post,
                text=text,
                vec=new_vectors[i],
                category_name=cat_name,
                existing_themes=existing_themes,
                existing_vectors=existing_vectors,
            )
            post.is_processed = True
            post.detected_category = cat_name
            if theme_id:
                post.theme_id = theme_id
                assigned += 1

        logger.info("Clustering done", assigned=assigned, total=len(posts))
        return assigned

    async def _assign_to_theme(
        self,
        post: RawPost,
        text: str,
        vec,
        category_name: str,
        existing_themes: List[dict],
        existing_vectors,
    ) -> Optional[int]:
        """投稿を既存テーマに割り当てるか、新規テーマを作成する"""
        if existing_vectors.shape[0] == 0:
            return await self._create_new_theme(post, text, category_name)

        sims = cosine_similarity(vec, existing_vectors)[0]
        best_idx = int(np.argmax(sims))
        best_sim = float(sims[best_idx])

        if best_sim >= settings.SIMILARITY_THRESHOLD:
            theme_id = existing_themes[best_idx]["id"]
            await self._update_theme_stats(theme_id, post)
            return theme_id
        else:
            return await self._create_new_theme(post, text, category_name)

    async def _create_new_theme(
        self,
        post: RawPost,
        text: str,
        category_name: str,
    ) -> Optional[int]:
        """新規テーマを作成する"""
        # カテゴリ ID を DB から取得
        cat_stmt = select(Category).where(Category.name == category_name)
        cat_res = await self.db.execute(cat_stmt)
        category = cat_res.scalar_one_or_none()

        # キーワード抽出 (シンプルなTF-IDF上位N単語)
        keywords = self._extract_keywords(text)

        # タイトル = 最初の行 or 先頭40文字
        title_candidate = (post.title or text).strip()
        title = title_candidate[:80] if title_candidate else "未分類テーマ"

        theme = Theme(
            title=title,
            description=text[:200],
            category_id=category.id if category else None,
            keywords=keywords,
            post_count=1,
            posts_this_week=1,
            posts_last_week=0,
            avg_comment_count=float(post.comment_count),
            first_seen=date.today(),
            last_seen=date.today(),
        )
        self.db.add(theme)
        await self.db.flush()
        logger.debug("New theme created", title=title[:30])
        return theme.id

    async def _update_theme_stats(self, theme_id: int, post: RawPost) -> None:
        """既存テーマの統計を更新する"""
        stmt = select(Theme).where(Theme.id == theme_id)
        result = await self.db.execute(stmt)
        theme = result.scalar_one_or_none()
        if theme:
            theme.post_count += 1
            theme.posts_this_week += 1
            # 移動平均でコメント数を更新
            n = theme.post_count
            theme.avg_comment_count = (
                (theme.avg_comment_count * (n - 1) + post.comment_count) / n
            )
            theme.last_seen = date.today()

    async def _load_existing_themes(self) -> List[dict]:
        """既存テーマを取得してクラスタリング用データを準備する"""
        stmt = select(Theme).where(Theme.is_active == True).limit(1000)
        result = await self.db.execute(stmt)
        themes = result.scalars().all()
        return [
            {
                "id": t.id,
                "text": f"{t.title} {t.description or ''} {' '.join(t.keywords or [])}",
            }
            for t in themes
        ]

    @staticmethod
    def _extract_keywords(text: str, top_n: int = 10) -> List[str]:
        """
        簡易キーワード抽出 — 助詞・記号を除いた名詞的トークンを返す。
        本番ではMeCabまたはJanomeを使用推奨。
        """
        # 数字・記号・1文字を除去した単語
        tokens = re.findall(r"[ぁ-んァ-ン一-龥a-zA-Z]{2,}", text)
        stop_words = {
            "です", "ます", "する", "ある", "いる", "なる", "という",
            "ので", "から", "ため", "こと", "もの", "それ", "これ",
        }
        filtered = [t for t in tokens if t not in stop_words]
        # 出現頻度上位
        freq: Dict[str, int] = {}
        for t in filtered:
            freq[t] = freq.get(t, 0) + 1
        sorted_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)
        return [w for w, _ in sorted_words[:top_n]]
