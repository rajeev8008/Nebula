import { create } from 'zustand';

export const useAppStore = create((set) => ({
    view: 'LANDING',
    setView: (view) => set({ view }),

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
}));
