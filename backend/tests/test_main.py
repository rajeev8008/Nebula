import pytest
from httpx import AsyncClient
from backend.main import app
import os

@pytest.mark.asyncio
async def test_home_endpoint():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Nebula API is running. Go to /docs for swagger UI."}

@pytest.mark.asyncio
async def test_watchlist_protected():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/watchlist")
    # Should be 403 or 401 because no token provided
    assert response.status_code in [401, 403]

@pytest.mark.asyncio
async def test_recommendation_state_protected():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/recommendations/state")
    assert response.status_code in [401, 403]
