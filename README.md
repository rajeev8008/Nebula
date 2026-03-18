#  Nebula

### **The Semantic Cinema Engine.**
> "Describe the vibe. Discover the film."

Nebula is a movie discovery platform that moves beyond simple keyword matching. It leverages **OpenAI Embeddings** and **Pinecone Vector Search** to understand the "vibe" of cinema through natural language.

---

##  Screenshots

<p align="center">
  <!-- PRIMARY HERO SCREENSHOT -->
  <img src="https://github.com/user-attachments/assets/17b3b261-85f6-44fb-9eb8-3ba334a74f86" alt="Nebula Hero" width="100%">
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/82a95aa9-921c-49c7-a7cf-a619dafc2c20" alt="The Nebula Graph" width="49%">
  <img src="https://github.com/user-attachments/assets/a8bf8de3-2f0f-4fde-80b0-c9db49ae71a0" alt="Semantic Browser" width="49%">
</p>
<p align="center">
  <em>2D Constellation Graph (Left) | Semantic Browser (Right)</em>
</p>

---

##  Core Features

###  1. The Launch Engine
A **Connected Papers-style** 2D constellation graph for nonlinear movie discovery.
- **Semantic Discovery**: Input a query like *"Interstellar vibes but with more philosophy"* to generate a seed neighborhood of films.
- **Force-Directed Physics**: Interactive nodes that bounce, attract, and repel based on thematic similarity.
- **Neighborhood Exploration**: Click any node to "jump" into its specific neighborhood, expanding the graph dynamically.
- **Hover Exploration**: Glide over nodes to see details instantly without losing your place in the nebula.
- **Glassmorphic UI**: High-fidelity detail panels that slide in without breaking your focus.

###  2. Semantic Browser
A powerful, responsive movie catalog designed for organized browsing.
- **Semantic Search**: Use the search bar for both specific titles and broad concepts.
- **Advanced Filters**: Filter by Decade, Rating, Genre, and Runtime.
- **Watchlist & Diary**: Save movies to your watchlist or log them in your personal diary with ratings and reviews.
- **Social Activity**: Search and follow other users to explore their diaries and discover new cinematic tastes.
- **Interactive Posters**: 3D tilt-and-glare effects on movie cards that respond to your mouse movement.
- **Supabase Sync**: Your profile, lists, and activity are synced to the cloud via Supabase, accessible from anywhere.
- **Persistent State**: PostgreSQL integration for user watchlists and recommendation history/preferences.

---

## 🛠 Tech Stack

- **Frontend**: `Next.js 16`, `React`, `Framer Motion`, `react-force-graph-2d`, `Zustand`.
- **Backend**: `FastAPI` (Python 3.11).
- **AI/ML/Vector**: `OpenAI Embeddings`, `Pinecone Vector DB`, `SentenceTransformers`.
- **Database/Auth**: `Supabase`, `PostgreSQL` (persistent state), `Redis` (caching).
- **CI/CD**: `GitHub Actions` (automated backend/frontend tests, Docker builds).
- **Data Source**: `The Movie Database (TMDB)`.

---

##  Getting Started

### Prerequisites

- **Node.js**: `v20.9.0` or higher
- **Python**: `3.11` or higher
- **Docker**: Optional, for containerized execution
- **API Keys**: 
  - [OpenAI](https://platform.openai.com/) (for embeddings)
  - [Pinecone](https://www.pinecone.io/) (vector database)
  - [TMDB](https://www.themoviedb.org/documentation/api) (movie metadata)
  - [Supabase](https://supabase.com/) (auth and user data)

### 1. Environment Configuration

Clone the repository and create a `.env` file in the root directory by copying the example:

```bash
git clone https://github.com/rajeev8008/Nebula.git
cd Nebula
cp .env.example .env
```

Fill in your API keys and configuration in the `.env` file.

---

### 2. How to Run

You can run Nebula either using Docker (recommended for quick start) or manually for development.

#### Option A: Running with Docker (Recommended)

This will spin up the frontend, backend, and potentially Redis (if configured) in containers.

```bash
docker-compose up --build
```

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

#### Option B: Manual Local Setup (Development)

**Backend Setup:**
1. Navigate to the projects root directory (if not already there).
2. Create and activate a virtual environment:
   ```bash
   # Windows:
   python -m venv backend/venv
   .\backend\venv\Scripts\activate
   # macOS/Linux:
   python3 -m venv backend/venv
   source backend/venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
4. Start the FastAPI server (Run from root):
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

**Frontend Setup:**
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

---

### 3. Data Ingestion (Optional)
If you need to seed your Pinecone index with movie data:
```bash
cd scripts
python ingest.py  # Follow internal instructions for data source
```

---

## 📂 Project Structure

```text
Nebula/
├── backend/            # FastAPI, Vector Search logic
│   ├── main.py         # Primary API Entrypoint
│   ├── routes/         # Modular API Route handlers
│   └── dependencies.py # Shared resources (Model, Index)
├── frontend/           # Next.js Application
│   ├── app/            # App Router & Main Entry points
│   ├── components/     # Interactive UI (Graph, Browser, Panels)
│   ├── store/          # Zustand State Architecture
│   └── lib/            # API Clients & Utilities
└── docker-compose.yml  # Container Orchestration
```

---

## 📜 License
MIT License. Created by Rajeev K, Mevin Jose.
