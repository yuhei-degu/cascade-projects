"""
⑬ NLPモデル実装コード

日本語テキスト解析パイプライン:
1. MeCab 形態素解析（fallback: 正規表現）
2. 収益化ワード辞書マッチング
3. TF-IDF キーワード抽出
4. カテゴリ分類（ルールベース + 将来BERT）
5. テーマクラスタリング（SBERT embeddings + DBSCAN）
"""
import re
import math
from collections import Counter, defaultdict
from typing import Dict, List, Optional, Tuple
import structlog

logger = structlog.get_logger()

# ── 収益化ワード辞書 ────────────────────────────────────────────────
MONETIZATION_DICT: Dict[str, List[str]] = {
    "money_word": [
        "いくら", "費用", "料金", "値段", "価格", "コスト", "予算",
        "稼ぐ", "収入", "副業", "月収", "年収", "給料", "報酬",
        "節約", "節税", "投資", "資産", "貯金", "ローン", "クレジット",
    ],
    "purchase_intent": [
        "買いたい", "購入したい", "使いたい", "試したい", "申し込みたい",
        "おすすめ教えて", "どれがいい", "何がいい", "選び方", "比較",
        "無料", "有料", "課金", "プレミアム", "サブスクリプション",
    ],
    "urgency": [
        "今すぐ", "急いで", "緊急", "早急", "すぐに", "至急",
        "明日まで", "今日中", "締め切り", "期限", "困っている",
    ],
    "severity": [
        "本当に困っている", "どうすれば", "助けてください", "解決方法",
        "アドバイスください", "教えてください", "悩んでいます",
        "辛い", "苦しい", "限界", "もう無理",
    ],
}

# ── カテゴリ分類辞書 ────────────────────────────────────────────────
CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "健康・医療":    ["病気", "症状", "病院", "薬", "治療", "医者", "体調", "健康", "痛い", "診断"],
    "金融・投資":    ["投資", "株", "FX", "仮想通貨", "節税", "確定申告", "保険", "年金", "NISA"],
    "副業・収入":    ["副業", "在宅", "フリーランス", "稼ぐ", "収入", "転売", "ブログ", "YouTube"],
    "転職・キャリア":["転職", "就職", "面接", "履歴書", "スキル", "資格", "キャリア", "仕事"],
    "恋愛・人間関係":["恋愛", "結婚", "彼氏", "彼女", "友達", "職場", "人間関係", "コミュニケーション"],
    "育児・教育":    ["子供", "育児", "学校", "塾", "受験", "教育", "子育て", "保育"],
    "テクノロジー":  ["AI", "プログラミング", "アプリ", "パソコン", "スマホ", "ソフトウェア", "IT"],
    "法律・税務":    ["法律", "税金", "契約", "違法", "訴訟", "弁護士", "裁判", "確定申告"],
    "不動産・住宅":  ["家", "マンション", "引越し", "賃貸", "購入", "ローン", "リフォーム", "不動産"],
    "旅行・移住":    ["旅行", "海外", "移住", "ホテル", "飛行機", "観光", "パスポート", "ビザ"],
    "ダイエット・美容": ["ダイエット", "痩せる", "美容", "スキンケア", "コスメ", "筋トレ", "食事"],
    "メンタルヘルス":["うつ", "不安", "ストレス", "精神科", "カウンセリング", "メンタル", "睡眠"],
    "ペット":        ["犬", "猫", "ペット", "動物病院", "しつけ", "餌", "トリミング"],
    "食・料理":      ["料理", "レシピ", "食材", "飲食店", "グルメ", "栄養", "アレルギー"],
}

# ── 開発難易度マッピング ────────────────────────────────────────────
DEV_DIFFICULTY_KEYWORDS: Dict[str, Dict[str, int]] = {
    "api_dependency": {
        "決済": 30, "地図": 20, "予約": 25, "通知": 15,
        "認証": 15, "決済": 30, "SMS": 20,
    },
    "legal_risk": {
        "診断": 80, "処方": 80, "治療": 70, "投資": 70,
        "FX": 70, "保険": 60, "弁護士": 60, "不動産": 50,
    },
    "ai_need": {
        "音声認識": 60, "画像認識": 55, "自動翻訳": 50,
        "自動作成": 45, "推薦": 40, "チャットbot": 50,
    },
}

# ── ストップワード ──────────────────────────────────────────────────
STOP_WORDS: set = {
    "こと", "もの", "ため", "よう", "これ", "それ", "あれ", "ここ",
    "どこ", "なに", "なぜ", "いつ", "する", "ある", "いる", "なる",
    "できる", "思う", "考える", "知る", "見る", "言う", "聞く",
}


class JapaneseTextAnalyzer:
    """
    日本語テキストを解析してスコアを算出するクラス。

    MeCab が使える場合はそれを使い、
    使えない場合はシンプルな正規表現ベースのトークナイザーで代替する。
    """

    def __init__(self) -> None:
        self._mecab = self._try_load_mecab()

    def _try_load_mecab(self):
        """MeCab を遅延ロード。使えない場合は None を返す。"""
        try:
            import MeCab
            tagger = MeCab.Tagger("-Owakati")
            logger.info("MeCab loaded successfully")
            return tagger
        except ImportError:
            logger.warning("MeCab not found, using regex tokenizer fallback")
            return None

    def tokenize(self, text: str) -> List[str]:
        """
        テキストをトークンリストに変換する。

        Args:
            text: 日本語テキスト

        Returns:
            名詞・動詞・形容詞のトークンリスト
        """
        text = self._normalize(text)
        if self._mecab:
            result = self._mecab.parse(text)
            tokens = [t for t in result.split() if len(t) >= 2 and t not in STOP_WORDS]
        else:
            # Fallback: 2文字以上の平仮名・カタカナ・漢字連続をトークンとみなす
            tokens = re.findall(r'[ぁ-んァ-ン一-龠々ー]{2,}', text)
            tokens = [t for t in tokens if t not in STOP_WORDS]
        return tokens

    def _normalize(self, text: str) -> str:
        """全角英数字→半角、余分な空白除去"""
        text = re.sub(r'[Ａ-Ｚａ-ｚ０-９]', lambda m: chr(ord(m.group(0)) - 0xFEE0), text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def extract_keywords_tfidf(
        self, texts: List[str], top_n: int = 20
    ) -> List[Tuple[str, float]]:
        """
        複数テキストから TF-IDF スコアでキーワードを抽出する。

        Args:
            texts: テキストのリスト
            top_n: 上位何件を返すか

        Returns:
            (キーワード, スコア) のリスト（スコア降順）
        """
        if not texts:
            return []

        # TF算出: 各テキストのトークン頻度
        tf_list: List[Counter] = []
        all_tokens: List[str] = []
        for text in texts:
            tokens = self.tokenize(text)
            tf_list.append(Counter(tokens))
            all_tokens.extend(tokens)

        # DF算出: 何件のテキストに出現したか
        df: Counter = Counter()
        for tf in tf_list:
            for token in tf.keys():
                df[token] += 1

        N = len(texts)
        tfidf_total: Dict[str, float] = defaultdict(float)

        for tf in tf_list:
            for token, count in tf.items():
                tf_val = count / max(sum(tf.values()), 1)
                idf_val = math.log((N + 1) / (df[token] + 1)) + 1.0
                tfidf_total[token] += tf_val * idf_val

        # スコア正規化 + トップN
        if not tfidf_total:
            return []
        max_score = max(tfidf_total.values())
        normalized = {k: v / max(max_score, 1e-9) for k, v in tfidf_total.items()}
        sorted_kw = sorted(normalized.items(), key=lambda x: x[1], reverse=True)
        return sorted_kw[:top_n]

    def compute_monetization_score(self, text: str) -> Dict[str, float]:
        """
        テキストから収益化可能性スコアを算出する。

        Args:
            text: 解析対象テキスト

        Returns:
            {money_word, purchase_intent, urgency, severity, total} の辞書 (0-100)
        """
        text_lower = text.lower()
        tokens = self.tokenize(text)

        def count_hits(category: str) -> int:
            return sum(1 for w in MONETIZATION_DICT[category] if w in text_lower)

        money_hits    = count_hits("money_word")
        purchase_hits = count_hits("purchase_intent")
        urgency_hits  = count_hits("urgency")
        severity_hits = count_hits("severity")

        money_score    = min(100.0, money_hits * 15)
        purchase_score = min(100.0, purchase_hits * 18)
        urgency_score  = min(100.0, urgency_hits * 20)
        severity_score = min(100.0, severity_hits * 12)

        total = (
            0.35 * money_score
            + 0.25 * purchase_score
            + 0.25 * urgency_score
            + 0.15 * severity_score
        )
        return {
            "money_word_score":     round(money_score, 2),
            "purchase_intent_score": round(purchase_score, 2),
            "urgency_score":        round(urgency_score, 2),
            "severity_score":       round(severity_score, 2),
            "total":                round(total, 2),
        }

    def classify_category(self, text: str) -> str:
        """
        テキストをカテゴリに分類する（キーワードルールベース）。

        Args:
            text: 分類対象テキスト

        Returns:
            カテゴリ名（マッチしない場合は "その他"）
        """
        text_lower = text.lower()
        scores: Dict[str, int] = {}
        for category, keywords in CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                scores[category] = score

        if not scores:
            return "その他"
        return max(scores, key=scores.__getitem__)

    def compute_dev_difficulty(self, text: str, category: str) -> float:
        """
        テキストとカテゴリから開発難易度スコアを算出する。

        Args:
            text: テキスト
            category: 分類済みカテゴリ名

        Returns:
            開発難易度スコア (0-100, 高いほど難しい)
        """
        text_lower = text.lower()

        # API依存スコア
        api_score = sum(
            v for kw, v in DEV_DIFFICULTY_KEYWORDS["api_dependency"].items()
            if kw in text_lower
        )
        api_score = min(100.0, api_score)

        # 法規制リスクスコア（カテゴリベース）
        legal_risk_categories = {"法律・税務": 80, "金融・投資": 70, "健康・医療": 75, "不動産・住宅": 50}
        legal_score = legal_risk_categories.get(category, 20)
        # テキスト中の高リスクキーワードでブースト
        legal_keyword_score = sum(
            v for kw, v in DEV_DIFFICULTY_KEYWORDS["legal_risk"].items()
            if kw in text_lower
        )
        legal_score = min(100.0, max(legal_score, legal_keyword_score))

        # AI必要性スコア
        ai_score = sum(
            v for kw, v in DEV_DIFFICULTY_KEYWORDS["ai_need"].items()
            if kw in text_lower
        )
        ai_score = min(100.0, ai_score)

        # データ依存スコア（固定ロジック）
        data_score = 30.0  # デフォルト中程度

        final = (
            0.30 * api_score
            + 0.20 * data_score
            + 0.25 * ai_score
            + 0.25 * legal_score
        )
        return round(final, 2)

    def estimate_competition_score(self, keywords: List[str]) -> Dict[str, float]:
        """
        キーワードリストから競合強度を推定する（ルールベース MVP版）。

        SerpAPI 無し: キーワード特性・カテゴリから推定
        将来: SerpAPI で実際の検索結果数を取得

        Args:
            keywords: テーマのトップキーワードリスト

        Returns:
            {search_volume, app_exists, ad_spend, total} の辞書 (0-100)
        """
        # 競合が多いカテゴリキーワード → 高スコア
        HIGH_COMPETITION_WORDS = {
            "ダイエット", "転職", "副業", "投資", "英語", "プログラミング",
            "結婚", "保険", "クレジットカード", "スマホ", "恋愛",
        }
        MEDIUM_COMPETITION_WORDS = {
            "育児", "料理", "旅行", "ペット", "節約", "読書",
        }
        LOW_COMPETITION_WORDS = {
            "特定の地域", "マニアック", "専門職", "高齢者向け",
        }

        keyword_set = set(keywords)
        high_hits   = len(keyword_set & HIGH_COMPETITION_WORDS)
        medium_hits = len(keyword_set & MEDIUM_COMPETITION_WORDS)

        search_score = min(100.0, high_hits * 25 + medium_hits * 15)
        app_score    = min(100.0, high_hits * 20 + medium_hits * 10)
        ad_score     = min(100.0, high_hits * 20)

        total = 0.5 * search_score + 0.3 * app_score + 0.2 * ad_score
        return {
            "search_volume_score": round(search_score, 2),
            "app_exists_score":    round(app_score, 2),
            "ad_spend_score":      round(ad_score, 2),
            "total":               round(total, 2),
        }

    def estimate_biz_models(self, category: str, keywords: List[str]) -> List[str]:
        """
        カテゴリ・キーワードから推定される収益化モデルを返す。

        Returns:
            推定ビジネスモデルのリスト
        """
        models: List[str] = []
        kw_set = set(keywords)

        # SaaS/アプリ課金
        if any(k in kw_set for k in ["管理", "記録", "追跡", "予約", "スケジュール"]):
            models.append("SaaS/アプリ課金")
        # 情報コンテンツ
        if category in ("副業・収入", "テクノロジー", "金融・投資", "転職・キャリア"):
            models.append("情報コンテンツ(有料note/教材)")
        # アフィリエイト
        if category in ("健康・医療", "ダイエット・美容", "ペット", "食・料理"):
            models.append("アフィリエイト")
        # 相談・コンサル
        if category in ("法律・税務", "金融・投資", "不動産・住宅", "メンタルヘルス"):
            models.append("コンサルティング/相談")
        # マッチング
        if any(k in kw_set for k in ["探す", "見つける", "紹介", "マッチング"]):
            models.append("マッチングプラットフォーム")

        return models if models else ["情報コンテンツ(有料note/教材)"]
