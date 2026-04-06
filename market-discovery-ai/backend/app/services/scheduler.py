"""
デイリースケジューラー
毎朝 6:00 JST に全データソースから収集 → テーマ集約 → スコアリングを自動実行する。
起動時 FIRST_RUN_COLLECT=true の場合は即座に初回実行。
"""
import asyncio
import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = structlog.get_logger()

_scheduler = AsyncIOScheduler(timezone="Asia/Tokyo")

# Yahoo知恵袋の収集対象カテゴリID（収益性・需要が高いカテゴリに絞る）
CHIEBUKURO_CATEGORIES = [
    "2090000000",  # コンピュータ・インターネット
    "2040000000",  # マネー
    "2060000000",  # 仕事・職業
    "2000000000",  # 生活・暮らし
    "2050000000",  # 健康
]


async def run_full_pipeline() -> None:
    """
    クロール → テーマ集約 → スコアリングの全パイプラインを実行する。
    各ステップは独立してエラーハンドリングし、1つが失敗しても続行する。
    """
    from app.db.session import AsyncSessionLocal
    from app.services.collector.crawler import YahooChiebukuroCollector
    from app.services.crawler.zenn_fetcher import ZennFetcher
    from app.services.crawler.github_fetcher import GithubTrendingFetcher
    from app.services.scoring.business_scorer import BusinessScoreCalculator, ThemeAggregator

    logger.info("Full pipeline started")
    collected_total = 0

    async with AsyncSessionLocal() as db:
        try:
            # ── Zenn / note.com ──────────────────────────────────
            try:
                n = await ZennFetcher(db).collect()
                collected_total += n
                await db.flush()
            except Exception as e:
                logger.error("ZennFetcher failed", error=str(e))

            # ── GitHub Trending ───────────────────────────────────
            try:
                n = await GithubTrendingFetcher(db).collect()
                collected_total += n
                await db.flush()
            except Exception as e:
                logger.error("GithubTrendingFetcher failed", error=str(e))

            # ── Yahoo知恵袋 ───────────────────────────────────────
            yahoo = YahooChiebukuroCollector(db)
            for cat_id in CHIEBUKURO_CATEGORIES:
                try:
                    posts = await yahoo.collect_by_category(cat_id, max_pages=2)
                    collected_total += len(posts)
                except Exception as e:
                    logger.error("Yahoo crawler failed", category=cat_id, error=str(e))

            # ── テーマ集約 → スコアリング ─────────────────────────
            agg = ThemeAggregator(db)
            themes = await agg.aggregate_unprocessed()

            scorer = BusinessScoreCalculator(db)
            for theme in themes:
                await scorer.compute_and_save(theme)

            await db.commit()
            logger.info(
                "Pipeline completed",
                collected=collected_total,
                themes_updated=len(themes),
            )

        except Exception as e:
            await db.rollback()
            logger.error("Pipeline failed at top level", error=str(e))


def start_scheduler(hour: int = 6, run_now: bool = False) -> None:
    """スケジューラーを起動する。run_now=True なら即座に初回実行も行う。"""
    _scheduler.add_job(
        run_full_pipeline,
        CronTrigger(hour=hour, minute=0),
        id="daily_pipeline",
        replace_existing=True,
        misfire_grace_time=3600,
    )
    _scheduler.start()
    logger.info("Scheduler started", daily_hour_jst=hour)

    if run_now:
        # 非同期ループに乗せて即座に実行（起動直後にデータが見えるように）
        asyncio.ensure_future(run_full_pipeline())
        logger.info("Initial collection triggered")


def stop_scheduler() -> None:
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
