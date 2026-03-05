"""
⑨ バックエンドメイン — FastAPI エントリーポイント

AI Stock Analyzer - メインアプリケーションファイル
FastAPI インスタンスの初期化・ミドルウェア・ルーター登録を行う
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.routers import companies, health, analyze

# 構造化ログの設定
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """アプリケーションのライフサイクル管理（起動・シャットダウン処理）"""
    # 起動時: DBテーブル作成
    logger.info("Starting AI Stock Analyzer API", version=settings.APP_VERSION)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized")

    yield  # アプリケーション実行中

    # シャットダウン時
    logger.info("Shutting down AI Stock Analyzer API")
    await engine.dispose()


def create_app() -> FastAPI:
    """FastAPIアプリケーションインスタンスを生成して返す"""
    app = FastAPI(
        title="AI Stock Analyzer API",
        description=(
            "AI関連企業の技術力・成長性・収益性を統合スコアリングし、"
            "市場に割安放置されている企業をランキング表示するAPI"
        ),
        version=settings.APP_VERSION,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── ミドルウェア ────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    # ── ルーター登録 ────────────────────────────────────────────
    app.include_router(health.router, prefix="/api/v1", tags=["Health"])
    app.include_router(companies.router, prefix="/api/v1", tags=["Companies"])
    app.include_router(analyze.router, prefix="/api/v1", tags=["Analysis"])

    return app


app = create_app()
