"""
⑨ DB設計 — SQLAlchemy ORM モデル定義

テーブル:
  raw_posts        — 収集した投稿データ（個人情報なし）
  themes           — クラスタリングで抽出したテーマ
  business_scores  — テーマのスコア一式
  keywords         — テーマに関連するキーワード
  crawl_logs       — クロール履歴（robots.txt準拠記録）
"""
from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey,
    Integer, String, Text, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class RawPost(Base):
    """
    収集した投稿データ（プライバシー配慮設計）
    個人情報（投稿者名・ID・IP）は一切保存しない
    """
    __tablename__ = "raw_posts"

    id: Mapped[int]           = mapped_column(Integer, primary_key=True)
    source: Mapped[str]       = mapped_column(String(50), nullable=False, index=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(500))   # 参照用のみ
    category_hint: Mapped[Optional[str]] = mapped_column(String(100))
    title_summary: Mapped[Optional[str]] = mapped_column(String(200))  # 要約のみ保持
    keywords: Mapped[Optional[list]] = mapped_column(ARRAY(String(50)))  # 形態素解析済み
    comment_count: Mapped[int] = mapped_column(Integer, default=0)
    posted_at: Mapped[Optional[date]] = mapped_column(Date)
    processed: Mapped[bool]   = mapped_column(Boolean, default=False)
    theme_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("themes.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    theme: Mapped[Optional["Theme"]] = relationship(back_populates="raw_posts")


class Theme(Base):
    """テーマ（クラスタリングで集約した悩みグループ）"""
    __tablename__ = "themes"

    id: Mapped[int]            = mapped_column(Integer, primary_key=True)
    title: Mapped[str]         = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[str]      = mapped_column(String(100), nullable=False, index=True)
    top_keywords: Mapped[Optional[list]] = mapped_column(ARRAY(String(50)))
    post_count: Mapped[int]    = mapped_column(Integer, default=0)
    comment_count_total: Mapped[int] = mapped_column(Integer, default=0)
    post_growth_rate: Mapped[float] = mapped_column(Float, default=0.0)  # 前週比増加率
    is_active: Mapped[bool]    = mapped_column(Boolean, default=True)
    # 推定ビジネスモデル (SaaS/コンテンツ/アフィリエイト等)
    biz_models: Mapped[Optional[list]] = mapped_column(ARRAY(String(50)))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    raw_posts: Mapped[List["RawPost"]] = relationship(back_populates="theme")
    score:     Mapped[Optional["BusinessScore"]] = relationship(back_populates="theme", uselist=False)
    keywords_rel: Mapped[List["Keyword"]] = relationship(back_populates="theme", cascade="all, delete-orphan")


class BusinessScore(Base):
    """テーマの総合ビジネス指数スコア"""
    __tablename__ = "business_scores"
    __table_args__ = (UniqueConstraint("theme_id", name="uq_score_theme"),)

    id: Mapped[int]           = mapped_column(Integer, primary_key=True)
    theme_id: Mapped[int]     = mapped_column(Integer, ForeignKey("themes.id", ondelete="CASCADE"), nullable=False)
    score_date: Mapped[date]  = mapped_column(Date, nullable=False)

    # メインスコア (0-100)
    demand_score: Mapped[float]        = mapped_column(Float, default=0.0)
    monetization_score: Mapped[float]  = mapped_column(Float, default=0.0)
    competition_score: Mapped[float]   = mapped_column(Float, default=0.0)   # 高いほど競合強い
    dev_difficulty_score: Mapped[float] = mapped_column(Float, default=0.0)  # 高いほど難しい
    business_index: Mapped[float]      = mapped_column(Float, default=0.0, index=True)  # 総合

    # 収益化サブスコア
    money_word_score: Mapped[float]    = mapped_column(Float, default=0.0)
    urgency_score: Mapped[float]       = mapped_column(Float, default=0.0)
    purchase_intent_score: Mapped[float] = mapped_column(Float, default=0.0)
    severity_score: Mapped[float]      = mapped_column(Float, default=0.0)

    # 競合サブスコア
    search_volume_score: Mapped[float] = mapped_column(Float, default=0.0)
    app_exists_score: Mapped[float]    = mapped_column(Float, default=0.0)
    ad_spend_score: Mapped[float]      = mapped_column(Float, default=0.0)

    model_version: Mapped[str]         = mapped_column(String(20), default="v1.0")
    created_at: Mapped[datetime]       = mapped_column(DateTime(timezone=True), server_default=func.now())

    theme: Mapped["Theme"] = relationship(back_populates="score")


class Keyword(Base):
    """テーマ関連キーワード（TF-IDFスコア付き）"""
    __tablename__ = "keywords"

    id: Mapped[int]         = mapped_column(Integer, primary_key=True)
    theme_id: Mapped[int]   = mapped_column(Integer, ForeignKey("themes.id", ondelete="CASCADE"), nullable=False)
    word: Mapped[str]       = mapped_column(String(100), nullable=False)
    tfidf_score: Mapped[float] = mapped_column(Float, default=0.0)
    frequency: Mapped[int]  = mapped_column(Integer, default=1)
    is_monetization: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    theme: Mapped["Theme"] = relationship(back_populates="keywords_rel")


class CrawlLog(Base):
    """クロール履歴（robots.txt準拠記録・重複防止）"""
    __tablename__ = "crawl_logs"
    __table_args__ = (UniqueConstraint("url_hash", name="uq_crawl_url"),)

    id: Mapped[int]          = mapped_column(Integer, primary_key=True)
    source: Mapped[str]      = mapped_column(String(50), nullable=False)
    url_hash: Mapped[str]    = mapped_column(String(64), nullable=False)  # SHA256 of URL
    status_code: Mapped[int] = mapped_column(Integer)
    crawled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    robots_allowed: Mapped[bool] = mapped_column(Boolean, default=True)
