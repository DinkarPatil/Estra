'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Key, Users, Activity, Clock, TrendingUp, TrendingDown, RefreshCw, Download,
  Brain, Bell, Search, Filter, ChevronDown, ChevronUp, LayoutGrid, List,
  Globe, ArrowRight, X, Check, AlertTriangle, ChevronRight, Shield,
  Zap, Plus, Copy, Eye, EyeOff, Trash2, RotateCcw, Edit3, ExternalLink,
  Lock, Unlock, BarChart3, Sparkles, FileText, DollarSign, Radio,
  AlertCircle, Gauge, Server, Building2, Mail, UserCheck, Ban,
  ArrowUpRight, Terminal, Settings, Layers,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

/* ═══════════���══════════════════════════
   TYPES
   ═════��════════════════════════════════ */

type KeyStatus = 'active' | 'idle' | 'expiring' | 'revoked' | 'suspended';
type KeyEnv = 'Production' | 'Staging' | 'Development';
type PartnerStatus = 'active' | 'pending' | 'suspended';
type PartnerTier = 'Enterprise' | 'Premium' | 'Standard' | 'Trial';
type AnalyticsTab = 'traffic' | 'endpoints' | 'errors' | 'geography' | 'revenue';
type PageSection = 'analytics' | 'keys' | 'partners' | 'endpoints' | 'governance' | 'incidents';
type TimeRange = 'live' | '24h' | '7d' | '30d';
type KeySortKey = 'name' | 'requestsToday' | 'lastUsed' | 'created' | 'expiry';
type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface ApiKey {
  id: string;
  name: string;
  maskedKey: string;
  owner: string;
  env: KeyEnv;
  scopes: string[];
  status: KeyStatus;
  created: string;
  lastUsed: string;
  expiry: string;
  requestsToday: number;
  rateLimit: string;
}

interface Partner {
  id: string;
  company: string;
  initials: string;
  color: string;
  status: PartnerStatus;
  tier: PartnerTier;
  requests: number;
  quota: number;
  lastActive: string;
  region: string;
  slaTier: string;
  contact: string;
  keysCount: number;
}

interface Endpoint {
  route: string;
  method: string;
  requests: number;
  avgLatency: number;
  p95Latency: number;
  errorRate: number;
  successRate: number;
  trend: number;
}

interface ApiIncident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  service: string;
  status: 'active' | 'resolved';
  time: string;
  timeAgo: string;
}

/* ══════════════════════════════════════
   MOCK DATA
   ════════════════════════��═════════════ */

const API_KEYS: ApiKey[] = [
  { id: 'k1', name: 'PropSearch Integration', maskedKey: 'glm_sk_****…8f3a', owner: 'PropertyFinder MENA', env: 'Production', scopes: ['properties:read', 'search:read'], status: 'active', created: '2024-09-01', lastUsed: '2 min ago', expiry: '2025-09-01', requestsToday: 184200, rateLimit: '10,000/hr' },
  { id: 'k2', name: 'Analytics Sync', maskedKey: 'glm_sk_****…c41b', owner: 'DataBridge Corp', env: 'Production', scopes: ['analytics:read', 'reports:read'], status: 'active', created: '2024-10-15', lastUsed: '8 min ago', expiry: '2025-10-15', requestsToday: 92400, rateLimit: '5,000/hr' },
  { id: 'k3', name: 'CRM Connector', maskedKey: 'glm_sk_****…e92d', owner: 'SalesEdge SG', env: 'Production', scopes: ['users:read', 'properties:read'], status: 'active', created: '2024-11-01', lastUsed: '22 min ago', expiry: '2025-11-01', requestsToday: 51800, rateLimit: '2,000/hr' },
  { id: 'k4', name: 'Valuation API', maskedKey: 'glm_sk_****…7d0e', owner: 'GlobVal Inc', env: 'Staging', scopes: ['valuation:read'], status: 'idle', created: '2024-08-20', lastUsed: '14 days ago', expiry: '2025-08-20', requestsToday: 0, rateLimit: '500/hr' },
  { id: 'k5', name: 'Mortgage Link', maskedKey: 'glm_sk_****���1a5c', owner: 'Emirates Finance', env: 'Production', scopes: ['transactions:read', 'users:read'], status: 'active', created: '2024-12-01', lastUsed: '5 min ago', expiry: '2025-06-01', requestsToday: 126000, rateLimit: '3,000/hr' },
  { id: 'k6', name: 'AI Query Service', maskedKey: 'glm_sk_****…3b8f', owner: 'GLIMMORA Internal', env: 'Production', scopes: ['ai:query', 'ai:embed', 'properties:read'], status: 'active', created: '2025-01-05', lastUsed: '1 min ago', expiry: '2026-01-05', requestsToday: 248000, rateLimit: 'Unlimited' },
  { id: 'k7', name: 'Staging Test Suite', maskedKey: 'glm_sk_****…f01a', owner: 'QA Team', env: 'Staging', scopes: ['*:read', '*:write'], status: 'active', created: '2025-01-10', lastUsed: '1 hr ago', expiry: '2025-07-10', requestsToday: 4200, rateLimit: '1,000/hr' },
  { id: 'k8', name: 'Legacy CRM v1', maskedKey: 'glm_sk_****…ab3e', owner: 'DataBridge Corp', env: 'Production', scopes: ['users:read'], status: 'expiring', created: '2024-03-15', lastUsed: '3 days ago', expiry: '2025-05-15', requestsToday: 120, rateLimit: '500/hr' },
  { id: 'k9', name: 'Decommissioned Feed', maskedKey: 'glm_sk_****…9c7d', owner: 'Deprecated', env: 'Production', scopes: ['properties:read'], status: 'revoked', created: '2023-06-01', lastUsed: 'Never', expiry: 'Revoked', requestsToday: 0, rateLimit: '—' },
  { id: 'k10', name: 'Sandbox Explorer', maskedKey: 'glm_sk_****…d2e8', owner: 'Developer Portal', env: 'Development', scopes: ['*:read'], status: 'active', created: '2025-02-01', lastUsed: '45 min ago', expiry: '2026-02-01', requestsToday: 1840, rateLimit: '200/hr' },
];

const PARTNERS: Partner[] = [
  { id: 'p1', company: 'PropertyFinder MENA', initials: 'PF', color: '#8B7355', status: 'active', tier: 'Enterprise', requests: 480000, quota: 500000, lastActive: '2 min ago', region: 'Middle East', slaTier: '99.99%', contact: 'ops@propertyfinder.ae', keysCount: 3 },
  { id: 'p2', company: 'DataBridge Corp', initials: 'DB', color: '#8B7355', status: 'active', tier: 'Premium', requests: 210000, quota: 300000, lastActive: '8 min ago', region: 'Global', slaTier: '99.95%', contact: 'api@databridge.io', keysCount: 2 },
  { id: 'p3', company: 'SalesEdge SG', initials: 'SE', color: '#10B981', status: 'active', tier: 'Standard', requests: 142000, quota: 200000, lastActive: '22 min ago', region: 'Asia Pacific', slaTier: '99.90%', contact: 'tech@salesedge.sg', keysCount: 1 },
  { id: 'p4', company: 'GlobVal Inc', initials: 'GV', color: '#F59E0B', status: 'active', tier: 'Trial', requests: 8000, quota: 50000, lastActive: '14 days ago', region: 'Americas', slaTier: '99.50%', contact: 'dev@globval.com', keysCount: 1 },
  { id: 'p5', company: 'Emirates Finance', initials: 'EF', color: '#EF4444', status: 'active', tier: 'Premium', requests: 261000, quota: 300000, lastActive: '5 min ago', region: 'Middle East', slaTier: '99.95%', contact: 'it@emiratesfinance.ae', keysCount: 2 },
  { id: 'p6', company: 'NexGen Properties', initials: 'NP', color: '#6F5C46', status: 'pending', tier: 'Standard', requests: 0, quota: 100000, lastActive: 'Never', region: 'Europe', slaTier: '99.90%', contact: 'cto@nexgenprop.eu', keysCount: 0 },
  { id: 'p7', company: 'Horizon Analytics', initials: 'HA', color: '#8B7355', status: 'pending', tier: 'Premium', requests: 0, quota: 300000, lastActive: 'Never', region: 'Americas', slaTier: '99.95%', contact: 'admin@horizonai.com', keysCount: 0 },
];

const ENDPOINTS: Endpoint[] = [
  { route: '/v1/properties', method: 'GET', requests: 480200, avgLatency: 62, p95Latency: 124, errorRate: 0.02, successRate: 99.98, trend: 12 },
  { route: '/v1/search', method: 'GET', requests: 322100, avgLatency: 89, p95Latency: 210, errorRate: 0.04, successRate: 99.96, trend: 18 },
  { route: '/v1/analytics', method: 'GET', requests: 214800, avgLatency: 142, p95Latency: 320, errorRate: 0.03, successRate: 99.97, trend: -2 },
  { route: '/v1/transactions', method: 'POST', requests: 141200, avgLatency: 104, p95Latency: 245, errorRate: 0.01, successRate: 99.99, trend: 8 },
  { route: '/v1/ai/query', method: 'POST', requests: 89400, avgLatency: 230, p95Latency: 480, errorRate: 0.08, successRate: 99.92, trend: 34 },
  { route: '/v1/users', method: 'GET', requests: 72300, avgLatency: 38, p95Latency: 82, errorRate: 0.01, successRate: 99.99, trend: 5 },
  { route: '/v1/auth/token', method: 'POST', requests: 68100, avgLatency: 54, p95Latency: 110, errorRate: 0.06, successRate: 99.94, trend: -1 },
  { route: '/v1/webhooks', method: 'POST', requests: 24600, avgLatency: 180, p95Latency: 380, errorRate: 0.12, successRate: 99.88, trend: 22 },
];

const API_INCIDENTS: ApiIncident[] = [
  { id: 'ai1', title: 'Spike in /search traffic from single IP', severity: 'high', service: 'API Gateway', status: 'active', time: '14:18', timeAgo: '17 min ago' },
  { id: 'ai2', title: 'Key abuse detected — k8 Legacy CRM', severity: 'medium', service: 'Auth', status: 'active', time: '13:42', timeAgo: '53 min ago' },
  { id: 'ai3', title: 'Rate limit exceeded by PropertyFinder', severity: 'medium', service: 'Rate Limiter', status: 'resolved', time: '12:30', timeAgo: '2 hrs ago' },
  { id: 'ai4', title: 'Elevated latency in EU region endpoints', severity: 'low', service: 'CDN', status: 'resolved', time: '11:15', timeAgo: '3 hrs ago' },
  { id: 'ai5', title: 'Failed webhook deliveries to SalesEdge', severity: 'medium', service: 'Webhooks', status: 'resolved', time: '09:45', timeAgo: '5 hrs ago' },
];

const AI_RECOMMENDATIONS = [
  { id: 1, text: '3 unused keys should be revoked for security', severity: 'high' as const, action: 'Review Keys' },
  { id: 2, text: '/search latency rising 14% — suggest caching', severity: 'medium' as const, action: 'Investigate' },
  { id: 3, text: 'Partner Alpha nearing 96% quota — upgrade?', severity: 'medium' as const, action: 'View Partner' },
  { id: 4, text: 'Cache /analytics endpoint — 78% repeat queries', severity: 'low' as const, action: 'Configure' },
];

const ABUSE_ALERTS = [
  { id: 1, text: 'Unusual traffic from IP 203.0.113.42 (1.2K req/s)', severity: 'high' as const },
  { id: 2, text: 'Burst pattern detected on /v1/search endpoint', severity: 'medium' as const },
];

const REGIONS_STATUS = [
  { name: 'US East', status: 'healthy' as const, latency: 42 },
  { name: 'Europe', status: 'warning' as const, latency: 118 },
  { name: 'APAC', status: 'healthy' as const, latency: 67 },
];

const RATE_POLICIES = [
  { tier: 'Public API', limit: '100 req/min', burst: '200 req/min', status: 'active' },
  { tier: 'Premium Partner', limit: '5,000 req/min', burst: '8,000 req/min', status: 'active' },
  { tier: 'Internal', limit: 'Unlimited', burst: '—', status: 'active' },
  { tier: 'AI Endpoints', limit: 'Metered', burst: '500 req/min', status: 'active' },
];

/* Chart data */
function genTrafficData(count: number, baseLabel: (i: number) => string) {
  return Array.from({ length: count }, (_, i) => ({
    time: baseLabel(i),
    requests: 40000 + Math.round(Math.sin(i * 0.4) * 15000) + Math.round(Math.random() * 8000),
    errors: Math.max(0, Math.round(Math.sin(i * 0.6) * 30) + Math.round(Math.random() * 15)),
    success: 99.8 + Math.random() * 0.19,
    revenue: 800 + Math.round(Math.sin(i * 0.3) * 200) + Math.round(Math.random() * 100),
  }));
}

const TRAFFIC_24H = genTrafficData(24, (i) => (i < 10 ? `0${i}:00` : `${i}:00`));
const TRAFFIC_7D = genTrafficData(7, (i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toLocaleDateString('en', { weekday: 'short' }); });
const TRAFFIC_30D = genTrafficData(30, (i) => `${i + 1}`);
const TRAFFIC_LIVE = genTrafficData(12, (i) => `${14}:${(i * 5).toString().padStart(2, '0')}`);

const TRAFFIC_MAP: Record<TimeRange, typeof TRAFFIC_24H> = { live: TRAFFIC_LIVE, '24h': TRAFFIC_24H, '7d': TRAFFIC_7D, '30d': TRAFFIC_30D };

/* KPI sparklines */
const SPARK_REQS = [{ v: 980 }, { v: 1020 }, { v: 1080 }, { v: 1050 }, { v: 1120 }, { v: 1100 }, { v: 1150 }, { v: 1140 }, { v: 1180 }, { v: 1160 }, { v: 1200 }, { v: 1200 }];
const SPARK_KEYS = [{ v: 42 }, { v: 43 }, { v: 44 }, { v: 44 }, { v: 45 }, { v: 45 }, { v: 46 }, { v: 47 }, { v: 47 }, { v: 48 }, { v: 48 }, { v: 48 }];
const SPARK_PARTNERS = [{ v: 8 }, { v: 9 }, { v: 9 }, { v: 10 }, { v: 10 }, { v: 10 }, { v: 11 }, { v: 11 }, { v: 12 }, { v: 12 }, { v: 12 }, { v: 12 }];
const SPARK_LATENCY = [{ v: 102 }, { v: 98 }, { v: 95 }, { v: 93 }, { v: 91 }, { v: 94 }, { v: 90 }, { v: 92 }, { v: 89 }, { v: 91 }, { v: 90 }, { v: 89 }];
const SPARK_ERRORS = [{ v: 0.12 }, { v: 0.11 }, { v: 0.10 }, { v: 0.09 }, { v: 0.10 }, { v: 0.09 }, { v: 0.08 }, { v: 0.09 }, { v: 0.08 }, { v: 0.08 }, { v: 0.08 }, { v: 0.08 }];
const SPARK_REVENUE = [{ v: 18 }, { v: 19 }, { v: 20 }, { v: 20.5 }, { v: 21 }, { v: 21.8 }, { v: 22 }, { v: 23 }, { v: 23.5 }, { v: 24 }, { v: 24.5 }, { v: 24.8 }];

/* endpoint bar chart data */
const ENDPOINT_BARS = ENDPOINTS.slice(0, 6).map((e) => ({ name: e.route.replace('/v1/', '/'), requests: e.requests }));
/* geography data */
const GEO_DATA = [
  { country: 'United Arab Emirates', requests: 412000, pct: 34, flag: '🇦🇪' },
  { country: 'United States', requests: 289000, pct: 24, flag: '🇺🇸' },
  { country: 'Singapore', requests: 181000, pct: 15, flag: '🇸🇬' },
  { country: 'United Kingdom', requests: 145000, pct: 12, flag: '🇬🇧' },
  { country: 'Germany', requests: 96000, pct: 8, flag: '🇩🇪' },
  { country: 'Others', requests: 84000, pct: 7, flag: '🌍' },
];

/* ══════════════════════════════════════
   HOOKS
   ═════════════��════════════════════════ */

function useCountUp(target: number, duration = 1800, decimals = 0) {
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
      const raw = target * eased;
      setValue(decimals > 0 ? parseFloat(raw.toFixed(decimals)) : Math.round(raw));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration, decimals]);
  return value;
}

function useLiveTimer(intervalMs = 8000) {
  const [lastSync, setLastSync] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLastSync(0), intervalMs);
    const ticker = setInterval(() => setLastSync((s) => s + 1), 1000);
    return () => { clearInterval(id); clearInterval(ticker); };
  }, [intervalMs]);
  return lastSync;
}

/* ══════════════════════════════════════
   SUB-COMPONENTS
   ════════════════���═════════════════════ */

function MiniSparkline({ data, color, height = 30 }: { data: { v: number }[]; color: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} activeDot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function ApiTooltip({ active, payload, label }: any) {
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
  title, rawValue, displaySuffix, change, icon: Icon, iconStyle, sparkline, sparkColor, delay, decimals = 0,
}: {
  title: string; rawValue: number; displaySuffix?: string; change?: string; decimals?: number;
  icon: any; iconStyle: string; sparkline: { v: number }[]; sparkColor: string; delay: number;
}) {
  const animated = useCountUp(rawValue, 1800, decimals);
  return (
    <div className="api-kpi-card group" style={{ animation: `slide-up-fade 0.5s ease-out ${delay}s both` }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">{title}</p>
        <div className={`api-kpi-icon-box ${iconStyle}`}>
          <Icon className="h-4 w-4 text-white" strokeWidth={1.5} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="api-kpi-value">
            {decimals > 0 ? animated.toFixed(decimals) : animated.toLocaleString()}
            {displaySuffix && <span className="text-[16px] font-semibold text-[var(--fg-muted)] ml-0.5">{displaySuffix}</span>}
          </p>
          {change && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                change.startsWith('+') || change.startsWith('$') ? 'bg-[rgba(16,185,129,0.08)] text-[#10B981]' :
                change.startsWith('-') ? 'bg-[rgba(239,68,68,0.08)] text-[#F87171]' :
                'bg-[rgba(139,115,85,0.08)] text-[#8B7355]'
              }`}>
                {(change.startsWith('+') || change.startsWith('$')) && <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.5} />}
                {change.startsWith('-') && <TrendingDown className="h-2.5 w-2.5" strokeWidth={2.5} />}
                <span>{change}</span>
              </div>
            </div>
          )}
        </div>
        <div className="w-[72px] shrink-0 opacity-30 group-hover:opacity-100 transition-opacity duration-300">
          <MiniSparkline data={sparkline} color={sparkColor} />
        </div>
      </div>
    </div>
  );
}

function HealthRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 38;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';
  return (
    <div className="api-health-ring">
      <svg viewBox="0 0 90 90" width="90" height="90">
        <circle className="api-health-ring-bg" cx="45" cy="45" r="38" />
        <circle className="api-health-ring-fill" cx="45" cy="45" r="38" stroke={color} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-bold text-[var(--fg)] leading-none">{score}</span>
        <span className="text-[8px] text-[var(--fg-muted)] mt-0.5 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

const KEY_STATUS_CONFIG: Record<KeyStatus, { label: string; cssClass: string }> = {
  active: { label: 'Active', cssClass: 'active' },
  idle: { label: 'Idle', cssClass: 'idle' },
  expiring: { label: 'Expiring', cssClass: 'expiring' },
  revoked: { label: 'Revoked', cssClass: 'revoked' },
  suspended: { label: 'Suspended', cssClass: 'suspended' },
};

const ENV_CSS: Record<KeyEnv, string> = {
  Production: 'prod',
  Staging: 'staging',
  Development: 'dev',
};

/* ════════���═════════════════════════════
   MAIN PAGE
   ════════════════════════════��═════════ */

export default function ApiManagementPage() {
  /* ── State ── */
  const [activeSection, setActiveSection] = useState<PageSection>('analytics');
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('traffic');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [keySearch, setKeySearch] = useState('');
  const [keyStatusFilter, setKeyStatusFilter] = useState<KeyStatus | 'all'>('all');
  const [keyEnvFilter, setKeyEnvFilter] = useState<KeyEnv | 'all'>('all');
  const [keySortKey, setKeySortKey] = useState<KeySortKey>('requestsToday');
  const [keySortDir, setKeySortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);
  const [drawerTab, setDrawerTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: string; key?: ApiKey; partner?: Partner } | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const syncAge = useLiveTimer(8000);

  /* ── Derived ── */
  const filteredKeys = useMemo(() => {
    let list = API_KEYS.filter((k) => k.name.toLowerCase().includes(keySearch.toLowerCase()) || k.owner.toLowerCase().includes(keySearch.toLowerCase()));
    if (keyStatusFilter !== 'all') list = list.filter((k) => k.status === keyStatusFilter);
    if (keyEnvFilter !== 'all') list = list.filter((k) => k.env === keyEnvFilter);
    return [...list].sort((a, b) => {
      const av = a[keySortKey]; const bv = b[keySortKey];
      if (typeof av === 'number' && typeof bv === 'number') return keySortDir === 'asc' ? av - bv : bv - av;
      return keySortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [keySearch, keyStatusFilter, keyEnvFilter, keySortKey, keySortDir]);

  const chartData = TRAFFIC_MAP[timeRange];
  const activeKeysCount = API_KEYS.filter((k) => k.status === 'active').length;
  const pendingPartners = PARTNERS.filter((p) => p.status === 'pending').length;

  /* ── Handlers ── */
  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); }, []);
  const handleRefresh = () => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 1500); };
  const handleCopyKey = (k: ApiKey) => { setCopiedKeyId(k.id); showToast('API key copied to clipboard'); setTimeout(() => setCopiedKeyId(null), 2000); };

  const handleExport = () => {
    const header = 'Key,Owner,Env,Status,Requests Today,Rate Limit';
    const rows = API_KEYS.map((k) => `${k.name},${k.owner},${k.env},${k.status},${k.requestsToday},${k.rateLimit}`);
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `api-usage-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported');
  };

  const confirmModal = () => {
    if (modal?.type === 'create-key') showToast('API key created successfully');
    else if (modal?.type === 'add-partner') showToast('Partner invitation sent');
    else if (modal?.type === 'revoke') showToast(`Key "${modal.key?.name}" revoked`);
    setModal(null);
  };

  const NAV_ITEMS: { key: PageSection; label: string; icon: any }[] = [
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'keys', label: 'API Keys', icon: Key },
    { key: 'partners', label: 'Partners', icon: Users },
    { key: 'endpoints', label: 'Endpoints', icon: Zap },
    { key: 'governance', label: 'Governance', icon: Shield },
    { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
  ];

  /* ══════════════════════════════════════
     RENDER
     ═══���═══════════════���══════════════════ */
  return (
    <div className="api-dashboard relative mx-auto w-full max-w-[1600px] px-1">
      <div className="relative z-10 space-y-7">

        {/* ═══════ COMMAND HEADER ═══════ */}
        <div className="animate-stagger-1">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="adm-live-badge"><span className="adm-live-dot" /><span>Live</span></div>
                <span className="text-[10px] text-[var(--fg-muted)]">Synced {syncAge}s ago</span>
              </div>
              <h1 className="api-heading">API <span className="api-accent-text">Management</span></h1>
              <p className="text-[13px] text-[var(--fg-muted)] mt-2 leading-relaxed max-w-2xl">
                Manage developer access, API traffic, keys, partners, rate limits, and platform integrations.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 mt-1">
              <button type="button" className="adm-action-btn primary" onClick={() => setModal({ type: 'create-key' })}>
                <Plus className="h-3.5 w-3.5" /><span>Create API Key</span>
              </button>
              <button type="button" className="adm-action-btn" onClick={() => setModal({ type: 'add-partner' })}>
                <Users className="h-3.5 w-3.5" /><span className="hidden sm:inline">Add Partner</span>
              </button>
              <button type="button" className="adm-action-btn" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">Export</span>
              </button>
              <button type="button" className="adm-action-btn">
                <Bell className="h-3.5 w-3.5" /><span className="hidden sm:inline">Alert Rules</span>
              </button>
              <button type="button" className="adm-action-btn" onClick={handleRefresh}>
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Status Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="sys-status-chip"><span className="sys-dot green" /><span className="text-[#10B981] font-semibold">API Gateway Healthy</span></div>
            <div className="sys-status-chip"><Activity className="h-3 w-3 text-[#8B7355]" /><span>1.2M Requests Today</span></div>
            <div className="sys-status-chip"><Key className="h-3 w-3 text-[#8B7355]" /><span>{activeKeysCount} Active Keys</span></div>
            <div className="sys-status-chip"><Clock className="h-3 w-3 text-[#10B981]" /><span>Avg Latency <strong className="text-[var(--fg)]">89ms</strong></span></div>
            <div className="sys-status-chip"><span className="sys-dot amber" /><span className="text-[#F59E0B] font-semibold">2 Abuse Alerts</span></div>
            <div className="sys-status-chip"><Radio className="h-3 w-3 text-[var(--fg-muted)]" /><span>Last Sync: <strong className="text-[var(--fg)]">{syncAge}s ago</strong></span></div>
          </div>
        </div>

        {/* ═══════ KPI GRID ═══════ */}
        <div className="animate-stagger-2">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KPICard title="Requests Today" rawValue={1200000} displaySuffix="" change="+12.4%" icon={Activity} iconStyle="indigo" sparkline={SPARK_REQS} sparkColor="#8B7355" delay={0.05} />
            <KPICard title="Active API Keys" rawValue={activeKeysCount} change="+3 this week" icon={Key} iconStyle="blue" sparkline={SPARK_KEYS} sparkColor="#8B7355" delay={0.1} />
            <KPICard title="Partners" rawValue={PARTNERS.filter((p) => p.status === 'active').length} change={`${pendingPartners} pending`} icon={Users} iconStyle="emerald" sparkline={SPARK_PARTNERS} sparkColor="#10B981" delay={0.15} />
            <KPICard title="Avg Latency" rawValue={89} displaySuffix="ms" change="Healthy" icon={Clock} iconStyle="cyan" sparkline={SPARK_LATENCY} sparkColor="#8B7355" delay={0.2} />
            <KPICard title="Error Rate" rawValue={0.08} decimals={2} displaySuffix="%" change="Low" icon={AlertCircle} iconStyle="emerald" sparkline={SPARK_ERRORS} sparkColor="#10B981" delay={0.25} />
            <KPICard title="Revenue / Usage" rawValue={24.8} decimals={1} displaySuffix="K" change="$24.8K this month" icon={DollarSign} iconStyle="violet" sparkline={SPARK_REVENUE} sparkColor="#6F5C46" delay={0.3} />
          </div>
        </div>

        {/* ═══════ SECTION NAV ═══════ */}
        <div className="animate-stagger-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.key} onClick={() => setActiveSection(item.key)} className={`api-chart-tab ${activeSection === item.key ? 'active' : ''}`}>
                  <Icon className="h-3.5 w-3.5" />{item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════ MAIN LAYOUT: 70/30 ═══════ */}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

          {/* ──── LEFT CONTENT ──── */}
          <div className="space-y-6 min-w-0">

            {/* ── ANALYTICS DASHBOARD ── */}
            {activeSection === 'analytics' && (
              <div className="space-y-6" style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="adm-chart-card">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">API Analytics</h3>
                      <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-0.5">Platform traffic & performance</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {(['traffic', 'endpoints', 'errors', 'geography', 'revenue'] as AnalyticsTab[]).map((t) => (
                          <button key={t} onClick={() => setAnalyticsTab(t)} className={`api-chart-tab ${analyticsTab === t ? 'active' : ''}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                        ))}
                      </div>
                      <div className="adm-header-btn-group">
                        {(['live', '24h', '7d', '30d'] as TimeRange[]).map((r) => (
                          <button key={r} onClick={() => setTimeRange(r)} className={`adm-range-btn ${timeRange === r ? 'active' : ''}`}>{r}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chart Area */}
                  {analyticsTab === 'traffic' && (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="apiTrafficFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B7355" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#8B7355" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                        <Tooltip content={<ApiTooltip />} />
                        <Area type="monotone" dataKey="requests" stroke="#8B7355" strokeWidth={2.5} fill="url(#apiTrafficFill)" animationDuration={1200} name="Requests" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {analyticsTab === 'endpoints' && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ENDPOINT_BARS} layout="vertical">
                        <defs>
                          <linearGradient id="apiBarFill" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#8B7355" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="#A89478" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--fg-secondary)', fontFamily: 'monospace' }} stroke="transparent" axisLine={false} tickLine={false} width={100} />
                        <Tooltip content={<ApiTooltip />} />
                        <Bar dataKey="requests" fill="url(#apiBarFill)" radius={[0, 6, 6, 0]} animationDuration={1200} name="Requests" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {analyticsTab === 'errors' && (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="apiErrFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                        <Tooltip content={<ApiTooltip />} />
                        <Area type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={2} fill="url(#apiErrFill)" animationDuration={1200} name="Errors" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {analyticsTab === 'geography' && (
                    <div className="space-y-2 py-2">
                      {GEO_DATA.map((g, i) => (
                        <div key={g.country} className="flex items-center gap-3" style={{ animation: `slide-up-fade 0.3s ease-out ${0.03 * i}s both` }}>
                          <span className="text-[16px] w-6 text-center">{g.flag}</span>
                          <span className="text-[12px] font-medium text-[var(--fg)] min-w-[140px]">{g.country}</span>
                          <div className="flex-1 h-6 bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
                            <div className="h-full rounded-lg bg-gradient-to-r from-[#8B7355] to-[#A89478] transition-all duration-1000" style={{ width: `${g.pct}%` }} />
                          </div>
                          <span className="text-[11px] font-semibold text-[var(--fg-secondary)] min-w-[60px] text-right">{g.requests.toLocaleString()}</span>
                          <span className="text-[10px] text-[var(--fg-muted)] min-w-[30px]">{g.pct}%</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {analyticsTab === 'revenue' && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <defs>
                          <linearGradient id="apiRevFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6F5C46" stopOpacity={0.85} />
                            <stop offset="100%" stopColor="#6F5C46" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                        <Tooltip content={<ApiTooltip />} />
                        <Bar dataKey="revenue" fill="url(#apiRevFill)" radius={[4, 4, 0, 0]} animationDuration={1200} name="Revenue ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* ── API KEYS CENTER ── */}
            {activeSection === 'keys' && (
              <div style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="adm-section-icon"><Key className="h-3.5 w-3.5 text-[#8B7355]" /></div>
                    <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">API Keys</h2>
                    <span className="adm-count-badge">{API_KEYS.length}</span>
                  </div>
                  <button type="button" className="adm-action-btn primary" onClick={() => setModal({ type: 'create-key' })}>
                    <Plus className="h-3.5 w-3.5" /> Create Key
                  </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="adm-table-search">
                      <Search className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                      <input type="text" placeholder="Search keys or owners..." value={keySearch} onChange={(e) => setKeySearch(e.target.value)} className="adm-table-search-input" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Filter className="h-3 w-3 text-[var(--fg-muted)]" />
                      {(['all', 'active', 'idle', 'expiring', 'revoked'] as const).map((f) => (
                        <button key={f} onClick={() => setKeyStatusFilter(f)} className={`adm-filter-chip ${keyStatusFilter === f ? 'active' : ''}`}>
                          {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={keyEnvFilter} onChange={(e) => setKeyEnvFilter(e.target.value as any)} className="text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 cursor-pointer">
                      <option value="all">All Envs</option>
                      <option value="Production">Production</option>
                      <option value="Staging">Staging</option>
                      <option value="Development">Development</option>
                    </select>
                    <select value={`${keySortKey}-${keySortDir}`} onChange={(e) => { const [k, d] = e.target.value.split('-'); setKeySortKey(k as KeySortKey); setKeySortDir(d as 'asc' | 'desc'); }} className="text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 cursor-pointer">
                      <option value="requestsToday-desc">Most Used</option>
                      <option value="requestsToday-asc">Least Used</option>
                      <option value="name-asc">Name A-Z</option>
                      <option value="created-desc">Newest</option>
                      <option value="expiry-asc">Expiring Soon</option>
                    </select>
                  </div>
                </div>

                {/* Keys Table */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
                  <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                    <span className="min-w-[160px]">Key Name</span>
                    <span className="min-w-[120px]">Owner</span>
                    <span className="min-w-[55px]">Env</span>
                    <span className="min-w-[60px]">Status</span>
                    <span className="min-w-[70px]">Last Used</span>
                    <span className="min-w-[80px] text-right">Requests</span>
                    <span className="min-w-[70px]">Rate Limit</span>
                    <span className="ml-auto min-w-[100px] text-right">Actions</span>
                  </div>
                  {filteredKeys.map((k, i) => {
                    const sc = KEY_STATUS_CONFIG[k.status];
                    return (
                      <div key={k.id} className="api-key-row flex-col lg:flex-row" style={{ animation: `slide-up-fade 0.3s ease-out ${0.02 * i}s both` }} onClick={() => { setSelectedKey(k); setDrawerTab(0); }}>
                        <div className="flex items-center gap-2 min-w-[160px]">
                          <div className="h-7 w-7 rounded-lg bg-[rgba(139,115,85,0.08)] flex items-center justify-center shrink-0">
                            <Key className="h-3.5 w-3.5 text-[#8B7355]" />
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-[var(--fg)] leading-tight">{k.name}</p>
                            <p className="text-[10px] text-[var(--fg-muted)] font-mono">{k.maskedKey}</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-[var(--fg-secondary)] min-w-[120px] hidden lg:block">{k.owner}</span>
                        <span className="min-w-[55px] hidden lg:block"><span className={`api-badge ${ENV_CSS[k.env]}`}>{k.env.slice(0, 4)}</span></span>
                        <span className="min-w-[60px]"><span className={`api-badge ${sc.cssClass}`}>{sc.label}</span></span>
                        <span className="text-[11px] text-[var(--fg-muted)] min-w-[70px] hidden lg:block">{k.lastUsed}</span>
                        <span className="text-[11px] font-semibold text-[var(--fg)] min-w-[80px] text-right hidden lg:block">{k.requestsToday.toLocaleString()}</span>
                        <span className="text-[10px] text-[var(--fg-muted)] min-w-[70px] hidden lg:block">{k.rateLimit}</span>
                        <div className="ml-auto flex items-center gap-1 min-w-[100px] justify-end" onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={() => handleCopyKey(k)} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors" title="Copy">
                            {copiedKeyId === k.id ? <Check className="h-3 w-3 text-[#10B981]" /> : <Copy className="h-3 w-3 text-[var(--fg-muted)]" />}
                          </button>
                          <button type="button" className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors" title="Regenerate">
                            <RotateCcw className="h-3 w-3 text-[var(--fg-muted)]" />
                          </button>
                          {k.status === 'active' && (
                            <button type="button" onClick={() => setModal({ type: 'revoke', key: k })} className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[rgba(239,68,68,0.08)] transition-colors" title="Revoke">
                              <Ban className="h-3 w-3 text-[#EF4444]" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredKeys.length === 0 && <div className="text-center py-16 text-[var(--fg-muted)] text-sm">No keys match your filters.</div>}
                </div>
              </div>
            )}

            {/* ── PARTNERS MANAGEMENT ─��� */}
            {activeSection === 'partners' && (
              <div style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="adm-section-icon"><Users className="h-3.5 w-3.5 text-[#10B981]" /></div>
                    <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Partners</h2>
                    <span className="adm-count-badge">{PARTNERS.length}</span>
                    {pendingPartners > 0 && <span className="text-[10px] font-bold text-[#F59E0B] bg-[rgba(245,158,11,0.08)] px-2 py-0.5 rounded-full">{pendingPartners} Pending</span>}
                  </div>
                  <button type="button" className="adm-action-btn primary" onClick={() => setModal({ type: 'add-partner' })}>
                    <Plus className="h-3.5 w-3.5" /> Add Partner
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {PARTNERS.map((p, i) => (
                    <div key={p.id} className="api-partner-card" style={{ animation: `slide-up-fade 0.4s ease-out ${0.03 * i}s both` }}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white text-[13px] font-bold shrink-0" style={{ background: p.color }}>
                          {p.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-[var(--fg)] truncate">{p.company}</p>
                            <span className={`api-badge ${p.status === 'active' ? 'active' : p.status === 'pending' ? 'expiring' : 'suspended'}`}>{p.status}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-[var(--fg-muted)]">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${p.tier === 'Enterprise' ? 'bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : p.tier === 'Premium' ? 'bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : p.tier === 'Standard' ? 'bg-[rgba(107,114,128,0.08)] text-[#6B7280]' : 'bg-[rgba(245,158,11,0.08)] text-[#F59E0B]'}`}>{p.tier}</span>
                            <span>{p.region}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] mb-3">
                        <div><span className="text-[var(--fg-muted)]">Requests</span><p className="font-semibold text-[var(--fg)]">{(p.requests / 1000).toFixed(0)}K</p></div>
                        <div><span className="text-[var(--fg-muted)]">Keys</span><p className="font-semibold text-[var(--fg)]">{p.keysCount}</p></div>
                        <div><span className="text-[var(--fg-muted)]">SLA</span><p className="font-semibold text-[var(--fg)]">{p.slaTier}</p></div>
                      </div>

                      {/* Quota bar */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-[10px] text-[var(--fg-muted)] mb-1">
                          <span>Quota</span>
                          <span>{Math.round((p.requests / p.quota) * 100)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${(p.requests / p.quota) > 0.9 ? 'bg-gradient-to-r from-[#F59E0B] to-[#EF4444]' : 'bg-gradient-to-r from-[#8B7355] to-[#A89478]'}`} style={{ width: `${Math.min(100, (p.requests / p.quota) * 100)}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                        <span className="text-[10px] text-[var(--fg-muted)]">Last active: {p.lastActive}</span>
                        <div className="ml-auto flex items-center gap-1">
                          {p.status === 'pending' && <button type="button" className="text-[10px] font-semibold text-[#10B981] hover:underline" onClick={() => showToast(`${p.company} approved`)}>Approve</button>}
                          <button type="button" className="text-[10px] font-semibold text-[var(--fg-muted)] hover:text-[#8B7355]">Manage</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ENDPOINT PERFORMANCE ── */}
            {activeSection === 'endpoints' && (
              <div style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="adm-section-icon" style={{ background: 'rgba(139,115,85, 0.08)', borderColor: 'rgba(139,115,85, 0.15)' }}>
                      <Zap className="h-3.5 w-3.5 text-[#8B7355]" />
                    </div>
                    <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Endpoint Performance</h2>
                    <span className="adm-count-badge">{ENDPOINTS.length}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
                  {/* Header */}
                  <div className="hidden md:grid grid-cols-8 gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                    <span className="col-span-2">Route</span>
                    <span className="text-right">Requests</span>
                    <span className="text-right">Avg Latency</span>
                    <span className="text-right">P95</span>
                    <span className="text-right">Error %</span>
                    <span className="text-right">Success</span>
                    <span className="text-right">Trend</span>
                  </div>
                  {ENDPOINTS.map((ep, i) => (
                    <div key={ep.route} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center px-4 py-3 border-b border-[var(--border)] hover:bg-[rgba(139,115,85,0.02)] transition-colors" style={{ animation: `slide-up-fade 0.3s ease-out ${0.03 * i}s both` }}>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-[var(--fg-muted)] bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">{ep.method}</span>
                        <span className="api-endpoint-route">{ep.route}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--fg)] text-right">{ep.requests.toLocaleString()}</span>
                      <span className={`text-[11px] text-right font-medium ${ep.avgLatency > 150 ? 'text-[#F59E0B]' : 'text-[var(--fg-secondary)]'}`}>{ep.avgLatency}ms</span>
                      <span className={`text-[11px] text-right ${ep.p95Latency > 300 ? 'text-[#F59E0B] font-semibold' : 'text-[var(--fg-muted)]'}`}>{ep.p95Latency}ms</span>
                      <span className={`text-[11px] text-right ${ep.errorRate > 0.05 ? 'text-[#F59E0B] font-semibold' : 'text-[var(--fg-secondary)]'}`}>{ep.errorRate}%</span>
                      <span className="text-[11px] text-[#10B981] text-right font-medium">{ep.successRate}%</span>
                      <div className="flex items-center justify-end gap-1">
                        {ep.trend >= 0 ? <TrendingUp className="h-3 w-3 text-[#10B981]" /> : <TrendingDown className="h-3 w-3 text-[#EF4444]" />}
                        <span className={`text-[11px] font-semibold ${ep.trend >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>{ep.trend >= 0 ? '+' : ''}{ep.trend}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── GOVERNANCE & RATE LIMITS ── */}
            {activeSection === 'governance' && (
              <div className="space-y-6" style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="adm-section-icon"><Shield className="h-3.5 w-3.5 text-[#8B7355]" /></div>
                      <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Rate Limit Policies</h2>
                    </div>
                    <button type="button" className="adm-text-btn">Edit Policies <ArrowRight className="h-3 w-3" /></button>
                  </div>

                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
                    {RATE_POLICIES.map((pol, i) => (
                      <div key={pol.tier} className="api-policy-row" style={{ animation: `slide-up-fade 0.3s ease-out ${0.04 * i}s both` }}>
                        <div>
                          <p className="text-[12px] font-semibold text-[var(--fg)]">{pol.tier}</p>
                          <p className="text-[10px] text-[var(--fg-muted)]">Burst: {pol.burst}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-bold text-[var(--fg)]">{pol.limit}</span>
                          <button type="button" className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"><Edit3 className="h-3 w-3 text-[var(--fg-muted)]" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Controls */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'IP Whitelist', desc: '14 allowed IPs', icon: Lock, active: true },
                    { label: 'Geo Restriction', desc: 'No restrictions', icon: Globe, active: false },
                    { label: 'Abuse Protection', desc: 'AI-powered detection', icon: Shield, active: true },
                    { label: 'Auto Quota Reset', desc: 'Monthly cycle', icon: RotateCcw, active: true },
                  ].map((ctrl, i) => {
                    const Icon = ctrl.icon;
                    return (
                      <div key={ctrl.label} className="api-rail-widget flex items-center justify-between" style={{ animation: `slide-up-fade 0.3s ease-out ${0.04 * i}s both` }}>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center">
                            <Icon className="h-4 w-4 text-[var(--fg-secondary)]" />
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-[var(--fg)]">{ctrl.label}</p>
                            <p className="text-[10px] text-[var(--fg-muted)]">{ctrl.desc}</p>
                          </div>
                        </div>
                        <div className={`h-6 w-11 rounded-full cursor-pointer transition-colors flex items-center ${ctrl.active ? 'bg-[#10B981] justify-end' : 'bg-[var(--bg-tertiary)] justify-start'}`}>
                          <div className={`h-5 w-5 rounded-full bg-white shadow-md mx-0.5 transition-all`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── INCIDENTS ── */}
            {activeSection === 'incidents' && (
              <div style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="adm-section-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                      <AlertTriangle className="h-3.5 w-3.5 text-[#EF4444]" />
                    </div>
                    <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">API Incidents</h2>
                    <span className="adm-count-badge">{API_INCIDENTS.filter((i) => i.status === 'active').length}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {API_INCIDENTS.map((inc, i) => (
                    <div key={inc.id} className="sys-incident-item" style={{ animation: `slide-up-fade 0.35s ease-out ${0.03 * i}s both` }}>
                      <div className="flex items-start gap-3">
                        <div className={`api-sev ${inc.severity} mt-1`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[var(--fg)] truncate">{inc.title}</p>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--fg-muted)] mt-0.5">
                            <span className="font-medium" style={{ color: inc.severity === 'high' ? '#F97316' : inc.severity === 'medium' ? '#F59E0B' : '#8B7355' }}>{inc.severity.toUpperCase()}</span>
                            <span>{inc.service}</span>
                            <span>{inc.timeAgo}</span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${inc.status === 'active' ? 'bg-[rgba(239,68,68,0.08)] text-[#EF4444]' : 'bg-[rgba(16,185,129,0.08)] text-[#10B981]'}`}>{inc.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {inc.status === 'active' && <button type="button" onClick={() => showToast('Incident resolved')} className="text-[10px] font-semibold text-[#10B981] hover:underline">Resolve</button>}
                          <button type="button" className="text-[10px] font-semibold text-[var(--fg-muted)] hover:text-[#8B7355] flex items-center gap-0.5">Logs <ExternalLink className="h-2.5 w-2.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ──── RIGHT INTELLIGENCE RAIL ──��─ */}
          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">

            {/* AI Recommendations */}
            <div className="api-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.1s both' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#8B7355] to-[#A89478] flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="api-rail-widget-title">AI Recommendations</span>
                <span className="ml-auto text-[9px] font-semibold text-[#8B7355] bg-[rgba(139,115,85,0.08)] px-2 py-0.5 rounded-full">Live</span>
              </div>
              <div className="space-y-3">
                {AI_RECOMMENDATIONS.map((r) => (
                  <div key={r.id} className="rounded-xl border border-[var(--border)] p-3 hover:border-[rgba(139,115,85,0.15)] transition-colors">
                    <div className="flex items-start gap-2 mb-1.5">
                      <span className={`api-sev ${r.severity} mt-1 shrink-0`} />
                      <p className="text-[11px] font-medium text-[var(--fg)] leading-snug">{r.text}</p>
                    </div>
                    <button type="button" className="text-[10px] font-semibold text-[#8B7355] hover:underline flex items-center gap-0.5">
                      <Eye className="h-2.5 w-2.5" /> {r.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Abuse Detection */}
            <div className="api-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.15s both' }}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-[#EF4444]" />
                <span className="api-rail-widget-title">Abuse Detection</span>
              </div>
              <div className="space-y-2.5">
                {ABUSE_ALERTS.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-[rgba(239,68,68,0.03)] border border-[rgba(239,68,68,0.08)]">
                    <span className={`api-sev ${a.severity} mt-0.5 shrink-0`} />
                    <p className="text-[11px] text-[var(--fg-secondary)] leading-snug">{a.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Developer Health Score */}
            <div className="api-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.2s both' }}>
              <div className="flex items-center gap-2 mb-4">
                <Gauge className="h-4 w-4 text-[var(--fg-secondary)]" />
                <span className="api-rail-widget-title">Developer Health</span>
              </div>
              <div className="flex items-center gap-5">
                <HealthRing score={92} />
                <div>
                  <p className="text-[18px] font-bold text-[#10B981]">92 / 100</p>
                  <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">Excellent platform health</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <TrendingUp className="h-3 w-3 text-[#10B981]" />
                    <span className="text-[10px] font-semibold text-[#10B981]">+4 this month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Region Status */}
            <div className="api-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.25s both' }}>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-4 w-4 text-[var(--fg-secondary)]" />
                <span className="api-rail-widget-title">Region Status</span>
              </div>
              <div className="space-y-2.5">
                {REGIONS_STATUS.map((r) => (
                  <div key={r.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`sys-dot ${r.status === 'healthy' ? 'green' : 'amber'}`} style={{ width: 6, height: 6 }} />
                      <span className="text-[12px] font-medium text-[var(--fg)]">{r.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[var(--fg-muted)]">{r.latency}ms</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${r.status === 'healthy' ? 'bg-[rgba(16,185,129,0.08)] text-[#10B981]' : 'bg-[rgba(245,158,11,0.08)] text-[#F59E0B]'}`}>
                        {r.status === 'healthy' ? 'Healthy' : 'Warning'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <div>
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <p className="text-[10px] text-[var(--fg-muted)] tracking-[0.04em] text-center pb-4 mt-4">
            API analytics updated in real-time &middot; Powered by <span className="font-semibold api-accent-text">GLIMMORA</span> Developer Platform
          </p>
        </div>

      </div>

      {/* ═══════ KEY DETAIL DRAWER ═════��═ */}
      {selectedKey && (
        <>
          <div className="api-drawer-backdrop" onClick={() => setSelectedKey(null)} />
          <div className="api-drawer" style={{ animation: 'slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div className="sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)] px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-[rgba(139,115,85,0.08)] flex items-center justify-center">
                    <Key className="h-4 w-4 text-[#8B7355]" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-bold text-[var(--fg)]">{selectedKey.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`api-badge ${KEY_STATUS_CONFIG[selectedKey.status].cssClass}`}>{KEY_STATUS_CONFIG[selectedKey.status].label}</span>
                      <span className={`api-badge ${ENV_CSS[selectedKey.env]}`}>{selectedKey.env}</span>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedKey(null)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors">
                  <X className="h-4 w-4 text-[var(--fg-muted)]" />
                </button>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['Overview', 'Usage Logs', 'Permissions', 'Security', 'Rotation', 'Webhooks', 'Revoke'].map((tab, i) => (
                  <button key={tab} onClick={() => setDrawerTab(i)} className={`api-chart-tab whitespace-nowrap ${drawerTab === i ? 'active' : ''}`}>{tab}</button>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {drawerTab === 0 && (
                <>
                  <div className="api-masked-key w-full justify-between">
                    <span>{selectedKey.maskedKey}</span>
                    <button type="button" onClick={() => handleCopyKey(selectedKey)} className="hover:text-[#8B7355] transition-colors">
                      {copiedKeyId === selectedKey.id ? <Check className="h-3.5 w-3.5 text-[#10B981]" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Owner', value: selectedKey.owner },
                      { label: 'Created', value: selectedKey.created },
                      { label: 'Expiry', value: selectedKey.expiry },
                      { label: 'Rate Limit', value: selectedKey.rateLimit },
                      { label: 'Requests Today', value: selectedKey.requestsToday.toLocaleString() },
                      { label: 'Last Used', value: selectedKey.lastUsed },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-[var(--bg-secondary)] p-3">
                        <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">{item.label}</span>
                        <p className="text-[14px] font-bold text-[var(--fg)] mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-[var(--border)] p-4">
                    <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-2">Scopes</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedKey.scopes.map((s) => (
                        <span key={s} className="text-[10px] font-mono font-semibold text-[#8B7355] bg-[rgba(139,115,85,0.06)] px-2 py-1 rounded-md">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[var(--border)] p-4">
                    <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-3">Usage (Last 24h)</h4>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={TRAFFIC_24H}>
                        <defs><linearGradient id="keyUsageFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B7355" stopOpacity={0.15} /><stop offset="100%" stopColor="#8B7355" stopOpacity={0} /></linearGradient></defs>
                        <Area type="monotone" dataKey="requests" stroke="#8B7355" strokeWidth={1.5} fill="url(#keyUsageFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="adm-action-btn justify-center py-2.5"><RotateCcw className="h-3.5 w-3.5" /> Regenerate</button>
                    <button type="button" className="adm-action-btn justify-center py-2.5"><Edit3 className="h-3.5 w-3.5" /> Edit Scopes</button>
                    <button type="button" className="adm-action-btn justify-center py-2.5"><Copy className="h-3.5 w-3.5" /> Copy Key</button>
                    {selectedKey.status === 'active' && (
                      <button type="button" onClick={() => setModal({ type: 'revoke', key: selectedKey })} className="adm-action-btn justify-center py-2.5 text-[#EF4444] border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.04)]"><Ban className="h-3.5 w-3.5" /> Revoke</button>
                    )}
                  </div>
                </>
              )}

              {drawerTab === 1 && (
                <div className="text-[10px] font-mono bg-[var(--bg-secondary)] rounded-xl p-4 space-y-1 text-[var(--fg-muted)] max-h-[500px] overflow-y-auto">
                  <p><span className="text-[#8B7355]">[14:35:12]</span> <span className="text-[#10B981]">200</span> GET /v1/properties?limit=50 — 42ms</p>
                  <p><span className="text-[#8B7355]">[14:35:08]</span> <span className="text-[#10B981]">200</span> GET /v1/search?q=dubai — 89ms</p>
                  <p><span className="text-[#8B7355]">[14:34:55]</span> <span className="text-[#10B981]">200</span> GET /v1/properties/1234 — 38ms</p>
                  <p><span className="text-[#8B7355]">[14:34:42]</span> <span className="text-[#F59E0B]">429</span> GET /v1/search?q=* — Rate limited</p>
                  <p><span className="text-[#8B7355]">[14:34:30]</span> <span className="text-[#10B981]">200</span> POST /v1/analytics/query — 142ms</p>
                  <p><span className="text-[#8B7355]">[14:34:18]</span> <span className="text-[#10B981]">200</span> GET /v1/users/me — 24ms</p>
                  <p><span className="text-[#8B7355]">[14:34:05]</span> <span className="text-[#EF4444]">500</span> POST /v1/webhooks/test — Internal Error</p>
                  <p><span className="text-[#8B7355]">[14:33:52]</span> <span className="text-[#10B981]">200</span> GET /v1/properties?city=dubai — 56ms</p>
                  <p><span className="text-[#8B7355]">[14:33:40]</span> <span className="text-[#10B981]">201</span> POST /v1/transactions — 104ms</p>
                  <p><span className="text-[#8B7355]">[14:33:28]</span> <span className="text-[#10B981]">200</span> GET /v1/ai/query — 230ms</p>
                </div>
              )}

              {drawerTab === 2 && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-semibold text-[var(--fg)]">Granted Scopes</h4>
                  {selectedKey.scopes.map((scope) => (
                    <div key={scope} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <div className="flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-[#8B7355]" />
                        <span className="text-[12px] font-mono font-medium text-[var(--fg)]">{scope}</span>
                      </div>
                      <span className="api-badge active">Granted</span>
                    </div>
                  ))}
                  <h4 className="text-[11px] font-semibold text-[var(--fg)] mt-4">Available Scopes</h4>
                  {['admin:read', 'admin:write', 'billing:read'].filter((s) => !selectedKey.scopes.includes(s)).map((scope) => (
                    <div key={scope} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <div className="flex items-center gap-2">
                        <Unlock className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                        <span className="text-[12px] font-mono font-medium text-[var(--fg-muted)]">{scope}</span>
                      </div>
                      <button type="button" className="text-[10px] font-semibold text-[#8B7355] hover:underline">Grant</button>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 3 && (
                <div className="space-y-3">
                  {[
                    { event: 'Key used from new IP 203.0.113.42', time: '14:18', severity: 'medium' },
                    { event: 'Burst detected: 1.2K req/s', time: '14:02', severity: 'high' },
                    { event: 'Key accessed from EU region', time: '13:45', severity: 'info' },
                    { event: 'Scope change: added analytics:read', time: '12:00', severity: 'info' },
                  ].map((ev, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <span className={`api-sev ${ev.severity} mt-1 shrink-0`} />
                      <div>
                        <p className="text-[11px] font-semibold text-[var(--fg)]">{ev.event}</p>
                        <p className="text-[10px] text-[var(--fg-muted)]">{ev.time} today</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 4 && (
                <div className="space-y-3">
                  {[
                    { version: 'Current', rotated: selectedKey.created, by: 'Auto-rotation' },
                    { version: 'Previous', rotated: '2024-06-15', by: 'Manual' },
                    { version: 'Original', rotated: '2024-03-01', by: 'Created' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <RotateCcw className="h-4 w-4 text-[var(--fg-muted)] shrink-0" />
                      <div>
                        <p className="text-[12px] font-semibold text-[var(--fg)]">{r.version}</p>
                        <p className="text-[10px] text-[var(--fg-muted)]">{r.rotated} &middot; {r.by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 5 && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[var(--border)] p-4">
                    <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-2">Webhook Endpoints</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                        <span className="text-[11px] font-mono text-[var(--fg-secondary)]">https://webhook.site/abc123</span>
                        <span className="api-badge active">Active</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                        <span className="text-[11px] font-mono text-[var(--fg-secondary)]">https://api.partner.com/hook</span>
                        <span className="api-badge idle">Paused</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === 6 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[12px] text-[#EF4444] bg-[rgba(239,68,68,0.06)] rounded-xl p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Revoking this key is permanent</p>
                      <p className="text-[11px] text-[#EF4444]/70 mt-0.5">All integrations using this key will immediately lose access. This action cannot be undone.</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                    <p className="text-[11px] text-[var(--fg-muted)]">Current usage: <strong className="text-[var(--fg)]">{selectedKey.requestsToday.toLocaleString()} requests today</strong></p>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Owner: <strong className="text-[var(--fg)]">{selectedKey.owner}</strong></p>
                  </div>
                  <button type="button" onClick={() => { setModal({ type: 'revoke', key: selectedKey }); }} className="w-full py-2.5 rounded-xl text-[12px] font-bold text-white bg-gradient-to-r from-[#EF4444] to-[#DC2626] hover:from-[#DC2626] hover:to-[#B91C1C] transition-all">
                    Revoke API Key
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══════ MODALS ═══════ */}
      {modal && (
        <div className="api-modal-backdrop" onClick={() => setModal(null)}>
          <div className="api-modal" onClick={(e) => e.stopPropagation()} style={{ animation: 'slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-[var(--fg)]">
                {modal.type === 'create-key' && 'Create API Key'}
                {modal.type === 'add-partner' && 'Add Partner'}
                {modal.type === 'revoke' && 'Revoke API Key'}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"><X className="h-4 w-4 text-[var(--fg-muted)]" /></button>
            </div>

            {modal.type === 'create-key' && (
              <div className="space-y-4">
                {[
                  { label: 'Key Name', placeholder: 'e.g. Production API Key' },
                  { label: 'Owner', placeholder: 'e.g. Partner or team name' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1.5">{field.label}</label>
                    <input type="text" placeholder={field.placeholder} className="w-full text-[13px] text-[var(--fg)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[#8B7355] transition-colors" />
                  </div>
                ))}
                <div>
                  <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1.5">Environment</label>
                  <div className="flex items-center gap-2">
                    {(['Production', 'Staging', 'Development'] as KeyEnv[]).map((env) => (
                      <button key={env} className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${env === 'Production' ? 'border-[#8B7355] bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : 'border-[var(--border)] text-[var(--fg-secondary)] hover:border-[var(--fg-muted)]'}`}>
                        {env}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1.5">Scopes</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['properties:read', 'search:read', 'analytics:read', 'users:read', 'transactions:read', 'ai:query'].map((scope) => (
                      <button key={scope} className="text-[10px] font-mono font-semibold text-[var(--fg-muted)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-md border border-[var(--border)] hover:border-[#8B7355] hover:text-[#8B7355] transition-all cursor-pointer">{scope}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1.5">Expiry</label>
                  <div className="flex items-center gap-2">
                    {['90 days', '6 months', '1 year', 'Never'].map((exp) => (
                      <button key={exp} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[#8B7355] hover:text-[#8B7355] transition-all">{exp}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {modal.type === 'add-partner' && (
              <div className="space-y-4">
                {[
                  { label: 'Company Name', placeholder: 'e.g. Acme Corp' },
                  { label: 'Contact Email', placeholder: 'e.g. cto@acme.com' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1.5">{field.label}</label>
                    <input type="text" placeholder={field.placeholder} className="w-full text-[13px] text-[var(--fg)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-3.5 py-2.5 placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[#8B7355] transition-colors" />
                  </div>
                ))}
                <div>
                  <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1.5">Tier</label>
                  <div className="flex items-center gap-2">
                    {(['Trial', 'Standard', 'Premium', 'Enterprise'] as PartnerTier[]).map((tier) => (
                      <button key={tier} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[#8B7355] hover:text-[#8B7355] transition-all">{tier}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1.5">Allowed APIs</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Properties', 'Search', 'Analytics', 'Transactions', 'AI', 'Users'].map((api) => (
                      <button key={api} className="text-[10px] font-semibold text-[var(--fg-muted)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-md border border-[var(--border)] hover:border-[#10B981] hover:text-[#10B981] transition-all cursor-pointer">{api}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {modal.type === 'revoke' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[12px] text-[#EF4444] bg-[rgba(239,68,68,0.06)] rounded-xl p-3">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>This action is permanent. All integrations using this key will immediately lose access.</span>
                </div>
                <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                  <p className="text-[11px] text-[var(--fg-muted)]">Key: <strong className="text-[var(--fg)]">{modal.key?.name}</strong></p>
                  <p className="text-[11px] text-[var(--fg-muted)]">Owner: <strong className="text-[var(--fg)]">{modal.key?.owner}</strong></p>
                  <p className="text-[11px] text-[var(--fg-muted)]">Today&apos;s requests: <strong className="text-[var(--fg)]">{modal.key?.requestsToday.toLocaleString()}</strong></p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 justify-end mt-5">
              <button type="button" onClick={() => setModal(null)} className="adm-action-btn">Cancel</button>
              <button type="button" onClick={confirmModal} className={`adm-action-btn ${modal.type === 'revoke' ? '' : 'primary'}`} style={modal.type === 'revoke' ? { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#EF4444' } : undefined}>
                {modal.type === 'revoke' ? <Ban className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                {modal.type === 'create-key' ? 'Create Key' : modal.type === 'add-partner' ? 'Send Invitation' : 'Revoke Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TOAST ═══════ */}
      {toast && (
        <div className="api-toast">
          <Check className="h-4 w-4 text-[#10B981]" />
          <span>{toast}</span>
        </div>
      )}

      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
