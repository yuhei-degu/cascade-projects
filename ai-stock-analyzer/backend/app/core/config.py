"""
アプリケーション設定管理モジュール

環境変数から設定値を読み込み、Pydantic BaseSettings で型安全に管理する。
.env ファイルまたは環境変数から自動読み込み。
"""

from functools import lru_cache
from typing import List

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """アプリケーション全設定クラス"""

    # ── アプリ基本設定 ──────────────────────────────────────────
    APP_NAME: str = "AI Stock Analyzer"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production)$")

    # ── データベース ────────────────────────────────────────────
    DATABASE_URL: PostgresDsn = Field(
        default="postgresql+asyncpg://postgres:password@localhost:5432/ai_stock_db",
        description="PostgreSQL接続文字列 (asyncpg ドライバ使用)"
    )

    # ── Redis (キャッシュ) ──────────────────────────────────────
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redisキャッシュ接続文字列"
    )
    CACHE_TTL_SECONDS: int = 3600  # 1時間

    # ── 外部APIキー ─────────────────────────────────────────────
    # Yahoo Finance は公開API (キー不要) だが将来有料プラン対応
    RAPIDAPI_KEY: str = Field(default="", description="RapidAPI キー（Yahoo Finance Pro）")
    # SEC EDGAR は公開API だがUser-Agent必須
    SEC_USER_AGENT: str = Field(
        default="AIStockAnalyzer admin@example.com",
        description="SEC EDGAR APIのUser-Agent（メールアドレス必須）"
    )
    # USPTO Open Data API
    USPTO_API_KEY: str = Field(default="", description="USPTO Open Data API キー")

    # ── NLPモデル設定 ───────────────────────────────────────────
    FINBERT_MODEL: str = "ProsusAI/finbert"
    SCIBERT_MODEL: str = "allenai/scibert_scivocab_uncased"
    NLP_BATCH_SIZE: int = 16
    NLP_MAX_LENGTH: int = 512
    NLP_DEVICE: str = "cpu"  # "cuda" for GPU

    # ── スコアリング設定 ────────────────────────────────────────
    MIN_MARKET_CAP_USD: int = 1_000_000_000   # $1B 以上
    MAX_RANKING_SIZE: int = 20
    SCORE_MODEL_VERSION: str = "v1.0"

    # ── CORS ───────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://ai-stock-analyzer.vercel.app"]

    # ── スケジューラー ──────────────────────────────────────────
    BATCH_CRON_UTC: str = "0 6 * * *"  # 毎日 UTC 06:00

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        """環境変数からCORSオリジンをリストとして解析"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "case_sensitive": True}


@lru_cache
def get_settings() -> Settings:
    """設定シングルトンを返す（LRUキャッシュで1回のみインスタンス化）"""
    return Settings()


# グローバルアクセス用エイリアス
settings = get_settings()
