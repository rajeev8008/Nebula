'use client';

import { useState } from 'react';

const MovieCard = ({ movie, onClick, onSeeInGraph, priority = false }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="scroll-item"
            style={{
                position: 'relative',
                width: '192px',
                height: '288px',
                flexShrink: 0,
                cursor: 'pointer',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                zIndex: isHovered ? 10 : 1,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onClick && onClick(movie)}
        >
            {/* Poster Image with priority loading */}
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
                        background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(0,0,0,0.8))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af',
                        fontSize: '14px',
                    }}
                >
                    No Poster
                </div>
            )}

            {/* Orange Glow Border on Hover */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    border: '2px solid rgba(249,115,22,0.6)',
                    borderRadius: '12px',
                    boxShadow: isHovered ? '0 0 30px rgba(249,115,22,0.8)' : 'none',
                    pointerEvents: 'none',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: isHovered ? 1 : 0,
                }}
            />

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
