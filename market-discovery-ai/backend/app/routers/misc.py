"""
ルーター — カテゴリ一覧 / 投稿インポート / 解析トリガー / ヘルスチェック
"""

from datetime import datetime, timezone
from typing import List

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.models.models import Category, RawPost
from app.schemas.schemas import (
    AnalyzeResponse, CategoryOut, HealthResponse,
    PostCreate, PostImportResponse,
)

logger = structlog.get_logger()

# ── カテゴリルーター ──────────────────────────────────────────────

categories = APIRouter()


@categories.get("/categories", response_model=List[CategoryOut], summary="カテゴリ一覧")
async def list_categories(db: AsyncSession = Depends(get_db)) -> List[CategoryOut]:
    stmt = select(Category).where(Category.is_active == True).order_by(Category.name)
    result = await db.execute(stmt)
    return [CategoryOut.model_validate(c) for c in result.scalars().all()]


# ── 投稿インポートルーター ────────────────────────────────────────

posts = APIRouter()


@posts.post(
    "/posts",
    response_model=PostImportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="投稿データ手動インポート",
    description=(
        "テスト・デモ用の投稿インポートエンドポイント。"
        "個人情報（作者名等）は受け付けない設計。"
    ),
)
async def import_posts(
    payloads: List[PostCreate],
    db: AsyncSession = Depends(get_db),
) -> PostImportResponse:
    """投稿データを DB に保存する（個人情報は保存しない）"""
    from app.services.nlp.classifier import TextPreprocessor
    prep = TextPreprocessor()
    imported, skipped = 0, 0

    for p in payloads:
        clean_body = prep.preprocess(p.body)
        if len(clean_body.strip()) < 10:
            skipped += 1
            continue
        post = RawPost(
            source=p.source,
            title=prep.normalize(p.title) if p.title else None,
            body=clean_body,
            comment_count=p.comment_count,
            upvotes=p.upvotes,
            posted_at=p.posted_at,
            # author_hash は設定しない（個人情報保護）
        )
        db.add(post)
        imported += 1

    await db.commit()
    logger.info("Posts imported", imported=imported, skipped=skipped)
    return PostImportResponse(
        imported=imported,
        skipped=skipped,
        message=f"{imported}件インポート、{skipped}件スキップ",
    )


# ── 解析トリガールーター ──────────────────────────────────────────

analyze = APIRouter()


@analyze.post(
    "/analyze",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="全テーマ再解析トリガー",
)
async def trigger_analyze(background_tasks: BackgroundTasks) -> AnalyzeResponse:
    """NLP分類・スコア再計算をバックグラウンドで実行する"""
    background_tasks.add_task(_run_full_pipeline)
    return AnalyzeResponse(
        status="started",
        message="解析パイプラインをバックグラウンドで開始しました。",
    )


async def _run_full_pipeline() -> None:
    """
    フル解析パイプライン:
    1. 未処理投稿を NLP でカテゴリ分類
    2. テーマクラスタリング（同種投稿をグループ化）
    3. 全テーマのスコア再計算
    """
    from app.db.session import AsyncSessionLocal
    from app.services.crawler.theme_clusterer import ThemeClusterer
    from app.services.scoring.business_index import ThemeScoringService

    logger.info("Full analysis pipeline started")
    async with AsyncSessionLocal() as db:
        try:
            clusterer = ThemeClusterer(db)
            await clusterer.cluster_unprocessed_posts()

            scorer = ThemeScoringService(db)
            scored = await scorer.score_all_themes()

            await db.commit()
            logger.info("Full analysis pipeline completed", scored=scored)
        except Exception as e:
            await db.rollback()
            logger.error("Pipeline failed", error=str(e))


# ── ヘルスチェックルーター ────────────────────────────────────────

health = APIRouter()


@health.get("/health", response_model=HealthResponse, summary="ヘルスチェック")
async def check_health(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    db_status = "connected"
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return HealthResponse(
        status="ok" if db_status == "connected" else "degraded",
        version=settings.APP_VERSION,
        database=db_status,
        timestamp=datetime.now(timezone.utc),
    )
