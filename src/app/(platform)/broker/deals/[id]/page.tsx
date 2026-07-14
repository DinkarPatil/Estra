// @ts-nocheck
'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/layout/page-container';
import {
  ArrowLeft, Building2, MapPin, Calendar, Clock, DollarSign,
  Phone, Mail, MessageSquare, Target, Flame, Star, CheckCircle,
  TrendingUp, AlertTriangle, Eye, Send, X, MoreHorizontal,
  Users, Activity, FileText, ChevronRight,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   TYPES + CONFIG (mirrors parent page)
   ═══════════════════════════════════════════════════ */
type Stage    = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closing' | 'Won';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface Deal {
  id: string; property: string; client: string; clientInitials: string;
  value: number; currency: string; stage: Stage; probability: number;
  owner: string; ownerInitials: string; closeDate: string;
  priority: Priority; location: string; lastActivity: string;
  messages: number; isHot?: boolean; notes?: string;
}

const STAGE_CFG: Record<Stage, { color: string; bg: string }> = {
  Lead:        { color: '#9A8B7E', bg: '#F9F7F4' },
  Qualified:   { color: '#8B7355', bg: '#EDE7DF' },
  Proposal:    { color: '#3B82F6', bg: '#EFF6FF' },
  Negotiation: { color: '#F59E0B', bg: '#FFFBEB' },
  Closing:     { color: '#F97316', bg: '#FFF7ED' },
  Won:         { color: '#16A34A', bg: '#F0FDF4' },
};

const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string }> = {
  low:    { label: 'Low',    color: '#9A8B7E', bg: '#F3EFEA' },
  medium: { label: 'Medium', color: '#A89478', bg: '#EDE7DF' },
  high:   { label: 'High',   color: '#F59E0B', bg: '#FFFBEB' },
  urgent: { label: 'Urgent', color: '#EF4444', bg: '#FEF2F2' },
};

const STAGES: Stage[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closing', 'Won'];

/* ═══════════════════════════════════════════════════
   MOCK DATA (same as parent page)
   ═══════════════════════════════════════════════════ */
const DEALS: Deal[] = [
  { id: 'd-001', property: 'Palm Jumeirah Penthouse', client: 'Al-Rashid Family', clientInitials: 'AR', value: 12400000, currency: 'AED', stage: 'Negotiation', probability: 72, owner: 'Sara M', ownerInitials: 'SM', closeDate: '2026-05-15', priority: 'urgent', location: 'Palm Jumeirah', lastActivity: '2h ago', messages: 4, isHot: true, notes: 'Counter offer pending review' },
  { id: 'd-002', property: 'Downtown Loft Suite', client: 'Chen Capital', clientInitials: 'CC', value: 8750000, currency: 'AED', stage: 'Proposal', probability: 55, owner: 'Ahmed K', ownerInitials: 'AK', closeDate: '2026-05-28', priority: 'high', location: 'Downtown Dubai', lastActivity: '1d ago', messages: 2, notes: 'Full proposal deck sent' },
  { id: 'd-003', property: 'Marina Bay Tower', client: 'Kumar Holdings', clientInitials: 'KH', value: 6200000, currency: 'AED', stage: 'Qualified', probability: 38, owner: 'Sara M', ownerInitials: 'SM', closeDate: '2026-06-10', priority: 'medium', location: 'Dubai Marina', lastActivity: '3d ago', messages: 1 },
  { id: 'd-004', property: 'Canary Wharf Residences', client: 'Morgan Estate', clientInitials: 'ME', value: 5100000, currency: 'AED', stage: 'Closing', probability: 88, owner: 'Liam O', ownerInitials: 'LO', closeDate: '2026-04-30', priority: 'urgent', location: 'Business Bay', lastActivity: '4h ago', messages: 7, isHot: true },
  { id: 'd-005', property: 'JBR Beachfront Villa', client: 'Tanaka Group', clientInitials: 'TG', value: 18900000, currency: 'AED', stage: 'Lead', probability: 20, owner: 'Ahmed K', ownerInitials: 'AK', closeDate: '2026-07-01', priority: 'medium', location: 'JBR, Dubai', lastActivity: '1w ago', messages: 0 },
  { id: 'd-006', property: 'Emaar Beachfront Plot', client: 'Silva Investments', clientInitials: 'SI', value: 22000000, currency: 'AED', stage: 'Won', probability: 100, owner: 'Liam O', ownerInitials: 'LO', closeDate: '2026-04-12', priority: 'high', location: 'Emaar, Dubai', lastActivity: '2d ago', messages: 3 },
  { id: 'd-007', property: 'Bluewaters Island Apt', client: 'Okafor Family', clientInitials: 'OF', value: 4300000, currency: 'AED', stage: 'Proposal', probability: 45, owner: 'Sara M', ownerInitials: 'SM', closeDate: '2026-06-05', priority: 'low', location: 'Bluewaters', lastActivity: '2d ago', messages: 1 },
  { id: 'd-008', property: 'Business Bay Commercial', client: 'NovaTech RE', clientInitials: 'NT', value: 9800000, currency: 'AED', stage: 'Negotiation', probability: 65, owner: 'Ahmed K', ownerInitials: 'AK', closeDate: '2026-05-20', priority: 'high', location: 'Business Bay', lastActivity: '6h ago', messages: 5 },
  { id: 'd-009', property: 'DIFC Premium Office', client: 'Atlas Partners', clientInitials: 'AP', value: 15600000, currency: 'AED', stage: 'Closing', probability: 91, owner: 'Sara M', ownerInitials: 'SM', closeDate: '2026-04-28', priority: 'urgent', location: 'DIFC, Dubai', lastActivity: '1h ago', messages: 9, isHot: true },
  { id: 'd-010', property: 'Meydan Golf Estate', client: 'Laurent Family', clientInitials: 'LF', value: 7200000, currency: 'AED', stage: 'Qualified', probability: 42, owner: 'Liam O', ownerInitials: 'LO', closeDate: '2026-06-20', priority: 'medium', location: 'Meydan, Dubai', lastActivity: '4d ago', messages: 0 },
];

const ACTIVITY_TIMELINE = [
  { event: 'Deal created from lead', type: 'created', daysAgo: 14 },
  { event: 'First meeting with client', type: 'meeting', daysAgo: 12 },
  { event: 'Property viewing scheduled', type: 'visit', daysAgo: 10 },
  { event: 'Proposal sent to client', type: 'proposal', daysAgo: 7 },
  { event: 'Client requested price review', type: 'note', daysAgo: 5 },
  { event: 'Counter-offer submitted', type: 'negotiation', daysAgo: 3 },
  { event: 'Follow-up call completed', type: 'call', daysAgo: 1 },
];

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */
function fmtVal(n: number, cur = 'AED') {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M ${cur}`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K ${cur}`;
  return `${n.toLocaleString()} ${cur}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function daysUntil(s: string) {
  const diff = Math.ceil((new Date(s).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Today';
  return `${diff}d`;
}

function activityIcon(type: string) {
  switch (type) {
    case 'created':     return { Icon: CheckCircle, color: '#8B7355', bg: '#EDE7DF' };
    case 'meeting':     return { Icon: Users,       color: '#3B82F6', bg: '#EFF6FF' };
    case 'visit':       return { Icon: Eye,         color: '#16A34A', bg: '#F0FDF4' };
    case 'proposal':    return { Icon: Send,        color: '#F59E0B', bg: '#FFFBEB' };
    case 'note':        return { Icon: FileText,    color: '#9A8B7E', bg: '#F3EFEA' };
    case 'negotiation': return { Icon: Target,      color: '#F97316', bg: '#FFF7ED' };
    case 'call':        return { Icon: Phone,       color: '#3B82F6', bg: '#EFF6FF' };
    default:            return { Icon: Clock,       color: '#9A8B7E', bg: '#F3EFEA' };
  }
}

const FADE = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } };

/* ═══════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════ */
export default function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const deal = DEALS.find(d => d.id === id);
  const [modal, setModal] = useState<'call' | 'email' | 'note' | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!deal) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-sm font-semibold text-[var(--fg)]">Deal not found</p>
          <p className="text-xs text-[var(--fg-muted)]">The deal with ID &quot;{id}&quot; does not exist.</p>
          <button
            onClick={() => router.push('/broker/deals')}
            className="rounded-lg bg-[#6F5C46] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5A4A38] transition-colors cursor-pointer"
          >
            Back to Deals
          </button>
        </div>
      </PageContainer>
    );
  }

  const sc = STAGE_CFG[deal.stage];
  const pc = PRIORITY_CFG[deal.priority];
  const probColor = deal.probability >= 75 ? '#16A34A' : deal.probability >= 50 ? '#F59E0B' : '#EF4444';
  const stageIdx = STAGES.indexOf(deal.stage);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (deal.probability / 100) * circumference;

  const aiInsights = [
    deal.isHot
      ? `This is a hot deal — ${deal.client} is actively engaged. Prioritize immediate follow-up.`
      : `${deal.client} shows steady interest. Maintain regular touchpoints to move through the pipeline.`,
    `Deal value of ${fmtVal(deal.value, deal.currency)} is ${deal.value >= 10_000_000 ? 'above' : 'within'} the average for ${deal.location}. ${deal.value >= 10_000_000 ? 'High-value deals benefit from in-person meetings.' : 'Consider bundling with nearby listings.'}`,
    `Close date is ${daysUntil(deal.closeDate)} away. ${deal.probability >= 70 ? 'Strong probability — focus on finalizing documentation.' : 'Increase touchpoints to improve win probability before deadline.'}`,
  ];

  return (
    <PageContainer className="dp-page">
      {/* Back nav + actions */}
      <motion.div initial="hidden" animate="visible" variants={FADE} transition={{ duration: 0.3 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => router.push('/broker/deals')}
          className="flex items-center gap-2 text-sm font-medium text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Deals
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => { setSubmitted(false); setModal('call'); }}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3.5 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
            <Phone className="h-3.5 w-3.5" /> Call
          </button>
          <button onClick={() => { setSubmitted(false); setModal('email'); }}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3.5 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button onClick={() => { setSubmitted(false); setModal('note'); }}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#6F5443] to-[#8B6F47] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity cursor-pointer">
            <MessageSquare className="h-3.5 w-3.5" /> Add Note
          </button>
        </div>
      </motion.div>

      {/* Hero card */}
      <motion.div initial="hidden" animate="visible" variants={FADE} transition={{ duration: 0.35, delay: 0.05 }}
        className="bkr-hero">
        <div className="bkr-hero-inner flex-wrap !items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: sc.bg, color: sc.color }}>
                {deal.stage}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: pc.bg, color: pc.color }}>
                {deal.priority === 'urgent' && <Flame className="h-3 w-3" />}
                {pc.label} Priority
              </span>
              {deal.isHot && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#FEF2F2', color: '#EF4444' }}>
                  <Flame className="h-3 w-3" /> Hot Deal
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">{deal.property}</h1>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-[var(--fg-muted)]">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {deal.location}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Close: {fmtDate(deal.closeDate)}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="block text-2xl font-bold text-[var(--fg)] tracking-tight">{fmtVal(deal.value, deal.currency)}</span>
            <span className="text-[12px] text-[var(--fg-muted)] font-medium">Deal Value</span>
          </div>
        </div>
      </motion.div>

      {/* Stage progress */}
      <motion.div initial="hidden" animate="visible" variants={FADE} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <div className="flex items-center gap-1">
          {STAGES.map((s, i) => {
            const active = i <= stageIdx;
            const current = s === deal.stage;
            return (
              <div key={s} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className="h-2 w-full rounded-full transition-colors"
                    style={{
                      background: active ? STAGE_CFG[s].color : 'var(--bg-secondary)',
                      opacity: current ? 1 : active ? 0.6 : 0.3,
                    }}
                  />
                  <span style={{
                    fontSize: 11, fontWeight: current ? 700 : 500,
                    color: current ? STAGE_CFG[s].color : 'var(--fg-muted)',
                  }}>
                    {s}
                  </span>
                </div>
                {i < STAGES.length - 1 && <ChevronRight className="h-3 w-3 text-[var(--fg-muted)] shrink-0 mx-0.5 opacity-30" />}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          {/* Win Probability */}
          <motion.div initial="hidden" animate="visible" variants={FADE} transition={{ delay: 0.15 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="text-sm font-semibold text-[var(--fg)] mb-4">Win Probability</h3>
            <div className="flex items-center gap-6">
              <div className="relative flex h-28 w-28 items-center justify-center shrink-0">
                <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
                  <circle cx="56" cy="56" r="40" fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
                  <circle cx="56" cy="56" r="40" fill="none" stroke={probColor} strokeWidth="8"
                    strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <span className="text-3xl font-bold" style={{ color: probColor }}>{deal.probability}%</span>
              </div>
              <div>
                <p className="text-sm text-[var(--fg-secondary)]">Assessment</p>
                <p className="text-lg font-semibold" style={{ color: probColor }}>
                  {deal.probability >= 75 ? 'Likely to Close' : deal.probability >= 50 ? 'Moderate Chance' : 'Needs Work'}
                </p>
                <p className="mt-1 text-xs text-[var(--fg-muted)]">
                  Closing in {daysUntil(deal.closeDate)}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Client info */}
          <motion.div initial="hidden" animate="visible" variants={FADE} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="text-sm font-semibold text-[var(--fg)] mb-4">Client Information</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: '#6F5C46' }}>
                {deal.clientInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--fg)]">{deal.client}</p>
                <p className="text-xs text-[var(--fg-muted)]">{deal.location}</p>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--fg-secondary)]">Messages</span>
                <span className="font-medium text-[var(--fg)]">{deal.messages}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--fg-secondary)]">Last Activity</span>
                <span className="font-medium text-[var(--fg)]">{deal.lastActivity}</span>
              </div>
              {deal.notes && (
                <div className="pt-3 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--fg-muted)] mb-1">Notes</p>
                  <p className="text-sm text-[var(--fg)]">{deal.notes}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Deal owner */}
          <motion.div initial="hidden" animate="visible" variants={FADE} transition={{ delay: 0.25 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="text-sm font-semibold text-[var(--fg)] mb-4">Deal Owner</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: '#A89478' }}>
                {deal.ownerInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--fg)]">{deal.owner}</p>
                <p className="text-xs text-[var(--fg-muted)]">Broker</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Activity timeline */}
          <motion.div initial="hidden" animate="visible" variants={FADE} transition={{ delay: 0.15 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="text-sm font-semibold text-[var(--fg)] mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {ACTIVITY_TIMELINE.map((act, i) => {
                const { Icon, color, bg } = activityIcon(act.type);
                const date = new Date(Date.now() - act.daysAgo * 86400000);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--fg)]">{act.event}</p>
                      <p className="text-xs text-[var(--fg-muted)]">{dateStr} ({act.daysAgo}d ago)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div initial="hidden" animate="visible" variants={FADE} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-[#8B7355] flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">AI</span>
              </div>
              <h3 className="text-sm font-semibold text-[var(--fg)]">AI Deal Insights</h3>
            </div>
            <ul className="space-y-3">
              {aiInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#8B7355] shrink-0" />
                  <p className="text-sm text-[var(--fg-secondary)]">{insight}</p>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Deal summary */}
          <motion.div initial="hidden" animate="visible" variants={FADE} transition={{ delay: 0.25 }}
            className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="text-sm font-semibold text-[var(--fg)] mb-4">Deal Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--fg-secondary)]">Property</span>
                <span className="font-medium text-[var(--fg)]">{deal.property}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--fg-secondary)]">Value</span>
                <span className="font-medium text-[var(--fg)]">{fmtVal(deal.value, deal.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--fg-secondary)]">Stage</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                  {deal.stage}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--fg-secondary)]">Priority</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: pc.bg, color: pc.color }}>
                  {pc.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--fg-secondary)]">Close Date</span>
                <span className="font-medium text-[var(--fg)]">{fmtDate(deal.closeDate)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--fg-secondary)]">Days Until Close</span>
                <span className="font-medium text-[var(--fg)]">{daysUntil(deal.closeDate)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Action Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <button onClick={() => setModal(null)} className="absolute right-4 top-4 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>

            {!submitted ? (
              <>
                {modal === 'call' && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7DF]">
                        <Phone className="h-5 w-5 text-[#6F5C46]" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--fg)]">Call Client</h3>
                        <p className="text-xs text-[var(--fg-muted)]">{deal.client}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Date</label>
                        <input type="date" className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Notes</label>
                        <textarea rows={3} placeholder="Call agenda or notes..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46] resize-none" />
                      </div>
                      <button onClick={() => setSubmitted(true)} className="w-full rounded-lg bg-[#6F5C46] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5A4A38] transition-colors cursor-pointer">
                        Schedule Call
                      </button>
                    </div>
                  </>
                )}

                {modal === 'email' && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7DF]">
                        <Mail className="h-5 w-5 text-[#6F5C46]" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--fg)]">Email Client</h3>
                        <p className="text-xs text-[var(--fg-muted)]">{deal.client}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Subject</label>
                        <input type="text" defaultValue={`Re: ${deal.property} — Deal Update`} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46]" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Message</label>
                        <textarea rows={4} defaultValue={`Dear ${deal.client},\n\nI wanted to follow up regarding ${deal.property}.\n\nBest regards`} className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46] resize-none" />
                      </div>
                      <button onClick={() => setSubmitted(true)} className="w-full rounded-lg bg-[#6F5C46] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5A4A38] transition-colors cursor-pointer">
                        Send Email
                      </button>
                    </div>
                  </>
                )}

                {modal === 'note' && (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE7DF]">
                        <MessageSquare className="h-5 w-5 text-[#6F5C46]" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--fg)]">Add Note</h3>
                        <p className="text-xs text-[var(--fg-muted)]">{deal.property}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">Note</label>
                        <textarea rows={4} placeholder="Add a note about this deal..." className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-[#6F5C46] resize-none" />
                      </div>
                      <button onClick={() => setSubmitted(true)} className="w-full rounded-lg bg-[#6F5C46] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5A4A38] transition-colors cursor-pointer">
                        Save Note
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F0FDF4] mb-4">
                  <CheckCircle className="h-7 w-7 text-[#10B981]" />
                </div>
                <h3 className="text-base font-semibold text-[var(--fg)] mb-1">
                  {modal === 'call' && 'Call Scheduled'}
                  {modal === 'email' && 'Email Sent'}
                  {modal === 'note' && 'Note Saved'}
                </h3>
                <p className="text-sm text-[var(--fg-muted)] mb-5">
                  {modal === 'call' && `Call with ${deal.client} has been scheduled.`}
                  {modal === 'email' && `Email has been sent to ${deal.client}.`}
                  {modal === 'note' && `Note has been added to ${deal.property}.`}
                </p>
                <button onClick={() => setModal(null)} className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] px-6 py-2 text-sm font-medium text-[var(--fg)] hover:bg-[var(--border)] transition-colors cursor-pointer">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
