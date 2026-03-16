'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { X, Trash2, Bookmark } from 'lucide-react';

export default function WatchlistPanel({ isOpen, onClose, onMovieClick }) {
    const watchlist = useAppStore((state) => state.watchlist);
    const toggleWatchlist = useAppStore((state) => state.toggleWatchlist);
    const clearWatchlist = useAppStore((state) => state.clearWatchlist);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 8999
                        }}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            top: '80px',
                            right: 0,
                            width: '420px',
                            height: 'calc(100vh - 80px)',
                            background: '#0a0a0a',
                            borderLeft: '1px solid rgba(249,115,22,0.2)',
                            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
                            zIndex: 9000,
                            display: 'flex',
                            flexDirection: 'column',
                            color: 'white'
                        }}
                    >
                        {/* Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #fdba74, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    My Watchlist
                                </h2>
                                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                    {watchlist.length} {watchlist.length === 1 ? 'movie' : 'movies'} saved
                                </p>
                            </div>
                            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* List Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="hide-scrollbar">
                            {watchlist.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, gap: '16px' }}>
                                    <Bookmark size={48} />
                                    <p>Your watchlist is empty.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {watchlist.map((movie) => (
                                        <motion.div
                                            key={movie.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                display: 'flex',
                                                gap: '12px',
                                                padding: '12px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}
                                            onClick={() => {
                                                onMovieClick(movie);
                                                onClose();
                                            }}
                                            whileHover={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(249,115,22,0.3)' }}
                                        >
                                            <img
                                                src={movie.poster ? `https://image.tmdb.org/t/p/w92${movie.poster}` : null}
                                                style={{ width: '60px', height: '90px', objectFit: 'cover', borderRadius: '6px' }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>{movie.title}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: '#fbbf24', fontSize: '12px' }}>★ {movie.rating?.toFixed(1)}</span>
                                                    <span style={{ color: '#64748b', fontSize: '11px' }}>{movie.release_date?.split('-')[0]}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWatchlist(movie);
                                                }}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    padding: '8px',
                                                    cursor: 'pointer',
                                                    opacity: 0.6
                                                }}
                                                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                                                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                                            >
                                                <X size={18} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {watchlist.length > 0 && (
                            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                                <button
                                    onClick={clearWatchlist}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        color: '#ef4444',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.2)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                                >
                                    <Trash2 size={16} />
                                    Clear All
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
