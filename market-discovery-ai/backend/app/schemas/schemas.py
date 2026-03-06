"""
⑩ API設計 — Pydantic スキーマ定義

リクエスト/レスポンスの型定義 + バリデーション
"""
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ── 共通 ──────────────────────────────────────────────────────────
class PaginationMeta(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int


# ── 収益化サブスコア ───────────────────────────────────────────────
class MonetizationBreakdown(BaseModel):
    """収益化可能性の内訳"""
    money_word_score:    Optional[float] = Field(None, description="お金ワードスコア (0-100)")
    urgency_score:       Optional[float] = Field(None, description="緊急度スコア (0-100)")
    purchase_intent_score: Optional[float] = Field(None, description="課金意欲スコア (0-100)")
    severity_score:      Optional[float] = Field(None, description="問題深刻度スコア (0-100)")


# ── 競合サブスコア ────────────────────────────────────────────────
class CompetitionBreakdown(BaseModel):
    """競合強度の内訳"""
    search_volume_score: Optional[float] = Field(None, description="検索量スコア (0-100)")
    app_exists_score:    Optional[float] = Field(None, description="既存アプリスコア (0-100)")
    ad_spend_score:      Optional[float] = Field(None, description="広告出稿スコア (0-100)")


# ── ビジネススコア ────────────────────────────────────────────────
class BusinessScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    score_date: date
    demand_score:        Optional[float] = Field(None, description="需要スコア (0-100)")
    monetization_score:  Optional[float] = Field(None, description="収益化可能性 (0-100)")
    competition_score:   Optional[float] = Field(None, description="競合強度 (0-100, 低いほど良)")
    dev_difficulty_score: Optional[float] = Field(None, description="開発難易度 (0-100, 低いほど良)")
    business_index:      Optional[float] = Field(None, description="総合ビジネス指数 (0-100)")
    monetization_detail: Optional[MonetizationBreakdown] = None
    competition_detail:  Optional[CompetitionBreakdown] = None
    model_version: str = "v1.0"


# ── テーマ ──────────────────────────────────────────────────────────
class ThemeBase(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    top_keywords: Optional[List[str]] = None
    post_count: int = 0
    comment_count_total: int = 0
    post_growth_rate: float = 0.0
    biz_models: Optional[List[str]] = None


class ThemeRankingItem(ThemeBase):
    """ランキング一覧用（軽量）"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_index: Optional[float] = None
    demand_score: Optional[float] = None
    monetization_score: Optional[float] = None
    competition_score: Optional[float] = None
    dev_difficulty_score: Optional[float] = None

    @property
    def competition_label(self) -> str:
        """競合強度ラベル"""
        s = self.competition_score
        if s is None: return "unknown"
        if s <= 25: return "very_low"
        if s <= 50: return "low"
        if s <= 75: return "medium"
        return "high"


class ThemeDetail(ThemeBase):
    """テーマ詳細"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    score: Optional[BusinessScoreOut] = None
    keywords_list: Optional[List[dict]] = None  # [{word, tfidf_score, is_monetization}]
    updated_at: Optional[datetime] = None


# ── レスポンスラッパー ────────────────────────────────────────────
class RankingResponse(BaseModel):
    data: List[ThemeRankingItem]
    meta: PaginationMeta
    score_date: date
    filters_applied: dict = {}


class ThemeDetailResponse(BaseModel):
    data: ThemeDetail


class IngestRequest(BaseModel):
    """手動テキストインポート用リクエスト"""
    texts: List[str] = Field(..., min_length=1, max_length=500, description="投稿テキストのリスト")
    source: str = Field(default="manual", description="データソース識別子")
    category_hint: Optional[str] = None


class IngestResponse(BaseModel):
    accepted: int
    message: str
    task_id: Optional[str] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    database: str
    timestamp: datetime
