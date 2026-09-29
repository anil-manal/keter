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
} from 'lucide-react';
import './LandingPage.css';

const SIMULATOR_PRESETS = {
  technical: {
    title: 'Technical / DSA',
    badge: 'Algorithms',
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
    badge: 'Distributed Systems',
    question: 'How would you design a distributed Rate Limiter for an API gateway serving 100k requests/second with sub-5ms overhead?',
    teleprompter: `[1. Key Scale & Latency Targets]
• 100,000 req/sec across 4 multi-region clusters
• Sub-5ms budget for rate limit evaluation

[2. Core Architectural Strategy]:
"I recommend a Redis-backed Sliding Window Counter with local memory token batching at Envoy. Instead of reaching out to Redis on every single request, the API gateway batches local consumption and syncs every 20ms using Lua scripts to prevent distributed race conditions."

[3. High Availability Fallback]:
• If Redis cluster encounters partition latency > 5ms, fallback to local in-memory Leaky Bucket to guarantee zero outage for legitimate traffic."`,
  },
  star: {
    title: 'STAR Behavioral',
    badge: 'Engineering Leadership',
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
    title: 'Compensation',
    badge: 'Offer Strategy',
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
  const [activeCategory, setActiveCategory] = useState('technical');
  const [simText, setSimText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);

  // Interactive Before/After Split Slider State
  const [sliderPos, setSliderPos] = useState(50); // 0 to 100%
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderContainerRef = useRef(null);

  const currentPreset = SIMULATOR_PRESETS[activeCategory];

  // Simulates real-time token streaming when preset changes
  useEffect(() => {
    setIsTyping(true);
    setSimText('');
    const fullText = currentPreset.teleprompter;
    let idx = 0;

    const interval = setInterval(() => {
      idx += 12;
      if (idx >= fullText.length) {
        setSimText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      } else {
        setSimText(fullText.substring(0, idx));
      }
    }, 15);

    return () => clearInterval(interval);
  }, [activeCategory]);

  // Handle Dragging Slider
  const handleSliderMove = (clientX) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleTouchMove = (e) => {
    if (isDraggingSlider && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (isDraggingSlider) {
      handleSliderMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSlider(false);
  };

  useEffect(() => {
    if (isDraggingSlider) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingSlider]);

  const handleCopy = () => {
    navigator.clipboard.writeText(simText);
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
          <button type="button" onClick={() => scrollTo('slider-demo')} className="nav-btn-link">
            Stealth Proof
          </button>
          <button type="button" onClick={() => scrollTo('command-deck')} className="nav-btn-link">
            Command Deck
          </button>
          <button type="button" onClick={() => scrollTo('shortcuts')} className="nav-btn-link">
            Hotkeys
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
            <Download size={13} /> Download Keter
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="raycast-hero">
        <div className="hero-tag-strip">
          <span style={{ color: '#059669', fontWeight: 700 }}>● Hardware-Level Exclusion</span>
          <span>•</span>
          <span>Zero Overlays on Zoom, Teams & Google Meet</span>
        </div>

        <h1 className="hero-title-main">
          The Stealth Interview Copilot Built for <span className="highlight-word">Engineers.</span>
        </h1>

        <p className="hero-subtitle-clean">
          Direct system audio loopback transcription, instant STAR & DSA answer generation, and native Windows DWM screen-share exclusion. Completely undetectable to interviewers.
        </p>

        <div className="hero-action-cluster">
          <button type="button" onClick={handleDownload} className="btn-hero-solid">
            <Download size={16} />
            <span>Download Keter for Windows (.exe)</span>
          </button>

          <button type="button" onClick={() => scrollTo('slider-demo')} className="btn-hero-outline">
            <Eye size={15} color="#0284c7" />
            <span>See Live Screen Proof</span>
          </button>
        </div>

        <div className="hero-quick-specs">
          <div className="spec-entry">
            <kbd className="tactile-kbd">Alt</kbd> + <kbd className="tactile-kbd">S</kbd> Instant Screen OCR
          </div>
          <div className="spec-entry">
            <kbd className="tactile-kbd">Esc</kbd> Panic Kill-Switch
          </div>
          <div className="spec-entry">
            <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> 1st Interview Session 100% Free
          </div>
        </div>

        {/* ============================================================
           INTERACTIVE BEFORE / AFTER SCREEN-SHARE SLIDER (SHOWCASE)
           Direct interactive proof of DWM window exclusion
           ============================================================ */}
        <div id="slider-demo" className="slider-showcase-container">
          <div className="slider-outer-frame">
            {/* Top Toolbar with Instructions & Preset Toggles */}
            <div className="slider-instruction-bar">
              <div className="instruction-text">
                <Sliders size={13} color="#0284c7" />
                <span>Drag the slider handle horizontally to verify screen-share invisibility:</span>
              </div>

              <div className="quick-toggle-buttons">
                <button
                  type="button"
                  onClick={() => setSliderPos(100)}
                  className={`btn-toggle-view ${sliderPos >= 90 ? 'active' : ''}`}
                >
                  Zoom View (Clean Desktop)
                </button>
                <button
                  type="button"
                  onClick={() => setSliderPos(50)}
                  className={`btn-toggle-view ${sliderPos > 20 && sliderPos < 80 ? 'active' : ''}`}
                >
                  Split View (50%)
                </button>
                <button
                  type="button"
                  onClick={() => setSliderPos(0)}
                  className={`btn-toggle-view ${sliderPos <= 10 ? 'active' : ''}`}
                >
                  Candidate View (HUD Visible)
                </button>
              </div>
            </div>

            {/* Draggable Split Canvas */}
            <div
              ref={sliderContainerRef}
              className="split-canvas-wrapper"
              onMouseDown={(e) => {
                setIsDraggingSlider(true);
                handleSliderMove(e.clientX);
              }}
              onTouchStart={(e) => {
                setIsDraggingSlider(true);
                if (e.touches[0]) handleSliderMove(e.touches[0].clientX);
              }}
            >
              {/* LAYER 1: CANDIDATE VIEW (Background with Floating Keter HUD) */}
              <div className="split-layer-candidate">
                <div className="screen-mock-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="screen-mock-tag-hud">CANDIDATE MONITOR VIEW</span>
                    <span style={{ color: '#64748b' }}>Webcam-Level Floating Teleprompter Active</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <kbd className="tactile-kbd">Alt+S</kbd>
                    <kbd className="tactile-kbd">Esc</kbd>
                  </div>
                </div>

                <div className="mock-ide-layout">
                  <div className="mock-ide-file-tree">
                    <div style={{ color: '#090d16', fontWeight: 700 }}>EXPLORER</div>
                    <div style={{ color: '#2563eb', fontWeight: 600 }}>▶ solution.py</div>
                    <div>test_runner.py</div>
                    <div>system_notes.md</div>
                  </div>

                  <div className="mock-ide-editor-area">
                    <div><span className="kw">from</span> typing <span className="kw">import</span> List, Optional</div>
                    <div className="cm"># Interview Coding Assessment • Shared IDE</div>
                    <div><span className="kw">class</span> <span className="fn">Solution</span>:</div>
                    <div style={{ paddingLeft: '16px' }}><span className="kw">def</span> <span className="fn">twoSum</span>(self, nums: List[int], target: int) -&gt; List[int]:</div>
                    <div style={{ paddingLeft: '32px' }}>lookup = &#123;&#125;</div>
                    <div style={{ paddingLeft: '32px' }}><span className="kw">for</span> i, num <span className="kw">in</span> enumerate(nums):</div>
                    <div style={{ paddingLeft: '48px' }}>complement = target - num</div>
                    <div style={{ paddingLeft: '48px' }}><span className="kw">if</span> complement <span className="kw">in</span> lookup:</div>
                    <div style={{ paddingLeft: '64px' }}><span className="kw">return</span> [lookup[complement], i]</div>
                    <div style={{ paddingLeft: '48px' }}>lookup[num] = i</div>
                  </div>

                  {/* FLOATING KETER STEALTH HUD */}
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
                          Interviewer Voice (Loopback):
                        </span>
                        "{currentPreset.question}"
                      </div>

                      <div className="mock-hud-a">
                        <div style={{ color: '#059669', fontWeight: 700, marginBottom: '4px' }}>
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
                <div className="screen-mock-header" style={{ width: sliderContainerRef.current ? `${sliderContainerRef.current.clientWidth}px` : '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="screen-mock-tag-safe">ZOOM / TEAMS SHARED STREAM</span>
                    <span style={{ color: '#64748b' }}>Pristine Desktop • Zero Overlays Visible</span>
                  </div>
                  <span style={{ color: '#059669', fontWeight: 600, fontSize: '11px' }}>
                    100% Clean Recording
                  </span>
                </div>

                <div className="mock-ide-layout" style={{ width: sliderContainerRef.current ? `${sliderContainerRef.current.clientWidth}px` : '100%' }}>
                  <div className="mock-ide-file-tree">
                    <div style={{ color: '#090d16', fontWeight: 700 }}>EXPLORER</div>
                    <div style={{ color: '#2563eb', fontWeight: 600 }}>▶ solution.py</div>
                    <div>test_runner.py</div>
                    <div>system_notes.md</div>
                  </div>

                  <div className="mock-ide-editor-area">
                    <div><span className="kw">from</span> typing <span className="kw">import</span> List, Optional</div>
                    <div className="cm"># Interview Coding Assessment • Shared IDE</div>
                    <div><span className="kw">class</span> <span className="fn">Solution</span>:</div>
                    <div style={{ paddingLeft: '16px' }}><span className="kw">def</span> <span className="fn">twoSum</span>(self, nums: List[int], target: int) -&gt; List[int]:</div>
                    <div style={{ paddingLeft: '32px' }}>lookup = &#123;&#125;</div>
                    <div style={{ paddingLeft: '32px' }}><span className="kw">for</span> i, num <span className="kw">in</span> enumerate(nums):</div>
                    <div style={{ paddingLeft: '48px' }}>complement = target - num</div>
                    <div style={{ paddingLeft: '48px' }}><span className="kw">if</span> complement <span className="kw">in</span> lookup:</div>
                    <div style={{ paddingLeft: '64px' }}><span className="kw">return</span> [lookup[complement], i]</div>
                    <div style={{ paddingLeft: '48px' }}>lookup[num] = i</div>
                  </div>
                  {/* Notice: NO Keter HUD is in this layer! Pristine clean stream */}
                </div>
              </div>

              {/* SLIDER DRAGGABLE DIVIDER HANDLE */}
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
        </div>
      </header>

      {/* ============================================================
         TACTILE STEALTH COMMAND DECK (RAYCAST PALETTE STYLE)
         ============================================================ */}
      <section id="command-deck" className="command-deck-section">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Tactile Teleprompter Interface
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#090d16', letterSpacing: '-0.025em', margin: 0 }}>
            Real-Time Strategy Command Deck
          </h2>
        </div>

        <div className="command-deck-container">
          {/* Header Bar */}
          <div className="command-deck-header">
            <div className="deck-title-row">
              <Terminal size={15} color="#0284c7" />
              <span>Target Project Context: <strong>Google Senior Infrastructure Loop</strong></span>
            </div>

            <div className="deck-hotkeys-row">
              <span>Hotkeys:</span>
              <kbd className="tactile-kbd">Alt + S</kbd>
              <kbd className="tactile-kbd">Esc</kbd>
              <kbd className="tactile-kbd">Ctrl + Shift + X</kbd>
            </div>
          </div>

          <div className="deck-body">
            {/* Left Category Selector */}
            <div className="deck-modes-sidebar">
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Select Round Scenario:
              </div>

              {Object.keys(SIMULATOR_PRESETS).map((key) => {
                const item = SIMULATOR_PRESETS[key];
                const isActive = activeCategory === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(key)}
                    className={`deck-mode-item ${isActive ? 'active' : ''}`}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>
                      {item.title}
                    </div>
                    <div className="item-sub" style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {item.badge}
                    </div>
                  </button>
                );
              })}

              <div style={{ marginTop: 'auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', fontSize: '11px', color: '#475569', lineHeight: 1.45 }}>
                💡 Direct driver loopback captures audio with sub-5ms latency from headphones or speakers.
              </div>
            </div>

            {/* Right Teleprompter Output */}
            <div className="deck-teleprompter-view">
              <div className="teleprompter-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isTyping ? '#0284c7' : '#059669' }} />
                  <span style={{ fontWeight: 700, color: '#090d16' }}>
                    {isTyping ? 'Streaming Real-Time Solution...' : 'Optimal Teleprompter Ready'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#64748b' }}>Response: <strong>&lt;240ms</strong></span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '5px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: copied ? '#059669' : '#090d16',
                      fontWeight: 600,
                    }}
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 600, color: '#090d16', background: '#ffffff', border: '1px solid #e2e8f0', padding: '8px 10px', borderRadius: '6px' }}>
                Question: "{currentPreset.question}"
              </div>

              <pre className="teleprompter-stream-code">
                {simText}
                {isTyping && <span style={{ color: '#0284c7' }}> ▋</span>}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
         TACTILE SHORTCUTS & FEATURES (LINEAR CARD STYLE)
         ============================================================ */}
      <section id="shortcuts" style={{ maxWidth: '1040px', margin: '90px auto 0', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Tactile Precision
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#090d16', letterSpacing: '-0.025em', margin: 0 }}>
            Engineered for High-Pressure Technical Loops
          </h2>
        </div>

        <div className="linear-features-grid">
          <div className="linear-card">
            <div className="linear-card-icon">
              <Camera size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 className="linear-card-title">Instant Vision OCR</h4>
              <kbd className="tactile-kbd">Alt + S</kbd>
            </div>
            <p className="linear-card-body">
              Instantly crop and extract coding challenges, system architectures, or LeetCode problem descriptions straight off your screen.
            </p>
          </div>

          <div className="linear-card">
            <div className="linear-card-icon">
              <Zap size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 className="linear-card-title">Panic Kill-Switch</h4>
              <kbd className="tactile-kbd">Esc</kbd>
            </div>
            <p className="linear-card-body">
              Hit Escape or Ctrl+Shift+X to instantaneously destroy all visible HUD overlays and audio hooks in under 50 milliseconds.
            </p>
          </div>

          <div className="linear-card">
            <div className="linear-card-icon">
              <Volume2 size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 className="linear-card-title">System Audio Loopback</h4>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>0ms Echo</span>
            </div>
            <p className="linear-card-body">
              Listens directly to incoming audio playback on Windows. No meetings bots joining the call and zero proctor detection.
            </p>
          </div>

          <div className="linear-card">
            <div className="linear-card-icon">
              <Smartphone size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 className="linear-card-title">Air-Gapped Teleprompter</h4>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7' }}>P2P WebRTC</span>
            </div>
            <p className="linear-card-body">
              Scan a QR code from any smartphone. Mount your phone under your webcam for natural eye contact with zero app install.
            </p>
          </div>

          <div className="linear-card">
            <div className="linear-card-icon">
              <Folder size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 className="linear-card-title">Isolated Workspaces</h4>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Multi-Company</span>
            </div>
            <p className="linear-card-body">
              Isolate resumes, specific job descriptions, and chat memory by company. Never leak company context between rounds.
            </p>
          </div>

          <div className="linear-card">
            <div className="linear-card-icon">
              <Lock size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 className="linear-card-title">100% Client Privacy</h4>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>Local-First</span>
            </div>
            <p className="linear-card-body">
              Zero audio is ever logged to external servers. All speech-to-text and AI prompt context remain strictly on your machine.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
         PRICING (MONOCHROME EDITORIAL)
         ============================================================ */}
      <section id="pricing" style={{ maxWidth: '1040px', margin: '90px auto 0', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>
            Simple & Transparent
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#090d16', letterSpacing: '-0.025em', margin: 0 }}>
            Zero Monthly Subscription Traps
          </h2>
          <p style={{ fontSize: '15px', color: '#475569', maxWidth: '580px', margin: '10px auto 0' }}>
            Never pay $80/month when you aren't interviewing. Test your first session completely free, then unlock 24-hour interview passes for ₹99.
          </p>
        </div>

        <div className="linear-pricing-row">
          {/* Trial Pass */}
          <div className="linear-pricing-card">
            <div>
              <div className="pricing-title-row">
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#64748b' }}>Trial Pass</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                  NO CARD REQUIRED
                </span>
              </div>
              <div className="pricing-cost">
                ₹0 <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>/ 1st project</span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '8px 0 0' }}>
                Full feature access. Test your audio loopback, connect your phone prompter, and complete your initial round.
              </p>

              <ul className="pricing-checklist">
                <li><CheckCircle size={14} color="#059669" /> 1 Full 24-Hour Interview Project</li>
                <li><CheckCircle size={14} color="#059669" /> STAR, Technical & System Design Modes</li>
                <li><CheckCircle size={14} color="#059669" /> Instant Screen Question Capture (Alt+S)</li>
                <li><CheckCircle size={14} color="#059669" /> 100% Invisible on Zoom / Teams / Meet</li>
              </ul>
            </div>

            <button type="button" onClick={handleDownload} className="btn-hero-outline" style={{ justifyContent: 'center', width: '100%' }}>
              <Download size={14} /> Download & Start Free
            </button>
          </div>

          {/* Paid Pass */}
          <div className="linear-pricing-card spotlight">
            <div>
              <div className="pricing-title-row">
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#090d16' }}>24h Interview Pass</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', background: '#090d16', padding: '2px 8px', borderRadius: '4px' }}>
                  PAY-AS-YOU-INTERVIEW
                </span>
              </div>
              <div className="pricing-cost">
                ₹99 <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748b' }}>/ 24h pass</span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '8px 0 0' }}>
                Timer starts ONLY when you click Activate before your interview. Purchased passes never expire.
              </p>

              <ul className="pricing-checklist">
                <li><CheckCircle size={14} color="#090d16" /> 1 Dedicated 24h Project Session</li>
                <li><CheckCircle size={14} color="#090d16" /> Timer starts ONLY when activated</li>
                <li><CheckCircle size={14} color="#090d16" /> Unactivated passes never expire</li>
                <li><CheckCircle size={14} color="#090d16" /> Isolated JD Context & Resume Grounding</li>
                <li><CheckCircle size={14} color="#090d16" /> Instant Razorpay UPI (GPay, PhonePe, Paytm)</li>
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

        <div className="linear-faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="linear-faq-item">
                <button
                  type="button"
                  className="linear-faq-btn"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                >
                  <span>{item.q}</span>
                  {isExpanded ? <ChevronUp size={15} color="#090d16" /> : <ChevronDown size={15} color="#64748b" />}
                </button>
                {isExpanded && <div className="linear-faq-body">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
         FINAL CALL TO ACTION
         ============================================================ */}
      <section style={{ maxWidth: '1040px', margin: '90px auto 0', padding: '0 24px' }}>
        <div className="linear-cta-card">
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
      <footer className="linear-footer">
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
