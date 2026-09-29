import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  Folder,
  Mic,
  Camera,
  Shield,
  Smartphone,
  Sparkles,
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  X,
  User,
  Sliders,
  Send,
  HelpCircle,
  Zap,
} from 'lucide-react';

const TOUR_STEPS = [
  {
    target: 'project-switcher',
    title: 'Isolated Interview Projects & Modes',
    subtitle: 'Ground every AI answer in your actual resume & target job description',
    badge: 'Context Grounding',
    pointingAt: 'Project Switcher Dropdown (Top-Left Header)',
    icon: Folder,
    color: '#38bdf8',
    placement: 'bottom',
    hotkey: 'Alt + C (Reset Session)',
    why: 'Prevents the AI from giving robotic, generic answers. Every response is grounded in your real past companies, system architecture patterns, and key achievements.',
    how: [
      'Click here to create a separate project for each company (e.g. "Google Senior Backend").',
      'Paste the Job Description and your Resume summary into the project config.',
      'Select from 5 Prompt Modes (Architecture, STAR Behavioral, Live Coding, Meeting, or Custom LLM).',
    ],
    proTip: 'Create projects before your interview starts so you never lose context between interview rounds.',
  },
  {
    target: 'audio-controls',
    title: 'Dual Audio Ear (Mic + System Loopback)',
    subtitle: 'Hands-free automatic listening from both your mic and interviewer speakers',
    badge: 'Dual Audio Ear',
    pointingAt: 'Microphone & Meeting Speaker Buttons (Top Center)',
    icon: Mic,
    color: '#10b981',
    placement: 'bottom',
    hotkey: 'Alt + M (Toggle Mic)',
    why: 'You should never type during an interview. Keter listens to both what you say and what the interviewer asks in crystal-clear real time.',
    how: [
      'Left Mic button listens to your own voice and logs candidate answers.',
      'Right Speaker button captures the interviewer speaking through Zoom, Teams, or Google Meet via Windows audio loopback.',
      'Zero audio cables or virtual soundboards needed — completely plug-and-play.',
    ],
    proTip: 'Turn on Meeting Loopback as soon as the interviewer joins the call for automatic live question detection.',
  },
  {
    target: 'screen-capture',
    title: 'Screen OCR & Problem Solver',
    subtitle: 'One-touch stealth snapshot for MCQs, LeetCode, and architecture diagrams',
    badge: 'Vision & OCR',
    pointingAt: 'Screen Snapshot & "Get Q" Buttons (Top Center)',
    icon: Camera,
    color: '#f472b6',
    placement: 'bottom',
    hotkey: 'Alt + S (Stealth Snapshot)',
    why: 'Instantly extract coding questions and online test problems without slow, suspicious copy-pasting or switching browser tabs.',
    how: [
      'Press Alt+S anytime to silently capture an OCR snapshot of whatever is on your screen.',
      'For long problem statements, scroll down and press Alt+S again to buffer multiple slices.',
      'Click "Get Q" to stitch all slices together and generate the complete question and optimal code.',
    ],
    proTip: 'Buffer up to 5 slices for lengthy LeetCode descriptions with examples and test constraints.',
  },
  {
    target: 'stealth-shield-status',
    title: 'Screen Share Invisibility (Always ON)',
    subtitle: '100% hidden from Zoom, Microsoft Teams & Google Meet screen shares',
    badge: 'Stealth Shield (Auto-ON)',
    pointingAt: 'Shield Status Badge & Opacity (Top Bar)',
    icon: Shield,
    color: '#10b981',
    placement: 'bottom',
    hotkey: 'Alt + K (Toggle Hide)  /  F9 (Camouflage)',
    why: 'When interviewers ask you to share your screen or code in an online IDE, they will never see Keter or know an AI assistant is running.',
    how: [
      'The header badge shows your live shield status (SHIELD ON by default on startup).',
      'Meeting apps record right through Keter — only your desktop, browser, and code editor are broadcast.',
      'Click the badge or open Settings (Sliders icon) → Stealth & Display to view preferences.',
      'Click the eye icon to cycle opacity (100% down to 0% ghost mode), or press Alt+K anytime.',
    ],
    proTip: 'Invisibility is always ON by default. You can share your entire desktop screen with complete confidence.',
  },
  {
    target: 'phone-companion',
    title: 'Air-Gapped Mobile Teleprompter',
    subtitle: 'Maintain 100% natural eye contact with your webcam without looking sideways',
    badge: 'Pro Teleprompter',
    pointingAt: '"Phone" Companion Button (Top-Right Header)',
    icon: Smartphone,
    color: '#06b6d4',
    placement: 'bottom',
    hotkey: 'Zero Install QR',
    why: 'Reading answers from your laptop screen causes unnatural eye shifts. Placing your phone right underneath your webcam ensures 100% natural eye contact.',
    how: [
      'Click the Phone button to reveal your private, encrypted QR code.',
      'Scan with your smartphone camera (iPhone or Android) — no app download required.',
      'All AI responses and code snippets stream live to your phone in real time.',
    ],
    proTip: 'Mount your phone using a simple desk stand directly below your laptop webcam.',
  },
  {
    target: 'profile-btn',
    title: 'Candidate Profile & User Manual',
    subtitle: 'Complete keyboard shortcut directory, license access & email support',
    badge: 'Help & Shortcuts',
    pointingAt: '"Profile" Button (Top-Right Header)',
    icon: User,
    color: '#eab308',
    placement: 'bottom',
    hotkey: 'User Manual & Keys',
    why: 'Everything you need in one place: all global keyboard shortcuts, step-by-step user guides, and dedicated support contact.',
    how: [
      'Click here to browse the complete User Manual with step-by-step workflows.',
      'View all global shortcut keys organized by category.',
      'Contact our team directly at keterai26@gmail.com for priority help.',
    ],
    proTip: 'You can replay this interactive tour anytime from the User Manual tab!',
  },
  {
    target: 'panic-btn',
    title: 'Emergency Panic Kill-Switch',
    subtitle: 'Instant emergency memory wipe and silent window termination',
    badge: 'Emergency Safe',
    pointingAt: 'Red "PANIC" Button (Top-Right Header)',
    icon: AlertOctagon,
    color: '#ef4444',
    placement: 'bottom',
    hotkey: 'Ctrl + Shift + X  /  Esc',
    why: 'Total emergency peace-of-mind if an interviewer unexpectedly asks to inspect your PC or take remote desktop control.',
    how: [
      'Click the red PANIC button or hit Ctrl+Shift+X (or Esc).',
      'All active audio listening stops immediately and live AI generation aborts.',
      'Keter vanishes from your screen and unloads from memory in under 50 milliseconds.',
    ],
    proTip: 'Use Alt+K for temporary hiding, or PANIC for instant emergency termination.',
  },
  {
    target: 'chat-conversation',
    title: 'Live AI Teleprompter Stream',
    subtitle: 'Structured, senior-level talking points and production-ready code',
    badge: 'Live Answers',
    pointingAt: 'Main Teleprompter Conversation Feed (Center)',
    icon: Sparkles,
    color: '#6366f1',
    placement: 'center',
    hotkey: 'Ctrl + Shift + Space (Ask AI)',
    why: 'Technical interviews demand structured articulation with trade-offs, scalability metrics, and clean code with complexity analysis.',
    how: [
      'Bullet points and code stream live as the interviewer talks.',
      'Click any code block to copy instantly with time & space complexities.',
      'Click Regenerate to explore alternative architectural perspectives.',
    ],
    proTip: 'Skim the bullet points to frame your verbal response before diving into code.',
  },
  {
    target: 'manual-input',
    title: 'Manual Question Input & Follow-ups',
    subtitle: 'Type custom problem statements and ask immediate follow-up clarifications',
    badge: 'Direct Control',
    pointingAt: 'Bottom Input & Action Bar',
    icon: Send,
    color: '#14b8a6',
    placement: 'top',
    hotkey: 'Enter (Send)',
    why: 'Gives you total flexibility to paste specific problem statements or guide the AI with additional interviewer hints.',
    how: [
      'Type or paste any question into the input field and press Enter.',
      'Press Shift+Enter to write multi-line prompts or paste code snippets.',
      'Click "+ You" to log your own candidate answers for persistent session memory.',
    ],
    proTip: 'When an interviewer offers a hint, type it here to immediately steer the AI solution!',
  },
];

export function OnboardingTour({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const [arrowCoords, setArrowCoords] = useState(null);
  const popoverRef = useRef(null);

  const step = TOUR_STEPS[currentStep] || TOUR_STEPS[0];
  const StepIcon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  // Calculate and align spotlight, pointer beacon, and popover card
  const updatePositions = () => {
    if (!isOpen) return;

    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      try {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      } catch (_) {}

      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });

      const popoverWidth = Math.min(480, window.innerWidth - 32);
      const targetCenterX = rect.left + rect.width / 2;

      if (step.placement === 'bottom') {
        const top = Math.min(window.innerHeight - 340, rect.bottom + 14);
        const left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, targetCenterX - popoverWidth / 2));
        const maxHeight = Math.max(260, window.innerHeight - top - 16);

        setPopoverPos({
          top: `${Math.max(12, top)}px`,
          bottom: 'auto',
          left: `${left}px`,
          width: `${popoverWidth}px`,
          maxHeight: `${maxHeight}px`,
          transform: 'none',
        });

        setArrowCoords({
          fromX: Math.max(24, Math.min(window.innerWidth - 24, targetCenterX)),
          fromY: top,
          targetX: targetCenterX,
          targetY: rect.bottom,
          direction: 'up',
        });
      } else if (step.placement === 'top') {
        const bottom = Math.max(12, window.innerHeight - rect.top + 26);
        const left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, targetCenterX - popoverWidth / 2));
        const maxHeight = Math.max(260, window.innerHeight - bottom - 16);

        setPopoverPos({
          top: 'auto',
          bottom: `${bottom}px`,
          left: `${left}px`,
          width: `${popoverWidth}px`,
          maxHeight: `${maxHeight}px`,
          transform: 'none',
        });

        setArrowCoords({
          fromX: Math.max(24, Math.min(window.innerWidth - 24, targetCenterX)),
          fromY: rect.top - 16,
          targetX: targetCenterX,
          targetY: rect.top,
          direction: 'down',
        });
      } else {
        // Center placement (e.g. for full chat thread)
        setPopoverPos({
          top: '50%',
          bottom: 'auto',
          left: '50%',
          width: `${popoverWidth}px`,
          maxHeight: `${Math.min(window.innerHeight - 32, 500)}px`,
          transform: 'translate(-50%, -50%)',
        });
        setArrowCoords(null);
      }
    } else {
      setTargetRect(null);
      setArrowCoords(null);
      setPopoverPos({
        top: '50%',
        left: '50%',
        width: `${Math.min(480, window.innerWidth - 32)}px`,
        transform: 'translate(-50%, -50%)',
      });
    }
  };

  useLayoutEffect(() => {
    updatePositions();
    const animId = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animId);
  }, [currentStep, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('keter_tour_completed', 'true');
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    localStorage.setItem('keter_tour_completed', 'true');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999990,
        pointerEvents: 'auto',
      }}
    >
      <style>{`
        @keyframes keter-tour-pulse {
          0%, 100% {
            box-shadow: 0 0 0 9999px rgba(3, 7, 18, 0.84), 0 0 20px ${step.color}aa, inset 0 0 10px ${step.color}50;
            border-color: ${step.color};
          }
          50% {
            box-shadow: 0 0 0 9999px rgba(3, 7, 18, 0.84), 0 0 38px ${step.color}, inset 0 0 22px ${step.color}90;
            border-color: #ffffff;
          }
        }
        @keyframes keter-beacon-bounce-up {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes keter-beacon-bounce-down {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
        @keyframes keter-beacon-ping {
          0% { transform: scale(0.95); opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>

      {/* 1. Dynamic Cutout Spotlight Box around Target Feature */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: Math.max(0, targetRect.top - 5),
            left: Math.max(0, targetRect.left - 5),
            width: Math.max(24, targetRect.width + 10),
            height: Math.max(24, targetRect.height + 10),
            borderRadius: '12px',
            border: `2px solid ${step.color}`,
            pointerEvents: 'none',
            zIndex: 999992,
            animation: 'keter-tour-pulse 2.2s infinite ease-in-out',
            transition: 'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease',
          }}
        >
          {/* Radar Ping Ripple */}
          <div
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '18px',
              border: `2px solid ${step.color}`,
              animation: 'keter-beacon-ping 1.8s infinite cubic-bezier(0, 0, 0.2, 1)',
              pointerEvents: 'none',
            }}
          />

          {/* Corner Focus Brackets */}
          <div style={{ position: 'absolute', top: '-4px', left: '-4px', width: '10px', height: '10px', borderTop: `3px solid #ffffff`, borderLeft: `3px solid #ffffff`, borderRadius: '3px 0 0 0' }} />
          <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', borderTop: `3px solid #ffffff`, borderRight: `3px solid #ffffff`, borderRadius: '0 3px 0 0' }} />
          <div style={{ position: 'absolute', bottom: '-4px', left: '-4px', width: '10px', height: '10px', borderBottom: `3px solid #ffffff`, borderLeft: `3px solid #ffffff`, borderRadius: '0 0 0 3px' }} />
          <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '10px', height: '10px', borderBottom: `3px solid #ffffff`, borderRight: `3px solid #ffffff`, borderRadius: '0 0 3px 0' }} />
        </div>
      )}

      {/* Fallback backdrop when target is not localized */}
      {!targetRect && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(3, 7, 18, 0.86)',
            backdropFilter: 'blur(8px)',
            zIndex: 999991,
          }}
        />
      )}

      {/* 2. Floating Animated Directional Pointing Badge & Arrow */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: step.placement === 'bottom'
              ? `${targetRect.bottom + 8}px`
              : step.placement === 'top'
              ? `${Math.max(6, targetRect.top - 22)}px`
              : `${targetRect.top + 16}px`,
            left: `${Math.max(16, Math.min(window.innerWidth - 16, targetRect.left + targetRect.width / 2))}px`,
            transform: 'translateX(-50%)',
            zIndex: 999996,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            animation: step.placement === 'bottom' ? 'keter-beacon-bounce-up 1.6s infinite ease-in-out' : 'keter-beacon-bounce-down 1.6s infinite ease-in-out',
          }}
        >
          {step.placement === 'bottom' && (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderBottom: `9px solid ${step.color}`,
                filter: `drop-shadow(0 -2px 6px ${step.color})`,
              }}
            />
          )}

          <div
            style={{
              padding: '3px 10px',
              backgroundColor: '#0a0e1a',
              border: `1.5px solid ${step.color}`,
              borderRadius: '20px',
              boxShadow: `0 4px 16px rgba(0,0,0,0.8), 0 0 14px ${step.color}60`,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: step.color, boxShadow: `0 0 6px ${step.color}` }} />
            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              POINTING HERE: {step.pointingAt.split('(')[0].trim()}
            </span>
          </div>

          {step.placement === 'top' && (
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: `9px solid ${step.color}`,
                filter: `drop-shadow(0 2px 6px ${step.color})`,
              }}
            />
          )}
        </div>
      )}

      {/* 3. Floating Interactive Explanation Popover Card */}
      <div
        ref={popoverRef}
        style={{
          position: 'fixed',
          ...popoverPos,
          backgroundColor: '#0c101c',
          border: `1.5px solid ${step.color}66`,
          borderRadius: '20px',
          boxShadow: `0 28px 70px rgba(0, 0, 0, 0.85), 0 0 50px ${step.color}25`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999995,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Progress Bar Line */}
        <div style={{ width: '100%', height: '3px', backgroundColor: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div
            style={{
              height: '100%',
              width: `${((currentStep + 1) / TOUR_STEPS.length) * 100}%`,
              background: `linear-gradient(90deg, ${step.color}, #3b82f6)`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Header Bar */}
        <div
          style={{
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            flexShrink: 0,
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: step.color,
                backgroundColor: `${step.color}18`,
                border: `1px solid ${step.color}40`,
                padding: '2px 9px',
                borderRadius: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {step.badge}
            </span>
            <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: 600 }}>
              Feature {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {step.hotkey && (
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {step.hotkey}
              </span>
            )}
            <button
              onClick={handleSkip}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '6px',
                transition: 'color 0.15s ease',
              }}
              title="Skip tour"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto',
            flex: '1 1 auto',
            minHeight: 0,
          }}
        >
          {/* Title & Icon Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: `${step.color}18`,
                border: `1px solid ${step.color}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 16px ${step.color}20`,
              }}
            >
              <StepIcon size={20} color={step.color} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.3 }}>
                {step.title}
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                {step.subtitle}
              </p>
            </div>
          </div>

          {/* Pointing Location Tag */}
          <div
            style={{
              padding: '5px 10px',
              backgroundColor: `${step.color}10`,
              border: `1px solid ${step.color}35`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={12} color={step.color} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>
              Pointing To: <strong style={{ color: step.color }}>{step.pointingAt}</strong>
            </span>
          </div>

          {/* Why Section */}
          <div
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.45)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: step.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
              💡 Why This Matters in Interviews:
            </div>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.45 }}>
              {step.why}
            </p>
          </div>

          {/* How To Use Checklist */}
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              🚀 How To Use It:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {step.how.map((point, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                  <CheckCircle2 size={13} color={step.color} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '11.5px', color: '#e2e8f0', lineHeight: 1.4 }}>
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tip */}
          {step.proTip && (
            <div style={{ fontSize: '10.5px', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px dashed rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '5px 10px' }}>
              ⭐ <strong>Pro Tip:</strong> {step.proTip}
            </div>
          )}
        </div>

        {/* Footer Navigation Bar - Always Visible */}
        <div
          style={{
            padding: '11px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          {/* Step Indicator Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                style={{
                  width: idx === currentStep ? '22px' : '7px',
                  height: '7px',
                  borderRadius: '4px',
                  backgroundColor: idx === currentStep ? step.color : 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                title={`Go to: ${s.title}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#cbd5e1',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                background: `linear-gradient(135deg, ${step.color}, #2563eb)`,
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: `0 4px 14px ${step.color}50`,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{isLast ? 'Complete Tour 🚀' : 'Next Feature'}</span>
              {!isLast && <ArrowRight size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
