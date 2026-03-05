"""
⑪ 財務データ取得処理
yfinance を使って米国株の財務指標を取得・解析する。
"""
from __future__ import annotations

import logging
from datetime import date
from typing import Optional

import yfinance as yf

logger = logging.getLogger(__name__)


class FinancialDataDTO:
    """
    財務データの中間転送オブジェクト。
    yfinanceから取得した生データを構造化して保持する。
    """

    def __init__(self) -> None:
        self.ticker: str = ""
        self.name: str = ""
        self.sector: Optional[str] = None
        self.industry: Optional[str] = None
        self.description: Optional[str] = None
        self.employee_count: Optional[int] = None
        self.headquarters: Optional[str] = None
        self.website: Optional[str] = None
        # バリュエーション
        self.per: Optional[float] = None
        self.peg: Optional[float] = None
        self.ev_ebitda: Optional[float] = None
        self.pb_ratio: Optional[float] = None
        self.ps_ratio: Optional[float] = None
        # 収益性
        self.revenue: Optional[int] = None
        self.ebitda: Optional[int] = None
        self.net_income: Optional[int] = None
        self.gross_margin: Optional[float] = None
        self.ebitda_margin: Optional[float] = None
        self.roe: Optional[float] = None
        # 成長性
        self.revenue_growth: Optional[float] = None
        self.eps_growth: Optional[float] = None
        # 技術投資
        self.rnd_expense: Optional[int] = None
        self.rnd_ratio: Optional[float] = None
        # 株価
        self.market_cap: Optional[int] = None
        self.current_price: Optional[float] = None
        self.fetch_date: date = date.today()


class FinancialDataCollector:
    """
    yfinanceを使って米国株の財務データを取得するコレクター。

    Example:
        collector = FinancialDataCollector()
        dto = collector.fetch("NVDA")
        print(dto.per, dto.revenue_growth)
    """

    # AI関連キーワード（決算書テキスト解析用）
    AI_KEYWORDS: list[str] = [
        "artificial intelligence", "machine learning", "deep learning",
        "neural network", "large language model", "generative AI",
        "natural language processing", "computer vision", "autonomous",
        "reinforcement learning", "transformer", "GPU", "inference",
        "foundation model", "LLM", "AI chip", "data center AI",
    ]

    def fetch(self, ticker: str) -> Optional[FinancialDataDTO]:
        """
        指定ティッカーの財務データを取得してDTOを返す。

        Args:
            ticker: 米国株ティッカーシンボル（例: "NVDA"）

        Returns:
            FinancialDataDTO | None: 取得成功時はDTO、失敗時はNone
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info

            if not info or "symbol" not in info:
                logger.warning(f"No data returned for ticker: {ticker}")
                return None

            dto = FinancialDataDTO()
            dto.ticker = ticker

            # ── 企業情報 ──────────────────────────────
            dto.name = info.get("longName") or info.get("shortName") or ticker
            dto.sector = info.get("sector")
            dto.industry = info.get("industry")
            dto.description = info.get("longBusinessSummary")
            dto.employee_count = info.get("fullTimeEmployees")
            dto.headquarters = self._build_headquarters(info)
            dto.website = info.get("website")

            # ── バリュエーション ──────────────────────
            dto.per = self._safe_float(info.get("trailingPE"))
            dto.peg = self._safe_float(info.get("pegRatio"))
            dto.ev_ebitda = self._safe_float(info.get("enterpriseToEbitda"))
            dto.pb_ratio = self._safe_float(info.get("priceToBook"))
            dto.ps_ratio = self._safe_float(info.get("priceToSalesTrailing12Months"))

            # ── 収益性 ───────────────────────────────
            dto.revenue = self._safe_int(info.get("totalRevenue"))
            dto.ebitda = self._safe_int(info.get("ebitda"))
            dto.net_income = self._safe_int(info.get("netIncomeToCommon"))
            dto.gross_margin = self._safe_float(info.get("grossMargins"))
            dto.ebitda_margin = self._safe_float(info.get("ebitdaMargins"))
            dto.roe = self._safe_float(info.get("returnOnEquity"))

            # ── 成長性 ───────────────────────────────
            dto.revenue_growth = self._safe_float(info.get("revenueGrowth"))
            dto.eps_growth = self._safe_float(
                info.get("earningsGrowth") or info.get("earningsQuarterlyGrowth")
            )

            # ── 技術投資 R&D ─────────────────────────
            rnd = self._get_rnd_from_cashflow(stock)
            dto.rnd_expense = rnd
            if dto.revenue and rnd:
                dto.rnd_ratio = rnd / dto.revenue
            else:
                dto.rnd_ratio = None

            # ── 株価 ─────────────────────────────────
            dto.market_cap = self._safe_int(info.get("marketCap"))
            dto.current_price = self._safe_float(
                info.get("currentPrice") or info.get("regularMarketPrice")
            )

            logger.info(f"✅ Fetched financial data for {ticker}: PER={dto.per}, Growth={dto.revenue_growth}")
            return dto

        except Exception as e:
            logger.error(f"❌ Failed to fetch data for {ticker}: {e}")
            return None

    def count_ai_keywords(self, text: str) -> int:
        """
        テキスト中のAI関連キーワード出現回数を数える。

        Args:
            text: 検索対象テキスト（決算書・IR資料など）

        Returns:
            int: キーワード総出現回数
        """
        if not text:
            return 0
        text_lower = text.lower()
        return sum(text_lower.count(kw) for kw in self.AI_KEYWORDS)

    def calc_keyword_score(self, ticker: str) -> float:
        """
        企業説明文からAIキーワードスコアを計算する（0-100）。

        Args:
            ticker: ティッカーシンボル

        Returns:
            float: AIキーワードスコア（0-100）
        """
        try:
            stock = yf.Ticker(ticker)
            info = stock.info
            description = info.get("longBusinessSummary", "")
            count = self.count_ai_keywords(description)
            # 最大20回出現を100点として正規化
            score = min(count / 20.0 * 100, 100.0)
            return round(score, 2)
        except Exception as e:
            logger.error(f"Keyword score calc failed for {ticker}: {e}")
            return 0.0

    # ─── プライベートヘルパーメソッド ────────────────

    @staticmethod
    def _safe_float(value: object) -> Optional[float]:
        """Noneや非数値をNoneに変換"""
        if value is None:
            return None
        try:
            f = float(value)
            return f if not (f != f) else None  # NaN check
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _safe_int(value: object) -> Optional[int]:
        """Noneや非整数をNoneに変換"""
        if value is None:
            return None
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _build_headquarters(info: dict) -> Optional[str]:
        """本社所在地を結合して返す"""
        parts = [
            info.get("city"),
            info.get("state"),
            info.get("country"),
        ]
        filtered = [p for p in parts if p]
        return ", ".join(filtered) if filtered else None

    @staticmethod
    def _get_rnd_from_cashflow(stock: yf.Ticker) -> Optional[int]:
        """
        キャッシュフロー計算書からR&D費用を取得する。
        yfinanceの構造が変更された場合に備えて複数のキーを試みる。
        """
        try:
            # 損益計算書からR&D費を取得
            income_stmt = stock.income_stmt
            if income_stmt is not None and not income_stmt.empty:
                for key in ["Research And Development", "ResearchAndDevelopment"]:
                    if key in income_stmt.index:
                        val = income_stmt.loc[key].iloc[0]
                        if val and str(val) != "nan":
                            return int(float(val))
        except Exception:
            pass
        return None


# ── 分析対象AI関連銘柄リスト ────────────────────────────────
AI_TICKER_UNIVERSE: list[str] = [
    # AI半導体・インフラ
    "NVDA", "AMD", "INTC", "QCOM", "AVGO", "AMAT", "KLAC", "LRCX",
    # クラウド・AI Platform
    "MSFT", "GOOGL", "AMZN", "META", "ORCL", "CRM", "NOW",
    # AI特化企業
    "PLTR", "AI", "BBAI", "SOUN", "CGNX", "PATH",
    # 半導体設計
    "ARM", "MRVL", "XLNX",
    # データ・分析
    "SNOW", "DDOG", "MDB", "ESTC",
]
