import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Sparkles,
  CheckCircle,
  LogOut,
  Zap,
  Gift,
  Clock,
  Edit2,
  ExternalLink,
  Folder,
} from 'lucide-react';
import {
  signOutUser,
  getActiveUser,
  getUserProfile,
} from '../services/supabaseClient';

export function AuthModal({ isOpen, onClose, onAuthChange }) {
  if (!isOpen) return null;

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isOpeningBrowser, setIsOpeningBrowser] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch current user and profile on mount
  useEffect(() => {
    let active = true;
    (async () => {
      const activeUser = await getActiveUser();
      if (active && activeUser) {
        setUser(activeUser);
        const prof = await getUserProfile(activeUser);
        setProfile(prof);
        if (onAuthChange) onAuthChange(prof);
      } else {
        const cached = localStorage.getItem('keter_user_profile');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            // Purge dummy placeholder emails so candidate can sign in with their real Google account
            if (
              parsed.email &&
              (parsed.email.includes('candidate@keter.ai') ||
                parsed.email.includes('dummy') ||
                parsed.email.includes('test.verification') ||
                parsed.email.includes('example.com'))
            ) {
              localStorage.removeItem('keter_user_profile');
              setUser(null);
              setProfile(null);
            } else {
              setProfile(parsed);
              setUser({ id: parsed.id, email: parsed.email });
            }
          } catch (e) {}
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Listen for Google Auth callback from external browser bridge (localhost:5188/auth/google)
  useEffect(() => {
    if (window.electronAPI?.onGoogleAuthSuccess) {
      const unsub = window.electronAPI.onGoogleAuthSuccess((data) => {
        if (data?.email) {
          handleAuthenticateGoogle(data.email, data.name);
          setIsOpeningBrowser(false);
          setTimeout(() => {
            if (onClose) onClose();
          }, 800);
        }
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, []);

  const handleAuthenticateGoogle = (email, name) => {
    if (!email || !email.trim()) return;
    const cleanEmail = email.trim();
    const authUser = {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      provider: 'google',
    };
    const authProfile = {
      id: authUser.id,
      email: cleanEmail,
      name: authUser.name,
      plan: 'free_trial',
      plan_status: 'active',
      free_credits_left: 10,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_pro: false,
      provider: 'google',
    };
    setUser(authUser);
    setProfile(authProfile);
    localStorage.setItem('keter_user_profile', JSON.stringify(authProfile));
    if (onAuthChange) onAuthChange(authProfile);
    setErrorMsg('');
  };

  const handleSaveCustomEmail = (e) => {
    e?.preventDefault();
    if (!customEmailInput.trim()) return;
    handleAuthenticateGoogle(customEmailInput.trim());
    setIsEditingEmail(false);
  };

  // Launch browser for Google Sign-In
  const handleGoogleSignIn = () => {
    setErrorMsg('');
    setIsOpeningBrowser(true);

    const authUrl = `http://localhost:5188/auth/google?v=${Date.now()}`;
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(authUrl);
    } else {
      window.open(authUrl, '_blank');
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    localStorage.removeItem('keter_user_profile');
    setUser(null);
    setProfile(null);
    setIsOpeningBrowser(false);
    if (onAuthChange) onAuthChange(null);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 13, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        className="modal-card"
        style={{
          backgroundColor: '#0d111c',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(168, 85, 247, 0.1)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '440px',
          color: '#f1f5f9',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(66, 133, 244, 0.15)',
                border: '1px solid rgba(66, 133, 244, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', letterSpacing: '0.02em', color: '#f8fafc' }}>
                {user ? 'Keter Account & License' : 'Sign in with Google'}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {user ? 'Candidate Pass & Solve Quota' : 'Activate 10 Free Technical Interview Solves'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                lineHeight: 1.4,
              }}
            >
              {errorMsg}
            </div>
          )}

          {user ? (
            /* Logged-In User Profile View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(66, 133, 244, 0.18)',
                    border: '2px solid rgba(66, 133, 244, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                    fontSize: '20px',
                    fontWeight: '700',
                  }}
                >
                  {user.email ? user.email.slice(0, 1).toUpperCase() : 'G'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditingEmail ? (
                    <form onSubmit={handleSaveCustomEmail} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        type="email"
                        value={customEmailInput}
                        onChange={(e) => setCustomEmailInput(e.target.value)}
                        placeholder="your.google@gmail.com"
                        autoFocus
                        style={{
                          flex: 1,
                          fontSize: '12px',
                          background: 'rgba(15, 23, 42, 0.9)',
                          border: '1px solid rgba(66, 133, 244, 0.5)',
                          borderRadius: '6px',
                          color: '#fff',
                          padding: '4px 8px',
                          outline: 'none',
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          background: '#4285F4',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Save
                      </button>
                    </form>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '700',
                          color: '#f8fafc',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomEmailInput(user.email || '');
                          setIsEditingEmail(true);
                        }}
                        title="Edit Google Account"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(66, 133, 244, 0.15)',
                        border: '1px solid rgba(66, 133, 244, 0.3)',
                        color: '#60a5fa',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Google Account
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: profile?.is_pro ? 'rgba(34, 197, 94, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                        border: profile?.is_pro ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)',
                        color: profile?.is_pro ? '#4ade80' : '#c084fc',
                      }}
                    >
                      {profile?.is_pro ? '⚡ PRO PASS' : '🎁 FREE TRIAL'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Session Passes Info Card */}
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Folder size={14} color="#38bdf8" /> Interview Session Passes:
                  </span>
                  <span style={{ fontWeight: '700', color: '#38bdf8' }}>
                    ₹99 / 24h Pass
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  Each session includes independent JD, Resume, and real-time AI assistance.
                </div>
              </div>

              <button
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  padding: '8px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            /* Logged-Out Authentication View: ONLY Google Sign-In */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Value Proposition Pill */}
              <div
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  fontSize: '13px',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  lineHeight: 1.4,
                }}
              >
                <Sparkles size={20} style={{ flexShrink: 0, color: '#38bdf8' }} />
                <span>
                  Sign in with Google to activate <strong>10 Free Technical Interview Solves</strong> and Air-Gapped Mobile HUD sync.
                </span>
              </div>

              {/* Status indicator when browser has been opened */}
              {isOpeningBrowser && (
                <div
                  style={{
                    backgroundColor: 'rgba(66, 133, 244, 0.12)',
                    border: '1px solid rgba(66, 133, 244, 0.3)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                    color: '#93c5fd',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(147, 197, 253, 0.3)',
                      borderTopColor: '#60a5fa',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    Browser opened! Select your Google account in Chrome/Edge to complete sign-in.
                  </span>
                </div>
              )}

              {/* ONLY SIGN IN OPTION: 1-Click Launch Browser for Google */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 16px rgba(255, 255, 255, 0.15)',
                  transition: 'transform 0.15s ease, background-color 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span>Opens your default browser to select your Google Account securely</span>
                <span>Questions or setup support? Contact <a href="mailto:keterai26@gmail.com" style={{ color: '#38bdf8', textDecoration: 'none' }}>keterai26@gmail.com</a></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
