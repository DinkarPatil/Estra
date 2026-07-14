'use client';
import { useEffect, useState } from 'react';
import { Brain } from 'lucide-react';

interface AIThinkingStateProps {
  messages?: string[];
  className?: string;
}

const DEFAULT_MESSAGES = [
  'Analyzing market data...',
  'Evaluating risk factors...',
  'Finding undervalued deals...',
  'Calculating ROI projections...',
  'Generating insights...',
];

function AIThinkingState({ messages = DEFAULT_MESSAGES, className }: AIThinkingStateProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        setFade(true);
      }, 200);
    }, 2400);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
      <div className="shrink-0" style={{ position: 'relative' }}>
        <Brain
          className="h-5 w-5 text-[#8B7355]"
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            background: 'rgba(139,115,85, 0.15)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          className="text-[var(--fg-secondary)] text-sm"
          style={{
            opacity: fade ? 1 : 0,
            transition: 'opacity 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {messages[messageIndex]}
        </span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="bg-[#8B7355]"
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

export { AIThinkingState };
