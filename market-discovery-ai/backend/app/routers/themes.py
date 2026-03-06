"""
⑮ ランキングAPI実装 / ⑩ API設計

GET /api/v1/themes           — テーマランキング
GET /api/v1/themes/{id}      — テーマ詳細
GET /api/v1/categories       — カテゴリ一覧
POST /api/v1/ingest          — 手動テキストインポート
POST /api/v1/analyze         — 再解析トリガー
GET /api/v1/health           — ヘルスチェック
"""
from datetime import datetime, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import get_db
from app.models.models import BusinessScore, Keyword, Theme
from app.schemas.schemas import (
    BusinessScoreOut, CompetitionBreakdown, HealthResponse,
    IngestRequest, IngestResponse, MonetizationBreakdown,
    PaginationMeta, RankingResponse, ThemeDetail, ThemeDetailResponse, ThemeRankingItem,
)

router = APIRouter()
logger = structlog.get_logger()

CATEGORIES = list({
    "健康・医療", "金融・投資", "副業・収入", "転職・キャリア",
    "恋愛・人間関係", "育児・教育", "テクノロジー", "法律・税務",
    "不動産・住宅", "旅行・移住", "ダイエット・美容", "メンタルヘルス",
    "ペット", "食・料理", "その他",
})


@router.get(
    "/themes",
    response_model=RankingResponse,
    summary="ビジネステーマランキング取得",
    description=(
        "総合ビジネス指数 (需要×収益化×競合×開発難易度) の高い順にテーマを返す。"
        "カテゴリ・競合強度上限・最低指数でフィルタリング可能。"
    ),
)
async def get_theme_ranking(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    category: Optional[str] = Query(default=None, description="カテゴリフィルター"),
    max_competition: Optional[float] = Query(
        default=None, ge=0, le=100,
        description="競合強度上限（例: 50 → 競合スコア50以下のみ表示）"
    ),
    min_business_index: Optional[float] = Query(
        default=None, ge=0, le=100, description="最低ビジネス指数"
    ),
    db: AsyncSession = Depends(get_db),
) -> RankingResponse:
    """
    総合ビジネス指数降順でテーマランキングを返す。
    低競合フィルター (max_competition) が UI の「低競合のみ表示」に対応する。
    """
    logger.info("Fetching ranking", category=category, max_competition=max_competition)

    # ── クエリ構築 ────────────────────────────────────────────────
    stmt = (
        select(Theme, BusinessScore)
        .join(BusinessScore, BusinessScore.theme_id == Theme.id, isouter=True)
        .where(Theme.is_active == True)
        .order_by(desc(BusinessScore.business_index))
    )

    if category:
        stmt = stmt.where(Theme.category == category)
    if max_competition is not None:
        stmt = stmt.where(BusinessScore.competition_score <= max_competition)
    if min_business_index is not None:
        stmt = stmt.where(BusinessScore.business_index >= min_business_index)

    # カウント
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    # ページネーション
    stmt = stmt.offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(stmt)).all()

    items: list[ThemeRankingItem] = []
    for theme, score in rows:
        item = ThemeRankingItem(
            id=theme.id,
            title=theme.title,
            category=theme.category,
            description=theme.description,
            top_keywords=theme.top_keywords,
            post_count=theme.post_count,
            comment_count_total=theme.comment_count_total,
            post_growth_rate=theme.post_growth_rate,
            biz_models=theme.biz_models,
            business_index=score.business_index if score else None,
            demand_score=score.demand_score if score else None,
            monetization_score=score.monetization_score if score else None,
            competition_score=score.competition_score if score else None,
            dev_difficulty_score=score.dev_difficulty_score if score else None,
        )
        items.append(item)

    filters_applied = {}
    if category: filters_applied["category"] = category
    if max_competition is not None: filters_applied["max_competition"] = max_competition
    if min_business_index is not None: filters_applied["min_business_index"] = min_business_index

    from datetime import date
    return RankingResponse(
        data=items,
        meta=PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page,
        ),
        score_date=date.today(),
        filters_applied=filters_applied,
    )


@router.get(
    "/themes/{theme_id}",
    response_model=ThemeDetailResponse,
    summary="テーマ詳細取得",
)
async def get_theme_detail(
    theme_id: int,
    db: AsyncSession = Depends(get_db),
) -> ThemeDetailResponse:
    """テーマの詳細情報（スコア内訳・キーワードリスト）を返す"""
    stmt = select(Theme).where(Theme.id == theme_id, Theme.is_active == True)
    result = await db.execute(stmt)
    theme = result.scalar_one_or_none()
    if theme is None:
        raise HTTPException(status_code=404, detail=f"Theme {theme_id} not found")

    # スコア取得
    score_stmt = select(BusinessScore).where(BusinessScore.theme_id == theme_id)
    score = (await db.execute(score_stmt)).scalar_one_or_none()

    # キーワード取得
    kw_stmt = select(Keyword).where(Keyword.theme_id == theme_id).order_by(
        desc(Keyword.tfidf_score)
    ).limit(30)
    keywords = (await db.execute(kw_stmt)).scalars().all()

    score_out: Optional[BusinessScoreOut] = None
    if score:
        score_out = BusinessScoreOut(
            score_date=score.score_date,
            demand_score=score.demand_score,
            monetization_score=score.monetization_score,
            competition_score=score.competition_score,
            dev_difficulty_score=score.dev_difficulty_score,
            business_index=score.business_index,
            model_version=score.model_version,
            monetization_detail=MonetizationBreakdown(
                money_word_score=score.money_word_score,
                urgency_score=score.urgency_score,
                purchase_intent_score=score.purchase_intent_score,
                severity_score=score.severity_score,
            ),
            competition_detail=CompetitionBreakdown(
                search_volume_score=score.search_volume_score,
                app_exists_score=score.app_exists_score,
                ad_spend_score=score.ad_spend_score,
            ),
        )

    detail = ThemeDetail(
        id=theme.id,
        title=theme.title,
        category=theme.category,
        description=theme.description,
        top_keywords=theme.top_keywords,
        post_count=theme.post_count,
        comment_count_total=theme.comment_count_total,
        post_growth_rate=theme.post_growth_rate,
        biz_models=theme.biz_models,
        score=score_out,
        keywords_list=[
            {"word": k.word, "tfidf_score": k.tfidf_score, "is_monetization": k.is_monetization}
            for k in keywords
        ],
        updated_at=theme.updated_at,
    )
    return ThemeDetailResponse(data=detail)


@router.get("/categories", summary="カテゴリ一覧取得")
async def get_categories() -> dict:
    """利用可能なカテゴリ一覧を返す"""
    return {"categories": sorted(CATEGORIES)}


@router.post(
    "/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="テキスト手動インポート",
)
async def ingest_texts(
    body: IngestRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> IngestResponse:
    """
    テキストリストをインポートして非同期で NLP 処理 → スコア算出を実行する。
    """
    from app.services.collector.crawler import ManualTextImporter
    importer = ManualTextImporter(db)
    posts = await importer.import_texts(body.texts, body.source, body.category_hint)
    background_tasks.add_task(_run_pipeline_bg)
    return IngestResponse(
        accepted=len(posts),
        message=f"{len(posts)}件のテキストを受け付けました。バックグラウンドで解析中です。",
    )


@router.post("/analyze", summary="全テーマ再解析トリガー", status_code=202)
async def trigger_analyze(background_tasks: BackgroundTasks) -> dict:
    """全テーマのスコアをバックグラウンドで再計算する"""
    background_tasks.add_task(_run_pipeline_bg)
    return {"status": "started", "message": "スコア再計算を開始しました"}


@router.get("/health", response_model=HealthResponse, summary="ヘルスチェック")
async def health(db: AsyncSession = Depends(get_db)) -> HealthResponse:
    db_status = "connected"
    try:
        from sqlalchemy import text
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"
    return HealthResponse(
        status="ok" if db_status == "connected" else "degraded",
        version=settings.APP_VERSION,
        database=db_status,
        timestamp=datetime.now(timezone.utc),
    )


async def _run_pipeline_bg() -> None:
    """バックグラウンド解析パイプライン（集約 → スコア計算）"""
    from app.db.session import AsyncSessionLocal
    from app.services.scoring.business_scorer import BusinessScoreCalculator, ThemeAggregator
    async with AsyncSessionLocal() as db:
        try:
            agg = ThemeAggregator(db)
            themes = await agg.aggregate_unprocessed()
            scorer = BusinessScoreCalculator(db)
            for theme in themes:
                await scorer.compute_and_save(theme)
            await db.commit()
            logger.info("Pipeline completed", themes_updated=len(themes))
        except Exception as e:
            await db.rollback()
            logger.error("Pipeline failed", error=str(e))
