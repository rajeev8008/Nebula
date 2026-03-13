import { create } from 'zustand';

export const useAppStore = create((set) => ({
    view: 'LANDING',
    setView: (view) => set({ view }),

    engineEntrySource: 'direct', // 'direct' | 'browse'
    setEngineEntrySource: (source) => set({ engineEntrySource: source }),

    graphData: { nodes: [], links: [] },
    setGraphData: (graphData) => set({ graphData }),

    filteredData: null,
    setFilteredData: (filteredData) => set({ filteredData }),

    selectedMovie: null,
    setSelectedMovie: (selectedMovie) => set({ selectedMovie }),

    searchQuery: '',
    setSearchQuery: (searchQuery) => set({ searchQuery }),

    isSearchView: false,
    setIsSearchView: (isSearchView) => set({ isSearchView }),

    error: null,
    setError: (error) => set({ error }),

    searchLoading: false,
    setSearchLoading: (searchLoading) => set({ searchLoading }),

    engineQuery: '',
    setEngineQuery: (engineQuery) => set({ engineQuery }),

    engineResults: [],
    setEngineResults: (engineResults) => set({ engineResults }),

    selectedEngineMovie: null,
    setSelectedEngineMovie: (selectedEngineMovie) => set({ selectedEngineMovie }),

    engineStage: 'search', // 'search' | 'building' | 'graph'
    setEngineStage: (engineStage) => set({ engineStage }),

    hasSeenLoadingAnimation: false,
    setHasSeenLoadingAnimation: (val) => set({ hasSeenLoadingAnimation: val }),

    browseSearchQuery: '',
    setBrowseSearchQuery: (browseSearchQuery) => set({ browseSearchQuery }),

    browseSortBy: 'popularity', 
    setBrowseSortBy: (browseSortBy) => set({ browseSortBy }),

    browseRuntime: '', 
    setBrowseRuntime: (browseRuntime) => set({ browseRuntime }),

    // ─── Watchlist Feature ───
    watchlist: typeof window !== 'undefined' && localStorage.getItem('nebula_watchlist') 
        ? JSON.parse(localStorage.getItem('nebula_watchlist')) 
        : [],
    
    // ─── User Activity (Logs & Ratings) ───
    logs: typeof window !== 'undefined' && localStorage.getItem('nebula_logs')
        ? JSON.parse(localStorage.getItem('nebula_logs'))
        : [],
    
    userRatings: typeof window !== 'undefined' && localStorage.getItem('nebula_ratings')
        ? JSON.parse(localStorage.getItem('nebula_ratings'))
        : {},
    
    toggleWatchlist: (movie) => set((state) => {
        const isSaved = state.watchlist.some(m => m.id === movie.id);
        const newWatchlist = isSaved
            ? state.watchlist.filter(m => m.id !== movie.id)
            : [...state.watchlist, movie];
        
        if (typeof window !== 'undefined') {
            localStorage.setItem('nebula_watchlist', JSON.stringify(newWatchlist));
        }
        return { watchlist: newWatchlist };
    }),

    clearWatchlist: () => set(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('nebula_watchlist');
        }
        return { watchlist: [] };
    }),

    // ─── User Actions ───
    addLog: (logEntry) => set((state) => {
        const newLogs = [logEntry, ...state.logs];
        if (typeof window !== 'undefined') {
            localStorage.setItem('nebula_logs', JSON.stringify(newLogs));
        }
        return { logs: newLogs };
    }),

    removeLog: (logId) => set((state) => {
        const newLogs = state.logs.filter(l => l.loggedAt !== logId);
        if (typeof window !== 'undefined') {
            localStorage.setItem('nebula_logs', JSON.stringify(newLogs));
        }
        return { logs: newLogs };
    }),

    setUserRating: (movieId, rating) => set((state) => {
        const newRatings = { ...state.userRatings, [movieId]: rating };
        if (typeof window !== 'undefined') {
            localStorage.setItem('nebula_ratings', JSON.stringify(newRatings));
        }
        return { userRatings: newRatings };
    }),
}));
