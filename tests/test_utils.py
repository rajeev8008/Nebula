"""
Unit tests for utility functions (when we add them)
"""
import pytest
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class TestCosineSimilarity:
    def test_identical_vectors_return_1(self):
        """Test that identical vectors have similarity of 1"""
        vec1 = np.array([[1, 2, 3, 4, 5]])
        vec2 = np.array([[1, 2, 3, 4, 5]])
        similarity = cosine_similarity(vec1, vec2)[0][0]
        assert similarity == pytest.approx(1.0, abs=0.001)
    
    def test_orthogonal_vectors_return_0(self):
        """Test that orthogonal vectors have similarity of 0"""
        vec1 = np.array([[1, 0]])
        vec2 = np.array([[0, 1]])
        similarity = cosine_similarity(vec1, vec2)[0][0]
        assert similarity == pytest.approx(0.0, abs=0.001)
    
    def test_opposite_vectors_return_negative_1(self):
        """Test that opposite vectors have similarity of -1"""
        vec1 = np.array([[1, 2, 3]])
        vec2 = np.array([[-1, -2, -3]])
        similarity = cosine_similarity(vec1, vec2)[0][0]
        assert similarity == pytest.approx(-1.0, abs=0.001)
