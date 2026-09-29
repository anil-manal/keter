import React, { useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';

export function AnswerStream({ text, isStreaming, currentMode }) {
  const containerRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  // Auto-scroll to bottom as streaming tokens arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to format text with STAR badges and code blocks
  const renderFormattedContent = (rawText) => {
    if (!rawText) return null;

    // Check for code block ```
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
          <div key={pIdx} className="code-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#94a3b8', fontSize: '11px' }}>
              <span>{part.lang.toUpperCase()}</span>
            </div>
            <pre style={{ margin: 0 }}>{part.content.trim()}</pre>
          </div>
        );
      }

      // Render text paragraphs and replace STAR headers
      const lines = part.content.split('\n');
      return (
        <div key={pIdx} className="teleprompter-text">
          {lines.map((line, lIdx) => {
            if (!line.trim()) return <div key={lIdx} style={{ height: '6px' }} />;

            // Replace STAR badges
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
              <p key={lIdx} style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                {badge}
                <span>{renderBoldInline(formattedLine)}</span>
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Helper for inline **bold** text
  const renderBoldInline = (str) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const pieces = [];
    let last = 0;
    let m;
    while ((m = boldRegex.exec(str)) !== null) {
      if (m.index > last) pieces.push(str.substring(last, m.index));
      pieces.push(<strong key={m.index}>{m[1]}</strong>);
      last = m.index + m[0].length;
    }
    if (last < str.length) pieces.push(str.substring(last));
    return pieces;
  };

  return (
    <div className="answer-viewport" ref={containerRef}>
      {text ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
            <button
              onClick={handleCopy}
              className="icon-btn no-drag"
              title="Copy answer"
              style={{ fontSize: '11px', gap: '4px', padding: '3px 8px' }}
            >
              {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          {renderFormattedContent(text)}
          {isStreaming && (
            <span
              style={{
                display: 'inline-block',
                width: '6px',
                height: '14px',
                background: '#38bdf8',
                marginLeft: '4px',
                verticalAlign: 'middle',
                animation: 'pulse-dot 0.6s infinite',
              }}
            />
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '13px' }}>
          <p style={{ marginBottom: '6px' }}>🎙️ Listening for questions...</p>
          <p style={{ fontSize: '11px', opacity: 0.8 }}>
            Speak into your mic or play meeting audio. The AI will formulate your answer in real time.
          </p>
        </div>
      )}
    </div>
  );
}
