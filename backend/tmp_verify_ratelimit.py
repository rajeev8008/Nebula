import asyncio
import httpx

async def test_rate_limiter():
    url = "http://127.0.0.1:8000/search"
    payload = {"query": "test query", "top_k": 5}
    
    async with httpx.AsyncClient(timeout=None) as client:
        tasks = []
        for i in range(25):
            tasks.append(client.post(url, json=payload))
            
        responses = await asyncio.gather(*tasks)
        
        status_codes = [r.status_code for r in responses]
        
        success = status_codes.count(200)
        too_many = status_codes.count(429)
        
        print(f"Total requests: {len(status_codes)}")
        print(f"200 OK: {success}")
        print(f"429 Too Many Requests: {too_many}")
        
        if success == 20 and too_many == 5:
            print("SUCCESS: Rate limiter is working perfectly!")
        else:
            print("FAILED: Rate limiter results are unexpected.")
            print("Status codes:", status_codes)

if __name__ == "__main__":
    asyncio.run(test_rate_limiter())
