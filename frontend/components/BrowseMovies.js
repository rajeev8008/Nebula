'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import MovieCard from './MovieCard';
import MovieRow from './MovieRow';
import { SkeletonSection } from './ui/skeleton';
import { fetchMovies } from '@/lib/api';

// ─── Constants ───
const CARD_WIDTH = 192;
const CARD_HEIGHT = 288;
const CARD_GAP = 16;
const PAGE_LIMIT = 40;

// ─── Available filter options ───
const DECADES = ['2020s', '2010s', '2000s', '1990s', 'Earlier'];
const RATINGS = ['7+', '8+', '9+'];
const MAIN_GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Science Fiction', 'Thriller', 'Animation', 'Romance'];

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
    const hasActiveFilters = activeGenre || activeDecade || activeRating || activeMinYear;

    // Data state
    const [movies, setMovies] = useState([]);
    const [groupedData, setGroupedData] = useState({});
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState(null);

    // Scroll container ref for virtualizer
    const scrollRef = useRef(null);

    // 1. Fetch Grouped Data (Landing state)
    const loadGroupedData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // New Releases: 2024+
            // Genres: Main ones
            // Decades: Decades list
            const genrePromises = MAIN_GENRES.slice(0, 5).map(g => fetchMovies({ genre: g, limit: 12 }));
            const decadePromises = DECADES.slice(0, 3).map(d => fetchMovies({ decade: d, limit: 12 }));

            const [newReleases, ...rest] = await Promise.all([
                fetchMovies({ minYear: 2024, limit: 12 }),
                ...genrePromises,
                ...decadePromises
            ]);

            const genreResults = rest.slice(0, genrePromises.length);
            const decadeResults = rest.slice(genrePromises.length);

            const newGrouped = {
                'New Releases': newReleases.movies
            };

            MAIN_GENRES.slice(0, 5).forEach((g, i) => {
                newGrouped[g] = genreResults[i].movies;
            });

            DECADES.slice(0, 3).forEach((d, i) => {
                newGrouped[d] = decadeResults[i].movies;
            });

            setGroupedData(newGrouped);
        } catch (err) {
            console.error('Failed to load grouped movies:', err);
            setError("Failed to load movie categories.");
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Fetch Filtered Data (Grid state)
    const loadFilteredMovies = useCallback(async (page = 1, append = false) => {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        try {
            const params = { page, limit: PAGE_LIMIT };
            if (activeGenre) params.genre = activeGenre;
            if (activeDecade) params.decade = activeDecade;
            if (activeRating) params.rating = parseFloat(activeRating);
            if (activeMinYear) params.minYear = parseInt(activeMinYear);

            const data = await fetchMovies(params);

            if (append) {
                setMovies((prev) => [...prev, ...data.movies]);
            } else {
                setMovies(data.movies);
            }
            setTotalCount(data.total);
            setHasMore(data.hasMore);
            setCurrentPage(page);
        } catch (err) {
            console.error('Failed to load filtered movies:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeGenre, activeDecade, activeRating, activeMinYear]);

    // Choose which load function to run
    useEffect(() => {
        if (hasActiveFilters) {
            loadFilteredMovies(1, false);
        } else {
            loadGroupedData();
        }
    }, [hasActiveFilters, loadFilteredMovies, loadGroupedData]);

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

    // Infinite scroll for filtered grid
    useEffect(() => {
        if (!scrollRef.current || !hasMore || loadingMore || !hasActiveFilters) return;
        const el = scrollRef.current;
        const handleScroll = () => {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 600;
            if (nearBottom && hasMore && !loadingMore) {
                loadFilteredMovies(currentPage + 1, true);
            }
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [hasMore, loadingMore, currentPage, loadFilteredMovies, hasActiveFilters]);

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

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                    top: '76px',
                    left: 0,
                    right: 0,
                    zIndex: 49,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    padding: '12px 24px',
                    overflowX: 'auto',
                }}
            >
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap', minWidth: 'max-content' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginRight: '8px', flexShrink: 0 }}>
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
                                onClick={() => router.push(pathname, { scroll: false })}
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
                            Object.entries(groupedData).map(([title, movies]) => (
                                <MovieRow
                                    key={title}
                                    title={title}
                                    movies={movies}
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

                        {loading && movies.length === 0 ? (
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

                        {loadingMore && (
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
                        <p style={{ fontSize: '13px', color: '#9ca3af' }}>{error}</p>
                        <button onClick={() => hasActiveFilters ? loadFilteredMovies(1, false) : loadGroupedData()} style={{ marginTop: '16px', padding: '10px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #f59e0b)', border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer' }}>Retry</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseMovies;
