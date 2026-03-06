"""
⑫ データ収集サービス — クローラー

Yahoo知恵袋・RSSフィード・手動インポートからデータ収集。
robots.txt 準拠・個人情報非保存設計。
"""
import asyncio
import hashlib
import re
from datetime import date, datetime
from typing import List, Optional
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx
import structlog
from bs4 import BeautifulSoup
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.models import CrawlLog, RawPost
from app.services.nlp.text_analyzer import JapaneseTextAnalyzer

logger = structlog.get_logger()

# 個人情報マスキング正規表現
_RE_EMAIL   = re.compile(r'[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}')
_RE_PHONE   = re.compile(r'0\d{1,4}[-\s]?\d{2,4}[-\s]?\d{4}')
_RE_NAME_HINT = re.compile(r'(私の名前は|名前:)\s*\S+')  # 簡易マスク


def _mask_pii(text: str) -> str:
    """メール・電話番号等の個人情報をマスクする"""
    text = _RE_EMAIL.sub("[EMAIL]", text)
    text = _RE_PHONE.sub("[PHONE]", text)
    text = _RE_NAME_HINT.sub("[NAME]", text)
    return text


def _url_hash(url: str) -> str:
    """URL を SHA256 ハッシュ化（重複チェック用）"""
    return hashlib.sha256(url.encode()).hexdigest()


class RobotsChecker:
    """robots.txt キャッシュチェッカー"""
    _cache: dict = {}

    async def is_allowed(self, url: str) -> bool:
        """指定 URL のクロールが robots.txt で許可されているか確認する"""
        parsed = urlparse(url)
        base = f"{parsed.scheme}://{parsed.netloc}"
        if base not in self._cache:
            rp = RobotFileParser()
            robots_url = f"{base}/robots.txt"
            try:
                async with httpx.AsyncClient(timeout=5) as client:
                    resp = await client.get(robots_url)
                    rp.parse(resp.text.splitlines())
                    self._cache[base] = rp
                    logger.debug("robots.txt fetched", base=base)
            except Exception as e:
                logger.warning("robots.txt fetch failed, assuming allowed", base=base, error=str(e))
                return True
        return self._cache[base].can_fetch(settings.CRAWLER_USER_AGENT, url)


robots_checker = RobotsChecker()


class YahooChiebukuroCollector:
    """
    Yahoo知恵袋の公開質問を収集するクローラー。

    ⚠️ 利用規約に従い:
    - 投稿者名・IDは取得しない
    - クロール間隔は3秒以上
    - robots.txt を遵守する
    - 過度なリクエストを行わない
    """
    BASE_URL = "https://chiebukuro.yahoo.co.jp"
    SEARCH_URL = "https://chiebukuro.yahoo.co.jp/search/search.action"
    HEADERS = {
        "User-Agent": settings.CRAWLER_USER_AGENT,
        "Accept-Language": "ja-JP,ja;q=0.9",
    }

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.analyzer = JapaneseTextAnalyzer()

    async def collect_by_category(
        self, category_id: str, max_pages: int = 5
    ) -> List[RawPost]:
        """
        カテゴリIDで知恵袋を検索して投稿を収集する。

        Args:
            category_id: 知恵袋のカテゴリID文字列
            max_pages: 最大ページ数

        Returns:
            保存した RawPost のリスト
        """
        saved: List[RawPost] = []
        async with httpx.AsyncClient(headers=self.HEADERS, timeout=15, follow_redirects=True) as client:
            for page in range(1, max_pages + 1):
                url = f"{self.SEARCH_URL}?p={category_id}&page={page}"

                # robots.txt チェック
                if not await robots_checker.is_allowed(url):
                    logger.info("Blocked by robots.txt", url=url)
                    break

                # 重複チェック
                if await self._is_already_crawled(url):
                    logger.debug("Already crawled, skipping", url=url)
                    continue

                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                except httpx.HTTPError as e:
                    logger.warning("Fetch failed", url=url, error=str(e))
                    await asyncio.sleep(settings.CRAWLER_DELAY_SECONDS)
                    continue

                posts = await self._parse_list_page(resp.text, url)
                saved.extend(posts)
                await self._log_crawl(url, resp.status_code)

                # レート制限（robots.txt準拠: 3秒待機）
                await asyncio.sleep(settings.CRAWLER_DELAY_SECONDS)

        logger.info("Collection completed", count=len(saved), category=category_id)
        return saved

    async def _parse_list_page(self, html: str, base_url: str) -> List[RawPost]:
        """HTML から質問一覧を解析して RawPost を生成・保存する"""
        soup = BeautifulSoup(html, "html.parser")
        posts: List[RawPost] = []

        # ⚠️ セレクタは知恵袋のHTML構造に依存 — 変更時は要更新
        items = soup.select(".Question-titleWrapper, .js-questionItem")
        for item in items[:20]:  # 1ページ最大20件
            title_tag = item.select_one(".Question-title, h3")
            if not title_tag:
                continue

            title = title_tag.get_text(strip=True)[:200]
            title = _mask_pii(title)  # PII マスク

            # コメント数
            count_tag = item.select_one(".Question-answerCount, .answerCount")
            comment_count = 0
            if count_tag:
                m = re.search(r'\d+', count_tag.get_text())
                if m:
                    comment_count = int(m.group())

            # キーワード抽出（タイトルのみ、本文は取得しない）
            keywords = self.analyzer.tokenize(title)[:30]

            # カテゴリ推定
            category = self.analyzer.classify_category(title)

            post = RawPost(
                source="yahoo_chiebukuro",
                source_url=base_url,    # ページURLのみ（投稿URLは保存しない）
                category_hint=category,
                title_summary=title[:200],
                keywords=keywords,
                comment_count=comment_count,
                posted_at=date.today(),
                processed=False,
            )
            self.db.add(post)
            posts.append(post)

        await self.db.flush()
        return posts

    async def _is_already_crawled(self, url: str) -> bool:
        """このURLを過去にクロール済みかチェック"""
        h = _url_hash(url)
        stmt = select(CrawlLog).where(CrawlLog.url_hash == h)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def _log_crawl(self, url: str, status_code: int) -> None:
        """クロールログを記録"""
        log = CrawlLog(
            source="yahoo_chiebukuro",
            url_hash=_url_hash(url),
            status_code=status_code,
            robots_allowed=True,
        )
        self.db.add(log)
        await self.db.flush()


class RSSFeedCollector:
    """
    RSS/Atom フィードから投稿データを収集するクローラー。

    Reddit・はてな匿名ダイアリーなど設定可能なフィードを処理する。
    """
    HEADERS = {"User-Agent": settings.CRAWLER_USER_AGENT}

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.analyzer = JapaneseTextAnalyzer()

    async def collect_from_feed(self, feed_url: str, source_name: str) -> List[RawPost]:
        """
        RSSフィードから投稿を取得して保存する。

        Args:
            feed_url: RSS/Atom フィールの URL
            source_name: データソース名（識別子）

        Returns:
            保存した RawPost のリスト
        """
        if not await robots_checker.is_allowed(feed_url):
            logger.info("RSS feed blocked by robots.txt", url=feed_url)
            return []

        async with httpx.AsyncClient(headers=self.HEADERS, timeout=15) as client:
            try:
                resp = await client.get(feed_url)
                resp.raise_for_status()
            except httpx.HTTPError as e:
                logger.warning("RSS feed fetch failed", url=feed_url, error=str(e))
                return []

        return await self._parse_rss(resp.text, source_name, feed_url)

    async def _parse_rss(
        self, xml_text: str, source_name: str, feed_url: str
    ) -> List[RawPost]:
        """RSS/Atom XML をパースして RawPost リストを生成する"""
        soup = BeautifulSoup(xml_text, "xml")
        items = soup.find_all("item") or soup.find_all("entry")
        posts: List[RawPost] = []

        for item in items[:30]:
            title_tag = item.find("title")
            if not title_tag:
                continue

            title = title_tag.get_text(strip=True)[:200]
            title = _mask_pii(title)

            # 本文取得（summary/descriptionのみ、200文字まで）
            summary_tag = item.find("summary") or item.find("description")
            body_text = summary_tag.get_text(strip=True)[:200] if summary_tag else ""
            body_text = _mask_pii(body_text)

            combined = f"{title} {body_text}"
            keywords = self.analyzer.tokenize(combined)[:30]
            category = self.analyzer.classify_category(combined)

            post = RawPost(
                source=source_name,
                source_url=feed_url,
                category_hint=category,
                title_summary=title,
                keywords=keywords,
                comment_count=0,
                posted_at=date.today(),
                processed=False,
            )
            self.db.add(post)
            posts.append(post)

        await self.db.flush()
        await asyncio.sleep(settings.CRAWLER_DELAY_SECONDS)
        return posts


class ManualTextImporter:
    """
    手動テキストインポート（API経由でテキストリストを受け取り処理する）。
    テスト・デモ用途にも使える。
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.analyzer = JapaneseTextAnalyzer()

    async def import_texts(
        self,
        texts: List[str],
        source: str = "manual",
        category_hint: Optional[str] = None,
    ) -> List[RawPost]:
        """
        テキストリストをインポートして RawPost を生成・保存する。

        Args:
            texts: テキストのリスト（最大500件）
            source: データソース名
            category_hint: カテゴリヒント（省略時は自動分類）

        Returns:
            保存した RawPost のリスト
        """
        posts: List[RawPost] = []
        for text in texts[:500]:
            text = _mask_pii(text.strip())
            if not text:
                continue

            keywords = self.analyzer.tokenize(text)[:30]
            category = category_hint or self.analyzer.classify_category(text)

            post = RawPost(
                source=source,
                source_url=None,
                category_hint=category,
                title_summary=text[:200],
                keywords=keywords,
                comment_count=0,
                posted_at=date.today(),
                processed=False,
            )
            self.db.add(post)
            posts.append(post)

        await self.db.flush()
        logger.info("Manual import completed", count=len(posts), source=source)
        return posts
