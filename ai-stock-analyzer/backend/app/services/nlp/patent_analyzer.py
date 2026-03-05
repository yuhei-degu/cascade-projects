"""
⑩ 特許解析用NLPサンプルコード（transformers使用）

特許テキスト（タイトル・アブストラクト）に SciBERT を適用して
AI関連度スコアを算出する。

スコア算出ロジック:
1. AI関連CPCコード（G06N等）が付与されていれば高スコア
2. テキストのAIキーワード密度をスコア化
3. SciBERT エンベディングでAI参照テキストとのコサイン類似度を計算
4. 引用数を対数正規化して加算

最終スコア = 0.4 × cpc_score + 0.3 × keyword_score + 0.2 × embedding_score + 0.1 × citation_score
"""

import math
import re
from typing import List, Optional

import numpy as np
import structlog
import torch
from transformers import AutoModel, AutoTokenizer

logger = structlog.get_logger()

# ── AI関連CPCコードプレフィックス ────────────────────────────────────
AI_CPC_PREFIXES: list[str] = [
    "G06N",   # Computing models/AI
    "G06F 18",# Pattern recognition / machine learning
    "G06T",   # Image processing / CV
    "G10L",   # Speech processing / NLP
    "A61B 5/0002",  # AI医療診断
    "G16H",   # Healthcare informatics
]

# ── AI関連キーワードセット ────────────────────────────────────────────
AI_KEYWORDS: set[str] = {
    "machine learning", "deep learning", "neural network", "artificial intelligence",
    "natural language processing", "computer vision", "reinforcement learning",
    "transformer", "large language model", "llm", "generative ai", "diffusion model",
    "convolutional neural network", "cnn", "rnn", "lstm", "attention mechanism",
    "bert", "gpt", "stable diffusion", "autonomous", "robotics", "mlops",
    "federated learning", "explainable ai", "xai", "knowledge graph",
}

# AI技術の参照テキスト（SciBERTエンベディングのアンカー）
AI_REFERENCE_TEXT = (
    "This invention relates to artificial intelligence, machine learning, "
    "deep neural networks, and applications of transformer-based language models "
    "for natural language processing, computer vision, and autonomous systems."
)


class PatentAnalyzer:
    """
    特許テキストをNLPで解析してAI関連度スコアを算出するクラス。

    Attributes:
        model_name: 使用するHuggingFaceモデル名（デフォルト: SciBERT）
        device: 推論デバイス ("cpu" or "cuda")
    """

    def __init__(
        self,
        model_name: str = "allenai/scibert_scivocab_uncased",
        device: str = "cpu",
    ) -> None:
        self.model_name = model_name
        self.device = device
        self._tokenizer: Optional[AutoTokenizer] = None
        self._model: Optional[AutoModel] = None
        self._ref_embedding: Optional[np.ndarray] = None

    def _load_model(self) -> None:
        """モデルを遅延ロードする（初回使用時のみ）"""
        if self._model is not None:
            return
        logger.info("Loading SciBERT model", model=self.model_name)
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self._model = AutoModel.from_pretrained(self.model_name)
        self._model.to(self.device)
        self._model.eval()
        # 参照テキストのエンベディングを事前計算
        self._ref_embedding = self._get_embedding(AI_REFERENCE_TEXT)
        logger.info("SciBERT model loaded")

    def score_patent(
        self,
        title: str,
        abstract: str,
        cpc_codes: Optional[List[str]] = None,
        citation_count: int = 0,
    ) -> float:
        """
        特許1件のAI関連度スコアを算出する。

        Args:
            title: 特許タイトル
            abstract: 特許アブストラクト
            cpc_codes: CPC分類コードのリスト
            citation_count: 被引用件数

        Returns:
            AI関連度スコア (0.0 ~ 1.0)
        """
        text = f"{title} {abstract}".lower()

        # 1. CPCコードスコア
        cpc_score = self._compute_cpc_score(cpc_codes or [])

        # 2. キーワードスコア
        keyword_score = self._compute_keyword_score(text)

        # 3. SciBERT エンベディングコサイン類似度
        embedding_score = self._compute_embedding_score(text)

        # 4. 引用数スコア（対数正規化）
        citation_score = min(1.0, math.log1p(citation_count) / math.log1p(1000))

        # 加重平均
        final_score = (
            0.4 * cpc_score
            + 0.3 * keyword_score
            + 0.2 * embedding_score
            + 0.1 * citation_score
        )

        return round(final_score, 4)

    def batch_score_patents(
        self,
        patents: List[dict],
    ) -> List[float]:
        """
        複数特許を一括スコアリングする。

        Args:
            patents: 特許データのリスト。各要素は
                     {"title": ..., "abstract": ..., "cpc_codes": [...], "citation_count": ...}

        Returns:
            各特許のスコアリスト（同じ順序）
        """
        return [
            self.score_patent(
                title=p.get("title", ""),
                abstract=p.get("abstract", ""),
                cpc_codes=p.get("cpc_codes"),
                citation_count=p.get("citation_count", 0),
            )
            for p in patents
        ]

    # ── プライベートメソッド ─────────────────────────────────────────

    def _compute_cpc_score(self, cpc_codes: List[str]) -> float:
        """CPC分類コードからAI関連度スコアを計算する"""
        if not cpc_codes:
            return 0.0

        matched = sum(
            1
            for code in cpc_codes
            for prefix in AI_CPC_PREFIXES
            if code.upper().startswith(prefix.upper())
        )
        # 1つでもマッチすれば高スコア、複数マッチで更に高く（上限1.0）
        return min(1.0, matched * 0.5)

    def _compute_keyword_score(self, text: str) -> float:
        """テキスト中のAIキーワード密度からスコアを計算する"""
        words = re.sub(r"[^a-z0-9 ]", " ", text).split()
        total_words = max(len(words), 1)

        # ユニグラム + バイグラムでマッチング
        bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words) - 1)]
        all_ngrams = set(words) | set(bigrams)

        matched_keywords = AI_KEYWORDS & all_ngrams
        keyword_density = len(matched_keywords) / max(len(AI_KEYWORDS), 1)

        # 密度スコアを0-1にシグモイド変換（密度が高いほど急上昇）
        return min(1.0, keyword_density * 10)

    def _compute_embedding_score(self, text: str) -> float:
        """
        SciBERTエンベディングで参照テキストとのコサイン類似度を計算する。

        モデル未ロード時は0.5を返す（デフォルト値）。
        """
        try:
            self._load_model()
            text_embedding = self._get_embedding(text[:512])  # max_length制限
            if self._ref_embedding is None:
                return 0.5
            similarity = self._cosine_similarity(text_embedding, self._ref_embedding)
            # コサイン類似度は -1〜1 なので 0〜1 に変換
            return (similarity + 1) / 2
        except Exception as e:
            logger.warning("Embedding computation failed", error=str(e))
            return 0.5  # フォールバック値

    def _get_embedding(self, text: str) -> np.ndarray:
        """
        テキストのBERTエンベディング（[CLS]トークン）を返す。

        Args:
            text: 入力テキスト

        Returns:
            (hidden_size,) のnumpy配列
        """
        assert self._tokenizer is not None and self._model is not None

        inputs = self._tokenizer(
            text,
            return_tensors="pt",
            max_length=512,
            truncation=True,
            padding=True,
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = self._model(**inputs)

        # [CLS]トークンのエンベディングを取得
        cls_embedding = outputs.last_hidden_state[:, 0, :].squeeze().cpu().numpy()
        return cls_embedding

    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """2つのベクトルのコサイン類似度を返す"""
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))


class SECFilingAnalyzer:
    """
    SEC 10-K/10-Q ファイリングテキストを FinBERT で解析するクラス。

    - AIキーワード出現頻度スコア
    - FinBERT センチメント（positive/neutral/negative）
    """

    FINBERT_MODEL = "ProsusAI/finbert"

    def __init__(self, device: str = "cpu") -> None:
        self.device = device
        self._tokenizer: Optional[AutoTokenizer] = None
        self._model: Optional[AutoModel] = None

    def _load_model(self) -> None:
        """FinBERT モデルを遅延ロードする"""
        if self._model is not None:
            return
        from transformers import pipeline
        logger.info("Loading FinBERT model")
        self._pipeline = pipeline(
            "text-classification",
            model=self.FINBERT_MODEL,
            device=0 if self.device == "cuda" else -1,
            truncation=True,
            max_length=512,
        )
        logger.info("FinBERT model loaded")

    def analyze_keyword_density(self, text: str) -> float:
        """
        テキスト中のAIキーワード出現頻度スコアを計算する（0-100）。

        Args:
            text: SEC ファイリングテキスト（10-K/10-Qのフルテキスト）

        Returns:
            AIキーワード密度スコア (0-100)
        """
        text_lower = text.lower()
        word_count = max(len(text_lower.split()), 1)

        # キーワード出現回数をカウント
        total_hits = sum(
            text_lower.count(kw)
            for kw in AI_KEYWORDS
        )

        # 1000単語あたりの出現頻度（TF-like）
        density = (total_hits / word_count) * 1000

        # 0-100にスケーリング（上限密度: 50hits/1000words → 100点）
        return min(100.0, density * 2)

    def analyze_sentiment(self, text_chunk: str) -> dict:
        """
        FinBERT でテキストのセンチメントを分析する。

        Args:
            text_chunk: 512トークン以内のテキストチャンク

        Returns:
            {"label": "positive"|"neutral"|"negative", "score": float}
        """
        self._load_model()
        result = self._pipeline(text_chunk[:512])
        return result[0] if result else {"label": "neutral", "score": 0.5}
