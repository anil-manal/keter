import React, { useEffect, useRef, useState } from 'react';
import { 
  Mic, User, Sparkles, Copy, Check, RotateCcw, 
  Trash2, ArrowDown, Download, Volume2, Shield, Edit3, Camera 
} from 'lucide-react';

export function ChatConversation({
  messages = [],
  interimSpeech = '',
  onManualAskInterim,
  onReaskQuestion,
  onRegenerateAnswer,
  onClearHistory,
  onUpdateMessage,
  isGenerating = false,
  isMiniMode = false,
}) {
  const scrollRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Auto-scroll to bottom as new messages or streaming tokens arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimSpeech, autoScroll]);

  const handleCopy = (id, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = () => {
    if (messages.length === 0) return;
    const exportText = messages.map(m => {
      const speaker = m.role === 'interviewer' ? 'INTERVIEWER' : m.role === 'user' ? 'YOU (CANDIDATE)' : 'KETER COPILOT';
      return `[${m.timestamp || ''}] ${speaker}:\n${m.text}\n`;
    }).join('\n----------------------------------------\n\n');

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keter-interview-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render inline STAR badges, code snippets, and bold text for Keter answers
  const renderKeterFormattedText = (rawText) => {
    if (!rawText) return null;

    // Check for code blocks
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: rawText.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', lang: match[1] || 'code', content: match[2] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < rawText.length) {
      parts.push({ type: 'text', content: rawText.slice(lastIndex) });
    }

    return parts.map((part, pIdx) => {
      if (part.type === 'code') {
        return (
          <div key={pIdx} className="code-container" style={{ margin: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#94a3b8', fontSize: '11px' }}>
              <span>{part.lang.toUpperCase()}</span>
            </div>
            <pre style={{ margin: 0, fontSize: '13px', lineHeight: 1.45 }}>{part.content.trim()}</pre>
          </div>
        );
      }

      const lines = part.content.split('\n');
      return (
        <div key={pIdx} className="teleprompter-text">
          {lines.map((line, lIdx) => {
            if (!line.trim()) return <div key={lIdx} style={{ height: '4px' }} />;

            let formattedLine = line;
            let badge = null;

            if (line.includes('[S - Situation]')) {
              badge = <span className="star-badge badge-s">SITUATION</span>;
              formattedLine = line.replace(/\*\*\[S - Situation\]\*\*:?|\[S - Situation\]:?/, '');
            } else if (line.includes('[T - Task]')) {
              badge = <span className="star-badge badge-t">TASK</span>;
              formattedLine = line.replace(/\*\*\[T - Task\]\*\*:?|\[T - Task\]:?/, '');
            } else if (line.includes('[A - Action]')) {
              badge = <span className="star-badge badge-a">ACTION</span>;
              formattedLine = line.replace(/\*\*\[A - Action\]\*\*:?|\[A - Action\]:?/, '');
            } else if (line.includes('[R - Result]')) {
              badge = <span className="star-badge badge-r">RESULT</span>;
              formattedLine = line.replace(/\*\*\[R - Result\]\*\*:?|\[R - Result\]:?/, '');
            }

            return (
              <p key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                {badge}
                <span>{renderBoldInline(formattedLine)}</span>
              </p>
            );
          })}
        </div>
      );
    });
  };

  const renderBoldInline = (str) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const pieces = [];
    let last = 0;
    let m;
    while ((m = boldRegex.exec(str)) !== null) {
      if (m.index > last) pieces.push(str.substring(last, m.index));
      pieces.push(<strong key={m.index} style={{ color: '#38bdf8' }}>{m[1]}</strong>);
      last = m.index + m[0].length;
    }
    if (last < str.length) pieces.push(str.substring(last));
    return pieces.length > 0 ? pieces : str;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Top Conversation Toolbar */}
      {!isMiniMode && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: 'rgba(12, 16, 24, 0.95)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--text-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.04em' }}>CONVERSATION THREAD</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
              {messages.length} messages
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {messages.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  className="icon-btn no-drag"
                  title="Export Transcript"
                  style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                >
                  <Download size={12} />
                  <span>Export</span>
                </button>
                <button
                  onClick={onClearHistory}
                  className="icon-btn no-drag"
                  title="Clear Conversation"
                  style={{ padding: '3px 8px', fontSize: '11px', gap: '4px', color: '#f87171' }}
                >
                  <Trash2 size={12} />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Chat Scroll Viewport */}
      <div 
        ref={scrollRef}
        className="answer-viewport"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
        onScroll={(e) => {
          const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
          const isAtBottom = scrollHeight - scrollTop - clientHeight < 60;
          setAutoScroll(isAtBottom);
        }}
      >
        {messages.length === 0 && !interimSpeech && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '20px',
            gap: '10px',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#38bdf8',
            }}>
              <Mic size={22} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>Live Interview Copilot Active</div>
            <p style={{ fontSize: '12px', maxWidth: '420px', lineHeight: 1.5 }}>
              Interviewer questions will be captured live and answered by Keter in real time. 
              You can also log what You said or type questions directly below.
            </p>
          </div>
        )}

        {/* Message Cards */}
        {messages.map((msg) => {
          const isInterviewer = msg.role === 'interviewer';
          const isScreen = msg.role === 'screen' || msg.role === 'assessment';
          const isUser = msg.role === 'user';
          const isKeter = msg.role === 'keter';

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '10px',
                background: isInterviewer
                  ? 'rgba(15, 23, 42, 0.75)'
                  : isScreen
                  ? 'rgba(28, 16, 26, 0.85)'
                  : isUser
                  ? 'rgba(17, 34, 30, 0.75)'
                  : 'rgba(18, 24, 38, 0.85)',
                border: isInterviewer
                  ? '1px solid rgba(56, 189, 248, 0.35)'
                  : isScreen
                  ? '1px solid rgba(244, 114, 182, 0.45)'
                  : isUser
                  ? '1px solid rgba(52, 211, 153, 0.35)'
                  : '1px solid rgba(168, 85, 247, 0.35)',
                borderLeftWidth: '4px',
                borderLeftColor: isInterviewer ? '#38bdf8' : isScreen ? '#f472b6' : isUser ? '#34d399' : '#a855f7',
                padding: '10px 14px',
                position: 'relative',
                boxShadow: isKeter ? '0 4px 20px rgba(0, 0, 0, 0.4)' : isScreen ? '0 2px 14px rgba(236, 72, 153, 0.15)' : 'none',
              }}
            >
              {/* Message Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
                fontSize: '11px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isInterviewer && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#38bdf8',
                      fontWeight: 600,
                      background: 'rgba(56, 189, 248, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      <Mic size={12} />
                      INTERVIEWER
                    </span>
                  )}

                  {isScreen && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#f472b6',
                      fontWeight: 600,
                      background: 'rgba(236, 72, 153, 0.18)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      <Camera size={12} />
                      SCREEN QUESTION
                    </span>
                  )}

                  {isUser && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#34d399',
                      fontWeight: 600,
                      background: 'rgba(52, 211, 153, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      <User size={12} />
                      YOU (CANDIDATE)
                    </span>
                  )}

                  {isKeter && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#c084fc',
                      fontWeight: 700,
                      background: 'rgba(168, 85, 247, 0.18)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                    }}>
                      <Sparkles size={12} />
                      KETER COPILOT
                    </span>
                  )}

                  {isKeter && msg.mode && (
                    <span style={{
                      fontSize: '10px',
                      color: '#94a3b8',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase',
                    }}>
                      {msg.mode}
                    </span>
                  )}

                  {msg.timestamp && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                      {msg.timestamp}
                    </span>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {(isInterviewer || isScreen || isUser) && (
                    <button
                      onClick={() => {
                        setEditingId(msg.id);
                        setEditText(msg.text);
                      }}
                      className="icon-btn no-drag"
                      title="Edit this question"
                      style={{ padding: '2px 6px', fontSize: '10px', gap: '3px', color: '#94a3b8' }}
                    >
                      <Edit3 size={11} />
                      <span>Edit</span>
                    </button>
                  )}

                  {(isInterviewer || isScreen) && onReaskQuestion && (
                    <button
                      onClick={() => onReaskQuestion(msg.text)}
                      className="icon-btn no-drag"
                      title="Ask Keter this question"
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        gap: '3px',
                        color: '#090d16',
                        background: 'var(--accent-gradient)',
                        borderRadius: '4px',
                        border: 'none',
                        fontWeight: 700,
                      }}
                    >
                      <Sparkles size={11} color="#090d16" />
                      <span>Ask Keter</span>
                    </button>
                  )}

                  {isKeter && onRegenerateAnswer && !msg.isStreaming && (
                    <button
                      onClick={() => onRegenerateAnswer(msg)}
                      className="icon-btn no-drag"
                      title="Regenerate this answer"
                      style={{ padding: '2px 6px', fontSize: '10px', gap: '3px', color: '#c084fc' }}
                    >
                      <RotateCcw size={11} />
                      <span>Rerun</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="icon-btn no-drag"
                    title="Copy Text"
                    style={{ padding: '2px 6px', fontSize: '10px', gap: '3px' }}
                  >
                    {copiedId === msg.id ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div style={{ fontSize: '14px', lineHeight: 1.55, userSelect: 'text' }}>
                {editingId === msg.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                    <textarea
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto';
                          el.style.height = Math.max(220, Math.min(650, el.scrollHeight + 16)) + 'px';
                        }
                      }}
                      className="form-textarea"
                      style={{
                        width: '100%',
                        minHeight: '220px',
                        maxHeight: '75vh',
                        fontSize: '13px',
                        lineHeight: 1.5,
                        padding: '10px 12px',
                        background: 'rgba(10, 14, 22, 0.95)',
                        border: '1px solid #38bdf8',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        overflowY: 'auto',
                      }}
                      value={editText}
                      onChange={(e) => {
                        setEditText(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = Math.max(220, Math.min(650, e.target.scrollHeight + 16)) + 'px';
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="icon-btn"
                        style={{ padding: '4px 10px', fontSize: '11px', color: '#94a3b8' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateMessage) onUpdateMessage(msg.id, editText);
                          setEditingId(null);
                        }}
                        className="icon-btn"
                        style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8',
                          fontWeight: 600,
                        }}
                      >
                        Save
                      </button>
                      {(isInterviewer || isScreen) && onReaskQuestion && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onUpdateMessage) onUpdateMessage(msg.id, editText);
                            setEditingId(null);
                            onReaskQuestion(editText);
                          }}
                          className="icon-btn active"
                          style={{
                            padding: '4px 14px',
                            fontSize: '11px',
                            background: 'var(--accent-gradient)',
                            color: '#090d16',
                            fontWeight: 700,
                            border: 'none',
                            borderRadius: '6px',
                          }}
                        >
                          <Sparkles size={12} color="#090d16" />
                          <span>Save & Ask</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : isKeter ? (
                  <>
                    {renderKeterFormattedText(msg.text)}
                    {msg.isStreaming && (
                      <span className="streaming-cursor" style={{
                        display: 'inline-block',
                        width: '7px',
                        height: '14px',
                        background: '#00f2fe',
                        marginLeft: '4px',
                        verticalAlign: 'middle',
                        animation: 'pulse 0.8s infinite',
                      }} />
                    )}
                  </>
                ) : (
                  <p style={{ margin: 0, color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Incoming Speech Indicator (when Interviewer is actively speaking) */}
        {interimSpeech && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '8px',
            padding: '8px 12px',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8',
                animation: 'pulse 1s infinite',
              }} />
              <div style={{ fontSize: '12px', color: '#e0f2fe', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#38bdf8', marginRight: '6px' }}>Interviewer:</strong>
                "{interimSpeech}"
              </div>
            </div>

            {onManualAskInterim && (
              <button
                onClick={() => onManualAskInterim(interimSpeech)}
                className="icon-btn no-drag active"
                style={{
                  background: 'var(--accent-gradient)',
                  color: '#0a0e17',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '11px',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Sparkles size={11} />
                <span>Ask Now</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
