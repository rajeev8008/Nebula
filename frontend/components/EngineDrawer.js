'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X } from 'lucide-react';

// Options for loading dots
const dotVariants = {
    hidden: { opacity: 0.2, scale: 0.5 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse"
        }
    }
};

export default function EngineDrawer({ onSelectMovie }) {
    const engineQuery = useAppStore((state) => state.engineQuery);
    const setEngineQuery = useAppStore((state) => state.setEngineQuery);
    const engineResults = useAppStore((state) => state.engineResults);
    const searchLoading = useAppStore((state) => state.searchLoading);
    const engineStage = useAppStore((state) => state.engineStage);
    const hasSeenLoadingAnimation = useAppStore((state) => state.hasSeenLoadingAnimation);
    const engineEntrySource = useAppStore((state) => state.engineEntrySource);
    const router = useRouter();
    const pathname = usePathname();

    const isFullScreen = engineStage === 'search' || engineStage === 'building';

    const handleBack = () => {
        const setView = useAppStore.getState().setView;
        const setEngineStage = useAppStore.getState().setEngineStage;
        if (setView) {
            setView(engineEntrySource === 'direct' ? 'LANDING' : 'BROWSE');
            setEngineStage('search');
            useAppStore.setState({ hasSeenLoadingAnimation: false });
            router.push(pathname);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (engineQuery.trim()) {
            document.dispatchEvent(new CustomEvent('engine-search', { detail: engineQuery }));
        }
    };

    return (
        <motion.div
            initial={false}
            animate={{
                width: isFullScreen ? '100vw' : '360px',
                background: isFullScreen ? '#0a0a0a' : 'rgba(10, 10, 10, 0.95)',
                borderRight: isFullScreen ? '1px solid transparent' : '1px solid rgba(249,115,22,0.2)',
                backdropFilter: isFullScreen ? 'blur(0px)' : 'blur(20px)',
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.7 }}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 10001, // Above normal UI and header
                overflow: 'hidden',
                boxShadow: isFullScreen ? 'none' : '10px 0 30px rgba(0,0,0,0.5)',
                pointerEvents: 'auto',
            }}
        >
            {/* Ambient Particle Background for Full Screen (State 1 and 2) */}
            <AnimatePresence>
                {isFullScreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: engineStage === 'search' ? 0.3 : 0.05 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundImage: 'radial-gradient(circle at center, rgba(249,115,22,0.1) 0%, transparent 60%)',
                            pointerEvents: 'none',
                            zIndex: 0
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Back Button for State 1 */}
            <AnimatePresence>
                {engineStage === 'search' && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleBack}
                        style={{
                            position: 'absolute',
                            top: '24px',
                            left: '24px',
                            zIndex: 50,
                            padding: '8px 16px',
                            background: 'transparent',
                            border: '1px solid rgba(249,115,22,0.4)',
                            color: '#fdba74',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(249,115,22,0.1)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                        {engineEntrySource === 'direct' ? '← Back to Main Page' : '← Back to Browse Movies'}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Container for the Search Area (Moves between Center and Top Left) */}
            <motion.div
                layout
                style={{
                    position: 'relative',
                    zIndex: 10,
                    width: isFullScreen ? '100%' : 'auto',
                    flex: isFullScreen ? 1 : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: isFullScreen ? 'center' : 'flex-start',
                    alignItems: isFullScreen ? 'center' : 'stretch',
                    padding: isFullScreen ? '0 24px' : '40px 20px 24px',
                    borderBottom: isFullScreen ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    background: isFullScreen ? 'transparent' : 'rgba(0,0,0,0.3)',
                    pointerEvents: engineStage === 'building' ? 'none' : 'auto', // Block interaction only when building
                }}
                transition={{ type: "spring", bounce: 0, duration: 0.7 }}
            >
                {/* Full Screen Form Wrapper OR State 3 Header */}
                <motion.div
                    layout
                    style={{
                        width: '100%',
                        maxWidth: isFullScreen ? '600px' : '100%',
                    }}
                    initial={isFullScreen ? { y: 20, opacity: 0 } : false}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <AnimatePresence mode="wait">
                        {isFullScreen ? (
                            <motion.div key="fullscreen-search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <motion.div style={{ textAlign: 'center', marginBottom: '24px' }}>
                                    <h1 style={{
                                        fontSize: '28px',
                                        fontWeight: 300,
                                        color: '#94a3b8',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Describe the movie you're looking for
                                    </h1>
                                </motion.div>

                                <form
                                    onSubmit={handleSearchSubmit}
                                    style={{ position: 'relative' }}
                                >
                                    {engineStage === 'search' && (
                                        <motion.div
                                            animate={{
                                                boxShadow: [
                                                    '0 0 15px rgba(249,115,22,0.2)',
                                                    '0 0 35px rgba(249,115,22,0.5)',
                                                    '0 0 15px rgba(249,115,22,0.2)'
                                                ]
                                            }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            style={{
                                                position: 'absolute',
                                                inset: -2,
                                                borderRadius: '18px',
                                                zIndex: -1,
                                                background: 'linear-gradient(90deg, rgba(249,115,22,0.5), rgba(251,191,36,0.5))',
                                                opacity: 0.5,
                                                filter: 'blur(8px)',
                                            }}
                                        />
                                    )}

                                    <motion.input
                                        type="text"
                                        value={engineQuery}
                                        onChange={(e) => setEngineQuery(e.target.value)}
                                        placeholder="e.g. intense car chase, psychological thriller, 90s sci-fi"
                                        style={{
                                            width: '100%',
                                            paddingTop: '20px',
                                            paddingBottom: '20px',
                                            paddingLeft: '24px',
                                            paddingRight: '80px',
                                            background: 'rgba(10,10,10,0.8)',
                                            border: '1px solid rgba(6, 182, 212, 0.4)',
                                            borderRadius: '16px',
                                            color: '#fff',
                                            fontSize: '18px',
                                            outline: 'none',
                                            transition: 'all 0.3s ease',
                                            backdropFilter: 'blur(12px)',
                                            boxShadow: '0 0 15px rgba(6, 182, 212, 0.05)',
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = 'rgba(6,182,212,0.8)';
                                            e.target.style.background = 'rgba(10,10,10,0.95)';
                                            e.target.style.boxShadow = '0 0 30px rgba(6, 182, 212, 0.15)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = 'rgba(6,182,212,0.4)';
                                            e.target.style.background = 'rgba(10,10,10,0.8)';
                                            e.target.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.05)';
                                        }}
                                    />
                                    {engineQuery && (
                                        <button
                                            type="button"
                                            onClick={() => setEngineQuery('')}
                                            style={{
                                                position: 'absolute',
                                                right: '52px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#64748b',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                zIndex: 10,
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = '#fdba74'}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={searchLoading}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '12px',
                                            bottom: '12px',
                                            width: '40px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#22d3ee',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {!searchLoading && (
                                            <motion.span
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                style={{ fontSize: '20px' }}
                                            >
                                                🔍
                                            </motion.span>
                                        )}
                                    </button>
                                </form>

                                {engineStage === 'search' && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1, transition: { delay: 0.5 } }}
                                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                        style={{ textAlign: 'center', marginTop: '16px' }}
                                    >
                                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                                            Press Enter to generate a semantic galaxy map
                                        </span>
                                    </motion.div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div key="state3-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <motion.h2
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 800,
                                        margin: '0',
                                        background: 'linear-gradient(135deg, #fdba74, #f97316)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    Nebula Engine
                                </motion.h2>

                                <button
                                    onClick={handleBack}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'transparent',
                                        border: '1px solid rgba(249,115,22,0.4)',
                                        color: '#fdba74',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        alignSelf: 'flex-start'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(249,115,22,0.1)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                    {engineEntrySource === 'direct' ? '← Back to Main Page' : '← Back to Browse Movies'}
                                </button>

                                <div>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Results for: </span>
                                    <span style={{ fontSize: '14px', color: '#22d3ee', fontWeight: 600 }} className="text-glow-cyan">"{engineQuery}"</span>
                                </div>

                                <button
                                    onClick={() => {
                                        setEngineQuery('');
                                        useAppStore.getState().setEngineStage('search');
                                        // Clear all stale data immediately
                                        useAppStore.setState({ 
                                            graphData: { nodes: [], links: [] },
                                            engineResults: [],
                                            selectedEngineMovie: null
                                        });
                                        document.dispatchEvent(new CustomEvent('engine-clear-selection'));
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'rgba(6, 182, 212, 0.05)',
                                        border: '1px solid rgba(6, 182, 212, 0.3)',
                                        color: '#67e8f9',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 0 15px rgba(6, 182, 212, 0.05)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.6)';
                                        e.currentTarget.style.boxShadow = '0 0 25px rgba(6, 182, 212, 0.15)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)';
                                        e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(6, 182, 212, 0.05)';
                                    }}
                                >
                                    New Search
                                </button>

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginTop: '8px', marginBottom: '8px' }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>

            {/* STATE 2: Building Loading Animation Centered */}
            <AnimatePresence>
                {engineStage === 'building' && !hasSeenLoadingAnimation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100vw',
                            height: '100vh',
                            background: '#0a0a0a', // Fully opaque near-black matching site dark theme
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            pointerEvents: 'auto', // block interactions while loading
                        }}
                    >
                        <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '24px' }}>
                            {/* Orbiting rings */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '50%',
                                    border: '2px dashed rgba(6,182,212,0.3)',
                                    borderTopColor: 'rgba(6,182,212,0.8)',
                                }}
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                style={{
                                    position: 'absolute',
                                    inset: '15px',
                                    borderRadius: '50%',
                                    border: '2px dotted rgba(249,115,22,0.4)',
                                    borderBottomColor: 'rgba(249,115,22,0.9)',
                                }}
                            />
                            {/* Central glowing core */}
                            <motion.div
                                initial={{ x: '-50%', y: '-50%' }}
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.7, 1, 0.7],
                                    x: '-50%',
                                    y: '-50%'
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, #22d3ee 0%, transparent 70%)',
                                    boxShadow: '0 0 20px #22d3ee',
                                }}
                            />
                        </div>
                        <h3
                            className="text-glow-cyan"
                            style={{
                                fontSize: '20px',
                                fontWeight: 700,
                                color: '#22d3ee',
                                letterSpacing: '1px',
                                textTransform: 'uppercase'
                            }}
                        >
                            Building your Galaxy...
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
                            Locating semantic neighbors in the latent space
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* STATE 3: Left Panel Results */}
            <AnimatePresence>
                {engineStage === 'graph' && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            zIndex: 10,
                        }}
                        className="hide-scrollbar"
                    >
                        <div style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: '#cbd5e1',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                            paddingLeft: '4px'
                        }}>
                            Similar Movies
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {engineResults.map((movie, index) => {
                                const isSelected = useAppStore.getState().selectedEngineMovie?.id === movie.id;
                                return (
                                    <motion.div
                                        key={movie.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => onSelectMovie && onSelectMovie(movie)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '10px',
                                            borderRadius: '12px',
                                            background: isSelected ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)',
                                            border: isSelected ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(255,255,255,0.05)',
                                            boxShadow: isSelected ? '0 0 15px rgba(6,182,212,0.2)' : 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'rgba(249,115,22,0.1)';
                                                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                            }
                                        }}
                                    >
                                        {/* Circular Poster */}
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            background: '#1e293b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            {movie.poster ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w200${movie.poster}`}
                                                    alt={movie.title}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <span style={{ fontSize: '12px' }}>🎬</span>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: '#f8fafc',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                marginBottom: '4px'
                                            }}>
                                                {movie.title}
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                                    {movie.release_date && movie.release_date !== 'Unknown'
                                                        ? new Date(movie.release_date).getFullYear()
                                                        : 'Year'}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: 600 }}>
                                                    {(movie.score * 100).toFixed(0)}% Match
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
