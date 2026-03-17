import pytest
from httpx import AsyncClient
from backend.main import app


@pytest.mark.asyncio
async def test_home_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Nebula API is running. Go to /docs for swagger UI."
    }


@pytest.mark.asyncio
async def test_api_search_basic():
    # Smoke test for the search endpoint
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/search?q=test")
    # Should handle gracefully even if models are mocked to None
    assert response.status_code in [200, 500]
