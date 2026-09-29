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
  Monitor,
  Mic,
  MicOff,
  Copy,
  Check,
  Radio,
  Sliders,
} from 'lucide-react';
import './LandingPage.css';

const SIMULATOR_PRESETS = {
  technical: {
    title: 'Technical DSA',
    tag: 'Algorithms & Data Structures',
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
    tag: 'Distributed Architecture',
    question: 'How would you design a distributed Rate Limiter for an API gateway serving 100k requests/second?',
    teleprompter: `[1. Key Requirements & Scale]
• 100k req/sec throughput with sub-5ms latency penalty
• Distributed consistency across multi-region edge clusters

[2. Algorithm Choice: Sliding Window Counter vs Token Bucket]:
"I recommend a Redis-backed Sliding Window Counter with Lua scripts. Token Bucket is prone to burst spikes, whereas Sliding Window provides accurate rate limiting while remaining memory efficient."

[3. High-Throughput Edge Caching Strategy]:
• Local memory batching at Envoy API gateway (flush counters every 50ms to Redis Cluster)
• Redis Cluster partitioned by user_id/IP hash key
• Fallback to local degraded mode if Redis cluster experiences network partition."`,
  },
  star: {
    title: 'STAR Behavioral',
    tag: 'Leadership & Conflict',
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
    title: 'Salary Negotiation',
    tag: 'Offer & Compensation',
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
    a: 'No. Keter utilizes Windows Desktop Window Manager (DWM) display affinity exclusion. When you share your entire desktop or any individual window on Zoom, Teams, or Meet, Keter is stripped entirely from the video capture buffer. The interviewer only sees your clean desktop, browser, or code editor.',
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

  // Audio Loopback Tester State
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioLevel, setAudioLevel] = useState(25);
  const audioIntervalRef = useRef(null);

  const currentPreset = SIMULATOR_PRESETS[activeCategory];

  // Simulates real-time token streaming when preset changes
  useEffect(() => {
    setIsTyping(true);
    setSimText('');
    const fullText = currentPreset.teleprompter;
    let idx = 0;

    const interval = setInterval(() => {
      idx += 10;
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

  // Audio Tester simulation
  const toggleAudioTest = () => {
    if (isTestingAudio) {
      clearInterval(audioIntervalRef.current);
      setIsTestingAudio(false);
      setAudioLevel(15);
    } else {
      setIsTestingAudio(true);
      audioIntervalRef.current = setInterval(() => {
        setAudioLevel(Math.floor(Math.random() * 65) + 30);
      }, 100);
    }
  };

  useEffect(() => {
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, []);

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
    <div className="landing-container">
      {/* Subtle Technical Grid Background */}
      <div className="landing-grid-bg" />

      {/* Navigation */}
      <nav className="landing-nav">
        <div
          role="button"
          tabIndex={0}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="landing-logo"
          style={{ cursor: 'pointer' }}
        >
          <div className="logo-shield-badge">
            <Shield size={16} strokeWidth={2.4} />
          </div>
          <span className="logo-brand-name">KETER</span>
          <span className="logo-tag">STEALTH COPILOT</span>
        </div>

        <div className="landing-nav-links">
          <button type="button" onClick={() => scrollTo('demo')} className="nav-link">
            Live Demo
          </button>
          <button type="button" onClick={() => scrollTo('how-it-works')} className="nav-link">
            How It Works
          </button>
          <button type="button" onClick={() => scrollTo('tester')} className="nav-link">
            Audio Loopback
          </button>
          <button type="button" onClick={() => scrollTo('stealth')} className="nav-link">
            Stealth Proof
          </button>
          <button type="button" onClick={() => scrollTo('pricing')} className="nav-link">
            Pricing
          </button>
          <button type="button" onClick={() => scrollTo('faq')} className="nav-link">
            FAQ
          </button>
        </div>

        <div>
          <button type="button" onClick={handleDownload} className="btn-nav-download">
            <Download size={14} /> Download for Windows
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero">
        <div className="hero-pill-announcement">
          <span className="pill-dot-green" />
          <span>Hardware DWM Exclusion • 100% Invisible on Screen Shares</span>
        </div>

        <h1 className="hero-heading">
          The Stealth Interview Copilot Designed for <span className="gradient-word">Engineers.</span>
        </h1>

        <p className="hero-subhead">
          Real-time speech loopback transcription, instant STAR & DSA answer generation, and hardware-level screen invisibility for Zoom, Microsoft Teams, and Google Meet.
        </p>

        <div className="hero-cta-group">
          <button type="button" onClick={handleDownload} className="btn-cta-primary">
            <Download size={17} />
            <span>Download for Windows (64-bit)</span>
          </button>

          <button type="button" onClick={() => scrollTo('demo')} className="btn-cta-secondary">
            <Play size={15} color="#2563eb" />
            <span>Try Interactive Demo</span>
          </button>
        </div>

        <div className="hero-specs-bar">
          <div className="hero-spec-item">
            <CheckCircle size={14} color="#059669" /> Zoom & Teams Invisible
          </div>
          <div className="hero-spec-item">
            <CheckCircle size={14} color="#059669" /> Direct System Audio Loopback
          </div>
          <div className="hero-spec-item">
            <CheckCircle size={14} color="#059669" /> Alt+S Screen Question OCR
          </div>
          <div className="hero-spec-item">
            <CheckCircle size={14} color="#059669" /> 1st Interview Session Free
          </div>
        </div>

        {/* ============================================================
           AUTHENTIC PRODUCT DEMO WIDGET (IN HERO)
           Real UI Widget previewing the actual Keter experience
           ============================================================ */}
        <div id="demo" className="hero-widget-container">
          <div className="live-widget-card">
            {/* Titlebar */}
            <div className="widget-titlebar">
              <div className="widget-titlebar-left">
                <div className="window-dots">
                  <span className="w-dot close" />
                  <span className="w-dot min" />
                  <span className="w-dot max" />
                </div>
                <div className="widget-app-tag">
                  <Shield size={13} color="#2563eb" />
                  <span>Keter Intelligence Copilot</span>
                </div>
                <span className="widget-status-pill">
                  <span className="pill-dot-green" /> STEALTH ACTIVE
                </span>
              </div>

              <div className="widget-titlebar-right">
                <span>Active Project: <strong>Google Senior SWE Loop</strong></span>
                <span className="widget-shortcut-badge">Alt+S OCR</span>
                <span className="widget-shortcut-badge">Esc Hide</span>
              </div>
            </div>

            {/* Scenario Switcher Strip */}
            <div className="widget-controls-strip">
              <div className="widget-tab-buttons">
                {Object.keys(SIMULATOR_PRESETS).map((key) => {
                  const item = SIMULATOR_PRESETS[key];
                  const isActive = activeCategory === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveCategory(key)}
                      className={`tab-btn ${isActive ? 'active' : ''}`}
                    >
                      {item.title}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={toggleAudioTest}
                className={`mic-toggle-btn ${isTestingAudio ? 'recording' : ''}`}
              >
                {isTestingAudio ? <MicOff size={13} /> : <Mic size={13} />}
                <span>{isTestingAudio ? 'Mute Audio Loopback' : 'Simulate Loopback Input'}</span>
              </button>
            </div>

            {/* Recognized Question Box */}
            <div className="widget-question-area">
              <div className="question-label-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={13} color="#2563eb" />
                  <span>Transcribed Interviewer Speech (0ms Driver Stream)</span>
                </div>
                <span style={{ color: '#059669', fontWeight: 600 }}>100% Match</span>
              </div>
              <p className="question-content-text">
                "{currentPreset.question}"
              </p>
            </div>

            {/* Real-Time Answer Teleprompter */}
            <div className="widget-answer-body">
              <div className="answer-header-row">
                <div className="answer-header-left">
                  <Sparkles size={14} />
                  <span>Real-Time Response Strategy & Verbatim Teleprompter</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="answer-latency-badge">
                    Latency: <strong>240ms</strong>
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
                      gap: '4px',
                      fontSize: '11px',
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <pre className="answer-text-stream">
                {simText}
                {isTyping && <span className="typing-cursor-solid">▋</span>}
              </pre>
            </div>

            {/* Widget Footer */}
            <div className="widget-footer-bar">
              <div className="widget-footer-left">
                <Lock size={12} />
                <span>Excluded from Zoom, Teams & Meet Video Stream</span>
              </div>
              <div className="widget-footer-right">
                <span>Display: <strong>Near-Webcam Eye Contact HUD</strong></span>
                <span>•</span>
                <span>Companion: <strong>Air-Gapped Phone Available</strong></span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
         HOW IT WORKS (PRODUCT WALKTHROUGH - 3 CLEAN STEPS)
         ============================================================ */}
      <section id="how-it-works" className="section-container">
        <div className="section-head">
          <div className="section-eyebrow">Architecture & Workflow</div>
          <h2 className="section-h2">Engineered for Flawless Execution</h2>
          <p className="section-desc">
            No meeting bots joining your call, no laggy cloud relay, and zero risk of proctor detection.
          </p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number-tag">1</div>
            <h3 className="step-title">Direct Audio Loopback</h3>
            <p className="step-body">
              Keter intercepts incoming sound directly from your default Windows audio playback driver. Whether you are using AirPods or internal speakers, the audio stream is transcribed locally with zero acoustic echo.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number-tag">2</div>
            <h3 className="step-title">Instant Structured Prompter</h3>
            <p className="step-body">
              The moment the interviewer pauses, Keter analyzes your grounded resume and target JD to produce structured STAR answers, algorithmic complexities, and clean code in under 300 milliseconds.
            </p>
          </div>

          <div className="step-card">
            <div className="step-number-tag">3</div>
            <h3 className="step-title">Hardware-Level Invisibility</h3>
            <p className="step-body">
              Using native Windows Desktop Window Manager (DWM) exclusions, Keter’s window is excluded from the OS screen capture pipeline. Share your entire desktop on Zoom or Teams with absolute peace of mind.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
         INTERACTIVE AUDIO LOOPBACK TESTER
         ============================================================ */}
      <section id="tester" className="section-container">
        <div className="section-head">
          <div className="section-eyebrow">Interactive Simulator</div>
          <h2 className="section-h2">Test Audio Loopback In Real-Time</h2>
          <p className="section-desc">
            See how Keter's audio engine monitors sound levels to capture interviewer speech with zero threshold latency.
          </p>
        </div>

        <div className="audio-tester-container">
          <div className="audio-tester-left">
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>
              Simulate Live Call Audio Feed
            </h3>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              During your interview, Keter's native loopback listener runs continuously in the background. Press the button to simulate incoming voice activity and watch the audio capture meters respond.
            </p>

            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={toggleAudioTest}
                className="btn-test-mic"
              >
                {isTestingAudio ? <MicOff size={15} /> : <Mic size={15} />}
                <span>{isTestingAudio ? 'Stop Audio Simulation' : 'Start Audio Loopback Simulation'}</span>
              </button>
            </div>
          </div>

          <div className="audio-tester-meter-box">
            <div className="meter-header-row">
              <span>Driver: <strong>Windows WASAPI Loopback</strong></span>
              <span style={{ color: isTestingAudio ? '#059669' : '#64748b' }}>
                {isTestingAudio ? '● Streaming Audio' : 'Standby'}
              </span>
            </div>

            <div className="meter-visualizer-bars">
              {Array.from({ length: 24 }).map((_, i) => {
                const threshold = (i / 24) * 100;
                const isActive = isTestingAudio && audioLevel >= threshold;
                const barHeight = isActive ? Math.max(8, Math.min(34, (audioLevel / 100) * 34)) : 6;
                return (
                  <div
                    key={i}
                    className={`meter-bar ${isActive ? 'active' : ''}`}
                    style={{ height: `${barHeight}px` }}
                  />
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
              <span>Noise Gate: -42dB</span>
              <span>Buffer Latency: <strong>4.2ms</strong></span>
              <span>Status: <strong>Exclusive Capture</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
         STEALTH VERIFICATION TABLE
         ============================================================ */}
      <section id="stealth" className="section-container">
        <div className="section-head">
          <div className="section-eyebrow">Zero Detection Guarantee</div>
          <h2 className="section-h2">Why Traditional Tools Get Caught</h2>
          <p className="section-desc">
            Browser extensions, second monitors, and meeting bot plugins are easily flagged by interview proctors.
          </p>
        </div>

        <div className="stealth-table-wrapper">
          <table className="stealth-table">
            <thead>
              <tr>
                <th>Interview Scenario</th>
                <th>Traditional AI Tools</th>
                <th>Keter Stealth Copilot</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Full Screen Share (Zoom / Teams / Meet)</strong></td>
                <td><span className="table-badge-risk">❌ Visible</span> Shows UI overlays in shared feed</td>
                <td><span className="table-badge-safe">✓ 100% Invisible</span> Stripped via DWM Exclusion</td>
              </tr>
              <tr>
                <td><strong>Meeting Participant List</strong></td>
                <td><span className="table-badge-risk">❌ Flags Alert</span> Joins as third-party AI bot/plugin</td>
                <td><span className="table-badge-safe">✓ Invisible</span> 0 bot attendees, runs purely client-side</td>
              </tr>
              <tr>
                <td><strong>Headphone & Speaker Audio</strong></td>
                <td><span className="table-badge-risk">❌ Echo Risk</span> Requires open mic or noisy speakers</td>
                <td><span className="table-badge-safe">✓ Loopback</span> Intercepts driver audio with 0 echo</td>
              </tr>
              <tr>
                <td><strong>Taskbar & Alt+Tab Switcher</strong></td>
                <td><span className="table-badge-risk">❌ Exposed</span> Visible window thumbnail on switch</td>
                <td><span className="table-badge-safe">✓ Stealth</span> Hidden from taskbar and Alt+Tab list</td>
              </tr>
              <tr>
                <td><strong>Complex Screen Questions (Alt+S)</strong></td>
                <td><span className="table-badge-risk">❌ Manual</span> Candidate must re-type problem statement</td>
                <td><span className="table-badge-safe">✓ Instant OCR</span> Press Alt+S to solve diagrams & code</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ============================================================
         FEATURES GRID
         ============================================================ */}
      <section className="section-container">
        <div className="section-head">
          <div className="section-eyebrow">Comprehensive Toolkit</div>
          <h2 className="section-h2">Engineered for Technical Rounds</h2>
        </div>

        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Volume2 size={18} />
            </div>
            <h4 className="feature-heading">System Audio Loopback</h4>
            <p className="feature-body">
              Transcribes interviewer speech cleanly from your system audio, eliminating background noise or room echo.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Cpu size={18} />
            </div>
            <h4 className="feature-heading">Instant Screen Capture (Alt+S)</h4>
            <p className="feature-body">
              Press Alt+S to instantly capture complex coding questions, diagrams, or problem statements from any interview tab.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Folder size={18} />
            </div>
            <h4 className="feature-heading">Isolated Project Workspaces</h4>
            <p className="feature-body">
              Each company interview has its own dedicated JD, resume context, mode, and history. Never mix company contexts.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Lock size={18} />
            </div>
            <h4 className="feature-heading">100% Client-Side Privacy</h4>
            <p className="feature-body">
              Zero audio is ever stored on external servers. All speech-to-text and AI prompt context remain strictly under your control.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Smartphone size={18} />
            </div>
            <h4 className="feature-heading">Air-Gapped Mobile Teleprompter</h4>
            <p className="feature-body">
              Scan a QR code from any phone. Mount phone under your webcam for natural eye contact with zero app install needed.
            </p>
          </div>

          <div className="feature-box">
            <div className="feature-icon-wrapper">
              <Zap size={18} />
            </div>
            <h4 className="feature-heading">Emergency Panic Hide (Esc)</h4>
            <p className="feature-body">
              Press Escape or Ctrl+Shift+X at any time to instantly kill all overlays and clear your screen in less than 50ms.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================
         PRICING SECTION
         ============================================================ */}
      <section id="pricing" className="section-container">
        <div className="section-head">
          <div className="section-eyebrow">Fair & Transparent</div>
          <h2 className="section-h2">Zero Monthly Subscription Traps</h2>
          <p className="section-desc">
            Other tools charge $60–$100 every single month even when you aren't interviewing. Keter gives you your first session 100% free, then single 24-hour passes for just ₹99.
          </p>
        </div>

        <div className="pricing-cards-container">
          {/* Free 1st Project Card */}
          <div className="pricing-card">
            <div>
              <div className="pricing-plan-name">First Interview Project</div>
              <div className="pricing-amount">
                ₹0 <span className="pricing-unit">/ 1st project</span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '8px 0 0' }}>
                Complete trial. Test your audio loopback, connect your mobile teleprompter, and ace your initial interview round.
              </p>

              <div style={{ height: '1px', background: '#e2e8f0', margin: '20px 0' }} />

              <ul className="pricing-bullets-list">
                <li><CheckCircle size={15} color="#059669" /> 1 Full 24-Hour Interview Project</li>
                <li><CheckCircle size={15} color="#059669" /> No credit card or payment required</li>
                <li><CheckCircle size={15} color="#059669" /> STAR, Technical & System Design Modes</li>
                <li><CheckCircle size={15} color="#059669" /> Instant Screen Question Capture (Alt+S)</li>
                <li><CheckCircle size={15} color="#059669" /> 100% Invisible on Zoom / Teams / Meet</li>
              </ul>
            </div>

            <button type="button" onClick={handleDownload} className="btn-cta-secondary" style={{ justifyContent: 'center', width: '100%' }}>
              <Download size={14} /> Download & Start Free
            </button>
          </div>

          {/* Featured ₹99 Session Pass */}
          <div className="pricing-card featured">
            <div className="pricing-pill-badge">Most Popular • Pay As You Interview</div>
            <div>
              <div className="pricing-plan-name" style={{ color: '#2563eb' }}>Additional Project Passes</div>
              <div className="pricing-amount">
                ₹99 <span className="pricing-unit">/ 24h pass</span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '8px 0 0' }}>
                Buy only when you have an interview scheduled. Timer starts only when you click Activate.
              </p>

              <div style={{ height: '1px', background: '#e2e8f0', margin: '20px 0' }} />

              <ul className="pricing-bullets-list">
                <li><CheckCircle size={15} color="#2563eb" /> 1 Dedicated 24h Interview Session Pass</li>
                <li><CheckCircle size={15} color="#2563eb" /> Timer starts ONLY when activated</li>
                <li><CheckCircle size={15} color="#2563eb" /> Unactivated passes never expire</li>
                <li><CheckCircle size={15} color="#2563eb" /> Isolated JD Context & Resume Grounding</li>
                <li><CheckCircle size={15} color="#2563eb" /> Instant Razorpay UPI (GPay, PhonePe, Paytm)</li>
              </ul>
            </div>

            <button type="button" onClick={handleDownload} className="btn-cta-primary" style={{ justifyContent: 'center', width: '100%' }}>
              <Download size={14} /> Download for Windows
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
         FAQ SECTION
         ============================================================ */}
      <section id="faq" className="section-container">
        <div className="section-head">
          <div className="section-eyebrow">FAQ</div>
          <h2 className="section-h2">Frequently Asked Questions</h2>
        </div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="faq-item">
                <button
                  type="button"
                  className="faq-toggle-btn"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                >
                  <span>{item.q}</span>
                  {isExpanded ? <ChevronUp size={16} color="#2563eb" /> : <ChevronDown size={16} color="#64748b" />}
                </button>
                {isExpanded && <div className="faq-answer-pane">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================
         FINAL CTA BANNER
         ============================================================ */}
      <section className="cta-banner-wrapper">
        <div className="cta-box">
          <h2 className="cta-heading">
            Your Dream Offer is One Interview Away.
          </h2>
          <p className="cta-sub">
            Join engineers and engineering leaders using Keter to interview with total confidence.
          </p>

          <div>
            <button
              type="button"
              onClick={handleDownload}
              className="btn-cta-white"
            >
              <Download size={16} />
              <span>Download Keter for Windows (.exe)</span>
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '16px' }}>
            Windows 10 / 11 (64-bit) • Size: ~65 MB • Instant Setup
          </div>
        </div>

        {/* Contact Section */}
        <div className="contact-strip">
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Official Support & Inquiries
          </div>
          <h4 style={{ fontSize: '18px', fontWeight: 800, margin: '6px 0', color: '#0f172a' }}>
            Need Custom Setup or Have Questions?
          </h4>
          <p style={{ fontSize: '13px', color: '#475569', margin: '0 auto', maxWidth: '480px' }}>
            Our engineering team is available 24/7 to assist with interview preparation and audio setup:
          </p>
          <a
            href="mailto:keterai26@gmail.com?subject=Keter%20AI%20Inquiry%20/%20Support"
            className="contact-email-link"
          >
            <Mail size={14} />
            <span>keterai26@gmail.com</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={16} color="#0f172a" />
          <span style={{ color: '#0f172a', fontWeight: 700 }}>KETER COPILOT</span>
          <span>— Stealth Real-Time Interview Intelligence</span>
        </div>

        <div style={{ fontSize: '13px', color: '#475569' }}>
          Contact Support: <a href="mailto:keterai26@gmail.com" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>keterai26@gmail.com</a>
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
