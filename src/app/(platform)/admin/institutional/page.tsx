'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2, DollarSign, Briefcase, TrendingUp, TrendingDown, Shield,
  AlertTriangle, Search, X, Plus, FileText, Zap, Download, Brain,
  LayoutGrid, List, Eye, CheckCircle2, Play, RefreshCw, ChevronRight,
  BarChart3, Activity, Globe, Users,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell,
} from 'recharts';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type ClientType = 'sovereign' | 'pension' | 'family' | 'reit' | 'pe';
type RiskAppetite = 'conservative' | 'balanced' | 'aggressive';
type ComplianceStatus = 'compliant' | 'warning' | 'breach';

interface Client {
  id: string;
  name: string;
  type: ClientType;
  country: string;
  flag: string;
  aum: number;
  aumLabel: string;
  portfolios: number;
  ytdReturn: number;
  risk: RiskAppetite;
  compliance: ComplianceStatus;
  owner: string;
  joined: string;
  commitment: string;
  mandate: string;
  eq: number; fi: number; re: number; alts: number; cash: number;
}

interface StressScenario {
  id: string; name: string; desc: string;
  drawdown: string; recovery: number; impacted: number;
  level: 'low' | 'medium' | 'high' | 'critical';
}

/* ═══════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════ */
const CLIENTS: Client[] = [
  { id: 'c1', name: 'Abu Dhabi Sovereign Wealth', type: 'sovereign', country: 'UAE', flag: '🇦🇪', aum: 1_200_000_000, aumLabel: '$1.2B', portfolios: 4, ytdReturn: 8.4, risk: 'conservative', compliance: 'compliant', owner: 'Sarah Al-Rashid', joined: '2019-03', commitment: '$1.5B', mandate: 'Multi-Asset', eq: 35, fi: 30, re: 20, alts: 10, cash: 5 },
  { id: 'c2', name: 'Nordic Pension Fund', type: 'pension', country: 'Norway', flag: '🇳🇴', aum: 800_000_000, aumLabel: '$800M', portfolios: 2, ytdReturn: 6.1, risk: 'conservative', compliance: 'compliant', owner: 'Erik Nordström', joined: '2020-07', commitment: '$900M', mandate: 'Fixed Income', eq: 25, fi: 45, re: 15, alts: 8, cash: 7 },
  { id: 'c3', name: 'Meridian Family Office', type: 'family', country: 'Singapore', flag: '🇸🇬', aum: 450_000_000, aumLabel: '$450M', portfolios: 3, ytdReturn: 11.2, risk: 'balanced', compliance: 'compliant', owner: 'James Chen', joined: '2021-01', commitment: '$500M', mandate: 'Growth Equity', eq: 50, fi: 15, re: 15, alts: 15, cash: 5 },
  { id: 'c4', name: 'Thames REIT Manager', type: 'reit', country: 'UK', flag: '🇬🇧', aum: 600_000_000, aumLabel: '$600M', portfolios: 2, ytdReturn: 7.8, risk: 'balanced', compliance: 'warning', owner: 'David Whitmore', joined: '2020-11', commitment: '$650M', mandate: 'Real Estate Core', eq: 10, fi: 20, re: 55, alts: 10, cash: 5 },
  { id: 'c5', name: 'Apex Private Equity', type: 'pe', country: 'USA', flag: '🇺🇸', aum: 1_750_000_000, aumLabel: '$1.75B', portfolios: 1, ytdReturn: 14.3, risk: 'aggressive', compliance: 'compliant', owner: 'Michael Torres', joined: '2018-05', commitment: '$2B', mandate: 'Private Equity', eq: 15, fi: 5, re: 10, alts: 65, cash: 5 },
  { id: 'c6', name: 'Zurich Capital Partners', type: 'family', country: 'Switzerland', flag: '🇨🇭', aum: 320_000_000, aumLabel: '$320M', portfolios: 2, ytdReturn: 9.5, risk: 'balanced', compliance: 'compliant', owner: 'Anna Berger', joined: '2022-03', commitment: '$400M', mandate: 'Balanced Growth', eq: 40, fi: 25, re: 15, alts: 12, cash: 8 },
  { id: 'c7', name: 'Pacific Basin Sovereign', type: 'sovereign', country: 'Japan', flag: '🇯🇵', aum: 950_000_000, aumLabel: '$950M', portfolios: 3, ytdReturn: 5.8, risk: 'conservative', compliance: 'compliant', owner: 'Yuki Tanaka', joined: '2019-09', commitment: '$1.1B', mandate: 'Conservative Multi-Asset', eq: 20, fi: 50, re: 15, alts: 5, cash: 10 },
  { id: 'c8', name: 'Horizon Infrastructure Fund', type: 'pension', country: 'Canada', flag: '🇨🇦', aum: 530_000_000, aumLabel: '$530M', portfolios: 2, ytdReturn: 8.9, risk: 'balanced', compliance: 'compliant', owner: 'Claire Dubois', joined: '2024-01', commitment: '$600M', mandate: 'Infrastructure', eq: 15, fi: 25, re: 30, alts: 25, cash: 5 },
];

const SCENARIOS: StressScenario[] = [
  { id: 's1', name: 'Interest Rate Shock', desc: '+300bps across all maturities', drawdown: '-8.2%', recovery: 14, impacted: 9, level: 'high' },
  { id: 's2', name: 'Liquidity Crisis', desc: 'Severe credit market freeze', drawdown: '-15.6%', recovery: 22, impacted: 12, level: 'critical' },
  { id: 's3', name: 'Recession Scenario', desc: 'Global GDP contraction of -2.5%', drawdown: '-18.3%', recovery: 28, impacted: 12, level: 'critical' },
];

const MO = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const AUM_DATA = MO.map((m, i) => ({ m, v: +(3.9 + i * 0.082).toFixed(2) }));
const RET_DATA = MO.map((m, i) => ({ m, port: +(1.2 + Math.sin(i * 0.8) * 2.5 + i * 0.3).toFixed(1), bench: +(0.8 + Math.sin(i * 0.6) * 1.8 + i * 0.25).toFixed(1) }));
const RISK_DATA = MO.map((m, i) => ({ m, vol: +(8 + Math.sin(i) * 3).toFixed(1), var95: +(5 + Math.sin(i * 0.7) * 2).toFixed(1) }));
const FLOW_DATA = MO.map((m) => ({ m, inflow: +(40 + Math.random() * 60).toFixed(0), outflow: +(-20 - Math.random() * 30).toFixed(0) }));

const ALLOC = [
  { name: 'Equities', pct: 28, color: '#8B7355' },
  { name: 'Fixed Income', pct: 27, color: '#7A6B5E' },
  { name: 'Real Estate', pct: 22, color: '#9A8B7E' },
  { name: 'Alternatives', pct: 17, color: '#C4B19A' },
  { name: 'Cash', pct: 6, color: '#D6CCBE' },
];

/* ═══════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════ */
function useCountUp(end: number, dur = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = end / (dur / 16);
    const t = setInterval(() => {
      cur += step;
      if (cur >= end) { setV(end); clearInterval(t); } else setV(Math.floor(cur));
    }, 16);
    return () => clearInterval(t);
  }, [end, dur]);
  return v;
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function Spark({ data, color = '#8B7355', w = 56, h = 24 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const mx = Math.max(...data), mn = Math.min(...data), rng = mx - mn || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - mn) / rng) * h}`).join(' ');
  return <svg width={w} height={h} className="opacity-50"><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 shadow-lg">
      <p className="text-[11px] font-medium text-[var(--fg-muted)]">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="text-[12px] font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

function Ring({ value, size = 72, stroke = 6, color = '#8B7355' }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, off = c - (value / 100) * c;
  return (
    <div className="inst-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} className="inst-ring-bg" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} className="inst-ring-fill" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-[var(--fg)]">{value}</span>
    </div>
  );
}

const TYPE_LABELS: Record<ClientType, string> = {
  sovereign: 'Sovereign', pension: 'Pension', family: 'Family Office', reit: 'REIT', pe: 'Private Equity',
};

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */
export default function InstitutionalPage() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<ClientType | 'all'>('all');
  const [filterRisk, setFilterRisk] = useState<RiskAppetite | 'all'>('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [sortBy, setSortBy] = useState<'aum' | 'return' | 'name'>('aum');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [section, setSection] = useState('clients');
  const [chartTab, setChartTab] = useState('performance');
  const [timeRange, setTimeRange] = useState('1Y');

  const [drawer, setDrawer] = useState<Client | null>(null);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [modal, setModal] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [stressRunning, setStressRunning] = useState<string | null>(null);
  const [stressResults, setStressResults] = useState<Record<string, string>>({});

  const aumVal = useCountUp(4800, 1400);
  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3200); }, []);

  const clients = useMemo(() => {
    let list = [...CLIENTS];
    if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.country.toLowerCase().includes(search.toLowerCase()));
    if (filterType !== 'all') list = list.filter(c => c.type === filterType);
    if (filterRisk !== 'all') list = list.filter(c => c.risk === filterRisk);
    if (filterCountry !== 'all') list = list.filter(c => c.country === filterCountry);
    list.sort((a, b) => {
      const cmp = sortBy === 'aum' ? a.aum - b.aum : sortBy === 'return' ? a.ytdReturn - b.ytdReturn : a.name.localeCompare(b.name);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [search, filterType, filterRisk, filterCountry, sortBy, sortDir]);

  const countries = [...new Set(CLIENTS.map(c => c.country))];

  const runStress = (s: StressScenario) => {
    setStressRunning(s.id);
    setTimeout(() => {
      setStressRunning(null);
      setStressResults(p => ({ ...p, [s.id]: `${s.name} complete — Est. drawdown ${s.drawdown}, recovery ~${s.recovery} months across ${s.impacted} portfolios.` }));
      showToast(`${s.name} simulation complete`);
    }, 2400);
  };

  const openClient = (c: Client) => { setDrawer(c); setDrawerTab('overview'); };

  const SECTIONS = [
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'stress', label: 'Stress Testing', icon: Zap },
    { id: 'compliance', label: 'Compliance', icon: Shield },
  ];

  return (
    <div className="inst-dashboard">
      <style>{`@keyframes inst-slide{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

      {/* ═══════════ HEADER ═══════════ */}
      <header className="animate-slide-up-fade">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-[var(--fg)]">Institutional Platform</h1>
            <p className="mt-1 text-[13px] text-[var(--fg-muted)] max-w-lg">
              Manage institutional portfolios, mandates, capital growth, and risk intelligence.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[`₹${(aumVal / 1000).toFixed(1)}B AUM`, '8 Clients', '+9.7% Avg Return', '0 Breaches'].map((chip, i) => (
                <span key={i} className="adm-live-badge">
                  <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-stone-500' : i === 3 ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                  {chip}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setModal('add')} className="inst-btn inst-btn-primary"><Plus className="h-3.5 w-3.5" /> Add Institution</button>
            <button onClick={() => setModal('report')} className="inst-btn inst-btn-secondary"><FileText className="h-3.5 w-3.5" /> Report</button>
            <button onClick={() => setSection('stress')} className="inst-btn inst-btn-secondary"><Zap className="h-3.5 w-3.5" /> Stress Test</button>
            <button onClick={() => showToast('Data exported to CSV')} className="inst-btn inst-btn-secondary"><Download className="h-3.5 w-3.5" /> Export</button>
            <button onClick={() => showToast('AI analysis running...')} className="inst-btn inst-btn-secondary"><Brain className="h-3.5 w-3.5" /> AI Insights</button>
          </div>
        </div>
      </header>

      {/* ═══════════ KPI (4 large cards) ═══════════ */}
      <div className="mt-8 grid gap-5 grid-cols-2 lg:grid-cols-4 animate-slide-up-fade animate-stagger-1">
        {[
          { title: 'Total AUM', value: `₹${(aumVal / 1000).toFixed(1)}B`, sub: '+8.4% year-over-year', icon: DollarSign, spark: [3.9, 4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8] },
          { title: 'Active Institutions', value: '8', sub: '+1 this quarter', icon: Building2, spark: [5, 5, 6, 6, 7, 7, 7, 8] },
          { title: 'Portfolio Performance', value: '+9.7%', sub: 'Weighted avg YTD return', icon: TrendingUp, spark: [5.2, 6.1, 7.0, 7.8, 8.4, 9.0, 9.3, 9.7] },
          { title: 'Risk Health', value: '82', sub: 'Moderate — Healthy range', icon: Shield, spark: [75, 78, 80, 79, 81, 82, 82, 82] },
        ].map((kpi, i) => (
          <div key={i} className="inst-kpi">
            <div className="flex items-center justify-between">
              <div className="inst-kpi-icon"><kpi.icon className="h-[18px] w-[18px]" /></div>
              <Spark data={kpi.spark} />
            </div>
            <p className="inst-kpi-val">{kpi.value}</p>
            <p className="inst-kpi-label">{kpi.title}</p>
            <p className="inst-kpi-sub">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ═══════════ SECTION TABS ═══════════ */}
      <div className="mt-8 flex flex-wrap gap-2 animate-slide-up-fade animate-stagger-2">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} className={`inst-tab ${section === s.id ? 'active' : ''}`}>
            <s.icon className="h-3.5 w-3.5" /> {s.label}
          </button>
        ))}
      </div>

      {/* ═══════════ 72 / 28 LAYOUT ═══════════ */}
      <div className="mt-6 flex flex-col lg:flex-row gap-6 animate-slide-up-fade animate-stagger-3">

        {/* ━━━ MAIN ━━━ */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* ── CLIENTS ── */}
          {section === 'clients' && (
            <>
              {/* Filter bar */}
              <div className="inst-surface flex flex-wrap gap-3 items-center sticky top-0 z-10">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institutions..."
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] py-2.5 pl-9 pr-3 text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500/40 transition-all" />
                </div>
                {[
                  { val: filterType, set: (v: string) => setFilterType(v as any), opts: [['all', 'All Types'], ['sovereign', 'Sovereign'], ['pension', 'Pension'], ['family', 'Family Office'], ['reit', 'REIT'], ['pe', 'Private Equity']] },
                  { val: filterRisk, set: (v: string) => setFilterRisk(v as any), opts: [['all', 'All Risk'], ['conservative', 'Conservative'], ['balanced', 'Balanced'], ['aggressive', 'Aggressive']] },
                  { val: filterCountry, set: (v: string) => setFilterCountry(v), opts: [['all', 'All Countries'], ...countries.map(c => [c, c])] },
                  { val: sortBy, set: (v: string) => setSortBy(v as any), opts: [['aum', 'Sort: AUM'], ['return', 'Sort: Return'], ['name', 'Sort: Name']] },
                ].map((f, i) => (
                  <select key={i} value={f.val} onChange={e => f.set(e.target.value)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[12px] font-medium text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-stone-500/20 transition-all cursor-pointer">
                    {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                ))}
                <div className="flex gap-0.5 rounded-xl border border-[var(--border)] p-0.5 bg-[var(--bg)]">
                  {(['grid', 'list'] as const).map(m => (
                    <button key={m} onClick={() => setViewMode(m)}
                      className={`rounded-lg p-2 transition-all ${viewMode === m ? 'bg-[var(--bg-secondary)] text-[var(--fg)]' : 'text-[var(--fg-muted)]'}`}>
                      {m === 'grid' ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client cards (grid) */}
              {viewMode === 'grid' ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {clients.map(c => (
                    <div key={c.id} className="inst-card" onClick={() => openClient(c)}>
                      {/* Top row */}
                      <div className="flex items-center gap-3">
                        <span className="text-xl leading-none">{c.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-[var(--fg)] truncate">{c.name}</p>
                          <p className="text-[11px] text-[var(--fg-muted)]">{c.country}</p>
                        </div>
                        <span className="inst-tag">{TYPE_LABELS[c.type]}</span>
                      </div>

                      {/* Metrics row */}
                      <div className="mt-5 grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">AUM</p>
                          <p className="text-[16px] font-bold text-[var(--fg)] mt-0.5">{c.aumLabel}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Return</p>
                          <p className={`text-[16px] font-bold mt-0.5 ${c.ytdReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {c.ytdReturn >= 0 ? '+' : ''}{c.ytdReturn}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Portfolios</p>
                          <p className="text-[16px] font-bold text-[var(--fg)] mt-0.5">{c.portfolios}</p>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="mt-4 flex items-center gap-2">
                        <span className={`inst-tag ${c.risk === 'conservative' ? '' : c.risk === 'balanced' ? 'indigo' : 'warn'}`}>{c.risk}</span>
                        <span className={`inst-tag ${c.compliance === 'compliant' ? 'success' : c.compliance === 'warning' ? 'warn' : 'danger'}`}>
                          {c.compliance === 'compliant' && <CheckCircle2 className="h-3 w-3" />}
                          {c.compliance === 'warning' && <AlertTriangle className="h-3 w-3" />}
                          {c.compliance}
                        </span>
                      </div>

                      {/* Hover actions */}
                      <div className="inst-hover-actions mt-4 flex gap-2 pt-3 border-t border-[var(--border)]">
                        <button className="inst-btn inst-btn-ghost text-[11px]" onClick={e => { e.stopPropagation(); openClient(c); }}>
                          <Eye className="h-3 w-3" /> Profile
                        </button>
                        <button className="inst-btn inst-btn-ghost text-[11px]" onClick={e => { e.stopPropagation(); showToast(`Report generated for ${c.name}`); }}>
                          <FileText className="h-3 w-3" /> Report
                        </button>
                        <button className="inst-btn inst-btn-ghost text-[11px]" onClick={e => { e.stopPropagation(); showToast('More actions'); }}>
                          <ChevronRight className="h-3 w-3" /> More
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Client list */
                <div className="inst-surface overflow-hidden !p-0">
                  <div className="hidden lg:grid grid-cols-[2fr_1fr_0.8fr_1fr_0.6fr_0.7fr_80px] gap-4 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-muted)] border-b border-[var(--border)]">
                    <span>Institution</span><span>Type</span><span>AUM</span><span>Return</span><span>Risk</span><span>Compliance</span><span />
                  </div>
                  {clients.map(c => (
                    <div key={c.id} onClick={() => openClient(c)}
                      className="hidden lg:grid grid-cols-[2fr_1fr_0.8fr_1fr_0.6fr_0.7fr_80px] gap-4 items-center px-5 py-4 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg">{c.flag}</span>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[var(--fg)] truncate">{c.name}</p>
                          <p className="text-[11px] text-[var(--fg-muted)]">{c.country}</p>
                        </div>
                      </div>
                      <span className="inst-tag w-fit">{TYPE_LABELS[c.type]}</span>
                      <span className="text-[13px] font-semibold text-[var(--fg)]">{c.aumLabel}</span>
                      <span className={`text-[13px] font-semibold ${c.ytdReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {c.ytdReturn >= 0 ? '+' : ''}{c.ytdReturn}%
                      </span>
                      <span className="inst-tag w-fit text-[10px]">{c.risk}</span>
                      <span className={`inst-tag w-fit text-[10px] ${c.compliance === 'compliant' ? 'success' : 'warn'}`}>{c.compliance}</span>
                      <button className="inst-btn inst-btn-ghost text-[11px] justify-self-end" onClick={e => { e.stopPropagation(); openClient(c); }}>
                        <Eye className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {/* Mobile fallback */}
                  <div className="lg:hidden divide-y divide-[var(--border)]">
                    {clients.map(c => (
                      <div key={c.id} className="p-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => openClient(c)}>
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{c.flag}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-[var(--fg)] truncate">{c.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[12px] text-[var(--fg-muted)]">{c.aumLabel}</span>
                              <span className={`text-[12px] font-semibold ${c.ytdReturn >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{c.ytdReturn >= 0 ? '+' : ''}{c.ytdReturn}%</span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-[var(--fg-muted)]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {clients.length === 0 && (
                <div className="inst-surface py-16 text-center">
                  <Building2 className="h-8 w-8 mx-auto text-[var(--fg-muted)] opacity-25" />
                  <p className="mt-3 text-[13px] text-[var(--fg-muted)]">No institutions match your filters</p>
                </div>
              )}
            </>
          )}

          {/* ── ANALYTICS ── */}
          {section === 'analytics' && (
            <div className="space-y-5">
              <div className="inst-surface">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div className="flex gap-1.5">
                    {['performance', 'allocation', 'risk', 'cashflow'].map(t => (
                      <button key={t} onClick={() => setChartTab(t)} className={`inst-tab ${chartTab === t ? 'active' : ''}`}>
                        {t === 'performance' ? 'Performance' : t === 'allocation' ? 'Allocation' : t === 'risk' ? 'Risk' : 'Cash Flow'}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    {['1M', '3M', '6M', '1Y', '3Y'].map(r => (
                      <button key={r} onClick={() => setTimeRange(r)}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${timeRange === r ? 'bg-stone-50 text-stone-600 dark:bg-stone-500/10 dark:text-stone-400' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {chartTab !== 'allocation' ? (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartTab === 'performance' ? (
                        <AreaChart data={RET_DATA}>
                          <defs>
                            <linearGradient id="instPerf" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B7355" stopOpacity={0.12} />
                              <stop offset="95%" stopColor="#8B7355" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="m" stroke="var(--fg-muted)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="var(--fg-muted)" tick={{ fontSize: 11 }} />
                          <RTooltip content={<ChartTip />} />
                          <Area type="monotone" dataKey="port" name="Portfolio %" stroke="#8B7355" fill="url(#instPerf)" strokeWidth={2} />
                          <Line type="monotone" dataKey="bench" name="Benchmark %" stroke="#9A8B7E" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                        </AreaChart>
                      ) : chartTab === 'risk' ? (
                        <AreaChart data={RISK_DATA}>
                          <defs>
                            <linearGradient id="instVol" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.12} />
                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="m" stroke="var(--fg-muted)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="var(--fg-muted)" tick={{ fontSize: 11 }} />
                          <RTooltip content={<ChartTip />} />
                          <Area type="monotone" dataKey="vol" name="Volatility %" stroke="#F59E0B" fill="url(#instVol)" strokeWidth={2} />
                          <Line type="monotone" dataKey="var95" name="VaR 95%" stroke="#9A8B7E" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                        </AreaChart>
                      ) : (
                        <BarChart data={FLOW_DATA}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="m" stroke="var(--fg-muted)" tick={{ fontSize: 11 }} />
                          <YAxis stroke="var(--fg-muted)" tick={{ fontSize: 11 }} />
                          <RTooltip content={<ChartTip />} />
                          <Bar dataKey="inflow" name="Inflow ($M)" fill="#8B7355" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="outflow" name="Outflow ($M)" fill="#D6CCBE" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row items-center gap-8">
                    <div className="h-[260px] w-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RPieChart>
                          <Pie data={ALLOC} cx="50%" cy="50%" innerRadius={70} outerRadius={115} paddingAngle={2} dataKey="pct" stroke="none">
                            {ALLOC.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <RTooltip content={<ChartTip />} />
                        </RPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3 flex-1">
                      {ALLOC.map(a => (
                        <div key={a.name}>
                          <div className="flex justify-between text-[12px] mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                              <span className="font-medium text-[var(--fg)]">{a.name}</span>
                            </div>
                            <span className="font-bold text-[var(--fg)]">{a.pct}%</span>
                          </div>
                          <div className="inst-bar-track">
                            <div className="inst-bar-fill" style={{ width: `${a.pct}%`, background: a.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Geographic exposure */}
              <div className="inst-surface">
                <h3 className="text-[14px] font-semibold text-[var(--fg)] mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-stone-500" /> Geographic Exposure
                </h3>
                <div className="space-y-3">
                  {[
                    { r: 'North America', p: 32 }, { r: 'Europe', p: 28 }, { r: 'Asia Pacific', p: 22 },
                    { r: 'Middle East', p: 12 }, { r: 'Other', p: 6 },
                  ].map(g => (
                    <div key={g.r}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-[var(--fg-muted)]">{g.r}</span>
                        <span className="font-semibold text-[var(--fg)]">{g.p}%</span>
                      </div>
                      <div className="inst-bar-track">
                        <div className="inst-bar-fill" style={{ width: `${g.p}%`, background: '#8B7355', opacity: 0.3 + (g.p / 50) }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STRESS TESTING ── */}
          {section === 'stress' && (
            <div className="inst-surface">
              <h3 className="text-[16px] font-semibold text-[var(--fg)] mb-1">Stress Test Simulator</h3>
              <p className="text-[13px] text-[var(--fg-muted)] mb-6">Monte Carlo simulation across all institutional portfolios under adverse market conditions.</p>
              <div className="space-y-4">
                {SCENARIOS.map(s => (
                  <div key={s.id} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg)] transition-all hover:border-stone-500/15">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-[14px] font-semibold text-[var(--fg)]">{s.name}</h4>
                        <p className="text-[12px] text-[var(--fg-muted)] mt-0.5">{s.desc}</p>
                        <div className="flex flex-wrap gap-4 mt-3">
                          {[
                            { l: 'Drawdown', v: s.drawdown, cl: 'text-red-500' },
                            { l: 'Recovery', v: `${s.recovery} months`, cl: 'text-[var(--fg)]' },
                            { l: 'Impacted', v: `${s.impacted} portfolios`, cl: 'text-[var(--fg)]' },
                          ].map(m => (
                            <div key={m.l}>
                              <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">{m.l}</p>
                              <p className={`text-[14px] font-bold mt-0.5 ${m.cl}`}>{m.v}</p>
                            </div>
                          ))}
                          <div>
                            <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wide">Risk</p>
                            <span className={`inst-tag mt-0.5 ${s.level === 'critical' ? 'danger' : s.level === 'high' ? 'warn' : ''}`}>{s.level}</span>
                          </div>
                        </div>
                        {stressResults[s.id] && (
                          <div className="inst-stress-result pass mt-4">
                            <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5" />{stressResults[s.id]}
                          </div>
                        )}
                      </div>
                      <button onClick={() => runStress(s)} disabled={stressRunning === s.id}
                        className={`inst-btn shrink-0 ${stressRunning === s.id ? 'inst-btn-secondary opacity-60 cursor-wait' : 'inst-btn-primary'}`}>
                        {stressRunning === s.id
                          ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Simulating...</>
                          : <><Play className="h-3.5 w-3.5" /> Run Test</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── COMPLIANCE ── */}
          {section === 'compliance' && (
            <div className="space-y-5">
              <div className="inst-surface">
                <h3 className="text-[16px] font-semibold text-[var(--fg)] mb-1">Mandates & Compliance</h3>
                <p className="text-[13px] text-[var(--fg-muted)] mb-5">Investment mandate compliance, exposure limits, ESG rules, and audit readiness.</p>
                <div className="divide-y divide-[var(--border)]">
                  {([
                    { rule: 'Investment Mandate Limits', status: 'compliant' as ComplianceStatus, detail: 'All portfolios within mandate bounds' },
                    { rule: 'Exposure Concentration', status: 'warning' as ComplianceStatus, detail: 'Thames REIT at 87% GBP limit' },
                    { rule: 'ESG Scoring Requirements', status: 'compliant' as ComplianceStatus, detail: 'Average ESG score: 72/100' },
                    { rule: 'Jurisdiction Restrictions', status: 'compliant' as ComplianceStatus, detail: 'No restricted-jurisdiction holdings' },
                    { rule: 'Alternative Allocation Cap', status: 'warning' as ComplianceStatus, detail: 'Apex PE at 65% (limit: 60%)' },
                    { rule: 'Restricted Asset Classes', status: 'compliant' as ComplianceStatus, detail: 'Zero exposure to restricted assets' },
                    { rule: 'Audit Readiness', status: 'compliant' as ComplianceStatus, detail: 'Last audit: 2026-Q1 — passed' },
                  ]).map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-4 gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--fg)]">{r.rule}</p>
                        <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{r.detail}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inst-tag ${r.status === 'compliant' ? 'success' : r.status === 'warning' ? 'warn' : 'danger'}`}>
                          {r.status === 'compliant' ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          {r.status}
                        </span>
                        {r.status !== 'compliant' && (
                          <button onClick={() => showToast(`Reviewing: ${r.rule}`)} className="inst-btn inst-btn-ghost text-[11px]">Review</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid gap-4 grid-cols-3">
                {[
                  { label: 'Compliant', count: 5, color: '#059669' },
                  { label: 'Warnings', count: 2, color: '#D97706' },
                  { label: 'Breaches', count: 0, color: '#DC2626' },
                ].map(s => (
                  <div key={s.label} className="inst-surface text-center py-6">
                    <p className="text-[28px] font-bold" style={{ color: s.color }}>{s.count}</p>
                    <p className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ━━━ RIGHT RAIL ━━━ */}
        <div className="w-full lg:w-[300px] lg:sticky lg:top-6 lg:self-start space-y-4">

          {/* Growth Opportunities */}
          <div className="inst-rail">
            <p className="text-[12px] font-bold tracking-wide text-[var(--fg)] uppercase mb-3">
              <TrendingUp className="h-3.5 w-3.5 inline mr-1.5 text-emerald-500" />Growth Opportunities
            </p>
            <div className="space-y-3">
              {[
                'Meridian Family Office eligible for new growth strategy — projected +2.3% uplift',
                'Nordic Pension underallocated to alternatives by 7pp — diversification opportunity',
                'Zurich Capital approaching ₹400 Cr mandate expansion threshold',
              ].map((t, i) => (
                <p key={i} className="text-[12px] text-[var(--fg-muted)] leading-relaxed pl-3 border-l-2 border-stone-500/20">{t}</p>
              ))}
            </div>
          </div>

          {/* Risk Radar */}
          <div className="inst-rail">
            <p className="text-[12px] font-bold tracking-wide text-[var(--fg)] uppercase mb-3">
              <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5 text-amber-500" />Risk Radar
            </p>
            <div className="space-y-3">
              {[
                { text: 'Thames REIT at 87% GBP concentration limit', severity: 'warn' },
                { text: 'Apex PE alternative allocation at 65% (cap: 60%)', severity: 'warn' },
                { text: 'JPY positions unhedged across 3 portfolios', severity: '' },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${r.severity === 'warn' ? 'bg-amber-500' : 'bg-stone-400'}`} />
                  <p className="text-[12px] text-[var(--fg-muted)] leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Summary */}
          <div className="inst-rail">
            <p className="text-[12px] font-bold tracking-wide text-[var(--fg)] uppercase mb-3">
              <BarChart3 className="h-3.5 w-3.5 inline mr-1.5 text-stone-500" />Executive Summary
            </p>
            <div className="space-y-2.5">
              {[
                { m: 'AUM Growth', v: '+6.2%' },
                { m: 'Compliance', v: '0 breaches' },
                { m: 'New Mandates', v: '2' },
                { m: 'Avg Return', v: '+9.7%' },
                { m: 'Client NPS', v: '88 / 100' },
              ].map(r => (
                <div key={r.m} className="flex items-center justify-between py-1">
                  <span className="text-[12px] text-[var(--fg-muted)]">{r.m}</span>
                  <span className="text-[12px] font-bold text-[var(--fg)]">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ DRAWER ═══════════ */}
      {drawer && (
        <>
          <div className="inst-drawer-backdrop" onClick={() => setDrawer(null)} />
          <div className="inst-drawer" style={{ animation: 'inst-slide 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            {/* Drawer header */}
            <div className="sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)] px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{drawer.flag}</span>
                  <div>
                    <h2 className="text-[16px] font-bold text-[var(--fg)]">{drawer.name}</h2>
                    <p className="text-[12px] text-[var(--fg-muted)] mt-0.5">{TYPE_LABELS[drawer.type]} — {drawer.country}</p>
                  </div>
                </div>
                <button onClick={() => setDrawer(null)} className="rounded-xl p-2 hover:bg-[var(--bg-secondary)] transition-colors">
                  <X className="h-4 w-4 text-[var(--fg-muted)]" />
                </button>
              </div>
              <div className="flex gap-1.5 mt-4 overflow-x-auto">
                {['overview', 'portfolios', 'performance', 'risk', 'documents', 'contacts', 'activity'].map(t => (
                  <button key={t} onClick={() => setDrawerTab(t)} className={`inst-tab whitespace-nowrap text-[12px] ${drawerTab === t ? 'active' : ''}`}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer body */}
            <div className="p-6 space-y-5">
              {drawerTab === 'overview' && (
                <>
                  <div className="grid grid-cols-2 gap-5">
                    {[
                      { l: 'AUM', v: drawer.aumLabel },
                      { l: 'Portfolios', v: drawer.portfolios.toString() },
                      { l: 'YTD Return', v: `${drawer.ytdReturn >= 0 ? '+' : ''}${drawer.ytdReturn}%` },
                      { l: 'Risk Profile', v: drawer.risk },
                      { l: 'Commitment', v: drawer.commitment },
                      { l: 'Relationship Manager', v: drawer.owner },
                      { l: 'Mandate', v: drawer.mandate },
                      { l: 'Joined', v: drawer.joined },
                    ].map(f => (
                      <div key={f.l}>
                        <p className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide">{f.l}</p>
                        <p className="text-[15px] font-bold text-[var(--fg)] mt-1">{f.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-[var(--border)]">
                    <p className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase mb-2">Mandate Summary</p>
                    <p className="text-[13px] text-[var(--fg)] leading-relaxed">
                      {drawer.mandate} mandate with {drawer.risk} risk appetite. Capital commitment of {drawer.commitment}, current AUM at {drawer.aumLabel}. Managed by {drawer.owner} since {drawer.joined}.
                    </p>
                  </div>
                </>
              )}

              {drawerTab === 'portfolios' && (
                <div className="space-y-3">
                  {Array.from({ length: drawer.portfolios }, (_, i) => (
                    <div key={i} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[13px] font-semibold text-[var(--fg)]">Portfolio {i + 1}</p>
                        <span className="inst-tag success">Active</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><p className="text-[10px] text-[var(--fg-muted)] uppercase">AUM</p><p className="text-[14px] font-bold text-[var(--fg)]">₹{(drawer.aum / drawer.portfolios / 1e6).toFixed(0)}M</p></div>
                        <div><p className="text-[10px] text-[var(--fg-muted)] uppercase">Return</p><p className="text-[14px] font-bold text-emerald-600">+{(drawer.ytdReturn + (i * 0.8 - 0.4)).toFixed(1)}%</p></div>
                        <div><p className="text-[10px] text-[var(--fg-muted)] uppercase">Strategy</p><p className="text-[13px] font-medium text-[var(--fg)]">{drawer.mandate}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'performance' && (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={RET_DATA}>
                      <defs>
                        <linearGradient id="drPerf" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B7355" stopOpacity={0.12} />
                          <stop offset="95%" stopColor="#8B7355" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="m" stroke="var(--fg-muted)" tick={{ fontSize: 11 }} />
                      <YAxis stroke="var(--fg-muted)" tick={{ fontSize: 11 }} />
                      <RTooltip content={<ChartTip />} />
                      <Area type="monotone" dataKey="port" name="Return %" stroke="#8B7355" fill="url(#drPerf)" strokeWidth={2} />
                      <Line type="monotone" dataKey="bench" name="Benchmark %" stroke="#9A8B7E" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {drawerTab === 'risk' && (
                <div className="space-y-3">
                  <h4 className="text-[13px] font-semibold text-[var(--fg)]">Asset Allocation</h4>
                  {[
                    { l: 'Equities', p: drawer.eq }, { l: 'Fixed Income', p: drawer.fi },
                    { l: 'Real Estate', p: drawer.re }, { l: 'Alternatives', p: drawer.alts },
                    { l: 'Cash', p: drawer.cash },
                  ].map(a => (
                    <div key={a.l}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-[var(--fg-muted)]">{a.l}</span>
                        <span className="font-semibold text-[var(--fg)]">{a.p}%</span>
                      </div>
                      <div className="inst-bar-track"><div className="inst-bar-fill bg-stone-500" style={{ width: `${a.p}%`, opacity: 0.4 + (a.p / 100) }} /></div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'documents' && (
                <div className="space-y-2">
                  {['Q1 2026 Performance Report', 'Investment Policy Statement', 'Mandate Agreement', 'ESG Compliance Certificate', 'Annual Audit Report 2025'].map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                      <div className="flex items-center gap-2.5">
                        <FileText className="h-4 w-4 text-[var(--fg-muted)]" />
                        <span className="text-[12px] font-medium text-[var(--fg)]">{d}</span>
                      </div>
                      <button onClick={() => showToast(`Downloading: ${d}`)} className="text-[11px] font-semibold text-stone-600 hover:text-stone-700">Download</button>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'contacts' && (
                <div className="space-y-2">
                  {[
                    { n: drawer.owner, r: 'Relationship Manager' },
                    { n: 'Operations Team', r: 'Back Office' },
                    { n: 'Compliance Officer', r: 'Governance' },
                  ].map((c, i) => (
                    <div key={i} className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                      <p className="text-[13px] font-semibold text-[var(--fg)]">{c.n}</p>
                      <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{c.r}</p>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'activity' && (
                <div className="space-y-2">
                  {[
                    { a: 'Performance report generated', t: '2h ago' },
                    { a: 'Allocation rebalanced', t: '3d ago' },
                    { a: 'Mandate terms updated', t: '1w ago' },
                    { a: 'Capital contribution received', t: '2w ago' },
                    { a: 'Quarterly review meeting', t: '1mo ago' },
                  ].map((act, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                      <Activity className="h-4 w-4 text-[var(--fg-muted)]" />
                      <div className="flex-1">
                        <p className="text-[12px] font-medium text-[var(--fg)]">{act.a}</p>
                        <p className="text-[10px] text-[var(--fg-muted)]">{act.t}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div className="sticky bottom-0 bg-[var(--bg)] border-t border-[var(--border)] px-6 py-4 flex gap-2">
              <button onClick={() => showToast(`Report generated for ${drawer.name}`)}
                className="inst-btn inst-btn-primary flex-1 justify-center">
                <FileText className="h-3.5 w-3.5" /> Generate Report
              </button>
              <button onClick={() => showToast(`Exported ${drawer.name} data`)}
                className="inst-btn inst-btn-secondary">
                <Download className="h-3.5 w-3.5" /> Export
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════════ MODALS ═══════════ */}
      {modal && (
        <div className="inst-modal-overlay" onClick={() => setModal(null)}>
          <div className="inst-modal" onClick={e => e.stopPropagation()}>
            {modal === 'add' && (
              <>
                <h2 className="text-[17px] font-bold text-[var(--fg)]">Add Institution</h2>
                <p className="text-[13px] text-[var(--fg-muted)] mt-1 mb-6">Register a new institutional client to the platform.</p>
                <div className="space-y-4">
                  {[
                    { l: 'Institution Name', p: 'e.g., Northern Trust' },
                    { l: 'Type', p: 'Sovereign / Pension / Family Office / REIT / PE' },
                    { l: 'Country', p: 'e.g., United States' },
                    { l: 'Initial AUM', p: 'e.g., ₹500 Cr' },
                    { l: 'Relationship Owner', p: 'e.g., Sarah Johnson' },
                  ].map(f => (
                    <div key={f.l}>
                      <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide">{f.l}</label>
                      <input placeholder={f.p}
                        className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-[13px] text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500/40 transition-all" />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setModal(null); showToast('Institution added successfully'); }}
                    className="inst-btn inst-btn-primary flex-1 justify-center py-3">Add Institution</button>
                  <button onClick={() => setModal(null)} className="inst-btn inst-btn-secondary py-3">Cancel</button>
                </div>
              </>
            )}
            {modal === 'report' && (
              <>
                <h2 className="text-[17px] font-bold text-[var(--fg)]">Generate Report</h2>
                <p className="text-[13px] text-[var(--fg-muted)] mt-1 mb-6">Select a report type for stakeholder distribution.</p>
                <div className="space-y-2">
                  {[
                    { n: 'Executive Summary', d: 'High-level overview of all institutional performance' },
                    { n: 'Performance Pack', d: 'Returns, attribution, and benchmark comparison' },
                    { n: 'Risk Pack', d: 'VaR, stress tests, exposure analysis' },
                    { n: 'Compliance Pack', d: 'Mandate adherence, ESG scoring, audit readiness' },
                  ].map(r => (
                    <button key={r.n} onClick={() => { setModal(null); showToast(`${r.n} report generated`); }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-left hover:border-stone-500/20 hover:bg-[var(--bg-secondary)] transition-all">
                      <FileText className="h-5 w-5 text-stone-500 shrink-0" />
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--fg)]">{r.n}</p>
                        <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{r.d}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setModal(null)} className="inst-btn inst-btn-secondary w-full justify-center mt-4 py-3">Cancel</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ TOAST ═══════════ */}
      {toast && (
        <div className="inst-toast">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}
