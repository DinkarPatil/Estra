'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Clock, Star, CheckCircle2, Download,
  DollarSign, Target, Zap, Brain, ArrowDownRight,
  Award, AlertCircle, MapPin, Calendar,
  X, ArrowUp, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = '7D' | '30D' | '90D' | 'YTD';

interface PropertyRow {
  id: string;
  property: string;
  type: string;
  daysToClose: number;
  commission: string;
  commissionVal: number;
  roi: string;
  roiVal: number;
  roiTrend: 'up' | 'down';
  status: 'closed' | 'active';
  location: string;
  tag: 'top' | 'speed' | 'attention' | null;
  aiNote: string;
}

// ─── KPI Sparklines ───────────────────────────────────────────────────────────
const KPI_SPARKS = {
  conversion:   [26, 28, 29, 31, 33, 34],
  response:     [3.1, 2.8, 2.6, 2.4, 2.1, 2.0],
  satisfaction: [4.4, 4.5, 4.6, 4.7, 4.8, 4.8],
  deals:        [30, 35, 38, 40, 44, 46],
};

const MARKET_SPARK = [68, 72, 74, 79, 84, 91, 98];

// ─── Period Data ──────────────────────────────────────────────────────────────
const DATA_BY_PERIOD: Record<Period, {
  deals: { label: string; current: number; prev: number; forecast?: number }[];
  revenue: { label: string; amount: number; goal: number }[];
}> = {
  '7D': {
    deals: [
      { label: 'Mon', current: 1, prev: 0 }, { label: 'Tue', current: 0, prev: 1 },
      { label: 'Wed', current: 2, prev: 1 }, { label: 'Thu', current: 1, prev: 0 },
      { label: 'Fri', current: 1, prev: 2 }, { label: 'Sat', current: 0, prev: 1 },
      { label: 'Sun', current: 1, prev: 0, forecast: 1.4 },
    ],
    revenue: [
      { label: 'Mon', amount: 28000, goal: 35000 }, { label: 'Tue', amount: 0, goal: 35000 },
      { label: 'Wed', amount: 96000, goal: 35000 }, { label: 'Thu', amount: 45000, goal: 35000 },
      { label: 'Fri', amount: 38000, goal: 35000 }, { label: 'Sat', amount: 0, goal: 35000 },
      { label: 'Sun', amount: 19600, goal: 35000 },
    ],
  },
  '30D': {
    deals: [
      { label: 'Wk 1', current: 3, prev: 2 }, { label: 'Wk 2', current: 2, prev: 3 },
      { label: 'Wk 3', current: 4, prev: 2 }, { label: 'Wk 4', current: 3, prev: 4, forecast: 3.8 },
    ],
    revenue: [
      { label: 'Wk 1', amount: 124000, goal: 120000 }, { label: 'Wk 2', amount: 96000, goal: 120000 },
      { label: 'Wk 3', amount: 182000, goal: 120000 }, { label: 'Wk 4', amount: 143000, goal: 120000 },
    ],
  },
  '90D': {
    deals: [
      { label: 'Feb', current: 4, prev: 3 }, { label: 'Mar', current: 5, prev: 4 },
      { label: 'Apr', current: 3, prev: 4, forecast: 4.2 },
    ],
    revenue: [
      { label: 'Feb', amount: 312000, goal: 350000 }, { label: 'Mar', amount: 428000, goal: 350000 },
      { label: 'Apr', amount: 291000, goal: 350000 },
    ],
  },
  'YTD': {
    deals: [
      { label: 'Jan', current: 2, prev: 1 }, { label: 'Feb', current: 4, prev: 3 },
      { label: 'Mar', current: 3, prev: 2 }, { label: 'Apr', current: 3, prev: 4 },
      { label: 'May', current: 5, prev: 3 }, { label: 'Jun', current: 4, prev: 3 },
      { label: 'Jul', current: 3, prev: 2 }, { label: 'Aug', current: 2, prev: 3 },
      { label: 'Sep', current: 5, prev: 4 }, { label: 'Oct', current: 4, prev: 3 },
      { label: 'Nov', current: 6, prev: 4 }, { label: 'Dec', current: 5, prev: 4, forecast: 5.8 },
    ],
    revenue: [
      { label: 'Jan', amount: 182000, goal: 300000 }, { label: 'Feb', amount: 312000, goal: 300000 },
      { label: 'Mar', amount: 428000, goal: 300000 }, { label: 'Apr', amount: 291000, goal: 300000 },
      { label: 'May', amount: 380000, goal: 300000 }, { label: 'Jun', amount: 342000, goal: 300000 },
      { label: 'Jul', amount: 265000, goal: 300000 }, { label: 'Aug', amount: 298000, goal: 300000 },
      { label: 'Sep', amount: 445000, goal: 300000 }, { label: 'Oct', amount: 388000, goal: 300000 },
      { label: 'Nov', amount: 512000, goal: 300000 }, { label: 'Dec', amount: 452000, goal: 300000 },
    ],
  },
};

const LEAD_SOURCES = [
  { name: 'Referral', value: 40, leads: 112, color: '#6F5C46', convRate: 38, trend: '+4%', trendPos: true },
  { name: 'Platform', value: 30, leads: 84,  color: '#8B7355', convRate: 28, trend: '+2%', trendPos: true },
  { name: 'Direct',   value: 20, leads: 56,  color: '#A89279', convRate: 22, trend: '-1%', trendPos: false },
  { name: 'Events',   value: 10, leads: 28,  color: '#C4B19A', convRate: 15, trend: '+8%', trendPos: true },
];

const TEAM = [
  { name: 'James Okafor', initials: 'JO', color: '#5A4A38', deals: 8, revenue: 452000, satisfaction: 4.9, closeDays: 22 },
  { name: 'Sarah Kim',    initials: 'SK', color: '#6F5C46', deals: 6, revenue: 318000, satisfaction: 4.7, closeDays: 31 },
  { name: 'Mark Davis',   initials: 'MD', color: '#8B7355', deals: 5, revenue: 284000, satisfaction: 4.8, closeDays: 35 },
  { name: 'Aisha Nkosi',  initials: 'AN', color: '#A89279', deals: 3, revenue: 148000, satisfaction: 4.6, closeDays: 44 },
];

const TOP_PROPERTIES: PropertyRow[] = [
  { id: 'tp-1', property: 'Palm Jumeirah Villa',  type: 'Luxury Villa',  daysToClose: 18, commission: '$81,719',   commissionVal: 81719,   roi: '14.2%', roiVal: 14.2, roiTrend: 'up',   status: 'closed', location: 'Dubai, UAE',        tag: 'speed',     aiNote: 'Fastest close this quarter — 18 days, well below average.' },
  { id: 'tp-2', property: 'Monaco Penthouse',     type: 'Ultra-Luxury', daysToClose: 22, commission: '$196,752',  commissionVal: 196752,  roi: '21.8%', roiVal: 21.8, roiTrend: 'up',   status: 'closed', location: 'Monaco',            tag: 'top',       aiNote: 'Highest commission YTD. Client referred 2 new prospects.' },
  { id: 'tp-3', property: 'Marina Bay Penthouse', type: 'Residential',  daysToClose: 45, commission: '$96,000',   commissionVal: 96000,   roi: '11.4%', roiVal: 11.4, roiTrend: 'up',   status: 'closed', location: 'Singapore',         tag: null,        aiNote: 'Solid performer. Client referred 2 new prospects post-close.' },
  { id: 'tp-4', property: 'Canary Wharf Office',  type: 'Commercial',   daysToClose: 32, commission: '$88,481',   commissionVal: 88481,   roi: '9.7%',  roiVal: 9.7,  roiTrend: 'down', status: 'active', location: 'London, UK',        tag: 'attention', aiNote: 'ROI trending down 2.1% MoM. Consider commercial pricing review.' },
  { id: 'tp-5', property: 'Lake Geneva Chalet',   type: 'Residential',  daysToClose: 28, commission: '$152,300',  commissionVal: 152300,  roi: '17.1%', roiVal: 17.1, roiTrend: 'up',   status: 'closed', location: 'Geneva',            tag: 'top',       aiNote: 'Recurring client — 3rd deal this year. Strong repeat relationship.' },
  { id: 'tp-6', property: 'Bandra Sea View Flat', type: 'Residential',  daysToClose: 60, commission: '$42,000',   commissionVal: 42000,   roi: '6.3%',  roiVal: 6.3,  roiTrend: 'down', status: 'active', location: 'Mumbai, India',     tag: 'attention', aiNote: '60+ days on market. A 5% price reduction could close in 2 weeks.' },
];

const FUNNEL_STEPS = [
  { label: 'Impressions', value: 4800, pct: 100 },
  { label: 'Inquiries',   value: 1240, pct: 25.8 },
  { label: 'Qualified',   value: 312,  pct: 6.5 },
  { label: 'Offer Made',  value: 98,   pct: 2.0 },
  { label: 'Closed',      value: 22,   pct: 0.46 },
];

const AI_INSIGHTS = [
  {
    priority: 'HIGH',
    icon: AlertCircle, iconColor: '#6F5C46',
    bgClass: 'bg-stone-50 border border-stone-200',
    priorityClass: 'bg-stone-800 text-white',
    text: 'Biggest funnel leak: Offer → Closed drops 77.6%. Negotiation support or pricing flexibility needed urgently.',
    cta: 'Fix Pipeline', ctaBg: 'bg-stone-800 hover:bg-stone-900 text-white',
  },
  {
    priority: 'HIGH',
    icon: Zap, iconColor: '#8B7355',
    bgClass: 'bg-stone-50 border border-stone-200',
    priorityClass: 'bg-stone-800 text-white',
    text: 'Bandra Sea View Flat: 60+ days active. A 5% price cut could convert it within 2 weeks.',
    cta: 'Review Listing', ctaBg: 'bg-stone-800 hover:bg-stone-900 text-white',
  },
  {
    priority: 'MED',
    icon: TrendingUp, iconColor: '#8B7355',
    bgClass: 'bg-stone-50 border border-stone-200',
    priorityClass: 'bg-stone-200 text-stone-700',
    text: 'Luxury listings close 2.4× faster. Shift focus to Dubai + Monaco pipeline for max velocity.',
    cta: 'View Leads', ctaBg: 'bg-stone-700 hover:bg-stone-800 text-white',
  },
  {
    priority: 'LOW',
    icon: Award, iconColor: '#A89279',
    bgClass: 'bg-stone-50 border border-stone-200',
    priorityClass: 'bg-stone-100 text-stone-600',
    text: 'James Okafor closes 38% faster than team average. Share his workflow with the team.',
    cta: 'Apply Filter', ctaBg: 'bg-stone-600 hover:bg-stone-700 text-white',
  },
];

const TAG_CFG: Record<'top' | 'speed' | 'attention', { label: string; bg: string }> = {
  top:       { label: 'High Performer',  bg: 'bg-stone-100 text-stone-700 border border-stone-200' },
  speed:     { label: 'Fast Close',      bg: 'bg-stone-100 text-stone-600 border border-stone-200' },
  attention: { label: 'Needs Attention', bg: 'bg-stone-100 text-stone-700 border border-stone-300' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtRevenue(v: number) {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)} Cr`;
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)} L`;
  if (v >= 1_000)       return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${v}`;
}

// ─── Light Tooltip ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white text-stone-700 text-[11px] px-3 py-2 rounded-xl shadow-lg border border-stone-200">
      <p className="text-stone-400 mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-bold" style={{ color: p.color || '#292524' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? fmtRevenue(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function MiniSparkline({ data, color, id }: { data: number[]; color: string; id: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Counter ──────────────────────────────────────────────────────────────────
function Counter({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const dur = 900; const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay(Math.floor((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{prefix}{display.toLocaleString()}{suffix}</>;
}

// ─── Property Drawer ──────────────────────────────────────────────────────────
function PropertyDrawer({ row, onClose, onToast }: {
  row: PropertyRow | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  return (
    <AnimatePresence>
      {row && (
        <>
          <motion.div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 h-full w-[380px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="h-0.5 bg-gradient-to-r from-[#5A4A38] via-[#8B7355] to-[#C4B19A] flex-shrink-0" />

            {/* Header */}
            <div className="bg-gradient-to-br from-stone-50 to-white p-5 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] text-stone-400 font-mono mb-1 tracking-wider">{row.type}</p>
                  <h2 className="text-base font-bold text-stone-900 leading-tight">{row.property}</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3 h-3 text-stone-400" />
                    <span className="text-xs text-stone-500">{row.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                    row.status === 'closed'
                      ? 'bg-stone-100 text-stone-700 border-stone-200'
                      : 'bg-stone-50 text-stone-500 border-stone-200'
                  }`}>
                    {row.status === 'closed' ? 'Closed' : 'Active'}
                  </span>
                  <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors">
                    <X className="w-4 h-4 text-stone-500" />
                  </button>
                </div>
              </div>

              {/* AI tag if present */}
              {row.tag && (
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${TAG_CFG[row.tag].bg}`}>
                  {row.tag === 'top' && <Award style={{ width: 11, height: 11 }} />}
                  {row.tag === 'speed' && <Zap style={{ width: 11, height: 11 }} />}
                  {row.tag === 'attention' && <AlertCircle style={{ width: 11, height: 11 }} />}
                  {TAG_CFG[row.tag].label}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Commission', value: row.commission },
                  { label: 'ROI', value: row.roi },
                  { label: 'Close Time', value: `${row.daysToClose}d` },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl border border-stone-100 p-2.5 text-center shadow-sm">
                    <div className="text-sm font-bold text-stone-900">{s.value}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insight */}
            <div className="p-5 border-b border-stone-100 flex-shrink-0">
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <Brain className="w-3.5 h-3.5 text-stone-500 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">AI Intelligence</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{row.aiNote}</p>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-4 space-y-2.5">
                <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3">Deal Details</h3>
                {[
                  { label: 'Property Type', value: row.type },
                  { label: 'Location', value: row.location },
                  { label: 'Commission', value: row.commission },
                  { label: 'ROI', value: `${row.roi} ${row.roiTrend === 'up' ? '↑' : '↓'}` },
                  { label: 'Days to Close', value: `${row.daysToClose} days` },
                  { label: 'Status', value: row.status === 'closed' ? 'Closed Deal' : 'Active Listing' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">{label}</span>
                    <span className="font-semibold text-stone-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-stone-100 p-4 flex gap-2 flex-shrink-0">
              <motion.button
                className="flex-1 h-9 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium flex items-center justify-center gap-1.5"
                whileHover={{ backgroundColor: '#f9fafb' }} whileTap={{ scale: 0.97 }}
                onClick={() => onToast(`${row.property} analytics opened`)}
              >
                <Activity className="w-3.5 h-3.5" /> Analytics
              </motion.button>
              <motion.button
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-stone-700 to-stone-600 text-white text-sm font-medium flex items-center justify-center gap-1.5"
                whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.97 }}
                onClick={() => onToast(`Exporting ${row.property} report…`)}
              >
                <Download className="w-3.5 h-3.5" /> Export
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod]           = useState<Period>('YTD');
  const [showPrev, setShowPrev]       = useState(false);
  const [showForecast, setShowForecast] = useState(false);
  const [sortProp, setSortProp]       = useState<'commission' | 'daysToClose' | 'roi'>('commission');
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [selectedProp, setSelectedProp] = useState<PropertyRow | null>(null);
  const [toast, setToast]             = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  const periodData  = DATA_BY_PERIOD[period];
  const totalDeals  = periodData.deals.reduce((s, d) => s + d.current, 0);
  const totalRevenue = periodData.revenue.reduce((s, d) => s + d.amount, 0);
  const avgCloseDays = Math.round(TEAM.reduce((s, t) => s + t.closeDays, 0) / TEAM.length);
  const maxTeamRevenue = Math.max(...TEAM.map((t) => t.revenue));

  // Worst funnel drop
  const funnelDrops = FUNNEL_STEPS.slice(0, -1).map((step, i) => ({
    fromIdx: i,
    dropPct: (step.value - FUNNEL_STEPS[i + 1].value) / step.value * 100,
  }));
  const worstFromIdx = funnelDrops.reduce(
    (best, d) => d.dropPct > best.dropPct ? d : best, funnelDrops[0]
  ).fromIdx;

  const sortedProps = useMemo(() => {
    const list = [...TOP_PROPERTIES];
    if (sortProp === 'daysToClose') list.sort((a, b) => a.daysToClose - b.daysToClose);
    else if (sortProp === 'roi') list.sort((a, b) => b.roiVal - a.roiVal);
    else list.sort((a, b) => b.commissionVal - a.commissionVal);
    return list;
  }, [sortProp]);

  const fastestProps = useMemo(
    () => [...TOP_PROPERTIES].sort((a, b) => a.daysToClose - b.daysToClose).slice(0, 3),
    []
  );

  const totalGoal = periodData.revenue[0]?.goal ? periodData.revenue[0].goal * periodData.revenue.length : 1;
  const onTrack = totalRevenue >= totalGoal;

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">

      {/* ── Toast ────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 right-6 z-[100] bg-white border border-stone-200 text-stone-800 text-sm px-4 py-3 rounded-2xl flex items-center gap-2.5"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
            initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="w-6 h-6 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-stone-600" />
            </div>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <PropertyDrawer row={selectedProp} onClose={() => setSelectedProp(null)} onToast={showToast} />

      {/* ── Header ───────────────────────────────────── */}
      <div className="bkr-hero mb-4">
        <div className="bkr-hero-inner flex-wrap !items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <Activity className="h-4 w-4 text-[#8B6F47]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">Analytics</h1>
            </div>
            <p className="text-sm text-[var(--fg-muted)]">AI-powered brokerage performance command center</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => showToast('Comparing periods…')}
              className="h-9 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--fg-secondary)] text-sm font-medium flex items-center gap-1.5"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
              whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.07)' }} whileTap={{ scale: 0.97 }}
            >
              <Calendar className="w-3.5 h-3.5" /> Compare
            </motion.button>
            <motion.button
              onClick={() => showToast('Generating report…')}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#6F5443] to-[#8B6F47] text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              whileHover={{ y: -1, opacity: 0.92 }} whileTap={{ scale: 0.97 }}
            >
              <Download className="w-3.5 h-3.5" /> Export Report
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── Period Selector Bar ────────────────────────── */}
      <div className="flex items-center justify-between mb-6 bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-xl p-1">
          {(['7D', '30D', '90D', 'YTD'] as const).map((p) => (
            <motion.button key={p} onClick={() => setPeriod(p)} whileTap={{ scale: 0.95 }}
              className={`h-8 px-4 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-[var(--fg)] text-[var(--card-bg)] shadow-sm'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--card-bg)]'
              }`}>
              {p === '7D' ? 'Last 7 Days' : p === '30D' ? 'Last 30 Days' : p === '90D' ? 'Last 90 Days' : 'Year to Date'}
            </motion.button>
          ))}
        </div>
        <span className="text-xs text-[var(--fg-muted)] font-medium">
          Showing data for <span className="text-[var(--fg)] font-semibold">{period === '7D' ? 'last 7 days' : period === '30D' ? 'last 30 days' : period === '90D' ? 'last 90 days' : 'year to date'}</span>
        </span>
      </div>

      {/* ── KPI Smart Cards ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Conversion Rate', display: '34%',
            change: '+5.2%', positive: true, sub: 'vs last quarter',
            icon: TrendingUp, iconColor: '#6F5C46', iconBg: 'rgba(111,92,70,0.1)',
            spark: KPI_SPARKS.conversion, sparkId: 'ks0', sparkColor: '#6F5C46',
            insight: 'Response speed slip may reduce next week',
          },
          {
            label: 'Lead Response', display: '<2 hrs',
            change: '-18%', positive: true, sub: 'faster than avg',
            icon: Clock, iconColor: '#8B7355', iconBg: 'rgba(139,115,85,0.1)',
            spark: KPI_SPARKS.response, sparkId: 'ks1', sparkColor: '#8B7355',
            insight: 'Fastest in your market — maintain under 2 hrs',
          },
          {
            label: 'Client Satisfaction', display: '4.8/5',
            change: '+0.3', positive: true, sub: 'vs last quarter',
            icon: Star, iconColor: '#A89279', iconBg: 'rgba(168,146,121,0.1)',
            spark: KPI_SPARKS.satisfaction, sparkId: 'ks2', sparkColor: '#A89279',
            insight: 'Post-deal follow-up quality driving scores',
          },
          {
            label: 'Deals Won', display: String(totalDeals),
            change: '+20%', positive: true, sub: 'vs last year',
            icon: CheckCircle2, iconColor: '#5A4A38', iconBg: 'rgba(90,74,56,0.1)',
            spark: KPI_SPARKS.deals, sparkId: 'ks3', sparkColor: '#5A4A38',
            insight: 'Luxury segment driving 63% of wins',
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-4 overflow-hidden cursor-default"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ y: -3, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.09), 0 2px 8px -2px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: kpi.iconBg }}>
                  <kpi.icon style={{ color: kpi.iconColor, width: 18, height: 18 }} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider leading-tight">{kpi.label}</p>
                  <p className="text-xl font-bold text-stone-900 leading-tight mt-0.5">{kpi.display}</p>
                </div>
              </div>
              <div className="w-20 flex-shrink-0 opacity-70">
                <MiniSparkline data={kpi.spark} color={kpi.sparkColor} id={kpi.sparkId} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-2.5">
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                kpi.positive ? 'bg-stone-100 text-stone-700' : 'bg-stone-100 text-stone-500'
              }`}>
                {kpi.positive ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                {kpi.change}
              </span>
              <span className="text-[10px] text-stone-400">{kpi.sub}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-50 rounded-xl px-2.5 py-1.5 border border-stone-100">
              <Zap style={{ color: kpi.sparkColor, width: 11, height: 11, flexShrink: 0 }} />
              <span className="text-[10px] text-stone-500 leading-tight truncate">{kpi.insight}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Main Layout ──────────────────────────────── */}
      <div className="flex gap-5 items-start">
        <div className="flex-1 min-w-0 space-y-4">

          {/* Row 1: Deal Closings + Lead Sources */}
          <div className="grid grid-cols-2 gap-4">

            {/* Deal Closings */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">Deal Closings</h3>
                  <p className="text-xs text-stone-400 mt-0.5">{totalDeals} deals · {period}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.button
                    onClick={() => setShowForecast((v) => !v)}
                    whileTap={{ scale: 0.95 }}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                      showForecast ? 'bg-stone-100 border-stone-300 text-stone-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                    }`}>
                    Forecast
                  </motion.button>
                  <motion.button
                    onClick={() => setShowPrev((v) => !v)}
                    whileTap={{ scale: 0.95 }}
                    className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                      showPrev ? 'bg-stone-50 border-stone-300 text-stone-700' : 'border-stone-200 text-stone-500 hover:bg-stone-50'
                    }`}>
                    vs Prior
                  </motion.button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={periodData.deals} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8B7355" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#8B7355" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#A89279" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#A89279" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A8B7E' }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip content={<ChartTip />} />
                  {showPrev && (
                    <Area type="monotone" dataKey="prev" name="Prior" stroke="#D6CFC8" strokeWidth={1.5}
                      fill="transparent" dot={false} strokeDasharray="4 2" />
                  )}
                  <Area type="monotone" dataKey="current" name="Deals" stroke="#8B7355" strokeWidth={2.5}
                    fill="url(#dealGrad)" dot={{ fill: '#8B7355', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  {showForecast && (
                    <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#A89279" strokeWidth={2}
                      fill="url(#forecastGrad)" dot={{ fill: '#A89279', r: 3, strokeWidth: 0 }} strokeDasharray="5 3" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Lead Sources */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">Lead Sources</h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {activeSource ? `Filtered: ${activeSource}` : 'Click to filter by source'}
                  </p>
                </div>
                {activeSource && (
                  <button onClick={() => setActiveSource(null)}
                    className="text-[10px] text-stone-500 flex items-center gap-1 hover:text-stone-700 transition-colors">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                {/* Pie */}
                <div className="relative flex-shrink-0">
                  <PieChart width={120} height={120}>
                    <Pie
                      data={LEAD_SOURCES} cx={55} cy={55}
                      innerRadius={36} outerRadius={54}
                      dataKey="value" strokeWidth={2} stroke="#fff"
                      onClick={(d) => setActiveSource(d.name === activeSource ? null : d.name ?? null)}
                    >
                      {LEAD_SOURCES.map((e, i) => (
                        <Cell key={i} fill={e.color}
                          opacity={activeSource && activeSource !== e.name ? 0.25 : 1} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v ?? 0}%`, 'Share']}
                      contentStyle={{ fontSize: 11, borderRadius: 10, background: '#fff', border: '1px solid #E5E7EB', color: '#374151', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-stone-900">280</span>
                    <span className="text-[9px] text-stone-400">Leads</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-1.5 flex-1">
                  {LEAD_SOURCES.map((s) => (
                    <motion.button
                      key={s.name}
                      onClick={() => setActiveSource(s.name === activeSource ? null : s.name)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-xl transition-colors ${
                        activeSource === s.name ? 'bg-stone-100' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-xs text-stone-600 font-medium">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-800">{s.value}%</span>
                        <span className={`text-[10px] font-semibold ${s.trendPos ? 'text-stone-700' : 'text-stone-400'}`}>
                          {s.trend}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Conversion rate detail on filter */}
              <AnimatePresence>
                {activeSource && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-stone-100"
                  >
                    {LEAD_SOURCES.filter(s => s.name === activeSource).map(s => (
                      <div key={s.name} className="flex items-center justify-between">
                        <span className="text-xs text-stone-500">{s.name} conversion rate</span>
                        <span className="text-sm font-bold" style={{ color: s.color }}>{s.convRate}%</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Row 2: Revenue + Team */}
          <div className="grid grid-cols-2 gap-4">

            {/* Revenue Performance */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">Revenue Performance</h3>
                  <p className="text-xs text-stone-400 mt-0.5">{fmtRevenue(totalRevenue)} total · {period}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-0" style={{ borderTop: '2px dashed #9A8B7E' }} />
                    <span className="text-[10px] text-stone-400">Goal</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                    onTrack ? 'bg-stone-100 text-stone-700' : 'bg-stone-100 text-stone-500'
                  }`}>
                    <ArrowUp className="w-2.5 h-2.5" />
                    {onTrack ? 'On Track' : 'Below Target'}
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={periodData.revenue} barSize={14} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barAbove" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6F5C46" />
                      <stop offset="100%" stopColor="#5A4A38" />
                    </linearGradient>
                    <linearGradient id="barBelow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C4B19A" />
                      <stop offset="100%" stopColor="#A89279" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A8B7E' }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine y={periodData.revenue[0]?.goal ?? 0} stroke="#9A8B7E" strokeDasharray="4 3" strokeWidth={1.5} />
                  <Bar dataKey="amount" name="Revenue" radius={[5, 5, 0, 0]}>
                    {periodData.revenue.map((entry, i) => (
                      <Cell key={i} fill={entry.amount >= entry.goal ? 'url(#barAbove)' : 'url(#barBelow)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Team Productivity */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">Team Productivity</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Avg close: {avgCloseDays}d team baseline</p>
                </div>
                <span className="text-[10px] bg-stone-50 text-stone-500 px-2 py-0.5 rounded-full border border-stone-100 font-medium">4 agents</span>
              </div>
              <div className="space-y-4">
                {TEAM.map((member, i) => (
                  <motion.div key={member.name}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ background: member.color }}>
                        {member.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-stone-700">{member.name}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-stone-400">{member.deals}d</span>
                            <span className="text-[10px] font-bold text-stone-800">{fmtRevenue(member.revenue)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 text-stone-400" style={{ fill: '#A89279' }} />
                            <span className="text-[10px] text-stone-500">{member.satisfaction}</span>
                          </div>
                          <span className="text-stone-200 text-[10px]">·</span>
                          <span className={`text-[10px] font-medium flex items-center gap-0.5 ${
                            member.closeDays < avgCloseDays ? 'text-stone-700' : 'text-stone-400'
                          }`}>
                            {member.closeDays}d avg
                            {member.closeDays < avgCloseDays && <Zap style={{ width: 10, height: 10 }} />}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden ml-9">
                      <motion.div className="h-full rounded-full" style={{ background: member.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(member.revenue / maxTeamRevenue) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-semibold text-stone-800">Conversion Funnel</h3>
                <p className="text-xs text-stone-400 mt-0.5">Buyer journey — impressions to close</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-full">
                  <AlertCircle className="w-3 h-3 text-stone-600" />
                  <span className="text-[10px] font-semibold text-stone-700">77.6% drop: Offer → Closed</span>
                </div>
                <span className="text-[10px] text-stone-400 bg-stone-50 px-2.5 py-1 rounded-full border border-stone-100">
                  0.46% close rate
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {FUNNEL_STEPS.map((step, i) => {
                const nextStep = FUNNEL_STEPS[i + 1];
                const dropPct = nextStep
                  ? ((step.value - nextStep.value) / step.value * 100).toFixed(1)
                  : null;
                const isWorstDrop = dropPct !== null && i === worstFromIdx;
                // Power scale for visual width
                const visualW = Math.max(Math.pow(step.pct / 100, 0.38) * 100, 5);
                const STEP_COLORS = ['#5A4A38', '#6F5C46', '#8B7355', '#A89279', '#C4B19A'];

                return (
                  <div key={step.label}>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-stone-500 w-24 flex-shrink-0 text-right font-medium">{step.label}</span>
                      <div className="flex-1 h-8 bg-stone-100 rounded-xl overflow-hidden">
                        <motion.div
                          className="h-full rounded-xl flex items-center px-3"
                          style={{
                            background: `linear-gradient(90deg, ${STEP_COLORS[i]}, ${STEP_COLORS[i]}CC)`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${visualW}%` }}
                          transition={{ duration: 0.9, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <span className="text-white text-[10px] font-bold whitespace-nowrap">
                            {step.value.toLocaleString()}
                          </span>
                        </motion.div>
                      </div>
                      <span className="text-[11px] font-semibold text-stone-500 w-10 text-right">{step.pct}%</span>
                    </div>

                    {dropPct && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 + 0.5 }}
                        className="flex items-center gap-2 ml-[108px] my-1"
                      >
                        <div className="w-px h-3 bg-stone-200 ml-2" />
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isWorstDrop
                            ? 'bg-stone-200 text-stone-800 border border-stone-300'
                            : parseFloat(dropPct) > 60
                            ? 'bg-stone-100 text-stone-600 border border-stone-200'
                            : 'bg-stone-100 text-stone-500'
                        }`}>
                          {isWorstDrop && '⚠ '}−{dropPct}% drop
                        </span>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* AI Insight */}
            <div className="mt-5 flex items-start gap-2.5 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3">
              <Brain className="w-3.5 h-3.5 text-stone-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-stone-600 leading-relaxed">
                <span className="font-bold">AI:</span> Biggest leak is Offer → Closed (77.6%). Introducing flexible payment terms or closing bonuses for agents could recover 15–20% of lost deals at this stage.
              </p>
            </div>
          </div>

          {/* Top Performing Properties */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-800">Top Performing Properties</h3>
                <p className="text-xs text-stone-400 mt-0.5">Click a row to open details</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-stone-400 mr-1">Sort:</span>
                {([
                  { key: 'commission', label: 'Earnings' },
                  { key: 'daysToClose', label: 'Speed' },
                  { key: 'roi', label: 'ROI' },
                ] as const).map((s) => (
                  <motion.button key={s.key} onClick={() => setSortProp(s.key)} whileTap={{ scale: 0.94 }}
                    className={`h-6 px-2.5 rounded-lg text-[10px] font-semibold transition-all ${
                      sortProp === s.key ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}>
                    {s.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr_0.8fr_0.7fr_0.7fr] gap-3 px-5 py-2.5 bg-stone-50 border-b border-stone-100">
              {['Property', 'Type', 'Close', 'Commission', 'ROI', 'Status', 'AI Tag'].map((h) => (
                <span key={h} className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">{h}</span>
              ))}
            </div>

            {sortedProps.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ backgroundColor: '#F3F4F6' }}
                onClick={() => setSelectedProp(p)}
                className="grid grid-cols-[2fr_1fr_0.8fr_1fr_0.8fr_0.7fr_0.7fr] gap-3 items-center px-5 py-3.5 border-b border-stone-50 cursor-pointer transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate leading-tight">{p.property}</p>
                  <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-0.5">
                    <MapPin style={{ width: 9, height: 9 }} />{p.location}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-50 text-stone-600 border border-stone-100 font-medium w-fit">{p.type}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-semibold ${p.daysToClose <= 25 ? 'text-stone-900' : p.daysToClose <= 40 ? 'text-stone-700' : 'text-stone-500'}`}>
                    {p.daysToClose}d
                  </span>
                  {p.daysToClose <= 25 && <Zap className="w-3 h-3 text-stone-600" />}
                </div>
                <span className="text-sm font-bold text-stone-900">{p.commission}</span>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-semibold ${p.roiVal >= 15 ? 'text-stone-900' : 'text-stone-600'}`}>{p.roi}</span>
                  {p.roiTrend === 'up'
                    ? <ArrowUp className="w-3 h-3 text-stone-600" />
                    : <ArrowDownRight className="w-3 h-3 text-stone-400" />}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium w-fit ${
                  p.status === 'closed'
                    ? 'bg-stone-100 text-stone-700 border border-stone-200'
                    : 'bg-stone-50 text-stone-500 border border-stone-200'
                }`}>
                  {p.status === 'closed' ? 'Closed' : 'Active'}
                </span>
                {p.tag ? (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold w-fit ${TAG_CFG[p.tag].bg}`}>
                    {p.tag === 'top' ? 'TOP' : p.tag === 'speed' ? '⚡ FAST' : '⚠ ATTN'}
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-300">—</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Right Sidebar ─────────────────────────── */}
        <div className="w-64 flex-shrink-0 space-y-4">

          {/* AI Insights — priority-based */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-stone-600 to-stone-700 flex items-center justify-center flex-shrink-0">
                <Brain className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-stone-800">AI Insights</h3>
                <p className="text-[10px] text-stone-400">Priority-ranked actions</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {AI_INSIGHTS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`p-3 rounded-xl ${item.bgClass}`}
                >
                  <div className="flex items-start gap-2 mb-2.5">
                    <item.icon style={{ color: item.iconColor, width: 13, height: 13, flexShrink: 0, marginTop: 1 }} />
                    <p className="text-[11px] text-stone-700 leading-snug">{item.text}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.priorityClass}`}>
                      {item.priority}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => showToast(`${item.cta} applied`)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${item.ctaBg}`}
                    >
                      {item.cta}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Best Market */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 className="text-sm font-semibold text-stone-800 mb-3">Best Market</h3>
            <motion.button
              whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(0,0,0,0.07)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => showToast('Dubai market analytics opening…')}
              className="w-full p-3 rounded-xl bg-gradient-to-br from-stone-50 to-white border border-stone-100 text-left transition-all"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-stone-500 to-stone-700 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800">Dubai, UAE</p>
                  <p className="text-xs text-stone-500">98 demand score</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-0.5 justify-end">
                    <ArrowUp className="w-3 h-3 text-stone-600" />
                    <span className="text-xs font-bold text-stone-800">+24%</span>
                  </div>
                  <span className="text-[10px] text-stone-400">this month</span>
                </div>
              </div>
              <div className="h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MARKET_SPARK.map((v, i) => ({ i, v }))}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="mktGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#8B7355" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8B7355" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke="#8B7355" strokeWidth={1.5} fill="url(#mktGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.button>
          </div>

          {/* Fastest Close vs avg */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-800">Fastest Close</h3>
              <span className="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-100">avg {avgCloseDays}d</span>
            </div>
            <div className="space-y-3">
              {fastestProps.map((p, i) => {
                const advantage = Math.max(0, (avgCloseDays - p.daysToClose) / avgCloseDays * 100);
                return (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-stone-100 text-[10px] font-bold text-stone-500 flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-stone-700 truncate leading-tight">{p.property}</p>
                      <div className="mt-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[#8B7355]"
                          initial={{ width: 0 }}
                          animate={{ width: `${advantage}%` }}
                          transition={{ duration: 0.7, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <Zap className="w-3 h-3 text-stone-600" />
                      <span className="text-xs font-bold text-stone-800">{p.daysToClose}d</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Funnel Weak Spots */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 className="text-sm font-semibold text-stone-800 mb-3">Funnel Weak Spots</h3>
            <div className="space-y-2">
              {[
                { step: 'Offer → Closed',   drop: '77.6%', severity: 'critical',  desc: 'Negotiation failure rate high' },
                { step: 'Inq → Qualified',  drop: '74.8%', severity: 'critical',  desc: 'Poor lead qualification' },
                { step: 'Qualified → Offer',drop: '68.6%', severity: 'moderate', desc: 'Pricing friction detected' },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  whileHover={{ x: 2 }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer ${
                    item.severity === 'critical'
                      ? 'bg-stone-100 border-stone-300'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div>
                    <p className={`text-xs font-semibold ${item.severity === 'critical' ? 'text-stone-800' : 'text-stone-600'}`}>
                      {item.step}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${item.severity === 'critical' ? 'text-stone-500' : 'text-stone-400'}`}>
                      {item.desc}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${item.severity === 'critical' ? 'text-stone-800' : 'text-stone-600'}`}>
                    −{item.drop}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Period Summary — WHITE card (replaces dark) */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 relative overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#5A4A38] via-[#8B7355] to-[#C4B19A]" />
            <div className="absolute inset-0 bg-gradient-to-br from-stone-50/30 to-white/0 pointer-events-none rounded-2xl" />

            <h3 className="relative text-sm font-semibold text-stone-800 mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-stone-400" /> Period Summary
            </h3>

            <div className="relative space-y-2.5">
              {[
                { label: 'Total revenue',  value: fmtRevenue(totalRevenue), icon: DollarSign,   color: '#5A4A38', iconBg: 'bg-stone-100' },
                { label: 'Deals closed',   value: String(totalDeals),       icon: CheckCircle2, color: '#6F5C46', iconBg: 'bg-stone-100' },
                { label: 'Avg deal size',  value: totalDeals > 0 ? fmtRevenue(Math.round(totalRevenue / totalDeals)) : '—', icon: Target, color: '#8B7355', iconBg: 'bg-stone-100' },
                { label: 'Avg close time', value: `${avgCloseDays}d`,       icon: Clock,        color: '#A89279', iconBg: 'bg-stone-100' },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <item.icon style={{ color: item.color, width: 12, height: 12 }} />
                    </div>
                    <span className="text-xs text-stone-500">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-stone-900">{item.value}</span>
                </motion.div>
              ))}
            </div>

            <div className="relative mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[10px] text-stone-400">Reporting period</span>
              <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">{period}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
