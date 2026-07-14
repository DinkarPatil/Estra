'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, TrendingUp, AlertTriangle, Zap, ArrowRight, X,
  type LucideIcon,
} from 'lucide-react';

type InsightTone = 'opportunity' | 'alert' | 'signal';

type Insight = {
  id: string;
  tone: InsightTone;
  icon: LucideIcon;
  label: string;
  body: string;
  cta: string;
};

const INSIGHTS: Insight[] = [
  {
    id: 'velocity-up',
    tone: 'opportunity',
    icon: TrendingUp,
    label: 'Opportunity',
    body: 'Azure Heights velocity up 23% this week — AI suggests a 4.2% price increase on remaining 70 units.',
    cta: 'Review pricing',
  },
  {
    id: 'demand-shift',
    tone: 'signal',
    icon: Zap,
    label: 'Demand Signal',
    body: 'Skyline Tower search volume increased 41% in Downtown Dubai. Consider accelerating pre-launch timeline.',
    cta: 'View demand map',
  },
  {
    id: 'risk-flag',
    tone: 'alert',
    icon: AlertTriangle,
    label: 'Risk Alert',
    body: 'Green Valley inventory at 79% sold — forecast exhaustion in 42 days, below target 60-day buffer.',
    cta: 'Inventory details',
  },
];

const TONE_STYLES: Record<InsightTone, { dot: string; label: string }> = {
  opportunity: { dot: 'bg-emerald-500', label: 'text-emerald-700' },
  alert:       { dot: 'bg-amber-500',   label: 'text-amber-700' },
  signal:      { dot: 'bg-stone-500',    label: 'text-stone-700' },
};

const AUTO_ROTATE_MS = 7000;

export function InsightStrip() {
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % INSIGHTS.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(t);
  }, [dismissed]);

  if (dismissed) return null;

  const insight = INSIGHTS[index];
  const Icon = insight.icon;
  const tone = TONE_STYLES[insight.tone];

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50 px-5 py-3.5">
      {/* AI icon */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-stone-600 shadow-[0_1px_2px_rgba(31,24,20,0.04)]">
        <Sparkles className="h-4 w-4" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                <span className={`hidden sm:inline whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.10em] ${tone.label}`}>
                  {insight.label}
                </span>
              </div>
              <span className="hidden h-3.5 w-px bg-stone-200 sm:block" />
              <div className="flex min-w-0 items-center gap-2">
                <Icon className="h-3.5 w-3.5 flex-shrink-0 text-stone-500" />
                <p className="min-w-0 truncate text-[13px] text-stone-700">
                  {insight.body}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="group/cta hidden flex-shrink-0 items-center gap-1.5 rounded-lg bg-stone-500 px-3.5 py-1.5 text-[11.5px] font-semibold text-white shadow-[0_1px_2px_rgba(139,115,85,0.25)] transition-all duration-150 hover:-translate-y-px hover:bg-stone-600 hover:shadow-[0_4px_12px_rgba(139,115,85,0.25)] md:inline-flex"
            >
              {insight.cta}
              <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover/cta:translate-x-0.5" />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Pager dots + dismiss */}
      <div className="flex flex-shrink-0 items-center gap-2.5">
        <div className="flex items-center gap-1">
          {INSIGHTS.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show insight ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1 rounded-full transition-all duration-150 ${
                i === index
                  ? 'w-4 bg-stone-500'
                  : 'w-1 bg-stone-200 hover:bg-stone-300'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Dismiss insights"
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-stone-400 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
