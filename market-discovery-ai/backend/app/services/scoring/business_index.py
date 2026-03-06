"""
⑧⑫ 総合ビジネス指数算出エンジン
需要スコア算出 + 総合スコア統合 + DB保存
"""

import math
from datetime import date
from typing import List, Optional

import structlog
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import RawPost, Theme, ThemeScore
from app.services.nlp.classifier import CategoryClassifier, TextPreprocessor
from app.services.nlp.monetize_scorer import MonetizationScorer
from app.services.scoring.competition import CompetitionAnalyzer, DevDifficultyEstimator

logger = structlog.get_logger()


class DemandScorer:
    """
    需要スコア算出クラス。

    算出式:
        raw = log(1 + post_count) × log(1 + avg_comment) × growth_factor
        growth_factor = max(0.5, 1 + (this_week - last_week) / max(last_week, 1))
        demand_score = min(100, raw × NORMALIZATION)
    """

    NORMALIZATION: float = 5.0

    def score(
        self,
        post_count: int,
        avg_comment_count: float,
        posts_this_week: int,
        posts_last_week: int,
    ) -> float:
        growth_factor = max(
            0.5,
            1.0 + (posts_this_week - posts_last_week) / max(posts_last_week, 1),
        )
        raw = (
            math.log1p(post_count)
            * math.log1p(avg_comment_count)
            * growth_factor
        )
        return min(100.0, raw * self.NORMALIZATION)


class BusinessIndexCalculator:
    """
    総合ビジネス指数算出クラス。

    公式:
        BI = 0.4×D + 0.3×M + 0.2×(100-C) + 0.1×(100-Dev)

    スコア解釈:
        80-100: ゴールドチャンス
        60-79:  有望
        40-59:  要検討
        0-39:   厳しい
    """

    def calculate(
        self,
        demand_score: float,
        monetize_score: float,
        competition_score: float,
        dev_difficulty: float,
    ) -> float:
        bi = (
            0.4 * demand_score
            + 0.3 * monetize_score
            + 0.2 * (100.0 - competition_score)
            + 0.1 * (100.0 - dev_difficulty)
        )
        return round(min(100.0, max(0.0, bi)), 2)

    @staticmethod
    def label(score: float) -> str:
        if score >= 80:   return "ゴールドチャンス 🏆"
        elif score >= 60: return "有望 ✨"
        elif score >= 40: return "要検討 🔍"
        else:             return "厳しい ⚠️"


class ThemeScoringService:
    """
    テーマに対してすべてのスコアを計算し DB に保存するサービス。
    """

    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.demand_scorer   = DemandScorer()
        self.monetize_scorer = MonetizationScorer()
        self.competition     = CompetitionAnalyzer()
        self.dev_estimator   = DevDifficultyEstimator()
        self.bi_calc         = BusinessIndexCalculator()

    async def score_theme(self, theme: Theme) -> Optional[ThemeScore]:
        """
        テーマ1件のスコアを算出して DB に upsert する。

        Args:
            theme: スコア算出対象の Theme オブジェクト

        Returns:
            保存した ThemeScore、または None（データ不足時）
        """
        if theme.post_count < 1:
            logger.warning("Skipping theme with no posts", theme_id=theme.id)
            return None

        # 関連投稿テキストを取得
        post_stmt = (
            select(RawPost.body)
            .where(RawPost.theme_id == theme.id)
            .limit(100)  # 最大100件
        )
        result = await self.db.execute(post_stmt)
        texts = [row[0] for row in result.fetchall()]

        keywords = list(theme.keywords or [])
        category_name = theme.category.name if theme.category else None

        # ① 需要スコア
        demand = self.demand_scorer.score(
            post_count=theme.post_count,
            avg_comment_count=theme.avg_comment_count,
            posts_this_week=theme.posts_this_week,
            posts_last_week=theme.posts_last_week,
        )

        # ② 収益化スコア
        monetize_result = self.monetize_scorer.score(texts)

        # ③ 競合強度
        competition_result = await self.competition.analyze(keywords, category_name)

        # ④ 開発難易度
        dev_result = self.dev_estimator.estimate(keywords, category_name)

        # ⑧ 総合ビジネス指数
        bi = self.bi_calc.calculate(
            demand_score=demand,
            monetize_score=monetize_result["monetize_score"],
            competition_score=competition_result["competition_score"],
            dev_difficulty=dev_result["dev_difficulty"],
        )

        reason = (
            f"需要:{demand:.0f} / 収益化:{monetize_result['monetize_score']:.0f} / "
            f"競合:{competition_result['competition_score']:.0f} / "
            f"難易度:{dev_result['dev_difficulty']:.0f}"
        )

        logger.info(
            "Theme scored",
            theme_id=theme.id,
            title=theme.title[:30],
            bi=bi,
            demand=demand,
        )

        return await self._upsert_score(
            theme_id=theme.id,
            demand_score=demand,
            monetize_result=monetize_result,
            competition_result=competition_result,
            dev_result=dev_result,
            business_index=bi,
            score_reason=reason,
        )

    async def score_all_themes(self) -> int:
        """アクティブな全テーマを再スコアリングする"""
        stmt = select(Theme).where(Theme.is_active == True)
        result = await self.db.execute(stmt)
        themes = result.scalars().all()

        scored = 0
        for theme in themes:
            score = await self.score_theme(theme)
            if score:
                scored += 1
        logger.info("Batch scoring complete", total=len(themes), scored=scored)
        return scored

    async def _upsert_score(
        self,
        theme_id: int,
        demand_score: float,
        monetize_result: dict,
        competition_result: dict,
        dev_result: dict,
        business_index: float,
        score_reason: str,
    ) -> ThemeScore:
        today = date.today()
        stmt = select(ThemeScore).where(
            ThemeScore.theme_id == theme_id,
            ThemeScore.score_date == today,
        )
        res = await self.db.execute(stmt)
        ts = res.scalar_one_or_none()

        data = dict(
            demand_score=round(demand_score, 2),
            monetize_score=round(monetize_result["monetize_score"], 2),
            competition_score=round(competition_result["competition_score"], 2),
            dev_difficulty=round(dev_result["dev_difficulty"], 2),
            money_word_rate=round(monetize_result["money_word_rate"], 2),
            urgency_score=round(monetize_result["urgency_score"], 2),
            payment_intent=round(monetize_result["payment_intent"], 2),
            problem_clarity=round(monetize_result["problem_clarity"], 2),
            business_index=round(business_index, 2),
            score_reason=score_reason,
        )

        if ts is None:
            ts = ThemeScore(theme_id=theme_id, score_date=today, **data)
            self.db.add(ts)
        else:
            for k, v in data.items():
                setattr(ts, k, v)

        await self.db.flush()
        return ts
