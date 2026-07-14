'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { type LucideIcon } from 'lucide-react';
import {
  Phone, MessageSquare, Calendar, Lock,
  MapPin, Shield, ArrowUpRight, Sparkles,
  TrendingUp, Globe, Star, Crown,
  Video, Eye, Bookmark, GitCompare, Download,
  X, Clock, AlertCircle, CheckCircle2,
  BarChart3, Target, AlertTriangle, Zap,
} from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';

/* ══════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════ */

const OFF_MARKET = [
  {
    id: 'off-001',
    title: 'Villa La Bionda',
    location: 'Monte Carlo, Monaco',
    price: '₹40M',
    type: 'Villa',
    beds: 7,
    area: '12,500 sqft',
    matchScore: 96,
    roi: '8.4%',
    appreciation: '+12%/yr',
    demandLevel: 'Ultra High',
    aiInsight: '18% below comparable Monaco comps. High UHNW demand zone. Excellent 5-year hold candidate.',
    tags: ['Rare Asset', 'Seller Motivated', 'Matches Profile'],
    description: 'Spectacular Belle Époque villa overlooking the Mediterranean, with private helipad and 180° panoramic sea views.',
  },
  {
    id: 'off-002',
    title: 'The Compound',
    location: 'Bel Air, Los Angeles',
    price: '₹28M',
    type: 'Estate',
    beds: 9,
    area: '18,200 sqft',
    matchScore: 89,
    roi: '6.2%',
    appreciation: '+9%/yr',
    demandLevel: 'High',
    aiInsight: 'Comparable Bel Air estates command ₹31M+. Entertainment district proximity adds premium rental demand.',
    tags: ['Strong Rental Yield', 'Trophy Asset'],
    description: 'Compound-style gated estate spanning 3 acres in Bel Air with world-class entertainment pavilion.',
  },
  {
    id: 'off-003',
    title: 'Frond L Mansion',
    location: 'Palm Jumeirah, Dubai',
    price: '₹35M',
    type: 'Waterfront',
    beds: 8,
    area: '15,800 sqft',
    matchScore: 94,
    roi: '7.8%',
    appreciation: '+14%/yr',
    demandLevel: 'Ultra High',
    aiInsight: 'Palm Jumeirah inventory down 32%. Sovereign buyer demand at record levels. Exit liquidity excellent.',
    tags: ['Rare Asset', 'Matches Profile', 'Strong Rental Yield'],
    description: 'Bespoke waterfront mansion on the exclusive Palm Jumeirah with private beach and infinity pool.',
  },
];

const DEAL_VAULT = [
  {
    id: 'dv-001',
    title: 'Crown Tower — DIFC',
    location: 'Dubai International Financial Centre',
    type: 'Commercial Pre-Launch',
    irr: '18.5%',
    minTicket: '₹5M',
    holdPeriod: '5 years',
    riskRating: 'Medium' as const,
    slotsTotal: 12,
    slotsUsed: 8,
    closingDays: 6,
    description: 'Acquire floors in a landmark Grade-A commercial tower. Limited to 12 qualified investors.',
  },
  {
    id: 'dv-002',
    title: 'Mayfair Portfolio',
    location: 'London, United Kingdom',
    type: 'Residential Portfolio',
    irr: '14.2%',
    minTicket: '₹8M',
    holdPeriod: '7 years',
    riskRating: 'Low' as const,
    slotsTotal: 8,
    slotsUsed: 5,
    closingDays: 14,
    description: 'Institutional-grade acquisition of 12 Georgian townhouses in prime Mayfair. Confidential vendor mandate.',
  },
];

const GLOBAL_MARKETS = [
  { city: 'Dubai', country: 'UAE', flag: '🇦🇪', opportunities: 14, avgROI: '8.2%', trend: '+18%', color: '#8B7355' },
  { city: 'London', country: 'UK', flag: '🇬🇧', opportunities: 8, avgROI: '5.4%', trend: '+7%', color: '#4ADE80' },
  { city: 'Monaco', country: 'MCO', flag: '🇲🇨', opportunities: 3, avgROI: '6.8%', trend: '+22%', color: '#8B7355' },
  { city: 'Miami', country: 'USA', flag: '🇺🇸', opportunities: 6, avgROI: '7.1%', trend: '+11%', color: '#A89478' },
  { city: 'Singapore', country: 'SGP', flag: '🇸🇬', opportunities: 5, avgROI: '5.9%', trend: '+9%', color: '#F59E0B' },
];

const SMART_ALERTS: { id: string; icon: LucideIcon; message: string; time: string; color: string; urgent: boolean }[] = [
  { id: 'a1', icon: TrendingUp, message: 'Seller reduced price 7% on Villa La Bionda', time: '2h ago', color: '#4ADE80', urgent: true },
  { id: 'a2', icon: Sparkles, message: 'New private listing — Monaco Penthouse available', time: '4h ago', color: '#8B7355', urgent: true },
  { id: 'a3', icon: Shield, message: 'NDA approved for Crown Tower — DIFC', time: 'Yesterday', color: '#4ADE80', urgent: false },
  { id: 'a4', icon: MessageSquare, message: 'Alexandra sent a market intelligence memo', time: 'Yesterday', color: '#8B7355', urgent: false },
  { id: 'a5', icon: AlertCircle, message: 'Mayfair Portfolio — only 3 slots remaining', time: '2d ago', color: '#EF4444', urgent: false },
];

/* ══════════════════════════════════════════════════════════
   TOAST SYSTEM
   ══════════════════════════════════════════════════════════ */

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
}

const TOAST_CONFIG: Record<ToastVariant, { color: string; bg: string; bar: string; Icon: LucideIcon }> = {
  success: { color: '#4ADE80', bg: 'rgba(74,222,128,0.07)',  bar: '#4ADE80', Icon: CheckCircle2 },
  error:   { color: '#EF4444', bg: 'rgba(239,68,68,0.07)',   bar: '#EF4444', Icon: AlertCircle },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.07)',  bar: '#F59E0B', Icon: AlertTriangle },
  info:    { color: '#8B7355', bg: 'rgba(139,115,85,0.07)',  bar: '#8B7355', Icon: Sparkles },
};

function ToastCard({ t, onDismiss }: { t: ToastItem; onDismiss: (id: string) => void }) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const { color, bg, bar, Icon } = TOAST_CONFIG[t.variant];

  const dismiss = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onDismiss(t.id), 340);
  }, [leaving, t.id, onDismiss]);

  useEffect(() => {
    if (paused || leaving) return;
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [paused, leaving, dismiss]);

  return (
    <div
      className="pointer-events-auto relative w-[320px] rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-elevated)',
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
        border: `1px solid ${color}22`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.06)`,
        animation: leaving
          ? 'toastSlideOut 0.34s cubic-bezier(0.4,0,1,1) forwards'
          : 'toastSlideIn 0.42s cubic-bezier(0.16,1,0.3,1) forwards',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top accent bar */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${bar} 0%, ${bar}50 100%)` }} />

      <div className="flex items-start gap-3 px-4 py-3">
        {/* Icon badge */}
        <div
          className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center mt-0.5"
          style={{ background: bg, border: `1px solid ${color}25` }}
        >
          <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-5">
          <p className="text-[12px] font-semibold text-[var(--fg)] leading-snug">{t.title}</p>
          {t.message && (
            <p className="text-[10px] text-[var(--fg-muted)] mt-0.5 leading-relaxed">{t.message}</p>
          )}
          {t.action && (
            <button
              onClick={() => { t.action!.onClick(); dismiss(); }}
              className="mt-1.5 text-[10px] font-semibold cursor-pointer hover:opacity-80 transition-opacity"
              style={{ color }}
            >
              {t.action.label} →
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 h-5 w-5 rounded-full flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
        >
          <X className="h-3 w-3 text-[var(--fg-muted)]" strokeWidth={2} />
        </button>
      </div>

      {/* Progress bar */}
      {!paused && !leaving && (
        <div
          className="rounded-full"
          style={{
            height: 2,
            background: bar,
            opacity: 0.25,
            animation: 'toastProgress 5s linear forwards',
          }}
        />
      )}
    </div>
  );
}

function ToastContainer({
  toasts,
  onDismiss,
  mounted,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  mounted: boolean;
}) {
  if (!mounted || toasts.length === 0) return null;
  return createPortal(
    <div
      className="fixed top-4 right-4 z-[2000] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} t={t} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body,
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL TYPES  (only complex-form modals kept)
   ══════════════════════════════════════════════════════════ */

type ModalType = 'schedule' | 'message' | 'nda';

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */

export default function ConciergePage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('schedule');
  const [chatOpen, setChatOpen] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  /* ── Toast helpers ── */
  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((prev) => [{ ...t, id }, ...prev].slice(0, 5));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ── Modal helpers ── */
  function openModal(type: ModalType) { setModalType(type); setModalOpen(true); }

  /* ── Bookmark with toast ── */
  function toggleSave(id: string, title: string) {
    const wasSaved = saved.has(id);
    setSaved((prev) => { const n = new Set(prev); wasSaved ? n.delete(id) : n.add(id); return n; });
    addToast(wasSaved
      ? { variant: 'info', title: 'Removed from Watchlist', message: `${title} has been removed.` }
      : { variant: 'success', title: 'Saved to Watchlist', message: `${title} added to your private watchlist.`, action: { label: 'View Watchlist', onClick: () => {} } }
    );
  }

  return (
    <div className="concierge-page mx-auto w-full max-w-6xl">
      {/* Ambient lighting */}
      <div className="c-ambient-gold" style={{ position: 'absolute' }} />
      <div className="c-ambient-violet" style={{ position: 'absolute' }} />
      <div className="c-ambient-center" style={{ position: 'absolute' }} />

      {/* ═══ S1 — HERO INTELLIGENCE BANNER ═══ */}
      <div className="mb-5 c-fade-in">
        <div className="c-surface p-5 lg:p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 justify-between">

            {/* Left — title + personalized summary */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#8B7355]/20 to-[#8B7355]/05 border border-[#8B7355]/15 flex items-center justify-center">
                  <Crown className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} />
                </div>
                <p className="c-label" style={{ marginBottom: 0 }}>Private Intelligence Concierge</p>
                <span className="c-pill c-pill-live inline-flex items-center gap-1.5 px-2.5 py-1">
                  <span className="c-live-dot" />
                  <Sparkles className="h-2.5 w-2.5" strokeWidth={1.5} />
                  <span className="text-[9px]">AI Active</span>
                </span>
              </div>
              <h1 className="text-[26px] leading-[1.1] font-semibold text-[var(--fg)] tracking-[-0.02em] mb-3" style={{ fontFamily: 'var(--font-serif)' }}>
                Your Private Wealth Hub
              </h1>
              <div className="flex flex-col gap-1.5">
                {([
                  [Star, '3 new off-market opportunities match your profile', '#8B7355'],
                  [TrendingUp, '2 financing advantages detected in Dubai & London', '#4ADE80'],
                  [Lock, '1 London portfolio available privately — closing in 14 days', '#8B7355'],
                ] as [LucideIcon, string, string][]).map(([Icon, text, color]) => (
                  <div key={text} className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                      <Icon className="h-2.5 w-2.5" style={{ color }} strokeWidth={2} />
                    </div>
                    <span className="text-[11px] text-[var(--fg-secondary)]">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — hero CTAs */}
            <div className="flex flex-col gap-2 shrink-0 w-[180px]">
              <button onClick={() => openModal('schedule')} className="c-btn-primary flex items-center justify-center gap-2 py-2.5 cursor-pointer text-[12px]">
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                Book Advisor Call
              </button>
              <button onClick={() => setChatOpen(true)} className="c-btn-secondary flex items-center justify-center gap-2 py-2.5 cursor-pointer text-[12px]">
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                AI Concierge Chat
              </button>
              <button
                onClick={() => addToast({ variant: 'info', title: 'Priority Access Requested', message: 'Alexandra will contact you within 24h to arrange exclusive access.' })}
                className="c-btn-secondary flex items-center justify-center gap-2 py-2.5 cursor-pointer text-[12px]"
              >
                <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />
                Priority Access
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ S2 — ADVISOR + ALERTS (2-col) ═══ */}
      <div className="grid gap-5 lg:grid-cols-5 mb-5 c-fade-in-1">

        {/* Advisor Relationship Card */}
        <div className="lg:col-span-3 c-surface p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="c-label" style={{ marginBottom: 0 }}>Your Advisor</p>
            <span className="inline-flex items-center gap-1.5 text-[10px] text-[#4ADE80] font-semibold">
              <span className="c-live-dot" style={{ width: 5, height: 5 }} />
              Online now · Available 4 PM
            </span>
          </div>

          <div className="flex items-start gap-4 mb-4">
            <div className="c-advisor-avatar shrink-0">
              <div className="h-[54px] w-[54px] rounded-full bg-gradient-to-br from-[#8B7355] via-[#B08C2E] to-[#8B7355] flex items-center justify-center shadow-lg shadow-amber-500/15">
                <span className="text-lg font-medium text-[#1A1A1A]" style={{ fontFamily: 'var(--font-serif)' }}>AR</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-semibold text-[var(--fg)] tracking-[-0.01em]" style={{ fontFamily: 'var(--font-serif)' }}>
                Alexandra Reeves
              </h2>
              <p className="text-[11px] text-[var(--fg-secondary)] mt-0.5">
                Senior Private Advisor · <span className="text-[#8B7355]">18 yrs</span> · ₹2.4B+ transacted
              </p>
              <div className="flex items-center gap-4 mt-2.5">
                {([['240+', 'Deals'], ['₹12M', 'Avg Size'], ['14', 'Markets'], ['99%', 'Satisfaction']] as [string, string][]).map(([v, l]) => (
                  <div key={l} className="text-center">
                    <p className="text-[12px] font-bold text-[var(--fg)] tabular-nums">{v}</p>
                    <p className="text-[8px] uppercase tracking-[0.07em] text-[var(--fg-muted)]">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Micro activity feed */}
          <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-3 mb-4 space-y-2.5">
            <p className="text-[9px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.08em]">Recent Activity</p>
            {([
              [Star, 'Shared 2 new Monaco waterfront deals matching your profile', '1h ago', '#8B7355'],
              [Phone, 'Last call — 2 days ago · 42 min advisory session', '2d ago', '#4ADE80'],
              [Calendar, 'Next slot available today 4:00 PM GST', 'Today', '#8B7355'],
            ] as [LucideIcon, string, string, string][]).map(([Icon, text, time, color]) => (
              <div key={text} className="flex items-start gap-2 text-[10px]">
                <div className="h-4 w-4 rounded-full shrink-0 flex items-center justify-center mt-0.5" style={{ background: `${color}12` }}>
                  <Icon className="h-2.5 w-2.5" style={{ color }} strokeWidth={2} />
                </div>
                <span className="flex-1 text-[var(--fg-secondary)] leading-snug">{text}</span>
                <span className="text-[var(--fg-muted)] shrink-0 tabular-nums">{time}</span>
              </div>
            ))}
          </div>

          {/* 4 action buttons */}
          <div className="grid grid-cols-4 gap-2">
            {([
              { icon: Calendar,     label: 'Schedule', action: () => openModal('schedule'), primary: true },
              { icon: Phone,        label: 'Call',     action: () => addToast({ variant: 'success', title: 'Calling Alexandra Reeves', message: 'Secure private line initializing...', action: { label: 'Cancel Call', onClick: () => {} } }), primary: false },
              { icon: MessageSquare,label: 'Message',  action: () => openModal('message'), primary: false },
              { icon: Video,        label: 'Video',    action: () => addToast({ variant: 'success', title: 'Video Meeting Initiated', message: 'Alexandra is being notified. Connection in ~30 seconds.' }), primary: false },
            ] as { icon: LucideIcon; label: string; action: () => void; primary: boolean }[]).map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                  btn.primary ? 'c-btn-primary' : 'c-btn-secondary'
                }`}
              >
                <btn.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Smart Alerts */}
        <div className="lg:col-span-2 c-surface p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="c-label" style={{ marginBottom: 0 }}>Smart Alerts</p>
            <span className="rounded-full bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] px-2 py-0.5 text-[9px] font-bold text-[#EF4444]">
              2 Urgent
            </span>
          </div>
          <div className="flex-1 space-y-1">
            {SMART_ALERTS.map((alert) => (
              <div key={alert.id} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer group">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${alert.color}10`, border: `1px solid ${alert.color}20` }}>
                  <alert.icon className="h-3.5 w-3.5" style={{ color: alert.color }} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[var(--fg-secondary)] leading-snug">{alert.message}</p>
                  <p className="text-[9px] text-[var(--fg-muted)] mt-0.5">{alert.time}</p>
                </div>
                {alert.urgent && <div className="h-1.5 w-1.5 rounded-full bg-[#EF4444] shrink-0 mt-2" />}
              </div>
            ))}
          </div>
          <button
            onClick={() => addToast({ variant: 'info', title: 'Market Intelligence Report', message: 'Your personalized intelligence report is being compiled. Ready in ~2 minutes.', action: { label: 'View Report', onClick: () => {} } })}
            className="mt-4 w-full c-btn-secondary py-2 text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <BarChart3 className="h-3 w-3" strokeWidth={1.5} />
            Market Intelligence
          </button>
        </div>
      </div>

      {/* ═══ S3 — OFF-MARKET LISTINGS ═══ */}
      <div className="mb-5 c-fade-in-2">
        <div className="flex items-center justify-between mb-4">
          <p className="c-label">Off-Market · 3 Matched Opportunities</p>
          <span className="c-pill c-pill-accent inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" strokeWidth={1.5} />
            Exclusive Access
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {OFF_MARKET.map((listing, i) => (
            <div key={listing.id} className={`c-tile group cursor-pointer c-fade-in-${i + 3}`}>
              {/* Image block */}
              <div className="c-tile-img-wrap h-44 relative">
                <div className="c-img-placeholder h-full w-full c-tile-img flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1.5 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                    <Lock className="h-5 w-5 text-[var(--fg-secondary)]" strokeWidth={1.5} />
                    <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">Private Listing</span>
                  </div>
                </div>
                {/* Match score */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: 'rgba(74,222,128,0.9)', color: '#0A1A0F' }}>
                    <Star className="h-2.5 w-2.5" strokeWidth={2} />
                    {listing.matchScore}% Match
                  </span>
                </div>
                {/* Off-market + price */}
                <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1">
                  <span className="c-pill c-pill-accent text-[9px]">Off-Market</span>
                  <span className="c-price text-[15px] font-semibold text-[#8B7355] tracking-[-0.02em]" style={{ fontFamily: 'var(--font-serif)' }}>{listing.price}</span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="c-tile-title text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                  {listing.title}
                </h3>
                <p className="flex items-center gap-1.5 text-[10px] text-[var(--fg-muted)] mb-2.5">
                  <MapPin className="h-3 w-3 text-[#8B7355]/60" strokeWidth={1.5} />
                  {listing.location}
                </p>

                <div className="c-specs mb-2.5">
                  <span>{listing.beds} Beds</span>
                  <span>{listing.area}</span>
                  <span>{listing.type}</span>
                </div>

                {/* ROI / Appreciation / Demand chips */}
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(74,222,128,0.06)] border border-[rgba(74,222,128,0.12)] px-2 py-0.5 text-[9px] font-semibold text-[#4ADE80]">
                    <TrendingUp className="h-2.5 w-2.5" strokeWidth={2} /> {listing.roi} ROI
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(139,115,85,0.06)] border border-[rgba(139,115,85,0.12)] px-2 py-0.5 text-[9px] font-semibold text-[#8B7355]">
                    {listing.appreciation}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-light)] px-2 py-0.5 text-[9px] text-[var(--fg-muted)]">
                    {listing.demandLevel} Demand
                  </span>
                </div>

                {/* AI Insight box */}
                <div className="rounded-xl bg-[rgba(139,115,85,0.04)] border border-[rgba(139,115,85,0.1)] p-2.5 mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-2.5 w-2.5 text-[#8B7355]" strokeWidth={1.5} />
                    <span className="text-[8px] font-bold text-[#8B7355] uppercase tracking-[0.08em]">AI Insight</span>
                  </div>
                  <p className="text-[10px] text-[var(--fg-secondary)] leading-relaxed">{listing.aiInsight}</p>
                </div>

                {/* Tags */}
                <div className="flex gap-1 flex-wrap mb-3">
                  {listing.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[var(--bg-secondary)] border border-[var(--border-light)] px-2 py-0.5 text-[9px] text-[var(--fg-muted)]">{tag}</span>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex gap-2">
                  <button
                    onClick={() => addToast({ variant: 'info', title: 'Access Request Submitted', message: `Your advisor will review access to ${listing.title}. Response within 24h.`, action: { label: 'View Request', onClick: () => {} } })}
                    className="c-btn-primary flex-1 py-2 flex items-center justify-center gap-1.5 cursor-pointer text-[11px]"
                  >
                    Request Access <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => router.push('/investor/negotiations')}
                    className="c-btn-secondary px-3 py-2 cursor-pointer flex items-center justify-center gap-1 text-[11px] font-medium hover:border-[#8B7355]/40 hover:text-[#8B7355] transition-colors"
                    title="Start Negotiation"
                  >
                    <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={() => toggleSave(listing.id, listing.title)}
                    className={`c-btn-secondary px-3 py-2 cursor-pointer flex items-center justify-center transition-colors ${saved.has(listing.id) ? 'text-[#8B7355]' : ''}`}
                  >
                    <Bookmark className={`h-3.5 w-3.5 ${saved.has(listing.id) ? 'fill-[#8B7355]' : ''}`} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ S4 — DEAL VAULT ═══ */}
      <div className="mb-5 c-fade-in-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-6 w-6 rounded-md bg-[#8B7355]/10 border border-[#8B7355]/10 flex items-center justify-center">
              <Shield className="h-3 w-3 text-[#A89478]" strokeWidth={1.5} />
            </div>
            <p className="c-label">Deal Vault · Confidential</p>
          </div>
          <span className="c-pill c-pill-nda inline-flex items-center gap-1.5">
            <Shield className="h-3 w-3" strokeWidth={1.5} />
            NDA Required
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {DEAL_VAULT.map((deal) => {
            const riskColor = deal.riskRating === 'Low' ? '#4ADE80' : deal.riskRating === 'Medium' ? '#F59E0B' : '#EF4444';
            const slotsLeft = deal.slotsTotal - deal.slotsUsed;
            return (
              <div key={deal.id} className="c-surface c-vault-accent p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="c-pill c-pill-nda text-[8px] inline-flex items-center gap-1">
                        <Shield className="h-2.5 w-2.5" strokeWidth={1.5} /> Confidential
                      </span>
                      <span className="text-[8px] uppercase tracking-[0.07em] text-[var(--fg-muted)]">{deal.type}</span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-[var(--fg)] tracking-[-0.01em]" style={{ fontFamily: 'var(--font-serif)' }}>{deal.title}</h3>
                    <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{deal.location}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[20px] font-bold tabular-nums text-[#8B7355]" style={{ fontFamily: 'var(--font-serif)' }}>{deal.irr}</p>
                    <p className="text-[8px] uppercase tracking-[0.08em] text-[var(--fg-muted)]">Target IRR</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-[var(--fg-secondary)] leading-relaxed mb-4">{deal.description}</p>

                {/* Allocation progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] uppercase tracking-[0.07em] text-[var(--fg-muted)]">Allocation</span>
                    <span className="text-[9px] font-semibold text-[var(--fg)]">{deal.slotsUsed}/{deal.slotsTotal} slots · {slotsLeft} remaining</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(deal.slotsUsed / deal.slotsTotal) * 100}%`,
                        background: slotsLeft <= 3 ? 'linear-gradient(90deg, #EF4444, #F59E0B)' : 'linear-gradient(90deg, #8B7355, #E2BF6A)',
                      }}
                    />
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {([
                    ['Min Ticket', deal.minTicket, '#8B7355'],
                    ['Hold Period', deal.holdPeriod, '#8B7355'],
                    ['Risk', deal.riskRating, riskColor],
                  ] as [string, string, string][]).map(([label, value, color]) => (
                    <div key={label} className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-2 text-center">
                      <p className="text-[11px] font-bold" style={{ color }}>{value}</p>
                      <p className="text-[8px] uppercase tracking-[0.06em] text-[var(--fg-muted)] mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-3 mb-4 text-[10px]">
                  <div className="flex items-center gap-1.5 text-[var(--fg-muted)]">
                    <Clock className="h-3 w-3" strokeWidth={1.5} />
                    Closing in {deal.closingDays} days
                  </div>
                  <span className="text-[var(--fg-muted)] uppercase tracking-[0.06em] text-[9px]">{deal.type}</span>
                </div>

                {/* CTAs */}
                <div className="flex gap-2">
                  <button onClick={() => openModal('nda')} className="c-btn-primary flex-1 flex items-center justify-center gap-1.5 py-2.5 cursor-pointer text-[11px]">
                    <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Sign NDA & Access
                  </button>
                  <button
                    onClick={() => addToast({ variant: 'success', title: 'Teaser Document Sent', message: 'Sent to your registered email. Available within 15 minutes.' })}
                    className="c-btn-secondary px-4 py-2.5 cursor-pointer text-[11px] flex items-center gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Teaser
                  </button>
                  <button
                    onClick={() => addToast({ variant: 'success', title: 'Enquiry Submitted', message: `Alexandra will respond about ${deal.title} within 2 hours.` })}
                    className="c-btn-secondary px-4 py-2.5 cursor-pointer text-[11px]"
                  >
                    Enquire
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ S5 — GLOBAL MARKETS ═══ */}
      <div className="mb-5 c-fade-in-5">
        <div className="flex items-center justify-between mb-4">
          <p className="c-label">Global Opportunities</p>
          <div className="flex items-center gap-1.5 text-[10px] text-[#4ADE80]">
            <span className="c-live-dot" style={{ width: 5, height: 5 }} />
            Live Market Data
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {GLOBAL_MARKETS.map((m) => (
            <div key={m.city} className="c-surface p-4 text-center cursor-pointer group">
              <div className="text-2xl mb-2 transition-transform duration-200 group-hover:scale-110">{m.flag}</div>
              <p className="text-[12px] font-bold text-[var(--fg)]">{m.city}</p>
              <p className="text-[8px] text-[var(--fg-muted)] uppercase tracking-[0.06em]">{m.country}</p>
              <div className="mt-2.5 pt-2.5 border-t border-[var(--border-light)] space-y-0.5">
                <p className="text-[12px] font-bold tabular-nums" style={{ color: m.color }}>{m.avgROI}</p>
                <p className="text-[8px] text-[var(--fg-muted)]">Avg ROI</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-[9px] font-semibold text-[#4ADE80]">{m.trend}</span>
                  <span className="w-0.5 h-0.5 rounded-full bg-[var(--fg-muted)]" />
                  <span className="text-[9px] text-[var(--fg-muted)]">{m.opportunities} listings</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ S6 — INTELLIGENCE DASHBOARD ═══ */}
      <div className="mb-8 c-fade-in-5">
        <p className="c-label mb-3">Personalized Intelligence</p>
        <div className="grid grid-cols-3 gap-4">
          {([
            [BarChart3, 'Watchlist Performance', '+14.2%', '30-day portfolio momentum', '#4ADE80'],
            [Globe, 'Currency Edge', '2 Opportunities', 'GBP/AED spread advantage', '#8B7355'],
            [Target, 'Tax-Efficient Buys', '3 Structures', 'UAE & Cayman options available', '#8B7355'],
          ] as [LucideIcon, string, string, string, string][]).map(([Icon, title, value, sub, color]) => (
            <div key={title} className="c-surface p-4 group cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}10`, border: `1px solid ${color}20` }}>
                  <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-semibold text-[var(--fg)]">{title}</span>
              </div>
              <p className="text-[20px] font-bold tabular-nums tracking-tight" style={{ color, fontFamily: 'var(--font-serif)' }}>{value}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <div className="c-fade-in-5">
        <div className="c-gold-line mb-4" />
        <div className="flex items-center justify-between pb-4 flex-wrap gap-3">
          <p className="text-[10px] text-[var(--fg-muted)] tracking-[0.03em]">
            All listings are confidential · Subject to qualification · Powered by GLIMMORA Intelligence
          </p>
          <div className="flex items-center gap-2">
            {([
              { icon: Phone,    label: 'Contact Team',  action: () => addToast({ variant: 'info', title: 'Connecting to Glimmora Team', message: 'A team member will reach out via your preferred contact within 1 hour.' }) },
              { icon: Download, label: 'Export Report', action: () => addToast({ variant: 'success', title: 'Report Exporting', message: 'Your portfolio intelligence report is being prepared. Ready in ~5 minutes.', action: { label: 'Open Downloads', onClick: () => {} } }) },
            ] as { icon: LucideIcon; label: string; action: () => void }[]).map((btn) => (
              <button key={btn.label} onClick={btn.action} className="c-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-[10px] cursor-pointer">
                <btn.icon className="h-3 w-3" strokeWidth={1.5} />
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ FLOATING AI CHAT BUTTON ═══ */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 c-btn-primary h-12 w-12 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(139,115,85,0.3)] cursor-pointer"
        >
          <Sparkles className="h-5 w-5" strokeWidth={1.5} />
        </button>
      )}

      {/* ═══ AI CHAT DRAWER ═══ */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[310px] rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_20px_60px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]" style={{ background: 'linear-gradient(135deg, rgba(139,115,85,0.06), transparent)' }}>
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#8B7355] to-[#B08C2E] flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-[#1A1208]" strokeWidth={2} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[var(--fg)]">AI Concierge</p>
                <p className="text-[9px] text-[#4ADE80] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] inline-block" />
                  Online · Instant response
                </p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
              <X className="h-3.5 w-3.5 text-[var(--fg-muted)]" strokeWidth={2} />
            </button>
          </div>
          {/* Chat body */}
          <div className="p-4">
            <div className="rounded-xl bg-[rgba(139,115,85,0.04)] border border-[rgba(139,115,85,0.1)] p-3 mb-3">
              <p className="text-[11px] text-[var(--fg-secondary)] leading-relaxed">
                <span className="font-semibold text-[var(--fg)]">Alexandra</span> found <span className="text-[#8B7355] font-semibold">2 Monaco assets</span> matching your waterfront preference.
                Would you like the confidential deck?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setChatOpen(false);
                  addToast({ variant: 'info', title: 'Access Request Submitted', message: 'Alexandra is preparing the confidential Monaco asset deck for you.', action: { label: 'View Request', onClick: () => {} } });
                }}
                className="c-btn-primary flex-1 py-2 text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="h-3 w-3" strokeWidth={1.5} /> View Now
              </button>
              <button onClick={() => openModal('schedule')} className="c-btn-secondary py-2 px-3 text-[11px] cursor-pointer">
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} size="sm">

        {modalType === 'schedule' && (
          <div className="space-y-4">
            <h2 className="text-[16px] font-bold text-[var(--fg)]">Schedule Advisor Call</h2>
            <p className="text-[12px] text-[var(--fg-muted)]">Alexandra Reeves is available at the following times:</p>
            <div className="grid grid-cols-2 gap-2">
              {(['Today · 4:00 PM', 'Today · 6:30 PM', 'Tomorrow · 10:00 AM', 'Tomorrow · 2:00 PM'] as string[]).map((slot) => (
                <button key={slot} onClick={() => setModalOpen(false)} className="c-btn-secondary py-2.5 text-[11px] font-semibold cursor-pointer rounded-xl">{slot}</button>
              ))}
            </div>
            <button
              onClick={() => {
                setModalOpen(false);
                addToast({ variant: 'success', title: 'Advisor Call Booked!', message: 'Alexandra confirmed your appointment. Calendar invite sent to your email.', action: { label: 'View Calendar', onClick: () => {} } });
              }}
              className="c-btn-primary w-full py-2.5 text-[12px] font-semibold cursor-pointer rounded-xl"
            >
              Confirm Booking
            </button>
          </div>
        )}

        {modalType === 'message' && (
          <div className="space-y-4">
            <h2 className="text-[16px] font-bold text-[var(--fg)]">Message Alexandra</h2>
            <textarea
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[12px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] resize-none outline-none"
              style={{ borderColor: 'var(--border)' }}
              rows={4}
              placeholder="Type your message…"
            />
            <button
              onClick={() => {
                setModalOpen(false);
                addToast({ variant: 'success', title: 'Message Sent to Alexandra', message: 'She will respond within 2 hours during business hours.' });
              }}
              className="c-btn-primary w-full py-2.5 text-[12px] cursor-pointer rounded-xl"
            >
              Send Message
            </button>
          </div>
        )}

        {modalType === 'nda' && (
          <div className="space-y-4">
            <h2 className="text-[16px] font-bold text-[var(--fg)]">Sign NDA & Access Deal</h2>
            <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed">By proceeding you agree to keep all information strictly confidential under the Glimmora NDA framework.</p>
            <div className="rounded-xl bg-[rgba(139,115,85,0.04)] border border-[rgba(139,115,85,0.1)] p-3">
              <p className="text-[10px] text-[var(--fg-secondary)]">NDA Reference: GL-{Math.random().toString(36).substring(2, 8).toUpperCase()} · Valid 90 days</p>
            </div>
            <button
              onClick={() => {
                setModalOpen(false);
                addToast({ variant: 'success', title: 'NDA Signed Successfully', message: 'Deal deck sending to your registered email. Accessible within 10 minutes.', action: { label: 'Open Email', onClick: () => {} } });
              }}
              className="c-btn-primary w-full py-2.5 text-[12px] cursor-pointer rounded-xl flex items-center justify-center gap-2"
            >
              <Shield className="h-4 w-4" strokeWidth={1.5} /> Sign & Access Deal
            </button>
          </div>
        )}
      </Dialog>

      {/* ═══ TOAST NOTIFICATIONS ═══ */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} mounted={mounted} />
    </div>
  );
}
