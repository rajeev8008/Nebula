import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
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
    allow_origins=["*"], # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Load AI Model & DB (Runs once on startup)
print("Loading Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
pc = Pinecone(api_key=PINECONE_KEY)
index = pc.Index("nebula-index")

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

@app.post("/search", response_model=List[MovieResponse])
def search_movies(req: SearchRequest):
    """
    Takes a user query (e.g., "sad robots"), converts to vector, 
    and finds matching movies in Pinecone.
    """
    try:
        # 1. Convert text to numbers
        query_vector = model.encode(req.query).tolist()
        
        # 2. Query Pinecone
        results = index.query(
            vector=query_vector, 
            top_k=req.top_k, 
            include_metadata=True
        )
        
        # 3. Format response
        movies = []
        for match in results.matches:
            movies.append({
                "id": match.id,
                "score": match.score,
                "title": match.metadata.get("title", "Unknown"),
                "poster": match.metadata.get("poster_path", ""),
                "overview": match.metadata.get("overview", ""),
                "rating": match.metadata.get("rating", 0.0)
            })
            
        return movies
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph")
def get_graph_data():
    """
    Fetches random nodes to populate the 3D graph initially.
    (Pinecone doesn't support 'get all', so we fetch by a dummy vector)
    """
    # Dummy query to get a spread of movies
    dummy_vec = [0.1] * 384 
    results = index.query(vector=dummy_vec, top_k=100, include_metadata=True)
    
    nodes = []
    links = []
    
    for match in results.matches:
        nodes.append({
            "id": match.id,
            "title": match.metadata.get("title"),
            "poster": match.metadata.get("poster_path"),
            "val": 1 # Size of the node
        })
        
    # TODO: Advanced Link Logic (Calculate similarity between these 100 nodes)
    # For now, we return just nodes to prove visualization works
    return {"nodes": nodes, "links": links}