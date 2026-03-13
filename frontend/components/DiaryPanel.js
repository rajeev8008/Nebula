'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { X, Calendar, MessageSquare, Trash2, Repeat } from 'lucide-react';
import StarRating from './StarRating';

export default function DiaryPanel({ isOpen, onClose, onMovieClick }) {
    const logs = useAppStore((state) => state.logs);
    const removeLog = useAppStore((state) => state.removeLog);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100 }}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', top: 0, right: 0, width: '450px', height: '100vh',
                            background: '#0a0a0a', borderLeft: '1px solid rgba(249,115,22,0.2)',
                            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)', zIndex: 101,
                            display: 'flex', flexDirection: 'column', color: 'white'
                        }}
                    >
                        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #fdba74, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Your Diary
                                </h2>
                                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                    {logs.length} films logged
                                </p>
                            </div>
                            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="hide-scrollbar">
                            {logs.length === 0 ? (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.3, gap: '16px' }}>
                                    <Calendar size={48} />
                                    <p>No movies logged yet.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {logs.map((log) => (
                                        <motion.div
                                            key={log.loggedAt}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            style={{
                                                padding: '20px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '16px',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                                                <img 
                                                    src={log.poster ? `https://image.tmdb.org/t/p/w92${log.poster}` : ''} 
                                                    style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                                                    onClick={() => { onMovieClick(log); onClose(); }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>{log.title}</h4>
                                                        <button 
                                                            onClick={() => removeLog(log.loggedAt)}
                                                            style={{ background: 'transparent', border: 'none', color: '#ef4444', opacity: 0.5, cursor: 'pointer' }}
                                                            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                            onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                                                        <Calendar size={12} />
                                                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        {log.rewatch && <span style={{ color: '#f97316', display: 'flex', alignItems: 'center', gap: '4px' }}><Repeat size={12} /> Rewatch</span>}
                                                    </div>
                                                    <div style={{ marginTop: '6px' }}>
                                                        <StarRating rating={log.personalRating} size={14} interactive={false} />
                                                    </div>
                                                </div>
                                            </div>
                                            {log.review && (
                                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px', color: '#d1d5db', lineHeight: 1.5, borderLeft: '2px solid rgba(249,115,22,0.3)' }}>
                                                    "{log.review}"
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
