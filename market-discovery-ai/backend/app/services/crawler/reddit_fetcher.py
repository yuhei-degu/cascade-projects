"""
Reddit フェッチャー — PRAW を使って subreddit から投稿を収集する
利用規約遵守: レート制限準拠・個人情報ハッシュ化・ユーザーエージェント必須
"""

import asyncio
import hashlib
from datetime import datetime, timezone
from typing import List, Optional

import structlog

from app.core.config import settings
from app.models.models import RawPost
from app.services.nlp.classifier import TextPreprocessor

logger = structlog.get_logger()

# デフォルト収集対象 subreddit（日本語コミュニティ）
DEFAULT_SUBREDDITS: List[str] = [
    "japan",
    "LearnJapanese",
    "japanlife",
    "startups",
    "Entrepreneur",
    "sidehustle",
    "personalfinance",
]


def _hash_author(author_name: Optional[str]) -> Optional[str]:
    """投稿者名をSHA-256ハッシュ化（個人情報保護）"""
    if not author_name:
        return None
    return hashlib.sha256(author_name.encode()).hexdigest()


class RedditFetcher:
    """
    Reddit API から投稿データを取得するクラス。

    利用規約遵守事項:
      - robots.txt / API利用規約を遵守
      - レート制限: 1分60リクエスト以内
      - 個人情報: 投稿者名はハッシュ化して保存
      - 削除済み投稿は収集しない
    """

    def __init__(self) -> None:
        self.preprocessor = TextPreprocessor()
        self._reddit = None

    def _get_reddit(self):
        """PRAW インスタンスを遅延初期化"""
        if self._reddit is not None:
            return self._reddit
        if not settings.REDDIT_CLIENT_ID or not settings.REDDIT_CLIENT_SECRET:
            raise RuntimeError(
                "Reddit API credentials not configured. "
                "Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env"
            )
        import praw
        self._reddit = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent=settings.REDDIT_USER_AGENT,
            read_only=True,  # 読み取り専用
        )
        return self._reddit

    async def fetch_subreddit(
        self,
        subreddit_name: str,
        limit: int = 100,
        category: str = "hot",
    ) -> List[RawPost]:
        """
        指定 subreddit から投稿を取得して RawPost リストを返す。

        Args:
            subreddit_name: subreddit 名 (例: "startups")
            limit: 取得件数上限
            category: "hot" / "new" / "top"

        Returns:
            RawPost オブジェクトのリスト（DBへの保存はサービス層で行う）
        """
        logger.info("Fetching Reddit posts", subreddit=subreddit_name, limit=limit)

        posts: List[RawPost] = []

        def _fetch_sync() -> List[dict]:
            """同期処理部分（PRAW は同期API）"""
            reddit = self._get_reddit()
            sub = reddit.subreddit(subreddit_name)
            submissions = getattr(sub, category)(limit=limit)
            results = []
            for submission in submissions:
                # 削除済み・[removed] は収集しない
                if submission.removed_by_category or submission.selftext == "[removed]":
                    continue
                results.append({
                    "source_id":      str(submission.id),
                    "title":          submission.title,
                    "body":           submission.selftext or submission.title,
                    "comment_count":  submission.num_comments,
                    "upvotes":        submission.score,
                    "author_hash":    _hash_author(str(submission.author) if submission.author else None),
                    "posted_at":      datetime.fromtimestamp(submission.created_utc, tz=timezone.utc),
                })
            return results

        try:
            raw_results = await asyncio.to_thread(_fetch_sync)
        except Exception as e:
            logger.error("Reddit fetch failed", subreddit=subreddit_name, error=str(e))
            return []

        for r in raw_results:
            clean_body = self.preprocessor.preprocess(
                f"{r['title']} {r['body']}"
            )
            if len(clean_body.strip()) < 10:
                continue
            post = RawPost(
                source="reddit",
                source_id=r["source_id"],
                author_hash=r["author_hash"],     # ハッシュ化済み
                title=self.preprocessor.normalize(r["title"])[:500],
                body=clean_body[:5000],
                comment_count=r["comment_count"],
                upvotes=r["upvotes"],
                posted_at=r["posted_at"],
                language="en",
            )
            posts.append(post)

        logger.info("Reddit posts fetched", subreddit=subreddit_name, count=len(posts))
        return posts

    async def fetch_all_defaults(self, limit_per_sub: int = 50) -> List[RawPost]:
        """デフォルト subreddit リストをすべて収集する"""
        all_posts: List[RawPost] = []
        for sub in DEFAULT_SUBREDDITS:
            posts = await self.fetch_subreddit(sub, limit=limit_per_sub)
            all_posts.extend(posts)
            await asyncio.sleep(1.0)  # レート制限対策
        return all_posts
