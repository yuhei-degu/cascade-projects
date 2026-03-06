"""
⑭ 競合推定ロジック実装

Google Custom Search APIが利用可能な場合は実件数を使用。
APIキー未設定時はキーワードパターンマッチングによる推定にフォールバック。
"""

import math
from typing import List, Optional
import httpx
import structlog

from app.core.config import settings
from app.services.nlp.classifier import CATEGORY_DIFFICULTY_BONUS

logger = structlog.get_logger()

# 既知アプリ・サービスのキーワード辞書
# カテゴリ → 競合サービス名リスト
KNOWN_COMPETITOR_KEYWORDS: dict = {
    "お金・投資":    ["マネーフォワード", "家計簿", "Zaimザイム", "楽天証券", "SBI証券", "投資信託"],
    "健康・医療":    ["LEBER", "メドレー", "ヘルスケア", "Fitbit", "Apple Health"],
    "仕事・副業":    ["クラウドワークス", "ランサーズ", "ココナラ", "Indeed", "doda"],
    "恋愛・結婚":    ["Pairs", "Tinder", "with", "Omiai", "ゼクシィ"],
    "子育て・育児":  ["ままのて", "育児日記", "パパっと育児"],
    "IT・テック":    ["Stack Overflow", "GitHub", "Qiita", "Zenn"],
    "学習・資格":    ["Udemy", "スタディサプリ", "アプリで勉強"],
    "美容・ダイエット": ["カロリー計算", "ダイエットアプリ", "Beauty", "カロミル"],
    "ペット":        ["ペット手帳", "アニコム"],
    "住宅・不動産":  ["SUUMO", "アットホーム", "ホームズ", "不動産アプリ"],
}

# 高競合カテゴリ（広告密度が高い）
HIGH_AD_CATEGORIES = {"お金・投資", "健康・医療", "美容・ダイエット", "住宅・不動産", "恋愛・結婚"}
MID_AD_CATEGORIES  = {"仕事・副業", "学習・資格", "IT・テック"}


class CompetitionAnalyzer:
    """
    競合強度スコアを算出するクラス。

    スコア構成 (0-100, 低いほど低競合 = 参入しやすい):
        search_volume_proxy  (0-100): 検索ボリューム推定
        app_existence_score  (0-100): 既存アプリ有無
        ad_density_score     (0-100): 広告出稿密度推定

    最終スコア = 0.4×search + 0.3×app + 0.3×ad
    """

    async def analyze(
        self,
        keywords: List[str],
        category: Optional[str] = None,
    ) -> dict:
        """
        キーワードリストとカテゴリから競合強度スコアを算出する。

        Args:
            keywords: テーマの代表キーワード（上位10件）
            category: テーマカテゴリ名

        Returns:
            スコア辞書
        """
        search_score = await self._search_volume_proxy(keywords)
        app_score    = self._app_existence_score(keywords, category)
        ad_score     = self._ad_density_score(category)

        total = 0.4 * search_score + 0.3 * app_score + 0.3 * ad_score

        return {
            "competition_score":       round(total, 2),
            "search_volume_proxy":     round(search_score, 2),
            "app_existence_score":     round(app_score, 2),
            "ad_density_score":        round(ad_score, 2),
            "competition_label":       self._label(total),
        }

    async def _search_volume_proxy(self, keywords: List[str]) -> float:
        """
        Google Custom Search APIで件数推定。
        APIキー未設定時はキーワード長からの推定値を返す。
        """
        if not settings.GOOGLE_CUSTOM_SEARCH_KEY or not settings.GOOGLE_SEARCH_ENGINE_ID:
            return self._keyword_length_proxy(keywords)

        query = " ".join(keywords[:3])
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    "https://www.googleapis.com/customsearch/v1",
                    params={
                        "key": settings.GOOGLE_CUSTOM_SEARCH_KEY,
                        "cx":  settings.GOOGLE_SEARCH_ENGINE_ID,
                        "q":   query,
                        "num": 1,
                    },
                )
                data = resp.json()
                total_results = int(data.get("searchInformation", {}).get("totalResults", 0))
                # 対数正規化: 1億件→100点, 1万件→50点
                score = min(100.0, math.log10(max(total_results, 1)) / math.log10(1e8) * 100)
                return score
        except Exception as e:
            logger.warning("Google Search API failed", error=str(e))
            return self._keyword_length_proxy(keywords)

    def _keyword_length_proxy(self, keywords: List[str]) -> float:
        """
        APIなし時の代替推定。
        一般的・短いキーワードは競合多し、ニッチ・長いキーワードは少ない。
        """
        if not keywords:
            return 50.0
        avg_len = sum(len(k) for k in keywords) / len(keywords)
        # 平均4文字以下: 競合多 (80), 8文字以上: 競合少 (30)
        score = max(20.0, min(90.0, 100.0 - avg_len * 8))
        return score

    def _app_existence_score(self, keywords: List[str], category: Optional[str]) -> float:
        """
        既知競合アプリ辞書とキーワードの一致度から算出。
        完全一致があれば 80, 部分一致なら比例、なければ 10。
        """
        if not category:
            return 30.0
        competitors = KNOWN_COMPETITOR_KEYWORDS.get(category, [])
        if not competitors:
            return 20.0

        kw_text = " ".join(keywords).lower()
        matches = sum(
            1 for comp in competitors
            if any(part.lower() in kw_text for part in comp.split())
        )
        score = min(90.0, 10.0 + matches / max(len(competitors), 1) * 80)
        return score

    def _ad_density_score(self, category: Optional[str]) -> float:
        """カテゴリの広告競合密度を推定する"""
        if category in HIGH_AD_CATEGORIES:
            return 75.0
        elif category in MID_AD_CATEGORIES:
            return 45.0
        else:
            return 25.0

    @staticmethod
    def _label(score: float) -> str:
        if score <= 30:   return "競合弱 🟢"
        elif score <= 55: return "競合中 🟡"
        elif score <= 75: return "競合強 🟠"
        else:             return "激戦区 🔴"


class DevDifficultyEstimator:
    """
    個人開発難易度を推定するクラス。

    スコア (0-100, 低いほど開発しやすい):
        api_dependency     API依存度
        data_dependency    外部データ依存
        ai_requirement     AIモデル必要性
        regulation_risk    法規制リスク
    """

    def estimate(self, keywords: List[str], category: Optional[str] = None) -> dict:
        """
        キーワードとカテゴリから開発難易度を推定する。

        Args:
            keywords: テーマキーワード
            category: カテゴリ名

        Returns:
            難易度スコア辞書
        """
        kw_text = " ".join(keywords).lower()

        api_dep  = self._api_dependency(kw_text)
        data_dep = self._data_dependency(kw_text)
        ai_req   = self._ai_requirement(kw_text)
        reg_risk = self._regulation_risk(category)

        raw = 0.25 * api_dep + 0.25 * data_dep + 0.25 * ai_req + 0.25 * reg_risk

        # カテゴリ補正
        bonus = CATEGORY_DIFFICULTY_BONUS.get(category or "", 0.0)
        total = max(0.0, min(100.0, raw + bonus))

        return {
            "dev_difficulty":    round(total, 2),
            "api_dependency":    round(api_dep, 2),
            "data_dependency":   round(data_dep, 2),
            "ai_requirement":    round(ai_req, 2),
            "regulation_risk":   round(reg_risk, 2),
            "dev_label":         self._label(total),
        }

    def _api_dependency(self, kw_text: str) -> float:
        api_heavy = ["地図", "地域", "リアルタイム", "天気", "株価", "為替", "sns連携"]
        hits = sum(1 for kw in api_heavy if kw in kw_text)
        return min(80.0, hits * 25.0 + 10.0)

    def _data_dependency(self, kw_text: str) -> float:
        data_heavy = ["収集", "スクレイピング", "データベース", "統計", "分析", "比較"]
        hits = sum(1 for kw in data_heavy if kw in kw_text)
        return min(80.0, hits * 20.0 + 10.0)

    def _ai_requirement(self, kw_text: str) -> float:
        ai_kws = ["翻訳", "認識", "自動", "AI", "画像", "音声", "予測", "レコメンド"]
        hits = sum(1 for kw in ai_kws if kw in kw_text)
        return min(80.0, hits * 20.0 + 5.0)

    def _regulation_risk(self, category: Optional[str]) -> float:
        risk_map = {
            "健康・医療": 80.0, "お金・投資": 70.0,
            "法律・手続き": 65.0, "恋愛・結婚": 35.0,
            "その他": 20.0,
        }
        return risk_map.get(category or "その他", 20.0)

    @staticmethod
    def _label(score: float) -> str:
        if score <= 30:   return "個人開発◎"
        elif score <= 55: return "個人開発△"
        elif score <= 75: return "要チーム"
        else:             return "困難"
