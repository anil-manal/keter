import React, { useState, useEffect } from 'react';
import { X, Shield, Key, FileText, Sliders, CheckCircle, LogOut, Mail, Compass, Eye, EyeOff, RotateCcw, Sparkles, Unlock } from 'lucide-react';
import { PROMPT_MODES } from '../utils/promptTemplates';
import { hasKeterManagedKey, isUsingCustomKey, hasEffectiveApiKey } from '../services/apiKeysConfig';

export function SettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  localIp,
  onStartTour,
}) {
  const [activeTab, setActiveTab] = useState('models'); // 'models' | 'context' | 'hud'
  const [localConfig, setLocalConfig] = useState(config);
  const [showKeys, setShowKeys] = useState({});

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Ensure non-working selections auto-fallback to pre-configured engines
  useEffect(() => {
    if (localConfig.llmProvider === 'openai' && !hasEffectiveApiKey('openai', localConfig.apiKeys)) {
      handleChange('llmProvider', 'groq');
    }
    if (localConfig.sttEngine === 'deepgram' && !hasEffectiveApiKey('deepgram', localConfig.apiKeys)) {
      handleChange('sttEngine', 'groq');
    }
  }, [localConfig.apiKeys]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
    onSaveConfig(updated);
  };

  const handleKeyChange = (provider, value) => {
    const updatedKeys = { ...(localConfig.apiKeys || {}), [provider]: value };
    const updated = { ...localConfig, apiKeys: updatedKeys };
    setLocalConfig(updated);
    onSaveConfig(updated);
  };

  const toggleShowKey = (provider) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <div className="modal-backdrop no-drag">
      <div className="modal-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10, 14, 22, 0.9)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#38bdf8" />
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>Keter Copilot Settings</h2>
          </div>
          <button onClick={onClose} className="icon-btn" title="Close Settings">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '4px', padding: '8px 16px', background: 'rgba(15, 20, 30, 0.8)', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('models')}
            className={`icon-btn ${activeTab === 'models' ? 'active' : ''}`}
            style={{ fontSize: '12px', gap: '6px' }}
          >
            <Key size={14} /> AI & STT Keys
          </button>
          <button
            onClick={() => setActiveTab('context')}
            className={`icon-btn ${activeTab === 'context' ? 'active' : ''}`}
            style={{ fontSize: '12px', gap: '6px' }}
          >
            <FileText size={14} /> Resume & Context
          </button>
          <button
            onClick={() => setActiveTab('hud')}
            className={`icon-btn ${activeTab === 'hud' ? 'active' : ''}`}
            style={{ fontSize: '12px', gap: '6px' }}
          >
            <Shield size={14} /> Stealth & Display
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* TAB 1: AI & STT MODELS */}
          {activeTab === 'models' && (
            <>
              {/* Ready-to-use Engine Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label">LLM Inference Provider</label>
                  <select
                    className="form-select"
                    value={localConfig.llmProvider}
                    onChange={(e) => handleChange('llmProvider', e.target.value)}
                  >
                    <option value="groq">⚡ Groq Cloud (Llama 3.3 / GPT-OSS)</option>
                    <option value="gemini">Google Gemini 2.0 Flash</option>
                    {hasEffectiveApiKey('openai', localConfig.apiKeys) && (
                      <option value="openai">OpenAI (GPT-4o-mini) — Unlocked with your key</option>
                    )}
                    <option value="mock">Built-in Mock Simulator (Instant Demo, No Key)</option>
                  </select>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    All listed options work immediately out-of-the-box.
                  </span>
                </div>

                <div>
                  <label className="form-label">Speech-To-Text (ASR) Engine</label>
                  <select
                    className="form-select"
                    value={localConfig.sttEngine}
                    onChange={(e) => handleChange('sttEngine', e.target.value)}
                  >
                    <option value="groq">⚡ Groq Whisper AI (Sub-second audio transcription)</option>
                    <option value="webspeech">Web Speech Recognition (Built-in Chrome/Edge)</option>
                    {hasEffectiveApiKey('deepgram', localConfig.apiKeys) && (
                      <option value="deepgram">Deepgram Nova-2 (WebSocket Sub-250ms API) — Unlocked</option>
                    )}
                  </select>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Mic & meeting audio transcription ready out-of-the-box.
                  </span>
                </div>
              </div>

              <div>
                <label className="form-label">Response Prompt Mode</label>
                <select
                  className="form-select"
                  value={localConfig.promptMode}
                  onChange={(e) => handleChange('promptMode', e.target.value)}
                >
                  <option value={PROMPT_MODES.STAR}>STAR Method (Behavioral / Situational Interview)</option>
                  <option value={PROMPT_MODES.TECHNICAL}>Technical Architecture & System Design</option>
                  <option value={PROMPT_MODES.CODING}>Coding & Algorithm Solutions (LeetCode Mode)</option>
                  <option value={PROMPT_MODES.MEETING}>General Meeting & Executive Briefing</option>
                  <option value={PROMPT_MODES.CUSTOM}>Custom Instructions (Tailored LLM Answering Rules)</option>
                </select>
              </div>

              {/* API Keys & BYOK Management Section */}
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Key size={15} color="#38bdf8" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      API Keys & Custom Override (BYOK)
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    Keter comes pre-configured with cloud keys for <strong>Groq</strong> and <strong>Google Gemini</strong>. You do <strong>not</strong> need to enter any keys to use Keter. If you wish to use your own personal API keys or unlock OpenAI / Deepgram, you can add them below.
                  </p>
                </div>

                {/* SUBSECTION 1: Pre-configured Keter Official Keys */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Pre-configured Cloud Keys (Active Out-of-the-Box)
                  </span>

                  {/* Groq Cloud Key */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        ⚡ Groq Cloud Key (Powers Whisper Voice STT & Fast Llama Answers)
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isUsingCustomKey('groq', localConfig.apiKeys) ? (
                          <>
                            <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                              🔵 Custom Key Active (BYOK)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleKeyChange('groq', '')}
                              style={{ fontSize: '10px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Reset to pre-configured Keter Cloud key"
                            >
                              <RotateCcw size={10} /> Reset to Keter
                            </button>
                          </>
                        ) : hasKeterManagedKey('groq') ? (
                          <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                            🟢 Keter Cloud Active
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                            ⚪ Key Needed
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showKeys.groq ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingRight: '36px' }}
                        placeholder={hasKeterManagedKey('groq') ? "•••••••••••••••• (Leave blank to use Keter Cloud, or paste gsk_ key to override)" : "Enter your Groq API Key (gsk_...)"}
                        value={localConfig.apiKeys?.groq || ''}
                        onChange={(e) => handleKeyChange('groq', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey('groq')}
                        style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title={showKeys.groq ? 'Hide key' : 'Show key'}
                      >
                        {showKeys.groq ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Pre-configured by Keter. You can optionally paste your personal key to use your own quota.</span>
                      <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                        Groq Console
                      </a>
                    </div>
                  </div>

                  {/* Google Gemini Key */}
                  <div style={{ background: 'rgba(236, 72, 153, 0.04)', border: '1px solid rgba(236, 72, 153, 0.25)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#f472b6' }}>
                        📸 Google Gemini Flash (Powers Alt+S Screen Vision & Reasoning)
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isUsingCustomKey('gemini', localConfig.apiKeys) ? (
                          <>
                            <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                              🔵 Custom Key Active (BYOK)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleKeyChange('gemini', '')}
                              style={{ fontSize: '10px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Reset to pre-configured Keter Cloud key"
                            >
                              <RotateCcw size={10} /> Reset to Keter
                            </button>
                          </>
                        ) : hasKeterManagedKey('gemini') ? (
                          <span style={{ fontSize: '10px', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(52, 211, 153, 0.3)' }}>
                            🟢 Keter Cloud Active
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                            ⚪ Key Needed
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showKeys.gemini ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingRight: '36px' }}
                        placeholder={hasKeterManagedKey('gemini') ? "•••••••••••••••• (Leave blank to use Keter Cloud, or paste Gemini key to override)" : "Enter Gemini API Key (AIzaSy...)"}
                        value={localConfig.apiKeys?.gemini || ''}
                        onChange={(e) => handleKeyChange('gemini', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey('gemini')}
                        style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title={showKeys.gemini ? 'Hide key' : 'Show key'}
                      >
                        {showKeys.gemini ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Pre-configured by Keter. Inspects screen pixels (Alt+S) to solve LeetCode/MCQs.</span>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                        Google AI Studio
                      </a>
                    </div>
                  </div>
                </div>

                {/* SUBSECTION 2: Unlock Additional Engines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Unlock size={13} color="#94a3b8" />
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Unlock Additional Engines (Optional)
                    </span>
                  </div>

                  {/* OpenAI Key */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        🧠 OpenAI API Key (Unlocks GPT-4o-mini in dropdown above)
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isUsingCustomKey('openai', localConfig.apiKeys) ? (
                          <>
                            <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                              🔵 Unlocked & Active
                            </span>
                            <button
                              type="button"
                              onClick={() => handleKeyChange('openai', '')}
                              style={{ fontSize: '10px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Clear OpenAI key"
                            >
                              <RotateCcw size={10} /> Clear Key
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '10px', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                            ⚪ Enter Key to Unlock
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showKeys.openai ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingRight: '36px' }}
                        placeholder="Paste OpenAI API Key (sk-...) to unlock..."
                        value={localConfig.apiKeys?.openai || ''}
                        onChange={(e) => handleKeyChange('openai', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey('openai')}
                        style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title={showKeys.openai ? 'Hide key' : 'Show key'}
                      >
                        {showKeys.openai ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Optional. Entering a key automatically unlocks OpenAI in the LLM Provider dropdown above.</span>
                      <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                        Get OpenAI Key
                      </a>
                    </div>
                  </div>

                  {/* Deepgram Key */}
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        🎙️ Deepgram API Key (Unlocks Deepgram Nova-2 in dropdown above)
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isUsingCustomKey('deepgram', localConfig.apiKeys) ? (
                          <>
                            <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                              🔵 Unlocked & Active
                            </span>
                            <button
                              type="button"
                              onClick={() => handleKeyChange('deepgram', '')}
                              style={{ fontSize: '10px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Clear Deepgram key"
                            >
                              <RotateCcw size={10} /> Clear Key
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '10px', background: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                            ⚪ Enter Key to Unlock
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showKeys.deepgram ? 'text' : 'password'}
                        className="form-input"
                        style={{ paddingRight: '36px' }}
                        placeholder="Paste Deepgram API Key to unlock Nova-2..."
                        value={localConfig.apiKeys?.deepgram || ''}
                        onChange={(e) => handleKeyChange('deepgram', e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey('deepgram')}
                        style={{ position: 'absolute', right: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title={showKeys.deepgram ? 'Hide key' : 'Show key'}
                      >
                        {showKeys.deepgram ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Optional. Entering a key automatically unlocks Deepgram Nova-2 in the speech dropdown above.</span>
                      <a href="https://console.deepgram.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                        Get Deepgram Key
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: RESUME & CONTEXT */}
          {activeTab === 'context' && (
            <>
              <div>
                <label className="form-label">Candidate Resume / CV Summary</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  placeholder="Paste your resume summary, previous companies, key technical achievements, and metrics..."
                  value={localConfig.resumeContext || ''}
                  onChange={(e) => handleChange('resumeContext', e.target.value)}
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  The AI uses this to tailor STAR responses directly to your real achievements.
                </p>
              </div>

              <div>
                <label className="form-label">Target Job Description / Meeting Agenda</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Paste the target job description, key responsibilities, or specific meeting agenda topics..."
                  value={localConfig.jobDescription || ''}
                  onChange={(e) => handleChange('jobDescription', e.target.value)}
                />
              </div>
            </>
          )}

          {/* TAB 3: STEALTH & DISPLAY */}
          {activeTab === 'hud' && (
            <>
              {/* Screen Protection / Hardware Invisibility Toggle (Default: ON) */}
              <div
                style={{
                  background: localConfig.screenProtection !== false ? 'rgba(52, 211, 153, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: localConfig.screenProtection !== false ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Shield size={16} color={localConfig.screenProtection !== false ? '#34d399' : '#f87171'} />
                    <strong style={{ fontSize: '13px', color: localConfig.screenProtection !== false ? '#34d399' : '#f87171' }}>
                      {localConfig.screenProtection !== false ? 'Screen-Share Invisibility (Active)' : 'Screen-Share Invisibility (Disabled)'}
                    </strong>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: localConfig.screenProtection !== false ? 'rgba(52, 211, 153, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: localConfig.screenProtection !== false ? '#4ade80' : '#f87171',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {localConfig.screenProtection !== false ? 'DEFAULT ON' : 'OFF'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.45 }}>
                    Keter is completely invisible when sharing your screen on Zoom, Google Meet, and Microsoft Teams. Meeting apps see only your clean desktop, browser, and code editor.
                  </p>
                </div>

                <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <input
                    type="checkbox"
                    checked={localConfig.screenProtection !== false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleChange('screenProtection', checked);
                      if (window.electronAPI?.setContentProtection) {
                        window.electronAPI.setContentProtection(checked).catch(() => {});
                      }
                    }}
                    style={{ width: '20px', height: '20px', accentColor: '#34d399', cursor: 'pointer' }}
                  />
                </label>
              </div>

              <div>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>HUD Opacity (Down to 0% Ghost)</span>
                  <span style={{ color: '#38bdf8' }}>{Math.round((localConfig.opacity !== undefined ? localConfig.opacity : 0.95) * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  style={{ width: '100%', accentColor: '#38bdf8' }}
                  value={localConfig.opacity !== undefined ? localConfig.opacity : 0.95}
                  onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>Ghost Float Mode</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Strips dark overlay box completely, showing only floating text</div>
                </div>
                <input
                  type="checkbox"
                  checked={!!localConfig.ghostMode}
                  onChange={(e) => handleChange('ghostMode', e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#38bdf8', cursor: 'pointer' }}
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Global Keyboard Shortcuts</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>One-Touch Screen Auto-Read & Solve:</span>
                    <kbd style={{ background: 'rgba(236,72,153,0.25)', padding: '2px 6px', borderRadius: '4px', color: '#f472b6', fontWeight: 600 }}>Alt + S</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Auto-Camouflage Clean Screenshot:</span>
                    <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#e2e8f0' }}>F9 / Ctrl + Alt + S</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Toggle Show / Hide Overlay:</span>
                    <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#e2e8f0' }}>Ctrl + Shift + H</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Toggle Click-Through Lock:</span>
                    <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#e2e8f0' }}>Ctrl + Shift + T</kbd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Emergency Panic Kill (Instant Hide):</span>
                    <kbd style={{ background: 'rgba(239,68,68,0.2)', padding: '2px 6px', borderRadius: '4px', color: '#f87171' }}>Ctrl + Shift + X</kbd>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(10, 14, 22, 0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to close and exit Keter completely?')) {
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
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              title="Close and exit Keter application"
            >
              <LogOut size={13} /> Exit App
            </button>

            {onStartTour && (
              <button
                type="button"
                onClick={onStartTour}
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
                title="Start interactive tour explaining all features"
              >
                <Compass size={13} /> Interactive Tour
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <Mail size={13} color="#38bdf8" />
            <span>Support:</span>
            <a
              href="mailto:keterai26@gmail.com?subject=Keter%20AI%20Settings%20Help"
              style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}
            >
              keterai26@gmail.com
            </a>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--accent-gradient)',
              color: '#0a0d14',
              border: 'none',
              padding: '6px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle size={15} /> Save & Return
          </button>
        </div>
      </div>
    </div>
  );
}
