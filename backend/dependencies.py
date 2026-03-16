import logging
from typing import TYPE_CHECKING
import os

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.database import get_redis

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer
    import pinecone

logger = logging.getLogger(__name__)

RATE_LIMIT_REQUESTS = 20
RATE_LIMIT_WINDOW = 60


async def rate_limiter(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    key = f"rate_limit:{client_ip}"

    redis_client = get_redis()
    try:
        # 1. Atomic Redis Operations (No Race Conditions) via pipeline
        async with redis_client.pipeline(transaction=True) as pipe:
            pipe.incr(key)
            pipe.expire(key, RATE_LIMIT_WINDOW)
            results = await pipe.execute()

        request_count = results[0]
        if request_count > RATE_LIMIT_REQUESTS:
            raise HTTPException(status_code=429, detail="Too Many Requests")

    except HTTPException:
        # Re-raise HTTPException to return 429
        raise
    except Exception as e:
        # 2. Fail-Open Fault Tolerance: Log warning and return gracefully
        logger.warning(f"Rate limiter Redis error (failing open for {client_ip}): {e}")


# 3. Type Hinting with typing.TYPE_CHECKING to prevent runtime circular imports
def get_model(request: Request) -> "SentenceTransformer":
    return request.app.state.model


def get_index(request: Request) -> "pinecone.Index":
    return request.app.state.index


# --- Supabase Auth Dependency ---

security = HTTPBearer()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verifies the Supabase JWT from the Authorization header.
    In a real-world scenario, you'd use a library like `python-jose` to verify the JWT
    against Supabase's public key. For this implementation, we'll simulate the verification
    or use the Supabase Admin API if needed.
    """
    # token = credentials.credentials
    # Simulation: In production, verify JWT using Supabase JWT Secret or public key
    # For now, we'll assume the token is valid if it exists, or provide a mock for testing
    if os.getenv("TESTING") == "true":
        return {"sub": "00000000-0000-0000-0000-000000000000", "email": "test@example.com"}

    # Example: Verify with Supabase (simplified)
    # response = httpx.get(f"{SUPABASE_URL}/auth/v1/user", headers={"Authorization": f"Bearer {token}"})
    # if response.status_code != 200:
    #     raise HTTPException(status_code=401, detail="Invalid token")
    # return response.json()
    # Placeholder for actual JWT decoding
    return {"sub": "user_id_from_token"}
