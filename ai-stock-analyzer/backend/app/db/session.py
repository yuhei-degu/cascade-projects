"""
データベースセッション・接続管理モジュール

SQLAlchemy async セッションファクトリと接続プールを設定する。
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


# ── エンジン作成 ─────────────────────────────────────────────────
engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.DEBUG,         # DEBUG時はSQL文をログ出力
    pool_size=10,                # 接続プールサイズ
    max_overflow=20,             # プール超過時の追加接続数
    pool_pre_ping=True,          # 接続前にpingして死活確認
)

# ── セッションファクトリ ─────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,      # コミット後もオブジェクトを有効に保つ
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """全モデルの基底クラス"""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI依存性注入用のDBセッションジェネレーター

    使用例:
        @router.get("/companies")
        async def get_companies(db: AsyncSession = Depends(get_db)):
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
