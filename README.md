# Nebula

### The Semantic Cinema Engine.
### Describe the vibe. Discover the film.
Powered by OpenAI Embeddings & Pinecone Vector Search.

## Features
- Semantic natural language movie search
- 2D Constellation Graph Engine (Connected Papers style)
- Movie Browser with filters, search, and watchlist
- AI-powered similarity graph with force-directed physics

## Tech Stack
- Frontend: Next.js, React, Framer Motion, react-force-graph-2d, Tailwind CSS
- Backend: FastAPI, Python
- AI/ML: OpenAI Embeddings
- Vector DB: Pinecone
- Movie Data: TMDB API

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Pinecone API Key
- OpenAI API Key
- TMDB API Key
- Docker Engine (Optional but recommended)

### Environment Setup (.env.example)
Create a `.env` file at the root based on `.env.example`:
```bash
cp .env.example .env
```
Fill out API keys.

### Running with Docker (production)
Starts the optimized production builds for both backend and frontend:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

### Running with Docker (development)
Starts hot-reloading containers, using mounted volumes for your source code:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Running locally without Docker
**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure
```
Nebula/
├── backend/            # FastAPI, Pinecone, and AI logic
│   ├── main.py         # Entrypoint
│   ├── tests/          # Pytest backend tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/           # Next.js, React, and 2D Graph Engine
│   ├── components/     # Reusable UI elements
│   ├── app/            # Next.js App Router
│   ├── __tests__/      # Jest frontend component tests
│   ├── package.json
│   └── Dockerfile
├── .github/workflows/  # CI pipeline
├── docker-compose.yml     # Production Docker config
└── docker-compose.dev.yml # Development Docker config
```

## Testing

**Backend:**
```bash
cd backend
pytest tests/
```

**Frontend:**
```bash
cd frontend
npm run test
```

## Environment Variables Reference

| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `OPENAI_API_KEY` | OpenAI API Auth | platform.openai.com |
| `PINECONE_API_KEY` | Pinecone Auth | app.pinecone.io |
| `PINECONE_INDEX_NAME` | Vector DB Index name | app.pinecone.io |
| `PINECONE_ENVIRONMENT` | DB region/env | app.pinecone.io |
| `TMDB_API_KEY` | The Movie DataBase API | developer.themoviedb.org |
| `NEXT_PUBLIC_APP_NAME` | Website title label | N/A |
| `NEXT_PUBLIC_APP_TAGLINE` | Website subtitle | N/A |
