from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class PaginationMeta(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int


class MonetizationBreakdown(BaseModel):
    money_word_score: Optional[float] = None
    urgency_score: Optional[float] = None
    purchase_intent_score: Optional[float] = None
    severity_score: Optional[float] = None


class CompetitionBreakdown(BaseModel):
    search_volume_score: Optional[float] = None
    app_exists_score: Optional[float] = None
    ad_spend_score: Optional[float] = None


class BusinessScoreOut(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    score_date: date
    demand_score: Optional[float] = None
    monetization_score: Optional[float] = None
    competition_score: Optional[float] = None
    dev_difficulty_score: Optional[float] = None
    business_index: Optional[float] = None
    monetization_detail: Optional[MonetizationBreakdown] = None
    competition_detail: Optional[CompetitionBreakdown] = None
    model_version: str = "mvp-research-v1"


class ThemeBase(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    top_keywords: Optional[list[str]] = None
    post_count: int = 0
    comment_count_total: int = 0
    post_growth_rate: float = 0.0
    biz_models: Optional[list[str]] = None


class ThemeRankingItem(ThemeBase):
    id: int
    business_index: Optional[float] = None
    demand_score: Optional[float] = None
    monetization_score: Optional[float] = None
    competition_score: Optional[float] = None
    dev_difficulty_score: Optional[float] = None
    evidence_strength: Optional[float] = None
    japanese_market_fit: Optional[float] = None
    screening_status: str = "candidate"
    screening_reason: Optional[str] = None


class ThemeDetail(ThemeRankingItem):
    score: Optional[BusinessScoreOut] = None
    keywords_list: Optional[list[dict]] = None
    updated_at: Optional[datetime] = None
    opportunity: Optional[str] = None
    target_user: Optional[str] = None
    willingness_to_pay: Optional[str] = None
    first_cut_goal: Optional[str] = None
    recommended_project_name: Optional[str] = None
    automation_slug: Optional[str] = None
    mvp_scope: Optional[list[str]] = None
    risks: Optional[list[str]] = None
    evidence: Optional[list[str]] = None
    source_urls: Optional[list[str]] = None
    source_types: Optional[list[str]] = None
    collection_queries: Optional[list[str]] = None
    pass_reasons: Optional[list[str]] = None
    reject_reasons: Optional[list[str]] = None
    next_research_actions: Optional[list[str]] = None


class RankingResponse(BaseModel):
    data: list[ThemeRankingItem]
    meta: PaginationMeta
    score_date: date
    filters_applied: dict = Field(default_factory=dict)


class ThemeDetailResponse(BaseModel):
    data: ThemeDetail


class IngestRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=100)
    source: str = "manual"
    category_hint: Optional[str] = None


class IngestResponse(BaseModel):
    accepted: int
    message: str
    suggested_theme: Optional[ThemeRankingItem] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    database: str = "not_required_for_mvp"
    timestamp: datetime
