'use client';

/**
 * Decision Engine
 * ───────────────
 * Converts live demand signals into an AI pricing recommendation, a row of
 * high-level actions (pricing / campaign / inventory), and a post-action
 * impact monitor that tracks what changed once the developer moved.
 *
 * State is owned here because the three sections are tightly coupled:
 *   AI suggestion ──► Action fires ──► Monitor records impact.
 *
 * Source: shared lead pipeline (useLeadPipeline).
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Zap, Tag, Megaphone, Unlock, CheckCircle2, ArrowRight,
  Activity, Clock, TrendingUp, Gauge, X, type LucideIcon,
} from 'lucide-react';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */

type ActionType = 'pricing' | 'campaign' | 'release';

type ActionRecord = {
  id: string;
  type: ActionType;
  label: string;
  at: string;
  delta?: string;
  impact: {
    demand: number;   // % change in demand
    leads: number;    // % change in leads
    velocity: number; // % change in velocity
  };
};

type ReasoningChip = {
  label: string;
  value: string;
  tone: 'emerald' | 'blue' | 'amber';
};

type Recommendation = {
  project: string;
  priceChange: number;
  reasoning: ReasoningChip[];
  confidence: number;
  inventoryLeftPct: number;
  totalLeads: number;
};

const ACTION_META: Record<ActionType, { label: string; impact: ActionRecord['impact'] }> = {
  pricing:  { label: 'Pricing updated',     impact: { demand:  +6, leads:  +4, velocity:  +9 } },
  campaign: { label: 'Campaign launched',   impact: { demand: +14, leads: +22, velocity:  +7 } },
  release:  { label: 'Inventory released',  impact: { demand:  +8, leads:  +5, velocity: +12 } },
};

function uid() {
  return `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}

/* ═══════════════════════════════════════════════
   Root
   ═══════════════════════════════════════════════ */

export function DecisionEngine() {
  const { leads } = useLeadPipeline();
  const [actions, setActions] = useState<ActionRecord[]>([]);
  const [applied, setApplied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const recommendation = useMemo<Recommendation>(() => {
    const total = leads.length;
    const high = leads.filter((l) => l.intentLevel === 'high').length;
    const share = total ? high / total : 0;

    // Top project by lead count
    const byProject = new Map<string, number>();
    for (const l of leads) {
      byProject.set(l.propertyName, (byProject.get(l.propertyName) ?? 0) + 1);
    }
    const top = [...byProject.entries()].sort((a, b) => b[1] - a[1])[0];
    const project = top?.[0] ?? 'Azure Heights';

    // Price-change heuristic: more high-intent → stronger suggestion
    const priceChange = share > 0.4 ? 4.2 : share > 0.2 ? 2.8 : 1.5;

    // Simulated velocity delta and inventory left
    const velocity = total > 10 ? 23 : total > 4 ? 16 : 9;
    const inventoryLeftPct = 28; // static mock — remaining unit share

    return {
      project,
      priceChange,
      confidence: Math.min(98, 72 + Math.round(share * 26)),
      inventoryLeftPct,
      totalLeads: total,
      reasoning: [
        {
          label: 'Demand',
          value: share > 0.4 ? 'Strong' : share > 0.2 ? 'Rising' : 'Stable',
          tone: 'emerald',
        },
        { label: 'Velocity',  value: `+${velocity}%`,              tone: 'blue'   },
        { label: 'Inventory', value: `${inventoryLeftPct}% left`,  tone: 'amber'  },
      ],
    };
  }, [leads]);

  const takeAction = (type: ActionType) => {
    const meta = ACTION_META[type];
    setActions((prev) => [
      {
        id: uid(),
        type,
        label: meta.label,
        at: new Date().toISOString(),
        delta: type === 'pricing' ? `+${recommendation.priceChange.toFixed(1)}%` : undefined,
        impact: meta.impact,
      },
      ...prev,
    ].slice(0, 8));
    if (type === 'pricing') setApplied(true);
  };

  return (
    <section className="space-y-6">
      {/* Section header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-stone-900 tracking-[-0.01em]">
            <Zap className="h-4 w-4 text-stone-600" />
            Decision engine
          </h2>
          <p className="mt-0.5 text-[12px] text-stone-500">
            Turn live signals into pricing, campaign, and inventory moves
          </p>
        </div>
      </div>

      {/* 4 — AI Pricing Suggestion */}
      {!dismissed && (
        <AiPricingSuggestion
          recommendation={recommendation}
          applied={applied}
          onApply={() => takeAction('pricing')}
          onDismiss={() => setDismissed(true)}
        />
      )}

      {/* 5 — Action Layer */}
      <ActionLayer onAction={takeAction} />

      {/* 6 — Monitoring */}
      <ImpactMonitor actions={actions} />
    </section>
  );
}

/* ═══════════════════════════════════════════════
   4. AI Pricing Suggestion
   ═══════════════════════════════════════════════ */

const CHIP_TONE: Record<ReasoningChip['tone'], string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue:    'bg-stone-50 text-stone-700 border-stone-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
};

function AiPricingSuggestion({
  recommendation, applied, onApply, onDismiss,
}: {
  recommendation: Recommendation;
  applied: boolean;
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative overflow-hidden rounded-2xl p-6 sm:p-7"
      style={{
        background:
          'linear-gradient(135deg, #EDE7DF 0%, #F0FDFA 55%, #ECFDF5 100%)',
        boxShadow: '0 8px 30px rgba(31,24,20, 0.06)',
      }}
    >
      {/* Dismiss */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss recommendation"
        className="absolute right-4 top-4 rounded-md p-1 text-stone-400 transition-colors duration-150 hover:bg-white/60 hover:text-stone-700"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Decorative soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.35), transparent)' }}
      />

      <div className="relative grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        {/* Left: headline number */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-stone-600 shadow-[0_2px_6px_rgba(31,24,20,0.06)]">
            <Sparkles className="h-[20px] w-[20px]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-stone-700">
              AI pricing recommendation
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[40px] font-bold tracking-[-0.03em] text-stone-900 leading-none">
                +{recommendation.priceChange.toFixed(1)}%
              </span>
              <span className="text-[13px] font-medium text-stone-600">suggested move</span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-stone-600">
              on <span className="font-semibold text-stone-900">{recommendation.project}</span>
              {' '}· confidence <span className="font-semibold text-stone-900">{recommendation.confidence}%</span>
            </p>
          </div>
        </div>

        {/* Middle: reasoning chips */}
        <div className="flex flex-wrap items-center gap-2 lg:pl-6">
          {recommendation.reasoning.map((chip) => (
            <span
              key={chip.label}
              className={`inline-flex items-center gap-1.5 rounded-lg border bg-white/80 px-2.5 py-1 text-[11.5px] font-medium backdrop-blur-sm ${CHIP_TONE[chip.tone]}`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] opacity-70">
                {chip.label}
              </span>
              <span className="font-semibold">{chip.value}</span>
            </span>
          ))}
        </div>

        {/* Right: CTA */}
        <div className="flex items-center gap-2">
          {applied ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-2 text-[12px] font-semibold text-stone-800 ring-1 ring-inset ring-stone-200/60">
              <CheckCircle2 className="h-3.5 w-3.5" />
              ✔ Applied
            </span>
          ) : (
            <button
              type="button"
              onClick={onApply}
              className="btn-primary btn-primary-sm group"
            >
              Apply recommendation
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   5. Action Layer
   ═══════════════════════════════════════════════ */

type ActionCardDef = {
  type: ActionType;
  icon: LucideIcon;
  title: string;
  description: string;
  tint: 'blue' | 'emerald' | 'amber';
};

const ACTION_CARDS: ActionCardDef[] = [
  {
    type: 'pricing',
    icon: Tag,
    title: 'Update pricing',
    description: 'Adjust active listings using the AI suggestion',
    tint: 'blue',
  },
  {
    type: 'campaign',
    icon: Megaphone,
    title: 'Launch campaign',
    description: 'Push priority units to high-intent investors',
    tint: 'emerald',
  },
  {
    type: 'release',
    icon: Unlock,
    title: 'Release inventory',
    description: 'Unlock phase 2 units to match demand',
    tint: 'amber',
  },
];

const ACTION_TINT: Record<ActionCardDef['tint'], { iconBg: string; iconFg: string; ring: string }> = {
  blue:    { iconBg: 'bg-stone-50',    iconFg: 'text-stone-600',    ring: 'hover:ring-stone-200' },
  emerald: { iconBg: 'bg-emerald-50', iconFg: 'text-emerald-600', ring: 'hover:ring-emerald-200' },
  amber:   { iconBg: 'bg-amber-50',   iconFg: 'text-amber-600',   ring: 'hover:ring-amber-200' },
};

function ActionLayer({ onAction }: { onAction: (type: ActionType) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {ACTION_CARDS.map((card) => {
        const Icon = card.icon;
        const t = ACTION_TINT[card.tint];
        return (
          <motion.button
            key={card.type}
            type="button"
            onClick={() => onAction(card.type)}
            whileTap={{ scale: 0.985 }}
            className={`group relative flex flex-col items-start rounded-2xl bg-white/80 p-5 text-left backdrop-blur-md ring-1 ring-stone-100 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:ring-2 ${t.ring}`}
            style={{ boxShadow: '0 4px 20px rgba(31,24,20, 0.04)' }}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.iconBg} ${t.iconFg} transition-colors duration-200`}>
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <h4 className="mt-4 text-[14px] font-semibold text-stone-900 tracking-[-0.01em]">
              {card.title}
            </h4>
            <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">
              {card.description}
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-700 transition-colors duration-150 group-hover:text-stone-900">
              Execute
              <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   6. Impact Monitor
   ═══════════════════════════════════════════════ */

function ImpactMonitor({ actions }: { actions: ActionRecord[] }) {
  const aggregate = useMemo(() => {
    if (actions.length === 0) return null;
    return actions.reduce(
      (acc, a) => ({
        demand:   acc.demand + a.impact.demand,
        leads:    acc.leads + a.impact.leads,
        velocity: acc.velocity + a.impact.velocity,
      }),
      { demand: 0, leads: 0, velocity: 0 },
    );
  }, [actions]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-white/80 p-6 backdrop-blur-md"
      style={{ boxShadow: '0 4px 20px rgba(31,24,20, 0.04)' }}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-stone-600" />
          <h3 className="text-[14px] font-semibold text-stone-900 tracking-[-0.01em]">
            Impact
          </h3>
          <span className="text-[11.5px] text-stone-400">· tracked after each action</span>
        </div>
        {actions.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Tracking {actions.length} {actions.length === 1 ? 'action' : 'actions'}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!aggregate ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-stone-50/70 p-8 text-center"
          >
            <Gauge className="mx-auto h-5 w-5 text-stone-400" />
            <p className="mt-2 text-[13px] font-semibold text-stone-700">
              No actions executed yet
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[12px] text-stone-500">
              Once you update pricing, launch a campaign, or release inventory, the
              impact on demand and sales will appear here.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="populated"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Aggregate deltas — matches spec: Lead increase, Demand change, Sales performance */}
            <div className="grid gap-4 sm:grid-cols-3">
              <ImpactTile label="Lead increase"     value={aggregate.leads}    suffix="%" />
              <ImpactTile label="Demand change"     value={aggregate.demand}   suffix="%" />
              <ImpactTile label="Sales performance" value={aggregate.velocity} suffix="%" />
            </div>

            {/* Action log */}
            <div className="pt-2">
              <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
                Recent actions
              </p>
              <ul className="divide-y divide-stone-100">
                <AnimatePresence initial={false}>
                  {actions.map((a) => (
                    <motion.li
                      key={a.id}
                      layout
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-3 py-2.5 first:pt-0"
                    >
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-stone-50 text-stone-600">
                        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium text-stone-900">
                          {a.label}
                          {a.delta && (
                            <span className="ml-1.5 text-[11.5px] font-semibold text-emerald-700">
                              {a.delta}
                            </span>
                          )}
                        </p>
                        <p className="flex items-center gap-1 text-[11px] text-stone-500">
                          <Clock className="h-3 w-3" />
                          {relTime(a.at)}
                        </p>
                      </div>
                      <div className="hidden items-center gap-3 text-[11px] text-stone-500 sm:flex">
                        <DeltaChip label="leads"  value={a.impact.leads} />
                        <DeltaChip label="demand" value={a.impact.demand} />
                        <DeltaChip label="sales"  value={a.impact.velocity} />
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImpactTile({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const positive = value >= 0;
  return (
    <div className="rounded-xl bg-stone-50/60 p-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span className={`text-[24px] font-bold tracking-[-0.02em] leading-none ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>
          {positive ? '+' : ''}{value}{suffix}
        </span>
        <TrendingUp className={`h-3.5 w-3.5 ${positive ? 'text-emerald-500' : 'text-rose-500 rotate-180'}`} strokeWidth={2.4} />
      </div>
      <p className="mt-1 text-[11px] text-stone-500">vs baseline</p>
    </div>
  );
}

function DeltaChip({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="opacity-70">{label}</span>
      <span className={`font-semibold ${positive ? 'text-emerald-700' : 'text-rose-700'}`}>
        {positive ? '+' : ''}{value}%
      </span>
    </span>
  );
}
