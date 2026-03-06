"""
⑫ FastAPI メインアプリ — エントリーポイント
"""
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.db.session import engine
from app.models.models import Base
from app.routers.themes import router

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
    logger.info("Starting Market Discovery AI", version=settings.APP_VERSION)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("DB initialized")
    yield
    logger.info("Shutting down")
    await engine.dispose()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Market Discovery AI API",
        description="Q&A投稿から収益化テーマを発掘する「個人が勝てる市場発見エンジン」",
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.include_router(router, prefix="/api/v1", tags=["Themes"])
    return app


app = create_app()
