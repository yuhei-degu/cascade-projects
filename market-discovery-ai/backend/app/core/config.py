"""
アプリケーション設定管理 — 環境変数 → Pydantic BaseSettings
"""
from functools import lru_cache
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Market Discovery AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development")

    # DB
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:password@localhost:5432/market_discovery_db"
    )

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    CACHE_TTL_RANKING: int = 3600    # ランキングキャッシュ 1h
    CACHE_TTL_CATEGORY: int = 21600  # カテゴリキャッシュ 6h

    # NLP
    BERT_MODEL: str = "cl-tohoku/bert-base-japanese-v3"
    SBERT_MODEL: str = "sonoisa/sentence-bert-base-ja-mean-tokens-v2"
    NLP_DEVICE: str = "cpu"  # "cuda" for GPU
    NLP_BATCH_SIZE: int = 8

    # Crawler設定
    CRAWLER_USER_AGENT: str = "MarketDiscoveryAI/1.0 +https://github.com/yourname/market-discovery-ai"
    CRAWLER_DELAY_SECONDS: float = 3.0   # robots.txt 準拠のウェイト
    CRAWLER_MAX_PAGES: int = 50          # 1回のクロールで取得する最大ページ数

    # SerpAPI (競合調査 - オプション)
    SERPAPI_KEY: str = Field(default="", description="SerpAPI キー (競合調査)")

    # スコアリング重み
    WEIGHT_DEMAND: float = 0.40
    WEIGHT_MONETIZATION: float = 0.30
    WEIGHT_COMPETITION: float = 0.20
    WEIGHT_DEV_DIFFICULTY: float = 0.10

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Scheduler
    BATCH_INTERVAL_MINUTES: int = 60

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
