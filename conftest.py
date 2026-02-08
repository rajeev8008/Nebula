import sys
from pathlib import Path
from unittest.mock import MagicMock, patch
import numpy as np
import os

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Set environment variables FIRST before any backend imports
os.environ['PINECONE_API_KEY'] = 'test-pinecone-key'
os.environ['TMDB_API_KEY'] = 'test-tmdb-key'

# Create mock objects
mock_model = MagicMock()
mock_model.encode.return_value = np.array([0.1] * 384)

mock_index = MagicMock()
mock_index.query.return_value = {'matches': []}

mock_pinecone_instance = MagicMock()
mock_pinecone_instance.Index.return_value = mock_index

# Start patching IMMEDIATELY before any backend imports
sentence_transformer_patcher = patch('sentence_transformers.SentenceTransformer', return_value=mock_model)
pinecone_patcher = patch('pinecone.Pinecone', return_value=mock_pinecone_instance)

sentence_transformer_patcher.start()
pinecone_patcher.start()

def pytest_unconfigure(config):
    """Stop patching after all tests"""
    sentence_transformer_patcher.stop()
    pinecone_patcher.stop()
