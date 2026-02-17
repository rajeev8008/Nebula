'use client';

import { useMemo } from 'react';
import MovieCard from './MovieCard';

const BrowseMovies = ({ movies, onBack, onLaunchEngine, onMovieClick }) => {
    // Memoized categorization - only runs once when movies data changes
    const categorizedData = useMemo(() => {
        if (!movies || movies.length === 0) {
            return { recent: [], topRated: [], genres: {} };
        }

        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        // Recent Releases (last 2 years)
        const recent = movies
            .filter((m) => {
                try {
                    if (m.release_date && m.release_date !== 'Unknown') {
                        const releaseDate = new Date(m.release_date);
                        return releaseDate >= twoYearsAgo;
                    }
                } catch {
                    return false;
                }
                return false;
            })
            .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
            .slice(0, 20);

        // Top Rated (rating >= 7.5)
        const topRated = movies
            .filter((m) => m.rating >= 7.5)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 20);

        // By Genre
        const genresMap = {};
        movies.forEach((movie) => {
            const genreStr = movie.genres;
            if (genreStr && genreStr !== 'Unknown') {
                genreStr.split(', ').forEach((genre) => {
                    const trimmed = genre.trim();
                    if (trimmed) {
                        if (!genresMap[trimmed]) {
                            genresMap[trimmed] = [];
                        }
                        genresMap[trimmed].push(movie);
                    }
                });
            }
        });

        // Limit each genre to top 15 by rating
        Object.keys(genresMap).forEach((genre) => {
            genresMap[genre] = genresMap[genre]
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 15);
        });

        return { recent, topRated, genres: genresMap };
    }, [movies]);

    const { recent, topRated, genres } = categorizedData;

    const renderSection = (title, sectionMovies, showNav = true) => {
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
                </div>

                {/* Horizontal Carousel */}
                <div
                    className="horizontal-scroll"
                    style={{
                        display: 'flex',
                        gap: '16px',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        paddingLeft: '24px',
                        paddingRight: '24px',
                        paddingBottom: '16px',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        contentVisibility: 'auto', // Performance optimization
                    }}
                >
                    {sectionMovies.map((movie, index) => (
                        <MovieCard
                            key={movie.id}
                            movie={movie}
                            onClick={onMovieClick}
                            onSeeInGraph={onMovieClick}
                            priority={index < 5}
                        />
                    ))}
                </div>
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

                {/* Launch Engine Button */}
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

            {/* Content Sections */}
            <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
                {/* Recent Releases */}
                {renderSection('Recent Releases', recent)}

                {/* Top Rated */}
                {renderSection('Top Rated', topRated)}

                {/* Genre Sections */}
                {Object.entries(genres)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([genre, genreMovies]) => renderSection(genre, genreMovies))}
            </div>
        </div>
    );
};

export default BrowseMovies;
