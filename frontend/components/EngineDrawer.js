'use client';
import { motion, AnimatePresence } from 'framer-motion';

export default function EngineDrawer({ selectedMovie, onClose }) {
    return (
        <AnimatePresence>
            {selectedMovie && (
                <motion.div
                    key="engine-drawer"
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        height: '100vh',
                        width: '420px',
                        zIndex: 9999,
                        background: 'rgba(0, 0, 0, 0.60)',
                        backdropFilter: 'blur(40px)',
                        WebkitBackdropFilter: 'blur(40px)',
                        borderLeft: '1px solid rgba(249,115,22,0.20)',
                        boxShadow: '-12px 0 60px rgba(0,0,0,0.6), 0 0 40px rgba(249,115,22,0.06)',
                        overflowY: 'auto',
                        pointerEvents: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                    className="hide-scrollbar"
                >
                    {/* ── Poster Header ─────────────────────────────── */}
                    {selectedMovie.poster && (
                        <div style={{ position: 'relative', width: '100%', height: '240px', flexShrink: 0 }}>
                            <img
                                src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster}`}
                                alt={selectedMovie.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                            {/* Gradient overlay */}
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.1) 100%)',
                            }} />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                aria-label="Close drawer"
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.55)',
                                    backdropFilter: 'blur(8px)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    color: '#e5e7eb',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                    zIndex: 10,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(249,115,22,0.8)';
                                    e.currentTarget.style.color = '#fff';
                                    e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(0,0,0,0.55)';
                                    e.currentTarget.style.color = '#e5e7eb';
                                    e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                                }}
                            >
                                ✕
                            </button>

                            {/* Title on poster */}
                            <div style={{ position: 'absolute', bottom: '16px', left: '24px', right: '60px' }}>
                                <h2 style={{
                                    fontSize: '1.6rem',
                                    fontWeight: 800,
                                    background: 'linear-gradient(135deg, #fdba74, #f97316, #fbbf24)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    lineHeight: 1.2,
                                    margin: 0,
                                }}>
                                    {selectedMovie.title}
                                </h2>
                            </div>
                        </div>
                    )}

                    {/* ── Content ───────────────────────────────────── */}
                    <div style={{ padding: '20px 24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>

                        {/* Title fallback (no poster) */}
                        {!selectedMovie.poster && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={onClose}
                                        aria-label="Close drawer"
                                        style={{
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255,255,255,0.12)', color: '#e5e7eb',
                                            fontSize: '18px', cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(249,115,22,0.8)';
                                            e.currentTarget.style.color = '#fff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(0,0,0,0.55)';
                                            e.currentTarget.style.color = '#e5e7eb';
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <h2 style={{
                                    fontSize: '1.6rem', fontWeight: 800,
                                    background: 'linear-gradient(135deg, #fdba74, #f97316, #fbbf24)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    lineHeight: 1.2, margin: 0,
                                }}>
                                    {selectedMovie.title}
                                </h2>
                            </>
                        )}

                        {/* Genre Tags */}
                        {selectedMovie.genres && selectedMovie.genres !== 'Unknown' && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedMovie.genres.split(', ').map((genre, i) => (
                                    <span key={i} style={{
                                        padding: '4px 14px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        letterSpacing: '0.5px',
                                        background: 'rgba(249,115,22,0.12)',
                                        color: '#fdba74',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(249,115,22,0.25)',
                                    }}>
                                        {genre}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Stats Row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: selectedMovie.score ? '1fr 1fr' : '1fr',
                            gap: '10px',
                        }}>
                            {/* Rating */}
                            <div style={{
                                background: 'rgba(255,255,255,0.04)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                border: '1px solid rgba(249,115,22,0.12)',
                            }}>
                                <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Rating</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ color: '#fbbf24', fontSize: '20px' }}>★</span>
                                    <span style={{ color: '#fb923c', fontSize: '1.25rem', fontWeight: 700 }}>
                                        {selectedMovie.rating ? selectedMovie.rating.toFixed(1) : 'N/A'}
                                    </span>
                                    <span style={{ color: '#6b7280', fontSize: '13px' }}>/10</span>
                                </div>
                            </div>

                            {/* Match Score */}
                            {selectedMovie.score && (
                                <div style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    borderRadius: '12px',
                                    padding: '14px 16px',
                                    border: '1px solid rgba(249,115,22,0.12)',
                                }}>
                                    <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Match</div>
                                    <div style={{ color: '#4ade80', fontSize: '1.25rem', fontWeight: 700 }}>
                                        {(selectedMovie.score * 100).toFixed(0)}%
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Meta Info Row */}
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {selectedMovie.release_date && selectedMovie.release_date !== 'Unknown' && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'rgba(255,255,255,0.03)', padding: '8px 14px',
                                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <span style={{ fontSize: '14px' }}>📅</span>
                                    <span style={{ fontSize: '13px', color: '#d1d5db', fontWeight: 500 }}>
                                        {new Date(selectedMovie.release_date).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'short', day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            )}
                            {selectedMovie.language && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'rgba(255,255,255,0.03)', padding: '8px 14px',
                                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <span style={{ fontSize: '14px' }}>🌐</span>
                                    <span style={{ fontSize: '13px', color: '#d1d5db', fontWeight: 500, textTransform: 'uppercase' }}>
                                        {selectedMovie.language}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Synopsis */}
                        {selectedMovie.overview && (
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                padding: '16px',
                                border: '1px solid rgba(249,115,22,0.10)',
                            }}>
                                <h3 style={{
                                    fontSize: '11px', fontWeight: 700, color: '#fb923c',
                                    marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px',
                                }}>Synopsis</h3>
                                <p style={{
                                    fontSize: '13px', color: '#d1d5db', lineHeight: 1.7, margin: 0,
                                }}>
                                    {selectedMovie.overview}
                                </p>
                            </div>
                        )}

                        {/* Popularity Bar */}
                        {selectedMovie.popularity && (
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '12px',
                                padding: '14px 16px',
                                border: '1px solid rgba(249,115,22,0.10)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Popularity</span>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#fdba74' }}>
                                        {selectedMovie.popularity.toFixed(1)}
                                    </span>
                                </div>
                                <div style={{
                                    width: '100%', height: '6px',
                                    background: 'rgba(55,65,81,0.5)',
                                    borderRadius: '3px', overflow: 'hidden',
                                }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(selectedMovie.popularity, 100)}%` }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                        style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #f97316, #fbbf24)',
                                            borderRadius: '3px',
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
