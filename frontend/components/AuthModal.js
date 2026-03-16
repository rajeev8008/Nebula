'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/lib/supabase';
import { X, User, LogIn, Mail, Lock, Loader2, Github, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setUser = useAppStore(state => state.setUser);
  const setSession = useAppStore(state => state.setSession);
  const syncStore = useAppStore(state => state.syncStore);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (authError) throw authError;
        setUser(data.user);
        setSession(data.session);
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }
          }
        });
        if (authError) throw authError;

        if (!authData.user) throw new Error("Signup failed - no user returned.");

        // Create Profile (using upsert in case of retry)
        // Best effort: The DB Trigger in supabase_schema.sql should handle this automatically.
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          username: username || email.split('@')[0],
          updated_at: new Date().toISOString(),
        });
        
        if (profileError) {
          console.warn("Manual profile creation failed (this is expected if RLS is strict or trigger already ran):", profileError.message);
          // We don't throw here because if the user was created in auth.users, 
          // they can still log in, and the trigger likely handled the profile.
        }
        
        if (authData.session) {
          setUser(authData.user);
          setSession(authData.session);
        } else {
          // Email confirmation is likely enabled
          setError("Account created! Please check your email to confirm your account before signing in.");
          setLoading(false);
          return;
        }
      }
      await syncStore();
      onClose();
    } catch (err) {
      console.error("Auth process error:", err);
      let msg = err.message || "An unexpected error occurred";
      
      if (msg.includes("fetch")) {
        msg = "Unable to reach authentication server. Please check your internet connection or Supabase configuration.";
      } else if (msg.includes("Invalid login credentials")) {
        msg = "Invalid email or password. If you just signed up, please ensure you confirmed your email (if enabled) or try creating a new account.";
      } else if (msg.includes("Email not confirmed")) {
        msg = "Please check your email and confirm your account before signing in.";
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 20000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ 
              position: 'absolute', inset: 0, 
              background: 'rgba(0,0,0,0.85)', 
              backdropFilter: 'blur(12px)'
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'relative',
              width: '100%', maxWidth: '440px', 
              maxHeight: 'min(90vh, 700px)',
              background: 'rgba(10, 10, 10, 0.8)',
              backdropFilter: 'blur(40px)',
              borderRadius: '32px', 
              border: '1px solid rgba(249,115,22,0.3)',
              padding: '48px', 
              boxShadow: '0 0 40px rgba(249,115,22,0.1), 0 32px 64px -16px rgba(0,0,0,0.6)',
              overflowY: 'auto',
              display: 'flex', flexDirection: 'column'
            }}
            className="hide-scrollbar"
          >
            {/* Glossy Overlay effect */}
            <div style={{ 
              position: 'absolute', top: 0, left: 0, right: 0, height: '100px', 
              background: 'linear-gradient(to bottom, rgba(249,115,22,0.05), transparent)',
              pointerEvents: 'none'
            }} />

            <button 
              onClick={onClose} 
              style={{ 
                position: 'absolute', top: '24px', right: '24px', 
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%', width: '36px', height: '36px',
                color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease', zIndex: 1
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ 
                  width: '64px', height: '64px', borderRadius: '20px', 
                  background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                  margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 16px -4px rgba(249,115,22,0.4)'
                }}
              >
                <LogIn size={32} color="#000" />
              </motion.div>
              <h2 style={{ 
                fontSize: '2rem', fontWeight: 900, 
                background: 'linear-gradient(135deg, #fff, #94a3b8)', 
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', 
                marginBottom: '12px', letterSpacing: '-0.5px' 
              }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p style={{ color: '#64748b', fontSize: '15px', fontWeight: 500 }}>
                {isLogin ? 'Step into the cinema nebula' : 'Start your cinematic journey'}
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                style={{ 
                  background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', 
                  borderRadius: '16px', padding: '14px 18px', marginBottom: '32px', 
                  display: 'flex', gap: '12px', alignItems: 'center', color: '#fca5a5', fontSize: '14px' 
                }}
              >
                <AlertCircle size={18} /> {error}
              </motion.div>
            )}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isLogin && (
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} />
                  <input 
                    type="text" placeholder="Username" 
                    value={username} onChange={(e) => setUsername(e.target.value)} 
                    required 
                    style={{ 
                      width: '100%', background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', 
                      padding: '16px 16px 16px 54px', color: '#fff', outline: 'none',
                      fontSize: '15px', transition: 'all 0.3s ease'
                    }} 
                    onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = '#f97316'; }}
                    onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                  />
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} />
                <input 
                  type="email" placeholder="Email Address" 
                  value={email} onChange={(e) => setEmail(e.target.value)} 
                  required 
                  style={{ 
                    width: '100%', background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', 
                    padding: '16px 16px 16px 54px', color: '#fff', outline: 'none',
                    fontSize: '15px', transition: 'all 0.3s ease'
                  }} 
                  onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = '#f97316'; }}
                  onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={20} />
                <input 
                  type="password" placeholder="Password" 
                  value={password} onChange={(e) => setPassword(e.target.value)} 
                  required 
                  style={{ 
                    width: '100%', background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', 
                    padding: '16px 16px 16px 54px', color: '#fff', outline: 'none',
                    fontSize: '15px', transition: 'all 0.3s ease'
                  }} 
                  onFocus={(e) => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = '#f97316'; }}
                  onBlur={(e) => { e.target.style.background = 'rgba(255,255,255,0.03)'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: '16px', 
                  background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                  border: 'none', color: '#000', fontSize: '16px', fontWeight: 800, 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', 
                  marginTop: '12px', boxShadow: '0 8px 24px -6px rgba(249,115,22,0.4)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <LogIn size={20} /> : <User size={20} />)}
                {!loading && (isLogin ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div style={{ margin: '32px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              <span style={{ color: '#475569', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            </div>

            <button
              onClick={signInWithGithub}
              style={{ 
                width: '100%', padding: '14px', borderRadius: '16px', 
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                color: '#fff', fontSize: '14px', fontWeight: 600, 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <Github size={20} /> Continue with GitHub
            </button>

            <p style={{ marginTop: '40px', textAlign: 'center', color: '#64748b', fontSize: '15px' }}>
              {isLogin ? "New to Nebula?" : "Already an explorer?"}{' '}
              <button 
                onClick={() => setIsLogin(!isLogin)} 
                style={{ background: 'transparent', border: 'none', color: '#f97316', fontWeight: 700, cursor: 'pointer', padding: '0 4px' }}
              >
                {isLogin ? 'Join now' : 'Sign in'}
              </button>
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
