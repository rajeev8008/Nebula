'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import MovieCard from './MovieCard';
import { SkeletonSection } from './ui/skeleton';

// ─── Constants ───
const CARD_WIDTH = 192;
const CARD_GAP = 16;
const ESTIMATED_ITEM_SIZE = CARD_WIDTH + CARD_GAP; // 208px
const INITIAL_ITEMS = 20;
const LOAD_MORE_COUNT = 20;
const ROW_HEIGHT = 320;

// ─── Available filter options ───
const DECADES = ['2020s', '2010s', '2000s', '1990s', 'Earlier'];
const RATINGS = ['7+', '8+', '9+'];

// ─── VirtualCarousel ───
function VirtualCarousel({ movies, onMovieClick, onSeeInGraph }) {
    const scrollRef = useRef(null);
    const sentinelRef = useRef(null);
    const [visibleCount, setVisibleCount] = useState(INITIAL_ITEMS);

    const visibleMovies = useMemo(
        () => movies.slice(0, visibleCount),
        [movies, visibleCount]
    );

    // Infinite scroll: IntersectionObserver on sentinel
    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && visibleCount < movies.length) {
                    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_COUNT, movies.length));
                }
            },
            { root: scrollRef.current, rootMargin: '0px 300px 0px 0px', threshold: 0 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [visibleCount, movies.length]);

    const virtualizer = useVirtualizer({
        count: visibleMovies.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => ESTIMATED_ITEM_SIZE,
        horizontal: true,
        overscan: 5,
    });

    return (
        <div
            ref={scrollRef}
            className="horizontal-scroll"
            style={{
                overflowX: 'auto',
                overflowY: 'hidden',
                paddingLeft: '24px',
                paddingRight: '24px',
                paddingBottom: '16px',
                height: `${ROW_HEIGHT}px`,
                WebkitOverflowScrolling: 'touch',
            }}
        >
            <div
                style={{
                    width: `${virtualizer.getTotalSize() + 24}px`,
                    height: '288px',
                    position: 'relative',
                }}
            >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                    const movie = visibleMovies[virtualItem.index];
                    return (
                        <div
                            key={movie.id}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: `${CARD_WIDTH}px`,
                                height: '288px',
                                transform: `translateX(${virtualItem.start}px)`,
                            }}
                        >
                            <MovieCard
                                movie={movie}
                                onClick={onMovieClick}
                                onSeeInGraph={onSeeInGraph}
                                priority={virtualItem.index < 5}
                            />
                        </div>
                    );
                })}

                {/* Sentinel for infinite scroll */}
                {visibleCount < movies.length && (
                    <div
                        ref={sentinelRef}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: `${virtualizer.getTotalSize()}px`,
                            width: '60px',
                            height: '288px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                border: '3px solid rgba(249,115,22,0.2)',
                                borderTopColor: '#f97316',
                                animation: 'spin 0.8s linear infinite',
                            }}
                        />
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}
            </div>
        </div>
    );
}

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
            }}
        >
            {label}
        </button>
    );
}

// ─── BrowseMovies ───
const BrowseMovies = ({ movies, loading, onBack, onLaunchEngine, onMovieClick }) => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    // Read filters from URL
    const activeGenre = searchParams.get('genre') || '';
    const activeDecade = searchParams.get('decade') || '';
    const activeRating = searchParams.get('rating') || '';

    // Update URL params
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

    // Extract all unique genres
    const allGenres = useMemo(() => {
        if (!movies || movies.length === 0) return [];
        const genreSet = new Set();
        movies.forEach((m) => {
            if (m.genres && m.genres !== 'Unknown') {
                m.genres.split(', ').forEach((g) => {
                    const trimmed = g.trim();
                    if (trimmed) genreSet.add(trimmed);
                });
            }
        });
        return Array.from(genreSet).sort();
    }, [movies]);

    // Filter movies based on URL params
    const filteredMovies = useMemo(() => {
        if (!movies || movies.length === 0) return [];
        return movies.filter((m) => {
            // Genre filter
            if (activeGenre) {
                const movieGenres = m.genres?.split(', ').map((g) => g.trim()) || [];
                if (!movieGenres.includes(activeGenre)) return false;
            }
            // Decade filter
            if (activeDecade) {
                const year = m.release_date ? new Date(m.release_date).getFullYear() : 0;
                if (activeDecade === '2020s' && (year < 2020 || year > 2029)) return false;
                if (activeDecade === '2010s' && (year < 2010 || year > 2019)) return false;
                if (activeDecade === '2000s' && (year < 2000 || year > 2009)) return false;
                if (activeDecade === '1990s' && (year < 1990 || year > 1999)) return false;
                if (activeDecade === 'Earlier' && year >= 1990) return false;
            }
            // Rating filter
            if (activeRating) {
                const minRating = parseFloat(activeRating);
                if (!m.rating || m.rating < minRating) return false;
            }
            return true;
        });
    }, [movies, activeGenre, activeDecade, activeRating]);

    // Categorize filtered movies
    const categorizedData = useMemo(() => {
        if (!filteredMovies || filteredMovies.length === 0) {
            return { recent: [], topRated: [], genres: {} };
        }

        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        const recent = filteredMovies
            .filter((m) => {
                try {
                    if (m.release_date && m.release_date !== 'Unknown') {
                        return new Date(m.release_date) >= twoYearsAgo;
                    }
                } catch { return false; }
                return false;
            })
            .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
            .slice(0, 50);

        const topRated = filteredMovies
            .filter((m) => m.rating >= 7.5)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 50);

        const genresMap = {};
        filteredMovies.forEach((movie) => {
            const genreStr = movie.genres;
            if (genreStr && genreStr !== 'Unknown') {
                genreStr.split(', ').forEach((genre) => {
                    const trimmed = genre.trim();
                    if (trimmed) {
                        if (!genresMap[trimmed]) genresMap[trimmed] = [];
                        genresMap[trimmed].push(movie);
                    }
                });
            }
        });

        // Keep all items per genre (virtualization handles rendering perf)
        Object.keys(genresMap).forEach((genre) => {
            genresMap[genre] = genresMap[genre]
                .sort((a, b) => b.rating - a.rating);
        });

        return { recent, topRated, genres: genresMap };
    }, [filteredMovies]);

    const { recent, topRated, genres } = categorizedData;
    const hasActiveFilters = activeGenre || activeDecade || activeRating;

    const renderSection = (title, sectionMovies) => {
        if (!sectionMovies || sectionMovies.length === 0) return null;

        return (
            <div key={title} style={{ marginBottom: '48px' }}>
                {/* Section Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '20px',
                        paddingLeft: '24px',
                        paddingRight: '24px',
                    }}
                >
                    <h2
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, #fdba74, #f97316, #fbbf24)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.5px',
                        }}
                    >
                        {title}
                    </h2>
                    <span
                        style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            fontWeight: 500,
                        }}
                    >
                        {sectionMovies.length} titles
                    </span>
                </div>

                {/* Virtualized Horizontal Carousel */}
                <VirtualCarousel
                    movies={sectionMovies}
                    onMovieClick={onMovieClick}
                    onSeeInGraph={onMovieClick}
                />
            </div>
        );
    };

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                minHeight: '100vh',
                background: 'linear-gradient(to bottom, #000 0%, #0f172a 50%, #000 100%)',
                color: 'white',
                overflowY: 'auto',
                paddingTop: '100px',
                paddingBottom: '80px',
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

                    {/* Genre chips (scrollable) */}
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

            {/* Content — add extra top padding for filter bar */}
            <div style={{ maxWidth: '1600px', margin: '0 auto', paddingTop: '52px' }}>
                {/* Skeleton Loading State */}
                {loading && (
                    <>
                        <SkeletonSection cardCount={8} />
                        <SkeletonSection cardCount={8} />
                        <SkeletonSection cardCount={8} />
                    </>
                )}

                {/* Loaded Content */}
                {!loading && (
                    <>
                        {/* Active filter summary */}
                        {hasActiveFilters && (
                            <div style={{ padding: '0 24px', marginBottom: '24px' }}>
                                <p style={{ fontSize: '13px', color: '#9ca3af' }}>
                                    Showing <span style={{ color: '#fdba74', fontWeight: 600 }}>{filteredMovies.length}</span> movies
                                    {activeGenre && <> in <span style={{ color: '#fb923c' }}>{activeGenre}</span></>}
                                    {activeDecade && <> from the <span style={{ color: '#fb923c' }}>{activeDecade}</span></>}
                                    {activeRating && <> rated <span style={{ color: '#fb923c' }}>★ {activeRating}+</span></>}
                                </p>
                            </div>
                        )}

                        {renderSection('Recent Releases', recent)}
                        {renderSection('Top Rated', topRated)}
                        {Object.entries(genres)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([genre, genreMovies]) => renderSection(genre, genreMovies))}

                        {/* Empty state */}
                        {filteredMovies.length === 0 && (
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
                    </>
                )}
            </div>
        </div>
    );
};

export default BrowseMovies;
