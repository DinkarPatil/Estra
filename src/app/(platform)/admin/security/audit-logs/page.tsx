'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Search, ChevronDown, ChevronUp, Check, Download, Filter,
  AlertTriangle, X, Clock, Activity, Zap, BarChart3, Globe, Eye,
  RefreshCw, Layers, Sparkles, TrendingUp, TrendingDown, Users,
  FileText, Lock, UserCheck, MapPin, Monitor, ChevronRight,
  Flag, Copy, Bell, Calendar, ArrowRight,
} from 'lucide-react';

/* ──────────────────────────────
   HOOK: COUNT UP
   ────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(id); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return value;
}

/* ──────────────────────────────
   MOCK DATA
   ────────────────────────────── */

interface AuditEvent {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  actionType: 'login' | 'property' | 'transaction' | 'settings' | 'security' | 'role' | 'export';
  ipAddress: string;
  device: string;
  location: string;
  country: string;
  status: 'success' | 'failed' | 'warning' | 'blocked';
  riskScore: number;
  details: string;
  changes?: { before: string; after: string };
}

const AUDIT_DATA: AuditEvent[] = [
  { id: 'al-001', timestamp: '2026-04-20 09:14:02', user: 'investor@glimmora.com', userRole: 'Investor', action: 'Login', actionType: 'login', ipAddress: '103.21.44.2', device: 'Chrome / macOS', location: 'Singapore, SG', country: 'SG', status: 'success', riskScore: 5, details: 'Email + MFA authenticated' },
  { id: 'al-002', timestamp: '2026-04-20 09:22:10', user: 'investor@glimmora.com', userRole: 'Investor', action: 'Property View', actionType: 'property', ipAddress: '103.21.44.2', device: 'Chrome / macOS', location: 'Singapore, SG', country: 'SG', status: 'success', riskScore: 2, details: 'Viewed property ID: prop-0293' },
  { id: 'al-003', timestamp: '2026-04-20 07:52:44', user: 'broker@glimmora.com', userRole: 'Broker', action: 'Transaction Create', actionType: 'transaction', ipAddress: '41.58.200.1', device: 'Safari / iOS', location: 'Lagos, NG', country: 'NG', status: 'success', riskScore: 15, details: 'Created transaction TX-8810 AED 2.4M' },
  { id: 'al-004', timestamp: '2026-04-20 06:05:18', user: 'developer@glimmora.com', userRole: 'Developer', action: 'Settings Update', actionType: 'settings', ipAddress: '49.36.100.5', device: 'Firefox / Linux', location: 'Bangalore, IN', country: 'IN', status: 'success', riskScore: 25, details: 'Updated API rate limit to 5000 req/hr', changes: { before: '2000 req/hr', after: '5000 req/hr' } },
  { id: 'al-005', timestamp: '2026-04-19 18:30:00', user: 'admin@glimmora.com', userRole: 'Admin', action: 'Role Change', actionType: 'role', ipAddress: '74.125.200.10', device: 'Chrome / Windows', location: 'New York, US', country: 'US', status: 'success', riskScore: 65, details: 'Changed user role from Pending to Investor', changes: { before: 'pending', after: 'investor' } },
  { id: 'al-006', timestamp: '2026-04-19 14:11:33', user: 'unknown@attacker.io', userRole: 'Unknown', action: 'Login Attempt', actionType: 'login', ipAddress: '185.220.101.2', device: 'cURL / Unknown', location: 'Frankfurt, DE', country: 'DE', status: 'blocked', riskScore: 95, details: 'Invalid credentials — brute force blocked after 5 attempts' },
  { id: 'al-007', timestamp: '2026-04-19 11:45:21', user: 'mfarsi@email.com', userRole: 'Investor', action: 'Property View', actionType: 'property', ipAddress: '82.101.0.44', device: 'Safari / macOS', location: 'Dubai, AE', country: 'AE', status: 'success', riskScore: 3, details: 'Viewed property ID: prop-0115' },
  { id: 'al-008', timestamp: '2026-04-18 16:22:09', user: 'admin@glimmora.com', userRole: 'Admin', action: 'Settings Update', actionType: 'settings', ipAddress: '74.125.200.10', device: 'Chrome / Windows', location: 'New York, US', country: 'US', status: 'success', riskScore: 20, details: 'Updated maintenance window schedule' },
  { id: 'al-009', timestamp: '2026-04-18 09:00:55', user: 'system', userRole: 'System', action: 'Security Block', actionType: 'security', ipAddress: '10.0.0.1', device: 'Internal', location: 'Internal', country: '-', status: 'blocked', riskScore: 88, details: 'IP blacklist match — request blocked' },
  { id: 'al-010', timestamp: '2026-04-17 08:14:00', user: 'evasquez@email.com', userRole: 'Investor', action: 'Transaction Create', actionType: 'transaction', ipAddress: '80.58.100.5', device: 'Chrome / Windows', location: 'Madrid, ES', country: 'ES', status: 'failed', riskScore: 72, details: 'Account suspended — transaction denied' },
  { id: 'al-011', timestamp: '2026-04-17 04:30:12', user: 'broker2@glimmora.com', userRole: 'Broker', action: 'Export Report', actionType: 'export', ipAddress: '203.45.67.8', device: 'Chrome / Windows', location: 'Tokyo, JP', country: 'JP', status: 'success', riskScore: 30, details: 'Exported 2,400 investor records' },
  { id: 'al-012', timestamp: '2026-04-16 22:15:33', user: 'admin@glimmora.com', userRole: 'Admin', action: 'Permission Update', actionType: 'security', ipAddress: '74.125.200.10', device: 'Chrome / Windows', location: 'New York, US', country: 'US', status: 'warning', riskScore: 55, details: 'Elevated permission outside business hours' },
];

const ACTION_TYPES = ['All', 'login', 'property', 'transaction', 'settings', 'security', 'role', 'export'];
const STATUS_OPTIONS = ['All', 'success', 'failed', 'warning', 'blocked'];
const DATE_RANGES = ['Today', '7 Days', '30 Days', '90 Days'];

const ACTION_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  login: { color: '#8B7355', bg: 'rgba(139,115,85,0.08)', icon: '🔐' },
  property: { color: '#A89478', bg: 'rgba(168,148,120,0.08)', icon: '🏠' },
  transaction: { color: '#4ADE80', bg: 'rgba(74,222,128,0.08)', icon: '💰' },
  settings: { color: '#6F5C46', bg: 'rgba(111,92,70,0.08)', icon: '⚙️' },
  security: { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', icon: '🔒' },
  role: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', icon: '👤' },
  export: { color: '#6B7280', bg: 'rgba(107,114,128,0.08)', icon: '🧾' },
};

const AI_INSIGHTS = [
  { severity: 'high', confidence: 94, title: 'Unusual login time for broker account', description: 'broker@glimmora.com logged in at 4:30 AM local time — outside normal hours', action: 'Review session' },
  { severity: 'critical', confidence: 98, title: 'Repeated failed login from Germany', description: '5 attempts from IP 185.220.101.2 using brute force pattern', action: 'Block IP range' },
  { severity: 'medium', confidence: 87, title: 'Admin role changed outside business hours', description: 'Role elevation at 6:30 PM — verify with admin@glimmora.com', action: 'Verify change' },
  { severity: 'low', confidence: 72, title: 'Dormant account became active', description: 'evasquez@email.com — no activity for 60 days, now attempting transactions', action: 'Monitor' },
  { severity: 'medium', confidence: 85, title: 'Excessive exports detected', description: 'broker2@glimmora.com exported 2,400 records in single session', action: 'Review access' },
];

const TOP_USERS = [
  { email: 'admin@glimmora.com', events: 284, trend: 'up' },
  { email: 'investor@glimmora.com', events: 156, trend: 'up' },
  { email: 'broker@glimmora.com', events: 98, trend: 'down' },
  { email: 'developer@glimmora.com', events: 67, trend: 'up' },
];

const TOP_LOCATIONS = [
  { country: 'United States', code: 'US', pct: 33 },
  { country: 'Singapore', code: 'SG', pct: 21 },
  { country: 'UAE', code: 'AE', pct: 18 },
  { country: 'United Kingdom', code: 'GB', pct: 12 },
  { country: 'Nigeria', code: 'NG', pct: 9 },
];

/* ──────────────────────────────
   SORT
   ────────────────────────────── */
type SortKey = 'timestamp' | 'user' | 'action' | 'riskScore' | 'status';
type SortDir = 'asc' | 'desc';

function sortEvents(data: AuditEvent[], key: SortKey, dir: SortDir) {
  return [...data].sort((a, b) => {
    const av = a[key]; const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
    return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
}

/* ══════════════════════════════════════
   PAGE
   ══════════════════════════════════════ */

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState('30 Days');
  const [actionFilter, setActionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('timestamp');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [showAlertRules, setShowAlertRules] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'security' | 'access' | 'changes' | 'compliance'>('all');
  const [flaggedEvents, setFlaggedEvents] = useState<Set<string>>(new Set());

  const [liveEvents, setLiveEvents] = useState(10284);
  useEffect(() => {
    const id = setInterval(() => setLiveEvents((c) => c + Math.floor(Math.random() * 3)), 5000);
    return () => clearInterval(id);
  }, []);

  const countUpEvents = useCountUp(10284);
  const countUpLogins = useCountUp(4932);
  const countUpFailed = useCountUp(73);
  const countUpSuspicious = useCountUp(12);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 text-[var(--fg-muted)] opacity-0 group-hover/th:opacity-100 transition-opacity" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-[#8B7355]" /> : <ChevronDown className="h-3 w-3 text-[#8B7355]" />;
  };

  const filtered = AUDIT_DATA
    .filter((e) => {
      if (activeTab === 'security') return e.actionType === 'security' || e.actionType === 'login';
      if (activeTab === 'access') return e.actionType === 'login';
      if (activeTab === 'changes') return e.actionType === 'settings' || e.actionType === 'role';
      return true;
    })
    .filter((e) => search === '' || e.user.toLowerCase().includes(search.toLowerCase()) || e.action.toLowerCase().includes(search.toLowerCase()) || e.details.toLowerCase().includes(search.toLowerCase()))
    .filter((e) => actionFilter === 'All' || e.actionType === actionFilter)
    .filter((e) => statusFilter === 'All' || e.status === statusFilter);
  const sorted = sortEvents(filtered, sortKey, sortDir);

  const handleExport = useCallback(() => {
    setExportingCsv(true);
    const csv = [
      ['Timestamp', 'User', 'Action', 'IP', 'Device', 'Location', 'Status', 'Risk', 'Details'].join(','),
      ...filtered.map((e) => [e.timestamp, e.user, e.action, e.ipAddress, e.device, e.location, e.status, e.riskScore, `"${e.details}"`].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit-logs-export.csv'; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExportingCsv(false), 1500);
  }, [filtered]);

  const handleRefresh = () => { setRefreshing(true); setLiveEvents((c) => c + Math.floor(Math.random() * 5) + 1); setTimeout(() => setRefreshing(false), 1200); };
  const handleFlag = (eventId: string) => { setFlaggedEvents((prev) => { const next = new Set(prev); if (next.has(eventId)) next.delete(eventId); else next.add(eventId); return next; }); };
  const riskColor = (score: number) => score >= 70 ? '#EF4444' : score >= 40 ? '#F59E0B' : score >= 15 ? '#8B7355' : '#4ADE80';

  return (
    <div className="sec-dashboard relative mx-auto w-full max-w-7xl">
      <div className="relative z-10 space-y-6">

        {/* ═══════ HERO ═══════ */}
        <div className="animate-stagger-1">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                <div className="sec-status-badge secure"><span className="sec-status-dot" /><span>Live Monitoring</span></div>
                <div className="sec-status-badge" style={{ background: 'rgba(139,115,85,0.06)', border: '1px solid rgba(139,115,85,0.15)', color: '#8B7355' }}>
                  <Activity className="h-3 w-3" /><span>{liveEvents.toLocaleString()} Events</span>
                </div>
                <div className="sec-status-badge warning"><AlertTriangle className="h-3 w-3" /><span>3 Risk Alerts</span></div>
                <span className="text-[10px] text-[var(--fg-muted)]">365-day retention &middot; Synced 30s ago</span>
              </div>
              <h1 className="sec-heading">Audit <span className="sec-accent-text">Logs</span></h1>
              <p className="text-[14px] text-[var(--fg-muted)] mt-2 leading-relaxed max-w-xl">
                Monitor platform activity, user access, security events, and compliance history in real time.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button type="button" onClick={handleRefresh} className="sec-action-btn">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /><span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <button type="button" onClick={handleExport} className="sec-action-btn">
                <Download className="h-3.5 w-3.5" /><span>{exportingCsv ? 'Done!' : 'Export'}</span>
              </button>
              <button type="button" onClick={() => setShowAlertRules(true)} className="sec-action-btn">
                <Bell className="h-3.5 w-3.5" /><span>Alerts</span>
              </button>
              <button type="button" onClick={() => setShowAiInsights(true)} className="sec-action-btn primary">
                <Sparkles className="h-3.5 w-3.5" /><span>AI Insights</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ KPIs ═══════ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.05s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Total Events</p>
              <div className="sec-kpi-icon-box blue"><Activity className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{countUpEvents.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1.5"><TrendingUp className="h-3 w-3 text-[#4ADE80]" /><span className="text-[10px] text-[#4ADE80] font-medium">+12% vs yesterday</span></div>
          </div>
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.11s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Successful Logins</p>
              <div className="sec-kpi-icon-box green"><UserCheck className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{countUpLogins.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-1.5"><TrendingUp className="h-3 w-3 text-[#4ADE80]" /><span className="text-[10px] text-[#4ADE80] font-medium">Healthy</span></div>
          </div>
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.17s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Failed Attempts</p>
              <div className="sec-kpi-icon-box red"><AlertTriangle className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{countUpFailed}</p>
            <div className="flex items-center gap-1 mt-1.5"><TrendingDown className="h-3 w-3 text-[#EF4444]" /><span className="text-[10px] text-[#EF4444] font-medium">+8 last hour</span></div>
          </div>
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.23s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Suspicious</p>
              <div className="sec-kpi-icon-box amber"><Zap className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{countUpSuspicious}</p>
            <div className="flex items-center gap-1 mt-1.5"><span className="text-[10px] text-[#F59E0B] font-medium">Needs review</span></div>
          </div>
        </div>

        {/* ═══════ TABS ═══════ */}
        <div className="flex items-center gap-1 border-b border-[var(--border)]">
          {([['all', 'All Logs'], ['security', 'Security'], ['access', 'Access'], ['changes', 'Changes'], ['compliance', 'Compliance']] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)} className={`px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${activeTab === key ? 'border-[#8B7355] text-[#8B7355]' : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* ═══════ FILTER BAR ═══════ */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="sec-table-search flex-1 min-w-[180px]">
              <Search className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
              <input type="text" placeholder="Search users, actions, IPs..." value={search} onChange={(e) => setSearch(e.target.value)} className="sec-table-search-input" />
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
              {DATE_RANGES.map((d) => (
                <button key={d} type="button" onClick={() => setDateRange(d)} className={`sec-filter-chip ${dateRange === d ? 'active' : ''}`}>{d}</button>
              ))}
            </div>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="audit-select">
              {ACTION_TYPES.map((t) => (<option key={t} value={t}>{t === 'All' ? 'All Actions' : t.charAt(0).toUpperCase() + t.slice(1)}</option>))}
            </select>
            <div className="flex items-center gap-1">
              {STATUS_OPTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setStatusFilter(s)} className={`sec-filter-chip ${statusFilter === s ? 'active' : ''}`}>
                  {s === 'All' ? 'Status' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            {(search || actionFilter !== 'All' || statusFilter !== 'All') && (
              <button type="button" onClick={() => { setSearch(''); setActionFilter('All'); setStatusFilter('All'); }} className="text-[10px] text-[#8B7355] font-medium hover:underline">Reset</button>
            )}
          </div>
          {(actionFilter !== 'All' || statusFilter !== 'All' || search) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
              <span className="text-[10px] text-[var(--fg-muted)]">Active:</span>
              {actionFilter !== 'All' && <span className="audit-active-chip">{actionFilter}<button type="button" onClick={() => setActionFilter('All')}><X className="h-2.5 w-2.5" /></button></span>}
              {statusFilter !== 'All' && <span className="audit-active-chip">{statusFilter}<button type="button" onClick={() => setStatusFilter('All')}><X className="h-2.5 w-2.5" /></button></span>}
              {search && <span className="audit-active-chip">&quot;{search}&quot;<button type="button" onClick={() => setSearch('')}><X className="h-2.5 w-2.5" /></button></span>}
            </div>
          )}
        </div>

        {/* ═══════ MAIN LAYOUT ═══════ */}
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          {/* Table */}
          <div className="sec-table-card">
            <div className="flex items-center justify-between p-4 pb-2">
              <p className="text-[12px] text-[var(--fg-muted)]">Showing {sorted.length} of {AUDIT_DATA.length} events</p>
              {flaggedEvents.size > 0 && <p className="text-[10px] text-[#F59E0B] font-medium">{flaggedEvents.size} flagged</p>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="sec-table-head">
                    <th onClick={() => handleSort('timestamp')} className="group/th sec-table-th cursor-pointer select-none"><div className="flex items-center gap-1">Time<SortIcon col="timestamp" /></div></th>
                    <th onClick={() => handleSort('user')} className="group/th sec-table-th cursor-pointer select-none"><div className="flex items-center gap-1">User<SortIcon col="user" /></div></th>
                    <th onClick={() => handleSort('action')} className="group/th sec-table-th cursor-pointer select-none"><div className="flex items-center gap-1">Action<SortIcon col="action" /></div></th>
                    <th className="sec-table-th">Location</th>
                    <th onClick={() => handleSort('status')} className="group/th sec-table-th cursor-pointer select-none"><div className="flex items-center gap-1">Status<SortIcon col="status" /></div></th>
                    <th onClick={() => handleSort('riskScore')} className="group/th sec-table-th cursor-pointer select-none"><div className="flex items-center gap-1">Risk<SortIcon col="riskScore" /></div></th>
                    <th className="sec-table-th text-right">Act</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((event, idx) => (
                    <tr key={event.id} className={`sec-table-row ${idx % 2 === 1 ? 'striped' : ''} cursor-pointer ${flaggedEvents.has(event.id) ? '!border-l-2 !border-l-[#EF4444]' : ''}`} onClick={() => setSelectedEvent(event)}>
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-medium text-[var(--fg)]">{event.timestamp.split(' ')[1]}</p>
                        <p className="text-[9px] text-[var(--fg-muted)]">{event.timestamp.split(' ')[0]}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[rgba(139,115,85,0.08)] flex items-center justify-center text-[9px] font-bold text-[#8B7355]">{event.user[0].toUpperCase()}</div>
                          <div>
                            <p className="text-[11px] font-medium text-[var(--fg)] max-w-[120px] truncate">{event.user}</p>
                            <p className="text-[9px] text-[var(--fg-muted)]">{event.userRole}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium" style={{ background: ACTION_CONFIG[event.actionType]?.bg, color: ACTION_CONFIG[event.actionType]?.color }}>
                          <span>{ACTION_CONFIG[event.actionType]?.icon}</span>{event.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] text-[var(--fg-secondary)]">{event.location}</p>
                        <p className="text-[9px] text-[var(--fg-muted)]">{event.ipAddress}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="audit-status-badge" data-status={event.status}><span className="audit-status-dot" />{event.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-8 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${event.riskScore}%`, background: riskColor(event.riskScore) }} />
                          </div>
                          <span className="text-[10px] font-medium" style={{ color: riskColor(event.riskScore) }}>{event.riskScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-0.5">
                          <button type="button" onClick={() => setSelectedEvent(event)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--fg-muted)] hover:text-[#8B7355]"><Eye className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => handleFlag(event.id)} className={`p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] ${flaggedEvents.has(event.id) ? 'text-[#EF4444]' : 'text-[var(--fg-muted)] hover:text-[#F59E0B]'}`}><Flag className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sorted.length === 0 && <div className="text-center py-12 text-[var(--fg-muted)] text-sm">No events match filters.</div>}
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-[rgba(139,115,85,0.12)] transition-colors duration-200">
              <div className="flex items-center gap-2 mb-3"><Users className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} /><h3 className="text-[12px] font-semibold text-[var(--fg)]">Top Users</h3></div>
              <div className="space-y-2">
                {TOP_USERS.map((u, i) => (
                  <div key={u.email} className="flex items-center gap-2">
                    <span className="text-[9px] font-bold text-[var(--fg-muted)] w-3">{i + 1}</span>
                    <div className="w-5 h-5 rounded-full bg-[rgba(139,115,85,0.08)] flex items-center justify-center text-[8px] font-bold text-[#8B7355]">{u.email[0].toUpperCase()}</div>
                    <span className="text-[10px] text-[var(--fg)] flex-1 truncate">{u.email.split('@')[0]}</span>
                    <span className="text-[10px] font-medium text-[var(--fg-secondary)]">{u.events}</span>
                    {u.trend === 'up' ? <TrendingUp className="h-3 w-3 text-[#4ADE80]" /> : <TrendingDown className="h-3 w-3 text-[#EF4444]" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-[rgba(139,115,85,0.12)] transition-colors duration-200">
              <div className="flex items-center gap-2 mb-3"><Globe className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} /><h3 className="text-[12px] font-semibold text-[var(--fg)]">Top Locations</h3></div>
              <div className="space-y-2">
                {TOP_LOCATIONS.map((loc) => (
                  <div key={loc.code} className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--fg)] w-14 truncate">{loc.country}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${loc.pct}%`, background: 'linear-gradient(90deg, rgba(139,115,85,0.4), #8B7355)' }} />
                    </div>
                    <span className="text-[9px] font-medium text-[var(--fg-secondary)] w-6 text-right">{loc.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-[rgba(139,115,85,0.12)] transition-colors duration-200">
              <div className="flex items-center gap-2 mb-3"><BarChart3 className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} /><h3 className="text-[12px] font-semibold text-[var(--fg)]">Event Types</h3></div>
              <div className="space-y-1.5">
                {Object.entries(ACTION_CONFIG).map(([key, cfg]) => {
                  const count = AUDIT_DATA.filter((e) => e.actionType === key).length;
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[10px] w-3">{cfg.icon}</span>
                      <span className="text-[9px] text-[var(--fg-muted)] w-14 truncate capitalize">{key}</span>
                      <div className="flex-1 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(count / AUDIT_DATA.length) * 100}%`, background: cfg.color }} />
                      </div>
                      <span className="text-[9px] font-medium text-[var(--fg-secondary)] w-3">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div>
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <p className="text-[10px] text-[var(--fg-muted)] tracking-[0.04em] text-center pb-4 mt-4">
            Audit logs retained 365 days &middot; Powered by <span className="font-semibold sec-accent-text">GLIMMORA</span> Trust Engine &middot; SOC 2 Type II
          </p>
        </div>
      </div>

      {/* ═══════ EVENT DRAWER ═══════ */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedEvent(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-l-2xl bg-[var(--card-bg)] border-l border-[var(--border)] shadow-2xl overflow-y-auto audit-drawer-animate" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--border)] p-5 rounded-tl-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-[var(--fg)]">Event Details</h3>
                  <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{selectedEvent.id} &middot; {selectedEvent.timestamp}</p>
                </div>
                <button type="button" onClick={() => setSelectedEvent(null)} className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--fg-muted)]"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                  <p className="text-[9px] text-[var(--fg-muted)]">Action</p>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium mt-1" style={{ background: ACTION_CONFIG[selectedEvent.actionType]?.bg, color: ACTION_CONFIG[selectedEvent.actionType]?.color }}>
                    <span>{ACTION_CONFIG[selectedEvent.actionType]?.icon}</span>{selectedEvent.action}
                  </span>
                </div>
                <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                  <p className="text-[9px] text-[var(--fg-muted)]">Status</p>
                  <span className="audit-status-badge mt-1" data-status={selectedEvent.status}><span className="audit-status-dot" />{selectedEvent.status}</span>
                </div>
                <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                  <p className="text-[9px] text-[var(--fg-muted)]">Risk Score</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-10 h-2 rounded-full bg-[var(--border)] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${selectedEvent.riskScore}%`, background: riskColor(selectedEvent.riskScore) }} /></div>
                    <span className="text-[12px] font-bold" style={{ color: riskColor(selectedEvent.riskScore) }}>{selectedEvent.riskScore}</span>
                  </div>
                </div>
                <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                  <p className="text-[9px] text-[var(--fg-muted)]">User</p>
                  <p className="text-[11px] font-medium text-[var(--fg)] mt-1 truncate">{selectedEvent.user}</p>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--bg-secondary)] p-3.5">
                <p className="text-[10px] font-semibold text-[var(--fg)] mb-1">Details</p>
                <p className="text-[11px] text-[var(--fg-secondary)] leading-relaxed">{selectedEvent.details}</p>
              </div>

              {selectedEvent.changes && (
                <div className="rounded-xl border border-[var(--border)] p-3.5">
                  <p className="text-[10px] font-semibold text-[var(--fg)] mb-2">Before / After</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-1 rounded-lg bg-[rgba(239,68,68,0.06)] text-[#EF4444] line-through">{selectedEvent.changes.before}</span>
                    <ArrowRight className="h-3 w-3 text-[var(--fg-muted)]" />
                    <span className="text-[11px] px-2 py-1 rounded-lg bg-[rgba(74,222,128,0.06)] text-[#4ADE80]">{selectedEvent.changes.after}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-[var(--fg)]">Metadata</p>
                <div className="flex items-center gap-2 text-[11px] py-1.5 border-b border-[var(--border)]"><MapPin className="h-3 w-3 text-[var(--fg-muted)]" /><span className="text-[var(--fg-muted)] flex-1">Location</span><span className="text-[var(--fg)] font-medium">{selectedEvent.location}</span></div>
                <div className="flex items-center gap-2 text-[11px] py-1.5 border-b border-[var(--border)]"><Globe className="h-3 w-3 text-[var(--fg-muted)]" /><span className="text-[var(--fg-muted)] flex-1">IP</span><span className="text-[var(--fg)] font-medium">{selectedEvent.ipAddress}</span></div>
                <div className="flex items-center gap-2 text-[11px] py-1.5 border-b border-[var(--border)]"><Monitor className="h-3 w-3 text-[var(--fg-muted)]" /><span className="text-[var(--fg-muted)] flex-1">Device</span><span className="text-[var(--fg)] font-medium">{selectedEvent.device}</span></div>
                <div className="flex items-center gap-2 text-[11px] py-1.5"><Clock className="h-3 w-3 text-[var(--fg-muted)]" /><span className="text-[var(--fg-muted)] flex-1">Time</span><span className="text-[var(--fg)] font-medium">{selectedEvent.timestamp}</span></div>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => handleFlag(selectedEvent.id)} className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-medium border transition-colors ${flaggedEvents.has(selectedEvent.id) ? 'border-[#EF4444] text-[#EF4444] bg-[rgba(239,68,68,0.04)]' : 'border-[var(--border)] text-[var(--fg-secondary)] hover:border-[#F59E0B] hover:text-[#F59E0B]'}`}>
                  <Flag className="h-3.5 w-3.5" />{flaggedEvents.has(selectedEvent.id) ? 'Unflag' : 'Flag'}
                </button>
                <button type="button" onClick={() => { navigator.clipboard.writeText(JSON.stringify(selectedEvent, null, 2)); }} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-medium border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[#8B7355] hover:text-[#8B7355] transition-colors">
                  <Copy className="h-3.5 w-3.5" />JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ AI INSIGHTS MODAL ═══════ */}
      {showAiInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAiInsights(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[linear-gradient(135deg,rgba(111,92,70,0.1),rgba(139,115,85,0.1))] flex items-center justify-center"><Sparkles className="h-4 w-4 text-[#6F5C46]" /></div>
                  <div><h3 className="text-[15px] font-bold text-[var(--fg)]">AI Security Insights</h3><p className="text-[11px] text-[var(--fg-muted)]">{AI_INSIGHTS.length} anomalies detected</p></div>
                </div>
                <button type="button" onClick={() => setShowAiInsights(false)} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--fg-muted)]"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="p-6 space-y-3 max-h-[450px] overflow-y-auto">
              {AI_INSIGHTS.map((insight, idx) => (
                <div key={idx} className="rounded-xl border border-[var(--border)] p-4 hover:border-[rgba(139,115,85,0.12)] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${insight.severity === 'critical' ? 'bg-[#EF4444]' : insight.severity === 'high' ? 'bg-[#F59E0B]' : insight.severity === 'medium' ? 'bg-[#8B7355]' : 'bg-[#4ADE80]'}`} />
                      <span className="text-[10px] font-semibold uppercase text-[var(--fg-muted)]">{insight.severity}</span>
                    </div>
                    <span className="text-[9px] text-[var(--fg-muted)]">{insight.confidence}% confidence</span>
                  </div>
                  <h4 className="text-[12px] font-semibold text-[var(--fg)] mb-1">{insight.title}</h4>
                  <p className="text-[11px] text-[var(--fg-muted)] leading-relaxed mb-3">{insight.description}</p>
                  <button type="button" className="text-[11px] font-medium text-[#8B7355] hover:underline flex items-center gap-1">{insight.action}<ChevronRight className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ALERT RULES MODAL ═══════ */}
      {showAlertRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAlertRules(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[var(--fg)]">Alert Rules</h3>
              <button type="button" onClick={() => setShowAlertRules(false)} className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--fg-muted)]"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              {[{ name: 'Failed login > 3 attempts', active: true }, { name: 'Role change outside hours', active: true }, { name: 'New IP for admin accounts', active: true }, { name: 'Bulk data export', active: false }, { name: 'Dormant account activation', active: true }].map((rule) => (
                <div key={rule.name} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <span className="text-[11px] font-medium text-[var(--fg)]">{rule.name}</span>
                  <div className={`w-8 h-[18px] rounded-full cursor-pointer transition-colors ${rule.active ? 'bg-[#4ADE80]' : 'bg-[var(--border)]'}`}>
                    <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform mt-[2px] ${rule.active ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes audit-slide-in { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .audit-drawer-animate { animation: audit-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}
