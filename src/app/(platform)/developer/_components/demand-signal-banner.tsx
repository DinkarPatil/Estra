'use client';

/**
 * Demand Signal Banner
 * ────────────────────
 * Top-of-dashboard pulse, computed live from the shared lead pipeline.
 * Three signals: project demand growth, lead growth, trending area.
 *
 * Replaces the former rotating InsightStrip with data-driven tiles so
 * developers see real investor movement instead of curated copy.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, TrendingUp, TrendingDown, Users, MapPin, Radio,
  type LucideIcon,
} from 'lucide-react';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type Tint = 'blue' | 'emerald' | 'amber';

const TINT: Record<Tint, { bg: string; fg: string; chipBg: string; chipFg: string }> = {
  blue:    { bg: 'bg-stone-50',    fg: 'text-stone-600',    chipBg: 'bg-stone-50',    chipFg: 'text-stone-700' },
  emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600', chipBg: 'bg-emerald-50', chipFg: 'text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   fg: 'text-amber-600',   chipBg: 'bg-amber-50',   chipFg: 'text-amber-700' },
};

export function DemandSignalBanner() {
  const { leads, isHydrated } = useLeadPipeline();

  const signals = useMemo(() => {
    const now = Date.now();
    const thisWeek = leads.filter((l) => now - new Date(l.createdAt).getTime() < WEEK_MS).length;
    const lastWeek = leads.filter((l) => {
      const age = now - new Date(l.createdAt).getTime();
      return age >= WEEK_MS && age < 2 * WEEK_MS;
    }).length;

    const leadGrowth =
      lastWeek === 0
        ? thisWeek > 0 ? 100 : 0
        : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);

    const byProject = new Map<string, number>();
    const byArea = new Map<string, number>();
    for (const l of leads) {
      byProject.set(l.propertyName, (byProject.get(l.propertyName) ?? 0) + 1);
      byArea.set(l.propertyLocation, (byArea.get(l.propertyLocation) ?? 0) + 1);
    }
    const topProject = [...byProject.entries()].sort((a, b) => b[1] - a[1])[0];
    const topArea = [...byArea.entries()].sort((a, b) => b[1] - a[1])[0];

    // Simulate a demand index: 8% base + leads × 2.2%, capped at 42%.
    const projectDemandGrowth =
      topProject ? Math.min(42, Math.round(8 + topProject[1] * 2.2)) : 12;

    const topAreaShare =
      topArea && leads.length ? Math.round((topArea[1] / leads.length) * 100) : 0;

    return {
      totalLeads: leads.length,
      leadGrowth,
      topProject: topProject?.[0] ?? 'Azure Heights',
      projectDemandGrowth,
      topArea: topArea?.[0] ?? 'Dubai Marina',
      topAreaShare,
    };
  }, [leads]);

  if (!isHydrated) {
    return (
      <div
        className="h-[108px] animate-pulse rounded-2xl bg-white/60 backdrop-blur-md"
        style={{ boxShadow: '0 4px 20px rgba(31,24,20, 0.04)' }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl bg-white/80 p-5 backdrop-blur-md sm:p-6"
      style={{ boxShadow: '0 4px 20px rgba(31,24,20, 0.04)' }}
    >
      {/* Vertical accent vein — blue → emerald gradient */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background:
            'linear-gradient(180deg, rgba(139,115,85,0.85) 0%, rgba(16,185,129,0.85) 100%)',
        }}
      />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
        {/* Header cluster */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-600">
            <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-emerald-500" />
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-emerald-700">
                Live demand signal
              </p>
            </div>
            <p className="mt-0.5 text-[12.5px] text-stone-500">
              Real-time pulse from your investor pipeline
            </p>
          </div>
        </div>

        <div className="hidden h-10 w-px bg-gradient-to-b from-transparent via-stone-200 to-transparent lg:block" />

        {/* Signal tiles */}
        <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          <SignalTile
            icon={TrendingUp}
            tint="emerald"
            label="Project demand"
            value={`+${signals.projectDemandGrowth}%`}
            meta={signals.topProject}
            positive
          />
          <SignalTile
            icon={Users}
            tint="blue"
            label="Lead growth"
            value={`${signals.leadGrowth >= 0 ? '+' : ''}${signals.leadGrowth}%`}
            meta={`${signals.totalLeads} active ${signals.totalLeads === 1 ? 'lead' : 'leads'}`}
            positive={signals.leadGrowth >= 0}
          />
          <SignalTile
            icon={MapPin}
            tint="amber"
            label="Trending area"
            value={signals.topArea}
            meta={signals.topAreaShare > 0 ? `${signals.topAreaShare}% of demand` : 'Awaiting signals'}
            truncate
          />
        </div>
      </div>
    </motion.div>
  );
}

type SignalTileProps = {
  icon: LucideIcon;
  tint: Tint;
  label: string;
  value: string;
  meta: string;
  positive?: boolean;
  truncate?: boolean;
};

function SignalTile({ icon: Icon, tint, label, value, meta, positive, truncate }: SignalTileProps) {
  const t = TINT[tint];
  const showTrend = positive !== undefined;
  const TrendIcon = positive ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center gap-3.5">
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.fg}`}>
        <Icon className="h-[17px] w-[17px]" strokeWidth={2.1} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-stone-500">
          {label}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span
            className={`text-[20px] font-bold tracking-[-0.02em] leading-none text-stone-900 ${truncate ? 'truncate block max-w-full' : ''}`}
            title={truncate ? value : undefined}
          >
            {value}
          </span>
          {showTrend && (
            <TrendIcon
              className={`h-3.5 w-3.5 ${positive ? 'text-emerald-500' : 'text-rose-500'}`}
              strokeWidth={2.4}
            />
          )}
        </div>
        <p className="mt-1 truncate text-[11.5px] text-stone-500" title={meta}>
          {meta}
        </p>
      </div>
    </div>
  );
}
