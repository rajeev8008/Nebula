import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock
import numpy as np

# We mock dependencies before importing main to prevent actual model loads if any
import os
os.environ["TESTING"] = "true"

from backend.main import app

client = TestClient(app)

# Helper mock classes for Pinecone responses
class MockMatch:
    def __init__(self, id_val, score, metadata, values=None):
        self.id = id_val
        self.score = score
        self.metadata = metadata
        self.values = values or [0.1] * 384

class MockQueryResponse:
    def __init__(self, matches):
        self.matches = matches

def test_engine_search_valid(mocker):
    # Mock the SentenceTransformer model
    mock_model = MagicMock()
    mock_model.encode.return_value = [0.1] * 384
    app.dependency_overrides[app.state.model] = lambda: mock_model
    
    # Mock Pinecone index
    mock_index = MagicMock()
    mock_matches = [
        MockMatch(
            "1", 0.95,
            {
                "title": "Test Movie",
                "poster_path": "/test.jpg",
                "release_date": "2023-01-01",
                "overview": "Test overview",
                "rating": 8.0,
                "genres": "Action",
                "original_language": "en",
                "popularity": 100.0,
                "vote_count": 500
            }
        )
    ]
    mock_index.query.return_value = MockQueryResponse(mock_matches)
    
    # Override get_model and get_index if they are used as dependencies
    from backend.dependencies import get_model, get_index
    app.dependency_overrides[get_model] = lambda: mock_model
    app.dependency_overrides[get_index] = lambda: mock_index

    # Use monkeypatch/mocker if asyncio.to_thread is used
    async def mock_to_thread(func, *args, **kwargs):
        if func == mock_index.query:
            return mock_index.query(*args, **kwargs)
        if hasattr(mock_model, 'encode') and getattr(func, '__name__', '') == 'encode':
            return mock_model.encode(*args, **kwargs)
        if func == getattr(mock_model, 'encode', None):
            return mock_model.encode(*args, **kwargs)
        return func(*args, **kwargs)
        
    mocker.patch("asyncio.to_thread", new=mock_to_thread)

    response = client.post("/engine/search", json={"query": "test query"})
    
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    results = data["results"]
    assert isinstance(results, list)
    
    if len(results) > 0:
        first = results[0]
        # Assert required fields mapped according to backend logic
        assert "id" in first
        assert "title" in first
        assert "poster" in first
        assert "release_date" in first  # Corresponds to year
        assert "overview" in first
        assert "score" in first         # Corresponds to similarity_score

def test_engine_search_missing_query():
    response = client.post("/engine/search", json={})
    assert response.status_code == 422

def test_engine_search_no_results(mocker):
    mock_model = MagicMock()
    mock_model.encode.return_value = [0.1] * 384
    
    mock_index = MagicMock()
    mock_index.query.return_value = MockQueryResponse([])
    
    from backend.dependencies import get_model, get_index
    app.dependency_overrides[get_model] = lambda: mock_model
    app.dependency_overrides[get_index] = lambda: mock_index
    
    async def mock_to_thread(func, *args, **kwargs):
        if func == mock_index.query:
            return mock_index.query(*args, **kwargs)
        if func == mock_model.encode:
            return mock_model.encode(*args, **kwargs)
        return func(*args, **kwargs)
        
    mocker.patch("asyncio.to_thread", new=mock_to_thread)

    response = client.post("/engine/search", json={"query": "unknown query"})
    assert response.status_code == 200
    assert response.json()["results"] == []

def test_engine_similar_valid(mocker):
    mock_index = MagicMock()
    
    # Mocking two calls to index.query: one for ID, one for vector
    seed_match = MockMatch("1", 1.0, {"title": "Seed Movie", "poster_path": "x.jpg"})
    neighbor_match = MockMatch("2", 0.9, {"title": "Neighbor Movie", "poster_path": "y.jpg"})
    
    def mock_query(*args, **kwargs):
        if "id" in kwargs:
            return MockQueryResponse([seed_match])
        else:
            return MockQueryResponse([seed_match, neighbor_match])
            
    mock_index.query.side_effect = mock_query
    
    from backend.dependencies import get_index
    app.dependency_overrides[get_index] = lambda: mock_index
    
    async def mock_to_thread(func, *args, **kwargs):
        if func == mock_index.query:
            return mock_index.query(*args, **kwargs)
        # Mock cosine similarity
        if "cosine_similarity" in str(func):
            return np.array([[1.0, 0.9], [0.9, 1.0]])
        return func(*args, **kwargs)
        
    mocker.patch("asyncio.to_thread", new=mock_to_thread)

    response = client.get("/engine/similar/1")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "links" in data
    assert isinstance(data["nodes"], list)
    assert isinstance(data["links"], list)

def test_engine_similar_not_found(mocker):
    mock_index = MagicMock()
    
    def mock_query(*args, **kwargs):
        return MockQueryResponse([])
            
    mock_index.query.side_effect = mock_query
    
    from backend.dependencies import get_index
    app.dependency_overrides[get_index] = lambda: mock_index
    
    async def mock_to_thread(func, *args, **kwargs):
        if func == mock_index.query:
            return mock_index.query(*args, **kwargs)
        return func(*args, **kwargs)
        
    mocker.patch("asyncio.to_thread", new=mock_to_thread)

    response = client.get("/engine/similar/999")
    assert response.status_code == 404
