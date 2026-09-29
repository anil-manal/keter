import React, { useState, useEffect } from 'react';
import {
  X,
  FolderPlus,
  Sliders,
  FileText,
  Briefcase,
  Clock,
  Sparkles,
  Zap,
  CheckCircle,
  AlertTriangle,
  Lock,
  Play,
} from 'lucide-react';
import { PROMPT_MODES } from '../utils/promptTemplates';
import { getProjectRemainingTime, PROJECT_COST_INR } from '../services/projectService';

export function ProjectConfigModal({
  isOpen,
  onClose,
  mode = 'edit', // 'edit' | 'create'
  project,
  isPro = false,
  onSave,
  onOpenUpgrade,
  onActivateProject,
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [promptMode, setPromptMode] = useState(PROMPT_MODES.TECHNICAL);
  const [customInstructions, setCustomInstructions] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeContext, setResumeContext] = useState('');
  const [activeTab, setActiveTab] = useState('context'); // 'context' | 'details'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (project && mode === 'edit') {
      setTitle(project.title || '');
      setCompany(project.company || '');
      setTargetRole(project.targetRole || '');
      setPromptMode(project.promptMode || PROMPT_MODES.TECHNICAL);
      setCustomInstructions(project.customInstructions || '');
      setJobDescription(project.jobDescription || '');
      setResumeContext(project.resumeContext || '');
    } else {
      setTitle('');
      setCompany('');
      setTargetRole('Senior Software Engineer');
      setPromptMode(PROMPT_MODES.TECHNICAL);
      setCustomInstructions('');
      setJobDescription('');
      setResumeContext('');
    }
    setErrorMsg('');
  }, [project, mode, isOpen]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a project title (e.g., "Google Senior Frontend Round").');
      return;
    }

    const payload = {
      title: title.trim(),
      company: company.trim(),
      targetRole: targetRole.trim(),
      promptMode,
      customInstructions: customInstructions.trim(),
      jobDescription: jobDescription.trim(),
      resumeContext: resumeContext.trim(),
    };

    onSave(payload);
    onClose();
  };

  const timerInfo = project ? getProjectRemainingTime(project) : { text: '24 Hours Validity', isExpired: false, percent: 100 };

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
        zIndex: 10000,
        padding: '16px',
      }}
    >
      <div
        className="modal-card"
        style={{
          backgroundColor: '#0c101c',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.12)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: 'min(92vh, 640px)',
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
            padding: '16px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}
            >
              {mode === 'create' ? <FolderPlus size={18} /> : <Sliders size={18} />}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                {mode === 'create' ? 'Create New Interview Project' : 'Project Settings & Context'}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Each project has independent JD, Resume, Prompt Mode & Chat History
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

        {/* 24-Hour Lifespan Status Bar */}
        <div
          style={{
            padding: '10px 22px',
            backgroundColor: timerInfo.isExpired ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.08)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={14} color={timerInfo.isExpired ? '#f87171' : '#38bdf8'} />
            <span style={{ color: timerInfo.isExpired ? '#f87171' : '#cbd5e1' }}>
              Project Session Validity: <strong>{timerInfo.text}</strong>
            </span>

            {/* If unactivated, show direct activation button right inside settings */}
            {project && !project.isActivated && mode === 'edit' && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you ready to activate "${project.title}"?\n\n⚠️ IMPORTANT RULE:\nOnce activated, your 24-hour interview timer begins immediately and CANNOT be paused or deactivated.`
                    )
                  ) {
                    if (onActivateProject) onActivateProject(project.id);
                  }
                }}
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.5)',
                  color: '#4ade80',
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Play size={10} fill="#4ade80" />
                <span>Activate Session (24h)</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '10px',
                backgroundColor: isPro ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isPro ? '#4ade80' : '#fbbf24',
                border: isPro ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              {isPro
                ? '⚡ UNLIMITED PRO'
                : project?.paidAmount === 0
                ? '🎁 1 FREE PROJECT (24H)'
                : `⚡ ₹${PROJECT_COST_INR} PROJECT PASS`}
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenUpgrade) onOpenUpgrade();
              }}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Zap size={11} color="#ffd700" />
              <span>Buy Pass (₹{PROJECT_COST_INR})</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            padding: '0 16px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setActiveTab('context')}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'context' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'context' ? '#f8fafc' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <FileText size={14} /> JD & Tailored Resume
          </button>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'details' ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === 'details' ? '#f8fafc' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Briefcase size={14} /> Role & Prompt Mode
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            {errorMsg && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertTriangle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: JD & RESUME CONTEXT */}
            {activeTab === 'context' && (
              <>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                      Target Job Description (JD)
                    </label>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Tailors AI answers directly to this role
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description, required qualifications, system architecture expectations, or interview instructions..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: '1.4',
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                      Tailored Resume Highlights for this Project
                    </label>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      AI will ground answers in these experiences
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={resumeContext}
                    onChange={(e) => setResumeContext(e.target.value)}
                    placeholder="Paste specific past projects, architecture achievements, metrics (e.g. reduced latency by 40%), or key technologies..."
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: '#f8fafc',
                      fontSize: '12px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      lineHeight: '1.4',
                    }}
                  />
                </div>
              </>
            )}

            {/* TAB 2: PROJECT DETAILS & PROMPT MODE */}
            {activeTab === 'details' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                    Project / Session Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Google L5 Full Stack Round, Amazon SDE II"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                      Company
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Google, Meta, Stripe"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '5px' }}>
                      Target Role
                    </label>
                    <input
                      type="text"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Staff Engineer"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
                    Project Prompt Mode
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    {[
                      { id: PROMPT_MODES.TECHNICAL, name: '📐 Technical Architecture', desc: 'System design, APIs, trade-offs' },
                      { id: PROMPT_MODES.STAR, name: '🗣️ STAR Behavioral', desc: 'Situation, Task, Action, Result' },
                      { id: PROMPT_MODES.CODING, name: '💻 Coding & LeetCode', desc: 'MCQs & Algorithmic intuition' },
                      { id: PROMPT_MODES.MEETING, name: '🤝 Meeting & Discussion', desc: 'Executive conversational flow' },
                      { id: PROMPT_MODES.CUSTOM, name: '🎯 Custom Instructions', desc: 'Tailored AI guidance on how to answer' },
                    ].map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setPromptMode(m.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          backgroundColor: promptMode === m.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.4)',
                          border: promptMode === m.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: '12px', fontWeight: 700, color: promptMode === m.id ? '#38bdf8' : '#e2e8f0' }}>
                          {m.name}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                          {m.desc}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Custom Instruction Box */}
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: promptMode === PROMPT_MODES.CUSTOM ? 'rgba(56, 189, 248, 0.08)' : 'rgba(30, 41, 59, 0.3)',
                      border: promptMode === PROMPT_MODES.CUSTOM ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: promptMode === PROMPT_MODES.CUSTOM ? '#38bdf8' : '#cbd5e1' }}>
                        ✍️ Custom Instructions to AI/LLM
                      </label>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {promptMode === PROMPT_MODES.CUSTOM ? 'Primary Answering Rules' : 'Optional Override Rules'}
                      </span>
                    </div>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="e.g. Always answer in 3 concise bullet points. Start with a confident spoken sentence. Speak from the perspective of a Senior Staff Engineer. Avoid boilerplate code."
                      rows={3}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '8px',
                        padding: '9px 12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                        lineHeight: 1.5,
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {[
                        'Bullet points only',
                        'Speak like Staff Engineer',
                        'Keep answers under 30 words',
                        'Give high-level intuition first',
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setCustomInstructions((prev) =>
                              prev ? `${prev.trim()}. ${preset}.` : `${preset}.`
                            );
                          }}
                          style={{
                            fontSize: '10px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#94a3b8',
                            padding: '3px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Action Bar */}
          <div
            style={{
              padding: '14px 22px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Changes are immediately applied to real-time AI prompts
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 18px',
                  background: 'var(--accent-gradient)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#090d16',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)',
                }}
              >
                <CheckCircle size={14} />
                {mode === 'create' ? 'Create Project' : 'Save Project Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
