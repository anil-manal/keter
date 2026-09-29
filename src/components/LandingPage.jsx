import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  Zap,
  EyeOff,
  CheckCircle,
  Download,
  Play,
  Cpu,
  Lock,
  ChevronDown,
  ChevronUp,
  Volume2,
  Folder,
  Layers,
  ArrowRight,
  ExternalLink,
  Sliders,
  AlertTriangle,
  Sparkles,
  Mail,
  Monitor,
} from 'lucide-react';
import './LandingPage.css';

const SIMULATOR_PRESETS = {
  technical: {
    title: 'Technical / Coding (DSA)',
    question: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Can you do it in O(N)?',
    teleprompter: `[Approach: One-Pass Hash Map]
• Time Complexity: O(N) linear time
• Space Complexity: O(N) hash storage

[Verbatim Script for Interviewer]:
"To achieve linear O(N) time instead of the naive O(N²) nested loop, I will maintain a hash map where each key is the number we've seen and its value is the index.
For each element, we calculate complement = target - nums[i]. If complement is already in the map, we return [map[complement], i]. Otherwise, we record nums[i] in the map."

[Python 3 Implementation]:
def twoSum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []`,
  },
  system_design: {
    title: 'System Design',
    question: 'How would you design a scalable URL Shortening service like TinyURL with 100M new URLs per month and low latency?',
    teleprompter: `[1. Scale & Capacity Estimation]
• 100M writes/month ≈ 40 writes/sec (10:1 read/write ratio = 400 reads/sec)
• 5 years storage: 6 billion URLs ≈ 3TB total storage

[2. Core Architecture Strategy]:
• Hash vs Base62: Use 64-bit distributed Counter (Snowflake ID) converted to Base62 (62^7 ≈ 3.5 Trillion unique 7-char URLs).
• Zero collisions compared to MD5 hashing with truncated keys.

[3. High-Throughput Read Tier]:
• Multi-region Redis Cache with LRU eviction for top 20% hot links (80/20 rule).
• Cache hit ratio target > 85%, serving 301 Permanent Redirects in <12ms.

[4. Storage & Reliability]:
• NoSQL (Cassandra / DynamoDB) partitioned on hash_key with replication factor 3.`,
  },
  star: {
    title: 'STAR Behavioral',
    question: 'Tell me about a time you had a high-stakes disagreement with a senior engineer or architect regarding technical direction.',
    teleprompter: `[Situation]:
At my previous company, we were migrating our core monolithic billing pipeline to microservices under a tight 3-month SOC2 compliance deadline.

[Task]:
The lead architect proposed a distributed 2-Phase Commit (2PC) architecture, which I was concerned would introduce cascading latency and distributed deadlocks during peak loads.

[Action]:
Instead of arguing opinions, I spun up a lightweight Locust benchmark comparing 2PC against an event-driven Saga pattern with idempotent Kafka consumers. I presented latency percentiles (p99 was 4x lower on Saga) and compensating transaction workflows in a calm, collaborative brown-bag session.

[Result]:
The team unanimously adopted the Saga pattern, saving an estimated 3 weeks of edge-case debugging and achieving zero data inconsistency incidents post-launch.`,
  },
  negotiation: {
    title: 'Salary & Compensation',
    question: 'What is your current compensation and what are your salary expectations for this Senior Engineer role?',
    teleprompter: `[Tactical Guideline: Deflect without refusing]

[Verbatim Script to Say]:
"Thanks for asking! Right now, my primary priority is finding the right technical and cultural fit where I can drive high-impact outcomes for the team.

Once we both agree that I'm the right engineer for this role, I'm confident we can agree on a compensation package that reflects both the current market rate for senior engineering in your band and the value I'll be contributing.

Could you share the budgeted salary band and equity range for this position?"`,
  },
};

const FAQ_ITEMS = [
  {
    q: 'Will Zoom, Microsoft Teams, or Google Meet detect Keter on my screen?',
    a: 'No. Keter uses hardware-level screen invisibility. When you share your entire desktop or any application window on Zoom, Microsoft Teams, or Google Meet, Keter is completely invisible in the shared video feed. The interviewer only sees your clean desktop, browser, or code.',
  },
  {
    q: 'Does Keter show in the Windows Taskbar or Task Manager as an AI app?',
    a: 'No. Keter is designed for total candidate privacy. It never shows in your Windows taskbar or Alt+Tab application switcher, and runs under an ordinary system background process name with zero AI branding.',
  },
  {
    q: 'How does Mobile Screen Mirroring and the Teleprompter work without servers?',
    a: 'Keter uses zero-configuration peer-to-peer (P2P) WebRTC and local Wi-Fi. When you scan the QR code with your iPhone or Android camera, your phone securely mirrors your PC screen and streams live AI solutions in real-time. No video data ever touches a cloud video server ($0 server cost, 100% private), and zero app downloads are needed on your phone.',
  },
  {
    q: 'When does the 24-hour pass validity timer start?',
    a: 'The 24-hour countdown starts ONLY when you explicitly click "Activate Session" right before your interview starts. Purchased passes remain unactivated indefinitely until you choose to start your timer, allowing you to prepare JDs and resumes weeks in advance.',
  },
  {
    q: 'Can interview platforms detect that audio is being transcribed?',
    a: 'No. Keter listens cleanly to incoming audio directly through your computer speakers. It never joins your call as a bot, attendee, or meeting plugin, making it completely imperceptible to interviewers.',
  },
  {
    q: 'What is the Panic Kill-Switch?',
    a: 'If you ever need to close everything instantly, simply press the Escape key or Ctrl+Shift+X. Keter closes immediately and clears your screen in less than a blink of an eye.',
  },
];

export function LandingPage({ onOpenApp }) {
  const [activePreset, setActivePreset] = useState('technical');
  const [simText, setSimText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [simViewMode, setSimViewMode] = useState('laptop'); // 'laptop' | 'mobile'
  const [phoneViewMode, setPhoneViewMode] = useState('mirror'); // 'mirror' | 'prompter'

  const currentPresetData = SIMULATOR_PRESETS[activePreset];

  // Simulates real-time token streaming when preset changes
  useEffect(() => {
    setIsTyping(true);
    setSimText('');
    const fullText = currentPresetData.teleprompter;
    let idx = 0;

    const interval = setInterval(() => {
      idx += 8;
      if (idx >= fullText.length) {
        setSimText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setSimText(fullText.substring(0, idx));
      }
    }, 15);

    return () => clearInterval(interval);
  }, [activePreset]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownload = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const downloadUrl = import.meta.env.VITE_DOWNLOAD_URL || 'https://github.com/anil-manal/keter/releases/download/v1.0.0/Keter.exe';
    window.location.href = downloadUrl;
  };

  return (
    <div className="landing-container">
      {/* Background glow effects */}
      <div className="landing-bg-glow-1" />
      <div className="landing-bg-glow-2" />

      {/* Navigation */}
      <nav className="landing-nav">
        <div
          role="button"
          tabIndex={0}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="landing-logo"
          style={{ cursor: 'pointer' }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #00f2fe 0%, #7c3aed 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.4)',
            }}
          >
            <Shield size={18} color="#040d1a" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            KETER
          </span>
          <span className="logo-badge">STEALTH COPILOT</span>
        </div>

        <div className="landing-nav-links">
          <button type="button" onClick={() => scrollTo('simulator')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Live Simulator
          </button>
          <button type="button" onClick={() => scrollTo('stealth')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Stealth Matrix
          </button>
          <button type="button" onClick={() => scrollTo('features')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Features
          </button>
          <button type="button" onClick={() => scrollTo('pricing')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            Pricing (₹99)
          </button>
          <button type="button" onClick={() => scrollTo('faq')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
            FAQ
          </button>
          <button type="button" onClick={() => scrollTo('contact')} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            Contact
          </button>
        </div>

        <div className="landing-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={handleDownload} className="btn-primary-gradient">
            <Download size={14} /> Download for Windows
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="hero-pill">
          <Shield size={13} color="#38bdf8" />
          <span>100% Invisible on Screen Shares • Works with Zoom, Teams & Meet</span>
        </div>

        <h1 className="hero-title">
          Ace Every Technical & Behavioral Interview in{' '}
          <span className="hero-gradient-text">Real-Time.</span>
        </h1>

        <p className="hero-subtitle">
          The stealth AI interview copilot designed for engineers and leaders. Undetectable on screen shares, grounded in your actual resume, with instant speech loopback and an air-gapped phone teleprompter.
        </p>

        <div className="hero-ctas">
          <button type="button" onClick={handleDownload} className="btn-hero-download">
            <Download size={18} />
            <span>Download for Windows 10/11</span>
          </button>

          <button type="button" onClick={() => scrollTo('simulator')} className="btn-hero-secondary">
            <Play size={16} color="#38bdf8" />
            <span>Test Live Simulator</span>
          </button>
        </div>

        <div className="hero-badges-row">
          <div className="hero-badge-item">
            <EyeOff size={14} color="#38bdf8" /> Screen-Share Invisible
          </div>
          <div className="hero-badge-item">
            <Smartphone size={14} color="#c084fc" /> Air-Gapped Mobile Teleprompter
          </div>
          <div className="hero-badge-item">
            <Zap size={14} color="#fbbf24" /> Instant Real-Time Prompts
          </div>
          <div className="hero-badge-item">
            <CheckCircle size={14} color="#4ade80" /> 1st Project Free • Then ₹99 / 24h Pass
          </div>
        </div>

        {/* Interactive Dual-Device Product Showcase (Laptop + Mobile Teleprompter) */}
        <div className="hero-showcase-container">
          {/* Mode Switcher Tabs right above the devices */}
          <div className="hero-mode-pills">
            <span className="hero-mode-label">Live Copilot Telemetry:</span>
            {Object.keys(SIMULATOR_PRESETS).map((key) => {
              const item = SIMULATOR_PRESETS[key];
              const isActive = activePreset === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePreset(key)}
                  className={`hero-mode-btn ${isActive ? 'active' : ''}`}
                >
                  <span className={`hero-mode-dot ${isActive ? 'pulse' : ''}`} />
                  {item.title}
                </button>
              );
            })}
          </div>

          <div className="hero-devices-stage">
            {/* 1. Main Laptop Mockup */}
            <div className="laptop-mockup-wrapper">
              <div className="laptop-screen-frame">
                {/* Laptop Top Bezel with Camera */}
                <div className="laptop-camera-notch">
                  <div className="laptop-camera-lens" />
                  <div className="laptop-camera-led" title="Screen Share Active" />
                </div>

                {/* Laptop Display Content */}
                <div className="laptop-display-content">
                  {/* Top Bar: Simulated Video Call / Screen Share Header */}
                  <div className="call-header-bar">
                    <div className="call-dots">
                      <span className="dot red" />
                      <span className="dot yellow" />
                      <span className="dot green" />
                    </div>
                    <div className="call-title">
                      Zoom Meeting: Technical Assessment Loop • Senior Software Engineer
                    </div>
                    <div className="call-share-badge">
                      <span className="live-pulse" />
                      <span>LIVE SCREEN SHARE ACTIVE</span>
                    </div>
                  </div>

                  {/* Background: Candidate Code IDE (Behind the HUD) */}
                  <div className="laptop-underlying-ide">
                    <div className="ide-sidebar">
                      <div className="ide-file active">solution.py</div>
                      <div className="ide-file">test_cases.py</div>
                      <div className="ide-file">notes.md</div>
                    </div>
                    <div className="ide-code-area">
                      <div className="code-line"><span className="c-keyword">from</span> typing <span className="c-keyword">import</span> List, Optional, Dict</div>
                      <div className="code-line"><span className="c-comment"># Problem: {currentPresetData.question.substring(0, 55)}...</span></div>
                      <div className="code-line"><span className="c-keyword">class</span> <span className="c-class">InterviewSolution</span>:</div>
                      <div className="code-line indent-1"><span className="c-keyword">def</span> <span className="c-func">solveInterviewProblem</span>(self, input_data):</div>
                      <div className="code-line indent-2"><span className="c-comment"># Workspace shared with interviewer</span></div>
                      <div className="code-line indent-2">result = []</div>
                    </div>

                    {/* FLOATING KETER STEALTH HUD (EXCLUDED FROM ZOOM CAPTURE) */}
                    <div className="floating-keter-hud">
                      <div className="hud-window-header">
                        <div className="hud-logo-tag">
                          <Shield size={12} color="#00f2fe" />
                          <span className="hud-name">KETER INTELLIGENCE</span>
                          <span className="hud-pill">STEALTH HUD</span>
                        </div>
                        <div className="hud-audio-wave">
                          <span className="hud-wave-bar" />
                          <span className="hud-wave-bar" />
                          <span className="hud-wave-bar" />
                          <span className="hud-wave-bar" />
                          <span className="hud-wave-bar" />
                        </div>
                        <div className="hud-status-badge">
                          <span className="status-dot-glow" />
                          <span>LISTENING LIVE</span>
                        </div>
                      </div>

                      {/* Transcribed Question Box */}
                      <div className="hud-question-box">
                        <div className="hud-box-header">
                          <Volume2 size={12} color="#38bdf8" />
                          <span>Interviewer Question:</span>
                        </div>
                        <p className="hud-question-text">
                          "{currentPresetData.question}"
                        </p>
                      </div>

                      {/* Real-Time Answer Teleprompter */}
                      <div className="hud-teleprompter-box">
                        <div className="hud-box-header">
                          <Sparkles size={12} color="#c084fc" />
                          <span>Keter Real-Time Teleprompter & Response Strategy:</span>
                        </div>
                        <pre className="hud-code-stream">
                          {simText}
                          {isTyping && <span className="streaming-cursor">█</span>}
                        </pre>
                      </div>

                      {/* Bottom Stealth Shield Ribbon */}
                      <div className="hud-shield-ribbon">
                        <div className="shield-left">
                          <Lock size={12} color="#4ade80" />
                          <span>Stealth Protection Active • Hidden from Interviewer</span>
                        </div>
                        <div className="shield-right">
                          <span className="mode-indicator">{currentPresetData.title}</span>
                          <span style={{ color: '#64748b' }}>•</span>
                          <span style={{ color: '#38bdf8' }}>Instant Response</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="laptop-base-stand" />
            </div>

            {/* 2. Mobile Phone Teleprompter Mockup (Air-Gapped Companion) */}
            <div className="mobile-mockup-wrapper">
              <div className="mobile-device-chassis">
                <div className="mobile-dynamic-island">
                  <div className="island-camera" />
                </div>

                <div className="mobile-screen-content">
                  {/* Phone Status Bar */}
                  <div className="phone-status-row">
                    <span>9:41</span>
                    <span style={{ color: '#38bdf8' }}>📶 Encrypted Sync</span>
                    <span>98% 🔋</span>
                  </div>

                  {/* Companion Header */}
                  <div className="phone-hud-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Smartphone size={11} color="#38bdf8" />
                      <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#f8fafc' }}>KETER HUD</span>
                    </div>

                    <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setPhoneViewMode(phoneViewMode === 'mirror' ? 'prompter' : 'mirror')}
                        style={{
                          fontSize: '8px',
                          padding: '2px 5px',
                          borderRadius: '5px',
                          border: phoneViewMode === 'mirror' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.18)',
                          background: phoneViewMode === 'mirror' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.06)',
                          color: phoneViewMode === 'mirror' ? '#38bdf8' : '#94a3b8',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        {phoneViewMode === 'mirror' ? '🖥️ Mirror ON' : '🖥️ Mirror'}
                      </button>
                      <span className="phone-sync-pill" style={{ fontSize: '8px', padding: '2px 5px' }}>● LIVE</span>
                    </div>
                  </div>

                  {phoneViewMode === 'mirror' ? (
                    <>
                      {/* Live PC Screen Mirror Box (Top) */}
                      <div
                        style={{
                          margin: '6px 8px 4px 8px',
                          borderRadius: '7px',
                          background: '#040711',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          padding: '6px 8px',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '7.5px', fontWeight: 800, color: '#ffffff', background: '#ef4444', padding: '1px 5px', borderRadius: '4px', letterSpacing: '0.04em' }}>
                            ● LIVE P2P MIRROR
                          </span>
                          <span style={{ fontSize: '7.5px', color: '#64748b' }}>PC Desktop (0ms)</span>
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#a5f3fc', lineHeight: 1.3, maxHeight: '50px', overflow: 'hidden' }}>
                          {currentPresetData.question}
                        </div>
                      </div>

                      {/* AI Response Prompter (Bottom) */}
                      <div className="phone-teleprompter-body" style={{ flex: 1, margin: '2px 8px 6px 8px' }}>
                        <div className="phone-teleprompter-label">
                          <span style={{ fontSize: '8.5px' }}>AI Prompter (Split View)</span>
                          <span className="scroll-pill" style={{ fontSize: '7.5px' }}>Streaming</span>
                        </div>
                        <div className="phone-teleprompter-text" style={{ fontSize: '9px', lineHeight: 1.35, maxHeight: '115px' }}>
                          {simText}
                          {isTyping && <span className="streaming-cursor">█</span>}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Question Card */}
                      <div className="phone-question-pill">
                        <div className="phone-q-label">Interviewer Asks:</div>
                        <div className="phone-q-body">{currentPresetData.question}</div>
                      </div>

                      {/* Teleprompter Scroll Box */}
                      <div className="phone-teleprompter-body">
                        <div className="phone-teleprompter-label">
                          <span>Candidate Teleprompter</span>
                          <span className="scroll-pill">Auto-Scroll</span>
                        </div>
                        <div className="phone-teleprompter-text">
                          {simText}
                          {isTyping && <span className="streaming-cursor">█</span>}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Phone Bottom Control Bar */}
                  <div className="phone-bottom-bar">
                    Position phone under webcam for 100% natural eye contact
                  </div>
                </div>
              </div>

              {/* Realistic Aluminum Phone Stand Base */}
              <div className="mobile-stand-neck" />
              <div className="mobile-stand-base">
                <div className="stand-brand-label">AIR-GAPPED COMPANION STAND</div>
              </div>
            </div>
          </div>

          {/* Floating Feature Indicators below the showcase */}
          <div className="hero-indicators-bar">
            <div className="indicator-chip">
              <Shield size={14} color="#4ade80" />
              <span>100% Invisible on Screen Share (Zoom / Teams / Meet)</span>
            </div>
            <div className="indicator-chip">
              <Smartphone size={14} color="#38bdf8" />
              <span>Air-Gapped Mobile Teleprompter</span>
            </div>
            <div className="indicator-chip">
              <Cpu size={14} color="#c084fc" />
              <span>Instant Voice & Screen Question Capture</span>
            </div>
          </div>
        </div>
      </header>

      {/* Interactive Simulator Section */}
      <section id="simulator" className="simulator-section">
        <div className="section-header">
          <div className="section-tag">Interactive Sandbox</div>
          <h2 className="section-title">Experience Keter in Action</h2>
          <p className="section-subtitle">
            Select an interview question category below to see how Keter constructs real-time, bulleted STAR responses, algorithms, and system designs.
          </p>
        </div>

        <div className="simulator-window">
          {/* Top Bar with Mode Controls */}
          <div className="simulator-bar">
            <div className="simulator-modes">
              {Object.keys(SIMULATOR_PRESETS).map((key) => {
                const item = SIMULATOR_PRESETS[key];
                const isActive = activePreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActivePreset(key)}
                    className={`sim-mode-btn ${isActive ? 'active' : ''}`}
                  >
                    {item.title}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSimViewMode('laptop')}
                className={`sim-mode-btn ${simViewMode === 'laptop' ? 'active' : ''}`}
              >
                Laptop HUD
              </button>
              <button
                type="button"
                onClick={() => setSimViewMode('mobile')}
                className={`sim-mode-btn ${simViewMode === 'mobile' ? 'active' : ''}`}
              >
                <Smartphone size={12} /> Mobile HUD
              </button>
            </div>
          </div>

          {/* Simulator Content Area */}
          <div className="simulator-content">
            {/* Left Question List */}
            <div className="sim-questions-list">
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Interviewer Audio Input:
              </div>

              {Object.keys(SIMULATOR_PRESETS).map((key) => {
                const item = SIMULATOR_PRESETS[key];
                const isActive = activePreset === key;
                return (
                  <div
                    key={key}
                    onClick={() => setActivePreset(key)}
                    className={`sim-q-item ${isActive ? 'active' : ''}`}
                  >
                    <div style={{ fontSize: '11px', color: isActive ? '#38bdf8' : '#94a3b8', fontWeight: 600 }}>
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#f8fafc',
                        marginTop: '4px',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      "{item.question}"
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  marginTop: 'auto',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.05)',
                  border: '1px solid rgba(56, 189, 248, 0.15)',
                  fontSize: '11px',
                  color: '#94a3b8',
                }}
              >
                💡 In the desktop app, speech from your headphones is captured automatically via loopback audio with zero manual typing required.
              </div>
            </div>

            {/* Right Teleprompter Stream */}
            <div className="sim-display-area">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isTyping ? '#38bdf8' : '#34d399',
                      boxShadow: isTyping ? '0 0 10px #38bdf8' : '0 0 10px #34d399',
                    }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                    {isTyping ? 'Generating AI Teleprompter Stream...' : 'AI Solution Ready'}
                  </span>
                </div>

                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  Response Time: <strong>Instant (&lt;0.3s)</strong>
                </span>
              </div>

              <div className="sim-teleprompter-card">
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '8px' }}>
                  Q: {currentPresetData.question}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', flex: 1, overflowY: 'auto' }}>
                  {simText}
                  {isTyping && <span style={{ color: '#00f2fe', animation: 'blink 1s infinite' }}> ▋</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stealth Matrix Comparison Section */}
      <section id="stealth" className="stealth-matrix-section">
        <div className="section-header">
          <div className="section-tag">Total Anti-Detection</div>
          <h2 className="section-title">The Stealth Matrix</h2>
          <p className="section-subtitle">
            Keter is engineered specifically for remote interviews where screen sharing or proctoring is active.
          </p>
        </div>

        <div className="stealth-grid">
          {/* Interviewer View Card */}
          <div className="stealth-card interviewer">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EyeOff size={18} /> What the Interviewer Sees
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#f87171', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)' }}>
                ZOOM / TEAMS / MEET
              </span>
            </div>

            <div className="stealth-card-mockup">
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
                  Pristine Clean Desktop
                </div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>
                  Only your browser or code editor is visible. Keter’s window is completely invisible in your shared screen.
                </div>
              </div>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ Zero overlay or watermarks visible on shared screen
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ Completely hidden from Windows taskbar and application switcher
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ Runs as an ordinary background system process
              </li>
            </ul>
          </div>

          {/* Candidate View Card */}
          <div className="stealth-card candidate">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={18} /> What You See on Your Screen
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#4ade80', padding: '2px 8px', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)' }}>
                WEBCAM LEVEL HUD
              </span>
            </div>

            <div className="stealth-card-mockup" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
              <div style={{ width: '100%', textAlign: 'left', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8' }}>
                <div style={{ color: '#4ade80', fontWeight: 700 }}>[STAR Teleprompter Ready]</div>
                <div>• Situation: Migration of high-load cluster...</div>
                <div>• Action: Implemented event-driven Saga pattern...</div>
                <div style={{ color: '#fbbf24', marginTop: '4px' }}>Say: "To ensure reliability, we..."</div>
              </div>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#94a3b8' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ Transparent HUD placed near your camera for natural eye contact
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ Air-gapped companion teleprompter on your phone off-screen
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✓ Emergency Panic Kill-Switch (Hit Escape to close instantly)
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <div className="section-tag">Engineered for Technical Mastery</div>
          <h2 className="section-title">Everything Needed to Pass Any Round</h2>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Volume2 size={22} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Direct System Audio Capture
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              Transcribes interviewer speech cleanly from your system audio, eliminating background noise or room echo.
            </div>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Cpu size={22} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Instant Screen Capture
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              Press Alt+S to instantly capture complex coding questions, diagrams, or problem statements from any interview tab.
            </div>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Folder size={22} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Isolated Project Sessions
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              Each interview has its own dedicated JD, resume context, mode, and chat history. Never mix company contexts.
            </div>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Lock size={22} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              100% Client-Side Privacy
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              Zero audio is ever stored on external servers. All speech-to-text and AI prompt context remain strictly under your control.
            </div>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Monitor size={22} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Live P2P Screen Mirroring
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              Watch coding problems and IDE code live on your phone with zero server lag. Pure P2P streaming over local Wi-Fi and WebRTC.
            </div>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Smartphone size={22} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
              Air-Gapped Mobile Teleprompter
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
              Scan a QR code from any iPhone or Android phone. Mount phone under your webcam for 100% natural eye contact with zero app install.
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (1st Free, then ₹99 per Project) */}
      <section id="pricing" className="pricing-section">
        <div className="section-header">
          <div className="section-tag">Simple & Transparent Pricing</div>
          <h2 className="section-title">Zero Monthly Subscription Traps</h2>
          <p className="section-subtitle">
            Other tools charge $60–$100 every single month even when you aren't interviewing. Keter gives you your first interview session 100% free, then single 24-hour passes for just ₹99.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Free 1st Project Card */}
          <div className="pricing-card">
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399' }}>First Interview Project</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
                ₹0 <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ 1st project</span>
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', lineHeight: 1.5 }}>
                100% free trial. Test your audio loopback, connect your phone teleprompter, and ace your initial interview round.
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '20px 0' }} />

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                <li>✓ <strong>1 Full 24-Hour Interview Project</strong></li>
                <li>✓ <strong>No credit card or payment required</strong></li>
                <li>✓ STAR, Technical & System Design Modes</li>
                <li>✓ Instant Screen Question Capture (Alt+S)</li>
                <li>✓ Air-Gapped Mobile Phone Teleprompter</li>
                <li>✓ 100% Invisible on Zoom / Teams / Meet</li>
              </ul>
            </div>

            <button type="button" onClick={handleDownload} className="btn-ghost-cyan" style={{ justifyContent: 'center', width: '100%', marginTop: '24px' }}>
              <Download size={15} /> Download & Start Free
            </button>
          </div>

          {/* Featured ₹99 Session Pass */}
          <div className="pricing-card featured">
            <div className="pricing-card-badge">Most Popular • Pay-As-You-Interview</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>Additional Project Passes</div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
                ₹99 <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>/ 24h pass</span>
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px', lineHeight: 1.5 }}>
                Buy only when you have an interview scheduled. Timer starts only when you hit Activate.
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '20px 0' }} />

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#f8fafc' }}>
                <li>✓ <strong>1 Dedicated 24h Interview Session Pass</strong></li>
                <li>✓ <strong>Timer starts ONLY when activated</strong></li>
                <li>✓ <strong>Unactivated passes never expire</strong></li>
                <li>✓ Isolated JD Context & Resume Grounding</li>
                <li>✓ 100% Invisible on Screen Share (Zoom/Teams/Meet)</li>
                <li>✓ Unlimited Real-Time AI Generation</li>
                <li>✓ Instant Razorpay UPI (GPay, PhonePe, Paytm, Cards)</li>
              </ul>
            </div>

            <button type="button" onClick={handleDownload} className="btn-primary-gradient" style={{ justifyContent: 'center', width: '100%', marginTop: '24px' }}>
              <Download size={15} /> Download for Windows
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-header">
          <div className="section-tag">Got Questions?</div>
          <h2 className="section-title">Frequently Asked Questions</h2>
        </div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="faq-item">
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                >
                  <span>{item.q}</span>
                  {isExpanded ? <ChevronUp size={16} color="#38bdf8" /> : <ChevronDown size={16} color="#64748b" />}
                </button>
                {isExpanded && <div className="faq-answer">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Download CTA Banner */}
      <section id="download" className="cta-banner">
        <div className="cta-banner-inner">
          <h2 style={{ fontSize: '38px', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
            Your Dream Offer is One Interview Away.
          </h2>
          <p style={{ fontSize: '16px', color: '#cbd5e1', maxWidth: '640px', margin: '0 auto 28px' }}>
            Join thousands of software engineers, engineering managers, and product leads using Keter to interview with total confidence.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button type="button" onClick={handleDownload} className="btn-hero-download">
              <Download size={18} />
              <span>Download Keter for Windows (.exe)</span>
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '16px' }}>
            Windows 10 / 11 (64-bit) • Size: ~65 MB • Instant Stealth Setup
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{ padding: '60px 24px 40px', maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.5))',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '20px',
          padding: '36px 30px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(56, 189, 248, 0.08)'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '16px'
          }}>
            <Mail size={14} /> Official Support & Inquiries
          </div>
          <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: '0 0 10px' }}>
            Get in Touch With Our Team
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '580px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Have questions about Keter, need custom setup assistance for an upcoming interview, or have general business inquiries? Reach out anytime:
          </p>
          <a
            href="mailto:keterai26@gmail.com?subject=Keter%20AI%20Inquiry%20/%20Support"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '13px 28px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(56, 189, 248, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Mail size={18} />
            <span>keterai26@gmail.com</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#38bdf8" />
          <span style={{ color: '#f8fafc', fontWeight: 700 }}>KETER COPILOT</span>
          <span>— Stealth Real-Time Interview Intelligence</span>
        </div>

        <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
          Contact Support: <a href="mailto:keterai26@gmail.com" style={{ color: '#38bdf8', fontWeight: 600, textDecoration: 'none' }}>keterai26@gmail.com</a>
        </div>

        <div style={{ maxWidth: '680px', fontSize: '11px', lineHeight: 1.5 }}>
          Disclaimer: Keter is an interview preparation, enablement, and real-time candidate assistance tool. Users are responsible for complying with the terms and conditions of their respective interview platforms.
        </div>

        <div>
          © 2026 Keter Copilot. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
