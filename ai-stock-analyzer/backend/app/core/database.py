"""
データベース接続・セッション管理
SQLAlchemy 2.0 非同期エンジン使用
"""
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────
# SQLAlchemy 非同期エンジン
# ─────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,          # 接続死活確認
    pool_size=10,                 # 接続プールサイズ
    max_overflow=20,              # 最大オーバーフロー接続数
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,       # コミット後もオブジェクト参照可能に
)


class Base(DeclarativeBase):
    """全モデルの基底クラス"""
    pass


async def init_db() -> None:
    """
    アプリ起動時にDBテーブルを作成する。
    本番環境では Alembic マイグレーションを使用すること。
    """
    # モデルを先にインポートしてBaseに登録する
    from app.models import company, financial, patent, score  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables created/verified")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI依存性注入用のDBセッションジェネレータ。
    リクエストごとにセッションを作成し、終了時に自動クローズ。

    Usage:
        @router.get("/example")
        async def example(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
