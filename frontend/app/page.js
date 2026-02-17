'use client';

import { useState, useEffect } from 'react';
import Hero from '@/components/ui/animated-shader-hero';
import NebulaGraph from '@/components/NebulaGraph';
import axios from 'axios';

export default function Home() {
  const [view, setView] = useState('LANDING');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] }); // Full graph
  const [filteredData, setFilteredData] = useState({ nodes: [], links: [] }); // Filtered for search
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [isSearchView, setIsSearchView] = useState(false);

  const launchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://127.0.0.1:8000/graph');
      console.log('Graph data received:', res.data);
      const data = res.data;
      setGraphData(data); // Store full graph
      setFilteredData(data); // Initially show everything
      setView('GRAPH');
      setIsSearchView(false);
    } catch (e) {
      if (e.message === 'Network Error') {
        setError("Backend unreachable. Check CORS or if Uvicorn is running on 127.0.0.1:8000.");
      } else {
        setError("Backend Error: " + (e.response?.data?.detail || e.message));
      }
      console.error(e);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Ensure graph is loaded first
    if (!graphData.nodes || graphData.nodes.length === 0) {
      setError("Please launch the engine first!");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('http://127.0.0.1:8000/search', {
        query: searchQuery,
        top_k: 5  // Get top 5 most relevant movies
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

      console.log('Filtered nodes:', filteredNodes.length, 'Filtered links:', filteredLinks.length);

      // Mark search result nodes and preserve search data
      filteredNodes.forEach(node => {
        node.isSearchResult = searchNodeIds.has(node.id);
        // Copy score and ranking from search results
        const searchNode = searchNodes.find(sn => sn.id === node.id);
        if (searchNode) {
          node.score = searchNode.score;
          node.relevanceRank = searchNode.relevanceRank;
        }
      });

      setFilteredData({ nodes: filteredNodes, links: filteredLinks });
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
    setLoading(false);
  };

  const handleViewAll = () => {
    setFilteredData(graphData);
    setIsSearchView(false);
    setSelectedMovie(null);
    setSearchQuery("");
  };

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
            {error && <p style={{ color: '#f87171', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>{error}</p>}
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

        {/* Movie Detail Side Panel - FIXED overlay */}
        {selectedMovie && (
          <div
            className="animate-slide-panel-in hide-scrollbar"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              width: '480px',
              zIndex: 9999,
              background: 'linear-gradient(135deg, rgba(15,23,42,0.97) 0%, rgba(10,15,30,0.99) 100%)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              borderLeft: '1px solid rgba(249,115,22,0.25)',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.5), -2px 0 15px rgba(249,115,22,0.1)',
              overflowY: 'auto',
              pointerEvents: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Poster Header with Gradient Overlay */}
            {selectedMovie.poster && (
              <div style={{ position: 'relative', width: '100%', height: '220px', flexShrink: 0 }}>
                <img
                  src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster}`}
                  alt={selectedMovie.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                {/* Gradient overlay on poster */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(10,15,30,1) 0%, rgba(10,15,30,0.7) 40%, rgba(10,15,30,0.1) 100%)',
                }}></div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedMovie(null)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#e5e7eb',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    zIndex: 10000,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(249,115,22,0.8)';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                    e.currentTarget.style.color = '#e5e7eb';
                    e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                  }}
                >
                  ✕
                </button>

                {/* Title overlaying poster bottom */}
                <div style={{ position: 'absolute', bottom: '16px', left: '24px', right: '60px' }}>
                  <h2 style={{
                    fontSize: '1.75rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #fdba74, #f97316, #fbbf24)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.2,
                    margin: 0,
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                  }}>
                    {selectedMovie.title}
                  </h2>
                </div>
              </div>
            )}

            {/* Content */}
            <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

              {/* Title (fallback if no poster) */}
              {!selectedMovie.poster && (
                <h2 style={{
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #fdba74, #f97316, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                  margin: 0,
                }}>
                  {selectedMovie.title}
                </h2>
              )}

              {/* Genre Tags */}
              {selectedMovie.genres && selectedMovie.genres !== 'Unknown' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedMovie.genres.split(', ').map((genre, i) => (
                    <span key={i} style={{
                      padding: '4px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      background: 'rgba(249,115,22,0.15)',
                      color: '#fdba74',
                      borderRadius: '20px',
                      border: '1px solid rgba(249,115,22,0.3)',
                    }}>
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: selectedMovie.score ? '1fr 1fr' : '1fr',
                gap: '10px',
              }}>
                {/* Rating */}
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(249,115,22,0.15)',
                }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Rating</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#fbbf24', fontSize: '20px' }}>★</span>
                    <span style={{ color: '#fb923c', fontSize: '1.25rem', fontWeight: 700 }}>
                      {selectedMovie.rating ? selectedMovie.rating.toFixed(1) : 'N/A'}
                    </span>
                    <span style={{ color: '#6b7280', fontSize: '13px' }}>/10</span>
                  </div>
                </div>

                {/* Match Score */}
                {selectedMovie.score && (
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    border: '1px solid rgba(249,115,22,0.15)',
                  }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Match</div>
                    <div style={{ color: '#4ade80', fontSize: '1.25rem', fontWeight: 700 }}>
                      {(selectedMovie.score * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Meta Info Row */}
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
              }}>
                {selectedMovie.release_date && selectedMovie.release_date !== 'Unknown' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontSize: '14px' }}>📅</span>
                    <span style={{ fontSize: '13px', color: '#d1d5db', fontWeight: 500 }}>
                      {new Date(selectedMovie.release_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
                {selectedMovie.language && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <span style={{ fontSize: '14px' }}>🌐</span>
                    <span style={{ fontSize: '13px', color: '#d1d5db', fontWeight: 500, textTransform: 'uppercase' }}>
                      {selectedMovie.language}
                    </span>
                  </div>
                )}
              </div>

              {/* Overview */}
              {selectedMovie.overview && (
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(249,115,22,0.12)',
                }}>
                  <h3 style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#fb923c',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '1.5px',
                  }}>Synopsis</h3>
                  <p style={{
                    fontSize: '13px',
                    color: '#d1d5db',
                    lineHeight: 1.6,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 5,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {selectedMovie.overview}
                  </p>
                </div>
              )}

              {/* Popularity Bar */}
              {selectedMovie.popularity && (
                <div style={{
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  border: '1px solid rgba(249,115,22,0.12)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Popularity</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fdba74' }}>
                      {selectedMovie.popularity.toFixed(1)}
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(55,65,81,0.6)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${Math.min(selectedMovie.popularity, 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #f97316, #fbbf24)',
                      borderRadius: '3px',
                      transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // LANDING VIEW
  return (
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
          text: "Learn More",
          onClick: () => window.open('https://github.com/rajeev8008/nebula', '_blank')
        }
      }}
    />
  );
}