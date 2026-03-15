"""
backend/cache.py
----------------
Query-string-based semantic caching layer using Redis + orjson.

Normalises the incoming query (lowercase, strip whitespace) and hashes
it with SHA-256 to produce a deterministic Redis key.  All Redis
operations are wrapped in try/except for **graceful degradation** — if
Redis is down the app treats every call as a cache miss and continues
to function normally.

Usage:
    from backend.cache import get_cached_search, set_cached_search

    cached = await get_cached_search("sad robots")
    if cached is not None:
        return cached          # cache hit

    results = run_search(...)
    await set_cached_search("sad robots", results)
"""

import hashlib
import logging

import orjson
import redis.asyncio as aioredis

from backend.database import get_redis

logger = logging.getLogger(__name__)

# Default time-to-live for cached results (seconds)
DEFAULT_TTL: int = 3600  # 1 hour
CACHE_KEY_PREFIX: str = "nebula:search_cache:"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalise_key(query: str) -> str:
    """
    Produce a deterministic Redis key from a raw user query.

    Steps: lowercase → strip whitespace → SHA-256 hash.
    This ensures that "Sad Robots", "  sad robots  ", and "SAD ROBOTS"
    all resolve to the same cache entry.
    """
    normalised = query.lower().strip()
    return CACHE_KEY_PREFIX + hashlib.sha256(
        normalised.encode("utf-8")
    ).hexdigest()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_cached_search(query: str) -> dict | None:
    """
    Look up cached search results for *query*.

    Returns the cached response dict on a hit, or ``None`` on a miss.
    If Redis is unreachable the exception is swallowed and ``None``
    is returned so the search endpoint falls through to live results.
    """
    redis: aioredis.Redis = get_redis()
    try:
        raw: bytes | None = await redis.get(_normalise_key(query))
        if raw is not None:
            return orjson.loads(raw)
        return None
    except Exception as exc:
        logger.warning("Redis GET failed (treating as cache miss): %s", exc)
        return None


async def set_cached_search(
    query: str,
    data: dict,
    ttl: int = DEFAULT_TTL,
) -> None:
    """
    Store *data* in Redis keyed by the normalised *query* hash.

    Uses ``orjson.dumps`` for fast serialisation. If Redis is
    unreachable the write is silently skipped — the next request will
    simply re-compute the results.
    """
    redis: aioredis.Redis = get_redis()
    try:
        await redis.set(
            _normalise_key(query),
            orjson.dumps(data),
            ex=ttl,
        )
    except Exception as exc:
        logger.warning("Redis SET failed (skipping cache write): %s", exc)
