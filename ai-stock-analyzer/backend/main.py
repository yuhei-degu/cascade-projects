"""
AI Stock Analyzer — FastAPI エントリーポイント
アプリケーション起動・ルーター登録・起動イベント処理
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import init_db
from app.routers import ranking, companies, analyze, health

# ─────────────────────────────────────────
# ロギング設定
# ─────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリ起動・停止時のライフサイクル処理"""
    logger.info("🚀 AI Stock Analyzer starting up...")
    await init_db()
    logger.info("✅ Database initialized")
    yield
    logger.info("🛑 AI Stock Analyzer shutting down...")


# ─────────────────────────────────────────
# FastAPI アプリ定義
# ─────────────────────────────────────────
app = FastAPI(
    title="AI Stock Analyzer API",
    description="AI技術保有企業の割安分析APIサーバー",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS設定（フロントエンドからのアクセスを許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーター登録
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(ranking.router, prefix="/api/v1", tags=["ranking"])
app.include_router(companies.router, prefix="/api/v1", tags=["companies"])
app.include_router(analyze.router, prefix="/api/v1", tags=["analyze"])


@app.get("/")
async def root() -> dict:
    """ルートエンドポイント"""
    return {"message": "AI Stock Analyzer API v1.0.0", "docs": "/docs"}
