'use client';

import { useState } from 'react';
import Hero from '@/components/ui/animated-shader-hero';
import NebulaGraph from '@/components/NebulaGraph';
import axios from 'axios';

export default function Home() {
  const [view, setView] = useState('LANDING');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  const launchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('http://127.0.0.1:8000/graph');
      setNodes(res.data.nodes || []);
      setView('GRAPH');
    } catch (e) {
      setError("Backend offline. Make sure uvicorn is running.");
      console.error(e);
    }
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      const res = await axios.post('http://127.0.0.1:8000/search', { 
        query: searchQuery, 
        top_k: 20 
      });
      const newNodes = res.data.map(m => ({ 
        ...m, 
        val: 5,
        id: m.id || m.title 
      }));
      setNodes(newNodes);
    } catch (e) { 
      setError("Search failed");
      console.error(e); 
    }
  };

  // GRAPH VIEW
  if (view === 'GRAPH') {
    return (
      <div className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900">
        {/* Navigation */}
        <div className="absolute top-6 left-6 z-20">
          <button 
            onClick={() => setView('LANDING')}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/75"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Home
          </button>
        </div>

        {/* Search Bar */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-lg px-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by vibe (e.g., 'sad robots in space')..."
              className="flex-1 px-6 py-3 rounded-full bg-black/40 backdrop-blur-xl text-white border border-cyan-500/30 focus:border-cyan-400 focus:outline-none transition-all placeholder-gray-400"
            />
            <button 
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-full font-semibold transition-all shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/75"
            >
              🔍
            </button>
          </form>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>

        {/* Graph */}
        <NebulaGraph nodes={nodes} onNodeClick={setSelectedMovie} />

        {/* Movie Detail Card */}
        {selectedMovie && (
          <div className="absolute bottom-8 left-8 z-30 w-96 bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-500/20 animate-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => setSelectedMovie(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-cyan-400 transition text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400 mb-3">
              {selectedMovie.title}
            </h2>
            {selectedMovie.poster && (
              <img 
                src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster}`} 
                alt={selectedMovie.title}
                className="w-full h-48 object-cover rounded-xl mb-4 border border-cyan-500/20"
              />
            )}
            <div className="space-y-2">
              <p className="text-sm text-gray-300 line-clamp-4">{selectedMovie.overview}</p>
              <div className="flex items-center gap-2 text-cyan-400 text-sm font-semibold mt-3">
                <span className="text-lg">⭐</span>
                Similarity: {(selectedMovie.score * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin mb-4"></div>
              <p className="text-cyan-300 font-semibold">Building your galaxy...</p>
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
        icons: ["🚀", "🤖"]
      }}
      headline={{
        line1: "Project",
        line2: "Nebula"
      }}
      subtitle="The Semantic Search Engine for Cinema. Search by vibe, emotion, and plot using our 3D Constellation Engine."
      buttons={{
        primary: {
          text: loading ? "⏳ Launching..." : "🚀 Launch Engine",
          onClick: launchGraph
        },
        secondary: {
          text: "📖 Learn More",
          onClick: () => window.open('https://github.com/rajeev8008/nebula', '_blank')
        }
      }}
    />
  );
}