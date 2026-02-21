import os
import asyncio
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from fastapi import BackgroundTasks, FastAPI, HTTPException, Query
from backend.cache import get_cached_search, set_cached_search
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

# --- Helper: Build Pinecone metadata filter ---
def build_metadata_filter(genre: Optional[str], decade: Optional[str], rating: Optional[float], min_year: Optional[int] = None):
    """Convert query params into a Pinecone metadata filter dict."""
    conditions = []

    if genre:
        # genres is stored as comma-separated string; use $eq for exact substring match
        # Pinecone string filter matches if the metadata field contains the value
        conditions.append({"genres": {"$eq": genre}})

    if rating is not None and rating > 0:
        conditions.append({"rating": {"$gte": rating}})

    if min_year:
        conditions.append({"year": {"$gte": min_year}})

    if decade:
        year_ranges = {
            "2020s": (2020, 2029),
            "2010s": (2010, 2019),
            "2000s": (2000, 2009),
            "1990s": (1990, 1999),
            "Earlier": (1900, 1989),
        }
        if decade in year_ranges:
            start_year, end_year = year_ranges[decade]
            # Use numeric year field (requires numeric metadata in Pinecone)
            conditions.append({"year": {"$gte": start_year}})
            conditions.append({"year": {"$lte": end_year}})

    if not conditions:
        return None
    if len(conditions) == 1:
        return conditions[0]
    return {"$and": conditions}


# --- Endpoints ---

@app.get("/")
def home():
    return {"message": "Nebula API is running. Go to /docs for swagger UI."}


@app.get("/api/search")
def api_search(
    q: str = Query("", description="Search query text"),
    genre: Optional[str] = Query(None, description="Filter by genre name"),
    decade: Optional[str] = Query(None, description="Filter by decade (e.g., '2020s')"),
    rating: Optional[float] = Query(None, description="Minimum rating filter"),
    min_year: Optional[int] = Query(None, description="Minimum release year"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
):
    """
    Unified search + browse endpoint.
    - With `q`: semantic search using vector similarity + optional metadata filters.
    - Without `q`: browse mode using a dummy vector + metadata filters.
    Returns paginated results.
    """
    try:
        # Build metadata filter
        metadata_filter = build_metadata_filter(genre, decade, rating, min_year)

        # Determine query vector
        fetch_top_k = 200  # Fetch a large pool for pagination slicing

        if q.strip():
            # Semantic search mode
            query_vector = [float(x) for x in model.encode(q.strip())]
        else:
            # Browse mode — non-zero dummy vector (cosine needs non-zero magnitude)
            query_vector = [0.1] * 384

        # Query Pinecone
        query_kwargs = {
            "vector": query_vector,
            "top_k": fetch_top_k,
            "include_metadata": True,
        }
        if metadata_filter:
            query_kwargs["filter"] = metadata_filter

        results = index.query(**query_kwargs)

        # Format all results
        all_movies = []
        for match in results.matches:
            all_movies.append({
                "id": match.id,
                "title": match.metadata.get("title", "Unknown"),
                "poster": match.metadata.get("poster_path", ""),
                "overview": match.metadata.get("overview", ""),
                "rating": match.metadata.get("rating", 0.0),
                "genres": match.metadata.get("genres", "Unknown"),
                "release_date": match.metadata.get("release_date", "Unknown"),
                "language": match.metadata.get("original_language", "en"),
                "popularity": match.metadata.get("popularity", 0.0),
                "score": float(match.score),
            })

        # Paginate
        total = len(all_movies)
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        page_movies = all_movies[start_idx:end_idx]
        has_more = end_idx < total

        return {
            "movies": page_movies,
            "total": total,
            "page": page,
            "limit": limit,
            "hasMore": has_more,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
async def search_movies(req: SearchRequest, background_tasks: BackgroundTasks):
    """
    Takes a user query (e.g., "sad robots"), converts to vector,
    and finds matching movies in Pinecone.
    Returns a graph structure (nodes + links) instead of just a list.

    All blocking operations (model.encode, index.query, cosine_similarity)
    are offloaded to threads via asyncio.to_thread() to keep the
    async event loop unblocked for concurrent requests.

    Results are cached in Redis keyed by normalized query string.
    Cache writes happen in the background so the client never waits.
    """
    # ── Cache check (before any heavy work) ──────────────────────────
    cached = await get_cached_search(req.query)
    if cached is not None:
        cached["cached"] = True
        return cached

    try:
        # 1. Convert text to numbers — CPU-bound, offload to thread
        raw_vector = await asyncio.to_thread(model.encode, req.query)
        query_vector = [float(x) for x in raw_vector]

        # 2. Query Pinecone — synchronous I/O, offload to thread
        query_kwargs = {
            "vector": query_vector,
            "top_k": req.top_k,
            "include_metadata": True,
            "include_values": True,  # CRITICAL: Need vectors to calculate links
        }
        results = await asyncio.to_thread(index.query, **query_kwargs)

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
                "vector": match.values,
                "isSearchResult": True,
                "relevanceRank": i + 1
            })
            vectors.append(match.values)
            id_map[i] = match.id

        # 4. Calculate similarity — CPU-bound matrix math, offload to thread
        links = []
        if len(vectors) > 1:
            vec_matrix = np.array(vectors)
            sim_matrix = await asyncio.to_thread(cosine_similarity, vec_matrix)

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

        result = {
            "nodes": nodes,
            "links": links,
            "query": req.query,
            "totalResults": len(nodes),
            "cached": False
        }

        # ── Background cache write (client doesn't wait) ────────────
        background_tasks.add_task(set_cached_search, req.query, result)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/movies")
def get_movies():
    """
    Unified endpoint that returns a flat list of movies with all metadata.
    Frontend handles both graph construction and browse categorization.
    """
    try:
        # Fetch top 500 movies with full metadata
        dummy_vec = [0.1] * 384
        results = index.query(
            vector=dummy_vec,
            top_k=500,
            include_metadata=True,
            include_values=True  # Include vectors for graph construction
        )
        
        # Format movies with all necessary data (skip movies without posters)
        movies = []
        for match in results.matches:
            poster = match.metadata.get("poster_path", "")
            if not poster or not poster.strip():
                continue  # Skip — renders as orange ball in graph
            movies.append({
                "id": match.id,
                "title": match.metadata.get("title", "Unknown"),
                "poster": poster,
                "overview": match.metadata.get("overview", ""),
                "rating": match.metadata.get("rating", 0.0),
                "genres": match.metadata.get("genres", "Unknown"),
                "release_date": match.metadata.get("release_date", "Unknown"),
                "language": match.metadata.get("original_language", "en"),
                "popularity": match.metadata.get("popularity", 0.0),
                "vector": match.values  # For graph similarity calculation
            })
        
        print(f"Movies endpoint: returned {len(movies)} movies (with posters)")
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