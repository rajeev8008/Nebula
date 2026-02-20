'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── localStorage Watchlist Store ───
const WATCHLIST_KEY = 'nebula-watchlist';

function getWatchlist() {
    if (typeof window === 'undefined') return new Set();
    try {
        const stored = localStorage.getItem(WATCHLIST_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
        return new Set();
    }
}

function saveWatchlist(watchlistSet) {
    try {
        localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...watchlistSet]));
    } catch (e) {
        console.error('Failed to save watchlist:', e);
    }
}

function toggleWatchlistItem(movieId) {
    const watchlist = getWatchlist();
    const id = String(movieId);
    if (watchlist.has(id)) {
        watchlist.delete(id);
    } else {
        watchlist.add(id);
    }
    saveWatchlist(watchlist);
    return watchlist.has(id);
}

function isInWatchlist(movieId) {
    return getWatchlist().has(String(movieId));
}

// --- Bookmark SVG Icons ---
const BookmarkOutline = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
);

const BookmarkFilled = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
);

const MovieCard = ({ movie, onClick, onSeeInGraph, priority = false }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkAnimating, setBookmarkAnimating] = useState(false);
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
    const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
    const cardRef = useRef(null);

    // Initialize bookmark state from localStorage
    useEffect(() => {
        setIsBookmarked(isInWatchlist(movie.id));
    }, [movie.id]);

    // --- 3D Tilt & Glare ---
    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width; // 0..1
        const y = (e.clientY - rect.top) / rect.height; // 0..1

        // Rotate: max ±12deg, inverted for natural feel
        const rotateX = (0.5 - y) * 24;
        const rotateY = (x - 0.5) * 24;

        setTilt({ rotateX, rotateY });
        setGlare({ x: x * 100, y: y * 100, opacity: 0.25 });
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        setTilt({ rotateX: 0, rotateY: 0 });
        setGlare({ x: 50, y: 50, opacity: 0 });
    }, []);

    // --- Optimistic Bookmark with localStorage ---
    const handleBookmark = useCallback((e) => {
        e.stopPropagation();

        // Optimistic update — toggle immediately
        const newState = !isBookmarked;
        setIsBookmarked(newState);
        setBookmarkAnimating(true);
        setTimeout(() => setBookmarkAnimating(false), 350);

        // Persist to localStorage (synchronous, no rollback needed)
        toggleWatchlistItem(movie.id);
    }, [isBookmarked, movie.id]);

    return (
        <div
            ref={cardRef}
            className="scroll-item"
            style={{
                position: 'relative',
                width: '192px',
                height: '288px',
                flexShrink: 0,
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                transformStyle: 'preserve-3d',
                perspective: '800px',
                transform: isHovered
                    ? `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(1.08)`
                    : 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)',
                transition: isHovered
                    ? 'transform 0.1s ease-out'
                    : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: isHovered ? 10 : 1,
                willChange: 'transform',
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => onClick && onClick(movie)}
        >
            {/* Poster Image */}
            {movie.poster ? (
                <img
                    src={`https://image.tmdb.org/t/p/w300${movie.poster}`}
                    alt={movie.title}
                    loading={priority ? 'eager' : 'lazy'}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                    }}
                />
            ) : (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(15,23,42,0.95) 60%, rgba(0,0,0,0.9) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        gap: '8px',
                    }}
                >
                    <span style={{ fontSize: '32px', opacity: 0.4 }}>🎬</span>
                    <span style={{ color: '#6b7280', fontSize: '11px', fontWeight: 500 }}>
                        {movie.title}
                    </span>
                </div>
            )}

            {/* Glare/Sheen Overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,${glare.opacity}) 0%, transparent 60%)`,
                    pointerEvents: 'none',
                    mixBlendMode: 'overlay',
                    borderRadius: '12px',
                    transition: isHovered ? 'none' : 'opacity 0.5s ease-out',
                    opacity: isHovered ? 1 : 0,
                }}
            />

            {/* Orange Glow Border on Hover */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    border: '2px solid rgba(249,115,22,0.6)',
                    borderRadius: '12px',
                    boxShadow: isHovered
                        ? '0 0 30px rgba(249,115,22,0.6), inset 0 0 30px rgba(249,115,22,0.08)'
                        : 'none',
                    pointerEvents: 'none',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: isHovered ? 1 : 0,
                }}
            />

            {/* Bookmark Button */}
            <button
                onClick={handleBookmark}
                style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isBookmarked
                        ? 'rgba(249,115,22,0.9)'
                        : 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid',
                    borderColor: isBookmarked
                        ? 'rgba(249,115,22,1)'
                        : 'rgba(255,255,255,0.15)',
                    color: isBookmarked ? '#000' : '#e5e7eb',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: isHovered || isBookmarked ? 1 : 0,
                    transform: isHovered || isBookmarked ? 'scale(1)' : 'scale(0.8)',
                    zIndex: 20,
                }}
                className={bookmarkAnimating ? 'bookmark-pop' : ''}
            >
                {isBookmarked ? <BookmarkFilled /> : <BookmarkOutline />}
            </button>

            {/* Details Overlay on Hover */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 70%, transparent 100%)',
                    padding: '16px 12px 12px',
                    transform: isHovered ? 'translateY(0)' : 'translateY(100%)',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    pointerEvents: 'none',
                }}
            >
                {/* Title */}
                <h3
                    style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#fff',
                        marginBottom: '6px',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {movie.title}
                </h3>

                {/* Rating */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <span style={{ color: '#fbbf24', fontSize: '14px' }}>★</span>
                    <span style={{ color: '#fb923c', fontSize: '13px', fontWeight: 600 }}>
                        {movie.rating ? movie.rating.toFixed(1) : 'N/A'}
                    </span>
                </div>

                {/* Genres */}
                {movie.genres && movie.genres !== 'Unknown' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                        {movie.genres.split(', ').slice(0, 2).map((genre, i) => (
                            <span
                                key={i}
                                style={{
                                    padding: '2px 8px',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    background: 'rgba(249,115,22,0.2)',
                                    color: '#fdba74',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(249,115,22,0.4)',
                                }}
                            >
                                {genre}
                            </span>
                        ))}
                    </div>
                )}

                {/* "See in Graph" Button */}
                {onSeeInGraph && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSeeInGraph(movie);
                        }}
                        style={{
                            width: '100%',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                            border: 'none',
                            color: '#000',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            pointerEvents: 'auto',
                            boxShadow: '0 2px 8px rgba(249,115,22,0.4)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.6)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(249,115,22,0.4)';
                        }}
                    >
                        See in Graph →
                    </button>
                )}
            </div>
        </div>
    );
};

export default MovieCard;
