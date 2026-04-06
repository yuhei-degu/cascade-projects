"""
GitHub Trending スクレイパー
今日急上昇したリポジトリから「技術トレンド × 需要」シグナルを収集する。
「他人が作っていないもの」を見つけるための補助データ。
"""
import asyncio
import hashlib
import re
from datetime import date
from typing import List

import httpx
import structlog
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import RawPost
from app.services.nlp.text_analyzer import JapaneseTextAnalyzer

logger = structlog.get_logger()

# 日別トレンド（今日急上昇 = 需要シグナル強）
TRENDING_URLS: List[str] = [
    "https://github.com/trending?since=daily",
    "https://github.com/trending/python?since=daily",
    "https://github.com/trending/typescript?since=daily",
]


class GithubTrendingFetcher:
    """
    GitHub Trending ページをスクレイピングしてリポジトリ情報を収集する。

    ⚠️ GitHub の robots.txt は /trending を禁止していないが、
       過度なリクエストは避け 3 秒以上のウェイトを設ける。
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.analyzer = JapaneseTextAnalyzer()

    async def collect(self) -> int:
        """トレンドリポジトリを収集して保存し、保存件数を返す。"""
        count = 0
        async with httpx.AsyncClient(
            headers={"User-Agent": settings.CRAWLER_USER_AGENT},
            timeout=15,
            follow_redirects=True,
        ) as client:
            for url in TRENDING_URLS:
                try:
                    resp = await client.get(url)
                    if resp.status_code != 200:
                        await asyncio.sleep(3)
                        continue

                    repos = self._parse_trending(resp.text)
                    for repo in repos:
                        saved = await self._save_repo(repo)
                        if saved:
                            count += 1

                    await asyncio.sleep(3)

                except Exception as e:
                    logger.warning("GitHub trending failed", url=url, error=str(e))
                    await asyncio.sleep(3)

        if count > 0:
            await self.db.flush()

        logger.info("GitHub trending collected", count=count)
        return count

    def _parse_trending(self, html: str) -> List[dict]:
        """HTML からリポジトリ情報を抽出する。"""
        soup = BeautifulSoup(html, "lxml")
        repos: List[dict] = []

        for article in soup.select("article.Box-row"):
            try:
                name_tag = article.select_one("h2 a")
                if not name_tag:
                    continue

                full_name = name_tag.get("href", "").lstrip("/").strip()
                desc_tag = article.select_one("p")
                description = desc_tag.get_text(strip=True) if desc_tag else ""

                # 今日のスター数
                stars_today = 0
                stars_tag = article.select_one("span.d-inline-block.float-sm-right")
                if stars_tag:
                    m = re.search(r"([\d,]+)", stars_tag.get_text())
                    if m:
                        try:
                            stars_today = int(m.group(1).replace(",", ""))
                        except ValueError:
                            pass

                repos.append({
                    "full_name": full_name,
                    "description": description,
                    "stars_today": stars_today,
                })
            except Exception:
                continue

        return repos

    async def _save_repo(self, repo: dict) -> bool:
        """リポジトリを RawPost として保存する。重複の場合は False を返す。"""
        full_name = repo["full_name"]
        if not full_name:
            return False

        dedup_key = f"github:{hashlib.sha256(full_name.encode()).hexdigest()[:32]}"

        exists = (await self.db.execute(
            select(RawPost.id).where(RawPost.source_url == dedup_key)
        )).scalar_one_or_none()
        if exists:
            return False

        description = repo.get("description") or ""
        stars_today = repo.get("stars_today", 0)

        # GitHubリポジトリは「テック需要」として扱う
        # スター数をコメント数に見立てて需要スコアに反映させる
        combined = f"{full_name.replace('/', ' ')} {description}"
        keywords = self.analyzer.tokenize(combined)[:30]

        post = RawPost(
            source="github_trending",
            source_url=dedup_key,
            category_hint="IT・テック",
            title_summary=f"{full_name}: {description}"[:200],
            keywords=keywords,
            comment_count=stars_today,  # スター数を需要指標として活用
            posted_at=date.today(),
            processed=False,
        )
        self.db.add(post)
        return True
