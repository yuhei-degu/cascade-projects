"""
⑤⑫ スコア算出エンジン（割安判定アルゴリズム実装）

AI総合スコアと割安判定スコアを計算して DB に保存する。

スコア設計:
    AI総合スコア  = 0.4 × tech_score + 0.3 × growth_score + 0.3 × profitability_score
    割安判定スコア = AI総合スコア / (norm_PER × norm_PEG)

各サブスコアは 0-100 に正規化される。
"""

import math
from datetime import date
from typing import Optional

import structlog
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import AIScore, Company, FinancialMetric, Patent, ResearchPaper
from app.services.nlp.patent_analyzer import PatentAnalyzer, SECFilingAnalyzer

logger = structlog.get_logger()


class CompositeScoringService:
    """
    企業の AI 総合スコアと割安判定スコアを算出して DB に保存するサービス。

    Attributes:
        db: 非同期 SQLAlchemy セッション
        patent_analyzer: 特許NLPアナライザー
        sec_analyzer: SEC ファイリングアナライザー
    """

    # ── スコア重み定数 ────────────────────────────────────────────────
    TECH_WEIGHT        = 0.4
    GROWTH_WEIGHT      = 0.3
    PROFITABILITY_WEIGHT = 0.3

    # 技術力スコアの内訳重み
    KEYWORD_W   = 0.30
    PATENT_W    = 0.30
    RD_RATIO_W  = 0.20
    PAPER_W     = 0.20

    # 成長性スコアの内訳重み
    REV_GROWTH_W = 0.50
    EPS_GROWTH_W = 0.30
    MARKET_EXP_W = 0.20  # 現時点では固定値 0.5（市場拡大率データ未取得）

    # 収益性スコアの内訳重み
    GROSS_M_W     = 0.40
    OPERATING_M_W = 0.30
    FCF_M_W       = 0.30

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.patent_analyzer = PatentAnalyzer()
        self.sec_analyzer = SECFilingAnalyzer()

    async def compute_and_save(self, ticker: str) -> Optional[AIScore]:
        """
        指定ティッカーの企業スコアを計算して DB に保存する。

        Args:
            ticker: 対象企業のティッカーシンボル

        Returns:
            保存した AIScore オブジェクト、または None
        """
        # 企業取得
        stmt = select(Company).where(Company.ticker == ticker.upper())
        result = await self.db.execute(stmt)
        company = result.scalar_one_or_none()
        if company is None:
            logger.warning("Company not found for scoring", ticker=ticker)
            return None

        # 最新財務指標取得
        fin_stmt = (
            select(FinancialMetric)
            .where(FinancialMetric.company_id == company.id)
            .order_by(desc(FinancialMetric.date))
            .limit(1)
        )
        fin_result = await self.db.execute(fin_stmt)
        fin = fin_result.scalar_one_or_none()

        if fin is None:
            logger.warning("No financial data for scoring", ticker=ticker)
            return None

        # 特許データ集計
        patent_stats = await self._get_patent_stats(company.id)

        # === スコア算出 ===

        # ① 技術力スコア (0-100)
        keyword_score   = self._compute_keyword_score(company.description or "")
        patent_score    = self._compute_patent_score(
            total_patents=patent_stats["total"],
            ai_patents=patent_stats["ai_related"],
            avg_citations=patent_stats["avg_citations"],
        )
        rd_ratio_score  = self._compute_rd_ratio_score(fin.rd_ratio)
        paper_score     = await self._compute_paper_score(company.id)

        tech_score = (
            self.KEYWORD_W  * keyword_score
            + self.PATENT_W * patent_score
            + self.RD_RATIO_W * rd_ratio_score
            + self.PAPER_W  * paper_score
        )

        # ② 成長性スコア (0-100)
        growth_score = self._compute_growth_score(
            revenue_yoy=fin.revenue_yoy,
            eps_growth=fin.eps_growth_yoy,
        )

        # ③ 収益性スコア (0-100)
        profitability_score = self._compute_profitability_score(
            gross_margin=fin.gross_margin,
            operating_margin=fin.operating_margin,
            fcf_margin=fin.fcf_margin,
        )

        # ④ AI総合スコア
        composite_score = (
            self.TECH_WEIGHT         * tech_score
            + self.GROWTH_WEIGHT     * growth_score
            + self.PROFITABILITY_WEIGHT * profitability_score
        )

        # ⑤ 割安判定スコア
        valuation_score = self._compute_valuation_score(
            composite_score=composite_score,
            per=fin.per,
            peg=fin.peg,
        )

        logger.info(
            "Score computed",
            ticker=ticker,
            composite=round(composite_score, 2),
            valuation=round(valuation_score, 4),
            tech=round(tech_score, 2),
            growth=round(growth_score, 2),
            profit=round(profitability_score, 2),
        )

        # DB 保存（upsert）
        ai_score = await self._upsert_score(
            company_id=company.id,
            tech_score=tech_score,
            growth_score=growth_score,
            profitability_score=profitability_score,
            keyword_score=keyword_score,
            patent_score=patent_score,
            rd_ratio_score=rd_ratio_score,
            paper_score=paper_score,
            composite_score=composite_score,
            valuation_score=valuation_score,
            per_used=fin.per,
            peg_used=fin.peg,
        )
        return ai_score

    async def compute_all_companies(self) -> None:
        """DB 上のアクティブ企業全社のスコアを再計算する"""
        stmt = select(Company).where(Company.is_active == True)
        result = await self.db.execute(stmt)
        companies = result.scalars().all()

        logger.info("Computing scores for all companies", count=len(companies))
        for company in companies:
            await self.compute_and_save(company.ticker)

        logger.info("All company scores computed")

    # ── スコア計算メソッド ───────────────────────────────────────────

    def _compute_keyword_score(self, text: str) -> float:
        """
        会社説明文・SEC ファイリングのAIキーワード密度スコア (0-100)。

        Args:
            text: 解析対象テキスト

        Returns:
            キーワードスコア (0-100)
        """
        return self.sec_analyzer.analyze_keyword_density(text)

    def _compute_patent_score(
        self,
        total_patents: int,
        ai_patents: int,
        avg_citations: float,
    ) -> float:
        """
        特許スコアを算出する (0-100)。

        算出式:
            ai_ratio     = ai_patents / max(total_patents, 1)
            volume_score = min(100, log(1 + total_patents) / log(101) × 100)
            citation_s   = min(100, log(1 + avg_citations) / log(51) × 100)
            patent_score = 0.5 × (ai_ratio × 100) + 0.3 × volume_score + 0.2 × citation_s

        Args:
            total_patents: 全特許件数
            ai_patents: AI関連特許件数
            avg_citations: 平均被引用数

        Returns:
            特許スコア (0-100)
        """
        ai_ratio_score = (ai_patents / max(total_patents, 1)) * 100
        volume_score   = min(100.0, math.log1p(total_patents) / math.log1p(100) * 100)
        citation_score = min(100.0, math.log1p(avg_citations) / math.log1p(50) * 100)

        return 0.5 * ai_ratio_score + 0.3 * volume_score + 0.2 * citation_score

    def _compute_rd_ratio_score(self, rd_ratio: Optional[float]) -> float:
        """
        R&D費/売上高比率からスコアを算出する (0-100)。

        業界ベンチマーク:
            > 30%: 100点（Alphabet/Meta レベル）
            15-30%: 80点
            10-15%: 60点
            5-10%: 40点
            < 5%:  比例計算

        Args:
            rd_ratio: R&D比率（0.0 ~ 1.0）

        Returns:
            R&Dスコア (0-100)
        """
        if rd_ratio is None:
            return 0.0

        r = rd_ratio  # 0.0 ~ 1.0 の小数
        if r >= 0.30:
            return 100.0
        elif r >= 0.15:
            return 80.0 + (r - 0.15) / 0.15 * 20.0
        elif r >= 0.10:
            return 60.0 + (r - 0.10) / 0.05 * 20.0
        elif r >= 0.05:
            return 40.0 + (r - 0.05) / 0.05 * 20.0
        else:
            return max(0.0, r / 0.05 * 40.0)

    async def _compute_paper_score(self, company_id: int) -> float:
        """
        arXiv 論文関連性スコアを集計して返す (0-100)。

        Args:
            company_id: 対象企業の ID

        Returns:
            論文スコア (0-100)
        """
        stmt = select(func.avg(ResearchPaper.relevance_score)).where(
            ResearchPaper.company_id == company_id
        )
        result = await self.db.execute(stmt)
        avg_relevance = result.scalar_one_or_none()

        if avg_relevance is None:
            return 0.0
        return float(avg_relevance) * 100  # 0-1 → 0-100

    def _compute_growth_score(
        self,
        revenue_yoy: Optional[float],
        eps_growth: Optional[float],
        market_expansion: float = 0.5,  # 市場拡大率スコア（デフォルト中立値）
    ) -> float:
        """
        成長性スコアを算出する (0-100)。

        Args:
            revenue_yoy:      売上高前年比成長率（例: 0.25 = 25%成長）
            eps_growth:       EPS前年比成長率
            market_expansion: 対象市場の年間成長率スコア (0-1)

        Returns:
            成長性スコア (0-100)
        """
        # 成長率を 0-100 スコアに変換（シグモイド的変換）
        def growth_to_score(growth: Optional[float]) -> float:
            if growth is None:
                return 50.0  # データなし → 中立値
            if growth >= 0.50:
                return 100.0  # 50%超成長 → 満点
            elif growth >= 0.25:
                return 75.0 + (growth - 0.25) / 0.25 * 25.0
            elif growth >= 0.10:
                return 50.0 + (growth - 0.10) / 0.15 * 25.0
            elif growth >= 0.0:
                return growth / 0.10 * 50.0
            else:
                # マイナス成長
                return max(0.0, 50.0 + growth * 100)

        rev_score = growth_to_score(revenue_yoy)
        eps_score = growth_to_score(eps_growth)
        mkt_score = market_expansion * 100

        return (
            self.REV_GROWTH_W * rev_score
            + self.EPS_GROWTH_W * eps_score
            + self.MARKET_EXP_W * mkt_score
        )

    def _compute_profitability_score(
        self,
        gross_margin: Optional[float],
        operating_margin: Optional[float],
        fcf_margin: Optional[float],
    ) -> float:
        """
        収益性スコアを算出する (0-100)。

        Args:
            gross_margin:     売上総利益率
            operating_margin: 営業利益率
            fcf_margin:       FCFマージン

        Returns:
            収益性スコア (0-100)
        """
        def margin_to_score(margin: Optional[float], excellent: float, good: float) -> float:
            """利益率をスコアに変換する汎用関数"""
            if margin is None:
                return 50.0  # データなし → 中立値
            if margin >= excellent:
                return 100.0
            elif margin >= good:
                return 70.0 + (margin - good) / (excellent - good) * 30.0
            elif margin >= 0:
                return margin / good * 70.0
            else:
                return max(0.0, 50.0 + margin * 100)

        # IT・ソフトウェア企業の利益率ベンチマーク
        gross_score = margin_to_score(gross_margin, excellent=0.80, good=0.50)
        op_score    = margin_to_score(operating_margin, excellent=0.30, good=0.15)
        fcf_score   = margin_to_score(fcf_margin, excellent=0.25, good=0.10)

        return (
            self.GROSS_M_W     * gross_score
            + self.OPERATING_M_W * op_score
            + self.FCF_M_W     * fcf_score
        )

    def _compute_valuation_score(
        self,
        composite_score: float,
        per: Optional[float],
        peg: Optional[float],
    ) -> float:
        """
        割安判定スコアを算出する。

        算出式:
            normalized_PER  = max(1, PER) / 30    # 30倍を基準に正規化
            normalized_PEG  = max(0.1, PEG) / 1.5 # 1.5を基準に正規化
            valuation_score = composite_score / (normalized_PER × normalized_PEG × 100)

        スコア解釈:
            >= 5.0: very_cheap（非常に割安）
            2.5-5.0: cheap（割安）
            1.0-2.5: fair（適正）
            < 1.0: expensive（割高）

        Args:
            composite_score: AI総合スコア (0-100)
            per: 株価収益率
            peg: PEGレシオ

        Returns:
            割安判定スコア（高いほど割安）
        """
        # PER が負・None・異常値の場合はペナルティ
        effective_per = per
        if per is None or per <= 0 or per > 500:
            effective_per = 60.0  # 高PERとしてペナルティ

        # PEG が負・None・異常値の場合はペナルティ
        effective_peg = peg
        if peg is None or peg <= 0 or peg > 10:
            effective_peg = 3.0  # 高PEGとしてペナルティ

        # 正規化（業界平均基準で割る）
        norm_per = max(1.0, effective_per) / 30.0
        norm_peg = max(0.1, effective_peg) / 1.5

        denominator = norm_per * norm_peg * 100
        if denominator == 0:
            return 0.0

        return composite_score / denominator

    # ── DB 操作 ────────────────────────────────────────────────────

    async def _get_patent_stats(self, company_id: int) -> dict:
        """企業の特許統計を取得する"""
        from app.models.models import Patent

        total_stmt = select(func.count()).where(Patent.company_id == company_id)
        ai_stmt    = select(func.count()).where(
            Patent.company_id == company_id,
            Patent.ai_relevance >= 0.5,
        )
        avg_cite_stmt = select(func.avg(Patent.citation_count)).where(
            Patent.company_id == company_id
        )

        total_res    = await self.db.execute(total_stmt)
        ai_res       = await self.db.execute(ai_stmt)
        avg_cite_res = await self.db.execute(avg_cite_stmt)

        return {
            "total": total_res.scalar_one() or 0,
            "ai_related": ai_res.scalar_one() or 0,
            "avg_citations": float(avg_cite_res.scalar_one() or 0),
        }

    async def _upsert_score(
        self,
        company_id: int,
        tech_score: float,
        growth_score: float,
        profitability_score: float,
        keyword_score: float,
        patent_score: float,
        rd_ratio_score: float,
        paper_score: float,
        composite_score: float,
        valuation_score: float,
        per_used: Optional[float],
        peg_used: Optional[float],
    ) -> AIScore:
        """今日付けの AIScore を upsert する"""
        today = date.today()
        stmt = select(AIScore).where(
            AIScore.company_id == company_id,
            AIScore.score_date == today,
        )
        result = await self.db.execute(stmt)
        score = result.scalar_one_or_none()

        score_data = dict(
            tech_score=round(tech_score, 2),
            growth_score=round(growth_score, 2),
            profitability_score=round(profitability_score, 2),
            keyword_score=round(keyword_score, 2),
            patent_score=round(patent_score, 2),
            rd_ratio_score=round(rd_ratio_score, 2),
            paper_score=round(paper_score, 2),
            composite_score=round(composite_score, 2),
            valuation_score=round(valuation_score, 4),
            per_used=per_used,
            peg_used=peg_used,
        )

        if score is None:
            score = AIScore(company_id=company_id, score_date=today, **score_data)
            self.db.add(score)
        else:
            for key, value in score_data.items():
                setattr(score, key, value)

        await self.db.flush()
        return score
