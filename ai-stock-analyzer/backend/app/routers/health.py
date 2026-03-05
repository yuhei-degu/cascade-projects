"""
APIルーター — ヘルスチェック + 手動再解析トリガー

GET  /api/v1/health           — ヘルスチェック
POST /api/v1/analyze/{ticker} — 手動再解析トリガー
"""

from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.schemas.schemas import AnalyzeResponse, HealthResponse
from app.services.scoring.composite_scorer import CompositeScoringService

router = APIRouter()
analyze_router = APIRouter()
logger = structlog.get_logger()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="ヘルスチェック",
    description="APIおよびDBの接続状態を返す",
)
async def health_check(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    """DB疎通確認を含むヘルスチェック"""
    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error("Database health check failed", error=str(e))
        db_status = "disconnected"

    return HealthResponse(
        status="ok" if db_status == "connected" else "degraded",
        version=settings.APP_VERSION,
        database=db_status,
        timestamp=datetime.now(timezone.utc),
    )


# analyzeルーターは別ファイルから登録するため、ここで直接定義
health = router  # エイリアス


# ── 再解析ルーター ─────────────────────────────────────────────────
analyze = APIRouter()


@analyze.post(
    "/analyze/{ticker}",
    response_model=AnalyzeResponse,
    summary="企業を手動再解析",
    description="指定ティッカーのデータ再取得・スコア再計算をバックグラウンドで実行する",
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_analysis(
    ticker: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> AnalyzeResponse:
    """
    バックグラウンドタスクとして以下を実行:
    1. Yahoo Finance から財務データ再取得
    2. USPTO から特許データ再取得
    3. NLPスコア再計算
    4. DB更新
    """
    ticker = ticker.upper()
    logger.info("Manual analysis triggered", ticker=ticker)

    # バックグラウンドで実行（本番ではCeleryに移行推奨）
    background_tasks.add_task(run_full_analysis, ticker=ticker)

    return AnalyzeResponse(
        ticker=ticker,
        status="started",
        message=f"{ticker} の解析をバックグラウンドで開始しました。完了まで数分かかります。",
    )


async def run_full_analysis(ticker: str) -> None:
    """
    フル解析パイプラインをバックグラウンドで実行する

    Args:
        ticker: 対象企業のティッカーシンボル
    """
    from app.db.session import AsyncSessionLocal
    from app.services.financial.fetcher import FinancialDataFetcher
    from app.services.nlp.patent_analyzer import PatentAnalyzer
    from app.services.scoring.composite_scorer import CompositeScoringService

    logger.info("Starting full analysis pipeline", ticker=ticker)

    async with AsyncSessionLocal() as db:
        try:
            # Step 1: 財務データ取得・更新
            fetcher = FinancialDataFetcher(db)
            await fetcher.fetch_and_save(ticker)
            logger.info("Financial data updated", ticker=ticker)

            # Step 2: スコア再計算
            scorer = CompositeScoringService(db)
            await scorer.compute_and_save(ticker)
            logger.info("Score computed", ticker=ticker)

            await db.commit()
            logger.info("Full analysis completed", ticker=ticker)

        except Exception as e:
            await db.rollback()
            logger.error("Analysis pipeline failed", ticker=ticker, error=str(e))
