'use client';

import { useState, useEffect } from 'react';
import Hero from '@/components/ui/animated-shader-hero';
import NebulaGraph from '@/components/NebulaGraph';
import { MagnetizeButton } from '@/components/ui/magnetize-button';
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
      setError("Backend offline. Make sure uvicorn is running.");
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
      setError("Search failed: " + (e.response?.data?.detail || e.message));
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
      <div className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900">
        {/* Navigation */}
        <div className="absolute top-6 left-6 z-20">
          <MagnetizeButton 
            onClick={() => setView('LANDING')}
            particleCount={14}
          >
            Back
          </MagnetizeButton>
        </div>

        {/* Search Bar */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-2xl px-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vibe (e.g., 'action thriller', 'romantic comedy')..."
              className="flex-1 px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl text-white border border-orange-500/30 focus:border-orange-400 focus:outline-none transition-all placeholder-gray-400"
            />
            <MagnetizeButton 
              type="submit"
              particleCount={12}
            >
              Search
            </MagnetizeButton>
            {isSearchView && (
              <MagnetizeButton 
                onClick={handleViewAll}
                particleCount={10}
              >
                View All
              </MagnetizeButton>
            )}
          </form>
          {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
        </div>

        {/* Graph */}
        <NebulaGraph 
          nodes={filteredData.nodes} 
          links={filteredData.links} 
          onNodeClick={setSelectedMovie}
          selectedNode={selectedMovie}
        />

        {/* 3D Right Panel - Movie Detail */}
        {selectedMovie && (
          <div className="absolute top-0 right-0 h-full w-[450px] z-30 bg-gradient-to-l from-slate-900/98 via-slate-900/95 to-transparent backdrop-blur-xl border-l border-orange-500/30 shadow-2xl shadow-orange-500/20 animate-in slide-in-from-right duration-500 overflow-y-auto">
            <div className="p-8 space-y-6">
              <button 
                onClick={() => setSelectedMovie(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-orange-400 transition-all text-2xl hover:rotate-90 duration-300"
              >
                ×
              </button>
              
              <div className="pt-4">
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-400 to-yellow-500 mb-2 leading-tight">
                  {selectedMovie.title}
                </h2>
                
                {selectedMovie.genres && selectedMovie.genres !== 'Unknown' && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedMovie.genres.split(', ').map((genre, i) => (
                      <span key={i} className="px-3 py-1 text-xs font-semibold bg-orange-500/20 text-orange-300 rounded-full border border-orange-500/30">
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedMovie.poster && (
                <div className="relative group">
                  <img 
                    src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster}`} 
                    alt={selectedMovie.title}
                    className="w-full h-[500px] object-cover rounded-xl border-2 border-orange-500/30 shadow-lg shadow-orange-500/20 transition-transform group-hover:scale-[1.02] duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent rounded-xl"></div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-lg p-4 border border-orange-500/20">
                  <div className="text-xs text-gray-400 mb-1">Rating</div>
                  <div className="flex items-center gap-2 text-orange-400 text-xl font-bold">
                    <span>★</span>
                    <span>{selectedMovie.rating ? selectedMovie.rating.toFixed(1) : 'N/A'}</span>
                  </div>
                </div>
                
                {selectedMovie.score && (
                  <div className="bg-black/30 rounded-lg p-4 border border-orange-500/20">
                    <div className="text-xs text-gray-400 mb-1">Match Score</div>
                    <div className="text-xl font-bold text-orange-400">
                      {(selectedMovie.score * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
                
                {selectedMovie.release_date && selectedMovie.release_date !== 'Unknown' && (
                  <div className="bg-black/30 rounded-lg p-4 border border-orange-500/20">
                    <div className="text-xs text-gray-400 mb-1">Release Date</div>
                    <div className="text-sm font-semibold text-orange-300">
                      {new Date(selectedMovie.release_date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                )}
                
                {selectedMovie.language && (
                  <div className="bg-black/30 rounded-lg p-4 border border-orange-500/20">
                    <div className="text-xs text-gray-400 mb-1">Language</div>
                    <div className="text-sm font-semibold text-orange-300 uppercase">
                      {selectedMovie.language}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedMovie.overview && (
                <div className="bg-black/30 rounded-lg p-5 border border-orange-500/20">
                  <h3 className="text-sm font-bold text-orange-300 mb-3 uppercase tracking-wider">Overview</h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {selectedMovie.overview}
                  </p>
                </div>
              )}
              
              {selectedMovie.popularity && (
                <div className="bg-black/30 rounded-lg p-4 border border-orange-500/20">
                  <div className="text-xs text-gray-400 mb-2">Popularity Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full transition-all duration-500"
                        style={{ width: `${Math.min(selectedMovie.popularity, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-orange-300">
                      {selectedMovie.popularity.toFixed(1)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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