'use client';

import { use, useState, useRef, useEffect, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, TrendingUp, TrendingDown, Minus, Send,
  ChevronDown, ChevronUp, ArrowLeft, MapPin, Building2,
  Bed, Maximize2, Download, Phone, Share2,
  CheckCircle, Clock, MessageSquare, Activity,
  BarChart3, Calendar, Image as ImageIcon,
} from 'lucide-react';
import { useNegotiation, NEGOTIATION_META } from '@/lib/negotiations-store';

/* ─── palette ─── */
const P = {
  primary:    '#C8922A',
  primaryHov: '#A07820',
  accent:     '#EAB84A',
  softBg:     '#FFF9F0',
  softBorder: '#F6E7C8',
  textMain:   '#2D241B',
  textMuted:  '#8B7355',
  cardBg:     '#FFFFFF',
  pageBg:     '#FAF8F4',
  border:     '#F2E8D5',
  shadow:     '0 10px 30px rgba(0,0,0,.05)',
} as const;

/* ─── property images ─── */
const PROP_IMAGES: Record<string, string> = {
  'prop-001': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop&q=80',
  'prop-002': 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=500&fit=crop&q=80',
  'prop-003': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop&q=80',
};

/* ─── helpers ─── */
function fmt(n: number, currency: string) {
  if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${currency} ${(n / 1_000).toFixed(0)}K`;
  return `${currency} ${n.toLocaleString()}`;
}

const DEAL_BROKERS: Record<string, { name: string; company: string; avatar: string }> = {
  'prop-001': {
    name: 'James Okafor',
    company: 'Global Realty Partners',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80',
  },
  'prop-002': {
    name: 'Aisha Rahman',
    company: 'Prime Assets',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80',
  },
  'prop-003': {
    name: 'Marcus Chen',
    company: 'Harbor Investments',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80',
  },
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  active:   { label: 'Active',   color: '#C8922A', bg: 'rgba(200,146,42,0.08)', border: 'rgba(200,146,42,0.22)' },
  stalled:  { label: 'Stalled',  color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)'  },
  accepted: { label: 'Accepted', color: '#7C5C3A', bg: 'rgba(124,92,58,0.08)', border: 'rgba(124,92,58,0.22)'   },
  closed:   { label: 'Closed',   color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.22)' },
};

const AI_ACTIONS = [
  { label: 'Increase Slightly', icon: '↑' },
  { label: 'Hold Offer',        icon: '⏸' },
  { label: 'Wait Response',     icon: '⌛' },
];

/* ─── Deal Score Ring ─── */
function DealScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const label = score >= 70 ? 'High Probability' : score >= 50 ? 'Medium Probability' : 'Low Probability';
  return (
    <div
      className="rounded-[20px] border p-6 flex flex-col items-center gap-4"
      style={{ background: P.cardBg, borderColor: P.border, boxShadow: P.shadow }}
    >
      <h3 className="text-sm font-bold self-start" style={{ color: P.textMain }}>Deal Score</h3>
      <div className="relative flex items-center justify-center" style={{ width: 128, height: 128 }}>
        <svg className="absolute inset-0 -rotate-90" width="128" height="128" viewBox="0 0 128 128">
          <defs>
            <linearGradient id="detailScoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={P.primary} />
              <stop offset="100%" stopColor={P.accent} />
            </linearGradient>
          </defs>
          <circle cx="64" cy="64" r={r} fill="none" stroke={P.softBorder} strokeWidth="9" />
          <circle
            cx="64" cy="64" r={r} fill="none"
            stroke="url(#detailScoreGrad)" strokeWidth="9"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        <div className="text-center z-10">
          <div className="text-3xl font-bold" style={{ color: P.primary }}>{score}</div>
          <div className="text-xs" style={{ color: P.textMuted }}>/100</div>
        </div>
      </div>
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
        style={{ color: P.primary, background: P.softBg, borderColor: P.softBorder }}
      >
        <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: P.accent }} />
        {label}
      </div>
      <p className="text-center text-xs" style={{ color: P.textMuted }}>Based on market data &amp; negotiation progress</p>
    </div>
  );
}

/* ─── Page ─── */
export default function InvestorNegotiationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const meta    = NEGOTIATION_META[id] ?? NEGOTIATION_META['prop-001'];
  const { state, sendMessage } = useNegotiation(id);
  const broker    = DEAL_BROKERS[id] ?? DEAL_BROKERS['prop-001'];
  const statusCfg = STATUS_CFG[state.status] ?? STATUS_CFG.closed;
  const propImg   = PROP_IMAGES[id] ?? PROP_IMAGES['prop-001'];

  const [msgText, setMsgText]               = useState('');
  const [histExpanded, setHistExpanded]     = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [actionDone, setActionDone]         = useState<string | null>(null);
  const msgEndRef          = useRef<HTMLDivElement>(null);
  const actionTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any pending timer when component unmounts to prevent setState-after-unmount
  useEffect(() => {
    return () => {
      if (actionTimerRef.current !== null) clearTimeout(actionTimerRef.current);
    };
  }, []);

  function handleQuickAction(label: string) {
    if (label === 'Download Summary') {
      window.print();
    } else if (label === 'Share Offer') {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    } else if (label === 'Schedule Call') {
      window.open(
        `mailto:${broker.name.toLowerCase().replace(' ', '.')}@glimmora.com` +
        `?subject=Schedule Call — ${meta.property}` +
        `&body=Hello, I would like to schedule a call to discuss the offer for ${meta.property}.`,
        '_blank',
      );
    }
    setActionDone(label);
    if (actionTimerRef.current !== null) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => {
      actionTimerRef.current = null;
      setActionDone(null);
    }, 2500);
  }

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const visibleHistory = histExpanded ? state.history : state.history.slice(-4);

  const gap         = state.counterOffer - state.currentOffer;
  const gapPct      = ((gap / state.counterOffer) * 100).toFixed(1);
  const firstOffer  = state.history[0]?.offer ?? state.currentOffer;
  const rangeTotal  = state.counterOffer - firstOffer;
  const rangeFilled = state.currentOffer - firstOffer;
  const progressPct = rangeTotal > 0 ? Math.round((rangeFilled / rangeTotal) * 100) : 0;

  function handleSend() {
    if (!msgText.trim()) return;
    sendMessage(msgText.trim(), 'Investor');
    setMsgText('');
  }

  const cardStyle: CSSProperties = {
    background:   P.cardBg,
    border:       `1px solid ${P.border}`,
    borderRadius: 20,
    boxShadow:    P.shadow,
    transition:   'all .25s ease',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as any }}
      style={{ background: P.pageBg, minHeight: '100vh' }}
    >
      <div className="mx-auto max-w-[1440px]" style={{ padding: 24 }}>

        {/* ── Top back nav row ── */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium cursor-pointer transition-all duration-200 hover:opacity-75"
            style={{ borderColor: P.softBorder, background: P.softBg, color: P.textMuted }}
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to Negotiations
          </button>
          <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: P.primary }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: P.primary }} />
            Live sync
          </span>
        </div>

        {/* ── Property Hero Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.04, ease: [0.16, 1, 0.3, 1] as any }}
          className="mb-5 overflow-hidden rounded-[20px] border flex flex-col sm:flex-row gap-0"
          style={{ background: P.cardBg, borderColor: P.border, boxShadow: P.shadow }}
        >
          {/* Property image */}
          <div
            className="relative flex-shrink-0 overflow-hidden"
            style={{ width: '100%', maxWidth: 320, minHeight: 200 }}
          >
            <img
              src={propImg}
              alt={meta.property}
              className="w-full h-full object-cover"
              style={{ minHeight: 200 }}
              loading="eager"
            />
            {/* Dark overlay */}
            <div className="absolute inset-0" style={{ background: 'rgba(20,12,6,0.12)' }} />
            {/* Photo counter badge */}
            <div
              className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
            >
              <ImageIcon className="h-3 w-3 text-white/80" strokeWidth={1.5} />
              <span className="text-[10px] font-medium text-white/90">1 / 3</span>
            </div>
            {/* Status ribbon on image */}
            <div
              className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border"
              style={{ color: statusCfg.color, background: 'rgba(255,255,255,0.90)', borderColor: statusCfg.border, backdropFilter: 'blur(8px)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusCfg.color }} />
              {statusCfg.label}
            </div>
          </div>

          {/* Property info */}
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <h2 className="text-xl font-bold mb-1.5 leading-tight" style={{ color: P.textMain }}>
                {meta.property}
              </h2>
              <p className="flex items-center gap-1.5 text-sm mb-4" style={{ color: P.textMuted }}>
                <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                {meta.location}
                <span className="mx-1" style={{ color: P.softBorder }}>·</span>
                {meta.type}
              </p>

              {/* Property chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {meta.bedrooms > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                    style={{ borderColor: P.softBorder, background: P.softBg, color: P.textMuted }}
                  >
                    <Bed className="h-3 w-3" strokeWidth={1.5} />
                    {meta.bedrooms} Bed
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{ borderColor: P.softBorder, background: P.softBg, color: P.textMuted }}
                >
                  <Maximize2 className="h-3 w-3" strokeWidth={1.5} />
                  {meta.area.toLocaleString()} sqft
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  style={{ borderColor: P.softBorder, background: P.softBg, color: P.textMuted }}
                >
                  <Building2 className="h-3 w-3" strokeWidth={1.5} />
                  {meta.type}
                </span>
              </div>
            </div>

            {/* Bottom row: offer value + last updated */}
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-0.5" style={{ color: P.textMuted }}>
                  Your Offer
                </p>
                <p className="text-2xl font-bold" style={{ color: P.primary }}>
                  {fmt(state.currentOffer, meta.currency)}
                </p>
                <p className="text-xs mt-0.5" style={{ color: P.textMuted }}>
                  Asking: {fmt(state.counterOffer, meta.currency)}
                </p>
              </div>
              <p className="text-xs pb-0.5" style={{ color: P.textMuted }}>Last updated 2h ago</p>
            </div>
          </div>
        </motion.div>

        {/* ── Main Content Grid ── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

          {/* ════════════ LEFT 70% ════════════ */}
          <div className="flex flex-col gap-5">

            {/* ── 1. Offer Overview ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08, ease: [0.16, 1, 0.3, 1] as any }}
              style={cardStyle}
              className="p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={{ color: P.textMain }}>Offer Overview</h3>
                {state.status === 'accepted' && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
                    style={{ color: '#7C5C3A', background: 'rgba(124,92,58,0.08)', borderColor: 'rgba(124,92,58,0.22)' }}
                  >
                    <CheckCircle className="h-3 w-3" strokeWidth={2} /> Deal Accepted
                  </span>
                )}
              </div>

              {/* 3 metric cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  {
                    icon: TrendingUp, label: 'Your Offer',
                    value: fmt(state.currentOffer, meta.currency),
                    trend: `↑ from ${fmt(firstOffer, meta.currency)}`,
                    iconColor: P.primary, bg: P.softBg, border: P.softBorder,
                  },
                  {
                    icon: Minus, label: 'Asking Price',
                    value: fmt(state.counterOffer, meta.currency),
                    trend: 'Listed price',
                    iconColor: P.textMuted, bg: '#F9F9F9', border: '#EBEBEB',
                  },
                  {
                    icon: TrendingDown, label: 'Remaining Gap',
                    value: fmt(gap, meta.currency),
                    trend: `${gapPct}% below asking`,
                    iconColor: '#F59E0B', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.20)',
                  },
                ].map(({ icon: Icon, label, value, trend, iconColor, bg, border }) => (
                  <div key={label} className="rounded-[14px] p-4 border" style={{ background: bg, borderColor: border }}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${iconColor}18` }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: iconColor }} strokeWidth={1.75} />
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: P.textMuted }}>{label}</span>
                    </div>
                    <p className="text-xl font-bold mb-1" style={{ color: P.textMain }}>{value}</p>
                    <p className="text-[10px]" style={{ color: P.textMuted }}>{trend}</p>
                  </div>
                ))}
              </div>

              {/* Interactive progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: P.textMuted }}>Negotiation Progress</span>
                  <span className="text-xs font-semibold" style={{ color: P.primary }}>
                    {progressPct}% closed · {gapPct}% gap remaining
                  </span>
                </div>
                <div className="relative h-3 rounded-full overflow-hidden" style={{ background: '#F2E8D5' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any }}
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${P.primary}, ${P.accent})` }}
                  />
                  <motion.div
                    initial={{ left: 0 }}
                    animate={{ left: `calc(${progressPct}% - 6px)` }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as any }}
                    className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-white"
                    style={{ background: P.accent, boxShadow: `0 0 0 3px rgba(200,146,42,0.25)` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px]" style={{ color: P.textMuted }}>{fmt(firstOffer, meta.currency)} · Start</span>
                  <span className="text-[10px]" style={{ color: P.textMuted }}>{fmt(state.counterOffer, meta.currency)} · Asking</span>
                </div>
              </div>

              {/* Deal confidence strip */}
              <div
                className="flex items-start gap-2.5 rounded-xl px-4 py-3 border"
                style={{ background: P.softBg, borderColor: P.softBorder }}
              >
                <Activity className="h-4 w-4 shrink-0 mt-0.5" style={{ color: P.primary }} strokeWidth={1.5} />
                <p className="text-xs leading-relaxed" style={{ color: P.textMuted }}>
                  <strong style={{ color: P.textMain }}>Deal confidence: </strong>
                  {state.dealScore >= 70
                    ? "High probability of closure. You're within the seller's acceptable range."
                    : state.dealScore >= 50
                      ? 'Moderate confidence. A slight offer increase could accelerate closure.'
                      : 'Lower confidence. The gap is significant — a strategic counter is recommended.'}
                </p>
              </div>
            </motion.div>

            {/* ── 2. AI Negotiation Insight ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.12, ease: [0.16, 1, 0.3, 1] as any }}
              style={cardStyle}
              className="p-6"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `linear-gradient(135deg, ${P.primary}, ${P.accent})` }}
                  >
                    <Brain className="h-5 w-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: P.textMain }}>AI Negotiation Insight</h3>
                    <p className="text-[10px]" style={{ color: P.textMuted }}>Powered by Glimmora AI</p>
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold flex-shrink-0"
                  style={{ color: P.accent, background: 'rgba(234,184,74,0.10)', borderColor: 'rgba(234,184,74,0.25)' }}
                >
                  ✦ High Confidence
                </span>
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color: P.textMuted }}>
                {meta.aiRecommendation}
              </p>

              {/* Suggested action pills */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: P.textMuted }}>
                  Suggested Next Step
                </p>
                <div className="flex flex-wrap gap-2">
                  {AI_ACTIONS.map(({ label, icon }) => {
                    const isSelected = selectedAction === label;
                    return (
                      <button
                        key={label}
                        onClick={() => setSelectedAction(isSelected ? null : label)}
                        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold cursor-pointer transition-all duration-200"
                        style={
                          isSelected
                            ? {
                                background: `linear-gradient(135deg, ${P.primary}, ${P.accent})`,
                                borderColor: P.primary,
                                color: '#fff',
                                boxShadow: `0 4px 12px rgba(200,146,42,0.28)`,
                                transform: 'translateY(-1px)',
                              }
                            : {
                                borderColor: P.softBorder,
                                background: P.softBg,
                                color: P.primary,
                              }
                        }
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = P.primary;
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,146,42,0.06)';
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = P.softBorder;
                            (e.currentTarget as HTMLButtonElement).style.background = P.softBg;
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        <span>{icon}</span>
                        {label}
                        {isSelected && (
                          <span
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                            style={{ background: 'rgba(255,255,255,0.25)' }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedAction && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 text-xs rounded-lg px-3 py-2 border"
                    style={{ color: P.primary, background: 'rgba(200,146,42,0.06)', borderColor: P.softBorder }}
                  >
                    {selectedAction === 'Increase Slightly' &&
                      `Recommended: Counter with ${fmt(Math.round(state.currentOffer * 1.02), meta.currency)} (+2%).`}
                    {selectedAction === 'Hold Offer' &&
                      `Strategy: Maintain your offer at ${fmt(state.currentOffer, meta.currency)} and wait for the seller to respond.`}
                    {selectedAction === 'Wait Response' &&
                      "Be patient — the seller is still deliberating. Responding too quickly may signal urgency."}
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* ── 3. Chat With Broker ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.16, ease: [0.16, 1, 0.3, 1] as any }}
              style={{ ...cardStyle, overflow: 'hidden', padding: 0 }}
            >
              {/* Chat header */}
              <div
                className="flex items-center justify-between px-5 py-4 border-b"
                style={{ background: P.softBg, borderColor: P.softBorder }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img src={broker.avatar} alt={broker.name} className="h-10 w-10 rounded-full object-cover" />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white"
                      style={{ background: '#8B6B47' }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: P.textMain }}>{broker.name}</p>
                    <p className="text-[10px]" style={{ color: P.textMuted }}>{broker.company}</p>
                  </div>
                </div>
                <span
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium border"
                  style={{ color: '#8B6B47', background: 'rgba(139,107,71,0.10)', borderColor: 'rgba(139,107,71,0.25)' }}
                >
                  <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: '#8B6B47' }} />
                  Live
                </span>
              </div>

              {/* Messages */}
              <div className="min-h-[220px] max-h-72 overflow-y-auto p-5 space-y-4" style={{ background: P.pageBg }}>
                {state.messages.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-10">
                    <MessageSquare className="h-8 w-8" style={{ color: P.softBorder }} strokeWidth={1.5} />
                    <p className="text-xs" style={{ color: P.textMuted }}>No messages yet. Start the conversation.</p>
                  </div>
                )}
                {state.messages.map((m) => {
                  const isInvestor = m.sender === 'Investor';
                  return (
                    <div key={m.id} className={`flex items-end gap-2.5 ${isInvestor ? 'justify-end' : 'justify-start'}`}>
                      {!isInvestor && (
                        <img src={broker.avatar} alt={broker.name} className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                      )}
                      <div
                        className="max-w-[72%] px-4 py-2.5"
                        style={
                          isInvestor
                            ? { background: `linear-gradient(135deg, ${P.primary}, ${P.accent})`, borderRadius: '18px 18px 4px 18px' }
                            : { background: '#EFE4D4', border: `1px solid ${P.softBorder}`, borderRadius: '18px 18px 18px 4px' }
                        }
                      >
                        <p className="text-sm leading-relaxed" style={{ color: isInvestor ? '#fff' : P.textMain }}>{m.text}</p>
                        <p className="mt-1 text-[10px]" style={{ color: isInvestor ? 'rgba(255,255,255,0.65)' : P.textMuted }}>
                          {isInvestor ? 'You' : broker.name} · {m.time}
                        </p>
                      </div>
                      {isInvestor && (
                        <div
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: `linear-gradient(135deg, ${P.primary}, ${P.accent})` }}
                        >
                          Y
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-t" style={{ borderColor: P.softBorder, background: P.cardBg }}>
                <input
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type your message…"
                  className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none transition-all duration-200"
                  style={{ borderColor: P.softBorder, background: P.softBg, color: P.textMain }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = P.primary)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = P.softBorder)}
                />
                <button
                  onClick={handleSend}
                  disabled={!msgText.trim()}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white cursor-pointer transition-all duration-200 hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg, ${P.primary}, ${P.accent})` }}
                >
                  <Send className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            </motion.div>

            {/* ── 4. Offer History / Timeline ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.20, ease: [0.16, 1, 0.3, 1] as any }}
              style={cardStyle}
              className="p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold" style={{ color: P.textMain }}>
                  Offer History
                  <span className="ml-2 text-xs font-normal" style={{ color: P.textMuted }}>({state.history.length} rounds)</span>
                </h3>
                {state.history.length > 4 && (
                  <button
                    onClick={() => setHistExpanded((p) => !p)}
                    className="flex items-center gap-1 text-xs font-medium cursor-pointer transition-all duration-200 hover:opacity-75"
                    style={{ color: P.primary }}
                  >
                    {histExpanded
                      ? <><ChevronUp className="h-3.5 w-3.5" strokeWidth={2} /> Show less</>
                      : <><ChevronDown className="h-3.5 w-3.5" strokeWidth={2} /> Show all</>}
                  </button>
                )}
              </div>

              <div className="relative">
                <div
                  className="absolute left-[17px] top-3 bottom-3 w-px"
                  style={{ background: `linear-gradient(180deg, ${P.softBorder}, transparent)` }}
                />
                <div className="space-y-3">
                  {visibleHistory.map((round, i) => {
                    const isBuyer  = round.by === 'Buyer';
                    const prev     = i > 0 ? visibleHistory[i - 1].offer : null;
                    const delta    = prev !== null ? round.offer - prev : null;
                    const isLatest = i === visibleHistory.length - 1;
                    return (
                      <motion.div
                        key={round.round}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.28, delay: i * 0.05 }}
                        className="flex items-center gap-4 rounded-xl border p-4"
                        style={{
                          background:  isLatest ? P.softBg : P.cardBg,
                          borderColor: isLatest ? P.softBorder : '#EBEBEB',
                          boxShadow:   isLatest ? '0 4px 12px rgba(200,146,42,0.08)' : 'none',
                          transition:  'all .25s ease',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{
                            background: isLatest ? `linear-gradient(135deg, ${P.primary}, ${P.accent})` : 'rgba(200,146,42,0.15)',
                            color: isLatest ? '#fff' : P.primary,
                          }}
                        >
                          {round.round}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold" style={{ color: P.textMain }}>
                              {fmt(round.offer, meta.currency)}
                            </p>
                            {delta !== null && (
                              <span
                                className="text-[10px] font-semibold"
                                style={{ color: delta > 0 ? '#7C5C3A' : delta < 0 ? '#ef4444' : P.textMuted }}
                              >
                                {delta > 0 ? '↑' : delta < 0 ? '↓' : '='} {Math.abs(delta).toLocaleString()}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] mt-0.5" style={{ color: P.textMuted }}>{round.date}</p>
                          {round.notes && <p className="text-[10px] italic mt-0.5" style={{ color: P.textMuted }}>{round.notes}</p>}
                        </div>
                        <span
                          className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold flex-shrink-0"
                          style={
                            isBuyer
                              ? { color: P.primary, background: P.softBg, borderColor: P.softBorder }
                              : { color: P.textMuted, background: '#F5F5F5', borderColor: '#E5E5E5' }
                          }
                        >
                          {isBuyer ? 'You' : 'Seller'}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

          </div>

          {/* ════════════ RIGHT SIDEBAR 30% ════════════ */}
          <div className="flex flex-col gap-5">

            {/* Deal Score Ring */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.10, ease: [0.16, 1, 0.3, 1] as any }}
            >
              <DealScoreRing score={state.dealScore} />
            </motion.div>

            {/* Property Details */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.14, ease: [0.16, 1, 0.3, 1] as any }}
              style={cardStyle}
              className="p-5"
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: P.textMain }}>Property Details</h3>
              <div className="space-y-3">
                {[
                  { icon: Building2, label: 'Type',       value: meta.type },
                  { icon: MapPin,    label: 'Location',   value: meta.location },
                  ...(meta.bedrooms > 0 ? [{ icon: Bed, label: 'Bedrooms', value: `${meta.bedrooms} BR` }] : []),
                  { icon: Maximize2, label: 'Area',       value: `${meta.area.toLocaleString()} sqft` },
                  { icon: BarChart3, label: 'Price/sqft', value: `${Math.round(state.counterOffer / meta.area).toLocaleString()} ${meta.currency}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: P.softBg }}>
                        <Icon className="h-3 w-3" style={{ color: P.primary }} strokeWidth={1.5} />
                      </div>
                      <span className="text-xs" style={{ color: P.textMuted }}>{label}</span>
                    </div>
                    <span className="text-xs font-semibold text-right" style={{ color: P.textMain }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t" style={{ borderColor: P.softBorder }}>
                <button
                  onClick={() => router.push(`/investor/properties/${id}`)}
                  className="w-full text-xs font-medium text-center cursor-pointer hover:underline"
                  style={{ color: P.primary }}
                >
                  View full property details →
                </button>
              </div>
            </motion.div>

            {/* Negotiation Stats */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.18, ease: [0.16, 1, 0.3, 1] as any }}
              style={cardStyle}
              className="p-5"
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: P.textMain }}>Negotiation Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Activity,      label: 'Rounds',        value: String(state.history.length),                             color: P.primary   },
                  { icon: Calendar,      label: 'Started',       value: state.history[0]?.date ?? '—',                           color: P.textMuted },
                  { icon: Clock,         label: 'Last Activity', value: state.history[state.history.length - 1]?.date ?? '—',    color: P.textMuted },
                  { icon: MessageSquare, label: 'Messages',      value: String(state.messages.length),                           color: P.primary   },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="rounded-xl p-3 border" style={{ background: P.softBg, borderColor: P.softBorder }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon className="h-3 w-3" style={{ color }} strokeWidth={1.5} />
                      <span className="text-[10px]" style={{ color: P.textMuted }}>{label}</span>
                    </div>
                    <p className="text-sm font-bold" style={{ color: P.textMain }}>{value}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.22, ease: [0.16, 1, 0.3, 1] as any }}
              style={cardStyle}
              className="p-5"
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: P.textMain }}>Quick Actions</h3>
              <div className="flex flex-col gap-2">
                {[
                  { icon: Download, label: 'Download Summary', done: '✓ PDF Ready'          },
                  { icon: Phone,    label: 'Schedule Call',    done: '✓ Email Opened'        },
                  { icon: Share2,   label: 'Share Offer',      done: '✓ Link Copied'         },
                ].map(({ icon: Icon, label, done }) => {
                  const isDone = actionDone === label;
                  return (
                    <button
                      key={label}
                      onClick={() => handleQuickAction(label)}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium cursor-pointer text-left"
                      style={{
                        borderColor: isDone ? P.primary : P.softBorder,
                        background:  isDone ? 'rgba(200,146,42,0.07)' : P.softBg,
                        color:       isDone ? P.primary : P.textMain,
                        transition:  'all .25s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isDone) {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 16px rgba(200,146,42,0.10)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = P.primary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDone) {
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = P.softBorder;
                        }
                      }}
                    >
                      <div
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background: isDone
                            ? `linear-gradient(135deg, ${P.primary}, ${P.accent})`
                            : P.softBg,
                          border: isDone ? 'none' : `1px solid ${P.softBorder}`,
                          transition: 'all .25s ease',
                        }}
                      >
                        {isDone
                          ? <CheckCircle className="h-3.5 w-3.5 text-white" strokeWidth={2} />
                          : <Icon className="h-3.5 w-3.5" style={{ color: P.primary }} strokeWidth={1.5} />}
                      </div>
                      <span style={{ transition: 'all .2s ease' }}>
                        {isDone ? done : label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
