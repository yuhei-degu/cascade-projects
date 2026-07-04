from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Market Discovery AI"
    APP_VERSION: str = "0.2.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/market_discovery_db"
    REDIS_URL: str = "redis://localhost:6379/0"
    ANTHROPIC_API_KEY: str = ""
    SERPAPI_KEY: str = ""

    CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["http://localhost:3000", "http://localhost:3001"])

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
