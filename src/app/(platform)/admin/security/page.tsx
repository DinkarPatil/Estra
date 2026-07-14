'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Shield, AlertTriangle, CheckCircle, Calendar, Lock, Globe, Database,
  Smartphone, Search, ChevronDown, ChevronUp, Filter, Download, RefreshCw,
  Scan, TrendingUp, TrendingDown, ArrowRight, Check, Eye, FileText,
  AlertCircle, Clock, Settings, ChevronRight,
  Fingerprint, FileCheck, Scale,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

/* ──────────────────────────────
   ANIMATED COUNT-UP
   ────────────────────────────── */

function useCountUp(target: number, duration = 1600) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = performance.now();
    function tick(now: number) {
      const p = Math.min((now - t0) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

/* ──────────────────────────────
   MOCK DATA
   ────────────────────────────── */

const THREAT_TREND = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  threats: Math.max(0, Math.round(4 + Math.sin(i * 0.4) * 3 + Math.random() * 2)),
  blocked: Math.round(12 + Math.sin(i * 0.3) * 5 + Math.random() * 3),
}));

const ACCESS_RISK_DATA = [
  { hour: '00', risk: 12 }, { hour: '04', risk: 8 }, { hour: '08', risk: 35 },
  { hour: '12', risk: 42 }, { hour: '16', risk: 38 }, { hour: '20', risk: 18 },
];

const SECURITY_CONTROLS = [
  { id: 'ssl', name: 'SSL Certificate', provider: 'DigiCert', status: 'active' as const, riskLevel: 'low' as const, lastChecked: '2 min ago', detail: 'TLS 1.3 / 256-bit', expiry: 'Mar 2026' },
  { id: 'ddos', name: 'DDoS Protection', provider: 'Cloudflare Enterprise', status: 'active' as const, riskLevel: 'low' as const, lastChecked: 'Live', detail: 'Layer 3-7 mitigation', expiry: null },
  { id: 'encrypt', name: 'Data Encryption', provider: 'AWS KMS', status: 'active' as const, riskLevel: 'low' as const, lastChecked: '5 min ago', detail: 'AES-256 at rest & transit', expiry: null },
  { id: 'mfa', name: 'MFA Enforcement', provider: 'Internal Auth', status: 'warning' as const, riskLevel: 'medium' as const, lastChecked: '1 hr ago', detail: '85% adoption rate', expiry: null },
];

const COMPLIANCE_FRAMEWORKS = [
  { id: 'soc2', name: 'SOC 2 Type II', status: 'passed' as const, lastAudit: 'Dec 2025', nextDue: 'Dec 2026', coverage: 100 },
  { id: 'gdpr', name: 'GDPR', status: 'passed' as const, lastAudit: 'Nov 2025', nextDue: 'Nov 2026', coverage: 98 },
  { id: 'aml', name: 'AML/CFT', status: 'passed' as const, lastAudit: 'Jan 2026', nextDue: 'Jul 2026', coverage: 96 },
  { id: 'iso', name: 'ISO 27001', status: 'in-progress' as const, lastAudit: 'Oct 2025', nextDue: 'Apr 2026', coverage: 88 },
];

const COMPLIANCE_OPS = {
  kyc: { verified: 6238, total: 7004, pending: 412, rejected: 54 },
  aml: { screened: 14280, flagged: 23, cleared: 14257, rate: 99.8 },
  gdpr: { consentCoverage: 97.2, requests: 18, avgSla: '1.2 days', breaches: 0 },
};

interface Incident {
  id: string;
  time: string;
  event: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string;
  autoAction: string;
  owner: string;
  status: 'resolved' | 'investigating' | 'open';
}

const INCIDENTS: Incident[] = [
  { id: 'INC-0041', time: '2026-04-20 08:14', event: 'Brute force login attempt detected', severity: 'high', source: 'Auth Gateway', autoAction: 'IP blocked', owner: 'Security Bot', status: 'resolved' },
  { id: 'INC-0040', time: '2026-04-20 06:30', event: 'API rate limit exceeded — Partner X', severity: 'medium', source: 'API Gateway', autoAction: 'Throttled', owner: 'Alex Rivera', status: 'resolved' },
  { id: 'INC-0039', time: '2026-04-19 22:15', event: 'Unusual data export pattern', severity: 'high', source: 'DLP Engine', autoAction: 'Flagged for review', owner: 'Sarah Chen', status: 'investigating' },
  { id: 'INC-0038', time: '2026-04-19 14:45', event: 'Failed MFA challenge — 3 attempts', severity: 'medium', source: 'Auth Service', autoAction: 'Account locked', owner: 'Auto-lock', status: 'resolved' },
  { id: 'INC-0037', time: '2026-04-18 19:00', event: 'Geo-anomaly: login from new country', severity: 'low', source: 'Risk Engine', autoAction: 'Step-up auth', owner: 'Security Bot', status: 'resolved' },
  { id: 'INC-0036', time: '2026-04-18 11:20', event: 'TLS certificate renewal triggered', severity: 'info', source: 'Cert Manager', autoAction: 'Auto-renewed', owner: 'Auto-renew', status: 'resolved' },
  { id: 'INC-0035', time: '2026-04-17 09:10', event: 'SQL injection attempt blocked', severity: 'critical', source: 'WAF', autoAction: 'Blocked + reported', owner: 'Security Bot', status: 'resolved' },
  { id: 'INC-0034', time: '2026-04-16 16:40', event: 'Privilege escalation attempt', severity: 'critical', source: 'RBAC Engine', autoAction: 'Denied + alerted', owner: 'James Park', status: 'resolved' },
];

const POLICIES = [
  { name: 'Data Retention Policy', version: 'v3.2', lastUpdated: 'Mar 2026', status: 'active' as const },
  { name: 'Acceptable Use Policy', version: 'v2.1', lastUpdated: 'Feb 2026', status: 'active' as const },
  { name: 'Incident Response Plan', version: 'v4.0', lastUpdated: 'Jan 2026', status: 'active' as const },
  { name: 'Vendor Risk Policy', version: 'v1.8', lastUpdated: 'Dec 2025', status: 'review' as const },
];

const AUDIT_CHECKLIST = [
  { task: 'Access control review completed', done: true },
  { task: 'Penetration test scheduled', done: true },
  { task: 'Encryption key rotation', done: true },
  { task: 'Employee security training', done: true },
  { task: 'Third-party vendor assessment', done: false },
  { task: 'Disaster recovery drill', done: false },
];

/* ──────────────────────────────
   MINI COMPONENTS
   ────────────────────────────── */

function SecurityTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="sec-tooltip">
        <p className="text-[10px] text-white/50 mb-0.5">Day {label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-[12px] font-semibold text-white">
            {p.value} <span className="text-white/40 text-[10px]">{p.dataKey}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const animated = useCountUp(score, 1600);
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;
  const color = animated >= 90 ? '#4ADE80' : animated >= 70 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={5} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{animated}</span>
        <span className="text-[9px] text-[var(--fg-muted)] font-medium mt-0.5">/100</span>
      </div>
    </div>
  );
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: 'rgba(239,68,68,0.08)', text: '#EF4444', dot: '#EF4444' },
  high: { bg: 'rgba(249,115,22,0.08)', text: '#F97316', dot: '#F97316' },
  medium: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', dot: '#F59E0B' },
  low: { bg: 'rgba(139,115,85,0.08)', text: '#8B7355', dot: '#8B7355' },
  info: { bg: 'rgba(139,115,85,0.08)', text: '#8B7355', dot: '#8B7355' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  resolved: { bg: 'rgba(74,222,128,0.08)', text: '#4ADE80' },
  investigating: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B' },
  open: { bg: 'rgba(239,68,68,0.08)', text: '#EF4444' },
};

/* ──────────────────────────────
   SORT HELPERS
   ────────────────────────────── */

type SortKey = 'time' | 'event' | 'severity' | 'source' | 'status';
type SortDir = 'asc' | 'desc';

const SEV_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };

function sortIncidents(data: Incident[], key: SortKey, dir: SortDir) {
  return [...data].sort((a, b) => {
    if (key === 'severity') {
      const av = SEV_ORDER[a.severity] ?? 0;
      const bv = SEV_ORDER[b.severity] ?? 0;
      return dir === 'asc' ? av - bv : bv - av;
    }
    const av = a[key];
    const bv = b[key];
    return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
}

/* ──────────────────────────────
   MAIN PAGE
   ────────────────────────────── */

export default function SecurityPage() {
  const [incidentSearch, setIncidentSearch] = useState('');
  const [sevFilter, setSevFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [isScanning, setIsScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [exportDone, setExportDone] = useState(false);
  const incidentRef = useRef<HTMLDivElement>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = INCIDENTS
    .filter((i) => i.event.toLowerCase().includes(incidentSearch.toLowerCase()) || i.source.toLowerCase().includes(incidentSearch.toLowerCase()))
    .filter((i) => sevFilter === 'all' || i.severity === sevFilter)
    .filter((i) => statusFilter === 'all' || i.status === statusFilter);
  const sorted = sortIncidents(filtered, sortKey, sortDir);

  const handleScan = () => {
    setIsScanning(true);
    setScanDone(false);
    setTimeout(() => { setIsScanning(false); setScanDone(true); setTimeout(() => setScanDone(false), 2500); }, 2200);
  };

  const handleExport = () => {
    const header = 'ID,Time,Event,Severity,Source,Auto Action,Owner,Status';
    const rows = INCIDENTS.map((i) => `${i.id},${i.time},"${i.event}",${i.severity},${i.source},"${i.autoAction}",${i.owner},${i.status}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2000);
  };

  const handleIncidentCenter = () => {
    incidentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 text-[var(--fg-muted)] opacity-0 group-hover/th:opacity-100 transition-opacity" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-[#8B7355]" /> : <ChevronDown className="h-3 w-3 text-[#8B7355]" />;
  };

  const criticalCount = INCIDENTS.filter((i) => i.severity === 'critical').length;
  const highCount = INCIDENTS.filter((i) => i.severity === 'high').length;
  const mediumCount = INCIDENTS.filter((i) => i.severity === 'medium').length;
  const activeThreats = INCIDENTS.filter((i) => i.status !== 'resolved').length;
  const checklistDone = AUDIT_CHECKLIST.filter((c) => c.done).length;

  return (
    <div className="sec-dashboard relative mx-auto w-full max-w-7xl">
      <div className="relative z-10 space-y-8">

        {/* ═══════ HERO HEADER ═══════ */}
        <div className="animate-stagger-1">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`sec-status-badge ${activeThreats === 0 ? 'secure' : activeThreats <= 2 ? 'warning' : 'incident'}`}>
                  <span className="sec-status-dot" />
                  <span>{activeThreats === 0 ? 'All Clear' : activeThreats <= 2 ? 'Warning' : 'Active Incident'}</span>
                </div>
                <span className="text-[10px] text-[var(--fg-muted)]">Last synced 8s ago</span>
              </div>
              <h1 className="sec-heading">
                Security & <span className="sec-accent-text">Compliance</span>
              </h1>
              <p className="text-[14px] text-[var(--fg-muted)] mt-2 leading-relaxed max-w-xl">
                Platform trust posture, threats, governance, and regulatory readiness
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 mt-1">
              <button type="button" className="sec-action-btn primary" onClick={handleScan}>
                {isScanning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : scanDone ? <Check className="h-3.5 w-3.5" /> : <Scan className="h-3.5 w-3.5" />}
                <span>{isScanning ? 'Scanning...' : scanDone ? 'All Clear' : 'Run Security Scan'}</span>
              </button>
              <button type="button" className="sec-action-btn" onClick={handleExport}>
                {exportDone ? <Check className="h-3.5 w-3.5 text-[#4ADE80]" /> : <Download className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{exportDone ? 'Exported!' : 'Export Audit'}</span>
              </button>
              <button type="button" className="sec-action-btn" onClick={handleIncidentCenter}>
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Incidents</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ KPI DECISION CARDS ═══════ */}
        <div className="animate-stagger-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Security Score */}
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.05s both' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Security Score</p>
              <div className="sec-kpi-icon-box blue"><Shield className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <div className="flex items-center gap-4">
              <ScoreRing score={94} size={80} />
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-[#4ADE80]" strokeWidth={2.5} />
                  <span className="text-[11px] font-semibold text-[#4ADE80]">+3 pts</span>
                </div>
                <span className="text-[10px] text-[var(--fg-muted)]">vs last month</span>
              </div>
            </div>
          </div>

          {/* Active Threats */}
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.11s both' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Active Threats</p>
              <div className={`sec-kpi-icon-box ${activeThreats === 0 ? 'green' : 'amber'}`}>
                <AlertTriangle className="h-4 w-4 text-white" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none mb-3">{activeThreats}</p>
            <div className="flex items-center gap-3">
              <span className="sec-sev-pill critical">{criticalCount} Critical</span>
              <span className="sec-sev-pill high">{highCount} High</span>
              <span className="sec-sev-pill medium">{mediumCount} Med</span>
            </div>
          </div>

          {/* Compliance Status */}
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.17s both' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Compliance</p>
              <div className="sec-kpi-icon-box green"><CheckCircle className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <div className="space-y-1.5">
              {COMPLIANCE_FRAMEWORKS.map((f) => (
                <div key={f.id} className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[var(--fg)]">{f.name}</span>
                  <span className={`sec-compliance-tag ${f.status}`}>
                    {f.status === 'passed' ? 'Passed' : 'In Progress'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Last Audit */}
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.23s both' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Last Audit</p>
              <div className="sec-kpi-icon-box blue"><Calendar className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[20px] font-bold text-[var(--fg)] tracking-[-0.02em] leading-none mb-1">Jan 15, 2026</p>
            <p className="text-[11px] text-[var(--fg-muted)] mb-3">Auditor: Deloitte & Touche</p>
            <div className="flex items-center gap-1.5 sec-next-audit-badge">
              <Clock className="h-3 w-3" />
              <span>Next due: Jul 2026</span>
            </div>
          </div>
        </div>

        {/* ═══════ SECURITY CONTROL MATRIX ═══════ */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="sec-section-icon"><Lock className="h-3.5 w-3.5 text-[#8B7355]" /></div>
            <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Security Control Matrix</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SECURITY_CONTROLS.map((ctrl, idx) => {
              const IconMap: Record<string, any> = { ssl: Lock, ddos: Globe, encrypt: Database, mfa: Smartphone };
              const Icon = IconMap[ctrl.id] || Shield;
              return (
                <div key={ctrl.id} className="sec-control-tile group" style={{ animation: `slide-up-fade 0.5s ease-out ${0.05 + idx * 0.06}s both` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`sec-control-status ${ctrl.status}`}>
                      <span className="sec-control-dot" />
                      {ctrl.status === 'active' ? 'Active' : 'Warning'}
                    </div>
                    <span className={`sec-risk-badge ${ctrl.riskLevel}`}>{ctrl.riskLevel}</span>
                  </div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="sec-control-icon"><Icon className="h-4 w-4 text-[#8B7355]" /></div>
                    <div>
                      <h3 className="text-[12px] font-semibold text-[var(--fg)]">{ctrl.name}</h3>
                      <p className="text-[10px] text-[var(--fg-muted)]">{ctrl.provider}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--fg-secondary)] mb-2">{ctrl.detail}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-[var(--fg-muted)]">Checked: {ctrl.lastChecked}</span>
                    <button type="button" className="sec-configure-btn">
                      <Settings className="h-3 w-3" />
                      Configure
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════ COMPLIANCE OPERATIONS BOARD ═══════ */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="sec-section-icon"><Scale className="h-3.5 w-3.5 text-[#8B7355]" /></div>
              <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Compliance Operations</h2>
            </div>
            <button type="button" className="sec-text-btn">
              View Cases <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* KYC */}
            <div className="sec-ops-card">
              <div className="flex items-center gap-2 mb-3">
                <Fingerprint className="h-4 w-4 text-[#8B7355]" />
                <h3 className="text-[12px] font-semibold text-[var(--fg)]">KYC Verification</h3>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[var(--fg-muted)]">{COMPLIANCE_OPS.kyc.verified.toLocaleString()} / {COMPLIANCE_OPS.kyc.total.toLocaleString()}</span>
                  <span className="text-[11px] font-semibold text-[var(--fg)]">{Math.round((COMPLIANCE_OPS.kyc.verified / COMPLIANCE_OPS.kyc.total) * 100)}%</span>
                </div>
                <div className="sec-progress-track">
                  <div className="sec-progress-fill" style={{ width: `${(COMPLIANCE_OPS.kyc.verified / COMPLIANCE_OPS.kyc.total) * 100}%`, background: '#4ADE80' }} />
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-[var(--fg-muted)]"><span className="font-semibold text-[#F59E0B]">{COMPLIANCE_OPS.kyc.pending}</span> pending</span>
                <span className="text-[var(--fg-muted)]"><span className="font-semibold text-[#EF4444]">{COMPLIANCE_OPS.kyc.rejected}</span> rejected</span>
              </div>
            </div>

            {/* AML */}
            <div className="sec-ops-card">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-[#8B7355]" />
                <h3 className="text-[12px] font-semibold text-[var(--fg)]">AML Monitoring</h3>
              </div>
              <p className="text-[24px] font-bold text-[var(--fg)] tracking-[-0.02em] leading-none mb-1">{COMPLIANCE_OPS.aml.screened.toLocaleString()}</p>
              <p className="text-[10px] text-[var(--fg-muted)] mb-3">transactions screened today</p>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-[var(--fg-muted)]"><span className="font-semibold text-[#F59E0B]">{COMPLIANCE_OPS.aml.flagged}</span> flagged</span>
                <span className="text-[var(--fg-muted)]"><span className="font-semibold text-[#4ADE80]">{COMPLIANCE_OPS.aml.rate}%</span> clear rate</span>
              </div>
            </div>

            {/* GDPR */}
            <div className="sec-ops-card">
              <div className="flex items-center gap-2 mb-3">
                <FileCheck className="h-4 w-4 text-[#A89478]" />
                <h3 className="text-[12px] font-semibold text-[var(--fg)]">GDPR Compliance</h3>
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[var(--fg-muted)]">Consent coverage</span>
                  <span className="text-[11px] font-semibold text-[var(--fg)]">{COMPLIANCE_OPS.gdpr.consentCoverage}%</span>
                </div>
                <div className="sec-progress-track">
                  <div className="sec-progress-fill" style={{ width: `${COMPLIANCE_OPS.gdpr.consentCoverage}%`, background: '#A89478' }} />
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-[var(--fg-muted)]"><span className="font-semibold text-[var(--fg)]">{COMPLIANCE_OPS.gdpr.requests}</span> requests</span>
                <span className="text-[var(--fg-muted)]">SLA: <span className="font-semibold text-[#4ADE80]">{COMPLIANCE_OPS.gdpr.avgSla}</span></span>
                <span className="text-[var(--fg-muted)]"><span className="font-semibold text-[#4ADE80]">{COMPLIANCE_OPS.gdpr.breaches}</span> breaches</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ THREAT TREND + ACCESS RISK ═══════ */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Threat Trend */}
          <div className="lg:col-span-3 sec-chart-card">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Threat Trend</h3>
                <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-0.5">Last 30 days</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--fg-muted)]">
                  <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> Threats
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--fg-muted)]">
                  <span className="h-2 w-2 rounded-full bg-[#4ADE80]" /> Blocked
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={THREAT_TREND}>
                <defs>
                  <linearGradient id="threatFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="blockedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#4ADE80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} interval={4} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                <Tooltip content={<SecurityTooltip />} />
                <Area type="monotone" dataKey="blocked" stroke="#4ADE80" strokeWidth={2} fill="url(#blockedFill)" animationDuration={1500} />
                <Area type="monotone" dataKey="threats" stroke="#EF4444" strokeWidth={2} fill="url(#threatFill)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Access Risk Panel */}
          <div className="lg:col-span-2 sec-chart-card flex flex-col">
            <div className="mb-4">
              <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Access Risk</h3>
              <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-0.5">Risk events by hour</p>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ACCESS_RISK_DATA}>
                  <defs>
                    <linearGradient id="riskBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                  <Tooltip content={<SecurityTooltip />} />
                  <Bar dataKey="risk" fill="url(#riskBar)" radius={[4, 4, 0, 0]} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 text-[10px] text-[var(--fg-muted)]">
              <span>Peak: <span className="font-semibold text-[#F59E0B]">12:00</span></span>
              <span>Total: <span className="font-semibold text-[var(--fg)]">153</span> events</span>
            </div>
          </div>
        </div>

        {/* ═══════ INCIDENT FEED TABLE ═══════ */}
        <div ref={incidentRef}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="sec-section-icon incident"><AlertCircle className="h-3.5 w-3.5 text-[#EF4444]" /></div>
              <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Incident Center</h2>
              <span className="sec-count-badge">{INCIDENTS.length}</span>
            </div>
          </div>

          <div className="sec-table-card">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 pb-0">
              <div className="sec-table-search">
                <Search className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                <input type="text" placeholder="Search incidents..." value={incidentSearch} onChange={(e) => setIncidentSearch(e.target.value)} className="sec-table-search-input" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setSevFilter(f)} className={`sec-filter-chip ${sevFilter === f ? 'active' : ''}`}>
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                <span className="h-4 w-px bg-[var(--border)] mx-1" />
                {(['all', 'open', 'investigating', 'resolved'] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setStatusFilter(f)} className={`sec-filter-chip ${statusFilter === f ? 'active' : ''}`}>
                    {f === 'all' ? 'Status' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="sec-table-head">
                    {([['time', 'Time'], ['event', 'Event'], ['severity', 'Severity'], ['source', 'Source']] as [SortKey, string][]).map(([key, label]) => (
                      <th key={key} onClick={() => handleSort(key)} className="group/th sec-table-th cursor-pointer select-none">
                        <div className="flex items-center gap-1">{label}<SortIcon col={key} /></div>
                      </th>
                    ))}
                    <th className="sec-table-th">Auto Action</th>
                    <th className="sec-table-th">Owner</th>
                    <th onClick={() => handleSort('status')} className="group/th sec-table-th cursor-pointer select-none">
                      <div className="flex items-center gap-1">Status<SortIcon col="status" /></div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, idx) => {
                    const sev = SEVERITY_STYLES[row.severity];
                    const stat = STATUS_STYLES[row.status];
                    return (
                      <tr key={row.id} className={`sec-table-row ${idx % 2 === 1 ? 'striped' : ''}`}>
                        <td className="px-4 py-3 text-[var(--fg-muted)] whitespace-nowrap text-[12px]">{row.time}</td>
                        <td className="px-4 py-3 font-medium text-[var(--fg)] max-w-[280px]">{row.event}</td>
                        <td className="px-4 py-3">
                          <span className="sec-sev-tag" style={{ background: sev.bg, color: sev.text }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: sev.dot }} />
                            {row.severity.charAt(0).toUpperCase() + row.severity.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--fg-secondary)] text-[12px]">{row.source}</td>
                        <td className="px-4 py-3 text-[var(--fg-secondary)] text-[12px]">{row.autoAction}</td>
                        <td className="px-4 py-3 text-[var(--fg-secondary)] text-[12px]">{row.owner}</td>
                        <td className="px-4 py-3">
                          <span className="sec-status-tag" style={{ background: stat.bg, color: stat.text }}>
                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {sorted.length === 0 && (
                <div className="text-center py-12 text-[var(--fg-muted)] text-sm">No incidents match your filters.</div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ POLICY CENTER + AUDIT READINESS ═══════ */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Policy Center */}
          <div className="sec-chart-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#8B7355]" strokeWidth={1.5} />
                <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Policy Center</h3>
              </div>
              <span className="sec-metric-pill">{POLICIES.length} policies</span>
            </div>
            <div className="space-y-2">
              {POLICIES.map((policy) => (
                <div key={policy.name} className="sec-policy-row group">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-[var(--fg-muted)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[var(--fg)] leading-tight truncate">{policy.name}</p>
                      <p className="text-[10px] text-[var(--fg-muted)]">{policy.version} &middot; {policy.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`sec-compliance-tag ${policy.status === 'active' ? 'passed' : 'in-progress'}`}>
                      {policy.status === 'active' ? 'Active' : 'Review'}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--fg-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Readiness */}
          <div className="sec-chart-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#4ADE80]" strokeWidth={1.5} />
                <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Audit Readiness</h3>
              </div>
              <span className="sec-metric-pill">{checklistDone}/{AUDIT_CHECKLIST.length} complete</span>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[var(--fg-muted)]">Overall readiness</span>
                <span className="text-[12px] font-bold text-[var(--fg)]">{Math.round((checklistDone / AUDIT_CHECKLIST.length) * 100)}%</span>
              </div>
              <div className="sec-progress-track lg-track">
                <div className="sec-progress-fill" style={{ width: `${(checklistDone / AUDIT_CHECKLIST.length) * 100}%`, background: '#4ADE80' }} />
              </div>
            </div>
            <div className="space-y-2">
              {AUDIT_CHECKLIST.map((item) => (
                <div key={item.task} className="flex items-center gap-3 sec-checklist-row">
                  <div className={`sec-check-box ${item.done ? 'done' : ''}`}>
                    {item.done && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-[12px] ${item.done ? 'text-[var(--fg-secondary)] line-through' : 'text-[var(--fg)] font-medium'}`}>
                    {item.task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <div>
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <p className="text-[10px] text-[var(--fg-muted)] tracking-[0.04em] text-center pb-4 mt-4">
            Security posture monitored 24/7 &middot; Powered by <span className="font-semibold sec-accent-text">GLIMMORA</span> Trust Engine
          </p>
        </div>

      </div>
    </div>
  );
}
