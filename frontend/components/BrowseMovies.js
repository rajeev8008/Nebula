'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import MovieCard from './MovieCard';
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

    // Data state
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [error, setError] = useState(null);

    // All genres for filter chips (collected from results)
    const [allGenres, setAllGenres] = useState([
        'Action', 'Adventure', 'Animation', 'Comedy', 'Crime',
        'Documentary', 'Drama', 'Family', 'Fantasy', 'History',
        'Horror', 'Music', 'Mystery', 'Romance', 'Science Fiction',
        'Thriller', 'War', 'Western',
    ]);

    // Scroll container ref for virtualizer
    const scrollRef = useRef(null);

    // Fetch data from backend
    const loadMovies = useCallback(async (page = 1, append = false) => {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);
        setError(null);

        try {
            const params = { page, limit: PAGE_LIMIT };
            if (activeGenre) params.genre = activeGenre;
            if (activeDecade) params.decade = activeDecade;
            if (activeRating) params.rating = parseFloat(activeRating);

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
            console.error('Failed to load movies:', err);
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeGenre, activeDecade, activeRating]);

    // Load on mount and when filters change
    useEffect(() => {
        loadMovies(1, false);
    }, [loadMovies]);

    // Update URL params (toggle behavior)
    const updateFilter = useCallback(
        (key, value) => {
            const params = new URLSearchParams(searchParams.toString());
            const current = params.get(key);
            if (current === value) {
                params.delete(key); // Toggle off
            } else {
                params.set(key, value);
            }
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [searchParams, pathname, router]
    );

    // ── Virtualized Grid ──
    // Calculate columns based on container width
    const [columns, setColumns] = useState(6);

    useEffect(() => {
        const updateColumns = () => {
            if (!scrollRef.current) return;
            const containerWidth = scrollRef.current.clientWidth - 48; // 24px padding each side
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

    // Infinite scroll: load more when nearing bottom
    useEffect(() => {
        if (!scrollRef.current || !hasMore || loadingMore) return;

        const el = scrollRef.current;
        const handleScroll = () => {
            const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 600;
            if (nearBottom && hasMore && !loadingMore) {
                loadMovies(currentPage + 1, true);
            }
        };

        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, [hasMore, loadingMore, currentPage, loadMovies]);

    const hasActiveFilters = activeGenre || activeDecade || activeRating;

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
                {/* Back Button */}
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

                {/* Title */}
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

                {/* Right buttons */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Cmd+K hint */}
                    <button
                        onClick={() => {
                            document.dispatchEvent(
                                new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
                            );
                        }}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#6b7280',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                            e.currentTarget.style.color = '#9ca3af';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                            e.currentTarget.style.color = '#6b7280';
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <kbd style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            fontFamily: 'monospace',
                            fontSize: '10px',
                        }}>
                            ⌘K
                        </kbd>
                    </button>

                    {/* Launch Engine */}
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
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 25px rgba(249,115,22,0.5)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(249,115,22,0.3)';
                            e.currentTarget.style.transform = 'translateY(0)';
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
                    {/* Label */}
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginRight: '8px', flexShrink: 0 }}>
                        Filters
                    </span>

                    {/* Decade chips */}
                    {DECADES.map((decade) => (
                        <FilterChip
                            key={decade}
                            label={decade}
                            active={activeDecade === decade}
                            onClick={() => updateFilter('decade', decade)}
                        />
                    ))}

                    {/* Divider */}
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 4px' }} />

                    {/* Rating chips */}
                    {RATINGS.map((r) => (
                        <FilterChip
                            key={r}
                            label={`★ ${r}`}
                            active={activeRating === String(parseFloat(r))}
                            onClick={() => updateFilter('rating', String(parseFloat(r)))}
                        />
                    ))}

                    {/* Divider */}
                    <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 4px' }} />

                    {/* Genre chips */}
                    {allGenres.map((genre) => (
                        <FilterChip
                            key={genre}
                            label={genre}
                            active={activeGenre === genre}
                            onClick={() => updateFilter('genre', genre)}
                        />
                    ))}

                    {/* Clear filters */}
                    {hasActiveFilters && (
                        <>
                            <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)', flexShrink: 0, margin: '0 4px' }} />
                            <button
                                className="filter-chip"
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
                                ✕ Clear All
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div style={{ paddingTop: '152px', maxWidth: '1600px', margin: '0 auto' }}>
                {/* Loading State */}
                {loading && (
                    <div style={{ padding: '0 24px' }}>
                        <SkeletonSection cardCount={8} />
                        <SkeletonSection cardCount={8} />
                        <SkeletonSection cardCount={8} />
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 24px',
                        color: '#f87171',
                    }}>
                        <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                            Failed to load movies
                        </p>
                        <p style={{ fontSize: '13px', color: '#9ca3af' }}>{error}</p>
                        <button
                            onClick={() => loadMovies(1, false)}
                            style={{
                                marginTop: '16px',
                                padding: '10px 24px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                                border: 'none',
                                color: '#000',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Movie Grid — Virtualized */}
                {!loading && !error && movies.length > 0 && (
                    <div style={{ padding: '0 24px 80px' }}>
                        {/* Filter summary */}
                        {hasActiveFilters && (
                            <div style={{ marginBottom: '24px' }}>
                                <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                                    Showing <span style={{ color: '#fdba74', fontWeight: 600 }}>{totalCount}</span> movies
                                    {activeGenre && <> in <span style={{ color: '#fb923c' }}>{activeGenre}</span></>}
                                    {activeDecade && <> from the <span style={{ color: '#fb923c' }}>{activeDecade}</span></>}
                                    {activeRating && <> rated <span style={{ color: '#fb923c' }}>★ {activeRating}+</span></>}
                                </p>
                            </div>
                        )}

                        {/* Virtualized grid container */}
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
                                            <div
                                                key={movie.id}
                                                style={{
                                                    width: `${CARD_WIDTH}px`,
                                                    height: `${CARD_HEIGHT}px`,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <MovieCard
                                                    movie={movie}
                                                    onClick={onMovieClick}
                                                    onSeeInGraph={onMovieClick}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Loading more indicator */}
                        {loadingMore && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                padding: '32px 0',
                            }}>
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: '3px solid rgba(249,115,22,0.2)',
                                    borderTopColor: '#f97316',
                                    animation: 'spin 0.8s linear infinite',
                                }} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {!loading && !error && movies.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '80px 24px',
                        color: '#6b7280',
                    }}>
                        <p style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</p>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#9ca3af', marginBottom: '8px' }}>
                            No movies match your filters
                        </p>
                        <p style={{ fontSize: '14px' }}>
                            Try adjusting your criteria or{' '}
                            <button
                                onClick={() => router.push(pathname, { scroll: false })}
                                style={{
                                    color: '#fb923c',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    fontSize: '14px',
                                }}
                            >
                                clear all filters
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseMovies;
