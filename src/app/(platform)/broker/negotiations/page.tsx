'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { PageContainer } from '@/components/layout/page-container';
import {
  Search, Download, Plus, X, Brain, ExternalLink,
  Clock, TrendingUp, TrendingDown, CheckCircle, Phone,
  MessageSquare, ChevronDown, Building2, DollarSign,
  Activity, AlertCircle, Users, Zap, Target, LayoutList,
  Columns3, Send, ArrowRight, Mail, ChevronRight,
} from 'lucide-react';
import { useNegotiation, NEGOTIATION_META, ALL_DEAL_IDS } from '@/lib/negotiations-store';
import type { NegotiationState } from '@/lib/negotiations-store';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';

/* ─── extended static metadata ─────────────────────────────────────────── */
const DEAL_EXT: Record<string, {
  priority: 'high' | 'medium' | 'low';
  clientType: 'VIP' | 'Premium' | 'Standard';
  clientEmail: string;
  clientPhone: string;
  thumbnail: string;
  lastActivity: string;
  lastActivityTs: number;
}> = {
  'prop-001': {
    priority: 'high', clientType: 'Premium',
    clientEmail: 'arjun@mehta.in', clientPhone: '+91 98765 43210',
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop&q=80',
    lastActivity: 'Counter sent', lastActivityTs: Date.now() - 5 * 3600000,
  },
  'prop-002': {
    priority: 'high', clientType: 'VIP',
    clientEmail: 'khalid@alrashid.ae', clientPhone: '+971 50 123 4567',
    thumbnail: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=400&h=250&fit=crop&q=80',
    lastActivity: 'Proposal viewed', lastActivityTs: Date.now() - 2 * 3600000,
  },
  'prop-003': {
    priority: 'medium', clientType: 'Standard',
    clientEmail: 'sofia@andersson.se', clientPhone: '+46 70 123 4567',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=250&fit=crop&q=80',
    lastActivity: 'Awaiting response', lastActivityTs: Date.now() - 3 * 24 * 3600000,
  },
};

/* ─── DEAL_EXT fallback ───────────────────────────────────────────────── */
const DEAL_EXT_FALLBACK = {
  priority: 'medium' as const,
  clientType: 'Standard' as const,
  clientEmail: '—',
  clientPhone: '—',
  thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop&q=80',
  lastActivity: 'No recent activity',
  lastActivityTs: 0,
};

function getDealExt(id: string) {
  return DEAL_EXT[id] ?? DEAL_EXT_FALLBACK;
}

/* ─── helpers ─────────────────────────────────────────────────────────── */
function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

function fmtValue(n: number, currency: string) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M ${currency}`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ${currency}`;
  return `${n.toLocaleString()} ${currency}`;
}

function priorityMeta(p: 'high' | 'medium' | 'low') {
  return {
    high:   { label: 'High',   border: 'border-l-danger',             text: 'text-danger',             dot: 'bg-danger' },
    medium: { label: 'Medium', border: 'border-l-[#9E7B4A]',          text: 'text-[#9E7B4A]',          dot: 'bg-[#9E7B4A]' },
    low:    { label: 'Low',    border: 'border-l-[var(--fg-muted)]',  text: 'text-[var(--fg-muted)]',  dot: 'bg-[var(--fg-muted)]' },
  }[p];
}

function clientTypeMeta(c: 'VIP' | 'Premium' | 'Standard') {
  return {
    VIP:      { badge: 'bg-amber-50 text-amber-700 border-amber-200',             icon: '★' },
    Premium:  { badge: 'bg-primary-50 text-primary-700 border-primary-200',       icon: '◆' },
    Standard: { badge: 'bg-[var(--bg-secondary)] text-[var(--fg-secondary)] border-[var(--border)]', icon: '●' },
  }[c];
}

function statusMeta(s: NegotiationState['status']) {
  return {
    active:   { label: 'Active',   variant: 'success'   as const, pulse: true,  cls: '' },
    stalled:  { label: 'Stalled',  variant: 'secondary' as const, pulse: false, cls: 'bg-[#9E7B4A]/10 text-[#9E7B4A] border-[#9E7B4A]/20' },
    accepted: { label: 'Accepted', variant: 'info'      as const, pulse: false, cls: '' },
    closed:   { label: 'Closed',   variant: 'secondary' as const, pulse: false, cls: '' },
  }[s];
}

function scoreMeta(s: number) {
  if (s >= 70) return { color: '#8B5A2B', bg: 'bg-[#8B5A2B]/10', text: 'text-[#8B5A2B]' };
  if (s >= 50) return { color: '#9E7B4A', bg: 'bg-[#9E7B4A]/10', text: 'text-[#9E7B4A]' };
  return { color: '#ef4444', bg: 'bg-red-50', text: 'text-red-500' };
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function avatarGradient(name: string) {
  const g = ['from-primary-400 to-primary-600', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-500', 'from-purple-400 to-indigo-500'];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return g[Math.abs(h) % g.length];
}

function exportCSV(stateMap: Record<string, NegotiationState>) {
  const rows = ALL_DEAL_IDS.map(id => {
    const meta = NEGOTIATION_META[id]; const state = stateMap[id];
    if (!state || !meta) return null;
    return [id, meta.property, meta.investor, state.status, state.currentOffer, state.counterOffer, state.dealScore].join(',');
  }).filter(Boolean);
  const csv = ['ID,Property,Investor,Status,CurrentOffer,AskingPrice,DealScore', ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'negotiations.csv'; a.click();
  URL.revokeObjectURL(url);
}

function offerProgress(state: NegotiationState) {
  const min = state.history[0]?.offer ?? state.currentOffer * 0.9;
  const max = state.counterOffer;
  return Math.min(100, Math.max(0, ((state.currentOffer - min) / (max - min)) * 100));
}

/* ─── PulsingDot ─────────────────────────────────────────────────────── */
function PulsingDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B6B47] opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8B6B47]" />
    </span>
  );
}

/* ─── MiniSparkline ──────────────────────────────────────────────────── */
function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 64, H = 24;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" className="opacity-70">
      <polyline points={points} stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── NegotiationDrawer ──────────────────────────────────────────────── */
function NegotiationDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const meta = NEGOTIATION_META[id];
  const ext = getDealExt(id);
  const { state, update, sendMessage } = useNegotiation(id);
  const [tab, setTab] = useState<'overview' | 'messages' | 'history'>('overview');
  const [msgText, setMsgText] = useState('');
  const [counterAmt, setCounterAmt] = useState(0);
  const [showCounter, setShowCounter] = useState(false);
  const [showAccept, setShowAccept] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const midpoint = Math.round((state.currentOffer + state.counterOffer) / 2);
  useEffect(() => { setCounterAmt(midpoint); }, [midpoint]);
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [state.messages]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!meta) return null;

  const isLocked = state.status === 'accepted' || state.status === 'closed';
  const sm = statusMeta(state.status);
  const scm = scoreMeta(state.dealScore);
  const progress = offerProgress(state);
  const gap = state.counterOffer - state.currentOffer;

  function handleCounter() {
    update((prev) => ({
      ...prev,
      counterOffer: counterAmt,
      history: [...prev.history, { round: prev.history.length + 1, offer: counterAmt, date: new Date().toISOString().slice(0, 10), by: 'Seller' as const }],
      dealScore: Math.min(100, Math.round(prev.dealScore + 5)),
      status: 'active',
    }));
    setActionDone(true);
  }

  function handleAccept() {
    update({ status: 'accepted', dealScore: 100 });
    setActionDone(true);
  }

  function handleSend() {
    if (!msgText.trim()) return;
    sendMessage(msgText.trim(), 'Broker');
    setMsgText('');
  }

  const investorMsgCount = state.messages.filter(m => m.sender === 'Investor').length;

  const drawerTabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'messages', label: 'Messages', count: state.messages.length },
    { key: 'history', label: 'History', count: state.history.length },
  ] as const;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed left-0 right-0 bottom-0 top-[56px] z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-[56px] z-50 flex h-[calc(100vh-56px)] w-full max-w-[460px] flex-col bg-[var(--card-bg)] shadow-2xl"
      >
        {/* Thumbnail Header */}
        <div className="relative h-44 flex-shrink-0 overflow-hidden">
          <img src={ext.thumbnail} alt={meta.property} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
              {sm.pulse && <PulsingDot />} {sm.label}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-white/80 backdrop-blur-sm">
              {ext.priority}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 right-12">
            <h3 className="text-lg font-bold leading-tight text-white">{meta.property}</h3>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/70"><Building2 className="h-3 w-3" />{meta.location}</p>
          </div>
          <Link href={`/broker/negotiations/${id}`} className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex flex-shrink-0 border-b border-[var(--border)]">
          {drawerTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 py-3 text-xs font-medium capitalize transition-colors ${tab === t.key ? 'text-primary-600' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}
            >
              {t.label}
              {'count' in t && t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${tab === t.key ? 'bg-primary-100 text-primary-700' : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)]'}`}>
                  {t.count}
                </span>
              )}
              {t.key === 'messages' && investorMsgCount > 0 && (
                <span className="rounded-full bg-[#8B5A2B]/10 border border-[#8B5A2B]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#8B5A2B]">
                  {investorMsgCount} new
                </span>
              )}
              {tab === t.key && (
                <motion.div layoutId="drawer-tab" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary-600" transition={{ type: 'spring', damping: 30, stiffness: 350 }} />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <motion.div key="ov" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-4 p-4">
                {/* Client */}
                <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(meta.investor)} text-sm font-bold text-white`}>
                    {initials(meta.investor)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--fg)]">{meta.investor}</p>
                    <p className="truncate text-xs text-[var(--fg-muted)]">{ext.clientEmail}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={`tel:${ext.clientPhone}`} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]">
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <a href={`mailto:${ext.clientEmail}`} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]">
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {/* Offer Overview */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[var(--fg)]">Offer Overview</p>
                    <Badge variant={sm.variant} className={`capitalize text-[10px] ${sm.cls ?? ''}`}>{sm.label}</Badge>
                  </div>
                  <div className="mb-4 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                      <p className="mb-1 text-[10px] text-[var(--fg-muted)]">Buyer</p>
                      <p className="text-xs font-bold text-primary-700">{fmtValue(state.currentOffer, meta.currency)}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                      <p className="mb-1 text-[10px] text-[var(--fg-muted)]">Asking</p>
                      <p className="text-xs font-bold text-[var(--fg)]">{fmtValue(state.counterOffer, meta.currency)}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                      <p className="mb-1 text-[10px] text-[var(--fg-muted)]">Gap</p>
                      <p className="text-xs font-bold text-danger">{fmtValue(gap, meta.currency)}</p>
                    </div>
                  </div>
                  {/* Range Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-[var(--fg-muted)]">
                      <span>Initial offer</span><span>Asking price</span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#9E7B4A] to-[#8B5A2B]"
                      />
                    </div>
                    <p className="text-right text-[10px] text-[var(--fg-muted)]">{progress.toFixed(0)}% toward asking</p>
                  </div>
                </div>

                {/* Deal Score */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-[var(--fg)]">Deal Score</p>
                    <span className={`text-sm font-bold ${scm.text}`}>{state.dealScore}%</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${state.dealScore}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: 0.3 }}
                      className={`h-full rounded-full ${scm.bg}`}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-[var(--fg-muted)]">Market data + investor intent + rounds</p>
                </div>

                {/* AI Rec */}
                <div className="relative overflow-hidden rounded-xl border border-primary-200 bg-primary-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 flex-shrink-0 text-primary-600" />
                      <p className="text-xs font-semibold text-primary-800">AI Insight</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-white/70 px-2 py-0.5 text-[9px] font-semibold text-primary-700 flex-shrink-0">
                      High Confidence
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-primary-700">{meta.aiRecommendation}</p>
                </div>

                {/* Quick Actions */}
                {!isLocked && (
                  <div className="space-y-2">
                    {!showCounter && !showAccept && (
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => { setShowCounter(true); setShowAccept(false); setActionDone(false); }}
                          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] py-2.5 text-xs font-medium text-[var(--fg)] transition-colors hover:bg-[var(--hover-bg)]">
                          <Send className="h-3 w-3" /> Counter Offer
                        </button>
                        <button onClick={() => { setShowAccept(true); setShowCounter(false); setActionDone(false); }}
                          className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, #C58A3A 0%, #8B5A2B 100%)' }}>
                          <CheckCircle className="h-3 w-3" /> Accept Offer
                        </button>
                      </div>
                    )}
                    <AnimatePresence>
                      {showCounter && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-[var(--fg)]">Counter Offer</p>
                            <button onClick={() => setShowCounter(false)} className="cursor-pointer text-[var(--fg-muted)] hover:text-[var(--fg)]"><X className="h-3.5 w-3.5" /></button>
                          </div>
                          <input type="number" value={counterAmt} onChange={(e) => setCounterAmt(Number(e.target.value))}
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-primary-500" />
                          <p className="text-[10px] text-[var(--fg-muted)]">Gap from asking: {Math.abs(state.counterOffer - counterAmt).toLocaleString()} {meta.currency}</p>
                          {actionDone
                            ? <p className="flex items-center gap-1.5 text-xs text-primary-700"><CheckCircle className="h-3.5 w-3.5" /> Counter sent successfully</p>
                            : <button onClick={handleCounter} className="w-full cursor-pointer rounded-lg bg-primary-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700">Send Counter</button>
                          }
                        </motion.div>
                      )}
                      {showAccept && !showCounter && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden rounded-xl border border-primary-200 bg-primary-50/50 p-4 space-y-3">
                          <p className="text-xs font-semibold text-[var(--fg)]">Confirm Acceptance</p>
                          <p className="text-xs text-[var(--fg-muted)]">Accept <strong>{fmtValue(state.currentOffer, meta.currency)}</strong> from {meta.investor}?</p>
                          {actionDone
                            ? <p className="flex items-center gap-1.5 text-xs text-primary-700"><CheckCircle className="h-3.5 w-3.5" /> Deal accepted!</p>
                            : <div className="flex gap-2">
                              <button onClick={() => setShowAccept(false)} className="flex-1 cursor-pointer rounded-lg border border-[var(--border)] py-2 text-xs text-[var(--fg)] hover:bg-[var(--hover-bg)]">Cancel</button>
                              <button onClick={handleAccept} className="flex-1 cursor-pointer rounded-lg py-2 text-xs font-semibold text-white transition-colors" style={{ background: 'linear-gradient(135deg, #C58A3A, #8B5A2B)' }}>Confirm</button>
                            </div>
                          }
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                <Link href={`/broker/negotiations/${id}`}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #C58A3A 0%, #8B5A2B 100%)' }}>
                  Open Full View <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            )}

            {/* MESSAGES */}
            {tab === 'messages' && (
              <motion.div key="msg" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex flex-col" style={{ height: 'calc(100vh - 276px)' }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {state.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <MessageSquare className="mb-3 h-10 w-10 text-[var(--fg-muted)] opacity-30" />
                      <p className="text-xs text-[var(--fg-muted)]">No messages yet</p>
                      <p className="text-[10px] text-[var(--fg-muted)] opacity-60 mt-1">Send the first message to {meta.investor}</p>
                    </div>
                  )}
                  {state.messages.map((m) => {
                    const isBroker = m.sender === 'Broker';
                    return (
                      <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isBroker ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${isBroker ? 'rounded-br-sm bg-primary-600 text-white' : 'rounded-bl-sm bg-[#EDE7DF] text-[var(--fg)]'}`}>
                          <p className="text-sm leading-relaxed">{m.text}</p>
                          <p className={`mt-1 text-[10px] ${isBroker ? 'text-primary-200' : 'text-[var(--fg-muted)]'}`}>{m.sender} · {m.time}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={msgEndRef} />
                </div>
                <div className="flex-shrink-0 border-t border-[var(--border)] p-3">
                  <div className="flex gap-2">
                    <input value={msgText} onChange={(e) => setMsgText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={`Message ${meta.investor}…`}
                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-primary-500" />
                    <button onClick={handleSend} disabled={!msgText.trim()}
                      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* HISTORY */}
            {tab === 'history' && (
              <motion.div key="hist" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-4">
                <div className="space-y-0">
                  {state.history.map((round, idx) => {
                    const prev = state.history[idx - 1];
                    const isUp = prev ? round.offer > prev.offer : null;
                    return (
                      <div key={round.round} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${round.by === 'Buyer' ? 'bg-primary-500' : 'bg-[var(--fg-muted)]'}`}>{round.round}</div>
                          {idx < state.history.length - 1 && <div className="my-1 w-px flex-1 bg-[var(--border)]" style={{ minHeight: 20 }} />}
                        </div>
                        <div className="pb-5 flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-[var(--fg)]">{round.offer.toLocaleString()} {meta.currency}</p>
                              <p className="text-[10px] text-[var(--fg-muted)]">{round.date} · by {round.by}</p>
                              {round.notes && <p className="mt-0.5 text-[10px] italic text-[var(--fg-secondary)]">{round.notes}</p>}
                            </div>
                            {isUp !== null && (
                              isUp
                                ? <TrendingUp className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-600" />
                                : <TrendingDown className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

/* ─── NewNegotiationModal ───────────────────────────────────────────────── */
function NewNegotiationModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ property: '', investor: '', offer: '', currency: 'AED', priority: 'high' as 'high' | 'medium' | 'low' });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.property.trim()) e.property = 'Required';
    if (!form.investor.trim()) e.investor = 'Required';
    if (!form.offer || isNaN(Number(form.offer)) || Number(form.offer) <= 0) e.offer = 'Enter a valid amount';
    return e;
  }

  function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setStep('success'); }, 1100);
  }

  const inputCls = (field: string) =>
    `w-full rounded-lg border bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none transition-colors ${errors[field] ? 'border-danger' : 'border-[var(--border)] focus:border-primary-500'}`;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[var(--fg)]">New Negotiation</h3>
                  <p className="text-xs text-[var(--fg-muted)]">Start tracking a new deal</p>
                </div>
                <button onClick={onClose} className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[var(--fg-muted)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--fg)]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">Property Name *</label>
                  <input value={form.property} onChange={(e) => setForm(f => ({ ...f, property: e.target.value }))} placeholder="e.g. Downtown Dubai Tower" className={inputCls('property')} />
                  {errors.property && <p className="mt-1 text-[10px] text-danger">{errors.property}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">Investor Name *</label>
                  <input value={form.investor} onChange={(e) => setForm(f => ({ ...f, investor: e.target.value }))} placeholder="e.g. Ahmed Al-Mansouri" className={inputCls('investor')} />
                  {errors.investor && <p className="mt-1 text-[10px] text-danger">{errors.investor}</p>}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">Initial Offer *</label>
                    <input type="number" value={form.offer} onChange={(e) => setForm(f => ({ ...f, offer: e.target.value }))} placeholder="e.g. 5000000" className={inputCls('offer')} />
                    {errors.offer && <p className="mt-1 text-[10px] text-danger">{errors.offer}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">Currency</label>
                    <select value={form.currency} onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
                      className="w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none">
                      {['AED', 'USD', 'GBP', 'EUR', 'SAR'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--fg-secondary)]">Priority</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['high', 'medium', 'low'] as const).map(p => {
                      const pm = priorityMeta(p);
                      return (
                        <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                          className={`cursor-pointer rounded-lg border py-2 text-xs font-medium capitalize transition-all ${form.priority === p ? `${pm.text} border-current bg-current/5` : 'border-[var(--border)] text-[var(--fg-muted)] hover:bg-[var(--hover-bg)]'}`}>
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60">
                  {submitting ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Creating…</> : 'Create Negotiation'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 14, stiffness: 280, delay: 0.08 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                <CheckCircle className="h-8 w-8 text-primary-600" />
              </motion.div>
              <h3 className="mb-1 text-base font-semibold text-[var(--fg)]">Negotiation Created</h3>
              <p className="mb-6 text-sm text-[var(--fg-muted)]"><strong>{form.property}</strong> with {form.investor} is now live.</p>
              <button onClick={onClose} className="cursor-pointer rounded-lg border border-[var(--border)] px-6 py-2 text-sm font-medium text-[var(--fg)] transition-colors hover:bg-[var(--hover-bg)]">
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

/* ─── SortDropdown ───────────────────────────────────────────────────────── */
function SortDropdown({ value, onChange }: { value: 'latest' | 'value' | 'score'; onChange: (v: 'latest' | 'value' | 'score') => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options: { key: 'latest' | 'value' | 'score'; label: string }[] = [
    { key: 'latest', label: 'Latest Activity' },
    { key: 'value',  label: 'Highest Value'  },
    { key: 'score',  label: 'Best Score'     },
  ];
  const selected = options.find(o => o.key === value)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative mb-0.5 flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-1.5 pl-3 pr-2.5 text-xs font-medium text-[var(--fg)] transition-all hover:border-primary-300 hover:bg-primary-50/30"
      >
        {selected.label}
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[164px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-xl shadow-black/10"
          >
            <div className="p-1.5">
              {options.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { onChange(opt.key); setOpen(false); }}
                  className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${value === opt.key ? 'bg-primary-50 text-primary-700' : 'text-[var(--fg)] hover:bg-[var(--hover-bg)]'}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${value === opt.key ? 'bg-primary-600' : 'bg-transparent'}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── KanbanCard ─────────────────────────────────────────────────────────── */
function KanbanCard({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const meta = NEGOTIATION_META[id];
  const ext = getDealExt(id);
  const { state } = useNegotiation(id);
  if (!meta) return null;
  const scm = scoreMeta(state.dealScore);
  const pm = priorityMeta(ext.priority);
  const progress = offerProgress(state);
  const investorMsgCount = state.messages.filter(m => m.sender === 'Investor').length;

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
      onClick={() => onSelect(id)}
      className={`cursor-pointer rounded-xl border border-[var(--border)] border-l-[3px] ${pm.border} bg-[var(--card-bg)] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)]`}>
      {/* Header row */}
      <div className="flex items-start gap-2.5">
        <div className="relative h-10 w-12 flex-shrink-0 overflow-hidden rounded-lg">
          <img src={ext.thumbnail} alt={meta.property} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[12px] font-semibold leading-tight text-[var(--fg)]">{meta.property}</p>
          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(meta.investor)} text-[7px] font-bold text-white`}>{initials(meta.investor)}</span>
            <p className="truncate text-[10px] text-[var(--fg-muted)]">{meta.investor}</p>
            {investorMsgCount > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#8B5A2B]/10 border border-[#8B5A2B]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#8B5A2B] flex-shrink-0">
                <MessageSquare className="h-2 w-2" />{investorMsgCount}
              </span>
            )}
          </div>
        </div>
      </div>
      {/* Offer */}
      <p className="mt-3 text-[15px] font-bold tracking-tight text-[var(--fg)]">{fmtValue(state.currentOffer, meta.currency)}</p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#9E7B4A] to-[#8B5A2B]" style={{ width: `${progress}%` }} />
      </div>
      {/* Footer */}
      <div className="mt-2.5 flex items-center justify-between">
        <span className={`text-[10px] font-bold ${scm.text}`}>{state.dealScore}% score</span>
        <span className="flex items-center gap-1 text-[10px] text-[var(--fg-muted)]">
          <Clock className="h-2.5 w-2.5" />{timeAgo(ext.lastActivityTs)}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── DealRow ────────────────────────────────────────────────────────────── */
function DealRow({ id, delay, onSelect, selected }: { id: string; delay: number; onSelect: (id: string) => void; selected: boolean }) {
  const meta = NEGOTIATION_META[id];
  const ext = getDealExt(id);
  const { state } = useNegotiation(id);
  if (!meta) return null;

  const sm = statusMeta(state.status);
  const scm = scoreMeta(state.dealScore);
  const pm = priorityMeta(ext.priority);
  const ctm = clientTypeMeta(ext.clientType);
  const progress = offerProgress(state);
  const circumference = 2 * Math.PI * 10;
  const investorMsgCount = state.messages.filter(m => m.sender === 'Investor').length;
  const lastInvestorMsg = [...state.messages].reverse().find(m => m.sender === 'Investor');
  const hasUnread = investorMsgCount > 0 && state.status !== 'accepted' && state.status !== 'closed';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay }}
      onClick={() => onSelect(id)}
      className={`group relative cursor-pointer border-l-[3px] ${pm.border} rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] ${selected ? 'ring-2 ring-primary-500/60 ring-offset-1 ring-offset-[var(--bg)] shadow-[0_8px_32px_rgba(0,0,0,0.06)]' : ''} ${hasUnread ? 'border-r border-r-[#8B5A2B]/20' : ''}`}
    >
      {/* Action-required glow strip */}
      {hasUnread && (
        <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-2xl" style={{ background: 'linear-gradient(180deg, #C58A3A 0%, #8B5A2B 100%)' }} />
      )}

      <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4">
        {/* Thumbnail */}
        <div className="relative h-14 w-[72px] flex-shrink-0 overflow-hidden rounded-xl">
          <img src={ext.thumbnail} alt={meta.property} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {sm.pulse && (
            <span className="absolute right-1.5 top-1.5">
              <PulsingDot />
            </span>
          )}
        </div>

        {/* Property + Investor */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-[13px] font-semibold leading-tight text-[var(--fg)]">{meta.property}</p>
            <span className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${ctm.badge}`}>{ctm.icon} {ext.clientType}</span>
            {hasUnread && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#8B5A2B]/10 border border-[#8B5A2B]/20 px-2 py-0.5 text-[10px] font-bold text-[#8B5A2B]">
                <MessageSquare className="h-2.5 w-2.5" />{investorMsgCount} awaiting reply
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient(meta.investor)} text-[8px] font-bold text-white`}>{initials(meta.investor)}</span>
            <p className="truncate text-xs font-medium text-[var(--fg-secondary)]">{meta.investor}</p>
            <span className="hidden text-[var(--border)] sm:inline">·</span>
            <p className="hidden truncate text-[11px] text-[var(--fg-muted)] sm:block">{meta.location}</p>
          </div>
          {lastInvestorMsg && hasUnread && (
            <p className="mt-1.5 truncate text-[11px] text-[#8B5A2B] italic">
              &ldquo;{lastInvestorMsg.text}&rdquo;
            </p>
          )}
        </div>

        {/* Offer Range */}
        <div className="hidden w-36 flex-shrink-0 sm:block">
          <div className="flex items-baseline justify-between">
            <p className="text-[12px] font-bold text-[var(--fg)]">{fmtValue(state.currentOffer, meta.currency)}</p>
            <p className="text-[10px] text-[var(--fg-muted)]">{progress.toFixed(0)}%</p>
          </div>
          <div className="relative mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #9E7B4A, #8B5A2B)' }} />
          </div>
          <p className="mt-1 text-[10px] text-[var(--fg-muted)]">of {fmtValue(state.counterOffer, meta.currency)}</p>
        </div>

        {/* Score ring */}
        <div className="hidden flex-shrink-0 flex-col items-center md:flex" style={{ width: 44 }}>
          <div className="relative h-10 w-10">
            <svg className="absolute inset-0 -rotate-90" width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="var(--bg-secondary)" strokeWidth="3" />
              <circle cx="20" cy="20" r="16" fill="none" stroke={scm.color} strokeWidth="3"
                strokeDasharray={2 * Math.PI * 16}
                strokeDashoffset={2 * Math.PI * 16 * (1 - state.dealScore / 100)}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${scm.text}`}>{state.dealScore}</span>
          </div>
          <p className="mt-0.5 text-[9px] text-[var(--fg-muted)]">score</p>
        </div>

        {/* Status + time */}
        <div className="hidden flex-shrink-0 flex-col items-end gap-1.5 lg:flex" style={{ width: 112 }}>
          <div className="flex items-center gap-1.5">
            {sm.pulse && <PulsingDot />}
            <Badge variant={sm.variant} className={`capitalize text-[10px] ${sm.cls ?? ''}`}>{sm.label}</Badge>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[var(--fg-muted)]">
            <Clock className="h-3 w-3" />{timeAgo(ext.lastActivityTs)}
          </div>
        </div>

        {/* Hover actions */}
        <div className="flex flex-shrink-0 items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button onClick={(e) => { e.stopPropagation(); onSelect(id); }}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--fg-muted)] transition-colors hover:text-primary-600 hover:border-primary-300" title="Quick View">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <Link href={`/broker/negotiations/${id}`} onClick={(e) => e.stopPropagation()}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--fg-muted)] transition-colors hover:text-primary-600 hover:border-primary-300" title="Full View">
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── StatsRow ───────────────────────────────────────────────────────────── */
function StatsRow({ stateMap, totalDeals }: { stateMap: Record<string, NegotiationState>; totalDeals: number }) {
  const all = Object.values(stateMap).filter(Boolean) as NegotiationState[];
  const active = all.filter(s => s.status === 'active').length;
  const pipelineValue = Object.values(stateMap).reduce((sum, s) => sum + (s?.currentOffer ?? 0), 0);
  const avgScore = all.length ? Math.round(all.reduce((s, x) => s + x.dealScore, 0) / all.length) : 0;
  const closed = all.filter(s => s.status === 'accepted' || s.status === 'closed').length;
  const pendingReplies = all.reduce((n, s) => n + s.messages.filter(m => m.sender === 'Investor').length, 0);

  const stats = [
    {
      label: 'Active Deals', value: String(active), sub: `${totalDeals} total in pipeline`,
      icon: Activity, iconColor: 'text-primary-600', iconBg: 'bg-primary-50',
      sparkColor: '#8B5A2B', sparkData: [2, 3, 3, 4, 5, 4, active],
      accent: false,
    },
    {
      label: 'Pipeline Value', value: `${(pipelineValue / 1_000_000).toFixed(1)}M`, sub: 'Combined current offers',
      icon: DollarSign, iconColor: 'text-primary-600', iconBg: 'bg-primary-50',
      sparkColor: '#8B5A2B', sparkData: [20, 22, 25, 24, 28, 27, Math.round(pipelineValue / 1_000_000)],
      accent: false,
    },
    {
      label: 'Avg Deal Score', value: `${avgScore}%`, sub: 'Across all active deals',
      icon: Target, iconColor: 'text-[#9E7B4A]', iconBg: 'bg-[#9E7B4A]/10',
      sparkColor: '#9E7B4A', sparkData: [60, 65, 70, 68, 72, 78, avgScore],
      accent: false,
    },
    {
      label: 'Awaiting Reply', value: String(pendingReplies), sub: pendingReplies > 0 ? 'Investor messages pending' : 'All caught up',
      icon: MessageSquare, iconColor: pendingReplies > 0 ? 'text-[#8B5A2B]' : 'text-primary-600', iconBg: pendingReplies > 0 ? 'bg-[#8B5A2B]/10' : 'bg-primary-50',
      sparkColor: pendingReplies > 0 ? '#8B5A2B' : '#8B5A2B', sparkData: [0, 1, 0, 2, 1, 2, pendingReplies],
      accent: pendingReplies > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.07 }}
          className={`rounded-2xl border bg-[var(--card-bg)] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] ${stat.accent ? 'border-[#8B5A2B]/25' : 'border-[var(--border)]'}`}>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-[var(--fg-muted)]">{stat.label}</p>
              <p className={`mt-2 text-[26px] font-bold leading-none tracking-tight ${stat.accent ? 'text-[#8B5A2B]' : 'text-[var(--fg)]'}`}>{stat.value}</p>
              <p className="mt-1.5 text-[10px] text-[var(--fg-muted)]">{stat.sub}</p>
            </div>
            <div className="flex flex-col items-end gap-2.5">
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
              <MiniSparkline values={stat.sparkData} color={stat.sparkColor} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── useAllStates ───────────────────────────────────────────────────────── */
// ALL_DEAL_IDS is a static 3-element tuple — hook order never changes.
function useAllStates(): Record<string, NegotiationState> {
  const s0 = useNegotiation(ALL_DEAL_IDS[0]);
  const s1 = useNegotiation(ALL_DEAL_IDS[1]);
  const s2 = useNegotiation(ALL_DEAL_IDS[2]);
  return {
    [ALL_DEAL_IDS[0]]: s0.state,
    [ALL_DEAL_IDS[1]]: s1.state,
    [ALL_DEAL_IDS[2]]: s2.state,
  };
}

/* ─── NegotiationsPage ───────────────────────────────────────────────────── */
const KANBAN_COL_META = {
  active:  { label: 'Active',            color: 'text-primary-700',        border: 'border-primary-200',    bg: 'bg-primary-50/50',        dot: 'bg-primary-500',     pulse: true  },
  stalled: { label: 'Stalled',           color: 'text-[#9E7B4A]',          border: 'border-[#9E7B4A]/25',   bg: 'bg-[#9E7B4A]/5',          dot: 'bg-[#9E7B4A]',      pulse: false },
  closed:  { label: 'Closed / Accepted', color: 'text-[var(--fg-muted)]',  border: 'border-[var(--border)]', bg: 'bg-[var(--bg-secondary)]', dot: 'bg-[var(--fg-muted)]', pulse: false },
} as const;

export default function NegotiationsPage() {
  const stateMap = useAllStates();
  const { leads: pipelineLeads } = useLeadPipeline();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'stalled' | 'closed'>('all');
  const [sort, setSort] = useState<'latest' | 'value' | 'score'>('latest');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Pipeline leads that are in the negotiation stage
  const negotiationLeads = useMemo(
    () => pipelineLeads.filter((pl) => pl.stage === 'negotiation'),
    [pipelineLeads],
  );

  // Inject pipeline lead metadata into the module-level NEGOTIATION_META map.
  // KEY: use pl.propertyId — this matches the localStorage key the investor's
  // negotiate page writes under (estra_neg_${propertyId}), ensuring both sides
  // share the same negotiation state.
  useEffect(() => {
    for (const pl of negotiationLeads) {
      const key = pl.propertyId;
      if (!NEGOTIATION_META[key]) {
        NEGOTIATION_META[key] = {
          property:         pl.propertyName,
          investor:         pl.investorName,
          currency:         pl.propertyPrice?.currency ?? 'INR',
          location:         pl.propertyLocation,
          type:             'Residential',
          bedrooms:         0,
          area:             0,
          aiRecommendation: `${pl.investorName} has initiated contact. Review their messages and respond to progress this deal.`,
        };
      }
      if (!DEAL_EXT[key]) {
        DEAL_EXT[key] = {
          priority:        pl.intentLevel === 'high' ? 'high' : 'medium',
          clientType:      pl.intentLevel === 'high' ? 'VIP' : 'Standard',
          clientEmail:     pl.investorEmail ?? '—',
          clientPhone:     pl.investorPhone ?? '—',
          thumbnail:       'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=250&fit=crop&q=80',
          lastActivity:    'Message from investor',
          lastActivityTs:  new Date(pl.updatedAt).getTime(),
        };
      }
    }
  }, [negotiationLeads]);

  // Read pipeline lead negotiation states from the SAME localStorage key the
  // investor writes to: estra_neg_${propertyId}. This is what makes the
  // drawer's message thread show investor messages correctly.
  const pipelineStateMap = useMemo<Record<string, NegotiationState>>(() => {
    const map: Record<string, NegotiationState> = {};
    if (typeof window === 'undefined') return map;
    for (const pl of negotiationLeads) {
      const key = pl.propertyId;
      try {
        const raw = localStorage.getItem(`estra_neg_${key}`);
        map[key] = raw ? JSON.parse(raw) : {
          status: 'active',
          currentOffer: pl.propertyPrice?.amount ?? 0,
          counterOffer: pl.propertyPrice?.amount ?? 0,
          dealScore: pl.aiScore,
          messages: [],
          history: [],
        };
      } catch {
        map[key] = {
          status: 'active', currentOffer: 0, counterOffer: 0,
          dealScore: pl.aiScore, messages: [], history: [],
        };
      }
    }
    return map;
  }, [negotiationLeads]);

  // Combined maps and IDs — use propertyId as the canonical key for pipeline deals
  const combinedStateMap = useMemo(
    () => ({ ...stateMap, ...pipelineStateMap }),
    [stateMap, pipelineStateMap],
  );
  const pipelineIds = useMemo(() => negotiationLeads.map((pl) => pl.propertyId), [negotiationLeads]);
  const allDealIds  = useMemo(() => [...ALL_DEAL_IDS, ...pipelineIds], [pipelineIds]);

  const filtered = useMemo(() => {
    let ids = allDealIds.filter(id => {
      const meta = NEGOTIATION_META[id]; const state = combinedStateMap[id];
      if (!meta || !state) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!meta.property.toLowerCase().includes(q) && !meta.investor.toLowerCase().includes(q) && !meta.location.toLowerCase().includes(q)) return false;
      }
      if (tab === 'closed') return state.status === 'closed' || state.status === 'accepted';
      if (tab !== 'all') return state.status === tab;
      return true;
    });
    ids.sort((a, b) => {
      const sa = combinedStateMap[a]; const sb = combinedStateMap[b];
      const ea = getDealExt(a); const eb = getDealExt(b);
      if (!sa || !sb) return 0;
      if (sort === 'latest') return eb.lastActivityTs - ea.lastActivityTs;
      if (sort === 'value') return sb.currentOffer - sa.currentOffer;
      return sb.dealScore - sa.dealScore;
    });
    return ids;
  }, [combinedStateMap, allDealIds, search, tab, sort]);

  const counts = useMemo(() => {
    const c = { all: 0, active: 0, stalled: 0, closed: 0 };
    for (const id of allDealIds) {
      const s = combinedStateMap[id]; if (!s) continue;
      c.all++;
      if (s.status === 'active') c.active++;
      else if (s.status === 'stalled') c.stalled++;
      else if (s.status === 'accepted' || s.status === 'closed') c.closed++;
    }
    return c;
  }, [combinedStateMap, allDealIds]);

  const kanbanGroups = useMemo(() => ({
    active:  filtered.filter(id => combinedStateMap[id]?.status === 'active'),
    stalled: filtered.filter(id => combinedStateMap[id]?.status === 'stalled'),
    closed:  filtered.filter(id => combinedStateMap[id]?.status === 'accepted' || combinedStateMap[id]?.status === 'closed'),
  }), [filtered, combinedStateMap]);

  const TABS = [
    { key: 'all',     label: 'All',     count: counts.all     },
    { key: 'active',  label: 'Active',  count: counts.active  },
    { key: 'stalled', label: 'Stalled', count: counts.stalled },
    { key: 'closed',  label: 'Closed',  count: counts.closed  },
  ] as const;

  return (
    <PageContainer>
      {/* ── Page Header ── */}
      <div className="bkr-hero">
        <div className="bkr-hero-inner flex-wrap !items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <Activity className="h-4 w-4 text-[#8B6F47]" />
              </div>
              <h1 className="text-xl font-bold text-[var(--fg)]">Deal Negotiations</h1>
              {counts.active > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700">
                  <PulsingDot /> {counts.active} active
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">
              {allDealIds.length} deal{allDealIds.length !== 1 ? 's' : ''} in pipeline
              {counts.closed > 0 && <span className="ml-1 text-primary-600 font-medium">· {counts.closed} closed</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className={`relative flex items-center transition-all duration-200 ${searchFocused ? 'w-52' : 'w-40'}`}>
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-[var(--fg-muted)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
                placeholder="Search deals…"
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--card-bg)] py-1.5 pl-8 pr-3 text-sm text-[var(--fg)] outline-none transition-all focus:border-primary-400 focus:shadow-[0_0_0_3px_rgba(139,90,43,0.08)]" />
            </div>
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-0.5">
              {(['list', 'kanban'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-all ${view === v ? 'bg-primary-600 text-white shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}>
                  {v === 'list' ? <LayoutList className="h-3.5 w-3.5" /> : <Columns3 className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
            <button onClick={() => exportCSV(stateMap)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-1.5 text-xs font-medium text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)] hover:border-[var(--fg-muted)]">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            <button onClick={() => setShowModal(true)}
              className="c-btn-primary flex cursor-pointer items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" /> New Deal
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <StatsRow stateMap={combinedStateMap} totalDeals={allDealIds.length} />

      {/* ── Filter + Sort Bar ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${tab === t.key ? 'bg-[var(--bg-secondary)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}>
              {t.label}
              {t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold transition-colors ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)]'}`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]">
                  <AlertCircle className="h-7 w-7 text-[var(--fg-muted)] opacity-40" />
                </div>
                <p className="text-sm font-semibold text-[var(--fg-muted)]">No negotiations found</p>
                <p className="mt-1 text-xs text-[var(--fg-muted)] opacity-60">Try adjusting your search or filter</p>
              </div>
            ) : (
              filtered.map((id, idx) => (
                <DealRow key={id} id={id} delay={idx * 0.05} onSelect={setSelectedId} selected={selectedId === id} />
              ))
            )}
          </motion.div>
        ) : (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(Object.keys(kanbanGroups) as Array<keyof typeof kanbanGroups>).map(col => {
              const cm = KANBAN_COL_META[col];
              const ids = kanbanGroups[col];
              const totalVal = ids.reduce((s, id) => s + (stateMap[id]?.currentOffer ?? 0), 0);
              const currency = ids.length > 0 ? (NEGOTIATION_META[ids[0]]?.currency ?? 'AED') : 'AED';
              return (
                <div key={col} className={`rounded-xl border ${cm.border} ${cm.bg} p-4`}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {cm.pulse
                        ? <PulsingDot />
                        : <span className={`h-2 w-2 rounded-full ${cm.dot}`} />
                      }
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${cm.color}`}>{cm.label}</h3>
                    </div>
                    <span className={`rounded-full bg-white/50 px-2 py-0.5 text-[10px] font-bold ${cm.color}`}>{ids.length}</span>
                  </div>
                  {ids.length > 0 && <p className="mb-3 text-[10px] text-[var(--fg-muted)]">Total: {fmtValue(totalVal, currency)}</p>}
                  <div className="space-y-3">
                    <AnimatePresence>
                      {ids.map(id => <KanbanCard key={id} id={id} onSelect={setSelectedId} />)}
                    </AnimatePresence>
                    {ids.length === 0 && <p className="py-8 text-center text-[10px] text-[var(--fg-muted)] opacity-50">No deals here</p>}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drawer ── */}
      <AnimatePresence>
        {selectedId && <NegotiationDrawer key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} />}
      </AnimatePresence>

      {/* ── New Deal Modal ── */}
      <AnimatePresence>
        {showModal && <NewNegotiationModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </PageContainer>
  );
}
