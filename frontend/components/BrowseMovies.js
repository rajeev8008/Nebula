'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useInView } from 'react-intersection-observer';
import MovieCard from './MovieCard';
import MovieRow from './MovieRow';
import { SkeletonSection } from './ui/skeleton';
import { fetchMovies } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore'; // Store for local filters
import { Bookmark, Search, Calendar, Filter, Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import WatchlistPanel from './WatchlistPanel';
import DiaryPanel from './DiaryPanel';

// ─── Constants ───
const CARD_WIDTH = 192;
const CARD_HEIGHT = 288;
const CARD_GAP = 16;
const PAGE_LIMIT = 40;

// ─── Available filter options ───
const DECADES = ['2020s', '2010s', '2000s', '1990s', '1980s', 'Earlier'];
const RATINGS = ['7+', '8+', '9+'];
const MAIN_GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Science Fiction', 'Thriller', 'Animation', 'Romance'];

const SORTS = [
    { label: 'Popularity', value: 'popularity' },
    { label: 'Newest', value: 'release_date_desc' },
    { label: 'Oldest', value: 'release_date_asc' },
    { label: 'Rating (High)', value: 'rating_desc' },
];

const RUNTIMES = [
    { label: 'Normal Runtime', value: '' },
    { label: 'Short (<90m)', value: 'short' },
    { label: 'Standard (90-150m)', value: 'standard' },
    { label: 'Long (150m+)', value: 'long' }
];

// ─── Filter Chip ───
function FilterChip({ label, active, onClick }) {
    return (
        <button
            className="filter-chip"
            onClick={onClick}
            style={{
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.3px',
                cursor: 'pointer',
                border: '1px solid',
                background: active
                    ? 'linear-gradient(135deg, #f97316, #f59e0b)'
                    : 'rgba(255,255,255,0.04)',
                borderColor: active
                    ? 'rgba(249,115,22,0.8)'
                    : 'rgba(255,255,255,0.1)',
                color: active ? '#000' : '#9ca3af',
                boxShadow: active
                    ? '0 2px 12px rgba(249,115,22,0.3)'
                    : 'none',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
            }}
        >
            {label}
        </button>
    );
}

// ─── BrowseMovies ───
const BrowseMovies = ({ onBack, onLaunchEngine, onMovieClick }) => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    // Read filters from URL
    const activeGenre = searchParams.get('genre') || '';
    const activeDecade = searchParams.get('decade') || '';
    const activeRating = searchParams.get('rating') || '';
    const activeMinYear = searchParams.get('min_year') || '';
    const hasActiveUrlFilters = activeGenre || activeDecade || activeRating || activeMinYear;

    // Read local filters from Zustand
    const browseSearchQuery = useAppStore(state => state.browseSearchQuery);
    const setBrowseSearchQuery = useAppStore(state => state.setBrowseSearchQuery);
    const browseSortBy = useAppStore(state => state.browseSortBy);
    const setBrowseSortBy = useAppStore(state => state.setBrowseSortBy);
    const browseRuntime = useAppStore(state => state.browseRuntime);
    const setBrowseRuntime = useAppStore(state => state.setBrowseRuntime);
    
    const hasLocalFilters = browseSearchQuery || browseRuntime || (browseSortBy && browseSortBy !== 'popularity');
    const hasActiveFilters = hasActiveUrlFilters || hasLocalFilters;

    // Scroll container ref for virtualizer
    const scrollRef = useRef(null);
    const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
    const [isDiaryOpen, setIsDiaryOpen] = useState(false);
    const [sortBy, setSortBy] = useState('popularity'); // 'popularity' | 'rating' | 'release_date'
    const [showSortMenu, setShowSortMenu] = useState(false);

    // ─── Intersection Observer sentinel for infinite scroll ───
    const { ref: sentinelRef, inView } = useInView({
        threshold: 0,
        rootMargin: '600px',
    });

    // ─── 1. Grouped Data (Landing — no filters) via useQuery ───
    const {
        data: groupedData = {},
        isLoading: groupedLoading,
        error: groupedError,
    } = useQuery({
        queryKey: ['browse-grouped'],
        queryFn: async () => {
            const genrePromises = MAIN_GENRES.slice(0, 5).map(g => fetchMovies({ genre: g, limit: 12 }));
            const decadePromises = DECADES.slice(0, 3).map(d => fetchMovies({ decade: d, limit: 12 }));

            const [newReleases, ...rest] = await Promise.all([
                fetchMovies({ minYear: 2024, limit: 12 }),
                ...genrePromises,
                ...decadePromises
            ]);

            const genreResults = rest.slice(0, genrePromises.length);
            const decadeResults = rest.slice(genrePromises.length);

            const grouped = { 'New Releases': newReleases.movies };

            MAIN_GENRES.slice(0, 5).forEach((g, i) => {
                grouped[g] = genreResults[i].movies;
            });

            DECADES.slice(0, 3).forEach((d, i) => {
                grouped[d] = decadeResults[i].movies;
            });

            return grouped;
        },
        enabled: !hasActiveFilters, // Only fetch when no filters are active
    });

    // ─── 2. Filtered Grid via useInfiniteQuery ───
    const filterKey = useMemo(
        () => ({ genre: activeGenre, decade: activeDecade, rating: activeRating, minYear: activeMinYear }),
        [activeGenre, activeDecade, activeRating, activeMinYear]
    );

    const {
        data: filteredData,
        isLoading: filteredLoading,
        error: filteredError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['browse-filtered', filterKey],
        queryFn: async ({ pageParam = 1 }) => {
            const params = { page: pageParam, limit: PAGE_LIMIT };
            if (activeGenre) params.genre = activeGenre;
            if (activeDecade) params.decade = activeDecade;
            if (activeRating) params.rating = parseFloat(activeRating);
            if (activeMinYear) params.minYear = parseInt(activeMinYear);
            return fetchMovies(params);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.hasMore ? lastPage.page + 1 : undefined,
        enabled: !!hasActiveFilters, // Only fetch when filters are active
    });

    // Flatten pages into a single movie array
    const rawMovies = useMemo(
        () => filteredData?.pages?.flatMap(p => p.movies) ?? [],
        [filteredData]
    );

    // Apply Client-Side Filtering & Sorting
    const movies = useMemo(() => {
        let result = rawMovies;
        
        // 1. Title Search
        if (browseSearchQuery) {
            const query = browseSearchQuery.toLowerCase();
            result = result.filter(m => m.title.toLowerCase().includes(query));
        }

        // 2. Runtime Filter
        if (browseRuntime) {
            result = result.filter(m => {
                const rt = m.runtime || 0;
                if (!rt) return true; // Keep if we don't know the runtime (TMDB discover often omits it unless requested)
                if (browseRuntime === 'short') return rt < 90;
                if (browseRuntime === 'standard') return rt >= 90 && rt <= 150;
                if (browseRuntime === 'long') return rt > 150;
                return true;
            });
        }

        // 3. Sort
        if (browseSortBy) {
            result = [...result].sort((a, b) => {
                if (browseSortBy === 'popularity') return (b.popularity || 0) - (a.popularity || 0);
                if (browseSortBy === 'release_date_desc') return new Date(b.release_date || 0) - new Date(a.release_date || 0);
                if (browseSortBy === 'release_date_asc') return new Date(a.release_date || 0) - new Date(b.release_date || 0);
                if (browseSortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
                if (browseSortBy === 'rating_asc') return (a.rating || 0) - (b.rating || 0);
                return 0;
            });
        }

        return result;
    }, [rawMovies, browseSearchQuery, browseRuntime, browseSortBy]);

    const totalCount = filteredData?.pages?.[0]?.total ?? 0;

    // ─── Auto-fetch next page when sentinel is in view ───
    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Update URL params
    const updateFilter = useCallback(
        (key, value) => {
            const params = new URLSearchParams(searchParams.toString());
            const current = params.get(key);
            if (current === value) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, pathname, router]
    );

    const handleViewAll = useCallback((title) => {
        const params = new URLSearchParams(searchParams.toString());
        // Clear conflicting filters for a clean "View All" state
        params.delete('genre');
        params.delete('decade');
        params.delete('min_year');

        if (title === 'New Releases') {
            params.set('min_year', '2024');
        } else if (DECADES.includes(title)) {
            params.set('decade', title);
        } else if (MAIN_GENRES.includes(title)) {
            params.set('genre', title);
        }

        router.push(`${pathname}?${params.toString()}`, { scroll: true });
    }, [searchParams, pathname, router]);

    // ── Virtualized Grid (Only for Filtered view) ──
    const [columns, setColumns] = useState(6);
    useEffect(() => {
        const updateColumns = () => {
            if (!scrollRef.current) return;
            const containerWidth = scrollRef.current.clientWidth - 48;
            const cols = Math.max(2, Math.floor((containerWidth + CARD_GAP) / (CARD_WIDTH + CARD_GAP)));
            setColumns(cols);
        };
        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    const rowCount = Math.ceil(movies.length / columns);
    const virtualizer = useVirtualizer({
        count: rowCount,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => CARD_HEIGHT + CARD_GAP,
        overscan: 3,
    });

    // Derive unified loading / error
    const loading = hasActiveFilters ? filteredLoading : groupedLoading;
    const error = hasActiveFilters ? filteredError : groupedError;

    return (
        <div
            ref={scrollRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '100vh',
                background: 'linear-gradient(to bottom, #000 0%, #0f172a 50%, #000 100%)',
                color: 'white',
                overflowY: 'auto',
                overflowX: 'hidden',
            }}
        >
            {/* Navigation Bar */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 50,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid rgba(249,115,22,0.2)',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <button
                    onClick={onBack}
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
                    }}
                >
                    <span style={{ fontSize: '16px' }}>←</span> Back
                </button>

                <h1
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #fdba74, #f97316, #fbbf24)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    Browse Movies
                </h1>

                {/* Browse Search Bar */}
                <div style={{ flex: 1, maxWidth: '400px', margin: '0 24px' }}>
                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '9px', fontSize: '14px', color: '#94a3b8' }}>🔍</span>
                        <input
                            type="text"
                            value={browseSearchQuery}
                            onChange={(e) => setBrowseSearchQuery(e.target.value)}
                            placeholder="Search for movies"
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 36px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(249,115,22,0.3)',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(12px)',
                            }}
                            onFocus={(e) => {
                                e.target.style.background = 'rgba(0,0,0,0.6)';
                                e.target.style.borderColor = 'rgba(249,115,22,0.8)';
                                e.target.style.boxShadow = '0 0 10px rgba(249,115,22,0.2)';
                            }}
                            onBlur={(e) => {
                                e.target.style.background = 'rgba(255,255,255,0.05)';
                                e.target.style.borderColor = 'rgba(249,115,22,0.3)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Tabs */}
                    <button
                        onClick={() => setIsDiaryOpen(true)}
                        style={{
                            padding: '10px 22px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e5e7eb',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease',
                            marginRight: '8px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Calendar size={18} /> Diary
                    </button>

                    <button
                        onClick={() => setIsWatchlistOpen(true)}
                        style={{
                            padding: '10px 22px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e5e7eb',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Bookmark size={18} />
                        Watchlist
                    </button>

                    <button
                        onClick={() => setIsDiaryOpen(true)}
                        style={{
                            padding: '10px 22px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e5e7eb',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <Calendar size={18} />
                        Diary
                    </button>

                    <button
                        onClick={onLaunchEngine}
                        style={{
                            padding: '10px 22px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                            border: 'none',
                            color: '#000',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(249,115,22,0.3)',
                        }}
                    >
                        Launch Engine
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div
                style={{
                    position: 'fixed',
                    top: '76px', // Original was 76px when Nav Bar was simple. Nav Bar is still ~76px
                    left: 0,
                    right: 0,
                    zIndex: 49,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    padding: '12px 24px',
                    overflowX: 'auto',
                }}
                className="hide-scrollbar"
            >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap', minWidth: 'max-content' }}>
                    
                    {/* Local Filters: Sort By & Runtime */}
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginRight: '4px', flexShrink: 0 }}>
                        Sort
                    </span>
                    <select
                        value={browseSortBy}
                        onChange={(e) => setBrowseSortBy(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#e5e7eb',
                            fontSize: '12px',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {SORTS.map(s => <option key={s.value} value={s.value} style={{ background: '#0f172a' }}>{s.label}</option>)}
                    </select>

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 4px' }} />

                    <select
                        value={browseRuntime}
                        onChange={(e) => setBrowseRuntime(e.target.value)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: browseRuntime ? '#000' : '#e5e7eb',
                            backgroundColor: browseRuntime ? '#f97316' : 'rgba(255,255,255,0.04)',
                            borderColor: browseRuntime ? '#ea580c' : 'rgba(255,255,255,0.1)',
                            fontSize: '12px',
                            fontWeight: 600,
                            outline: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        {RUNTIMES.map(r => <option key={r.value} value={r.value} style={{ background: '#0f172a', color: '#fff' }}>{r.label}</option>)}
                    </select>

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 4px' }} />

                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginRight: '4px', flexShrink: 0 }}>
                        Filters
                    </span>

                    {DECADES.map((decade) => (
                        <FilterChip
                            key={decade}
                            label={decade}
                            active={activeDecade === decade}
                            onClick={() => updateFilter('decade', decade)}
                        />
                    ))}

                    {activeMinYear && (
                        <FilterChip
                            label="New Releases"
                            active={true}
                            onClick={() => {
                                const params = new URLSearchParams(searchParams.toString());
                                params.delete('min_year');
                                router.push(`${pathname}?${params.toString()}`, { scroll: false });
                            }}
                        />
                    )}

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 4px' }} />

                    {RATINGS.map((r) => (
                        <FilterChip
                            key={r}
                            label={`★ ${r}`}
                            active={activeRating === String(parseFloat(r))}
                            onClick={() => updateFilter('rating', String(parseFloat(r)))}
                        />
                    ))}

                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 4px' }} />

                    {MAIN_GENRES.map((genre) => (
                        <FilterChip
                            key={genre}
                            label={genre}
                            active={activeGenre === genre}
                            onClick={() => updateFilter('genre', genre)}
                        />
                    ))}

                    {hasActiveFilters && (
                        <>
                            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 4px' }} />
                            <button
                                onClick={() => {
                                    router.push(pathname, { scroll: false });
                                    setBrowseSearchQuery('');
                                    setBrowseRuntime('');
                                    setBrowseSortBy('popularity');
                                }}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    border: '1px solid rgba(239,68,68,0.4)',
                                    background: 'rgba(239,68,68,0.1)',
                                    color: '#f87171',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                ✕ Clear
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div style={{ paddingTop: '152px', paddingBottom: '80px' }}>

                {/* 1. Grouped View (No Filters) */}
                {!hasActiveFilters && !error && (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {loading && !Object.keys(groupedData).length ? (
                            <div style={{ padding: '0 24px' }}>
                                <SkeletonSection cardCount={8} />
                                <SkeletonSection cardCount={8} />
                            </div>
                        ) : (
                            Object.entries(groupedData).map(([title, sectionMovies]) => (
                                <MovieRow
                                    key={title}
                                    title={title}
                                    movies={sectionMovies}
                                    loading={loading}
                                    onMovieClick={onMovieClick}
                                    onViewAll={() => handleViewAll(title)}
                                />
                            ))
                        )}
                    </div>
                )}

                {/* 2. Filtered Grid View */}
                {hasActiveFilters && !error && (
                    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 24px' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                                Showing <span style={{ color: '#fdba74', fontWeight: 600 }}>{totalCount}</span> movies
                                {activeGenre && <> in <span style={{ color: '#fb923c' }}>{activeGenre}</span></>}
                                {activeDecade && <> from the <span style={{ color: '#fb923c' }}>{activeDecade}</span></>}
                                {activeRating && <> rated <span style={{ color: '#fb923c' }}>★ {activeRating}+</span></>}
                                {activeMinYear && <> from <span style={{ color: '#fb923c' }}>{activeMinYear} onwards</span></>}
                            </p>
                        </div>

                        {filteredLoading && movies.length === 0 ? (
                            <SkeletonSection cardCount={8} />
                        ) : movies.length > 0 ? (
                            <div
                                style={{
                                    height: `${virtualizer.getTotalSize()}px`,
                                    width: '100%',
                                    position: 'relative',
                                }}
                            >
                                {virtualizer.getVirtualItems().map((virtualRow) => {
                                    const startIdx = virtualRow.index * columns;
                                    const rowMovies = movies.slice(startIdx, startIdx + columns);
                                    return (
                                        <div
                                            key={virtualRow.key}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: `${CARD_HEIGHT}px`,
                                                transform: `translateY(${virtualRow.start}px)`,
                                                display: 'flex',
                                                gap: `${CARD_GAP}px`,
                                            }}
                                        >
                                            {rowMovies.map((movie) => (
                                                <div key={movie.id} style={{ width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px`, flexShrink: 0 }}>
                                                    <MovieCard movie={movie} onClick={onMovieClick} onSeeInGraph={onMovieClick} />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '80px 24px', color: '#6b7280' }}>
                                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
                                <p style={{ fontSize: '18px', fontWeight: 600, color: '#9ca3af' }}>No movies match your filters</p>
                            </div>
                        )}

                        {/* Intersection Observer Sentinel — triggers fetchNextPage */}
                        <div ref={sentinelRef} style={{ height: '1px', width: '100%' }} />

                        {isFetchingNextPage && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(249,115,22,0.2)', borderTopColor: '#f97316', animation: 'spin 0.8s linear infinite' }} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Error State */}
                {error && (
                    <div style={{ textAlign: 'center', padding: '80px 24px', color: '#f87171' }}>
                        <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>Failed to load movies</p>
                        <p style={{ fontSize: '13px', color: '#9ca3af' }}>{error.message || String(error)}</p>
                    </div>
                )}
            </div>

            {/* Watchlist & Diary Panels */}
            <WatchlistPanel 
                isOpen={isWatchlistOpen} 
                onClose={() => setIsWatchlistOpen(false)} 
                onMovieClick={(movie) => onMovieClick(movie)}
            />
            <DiaryPanel 
                isOpen={isDiaryOpen} 
                onClose={() => setIsDiaryOpen(false)} 
                onMovieClick={(movie) => onMovieClick(movie)}
            />
        </div>
    );
};

export default BrowseMovies;
