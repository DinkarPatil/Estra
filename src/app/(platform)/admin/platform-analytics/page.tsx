'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users, DollarSign, Activity, Brain, TrendingUp, TrendingDown,
  Download, RefreshCw, Sparkles, Calendar, Search, ChevronDown,
  ChevronUp, ArrowUpRight, ArrowRight, Zap, Shield, AlertTriangle,
  BarChart3, Target, Globe, Layers, Filter, Check,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Label,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

/* ──────────────────────────────
   ANIMATED COUNT-UP HOOK
   ────────────────────────────── */

function useCountUp(target: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

/* ──────────────────────────────
   MOCK DATA
   ────────────────────────────── */

const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

const mauData = months.map((month, i) => ({
  month,
  users: 8000 + i * 550 + Math.round(Math.sin(i) * 200),
}));

const volumeData = months.map((month, i) => ({
  month,
  volume: parseFloat((1.2 + i * 0.18 + Math.random() * 0.08).toFixed(2)),
}));

const growthData = months.map((month, i) => ({
  month,
  Investor: 4000 + i * 200,
  Broker: 2000 + i * 150,
  Developer: 800 + i * 80,
}));

const revenueByModule = [
  { name: 'Transactions', value: 42 },
  { name: 'Fractional', value: 23 },
  { name: 'Institutional', value: 18 },
  { name: 'AI Services', value: 11 },
  { name: 'API Partners', value: 6 },
];

const DONUT_COLORS = ['#8B7355', '#8B7355', '#A89478', '#C4B19A', '#A89478'];

const kpiModules = [
  { module: 'Property Search', users: 9842, queries: 48210, avgSession: '7.2 min', retention: 84, growth: 12, status: 'healthy' as const },
  { module: 'Investment Portal', users: 4210, queries: 18400, avgSession: '12.1 min', retention: 91, growth: 24, status: 'healthy' as const },
  { module: 'AI Advisor', users: 6730, queries: 28400, avgSession: '9.4 min', retention: 78, growth: 31, status: 'warning' as const },
  { module: 'Broker Tools', users: 1820, queries: 9100, avgSession: '18.3 min', retention: 88, growth: 8, status: 'healthy' as const },
  { module: 'API Ecosystem', users: 320, queries: 1200000, avgSession: 'N/A', retention: 0, growth: 19, status: 'healthy' as const },
];

const AI_INSIGHTS = [
  {
    id: 1,
    icon: TrendingUp,
    color: '#4ADE80',
    label: 'User Growth',
    title: 'User signups accelerating +18% MoM',
    description: 'New user registration velocity has increased by 18% month-over-month. Investor segment leads with highest conversion from trial to paid.',
    tag: 'Growth',
  },
  {
    id: 2,
    icon: Zap,
    color: '#8B7355',
    label: 'Strongest Module',
    title: 'AI Advisor — highest engagement at 31% growth',
    description: 'AI Advisor module is the fastest growing product with 6,730 monthly active users. Session depth increased 40% after v2.3 release.',
    tag: 'Product',
  },
  {
    id: 3,
    icon: AlertTriangle,
    color: '#F59E0B',
    label: 'Retention Warning',
    title: 'AI Advisor retention dipped to 78%',
    description: 'AI Advisor 30-day retention dropped 4pp from last month. Recommend reviewing onboarding flow and adding guided tutorials for new users.',
    tag: 'Risk',
  },
  {
    id: 4,
    icon: Globe,
    color: '#A89478',
    label: 'Top Region',
    title: 'UAE accounts for 48% of total volume',
    description: 'Mumbai region drives the majority of transaction volume at ₹230 Cr monthly. Pune is fastest-growing at +34% QoQ with ₹48 Cr monthly volume.',
    tag: 'Market',
  },
];

/* Sparkline data for KPI cards */
const SPARKLINE_USERS = [
  { v: 8.2 }, { v: 8.8 }, { v: 9.1 }, { v: 9.4 }, { v: 9.8 }, { v: 10.1 },
  { v: 10.5 }, { v: 10.9 }, { v: 11.2 }, { v: 11.6 }, { v: 11.8 }, { v: 12.0 },
];
const SPARKLINE_VOLUME = [
  { v: 320 }, { v: 340 }, { v: 355 }, { v: 380 }, { v: 395 }, { v: 410 },
  { v: 425 }, { v: 440 }, { v: 455 }, { v: 460 }, { v: 470 }, { v: 480 },
];
const SPARKLINE_DEALS = [
  { v: 580 }, { v: 620 }, { v: 660 }, { v: 710 }, { v: 730 }, { v: 760 },
  { v: 780 }, { v: 800 }, { v: 810 }, { v: 825 }, { v: 838 }, { v: 847 },
];
const SPARKLINE_AI = [
  { v: 18.2 }, { v: 19.5 }, { v: 20.1 }, { v: 21.8 }, { v: 22.4 }, { v: 23.1 },
  { v: 24.0 }, { v: 25.2 }, { v: 26.0 }, { v: 27.1 }, { v: 27.8 }, { v: 28.4 },
];

/* ──────────────────────────────
   MINI COMPONENTS
   ────────────────────────────── */

function Sparkline({ data, color, height = 32 }: { data: { v: number }[]; color: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} activeDot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function AdminTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="adm-tooltip">
        <p className="text-[10px] text-white/50 mb-0.5">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-[12px] font-semibold text-white">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
            <span className="text-white/40 ml-1 text-[10px]">{p.name || p.dataKey}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function KPICard({
  title, rawValue, displayValue, change, label, icon: Icon, sparkline, sparkColor, delay,
}: {
  title: string; rawValue: number; displayValue: string; change?: number; label?: string;
  icon: any; sparkline: { v: number }[]; sparkColor: string; delay: number;
}) {
  const animated = useCountUp(rawValue, 1800);
  const formatAnimated = useCallback(() => {
    if (displayValue.includes('K')) return `${(animated / 1000).toFixed(1)}K`;
    if (displayValue.includes('M')) return `₹${animated}M`;
    return animated.toLocaleString();
  }, [animated, displayValue]);

  return (
    <div className="adm-kpi-card group" style={{ animation: `slide-up-fade 0.5s ease-out ${delay}s both` }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">{title}</p>
        <div className="adm-kpi-icon-box">
          <Icon className="h-4 w-4 text-white" strokeWidth={1.5} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="adm-kpi-value">{formatAnimated()}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className={`adm-change-badge ${change >= 0 ? 'positive' : 'negative'}`}>
                {change >= 0
                  ? <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.5} />
                  : <TrendingDown className="h-2.5 w-2.5" strokeWidth={2.5} />}
                <span>{change >= 0 ? '+' : ''}{change}%</span>
              </div>
              {label && <span className="text-[9px] text-[var(--fg-muted)]">{label}</span>}
            </div>
          )}
        </div>
        <div className="w-[76px] shrink-0 opacity-40 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkline data={sparkline} color={sparkColor} height={30} />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────
   SORT HELPERS
   ────────────────────────────── */

type SortKey = 'module' | 'users' | 'queries' | 'avgSession' | 'retention' | 'growth';
type SortDir = 'asc' | 'desc';

function sortModules(data: typeof kpiModules, key: SortKey, dir: SortDir) {
  return [...data].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
    return dir === 'asc'
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });
}

/* ──────────────────────────────
   MAIN PAGE
   ────────────────────────────── */

const RANGE_SLICES: Record<string, number> = { '7D': 1, '1M': 1, '3M': 3, '6M': 6, '12M': 12 };

export default function PlatformAnalyticsPage() {
  const [dateRange, setDateRange] = useState('12M');
  const [tableSearch, setTableSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('growth');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [tableFilter, setTableFilter] = useState<'all' | 'healthy' | 'warning'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const insightsRef = useRef<HTMLDivElement>(null);

  const sliceCount = RANGE_SLICES[dateRange] || 12;
  const slicedMau = mauData.slice(-sliceCount);
  const slicedVolume = volumeData.slice(-sliceCount);
  const slicedGrowth = growthData.slice(-sliceCount);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleExport = () => {
    const header = 'Module,Active Users,Queries,Avg Session,Retention,Growth,Status';
    const rows = kpiModules.map((m) =>
      `${m.module},${m.users},${m.queries},${m.avgSession},${m.retention}%,+${m.growth}%,${m.status}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `platform-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleAISummary = () => {
    setShowAISummary(true);
    insightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => setShowAISummary(false), 3000);
  };

  const handleViewInsights = () => {
    insightsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filteredModules = kpiModules
    .filter((m) => m.module.toLowerCase().includes(tableSearch.toLowerCase()))
    .filter((m) => tableFilter === 'all' || m.status === tableFilter);
  const sortedModules = sortModules(filteredModules, sortKey, sortDir);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 text-[var(--fg-muted)] opacity-0 group-hover/th:opacity-100 transition-opacity" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-[#8B7355]" />
      : <ChevronDown className="h-3 w-3 text-[#8B7355]" />;
  };

  return (
    <div className="adm-dashboard relative mx-auto w-full max-w-7xl">
      <div className="relative z-10 space-y-8">

        {/* ═══════ HERO HEADER ═══════ */}
        <div className="animate-stagger-1">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="adm-live-badge">
                  <span className="adm-live-dot" />
                  <span>Live Data</span>
                </div>
                <span className="text-[10px] text-[var(--fg-muted)]">Synced 12s ago</span>
              </div>
              <h1 className="adm-heading">
                Platform <span className="adm-accent-text">Analytics</span>
              </h1>
              <p className="text-[14px] text-[var(--fg-muted)] mt-2 leading-relaxed max-w-xl">
                Real-time business intelligence & operational insights across <span className="text-[var(--fg-secondary)] font-medium">all modules</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 mt-1">
              {/* Date Range */}
              <div className="adm-header-btn-group">
                {['7D', '1M', '3M', '6M', '12M'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`adm-range-btn ${dateRange === range ? 'active' : ''}`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <button type="button" className="adm-action-btn" onClick={handleExport}>
                {exportDone ? <Check className="h-3.5 w-3.5 text-[#4ADE80]" /> : <Download className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{exportDone ? 'Exported!' : 'Export'}</span>
              </button>
              <button type="button" className="adm-action-btn" onClick={handleRefresh}>
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <button type="button" className="adm-action-btn primary" onClick={handleAISummary}>
                <Brain className="h-3.5 w-3.5" />
                <span>AI Summary</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ KPI CARDS ═══════ */}
        <div className="animate-stagger-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total Users" rawValue={12000} displayValue="12K"
              change={18} label="vs last month"
              icon={Users} sparkline={SPARKLINE_USERS} sparkColor="#8B7355" delay={0.05}
            />
            <KPICard
              title="Monthly Volume" rawValue={480} displayValue="$480M"
              change={24} label="vs last month"
              icon={DollarSign} sparkline={SPARKLINE_VOLUME} sparkColor="#4ADE80" delay={0.11}
            />
            <KPICard
              title="Active Deals" rawValue={847} displayValue="847"
              change={12} label="vs last month"
              icon={Activity} sparkline={SPARKLINE_DEALS} sparkColor="#8B7355" delay={0.17}
            />
            <KPICard
              title="AI Queries / Day" rawValue={28400} displayValue="28.4K"
              change={31} label="vs last month"
              icon={Brain} sparkline={SPARKLINE_AI} sparkColor="#A89478" delay={0.23}
            />
          </div>
        </div>

        {/* ═══════ MAU AREA CHART ═══════ */}
        <div className="animate-stagger-3">
          <div className="adm-chart-card">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Monthly Active Users</h3>
                <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-0.5">Last 12 months trend</p>
              </div>
              <div className="adm-chart-badge">
                <TrendingUp className="h-3 w-3" strokeWidth={2} />
                +48% YTD
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={slicedMau}>
                <defs>
                  <linearGradient id="mauFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B7355" stopOpacity={0.15} />
                    <stop offset="50%" stopColor="#8B7355" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="#8B7355" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mauStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B7355" />
                    <stop offset="100%" stopColor="#8B7355" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<AdminTooltip />} />
                <Area type="monotone" dataKey="users" stroke="url(#mauStroke)" strokeWidth={2.5} fill="url(#mauFill)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═══════ VOLUME BAR CHART ═══════ */}
        <div className="adm-chart-card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Transaction Volume</h3>
              <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-0.5">INR Crore by month</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="adm-metric-pill">
                <DollarSign className="h-3 w-3" strokeWidth={1.5} />
                ₹480 Cr total
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={slicedVolume}>
              <defs>
                <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B7355" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#8B7355" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} tickFormatter={(v) => `${v}B`} />
              <Tooltip content={<AdminTooltip />} />
              <Bar dataKey="volume" fill="url(#barFill)" radius={[6, 6, 0, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ═══════ 2-COL: LINE + DONUT ═══════ */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* User Growth by Role */}
          <div className="adm-chart-card">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">User Growth by Role</h3>
                <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-0.5">Last 12 months</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={slicedGrowth}>
                <defs>
                  <linearGradient id="lineInvestor" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8B7355" />
                    <stop offset="100%" stopColor="#8B7355" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<AdminTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                />
                <Line type="monotone" dataKey="Investor" stroke="url(#lineInvestor)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} animationDuration={1500} />
                <Line type="monotone" dataKey="Broker" stroke="#4ADE80" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} animationDuration={1500} />
                <Line type="monotone" dataKey="Developer" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Donut */}
          <div className="adm-chart-card">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Revenue by Module</h3>
                <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-0.5">Current period</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {DONUT_COLORS.map((color, i) => (
                    <linearGradient key={i} id={`donutGrad${i}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={revenueByModule}
                  cx="50%" cy="50%"
                  innerRadius={68} outerRadius={110}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  strokeWidth={0}
                  animationDuration={1200}
                >
                  {revenueByModule.map((_, index) => (
                    <Cell key={index} fill={`url(#donutGrad${index % DONUT_COLORS.length})`} />
                  ))}
                  <Label
                    position="center"
                    content={({ viewBox }: any) => {
                      const cx = viewBox?.cx ?? 0;
                      const cy = viewBox?.cy ?? 0;
                      if (!cx && !cy) return null;
                      return (
                        <g>
                          <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--fg)" fontSize="18" fontWeight="700" letterSpacing="-0.025em">₹480M</text>
                          <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--fg-muted)" fontSize="10" letterSpacing="0.06em">TOTAL REVENUE</text>
                        </g>
                      );
                    }}
                  />
                </Pie>
                <Tooltip
                  formatter={(v) => [`${Number(v)}%`, 'Revenue Share']}
                  contentStyle={{ background: 'rgba(10, 14, 24, 0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              {revenueByModule.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-[11px] text-[var(--fg-muted)]">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: DONUT_COLORS[i] }} />
                  <span className="text-[var(--fg-secondary)]">{item.name}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ AI INSIGHTS PANEL ═══════ */}
        <div ref={insightsRef}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`adm-section-icon ${showAISummary ? 'ring-2 ring-[#8B7355]/30' : ''}`}>
                <Sparkles className={`h-3.5 w-3.5 text-[#8B7355] ${showAISummary ? 'animate-spin' : ''}`} />
              </div>
              <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">AI Business Summary</h2>
              <span className="adm-count-badge">{AI_INSIGHTS.length}</span>
              {showAISummary && (
                <span className="text-[10px] font-medium text-[#8B7355] animate-pulse">Analyzing...</span>
              )}
            </div>
            <button type="button" className="adm-text-btn" onClick={handleViewInsights}>
              View Insights
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AI_INSIGHTS.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <div
                  key={insight.id}
                  className="adm-insight-card group"
                  style={{ animation: `slide-up-fade 0.5s ease-out ${0.05 + idx * 0.06}s both` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="adm-insight-icon"
                      style={{ background: `${insight.color}12`, borderColor: `${insight.color}20` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: insight.color }} />
                    </div>
                    <span className="adm-insight-tag" style={{ color: insight.color, borderColor: `${insight.color}25`, background: `${insight.color}08` }}>
                      {insight.tag}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--fg-muted)] mb-1">{insight.label}</p>
                  <h3 className="text-[12px] font-semibold text-[var(--fg)] leading-snug mb-2 line-clamp-2">{insight.title}</h3>
                  <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed line-clamp-3">{insight.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════ MODULE KPI TABLE ═══════ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="adm-section-icon">
                <Layers className="h-3.5 w-3.5 text-[#8B7355]" />
              </div>
              <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Module KPIs</h2>
              <span className="adm-count-badge">{kpiModules.length}</span>
            </div>
          </div>

          <div className="adm-table-card">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 pb-0">
              {/* Search */}
              <div className="adm-table-search">
                <Search className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="adm-table-search-input"
                />
              </div>
              {/* Filter Chips */}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                {(['all', 'healthy', 'warning'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTableFilter(f)}
                    className={`adm-filter-chip ${tableFilter === f ? 'active' : ''}`}
                  >
                    {f === 'all' ? 'All' : f === 'healthy' ? 'Healthy' : 'Warning'}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="adm-table-head">
                    {([
                      ['module', 'Module'],
                      ['users', 'Active Users'],
                      ['queries', 'Queries'],
                      ['avgSession', 'Avg Session'],
                      ['retention', 'Retention'],
                      ['growth', 'Growth'],
                    ] as [SortKey, string][]).map(([key, label]) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className="group/th adm-table-th cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          <SortIcon col={key} />
                        </div>
                      </th>
                    ))}
                    <th className="adm-table-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedModules.map((row, idx) => (
                    <tr key={row.module} className={`adm-table-row ${idx % 2 === 1 ? 'striped' : ''}`}>
                      <td className="px-4 py-3.5 font-semibold text-[var(--fg)]">{row.module}</td>
                      <td className="px-4 py-3.5 text-[var(--fg-secondary)]">{row.users.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-[var(--fg-secondary)]">{row.queries.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-[var(--fg-secondary)]">{row.avgSession}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="adm-progress-track">
                            <div
                              className="adm-progress-fill"
                              style={{
                                width: `${row.retention}%`,
                                background: row.retention >= 85 ? '#4ADE80' : row.retention >= 75 ? '#F59E0B' : '#EF4444',
                              }}
                            />
                          </div>
                          <span className="text-[12px] font-medium text-[var(--fg)]">
                            {row.retention > 0 ? `${row.retention}%` : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 text-[#4ADE80] font-semibold">
                          <TrendingUp className="h-3 w-3" strokeWidth={2} />
                          +{row.growth}%
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`adm-status-dot ${row.status}`}>
                          <span className="adm-status-pulse" />
                          {row.status === 'healthy' ? 'Healthy' : 'Warning'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedModules.length === 0 && (
                <div className="text-center py-12 text-[var(--fg-muted)] text-sm">
                  No modules match your search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <div className="adm-footer">
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <p className="text-[10px] text-[var(--fg-muted)] tracking-[0.04em] text-center pb-4 mt-4">
            Platform analytics updated in real-time &middot; Powered by <span className="font-semibold adm-accent-text">GLIMMORA</span> Intelligence Engine
          </p>
        </div>

      </div>
    </div>
  );
}
