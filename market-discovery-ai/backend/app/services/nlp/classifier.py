"""
⑬⑮ NLPモデル実装 — カテゴリ分類 / 収益化スコア / 緊急度検出
日本語BERTベースのゼロショット分類 + ルールベースハイブリッド
"""

import re
from typing import Dict, List, Optional, Tuple
import structlog
import torch
import numpy as np
from transformers import pipeline, AutoTokenizer, AutoModel

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
    日本語BERTによるゼロショットカテゴリ分類器。
    モデルは遅延ロード（初回呼び出し時に読み込む）。
    """

    def __init__(self, model_name: str = "MoritzLaurer/mDeBERTa-v3-base-mnli-xnli") -> None:
        self.model_name = model_name
        self._classifier = None

    def _load(self) -> None:
        if self._classifier is not None:
            return
        logger.info("Loading zero-shot classifier", model=self.model_name)
        self._classifier = pipeline(
            "zero-shot-classification",
            model=self.model_name,
            device=-1,  # CPU
        )
        logger.info("Zero-shot classifier loaded")

    def classify(self, text: str) -> Tuple[str, float]:
        """
        テキストをCATEGORIESのいずれかに分類する。

        Returns:
            (カテゴリ名, 信頼度スコア0-1)
        """
        try:
            self._load()
            result = self._classifier(
                text[:512],
                candidate_labels=CATEGORIES,
                hypothesis_template="これは{}に関する質問です。",
            )
            return result["labels"][0], float(result["scores"][0])
        except Exception as e:
            logger.warning("Classification failed, using fallback", error=str(e))
            return self._keyword_fallback(text)

    def _keyword_fallback(self, text: str) -> Tuple[str, float]:
        """キーワードベースのフォールバック分類"""
        keyword_map = {
            "お金・投資": ["投資", "株", "FX", "仮想通貨", "お金", "稼ぐ", "副業"],
            "健康・医療": ["病気", "症状", "医者", "薬", "病院", "健康", "痛い"],
            "仕事・副業": ["仕事", "転職", "求人", "副業", "給料", "会社", "残業"],
            "IT・テック": ["プログラム", "アプリ", "PC", "スマホ", "エラー", "コード"],
            "恋愛・結婚": ["恋愛", "彼氏", "彼女", "結婚", "デート", "告白"],
            "法律・手続き": ["法律", "契約", "裁判", "離婚", "手続き", "登記"],
        }
        best_cat, best_score = "その他", 0.3
        for cat, kws in keyword_map.items():
            hits = sum(1 for kw in kws if kw in text)
            score = min(1.0, hits / max(len(kws), 1) * 2)
            if score > best_score:
                best_cat, best_score = cat, score
        return best_cat, best_score
