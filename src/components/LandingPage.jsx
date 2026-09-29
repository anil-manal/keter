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
  Camera,
  Layers,
  Sliders,
  Terminal,
  RotateCcw,
  Radio,
  Scan,
} from 'lucide-react';
import './LandingPage.css';

const PRODUCT_STAGES = [
  {
    id: 'audio',
    num: '01',
    label: 'Loopback Audio',
    sub: '0ms System Driver',
  },
  {
    id: 'ocr',
    num: '02',
    label: 'Alt+S Vision OCR',
    sub: 'Screen Scanner',
  },
  {
    id: 'teleprompter',
    num: '03',
    label: 'AI Teleprompter',
    sub: 'Token Stream',
  },
  {
    id: 'stealth',
    num: '04',
    label: 'DWM Exclusion',
    sub: 'Zoom Invisible',
  },
];

const PRESET_DATA = {
  audio: {
    title: 'Distributed Rate Limiter (System Design)',
    question: 'How would you design a distributed Rate Limiter for an API gateway handling 100,000 requests per second with sub-5ms latency?',
    solution: `[1. Requirements & Performance Target]:
• 100k req/sec throughput with <5ms evaluation budget
• Multi-region consistency without single point of failure

[2. Algorithm Choice: Sliding Window Counter vs Token Bucket]:
"I recommend a Redis-backed Sliding Window Counter. Token Bucket allows burst spikes that can saturate downstream microservices. Sliding Window provides smooth, predictable rate limiting while remaining memory efficient."

[3. High-Throughput Edge Strategy]:
• Local in-memory batching at Envoy API gateway (flush counters every 50ms)
• Redis Cluster partitioned by user_id/IP hash key with Lua atomic scripts
• Local degraded fallback if Redis cluster network latency exceeds 5ms"`,
  },
  ocr: {
    title: 'LeetCode 42: Trapping Rain Water (Hard)',
    question: '[Alt+S Captured from Screen] Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    solution: `[Optimal Strategy: Two Pointers]
• Time Complexity: O(N) linear one-pass
• Space Complexity: O(1) constant auxiliary memory

[Verbatim Script for Interviewer]:
"Instead of computing the left and right max arrays with O(N) extra space, I will use a two-pointer approach starting from both ends.
We maintain left_max and right_max. If height[left] < height[right], water trapped at 'left' is strictly bounded by left_max. We accumulate water and increment left. Otherwise, we do the symmetric operation for right."

[Python 3 Implementation]:
def trap(height: list[int]) -> int:
    left, right = 0, len(height) - 1
    left_max, right_max = 0, 0
    trapped = 0
    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                trapped += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                trapped += right_max - height[right]
            right -= 1
    return trapped`,
  },
  teleprompter: {
    title: 'STAR Behavioral: High-Stakes Technical Disagreement',
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
  stealth: {
    title: 'Salary Negotiation & Offer Close',
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
    a: 'No. Keter uses native Windows Desktop Window Manager (DWM) display affinity exclusion. When you share your entire desktop or any individual window, Keter is stripped entirely from the video capture pipeline. The interviewer only sees your clean desktop or code editor.',
  },
  {
    q: 'Does Keter show in the Windows Taskbar or Task Manager as an AI app?',
    a: 'No. Keter runs without taskbar icons or Alt+Tab entries. In Task Manager, it runs as a standard background system host with zero AI branding for total candidate discretion.',
  },
  {
    q: 'How does Mobile Screen Mirroring and the Teleprompter work without servers?',
    a: 'Keter uses zero-configuration peer-to-peer (P2P) WebRTC over your local Wi-Fi. Scanning the QR code pairs your phone camera directly to your PC. Teleprompter solutions and screen streams flow directly phone-to-PC with 0ms server latency and zero external video storage.',
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
  const [activeStage, setActiveStage] = useState('audio');
  const [streamedText, setStreamedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPanicHidden, setIsPanicHidden] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Before/After Slider State
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderRef = useRef(null);

  const stageData = PRESET_DATA[activeStage];

  // Token streaming animation when stage changes
  useEffect(() => {
    setIsTyping(true);
    setStreamedText('');
    const fullText = stageData.solution;
    let idx = 0;

    const interval = setInterval(() => {
      idx += 14;
      if (idx >= fullText.length) {
        setStreamedText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setStreamedText(fullText.substring(0, idx));
      }
    }, 15);

    return () => clearInterval(interval);
  }, [activeStage]);

  // Trigger Alt+S scan animation
  const triggerScanAnimation = () => {
    setIsScanningOCR(true);
    setTimeout(() => {
      setIsScanningOCR(false);
    }, 2400);
  };

  // Keyboard shortcut listener on landing page
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsPanicHidden((prev) => !prev);
      }
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        setActiveStage('ocr');
        triggerScanAnimation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Slider Mouse/Touch Handlers
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
    <div className="raycast-landing">
      {/* Background Technical Grid */}
      <div className="raycast-grid-pattern" />

      {/* Sticky Command Navbar */}
      <nav className="raycast-nav">
        <div
          role="button"
          tabIndex={0}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="nav-brand-group"
        >
          <div className="nav-brand-badge">
            <Shield size={16} strokeWidth={2.4} />
          </div>
          <span className="nav-brand-title">KETER</span>
          <span className="nav-stealth-pill">
            <span className="nav-pill-dot" /> DWM INVISIBLE
          </span>
        </div>

        <div className="nav-links-cluster">
          <button type="button" onClick={() => scrollTo('product-sim')} className="nav-btn-link">
            Live Product
          </button>
          <button type="button" onClick={() => scrollTo('stealth-slider')} className="nav-btn-link">
            Screen Proof
          </button>
          <button type="button" onClick={() => scrollTo('features')} className="nav-btn-link">
            Capabilities
          </button>
          <button type="button" onClick={() => scrollTo('pricing')} className="nav-btn-link">
            Pricing
          </button>
          <button type="button" onClick={() => scrollTo('faq')} className="nav-btn-link">
            FAQ
          </button>
        </div>

        <div>
          <button type="button" onClick={handleDownload} className="btn-nav-primary">
            <Download size={13} /> Download for Windows
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="raycast-hero">
        <div className="hero-tag-strip">
          <span style={{ color: '#059669', fontWeight: 700 }}>● Windows DWM Hardware Exclusion</span>
          <span>•</span>
          <span>100% Invisible on Zoom, Teams & Meet Screen-Shares</span>
        </div>

        <h1 className="hero-title-main">
          The Stealth Interview Copilot Built for <span className="highlight-word">Engineers.</span>
        </h1>

        <p className="hero-subtitle-clean">
          Direct system audio loopback transcription, instant STAR & DSA answer generation, and native Windows display exclusion. Completely undetectable to interviewers.
        </p>

        <div className="hero-action-cluster">
          <button type="button" onClick={handleDownload} className="btn-hero-solid">
            <Download size={16} />
            <span>Download Keter for Windows (.exe)</span>
          </button>

          <button type="button" onClick={() => scrollTo('stealth-slider')} className="btn-hero-outline">
            <Eye size={15} color="#0284c7" />
            <span>Inspect Screen-Share Proof</span>
          </button>
        </div>

        <div className="hero-quick-specs">
          <div className="spec-entry">
            <kbd className="tactile-kbd">Alt</kbd> + <kbd className="tactile-kbd">S</kbd> Vision OCR
          </div>
          <div className="spec-entry">
            <kbd className="tactile-kbd">Esc</kbd> Panic Kill-Switch
          </div>
          <div className="spec-entry">
            <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> 1st Interview Session 100% Free
          </div>
        </div>

        {/* ============================================================
           LIVING PRODUCT EXPERIENCE (INTERACTIVE ANIMATED CENTERPIECE)
           ============================================================ */}
        <div id="product-sim" className="live-product-showcase">
          {/* Interactive 4-Stage Controller */}
          <div className="simulator-stage-selector">
            {PRODUCT_STAGES.map((s) => {
              const isActive = activeStage === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setActiveStage(s.id);
                    if (s.id === 'ocr') triggerScanAnimation();
                  }}
                  className={`stage-tab-btn ${isActive ? 'active' : ''}`}
                >
                  <span className="stage-num-badge">{s.num}</span>
                  <span className="stage-tab-label">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Living Product Frame */}
          <div className={`product-frame ${isPanicHidden ? 'panic-hidden' : ''}`}>
            {/* Titlebar */}
            <div className="product-titlebar">
              <div className="product-titlebar-left">
                <div className="window-dots">
                  <span className="w-dot close" />
                  <span className="w-dot min" />
                  <span className="w-dot max" />
                </div>
                <div className="product-title-brand">
                  <Shield size={13} color="#38bdf8" />
                  <span>Keter Copilot</span>
                </div>
                <span className="product-status-tag">
                  ● DWM EXCLUDED (ZOOM INVISIBLE)
                </span>
              </div>

              <div className="product-titlebar-right">
                <span>Loop: <strong>Google Senior SWE Assessment</strong></span>
                <span>•</span>
                <span style={{ color: '#4ade80' }}>Local Audio Loopback: Active</span>
              </div>
            </div>

            {/* Live Audio Equalizer Ribbon */}
            <div className="audio-stream-ribbon">
              <div className="audio-stream-info">
                <div className="audio-wave-equalizer">
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                </div>
                <span>
                  Interviewer Speech Stream: <strong style={{ color: '#090d16' }}>WASAPI 0ms Driver Intercept</strong>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                <span>Noise Isolation: <strong>-48dB</strong></span>
                <span>•</span>
                <span>Acoustic Echo: <strong>0.00% (Direct)</strong></span>
              </div>
            </div>

            {/* Split Main View */}
            <div className="product-main-view">
              {/* Left Pane: Code & Question Scanner */}
              <div className="screen-capture-pane">
                <div className="pane-header-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Camera size={13} color="#0284c7" />
                    <span>Candidate Screen / Coding IDE</span>
                  </div>
                  <span style={{ color: '#0284c7', fontWeight: 600 }}>Alt+S Crop Area</span>
                </div>

                <div className="sample-code-box">
                  {/* OCR Laser Scanner Line when active */}
                  {isScanningOCR && <div className="ocr-scan-beam" />}
                  {isScanningOCR && <div className="ocr-target-bracket" />}

                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', marginBottom: '8px' }}>
                    {stageData.title}
                  </div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '5px', padding: '8px', color: '#090d16', marginBottom: '10px', fontSize: '11.5px', lineHeight: 1.45 }}>
                    "{stageData.question}"
                  </div>

                  <div style={{ color: '#475569', fontSize: '10.5px' }}>
                    <div><span style={{ color: '#d946ef', fontWeight: 600 }}>class</span> <span style={{ color: '#2563eb', fontWeight: 600 }}>Solution</span>:</div>
                    <div style={{ paddingLeft: '14px' }}><span style={{ color: '#d946ef' }}>def</span> <span style={{ color: '#7c3aed' }}>optimalSolve</span>(self, stream_input):</div>
                    <div style={{ paddingLeft: '28px', color: '#94a3b8' }}># Candidate workspace shared on Zoom</div>
                    <div style={{ paddingLeft: '28px' }}>return telemetry_buffer</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={triggerScanAnimation}
                    className="hotkey-trigger-btn"
                  >
                    <Scan size={12} color="#0284c7" />
                    <span>Trigger <kbd className="tactile-kbd">Alt+S</kbd> Scanner</span>
                  </button>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>OCR Latency: 110ms</span>
                </div>
              </div>

              {/* Right Pane: AI Teleprompter & Response Strategy */}
              <div className="teleprompter-pane">
                <div className="pane-header-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={13} color="#059669" />
                    <span>Real-Time Teleprompter & Strategy</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: isTyping ? '#0284c7' : '#059669', fontWeight: 600 }}>
                      {isTyping ? 'Generating...' : 'Instant 210ms'}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: copied ? '#059669' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '11px',
                        fontWeight: 600,
                      }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="prompter-stream-card">
                  <pre className="prompter-code-output">
                    {streamedText}
                    {isTyping && <span className="live-cursor-block">█</span>}
                  </pre>
                </div>
              </div>
            </div>

            {/* Product Footer Control Strip */}
            <div className="product-footer-strip">
              <div className="footer-hotkey-actions">
                <button
                  type="button"
                  onClick={() => setIsPanicHidden(true)}
                  className="hotkey-trigger-btn"
                  style={{ color: '#e11d48' }}
                >
                  <Zap size={12} color="#e11d48" />
                  <span>Test Panic Hide (<kbd className="tactile-kbd">Esc</kbd>)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveStage('ocr');
                    triggerScanAnimation();
                  }}
                  className="hotkey-trigger-btn"
                >
                  <Camera size={12} color="#0284c7" />
                  <span>Simulate Alt+S Screen Grab</span>
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={12} color="#059669" />
                <span>Windows DWM Affinity: <strong>WDA_EXCLUDEFROMCAPTURE</strong></span>
              </div>
            </div>
          </div>

          {/* Panic State Message (if hidden by Esc) */}
          {isPanicHidden && (
            <div className="panic-active-overlay">
              <div className="panic-card-box">
                <Zap size={28} color="#e11d48" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#090d16' }}>
                  Emergency Panic Kill-Switch Triggered
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', maxWidth: '380px' }}>
                  All overlays, visualizer bars, and audio hooks were destroyed from your screen in <strong>18ms</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setIsPanicHidden(false)}
                  className="btn-hero-solid"
                  style={{ marginTop: '8px', padding: '8px 18px', fontSize: '13px' }}
                >
                  <RotateCcw size={13} /> Reopen Keter HUD
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ============================================================
         INTERACTIVE BEFORE / AFTER SCREEN-SHARE SLIDER (SHOWCASE)
         ============================================================ */}
      <section id="stealth-slider" className="stealth-slider-section">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
            Hardware Proof
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#090d16', letterSpacing: '-0.025em', margin: 0 }}>
            Zoom Shared Screen vs. Your Actual Screen
          </h2>
          <p style={{ fontSize: '14px', color: '#475569', marginTop: '6px' }}>
            Drag the handle horizontally to see how Keter is completely stripped from the shared video stream.
          </p>
        </div>

        <div className="slider-wrapper-box">
          <div className="slider-header-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#090d16' }}>
              <Sliders size={13} color="#0284c7" />
              <span>Interactive Split Screen Comparison</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setSliderPos(100)}
                className="btn-toggle-view"
                style={{ background: sliderPos >= 90 ? '#090d16' : '#ffffff', color: sliderPos >= 90 ? '#ffffff' : '#090d16' }}
              >
                Interviewer View (Zoom)
              </button>
              <button
                type="button"
                onClick={() => setSliderPos(50)}
                className="btn-toggle-view"
                style={{ background: sliderPos > 20 && sliderPos < 80 ? '#090d16' : '#ffffff', color: sliderPos > 20 && sliderPos < 80 ? '#ffffff' : '#090d16' }}
              >
                50 / 50 Split
              </button>
              <button
                type="button"
                onClick={() => setSliderPos(0)}
                className="btn-toggle-view"
                style={{ background: sliderPos <= 10 ? '#090d16' : '#ffffff', color: sliderPos <= 10 ? '#ffffff' : '#090d16' }}
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
              <div style={{ padding: '8px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ fontWeight: 700, color: '#0284c7' }}>WHAT YOU SEE (CANDIDATE VIEW)</span>
                <span style={{ color: '#64748b' }}>Webcam-Level Floating Prompter Active</span>
              </div>

              <div style={{ flex: 1, display: 'flex', position: 'relative', background: '#ffffff' }}>
                <div style={{ width: '130px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '12px 10px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                  <div style={{ color: '#090d16', fontWeight: 700 }}>WORKSPACE</div>
                  <div style={{ color: '#2563eb', fontWeight: 600 }}>▶ solution.py</div>
                  <div>test_suite.py</div>
                </div>

                <div style={{ flex: 1, padding: '16px 20px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65, color: '#1e293b' }}>
                  <div><span style={{ color: '#d946ef', fontWeight: 600 }}>class</span> <span style={{ color: '#2563eb', fontWeight: 600 }}>InterviewSolution</span>:</div>
                  <div style={{ paddingLeft: '16px' }}><span style={{ color: '#d946ef' }}>def</span> <span style={{ color: '#7c3aed' }}>twoSum</span>(self, nums, target):</div>
                  <div style={{ paddingLeft: '32px' }}>lookup = &#123;&#125;</div>
                  <div style={{ paddingLeft: '32px' }}><span style={{ color: '#d946ef' }}>for</span> i, n <span style={{ color: '#d946ef' }}>in</span> enumerate(nums):</div>
                  <div style={{ paddingLeft: '48px' }}>diff = target - n</div>
                  <div style={{ paddingLeft: '48px' }}><span style={{ color: '#d946ef' }}>if</span> diff <span style={{ color: '#d946ef' }}>in</span> lookup:</div>
                  <div style={{ paddingLeft: '64px' }}><span style={{ color: '#d946ef' }}>return</span> [lookup[diff], i]</div>
                </div>

                {/* FLOATING KETER HUD */}
                <div className="mock-floating-hud">
                  <div className="mock-hud-bar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Shield size={12} color="#38bdf8" />
                      <span>KETER STEALTH COPILOT</span>
                    </div>
                    <span style={{ color: '#4ade80', fontSize: '9px', fontWeight: 800 }}>● DWM EXCLUDED</span>
                  </div>

                  <div className="mock-hud-content">
                    <div className="mock-hud-q">
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>
                        Audio Loopback Transcript:
                      </span>
                      "Can you solve Two Sum in linear O(N) time?"
                    </div>

                    <div className="mock-hud-a">
                      <div style={{ color: '#059669', fontWeight: 700, marginBottom: '2px' }}>
                        [Optimal Strategy Teleprompter]
                      </div>
                      <div>• Time: O(N) linear one-pass hash map</div>
                      <div>• Say: "To achieve linear time instead of naive O(N²)..."</div>
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
              <div style={{ padding: '8px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '11px', width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : '100%' }}>
                <span style={{ fontWeight: 700, color: '#059669' }}>WHAT INTERVIEWER SEES (ZOOM SCREEN SHARE)</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>100% Clean Recording • 0 Overlays</span>
              </div>

              <div style={{ flex: 1, display: 'flex', position: 'relative', background: '#ffffff', width: sliderRef.current ? `${sliderRef.current.clientWidth}px` : '100%' }}>
                <div style={{ width: '130px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', padding: '12px 10px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                  <div style={{ color: '#090d16', fontWeight: 700 }}>WORKSPACE</div>
                  <div style={{ color: '#2563eb', fontWeight: 600 }}>▶ solution.py</div>
                  <div>test_suite.py</div>
                </div>

                <div style={{ flex: 1, padding: '16px 20px', fontFamily: 'monospace', fontSize: '12px', lineHeight: 1.65, color: '#1e293b' }}>
                  <div><span style={{ color: '#d946ef', fontWeight: 600 }}>class</span> <span style={{ color: '#2563eb', fontWeight: 600 }}>InterviewSolution</span>:</div>
                  <div style={{ paddingLeft: '16px' }}><span style={{ color: '#d946ef' }}>def</span> <span style={{ color: '#7c3aed' }}>twoSum</span>(self, nums, target):</div>
                  <div style={{ paddingLeft: '32px' }}>lookup = &#123;&#125;</div>
                  <div style={{ paddingLeft: '32px' }}><span style={{ color: '#d946ef' }}>for</span> i, n <span style={{ color: '#d946ef' }}>in</span> enumerate(nums):</div>
                  <div style={{ paddingLeft: '48px' }}>diff = target - n</div>
                  <div style={{ paddingLeft: '48px' }}><span style={{ color: '#d946ef' }}>if</span> diff <span style={{ color: '#d946ef' }}>in</span> lookup:</div>
                  <div style={{ paddingLeft: '64px' }}><span style={{ color: '#d946ef' }}>return</span> [lookup[diff], i]</div>
                </div>
                {/* No Keter HUD exists on this layer */}
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
         TACTILE FEATURE CARDS
         ============================================================ */}
      <section id="features" style={{ maxWidth: '1040px', margin: '90px auto 0', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Tactile Precision
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#090d16', letterSpacing: '-0.025em', margin: 0 }}>
            Engineered for High-Pressure Technical Loops
          </h2>
        </div>

        <div className="linear-card-grid">
          <div className="linear-card">
            <div className="linear-card-icon">
              <Camera size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#090d16' }}>Instant Vision OCR</h4>
              <kbd className="tactile-kbd">Alt + S</kbd>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Instantly crop and extract coding challenges, system architectures, or LeetCode problem descriptions straight off your screen.
            </p>
          </div>

          <div className="linear-card">
            <div className="linear-card-icon">
              <Zap size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#090d16' }}>Panic Kill-Switch</h4>
              <kbd className="tactile-kbd">Esc</kbd>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Hit Escape or Ctrl+Shift+X to instantaneously destroy all visible HUD overlays and audio hooks in under 50 milliseconds.
            </p>
          </div>

          <div className="linear-card">
            <div className="linear-card-icon">
              <Volume2 size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#090d16' }}>System Audio Loopback</h4>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>0ms Echo</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Listens directly to incoming audio playback on Windows. No meetings bots joining the call and zero proctor detection.
            </p>
          </div>

          <div className="linear-card">
            <div className="linear-card-icon">
              <Smartphone size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#090d16' }}>Air-Gapped Teleprompter</h4>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>P2P WebRTC</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Scan a QR code from any smartphone. Mount your phone under your webcam for natural eye contact with zero app install.
            </p>
          </div>

          <div className="linear-card">
            <div className="linear-card-icon">
              <Folder size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#090d16' }}>Isolated Workspaces</h4>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Multi-Company</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Isolate resumes, specific job descriptions, and chat memory by company. Never leak company context between rounds.
            </p>
          </div>

          <div className="linear-card">
            <div className="linear-card-icon">
              <Lock size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#090d16' }}>100% Client Privacy</h4>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>Local-First</span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>
              Zero audio is ever logged to external servers. All speech-to-text and AI prompt context remain strictly on your machine.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
         PRICING SECTION
         ============================================================ */}
      <section id="pricing" style={{ maxWidth: '1040px', margin: '90px auto 0', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Fair & Transparent
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#090d16', letterSpacing: '-0.025em', margin: 0 }}>
            Zero Monthly Subscription Traps
          </h2>
          <p style={{ fontSize: '15px', color: '#475569', maxWidth: '580px', margin: '10px auto 0' }}>
            Never pay $80/month when you aren't interviewing. Test your first session completely free, then unlock 24-hour interview passes for ₹99.
          </p>
        </div>

        <div className="pricing-grid-two">
          {/* Trial Pass */}
          <div className="pricing-box">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>Trial Pass</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                  NO CARD REQUIRED
                </span>
              </div>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#090d16', margin: '6px 0' }}>
                ₹0 <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>/ 1st project</span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '8px 0 0' }}>
                Full feature access. Test your audio loopback, connect your phone prompter, and complete your initial round.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13px', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#059669" /> 1 Full 24-Hour Interview Project</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#059669" /> STAR, Technical & System Design Modes</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#059669" /> Instant Screen Question Capture (Alt+S)</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#059669" /> 100% Invisible on Zoom / Teams / Meet</li>
              </ul>
            </div>

            <button type="button" onClick={handleDownload} className="btn-hero-outline" style={{ justifyContent: 'center', width: '100%' }}>
              <Download size={14} /> Download & Start Free
            </button>
          </div>

          {/* Paid Pass */}
          <div className="pricing-box spotlight">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#090d16' }}>24h Interview Pass</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', background: '#090d16', padding: '2px 8px', borderRadius: '4px' }}>
                  PAY-AS-YOU-INTERVIEW
                </span>
              </div>
              <div style={{ fontSize: '34px', fontWeight: 900, color: '#090d16', margin: '6px 0' }}>
                ₹99 <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>/ 24h pass</span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '8px 0 0' }}>
                Timer starts ONLY when you click Activate before your interview. Purchased passes never expire.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: '9px', fontSize: '13px', color: '#334155' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#090d16" /> 1 Dedicated 24h Project Session</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#090d16" /> Timer starts ONLY when activated</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#090d16" /> Unactivated passes never expire</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#090d16" /> Isolated JD Context & Resume Grounding</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={14} color="#090d16" /> Instant Razorpay UPI (GPay, PhonePe, Paytm)</li>
              </ul>
            </div>

            <button type="button" onClick={handleDownload} className="btn-hero-solid" style={{ justifyContent: 'center', width: '100%' }}>
              <Download size={14} /> Download for Windows
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
         FAQ ACCORDION
         ============================================================ */}
      <section id="faq" style={{ maxWidth: '1040px', margin: '90px auto 0', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Questions & Answers
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#090d16', letterSpacing: '-0.025em', margin: 0 }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div className="faq-box-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="faq-row">
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                >
                  <span>{item.q}</span>
                  {isExpanded ? <ChevronUp size={15} color="#090d16" /> : <ChevronDown size={15} color="#64748b" />}
                </button>
                {isExpanded && <div className="faq-answer-pane">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
         FINAL CALL TO ACTION
         ============================================================ */}
      <section style={{ maxWidth: '1040px', margin: '90px auto 0', padding: '0 24px' }}>
        <div className="final-cta-card">
          <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.03em', margin: '0 0 10px' }}>
            Ace Your Next Round with Complete Discretion.
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', maxWidth: '580px', margin: '0 auto 24px', lineHeight: 1.5 }}>
            Join software engineers and engineering leads using Keter to interview with absolute confidence.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={handleDownload}
              style={{
                background: '#ffffff',
                color: '#090d16',
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

          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '16px' }}>
            Windows 10 / 11 (64-bit) • Size: ~65 MB • Instant Setup
          </div>
        </div>

        {/* Support Strip */}
        <div style={{ textAlign: 'center', marginTop: '24px', padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#090d16' }}>
            Need Custom Assistance or Setup Support?
          </div>
          <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
            Our engineering team is available 24/7 at{' '}
            <a href="mailto:keterai26@gmail.com" style={{ color: '#0284c7', fontWeight: 600, textDecoration: 'none' }}>
              keterai26@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#090d16" />
          <span style={{ color: '#090d16', fontWeight: 800 }}>KETER COPILOT</span>
          <span>— Stealth Real-Time Interview Intelligence</span>
        </div>

        <div style={{ maxWidth: '640px', fontSize: '11px', lineHeight: 1.5, color: '#64748b' }}>
          Disclaimer: Keter is an interview preparation, enablement, and real-time candidate assistance tool. Users are responsible for complying with the terms and conditions of their respective interview platforms.
        </div>

        <div>
          © 2026 Keter Copilot. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
