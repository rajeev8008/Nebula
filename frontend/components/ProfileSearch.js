'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/lib/supabase';
import { Search, User, Star, MessageSquare, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function ProfileSearch({ isOpen, onClose, onSelectUser }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (val) => {
    setQuery(val);
    setError(null);
    if (val.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    // Simplified query first to confirm profiles table works
    const { data, error: searchError } = await supabase
      .from('profiles')
      .select('username, id, diary_entries(rating)')
      .ilike('username', `%${val}%`)
      .limit(10);

    if (searchError) {
      console.error("Profile search full error:", JSON.stringify(searchError, null, 2));
      // Fallback: try without the join if join failed
      if (searchError.message?.includes('diary_entries')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('username, id')
          .ilike('username', `%${val}%`)
          .limit(10);

        if (!fallbackError && fallbackData) {
          setResults(fallbackData.map(p => ({ ...p, count: 0, avg: '0.0' })));
        } else {
          setError(fallbackError || searchError);
        }
      } else {
        setError(searchError);
      }
    }

    if (data) {
      console.log("Search results data:", data);
      const formatted = data.map(p => ({
        ...p,
        count: p.diary_entries?.length || 0,
        avg: p.diary_entries?.length
          ? (p.diary_entries.reduce((acc, curr) => acc + (curr.rating || 0), 0) / p.diary_entries.length).toFixed(1)
          : '0.0'
      }));
      setResults(formatted);
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 21000 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed', top: '15%', left: '50%', x: '-50%',
              width: '100%', maxWidth: '600px', zIndex: 21001
            }}
          >
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <Search style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: '#f97316' }} size={24} />
              <input
                autoFocus
                placeholder="Search Nebula users..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(249,115,22,0.3)', borderRadius: '20px',
                  padding: '20px 20px 20px 64px', color: '#fff', fontSize: '18px',
                  outline: 'none', boxShadow: '0 0 30px rgba(249,115,22,0.1)'
                }}
              />
              {loading && <Loader2 style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} className="animate-spin" />}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '16px', color: '#fca5a5', fontSize: '14px', textAlign: 'center' }}>
                  <AlertCircle size={18} style={{ marginBottom: '8px' }} />
                  <p>Search failed. Your database might not be set up yet.</p>
                </div>
              )}

              {results.map((user, idx) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px', padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                  }}
                  whileHover={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(249,115,22,0.2)' }}
                  onClick={() => onSelectUser(user.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(249,115,22,0.1),rgba(249,115,22,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={24} color="#f97316" />
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', fontWeight: 700, margin: 0 }}>{user.username}</h4>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MessageSquare size={12} /> {user.count} logs
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Star size={12} fill="#fbbf24" color="#fbbf24" /> {user.avg} avg
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={18} color="#64748b" />
                </motion.div>
              ))}
              {query.length >= 2 && results.length === 0 && !loading && !error && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                  <p style={{ fontSize: '24px', marginBottom: '8px' }}>🔭</p>
                  No explorers found with that name.
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
