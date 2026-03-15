'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/lib/supabase';
import { User, LogOut, Bookmark, Book, Compass, Search, Bell, Settings, UserCircle, ChevronDown } from 'lucide-react';
import AuthModal from './AuthModal';
import DiaryPanel from './DiaryPanel';
import WatchlistPanel from './WatchlistPanel';
import ProfileSearch from './ProfileSearch';
import UserProfilePanel from './UserProfilePanel';

export default function GlobalHeader() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const user = useAppStore(state => state.user);
  const profile = useAppStore(state => state.profile);
  const view = useAppStore(state => state.view);
  const setView = useAppStore(state => state.setView);
  const setUser = useAppStore(state => state.setUser);
  const setSession = useAppStore(state => state.setSession);
  const setProfile = useAppStore(state => state.setProfile);
  const setSelectedMovie = useAppStore(state => state.setSelectedMovie);
  const syncStore = useAppStore(state => state.syncStore);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    // Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) syncStore();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) syncStore();
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(username)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    // Clear local storage for next user
    localStorage.removeItem('nebula_watchlist');
    localStorage.removeItem('nebula_logs');
    localStorage.removeItem('nebula_ratings');
    window.location.reload();
  };

  return (
    <>
      <header
        suppressHydrationWarning
        style={{
          position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 2001,
          padding: scrolled ? '12px 40px' : '24px 40px',
          background: scrolled ? 'rgba(0,0,0,0.8)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          display: 'flex', alignItems: 'center',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          borderBottom: scrolled ? '1px solid rgba(249,115,22,0.1)' : '1px solid transparent',
          pointerEvents: 'none'
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px', pointerEvents: 'auto' }}>
          {view === 'BROWSE' && (
            <>
              <div
                onClick={() => setView('LANDING')}
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  background: 'linear-gradient(to right, rgb(249, 115, 22), rgb(251, 146, 60), rgb(250, 204, 21))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-1px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Nebula
              </div>
              <button
                onClick={() => setView('LANDING')}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s',
                  marginLeft: '8px'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                ← Home
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px', pointerEvents: 'auto' }}>
          <button
            suppressHydrationWarning={true}
            onClick={() => setIsSearchOpen(true)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
          >
            <Search size={14} suppressHydrationWarning={true} /> Search
          </button>

          <button
            suppressHydrationWarning={true}
            onClick={() => setView('BROWSE')}
            style={{ background: 'transparent', border: 'none', color: view === 'BROWSE' ? '#fff' : '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            onMouseEnter={(e) => e.target.style.color = '#fff'}
            onMouseLeave={(e) => e.target.style.color = view === 'BROWSE' ? '#fff' : '#94a3b8'}
          >
            <Compass size={14} suppressHydrationWarning={true} /> Browse
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
              <button
                suppressHydrationWarning={true}
                onClick={() => setIsWatchlistOpen(true)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <Bookmark size={18} suppressHydrationWarning={true} />
              </button>
              <button
                suppressHydrationWarning={true}
                onClick={() => setIsDiaryOpen(true)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <Book size={18} suppressHydrationWarning={true} />
              </button>

              <div style={{ position: 'relative' }}>
                <div
                  suppressHydrationWarning={true}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f9731611, #f9731644)',
                    border: '1px solid rgba(249,115,22,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', position: 'relative',
                    boxShadow: isDropdownOpen ? '0 0 20px rgba(249,115,22,0.3)' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <User size={20} color="#f97316" suppressHydrationWarning={true} />
                  {unreadCount > 0 && (
                    <div
                      suppressHydrationWarning={true}
                      style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 900,
                        width: '18px', height: '18px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid #000', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                      }}
                    >
                      {unreadCount}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      style={{
                        position: 'absolute', top: '50px', right: 0, width: '280px',
                        background: 'rgba(10, 10, 10, 0.95)', backdropFilter: 'blur(20px)',
                        borderRadius: '20px', border: '1px solid rgba(249,115,22,0.2)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.6)', padding: '12px',
                        zIndex: 1001, overflow: 'hidden'
                      }}
                    >
                      <div style={{ padding: '8px 12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: '#fff', margin: 0 }}>{profile?.username || user.email.split('@')[0]}</p>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0' }}>{user.email}</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button
                          suppressHydrationWarning={true}
                          onClick={() => { setSelectedProfileId(user.id); setIsDropdownOpen(false); }}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}
                        >
                          <UserCircle size={16} color="#f97316" suppressHydrationWarning={true} /> View Profile
                        </button>

                        <div style={{ padding: '8px 12px 4px' }}>
                          <p style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Notifications</p>
                        </div>

                        <div style={{ maxHeight: '200px', overflowY: 'auto' }} className="hide-scrollbar" onMouseEnter={markNotificationsAsRead}>
                          {notifications.length === 0 ? (
                            <p style={{ padding: '12px', fontSize: '12px', color: '#475569', textAlign: 'center', fontStyle: 'italic' }}>No new alerts</p>
                          ) : notifications.map(n => (
                            <div key={n.id} style={{ padding: '10px 12px', borderRadius: '10px', background: n.is_read ? 'transparent' : 'rgba(249,115,22,0.05)', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '4px' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.is_read ? 'transparent' : '#f97316' }} />
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '12px', color: '#fff', margin: 0 }}>
                                  <span style={{ fontWeight: 800, color: '#f97316' }}>{n.actor?.username || 'Somebody'}</span> {n.content}
                                </p>
                                <p style={{ fontSize: '9px', color: '#475569', margin: '2px 0 0' }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />

                        <button
                          suppressHydrationWarning={true}
                          onClick={handleLogout}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: '#ef4444', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}
                        >
                          <LogOut size={16} suppressHydrationWarning={true} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <button
              suppressHydrationWarning={true}
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                padding: '8px 20px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => { e.target.style.background = '#fff'; e.target.style.color = '#000'; }}
              onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.05)'; e.target.style.color = '#fff'; }}
            >
              Sign In
            </button>
          )}
        </nav>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <DiaryPanel isOpen={isDiaryOpen} onClose={() => setIsDiaryOpen(false)} onMovieClick={(movie) => {
        setSelectedMovie(movie);
        setIsDiaryOpen(false);
      }} />
      <WatchlistPanel isOpen={isWatchlistOpen} onClose={() => setIsWatchlistOpen(false)} onMovieClick={(movie) => {
        setSelectedMovie(movie);
        setIsWatchlistOpen(false);
      }} />
      <ProfileSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUser={(uid) => {
          setSelectedProfileId(uid);
          setIsSearchOpen(false);
        }}
      />
      <UserProfilePanel
        userId={selectedProfileId}
        isOpen={!!selectedProfileId}
        onClose={() => setSelectedProfileId(null)}
        onMovieClick={(movie) => {
          setSelectedMovie(movie);
          setSelectedProfileId(null);
        }}
      />
    </>
  );
}
