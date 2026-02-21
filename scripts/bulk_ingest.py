"""
Bulk Ingestion Script for Nebula
Pulls ~10,000 movies from the TMDB API, generates embeddings,
and upserts them into Pinecone in batches of 100.
"""

import os
import time
import requests
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec
from tqdm import tqdm

# ─── Config ───
load_dotenv()
PC_KEY = os.getenv("PINECONE_API_KEY")
TMDB_KEY = os.getenv("TMDB_API_KEY")
INDEX_NAME = "nebula-index"
MODEL_NAME = "all-MiniLM-L6-v2"
TARGET_COUNT = 10000
EMBED_BATCH_SIZE = 256
UPSERT_BATCH_SIZE = 100
MAX_RETRIES = 3

# Genre ID → Name mapping (TMDB standard)
GENRE_MAP = {
    28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
    80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
    14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
    9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
    10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
}


def fetch_from_tmdb(target_count):
    """Fetch movies from multiple TMDB API endpoints to maximize variety."""
    if not TMDB_KEY:
        print("  ERROR: No TMDB_API_KEY found in .env")
        return []

    seen_ids = set()
    movies = []

    # Multiple endpoints × many pages for variety and volume
    endpoints = [
        ("popular", 500),
        ("top_rated", 500),
        ("now_playing", 100),
        ("upcoming", 100),
    ]

    print(f"  Target: {target_count} unique movies from TMDB API\n")

    for endpoint, max_pages in endpoints:
        if len(movies) >= target_count:
            break

        pages_needed = min(max_pages, (target_count - len(movies)) // 20 + 5)
        desc = f"  /{endpoint}"

        for page in tqdm(range(1, pages_needed + 1), desc=desc, unit="pg"):
            if len(movies) >= target_count:
                break

            url = f"https://api.themoviedb.org/3/movie/{endpoint}"
            params = {"api_key": TMDB_KEY, "language": "en-US", "page": page}
            data = {"results": []}

            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    resp = requests.get(url, params=params, timeout=10)
                    if resp.status_code == 429:
                        wait = int(resp.headers.get("Retry-After", 3))
                        time.sleep(wait)
                        continue
                    if resp.status_code == 422:
                        # TMDB returns 422 when page number is too high
                        break
                    resp.raise_for_status()
                    data = resp.json()
                    break
                except Exception as e:
                    if attempt == MAX_RETRIES:
                        tqdm.write(f"    Failed page {page} of /{endpoint}: {e}")
                    else:
                        time.sleep(1)

            for movie in data.get("results", []):
                mid = str(movie["id"])
                if mid in seen_ids:
                    continue
                seen_ids.add(mid)

                overview = (movie.get("overview") or "").strip()
                title = (movie.get("title") or "").strip()
                if not overview or len(overview) < 20 or not title:
                    continue

                genre_ids = movie.get("genre_ids", [])
                genre_names = [GENRE_MAP.get(gid) for gid in genre_ids]
                genre_str = ", ".join(g for g in genre_names if g) or "Unknown"

                # Extract numeric year
                rel_date = movie.get("release_date", "Unknown") or "Unknown"
                rel_year = 0
                if rel_date != "Unknown":
                    try:
                        rel_year = int(rel_date.split("-")[0])
                    except:
                        pass

                movies.append({
                    "id": mid,
                    "title": title,
                    "poster_path": movie.get("poster_path", "") or "",
                    "overview": overview,
                    "rating": float(movie.get("vote_average", 0) or 0),
                    "genres": genre_str,
                    "release_date": rel_date,
                    "year": rel_year,
                    "original_language": movie.get("original_language", "en") or "en",
                    "popularity": float(movie.get("popularity", 0) or 0),
                })

            # Respect TMDB rate limit (~40 req/10s)
            time.sleep(0.25)

    print(f"\n  Collected {len(movies)} unique movies")
    return movies


def batch_embed(model, movies, batch_size=EMBED_BATCH_SIZE):
    """Generate embeddings in batches with retry logic."""
    all_embeddings = [None] * len(movies)

    for start in tqdm(range(0, len(movies), batch_size), desc="Embedding", unit="batch"):
        end = min(start + batch_size, len(movies))
        batch_movies = movies[start:end]
        texts = [f"{m['title']} ({m['genres']}): {m['overview']}" for m in batch_movies]

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                embeddings = model.encode(texts, show_progress_bar=False)
                for i, emb in enumerate(embeddings):
                    all_embeddings[start + i] = emb.tolist()
                break
            except Exception as e:
                tqdm.write(f"  Embed error batch {start//batch_size+1}, attempt {attempt}: {e}")
                if attempt == MAX_RETRIES:
                    for i in range(len(batch_movies)):
                        all_embeddings[start + i] = None
                else:
                    time.sleep(2 ** attempt)

    return all_embeddings


def upsert_to_pinecone(index, movies, embeddings, batch_size=UPSERT_BATCH_SIZE):
    """Upsert vectors to Pinecone in batches with retry logic."""
    vectors = []
    skipped = 0

    for movie, embedding in zip(movies, embeddings):
        if embedding is None:
            skipped += 1
            continue
        vectors.append({
            "id": movie["id"],
            "values": embedding,
            "metadata": {
                "title": movie["title"],
                "poster_path": movie["poster_path"],
                "overview": movie["overview"][:1000],
                "rating": movie["rating"],
                "genres": movie["genres"],
                "release_date": movie["release_date"],
                "year": movie["year"],
                "original_language": movie["original_language"],
                "popularity": movie["popularity"],
            }
        })

    if skipped:
        print(f"  Skipped {skipped} movies with failed embeddings")

    print(f"Upserting {len(vectors)} vectors to Pinecone...")
    success = 0

    for start in tqdm(range(0, len(vectors), batch_size), desc="Upserting", unit="batch"):
        batch = vectors[start:start + batch_size]
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                index.upsert(vectors=batch)
                success += len(batch)
                break
            except Exception as e:
                tqdm.write(f"  Upsert error batch {start//batch_size+1}, attempt {attempt}: {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(2 ** attempt)
                else:
                    tqdm.write(f"  DROPPED {len(batch)} vectors")

    print(f"  Successfully upserted {success}/{len(vectors)} vectors")
    return success


def main():
    print("=" * 60)
    print("  Nebula Bulk Ingestion (TMDB API)")
    print("=" * 60)

    # 1. Fetch movies
    print(f"\n[1/4] Fetching movies from TMDB...")
    movies = fetch_from_tmdb(TARGET_COUNT)
    if not movies:
        print("ERROR: No movies fetched. Check your TMDB_API_KEY.")
        return
    print(f"  Using {len(movies)} movies for ingestion")

    # 2. Load model
    print(f"\n[2/4] Loading SentenceTransformer: {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)

    # 3. Connect to Pinecone
    print("\n[3/4] Connecting to Pinecone...")
    pc = Pinecone(api_key=PC_KEY)
    existing = [i.name for i in pc.list_indexes()]
    if INDEX_NAME not in existing:
        print(f"  Creating index: {INDEX_NAME}...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=384,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1")
        )
        time.sleep(10)
    index = pc.Index(INDEX_NAME)

    # 4. Embed + Upsert
    print(f"\n[4/4] Embedding & upserting {len(movies)} movies...")
    embeddings = batch_embed(model, movies)
    success = upsert_to_pinecone(index, movies, embeddings)

    # Summary
    time.sleep(5)
    stats = index.describe_index_stats()
    print(f"\n{'=' * 60}")
    print(f"  Ingestion Complete!")
    print(f"  Vectors upserted this run: {success}")
    print(f"  Total vectors in index:    {stats.get('total_vector_count', 'N/A')}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
