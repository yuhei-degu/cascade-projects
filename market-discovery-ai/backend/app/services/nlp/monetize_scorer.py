"""
⑬ NLP続き — 収益化・緊急度・課金意欲スコアラー
"""

from typing import List
import math
from app.services.nlp.classifier import (
    MONEY_WORDS_HIGH, MONEY_WORDS_MID, MONEY_WORDS_LOW,
    URGENCY_WORDS, PAYMENT_INTENT_WORDS,
)


class MonetizationScorer:
    """
    収益化可能性スコアを算出するクラス。

    サブスコア:
        money_word_rate  (0-100): 金銭ワード出現率
        urgency_score    (0-100): 緊急度
        payment_intent   (0-100): 課金意欲
        problem_clarity  (0-100): 悩みの具体性
    """

    def score(self, texts: List[str]) -> dict:
        """
        複数の投稿テキストからサブスコアを算出する。

        Args:
            texts: テーマに属する投稿本文リスト

        Returns:
            各サブスコアと総合スコア (0-100) の辞書
        """
        combined = " ".join(texts)
        words = combined.split()
        total_words = max(len(words), 1)

        money_rate   = self._money_word_rate(combined, total_words)
        urgency      = self._urgency_score(combined)
        payment      = self._payment_intent_score(combined)
        clarity      = self._problem_clarity(texts)

        # 重み付き合算
        total = (
            0.30 * money_rate
            + 0.25 * urgency
            + 0.25 * payment
            + 0.20 * clarity
        )

        return {
            "money_word_rate": round(money_rate, 2),
            "urgency_score":   round(urgency, 2),
            "payment_intent":  round(payment, 2),
            "problem_clarity": round(clarity, 2),
            "monetize_score":  round(total, 2),
        }

    def _money_word_rate(self, text: str, total_words: int) -> float:
        """金銭ワード出現率スコア（重み付きカウント→0-100）"""
        score = 0.0
        for w in MONEY_WORDS_HIGH:
            score += text.count(w) * 3.0
        for w in MONEY_WORDS_MID:
            score += text.count(w) * 1.5
        for w in MONEY_WORDS_LOW:
            score += text.count(w) * 0.5
        density = score / total_words * 1000  # per 1000 words
        return min(100.0, density * 8)

    def _urgency_score(self, text: str) -> float:
        """緊急度スコア（ヒット数→0-100）"""
        hits = sum(text.count(w) for w in URGENCY_WORDS)
        return min(100.0, hits * 12.0)

    def _payment_intent_score(self, text: str) -> float:
        """課金意欲スコア（ヒット数→0-100）"""
        hits = sum(text.count(w) for w in PAYMENT_INTENT_WORDS)
        return min(100.0, hits * 20.0)

    def _problem_clarity(self, texts: List[str]) -> float:
        """
        悩みの具体性スコア。
        投稿数が多いほど具体的な悩みが集まっていると判定。
        平均文字数が長いほど詳細な悩み。
        """
        if not texts:
            return 0.0
        count_score = min(100.0, math.log1p(len(texts)) / math.log1p(50) * 100)
        avg_len = sum(len(t) for t in texts) / len(texts)
        len_score = min(100.0, avg_len / 200 * 100)
        return 0.6 * count_score + 0.4 * len_score


class UrgencyDetector:
    """
    単一テキストの緊急度を検出するシンプルなクラス。
    ランキング表示時の「急上昇」タグ判定に使用。
    """

    def is_urgent(self, text: str, threshold: float = 40.0) -> bool:
        hits = sum(text.count(w) for w in URGENCY_WORDS)
        return hits * 12.0 >= threshold

    def get_score(self, text: str) -> float:
        hits = sum(text.count(w) for w in URGENCY_WORDS)
        return min(100.0, hits * 12.0)
