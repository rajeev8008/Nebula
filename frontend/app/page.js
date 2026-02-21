'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import Hero from '@/components/ui/animated-shader-hero';
import NebulaGraph from '@/components/NebulaGraph';
import EngineDrawer from '@/components/EngineDrawer';
import BrowseMovies from '@/components/BrowseMovies';
import CommandPalette from '@/components/CommandPalette';
import axios from 'axios';

// ─── Cosine Similarity Helper (semantic link calculation) ───
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0, len = vecA.length; i < len; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Similar Movies Helper (on-the-fly recommendations) ───
function getSimilarMovies(targetMovie, allMovies, limit = 6) {
  if (!targetMovie || !allMovies || allMovies.length === 0) return [];
  return allMovies
    .filter((m) => m.id !== targetMovie.id && m.vector && targetMovie.vector)
    .map((m) => ({ ...m, _similarity: cosineSimilarity(targetMovie.vector, m.vector) }))
    .sort((a, b) => b._similarity - a._similarity)
    .slice(0, limit);
}

export default function Home() {
  const [view, setView] = useState('LANDING');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] }); // Full graph
  const [filteredData, setFilteredData] = useState({ nodes: [], links: [] }); // Filtered for search
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [isSearchView, setIsSearchView] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // ─── TanStack Query: fetch all movies for graph ───
  const {
    data: moviesData,
    isLoading: moviesLoading,
    error: moviesError,
  } = useQuery({
    queryKey: ['movies'],
    queryFn: async () => {
      const res = await axios.get('http://127.0.0.1:8000/movies');
      return res.data.movies || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes — heavy payload
  });

  // Helper to build graph from flat movie list
  const buildGraphFromMovies = (movies) => {
    if (!movies || movies.length === 0) return { nodes: [], links: [] };

    const nodes = movies.slice(0, 100).map((movie) => ({
      id: movie.id,
      title: movie.title,
      poster: movie.poster,
      overview: movie.overview,
      val: movie.rating * 2, // Node size based on rating
      rating: movie.rating,
      genres: movie.genres,
      release_date: movie.release_date,
      language: movie.language,
      popularity: movie.popularity,
      vector: movie.vector,
      group: 1,
    }));

    // Calculate links based on semantic cosine similarity
    const links = [];
    const threshold = 0.65;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const similarity = cosineSimilarity(nodes[i].vector, nodes[j].vector);

        if (similarity > threshold) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: similarity,
            similarity: similarity,
          });
        }
      }
    }

    // Rescue orphan nodes — connect any node with 0 links to its nearest semantic neighbor
    const connectedIds = new Set(links.flatMap((l) => [l.source, l.target]));
    nodes.forEach((node, i) => {
      if (connectedIds.has(node.id)) return;
      let bestJ = -1;
      let bestSim = -1;
      for (let j = 0; j < nodes.length; j++) {
        if (j === i) continue;
        const sim = cosineSimilarity(nodes[i].vector, nodes[j].vector);
        if (sim > bestSim) { bestSim = sim; bestJ = j; }
      }
      if (bestJ >= 0) {
        links.push({
          source: node.id,
          target: nodes[bestJ].id,
          value: Math.max(bestSim, 0.1),
          similarity: Math.max(bestSim, 0.1),
        });
      }
    });

    return { nodes, links };
  };

  const launchBrowse = () => {
    // BrowseMovies is now self-contained — fetches its own data
    setView('BROWSE');
  };

  const launchGraph = (preSelectedMovieId = null) => {
    const movies = moviesData;
    if (!movies || movies.length === 0) return;

    const graph = buildGraphFromMovies(movies);
    setGraphData(graph);
    setFilteredData(graph);
    setView('GRAPH');
    setIsSearchView(false);

    // Pre-select movie if provided (deep link from browse)
    if (preSelectedMovieId) {
      const movie = graph.nodes.find(n => n.id === preSelectedMovieId);
      if (movie) {
        setTimeout(() => setSelectedMovie(movie), 100);
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Ensure graph is loaded first
    if (!graphData.nodes || graphData.nodes.length === 0) {
      setError("Please launch the engine first!");
      return;
    }

    setSearchLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://127.0.0.1:8000/search', {
        query: searchQuery,
        top_k: 25  // Rich semantic cluster
      });
      console.log('Search results:', res.data);

      const searchData = res.data;
      const searchNodes = searchData.nodes || searchData;

      // Get IDs of search result nodes
      const searchNodeIds = new Set(searchNodes.map(n => n.id));

      // Find all nodes connected to search results from the FULL graph
      const connectedNodeIds = new Set(searchNodeIds);

      // Add all nodes connected to search results from full graph links
      graphData.links.forEach(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;

        if (searchNodeIds.has(sourceId)) {
          connectedNodeIds.add(targetId);
        }
        if (searchNodeIds.has(targetId)) {
          connectedNodeIds.add(sourceId);
        }
      });

      console.log('Search node IDs:', Array.from(searchNodeIds));
      console.log('Connected node IDs:', Array.from(connectedNodeIds));

      // Filter full graph data to include only connected nodes
      const filteredNodes = graphData.nodes.filter(n => connectedNodeIds.has(n.id));
      const filteredLinks = graphData.links.filter(l => {
        const sourceId = l.source.id || l.source;
        const targetId = l.target.id || l.target;
        return connectedNodeIds.has(sourceId) && connectedNodeIds.has(targetId);
      });

      console.log('Filtered nodes before adding search results:', filteredNodes.length);

      // Add search results that aren't already in the filtered nodes
      // This ensures all semantic search matches are displayed, even if not in the initial graph
      searchNodes.forEach(searchNode => {
        if (!filteredNodes.find(n => n.id === searchNode.id)) {
          filteredNodes.push(searchNode);
        }
      });

      console.log('Filtered nodes after adding search results:', filteredNodes.length, 'Filtered links:', filteredLinks.length);

      // Mark search result nodes and preserve search data
      filteredNodes.forEach(node => {
        node.isSearchResult = searchNodeIds.has(node.id);
        // Copy score and ranking from search results
        const searchNode = searchNodes.find(sn => sn.id === node.id);
        if (searchNode) {
          node.score = searchNode.score;
          node.relevanceRank = searchNode.relevanceRank;
          if (searchNode.vector) {
            node.vector = searchNode.vector;
          }
        }
      });

      // Filter links to only include those between nodes that exist in filteredNodes
      const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
      const finalLinks = filteredLinks.filter(l => {
        const sourceId = l.source.id || l.source;
        const targetId = l.target.id || l.target;
        return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
      });

      setFilteredData({ nodes: filteredNodes, links: finalLinks });
      setIsSearchView(true);

      // Auto-select THE TOP SEARCH RESULT (from backend search results, not filtered nodes)
      if (searchNodes.length > 0) {
        // Find the #1 ranked search result in filteredNodes
        const topResult = filteredNodes.find(n => n.id === searchNodes[0].id);
        if (topResult) {
          console.log('Auto-selecting top result:', topResult.title);
          setTimeout(() => setSelectedMovie(topResult), 100);
        }
      }
    } catch (e) {
      if (e.message === 'Network Error') {
        setError("Search failed: Backend unreachable.");
      } else {
        setError("Search failed: " + (e.response?.data?.detail || e.message));
      }
      console.error(e);
    }
    setSearchLoading(false);
  };

  const handleViewAll = () => {
    setFilteredData(graphData);
    setIsSearchView(false);
    setSelectedMovie(null);
    setSearchQuery("");
  };

  // Derive loading state: either TanStack Query is fetching movies or a search is running
  const loading = moviesLoading || searchLoading;

  // GRAPH VIEW
  if (view === 'GRAPH') {
    return (
      <>
        <div className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900" style={{ overflow: 'hidden' }}>
          {/* Navigation */}
          <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 20 }}>
            <button
              onClick={() => setView('LANDING')}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(249,115,22,0.3)',
                color: '#fdba74',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(249,115,22,0.2)';
                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.6)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)';
                e.currentTarget.style.color = '#fdba74';
              }}
            >
              <span style={{ fontSize: '16px' }}>←</span> Back
            </button>
          </div>

          {/* Search Bar */}
          <div style={{
            position: 'absolute',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            width: '100%',
            maxWidth: '700px',
            padding: '0 24px',
          }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by vibe (e.g., 'action thriller', 'romantic comedy')..."
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: '14px',
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(12px)',
                  color: '#fff',
                  border: '1px solid rgba(249,115,22,0.25)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  letterSpacing: '0.2px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(249,115,22,0.6)';
                  e.target.style.boxShadow = '0 0 20px rgba(249,115,22,0.15)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(249,115,22,0.25)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '12px 24px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                  border: 'none',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 15px rgba(249,115,22,0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 25px rgba(249,115,22,0.5)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(249,115,22,0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Search
              </button>
              {isSearchView && (
                <button
                  type="button"
                  onClick={handleViewAll}
                  style={{
                    padding: '12px 20px',
                    borderRadius: '14px',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(249,115,22,0.3)',
                    color: '#fdba74',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249,115,22,0.2)';
                    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.6)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.5)';
                    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)';
                    e.currentTarget.style.color = '#fdba74';
                  }}
                >
                  View All
                </button>
              )}
            </form>
            {(error || moviesError) && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>{error || moviesError?.message}</p>}
          </div>

          {/* Graph */}
          <NebulaGraph
            nodes={filteredData.nodes}
            links={filteredData.links}
            onNodeClick={setSelectedMovie}
            selectedNode={selectedMovie}
          />

          {/* Loading State */}
          {loading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-400 rounded-full animate-spin mb-4"></div>
                <p className="text-orange-300 font-semibold">Building your galaxy...</p>
              </div>
            </div>
          )}
        </div>

        {/* Movie Detail Drawer */}
        <EngineDrawer
          selectedMovie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          similarMovies={selectedMovie ? getSimilarMovies(selectedMovie, graphData.nodes) : []}
          onSelectMovie={setSelectedMovie}
        />
      </>
    );
  }

  // BROWSE VIEW
  if (view === 'BROWSE') {
    return (
      <Suspense>
        <BrowseMovies
          onBack={() => setView('LANDING')}
          onLaunchEngine={() => launchGraph()}
          onMovieClick={(movie) => {
            launchGraph(movie.id);
          }}
        />
        <CommandPalette
          onSelectMovie={(movie) => {
            launchGraph(movie.id);
          }}
        />
      </Suspense>
    );
  }

  // LANDING VIEW
  return (
    <>
      <Hero
        trustBadge={{
          text: "Powered by AI & Vector Embeddings",
          icons: []
        }}
        headline={{
          line1: "Project",
          line2: "Nebula"
        }}
        subtitle="The Semantic Search Engine for Cinema. Search by vibe, emotion, and plot using our 3D Constellation Engine."
        buttons={{
          primary: {
            text: loading ? "Launching..." : "Launch Engine",
            onClick: launchGraph
          },
          secondary: {
            text: "Browse Movies",
            onClick: launchBrowse
          }
        }}
      />
      <CommandPalette
        onSelectMovie={(movie) => {
          launchGraph(movie.id);
        }}
      />
    </>
  );
}