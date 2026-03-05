"""
⑪ 財務データ取得サービス

yfinance ライブラリを使って Yahoo Finance から財務データを取得し、
PostgreSQL に保存する。

対象データ:
    - PER / PEG / EV/EBITDA / P/B / P/S
    - 売上高成長率 / EPS成長率
    - 粗利率 / 営業利益率 / 純利益率 / FCFマージン
    - R&D費用 / R&D比率
"""

import asyncio
from datetime import date, datetime
from typing import Any, Dict, Optional

import structlog
import yfinance as yf
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Company, FinancialMetric

logger = structlog.get_logger()

# ── AI関連企業の初期ウォッチリスト ────────────────────────────────
AI_WATCHLIST: list[str] = [
    # Semiconductor / AI Hardware
    "NVDA", "AMD", "INTC", "QCOM", "AVGO", "TSM", "AMAT", "KLAC",
    # Hyperscalers / Cloud AI
    "MSFT", "GOOGL", "AMZN", "META", "AAPL",
    # Pure AI / ML
    "AI",   # C3.ai
    "PLTR", # Palantir
    "SNOW", # Snowflake
    "DDOG", # Datadog
    "MDB",  # MongoDB
    # AI Software
    "CRM",  # Salesforce
    "NOW",  # ServiceNow
    "VEEV", # Veeva
    "HUBS", # HubSpot
    # AI Healthcare
    "ISRG", "ILMN",
    # Robotics / Autonomous
    "TSLA",
]


class FinancialDataFetcher:
    """
    Yahoo Finance から財務データを取得して DB に保存するサービス。

    Attributes:
        db: 非同期 SQLAlchemy セッション
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def fetch_and_save(self, ticker: str) -> Optional[FinancialMetric]:
        """
        指定ティッカーの財務データを取得して保存する。

        Args:
            ticker: 対象企業のティッカーシンボル

        Returns:
            保存した FinancialMetric オブジェクト、または None（取得失敗時）
        """
        logger.info("Fetching financial data", ticker=ticker)

        # yfinance は同期なので asyncio.to_thread で実行
        try:
            raw_data = await asyncio.to_thread(self._fetch_yfinance, ticker)
        except Exception as e:
            logger.error("yfinance fetch failed", ticker=ticker, error=str(e))
            return None

        if raw_data is None:
            return None

        # Company が存在しなければ新規作成
        company = await self._upsert_company(ticker, raw_data)

        # FinancialMetric を今日付けで upsert
        metric = await self._upsert_metric(company.id, raw_data)
        return metric

    async def fetch_all_watchlist(self) -> None:
        """ウォッチリスト全企業の財務データを順次取得・保存する"""
        logger.info("Starting watchlist financial data fetch", count=len(AI_WATCHLIST))
        for ticker in AI_WATCHLIST:
            await self.fetch_and_save(ticker)
            # Yahoo Finance のレート制限対策 (0.5秒待機)
            await asyncio.sleep(0.5)
        logger.info("Watchlist fetch completed")

    # ── プライベートメソッド ────────────────────────────────────────

    def _fetch_yfinance(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        yfinance から生データを取得して辞書形式で返す（同期処理）。

        Returns:
            財務データ辞書、またはNone
        """
        stock = yf.Ticker(ticker)
        info = stock.info

        if not info or info.get("regularMarketPrice") is None:
            logger.warning("No data from yfinance", ticker=ticker)
            return None

        # 財務諸表から追加データ取得
        income_stmt = stock.income_stmt     # 損益計算書
        balance_sheet = stock.balance_sheet  # 貸借対照表
        cash_flow = stock.cashflow           # キャッシュフロー計算書

        # R&D費用の取得（最新年度）
        rd_expense: Optional[int] = None
        if income_stmt is not None and not income_stmt.empty:
            if "Research And Development" in income_stmt.index:
                rd_vals = income_stmt.loc["Research And Development"]
                rd_expense = int(rd_vals.iloc[0]) if not rd_vals.empty else None

        # フリーキャッシュフロー取得
        fcf: Optional[int] = None
        if cash_flow is not None and not cash_flow.empty:
            if "Free Cash Flow" in cash_flow.index:
                fcf_vals = cash_flow.loc["Free Cash Flow"]
                fcf = int(fcf_vals.iloc[0]) if not fcf_vals.empty else None

        total_revenue = info.get("totalRevenue")

        return {
            # 企業情報
            "name": info.get("longName", ticker),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "market_cap": info.get("marketCap"),
            "exchange": info.get("exchange"),
            "description": info.get("longBusinessSummary"),
            # バリュエーション
            "per": self._safe_float(info.get("trailingPE")),
            "peg": self._safe_float(info.get("pegRatio")),
            "ev_ebitda": self._safe_float(info.get("enterpriseToEbitda")),
            "pb_ratio": self._safe_float(info.get("priceToBook")),
            "ps_ratio": self._safe_float(info.get("priceToSalesTrailing12Months")),
            # 成長性
            "revenue_yoy": self._safe_float(info.get("revenueGrowth")),
            "eps_growth_yoy": self._safe_float(info.get("earningsGrowth")),
            # 収益性
            "gross_margin": self._safe_float(info.get("grossMargins")),
            "operating_margin": self._safe_float(info.get("operatingMargins")),
            "net_margin": self._safe_float(info.get("profitMargins")),
            # FCF
            "fcf": fcf,
            "revenue": total_revenue,
            "fcf_margin": (fcf / total_revenue) if (fcf and total_revenue) else None,
            # R&D
            "rd_expense": rd_expense,
            "rd_ratio": (rd_expense / total_revenue) if (rd_expense and total_revenue) else None,
        }

    async def _upsert_company(self, ticker: str, data: Dict[str, Any]) -> Company:
        """
        Company レコードを upsert する。

        Args:
            ticker: ティッカーシンボル
            data: yfinance から取得した生データ辞書

        Returns:
            Company ORM オブジェクト
        """
        stmt = select(Company).where(Company.ticker == ticker)
        result = await self.db.execute(stmt)
        company = result.scalar_one_or_none()

        if company is None:
            company = Company(
                ticker=ticker,
                name=data.get("name", ticker),
                sector=data.get("sector"),
                industry=data.get("industry"),
                market_cap=data.get("market_cap"),
                exchange=data.get("exchange"),
                description=data.get("description"),
            )
            self.db.add(company)
            await self.db.flush()  # ID を取得するためにflush
            logger.info("New company created", ticker=ticker)
        else:
            # 基本情報を更新
            company.name = data.get("name", company.name)
            company.sector = data.get("sector", company.sector)
            company.industry = data.get("industry", company.industry)
            company.market_cap = data.get("market_cap", company.market_cap)

        return company

    async def _upsert_metric(
        self, company_id: int, data: Dict[str, Any]
    ) -> FinancialMetric:
        """
        本日付けの FinancialMetric を upsert する。

        Args:
            company_id: Company.id
            data: 財務データ辞書

        Returns:
            保存した FinancialMetric オブジェクト
        """
        today = date.today()
        stmt = select(FinancialMetric).where(
            FinancialMetric.company_id == company_id,
            FinancialMetric.date == today,
        )
        result = await self.db.execute(stmt)
        metric = result.scalar_one_or_none()

        metric_data = {
            "company_id": company_id,
            "date": today,
            "per": data.get("per"),
            "peg": data.get("peg"),
            "ev_ebitda": data.get("ev_ebitda"),
            "pb_ratio": data.get("pb_ratio"),
            "ps_ratio": data.get("ps_ratio"),
            "revenue_yoy": data.get("revenue_yoy"),
            "eps_growth_yoy": data.get("eps_growth_yoy"),
            "gross_margin": data.get("gross_margin"),
            "operating_margin": data.get("operating_margin"),
            "net_margin": data.get("net_margin"),
            "fcf_margin": data.get("fcf_margin"),
            "rd_expense": data.get("rd_expense"),
            "revenue": data.get("revenue"),
            "rd_ratio": data.get("rd_ratio"),
        }

        if metric is None:
            metric = FinancialMetric(**metric_data)
            self.db.add(metric)
        else:
            for key, value in metric_data.items():
                if key not in ("company_id", "date"):
                    setattr(metric, key, value)

        return metric

    @staticmethod
    def _safe_float(value: Any) -> Optional[float]:
        """None・inf・NaN を考慮して安全にfloatへ変換する"""
        if value is None:
            return None
        try:
            f = float(value)
            if f != f:   # NaN チェック
                return None
            if abs(f) == float("inf"):
                return None
            return f
        except (TypeError, ValueError):
            return None
