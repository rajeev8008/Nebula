#  Nebula

### **The Semantic Cinema Engine.**
> "Describe the vibe. Discover the film."

Nebula is a movie discovery platform that moves beyond simple keyword matching. It leverages **OpenAI Embeddings** and **Pinecone Vector Search** to understand the "vibe" of cinema through natural language.

---

##  Screenshots

<p align="center">
  <!-- PRIMARY HERO SCREENSHOT -->
<img width="1857" height="978" alt="image" src="https://github.com/user-attachments/assets/17b3b261-85f6-44fb-9eb8-3ba334a74f86" />

</p>

| **The Nebula Graph** | **Semantic Browser** |
|:---:|:---:|
| <img src="https://via.placeholder.com/600x400.png?text=Graph+View+Screenshot" alt="Graph Engine" width="100%"> | <img src="https://via.placeholder.com/600x400.png?text=Movie+Grid+Screenshot" alt="Browser" width="100%"> |
| *2D Constellation Graph (Connected Papers style)* | *Responsive Grid with Semantic Search* |

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
- **Semantic Search**: Use the search bar for both specific titles and broad concepts (e.g., *"movies about existential loneliness in space"*).
- **Advanced Filters**: Filter by Decade, Rating, Genre, and Runtime.
- **Fluid Layout**: A fully responsive grid that fills your screen width, optimized for cinematic posters.
- **Interactive Posters**: 3D tilt-and-glare effects on movie cards that respond to your mouse movement.

### 📖 3. Watchlist & Diary
- **Watchlist**: Save movies you want to explore later with a single click.
- **Activity Log**: Keep a detailed diary of films you've watched, with personal ratings and reviews.
- **Supabase Sync**: Your profile and lists are synced to the cloud, accessible from anywhere.

---

##  Tech Stack

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

##  License
MIT License. Created by Rajeev K.
