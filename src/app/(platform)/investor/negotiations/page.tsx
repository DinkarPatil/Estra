'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, ArrowRight, TrendingDown, TrendingUp,
  MapPin, Building2, Bed, Maximize2, Zap,
  AlertTriangle, Activity, Target, BarChart3,
  Filter, SlidersHorizontal, Timer, ExternalLink,
  X, Check,
} from 'lucide-react';
import { InvestorPageHeader } from '@/components/layout/investor-page-header';
import { useNegotiation, NEGOTIATION_META, ALL_DEAL_IDS } from '@/lib/negotiations-store';
import type { NegotiationState } from '@/lib/negotiations-store';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';

/* ─── constants ─── */

const DEAL_BROKERS: Record<string, { name: string; company: string; role: string; avatar: string; time: string }> = {
  'prop-001': {
    name: 'James Okafor',
    company: 'Global Realty Partners',
    role: 'Your Broker',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80',
    time: '10:24 AM',
  },
  'prop-002': {
    name: 'Aisha Rahman',
    company: 'Prime Assets',
    role: 'Your Broker',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80',
    time: 'Yesterday, 4:30 PM',
  },
  'prop-003': {
    name: 'Marcus Chen',
    company: 'Harbor Investments',
    role: 'Your Broker',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80',
    time: '2 days ago',
  },
};

const DEFAULT_BROKER = {
  name: 'James Okafor',
  company: 'Global Realty Partners',
  role: 'Your Broker',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80',
  time: 'Recently',
};

const PROP_IMAGES: Record<string, string> = {
  'prop-001': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=216&h=144&fit=crop&q=80',
  'prop-002': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=216&h=144&fit=crop&q=80',
  'prop-003': 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=216&h=144&fit=crop&q=80',
};

const DEFAULT_PROP_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=216&h=144&fit=crop&q=80';
const LS_KEY = (id: string) => `estra_neg_${id}`;

/* ─── helpers ─── */

function fmt(n: number, currency: string) {
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${currency} ${(n / 1_000).toFixed(0)}K`;
  if (n <= 0)         return `${currency} —`;
  return `${currency} ${n.toLocaleString()}`;
}

const STATUS_CONFIG = {
  active:   { label: 'Active',   color: '#8B7355', bg: 'rgba(139,115,85,0.08)',  border: 'rgba(139,115,85,0.22)'  },
  stalled:  { label: 'Stalled',  color: '#9E7B4A', bg: 'rgba(158,123,74,0.08)', border: 'rgba(158,123,74,0.25)'  },
  accepted: { label: 'Accepted', color: '#A89478', bg: 'rgba(168,148,120,0.08)', border: 'rgba(168,148,120,0.22)' },
  closed:   { label: 'Closed',   color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.22)' },
};

/* ─── DealMeta type ─── */
interface DealMeta {
  property: string;
  investor: string;
  currency: string;
  location: string;
  type: string;
  bedrooms: number;
  area: number;
  aiRecommendation: string;
}

/* ─── Score Ring ─── */

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? '#8B7355' : score >= 50 ? '#A89478' : '#9E7B4A';
  return (
    <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="52" height="52">
        <circle cx="26" cy="26" r={r} strokeWidth="3.5" fill="none" stroke="rgba(139,115,85,0.10)" />
        <circle
          cx="26" cy="26" r={r} strokeWidth="3.5"
          fill="none" stroke={color}
          strokeDasharray={`${fill} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="text-center z-10">
        <div className="text-[12px] font-bold leading-none" style={{ color }}>{score}</div>
        <div className="text-[8px] leading-none mt-0.5" style={{ color: '#8B7355' }}>/100</div>
      </div>
    </div>
  );
}

/* ─── Round Timeline ─── */

function RoundTimeline({ history }: { history: { round: number; offer: number; date: string; by: 'Buyer' | 'Seller' }[] }) {
  if (history.length === 0) return <p className="text-[10px]" style={{ color: '#B0A090' }}>No offer rounds yet</p>;
  return (
    <div className="flex items-center">
      {history.map((h, i) => (
        <div key={h.round} className="flex items-center">
          <div className="flex flex-col items-center gap-0.5">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ background: i === history.length - 1 ? '#8B7355' : 'rgba(139,115,85,0.32)' }}
            >
              {h.round}
            </div>
            <span className="text-[9px] whitespace-nowrap" style={{ color: '#8B7355' }}>
              {new Date(h.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          {i < history.length - 1 && (
            <div className="mb-3.5 mx-1 h-px w-5" style={{ background: 'rgba(139,115,85,0.15)' }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Mini Sparkline ─── */

function MiniSparkline({ points, color }: { points: number[]; color: string }) {
  const h = 28, w = 64;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const path = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} className="shrink-0 opacity-60">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Summary KPI card ─── */

function SummaryKPI({
  icon: Icon, label, value, sub, color, sparkPoints,
}: {
  icon: typeof Activity; label: string; value: string; sub: string; color: string; sparkPoints: number[];
}) {
  return (
    <div
      className="rounded-[16px] border px-4 py-3 flex items-center gap-3"
      style={{
        borderColor: 'rgba(139,115,85,0.10)',
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}18` }}
      >
        <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium leading-none mb-1" style={{ color: '#8B7355' }}>{label}</p>
        <p className="text-[15px] font-bold leading-none" style={{ color: '#2D241B' }}>{value}</p>
        <p className="text-[10px] mt-0.5" style={{ color: '#8B7355' }}>{sub}</p>
      </div>
      <MiniSparkline points={sparkPoints} color={color} />
    </div>
  );
}

/* ─── Deal Card ─── */

function DealCard({
  dealId,
  index,
  overrideMeta,
  propImage,
}: {
  dealId: string;
  index: number;
  overrideMeta?: DealMeta;
  propImage?: string;
}) {
  const staticMeta = NEGOTIATION_META[dealId];
  const meta: DealMeta | undefined = overrideMeta ?? staticMeta;
  const { state, update } = useNegotiation(dealId);
  const router = useRouter();

  type DealModal = 'counter' | 'accept' | null;
  const [modal, setModal]           = useState<DealModal>(null);
  const [modalDone, setModalDone]   = useState(false);
  const [counterAmt, setCounterAmt] = useState(state.currentOffer);

  if (!meta) return null;

  function openModal(m: DealModal) {
    setModal(m);
    setModalDone(false);
    setCounterAmt(state.currentOffer);
  }
  function submitCounter() {
    if (counterAmt <= 0) return;
    update((prev) => ({
      ...prev,
      currentOffer: counterAmt,
      history: [
        ...prev.history,
        { round: prev.history.length + 1, offer: counterAmt, date: new Date().toISOString().slice(0, 10), by: 'Buyer' as const },
      ],
      dealScore: Math.min(100, prev.dealScore + 2),
      status: 'active' as const,
    }));
    setModalDone(true);
  }
  function acceptOffer() {
    update({ status: 'accepted', dealScore: 100 });
    setModalDone(true);
  }

  const status       = STATUS_CONFIG[state.status] ?? STATUS_CONFIG.closed;
  const gap          = state.counterOffer - state.currentOffer;
  const gapPct       = state.counterOffer > 0 ? Math.round((gap / state.counterOffer) * 100) : 0;
  const unread       = state.messages.filter((m) => m.sender === 'Broker').length;
  const latestBroker = [...state.messages].reverse().find((m) => m.sender === 'Broker');

  const firstOffer  = state.history[0]?.offer ?? state.currentOffer;
  const rangeTotal  = state.counterOffer - firstOffer;
  const rangeFilled = state.currentOffer - firstOffer;
  const progressPct = rangeTotal > 0 ? Math.round((rangeFilled / rangeTotal) * 100) : 0;

  const img    = propImage ?? PROP_IMAGES[dealId] ?? DEFAULT_PROP_IMAGE;
  const broker = DEAL_BROKERS[dealId] ?? DEFAULT_BROKER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] as any }}
      whileHover={{ y: -2 }}
      className="group relative rounded-[20px] border overflow-hidden"
      style={{
        borderColor: 'rgba(139,115,85,0.12)',
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        transition: 'box-shadow 0.22s ease, transform 0.22s ease',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[20px]"
        style={{ background: `linear-gradient(180deg, ${status.color}, ${status.color}66)` }}
      />

      <div className="p-5">

        {/* ── Row 1: thumbnail + info + status + score ── */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5 min-w-0">

            {/* Property thumbnail */}
            <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 108, height: 72, borderRadius: 14 }}>
              <img src={img} alt={meta.property} className="w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0" style={{ background: 'rgba(59,42,26,0.10)' }} />
              {unread > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full text-[8px] font-bold text-white px-1"
                  style={{ background: '#8B7355' }}
                >
                  {unread}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold leading-tight mb-1.5" style={{ color: '#2D241B' }}>
                {meta.property}
              </h3>
              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5">
                <span className="flex items-center gap-1 text-[10.5px]" style={{ color: '#8B7355' }}>
                  <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />{meta.location}
                </span>
                <span className="flex items-center gap-1 text-[10.5px]" style={{ color: '#8B7355' }}>
                  <Building2 className="h-3 w-3 shrink-0" strokeWidth={1.5} />{meta.type}
                </span>
                {meta.bedrooms > 0 && (
                  <span className="flex items-center gap-1 text-[10.5px]" style={{ color: '#8B7355' }}>
                    <Bed className="h-3 w-3 shrink-0" strokeWidth={1.5} />{meta.bedrooms} bed
                  </span>
                )}
                {meta.area > 0 && (
                  <span className="flex items-center gap-1 text-[10.5px]" style={{ color: '#8B7355' }}>
                    <Maximize2 className="h-3 w-3 shrink-0" strokeWidth={1.5} />{meta.area.toLocaleString()} sqft
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Status + Score */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border"
              style={{ color: status.color, background: status.bg, borderColor: status.border }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: status.color }} />
              {status.label}
            </span>
            <ScoreRing score={state.dealScore} />
          </div>
        </div>

        {/* ── Two-panel content area ── */}
        <div className="flex gap-4 mb-4">

          {/* ── LEFT: metrics + progress bar + offer rounds ── */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">

            {/* Metrics 3-col */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: 'rgba(139,115,85,0.10)', background: '#FFF9F0' }}>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#8B7355' }}>Your Offer</p>
                <p className="text-[13px] font-bold" style={{ color: '#2D241B' }}>{fmt(state.currentOffer, meta.currency)}</p>
              </div>
              <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: 'rgba(139,115,85,0.10)', background: '#FFF9F0' }}>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#8B7355' }}>Asking Price</p>
                <p className="text-[13px] font-bold" style={{ color: '#2D241B' }}>{fmt(state.counterOffer, meta.currency)}</p>
              </div>
              <div className="rounded-xl border px-3 py-2.5" style={{ borderColor: 'rgba(168,148,120,0.22)', background: 'rgba(168,148,120,0.06)' }}>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#8B7355' }}>Gap</p>
                <p className="text-[13px] font-bold" style={{ color: '#A89478' }}>{fmt(gap, meta.currency)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium" style={{ color: '#8B7355' }}>Negotiation Progress</span>
                <span className="text-[10px] font-semibold" style={{ color: '#8B7355' }}>
                  {progressPct}% Closed · {gapPct}% remaining
                </span>
              </div>
              <div className="relative h-2 rounded-full overflow-hidden" style={{ background: '#F2E8D5' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, progressPct)}%` }}
                  transition={{ duration: 0.9, delay: index * 0.06 + 0.2, ease: [0.16, 1, 0.3, 1] as any }}
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #8B7355, #A89478)' }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px]" style={{ color: '#8B7355' }}>{fmt(firstOffer, meta.currency)} · Start Price</span>
                <span className="text-[9px]" style={{ color: '#8B7355' }}>{fmt(state.counterOffer, meta.currency)} · Asking Price</span>
              </div>
            </div>

            {/* Offer rounds */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#8B7355' }}>Offer Rounds</p>
              <RoundTimeline history={state.history} />
            </div>

          </div>

          {/* ── RIGHT: broker message + AI insight ── */}
          <div className="flex flex-col gap-3" style={{ width: '42%', flexShrink: 0 }}>

            {/* Broker message */}
            {latestBroker ? (
              <div
                className="flex-1 rounded-xl border px-3 py-3"
                style={{ borderColor: 'rgba(139,115,85,0.10)', background: '#FFF9F0' }}
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <img
                    src={broker.avatar}
                    alt={broker.name}
                    className="h-9 w-9 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-[10.5px] font-semibold leading-tight truncate" style={{ color: '#2D241B' }}>{broker.name}</p>
                      <span className="text-[9px] shrink-0" style={{ color: '#B0A090' }}>{broker.time}</span>
                    </div>
                    <p className="text-[9px] leading-tight" style={{ color: '#8B7355' }}>{broker.company} · {broker.role}</p>
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 line-clamp-3 text-[11px] leading-relaxed" style={{ color: '#8B7355' }}>
                    {latestBroker.text}
                  </p>
                  {unread > 0 && (
                    <span
                      className="mt-0.5 shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: 'rgba(139,115,85,0.10)', color: '#8B7355', border: '1px solid rgba(139,115,85,0.18)' }}
                    >
                      {unread} unread
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="flex-1 rounded-xl border px-3 py-3 flex items-center gap-2.5"
                style={{ borderColor: 'rgba(139,115,85,0.08)', background: 'rgba(139,115,85,0.02)' }}
              >
                <img src={broker.avatar} alt={broker.name} className="h-8 w-8 rounded-full object-cover shrink-0 opacity-60" />
                <div>
                  <p className="text-[10px] font-semibold" style={{ color: '#2D241B' }}>{broker.name}</p>
                  <p className="text-[10px]" style={{ color: '#B0A090' }}>No broker messages yet</p>
                </div>
              </div>
            )}

            {/* AI Negotiation Insight */}
            <div
              className="rounded-xl border px-3.5 py-2.5"
              style={{ borderColor: 'rgba(139,115,85,0.14)', background: 'rgba(139,115,85,0.04)' }}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                    style={{ background: 'rgba(139,115,85,0.12)' }}
                  >
                    <Brain className="h-3 w-3" style={{ color: '#8B7355' }} strokeWidth={1.5} />
                  </div>
                  <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: '#8B7355' }}>
                    AI Negotiation Insight
                  </p>
                </div>
                <span
                  className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: 'rgba(168,148,120,0.12)', color: '#A89478', border: '1px solid rgba(168,148,120,0.22)' }}
                >
                  High Confidence
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: '#8B7355' }}>{meta.aiRecommendation}</p>
            </div>

          </div>

        </div>

        {/* ── Actions bar ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: '#8B7355' }}>
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#8B7355' }} />
              Live sync
            </span>
            <div className="h-3 w-px" style={{ background: 'rgba(139,115,85,0.15)' }} />
            <button
              onClick={() => router.push(`/investor/properties/${dealId}`)}
              className="inline-flex items-center gap-1 text-[10px] font-medium cursor-pointer hover:underline"
              style={{ color: '#8B7355' }}
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              View Property
            </button>
          </div>

          <div className="flex items-center gap-2">
            {state.status === 'active' && state.counterOffer > 0 && (
              <>
                <button
                  onClick={() => openModal('counter')}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer hover:opacity-75"
                  style={{ borderColor: 'rgba(139,115,85,0.20)', background: '#FFF9F0', color: '#8B7355' }}
                >
                  <TrendingDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Counter
                </button>
                <button
                  onClick={() => openModal('accept')}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer hover:opacity-80"
                  style={{ borderColor: 'rgba(139,115,85,0.25)', background: 'rgba(139,115,85,0.07)', color: '#8B7355' }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  Accept
                </button>
              </>
            )}
            {state.status === 'stalled' && (
              <span
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium"
                style={{ borderColor: 'rgba(158,123,74,0.28)', background: 'rgba(158,123,74,0.07)', color: '#9E7B4A' }}
              >
                <Timer className="h-3.5 w-3.5" strokeWidth={1.5} />
                Awaiting Response
              </span>
            )}
            <button
              onClick={() => router.push(`/investor/negotiations/${dealId}`)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white cursor-pointer transition-all duration-200 hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #8B7355, #6F5C46)',
                boxShadow: '0 8px 20px rgba(139,115,85,.20)',
              }}
            >
              Open Deal
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Counter / Accept modal ── */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-2xl border shadow-2xl"
              style={{ borderColor: 'rgba(139,115,85,0.12)', background: '#FFFDF8' }}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                {!modalDone ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                    <button
                      onClick={() => setModal(null)}
                      className="absolute right-4 top-4 cursor-pointer transition-opacity hover:opacity-60"
                      style={{ color: '#8B7355' }}
                    >
                      <X className="h-5 w-5" />
                    </button>

                    {modal === 'counter' && (
                      <>
                        <h3 className="mb-1 text-base font-semibold" style={{ color: '#2D241B' }}>Counter Offer</h3>
                        <p className="mb-5 text-xs" style={{ color: '#8B7355' }}>{meta.property}</p>
                        <div>
                          <label className="mb-1.5 block text-xs font-medium" style={{ color: '#8B7355' }}>
                            Your counter amount ({meta.currency})
                          </label>
                          <input
                            type="number"
                            value={counterAmt}
                            onChange={(e) => setCounterAmt(Number(e.target.value))}
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
                            style={{ borderColor: 'rgba(139,115,85,0.18)', background: '#FFF9F0', color: '#2D241B' }}
                            onFocus={e => (e.currentTarget.style.borderColor = '#8B7355')}
                            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(139,115,85,0.18)')}
                          />
                          <p className="mt-2 text-xs" style={{ color: '#8B7355' }}>
                            Asking price:{' '}
                            <span className="font-semibold" style={{ color: '#2D241B' }}>
                              {fmt(state.counterOffer, meta.currency)}
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={submitCounter}
                          disabled={counterAmt <= 0}
                          className="mt-5 w-full cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, #8B7355, #A89478)' }}
                        >
                          Submit Counter Offer
                        </button>
                      </>
                    )}

                    {modal === 'accept' && (
                      <>
                        <h3 className="mb-1 text-base font-semibold" style={{ color: '#2D241B' }}>Accept Asking Price</h3>
                        <p className="mb-4 text-xs" style={{ color: '#8B7355' }}>{meta.property}</p>
                        <p className="mb-5 text-sm leading-relaxed" style={{ color: '#8B7355' }}>
                          Accept the asking price of{' '}
                          <strong style={{ color: '#2D241B' }}>{fmt(state.counterOffer, meta.currency)}</strong>?{' '}
                          This moves the deal to the accepted stage.
                        </p>
                        <button
                          onClick={acceptOffer}
                          className="w-full cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, #8B7355, #A89478)' }}
                        >
                          Confirm Acceptance
                        </button>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-8 text-center"
                  >
                    <div
                      className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                      style={{ background: 'rgba(139,115,85,0.10)' }}
                    >
                      <Check className="h-7 w-7" style={{ color: '#8B7355' }} />
                    </div>
                    <h3 className="mb-1 text-base font-semibold" style={{ color: '#2D241B' }}>
                      {modal === 'counter' ? 'Counter Offer Sent' : 'Offer Accepted'}
                    </h3>
                    <p className="mb-6 text-sm" style={{ color: '#8B7355' }}>
                      {modal === 'counter'
                        ? 'Your counter has been submitted to the broker.'
                        : 'The deal is now marked as accepted.'}
                    </p>
                    <button
                      onClick={() => setModal(null)}
                      className="cursor-pointer rounded-lg border px-6 py-2 text-sm font-medium transition-all hover:opacity-80"
                      style={{ borderColor: 'rgba(139,115,85,0.18)', background: '#FFF9F0', color: '#8B7355' }}
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Page ─── */

type FilterStatus = 'all' | 'active' | 'stalled' | 'accepted';
type SortKey      = 'score' | 'gap' | 'latest';

/** Read a NegotiationState from localStorage synchronously (no React) */
function readLS(id: string): NegotiationState | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY(id)) : null;
    return raw ? (JSON.parse(raw) as NegotiationState) : null;
  } catch { return null; }
}

const EMPTY: NegotiationState = { messages: [], status: 'active', currentOffer: 0, counterOffer: 0, dealScore: 0, history: [] };

export default function InvestorNegotiationsPage() {
  const [filter, setFilter]     = useState<FilterStatus>('all');
  const [sort, setSort]         = useState<SortKey>('score');
  const [showSort, setShowSort] = useState(false);

  /* ── pipeline leads ── */
  const { leads, isHydrated } = useLeadPipeline();

  const pipelineLeads = useMemo(() => {
    if (!isHydrated) return [];
    return leads
      .filter(l => l.propertyId && l.propertyId !== 'legacy-unknown' && !ALL_DEAL_IDS.includes(l.propertyId))
      .reduce<typeof leads>((acc, l) => {
        if (!acc.some(x => x.propertyId === l.propertyId)) acc.push(l);
        return acc;
      }, []);
  }, [leads, isHydrated]);

  /* ── pipeline states (polled from localStorage) ── */
  const [pipelineStates, setPipelineStates] = useState<Record<string, NegotiationState>>({});

  useEffect(() => {
    if (pipelineLeads.length === 0) return;
    function refresh() {
      const next: Record<string, NegotiationState> = {};
      for (const l of pipelineLeads) {
        next[l.propertyId] = readLS(l.propertyId) ?? EMPTY;
      }
      setPipelineStates(next);
    }
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, [pipelineLeads]);

  /* ── static deal states (via hooks — stable 3-element loop) ── */
  const dealData = ALL_DEAL_IDS.map(id => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { state } = useNegotiation(id);
    return { id, state, meta: NEGOTIATION_META[id], isPipeline: false };
  });

  /* ── pipeline deal rows (state from pipelineStates) ── */
  const pipelineRows = pipelineLeads.map(lead => ({
    id:         lead.propertyId,
    state:      pipelineStates[lead.propertyId] ?? EMPTY,
    meta:       null as null,            // no static meta; overrideMeta passed in render
    lead,
    isPipeline: true,
  }));

  /* ── unified counts (all 6 deals) ── */
  const allRows = [...dealData, ...pipelineRows];

  const totalCount    = allRows.length;
  const activeCount   = allRows.filter(d => d.state.status === 'active').length;
  const stalledCount  = allRows.filter(d => d.state.status === 'stalled').length;
  const acceptedCount = allRows.filter(d => d.state.status === 'accepted').length;

  /* ── KPI values (all deals) ── */
  const totalGap        = allRows.reduce((s, d) => s + Math.max(0, d.state.counterOffer - d.state.currentOffer), 0);
  const avgScore        = allRows.length > 0 ? Math.round(allRows.reduce((s, d) => s + d.state.dealScore, 0) / allRows.length) : 0;
  const totalOfferValue = allRows.reduce((s, d) => s + d.state.currentOffer, 0);

  /* ── filter + sort ── */
  const filtered = allRows.filter(d => filter === 'all' || d.state.status === filter);
  const sorted   = [...filtered].sort((a, b) => {
    if (sort === 'score') return b.state.dealScore - a.state.dealScore;
    if (sort === 'gap')   return (a.state.counterOffer - a.state.currentOffer) - (b.state.counterOffer - b.state.currentOffer);
    return 0;
  });

  const filterTabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all',      label: 'All Deals',  count: totalCount    },
    { key: 'active',   label: 'Active',     count: activeCount   },
    { key: 'stalled',  label: 'Stalled',    count: stalledCount  },
    { key: 'accepted', label: 'Accepted',   count: acceptedCount },
  ];

  const sortLabels: Record<SortKey, string> = {
    score: 'Deal Score', gap: 'Smallest Gap', latest: 'Latest Activity',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as any }}
      className="w-full"
    >
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-7 pb-8">

      {/* ── Header ── */}
      <InvestorPageHeader
        icon={Zap}
        title="My Negotiations"
        subtitle="Live deal tracking · AI-powered insights"
        actions={
          <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
              style={{ color: '#8B7355', background: 'rgba(139,115,85,0.08)', borderColor: 'rgba(139,115,85,0.22)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#8B7355' }} />
              {activeCount} active
            </span>
          )}
          {stalledCount > 0 && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
              style={{ color: '#9E7B4A', background: 'rgba(158,123,74,0.08)', borderColor: 'rgba(158,123,74,0.28)' }}
            >
              <AlertTriangle className="h-3 w-3" strokeWidth={2} />
              {stalledCount} stalled
            </span>
          )}
          </div>
        }
      />

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryKPI
          icon={Activity} label="Active Deals" value={`${activeCount}`} sub={`${totalCount} total`}
          color="#8B7355" sparkPoints={[1, 2, 2, 3, 2, 3, activeCount || 1]}
        />
        <SummaryKPI
          icon={Target} label="Avg. Deal Score" value={`${avgScore}/100`} sub="composite rating"
          color="#8B7355" sparkPoints={[55, 60, 58, 65, 68, 71, avgScore]}
        />
        <SummaryKPI
          icon={BarChart3} label="Total Offer Value" value={`₹${(totalOfferValue / 1_000_000).toFixed(1)}M`} sub="across all deals"
          color="#A89478" sparkPoints={[12, 14, 13, 15, 16, 18, Math.round(totalOfferValue / 1_000_000) || 1]}
        />
        <SummaryKPI
          icon={TrendingUp} label="Total Gap to Close" value={`₹${(totalGap / 1_000).toFixed(0)}K`} sub="combined delta"
          color="#A89478" sparkPoints={[900, 820, 760, 700, 640, 580, Math.round(totalGap / 1_000) || 1]}
        />
      </div>

      {/* ── Filter + sort bar ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          className="flex items-center gap-1 rounded-xl border p-1"
          style={{ borderColor: 'rgba(139,115,85,0.10)', background: 'rgba(255,255,255,0.94)' }}
        >
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer"
              style={filter === tab.key ? { background: '#8B7355', color: '#fff' } : { color: '#8B7355' }}
            >
              {tab.label}
              <span
                className="text-[9px] font-bold rounded-full px-1 py-0.5 min-w-[16px] text-center"
                style={
                  filter === tab.key
                    ? { background: 'rgba(255,255,255,0.22)', color: '#fff' }
                    : { background: 'rgba(139,115,85,0.08)', color: '#8B7355' }
                }
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSort(!showSort)}
            className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-medium transition-colors cursor-pointer"
            style={{ borderColor: 'rgba(139,115,85,0.10)', background: 'rgba(255,255,255,0.94)', color: '#8B7355' }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            Sort: {sortLabels[sort]}
          </button>
          <AnimatePresence>
            {showSort && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-xl border shadow-lg overflow-hidden"
                style={{ borderColor: 'rgba(139,115,85,0.12)', background: '#FFFDF8' }}
              >
                {(Object.entries(sortLabels) as [SortKey, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setSort(key); setShowSort(false); }}
                    className="w-full px-3.5 py-2.5 text-left text-[11px] font-medium transition-colors cursor-pointer"
                    style={sort === key ? { color: '#8B7355', background: 'rgba(139,115,85,0.07)' } : { color: '#8B7355' }}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Unified deal cards list ── */}
      <div className="flex flex-col gap-5">
        <AnimatePresence mode="popLayout">
          {sorted.length > 0 ? (
            sorted.map((row, i) => {
              if (row.isPipeline) {
                const pl = (row as typeof pipelineRows[number]).lead;
                return (
                  <DealCard
                    key={row.id}
                    dealId={row.id}
                    index={i}
                    overrideMeta={{
                      property: pl.propertyName,
                      investor: pl.investorName,
                      currency: pl.investorBudget?.currency ?? 'INR',
                      location: pl.propertyLocation,
                      type: 'Property',
                      bedrooms: 0,
                      area: 0,
                      aiRecommendation:
                        'This negotiation is in progress with your broker. Check the offer status and latest messages above.',
                    }}
                  />
                );
              }
              return <DealCard key={row.id} dealId={row.id} index={i} />;
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16"
              style={{ borderColor: 'rgba(139,115,85,0.15)', background: 'rgba(255,255,255,0.60)' }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: 'rgba(139,115,85,0.06)' }}
              >
                <Filter className="h-5 w-5" style={{ color: '#8B7355' }} strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-medium" style={{ color: '#8B7355' }}>No deals match this filter</p>
              <button
                onClick={() => setFilter('all')}
                className="text-[11px] hover:underline cursor-pointer"
                style={{ color: '#8B7355' }}
              >
                Clear filter
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
    </motion.div>
  );
}
