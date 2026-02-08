import os
import json
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

load_dotenv()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("nebula-index")
model = SentenceTransformer('all-MiniLM-L6-v2')

# Search for "Good Boy"
query = "Good Boy"
query_vector = model.encode(query).tolist()

print(f"\n{'='*80}")
print(f"Searching for: '{query}'")
print(f"{'='*80}\n")

results = index.query(
    vector=query_vector, 
    top_k=5, 
    include_metadata=True,
    include_values=True
)

for i, match in enumerate(results.matches, 1):
    print(f"\n{'='*80}")
    print(f"RESULT #{i}: {match.metadata.get('title', 'Unknown')}")
    print(f"{'='*80}")
    print(f"\n📌 BASIC INFO:")
    print(f"   ID: {match.id}")
    print(f"   Score: {match.score:.4f} ({match.score * 100:.1f}% match)")
    
    print(f"\n📝 METADATA (What's stored in Pinecone):")
    for key, value in match.metadata.items():
        if isinstance(value, str) and len(value) > 200:
            print(f"   {key}: {value[:200]}... (truncated, length: {len(value)})")
        else:
            print(f"   {key}: {value}")
    
    print(f"\n🔢 VECTOR INFO:")
    print(f"   Dimension: {len(match.values)}")
    print(f"   First 10 values: {match.values[:10]}")
    print(f"   Vector type: {type(match.values)}")
    
    print(f"\n📊 FRONTEND DISPLAY (What the website shows):")
    display_data = {
        "id": match.id,
        "title": match.metadata.get("title", "Unknown"),
        "poster": match.metadata.get("poster_path", ""),
        "overview": match.metadata.get("overview", ""),
        "rating": match.metadata.get("rating", 0.0),
        "score": float(match.score),
        "val": match.metadata.get("rating", 5.0) * 2
    }
    print(json.dumps(display_data, indent=2))
    
    if i == 1:  # Show full details for first result only
        print(f"\n📋 COMPLETE RAW DATA:")
        print(f"   Complete overview: {match.metadata.get('overview', 'N/A')}")

print(f"\n{'='*80}")
print("SUMMARY:")
print(f"{'='*80}")
print("\nWhat's stored in Pinecone for each movie:")
print("  ✓ title")
print("  ✓ poster_path (URL to TMDB poster image)")
print("  ✓ overview (full plot summary)")
print("  ✓ rating (TMDB vote_average)")
print("  ✓ genres (comma-separated genre names)")
print("  ✓ release_date")
print("  ✓ original_language")
print("  ✓ popularity")
print("  ✓ adult (boolean)")
print("  ✓ 384-dimensional vector embedding (for similarity search)")
print("\nWhat's NOT stored:")
print("  ✗ Cast/actors")
print("  ✗ Director")
print("  ✗ Runtime")
print("  ✗ Budget/revenue")
print("\nNote: Title, genres, and overview are used to create the vector embedding for better semantic matching.\n")
