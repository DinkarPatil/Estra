'use client';
import { use, useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Brain, CheckCircle, X, TrendingUp, TrendingDown, Minus,
  MessageSquare, Send, Building2, MapPin, Bed, Maximize2,
  Sparkles, ChevronDown, ChevronUp, Share2, Phone, Download, FileText,
} from 'lucide-react';
import { useNegotiation, NEGOTIATION_META } from '@/lib/negotiations-store';
import type { NegotiationState } from '@/lib/negotiations-store';
import { mockProperties } from '@/mock-data/properties';

/* ─── static assets ─────────────────────────────────────────────────────── */
const DEAL_THUMBNAILS: Record<string, string> = {
  'prop-001': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop&q=80',
  'prop-002': 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&h=500&fit=crop&q=80',
  'prop-003': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop&q=80',
};

/* ─── helpers ────────────────────────────────────────────────────────────── */
function scoreVariant(s: number) {
  if (s >= 70) return { ring: '#8B5A2B', glow: 'rgba(139,90,43,0.25)', text: 'text-primary-700', label: 'High Probability' };
  if (s >= 50) return { ring: '#f59e0b', glow: 'rgba(245,158,11,0.25)', text: 'text-warning', label: 'Medium Probability' };
  return { ring: '#ef4444', glow: 'rgba(239,68,68,0.25)', text: 'text-danger', label: 'Low Probability' };
}
function statusVariant(s: NegotiationState['status']): 'success' | 'warning' | 'secondary' | 'info' {
  if (s === 'active') return 'success';
  if (s === 'stalled') return 'warning';
  if (s === 'accepted') return 'info';
  return 'secondary';
}
function todayDate() { return new Date().toISOString().slice(0, 10); }
function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/* ─── PulsingDot ─────────────────────────────────────────────────────────── */
function PulsingDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B6B47] opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8B6B47]" />
    </span>
  );
}

/* ─── AnimatedCounter ────────────────────────────────────────────────────── */
function AnimatedCounter({ value, className }: { value: number; className?: string }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplayed(value); clearInterval(timer); }
      else setDisplayed(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <span className={className}>{displayed}</span>;
}

/* ─── TypingIndicator ────────────────────────────────────────────────────── */
function TypingIndicator({ name }: { name: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="flex justify-start">
      <div className="rounded-2xl rounded-bl-sm bg-[var(--bg-secondary)] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--fg-muted)]">{name} is typing</span>
          <div className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <motion.div key={i} className="h-1.5 w-1.5 rounded-full bg-[var(--fg-muted)]"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── fallback meta ──────────────────────────────────────────────────────── */
function buildFallbackMeta(propId: string) {
  const prop = mockProperties.find(p => p.id === propId);
  return {
    property: prop?.title ?? propId,
    investor: 'Investor',
    currency: prop?.price.currency ?? 'USD',
    location: prop ? `${prop.location.city}, ${prop.location.country}` : '',
    type: prop?.type ?? 'Property',
    bedrooms: prop?.bedrooms ?? 0,
    area: prop?.area?.value ?? 0,
    aiRecommendation: 'No AI recommendation available for this property yet.',
  };
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function BrokerNegotiationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const meta = NEGOTIATION_META[id] ?? buildFallbackMeta(id);
  const { state, update, sendMessage } = useNegotiation(id);

  /* modal */
  type Modal = 'counter' | 'accept' | null;
  const [modal, setModal] = useState<Modal>(null);
  const [done, setDone] = useState(false);

  /* quick actions feedback */
  const [quickDone, setQuickDone] = useState<string | null>(null);
  const quickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { return () => { if (quickTimerRef.current) clearTimeout(quickTimerRef.current); }; }, []);

  const handleQuickAction = useCallback((label: string) => {
    if (label === 'Share Proposal') {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    } else if (label === 'Schedule Call') {
      window.open(
        `mailto:${meta.investor.toLowerCase().replace(/\s+/g, '.')}@glimmora.com` +
        `?subject=Schedule Call — ${meta.property}` +
        `&body=Hello, I would like to schedule a call to discuss the offer for ${meta.property}.`,
        '_blank',
      );
    } else if (label === 'Download Summary') {
      window.print();
    } else if (label === 'Add Note') {
      const note = window.prompt('Add a note for this negotiation:');
      if (note) setQuickDone(`Note: ${note.slice(0, 30)}`);
      return;
    }
    setQuickDone(label);
    if (quickTimerRef.current) clearTimeout(quickTimerRef.current);
    quickTimerRef.current = setTimeout(() => { quickTimerRef.current = null; setQuickDone(null); }, 2500);
  }, [meta.investor, meta.property]);

  /* counter form */
  const midpoint = Math.round((state.currentOffer + state.counterOffer) / 2);
  const [counterAmt, setCounterAmt] = useState(midpoint);
  const [counterNotes, setCounterNotes] = useState('');

  /* chat */
  const [msgText, setMsgText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [state.messages, isTyping]);

  /* tabs */
  const [activeTab, setActiveTab] = useState<'history' | 'messages'>('history');

  /* history expand */
  const [histExpanded, setHistExpanded] = useState(false);
  const visibleHistory = histExpanded ? state.history : state.history.slice(-3);

  /* derived */
  const circumference = 2 * Math.PI * 48;
  const gap = state.counterOffer - state.currentOffer;
  const gapPct = ((gap / state.counterOffer) * 100).toFixed(1);
  const sv = scoreVariant(state.dealScore);
  const isLocked = state.status === 'accepted' || state.status === 'closed';

  /* offer range */
  const rangeMin = state.history[0]?.offer ?? state.currentOffer * 0.9;
  const rangeMax = state.counterOffer;
  const rangeProgress = Math.min(100, Math.max(0, ((state.currentOffer - rangeMin) / (rangeMax - rangeMin)) * 100));

  /* AI metrics */
  const thumbnail = DEAL_THUMBNAILS[id] ?? DEAL_THUMBNAILS['prop-001'];
  const closeProbability = Math.min(100, Math.round(state.dealScore * 0.97));
  const buyerIntentScore = Math.min(100, Math.round(state.dealScore * 1.04));
  const marketMatch = state.dealScore >= 70 ? 'Strong' : state.dealScore >= 50 ? 'Moderate' : 'Weak';

  /* actions */
  function submitCounter() {
    update((prev) => ({
      ...prev,
      counterOffer: counterAmt,
      history: [...prev.history, {
        round: prev.history.length + 1, offer: counterAmt,
        date: todayDate(), by: 'Seller' as const, notes: counterNotes || undefined,
      }],
      dealScore: Math.min(100, Math.round(prev.dealScore + (counterAmt > prev.currentOffer ? 5 : -3))),
      status: 'active',
    }));
    setDone(true);
  }

  function acceptOffer() {
    update({ status: 'accepted', dealScore: 100 });
    setDone(true);
  }

  function handleSend() {
    if (!msgText.trim()) return;
    const text = msgText.trim();
    setMsgText('');
    sendMessage(text, 'Broker');
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2500);
    }, 800);
  }

  function openModal(m: Modal) {
    setDone(false);
    setCounterAmt(midpoint);
    setCounterNotes('');
    setModal(m);
  }

  return (
    <PageContainer>

      {/* ── Hero Card ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card-bg)] shadow-[0_8px_24px_rgba(0,0,0,0.05)]"
      >
        <div className="flex flex-col md:flex-row">
          {/* Property image */}
          <div className="h-52 w-full flex-shrink-0 overflow-hidden md:h-auto md:w-[240px]">
            <img src={thumbnail} alt={meta.property} className="h-full w-full object-cover" />
          </div>

          {/* Details */}
          <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(state.status)} className="capitalize">{state.status}</Badge>
                  {state.status === 'active' && <PulsingDot />}
                </div>
                <h1 className="text-xl font-bold text-[var(--fg)]">{meta.property}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C58A3A] to-[#8B5A2B] text-[9px] font-bold text-white">
                    {initials(meta.investor)}
                  </span>
                  <span className="text-xs text-[var(--fg-secondary)]">Investor: {meta.investor}</span>
                  <span className="text-[var(--border-light)] hidden sm:inline">·</span>
                  <span className="hidden sm:flex items-center gap-1 text-xs text-[var(--fg-muted)]">
                    <MapPin className="h-3 w-3" />{meta.location}
                  </span>
                </div>
              </div>

              {!isLocked ? (
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <button onClick={() => openModal('counter')}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm font-medium text-[var(--fg)] shadow-sm transition-all hover:bg-[var(--bg-secondary)] hover:shadow-md">
                    <Send className="h-3.5 w-3.5" /> Counter Offer
                  </button>
                  <button onClick={() => openModal('accept')}
                    className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
                    style={{ background: 'linear-gradient(135deg, #C58A3A 0%, #8B5A2B 100%)' }}>
                    <CheckCircle className="h-3.5 w-3.5" /> Accept Offer
                  </button>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                  <CheckCircle className="h-4 w-4" /> Deal Accepted
                </span>
              )}
            </div>

            {/* Property chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: Building2, label: meta.type },
                ...(meta.bedrooms > 0 ? [{ icon: Bed, label: `${meta.bedrooms} BR` }] : []),
                { icon: Maximize2, label: `${meta.area.toLocaleString()} sq ft` },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--fg-secondary)]">
                  <Icon className="h-3 w-3" />{label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6 lg:col-span-2">

          {/* Offer Overview */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-[18px] border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">Offer Overview</h3>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[var(--bg-secondary)] p-4">
                <div className="mb-1 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary-600" />
                  <p className="text-[10px] text-[var(--fg-muted)]">Current Offer</p>
                </div>
                <p className="text-lg font-bold text-[var(--fg)]">{state.currentOffer.toLocaleString()}</p>
                <p className="text-[11px] text-[var(--fg-muted)]">{meta.currency}</p>
                {state.history.length > 1 && (
                  <p className="mt-1 text-[10px] font-medium text-primary-700">
                    ↑ {(state.currentOffer - (state.history[0]?.offer ?? state.currentOffer)).toLocaleString()} from last round
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-[var(--bg-secondary)] p-4">
                <div className="mb-1 flex items-center gap-1.5">
                  <Minus className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                  <p className="text-[10px] text-[var(--fg-muted)]">Asking Price</p>
                </div>
                <p className="text-lg font-bold text-[var(--fg)]">{state.counterOffer.toLocaleString()}</p>
                <p className="text-[11px] text-[var(--fg-muted)]">{meta.currency}</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-secondary)] p-4">
                <div className="mb-1 flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-danger" />
                  <p className="text-[10px] text-[var(--fg-muted)]">Gap</p>
                </div>
                <p className="text-lg font-bold text-danger">{gap.toLocaleString()}</p>
                <p className="text-[11px] text-[var(--fg-muted)]">{gapPct}% below asking</p>
              </div>
            </div>

            {/* 3-point progress bar */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-[10px] text-[var(--fg-muted)]">
                <span>Initial Offer</span>
                <span>Current Offer</span>
                <span>Asking Price</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${rangeProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-warning via-amber-400 to-primary-600"
                />
                <motion.div
                  initial={{ left: '0%' }} animate={{ left: `${rangeProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[var(--card-bg)] shadow-md"
                  style={{ boxShadow: '0 0 0 3px rgba(139,90,43,0.25)' }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-[var(--fg-muted)]">{state.history[0]?.offer.toLocaleString()} {meta.currency}</span>
                <span className="text-[10px] font-medium text-[var(--fg)]">{rangeProgress.toFixed(0)}% toward asking · {state.currentOffer.toLocaleString()} {meta.currency} current</span>
                <span className="text-[10px] text-[var(--fg-muted)]">{state.counterOffer.toLocaleString()} {meta.currency}</span>
              </div>
            </div>
          </motion.div>

          {/* AI Negotiation Strategy */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}
            className="relative overflow-hidden rounded-[18px] border border-primary-200 bg-primary-50 p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary-100 opacity-40" />
            <div className="relative">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary-100">
                    <Brain className="h-4 w-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-primary-800">AI Negotiation Strategy</h3>
                    <p className="text-[10px] text-primary-500">Powered by market intelligence</p>
                  </div>
                </div>
                <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-primary-200 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-primary-700">
                  <Sparkles className="h-2.5 w-2.5" /> High Confidence
                </span>
              </div>
              <p className="mb-5 text-sm leading-relaxed text-primary-700">{meta.aiRecommendation}</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-primary-200 bg-white/60 p-3 text-center">
                  <p className="text-xl font-bold text-primary-800">{closeProbability}%</p>
                  <p className="mt-0.5 text-[10px] text-primary-600">Close Probability</p>
                </div>
                <div className="rounded-xl border border-primary-200 bg-white/60 p-3 text-center">
                  <p className="text-xl font-bold text-primary-800">{marketMatch}</p>
                  <p className="mt-0.5 text-[10px] text-primary-600">Market Match</p>
                </div>
                <div className="rounded-xl border border-primary-200 bg-white/60 p-3 text-center">
                  <p className="text-xl font-bold text-primary-800">
                    {buyerIntentScore}<span className="text-sm font-normal text-primary-400">/100</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-primary-600">Buyer Intent Score</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* History + Messages Tabs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}
            className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--card-bg)] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">

            {/* Tab bar */}
            <div className="flex border-b border-[var(--border)]">
              {[
                { key: 'history' as const, label: 'Negotiation History', count: state.history.length },
                { key: 'messages' as const, label: 'Messages', count: state.messages.length },
              ].map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`relative flex flex-1 cursor-pointer items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${activeTab === t.key ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}`}>
                  {t.label}
                  {t.count > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === t.key ? 'bg-primary-100 text-primary-700' : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)]'}`}>
                      {t.count}
                    </span>
                  )}
                  {activeTab === t.key && (
                    <motion.div layoutId="broker-detail-tab"
                      className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full"
                      style={{ background: '#8B5A2B' }}
                      transition={{ type: 'spring', damping: 30, stiffness: 350 }} />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* History */}
              {activeTab === 'history' && (
                <motion.div key="hist" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs text-[var(--fg-muted)]">{state.history.length} rounds</span>
                    {state.history.length > 3 && (
                      <button onClick={() => setHistExpanded(p => !p)}
                        className="flex cursor-pointer items-center gap-1 text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]">
                        {histExpanded ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</> : <><ChevronDown className="h-3.5 w-3.5" /> Show all</>}
                      </button>
                    )}
                  </div>
                  <div className="space-y-0">
                    {visibleHistory.map((round, idx) => {
                      const prev = state.history[state.history.indexOf(round) - 1];
                      const dir = prev ? (round.offer > prev.offer ? 'up' : 'down') : null;
                      const isLast = idx === visibleHistory.length - 1;
                      return (
                        <div key={round.round} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${round.by === 'Buyer' ? 'bg-[#8B5A2B]' : 'bg-[var(--fg-secondary)]'}`}>
                              {round.round}
                            </div>
                            {!isLast && <div className="my-1 w-px flex-1 bg-[var(--border)]" style={{ minHeight: 24 }} />}
                          </div>
                          <div className={`flex-1 ${!isLast ? 'pb-5' : ''}`}>
                            <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--bg-secondary)] px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-[var(--fg)]">{round.offer.toLocaleString()} {meta.currency}</p>
                                <p className="text-[10px] text-[var(--fg-muted)]">{round.date} · by {round.by}</p>
                                {round.notes && <p className="mt-1 text-[10px] italic text-[var(--fg-secondary)]">{round.notes}</p>}
                              </div>
                              <div className="flex flex-shrink-0 items-center gap-2">
                                {dir === 'up' && <TrendingUp className="h-4 w-4 text-primary-600" />}
                                {dir === 'down' && <TrendingDown className="h-4 w-4 text-danger" />}
                                <Badge variant={round.by === 'Buyer' ? 'info' : 'secondary'}>{round.by}</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Messages */}
              {activeTab === 'messages' && (
                <motion.div key="msg" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col">
                  <div className="flex items-center justify-end border-b border-[var(--border)] px-4 py-2">
                    <span className="flex items-center gap-1.5 text-[10px] text-[var(--fg-muted)]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8B6B47]" />
                      Live sync
                    </span>
                  </div>
                  <div className="space-y-3 overflow-y-auto p-4" style={{ maxHeight: '18rem' }}>
                    {state.messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <MessageSquare className="mb-2 h-8 w-8 text-[var(--fg-muted)] opacity-30" />
                        <p className="text-xs text-[var(--fg-muted)]">No messages yet. Start the conversation.</p>
                      </div>
                    )}
                    <AnimatePresence initial={false}>
                      {state.messages.map((m) => {
                        const isBroker = m.sender === 'Broker';
                        return (
                          <motion.div key={m.id} initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }}
                            className={`flex ${isBroker ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isBroker ? 'rounded-br-sm text-white' : 'rounded-bl-sm bg-[var(--bg-secondary)] text-[var(--fg)]'}`}
                              style={isBroker ? { background: 'linear-gradient(135deg, #C58A3A 0%, #8B5A2B 100%)' } : {}}>
                              <p className="text-sm leading-relaxed">{m.text}</p>
                              <p className={`mt-1 text-[10px] ${isBroker ? 'text-amber-200' : 'text-[var(--fg-muted)]'}`}>{m.sender} · {m.time}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    <AnimatePresence>
                      {isTyping && <TypingIndicator name={meta.investor} />}
                    </AnimatePresence>
                    <div ref={msgEndRef} />
                  </div>
                  <div className="flex items-center gap-2 border-t border-[var(--border)] px-4 py-3">
                    <input value={msgText} onChange={(e) => setMsgText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={`Type your message...`}
                      className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none transition-colors focus:border-[#8B5A2B]" />
                    <button onClick={handleSend} disabled={!msgText.trim()}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40 hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #C58A3A 0%, #8B5A2B 100%)' }}>
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-6">

          {/* Deal Score Ring */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
            className="rounded-[18px] border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">Deal Score</h3>
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex h-32 w-32 items-center justify-center">
                <div className="absolute inset-0 rounded-full opacity-25 blur-xl" style={{ background: sv.glow }} />
                <svg className="absolute inset-0 -rotate-90" width="128" height="128" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="48" fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
                  <motion.circle
                    cx="64" cy="64" r="48" fill="none"
                    stroke={sv.ring} strokeWidth="8"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: circumference * (1 - state.dealScore / 100) }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                    strokeLinecap="round"
                  />
                </svg>
                <span className={`text-4xl font-bold ${sv.text}`}>
                  <AnimatedCounter value={state.dealScore} />
                </span>
              </div>
              <p className={`text-sm font-semibold ${sv.text}`}>{sv.label}</p>
              <p className="text-center text-xs text-[var(--fg-muted)]">Based on market data, investor intent & history</p>
            </div>
          </motion.div>

          {/* Property Details */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-[18px] border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">Property Details</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Type', value: meta.type },
                { label: 'Location', value: meta.location },
                ...(meta.bedrooms > 0 ? [{ label: 'Bedrooms', value: `${meta.bedrooms} BR` }] : []),
                { label: 'Area', value: `${meta.area.toLocaleString()} sq ft` },
                { label: 'Price / sq ft', value: `${Math.round(state.counterOffer / meta.area).toLocaleString()} ${meta.currency}` },
                { label: 'Completion Status', value: 'Under Construction' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <span className="flex-shrink-0 text-xs text-[var(--fg-muted)]">{label}</span>
                  <span className="text-right text-xs font-medium text-[var(--fg)]">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push(`/broker/listings/${id}`)}
              className="mt-4 w-full cursor-pointer text-center text-xs font-medium transition-all hover:opacity-70 hover:underline"
              style={{ color: '#8B5A2B' }}
            >
              View full details →
            </button>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}
            className="rounded-[18px] border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Share2,    label: 'Share Proposal',   done: '✓ Link Copied'   },
                { icon: Phone,     label: 'Schedule Call',    done: '✓ Email Opened'  },
                { icon: Download,  label: 'Download Summary', done: '✓ Print Dialog'  },
                { icon: FileText,  label: 'Add Note',         done: '✓ Note Saved'    },
              ].map(({ icon: Icon, label, done: doneText }) => {
                const isDone = quickDone === label || (label === 'Add Note' && quickDone?.startsWith('Note:'));
                return (
                  <button key={label}
                    onClick={() => handleQuickAction(label)}
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-[11px] font-medium transition-all hover:shadow-sm"
                    style={{
                      borderColor: isDone ? '#8B5A2B' : 'var(--border)',
                      background:  isDone ? 'rgba(139,90,43,0.07)' : 'var(--bg-secondary)',
                      color:       isDone ? '#8B5A2B' : 'var(--fg-secondary)',
                    }}>
                    {isDone ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    {isDone ? doneText : label}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setModal(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                {!done ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
                    <button onClick={() => setModal(null)} className="absolute right-4 top-4 cursor-pointer text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]">
                      <X className="h-5 w-5" />
                    </button>

                    {modal === 'counter' && (
                      <>
                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                            <Send className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-[var(--fg)]">Counter Offer</h3>
                            <p className="text-xs text-[var(--fg-muted)]">{meta.property}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">Amount ({meta.currency})</label>
                            <input type="number" value={counterAmt} onChange={(e) => setCounterAmt(Number(e.target.value))}
                              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-primary-500" />
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className="text-[var(--fg-muted)]">Gap from asking</span>
                              <span className={`font-semibold ${counterAmt >= state.counterOffer ? 'text-primary-700' : 'text-danger'}`}>
                                {Math.abs(state.counterOffer - counterAmt).toLocaleString()} {meta.currency}
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                              <div className="h-full rounded-full bg-gradient-to-r from-warning to-primary-600 transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, ((counterAmt - rangeMin) / (state.counterOffer - rangeMin)) * 100))}%` }} />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">Notes (optional)</label>
                            <textarea rows={3} value={counterNotes} onChange={(e) => setCounterNotes(e.target.value)}
                              placeholder="Add reasoning or conditions…"
                              className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-primary-500" />
                          </div>
                          <button onClick={submitCounter}
                            className="w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg, #C58A3A 0%, #8B5A2B 100%)' }}>
                            Send Counter Offer
                          </button>
                        </div>
                      </>
                    )}

                    {modal === 'accept' && (
                      <>
                        <div className="mb-5 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50">
                            <CheckCircle className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-[var(--fg)]">Accept Offer</h3>
                            <p className="text-xs text-[var(--fg-muted)]">{meta.property}</p>
                          </div>
                        </div>
                        <p className="mb-4 text-sm text-[var(--fg-secondary)]">
                          Accept <strong>{state.currentOffer.toLocaleString()} {meta.currency}</strong> from <strong>{meta.investor}</strong>. This moves the deal to contract stage.
                        </p>
                        <div className="mb-4 rounded-lg bg-[var(--bg-secondary)] p-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--fg-muted)]">Deal Score after acceptance</span>
                            <span className="font-bold text-primary-700">100%</span>
                          </div>
                        </div>
                        <button onClick={acceptOffer} className="w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #C58A3A, #8B5A2B)' }}>
                          Confirm Acceptance
                        </button>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 14, stiffness: 280, delay: 0.06 }}
                      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                      <CheckCircle className="h-8 w-8 text-primary-600" />
                    </motion.div>
                    <h3 className="mb-1 text-base font-semibold text-[var(--fg)]">
                      {modal === 'counter' ? 'Counter Offer Sent' : 'Offer Accepted'}
                    </h3>
                    <p className="mb-6 text-sm text-[var(--fg-muted)]">
                      {modal === 'counter' ? 'The investor will see the updated offer.' : 'The deal has moved to contract stage.'}
                    </p>
                    <button onClick={() => setModal(null)} className="cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-2 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--border)]">
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
