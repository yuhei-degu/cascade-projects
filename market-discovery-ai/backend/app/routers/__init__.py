# routers/__init__.py — ルーターを misc.py からエクスポート

from app.routers.misc import categories, posts, analyze, health

__all__ = ["categories", "posts", "analyze", "health"]
