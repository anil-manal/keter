import React from 'react';

export function AudioVisualizer({ level = 0, isListening = false }) {
  const bars = 5;
  // Calculate dynamic bar heights based on level (0-100)
  return (
    <div className="audio-visualizer-bar" title={isListening ? "Audio Input Active" : "Audio Paused"}>
      {Array.from({ length: bars }).map((_, idx) => {
        const threshold = (idx + 1) * (100 / bars);
        const isActive = isListening && level >= threshold - 15;
        const height = isActive ? Math.max(8, Math.min(18, (level / 100) * 18 * (1 + (idx % 2) * 0.2))) : 4;

        return (
          <div
            key={idx}
            className={`visualizer-pip ${isActive ? 'active' : ''}`}
            style={{ height: `${height}px` }}
          />
        );
      })}
    </div>
  );
}
