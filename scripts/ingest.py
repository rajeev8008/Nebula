import os
import requests
import time
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone, ServerlessSpec

# 1. Load Environment Variables
load_dotenv()
TMDB_KEY = os.getenv("TMDB_API_KEY")
PC_KEY = os.getenv("PINECONE_API_KEY")

# 2. Initialize AI Model (This runs locally on your CPU)
print("Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2') 

# 3. Initialize Pinecone (Vector DB)
pc = Pinecone(api_key=PC_KEY)
index_name = "nebula-index"

# Check if index exists, if not, create it (400 error safety)
existing_indexes = [i.name for i in pc.list_indexes()]
if index_name not in existing_indexes:
    print(f"Creating index: {index_name}...")
    pc.create_index(
        name=index_name,
        dimension=384, # Matches the model's output size
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1") # Change region if needed
    )

index = pc.Index(index_name)

# 4. Fetch Movies from TMDB
def fetch_movies(pages=5):
    movies = []
    print(f"Fetching top {pages * 20} movies from TMDB...")
    
    for page in range(1, pages + 1):
        url = f"https://api.themoviedb.org/3/movie/popular?api_key={TMDB_KEY}&language=en-US&page={page}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            movies.extend(data['results'])
        else:
            print(f"Error on page {page}: {response.status_code}")
    
    return movies

# 5. Helper function to get genre names
def get_genre_names(genre_ids):
    """Convert genre IDs to genre names"""
    genre_map = {
        28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
        80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
        14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
        9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
        10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western"
    }
    return [genre_map.get(gid, "Unknown") for gid in genre_ids]

# 6. Process & Upload
def process_and_upload():
    raw_movies = fetch_movies(pages=5) # Fetches 100 movies to start
    vectors = []
    
    print("Generating embeddings (this might take a minute)...")
    for movie in raw_movies:
        movie_id = str(movie['id'])
        title = movie['title']
        overview = movie['overview']
        poster = movie.get('poster_path', "")
        
        # SKIP movies with empty plots
        if not overview: 
            continue
        
        # Extract additional metadata
        genres = get_genre_names(movie.get('genre_ids', []))
        genre_str = ", ".join(genres) if genres else "Unknown"
        release_date = movie.get('release_date', 'Unknown')
        original_language = movie.get('original_language', 'en')
        popularity = movie.get('popularity', 0.0)
        adult = movie.get('adult', False)
            
        # The "Vibe" Text: Combine title + genres + overview for better similarity
        # Including genres helps the model understand the movie type
        combined_text = f"{title} ({genre_str}): {overview}"
        
        # Create Vector (The AI Magic)
        embedding = model.encode(combined_text).tolist()
        
        # Prepare Metadata (Store FULL overview and all useful info)
        metadata = {
            "title": title,
            "poster_path": poster,
            "overview": overview,  # FULL TEXT, not truncated!
            "rating": movie['vote_average'],
            "genres": genre_str,
            "release_date": release_date,
            "original_language": original_language,
            "popularity": popularity,
            "adult": adult
        }
        
        vectors.append({
            "id": movie_id,
            "values": embedding,
            "metadata": metadata
        })

    # Batch Upload to Pinecone
    if vectors:
        print(f"Uploading {len(vectors)} movies to Pinecone...")
        # Upload in batches of 100 to avoid timeouts
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i+batch_size]
            index.upsert(vectors=batch)
            print(f"Uploaded batch {i//batch_size + 1}")
            
    print("✅ Ingestion Complete! Your Nebula has stars.")

if __name__ == "__main__":
    process_and_upload()