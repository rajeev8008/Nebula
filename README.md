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
- **Interactive Posters**: 3D tilt-and-glare effects on movie cards that respond to your mouse movement.

###  3. User Discovery & Social
- **Profile Search**: Search for other Nebula users to explore their movie diaries and ratings.
- **Activity Log**: Keep a detailed diary of films you've watched, with personal ratings and reviews.
- **Public Profiles**: View beautiful, glassmorphic profile cards showing a user's movie stats and history.

###  4. Advanced Tools
- **Command Palette**: Press `Cmd/Ctrl + K` to search movies instantly from anywhere in the app.
- **Watchlist**: Save movies you want to explore later with a single click.
- **Supabase Sync**: Your profile and lists are synced to the cloud, accessible from anywhere.

---

## 🛠 Tech Stack

- **Frontend**: `Next.js 14`, `React`, `Framer Motion`, `react-force-graph-2d`, `Zustand`.
- **Backend**: `FastAPI` (Python 3.11).
- **AI/ML/Vector**: `OpenAI Embeddings`, `Pinecone Vector DB`, `SentenceTransformers`.
- **Database/Auth**: `Supabase`.
- **Data Source**: `The Movie Database (TMDB)`.

---

##  Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- API Keys: Pinecone, OpenAI, TMDB, Supabase.

### Setup
1. **Clone the repository**
2. **Environment Variables**:
   Create a `.env` file at the root:
   ```bash
   cp .env.example .env
   ```
3. **Run with Docker**:
   ```bash
   docker-compose up --build
   ```
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:8000`

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
MIT License. Created with by Rajeev K.
