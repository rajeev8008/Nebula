import os
from dotenv import load_dotenv
from pinecone import Pinecone

load_dotenv()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("nebula-index")

# Get index stats
stats = index.describe_index_stats()
print(f"\n=== Pinecone Index Stats ===")
print(f"Total vectors: {stats.total_vector_count}")
print(f"Dimension: {stats.dimension}")
print(f"\nYou have {stats.total_vector_count} movies in the database.")

if stats.total_vector_count == 0:
    print("\n❌ NO MOVIES FOUND!")
    print("You need to run: python scripts/ingest.py")
else:
    print("\n✅ Database has movies! Testing /graph endpoint...")
    
    # Test query
    dummy_vec = [0.1] * 384
    results = index.query(vector=dummy_vec, top_k=5, include_metadata=True)
    print(f"\nSample of {len(results.matches)} movies:")
    for match in results.matches[:3]:
        print(f"  - {match.metadata.get('title')}")
