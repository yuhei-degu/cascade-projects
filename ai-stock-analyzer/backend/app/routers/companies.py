"""
⑨ APIルーター — 企業ランキング・詳細エンドポイント

GET /api/v1/companies        — ランキング取得（上位N社）
GET /api/v1/companies/{ticker} — 企業詳細取得
"""

from datetime import date
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.models import AIScore, Company, FinancialMetric, Patent
from app.schemas.schemas import (
    CompanyDetail,
    CompanyDetailResponse,
    CompanyRankingItem,
    FinancialMetricOut,
    AIScoreOut,
    ScoreBreakdown,
    PaginationMeta,
    RankingResponse,
)
from app.core.config import settings

router = APIRouter()
logger = structlog.get_logger()


@router.get(
    "/companies",
    response_model=RankingResponse,
    summary="AI割安株ランキング取得",
    description="技術力・成長性・収益性・バリュエーションを統合したスコアで企業をランキング表示する",
)
async def get_company_ranking(
    page: int = Query(default=1, ge=1, description="ページ番号"),
    per_page: int = Query(default=20, ge=1, le=100, description="1ページ当たりの件数"),
    sector: Optional[str] = Query(default=None, description="セクターフィルター"),
    min_score: Optional[float] = Query(default=None, ge=0, le=100, description="最低AIスコア"),
    score_date: Optional[date] = Query(default=None, description="スコア基準日（省略時は最新）"),
    db: AsyncSession = Depends(get_db),
) -> RankingResponse:
    """
    AI割安株ランキングを返す。

    スコア = AI総合スコア / (PER × PEG) が高い順に並べて返す。
    Redisキャッシュ実装は将来対応（TODO）。
    """
    logger.info("Fetching company ranking", page=page, per_page=per_page, sector=sector)

    # 最新スコア日付を決定
    if score_date is None:
        latest_date_q = select(func.max(AIScore.score_date))
        result = await db.execute(latest_date_q)
        score_date = result.scalar_one_or_none()
        if score_date is None:
            return RankingResponse(
                data=[],
                meta=PaginationMeta(total=0, page=page, per_page=per_page, total_pages=0),
                score_date=date.today(),
            )

    # 企業 + スコア + 財務指標を JOIN で取得
    stmt = (
        select(
            Company,
            AIScore,
            FinancialMetric,
        )
        .join(AIScore, AIScore.company_id == Company.id)
        .join(
            FinancialMetric,
            (FinancialMetric.company_id == Company.id)
            & (FinancialMetric.date == score_date),
            isouter=True,
        )
        .where(
            AIScore.score_date == score_date,
            Company.is_active == True,
        )
        .order_by(desc(AIScore.valuation_score))
    )

    # セクターフィルター
    if sector:
        stmt = stmt.where(Company.sector == sector)

    # 最低スコアフィルター
    if min_score is not None:
        stmt = stmt.where(AIScore.composite_score >= min_score)

    # カウント
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # ページネーション
    stmt = stmt.offset((page - 1) * per_page).limit(per_page)
    rows = await db.execute(stmt)
    results = rows.all()

    # レスポンス組み立て
    items: list[CompanyRankingItem] = []
    for company, score, fin in results:
        item = CompanyRankingItem(
            id=company.id,
            ticker=company.ticker,
            name=company.name,
            sector=company.sector,
            industry=company.industry,
            market_cap=company.market_cap,
            exchange=company.exchange,
            composite_score=score.composite_score if score else None,
            valuation_score=score.valuation_score if score else None,
            tech_score=score.tech_score if score else None,
            growth_score=score.growth_score if score else None,
            profitability_score=score.profitability_score if score else None,
            per=fin.per if fin else None,
            peg=fin.peg if fin else None,
        )
        items.append(item)

    return RankingResponse(
        data=items,
        meta=PaginationMeta(
            total=total,
            page=page,
            per_page=per_page,
            total_pages=(total + per_page - 1) // per_page,
        ),
        score_date=score_date,
    )


@router.get(
    "/companies/{ticker}",
    response_model=CompanyDetailResponse,
    summary="企業詳細取得",
    description="指定ティッカーの企業詳細情報（スコア内訳・財務指標・特許統計）を返す",
)
async def get_company_detail(
    ticker: str,
    db: AsyncSession = Depends(get_db),
) -> CompanyDetailResponse:
    """
    企業詳細情報を返す。
    最新の AIScore・FinancialMetric を付属させて返す。
    """
    ticker = ticker.upper()
    logger.info("Fetching company detail", ticker=ticker)

    # 企業取得
    stmt = select(Company).where(Company.ticker == ticker, Company.is_active == True)
    result = await db.execute(stmt)
    company = result.scalar_one_or_none()

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with ticker '{ticker}' not found.",
        )

    # 最新スコア取得
    score_stmt = (
        select(AIScore)
        .where(AIScore.company_id == company.id)
        .order_by(desc(AIScore.score_date))
        .limit(1)
    )
    score_result = await db.execute(score_stmt)
    score = score_result.scalar_one_or_none()

    # 最新財務指標取得
    fin_stmt = (
        select(FinancialMetric)
        .where(FinancialMetric.company_id == company.id)
        .order_by(desc(FinancialMetric.date))
        .limit(1)
    )
    fin_result = await db.execute(fin_stmt)
    fin = fin_result.scalar_one_or_none()

    # 特許統計取得
    patent_count_stmt = select(func.count()).where(Patent.company_id == company.id)
    ai_patent_stmt = select(func.count()).where(
        Patent.company_id == company.id,
        Patent.ai_relevance >= 0.5,
    )
    patent_total = (await db.execute(patent_count_stmt)).scalar_one()
    ai_patent_total = (await db.execute(ai_patent_stmt)).scalar_one()

    # スコアオブジェクト組み立て
    latest_score: Optional[AIScoreOut] = None
    if score:
        latest_score = AIScoreOut(
            score_date=score.score_date,
            tech_score=score.tech_score,
            growth_score=score.growth_score,
            profitability_score=score.profitability_score,
            composite_score=score.composite_score,
            valuation_score=score.valuation_score,
            per_used=score.per_used,
            peg_used=score.peg_used,
            model_version=score.model_version,
            breakdown=ScoreBreakdown(
                keyword_score=score.keyword_score,
                patent_score=score.patent_score,
                rd_ratio_score=score.rd_ratio_score,
                paper_score=score.paper_score,
            ),
        )

    # 財務指標オブジェクト
    latest_financials: Optional[FinancialMetricOut] = (
        FinancialMetricOut.model_validate(fin) if fin else None
    )

    detail = CompanyDetail(
        id=company.id,
        ticker=company.ticker,
        name=company.name,
        sector=company.sector,
        industry=company.industry,
        market_cap=company.market_cap,
        exchange=company.exchange,
        description=company.description,
        latest_score=latest_score,
        latest_financials=latest_financials,
        patent_count=patent_total,
        ai_patent_count=ai_patent_total,
        updated_at=company.updated_at,
    )

    return CompanyDetailResponse(data=detail)
