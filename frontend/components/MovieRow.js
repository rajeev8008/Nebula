'use client';

import { useRef, useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import { MovieCardSkeleton } from './ui/skeleton';

const MovieRow = ({ title, movies, loading, onMovieClick, onViewAll }) => {
    const rowRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const checkScroll = () => {
        if (!rowRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        const row = rowRef.current;
        if (row) {
            row.addEventListener('scroll', checkScroll);
            // Initial check
            setTimeout(checkScroll, 500);
            window.addEventListener('resize', checkScroll);
        }
        return () => {
            if (row) row.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [movies, loading]);

    const scroll = (direction) => {
        if (!rowRef.current) return;
        const scrollAmount = rowRef.current.clientWidth * 0.8;
        rowRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    if (!loading && (!movies || movies.length === 0)) return null;

    return (
        <div style={{ marginBottom: '40px', position: 'relative' }}>
            {/* Row Title */}
            <div style={{
                padding: '0 24px',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline'
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    color: '#fff',
                    letterSpacing: '-0.5px',
                    margin: 0
                }}>
                    {title}
                </h2>
                <span
                    onClick={onViewAll}
                    style={{
                        fontSize: '12px',
                        color: '#f97316',
                        fontWeight: 600,
                        cursor: 'pointer',
                        opacity: 0.8
                    }}
                >
                    View All
                </span>
            </div>

            {/* Carousel Container */}
            <div style={{ position: 'relative', width: '100%' }}>
                {/* Left Arrow */}
                {showLeftArrow && (
                    <button
                        onClick={() => scroll('left')}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '60px',
                            zIndex: 20,
                            background: 'linear-gradient(to right, rgba(0,0,0,0.8), transparent)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'opacity 0.3s ease',
                        }}
                    >
                        ‹
                    </button>
                )}

                {/* Right Arrow */}
                {showRightArrow && (
                    <button
                        onClick={() => scroll('right')}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '60px',
                            zIndex: 20,
                            background: 'linear-gradient(to left, rgba(0,0,0,0.8), transparent)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'opacity 0.3s ease',
                        }}
                    >
                        ›
                    </button>
                )}

                {/* Scrollable Area */}
                <div
                    ref={rowRef}
                    className="hide-scrollbar"
                    style={{
                        display: 'flex',
                        gap: '16px',
                        overflowX: 'auto',
                        padding: '10px 24px 30px', // Extra bottom padding for card hover scale
                        scrollBehavior: 'smooth',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {loading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <MovieCardSkeleton key={i} />
                        ))
                    ) : (
                        movies.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                movie={movie}
                                onClick={onMovieClick}
                                onSeeInGraph={onMovieClick}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieRow;
