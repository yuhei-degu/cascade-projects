import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.routers.themes import router

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_log_level,
        structlog.processors.JSONRenderer(),
    ]
)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Market Discovery AI API",
        description="Research-backed market opportunity ranking API for AI-assisted product development.",
        version=settings.APP_VERSION,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    app.include_router(router, prefix="/api/v1", tags=["Market Discovery"])
    return app


app = create_app()
