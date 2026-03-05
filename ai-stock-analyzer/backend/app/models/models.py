"""
SQLAlchemy ORM モデル定義

companies / financial_metrics / patents / research_papers / ai_scores テーブル
"""

from datetime import date, datetime
from typing import List, Optional

from sqlalchemy import (
    BigInteger, Boolean, Column, Date, DateTime, ForeignKey,
    Integer, Numeric, String, Text, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, VARCHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Company(Base):
    """企業マスターテーブル"""

    __tablename__ = "companies"

    id:          Mapped[int]            = mapped_column(Integer, primary_key=True)
    ticker:      Mapped[str]            = mapped_column(VARCHAR(10), unique=True, nullable=False, index=True)
    name:        Mapped[str]            = mapped_column(VARCHAR(255), nullable=False)
    sector:      Mapped[Optional[str]]  = mapped_column(VARCHAR(100))
    industry:    Mapped[Optional[str]]  = mapped_column(VARCHAR(100))
    market_cap:  Mapped[Optional[int]]  = mapped_column(BigInteger)           # USD
    exchange:    Mapped[Optional[str]]  = mapped_column(VARCHAR(10))          # NYSE/NASDAQ
    description: Mapped[Optional[str]]  = mapped_column(Text)
    sec_cik:     Mapped[Optional[str]]  = mapped_column(VARCHAR(20))          # SEC CIK コード
    is_active:   Mapped[bool]           = mapped_column(Boolean, default=True)
    created_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at:  Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーション
    financial_metrics: Mapped[List["FinancialMetric"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    patents:            Mapped[List["Patent"]]          = relationship(back_populates="company", cascade="all, delete-orphan")
    research_papers:    Mapped[List["ResearchPaper"]]   = relationship(back_populates="company")
    ai_scores:          Mapped[List["AIScore"]]         = relationship(back_populates="company", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Company(ticker={self.ticker}, name={self.name})>"


class FinancialMetric(Base):
    """財務指標テーブル（日次スナップショット）"""

    __tablename__ = "financial_metrics"
    __table_args__ = (UniqueConstraint("company_id", "date", name="uq_fm_company_date"),)

    id:               Mapped[int]            = mapped_column(Integer, primary_key=True)
    company_id:       Mapped[int]            = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    date:             Mapped[date]           = mapped_column(Date, nullable=False)
    # バリュエーション
    per:              Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    peg:              Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    ev_ebitda:        Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    pb_ratio:         Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    ps_ratio:         Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    # 成長性
    revenue_yoy:      Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    eps_growth_yoy:   Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    # 収益性
    gross_margin:     Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    operating_margin: Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    net_margin:       Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    fcf_margin:       Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    # R&D
    rd_expense:       Mapped[Optional[int]]   = mapped_column(BigInteger)
    revenue:          Mapped[Optional[int]]   = mapped_column(BigInteger)
    rd_ratio:         Mapped[Optional[float]] = mapped_column(Numeric(8, 4))
    created_at:       Mapped[datetime]        = mapped_column(DateTime(timezone=True), server_default=func.now())

    company: Mapped["Company"] = relationship(back_populates="financial_metrics")


class Patent(Base):
    """特許データテーブル"""

    __tablename__ = "patents"

    id:             Mapped[int]            = mapped_column(Integer, primary_key=True)
    company_id:     Mapped[int]            = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    patent_number:  Mapped[Optional[str]]  = mapped_column(VARCHAR(20), unique=True)
    title:          Mapped[Optional[str]]  = mapped_column(Text)
    abstract:       Mapped[Optional[str]]  = mapped_column(Text)
    cpc_codes:      Mapped[Optional[list]] = mapped_column(ARRAY(VARCHAR(50)))   # CPC分類コード配列
    filing_date:    Mapped[Optional[date]] = mapped_column(Date)
    grant_date:     Mapped[Optional[date]] = mapped_column(Date)
    citation_count: Mapped[int]            = mapped_column(Integer, default=0)
    ai_relevance:   Mapped[Optional[float]] = mapped_column(Numeric(5, 4))       # 0.0 - 1.0
    created_at:     Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now())

    company: Mapped["Company"] = relationship(back_populates="patents")


class ResearchPaper(Base):
    """研究論文テーブル（arXiv）"""

    __tablename__ = "research_papers"

    id:               Mapped[int]            = mapped_column(Integer, primary_key=True)
    company_id:       Mapped[Optional[int]]  = mapped_column(Integer, ForeignKey("companies.id"))
    arxiv_id:         Mapped[Optional[str]]  = mapped_column(VARCHAR(20), unique=True)
    title:            Mapped[str]            = mapped_column(Text, nullable=False)
    abstract:         Mapped[Optional[str]]  = mapped_column(Text)
    authors:          Mapped[Optional[dict]] = mapped_column(JSONB)              # [{name, affiliation}]
    categories:       Mapped[Optional[list]] = mapped_column(ARRAY(VARCHAR(50))) # cs.AI, cs.LG 等
    published_date:   Mapped[Optional[date]] = mapped_column(Date)
    citation_count:   Mapped[int]            = mapped_column(Integer, default=0)
    relevance_score:  Mapped[Optional[float]] = mapped_column(Numeric(5, 4))
    created_at:       Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now())

    company: Mapped[Optional["Company"]] = relationship(back_populates="research_papers")


class AIScore(Base):
    """AI総合スコアテーブル（日次スナップショット）"""

    __tablename__ = "ai_scores"
    __table_args__ = (UniqueConstraint("company_id", "score_date", name="uq_score_company_date"),)

    id:                   Mapped[int]            = mapped_column(Integer, primary_key=True)
    company_id:           Mapped[int]            = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    score_date:           Mapped[date]           = mapped_column(Date, nullable=False, server_default=func.current_date())
    # コンポーネントスコア (0-100)
    tech_score:           Mapped[Optional[float]] = mapped_column(Numeric(6, 2))
    growth_score:         Mapped[Optional[float]] = mapped_column(Numeric(6, 2))
    profitability_score:  Mapped[Optional[float]] = mapped_column(Numeric(6, 2))
    # 技術力サブスコア
    keyword_score:        Mapped[Optional[float]] = mapped_column(Numeric(6, 2))
    patent_score:         Mapped[Optional[float]] = mapped_column(Numeric(6, 2))
    rd_ratio_score:       Mapped[Optional[float]] = mapped_column(Numeric(6, 2))
    paper_score:          Mapped[Optional[float]] = mapped_column(Numeric(6, 2))
    # 総合スコア
    composite_score:      Mapped[Optional[float]] = mapped_column(Numeric(6, 2))
    valuation_score:      Mapped[Optional[float]] = mapped_column(Numeric(8, 4))  # 割安判定
    # バリュエーション参照値
    per_used:             Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    peg_used:             Mapped[Optional[float]] = mapped_column(Numeric(10, 2))
    model_version:        Mapped[str]             = mapped_column(VARCHAR(20), default="v1.0")
    created_at:           Mapped[datetime]        = mapped_column(DateTime(timezone=True), server_default=func.now())

    company: Mapped["Company"] = relationship(back_populates="ai_scores")
