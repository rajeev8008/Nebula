"""
backend/database.py
-------------------
Async database engine (PostgreSQL via asyncpg) and Redis connection pool.

Usage in FastAPI endpoints:
    from backend.database import get_db, get_redis

    @app.get("/example")
    async def example(db: AsyncSession = Depends(get_db)):
        ...
"""

import os
from typing import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

import redis.asyncio as aioredis

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
load_dotenv()

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://nebula:nebula_secret@localhost:5432/nebula_db",
)

REDIS_URL: str = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379/0",
)

# ---------------------------------------------------------------------------
# SQLAlchemy Async Engine & Session
# ---------------------------------------------------------------------------
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ---------------------------------------------------------------------------
# Declarative Base (shared by all models)
# ---------------------------------------------------------------------------
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""
    pass


# ---------------------------------------------------------------------------
# Redis Connection Pool
# ---------------------------------------------------------------------------
redis_pool = aioredis.ConnectionPool.from_url(
    REDIS_URL,
    max_connections=20,
    decode_responses=True,
)


def get_redis() -> aioredis.Redis:
    """Return a Redis client backed by the shared connection pool."""
    return aioredis.Redis(connection_pool=redis_pool)
