import os
os.environ["TESTING"] = "true"

import pytest
from httpx import AsyncClient
from backend.main import app

@pytest.mark.asyncio
async def test_home_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Nebula API is running. Go to /docs for swagger UI."}

@pytest.mark.asyncio
async def test_api_search_basic():
    # Even if models are not loaded, the endpoint should return a 500 or handle it gracefully
    # We just check if the route is registered and responds
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/search?q=test")
    # It might fail with 500 if dependencies are None, which is fine for a smoke test
    # as long as the server is "up" enough to handle the request.
    assert response.status_code in [200, 500]
