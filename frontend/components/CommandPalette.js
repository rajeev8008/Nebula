'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Command } from 'cmdk';
import { fetchMovies } from '@/lib/api';

const CommandPalette = ({ onSelectMovie }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef(null);

    // Global Cmd/Ctrl+K listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Debounced search
    const searchMovies = useCallback(async (searchQuery) => {
        if (!searchQuery || searchQuery.trim().length < 2) {
            setResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await fetchMovies({ q: searchQuery.trim(), limit: 20 });
            setResults(data.movies || []);
        } catch (err) {
            console.error('Command palette search failed:', err);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle input change with debounce
    const handleInputChange = useCallback((value) => {
        setQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchMovies(value);
        }, 300);
    }, [searchMovies]);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    // Reset on close
    useEffect(() => {
        if (!open) {
            setQuery('');
            setResults([]);
            setLoading(false);
        }
    }, [open]);

    const handleSelect = useCallback(
        (movie) => {
            setOpen(false);
            onSelectMovie?.(movie);
        },
        [onSelectMovie]
    );

    if (!open) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '15vh',
                animation: 'cmdkOverlayIn 0.2s ease-out',
            }}
        >
            {/* Backdrop */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
                onClick={() => setOpen(false)}
            />

            {/* Dialog */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '640px',
                    margin: '0 24px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(10,10,20,0.99) 100%)',
                    border: '1px solid rgba(249,115,22,0.25)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(249,115,22,0.1)',
                    overflow: 'hidden',
                    animation: 'cmdkDialogIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
            >
                <Command label="Search movies" shouldFilter={false}>
                    {/* Search Input */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px 20px',
                            borderBottom: '1px solid rgba(249,115,22,0.15)',
                        }}
                    >
                        {/* Magnifying glass */}
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fb923c"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>

                        <Command.Input
                            placeholder="Search movies by title or vibe..."
                            autoFocus
                            value={query}
                            onValueChange={handleInputChange}
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                outline: 'none',
                                color: '#fff',
                                fontSize: '16px',
                                fontFamily: 'inherit',
                                fontWeight: 400,
                                letterSpacing: '0.2px',
                            }}
                        />

                        {/* Loading spinner */}
                        {loading && (
                            <div style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                border: '2px solid rgba(249,115,22,0.2)',
                                borderTopColor: '#f97316',
                                animation: 'spin 0.8s linear infinite',
                            }} />
                        )}

                        {/* Shortcut hint */}
                        <kbd
                            style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: '#6b7280',
                                fontSize: '11px',
                                fontFamily: 'monospace',
                                fontWeight: 500,
                            }}
                        >
                            ESC
                        </kbd>
                    </div>

                    {/* Results List */}
                    <Command.List
                        style={{
                            maxHeight: '400px',
                            overflowY: 'auto',
                            padding: '8px',
                        }}
                    >
                        {/* Empty / prompt state */}
                        {!loading && results.length === 0 && (
                            <Command.Empty
                                style={{
                                    padding: '40px 20px',
                                    textAlign: 'center',
                                    color: '#6b7280',
                                    fontSize: '14px',
                                }}
                            >
                                {query.length >= 2 ? 'No movies found.' : 'Type to search movies...'}
                            </Command.Empty>
                        )}

                        {results.map((movie) => (
                            <Command.Item
                                key={movie.id}
                                value={movie.id}
                                onSelect={() => handleSelect(movie)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    padding: '10px 14px',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s ease',
                                    color: '#e5e7eb',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(249,115,22,0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {/* Poster thumbnail */}
                                <div
                                    style={{
                                        width: '40px',
                                        height: '56px',
                                        borderRadius: '6px',
                                        background: movie.poster
                                            ? `url(https://image.tmdb.org/t/p/w92${movie.poster}) center/cover`
                                            : 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(15,23,42,0.8))',
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '16px',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}
                                >
                                    {!movie.poster && '🎬'}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: '14px',
                                            fontWeight: 600,
                                            color: '#fff',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {movie.title}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '12px',
                                            color: '#9ca3af',
                                            display: 'flex',
                                            gap: '8px',
                                            marginTop: '2px',
                                        }}
                                    >
                                        {movie.release_date && movie.release_date !== 'Unknown' && (
                                            <span>{new Date(movie.release_date).getFullYear()}</span>
                                        )}
                                        {movie.genres && movie.genres !== 'Unknown' && (
                                            <span style={{ color: '#fdba74' }}>
                                                {movie.genres.split(', ').slice(0, 2).join(' · ')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Rating */}
                                {movie.rating > 0 && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span style={{ color: '#fbbf24', fontSize: '12px' }}>★</span>
                                        <span style={{ color: '#fb923c', fontSize: '13px', fontWeight: 600 }}>
                                            {movie.rating.toFixed(1)}
                                        </span>
                                    </div>
                                )}
                            </Command.Item>
                        ))}
                    </Command.List>

                    {/* Footer hint */}
                    <div
                        style={{
                            padding: '10px 20px',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: '#4b5563',
                            fontSize: '11px',
                        }}
                    >
                        <span>
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', marginRight: '4px' }}>↑↓</kbd>
                            Navigate
                            <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'monospace', marginLeft: '12px', marginRight: '4px' }}>↵</kbd>
                            Select
                        </span>
                        <span>
                            {loading ? 'Searching...' : results.length > 0 ? `${results.length} results` : 'Powered by Nebula'}
                        </span>
                    </div>
                </Command>

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
};

export default CommandPalette;
