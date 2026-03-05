"""
SQLAlchemy ORMモデル — companies / financial_data / patent_data / scores
"""
from datetime import datetime, date
from typing import Optional, List
from sqlalchemy import (
    Integer, String, Float, BigInteger, Boolean,
    DateTime, Date, Text, ForeignKey, UniqueConstraint, Index,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Company(Base):
    """
    企業マスタテーブル。
    ティッカーシンボルを一意キーとして米国株企業情報を管理。
    """
    __tablename__ = "companies"

    id:              Mapped[int]           = mapped_column(Integer, primary_key=True, index=True)
    ticker:          Mapped[str]           = mapped_column(String(10), unique=True, nullable=False, index=True)
    name:            Mapped[str]           = mapped_column(String(255), nullable=False)
    sector:          Mapped[Optional[str]] = mapped_column(String(100))
    industry:        Mapped[Optional[str]] = mapped_column(String(100))
    description:     Mapped[Optional[str]] = mapped_column(Text)
    employee_count:  Mapped[Optional[int]] = mapped_column(Integer)
    founded_year:    Mapped[Optional[int]] = mapped_column(Integer)
    headquarters:    Mapped[Optional[str]] = mapped_column(String(255))
    website:         Mapped[Optional[str]] = mapped_column(String(255))
    is_active:       Mapped[bool]          = mapped_column(Boolean, default=True)
    created_at:      Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow)
    updated_at:      Mapped[datetime]      = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # リレーション
    financial_data:  Mapped[List["FinancialData"]] = relationship("FinancialData", back_populates="company")
    patent_data:     Mapped[List["PatentData"]]    = relationship("PatentData", back_populates="company")
    scores:          Mapped[List["Score"]]         = relationship("Score", back_populates="company")


class FinancialData(Base):
    """
    財務データテーブル。
    日次でyfinanceから取得・保存する財務指標を管理。
    """
    __tablename__ = "financial_data"
    __table_args__ = (
        UniqueConstraint("company_id", "date", name="uq_financial_company_date"),
        Index("idx_financial_company_date", "company_id", "date"),
    )

    id:             Mapped[int]            = mapped_column(Integer, primary_key=True)
    company_id:     Mapped[int]            = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"))
    date:           Mapped[date]           = mapped_column(Date, nullable=False)
    # バリュエーション指標
    per:            Mapped[Optional[float]] = mapped_column(Float)   # Price/Earnings
    peg:            Mapped[Optional[float]] = mapped_column(Float)   # Price/Earnings-to-Growth
    ev_ebitda:      Mapped[Optional[float]] = mapped_column(Float)   # EV/EBITDA
    pb_ratio:       Mapped[Optional[float]] = mapped_column(Float)   # Price/Book
    ps_ratio:       Mapped[Optional[float]] = mapped_column(Float)   # Price/Sales
    # 収益性
    revenue:        Mapped[Optional[int]]  = mapped_column(BigInteger)
    ebitda:         Mapped[Optional[int]]  = mapped_column(BigInteger)
    net_income:     Mapped[Optional[int]]  = mapped_column(BigInteger)
    gross_margin:   Mapped[Optional[float]] = mapped_column(Float)
    ebitda_margin:  Mapped[Optional[float]] = mapped_column(Float)
    roe:            Mapped[Optional[float]] = mapped_column(Float)
    # 成長性
    revenue_growth: Mapped[Optional[float]] = mapped_column(Float)
    eps_growth:     Mapped[Optional[float]] = mapped_column(Float)
    # 技術投資
    rnd_expense:    Mapped[Optional[int]]  = mapped_column(BigInteger)
    rnd_ratio:      Mapped[Optional[float]] = mapped_column(Float)
    # 株価
    market_cap:     Mapped[Optional[int]]  = mapped_column(BigInteger)
    current_price:  Mapped[Optional[float]] = mapped_column(Float)
    created_at:     Mapped[datetime]       = mapped_column(DateTime, default=datetime.utcnow)

    company: Mapped["Company"] = relationship("Company", back_populates="financial_data")


class PatentData(Base):
    """
    特許データテーブル。
    USPTO APIから取得したAI関連特許の解析結果を管理。
    """
    __tablename__ = "patent_data"
    __table_args__ = (
        UniqueConstraint("company_id", "analyzed_at", name="uq_patent_company_date"),
    )

    id:               Mapped[int]            = mapped_column(Integer, primary_key=True)
    company_id:       Mapped[int]            = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"))
    analyzed_at:      Mapped[date]           = mapped_column(Date, nullable=False)
    patent_count:     Mapped[int]            = mapped_column(Integer, default=0)
    ai_patent_count:  Mapped[int]            = mapped_column(Integer, default=0)
    patent_growth:    Mapped[Optional[float]] = mapped_column(Float)
    avg_relevance:    Mapped[Optional[float]] = mapped_column(Float)   # 0.0 - 1.0
    top_patent_title: Mapped[Optional[str]]  = mapped_column(String(500))
    raw_data:         Mapped[Optional[dict]] = mapped_column(JSONB)
    created_at:       Mapped[datetime]       = mapped_column(DateTime, default=datetime.utcnow)

    company: Mapped["Company"] = relationship("Company", back_populates="patent_data")


class Score(Base):
    """
    統合スコアテーブル。
    技術力・成長性・収益性スコアを統合し、割安判定スコアを保存。
    """
    __tablename__ = "scores"
    __table_args__ = (
        UniqueConstraint("company_id", "scored_at", name="uq_score_company_date"),
        Index("idx_scores_undervalue", "undervalue_score"),
        Index("idx_scores_date", "scored_at"),
    )

    id:                Mapped[int]            = mapped_column(Integer, primary_key=True)
    company_id:        Mapped[int]            = mapped_column(Integer, ForeignKey("companies.id", ondelete="CASCADE"))
    scored_at:         Mapped[date]           = mapped_column(Date, nullable=False)
    # 個別スコア (0-100)
    tech_score:        Mapped[float]          = mapped_column(Float, nullable=False)
    growth_score:      Mapped[float]          = mapped_column(Float, nullable=False)
    profit_score:      Mapped[float]          = mapped_column(Float, nullable=False)
    # 技術力サブスコア
    keyword_score:     Mapped[Optional[float]] = mapped_column(Float)
    patent_score:      Mapped[Optional[float]] = mapped_column(Float)
    rnd_score:         Mapped[Optional[float]] = mapped_column(Float)
    paper_score:       Mapped[Optional[float]] = mapped_column(Float)
    # 統合スコア
    ai_total_score:    Mapped[float]          = mapped_column(Float, nullable=False)
    undervalue_score:  Mapped[float]          = mapped_column(Float, nullable=False)
    rank_position:     Mapped[Optional[int]]  = mapped_column(Integer)
    created_at:        Mapped[datetime]       = mapped_column(DateTime, default=datetime.utcnow)

    company: Mapped["Company"] = relationship("Company", back_populates="scores")
