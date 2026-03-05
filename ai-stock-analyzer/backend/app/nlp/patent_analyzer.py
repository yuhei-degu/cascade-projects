"""
⑩ 特許解析用NLPサンプルコード
HuggingFace transformers（SciBERT）を使ってAI特許の関連性スコアを算出する。
"""
from __future__ import annotations

import logging
from typing import Optional
import numpy as np

logger = logging.getLogger(__name__)

# モデルはアプリ起動時に遅延ロード（メモリ効率化）
_model = None
_tokenizer = None


def _load_model(model_name: str, device: str) -> tuple:
    """
    SciBERTモデルとトークナイザーを遅延ロードする。
    初回呼び出し時のみダウンロード・初期化する。

    Args:
        model_name: HuggingFaceモデル名
        device: "cpu" or "cuda"

    Returns:
        tuple: (tokenizer, model)
    """
    global _model, _tokenizer
    if _model is None:
        try:
            from transformers import AutoTokenizer, AutoModel
            import torch
            logger.info(f"📦 Loading NLP model: {model_name}")
            _tokenizer = AutoTokenizer.from_pretrained(model_name)
            _model = AutoModel.from_pretrained(model_name)
            _model.eval()
            if device == "cuda":
                import torch
                _model = _model.cuda()
            logger.info(f"✅ NLP model loaded on {device}")
        except Exception as e:
            logger.error(f"❌ Failed to load NLP model: {e}")
            raise
    return _tokenizer, _model


# AI技術の参照テキスト（コサイン類似度の基準となる埋め込みを生成するため）
AI_REFERENCE_TEXTS: list[str] = [
    "artificial intelligence machine learning deep learning neural network",
    "large language model transformer attention mechanism natural language processing",
    "computer vision image recognition object detection convolutional neural network",
    "reinforcement learning autonomous system robotics intelligent agent",
    "GPU parallel computing accelerated computing AI inference training",
    "generative AI diffusion model image generation text generation",
    "federated learning edge AI privacy-preserving machine learning",
    "AI chip semiconductor neural processing unit NPU TPU",
]


def encode_texts(texts: list[str], tokenizer, model, max_length: int = 512) -> np.ndarray:
    """
    テキストリストをSciBERTで埋め込みベクトルに変換する。
    [CLS]トークンの出力を文ベクトルとして使用。

    Args:
        texts: エンコードするテキストのリスト
        tokenizer: HuggingFaceトークナイザー
        model: HuggingFaceモデル
        max_length: トークンの最大長

    Returns:
        np.ndarray: shape=(len(texts), hidden_size) の埋め込み行列
    """
    import torch

    embeddings = []
    with torch.no_grad():
        for text in texts:
            # テキストが長い場合は切り詰め
            inputs = tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                max_length=max_length,
                padding=True,
            )
            outputs = model(**inputs)
            # [CLS]トークン（先頭）の hidden state を文ベクトルとして使用
            cls_embedding = outputs.last_hidden_state[:, 0, :].squeeze(0).numpy()
            embeddings.append(cls_embedding)

    return np.array(embeddings)


def cosine_similarity_batch(query_vecs: np.ndarray, ref_vecs: np.ndarray) -> np.ndarray:
    """
    クエリベクトル群と参照ベクトル群のコサイン類似度行列を計算する。

    Args:
        query_vecs: クエリ埋め込み行列 shape=(N, D)
        ref_vecs: 参照埋め込み行列 shape=(M, D)

    Returns:
        np.ndarray: 類似度行列 shape=(N, M)
    """
    # L2正規化
    query_norm = query_vecs / (np.linalg.norm(query_vecs, axis=1, keepdims=True) + 1e-8)
    ref_norm = ref_vecs / (np.linalg.norm(ref_vecs, axis=1, keepdims=True) + 1e-8)
    return query_norm @ ref_norm.T


class PatentNLPAnalyzer:
    """
    特許テキストのAI関連性をNLPで解析するアナライザー。

    SciBERTを使ってAI参照テキストとのコサイン類似度を計算し、
    特許のAI関連性スコア（0-100）を返す。

    Example:
        analyzer = PatentNLPAnalyzer(model_name="allenai/scibert_scivocab_uncased")
        result = analyzer.analyze_patents(["Machine learning for GPU optimization", ...])
        print(result.avg_score)  # 0.87
    """

    def __init__(self, model_name: str = "allenai/scibert_scivocab_uncased", device: str = "cpu") -> None:
        """
        Args:
            model_name: 使用するHuggingFaceモデル名。
                        "allenai/scibert_scivocab_uncased" (SciBERT)
                        "ProsusAI/finbert" (FinBERT) など
            device: "cpu" または "cuda"
        """
        self.model_name = model_name
        self.device = device
        self._ref_embeddings: Optional[np.ndarray] = None

    def _get_ref_embeddings(self) -> np.ndarray:
        """
        AI参照テキストの埋め込みを返す（初回のみ計算してキャッシュ）。
        """
        if self._ref_embeddings is None:
            tokenizer, model = _load_model(self.model_name, self.device)
            self._ref_embeddings = encode_texts(AI_REFERENCE_TEXTS, tokenizer, model)
            logger.info(f"✅ Reference embeddings computed: shape={self._ref_embeddings.shape}")
        return self._ref_embeddings

    def score_single(self, patent_text: str) -> float:
        """
        特許テキスト1件のAI関連性スコアを計算する（0.0-1.0）。

        Args:
            patent_text: 特許タイトル・アブストラクトのテキスト

        Returns:
            float: AI関連性スコア（0.0=無関係, 1.0=完全一致）
        """
        tokenizer, model = _load_model(self.model_name, self.device)
        ref_embeddings = self._get_ref_embeddings()

        query_emb = encode_texts([patent_text], tokenizer, model)
        similarities = cosine_similarity_batch(query_emb, ref_embeddings)
        # 全参照テキストとの最大類似度を返す
        max_similarity = float(similarities[0].max())
        return max(0.0, min(1.0, max_similarity))

    def analyze_patents(self, patent_texts: list[str]) -> "PatentAnalysisResult":
        """
        特許テキストリストを一括解析してスコア結果を返す。

        Args:
            patent_texts: 特許テキストのリスト

        Returns:
            PatentAnalysisResult: 解析結果
        """
        if not patent_texts:
            return PatentAnalysisResult(
                total_count=0, ai_count=0, avg_score=0.0,
                max_score=0.0, scores=[], threshold_used=0.5,
            )

        tokenizer, model = _load_model(self.model_name, self.device)
        ref_embeddings = self._get_ref_embeddings()

        logger.info(f"🔬 Analyzing {len(patent_texts)} patents with NLP...")
        query_embeddings = encode_texts(patent_texts, tokenizer, model)
        similarities = cosine_similarity_batch(query_embeddings, ref_embeddings)

        # 各特許に対して参照テキスト群との最大類似度を取得
        max_scores: list[float] = similarities.max(axis=1).tolist()

        # AIキーワードによる2次フィルタ（0.4以上をAI特許と判定）
        ai_threshold = 0.4
        ai_count = sum(1 for s in max_scores if s >= ai_threshold)
        avg_score = float(np.mean(max_scores)) if max_scores else 0.0
        max_score = float(max(max_scores)) if max_scores else 0.0

        logger.info(
            f"✅ Patent analysis done: total={len(patent_texts)}, "
            f"AI-related={ai_count}, avg_score={avg_score:.3f}"
        )

        return PatentAnalysisResult(
            total_count=len(patent_texts),
            ai_count=ai_count,
            avg_score=avg_score,
            max_score=max_score,
            scores=max_scores,
            threshold_used=ai_threshold,
        )


class PatentAnalysisResult:
    """特許NLP解析の結果を保持するデータクラス"""

    def __init__(
        self,
        total_count: int,
        ai_count: int,
        avg_score: float,
        max_score: float,
        scores: list[float],
        threshold_used: float,
    ) -> None:
        self.total_count = total_count
        self.ai_count = ai_count
        self.avg_score = avg_score        # 平均類似度スコア (0-1)
        self.max_score = max_score        # 最高類似度スコア (0-1)
        self.scores = scores              # 各特許のスコアリスト
        self.threshold_used = threshold_used

    @property
    def ai_ratio(self) -> float:
        """AI関連特許の比率"""
        if self.total_count == 0:
            return 0.0
        return self.ai_count / self.total_count

    def to_patent_score(self) -> float:
        """
        特許NLPスコアを0-100のスケールに変換する。
        平均スコア・AI特許比率・件数を総合して算出。
        """
        if self.total_count == 0:
            return 0.0
        # 平均類似度(0-1) × 60% + AI特許比率(0-1) × 40% → 0-100に変換
        raw = (self.avg_score * 0.6 + self.ai_ratio * 0.4)
        # 特許件数ボーナス（500件以上でmax20pt追加）
        count_bonus = min(self.total_count / 500 * 20, 20)
        return min((raw * 80) + count_bonus, 100.0)
