import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Sparkles,
  Shield,
  CheckCircle,
  LogOut,
  Zap,
  Gift,
  Clock,
  Edit2,
  ExternalLink,
  Briefcase,
  FileText,
  Sliders,
  Award,
  Layers,
  Code2,
  RefreshCw,
  Check,
  Folder,
  Plus,
  Trash2,
  ChevronRight,
  Play,
  BookOpen,
  HelpCircle,
  Smartphone,
  Eye,
  Mic,
  CheckCircle2,
  Keyboard,
  Mail,
} from 'lucide-react';
import {
  signOutUser,
  getActiveUser,
  getUserProfile,
} from '../services/supabaseClient';
import {
  getProjectRemainingTime,
  PROJECT_COST_INR,
} from '../services/projectService';

export function ProfileModal({
  isOpen,
  onClose,
  onProfileChange,
  onOpenSettings,
  projects = [],
  activeProject = null,
  onSelectProject,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onActivateProject,
  onBuyProjectClick,
  onStartTour,
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'interview' | 'resume'
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem('keter_user_profile');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return {
      name: 'Anil Manal',
      email: 'anilmanal992115@gmail.com',
      plan: 'free_trial',
      plan_status: 'active',
      free_credits_left: 10,
      targetRole: 'Senior Full Stack Engineer',
      experienceLevel: 'Senior (5+ yrs)',
      targetStack: ['React', 'Node.js', 'TypeScript', 'System Design', 'Algorithms'],
      is_pro: false,
    };
  });

  const [isOpeningBrowser, setIsOpeningBrowser] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [targetRoleInput, setTargetRoleInput] = useState(profile?.targetRole || 'Senior Full Stack Engineer');
  const [experienceInput, setExperienceInput] = useState(profile?.experienceLevel || 'Senior (5+ yrs)');
  const [resumeSummaryInput, setResumeSummaryInput] = useState(() => {
    return localStorage.getItem('keter_resume_summary') || '';
  });
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Initialize or load user profile
  useEffect(() => {
    let active = true;
    (async () => {
      const activeUser = await getActiveUser();
      if (active && activeUser) {
        setUser(activeUser);
        const prof = await getUserProfile(activeUser);
        if (prof) {
          setProfile(prof);
          setNameInput(prof.name || 'Anil Manal');
        }
      } else {
        const cached = localStorage.getItem('keter_user_profile');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setProfile(parsed);
            setUser({ id: parsed.id || 'usr_default', email: parsed.email });
            setNameInput(parsed.name || 'Anil Manal');
          } catch (e) {}
        } else {
          // Default candidate profile for immediate rich experience
          const defaultProf = {
            id: 'usr_anil',
            name: 'Anil Manal',
            email: 'anilmanal992115@gmail.com',
            plan: 'free_trial',
            plan_status: 'active',
            free_credits_left: 10,
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            targetRole: 'Senior Full Stack Engineer',
            experienceLevel: 'Senior (5+ yrs)',
            targetStack: ['React', 'Node.js', 'TypeScript', 'System Design', 'Algorithms'],
            is_pro: false,
            provider: 'google',
          };
          setProfile(defaultProf);
          setUser({ id: defaultProf.id, email: defaultProf.email });
          setNameInput(defaultProf.name);
          localStorage.setItem('keter_user_profile', JSON.stringify(defaultProf));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Listen for Google Auth callback from external browser bridge
  useEffect(() => {
    if (window.electronAPI?.onGoogleAuthSuccess) {
      const unsub = window.electronAPI.onGoogleAuthSuccess((data) => {
        if (data?.email) {
          const cleanEmail = data.email.trim();
          const cleanName = data.name || cleanEmail.split('@')[0];
          const updatedProf = {
            ...(profile || {}),
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
          setUser({ id: updatedProf.id, email: cleanEmail });
          setProfile(updatedProf);
          setNameInput(cleanName);
          localStorage.setItem('keter_user_profile', JSON.stringify(updatedProf));
          if (onProfileChange) onProfileChange(updatedProf);
          setIsOpeningBrowser(false);
          setIsSavedNotice(true);
          setTimeout(() => setIsSavedNotice(false), 2500);
        }
      });
      return () => {
        if (typeof unsub === 'function') unsub();
      };
    }
  }, [profile]);

  const handleSavePreferences = () => {
    const updated = {
      ...(profile || {}),
      name: nameInput.trim() || profile?.name || 'Anil Manal',
      targetRole: targetRoleInput.trim(),
      experienceLevel: experienceInput,
    };
    setProfile(updated);
    localStorage.setItem('keter_user_profile', JSON.stringify(updated));
    localStorage.setItem('keter_resume_summary', resumeSummaryInput.trim());
    if (onProfileChange) onProfileChange(updated);
    setIsEditingName(false);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleGoogleSignIn = () => {
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
    if (onProfileChange) onProfileChange(null);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 13, 0.88)',
        backdropFilter: 'blur(10px)',
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
          backgroundColor: '#0c101c',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(168, 85, 247, 0.12)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          color: '#f1f5f9',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#c084fc',
              }}
            >
              <User size={20} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc', letterSpacing: '0.01em' }}>
                Candidate Profile & License
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Manage account identity, solve quota, and interview context
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
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            padding: '0 16px',
          }}
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              flex: 1,
              padding: '12px 10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid #a855f7' : '2px solid transparent',
              color: activeTab === 'overview' ? '#f8fafc' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <User size={15} /> Overview
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            style={{
              flex: 1,
              padding: '12px 10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'projects' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'projects' ? '#f8fafc' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <Folder size={15} color={activeTab === 'projects' ? '#38bdf8' : undefined} /> Projects ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('interview')}
            style={{
              flex: 1,
              padding: '12px 10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'interview' ? '2px solid #a855f7' : '2px solid transparent',
              color: activeTab === 'interview' ? '#f8fafc' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <Briefcase size={15} /> Target Role
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            style={{
              flex: 1,
              padding: '12px 10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'resume' ? '2px solid #a855f7' : '2px solid transparent',
              color: activeTab === 'resume' ? '#f8fafc' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <FileText size={15} /> Resume Vault
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              flex: 1,
              padding: '12px 10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'manual' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'manual' ? '#f8fafc' : '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <BookOpen size={15} color={activeTab === 'manual' ? '#38bdf8' : undefined} /> User Manual
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '22px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* TAB 1: OVERVIEW & QUOTA */}
          {activeTab === 'overview' && (
            <>
              {/* Candidate Identity Card */}
              <div
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(66, 133, 244, 0.18)',
                    border: '2px solid rgba(66, 133, 244, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#60a5fa',
                    fontSize: '22px',
                    fontWeight: '700',
                    flexShrink: 0,
                  }}
                >
                  {profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'A'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isEditingName ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Your Name"
                          autoFocus
                          style={{
                            fontSize: '14px',
                            background: '#090d16',
                            border: '1px solid #38bdf8',
                            borderRadius: '6px',
                            color: '#fff',
                            padding: '3px 8px',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={handleSavePreferences}
                          style={{
                            background: '#7c3aed',
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
                      </div>
                    ) : (
                      <span style={{ fontSize: '16px', fontWeight: '700', color: '#f8fafc' }}>
                        {profile?.name || 'Anil Manal'}
                      </span>
                    )}
                    <button
                      onClick={() => setIsEditingName(!isEditingName)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                      }}
                      title="Edit Name"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                    {profile?.email || 'anilmanal992115@gmail.com'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
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
                      <CheckCircle size={10} color="#4ade80" /> Google Verified
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                      }}
                    >
                      KETER CANDIDATE
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Project Session Quick View */}
              {activeProject && (
                <div
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.06)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '16px',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                      }}
                    >
                      <Folder size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                          {activeProject.title}
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(34, 197, 94, 0.2)',
                            color: '#4ade80',
                            border: '1px solid rgba(34, 197, 94, 0.35)',
                          }}
                        >
                          ACTIVE SESSION
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        Mode: {activeProject.promptMode} • Remaining: {getProjectRemainingTime(activeProject).text}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('projects')}
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>View Projects</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}

              {/* Interview Pass Model Info Card */}
              <div
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Folder size={16} color="#38bdf8" /> Interview Session Passes (₹{PROJECT_COST_INR} / Session)
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.4 }}>
                    Each project includes isolated JD & Resume contexts, OCR question detection, and full speech intelligence. The 24-hour validity countdown starts only when you activate the session.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('projects');
                  }}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Manage Projects <ChevronRight size={13} />
                </button>
              </div>

              {/* Account Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleGoogleSignIn}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={13} /> Re-verify Google
                </button>
                <button
                  onClick={handleSignOut}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  title="Sign out of your account"
                >
                  <LogOut size={13} /> Sign Out
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Quit Keter application completely?')) {
                      if (window.electronAPI?.quitApp) {
                        window.electronAPI.quitApp();
                      } else if (window.electronAPI?.closeWindow) {
                        window.electronAPI.closeWindow();
                      } else {
                        window.close();
                      }
                    }
                  }}
                  style={{
                    padding: '10px 16px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '10px',
                    color: '#f87171',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  title="Quit and close Keter desktop application"
                >
                  <X size={13} /> Exit App
                </button>
              </div>

              {/* Direct Support Note */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  fontSize: '11.5px',
                  color: '#94a3b8',
                }}
              >
                <Mail size={13} color="#38bdf8" />
                <span>Contact & Support:</span>
                <a
                  href="mailto:keterai26@gmail.com?subject=Keter%20AI%20Support"
                  style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
                >
                  keterai26@gmail.com
                </a>
              </div>
            </>
          )}

          {/* TAB: INTERVIEW PROJECTS */}
          {activeTab === 'projects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '14px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Folder size={16} color="#38bdf8" />
                    <span>Interview Projects (Sessions)</span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                      }}
                    >
                      ₹{PROJECT_COST_INR} / 24H PASS
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                    Each pass is purchased as <strong>Inactive</strong>. The 24-hour timer starts ONLY when you activate it right before your interview.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onBuyProjectClick) {
                        onBuyProjectClick();
                      } else if (onCreateProject) {
                        onCreateProject();
                      }
                    }}
                    style={{
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Zap size={14} color="#ffd700" />
                    <span>+ Buy Project Pass (₹{PROJECT_COST_INR})</span>
                  </button>
                </div>
              </div>

              {/* Projects List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {projects.map((proj) => {
                  const timer = getProjectRemainingTime(proj);
                  const isActive = activeProject?.id === proj.id;

                  return (
                    <div
                      key={proj.id}
                      style={{
                        backgroundColor: isActive ? 'rgba(15, 23, 42, 0.85)' : 'rgba(15, 23, 42, 0.5)',
                        border: isActive ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: isActive ? '0 0 16px rgba(56, 189, 248, 0.15)' : 'none',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              backgroundColor: isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isActive ? '#38bdf8' : '#94a3b8',
                            }}
                          >
                            <Folder size={16} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                                {proj.title}
                              </span>
                              {isActive && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                    color: '#4ade80',
                                    border: '1px solid rgba(34, 197, 94, 0.35)',
                                  }}
                                >
                                  CURRENT
                                </span>
                              )}
                              {!proj.isActivated && (
                                <span
                                  style={{
                                    fontSize: '9px',
                                    fontWeight: 700,
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                    color: '#fbbf24',
                                    border: '1px solid rgba(245, 158, 11, 0.3)',
                                  }}
                                >
                                  UNACTIVATED PASS
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              {proj.targetRole || 'Full Stack Software Engineer'} • {proj.messages?.length || 0} messages
                            </div>
                          </div>
                        </div>

                        {/* Timer / Activation Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {!proj.isActivated ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Activate "${proj.title}" now?\n\n⚠️ IMPORTANT RULE:\nOnce activated, the 24-hour timer starts immediately and CANNOT be paused or deactivated.`
                                  )
                                ) {
                                  if (onActivateProject) onActivateProject(proj.id);
                                }
                              }}
                              style={{
                                background: 'rgba(34, 197, 94, 0.2)',
                                border: '1px solid rgba(34, 197, 94, 0.45)',
                                color: '#4ade80',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                              }}
                              title="Start the 24-hour session timer"
                            >
                              <Play size={11} fill="#4ade80" />
                              <span>Activate Session (24h)</span>
                            </button>
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '6px',
                                backgroundColor: timer.isExpired ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.1)',
                                color: timer.isExpired ? '#f87171' : '#7dd3fc',
                                border: timer.isExpired ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.2)',
                              }}
                            >
                              <Clock size={11} />
                              <span>{timer.text}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingTop: '8px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              color: '#cbd5e1',
                            }}
                          >
                            MODE: {proj.promptMode || 'technical'}
                          </span>
                          {proj.jobDescription && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#38bdf8',
                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              ✓ JD Attached
                            </span>
                          )}
                          {proj.resumeContext && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#c084fc',
                                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              ✓ Resume Attached
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onSelectProject) onSelectProject(proj);
                                onClose();
                              }}
                              style={{
                                background: 'rgba(56, 189, 248, 0.15)',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                color: '#38bdf8',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Switch to this
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (onEditProject) onEditProject(proj);
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#f8fafc',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Sliders size={11} />
                            <span>JD & Context</span>
                          </button>
                          {projects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Delete project "${proj.title}"? This cannot be undone.`)) {
                                  if (onDeleteProject) onDeleteProject(proj.id);
                                }
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#94a3b8',
                                padding: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              title="Delete project"
                            >
                              <Trash2 size={13} color="#f87171" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: INTERVIEW & TARGET ROLE */}
          {activeTab === 'interview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Target Engineering Position
                </label>
                <input
                  type="text"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Candidate Experience Level
                </label>
                <select
                  value={experienceInput}
                  onChange={(e) => setExperienceInput(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  <option value="Junior (0-2 yrs)">Junior (0-2 yrs)</option>
                  <option value="Mid-Level (2-5 yrs)">Mid-Level (2-5 yrs)</option>
                  <option value="Senior (5+ yrs)">Senior (5+ yrs)</option>
                  <option value="Staff / Principal (8+ yrs)">Staff / Principal (8+ yrs)</option>
                  <option value="Engineering Manager / Lead">Engineering Manager / Lead</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>
                  Active Focus Competencies
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['React', 'Node.js', 'TypeScript', 'System Design', 'Algorithms', 'Distributed Systems', 'Python', 'SQL'].map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: 'rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#c084fc',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSavePreferences}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Check size={16} /> Save Interview Preferences
              </button>
            </div>
          )}

          {/* TAB 3: RESUME VAULT */}
          {activeTab === 'resume' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  backgroundColor: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#38bdf8',
                  lineHeight: 1.4,
                }}
              >
                <Sparkles size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                Your resume context is automatically injected into Keter's prompt engine so AI answers reference your real background and projects.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '6px' }}>
                  Candidate Summary & Key Project Highlights
                </label>
                <textarea
                  rows={6}
                  value={resumeSummaryInput}
                  onChange={(e) => setResumeSummaryInput(e.target.value)}
                  placeholder="Paste your resume summary, top architectural accomplishments, or key technologies here..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <button
                onClick={handleSavePreferences}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Check size={16} /> Save Resume Vault
              </button>
            </div>
          )}

          {/* TAB 5: USER MANUAL (NO TECHNICAL JARGON, PURE HOW & WHY) */}
          {activeTab === 'manual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Tour Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(168, 85, 247, 0.15))',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Sparkles size={16} color="#38bdf8" />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                      Interactive Guided Walkthrough
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    Take a quick 1-minute visual tour of Keter's stealth overlay, audio loopback, and mobile teleprompter.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onStartTour) {
                      onClose();
                      onStartTour();
                    }
                  }}
                  style={{
                    padding: '9px 16px',
                    background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
                  }}
                >
                  ✨ Start Guided Tour
                </button>
              </div>

              {/* Section 1: The Core Philosophy & Why Keter */}
              <div
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Shield size={16} color="#38bdf8" />
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
                    Why Keter Exists & Your Core Advantage
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
                  High-pressure interviews are stressful. Even brilliant engineers stumble, blank out on metrics, or struggle to structure complex system trade-offs on the spot. 
                  <strong> Keter is your invisible co-pilot</strong> — sitting silently beside you to listen to questions, reference your true background, and stream senior-level answers directly to your eyes in real time.
                </p>
              </div>

              {/* Section 2: Step-by-Step How & Why */}
              <div
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HelpCircle size={16} color="#a855f7" />
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                    Step-by-Step Interview Playbook
                  </h3>
                </div>

                {/* Step 1 */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      color: '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    1
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                      Set Up Your Interview Project (Context is King)
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      <strong>How:</strong> Open the <strong>Projects</strong> tab, click <em>Create Project</em>, and paste the Target Job Description and your Resume summary.<br />
                      <strong>Why:</strong> This stops the AI from generating generic internet answers. Instead, it weaves your real past companies, architecture patterns, and metrics into every response.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#a855f7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    2
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                      Choose the Right Prompt Mode
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      <strong>How:</strong> Select the mode matching your interview round in Project Settings:
                      <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                        <li><strong>📐 Technical Architecture:</strong> System design, scalability, caching, database trade-offs.</li>
                        <li><strong>🗣️ STAR Behavioral:</strong> Situation, Task, Action, Result structured storytelling.</li>
                        <li><strong>💻 Coding & LeetCode:</strong> Algorithm intuition, edge cases, and optimal solution code.</li>
                        <li><strong>🤝 Meeting & Discussion:</strong> Crisp conversational executive talking points.</li>
                        <li><strong>🎯 Custom Instructions:</strong> Give direct rules (e.g. <em>"Strictly answer in 3 short bullets. Talk like a Staff Engineer."</em>).</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                      Automatic Audio Ear (Hands-Free Listening)
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      <strong>How:</strong> Click the <strong>Mic</strong> icon before your call starts. That's it!<br />
                      <strong>Why:</strong> Keter captures the interviewer's voice directly from your computer speakers while also hearing your microphone. You never have to manually type questions while talking.
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    4
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                      Screen Share Immunity (100% Invisible • Default ON)
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      <strong>How:</strong> Screen invisibility is enabled automatically by default on startup. When the interviewer asks you to share your screen on Zoom, Teams, or Meet, share your full display normally without worrying. You can view or toggle this under Settings (Sliders icon) → Stealth & Display.<br />
                      <strong>Why:</strong> Keter is completely excluded from screen captures and recordings. The interviewer only sees your clean desktop, browser, and code editor — Keter is completely invisible to them!
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.4)',
                      color: '#06b6d4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    5
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '2px' }}>
                      Air-Gapped Mobile Teleprompter (Eye Contact Secret)
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                      <strong>How:</strong> Click the <strong>Phone</strong> button in the header and scan the QR code with your phone camera.<br />
                      <strong>Why:</strong> Prop your phone directly under or next to your webcam. As the interviewer asks questions, answers stream to your phone screen. You maintain natural eye contact with the camera rather than glancing down at your desktop.
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: All Keyboard Shortcuts Directory */}
              <div
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Keyboard size={18} color="#38bdf8" />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                        Complete Keyboard Shortcuts Directory
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: '11.5px', color: '#94a3b8' }}>
                        All hotkeys work system-wide even when Keter is running silently in the background
                      </p>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                {[
                  {
                    category: 'Stealth & Window Visibility',
                    color: '#38bdf8',
                    shortcuts: [
                      { key: 'Alt + K  or  Ctrl + Shift + H', desc: 'Instantly toggle Keter HUD overlay (Show / Hide)', badge: 'Stealth' },
                      { key: 'F9  or  Ctrl + Alt + S', desc: 'Auto-Camouflage (Vanishes for 3s so you can take clean screenshots)', badge: 'Stealth' },
                      { key: 'Ctrl + Shift + T', desc: 'Toggle Click-Through Lock (Passes mouse clicks straight to background IDE)', badge: 'Overlay' },
                      { key: 'Ctrl + Shift + X', desc: 'Emergency Panic Kill-Switch (Instantly vanishes and closes Keter)', badge: 'Panic' },
                    ]
                  },
                  {
                    category: 'AI Voice & Screen Intelligence',
                    color: '#10b981',
                    shortcuts: [
                      { key: 'Alt + S  or  Ctrl + Shift + S', desc: 'Screen Auto-Read & Solve (Instantly OCRs and solves code/MCQs)', badge: 'AI Action' },
                      { key: 'Alt + M', desc: 'Toggle Audio Ear (Turn voice listening and speech recognition on/off)', badge: 'Audio' },
                      { key: 'Ctrl + Shift + Space', desc: 'Instant AI Solution (Force generates answer for current question)', badge: 'AI Action' },
                      { key: 'Alt + C  or  Ctrl + Shift + C', desc: 'Clear Chat Session (Wipes history clean for next interview round)', badge: 'Chat' },
                    ]
                  },
                  {
                    category: 'Display & Opacity Controls',
                    color: '#a855f7',
                    shortcuts: [
                      { key: 'Ctrl + Shift + Up', desc: 'Increase Window Opacity (+10% more solid and visible)', badge: 'Display' },
                      { key: 'Ctrl + Shift + Down', desc: 'Decrease Window Opacity (-10% more subtle and transparent)', badge: 'Display' },
                    ]
                  },
                  {
                    category: 'Chat Input & Dialog Navigation',
                    color: '#f59e0b',
                    shortcuts: [
                      { key: 'Enter', desc: 'Submit typed question or message to Keter AI', badge: 'Input' },
                      { key: 'Shift + Enter', desc: 'Insert line break without sending message', badge: 'Input' },
                      { key: 'Escape', desc: 'Quickly close open dialogs and return focus to desktop', badge: 'Nav' },
                    ]
                  },
                ].map((cat) => (
                  <div key={cat.category} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: cat.color,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        {cat.category}
                      </span>
                      <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
                      {cat.shortcuts.map((sc) => (
                        <div
                          key={sc.key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            padding: '10px 14px',
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '10px',
                          }}
                        >
                          <span style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.35 }}>{sc.desc}</span>
                          <kbd
                            style={{
                              backgroundColor: `${cat.color}15`,
                              border: `1px solid ${cat.color}35`,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: cat.color,
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            {sc.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Section 4: Contact & Dedicated Support */}
              <div
                style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.4)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '14px',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#38bdf8',
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      Questions, Setup Help, or Custom Interview Guidance?
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      Contact our core engineering team directly at:{' '}
                      <a href="mailto:keterai26@gmail.com" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>
                        keterai26@gmail.com
                      </a>
                    </div>
                  </div>
                </div>

                <a
                  href="mailto:keterai26@gmail.com?subject=Keter%20AI%20Inquiry%20/%20Support"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                    borderRadius: '8px',
                    color: '#38bdf8',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Mail size={14} />
                  Email Support
                </a>
              </div>
            </div>
          )}

          {isSavedNotice && (
            <div
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#4ade80',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              ✅ Changes saved successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
