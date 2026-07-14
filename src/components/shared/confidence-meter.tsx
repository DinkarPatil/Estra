'use client';
import { useEffect, useState } from 'react';

interface ConfidenceMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

function ConfidenceMeter({ score, size = 80, strokeWidth = 6, label, sublabel, className }: ConfidenceMeterProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Color coding: Glimmora ≥80, amber 60-79, red <60
  const getColor = (s: number) => {
    if (s >= 80) return { stroke: '#8B7355', glow: 'rgba(139, 115, 85, 0.2)' };
    if (s >= 60) return { stroke: '#F59E0B', glow: 'rgba(245, 158, 11, 0.2)' };
    return { stroke: '#EF4444', glow: 'rgba(239, 68, 68, 0.2)' };
  };

  const color = getColor(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className={className} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-black/[0.06] dark:text-white/[0.06]"
          />
          {/* Score arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s ease-out',
              filter: `drop-shadow(0 0 4px ${color.glow})`,
            }}
          />
        </svg>
        {/* Center text */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{ fontSize: size * 0.28, fontWeight: 700, lineHeight: 1, color: color.stroke }}
          >
            {score}
          </span>
          <span
            className="text-[var(--fg-muted)]"
            style={{ fontSize: size * 0.12, fontWeight: 500, marginTop: 1 }}
          >
            /100
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[var(--fg)] text-xs font-semibold leading-tight text-center">{label}</span>
      )}
      {sublabel && (
        <span className="text-[var(--fg-muted)] text-[10px] leading-tight text-center">{sublabel}</span>
      )}
    </div>
  );
}

export { ConfidenceMeter };
