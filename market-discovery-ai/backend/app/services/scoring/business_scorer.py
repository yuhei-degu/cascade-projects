"""
⑧ 総合ビジネス指数算出 / ⑭⑮ スコアリングエンジン

raw_posts → テーマ集約 → 全スコア算出 → BusinessScore 保存
"""
import math
from collections import Counter
from datetime import date
from typing import Dict, List, Optional, Tuple
import structlog
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import BusinessScore, Keyword, RawPost, Theme
from app.services.nlp.text_analyzer import JapaneseTextAnalyzer

logger = structlog.get_logger()


class ThemeAggregator:
    """
    未処理の raw_posts をカテゴリ別に集約してテーマを生成・更新する。
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.analyzer = JapaneseTextAnalyzer()

    async def aggregate_unprocessed(self) -> List[Theme]:
        """未処理投稿を集約してテーマを生成・更新する"""
        stmt = select(RawPost).where(RawPost.processed == False)
        result = await self.db.execute(stmt)
        posts: List[RawPost] = result.scalars().all()

        if not posts:
            logger.info("No unprocessed posts found")
            return []

        # カテゴリ別にグループ化
        category_groups: Dict[str, List[RawPost]] = {}
        for post in posts:
            cat = post.category_hint or "その他"
            category_groups.setdefault(cat, []).append(post)

        updated_themes: List[Theme] = []
        for category, group in category_groups.items():
            theme = await self._upsert_theme(category, group)
            updated_themes.append(theme)

            # 処理済みフラグを立てる
            for post in group:
                post.processed = True
                post.theme_id = theme.id

        await self.db.flush()
        logger.info("Themes aggregated", count=len(updated_themes))
        return updated_themes

    async def _upsert_theme(self, category: str, posts: List[RawPost]) -> Theme:
        """カテゴリのテーマを upsert する"""
        stmt = select(Theme).where(Theme.category == category, Theme.is_active == True)
        result = await self.db.execute(stmt)
        theme = result.scalar_one_or_none()

        # キーワード集計
        all_keywords: List[str] = []
        for post in posts:
            if post.keywords:
                all_keywords.extend(post.keywords)
        keyword_freq = Counter(all_keywords)
        top_kw = [kw for kw, _ in keyword_freq.most_common(20)]

        # 投稿増加率（簡易: 直近7日分 / 前7日分）
        recent_count = sum(1 for p in posts if p.posted_at and p.posted_at >= _days_ago(7))
        prev_count = max(sum(1 for p in posts if p.posted_at and p.posted_at < _days_ago(7)), 1)
        growth_rate = (recent_count - prev_count) / prev_count

        # ビジネスモデル推定
        all_text = " ".join(p.title_summary or "" for p in posts)
        biz_models = self.analyzer.estimate_biz_models(category, top_kw)

        if theme is None:
            # タイトル生成（トップキーワードから）
            title = _generate_theme_title(category, top_kw)
            theme = Theme(
                title=title,
                category=category,
                description=f"{category}に関する悩み・需要テーマ",
                top_keywords=top_kw,
                post_count=len(posts),
                comment_count_total=sum(p.comment_count for p in posts),
                post_growth_rate=growth_rate,
                biz_models=biz_models,
            )
            self.db.add(theme)
            await self.db.flush()
        else:
            theme.post_count += len(posts)
            theme.comment_count_total += sum(p.comment_count for p in posts)
            theme.post_growth_rate = growth_rate
            theme.top_keywords = top_kw
            theme.biz_models = biz_models

        return theme


def _days_ago(n: int) -> date:
    from datetime import timedelta
    return date.today() - timedelta(days=n)


def _generate_theme_title(category: str, keywords: List[str]) -> str:
    """カテゴリとキーワードからテーマタイトルを生成する"""
    if keywords:
        return f"【{category}】{keywords[0]}に関する悩み・需要"
    return f"【{category}】悩み・需要テーマ"


class BusinessScoreCalculator:
    """
    テーマに対して全スコアを算出して BusinessScore を保存するサービス。

    算出式:
        ビジネス指数 = 0.4 × demand + 0.3 × monetization
                    + 0.2 × (1-competition/100) + 0.1 × (1-dev_difficulty/100)
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.analyzer = JapaneseTextAnalyzer()

    async def compute_and_save(self, theme: Theme) -> BusinessScore:
        """
        テーマのスコアを計算して DB に保存する。

        Args:
            theme: スコア算出対象のテーマ

        Returns:
            保存した BusinessScore
        """
        # ① 需要スコア (0-100)
        demand_score = self._compute_demand_score(
            post_count=theme.post_count,
            comment_count=theme.comment_count_total,
            growth_rate=theme.post_growth_rate,
        )

        # ② 収益化スコア（テーマのキーワード群から算出）
        keyword_text = " ".join(theme.top_keywords or [])
        monetization_detail = self.analyzer.compute_monetization_score(keyword_text)
        monetization_score = monetization_detail["total"]

        # ③ 競合強度スコア
        competition_detail = self.analyzer.estimate_competition_score(theme.top_keywords or [])
        competition_score = competition_detail["total"]

        # ④ 開発難易度スコア
        dev_difficulty = self.analyzer.compute_dev_difficulty(
            keyword_text, theme.category
        )

        # ⑤ 総合ビジネス指数（0-100）
        w = settings
        business_index = (
            w.WEIGHT_DEMAND        * demand_score
            + w.WEIGHT_MONETIZATION * monetization_score
            + w.WEIGHT_COMPETITION  * (100 - competition_score)
            + w.WEIGHT_DEV_DIFFICULTY * (100 - dev_difficulty)
        )
        business_index = round(min(100.0, max(0.0, business_index)), 2)

        logger.info(
            "Score computed",
            theme_id=theme.id,
            category=theme.category,
            demand=round(demand_score, 1),
            monetization=round(monetization_score, 1),
            competition=round(competition_score, 1),
            dev_difficulty=round(dev_difficulty, 1),
            business_index=business_index,
        )

        # Upsert
        stmt = select(BusinessScore).where(BusinessScore.theme_id == theme.id)
        result = await self.db.execute(stmt)
        score = result.scalar_one_or_none()

        score_data = dict(
            score_date=date.today(),
            demand_score=round(demand_score, 2),
            monetization_score=round(monetization_score, 2),
            competition_score=round(competition_score, 2),
            dev_difficulty_score=round(dev_difficulty, 2),
            business_index=business_index,
            money_word_score=monetization_detail["money_word_score"],
            urgency_score=monetization_detail["urgency_score"],
            purchase_intent_score=monetization_detail["purchase_intent_score"],
            severity_score=monetization_detail["severity_score"],
            search_volume_score=competition_detail["search_volume_score"],
            app_exists_score=competition_detail["app_exists_score"],
            ad_spend_score=competition_detail["ad_spend_score"],
        )

        if score is None:
            score = BusinessScore(theme_id=theme.id, **score_data)
            self.db.add(score)
        else:
            for k, v in score_data.items():
                setattr(score, k, v)

        await self.db.flush()
        return score

    async def compute_all(self) -> None:
        """アクティブな全テーマのスコアを再計算する"""
        stmt = select(Theme).where(Theme.is_active == True)
        result = await self.db.execute(stmt)
        themes = result.scalars().all()
        logger.info("Recomputing scores", count=len(themes))
        for theme in themes:
            await self.compute_and_save(theme)

    # ── 需要スコア計算 ────────────────────────────────────────────
    def _compute_demand_score(
        self,
        post_count: int,
        comment_count: int,
        growth_rate: float,
    ) -> float:
        """
        需要スコアを算出する (0-100)。

        算出式:
            需要スコア = 0.4 × 投稿数スコア + 0.4 × コメントスコア + 0.2 × 増加率スコア

        Args:
            post_count: 投稿数
            comment_count: 累計コメント数
            growth_rate: 投稿増加率（前週比, -1.0〜）

        Returns:
            需要スコア (0-100)
        """
        # 投稿数スコア: 対数正規化（100件で80点、1000件で100点）
        post_score = min(100.0, math.log1p(post_count) / math.log1p(1000) * 100)

        # コメントスコア: 1コメントあたり2点（上限100）
        comment_score = min(100.0, comment_count * 2)

        # 増加率スコア: 成長していれば高スコア
        if growth_rate >= 0.5:
            growth_score = 100.0
        elif growth_rate >= 0.2:
            growth_score = 70.0 + (growth_rate - 0.2) / 0.3 * 30.0
        elif growth_rate >= 0:
            growth_score = growth_rate / 0.2 * 70.0
        else:
            growth_score = max(0.0, 50.0 + growth_rate * 100)

        return round(
            0.40 * post_score + 0.40 * comment_score + 0.20 * growth_score, 2
        )
