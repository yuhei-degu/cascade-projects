"""
⑬⑮ NLPモデル実装 — カテゴリ分類 / 収益化スコア / 緊急度検出
キーワードベースのルール分類（torch/transformers 不要）
"""

import re
from typing import Dict, List, Optional, Tuple
import structlog

logger = structlog.get_logger()

# ── カテゴリ定義 ──────────────────────────────────────────────────
CATEGORIES: List[str] = [
    "健康・医療", "お金・投資", "仕事・副業", "恋愛・結婚",
    "子育て・育児", "住宅・不動産", "IT・テック", "法律・手続き",
    "美容・ダイエット", "ペット", "学習・資格", "旅行・趣味",
    "食事・料理", "人間関係", "老後・介護", "その他",
]

# ── 金銭ワード辞書 ────────────────────────────────────────────────
MONEY_WORDS_HIGH: List[str] = [
    "いくら", "費用", "料金", "払う", "稼ぐ", "儲ける", "節約",
    "コスト", "価格", "値段", "お金", "収入", "副業", "投資",
    "節税", "損した", "稼げる", "もうける", "利益", "売上",
]
MONEY_WORDS_MID: List[str] = [
    "安く", "高い", "無料", "有料", "課金", "サブスク",
    "割引", "セール", "お得", "格安",
]
MONEY_WORDS_LOW: List[str] = [
    "もったいない", "お金持ち", "貯金", "節約", "経済的",
]

# ── 緊急度ワード ──────────────────────────────────────────────────
URGENCY_WORDS: List[str] = [
    "今すぐ", "急いで", "困っている", "助けて", "すぐに",
    "早急に", "至急", "緊急", "悩んでいる", "どうしよう",
    "どうすれば", "解決したい", "困った", "助かる", "わからない",
]

# ── 課金意欲ワード ───────────────────────────────────────────────
PAYMENT_INTENT_WORDS: List[str] = [
    "買いたい", "利用したい", "申し込みたい", "登録したい",
    "払ってでも", "いくらでも", "お金を払う", "有料でも",
    "プレミアム", "課金する", "サービスが欲しい", "アプリが欲しい",
]

# カテゴリ別開発難易度ボーナス
CATEGORY_DIFFICULTY_BONUS: Dict[str, float] = {
    "健康・医療": 20.0,
    "お金・投資": 15.0,
    "法律・手続き": 10.0,
    "IT・テック": -10.0,
    "学習・資格": -5.0,
    "旅行・趣味": -8.0,
}

# 個人情報マスクパターン
PII_PATTERNS: List[re.Pattern] = [
    re.compile(r"\b\d{3}-\d{4}-\d{4}\b"),          # 電話番号
    re.compile(r"[\w\.-]+@[\w\.-]+\.\w+"),           # メール
    re.compile(r"\d{3}-\d{4}"),                      # 郵便番号
    re.compile(r"[〒]\s*\d{3}-\d{4}"),               # 〒郵便番号
]


class TextPreprocessor:
    """テキスト前処理：正規化・個人情報マスク"""

    @staticmethod
    def mask_pii(text: str) -> str:
        """個人情報パターンをマスクして返す"""
        for pattern in PII_PATTERNS:
            text = pattern.sub("[MASKED]", text)
        return text

    @staticmethod
    def normalize(text: str) -> str:
        """テキスト正規化: 全角→半角・余分な空白除去"""
        # 全角英数字→半角
        text = text.translate(str.maketrans(
            "ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ"
            "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ"
            "０１２３４５６７８９",
            "abcdefghijklmnopqrstuvwxyz"
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
            "0123456789",
        ))
        text = re.sub(r"https?://\S+", "", text)  # URL除去
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def preprocess(self, text: str) -> str:
        return self.normalize(self.mask_pii(text))


class CategoryClassifier:
    """
    キーワードベースのカテゴリ分類器。
    torch/transformers 不要のルールベース実装。
    """

    def __init__(self, model_name: str = "") -> None:
        # model_name は後方互換のためのみ保持
        pass

    def classify(self, text: str) -> Tuple[str, float]:
        """
        テキストをCATEGORIESのいずれかに分類する。

        Returns:
            (カテゴリ名, 信頼度スコア0-1)
        """
        return self._keyword_fallback(text)

    def _keyword_fallback(self, text: str) -> Tuple[str, float]:
        """キーワードベース分類"""
        keyword_map = {
            "お金・投資": ["投資", "株", "FX", "仮想通貨", "お金", "稼ぐ", "副業", "NISA", "節税", "確定申告"],
            "健康・医療": ["病気", "症状", "医者", "薬", "病院", "健康", "痛い", "治療", "診断"],
            "仕事・副業": ["仕事", "転職", "求人", "副業", "給料", "会社", "残業", "フリーランス", "在宅"],
            "IT・テック": ["プログラム", "アプリ", "PC", "スマホ", "エラー", "コード", "AI", "Python", "Next.js"],
            "恋愛・結婚": ["恋愛", "彼氏", "彼女", "結婚", "デート", "告白", "婚活"],
            "法律・手続き": ["法律", "契約", "裁判", "離婚", "手続き", "登記", "弁護士"],
            "子育て・育児": ["子供", "育児", "保育", "学校", "塾", "子育て", "赤ちゃん"],
            "美容・ダイエット": ["ダイエット", "痩せ", "美容", "スキンケア", "コスメ", "筋トレ"],
            "学習・資格": ["勉強", "資格", "試験", "学習", "英語", "語学", "検定"],
            "住宅・不動産": ["家", "マンション", "引越し", "賃貸", "購入", "ローン", "不動産"],
        }
        best_cat, best_score = "その他", 0.3
        for cat, kws in keyword_map.items():
            hits = sum(1 for kw in kws if kw in text)
            score = min(1.0, hits / max(len(kws), 1) * 2)
            if score > best_score:
                best_cat, best_score = cat, score
        return best_cat, best_score
