import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export const useAppStore = create((set, get) => ({
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

    // ─── Auth State ───
    user: null,
    session: null,
    profile: null,
    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
    setProfile: (profile) => set({ profile }),

    // ─── Watchlist Feature ───
    watchlist: typeof window !== 'undefined' && localStorage.getItem('nebula_watchlist') 
        ? JSON.parse(localStorage.getItem('nebula_watchlist')) 
        : [],
    
    // ─── User Activity (Diary / Logs) ───
    diaryEntries: typeof window !== 'undefined' && localStorage.getItem('nebula_logs')
        ? JSON.parse(localStorage.getItem('nebula_logs'))
        : [],
    
    userRatings: typeof window !== 'undefined' && localStorage.getItem('nebula_ratings')
        ? JSON.parse(localStorage.getItem('nebula_ratings'))
        : {},
    
    // ─── Sync Actions ───
    syncStore: async () => {
        const { user } = get();
        if (!user) return;

        // Fetch Profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (profile) set({ profile });

        // Fetch Watchlist
        const { data: watchlistData } = await supabase
            .from('watchlist')
            .select('*')
            .eq('user_id', user.id);
        if (watchlistData) {
            const syncedWatchlist = watchlistData.map(item => item.movie_data);
            set({ watchlist: syncedWatchlist });
            localStorage.setItem('nebula_watchlist', JSON.stringify(syncedWatchlist));
        }

        // Fetch Diary
        const { data: diaryData } = await supabase
            .from('diary_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('watched_at', { ascending: false });
        if (diaryData) {
            // Map diary_entries to the expected 'logs' format for components
            const syncedLogs = diaryData.map(entry => ({
                ...entry.movie_data,
                id: entry.movie_id,
                personalRating: entry.rating,
                review: entry.review_text,
                date: entry.watched_at,
                rewatch: entry.is_rewatch,
                tags: entry.tags,
                dbId: entry.id // Keep DB ID for removals
            }));
            set({ diaryEntries: syncedLogs });
            localStorage.setItem('nebula_logs', JSON.stringify(syncedLogs));
        }
    },

    toggleWatchlist: async (movie) => {
        const { user, watchlist } = get();
        const isSaved = watchlist.some(m => String(m.id) === String(movie.id));
        const newWatchlist = isSaved
            ? watchlist.filter(m => String(m.id) !== String(movie.id))
            : [...watchlist, movie];
        
        set({ watchlist: newWatchlist });
        if (typeof window !== 'undefined') {
            localStorage.setItem('nebula_watchlist', JSON.stringify(newWatchlist));
        }

        if (user) {
            if (isSaved) {
                await supabase.from('watchlist').delete()
                    .eq('user_id', user.id)
                    .eq('movie_id', String(movie.id));
            } else {
                await supabase.from('watchlist').upsert({
                    user_id: user.id,
                    movie_id: String(movie.id),
                    movie_data: movie
                });
            }
        }
    },

    clearWatchlist: async () => {
        const { user } = get();
        set({ watchlist: [] });
        if (typeof window !== 'undefined') {
            localStorage.removeItem('nebula_watchlist');
        }
        if (user) {
            await supabase.from('watchlist').delete().eq('user_id', user.id);
        }
    },

    // ─── User Actions ───
    addLog: async (logEntry) => {
        const { user, diaryEntries } = get();
        const newLogs = [logEntry, ...diaryEntries];
        set({ diaryEntries: newLogs });
        if (typeof window !== 'undefined') {
            localStorage.setItem('nebula_logs', JSON.stringify(newLogs));
        }

        if (user) {
            await supabase.from('diary_entries').insert({
                user_id: user.id,
                movie_id: String(logEntry.id),
                movie_data: logEntry,
                rating: logEntry.personalRating,
                review_text: logEntry.review,
                watched_at: logEntry.date,
                is_rewatch: logEntry.rewatch,
                tags: logEntry.tags || [],
                runtime: logEntry.runtime || 0
            });
        }
    },

    removeLog: async (logId) => {
        // logId is 'loggedAt' (timestamp) in legacy, but we'll use it to find the entry
        // If we have a dbId, we use that.
        const { user, diaryEntries } = get();
        const entryToRemove = diaryEntries.find(l => l.loggedAt === logId || l.dbId === logId);
        if (!entryToRemove) return;

        const newLogs = diaryEntries.filter(l => l.loggedAt !== logId && l.dbId !== logId);
        set({ diaryEntries: newLogs });
        if (typeof window !== 'undefined') {
            localStorage.setItem('nebula_logs', JSON.stringify(newLogs));
        }

        if (user) {
            if (entryToRemove.dbId) {
                await supabase.from('diary_entries').delete().eq('id', entryToRemove.dbId);
            } else {
                // Fallback for local logs being removed after login
                await supabase.from('diary_entries').delete()
                    .eq('user_id', user.id)
                    .eq('movie_id', String(entryToRemove.id))
                    .eq('watched_at', entryToRemove.date);
            }
        }
    },

    setUserRating: async (movieId, rating) => {
        const { user, userRatings } = get();
        const newRatings = { ...userRatings, [movieId]: rating };
        set({ userRatings: newRatings });
        if (typeof window !== 'undefined') {
            localStorage.setItem('nebula_ratings', JSON.stringify(newRatings));
        }
        // This is often handled within addLog or a separate 'rating' only update
        // We can add a simple ratings table if needed, but for now we'll rely on diary_entries
    },
}));
