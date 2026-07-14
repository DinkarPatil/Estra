'use client';

import { motion } from 'framer-motion';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import {
  MapPin, Eye, TrendingUp, BarChart3,
} from 'lucide-react';

export type RiskLevel = 'low' | 'medium' | 'high';
export type ProjectStatus = 'near-completion' | 'under-construction' | 'pre-launch';

const STATUS_STYLES: Record<ProjectStatus, { label: string; chip: string; dot: string }> = {
  'near-completion':    { label: 'Near completion',    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'under-construction': { label: 'Under construction', chip: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500' },
  'pre-launch':         { label: 'Pre-launch',         chip: 'bg-stone-50 text-stone-700 border-stone-200',          dot: 'bg-stone-500' },
};

const RISK_STYLES: Record<RiskLevel, { label: string; text: string }> = {
  low:    { label: 'Low',    text: 'text-emerald-700' },
  medium: { label: 'Medium', text: 'text-amber-700' },
  high:   { label: 'High',   text: 'text-rose-700' },
};

type Props = {
  id: string;
  name: string;
  location: string;
  status: ProjectStatus;
  totalUnits: number;
  soldUnits: number;
  completionDate: string;
  demand: number;
  risk: RiskLevel;
  spark: number[];
};

export function ProjectMiniCard({
  name, location, status, totalUnits, soldUnits,
  completionDate, demand, risk, spark,
}: Props) {
  const pct = Math.round((soldUnits / totalUnits) * 100);
  const s = STATUS_STYLES[status];
  const r = RISK_STYLES[risk];
  const sparkData = spark.map((v, i) => ({ i, v }));

  const demandTone =
    demand >= 80 ? 'text-emerald-700' :
    demand >= 60 ? 'text-stone-700' :
                   'text-amber-700';

  const sparkGradId = `proj-spark-${name.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-2xl bg-white/80 p-6 backdrop-blur-md transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(31,24,20,0.06)]"
      style={{ boxShadow: '0 4px 20px rgba(31,24,20, 0.04)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-stone-900 tracking-[-0.01em]">{name}</h3>
          <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-stone-500">
            <MapPin className="h-3 w-3" />
            <span className="truncate">{location}</span>
          </div>
        </div>
        <span
          className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] ${s.chip}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      {/* Sales progress */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="text-stone-500">Sales progress</span>
          <span className="font-medium text-stone-900">
            {soldUnits}/{totalUnits} <span className="text-stone-400">· {pct}%</span>
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="h-full rounded-full bg-stone-500"
          />
        </div>
      </div>

      {/* Inline stats row — spacing instead of divider line above */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex flex-1 flex-col">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-stone-400">Demand</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-[17px] font-bold tracking-[-0.015em] ${demandTone}`}>{demand}</span>
            <span className="text-[10px] text-stone-400">/100</span>
          </div>
        </div>


        <div className="flex flex-1 flex-col pl-4">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-stone-400">Risk</span>
          <span className={`mt-1 text-[15px] font-semibold ${r.text}`}>{r.label}</span>
        </div>


        <div className="flex flex-1 flex-col pl-4">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-stone-400">Completion</span>
          <span className="mt-1 text-[12.5px] font-medium text-stone-700">{completionDate}</span>
        </div>
      </div>

      {/* Sparkline — edge to edge */}
      <div className="-mx-1 mt-4 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={sparkGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(168,148,120,0.18)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke="#A89478"
              strokeWidth={1.5}
              strokeOpacity={0.7}
              fill={`url(#${sparkGradId})`}
              dot={false}
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions — reveal on hover */}
      <div className="mt-3 grid max-h-0 grid-cols-3 gap-2 overflow-hidden opacity-0 transition-all duration-200 group-hover:max-h-14 group-hover:opacity-100">
        <QuickAction icon={Eye} label="View" />
        <QuickAction icon={TrendingUp} label="Price" />
        <QuickAction icon={BarChart3} label="Market" />
      </div>
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label }: { icon: typeof Eye; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white py-1.5 text-[11px] font-medium text-stone-700 transition-all duration-150 hover:border-stone-200 hover:bg-stone-50 hover:text-stone-700"
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}
