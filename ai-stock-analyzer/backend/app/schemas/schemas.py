"""
⑥ API設計 / Pydantic スキーマ定義

リクエスト・レスポンスの型定義。FastAPI のバリデーションと Swagger UI 生成に使用。
"""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ── 共通 ─────────────────────────────────────────────────────────

class PaginationMeta(BaseModel):
    """ページネーションメタデータ"""
    total: int
    page: int
    per_page: int
    total_pages: int


# ── 財務指標 ──────────────────────────────────────────────────────

class FinancialMetricOut(BaseModel):
    """財務指標レスポンス"""
    model_config = ConfigDict(from_attributes=True)

    date: date
    per: Optional[float] = Field(None, description="株価収益率 (Price/Earnings)")
    peg: Optional[float] = Field(None, description="PEGレシオ")
    ev_ebitda: Optional[float] = Field(None, description="EV/EBITDA")
    pb_ratio: Optional[float] = Field(None, description="株価純資産倍率")
    ps_ratio: Optional[float] = Field(None, description="株価売上高倍率")
    revenue_yoy: Optional[float] = Field(None, description="売上高前年比成長率")
    eps_growth_yoy: Optional[float] = Field(None, description="EPS前年比成長率")
    gross_margin: Optional[float] = Field(None, description="売上総利益率")
    operating_margin: Optional[float] = Field(None, description="営業利益率")
    net_margin: Optional[float] = Field(None, description="純利益率")
    fcf_margin: Optional[float] = Field(None, description="FCFマージン")
    rd_ratio: Optional[float] = Field(None, description="R&D費/売上高比率")


# ── AIスコア ──────────────────────────────────────────────────────

class ScoreBreakdown(BaseModel):
    """スコア内訳（技術力サブスコア詳細）"""
    keyword_score: Optional[float] = Field(None, description="AI関連キーワードスコア (0-100)")
    patent_score: Optional[float] = Field(None, description="特許スコア (0-100)")
    rd_ratio_score: Optional[float] = Field(None, description="R&D投資スコア (0-100)")
    paper_score: Optional[float] = Field(None, description="研究論文関連性スコア (0-100)")


class AIScoreOut(BaseModel):
    """AIスコアレスポンス"""
    model_config = ConfigDict(from_attributes=True)

    score_date: date
    # コンポーネントスコア
    tech_score: Optional[float] = Field(None, description="技術力スコア (0-100, 重み: 40%)")
    growth_score: Optional[float] = Field(None, description="成長性スコア (0-100, 重み: 30%)")
    profitability_score: Optional[float] = Field(None, description="収益性スコア (0-100, 重み: 30%)")
    # 総合スコア
    composite_score: Optional[float] = Field(None, description="AI総合スコア (0-100)")
    valuation_score: Optional[float] = Field(None, description="割安判定スコア（高いほど割安）")
    # 参照値
    per_used: Optional[float] = Field(None, description="スコア算出時のPER")
    peg_used: Optional[float] = Field(None, description="スコア算出時のPEG")
    # 内訳
    breakdown: Optional[ScoreBreakdown] = None
    model_version: str = "v1.0"


# ── 企業 ──────────────────────────────────────────────────────────

class CompanyBase(BaseModel):
    """企業基本情報"""
    ticker: str = Field(..., description="ティッカーシンボル (例: NVDA)")
    name: str = Field(..., description="企業名")
    sector: Optional[str] = Field(None, description="セクター")
    industry: Optional[str] = Field(None, description="業種")
    market_cap: Optional[int] = Field(None, description="時価総額 (USD)")
    exchange: Optional[str] = Field(None, description="上場市場")


class CompanyRankingItem(CompanyBase):
    """ランキング一覧用の企業情報（軽量）"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    composite_score: Optional[float] = Field(None, description="AI総合スコア")
    valuation_score: Optional[float] = Field(None, description="割安判定スコア")
    tech_score: Optional[float] = None
    growth_score: Optional[float] = None
    profitability_score: Optional[float] = None
    per: Optional[float] = None
    peg: Optional[float] = None

    # 割安度判定 (computed)
    @property
    def valuation_label(self) -> str:
        """割安度ラベルを返す"""
        if self.valuation_score is None:
            return "unknown"
        if self.valuation_score >= 5.0:
            return "very_cheap"
        elif self.valuation_score >= 2.5:
            return "cheap"
        elif self.valuation_score >= 1.0:
            return "fair"
        else:
            return "expensive"


class CompanyDetail(CompanyBase):
    """企業詳細情報"""
    model_config = ConfigDict(from_attributes=True)

    id: int
    description: Optional[str] = None
    # 最新スコア
    latest_score: Optional[AIScoreOut] = None
    # 最新財務指標
    latest_financials: Optional[FinancialMetricOut] = None
    # 特許サマリー
    patent_count: int = 0
    ai_patent_count: int = 0
    # 論文サマリー
    paper_count: int = 0
    updated_at: Optional[datetime] = None


# ── レスポンスラッパー ────────────────────────────────────────────

class RankingResponse(BaseModel):
    """ランキングAPIレスポンス"""
    data: List[CompanyRankingItem]
    meta: PaginationMeta
    score_date: date


class CompanyDetailResponse(BaseModel):
    """企業詳細APIレスポンス"""
    data: CompanyDetail


class AnalyzeResponse(BaseModel):
    """再解析APIレスポンス"""
    ticker: str
    status: str  # "started" | "completed" | "failed"
    message: str
    task_id: Optional[str] = None


class HealthResponse(BaseModel):
    """ヘルスチェックレスポンス"""
    status: str = "ok"
    version: str
    database: str = "connected"
    timestamp: datetime
