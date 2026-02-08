import sys
from pathlib import Path
import os

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Set environment variables for tests
os.environ['TESTING'] = 'true'
os.environ['PINECONE_API_KEY'] = 'test-pinecone-key-placeholder'
os.environ['TMDB_API_KEY'] = 'test-tmdb-key-placeholder'
