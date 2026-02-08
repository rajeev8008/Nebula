import pytest
from fastapi.testclient import TestClient
import numpy as np

# Import after conftest sets up mocks
from backend.main import app, model, index

client = TestClient(app)

class TestRootEndpoint:
    def test_root_returns_welcome_message(self):
        """Test root endpoint returns correct message"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Nebula" in data["message"]

class TestSearchEndpoint:
    def test_search_endpoint_exists(self):
        """Test search endpoint exists (integration test - skipped)"""
        # TODO: Add proper integration tests when API is stable
        pass

class TestGraphEndpoint:
    def test_graph_endpoint_exists(self):
        """Test graph endpoint exists (integration test - skipped)"""
        # TODO: Add proper integration tests when API is stable
        pass

class TestCORSMiddleware:
    def test_cors_headers_present(self):
        """Test CORS headers are set correctly"""
        response = client.get("/", headers={"Origin": "http://localhost:3000"})
        assert response.status_code == 200
        # CORS headers should be present
        assert response.headers.get("access-control-allow-origin") is not None

class TestHealthCheck:
    def test_app_initializes(self):
        """Test app can initialize without errors"""
        assert app is not None
        assert app.title == "Nebula API"
