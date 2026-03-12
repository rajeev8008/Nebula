'use client';

import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/useAppStore';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const Hero = dynamic(() => import('@/components/ui/animated-shader-hero'), { ssr: false });
import NebulaGraph from '@/components/NebulaGraph';
import EngineDrawer from '@/components/EngineDrawer';
import MovieDetailPanel from '@/components/MovieDetailPanel';
import BrowseMovies from '@/components/BrowseMovies';
import CommandPalette from '@/components/CommandPalette';
import ErrorBoundary from '@/components/ErrorBoundary';

// ─── Similar Movies Helper ───
function getSimilarMovies(targetMovie, links, allNodes, limit = 6) {
  if (!targetMovie || !links || !allNodes) return [];
  const targetId = String(targetMovie.id);
  
  const connectedLinks = links.filter(l => {
    const sId = String(l.source?.id || l.source);
    const tId = String(l.target?.id || l.target);
    return sId === targetId || tId === targetId;
  });

  connectedLinks.sort((a, b) => (b.similarity || b.value || 0) - (a.similarity || a.value || 0));
  
  const similarNodes = [];
  const seenIds = new Set([targetId]);

  for (const link of connectedLinks) {
    if (similarNodes.length >= limit) break;
    
    const sId = String(link.source?.id || link.source);
    const tId = String(link.target?.id || link.target);
    const neighborId = sId === targetId ? tId : sId;
    
    if (seenIds.has(neighborId)) continue;
    
    const neighborNode = allNodes.find(n => String(n.id) === neighborId);
    if (neighborNode) {
      similarNodes.push({
        ...neighborNode,
        _similarity: link.similarity || link.value || 0.1
      });
      seenIds.add(neighborId);
    }
  }
  return similarNodes;
}

export default function Home() {
  const view = useAppStore((state) => state.view);
  const setView = useAppStore((state) => state.setView);
  
  // Graph & Filtered Data (Preserved for compatibility if needed, but we'll use graphData for the Engine)
  const graphData = useAppStore((state) => state.graphData);
  const setGraphData = useAppStore((state) => state.setGraphData);
  
  const selectedMovie = useAppStore((state) => state.selectedMovie);
  const setSelectedMovie = useAppStore((state) => state.setSelectedMovie);
  
  const error = useAppStore((state) => state.error);
  const setError = useAppStore((state) => state.setError);
  
  const searchLoading = useAppStore((state) => state.searchLoading);
  const setSearchLoading = useAppStore((state) => state.setSearchLoading);

  // New Engine State Slices
  const engineEntrySource = useAppStore((state) => state.engineEntrySource);
  const setEngineEntrySource = useAppStore((state) => state.setEngineEntrySource);
  const engineQuery = useAppStore((state) => state.engineQuery);
  const engineResults = useAppStore((state) => state.engineResults);
  const setEngineResults = useAppStore((state) => state.setEngineResults);
  const selectedEngineMovie = useAppStore((state) => state.selectedEngineMovie);
  const setSelectedEngineMovie = useAppStore((state) => state.setSelectedEngineMovie);
  const setEngineStage = useAppStore((state) => state.setEngineStage);
  
  const [centralNodeId, setCentralNodeId] = useState(null);

  // ─── Engine Specific Handlers ───
    const launchGraph = (source = 'direct') => {
      setView('GRAPH');
      setEngineEntrySource(source);
      // Clear state on fresh launch
      setGraphData({ nodes: [], links: [] });
      setEngineResults([]);
      setSelectedEngineMovie(null);
      setCentralNodeId(null);
      setEngineStage('search');
      useAppStore.getState().setEngineQuery('');
      useAppStore.setState({ hasSeenLoadingAnimation: false });
    };

  const exitEngineToBrowse = () => {
    setView('BROWSE');
    useAppStore.setState({ hasSeenLoadingAnimation: false });
    setEngineStage('search');
  };

  const launchBrowse = () => {
    setView('BROWSE');
  };

  // Listen for the custom search event dispatched from EngineDrawer
  useEffect(() => {
    const handleEngineSearch = async (e) => {
      const query = e.detail;
      if (!query.trim()) return;
      
      setSearchLoading(true);
      setEngineStage('building');
      setError(null);
      
      try {
        const res = await axios.post('http://127.0.0.1:8000/engine/search', {
          query: query
        });
        
        const results = res.data.results || [];
        setEngineResults(results);
        
        if (results.length > 0) {
            // Auto-select the top result
            const topResult = results[0];
            setSelectedEngineMovie(topResult);
            
            // Immediately start building the graph for the top result
            try {
                const similarRes = await axios.get(`http://127.0.0.1:8000/engine/similar/${topResult.id}`);
                setGraphData({
                    nodes: similarRes.data.nodes,
                    links: similarRes.data.links
                });
                setCentralNodeId(similarRes.data.centralNodeId);
                setEngineStage('graph');
            } catch (err) {
                console.error("Failed to load auto-similar graph:", err);
                setError("Failed to build galaxy for: " + topResult.title);
                setEngineStage('search'); // fallback
            }
        } else {
            // Clear graph if no results found
            setGraphData({ nodes: [], links: [] });
            setCentralNodeId(null);
            setSelectedEngineMovie(null);
        }
        
      } catch (err) {
        setError("Search failed: " + (err.response?.data?.detail || err.message));
        console.error(err);
        setEngineStage('search'); // fallback on failure
      } finally {
        setSearchLoading(false);
      }
    };

    const handleClearSelection = () => {
        setSelectedEngineMovie(null);
    };

    document.addEventListener('engine-search', handleEngineSearch);
    document.addEventListener('engine-clear-selection', handleClearSelection);
    return () => {
        document.removeEventListener('engine-search', handleEngineSearch);
        document.removeEventListener('engine-clear-selection', handleClearSelection);
    };
  }, [setSearchLoading, setEngineResults, setGraphData, setError, setSelectedEngineMovie, setEngineStage]);

  // Load Graph Cluster when a movie is selected from sidebar (or from graph nodes)
  const handleSelectEngineMovie = async (movie) => {
    setSelectedEngineMovie(movie); // Opens detail panel immediately
    
    // Only fetch new graph cluster if clicking a completely new central node
    if (centralNodeId !== movie.id) {
        setSearchLoading(true);
        try {
            const res = await axios.get(`http://127.0.0.1:8000/engine/similar/${movie.id}`);
            
            setGraphData({
                nodes: res.data.nodes,
                links: res.data.links
            });
            setCentralNodeId(res.data.centralNodeId);
        } catch (err) {
            console.error("Failed to load similar graph:", err);
            setError("Failed to build galaxy for: " + movie.title);
        } finally {
            setSearchLoading(false);
        }
    }
  };

  // ─── View Renders ───
  
  if (view === 'GRAPH') {
    return (
      <>
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1, overflow: 'hidden' }} className="bg-gradient-to-br from-slate-950 via-black to-slate-900">
          
          {/* Main Graph Component */}
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <ErrorBoundary>
                <NebulaGraph
                nodes={graphData.nodes}
                links={graphData.links}
                onNodeClick={(node) => {
                    // When a node in the graph is clicked, open detail panel AND load its neighborhood
                    handleSelectEngineMovie(node);
                }}
                onNodeHover={(node) => {
                    // When a node is hovered, just update the detail panel (don't rebuild graph)
                    if (node) {
                        setSelectedEngineMovie(node);
                    }
                }}
                centralNodeId={centralNodeId}
                />
            </ErrorBoundary>
            
            {/* Minimal inline spinner for subsequent node clicks */}
            {searchLoading && useAppStore.getState().hasSeenLoadingAnimation && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 'calc(50% + 180px)', // Offset for left panel
                    transform: 'translate(-50%, -50%)',
                    zIndex: 40,
                    background: 'rgba(15,23,42,0.6)',
                    padding: '16px 24px',
                    borderRadius: '30px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(249,115,22,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#fdba74',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(249,115,22,0.3)', borderTopColor: '#f97316', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    Updating Graph...
                </div>
            )}
          </div>

          {/* Engine Sidebar (Search & Results) */}
          <EngineDrawer onSelectMovie={handleSelectEngineMovie} />

          {/* Movie Detail Panel (Right Side) */}
          <MovieDetailPanel
            selectedMovie={selectedEngineMovie}
            onClose={() => setSelectedEngineMovie(null)}
            similarMovies={selectedEngineMovie ? getSimilarMovies(selectedEngineMovie, graphData.links, graphData.nodes) : []}
            onSelectMovie={handleSelectEngineMovie}
          />



          {/* Error Toast */}
          {error && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-900/80 border border-red-500/50 text-red-200 rounded-xl z-50 shadow-xl backdrop-blur-md">
                {error}
                <button onClick={() => setError(null)} className="ml-4 text-red-400 hover:text-red-200">✕</button>
            </div>
          )}
        </div>
      </>
    );
  }

  if (view === 'BROWSE') {
    return (
      <Suspense>
        <BrowseMovies
          onBack={() => setView('LANDING')}
          onLaunchEngine={() => launchGraph('browse')}
          onMovieClick={(movie) => {
             // For Browse view, just set the selected movie so the panel opens
             setSelectedMovie(movie);
          }}
        />
        <MovieDetailPanel
            selectedMovie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
            similarMovies={[]}
            onSelectMovie={(movie) => setSelectedMovie(movie)}
            onLaunchEngine={() => {
                // If the "Launch Engine" button is clicked inside the Browser's movie detail panel
                launchGraph('browse');
                useAppStore.getState().setEngineQuery(selectedMovie.title);
                
                // Immediately auto-select and build the graph for this movie
                setSelectedEngineMovie(selectedMovie);
                
                // Mock an event search or directly call the fetch block
                setSearchLoading(true);
                setEngineStage('building');
                setError(null);
                
                axios.get(`http://127.0.0.1:8000/engine/similar/${selectedMovie.id}`)
                    .then(similarRes => {
                        const nodes = similarRes.data.nodes || [];
                        setGraphData({
                            nodes: nodes,
                            links: similarRes.data.links
                        });
                        setCentralNodeId(similarRes.data.centralNodeId);
                        
                        // Populate results sidebar with the nodes found for this movie
                        // Make sure the seed movie is first, then the neighbors
                        const sortedResults = [...nodes].sort((a, b) => 
                            (a.id === selectedMovie.id ? -1 : (b.id === selectedMovie.id ? 1 : 0))
                        );
                        setEngineResults(sortedResults);
                        
                        setEngineStage('graph');
                        useAppStore.setState({ hasSeenLoadingAnimation: true });
                    })
                    .catch(err => {
                        console.error("Failed to load auto-similar graph:", err);
                        setError("Failed to build galaxy for: " + selectedMovie.title);
                        setEngineStage('search');
                    })
                    .finally(() => {
                        setSearchLoading(false);
                        setSelectedMovie(null); // Close the BROWSE view's detail panel
                    });
            }}
        />
        <CommandPalette
          onSelectMovie={(movie) => {
             launchGraph('direct');
             handleSelectEngineMovie(movie);
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
          text: "Powered by Vector Embeddings & Semantic AI",
          icons: []
        }}
        headline={{
          line1: "",
          line2: "Nebula"
        }}
        subtitle="The Semantic Cinema Engine. Describe the vibe. Discover the film."
        buttons={{
          primary: {
            text: "Launch Engine",
            onClick: () => launchGraph('direct')
          },
          secondary: {
            text: "Browse Movies",
            onClick: launchBrowse
          }
        }}
      />
      <CommandPalette
        onSelectMovie={(movie) => {
           launchGraph('direct');
           handleSelectEngineMovie(movie);
        }}
      />
    </>
  );
}