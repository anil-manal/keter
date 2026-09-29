import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Shield,
  Eye,
  Mic,
  Zap,
  Gift,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Lock,
  AlertTriangle,
} from 'lucide-react';

export function AuthGate({ onAuthSuccess, onOpenLanding }) {
  const [isOpeningBrowser, setIsOpeningBrowser] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Universal Authentication Handler
  const handleAuthenticate = (email, name) => {
    if (!email || !email.trim()) {
      setErrorMsg('Please enter a valid candidate email address.');
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email format (e.g., candidate@gmail.com).');
      return;
    }

    const cleanName = name?.trim() || cleanEmail.split('@')[0];
    const newProfile = {
      id: 'usr_' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      plan: 'free_trial',
      plan_status: 'active',
      free_credits_left: 10,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      is_pro: false,
      provider: 'email',
    };
    localStorage.setItem('keter_user_profile', JSON.stringify(newProfile));
    if (onAuthSuccess) onAuthSuccess(newProfile);
  };

  // Quick Demo / Candidate Guest Access
  const handleQuickDemoAccess = () => {
    handleAuthenticate('candidate.demo@keter.ai', 'Candidate');
  };

  // Listen for Google Auth callback from external browser bridge
  useEffect(() => {
    if (window.electronAPI?.onGoogleAuthSuccess) {
      const unsub = window.electronAPI.onGoogleAuthSuccess((data) => {
        if (data?.email) {
          const cleanEmail = data.email.trim();
          const cleanName = data.name || cleanEmail.split('@')[0];
          const newProfile = {
            id: 'usr_' + Date.now(),
            name: cleanName,
            email: cleanEmail,
            plan: 'free_trial',
            plan_status: 'active',
            free_credits_left: 10,
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            is_pro: false,
            provider: 'google',
          };
          localStorage.setItem('keter_user_profile', JSON.stringify(newProfile));
          if (onAuthSuccess) onAuthSuccess(newProfile);
        }
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [onAuthSuccess]);

  const handleGoogleSignIn = () => {
    setErrorMsg('');

    // If running in standalone browser without local Electron server
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!window.electronAPI && !isLocalhost) {
      // In remote web deployment (e.g. Vercel), provide the direct email sign-in
      setShowEmailForm(true);
      setErrorMsg('For web access, please sign in with your candidate email below.');
      return;
    }

    setIsOpeningBrowser(true);
    const authUrl = `http://localhost:5188/auth/google?v=${Date.now()}`;
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(authUrl);
    } else {
      window.open(authUrl, '_blank');
    }
  };

  const handleMinimize = () => {
    if (window.electronAPI?.minimizeWindow) {
      window.electronAPI.minimizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.closeWindow) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#070a12',
        backgroundImage: 'radial-gradient(ellipse at 50% 10%, rgba(124, 58, 237, 0.18) 0%, rgba(7, 10, 18, 0.98) 75%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10000,
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Draggable Title Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          WebkitAppRegion: 'drag',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 900,
              color: '#fff',
            }}
          >
            K
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: '#cbd5e1' }}>
            KETER INTELLIGENCE
          </span>
          <span style={{ fontSize: '10px', color: '#64748b', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px' }}>
            v1.0.0
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', WebkitAppRegion: 'no-drag' }}>
          {onOpenLanding && (
            <button
              onClick={onOpenLanding}
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ← Back to Website
            </button>
          )}
          {window.electronAPI && (
            <>
              <button
                onClick={handleMinimize}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                ―
              </button>
              <button
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Authentication Card */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(168, 85, 247, 0.35)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(124, 58, 237, 0.15)',
            borderRadius: '24px',
            padding: '36px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Logo Badge */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: '0 0 24px rgba(124, 58, 237, 0.35)',
            }}
          >
            <Sparkles size={32} color="#c084fc" />
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: '800',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Welcome to Keter
          </h1>
          <p
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              margin: '0 0 24px',
              lineHeight: 1.5,
              maxWidth: '380px',
            }}
          >
            Real-Time Technical Interview Intelligence & Stealth Teleprompter. Sign in to activate your assessment license.
          </p>

          {/* Key Pillars Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              width: '100%',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Shield size={18} color="#38bdf8" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>Stealth HUD</span>
              <span style={{ fontSize: '9px', color: '#64748b' }}>Air-gapped</span>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Eye size={18} color="#c084fc" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>Screen OCR</span>
              <span style={{ fontSize: '9px', color: '#64748b' }}>Alt+S Vision</span>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '12px',
                padding: '12px 8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Mic size={18} color="#34d399" />
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>Voice Copilot</span>
              <span style={{ fontSize: '9px', color: '#64748b' }}>Multi-turn</span>
            </div>
          </div>

          {/* Complimentary Quota Pill */}
          <div
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '10px 16px',
              width: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#38bdf8',
              fontWeight: 600,
            }}
          >
            <Gift size={16} />
            <span>Includes <strong>10 Free Technical Assessment Solves</strong> on sign in</span>
          </div>

          {/* Status when browser opens */}
          {isOpeningBrowser && (
            <div
              style={{
                backgroundColor: 'rgba(66, 133, 244, 0.12)',
                border: '1px solid rgba(66, 133, 244, 0.35)',
                borderRadius: '12px',
                padding: '12px 16px',
                width: '100%',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '16px',
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
              <span>Browser opened! Select your Google account in Chrome to unlock Keter.</span>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                padding: '10px 14px',
                width: '100%',
                boxSizing: 'border-box',
                color: '#f87171',
                fontSize: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left',
              }}
            >
              <AlertTriangle size={15} flexShrink={0} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mandatory Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: 'none',
              borderRadius: '14px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(255, 255, 255, 0.2)',
              transition: 'all 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
          >
            <svg width="22" height="22" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Email / Custom Credentials Form (Fallback for Web or Direct Candidate Entry) */}
          {showEmailForm ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAuthenticate(emailInput, nameInput);
              }}
              style={{
                width: '100%',
                marginTop: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                textAlign: 'left',
              }}
            >
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Candidate Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Anil Manal"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Candidate Email (Required)
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. candidate@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #00f2fe 0%, #7c3aed 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                Sign In with Email
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', margin: '14px 0 6px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  padding: '2px 8px',
                  textDecoration: 'underline',
                }}
              >
                Or sign in with candidate email
              </button>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
            </div>
          )}

          {/* Quick Demo Test Access */}
          <button
            type="button"
            onClick={handleQuickDemoAccess}
            style={{
              marginTop: '10px',
              width: '100%',
              padding: '9px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={13} color="#38bdf8" />
            <span>Launch Instant Demo (Guest Candidate)</span>
          </button>

          <div
            style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#64748b',
            }}
          >
            <Lock size={12} />
            <span>Sign in is required to unlock AI assessment solve quota</span>
          </div>

          {onOpenLanding && (
            <button
              type="button"
              onClick={onOpenLanding}
              style={{
                marginTop: '14px',
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              ← Return to Landing Page & Downloads
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
