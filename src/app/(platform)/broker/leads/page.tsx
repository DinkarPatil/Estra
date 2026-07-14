'use client';

import { useState, useMemo, useCallback, useRef, useEffect, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Flame, Brain, DollarSign,
  Search, Plus, Download, Eye, Phone, Mail,
  MapPin, Clock, ArrowUpRight,
  BarChart3, Activity, ChevronRight,
  ChevronLeft, ChevronDown,
  MoreVertical, Star, TrendingDown, TrendingUp,
  ArrowRight, RefreshCw, X, Check, Filter,
  Trash2, UserPlus, Send, Copy, Loader2, Zap, Calendar,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis,
} from 'recharts';
import { PageContainer } from '@/components/layout/page-container';
import { ApiBrokerService } from '@/services/api/broker.api';
import type { BrokerLead } from '@/services/interfaces/broker.interface';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';
import type { Lead as PipelineLead } from '@/types/lead';

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */

type LeadStatus = 'hot' | 'warm' | 'cold';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  interest: string;
  budget: number;
  budgetCurrency: string;
  score: number;
  status: LeadStatus;
  source: string;
  createdAt: string;
  lastActivity: string;
  nextFollowUp: string;
  owner: string;
  tags: string[];
}

/* ═══════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════ */

const MOCK_LEADS: Lead[] = [
  { id: 'lead-001', name: 'Khalid Al-Rashid', email: 'khalid@email.com',  phone: '+971 50 123 4567', location: 'Dubai, UAE',        interest: 'Villa',               budget: 20000000,  budgetCurrency: 'AED', score: 95, status: 'hot',  source: 'Direct',   createdAt: '2025-01-20', lastActivity: '30m ago', nextFollowUp: 'Today, 3:00 PM',    owner: 'James Okafor', tags: ['Urgent', 'NRI'] },
  { id: 'lead-002', name: 'Arjun Mehta',      email: 'arjun@email.com',   phone: '+91 98765 43210',  location: 'Mumbai, India',     interest: 'Luxury Residential',  budget: 50000000,  budgetCurrency: 'INR', score: 92, status: 'hot',  source: 'Referral', createdAt: '2025-01-15', lastActivity: '2h ago',  nextFollowUp: 'Tomorrow, 11:00 AM', owner: 'James Okafor', tags: ['Investor', 'Luxury'] },
  { id: 'lead-003', name: 'Takeshi Yamada',   email: 'takeshi@email.com', phone: '+81 90 1234 5678', location: 'Tokyo, Japan',      interest: 'Investment Property', budget: 300000000, budgetCurrency: 'JPY', score: 83, status: 'warm', source: 'Event',    createdAt: '2025-01-25', lastActivity: '3h ago',  nextFollowUp: 'May 24, 10:00 AM',  owner: 'James Okafor', tags: ['Investor'] },
  { id: 'lead-004', name: 'Sofia Andersson',  email: 'sofia@email.com',   phone: '+46 70 123 4567',  location: 'Stockholm, Sweden', interest: 'Commercial Office',   budget: 2000000,   budgetCurrency: 'EUR', score: 78, status: 'warm', source: 'Platform', createdAt: '2025-01-18', lastActivity: '1d ago',  nextFollowUp: 'May 25, 4:30 PM',   owner: 'James Okafor', tags: ['Commercial'] },
  { id: 'lead-005', name: 'Emma Fitzgerald',  email: 'emma@email.com',    phone: '+44 7700 900123',  location: 'London, UK',        interest: 'Penthouse',           budget: 5000000,   budgetCurrency: 'GBP', score: 65, status: 'cold', source: 'Web',      createdAt: '2025-01-22', lastActivity: '5d ago',  nextFollowUp: 'May 28, 12:00 PM',  owner: 'James Okafor', tags: ['Returning'] },
];

const AI_INSIGHTS = [
  { text: 'Arjun has 91% close probability — schedule a meeting this week.',  type: 'hot'     as const, icon: Flame,       leadId: 'lead-002', priority: 'high'   as const, cta: 'Schedule Meeting', name: 'Arjun Mehta' },
  { text: 'Khalid is high-value and urgent — prioritize immediately.',         type: 'urgent'  as const, icon: Star,        leadId: 'lead-001', priority: 'high'   as const, cta: 'Call Now',         name: 'Khalid Al-Rashid' },
  { text: 'Call Sofia after 6 PM for the best response rate.',                 type: 'tip'     as const, icon: Clock,       leadId: 'lead-004', priority: 'medium' as const, cta: 'Schedule Call',    name: 'Sofia Andersson' },
  { text: 'Emma\'s engagement dropped 18% — risk of going cold.',              type: 'warning' as const, icon: TrendingDown,leadId: 'lead-005', priority: 'low'    as const, cta: 'Review Lead',      name: 'Emma Fitzgerald' },
];

const LEAD_TIMELINES: Record<string, { event: string; time: string; icon: React.ElementType }[]> = {
  'lead-001': [
    { event: 'Viewed 3 listings', time: '30m ago', icon: Eye },
    { event: 'Requested property tour', time: '2h ago', icon: Calendar },
    { event: 'Contacted via phone', time: '1d ago', icon: Phone },
  ],
  'lead-002': [
    { event: 'Replied to email', time: '2h ago', icon: Mail },
    { event: 'Downloaded brochure', time: '4h ago', icon: Download },
    { event: 'Viewed listings', time: '1d ago', icon: Eye },
  ],
  'lead-003': [
    { event: 'Opened investment report', time: '3h ago', icon: Eye },
    { event: 'Requested callback', time: '1d ago', icon: Phone },
    { event: 'First contact made', time: '3d ago', icon: Mail },
  ],
  'lead-004': [
    { event: 'Requested callback', time: '1d ago', icon: Phone },
    { event: 'Viewed office listings', time: '2d ago', icon: Eye },
    { event: 'Submitted enquiry', time: '5d ago', icon: Mail },
  ],
  'lead-005': [
    { event: 'Last opened email', time: '5d ago', icon: Mail },
    { event: 'Viewed penthouse', time: '1w ago', icon: Eye },
    { event: 'Initial contact', time: '2w ago', icon: Phone },
  ],
};

const RECENT_ACTIVITY_BASE = [
  { user: 'Arjun',   action: 'replied to email',       time: '2h ago',  leadId: 'lead-002', icon: Mail },
  { user: 'Khalid',  action: 'viewed 3 listings',      time: '30m ago', leadId: 'lead-001', icon: Eye },
  { user: 'Sofia',   action: 'requested callback',     time: '1d ago',  leadId: 'lead-004', icon: Phone },
  { user: 'Takeshi', action: 'opened brochure',        time: '3h ago',  leadId: 'lead-003', icon: Star },
  { user: 'Emma',    action: 'engagement dropped 18%', time: '5h ago',  leadId: 'lead-005', icon: TrendingDown },
];

const PERIOD_OPTIONS = ['This Month', 'Last Month', 'This Quarter'];

const PERIOD_SCALE: Record<string, number> = {
  'This Month':   1,
  'Last Month':   0.79,
  'This Quarter': 2.85,
};

const CHART_COLORS = ['#5A4A38', '#6F5C46', '#8B6F47', '#A08460', '#C4A882'];

const FUNNEL_BROWN_PALETTE = ['#6F5443', '#8B6F47', '#A08060', '#B89A7A', '#C9B093'];

/* KPI supplementary data (static trend + insight) */
const KPI_EXTRAS: Record<string, { sparkData: number[]; insight: string }> = {
  'Total Leads':    { sparkData: [3, 4, 4, 5, 5, 6, 7], insight: '3 new leads from referrals this week' },
  'Hot Leads':      { sparkData: [1, 1, 2, 2, 2, 3, 4], insight: '2 urgent leads need immediate follow-up' },
  'Avg AI Score':   { sparkData: [72, 74, 75, 76, 77, 78, 79], insight: 'Score improved from better engagement data' },
  'Pipeline Value': { sparkData: [10, 12, 13, 14, 15, 16, 18], insight: 'Grew from strong closing rate this month' },
};

/* ═══════════════════════════════════════════════════
   API → DISPLAY MAPPER
   ═══════════════════════════════════════════════════ */

function mapApiLead(l: BrokerLead): Lead {
  const STATUS_SCORE: Record<string, number> = { hot: 90, warm: 73, cold: 52 };
  const validStatus: LeadStatus =
    l.status === 'hot' || l.status === 'warm' || l.status === 'cold' ? l.status : 'cold';
  const budgetCurrency = l.notes?.match(/\b(AED|INR|USD|GBP|EUR|JPY|SGD)\b/)?.[1] ?? 'USD';
  return {
    id: l.id, name: l.name,
    email: l.email ?? '—', phone: l.phone ?? '—',
    location: l.notes?.split('|')[0]?.trim() ?? 'Location not specified',
    interest: l.property_type ?? 'Residential',
    budget: l.budget_max ?? l.budget_min ?? 0,
    budgetCurrency, score: STATUS_SCORE[validStatus] ?? 60,
    status: validStatus, source: l.source ?? 'Direct',
    createdAt: l.created_at, lastActivity: 'Recently',
    nextFollowUp: '—', owner: 'Agent', tags: [],
  };
}

function mapPipelineLead(pl: PipelineLead): Lead {
  const statusByIntent: Record<string, LeadStatus> = { high: 'hot', medium: 'warm', low: 'cold' };
  const sourceLabel: Record<string, string> = {
    'book-visit': 'Book-Visit', 'invest-now': 'Invest-Now',
    'contact-broker': 'Contact-Broker', 'smart-search': 'Smart-Search',
  };
  const tags: string[] = [];
  if (pl.source === 'book-visit')     tags.push('Visit Booked');
  if (pl.source === 'invest-now')     tags.push('High Intent');
  if (pl.source === 'contact-broker') tags.push('Broker Request');
  return {
    id: pl.id, name: pl.investorName,
    email: pl.investorEmail ?? '—', phone: pl.investorPhone ?? '—',
    location: pl.propertyLocation, interest: pl.propertyName,
    budget: pl.investorBudget?.amount ?? 0,
    budgetCurrency: pl.investorBudget?.currency ?? 'USD',
    score: pl.aiScore,
    status: statusByIntent[pl.intentLevel] ?? 'warm',
    source: sourceLabel[pl.source] ?? pl.source,
    createdAt: pl.createdAt.split('T')[0],
    lastActivity: 'Just now', nextFollowUp: '—', owner: 'You', tags,
  };
}

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */

function fmtBudget(amount: number, currency: string) {
  if (!amount) return '—';
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B ${currency}`.trim();
  if (amount >= 1_000_000)     return `${(amount / 1_000_000).toFixed(1)}M ${currency}`.trim();
  if (amount >= 1_000)         return `${(amount / 1_000).toFixed(0)}K ${currency}`.trim();
  return `${amount.toLocaleString()} ${currency}`.trim();
}

const AVATAR_BG: Record<string, string> = {
  KA: '#6F5C46', AM: '#8B7355', TY: '#5A4A38', SA: '#A89478', EF: '#7A6B5E',
};

const fadeUp = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

/* ═══════════════════════════════════════════════════
   MINI SPARKLINE
   ═══════════════════════════════════════════════════ */

const LD_SPARK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function KPISparkline({ data, color }: { data: number[]; color: string }) {
  const id = `kpi-ld-${color.replace('#', '')}-${data[0]}`;
  const chartData = data.map((v, i) => ({ day: LD_SPARK_DAYS[i] ?? `D${i + 1}`, v }));
  return (
    <div style={{ width: '100%', height: 64 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 11,
              padding: '4px 8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            formatter={(value) => [`${value}`, '']}
            labelStyle={{ fontSize: 10, color: 'var(--fg-muted)' }}
          />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#${id})`} dot={{ r: 2.5, fill: color, strokeWidth: 0 }} activeDot={{ r: 4, fill: color, strokeWidth: 2, stroke: 'var(--card-bg)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PREMIUM FILTER CHIP DROPDOWN
   ═══════════════════════════════════════════════════ */

interface DropdownOption { value: string; label: string }

function FilterChip({
  label, value, onChange, options, icon: Icon,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  icon?: React.ElementType;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = value !== 'all';
  const selectedLabel = options.find(o => o.value === value)?.label ?? label;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        className={`ld-fchip-btn${isActive ? ' active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {Icon && <Icon className="h-3 w-3" />}
        <span>{isActive ? selectedLabel : label}</span>
        <ChevronDown
          className="h-3 w-3"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.13, ease: 'easeOut' }}
            className="ld-fchip-menu"
          >
            {options.map(opt => (
              <button
                key={opt.value}
                className={`ld-fchip-option${value === opt.value ? ' active' : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span className="ld-fchip-check">
                  {value === opt.value && <Check className="h-3 w-3" />}
                </span>
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PeriodDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button className="ld-period-btn" onClick={() => setOpen(o => !o)}>
        {value}
        <ChevronDown
          className="h-3 w-3"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.13, ease: 'easeOut' }}
            className="ld-period-menu"
          >
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt}
                className={`ld-fchip-option${value === opt ? ' active' : ''}`}
                onClick={() => { onChange(opt); setOpen(false); }}
              >
                <span className="ld-fchip-check">
                  {value === opt && <Check className="h-3 w-3" />}
                </span>
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TABLE CELL COMPONENTS
   ═══════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; dot: string; border: string }> = {
    hot:  { bg: 'rgba(239,68,68,0.07)',   color: '#DC2626', dot: '#EF4444', border: 'rgba(239,68,68,0.2)' },
    warm: { bg: 'rgba(245,158,11,0.07)',  color: '#B45309', dot: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
    cold: { bg: 'rgba(139,111,71,0.07)', color: '#6F5443', dot: '#A89478', border: 'rgba(139,111,71,0.2)' },
  };
  const s = cfg[status] || { bg: 'rgba(154,139,126,0.07)', color: '#7A6B5E', dot: '#9A8B7E', border: 'rgba(154,139,126,0.2)' };
  return (
    <span
      className="ld-status-badge"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <span className="ld-status-dot" style={{ background: s.dot }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AIScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? '#22C55E' : score >= 70 ? '#F59E0B' : '#9A8B7E';
  const bg    = score >= 85 ? 'rgba(34,197,94,0.12)' : score >= 70 ? 'rgba(245,158,11,0.12)' : 'rgba(154,139,126,0.12)';
  return (
    <div className="flex items-center gap-1.5 group/score" title={`AI Score: ${score} — based on engagement, budget match & response speed`}>
      <div className="ld-score-bar" style={{ background: bg }}>
        <motion.div
          className="ld-score-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: color }}
        />
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  const SOURCE_COLORS: Record<string, { bg: string; color: string }> = {
    Referral: { bg: '#EDE7DF', color: '#5A4A38' },
    Web:      { bg: '#F0F9FF', color: '#0369A1' },
    Direct:   { bg: 'rgba(34,197,94,0.08)', color: '#15803D' },
    Event:    { bg: '#FFF7ED', color: '#C2410C' },
    Platform: { bg: '#F5F3FF', color: '#7C3AED' },
  };
  const cfg = SOURCE_COLORS[source] || { bg: '#F3EFEA', color: '#7A6B5E' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 8,
      fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {source || '—'}
    </span>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="ld-toast"
    >
      <Check className="h-4 w-4 text-[#10B981]" />
      <span>{message}</span>
      <button onClick={onClose} className="ld-toast-close"><X className="h-3.5 w-3.5" /></button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   EXPANDED ROW CONTENT
   ═══════════════════════════════════════════════════ */

function ExpandedRowContent({
  lead,
  onNavigate,
  onClose,
  onToast,
}: {
  lead: Lead;
  onNavigate: (path: string) => void;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const aiInsight = AI_INSIGHTS.find(i => i.leadId === lead.id);
  const timeline  = LEAD_TIMELINES[lead.id] ?? [];
  const Icon      = aiInsight?.icon ?? Brain;
  const insightCfg = {
    hot:     { bg: 'rgba(239,68,68,0.06)',  color: '#DC2626' },
    urgent:  { bg: 'rgba(245,158,11,0.06)', color: '#D97706' },
    tip:     { bg: 'rgba(139,111,71,0.06)', color: '#6F5443' },
    warning: { bg: 'rgba(234,88,12,0.06)',  color: '#C2410C' },
  }[aiInsight?.type ?? 'tip'] ?? { bg: 'rgba(139,111,71,0.06)', color: '#6F5443' };

  return (
    <div className="ld-expanded-content" onClick={e => e.stopPropagation()}>
      <div className="ld-expanded-grid">

        {/* Left: AI insight + timeline */}
        <div className="ld-expanded-left">
          {aiInsight && (
            <div className="ld-expanded-insight" style={{ background: insightCfg.bg, borderColor: insightCfg.color + '22' }}>
              <div className="ld-expanded-insight-icon" style={{ background: insightCfg.color + '15', color: insightCfg.color }}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{ color: insightCfg.color }}>AI Insight</p>
                <p className="text-[12px] text-[#3A3028] leading-relaxed font-medium">{aiInsight.text}</p>
              </div>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="ld-expanded-timeline">
              {timeline.map((event, i) => {
                const TIcon = event.icon;
                return (
                  <div key={i} className="ld-expanded-timeline-item">
                    <div className="ld-expanded-timeline-dot">
                      <TIcon className="h-2.5 w-2.5" />
                    </div>
                    <span className="text-[12px] text-[#5A4A38] font-medium flex-1">{event.event}</span>
                    <span className="text-[10px] text-[#9A8B7E]">{event.time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Owner + quick actions */}
        <div className="ld-expanded-right">
          <div className="mb-3">
            <p className="text-[10px] text-[#9A8B7E] uppercase font-bold tracking-wide mb-1.5">Owner</p>
            <div className="flex items-center gap-2">
              <div className="ld-expanded-owner-dot">{lead.owner.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
              <div>
                <p className="text-[12px] font-semibold text-[#1F1814]">{lead.owner}</p>
                <p className="text-[10px] text-[#9A8B7E]">Lead Agent</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              className="ld-expanded-action-btn primary"
              onClick={() => { window.open(`tel:${lead.phone}`); onToast(`Calling ${lead.name}…`); }}
            >
              <Phone className="h-3.5 w-3.5" /> Call
            </button>
            <button
              className="ld-expanded-action-btn"
              onClick={() => { window.open(`mailto:${lead.email}`); onToast('Email client opened'); }}
            >
              <Mail className="h-3.5 w-3.5" /> Email
            </button>
            <button
              className="ld-expanded-action-btn"
              onClick={() => onToast(`Scheduling call with ${lead.name}…`)}
            >
              <Calendar className="h-3.5 w-3.5" /> Schedule
            </button>
            <button
              className="ld-expanded-action-btn view"
              onClick={() => onNavigate(`/broker/leads/${lead.id}`)}
            >
              <Eye className="h-3.5 w-3.5" /> View Details
              <ArrowRight className="h-3 w-3 ml-auto" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function LeadsPage() {
  const router = useRouter();
  const brokerService = useRef(new ApiBrokerService()).current;
  const { leads: pipelineLeads, isHydrated } = useLeadPipeline();

  /* Data state */
  const [leads,   setLeads]   = useState<Lead[]>(MOCK_LEADS);
  const [loading, setLoading] = useState(true);

  /* Merge pipeline leads */
  const mergedLeads = useMemo(() => {
    if (!isHydrated) return leads;
    const investorCreated = pipelineLeads.filter(pl => pl.source !== 'legacy-mock').map(mapPipelineLead);
    if (investorCreated.length === 0) return leads;
    const createdIds = new Set(investorCreated.map(l => l.id));
    return [...investorCreated, ...leads.filter(l => !createdIds.has(l.id))];
  }, [leads, pipelineLeads, isHydrated]);

  /* Filter state */
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [scoreFilter,  setScoreFilter]  = useState('all');
  const [searchQuery,  setSearchQuery]  = useState('');

  /* Analytics state */
  const [sourcesPeriod, setSourcesPeriod] = useState('This Month');
  const [funnelPeriod,  setFunnelPeriod]  = useState('This Month');

  /* UI state */
  const [selectedLeads,      setSelectedLeads]      = useState<Set<string>>(new Set());
  const [currentPage,        setCurrentPage]        = useState(1);
  const [insightsExpanded,   setInsightsExpanded]   = useState(false);
  const [activityExpanded,   setActivityExpanded]   = useState(false);
  const [insightsRefreshing, setInsightsRefreshing] = useState(false);
  const [toast,              setToast]              = useState<string | null>(null);
  const [actionMenu,         setActionMenu]         = useState<string | null>(null);
  const [hoveredKPI,         setHoveredKPI]         = useState<number | null>(null);
  const [expandedRowId,      setExpandedRowId]      = useState<string | null>(null);

  const rowsPerPage = 10;

  /* Fetch leads */
  useEffect(() => {
    brokerService.listLeads()
      .then(res => { if (res.leads?.length) setLeads(res.leads.map(l => mapApiLead(l))); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshLeads = useCallback(async () => {
    setInsightsRefreshing(true);
    try {
      const res = await brokerService.listLeads();
      if (res.leads?.length) { setLeads(res.leads.map(l => mapApiLead(l))); showToast('Leads refreshed'); }
    } catch { /* keep current */ }
    finally { setInsightsRefreshing(false); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  /* Dynamic KPIs */
  const kpiCards = useMemo(() => {
    const total    = mergedLeads.length;
    const hotCount = mergedLeads.filter(l => l.status === 'hot').length;
    const avgScore = total > 0 ? Math.round(mergedLeads.reduce((s, l) => s + l.score, 0) / total * 10) / 10 : 0;
    const pipeline = mergedLeads.reduce((s, l) => s + (l.budget || 0), 0);
    return [
      { label: 'Total Leads',    value: String(total),       change: +12,  icon: Target,     color: '#8B6F47' },
      { label: 'Hot Leads',      value: String(hotCount),    change: +50,  icon: Flame,      color: '#EF4444' },
      { label: 'Avg AI Score',   value: String(avgScore),    change: +3.2, icon: Brain,      color: '#8B6F47' },
      { label: 'Pipeline Value', value: fmtBudget(pipeline, ''), change: +8.4, icon: DollarSign, color: '#22C55E' },
    ];
  }, [mergedLeads]);

  /* Source data */
  const sourceData = useMemo(() => {
    const counts: Record<string, number> = {};
    mergedLeads.forEach(l => { counts[l.source] = (counts[l.source] || 0) + 1; });
    const total = mergedLeads.length || 1;
    const scale = PERIOD_SCALE[sourcesPeriod] ?? 1;
    return Object.entries(counts).sort(([,a],[,b]) => b - a).slice(0, 5).map(([name, count], i) => ({
      name,
      value: Math.max(1, Math.round((count / total) * 100)),
      rawCount: Math.max(1, Math.round(count * scale)),
      color: CHART_COLORS[i] ?? '#9A8B7E',
    }));
  }, [mergedLeads, sourcesPeriod]);

  /* Funnel data */
  const funnelData = useMemo(() => {
    const scale  = PERIOD_SCALE[funnelPeriod] ?? 1;
    const total  = Math.round(mergedLeads.length * scale);
    const cont   = Math.round(total * 0.52);
    const qual   = Math.round(cont  * 0.46);
    const view   = Math.round(qual  * 0.33);
    const closed = Math.round(view  * 0.38);
    return [
      { stage: 'Total Leads', value: total,  pct: null },
      { stage: 'Contacted',   value: cont,   pct: '52%' },
      { stage: 'Qualified',   value: qual,   pct: '46%' },
      { stage: 'Viewing',     value: view,   pct: '33%' },
      { stage: 'Closed',      value: closed, pct: '38%' },
    ];
  }, [mergedLeads, funnelPeriod]);

  /* Filtered leads */
  const filtered = useMemo(() => {
    let list = [...mergedLeads];
    if (statusFilter !== 'all') list = list.filter(l => l.status === statusFilter);
    if (budgetFilter !== 'all') {
      list = list.filter(l => {
        if (budgetFilter === 'under1m') return l.budget < 1_000_000;
        if (budgetFilter === '1m10m')   return l.budget >= 1_000_000 && l.budget <= 10_000_000;
        if (budgetFilter === 'over10m') return l.budget > 10_000_000;
        return true;
      });
    }
    if (scoreFilter !== 'all') {
      if (scoreFilter === 'high')   list = list.filter(l => l.score >= 85);
      if (scoreFilter === 'medium') list = list.filter(l => l.score >= 70 && l.score < 85);
      if (scoreFilter === 'low')    list = list.filter(l => l.score < 70);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(l => l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.location.toLowerCase().includes(q) || l.interest.toLowerCase().includes(q));
    }
    list.sort((a, b) => b.score - a.score);
    return list;
  }, [mergedLeads, statusFilter, budgetFilter, scoreFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated  = filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const hasActive  = [statusFilter, budgetFilter, scoreFilter].some(f => f !== 'all') || !!searchQuery;

  const toggleSelect = (id: string) => setSelectedLeads(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => {
    if (selectedLeads.size === paginated.length) setSelectedLeads(new Set());
    else setSelectedLeads(new Set(paginated.map(l => l.id)));
  };

  const handleBulkEmail  = () => { window.open(`mailto:${mergedLeads.filter(l => selectedLeads.has(l.id)).map(l => l.email).join(',')}`); showToast('Email client opened'); };
  const handleBulkExport = () => {
    const rows = mergedLeads.filter(l => selectedLeads.has(l.id));
    const csv  = [['Name','Email','Score','Status','Source'], ...rows.map(l => [l.name,l.email,l.score,l.status,l.source])].map(r => r.join(',')).join('\n');
    const url  = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'leads.csv' }).click();
    URL.revokeObjectURL(url);
    showToast(`${rows.length} leads exported`);
  };
  const handleBulkDelete = () => { showToast(`${selectedLeads.size} leads removed`); setSelectedLeads(new Set()); };
  const handleExportAll  = () => {
    const headers = ['Name','Email','Phone','Location','Interest','Budget','Currency','Score','Status','Source','Owner'];
    const csv = [headers, ...mergedLeads.map(l => [l.name,l.email,l.phone,l.location,l.interest,l.budget,l.budgetCurrency,l.score,l.status,l.source,l.owner])].map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    Object.assign(document.createElement('a'), { href: url, download: 'leads-export.csv' }).click();
    URL.revokeObjectURL(url);
    showToast('All leads exported');
  };
  const handleResetFilters = () => {
    setStatusFilter('all'); setBudgetFilter('all'); setScoreFilter('all');
    setSearchQuery(''); setCurrentPage(1);
    showToast('Filters cleared');
  };

  /* Active filter labels for pills */
  const activeFilters: { label: string; clear: () => void }[] = [];
  if (statusFilter !== 'all') activeFilters.push({ label: statusFilter === 'hot' ? '🔥 Hot' : statusFilter === 'warm' ? '🌤 Warm' : '❄ Cold', clear: () => setStatusFilter('all') });
  if (budgetFilter !== 'all') activeFilters.push({ label: budgetFilter === 'under1m' ? 'Under 1M' : budgetFilter === '1m10m' ? '1M–10M' : 'Over 10M', clear: () => setBudgetFilter('all') });
  if (scoreFilter  !== 'all') activeFilters.push({ label: scoreFilter === 'high' ? 'AI Score 85+' : scoreFilter === 'medium' ? 'AI Score 70–84' : 'AI Score <70', clear: () => setScoreFilter('all') });

  /* Priority groups for AI insights sidebar */
  const highInsights   = AI_INSIGHTS.filter(i => i.priority === 'high');
  const mediumInsights = AI_INSIGHTS.filter(i => i.priority === 'medium');
  const lowInsights    = AI_INSIGHTS.filter(i => i.priority === 'low');

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <PageContainer className="ld-page">

      {/* ── HERO HEADER ── */}
      <motion.div
        initial="hidden" animate="visible" variants={fadeUp}
        transition={{ duration: 0.4 }}
        className="bkr-hero"
      >
        <div className="bkr-hero-inner flex-wrap !items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <Target className="h-4 w-4 text-[#8B6F47]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">Lead Intelligence</h1>
            </div>
            <p className="text-sm text-[var(--fg-muted)] mt-1">
              AI-powered prospect prioritization &amp; deal insights
              {loading && <Loader2 className="inline-block h-3.5 w-3.5 ml-2 animate-spin text-[#A89478]" />}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button className="ld-btn-secondary" onClick={handleExportAll}>
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="ld-btn-primary" onClick={() => showToast('Lead creation form coming soon')}>
              <Plus className="h-4 w-4" /> Add Lead
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── KPI STRIP (4 cards, hover-expand) ── */}
      <motion.div
        initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-start"
      >
        {kpiCards.map((kpi, i) => {
          const Icon    = kpi.icon;
          const isUp    = kpi.change > 0;
          const isHov   = hoveredKPI === i;
          const extras  = KPI_EXTRAS[kpi.label];
          return (
            <motion.div
              key={kpi.label}
              variants={fadeUp}
              transition={{ duration: 0.35, delay: i * 0.07 }}
              className={`ld-kpi-card${isHov ? ' hovered' : ''}`}
              style={{ '--kpi-accent': kpi.color } as React.CSSProperties}
              onMouseEnter={() => setHoveredKPI(i)}
              onMouseLeave={() => setHoveredKPI(null)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="ld-kpi-icon"><Icon className="h-[18px] w-[18px]" /></div>
                <span className={`ld-kpi-trend ${isUp ? 'up' : 'down'}`}>
                  {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {Math.abs(kpi.change)}%
                </span>
              </div>
              <p className="ld-kpi-value">{kpi.value}</p>
              <p className="ld-kpi-label">{kpi.label}</p>

              {/* Hover expansion */}
              <AnimatePresence>
                {isHov && extras && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 mt-3 border-t border-[#EFE9E0]">
                      <KPISparkline data={extras.sparkData} color={kpi.color} />
                      <p className="text-[11px] text-[#7A6B5E] mt-2 leading-relaxed">{extras.insight}</p>
                      <p className="text-[10px] font-bold mt-1.5" style={{ color: kpi.color }}>
                        +{Math.abs(kpi.change)}% vs last month
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ── CONTROL BAR (search + filters + add) ── */}
      <motion.div
        initial="hidden" animate="visible" variants={fadeUp}
        transition={{ delay: 0.15 }}
      >
        <div className="ld-search-filter-bar">
          <Search className="h-4 w-4 text-[#9A8B7E] shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, city, interest…"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="ld-sfbar-input"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="ld-sfbar-clear">
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <div className="ld-sfbar-divider" />

          <div className="ld-sfbar-filters">
            <FilterChip
              label="All Leads" value={statusFilter}
              onChange={v => { setStatusFilter(v as typeof statusFilter); setCurrentPage(1); }}
              icon={Filter}
              options={[
                { value: 'all',  label: 'All Leads' },
                { value: 'hot',  label: '🔥 Hot Leads' },
                { value: 'warm', label: '🌤 Warm Leads' },
                { value: 'cold', label: '❄ Cold Leads' },
              ]}
            />
            <FilterChip
              label="Budget" value={budgetFilter}
              onChange={v => { setBudgetFilter(v); setCurrentPage(1); }}
              icon={DollarSign}
              options={[
                { value: 'all',      label: 'Any Budget' },
                { value: 'under1m',  label: '₹ 0 – 1M' },
                { value: '1m10m',    label: '₹ 1M – 10M' },
                { value: 'over10m',  label: '₹ 10M+' },
              ]}
            />
            <FilterChip
              label="AI Score" value={scoreFilter}
              onChange={v => { setScoreFilter(v); setCurrentPage(1); }}
              icon={Brain}
              options={[
                { value: 'all',    label: 'All Scores' },
                { value: 'high',   label: '🟢 High (85+)' },
                { value: 'medium', label: '🟡 Medium (70–84)' },
                { value: 'low',    label: '⚪ Low (<70)' },
              ]}
            />
          </div>

          {hasActive && (
            <button className="ld-sfbar-reset" onClick={handleResetFilters}>
              <X className="h-3 w-3" /> Clear
            </button>
          )}

          <div className="ld-sfbar-divider hidden sm:block" />

          <button
            className="ld-btn-primary hidden sm:inline-flex"
            style={{ padding: '7px 14px', fontSize: 12 }}
            onClick={() => showToast('Lead creation form coming soon')}
          >
            <Plus className="h-3.5 w-3.5" /> Add Lead
          </button>
        </div>

        {/* Active filter pills */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 mt-2 flex-wrap"
            >
              <span className="text-[11px] text-[#9A8B7E] font-medium">Active:</span>
              {activeFilters.map(f => (
                <button
                  key={f.label}
                  className="ld-active-pill"
                  onClick={f.clear}
                >
                  {f.label}
                  <X className="h-2.5 w-2.5" />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── BULK ACTIONS ── */}
      <AnimatePresence>
        {selectedLeads.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="ld-bulk-bar"
          >
            <span className="text-[13px] font-medium text-[#1F1814]">{selectedLeads.size} selected</span>
            <div className="flex items-center gap-2">
              <button className="ld-bulk-btn" onClick={() => { showToast(`${selectedLeads.size} leads assigned`); setSelectedLeads(new Set()); }}><UserPlus className="h-3.5 w-3.5" /> Assign</button>
              <button className="ld-bulk-btn" onClick={handleBulkEmail}><Send className="h-3.5 w-3.5" /> Email</button>
              <button className="ld-bulk-btn" onClick={handleBulkExport}><Download className="h-3.5 w-3.5" /> Export</button>
              <button className="ld-bulk-btn danger" onClick={handleBulkDelete}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </div>
            <button onClick={() => setSelectedLeads(new Set())} className="ld-bulk-clear">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN GRID: table (70%) + AI sidebar (30%) ── */}
      <div className="ld-leads-grid">

        {/* ─── LEFT: Table + Analytics ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ld-gap)', minWidth: 0 }}>

          {/* TABLE CARD */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp}
            className="ld-card ld-card-flush"
            style={{ overflow: 'hidden' }}
          >
            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-12 gap-2 text-[#9A8B7E]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-[13px]">Loading leads…</span>
              </div>
            )}

            {/* Desktop table */}
            {!loading && (
              <div className="hidden md:block" style={{ overflowX: 'auto' }}>
                <table className="ld-table" style={{ tableLayout: 'fixed', width: '100%', minWidth: 720 }}>
                  <colgroup>
                    <col style={{ width: 40 }} />
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '10%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 16 }}>
                        <input type="checkbox"
                          checked={selectedLeads.size === paginated.length && paginated.length > 0}
                          onChange={toggleAll}
                          className="ld-checkbox"
                        />
                      </th>
                      <th>CLIENT</th>
                      <th>BUDGET</th>
                      <th>AI SCORE</th>
                      <th>STATUS</th>
                      <th>SOURCE</th>
                      <th style={{ paddingRight: 16 }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(lead => {
                      const initials = lead.name.split(' ').map(n => n[0]).join('');
                      const avatarBg = AVATAR_BG[initials] || '#7A6B5E';
                      const isExpanded = expandedRowId === lead.id;
                      return (
                        <Fragment key={lead.id}>
                          <tr
                            className={`ld-row${selectedLeads.has(lead.id) ? ' selected' : ''}${isExpanded ? ' ld-row-expanded-active' : ''}`}
                            onClick={() => setExpandedRowId(isExpanded ? null : lead.id)}
                          >
                            {/* Checkbox */}
                            <td style={{ paddingLeft: 16 }} onClick={e => e.stopPropagation()}>
                              <input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => toggleSelect(lead.id)} className="ld-checkbox" />
                            </td>

                            {/* Client — name + location + interest stacked */}
                            <td>
                              <div className="flex items-center gap-2.5" style={{ overflow: 'hidden' }}>
                                <div className="ld-avatar" style={{ '--avatar-bg': avatarBg, flexShrink: 0 } as React.CSSProperties}>
                                  {initials}
                                </div>
                                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                                  <p className="ld-cell-name">{lead.name}</p>
                                  <p className="ld-cell-email flex items-center gap-1">
                                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" style={{ color: '#C4B19A' }} />
                                    {lead.location}
                                  </p>
                                  <p className="ld-cell-interest">{lead.interest}</p>
                                </div>
                              </div>
                            </td>

                            {/* Budget */}
                            <td>
                              <span className="ld-cell-budget">{fmtBudget(lead.budget, lead.budgetCurrency)}</span>
                            </td>

                            {/* AI Score */}
                            <td><AIScoreBar score={lead.score} /></td>

                            {/* Status */}
                            <td><StatusBadge status={lead.status} /></td>

                            {/* Source */}
                            <td><SourceBadge source={lead.source} /></td>

                            {/* Actions */}
                            <td style={{ paddingRight: 16 }} onClick={e => e.stopPropagation()}>
                              <div className="ld-actions" style={{ opacity: 1 }}>
                                <button className="ld-action-btn" title="Call" onClick={() => { window.open(`tel:${lead.phone}`); showToast(`Calling ${lead.name}…`); }}>
                                  <Phone className="h-3.5 w-3.5" />
                                </button>
                                <button className="ld-action-btn" title="Email" onClick={() => { window.open(`mailto:${lead.email}`); showToast('Email client opened'); }}>
                                  <Mail className="h-3.5 w-3.5" />
                                </button>
                                <div style={{ position: 'relative' }}>
                                  <button className="ld-action-btn" title="More" onClick={() => setActionMenu(actionMenu === lead.id ? null : lead.id)}>
                                    <MoreVertical className="h-3.5 w-3.5" />
                                  </button>
                                  {actionMenu === lead.id && (
                                    <div className="ld-action-menu">
                                      <button onClick={() => { router.push(`/broker/leads/${lead.id}`); setActionMenu(null); }}><Eye className="h-3.5 w-3.5" /> View Details</button>
                                      <button onClick={() => { navigator.clipboard.writeText(lead.email); showToast('Email copied'); setActionMenu(null); }}><Copy className="h-3.5 w-3.5" /> Copy Email</button>
                                      <button onClick={() => { navigator.clipboard.writeText(lead.phone); showToast('Phone copied'); setActionMenu(null); }}><Phone className="h-3.5 w-3.5" /> Copy Phone</button>
                                      <button className="ld-menu-danger" onClick={() => { showToast(`${lead.name} removed`); setActionMenu(null); }}><Trash2 className="h-3.5 w-3.5" /> Delete Lead</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable row — always rendered, content animated */}
                          <tr className="ld-row-expanded-tr">
                            <td colSpan={7} style={{ padding: 0, borderBottom: isExpanded ? '1px solid #EFE9E0' : 'none' }}>
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    key={`expanded-${lead.id}`}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22, ease: 'easeOut' }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <ExpandedRowContent
                                      lead={lead}
                                      onNavigate={path => router.push(path)}
                                      onClose={() => setExpandedRowId(null)}
                                      onToast={showToast}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </td>
                          </tr>
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile card view */}
            {!loading && (
              <div className="md:hidden space-y-3 p-4">
                {paginated.map(lead => {
                  const initials = lead.name.split(' ').map(n => n[0]).join('');
                  const avatarBg = AVATAR_BG[initials] || '#7A6B5E';
                  return (
                    <div key={lead.id} className="ld-lead-card" onClick={() => router.push(`/broker/leads/${lead.id}`)}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="ld-avatar" style={{ '--avatar-bg': avatarBg } as React.CSSProperties}>{initials}</div>
                          <div>
                            <p className="text-[13px] font-semibold text-[#1F1814]">{lead.name}</p>
                            <p className="text-[11px] text-[#9A8B7E] flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{lead.location}</p>
                          </div>
                        </div>
                        <StatusBadge status={lead.status} />
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div><p className="text-[10px] text-[#9A8B7E] uppercase font-semibold tracking-wide">Interest</p><p className="text-[12px] text-[#7A6B5E] font-medium mt-0.5">{lead.interest}</p></div>
                        <div><p className="text-[10px] text-[#9A8B7E] uppercase font-semibold tracking-wide">Budget</p><p className="text-[12px] text-[#1F1814] font-semibold mt-0.5">{fmtBudget(lead.budget, lead.budgetCurrency)}</p></div>
                        <div><p className="text-[10px] text-[#9A8B7E] uppercase font-semibold tracking-wide">Score</p><div className="mt-0.5"><AIScoreBar score={lead.score} /></div></div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-[#EFE9E0]">
                        <SourceBadge source={lead.source} />
                        <button className="ld-action-btn" onClick={e => { e.stopPropagation(); window.open(`tel:${lead.phone}`); }}><Phone className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-16">
                <Search className="h-10 w-10 text-[#D6CCBE] mx-auto mb-4" />
                <p className="text-[15px] font-medium text-[#1F1814]">No leads match your filters</p>
                <p className="text-[13px] text-[#9A8B7E] mt-1">Try adjusting your search or filter criteria</p>
                <button className="ld-btn-secondary mt-4" onClick={handleResetFilters}>Reset Filters</button>
              </div>
            )}

            {/* Pagination */}
            {!loading && filtered.length > 0 && (
              <div className="ld-pagination">
                <span className="ld-pagination-info">
                  Showing {((currentPage - 1) * rowsPerPage) + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length} leads
                </span>
                <div className="flex items-center gap-1">
                  <button className="ld-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></button>
                  {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => (
                    <button key={i} onClick={() => setCurrentPage(i + 1)} className={`ld-page-btn ${currentPage === i + 1 ? 'active' : ''}`}>{i + 1}</button>
                  ))}
                  {totalPages > 4 && <span className="ld-page-ellipsis">…</span>}
                  {totalPages > 3 && (
                    <button onClick={() => setCurrentPage(totalPages)} className={`ld-page-btn ${currentPage === totalPages ? 'active' : ''}`}>{totalPages}</button>
                  )}
                  <button className="ld-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>
            )}
          </motion.div>

          {/* ── ANALYTICS: Lead Sources + Conversion Funnel ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Lead Sources — donut */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              className="ld-card"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EDE7DF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity className="h-4 w-4 text-[#6F5C46]" />
                  </div>
                  <h2 className="ld-section-title">Lead Sources</h2>
                </div>
                <PeriodDropdown value={sourcesPeriod} onChange={setSourcesPeriod} />
              </div>
              <div className="flex items-center gap-5">
                <div className="ld-donut-wrap">
                  <ResponsiveContainer width="100%" height="100%" minWidth={120} minHeight={120}>
                    <PieChart>
                      <Pie
                        data={sourceData} cx="50%" cy="50%"
                        innerRadius={44} outerRadius={68}
                        paddingAngle={3} dataKey="value" strokeWidth={0}
                      >
                        {sourceData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#FFF', border: '1px solid #EFE9E0', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                        formatter={(v) => [`${v ?? 0}%`, 'Share']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {sourceData.map(s => (
                    <div key={s.name} className="ld-legend-row">
                      <span className="ld-legend-dot" style={{ background: s.color }} />
                      <span className="ld-legend-label">{s.name}</span>
                      <span className="ld-legend-value">{s.rawCount} leads</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Conversion Funnel — horizontal brown bars */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp} transition={{ delay: 0.08 }}
              className="ld-card"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EDE7DF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 className="h-4 w-4 text-[#8B6F47]" />
                  </div>
                  <h2 className="ld-section-title">Conversion Funnel</h2>
                </div>
                <PeriodDropdown value={funnelPeriod} onChange={setFunnelPeriod} />
              </div>

              {/* Horizontal bars */}
              <div className="space-y-3">
                {funnelData.map((stage, i) => {
                  const pct = funnelData[0].value > 0
                    ? Math.round((stage.value / funnelData[0].value) * 100)
                    : 0;
                  return (
                    <div key={stage.stage} className="ld-funnel-h-row">
                      <div className="ld-funnel-h-label">
                        <span className="text-[12px] font-medium text-[#7A6B5E]">{stage.stage}</span>
                        {stage.pct && <span className="text-[10px] text-[#9A8B7E]">{stage.pct}</span>}
                      </div>
                      <div className="ld-funnel-h-bar-track">
                        <motion.div
                          key={`${stage.stage}-${funnelPeriod}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.7, delay: i * 0.1, ease: 'easeOut' }}
                          className="ld-funnel-h-bar"
                          style={{ background: FUNNEL_BROWN_PALETTE[i] }}
                        />
                      </div>
                      <span className="ld-funnel-h-value">{stage.value}</span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-[#EFE9E0] flex items-center justify-between">
                <span className="text-[13px] text-[#9A8B7E] font-medium">Overall Conversion</span>
                <span className="text-[16px] font-bold text-[#8B6F47]">
                  {funnelData[0].value > 0
                    ? `${Math.round((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100)}%`
                    : '—'}
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── RIGHT SIDEBAR: AI Insights + Recent Activity ─── */}
        <div className="ld-sidebar-col">

          {/* AI Insights — Priority grouped */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} transition={{ delay: 0.1 }}
            className="ld-card ld-sidebar-card"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="ld-sidebar-icon blue"><Brain className="h-4 w-4" /></div>
              <h2 className="ld-sidebar-title">AI Insights</h2>
              <span className="ld-live-dot" />
              <button
                className={`ld-sidebar-refresh ${insightsRefreshing ? 'spinning' : ''}`}
                onClick={refreshLeads}
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-4">
              {/* HIGH PRIORITY */}
              {highInsights.length > 0 && (
                <div>
                  <p className="ld-insight-priority-label high">High Priority</p>
                  <div className="space-y-2.5">
                    {highInsights.map((ins, i) => {
                      const Icon = ins.icon;
                      return (
                        <div
                          key={i}
                          className="ld-insight-card high"
                          onClick={() => router.push(`/broker/leads/${ins.leadId}`)}
                        >
                          <div className="ld-insight-card-header">
                            <div className="ld-insight-card-icon high">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[12px] font-semibold text-[#1F1814]">{ins.name}</span>
                            <ArrowUpRight className="h-3 w-3 text-[#9A8B7E] ml-auto" />
                          </div>
                          <p className="text-[11px] text-[#7A6B5E] leading-relaxed mt-1">{ins.text}</p>
                          <button
                            className="ld-insight-cta"
                            onClick={e => { e.stopPropagation(); showToast(`${ins.cta} — ${ins.name}`); }}
                          >
                            {ins.cta} <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MEDIUM PRIORITY */}
              {(insightsExpanded || mediumInsights.length > 0) && mediumInsights.length > 0 && (
                <div>
                  <p className="ld-insight-priority-label medium">Medium</p>
                  <div className="space-y-2">
                    {mediumInsights.map((ins, i) => {
                      const Icon = ins.icon;
                      return (
                        <div
                          key={i}
                          className="ld-insight-row clickable"
                          onClick={() => router.push(`/broker/leads/${ins.leadId}`)}
                        >
                          <div className="ld-insight-icon" style={{ background: '#FFFBEB', color: '#B45309' }}><Icon className="h-3.5 w-3.5" /></div>
                          <p className="ld-insight-text">{ins.text}</p>
                          <button
                            className="ld-insight-cta-sm"
                            onClick={e => { e.stopPropagation(); showToast(`${ins.cta} — ${ins.name}`); }}
                          >
                            {ins.cta}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LOW PRIORITY */}
              {insightsExpanded && lowInsights.length > 0 && (
                <div>
                  <p className="ld-insight-priority-label low">Insight</p>
                  <div className="space-y-2">
                    {lowInsights.map((ins, i) => {
                      const Icon = ins.icon;
                      return (
                        <div
                          key={i}
                          className="ld-insight-row clickable"
                          onClick={() => router.push(`/broker/leads/${ins.leadId}`)}
                        >
                          <div className="ld-insight-icon" style={{ background: '#EDE7DF', color: '#6F5C46' }}><Icon className="h-3.5 w-3.5" /></div>
                          <p className="ld-insight-text">{ins.text}</p>
                          <ArrowUpRight className="h-3 w-3 text-[#9A8B7E] shrink-0 ld-row-arrow" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <button className="ld-sidebar-link" onClick={() => setInsightsExpanded(!insightsExpanded)}>
              {insightsExpanded ? 'Show less' : `View all insights (${AI_INSIGHTS.length})`}
              <ChevronDown
                className="h-3.5 w-3.5"
                style={{ transform: insightsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>
          </motion.div>

          {/* Recent Activity — vertical timeline */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} transition={{ delay: 0.15 }}
            className="ld-card ld-sidebar-card"
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="ld-sidebar-icon indigo"><Activity className="h-4 w-4" /></div>
              <h2 className="ld-sidebar-title">Recent Activity</h2>
              <button
                className={`ld-sidebar-refresh ${activityExpanded ? 'spinning' : ''}`}
                onClick={() => { setActivityExpanded(false); setTimeout(() => setActivityExpanded(false), 800); }}
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            {/* Timeline */}
            <div className="ld-activity-timeline-v">
              {(activityExpanded ? RECENT_ACTIVITY_BASE : RECENT_ACTIVITY_BASE.slice(0, 3)).map((a, i) => {
                const AIcon = a.icon;
                return (
                  <motion.div
                    key={i}
                    className="ld-activity-timeline-item group"
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.25, delay: i * 0.06 }}
                    onClick={() => router.push(`/broker/leads/${a.leadId}`)}
                  >
                    <div className="ld-activity-timeline-icon group-hover:border-[#8B6F47] group-hover:text-[#8B6F47] transition-colors">
                      <AIcon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-[#7A6B5E] leading-relaxed">
                        <span className="font-semibold text-[#1F1814]">{a.user}</span>{' '}{a.action}
                      </p>
                      <span className="text-[10px] text-[#9A8B7E]">{a.time}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <button className="ld-sidebar-link" onClick={() => setActivityExpanded(!activityExpanded)}>
              {activityExpanded ? 'Show less' : `View all activity (${RECENT_ACTIVITY_BASE.length})`}
              <ChevronDown
                className="h-3.5 w-3.5"
                style={{ transform: activityExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              />
            </button>
          </motion.div>
        </div>
      </div>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {actionMenu && <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />}

    </PageContainer>
  );
}
