import os
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone

# 1. Load Environment Variables
load_dotenv()
PINECONE_KEY = os.getenv("PINECONE_API_KEY")

# 2. Initialize App
app = FastAPI(title="Nebula API", description="Semantic Search Engine for Movies")

# 3. Enable CORS (Critical for connecting React to Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Load AI Model & DB (Runs once on startup, skip in tests)
if os.getenv('TESTING') != 'true':
    print("Loading Model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    pc = Pinecone(api_key=PINECONE_KEY)
    index = pc.Index("nebula-index")
else:
    # In test mode, use None (mocked in actual tests if needed)
    model = None
    pc = None
    index = None

# --- Data Models ---
class SearchRequest(BaseModel):
    query: str
    top_k: int = 20

class MovieResponse(BaseModel):
    id: str
    score: float
    title: str
    poster: Optional[str] = None
    overview: Optional[str] = None
    rating: float

# --- Endpoints ---

@app.get("/")
def home():
    return {"message": "Nebula API is running. Go to /docs for swagger UI."}

@app.post("/search")
def search_movies(req: SearchRequest):
    """
    Takes a user query (e.g., "sad robots"), converts to vector, 
    and finds matching movies in Pinecone.
    Returns a graph structure (nodes + links) instead of just a list.
    """
    try:
        # 1. Convert text to numbers
        query_vector = model.encode(req.query).tolist()
        
        # 2. Query Pinecone with vectors for similarity calculation
        results = index.query(
            vector=query_vector, 
            top_k=req.top_k, 
            include_metadata=True,
            include_values=True  # CRITICAL: Need vectors to calculate links
        )
        
        # 3. Build nodes and collect vectors
        nodes = []
        vectors = []
        id_map = {}
        
        for i, match in enumerate(results.matches):
            nodes.append({
                "id": match.id,
                "title": match.metadata.get("title", "Unknown"),
                "poster": match.metadata.get("poster_path", ""),
                "overview": match.metadata.get("overview", ""),
                "score": float(match.score),
                "rating": match.metadata.get("rating", 0.0),
                "val": match.metadata.get("rating", 5.0) * 2,  # Node size
                "genres": match.metadata.get("genres", "Unknown"),
                "release_date": match.metadata.get("release_date", "Unknown"),
                "language": match.metadata.get("original_language", "en"),
                "popularity": match.metadata.get("popularity", 0.0),
                "isSearchResult": True,
                "relevanceRank": i + 1
            })
            vectors.append(match.values)
            id_map[i] = match.id
        
        # 4. Calculate similarity between search results to create links
        links = []
        if len(vectors) > 1:
            vec_matrix = np.array(vectors)
            sim_matrix = cosine_similarity(vec_matrix)
            
            # Create links for highly similar search results
            threshold = 0.5  # Higher threshold for search results
            rows, cols = sim_matrix.shape
            for i in range(rows):
                for j in range(i + 1, cols):
                    score = sim_matrix[i][j]
                    if score > threshold:
                        links.append({
                            "source": id_map[i],
                            "target": id_map[j],
                            "value": float(score),
                            "similarity": float(score)
                        })
        
        return {
            "nodes": nodes,
            "links": links,
            "query": req.query,
            "totalResults": len(nodes)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/movies")
def get_movies():
    """
    Unified endpoint that returns a flat list of movies with all metadata.
    Frontend handles both graph construction and browse categorization.
    """
    try:
        # Fetch top 250 movies with full metadata
        dummy_vec = [0.1] * 384
        results = index.query(
            vector=dummy_vec,
            top_k=250,
            include_metadata=True,
            include_values=True  # Include vectors for graph construction
        )
        
        # Format movies with all necessary data
        movies = []
        for match in results.matches:
            movies.append({
                "id": match.id,
                "title": match.metadata.get("title", "Unknown"),
                "poster": match.metadata.get("poster_path", ""),
                "overview": match.metadata.get("overview", ""),
                "rating": match.metadata.get("rating", 0.0),
                "genres": match.metadata.get("genres", "Unknown"),
                "release_date": match.metadata.get("release_date", "Unknown"),
                "language": match.metadata.get("original_language", "en"),
                "popularity": match.metadata.get("popularity", 0.0),
                "vector": match.values  # For graph similarity calculation
            })
        
        print(f"Movies endpoint: returned {len(movies)} movies")
        return {"movies": movies, "total": len(movies)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Keep legacy endpoints for backwards compatibility during transition
@app.get("/graph")
def get_graph_data():
    """
    Legacy endpoint - redirects to /movies.
    Graph construction now handled by frontend.
    """
    return get_movies()

@app.get("/browse")
def browse_movies():
    """
    Legacy endpoint - redirects to /movies.
    Categorization now handled by frontend.
    """
    return get_movies()