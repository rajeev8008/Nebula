"""
backend/cache.py
----------------
Semantic caching layer using Redis.

Provides utilities to check for and store cached search results keyed
by a hash of the query embedding vector.  This avoids redundant calls
to the Pinecone vector database for near-identical queries.

Usage:
    from backend.cache import check_semantic_cache, set_semantic_cache

    cached = await check_semantic_cache(query_embedding)
    if cached is not None:
        return cached  # cache hit

    results = await pinecone_search(...)
    await set_semantic_cache(query_embedding, results)
"""

import json
import hashlib
from typing import Any

from backend.database import get_redis

# Default time-to-live for cached results (seconds)
DEFAULT_TTL: int = 3600  # 1 hour
CACHE_KEY_PREFIX: str = "nebula:semantic_cache:"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _hash_embedding(embedding: list[float]) -> str:
    """
    Deterministically hash a float embedding vector into a cache key.

    Current implementation: SHA-256 of the rounded, serialised vector.

    TODO: Replace with a locality-sensitive hash (e.g. SimHash or random
          hyperplane projection) so that *similar* embeddings also hit the
          cache.  The current exact-match hash only deduplicates identical
          queries.
    """
    # Round to 6 decimal places to absorb trivial floating-point jitter
    rounded = [round(v, 6) for v in embedding]
    raw = json.dumps(rounded, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def check_semantic_cache(
    query_embedding: list[float],
) -> list[dict[str, Any]] | None:
    """
    Look up the cache for a previous result matching this embedding.

    Returns:
        The cached list of result dicts, or ``None`` on a cache miss.
    """
    redis = get_redis()
    try:
        key = CACHE_KEY_PREFIX + _hash_embedding(query_embedding)
        cached_raw = await redis.get(key)
        if cached_raw is not None:
            return json.loads(cached_raw)
        return None
    finally:
        await redis.aclose()


async def set_semantic_cache(
    query_embedding: list[float],
    results: list[dict[str, Any]],
    ttl: int = DEFAULT_TTL,
) -> None:
    """
    Store search results in the cache keyed by the embedding hash.

    Args:
        query_embedding: The float vector used for the search.
        results:         The list of result dicts to cache.
        ttl:             Time-to-live in seconds (default 1 hour).
    """
    redis = get_redis()
    try:
        key = CACHE_KEY_PREFIX + _hash_embedding(query_embedding)
        await redis.set(key, json.dumps(results), ex=ttl)
    finally:
        await redis.aclose()
