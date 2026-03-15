import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Bookmark, Star, ClipboardList, History, Calendar, MessageSquare, Repeat } from 'lucide-react';
import StarRating from './StarRating';
import { useState } from 'react';

export default function MovieDetailPanel({ selectedMovie, onClose, similarMovies = [], onSelectMovie, onLaunchEngine }) {
    const watchlist = useAppStore((state) => state.watchlist);
    const toggleWatchlist = useAppStore((state) => state.toggleWatchlist);
    const userRatings = useAppStore((state) => state.userRatings);
    const setUserRating = useAppStore((state) => state.setUserRating);
    const addLog = useAppStore((state) => state.addLog);

    const isBookmarked = selectedMovie ? watchlist.some(m => m.id === selectedMovie.id) : false;
    const personalRating = selectedMovie ? userRatings[selectedMovie.id] || 0 : 0;

    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [logForm, setLogForm] = useState({
        date: new Date().toISOString().split('T')[0],
        review: '',
        rewatch: false
    });

    return (
        <AnimatePresence>
            {selectedMovie && (
                <motion.div
                    key="movie-detail-panel"
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
                        maxWidth: '100vw',
                        zIndex: 10001,
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
                    {/* ... (Poster Header remains same) ... */}
                    {selectedMovie.poster && (
                        <div style={{ position: 'relative', width: '100%', height: '240px', flexShrink: 0 }}>
                            <img
                                src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster}`}
                                alt={selectedMovie.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.1) 100%)' }} />
                            <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', color: '#e5e7eb', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>✕</button>
                            <button onClick={(e) => { e.stopPropagation(); toggleWatchlist(selectedMovie); }} style={{ position: 'absolute', top: '20px', left: '24px', width: '44px', height: '44px', borderRadius: '50%', background: isBookmarked ? 'rgba(6, 182, 212, 0.9)' : 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid', borderColor: isBookmarked ? 'rgba(6,182,212,1)' : 'rgba(255,255,255,0.12)', color: isBookmarked ? '#000' : '#e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
                                <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                            </button>
                            <div style={{ position: 'absolute', bottom: '16px', left: '24px', right: '60px' }}>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, #fdba74, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2, margin: 0 }}>{selectedMovie.title}</h2>
                            </div>
                        </div>
                    )}

                    <div style={{ padding: '40px 24px 28px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                        {/* Title fallback (no poster) */}
                        {!selectedMovie.poster && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={onClose} style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)', color: '#e5e7eb', cursor: 'pointer' }}>✕</button>
                                </div>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(135deg, #fdba74, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2, margin: 0 }}>{selectedMovie.title}</h2>
                            </div>
                        )}

                        {/* Genre Tags */}
                        {selectedMovie.genres && selectedMovie.genres !== 'Unknown' && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {selectedMovie.genres.split(', ').map((genre, i) => (
                                    <span key={i} style={{ padding: '4px 14px', fontSize: '11px', fontWeight: 600, background: 'rgba(6,182,212,0.08)', color: '#67e8f9', borderRadius: '20px', border: '1px solid rgba(6,182,212,0.2)' }}>{genre}</span>
                                ))}
                            </div>
                        )}

                        {/* User Activity Row */}
                        <div style={{ background: 'rgba(6, 182, 212, 0.03)', borderRadius: '16px', padding: '20px', border: '1px solid rgba(6, 182, 212, 0.15)', display: 'flex', flexDirection: 'column', gap: '16px', backdropFilter: 'blur(8px)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '11px', color: '#22d3ee', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px' }}>Your Rating</div>
                                <StarRating rating={personalRating} onRate={(r) => setUserRating(selectedMovie.id, r)} size={24} />
                            </div>
                            <button
                                onClick={() => setIsLogModalOpen(true)}
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#93c5fd', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                            >
                                <ClipboardList size={18} /> Log or Review
                            </button>

                            {onLaunchEngine && (
                                <button
                                    onClick={onLaunchEngine}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                                        border: 'none', color: '#000', fontSize: '14px',
                                        fontWeight: 800, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        boxShadow: '0 4px 12px rgba(249,115,22,0.2)'
                                    }}
                                >
                                    Launch Engine
                                </button>
                            )}
                        </div>

                        {/* Synopsis & More Info */}
                        {selectedMovie.overview && (
                            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(249,115,22,0.10)' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#fb923c', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Synopsis</h3>
                                <p style={{ fontSize: '13px', color: '#d1d5db', lineHeight: 1.7, margin: 0 }}>{selectedMovie.overview}</p>
                            </div>
                        )}

                        {/* ... (Other existing sections like Popularity, Similar Movies) ... */}
                    </div>

                    {/* ── Log Modal ────────────────────────────────── */}
                    <AnimatePresence>
                        {isLogModalOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(15px)', zIndex: 1000, padding: '40px 24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f97316' }}>Log Movie</h3>
                                    <button onClick={() => setIsLogModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {/* Date */}
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                                            <Calendar size={14} /> Date Watched
                                        </label>
                                        <input type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none' }} />
                                    </div>

                                    {/* Review */}
                                    <div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                                            <MessageSquare size={14} /> Review
                                        </label>
                                        <textarea placeholder="Write your thoughts..." value={logForm.review} onChange={(e) => setLogForm({ ...logForm, review: e.target.value })} style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px', color: '#fff', outline: 'none', resize: 'none' }} />
                                    </div>


                                    {/* Rewatch Toggle */}
                                    <div onClick={() => setLogForm({ ...logForm, rewatch: !logForm.rewatch })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Repeat size={16} color={logForm.rewatch ? '#f97316' : '#64748b'} />
                                            <span style={{ fontSize: '14px', color: logForm.rewatch ? '#fff' : '#94a3b8' }}>Rewatch</span>
                                        </div>
                                        <div style={{ width: '40px', height: '20px', borderRadius: '10px', background: logForm.rewatch ? '#f97316' : '#334155', position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '2px', left: logForm.rewatch ? '22px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: '0.3s' }} />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        addLog({
                                            ...selectedMovie,
                                            ...logForm,
                                            personalRating,
                                            loggedAt: Date.now()
                                        });
                                        setIsLogModalOpen(false);
                                        setLogForm({ date: new Date().toISOString().split('T')[0], review: '', rewatch: false });
                                    }}
                                    style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #f97316, #f59e0b)', border: 'none', color: '#000', fontSize: '15px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(249,115,22,0.3)', marginTop: '20px' }}
                                >
                                    Save Entry
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
