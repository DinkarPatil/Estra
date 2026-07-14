'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Flame, TrendingUp, TrendingDown, Clock,
  MapPin, Sparkles, Star,
  type LucideIcon,
} from 'lucide-react';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';
import { mockProperties } from '@/mock-data/properties';
import type { Lead, LeadStage } from '@/types/lead';

/* ═══════════════════════════════════════════════
   Aggregation
   ─ Groups leads by property. Real properties keyed by id;
   ─ legacy-seeded leads keyed by name so they don't clump under
   ─ a single bucket.
   ═══════════════════════════════════════════════ */

type DemandItem = {
  key: string;
  propertyId: string;
  propertyName: string;
  propertyLocation: string;
  leadCount: number;
  highIntentCount: number;
  avgAiScore: number;
  /** Total ROI = rentalYield + capitalAppreciation (0 if property unknown). */
  roi: number;
  stages: Record<LeadStage, number>;
};

function aggregate(leads: Lead[]): DemandItem[] {
  const map = new Map<string, DemandItem>();

  for (const lead of leads) {
    const key =
      lead.propertyId !== 'legacy-unknown'
        ? lead.propertyId
        : `name:${lead.propertyName}`;

    let item = map.get(key);
    if (!item) {
      const property = mockProperties.find((p) => p.id === lead.propertyId);
      item = {
        key,
        propertyId: lead.propertyId,
        propertyName: lead.propertyName,
        propertyLocation: lead.propertyLocation,
        leadCount: 0,
        highIntentCount: 0,
        avgAiScore: 0,
        roi: property ? property.rentalYield + property.capitalAppreciation : 0,
        stages: { new: 0, contacted: 0, negotiation: 0, closed: 0 },
      };
      map.set(key, item);
    }

    item.leadCount += 1;
    if (lead.intentLevel === 'high') item.highIntentCount += 1;
    item.stages[lead.stage] += 1;
    // Running average for AI score
    item.avgAiScore =
      (item.avgAiScore * (item.leadCount - 1) + lead.aiScore) / item.leadCount;
  }

  return Array.from(map.values()).sort((a, b) => b.leadCount - a.leadCount);
}

/* ═══════════════════════════════════════════════
   Badge logic (per spec)
   ─ Hot: leads > 10
   ─ High Demand: 6..10
   ─ Steady: 3..5  (filler so every card has a badge)
   ─ Slow Moving: 1..2
   ═══════════════════════════════════════════════ */

type BadgeDef = {
  label: string;
  icon: LucideIcon;
  chip: string;      // Tailwind chip background+text
  dot: string;       // dot color
};

function badgeFor(count: number): BadgeDef {
  if (count > 10) {
    return {
      label: 'Hot',
      icon: Flame,
      chip: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    };
  }
  if (count > 5) {
    return {
      label: 'High Demand',
      icon: TrendingUp,
      chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    };
  }
  if (count >= 3) {
    return {
      label: 'Steady',
      icon: Activity,
      chip: 'bg-stone-50 text-stone-700 border-stone-200',
      dot: 'bg-stone-500',
    };
  }
  return {
    label: 'Slow Moving',
    icon: TrendingDown,
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  };
}

/* ═══════════════════════════════════════════════
   Insight sentence
   ═══════════════════════════════════════════════ */

function generateInsight(items: DemandItem[]): string {
  if (items.length === 0) {
    return 'No investor demand tracked yet — leads from the investor flow will appear here.';
  }

  const totalLeads = items.reduce((s, i) => s + i.leadCount, 0);
  const highRoiLeads = items
    .filter((i) => i.roi > 15)
    .reduce((s, i) => s + i.leadCount, 0);
  const highIntentCount = items.reduce((s, i) => s + i.highIntentCount, 0);
  const top = items[0];
  const topShare = top ? top.leadCount / totalLeads : 0;

  if (totalLeads > 0 && highRoiLeads / totalLeads > 0.5) {
    return 'High-ROI properties are attracting most investor interest.';
  }
  if (topShare >= 0.4 && top) {
    return `${top.propertyName} is driving most of the demand right now.`;
  }
  if (totalLeads > 0 && highIntentCount / totalLeads > 0.5) {
    return 'High-intent investors are dominating the pipeline — expect fast stage progression.';
  }
  return 'Demand is distributed evenly across your portfolio.';
}

/* ═══════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════ */

export function DemandIntelligence() {
  const { leads, isHydrated } = useLeadPipeline();

  const items = useMemo(() => aggregate(leads), [leads]);
  const top3 = items.slice(0, 3);
  const rest = items.slice(3);
  const insight = useMemo(() => generateInsight(items), [items]);

  const totalLeads = items.reduce((s, i) => s + i.leadCount, 0);
  const propertyCount = items.length;
  const highRoiHighDemand = items.filter((i) => i.roi > 15 && i.leadCount >= 5);

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-semibold text-stone-900 tracking-[-0.01em]">
            <Activity className="h-4 w-4 text-stone-600" />
            Demand Intelligence
          </h2>
          <p className="mt-0.5 text-[12px] text-stone-500">
            Real-time investor interest from the lead pipeline
          </p>
        </div>
        {isHydrated && totalLeads > 0 && (
          <div className="hidden items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1 text-[10.5px] font-medium text-stone-600 sm:inline-flex">
            <span className="font-semibold text-stone-900">{totalLeads}</span> leads ·
            <span className="font-semibold text-stone-900">{propertyCount}</span> properties
          </div>
        )}
      </div>

      {/* Insight banner */}
      <div
        className="relative overflow-hidden rounded-2xl border border-stone-100 p-4 sm:p-5"
        style={{
          background: 'linear-gradient(90deg, #EDE7DF 0%, #ECFDF5 100%)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-stone-600 shadow-[0_1px_2px_rgba(31,24,20,0.05)]">
            <Sparkles className="h-4 w-4" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-stone-700">
              Insight
            </p>
            <p className="mt-0.5 text-[13.5px] font-medium text-stone-800 leading-snug">
              {insight}
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 most-requested properties */}
      {!isHydrated ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
          <p className="text-[12px] text-stone-400">Loading demand signals…</p>
        </div>
      ) : top3.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-10 text-center shadow-[0_10px_30px_rgba(31,24,20,0.04)]">
          <p className="text-[13px] font-semibold text-stone-700">
            Waiting on investor activity
          </p>
          <p className="mx-auto mt-1 max-w-md text-[12px] text-stone-500">
            When investors click "Invest Now" or "Contact Broker" on a property,
            their interest will aggregate here.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {top3.map((item, i) => (
            <DemandCard key={item.key} item={item} rank={i + 1} />
          ))}
        </div>
      )}

      {/* Remaining properties — compact list */}
      {rest.length > 0 && (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_10px_30px_rgba(31,24,20,0.04)]">
          <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-stone-500">
            Also requested
          </p>
          <div className="divide-y divide-stone-100">
            {rest.map((item) => {
              const badge = badgeFor(item.leadCount);
              return (
                <div key={item.key} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-stone-900">
                      {item.propertyName}
                    </p>
                    <p className="truncate text-[11px] text-stone-500">
                      {item.propertyLocation}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] ${badge.chip}`}
                  >
                    <span className={`h-1 w-1 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-stone-900">
                    {item.leadCount}
                    <span className="text-[10px] font-medium text-stone-500">
                      {item.leadCount === 1 ? 'lead' : 'leads'}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROI-based demand highlight — only shown when there are matches */}
      {highRoiHighDemand.length > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl border border-emerald-200 p-5"
          style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDFA 50%, #FFFFFF 100%)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-[0_1px_2px_rgba(31,24,20,0.05)]">
              <Star className="h-4 w-4 fill-emerald-500 text-emerald-600" strokeWidth={0} />
            </div>
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-emerald-700">
                High-ROI demand
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-stone-800 leading-snug">
                {highRoiHighDemand.length === 1
                  ? `${highRoiHighDemand[0].propertyName} has both ROI > 15% and strong investor interest.`
                  : `${highRoiHighDemand.length} properties have ROI > 15% and strong investor interest.`}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {highRoiHighDemand.slice(0, 5).map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white/70 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-800 backdrop-blur-sm"
                  >
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" strokeWidth={0} />
                    {item.propertyName}
                    <span className="text-emerald-600">· {item.roi.toFixed(1)}% ROI · {item.leadCount} leads</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════
   DemandCard — single property tile
   ═══════════════════════════════════════════════ */

function DemandCard({ item, rank }: { item: DemandItem; rank: number }) {
  const badge = badgeFor(item.leadCount);
  const BadgeIcon = badge.icon;
  const isHighRoi = item.roi > 15;
  const isHighRoiDemand = isHighRoi && item.leadCount >= 5;
  const openLeads = item.leadCount - item.stages.closed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 transition-all duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_14px_38px_rgba(31,24,20,0.08)]"
      style={{ boxShadow: '0 10px 30px rgba(31,24,20, 0.04)' }}
    >
      {/* Subtle top accent */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: 'linear-gradient(90deg, rgba(168,148,120,0) 0%, rgba(168,148,120,0.55) 50%, rgba(168,148,120,0) 100%)',
          opacity: 0.7,
        }}
      />

      {/* Rank + Badge row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-stone-100 px-1.5 text-[10.5px] font-bold text-stone-700">
            #{rank}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] ${badge.chip}`}
          >
            <BadgeIcon className="h-2.5 w-2.5" strokeWidth={2.4} />
            {badge.label}
          </span>
        </div>
        {isHighRoiDemand && (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" strokeWidth={0} />
            High ROI
          </span>
        )}
      </div>

      {/* Title */}
      <div className="mt-4">
        <h3 className="truncate text-[15px] font-semibold text-stone-900 tracking-[-0.01em]">
          {item.propertyName}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-stone-500">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{item.propertyLocation}</span>
        </div>
      </div>

      {/* Lead count — dominant number */}
      <div className="mt-4 flex items-end gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
            Investor interest
          </p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-[32px] font-bold tracking-[-0.025em] text-stone-900 leading-none">
              {item.leadCount}
            </span>
            <span className="text-[11px] font-medium text-stone-500">
              {item.leadCount === 1 ? 'lead' : 'leads'}
            </span>
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-stone-500">
            ROI
          </p>
          <p
            className={`mt-1 text-[18px] font-bold tracking-[-0.015em] ${
              isHighRoi ? 'text-emerald-700' : 'text-stone-800'
            }`}
          >
            {item.roi > 0 ? `${item.roi.toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-4 border-t border-stone-100 pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span className="font-semibold text-stone-800">{item.highIntentCount}</span>
            high-intent
          </span>
          <span className="text-stone-300">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3 text-stone-400" />
            <span className="font-semibold text-stone-800">{openLeads}</span>
            open
          </span>
          <span className="text-stone-300">·</span>
          <span>
            AI <span className="font-semibold text-stone-800">{Math.round(item.avgAiScore)}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
