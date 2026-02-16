# Nebula

**Semantic Movie Search Engine** - AI-powered movie discovery using natural language queries and interactive graph visualization.

[![CI Pipeline](https://github.com/rajeev8008/Nebula/actions/workflows/ci.yml/badge.svg)](https://github.com/rajeev8008/Nebula/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Overview

Nebula is a semantic search engine that transforms how users discover movies. Instead of exact keyword matching, it uses natural language understanding to find movies based on meaning and context. The system combines AI embeddings, vector similarity search, and graph visualization to create an intuitive exploration experience.

## How It Works

### 1. Semantic Embeddings
- Uses **all-MiniLM-L6-v2** sentence transformer model from Hugging Face
- Converts movie descriptions into 384-dimensional dense vectors
- Embeddings capture semantic meaning beyond keyword matching
- Pre-trained on billions of sentence pairs for accurate similarity detection

### 2. Vector Search
- Stores embeddings in **Pinecone** vector database (serverless architecture)
- Uses cosine similarity for finding related movies
- Sub-second query response times with approximate nearest neighbor (ANN) search
- Scales to millions of vectors without performance degradation

### 3. Query Processing Flow
```
User Query → Sentence Transformer → 384D Vector → Pinecone Search → 
Top-K Similar Vectors → Retrieve Metadata → Generate Graph
```

### 4. Graph Visualization
- Force-directed graph layout using **Three.js** and **react-force-graph**
- Nodes represent movies (sized by popularity)
- Edges represent similarity scores (weighted by cosine similarity)
- Interactive 3D navigation with zoom, pan, and node selection

## Features

- **Semantic Search**: Find movies using natural language descriptions
- **AI-Powered Recommendations**: Context-aware similarity using transformer models
- **Interactive Graph**: 3D force-directed visualization of movie relationships
- **Real-time Updates**: Dynamic graph rendering with smooth animations
- **Metadata Integration**: Movie posters, ratings, and details from TMDB API

## Tech Stack

**Frontend**: Next.js 15, React 19, Tailwind CSS, Three.js, React Force Graph  
**Backend**: FastAPI, Python 3.11, Sentence Transformers, Pinecone SDK  
**AI/ML**: all-MiniLM-L6-v2 (384D embeddings), Cosine Similarity, Vector Search  
**Database**: Pinecone (serverless vector DB)  
**DevOps**: GitHub Actions, Docker, Pytest, Jest, Playwright

## Prerequisites

- Python 3.11+
- Node.js 18+
- [Pinecone API Key](https://www.pinecone.io/)
- [TMDB API Key](https://www.themoviedb.org/settings/api)

## Quick Start

### 1. Clone and Configure
```bash
git clone https://github.com/rajeev8008/Nebula.git
cd Nebula

# Create .env file
cp .env.example .env
# Add your API keys to .env
```

### 2. Backend Setup
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
python scripts/ingest.py  # Load movie data into Pinecone
uvicorn backend.main:app --reload
# Backend: http://localhost:8000
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend: http://localhost:3000
```

### Docker Alternative
```bash
docker-compose up --build
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
```

## Architecture

```
┌─────────────┐
│   Frontend  │ Next.js + React
│   (Port 3000) │
└──────┬──────┘
       │ HTTP/JSON
       ▼
┌─────────────┐
│   Backend   │ FastAPI
│   (Port 8000) │
└──────┬──────┘
       │
       ├─► Sentence Transformer (all-MiniLM-L6-v2)
       │   • Encodes text to 384D vectors
       │   • Cached model in memory
       │
       ├─► Pinecone Vector DB
       │   • Stores movie embeddings
       │   • Cosine similarity search
       │   • ~1000 vectors per index
       │
       └─► TMDB API
           • Movie metadata & posters
```

## API Endpoints

**GET /**  
Health check endpoint

**POST /search**  
```json
{
  "query": "action movies with car chases",
  "top_k": 20
}
```
Returns nodes and links for graph visualization

**GET /graph**  
Returns all movies with similarity edges for full graph

## Testing

```bash
# Backend tests (40% coverage, 8 tests)
pytest tests/ -v --cov=backend

# Frontend tests (10.71% coverage, 8 tests)
cd frontend && npm run test:coverage

# E2E tests (2 tests)
cd frontend && npm run e2e
```

## Model Details

**Model**: sentence-transformers/all-MiniLM-L6-v2  
**Architecture**: 6-layer BERT-based transformer  
**Output**: 384-dimensional dense vectors  
**Training**: Contrastive learning on sentence pairs  
**Use Case**: Semantic similarity and clustering

**Why This Model?**
- Fast inference (milliseconds per query)
- Small model size (80MB)
- High quality embeddings for short text
- Pre-trained on diverse domains including movies/entertainment

## Deployment

### CI/CD Pipeline
- **CI Testing**: Runs pytest, Jest, and Playwright on every push
- **Dependency Check**: Weekly security audits
- **Auto-deploy**: Ready for Railway, Vercel, or Docker deployment

### Deployment Options
1. **Docker**: `docker-compose up --build`
2. **Railway**: Connect GitHub and auto-deploy
3. **Vercel (Frontend) + Railway (Backend)**: Serverless frontend, containerized backend

## Project Structure

```
Nebula/
├── backend/
│   └── main.py              # FastAPI app, model loading, endpoints
├── frontend/
│   ├── app/                 # Next.js pages
│   ├── components/          # React components (graph, search)
│   └── __tests__/           # Jest tests
├── tests/                   # Pytest backend tests
├── scripts/                 # Data ingestion & utilities
├── .github/workflows/       # CI/CD pipelines
├── requirements.txt         # Python dependencies
└── docker-compose.yml       # Multi-container setup
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/NewFeature`)
3. Commit changes with tests
4. Push and open a Pull Request

## License

MIT License - see [LICENSE](LICENSE)

## Authors

**Rajeev** - [@rajeev8008](https://github.com/rajeev8008)

## Acknowledgments

- [Sentence Transformers](https://www.sbert.net/) - Semantic search models
- [Pinecone](https://www.pinecone.io/) - Vector database
- [TMDB](https://www.themoviedb.org/) - Movie metadata
- [React Force Graph](https://github.com/vasturiano/react-force-graph) - Graph visualization