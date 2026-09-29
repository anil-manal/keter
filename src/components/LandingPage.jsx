import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  Sparkles,
  Mail,
  Copy,
  Check,
  Eye,
  Sliders,
  Radio,
} from 'lucide-react';
import './LandingPage.css';

const SCENARIOS = {
  system_design: {
    title: 'System Design',
    question: 'How would you design a distributed Rate Limiter for an API gateway handling 100,000 requests per second with sub-5ms latency?',
    solution: `[1. Key Scale & Latency Requirements]:
• 100k requests/sec evaluation budget strictly under 5ms
• Multi-region consistency without single point of failure

[2. Core Architectural Strategy]:
"I recommend a Redis-backed Sliding Window Counter with local memory token batching at Envoy. Instead of reaching out to Redis on every single request, the API gateway batches local consumption and syncs every 20ms using Lua scripts to prevent distributed race conditions."

[3. High Availability Fallback]:
• If Redis cluster encounters partition latency > 5ms, fallback to local in-memory Leaky Bucket to guarantee zero outage for legitimate traffic."`,
  },
  technical: {
    title: 'Coding (DSA)',
    question: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Can you do it in O(N)?',
    solution: `[Approach: One-Pass Hash Map]
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
  star: {
    title: 'STAR Behavioral',
    question: 'Tell me about a time you had a high-stakes disagreement with a senior engineer or architect regarding technical direction.',
    solution: `[Situation]:
At my previous company, we were migrating our core monolithic billing pipeline to microservices under a tight 3-month SOC2 compliance deadline.

[Task]:
The lead architect proposed a distributed 2-Phase Commit (2PC) architecture, which I was concerned would introduce cascading latency and distributed deadlocks during peak loads.

[Action]:
Instead of arguing opinions, I spun up a lightweight Locust benchmark comparing 2PC against an event-driven Saga pattern with idempotent Kafka consumers. I presented latency percentiles (p99 was 4x lower on Saga) and compensating transaction workflows in a calm, collaborative brown-bag session.

[Result]:
The team unanimously adopted the Saga pattern, saving an estimated 3 weeks of edge-case debugging and achieving zero data inconsistency incidents post-launch.`,
  },
  negotiation: {
    title: 'Salary Negotiation',
    question: 'What is your current compensation and what are your salary expectations for this Senior Engineer role?',
    solution: `[Tactical Guideline: Deflect without refusing]

[Verbatim Script to Say]:
"Thanks for asking! Right now, my primary priority is finding the right technical and cultural fit where I can drive high-impact outcomes for the team.

Once we both agree that I'm the right engineer for this role, I'm confident we can agree on a compensation package that reflects both the current market rate for senior engineering in your band and the value I'll be contributing.

Could you share the budgeted salary band and equity range for this position?"`,
  },
};

const FAQ_ITEMS = [
  {
    q: 'Will Zoom, Microsoft Teams, or Google Meet detect Keter on my screen?',
    a: 'No. Keter uses our Proprietary Stealth Shield. When you share your entire desktop or any application window on Zoom, Teams, or Meet, Keter is 100% invisible in the shared feed. The interviewer only sees your clean desktop or code editor.',
  },
  {
    q: 'Does Keter show in the Windows Taskbar or Task Manager as an AI app?',
    a: 'No. Keter runs without taskbar icons or Alt+Tab entries. In Task Manager, it runs as an ordinary background system process with zero AI branding for total candidate discretion.',
  },
  {
    q: 'How does Mobile Screen Mirroring and the Teleprompter work without servers?',
    a: 'Keter uses zero-configuration peer-to-peer (P2P) WebRTC over your local Wi-Fi. Scanning the QR code pairs your phone camera directly to your PC. Teleprompter solutions flow directly phone-to-PC with 0ms server latency and zero external video storage.',
  },
  {
    q: 'When does the 24-hour pass validity timer start?',
    a: 'The 24-hour timer starts ONLY when you click "Activate Session" before your interview. Passes remain valid indefinitely until you activate them, allowing you to prepare weeks in advance.',
  },
  {
    q: 'Can interview platforms detect that audio is being transcribed?',
    a: 'No. Keter captures system audio directly from your audio loopback driver. It never joins the meeting as a bot or plugin, so neither Zoom nor your interviewer has any awareness.',
  },
  {
    q: 'What is the Panic Kill-Switch?',
    a: 'Press Escape or Ctrl+Shift+X at any time to instantly terminate all overlays and clear your screen in less than 50 milliseconds.',
  },
];

export function LandingPage() {
  const [activeScenario, setActiveScenario] = useState('system_design');
  const [streamedText, setStreamedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStealthToggled, setIsStealthToggled] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Before/After Slider State
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderRef = useRef(null);

  const scenarioData = SCENARIOS[activeScenario];

  // Token streaming animation when scenario changes
  useEffect(() => {
    setIsTyping(true);
    setStreamedText('');
    const fullText = scenarioData.solution;
    let idx = 0;

    const interval = setInterval(() => {
      idx += 12;
      if (idx >= fullText.length) {
        setStreamedText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setStreamedText(fullText.substring(0, idx));
      }
    }, 15);

    return () => clearInterval(interval);
  }, [activeScenario]);

  // Handle Dragging Slider
  const handleSliderMove = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  };

  useEffect(() => {
    const onMove = (e) => {
      if (isDraggingSlider) handleSliderMove(e.clientX || (e.touches && e.touches[0].clientX));
    };
    const onUp = () => setIsDraggingSlider(false);

    if (isDraggingSlider) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDraggingSlider]);

  const handleCopy = () => {
    navigator.clipboard.writeText(streamedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDownload = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const downloadUrl = import.meta.env.VITE_DOWNLOAD_URL || 'https://github.com/anil-manal/keter/releases/download/v1.0.0/Keter.exe';
    window.location.href = downloadUrl;
  };

  return (
    <div className="granola-landing">
      {/* Ambient Grid Lines */}
      <div className="granola-ambient-grid" />

      {/* Minimal Floating Navigation */}
      <nav className="granola-nav">
        <div
          role="button"
          tabIndex={0}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="nav-left-brand"
        >
          <div className="brand-icon-shield">
            <Shield size={16} strokeWidth={2.4} />
          </div>
          <span className="brand-text-name">KETER</span>
          <span className="brand-stealth-badge">PROPRIETARY STEALTH</span>
        </div>

        <div className="nav-center-menu">
          <button type="button" onClick={() => scrollTo('prompter-dock')} className="nav-menu-btn">
            Live Prompter
          </button>
          <button type="button" onClick={() => scrollTo('principles')} className="nav-menu-btn">
            Architecture
          </button>
          <button type="button" onClick={() => scrollTo('screen-proof')} className="nav-menu-btn">
            Screen Proof
          </button>
          <button type="button" onClick={() => scrollTo('pricing')} className="nav-menu-btn">
            Pricing
          </button>
          <button type="button" onClick={() => scrollTo('faq')} className="nav-menu-btn">
            FAQ
          </button>
        </div>

        <div>
          <button type="button" onClick={handleDownload} className="btn-nav-download">
            <Download size={13} /> Download for Windows (.exe)
          </button>
        </div>
      </nav>

      {/* Editorial Hero Section */}
      <header className="granola-hero">
        <div className="hero-pill-stealth">
          <span className="stealth-status-dot" />
          <span>Proprietary Stealth Shield • 100% Invisible on Screen Shares</span>
        </div>

        <h1 className="hero-editorial-headline">
          Pass Any Technical Interview. <br />
          <span className="accent-italic">Undetected in Real Time.</span>
        </h1>

        <p className="hero-editorial-sub">
          The stealth interview copilot for engineers. Instant speech loopback transcription, bulleted STAR & DSA teleprompter answers, and hardware-grade invisibility on Zoom, Teams, and Meet.
        </p>

        <div className="hero-cta-row">
          <button type="button" onClick={handleDownload} className="btn-primary-black">
            <Download size={16} />
            <span>Download Keter (.exe)</span>
          </button>

          <button type="button" onClick={() => scrollTo('screen-proof')} className="btn-secondary-white">
            <Eye size={15} color="#0284c7" />
            <span>View Screen Share Invisibility Proof</span>
          </button>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#71717a' }}>
          Single Standalone Executable • 100% Zero-Install • Never registers in Control Panel or Add/Remove Programs
        </div>

        <div className="hero-specs-row">
          <div className="hero-spec-item">
            <CheckCircle size={14} color="#10b981" /> 100% Invisible on Screen Shares
          </div>
          <div className="hero-spec-item">
            <CheckCircle size={14} color="#10b981" /> Direct Sound Loopback (0ms Echo)
          </div>
          <div className="hero-spec-item">
            <CheckCircle size={14} color="#10b981" /> 1st Interview Session Free
          </div>
        </div>

        {/* ============================================================
           EXPANDING FLOATING HUD DOCK (REWIND / GRANOLA SIGNATURE)
           ============================================================ */}
        <div id="prompter-dock" className="floating-hud-wrapper">
          <div className="floating-hud-card">
            {/* Dock Control Bar */}
            <div className="floating-dock-bar">
              <div className="dock-left-group">
                <div className="audio-pulse-indicator">
                  <div className="pulse-bar" />
                  <div className="pulse-bar" />
                  <div className="pulse-bar" />
                  <div className="pulse-bar" />
                  <div className="pulse-bar" />
                </div>
                <span className="dock-brand-label">Keter Stealth HUD</span>
                <span className="dock-status-tag">● LISTENING LIVE</span>
              </div>

              {/* Scenario Switcher Tabs */}
              <div className="dock-center-tabs">
                {Object.keys(SCENARIOS).map((key) => {
                  const item = SCENARIOS[key];
                  const isActive = activeScenario === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveScenario(key)}
                      className={`dock-tab ${isActive ? 'active' : ''}`}
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>

              {/* Toggle View */}
              <div className="dock-right-actions">
                <button
                  type="button"
                  onClick={() => setIsStealthToggled(!isStealthToggled)}
                  className={`btn-dock-stealth-toggle ${isStealthToggled ? 'stealth-active' : ''}`}
                >
                  <EyeOff size={12} />
                  <span>{isStealthToggled ? 'Zoom Stream: Clean' : 'Toggle Stealth View'}</span>
                </button>
              </div>
            </div>

            {/* If stealth toggled on: show what Zoom records */}
            {isStealthToggled ? (
              <div style={{ padding: '40px 24px', textAlign: 'center', background: '#ffffff', color: '#52525b' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Shield size={20} />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#09090b' }}>
                  Zoom & Screen-Share Video Feed
                </h4>
                <p style={{ margin: '0 auto', fontSize: '13px', maxWidth: '440px', lineHeight: 1.5 }}>
                  The Keter floating prompter is <strong>completely stripped from your shared screen</strong> by our Proprietary Stealth Shield. Only your clean desktop or code editor is broadcast.
                </p>
                <button
                  type="button"
                  onClick={() => setIsStealthToggled(false)}
                  style={{ marginTop: '16px', background: '#09090b', color: '#ffffff', border: 'none', padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Return to Candidate Prompter View
                </button>
              </div>
            ) : (
              <>
                {/* Interviewer Question Box */}
                <div className="prompter-question-box">
                  <div className="question-meta-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Volume2 size={12} color="#0284c7" />
                      <span>Transcribed Voice Input (0ms Loopback)</span>
                    </div>
                    <span style={{ color: '#059669' }}>● Active Loop</span>
                  </div>
                  <p className="question-text-content">
                    "{scenarioData.question}"
                  </p>
                </div>

                {/* Teleprompter Solution Stream */}
                <div className="prompter-body-stream">
                  <div className="prompter-top-meta">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#0284c7' }}>
                      <Sparkles size={13} />
                      <span>Real-Time Teleprompter & Response Strategy</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#71717a' }}>Latency: <strong>210ms</strong></span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e4e4e7',
                          borderRadius: '5px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: copied ? '#059669' : '#09090b',
                          fontWeight: 600,
                        }}
                      >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <pre className="prompter-stream-text">
                    {streamedText}
                    {isTyping && <span className="prompter-blinking-cursor">█</span>}
                  </pre>
                </div>

                {/* Prompter Bottom Ribbon */}
                <div className="prompter-bottom-ribbon">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 600 }}>
                    <Lock size={12} />
                    <span>Proprietary Stealth Shield: 100% Invisible to Zoom & Teams</span>
                  </div>
                  <div>
                    Instant Hotkey: <strong style={{ color: '#09090b' }}>Alt+S Screen Capture</strong> • <strong style={{ color: '#09090b' }}>Esc Panic Hide</strong>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================
         THREE UNCOMPROMISING PRINCIPLES (GRANOLA MINIMALISM)
         ============================================================ */}
      <section id="principles" className="section-block">
        <div className="section-editorial-head">
          <div className="section-tag-label">Architectural Principles</div>
          <h2 className="section-headline">Engineered for Absolute Discretion</h2>
          <p className="section-lead-text">
            No meeting bots joining your call, no laggy cloud relays, and zero risk of proctor detection.
          </p>
        </div>

        <div className="principles-grid">
          <div className="principle-card">
            <div className="principle-icon-box">
              <Shield size={18} />
            </div>
            <h3 className="principle-title">Proprietary Stealth Shield</h3>
            <p className="principle-desc">
              When you share your desktop on Zoom, Microsoft Teams, or Google Meet, Keter is 100% stripped from the shared video capture stream. Your interviewer sees only your clean workspace.
            </p>
          </div>

          <div className="principle-card">
            <div className="principle-icon-box">
              <Volume2 size={18} />
            </div>
            <h3 className="principle-title">Direct Audio Loopback</h3>
            <p className="principle-desc">
              Captures interviewer speech cleanly from your system audio driver without requiring open microphones or external plugins. Zero acoustic echo, 0ms latency.
            </p>
          </div>

          <div className="principle-card">
            <div className="principle-icon-box">
              <Smartphone size={18} />
            </div>
            <h3 className="principle-title">Air-Gapped Teleprompter</h3>
            <p className="principle-desc">
              Scan a QR code from any phone. Mount your smartphone directly beneath your webcam for 100% natural eye contact with zero application installs required.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
         SCREEN-SHARE BEFORE & AFTER INTERACTIVE SLIDER
         ============================================================ */}
      <section id="screen-proof" className="section-block">
        <div className="section-editorial-head">
          <div className="section-tag-label">Visual Verification</div>
          <h2 className="section-headline">Zoom Shared Stream vs. Candidate Screen</h2>
          <p className="section-lead-text">
            Drag the handle horizontally to verify how the Proprietary Stealth Shield excludes Keter from shared screen feeds.
          </p>
        </div>

        <div className="stealth-visualizer-box">
          <div className="stealth-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#09090b' }}>
              <Sliders size={13} color="#0284c7" />
              <span>Interactive Split Screen Comparison</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setSliderPos(100)}
                style={{ background: sliderPos >= 90 ? '#09090b' : '#ffffff', color: sliderPos >= 90 ? '#ffffff' : '#09090b', border: '1px solid #e4e4e7', padding: '4px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                Interviewer View (Zoom)
              </button>
              <button
                type="button"
                onClick={() => setSliderPos(50)}
                style={{ background: sliderPos > 20 && sliderPos < 80 ? '#09090b' : '#ffffff', color: sliderPos > 20 && sliderPos < 80 ? '#ffffff' : '#09090b', border: '1px solid #e4e4e7', padding: '4px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                50 / 50 Split
              </button>
              <button
                type="button"
                onClick={() => setSliderPos(0)}
                style={{ background: sliderPos <= 10 ? '#09090b' : '#ffffff', color: sliderPos <= 10 ? '#ffffff' : '#09090b', border: '1px solid #e4e4e7', padding: '4px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
              >
                Candidate View (HUD)
              </button>
            </div>
          </div>

          <div
            ref={sliderRef}
            className="split-canvas-area"
            onMouseDown={(e) => {
              setIsDraggingSlider(true);
              handleSliderMove(e.clientX);
            }}
            onTouchStart={(e) => {
              setIsDraggingSlider(true);
              if (e.touches[0]) handleSliderMove(e.touches[0].clientX);
            }}
          >
            {/* LAYER 1: CANDIDATE MONITOR (With Floating Keter HUD) */}
            <div className="split-layer-candidate">
              <div style={{ padding: '8px 16px', background: '#f4f4f5', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>WHAT YOU SEE (CANDIDATE VIEW)</span>
                <span style={{ color: '#71717a' }}>Webcam-Level Floating Prompter Active</span>
              </div>

              <div style={{ flex: 1, display: 'flex', position: 'relative', background: '#ffffff' }}>
                <div style={{ width: '130px', background: '#fafafa', borderRight: '1px solid #e4e4e7', padding: '12px 10px', fontFamily: 'monospace', fontSize: '11px', color: '#71717a' }}>
                  <div style={{ color: '#09090b', fontWeight: 700 }}>WORKSPACE</div>
                  <div style={{ color: '#0284c7', fontWeight: 600 }}>▶ solution.py</div>
                  <div>test_suite.py</div>
                </div>

                <div style={{ flex: 1, padding: '16px 20px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65, color: '#18181b' }}>
                  <div><span style={{ color: '#d946ef', fontWeight: 600 }}>class</span> <span style={{ color: '#2563eb', fontWeight: 600 }}>InterviewSolution</span>:</div>
                  <div style={{ paddingLeft: '16px' }}><span style={{ color: '#d946ef' }}>def</span> <span style={{ color: '#7c3aed' }}>solveRateLimiter</span>(self, request_stream):</div>
                  <div style={{ paddingLeft: '32px' }}>sliding_window = SlidingWindowCounter()</div>
                  <div style={{ paddingLeft: '32px' }}><span style={{ color: '#d946ef' }}>for</span> req <span style={{ color: '#d946ef' }}>in</span> request_stream:</div>
                  <div style={{ paddingLeft: '48px' }}>passed = sliding_window.evaluate(req.user_id)</div>
                  <div style={{ paddingLeft: '48px' }}><span style={{ color: '#d946ef' }}>if</span> <span style={{ color: '#d946ef' }}>not</span> passed:</div>
                  <div style={{ paddingLeft: '64px' }}><span style={{ color: '#d946ef' }}>return</span> HttpStatus.TOO_MANY_REQUESTS</div>
                </div>

                {/* FLOATING KETER HUD */}
                <div style={{ position: 'absolute', top: '20px', right: '24px', width: '460px', background: '#ffffff', border: '1.5px solid #09090b', borderRadius: '10px', boxShadow: '0 16px 36px -8px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ background: '#09090b', color: '#ffffff', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={12} color="#38bdf8" />
                      <span>KETER STEALTH COPILOT</span>
                    </div>
                    <span style={{ color: '#4ade80', fontSize: '9px', fontWeight: 800 }}>● STEALTH SHIELD ACTIVE</span>
                  </div>

                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#09090b', background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '6px', padding: '8px 10px' }}>
                      <span style={{ fontSize: '10px', color: '#71717a', display: 'block', textTransform: 'uppercase' }}>
                        Audio Loopback Input:
                      </span>
                      "How would you design a distributed Rate Limiter for 100k req/sec?"
                    </div>

                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#18181b', lineHeight: 1.5, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px' }}>
                      <div style={{ color: '#059669', fontWeight: 700, marginBottom: '2px' }}>
                        [Optimal Strategy Teleprompter]
                      </div>
                      <div>• Algorithm: Redis-backed Sliding Window Counter</div>
                      <div>• Say: "I recommend local memory token batching at Envoy..."</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LAYER 2: INTERVIEWER / ZOOM VIEW (Clipped by slider position) */}
            <div
              className="split-layer-interviewer"
              style={{ width: `${sliderPos}%` }}
            >
              <div style={{ padding: '8px 16px', background: '#f4f4f5', borderBottom: '1px solid #e4e4e7', display: 'flex', justifyContent: 'space-between', fontSize: '11px', width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : '100%' }}>
                <span style={{ fontWeight: 700, color: '#059669' }}>WHAT INTERVIEWER SEES (ZOOM SCREEN SHARE)</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>100% Clean Recording • 0 Overlays</span>
              </div>

              <div style={{ flex: 1, display: 'flex', position: 'relative', background: '#ffffff', width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : '100%' }}>
                <div style={{ width: '130px', background: '#fafafa', borderRight: '1px solid #e4e4e7', padding: '12px 10px', fontFamily: 'monospace', fontSize: '11px', color: '#71717a' }}>
                  <div style={{ color: '#09090b', fontWeight: 700 }}>WORKSPACE</div>
                  <div style={{ color: '#0284c7', fontWeight: 600 }}>▶ solution.py</div>
                  <div>test_suite.py</div>
                </div>

                <div style={{ flex: 1, padding: '16px 20px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65, color: '#18181b' }}>
                  <div><span style={{ color: '#d946ef', fontWeight: 600 }}>class</span> <span style={{ color: '#2563eb', fontWeight: 600 }}>InterviewSolution</span>:</div>
                  <div style={{ paddingLeft: '16px' }}><span style={{ color: '#d946ef' }}>def</span> <span style={{ color: '#7c3aed' }}>solveRateLimiter</span>(self, request_stream):</div>
                  <div style={{ paddingLeft: '32px' }}>sliding_window = SlidingWindowCounter()</div>
                  <div style={{ paddingLeft: '32px' }}><span style={{ color: '#d946ef' }}>for</span> req <span style={{ color: '#d946ef' }}>in</span> request_stream:</div>
                  <div style={{ paddingLeft: '48px' }}>passed = sliding_window.evaluate(req.user_id)</div>
                  <div style={{ paddingLeft: '48px' }}><span style={{ color: '#d946ef' }}>if</span> <span style={{ color: '#d946ef' }}>not</span> passed:</div>
                  <div style={{ paddingLeft: '64px' }}><span style={{ color: '#d946ef' }}>return</span> HttpStatus.TOO_MANY_REQUESTS</div>
                </div>
                {/* No Keter HUD is visible in this layer */}
              </div>
            </div>

            {/* Slider Drag Handle */}
            <div
              className="slider-drag-handle"
              style={{ left: `${sliderPos}%` }}
              onMouseDown={() => setIsDraggingSlider(true)}
              onTouchStart={() => setIsDraggingSlider(true)}
            >
              <div className="handle-pill">
                ↔
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
         PRICING SECTION
         ============================================================ */}
      <section id="pricing" className="section-block">
        <div className="section-editorial-head">
          <div className="section-tag-label">Fair & Transparent</div>
          <h2 className="section-headline">Zero Monthly Subscription Traps</h2>
          <p className="section-lead-text">
            Never pay $80/month when you aren't interviewing. Test your first session completely free, then unlock 24-hour interview passes for ₹99.
          </p>
        </div>

        <div className="pricing-dual-grid">
          {/* Trial Pass */}
          <div className="pricing-minimal-card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#71717a' }}>Trial Pass</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                  NO CREDIT CARD
                </span>
              </div>
              <div className="pricing-rate-amount">
                ₹0 <span style={{ fontSize: '13px', fontWeight: 500, color: '#71717a' }}>/ 1st project</span>
              </div>
              <p style={{ fontSize: '13px', color: '#52525b', lineHeight: 1.5, margin: '8px 0 0' }}>
                Complete trial. Test your audio loopback, connect your phone prompter, and complete your initial round.
              </p>

              <ul className="pricing-feature-bullets">
                <li><CheckCircle size={14} color="#10b981" /> 1 Full 24-Hour Interview Project</li>
                <li><CheckCircle size={14} color="#10b981" /> STAR, Technical & System Design Modes</li>
                <li><CheckCircle size={14} color="#10b981" /> Instant Screen Question Capture (Alt+S)</li>
                <li><CheckCircle size={14} color="#10b981" /> 100% Invisible on Zoom / Teams / Meet</li>
              </ul>
            </div>

            <button type="button" onClick={handleDownload} className="btn-secondary-white" style={{ justifyContent: 'center', width: '100%' }}>
              <Download size={14} /> Download & Start Free
            </button>
          </div>

          {/* Paid Pass */}
          <div className="pricing-minimal-card featured">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#09090b' }}>24h Interview Pass</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', background: '#09090b', padding: '2px 8px', borderRadius: '4px' }}>
                  PAY-AS-YOU-INTERVIEW
                </span>
              </div>
              <div className="pricing-rate-amount">
                ₹99 <span style={{ fontSize: '13px', fontWeight: 500, color: '#71717a' }}>/ 24h pass</span>
              </div>
              <p style={{ fontSize: '13px', color: '#52525b', lineHeight: 1.5, margin: '8px 0 0' }}>
                Timer starts ONLY when you click Activate before your interview. Purchased passes never expire.
              </p>

              <ul className="pricing-feature-bullets">
                <li><CheckCircle size={14} color="#09090b" /> 1 Dedicated 24h Project Session</li>
                <li><CheckCircle size={14} color="#09090b" /> Timer starts ONLY when activated</li>
                <li><CheckCircle size={14} color="#09090b" /> Unactivated passes never expire</li>
                <li><CheckCircle size={14} color="#09090b" /> Isolated JD Context & Resume Grounding</li>
                <li><CheckCircle size={14} color="#09090b" /> Instant Razorpay UPI (GPay, PhonePe, Paytm)</li>
              </ul>
            </div>

            <button type="button" onClick={handleDownload} className="btn-primary-black" style={{ justifyContent: 'center', width: '100%' }}>
              <Download size={14} /> Download for Windows
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
         FAQ SECTION
         ============================================================ */}
      <section id="faq" className="section-block">
        <div className="section-editorial-head">
          <div className="section-tag-label">FAQ</div>
          <h2 className="section-headline">Frequently Asked Questions</h2>
        </div>

        <div className="faq-minimal-accordion">
          {FAQ_ITEMS.map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="faq-minimal-item">
                <button
                  type="button"
                  className="faq-trigger-button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                >
                  <span>{item.q}</span>
                  {isExpanded ? <ChevronUp size={15} color="#09090b" /> : <ChevronDown size={15} color="#71717a" />}
                </button>
                {isExpanded && <div className="faq-content-pane">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
         FINAL CALL TO ACTION
         ============================================================ */}
      <section className="section-block">
        <div className="final-granola-cta">
          <h2 style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px' }}>
            Ace Your Next Round with Complete Discretion.
          </h2>
          <p style={{ fontSize: '15px', color: '#a1a1aa', maxWidth: '580px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Join software engineers and engineering leads using Keter to interview with absolute confidence.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                background: '#ffffff',
                color: '#09090b',
                padding: '13px 26px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Download size={16} />
              <span>Download Keter for Windows (.exe)</span>
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#71717a', marginTop: '16px' }}>
            Windows 10 / 11 (64-bit) • Single Executable • Never registers in Control Panel or Add/Remove Programs
          </div>
        </div>

        {/* Support Strip */}
        <div style={{ textAlign: 'center', marginTop: '24px', padding: '20px', background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#09090b' }}>
            Need Custom Assistance or Setup Support?
          </div>
          <div style={{ fontSize: '13px', color: '#52525b', marginTop: '4px' }}>
            Our engineering team is available 24/7 at{' '}
            <a href="mailto:keterai26@gmail.com" style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
              keterai26@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-granola-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#09090b" />
          <span style={{ color: '#09090b', fontWeight: 800 }}>KETER COPILOT</span>
          <span>— Stealth Real-Time Interview Intelligence</span>
        </div>

        <div style={{ maxWidth: '640px', fontSize: '11px', lineHeight: 1.5, color: '#71717a' }}>
          Disclaimer: Keter is an interview preparation, enablement, and real-time candidate assistance tool. Users are responsible for complying with the terms and conditions of their respective interview platforms.
        </div>

        <div>
          © 2026 Keter Copilot. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
