// @ts-nocheck
'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, ChevronRight, Plus, Download, Search, X, MoreHorizontal,
  Phone, Mail, MessageSquare, MapPin, TrendingUp, TrendingDown,
  List, LayoutGrid, Clock, DollarSign, Target, CheckCircle,
  Building2, ChevronDown, ArrowUpRight, Filter, Star, Flame,
  Calendar, Users, Activity, BarChart3, Award, AlertTriangle,
  Eye, Check, RefreshCw, Bell, Zap, Brain, ChevronUp, ArrowRight,
  Sparkles, Layers, CircleDot,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { PageContainer } from '@/components/layout/page-container';

/* ═══════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════ */
type Stage    = 'Lead' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closing' | 'Won';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type ViewMode = 'board' | 'list';

interface Deal {
  id: string; property: string; client: string; clientInitials: string;
  value: number; currency: string; stage: Stage; probability: number;
  owner: string; ownerInitials: string; closeDate: string;
  priority: Priority; location: string; lastActivity: string;
  messages: number; isHot?: boolean; notes?: string;
  daysInStage: number; lastContactDays: number; dealAge: number;
  nextAction?: string; nextActionTime?: string; source?: string;
}

/* ═══════════════════════════════════════════════════
   STAGE + PRIORITY CONFIG
   ═══════════════════════════════════════════════════ */
const STAGES: Stage[] = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closing', 'Won'];

const STAGE_CFG: Record<Stage, { color: string; bg: string; accent: string; border: string }> = {
  Lead:        { color: '#9A8B7E', bg: '#F9F7F4', accent: '#C4B19A', border: '#E8E1D9' },
  Qualified:   { color: '#8B7355', bg: '#F3EFEA', accent: '#A89478', border: '#D6CCBE' },
  Proposal:    { color: '#7A6B5E', bg: '#EEEBE6', accent: '#9A8B7E', border: '#D6CCBE' },
  Negotiation: { color: '#6F5C46', bg: '#EDE7DF', accent: '#8B7355', border: '#D6CCBE' },
  Closing:     { color: '#5A4A38', bg: '#E8E1D9', accent: '#6F5C46', border: '#C4B19A' },
  Won:         { color: '#4A3D2E', bg: '#E3DCD3', accent: '#5A4A38', border: '#C4B19A' },
};

const PRIORITY_CFG: Record<Priority, { label: string; color: string; bg: string }> = {
  low:    { label: 'Low',    color: '#9A8B7E', bg: '#F3EFEA' },
  medium: { label: 'Med',    color: '#A89478', bg: '#EDE7DF' },
  high:   { label: 'High',  color: '#F59E0B', bg: '#FFFBEB' },
  urgent: { label: 'Urgent', color: '#EF4444', bg: '#FEF2F2' },
};

const STAGE_META: Record<Stage, { avgDays: number; convRate: number }> = {
  Lead:        { avgDays: 12, convRate: 52 },
  Qualified:   { avgDays: 8,  convRate: 44 },
  Proposal:    { avgDays: 10, convRate: 38 },
  Negotiation: { avgDays: 14, convRate: 61 },
  Closing:     { avgDays: 7,  convRate: 83 },
  Won:         { avgDays: 0,  convRate: 100 },
};

type SmartFilter = 'none' | 'atRisk' | 'closingSoon' | 'stale' | 'overdue';

/* ═══════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════ */
const INITIAL_DEALS: Deal[] = [
  { id: 'd-001', property: 'Palm Jumeirah Penthouse', client: 'Al-Rashid Family', clientInitials: 'AR', value: 12400000, currency: 'AED', stage: 'Negotiation', probability: 72, owner: 'Sara M', ownerInitials: 'SM', closeDate: '2026-05-15', priority: 'urgent', location: 'Palm Jumeirah', lastActivity: '2h ago', messages: 4, isHot: true, notes: 'Counter offer pending review', daysInStage: 3, lastContactDays: 0, dealAge: 22, nextAction: 'Review counter offer', nextActionTime: 'Today 2PM', source: 'Referral' },
  { id: 'd-002', property: 'Downtown Loft Suite', client: 'Chen Capital', clientInitials: 'CC', value: 8750000, currency: 'AED', stage: 'Proposal', probability: 55, owner: 'Ahmed K', ownerInitials: 'AK', closeDate: '2026-05-28', priority: 'high', location: 'Downtown Dubai', lastActivity: '1d ago', messages: 2, notes: 'Full proposal deck sent', daysInStage: 5, lastContactDays: 1, dealAge: 18, nextAction: 'Follow up on proposal', nextActionTime: 'Today 4PM', source: 'Website' },
  { id: 'd-003', property: 'Marina Bay Tower', client: 'Kumar Holdings', clientInitials: 'KH', value: 6200000, currency: 'AED', stage: 'Qualified', probability: 38, owner: 'Sara M', ownerInitials: 'SM', closeDate: '2026-06-10', priority: 'medium', location: 'Dubai Marina', lastActivity: '3d ago', messages: 1, daysInStage: 16, lastContactDays: 3, dealAge: 34, nextAction: 'Schedule site visit', source: 'Cold Outreach' },
  { id: 'd-004', property: 'Canary Wharf Residences', client: 'Morgan Estate', clientInitials: 'ME', value: 5100000, currency: 'AED', stage: 'Closing', probability: 88, owner: 'Liam O', ownerInitials: 'LO', closeDate: '2026-04-30', priority: 'urgent', location: 'Business Bay', lastActivity: '4h ago', messages: 7, isHot: true, daysInStage: 4, lastContactDays: 0, dealAge: 45, nextAction: 'Collect closing docs', nextActionTime: 'Tomorrow 12PM', source: 'Existing Client' },
  { id: 'd-005', property: 'JBR Beachfront Villa', client: 'Tanaka Group', clientInitials: 'TG', value: 18900000, currency: 'AED', stage: 'Lead', probability: 20, owner: 'Ahmed K', ownerInitials: 'AK', closeDate: '2026-07-01', priority: 'medium', location: 'JBR, Dubai', lastActivity: '1w ago', messages: 0, daysInStage: 18, lastContactDays: 7, dealAge: 18, source: 'Event' },
  { id: 'd-006', property: 'Emaar Beachfront Plot', client: 'Silva Investments', clientInitials: 'SI', value: 22000000, currency: 'AED', stage: 'Won', probability: 100, owner: 'Liam O', ownerInitials: 'LO', closeDate: '2026-04-12', priority: 'high', location: 'Emaar, Dubai', lastActivity: '2d ago', messages: 3, daysInStage: 1, lastContactDays: 2, dealAge: 62, source: 'Referral' },
  { id: 'd-007', property: 'Bluewaters Island Apt', client: 'Okafor Family', clientInitials: 'OF', value: 4300000, currency: 'AED', stage: 'Proposal', probability: 45, owner: 'Sara M', ownerInitials: 'SM', closeDate: '2026-06-05', priority: 'low', location: 'Bluewaters', lastActivity: '2d ago', messages: 1, daysInStage: 8, lastContactDays: 2, dealAge: 24, nextAction: 'Send updated pricing', source: 'Partner' },
  { id: 'd-008', property: 'Business Bay Commercial', client: 'NovaTech RE', clientInitials: 'NT', value: 9800000, currency: 'AED', stage: 'Negotiation', probability: 65, owner: 'Ahmed K', ownerInitials: 'AK', closeDate: '2026-05-20', priority: 'high', location: 'Business Bay', lastActivity: '6h ago', messages: 5, daysInStage: 11, lastContactDays: 0, dealAge: 30, nextAction: 'Negotiate terms', nextActionTime: 'Wed 11AM', source: 'Website' },
  { id: 'd-009', property: 'DIFC Premium Office', client: 'Atlas Partners', clientInitials: 'AP', value: 15600000, currency: 'AED', stage: 'Closing', probability: 91, owner: 'Sara M', ownerInitials: 'SM', closeDate: '2026-04-28', priority: 'urgent', location: 'DIFC, Dubai', lastActivity: '1h ago', messages: 9, isHot: true, daysInStage: 2, lastContactDays: 0, dealAge: 52, nextAction: 'Schedule final walkthrough', nextActionTime: 'Tomorrow 10AM', source: 'Referral' },
  { id: 'd-010', property: 'Meydan Golf Estate', client: 'Laurent Family', clientInitials: 'LF', value: 7200000, currency: 'AED', stage: 'Qualified', probability: 42, owner: 'Liam O', ownerInitials: 'LO', closeDate: '2026-06-20', priority: 'medium', location: 'Meydan, Dubai', lastActivity: '4d ago', messages: 0, daysInStage: 12, lastContactDays: 4, dealAge: 28, nextAction: 'Send property report', source: 'Website' },
];

const FORECAST_DATA = [
  { m: 'Nov', v: 14.2 }, { m: 'Dec', v: 18.5 }, { m: 'Jan', v: 16.8 },
  { m: 'Feb', v: 22.1 }, { m: 'Mar', v: 24.7 }, { m: 'Apr', v: 28.3, forecast: 28.3 },
  { m: 'May', forecast: 32.1 }, { m: 'Jun', forecast: 35.6 },
];

const HERO_TREND = [
  { m: 'N', v: 62 }, { m: 'D', v: 75 }, { m: 'J', v: 68 },
  { m: 'F', v: 88 }, { m: 'M', v: 95 }, { m: 'A', v: 107 },
];

const BROKERS = [
  { name: 'Sara M',   initials: 'SM', deals: 4, value: 35300000, rate: 68, color: '#8B7355' },
  { name: 'Ahmed K',  initials: 'AK', deals: 3, value: 34450000, rate: 61, color: '#6F5C46' },
  { name: 'Liam O',   initials: 'LO', deals: 3, value: 34500000, rate: 74, color: '#A89478' },
];

const TASKS_INITIAL = [
  { id: 't1', text: 'Call Al-Rashid Family re: counter offer', dealId: 'd-001', priority: 'urgent', time: 'Today 2PM', done: false },
  { id: 't2', text: 'Send updated proposal to Chen Capital', dealId: 'd-002', priority: 'high',   time: 'Today 4PM', done: false },
  { id: 't3', text: 'Site visit — DIFC Premium Office',       dealId: 'd-009', priority: 'high',   time: 'Tomorrow 10AM', done: false },
  { id: 't4', text: 'Follow-up: Morgan Estate closing docs',  dealId: 'd-004', priority: 'urgent', time: 'Tomorrow 12PM', done: false },
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
  const d = new Date(s);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function useCountUp(target: number, duration = 1.4) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

const FADE_UP = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

function getDealFlags(deal: Deal) {
  const isStale     = deal.stage !== 'Won' && deal.daysInStage > 14;
  const isSlowing   = deal.stage !== 'Won' && deal.daysInStage > 7 && deal.daysInStage <= 14;
  const isOverdue   = deal.stage !== 'Won' && new Date(deal.closeDate) < new Date();
  const noContact   = deal.stage !== 'Won' && deal.lastContactDays >= 5;
  const closingSoon = deal.stage !== 'Won' && !isOverdue &&
    Math.ceil((new Date(deal.closeDate).getTime() - Date.now()) / 86400000) <= 7;
  return { isStale, isSlowing, isOverdue, noContact, closingSoon };
}

function activityColor(days: number) {
  if (days >= 5) return '#EF4444';
  if (days >= 3) return '#F59E0B';
  return '#9A8B7E';
}

/* ═══════════════════════════════════════════════════
   GAUGE CHART — SVG half-circle
   ═══════════════════════════════════════════════════ */
function GaugeChart({ score }: { score: number }) {
  const r = 54, sw = 10, cx = 70, cy = 64;
  const arc = Math.PI * r;
  const offset = arc - (score / 100) * arc;
  const color = score >= 70 ? '#16A34A' : score >= 45 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={140} height={80} viewBox="0 0 140 80" className="dp-gauge-svg">
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke="#EDE7DF" strokeWidth={sw} strokeLinecap="round" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={arc} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)' }} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight={700} fill={color}>{score}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#9A8B7E">Health Score</text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   PERIOD DROPDOWN
   ═══════════════════════════════════════════════════ */
const PERIODS = ['This Week', 'This Month', 'This Quarter'];

function PeriodDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="ld-period-btn" onClick={() => setOpen(o => !o)}>
        {value}
        <ChevronDown className="h-3 w-3" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: .97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: .97 }}
            transition={{ duration: .13 }}
            className="ld-period-menu"
          >
            {PERIODS.map(p => (
              <button key={p} className={`ld-fchip-option${value === p ? ' active' : ''}`}
                onClick={() => { onChange(p); setOpen(false); }}>
                <span className="ld-fchip-check">{value === p && <Check className="h-3 w-3" />}</span>
                {p}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   DEAL CARD
   ═══════════════════════════════════════════════════ */
function DealCard({
  deal, isDragging, onDragStart, onDragEnd, showMenu, onMenuToggle, onMenuAction,
}: {
  deal: Deal;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  showMenu: boolean;
  onMenuToggle: (id: string | null) => void;
  onMenuAction: (action: string, deal: Deal) => void;
}) {
  const router = useRouter();
  const pc   = PRIORITY_CFG[deal.priority];
  const prob = deal.probability;
  const probColor = prob >= 75 ? '#16A34A' : prob >= 50 ? '#F59E0B' : '#EF4444';
  const flags = getDealFlags(deal);

  return (
    <motion.div
      layout draggable
      onDragStart={e => onDragStart(e, deal.id)}
      onDragEnd={onDragEnd}
      animate={{ opacity: isDragging ? 0.45 : 1, scale: isDragging ? 0.97 : 1 }}
      transition={{ duration: 0.18 }}
      className="dp-card"
      onClick={() => router.push(`/broker/deals/${deal.id}`)}
    >
      {/* Header: value + menu */}
      <div className="dp-card-head">
        <span className="dp-card-value">{fmtVal(deal.value, deal.currency)}</span>
        <div className="dp-card-head-r" onClick={e => e.stopPropagation()}>
          {deal.isHot && <Flame className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />}
          <div style={{ position: 'relative' }}>
            <button className="dp-menu-btn" onClick={() => onMenuToggle(showMenu ? null : deal.id)}>
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: .97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: .97 }}
                  transition={{ duration: .12 }}
                  className="dp-card-menu"
                >
                  <button onClick={() => { router.push(`/broker/deals/${deal.id}`); onMenuToggle(null); }}><Eye className="h-3.5 w-3.5" /> View Details</button>
                  <button onClick={() => onMenuAction('call', deal)}><Phone className="h-3.5 w-3.5" /> Call</button>
                  <button onClick={() => onMenuAction('email', deal)}><Mail className="h-3.5 w-3.5" /> Email</button>
                  <button onClick={() => onMenuAction('advance', deal)}><ArrowRight className="h-3.5 w-3.5" /> Advance Stage</button>
                  <div className="dp-menu-sep" />
                  <button onClick={() => onMenuAction('note', deal)}><MessageSquare className="h-3.5 w-3.5" /> Add Note</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Property + client */}
      <p className="dp-card-title">{deal.property}</p>
      <p className="dp-card-client">{deal.client}</p>

      {/* Progress bar + probability */}
      <div className="dp-card-progress">
        <div className="dp-card-bar">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${prob}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="dp-card-bar-fill"
            style={{ background: probColor }}
          />
        </div>
        <span className="dp-card-pct" style={{ color: probColor }}>{prob}%</span>
      </div>

      {/* Next action (conditional) */}
      {deal.nextAction && (
        <div className="dp-card-action">
          <Zap className="h-3 w-3" style={{ color: '#8B6B47', flexShrink: 0 }} />
          <span className="dp-card-action-text">{deal.nextAction}</span>
          {deal.nextActionTime && <span className="dp-card-action-time">{deal.nextActionTime}</span>}
        </div>
      )}

      {/* Footer */}
      <div className="dp-card-foot">
        <span className="dp-card-meta" style={{ color: activityColor(deal.lastContactDays) }}>
          <Clock className="h-3 w-3" /> {deal.lastActivity}
        </span>
        {deal.messages > 0 && (
          <span className="dp-card-meta dp-card-meta--blue">
            <MessageSquare className="h-3 w-3" /> {deal.messages}
          </span>
        )}
        <span className={`dp-card-meta${flags.isOverdue ? ' dp-card-meta--red' : ''}`}>
          {fmtDate(deal.closeDate)}
          {flags.isOverdue && <span className="dp-overdue-dot" />}
        </span>
        <div className="dp-card-owner" style={{ background: '#A89478' }}>{deal.ownerInitials}</div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════════════ */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      className="ld-toast">
      <Check className="h-4 w-4 text-[#10B981]" />
      <span>{message}</span>
      <button onClick={onClose} className="ld-toast-close"><X className="h-3.5 w-3.5" /></button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function DealsPage() {
  const router = useRouter();

  /* ── Data ── */
  const [deals,     setDeals]     = useState<Deal[]>(INITIAL_DEALS);
  const [tasks,     setTasks]     = useState(TASKS_INITIAL);

  /* ── UI state ── */
  const [view,          setView]          = useState<ViewMode>('board');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [stageFilter,   setStageFilter]   = useState<Stage | 'All'>('All');
  const [sortBy,        setSortBy]        = useState('value');
  const [menuOpen,      setMenuOpen]      = useState<string | null>(null);
  const [toast,         setToast]         = useState<string | null>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('This Month');
  const [insightsOpen,  setInsightsOpen]  = useState(false);
  const [sortOpen,      setSortOpen]      = useState(false);
  const [smartFilter,   setSmartFilter]   = useState<SmartFilter>('none');
  const [expandedCols,  setExpandedCols]  = useState<Record<Stage, boolean>>({} as Record<Stage, boolean>);
  const sortRef = useRef<HTMLDivElement>(null);

  const toggleColExpand = (stage: Stage) => {
    setExpandedCols(prev => ({ ...prev, [stage]: !prev[stage] }));
  };

  /* ── Drag state ── */
  const [dragId,    setDragId]    = useState<string | null>(null);
  const [dropStage, setDropStage] = useState<Stage | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  /* ── Sort dropdown click-outside ── */
  useEffect(() => {
    const h = (e: MouseEvent) => { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false); };
    if (sortOpen) document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [sortOpen]);

  /* ── Computed KPIs from live deals ── */
  const totalPipeline   = useMemo(() => deals.filter(d => d.stage !== 'Won').reduce((s, d) => s + d.value, 0), [deals]);
  const activeCount     = useMemo(() => deals.filter(d => d.stage !== 'Won').length, [deals]);
  const wonValue        = useMemo(() => deals.filter(d => d.stage === 'Won').reduce((s, d) => s + d.value, 0), [deals]);
  const closingThisMonth = useMemo(() =>
    deals.filter(d => ['Closing', 'Negotiation'].includes(d.stage) && d.probability >= 70)
         .reduce((s, d) => s + d.value, 0), [deals]);
  const winRate = useMemo(() => {
    const won = deals.filter(d => d.stage === 'Won').length;
    return deals.length > 0 ? Math.round((won / deals.length) * 100) : 0;
  }, [deals]);

  /* ── Pipeline health score (0-100) ── */
  const healthScore = useMemo(() => {
    const hot  = deals.filter(d => ['Closing', 'Won'].includes(d.stage)).length;
    const warm = deals.filter(d => ['Negotiation', 'Proposal'].includes(d.stage)).length;
    const cold = deals.filter(d => ['Lead', 'Qualified'].includes(d.stage)).length;
    const total = deals.length || 1;
    return Math.round(((hot * 1 + warm * 0.6 + cold * 0.2) / total) * 100);
  }, [deals]);

  /* ── Smart filter counts (from raw deals, ignoring current filters) ── */
  const atRiskCount     = useMemo(() => deals.filter(d => { const f = getDealFlags(d); return f.isStale || f.noContact; }).length, [deals]);
  const closingSoonCount = useMemo(() => deals.filter(d => getDealFlags(d).closingSoon).length, [deals]);
  const staleCount      = useMemo(() => deals.filter(d => getDealFlags(d).isStale).length, [deals]);
  const overdueCount    = useMemo(() => deals.filter(d => getDealFlags(d).isOverdue).length, [deals]);
  const avgDealAge      = useMemo(() => {
    const active = deals.filter(d => d.stage !== 'Won');
    return active.length ? Math.round(active.reduce((s, d) => s + d.dealAge, 0) / active.length) : 0;
  }, [deals]);

  /* ── Filtered + sorted deals ── */
  const displayDeals = useMemo(() => {
    let list = [...deals];
    if (stageFilter !== 'All') list = list.filter(d => d.stage === stageFilter);
    if (smartFilter === 'atRisk')       list = list.filter(d => { const f = getDealFlags(d); return f.isStale || f.noContact; });
    if (smartFilter === 'closingSoon')  list = list.filter(d => getDealFlags(d).closingSoon);
    if (smartFilter === 'stale')        list = list.filter(d => getDealFlags(d).isStale);
    if (smartFilter === 'overdue')      list = list.filter(d => getDealFlags(d).isOverdue);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.property.toLowerCase().includes(q) ||
        d.client.toLowerCase().includes(q) ||
        d.location.toLowerCase().includes(q)
      );
    }
    const sortFns = {
      value:       (a: Deal, b: Deal) => b.value - a.value,
      probability: (a: Deal, b: Deal) => b.probability - a.probability,
      closeDate:   (a: Deal, b: Deal) => new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime(),
      activity:    (a: Deal, b: Deal) => a.lastActivity.localeCompare(b.lastActivity),
    };
    list.sort(sortFns[sortBy] || sortFns.value);
    return list;
  }, [deals, stageFilter, searchQuery, sortBy, smartFilter]);

  const dealsByStage = useMemo(() =>
    STAGES.reduce((acc, stage) => ({
      ...acc,
      [stage]: displayDeals.filter(d => d.stage === stage),
    }), {} as Record<Stage, Deal[]>),
  [displayDeals]);

  /* ── Analytics period scaling ── */
  const PERIOD_SCALE = { 'This Week': 0.25, 'This Month': 1, 'This Quarter': 3.1 };
  const scale = PERIOD_SCALE[analyticsPeriod] ?? 1;
  const conversionData = useMemo(() => [
    { stage: 'Lead→Qual', rate: 52 },
    { stage: 'Qual→Prop', rate: 44 },
    { stage: 'Prop→Neg',  rate: 38 },
    { stage: 'Neg→Close', rate: 61 },
    { stage: 'Close→Won', rate: 83 },
  ], []);
  const forecastData = useMemo(() =>
    FORECAST_DATA.map(d => ({
      ...d,
      v: d.v ? +(d.v * scale).toFixed(1) : undefined,
      forecast: d.forecast ? +(d.forecast * scale).toFixed(1) : undefined,
    })),
  [scale]);

  /* ── Drag handlers ── */
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => { setDragId(null); setDropStage(null); };
  const handleDragOver = (e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropStage(stage);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropStage(null);
  };
  const handleDrop = (e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    if (dragId) {
      const deal = deals.find(d => d.id === dragId);
      if (deal && deal.stage !== stage) {
        setDeals(prev => prev.map(d => d.id === dragId ? { ...d, stage } : d));
        showToast(`"${deal.property}" moved to ${stage}`);
      }
    }
    setDragId(null);
    setDropStage(null);
  };

  /* ── Menu action handler ── */
  const handleMenuAction = (action: string, deal: Deal) => {
    if (action === 'call')  { showToast(`Calling ${deal.client}…`); }
    if (action === 'email') { showToast('Opening email for ' + deal.client); }
    if (action === 'note')  { showToast('Note added'); }
    if (action === 'advance') {
      const idx = STAGES.indexOf(deal.stage);
      if (idx < STAGES.length - 1) {
        const next = STAGES[idx + 1];
        setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: next } : d));
        showToast(`"${deal.property}" → ${next}`);
      }
    }
    setMenuOpen(null);
  };

  /* ── Task complete ── */
  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  /* ── Count-up targets ── */
  const pipelineM = +(totalPipeline / 1_000_000).toFixed(1);
  const closingM  = +(closingThisMonth / 1_000_000).toFixed(1);

  /* ═════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════ */
  return (
    <PageContainer className="dp-page">

      {/* ══════════════════════════════════════════════
          HERO BANNER
          ══════════════════════════════════════════════ */}
      <motion.div initial="hidden" animate="visible" variants={FADE_UP} transition={{ duration: .45 }}
        className="bkr-hero">
        <div className="bkr-hero-inner flex-wrap !items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <Layers className="h-4 w-4 text-[#8B6F47]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">Deals</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)] bg-[var(--bg-secondary)] border border-[var(--border)] px-2 py-0.5 rounded-full">
                Live Pipeline
              </span>
            </div>
            <p className="text-sm text-[var(--fg-muted)] mt-1">Monitor, move, and close deals in one place</p>
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[13px] text-[var(--fg-secondary)]">
              <Sparkles className="h-3.5 w-3.5 text-[#8B6F47]" />
              <span>
                On track to close <strong className="text-[var(--fg)] font-semibold">AED {closingM.toFixed(1)}M</strong> this month
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="h-9 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--fg-secondary)] text-sm font-medium flex items-center gap-1.5 shadow-sm cursor-pointer hover:border-[var(--fg-muted)] transition-colors" onClick={() => showToast('Exporting PDF…')}>
              <Download className="h-4 w-4" /> Export
            </button>
            <button className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#6F5443] to-[#8B6F47] text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer hover:opacity-90 transition-opacity" onClick={() => router.push('/broker/deals/new')}>
              <Plus className="h-4 w-4" /> New Deal
            </button>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════
          KPI CARDS
          ══════════════════════════════════════════════ */}
      <motion.div initial="hidden" animate="visible" variants={STAGGER}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pipeline',      rawVal: pipelineM,   display: `AED ${pipelineM.toFixed(0)}M`,    change: +8.4, icon: DollarSign, color: '#8B6B47' },
          { label: 'Active Deals',        rawVal: activeCount,  display: String(activeCount),               change: +12,  icon: Target,     color: '#3B82F6' },
          { label: 'Win Rate',            rawVal: winRate,      display: `${winRate}%`,                     change: +5.2, icon: Award,      color: '#16A34A' },
          { label: 'Closing This Month',  rawVal: closingM,     display: `AED ${closingM.toFixed(1)}M`,     change: +22,  icon: Flame,      color: '#F97316' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={FADE_UP} transition={{ duration: .35, delay: i * .07 }}
              className="ld-kpi-card">
              <div className="mb-3">
                <div className="ld-kpi-icon" style={{ '--kpi-accent': kpi.color }}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </div>
              <p className="ld-kpi-value">{kpi.display}</p>
              <p className="ld-kpi-label">{kpi.label}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`ld-kpi-trend ${kpi.change > 0 ? 'up' : 'down'}`}>
                  {kpi.change > 0 ? '↑' : '↓'} {Math.abs(kpi.change)}%
                </span>
                <span className="text-[11px] text-[#9A8B7E]">vs last month</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ══════════════════════════════════════════════
          STAGE TAB BAR
          ══════════════════════════════════════════════ */}
      <motion.div initial="hidden" animate="visible" variants={FADE_UP} transition={{ delay: .15 }}
        className="dp-stage-bar">
        {(['All', ...STAGES] as const).map(s => {
          const count = s === 'All' ? deals.length : deals.filter(d => d.stage === s).length;
          const active = stageFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStageFilter(s)}
              className={`dp-stage-tab${active ? ' dp-stage-tab--active' : ''}`}
              style={active && s !== 'All' ? { '--tab-accent': STAGE_CFG[s as Stage].color } as React.CSSProperties : {}}
            >
              {s !== 'All' && <span className="dp-tab-dot" style={{ background: STAGE_CFG[s as Stage]?.accent }} />}
              <span className="dp-tab-label">{s}</span>
              <span className="dp-tab-count">{count}</span>
            </button>
          );
        })}
      </motion.div>

      {/* ══════════════════════════════════════════════
          ACTION BAR — search + filters + sort + view
          ══════════════════════════════════════════════ */}
      <motion.div initial="hidden" animate="visible" variants={FADE_UP} transition={{ delay: .2 }}
        className="dp-action-bar">
        <div className="dp-action-left">
          {/* Search */}
          <div className="dp-search-compact">
            <Search className="h-3.5 w-3.5" />
            <input
              type="text" placeholder="Search deals…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dp-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="dp-search-clear">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Smart filter chips — inline, compact */}
          {([
            { key: 'atRisk' as SmartFilter, label: 'At Risk', count: atRiskCount, color: '#EF4444' },
            { key: 'stale' as SmartFilter, label: 'Stale', count: staleCount, color: '#F97316' },
            { key: 'overdue' as SmartFilter, label: 'Overdue', count: overdueCount, color: '#EF4444' },
          ] as const).filter(sf => sf.count > 0).map(sf => {
            const active = smartFilter === sf.key;
            return (
              <button
                key={sf.key}
                className={`dp-chip${active ? ' dp-chip--active' : ''}`}
                style={active ? { borderColor: sf.color, color: sf.color } : {}}
                onClick={() => setSmartFilter(active ? 'none' : sf.key)}
              >
                {sf.label} <span className="dp-chip-n" style={active ? { background: sf.color, color: '#FFF' } : {}}>{sf.count}</span>
              </button>
            );
          })}
          {smartFilter !== 'none' && (
            <button className="dp-chip dp-chip--clear" onClick={() => setSmartFilter('none')}>
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        <div className="dp-action-right">
          {/* Sort */}
          <div ref={sortRef} style={{ position: 'relative' }}>
            <button className="dp-action-btn" onClick={() => setSortOpen(o => !o)}>
              <Filter className="h-3.5 w-3.5" />
              Sort
              <ChevronDown className="h-3 w-3" style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: .97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: .97 }}
                  transition={{ duration: .12 }}
                  className="dp-sort-menu"
                >
                  {[['value', 'Deal Value'], ['probability', 'Win Probability'], ['closeDate', 'Close Date'], ['activity', 'Last Activity']].map(([v, l]) => (
                    <button key={v} className={`ld-fchip-option${sortBy === v ? ' active' : ''}`}
                      onClick={() => { setSortBy(v); setSortOpen(false); }}>
                      <span className="ld-fchip-check">{sortBy === v && <Check className="h-3 w-3" />}</span>
                      {l}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* View toggle */}
          <div className="dp-view-toggle">
            <button className={`dp-view-btn${view === 'board' ? ' active' : ''}`}
              onClick={() => setView('board')} title="Board view">
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button className={`dp-view-btn${view === 'list' ? ' active' : ''}`}
              onClick={() => setView('list')} title="List view">
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════
          BOARD + RIGHT PANEL
          ══════════════════════════════════════════════ */}
      <div className="dp-board-layout">

        {/* ── KANBAN / LIST ── */}
        <div style={{ minWidth: 0 }}>

          {/* BOARD VIEW */}
          {view === 'board' && (
            <div className="dp-board-wrap">
              <div className="dp-board">
                {STAGES.map(stage => {
                  const cfg     = STAGE_CFG[stage];
                  const cards   = dealsByStage[stage] ?? [];
                  const total   = cards.reduce((s, d) => s + d.value, 0);
                  const isOver  = dropStage === stage;
                  return (
                    <div
                      key={stage}
                      className={`dp-col${isOver ? ' dp-col--over' : ''}`}
                      onDragOver={e => handleDragOver(e, stage)}
                      onDragLeave={handleDragLeave}
                      onDrop={e => handleDrop(e, stage)}
                    >
                      {/* Column top-border */}
                      <div className="dp-col-bar" />

                      {/* Column header */}
                      <div className="dp-col-head">
                        <div className="dp-col-head-top">
                          <span className="dp-col-name">{stage}</span>
                          <span className="dp-col-count" style={{ background: cfg.bg, color: cfg.color }}>
                            {cards.length}
                          </span>
                        </div>
                        <div className="dp-col-intel">
                          {total > 0 && <span className="dp-col-total">{fmtVal(total)}</span>}
                          {stage !== 'Won' && (
                            <span className="dp-col-meta-row">
                              <span className="dp-col-avg">Avg {STAGE_META[stage].avgDays}d</span>
                              <span className="dp-col-conv">→ {STAGE_META[stage].convRate}%</span>
                            </span>
                          )}
                          {stage === 'Won' && <span className="dp-col-meta-row"><span className="dp-col-avg" style={{ color: '#4A3D2E' }}>Closed</span></span>}
                        </div>
                      </div>

                      {/* Cards — first card always visible, rest behind toggle */}
                      <div className="dp-col-body">
                        {cards.length === 0 && (
                          <div className={`dp-col-empty${isOver ? ' dp-col-empty--over' : ''}`}>
                            <CircleDot className="h-5 w-5" />
                            <span>{isOver ? 'Drop here' : 'No deals'}</span>
                          </div>
                        )}

                        {/* First card — always shown */}
                        {cards.length > 0 && (
                          <DealCard
                            key={cards[0].id}
                            deal={cards[0]}
                            isDragging={dragId === cards[0].id}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            showMenu={menuOpen === cards[0].id}
                            onMenuToggle={setMenuOpen}
                            onMenuAction={handleMenuAction}
                          />
                        )}

                        {/* "Show X more" toggle — only when 2+ cards */}
                        {cards.length > 1 && (
                          <button
                            className="dp-col-toggle"
                            onClick={() => toggleColExpand(stage)}
                          >
                            <ChevronDown
                              className="h-3.5 w-3.5"
                              style={{ transform: expandedCols[stage] ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                            />
                            {expandedCols[stage]
                              ? 'Show less'
                              : `Show ${cards.length - 1} more`
                            }
                          </button>
                        )}

                        {/* Remaining cards — animated expand */}
                        <AnimatePresence initial={false}>
                          {expandedCols[stage] && cards.length > 1 && (
                            <motion.div
                              key="more"
                              initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                              animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
                              exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                            >
                              {cards.slice(1).map(deal => (
                                <DealCard
                                  key={deal.id}
                                  deal={deal}
                                  isDragging={dragId === deal.id}
                                  onDragStart={handleDragStart}
                                  onDragEnd={handleDragEnd}
                                  showMenu={menuOpen === deal.id}
                                  onMenuToggle={setMenuOpen}
                                  onMenuAction={handleMenuAction}
                                />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Add deal CTA */}
                        <button
                          className="dp-col-add"
                          onClick={() => router.push(`/broker/deals/new?stage=${stage}`)}
                        >
                          <Plus className="h-3.5 w-3.5" /> Add deal
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dp-list-card">
              <table className="ld-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '19%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>PROPERTY</th>
                    <th>CLIENT</th>
                    <th>VALUE</th>
                    <th>STAGE</th>
                    <th>PROB</th>
                    <th>OWNER</th>
                    <th>DAYS</th>
                    <th>CLOSE DATE</th>
                    <th>PRI</th>
                    <th>NEXT ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {displayDeals.map(deal => {
                    const sc  = STAGE_CFG[deal.stage];
                    const pc  = PRIORITY_CFG[deal.priority];
                    const flags = getDealFlags(deal);
                    const probColor = deal.probability >= 75 ? '#16A34A' : deal.probability >= 50 ? '#F59E0B' : '#EF4444';
                    return (
                      <tr key={deal.id} className={`ld-row${flags.isStale ? ' dp-row-stale' : ''}${flags.isOverdue ? ' dp-row-overdue' : ''}`} onClick={() => router.push(`/broker/deals/${deal.id}`)}>
                        <td>
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <p className="ld-cell-name">{deal.property}</p>
                              {deal.isHot && <Flame className="h-3 w-3" style={{ color: '#EF4444', flexShrink: 0 }} />}
                            </div>
                            <p className="ld-cell-email" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <MapPin className="h-3 w-3" /> {deal.location}
                            </p>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="dp-avatar-sm" style={{ background: '#6F5C46' }}>{deal.clientInitials}</div>
                            <span className="ld-cell-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{deal.client}</span>
                          </div>
                        </td>
                        <td><span className="ld-cell-budget">{fmtVal(deal.value, deal.currency)}</span></td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                            {deal.stage}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className="ld-score-bar">
                              <div className="ld-score-bar-fill" style={{ width: `${deal.probability}%`, background: probColor }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: probColor }}>{deal.probability}%</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <div className="dp-avatar-xs" style={{ background: '#A89478' }}>{deal.ownerInitials}</div>
                            <span className="ld-cell-text">{deal.owner}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: flags.isStale ? '#EF4444' : flags.isSlowing ? '#F59E0B' : 'var(--fg-muted)',
                          }}>
                            {deal.daysInStage}d
                          </span>
                        </td>
                        <td>
                          <span className={`ld-cell-text${flags.isOverdue ? ' dp-overdue' : ''}`}>
                            {fmtDate(deal.closeDate)}
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: pc.bg, color: pc.color }}>
                            {pc.label}
                          </span>
                        </td>
                        <td>
                          {deal.nextAction ? (
                            <span style={{ fontSize: 11, color: 'var(--fg-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Zap className="h-3 w-3" style={{ color: '#8B6B47', flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.nextAction}</span>
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {displayDeals.length === 0 && (
                <div className="text-center py-12">
                  <Search className="h-9 w-9 text-[#D6CCBE] mx-auto mb-3" />
                  <p className="text-[14px] font-medium text-[#1F1814]">No deals found</p>
                  <p className="text-[12px] text-[#9A8B7E] mt-1">Adjust filters or add a new deal</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════════════════════════════════════
              ANALYTICS (inside left column)
              ══════════════════════════════════════════════ */}
          <div className="dp-analytics-grid" style={{ marginTop: 20 }}>

            {/* A: Revenue Forecast */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={FADE_UP} className="ld-card dp-analytics-card">
              <div className="dp-analytics-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EDE7DF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp className="h-4 w-4 text-[#6F5C46]" />
                  </div>
                  <h2 className="ld-section-title">Revenue Forecast</h2>
                </div>
                <PeriodDropdown value={analyticsPeriod} onChange={setAnalyticsPeriod} />
              </div>
              <div style={{ height: 160, marginTop: 12 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fcastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B6B47" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#8B6B47" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fcastForeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A89478" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#A89478" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#9A8B7E' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9A8B7E' }} axisLine={false} tickLine={false} unit="M" />
                    <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #EFE9E0', borderRadius: 10, fontSize: 12 }}
                      formatter={(v) => [`${Number(v)}M AED`, '']} />
                    <Area type="monotone" dataKey="v" stroke="#8B6B47" strokeWidth={2}
                      fill="url(#fcastGrad)" dot={false} connectNulls animationDuration={1200} />
                    <Area type="monotone" dataKey="forecast" stroke="#A89478" strokeWidth={1.5}
                      strokeDasharray="5 4" fill="url(#fcastForeGrad)" dot={false}
                      connectNulls animationDuration={1200} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* B: Conversion by Stage */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={FADE_UP} transition={{ delay: .07 }} className="ld-card dp-analytics-card">
              <div className="dp-analytics-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EDE7DF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart3 className="h-4 w-4 text-[#8B7355]" />
                  </div>
                  <h2 className="ld-section-title">Conversion</h2>
                </div>
              </div>
              <div style={{ height: 160, marginTop: 12 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 9, fill: '#9A8B7E' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#9A8B7E' }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip contentStyle={{ background: '#FFF', border: '1px solid #EFE9E0', borderRadius: 10, fontSize: 12 }}
                      formatter={(v) => [`${Number(v)}%`, 'Conversion']} />
                    <Bar dataKey="rate" radius={[5, 5, 0, 0]} fill="#8B6B47" animationDuration={1200}>
                      {conversionData.map((_, i) => (
                        <rect key={i} fill={`hsl(${27 - i * 2},38%,${58 - i * 3}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* C: Top Brokers */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}
              variants={FADE_UP} transition={{ delay: .14 }} className="ld-card dp-analytics-card">
              <div className="dp-analytics-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#EDE7DF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award className="h-4 w-4 text-[#6F5C46]" />
                  </div>
                  <h2 className="ld-section-title">Top Brokers</h2>
                </div>
              </div>
              <div className="space-y-3 mt-3">
                {BROKERS.map((b, i) => (
                  <div key={b.name} className="dp-broker-row">
                    <span className="dp-broker-rank">{i + 1}</span>
                    <div className="dp-avatar-sm" style={{ background: b.color }}>{b.initials}</div>
                    <div className="dp-broker-info">
                      <p className="dp-broker-name">{b.name}</p>
                      <div className="dp-broker-bar-wrap">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${b.rate}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, delay: i * 0.1 }}
                          className="dp-broker-bar"
                          style={{ background: b.color }}
                        />
                      </div>
                    </div>
                    <div className="dp-broker-stats">
                      <span className="dp-broker-val">{fmtVal(b.value)}</span>
                      <span className="dp-broker-deals">{b.deals} deals</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════
            RIGHT INTELLIGENCE PANEL
            ══════════════════════════════════════════════ */}
        <div className="dp-right-panel">

          {/* MODULE A: Pipeline Health + Needs Attention */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={FADE_UP} transition={{ delay: .12 }}
            className="ld-card dp-panel-card">
            <div className="dp-panel-head">
              <div className="ld-sidebar-icon blue"><Activity className="h-4 w-4" /></div>
              <h3 className="ld-sidebar-title">Pipeline Health</h3>
              <span className="ld-live-dot" />
            </div>
            <div className="dp-gauge-wrap">
              <GaugeChart score={healthScore} />
            </div>
            <div className="dp-health-grid">
              {[
                { label: 'On Track',       count: deals.filter(d => ['Closing','Won'].includes(d.stage)).length,      color: '#16A34A', bg: '#F0FDF4' },
                { label: 'At Risk',        count: atRiskCount,                                                          color: '#F59E0B', bg: '#FFFBEB' },
                { label: 'Overdue',        count: overdueCount,                                                         color: '#EF4444', bg: '#FEF2F2' },
              ].map(h => (
                <div key={h.label} className="dp-health-item" style={{ background: h.bg }}>
                  <span className="dp-health-count" style={{ color: h.color }}>{h.count}</span>
                  <span className="dp-health-label">{h.label}</span>
                </div>
              ))}
            </div>

            {/* Needs Attention list */}
            {(() => {
              const attention = deals
                .filter(d => d.stage !== 'Won')
                .map(d => {
                  const f = getDealFlags(d);
                  if (f.isStale)   return { deal: d, reason: `${d.daysInStage}d stuck in ${d.stage}`, color: '#EF4444', icon: AlertTriangle };
                  if (f.isOverdue) return { deal: d, reason: `Close date overdue`, color: '#EF4444', icon: Calendar };
                  if (f.noContact) return { deal: d, reason: `No contact in ${d.lastContactDays}d`, color: '#F59E0B', icon: Bell };
                  return null;
                })
                .filter(Boolean)
                .slice(0, 4);
              if (attention.length === 0) return null;
              return (
                <div className="dp-attn-section">
                  <p className="dp-attn-title">
                    <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />
                    Needs Attention ({attention.length})
                  </p>
                  {attention.map(item => {
                    const Icon = item!.icon;
                    return (
                      <div
                        key={item!.deal.id}
                        className="dp-attn-row"
                        onClick={() => router.push(`/broker/deals/${item!.deal.id}`)}
                      >
                        <Icon className="h-3 w-3" style={{ color: item!.color, flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="dp-attn-name">{item!.deal.property}</p>
                          <p className="dp-attn-reason" style={{ color: item!.color }}>{item!.reason}</p>
                        </div>
                        <ArrowRight className="h-3 w-3" style={{ color: 'var(--fg-muted)', flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>

          {/* MODULE B: AI Insights */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={FADE_UP} transition={{ delay: .16 }}
            className="ld-card dp-panel-card">
            <div className="dp-panel-head">
              <div className="ld-sidebar-icon" style={{ background: '#EDE7DF', color: '#6F5C46' }}>
                <Brain className="h-4 w-4" />
              </div>
              <h3 className="ld-sidebar-title">AI Insights</h3>
              <span className="ld-live-dot" />
              <button
                className={`ld-sidebar-refresh`}
                onClick={() => showToast('Insights refreshed')}
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2.5 mt-3">
              {[
                { text: `${deals.filter(d=>d.probability>=80).length} deals likely to close this week`, type: 'hot', icon: Flame },
                { text: 'Palm Jumeirah needs follow-up today — counter offer pending', type: 'urgent', icon: AlertTriangle },
                { text: 'Proposal→Negotiation conversion improved by 18% this month', type: 'tip', icon: TrendingUp },
                { text: 'DIFC Office at 91% — schedule final walkthrough ASAP', type: 'hot', icon: Star },
              ].slice(0, insightsOpen ? 4 : 3).map((ins, i) => {
                const Icon = ins.icon;
                const cfg = { hot: { bg: '#FEF2F2', fg: '#DC2626' }, urgent: { bg: '#FFFBEB', fg: '#D97706' }, tip: { bg: '#EDE7DF', fg: '#6F5C46' } }[ins.type] || { bg: '#EDE7DF', fg: '#8B7355' };
                return (
                  <div key={i} className="ld-insight-row">
                    <div className="ld-insight-icon" style={{ background: cfg.bg, color: cfg.fg }}><Icon className="h-3.5 w-3.5" /></div>
                    <p className="ld-insight-text">{ins.text}</p>
                  </div>
                );
              })}
            </div>
            <button className="ld-sidebar-link mt-3" onClick={() => setInsightsOpen(o => !o)}>
              {insightsOpen ? 'Show less' : 'View all insights (4)'}
              {insightsOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </motion.div>

          {/* MODULE C: Upcoming Tasks */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={FADE_UP} transition={{ delay: .2 }}
            className="ld-card dp-panel-card">
            <div className="dp-panel-head">
              <div className="ld-sidebar-icon" style={{ background: '#EFF6FF', color: '#3B82F6' }}>
                <CheckCircle className="h-4 w-4" />
              </div>
              <h3 className="ld-sidebar-title">Upcoming Tasks</h3>
              <span className="dp-task-count">{tasks.filter(t => !t.done).length}</span>
            </div>
            <div className="space-y-2 mt-3">
              {tasks.map(task => {
                const pc = { urgent: { color: '#EF4444' }, high: { color: '#F59E0B' }, medium: { color: '#A89478' }, low: { color: '#C4B19A' } }[task.priority] || { color: '#9A8B7E' };
                return (
                  <div
                    key={task.id}
                    className={`dp-task-row${task.done ? ' dp-task-row--done' : ''}`}
                    onClick={() => router.push(`/broker/deals/${task.dealId}`)}
                  >
                    <button
                      className="dp-task-check"
                      style={{ borderColor: task.done ? '#16A34A' : pc.color, background: task.done ? '#F0FDF4' : 'transparent' }}
                      onClick={e => { e.stopPropagation(); toggleTask(task.id); }}
                    >
                      {task.done && <Check className="h-3 w-3 text-[#16A34A]" />}
                    </button>
                    <div className="dp-task-body">
                      <p className="dp-task-text">{task.text}</p>
                      <p className="dp-task-time">
                        <Clock className="h-3 w-3" /> {task.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="ld-sidebar-link mt-3" onClick={() => showToast('Task added')}>
              <Plus className="h-3.5 w-3.5" /> Add task
            </button>
          </motion.div>

        </div>
      </div>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* ── Click-outside menu close ── */}
      {menuOpen && <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />}

    </PageContainer>
  );
}
