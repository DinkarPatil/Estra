'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, type LucideIcon } from 'lucide-react';

export type KpiAccent = 'blue' | 'emerald' | 'amber' | 'rose';

const ACCENT: Record<KpiAccent, { stroke: string; fillFrom: string; iconBg: string; iconFg: string }> = {
  blue:    { stroke: '#8B7355', fillFrom: 'rgba(139,115,85,0.12)',  iconBg: '#EDE7DF', iconFg: '#6F5C46' },
  emerald: { stroke: '#10B981', fillFrom: 'rgba(16,185,129,0.12)',  iconBg: '#ECFDF5', iconFg: '#059669' },
  amber:   { stroke: '#F59E0B', fillFrom: 'rgba(245,158,11,0.12)',  iconBg: '#FFFBEB', iconFg: '#D97706' },
  rose:    { stroke: '#EF4444', fillFrom: 'rgba(239,68,68,0.12)',   iconBg: '#FEF2F2', iconFg: '#DC2626' },
};

type SmartKpiProps = {
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  accent?: KpiAccent;
  spark: number[];
  formatValue?: (v: number) => string;
  counterTo?: number;
  /** Vertical hero variant (legacy) — taller card with big typography */
  hero?: boolean;
  /** Horizontal hero strip variant — full-width single row */
  stripe?: boolean;
  heroCaption?: string;
};

function useAnimatedNumber(target: number | undefined, durationMs = 800) {
  const [n, setN] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (target === undefined) return;
    let raf = 0;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setN(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return n;
}

export function SmartKpi({
  label, value, change, changeLabel, icon: Icon, accent = 'blue', spark,
  formatValue, counterTo, hero = false, stripe = false, heroCaption,
}: SmartKpiProps) {
  const a = ACCENT[accent];
  const data = spark.map((v, i) => ({ i, v }));
  const animated = useAnimatedNumber(counterTo);
  const displayValue = counterTo !== undefined && formatValue ? formatValue(animated) : value;
  const positive = change === undefined ? undefined : change >= 0;
  const gradId = `kpi-${accent}-${stripe ? 'stripe' : hero ? 'hero' : 'base'}`;

  const chart = (heightClass: string) => (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={a.fillFrom} />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={a.stroke}
            strokeWidth={1.5}
            strokeOpacity={0.75}
            fill={`url(#${gradId})`}
            fillOpacity={0.6}
            dot={false}
            isAnimationActive
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const deltaChip = change !== undefined && (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
        positive
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-rose-50 text-rose-700'
      }`}
    >
      {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {positive ? '+' : ''}{change.toFixed(1)}%
    </span>
  );

  /* ─────────────── HORIZONTAL HERO STRIP ─────────────── */
  if (stripe) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group relative overflow-hidden rounded-2xl bg-white/80 p-6 backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(31,24,20,0.06)]"
        style={{ boxShadow: '0 4px 20px rgba(31,24,20, 0.04)' }}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
          {/* Left cluster: icon + label + value + delta */}
          <div className="flex items-center gap-5">
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: a.iconBg, color: a.iconFg }}
            >
              <Icon className="h-6 w-6" strokeWidth={2} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-stone-500">
                  {label}
                </p>
                {heroCaption && (
                  <span className="text-[10.5px] text-stone-400">· {heroCaption}</span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
                <span className="text-[40px] font-bold tracking-[-0.03em] text-stone-900 leading-none">
                  {displayValue}
                </span>
                <div className="flex items-center gap-2">
                  {deltaChip}
                  {changeLabel && <span className="text-[11.5px] text-stone-500">{changeLabel}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Right: wide chart */}
          <div className="h-[72px] min-w-0 flex-1">
            {chart('h-full')}
          </div>
        </div>
      </motion.div>
    );
  }

  /* ─────────────── VERTICAL HERO (legacy, unused) ─────────────── */
  if (hero) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="group relative overflow-hidden rounded-2xl bg-white/80 p-7 backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(31,24,20,0.06)]"
        style={{ boxShadow: '0 4px 20px rgba(31,24,20, 0.04)' }}
      >
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone-400">{label}</p>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: a.iconBg, color: a.iconFg }}>
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
          </div>
        </div>
        <p className="mt-5 text-[44px] font-bold tracking-[-0.03em] text-stone-900 leading-none">{displayValue}</p>
        <div className="mt-3 flex items-center gap-2">
          {deltaChip}
          {changeLabel && <span className="text-[11.5px] text-stone-500">{changeLabel}</span>}
        </div>
        <div className="mt-5">{chart('h-[82px]')}</div>
      </motion.div>
    );
  }

  /* ─────────────── STANDARD CARD — uniform structure ─────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white/80 p-6 backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(31,24,20,0.06)]"
      style={{ boxShadow: '0 4px 20px rgba(31,24,20, 0.04)' }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-stone-500">
          {label}
        </p>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: a.iconBg, color: a.iconFg }}
        >
          <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
        </div>
      </div>

      {/* Value */}
      <p className="mt-4 text-[28px] font-bold tracking-[-0.025em] text-stone-900 leading-none">
        {displayValue}
      </p>

      {/* Trend row (reserves space even when no change, for visual alignment) */}
      <div className="mt-2 flex min-h-[20px] items-center gap-1.5">
        {change !== undefined ? (
          <>
            {deltaChip}
            {changeLabel && <span className="text-[10.5px] text-stone-500">{changeLabel}</span>}
          </>
        ) : (
          <span className="text-[10.5px] text-stone-400">—</span>
        )}
      </div>

      {/* Mini chart — anchored to bottom for alignment across cards */}
      <div className="mt-auto pt-4">
        {chart('h-[44px]')}
      </div>

      <div className="pointer-events-none absolute bottom-3 right-4 flex items-center gap-1 text-[10px] font-medium text-stone-400 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        Details <ArrowUpRight className="h-3 w-3" />
      </div>
    </motion.div>
  );
}
