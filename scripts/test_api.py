import requests
import json

print("Testing backend endpoints...\n")

# Test /graph endpoint
print("1. Testing GET /graph")
try:
    response = requests.get('http://127.0.0.1:8000/graph')
    data = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   Nodes received: {len(data.get('nodes', []))}")
    print(f"   Links received: {len(data.get('links', []))}")
    if data.get('nodes'):
        print(f"   Sample node: {data['nodes'][0]}")
    print()
except Exception as e:
    print(f"   ERROR: {e}\n")

# Test /search endpoint
print("2. Testing POST /search")
try:
    response = requests.post('http://127.0.0.1:8000/search', 
                            json={"query": "action movie", "top_k": 5})
    data = response.json()
    print(f"   Status: {response.status_code}")
    print(f"   Query: {data.get('query')}")
    print(f"   Nodes: {len(data.get('nodes', []))}")
    print(f"   Links: {len(data.get('links', []))}")
    if data.get('nodes'):
        print(f"   Sample: {data['nodes'][0].get('title')}")
except Exception as e:
    print(f"   ERROR: {e}")
