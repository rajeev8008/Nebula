'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/lib/supabase';
import { X, UserPlus, UserCheck, MessageSquare, Star, Calendar, Bookmark, Heart, Users } from 'lucide-react';
import StarRating from './StarRating';

export default function UserProfilePanel({ userId, isOpen, onClose, onMovieClick }) {
    const currentUser = useAppStore(state => state.user);
    const [profile, setProfile] = useState(null);
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ logs: 0, avg: 0, follows: 0, followers: 0 });
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [friendStatus, setFriendStatus] = useState(null); // 'pending', 'accepted', null

    useEffect(() => {
        if (userId && isOpen) {
            fetchProfileData();
        }
    }, [userId, isOpen]);

    const fetchProfileData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Basic Profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
            setProfile(profileData);

            // 2. Fetch Logs
            const { data: logsData } = await supabase
                .from('diary_entries')
                .select('*')
                .eq('user_id', userId)
                .order('watched_at', { ascending: false })
                .limit(20);
            setLogs(logsData || []);

            // 3. Fetch Follows/Following Count
            const { count: followers } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
            const { count: following } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
            
            // 4. Calculate Stats
            const totalRating = logsData?.reduce((acc, curr) => acc + (curr.rating || 0), 0) || 0;
            setStats({
                logs: logsData?.length || 0,
                avg: logsData?.length ? (totalRating / logsData.length).toFixed(1) : '0.0',
                followers: followers || 0,
                following: following || 0
            });

            // 5. Check relationship with current user
            if (currentUser && currentUser.id !== userId) {
                const { data: followData } = await supabase
                    .from('follows')
                    .select('*')
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', userId)
                    .single();
                setIsFollowing(!!followData);

                const { data: friendData } = await supabase
                    .from('friend_requests')
                    .select('*')
                    .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
                    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                    .maybeSingle();
                setFriendStatus(friendData?.status || null);
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUser) return;
        if (isFollowing) {
            await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', userId);
            setIsFollowing(false);
        } else {
            await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: userId });
            setIsFollowing(true);
        }
    };

    const handleFriendRequest = async () => {
        if (!currentUser || friendStatus) return;
        await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: userId });
        setFriendStatus('pending');
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
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 2100 }}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', top: 0, right: 0, width: '480px', height: '100vh',
                            background: '#0a0a0a', borderLeft: '1px solid rgba(249,115,22,0.2)',
                            boxShadow: '-20px 0 60px rgba(0,0,0,0.8)', zIndex: 2101,
                            display: 'flex', flexDirection: 'column', color: 'white'
                        }}
                    >
                        {loading ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '40px', height: '40px', border: '3px solid rgba(249,115,22,0.2)', borderTopColor: '#f97316', borderRadius: '50%' }} />
                            </div>
                        ) : profile && (
                            <>
                                <div style={{ padding: '32px', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                                    <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                                        <X size={20} />
                                    </button>

                                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(249,115,22,0.3)' }}>
                                            <UserPlus size={40} color="#000" />
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                                                {profile.username}
                                            </h2>
                                            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Member since {new Date(profile.updated_at).getFullYear()}</p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '32px', marginTop: '24px' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{stats.logs}</div>
                                            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginTop: '4px' }}>Films</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{stats.avg}</div>
                                            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginTop: '4px' }}>Avg Rating</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>{stats.followers}</div>
                                            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginTop: '4px' }}>Followers</div>
                                        </div>
                                    </div>

                                    {currentUser && currentUser.id !== userId && (
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                                            <button 
                                                onClick={handleFollow}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: isFollowing ? 'rgba(255,255,255,0.05)' : '#fff', border: isFollowing ? '1px solid rgba(255,255,255,0.1)' : 'none', color: isFollowing ? '#fff' : '#000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                            >
                                                {isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </button>
                                            <button 
                                                onClick={handleFriendRequest}
                                                disabled={friendStatus}
                                                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', color: '#f97316', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: friendStatus ? 0.5 : 1 }}
                                            >
                                                <Users size={18} />
                                                {friendStatus === 'pending' ? 'Request Sent' : friendStatus === 'accepted' ? 'Friends' : 'Add Friend'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="hide-scrollbar">
                                    <h3 style={{ fontSize: '11px', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>Recent Activity</h3>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {logs.map(log => (
                                            <div key={log.id} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', gap: '16px' }}>
                                                    <img 
                                                        src={log.movie_data.poster ? `https://image.tmdb.org/t/p/w92${log.movie_data.poster}` : null} 
                                                        style={{ width: '40px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer' }}
                                                        onClick={() => onMovieClick(log.movie_data)}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', margin: 0 }}>{log.movie_data.title}</h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                            <StarRating rating={log.rating} size={10} interactive={false} />
                                                            <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(log.watched_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {log.review_text && (
                                                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '12px 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>"{log.review_text}"</p>
                                                )}
                                            </div>
                                        ))}
                                        {logs.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', opacity: 0.5 }}>
                                                <History size={32} style={{ margin: '0 auto 12px' }} />
                                                <p>No films logged yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

const History = ({ size, style }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M12 7v5l4 2"/>
    </svg>
);
