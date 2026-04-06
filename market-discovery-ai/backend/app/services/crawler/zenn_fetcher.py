"""
Zenn.dev RSSフィード収集
日本語テックコミュニティの需要シグナルを収集する。
他のクローラーが見落としがちなエンジニア向け「困りごと」を補足。
"""
import asyncio
import hashlib
from datetime import date
from typing import List

import feedparser
import httpx
import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import RawPost
from app.services.nlp.text_analyzer import JapaneseTextAnalyzer

logger = structlog.get_logger()

# 収集対象フィード — 需要シグナルが出やすいトピックに絞る
ZENN_FEEDS: List[tuple] = [
    ("https://zenn.dev/feed", "zenn"),
    ("https://zenn.dev/topics/python/feed", "zenn"),
    ("https://zenn.dev/topics/nextjs/feed", "zenn"),
    ("https://zenn.dev/topics/ai/feed", "zenn"),
    ("https://zenn.dev/topics/chatgpt/feed", "zenn"),
    ("https://zenn.dev/topics/typescript/feed", "zenn"),
]


class ZennFetcher:
    """
    Zenn.dev の RSS フィードから記事を収集する。

    ⚠️ 利用規約に従い:
    - 個人情報（投稿者名）は取得しない
    - リクエスト間隔は 1.5 秒以上
    - 公開フィードのみアクセス
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.analyzer = JapaneseTextAnalyzer()

    async def collect(self) -> int:
        """全フィードを収集して保存し、保存件数を返す。"""
        count = 0
        async with httpx.AsyncClient(
            headers={"User-Agent": settings.CRAWLER_USER_AGENT},
            timeout=15,
            follow_redirects=True,
        ) as client:
            for feed_url, source_name in ZENN_FEEDS:
                try:
                    resp = await client.get(feed_url)
                    if resp.status_code != 200:
                        logger.warning("Feed returned non-200", url=feed_url, status=resp.status_code)
                        await asyncio.sleep(1.5)
                        continue

                    feed = feedparser.parse(resp.text)
                    for entry in feed.entries[:20]:
                        saved = await self._save_entry(entry, source_name, feed_url)
                        if saved:
                            count += 1

                    await asyncio.sleep(1.5)

                except Exception as e:
                    logger.warning("Zenn feed failed", url=feed_url, error=str(e))
                    await asyncio.sleep(1.5)

        if count > 0:
            await self.db.flush()

        logger.info("Zenn collected", count=count)
        return count

    async def _save_entry(self, entry: dict, source_name: str, feed_url: str) -> bool:
        """エントリを RawPost として保存する。重複の場合は False を返す。"""
        # URLベースの重複チェック
        entry_url = entry.get("link") or entry.get("id") or ""
        url_hash = hashlib.sha256(entry_url.encode()).hexdigest()[:32]
        dedup_url = f"zenn:{url_hash}"

        exists = (await self.db.execute(
            select(RawPost.id).where(RawPost.source_url == dedup_url)
        )).scalar_one_or_none()
        if exists:
            return False

        title = (entry.get("title") or "")[:200]
        summary = (entry.get("summary") or "")[:300]
        combined = f"{title} {summary}"

        keywords = self.analyzer.tokenize(combined)[:30]
        category = self.analyzer.classify_category(combined)

        post = RawPost(
            source=source_name,
            source_url=dedup_url,
            category_hint=category,
            title_summary=title,
            keywords=keywords,
            comment_count=0,
            posted_at=date.today(),
            processed=False,
        )
        self.db.add(post)
        return True
