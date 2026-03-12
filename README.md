# Nebula

**Semantic Movie Search Engine** — AI-powered movie discovery using natural-language queries and interactive 3D graph visualization.

[![CI Pipeline](https://github.com/rajeev8008/Nebula/actions/workflows/main.yml/badge.svg)](https://github.com/rajeev8008/Nebula/actions/workflows/main.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

Nebula is a semantic search engine that helps users discover movies using **meaning**, not exact keyword matches. It combines:

- **Transformer embeddings** (Sentence Transformers)
- **Vector similarity search** (Pinecone)
- **Interactive 3D exploration** (Three.js + react-force-graph)

---

## How It Works

### 1) Semantic Embeddings
- Uses **sentence-transformers/all-MiniLM-L6-v2**
- Converts movie text into **384-dimensional vectors**
- Captures semantic meaning beyond keywords

### 2) Vector Search (Pinecone)
- Stores embeddings in **Pinecone**
- Uses cosine similarity to retrieve the most relevant results

### 3) Query Flow

```text
User Query → Sentence Transformer → 384D Vector → Pinecone Search →
Top-K Matches → Metadata Enrichment → Graph Data (nodes + links)
```

### 4) Graph Visualization
- Force-directed 3D graph using **Three.js** and **react-force-graph**
- Nodes represent movies (optionally sized by popularity/rating)
- Edges represent similarity (cosine similarity)

---

## Features

- **Semantic Search**: Natural-language movie discovery (e.g., “action movies with car chases”)
- **AI-Powered Recommendations**: Similarity-based results using transformer embeddings
- **3D Graph UI**: Explore related movies in an interactive force-directed graph
- **Metadata Integration**: Posters, ratings, and details via TMDB (API key required)
- **Dockerized Local Dev**: Frontend + backend + Postgres + Redis via Docker Compose

---

## Tech Stack

> Note: This section is aligned with what’s actually in the repository configuration.

**Frontend**
- Next.js **16**
- React **18**
- Tailwind CSS
- Three.js
- react-force-graph-3d
- Zustand

**Backend**
- FastAPI (Python 3.11+)
- Sentence Transformers (all-MiniLM-L6-v2)
- Pinecone SDK

**Data / Infra**
- Pinecone (vector database)
- Postgres (Docker Compose)
- Redis (caching; Docker Compose)

**Testing / Tooling**
- Playwright (E2E) — executed in CI
- Jest (configured in dependencies; add/run unit tests if present)
- Pytest (listed in requirements; not currently executed in CI)
- GitHub Actions (CI)
- Docker / Docker Compose

---

## Prerequisites

- Python 3.11+
- Node.js 18+ (CI uses Node 20)
- Pinecone API Key
- TMDB API Key

---

## Quick Start

### 1) Clone and configure

```bash
git clone https://github.com/rajeev8008/Nebula.git
cd Nebula

# Create .env file
cp .env.example .env
# Add your API keys to .env
```

### 2) Backend setup (local)

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
python scripts/ingest.py  # Load movie data into Pinecone (if configured)
uvicorn backend.main:app --reload
# Backend: http://localhost:8000
```

### 3) Frontend setup (local)

```bash
cd frontend
npm install
npm run dev
# Frontend: http://localhost:3000
```

### Docker alternative

```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

---

## Architecture

```text
┌──────────────┐
│   Frontend   │  Next.js + React (Port 3000)
└──────┬───────┘
       │ HTTP/JSON
       ▼
┌──────────────┐
│   Backend    │  FastAPI (Port 8000)
└──────┬───────┘
       │
       ├─► Sentence Transformer (all-MiniLM-L6-v2)
       │   • Encodes text to 384D vectors
       │
       ├─► Pinecone Vector DB
       │   • Stores embeddings
       │   • Cosine similarity search
       │
       └─► TMDB API
           • Movie metadata & posters
```

---

## API Endpoints

**GET /**  
Health check endpoint.

**POST /search**  
Example:

```json
{
  "query": "action movies with car chases",
  "top_k": 20
}
```

Returns graph-ready data (nodes + links).

**GET /movies**  
Returns a flat list of movies + metadata (used by the frontend to build graphs/browse).

> Note: `/graph` and `/browse` are kept as legacy endpoints and currently redirect to `/movies`.

---

## Testing

### Frontend E2E (Playwright)

```bash
cd frontend && npm run e2e
```

### CI Status (what runs today)

The GitHub Actions workflow currently:
- Runs **Playwright E2E tests** for the frontend
- Builds Docker images for frontend and backend

> The workflow does **not** currently run `pytest` or `jest` unit tests (even though dependencies exist). Add those jobs if you want stricter CI.

---

## Model Details

**Model**: sentence-transformers/all-MiniLM-L6-v2  
**Output**: 384-dimensional dense embeddings  
**Use case**: Semantic similarity search and clustering-like behavior through vector retrieval.

Why this model?
- Fast inference
- Small footprint
- High-quality embeddings for short text

---

## Deployment

This repository is ready for:
- Docker-based deployment (`docker-compose`)
- Split deployment (e.g., Vercel for frontend + container platform for backend)

> “Auto-deploy” is not configured by default; you would need to connect a deployment platform (Railway/Vercel/etc.) and add the required configuration.

---

## Project Structure

```text
Nebula/
├── backend/                 # FastAPI app
├── frontend/                # Next.js app
├── scripts/                 # ingestion & utilities
├── .github/workflows/       # CI pipeline
├── requirements.txt         # Python deps
└── docker-compose.yml       # local multi-service stack
```

---

## License

MIT License — see [LICENSE](LICENSE)

---

## Author

**Rajeev** — [@rajeev8008](https://github.com/rajeev8008)

---

## Acknowledgments

- Sentence Transformers — semantic embedding models
- Pinecone — vector database
- TMDB — movie metadata
- React Force Graph — graph visualization
