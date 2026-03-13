import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
import numpy as np
import os

os.environ["TESTING"] = "true"

from backend.main import app

client = TestClient(app)

class MockMatch:
    def __init__(self, id_val, score, metadata, values=None):
        self.id = id_val
        self.score = score
        self.metadata = metadata
        self.values = values or [0.1] * 384

class MockQueryResponse:
    def __init__(self, matches):
        self.matches = matches

def test_browse_valid(mocker):
    """
    Test /browse endpoint remains untouched and fully functional.
    In the current codebase, /browse redirects to /movies.
    """
    mock_index = MagicMock()
    mock_matches = [
        MockMatch(
            "1", 0.95,
            {"title": "Test Movie", "poster_path": "/test.jpg"}
        )
    ]
    mock_index.query.return_value = MockQueryResponse(mock_matches)
    
    # We attached index to app.state in main.py
    app.state.index = mock_index
    
    async def mock_to_thread(func, *args, **kwargs):
        if func == mock_index.query:
            return mock_index.query(*args, **kwargs)
        if "cosine_similarity" in str(func):
            return np.array([[1.0]])
        return func(*args, **kwargs)
        
    mocker.patch("asyncio.to_thread", new=mock_to_thread)

    response = client.get("/browse")
    assert response.status_code == 200

def test_api_search_pagination_and_sorting(mocker):
    """
    Test /api/search which actually handles pagination and filtering.
    """
    mock_model = MagicMock()
    mock_model.encode.return_value = [0.1] * 384
    app.state.model = mock_model
    
    mock_index = MagicMock()
    mock_matches = [
        MockMatch(str(i), 0.9, {"title": f"Movie {i}", "poster_path": "/test.jpg", "rating": 8.0})
        for i in range(25)
    ]
    mock_index.query.return_value = MockQueryResponse(mock_matches)
    app.state.index = mock_index

    # It's synchronous in /api/search, no to_thread mocking needed there,
    # except the endpoint actually uses index.query directly.

    # Page 1
    response = client.get("/api/search?page=1&limit=10&rating=7.0")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["limit"] == 10
    assert len(data["movies"]) == 10
    assert data["hasMore"] is True

    # Page 3
    response2 = client.get("/api/search?page=3&limit=10")
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["page"] == 3
    assert len(data2["movies"]) == 5
    assert data2["hasMore"] is False
