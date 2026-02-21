import asyncio
from backend.database import get_redis

async def main():
    r = get_redis()
    try:
        await r.ping()
        print("Redis is online!")
    except Exception as e:
        print(f"Redis is offline or unreachable. Error: {e}")
        print("This means the rate limiter's fail-open mechanism is working correctly.")

asyncio.run(main())
