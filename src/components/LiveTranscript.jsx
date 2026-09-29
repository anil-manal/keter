import React from 'react';
import { MessageSquare, Sparkles } from 'lucide-react';

export function LiveTranscript({ transcripts = [], onManualTrigger }) {
  if (transcripts.length === 0) return null;

  return (
    <div style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'rgba(12, 16, 24, 0.6)',
      padding: '8px 16px',
      maxHeight: '110px',
      overflowY: 'auto',
      fontSize: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <MessageSquare size={12} /> Live Transcript Feed
        </span>
        {transcripts.length > 1 && onManualTrigger && (
          <button
            onClick={() => {
              const fullText = transcripts.slice(-5).map(t => t.text).join(' ').trim();
              if (fullText) onManualTrigger(fullText);
            }}
            className="icon-btn no-drag"
            title="Combine all recent sentences into one complete prompt"
            style={{ padding: '2px 8px', fontSize: '10px', gap: '4px', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', fontWeight: 600 }}
          >
            <Sparkles size={11} color="#38bdf8" />
            <span>Ask Combined Question ({transcripts.slice(-5).length} parts)</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {transcripts.slice(-3).map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ color: item.isFinal ? 'var(--text-primary)' : 'var(--text-secondary)', fontStyle: item.isFinal ? 'normal' : 'italic' }}>
              <strong style={{ color: '#38bdf8', marginRight: '6px', fontWeight: 600 }}>{item.speaker}:</strong>
              {item.text}
            </span>
            {item.isFinal && onManualTrigger && (
              <button
                onClick={() => onManualTrigger(item.text)}
                className="icon-btn no-drag"
                title="Force generate answer for this question"
                style={{ padding: '2px 5px', fontSize: '10px', gap: '3px' }}
              >
                <Sparkles size={11} color="#38bdf8" />
                <span>Ask</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
