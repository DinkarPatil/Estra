'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Activity, Clock, Server, AlertCircle, Shield, Zap, Cpu, HardDrive,
  MemoryStick, Wifi, TrendingUp, TrendingDown, RefreshCw, Download,
  Brain, Bell, Search, Filter, ChevronDown, ChevronUp, LayoutGrid,
  List, Globe, ArrowRight, ArrowUpRight, X, Play, Pause, Settings,
  Eye, RotateCcw, Scale, BellOff, Wrench, FileText, Check,
  AlertTriangle, Info, ChevronRight, Layers, Database, Cloud,
  Radio, Lock, Gauge, BarChart3, Sparkles, ExternalLink,
  GitBranch, Users, Terminal, Calendar,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

/* ══════════════════════════════════════
   TYPES
   ══════════════════════════════════════ */

type ServiceStatus = 'operational' | 'warning' | 'degraded' | 'down' | 'maintenance';
type ServiceEnv = 'Production' | 'Staging';
type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type IncidentStatus = 'investigating' | 'monitoring' | 'resolved' | 'scheduled';
type ChartTab = 'response' | 'throughput' | 'errors' | 'availability';
type TimeRange = '1h' | '24h' | '7d' | '30d';
type IncidentTab = 'active' | 'resolved' | 'scheduled';
type ServiceSortKey = 'name' | 'responseTime' | 'uptime' | 'errorRate' | 'requests';
type ViewMode = 'grid' | 'list';

interface Service {
  id: string;
  name: string;
  status: ServiceStatus;
  env: ServiceEnv;
  responseTime: number;
  uptime: number;
  requests: number;
  errorRate: number;
  cpu: number;
  icon: any;
  version: string;
  team: string;
  lastDeploy: string;
  instances: number;
}

interface Incident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  service: string;
  status: IncidentStatus;
  time: string;
  timeAgo: string;
}

/* ══════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════ */

const SERVICES: Service[] = [
  { id: 'api-gw', name: 'API Gateway', status: 'operational', env: 'Production', responseTime: 45, uptime: 99.99, requests: 2840, errorRate: 0.01, cpu: 12, icon: Globe, version: 'v3.8.2', team: 'Platform', lastDeploy: '2h ago', instances: 4 },
  { id: 'auth', name: 'Auth Service', status: 'operational', env: 'Production', responseTime: 62, uptime: 99.98, requests: 1920, errorRate: 0.02, cpu: 18, icon: Lock, version: 'v2.4.1', team: 'Security', lastDeploy: '6h ago', instances: 3 },
  { id: 'property', name: 'Property Service', status: 'operational', env: 'Production', responseTime: 88, uptime: 99.97, requests: 3100, errorRate: 0.03, cpu: 24, icon: Layers, version: 'v5.1.0', team: 'Core', lastDeploy: '1d ago', instances: 3 },
  { id: 'txn', name: 'Transaction Engine', status: 'operational', env: 'Production', responseTime: 104, uptime: 99.96, requests: 1450, errorRate: 0.01, cpu: 31, icon: Zap, version: 'v4.2.3', team: 'Finance', lastDeploy: '3d ago', instances: 5 },
  { id: 'ai', name: 'AI Engine', status: 'warning', env: 'Production', responseTime: 230, uptime: 99.94, requests: 890, errorRate: 0.05, cpu: 67, icon: Brain, version: 'v1.9.0', team: 'AI/ML', lastDeploy: '4h ago', instances: 6 },
  { id: 'pipeline', name: 'Data Pipeline', status: 'operational', env: 'Production', responseTime: 156, uptime: 99.95, requests: 620, errorRate: 0.02, cpu: 45, icon: Database, version: 'v2.0.1', team: 'Data', lastDeploy: '2d ago', instances: 2 },
  { id: 'cdn', name: 'CDN', status: 'operational', env: 'Production', responseTime: 18, uptime: 100.00, requests: 8200, errorRate: 0.00, cpu: 8, icon: Cloud, version: 'v1.3.0', team: 'Infra', lastDeploy: '7d ago', instances: 12 },
  { id: 'cache', name: 'Cache Layer', status: 'degraded', env: 'Production', responseTime: 320, uptime: 98.50, requests: 4100, errorRate: 0.12, cpu: 52, icon: HardDrive, version: 'v3.1.2', team: 'Platform', lastDeploy: '5h ago', instances: 3 },
  { id: 'db', name: 'Database Cluster', status: 'operational', env: 'Production', responseTime: 12, uptime: 99.99, requests: 5600, errorRate: 0.01, cpu: 38, icon: Database, version: 'v8.0.4', team: 'Data', lastDeploy: '14d ago', instances: 3 },
  { id: 'notify', name: 'Notification Service', status: 'maintenance', env: 'Staging', responseTime: 0, uptime: 99.90, requests: 0, errorRate: 0.00, cpu: 5, icon: Bell, version: 'v2.1.0', team: 'Platform', lastDeploy: '1h ago', instances: 1 },
];

const INCIDENTS: Incident[] = [
  { id: 'inc-1', title: 'Cache latency spike detected', severity: 'high', service: 'Cache Layer', status: 'investigating', time: '14:32', timeAgo: '3 min ago' },
  { id: 'inc-2', title: 'Auth retries increased in EU region', severity: 'medium', service: 'Auth Service', status: 'monitoring', time: '14:23', timeAgo: '12 min ago' },
  { id: 'inc-3', title: 'AI Engine CPU throttling detected', severity: 'medium', service: 'AI Engine', status: 'monitoring', time: '14:08', timeAgo: '27 min ago' },
  { id: 'inc-4', title: 'Scheduled DB backup completed', severity: 'info', service: 'Database Cluster', status: 'resolved', time: '14:07', timeAgo: '28 min ago' },
  { id: 'inc-5', title: 'CDN node eu-west-2 recovered', severity: 'low', service: 'CDN', status: 'resolved', time: '13:15', timeAgo: '1 hr ago' },
  { id: 'inc-6', title: 'AI Engine auto-restarted (OOM)', severity: 'high', service: 'AI Engine', status: 'resolved', time: '12:30', timeAgo: '2 hrs ago' },
  { id: 'inc-7', title: 'Memory threshold warning on Data Pipeline', severity: 'medium', service: 'Data Pipeline', status: 'resolved', time: '11:45', timeAgo: '3 hrs ago' },
  { id: 'inc-8', title: 'Notification Service maintenance window', severity: 'info', service: 'Notification Service', status: 'scheduled', time: '15:00', timeAgo: 'in 25 min' },
];

const AI_DIAGNOSTICS = [
  { id: 1, title: 'Cache Layer latency rising 18%', description: 'Redis cluster memory pressure causing increased eviction rates. Recommend scaling to 4 nodes.', severity: 'high' as const, action: 'Investigate' },
  { id: 2, title: 'Auth retries unusual in EU region', description: 'Token validation latency 3x normal for eu-west-1 load balancer. Likely DNS resolution issue.', severity: 'medium' as const, action: 'Monitor' },
  { id: 3, title: 'Memory trend suggests scaling in 2 days', description: 'AI Engine memory usage growing 2.3% daily. Current trajectory hits 90% threshold in ~48 hours.', severity: 'medium' as const, action: 'Plan Scale' },
];

const REGIONS = [
  { name: 'US East', status: 'healthy' as const, latency: 32 },
  { name: 'Europe', status: 'warning' as const, latency: 89 },
  { name: 'APAC', status: 'healthy' as const, latency: 54 },
];

const ALERT_SUMMARY = { critical: 0, high: 1, medium: 3, low: 4 };

/* Chart data generators */
function generateHourlyData(hours: number) {
  return Array.from({ length: hours }, (_, i) => {
    const h = i < 10 ? `0${i}:00` : `${i}:00`;
    return {
      time: h,
      response: 120 + Math.round(Math.sin(i * 0.4) * 30) + Math.round(Math.random() * 20),
      throughput: 2400 + Math.round(Math.sin(i * 0.3) * 800) + Math.round(Math.random() * 200),
      errors: Math.max(0, Math.round(Math.sin(i * 0.5) * 3) + Math.round(Math.random() * 2)),
      availability: 99.9 + Math.random() * 0.09,
    };
  });
}

const PERF_DATA_24H = generateHourlyData(24);
const PERF_DATA_1H = PERF_DATA_24H.slice(-6).map((d, i) => ({ ...d, time: `${14 + Math.floor(i / 6)}:${(i * 10).toString().padStart(2, '0')}` }));
const PERF_DATA_7D = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - 6 + i);
  return {
    time: d.toLocaleDateString('en', { weekday: 'short' }),
    response: 130 + Math.round(Math.random() * 30),
    throughput: 2200 + Math.round(Math.random() * 600),
    errors: Math.round(Math.random() * 8),
    availability: 99.92 + Math.random() * 0.07,
  };
});
const PERF_DATA_30D = Array.from({ length: 30 }, (_, i) => ({
  time: `${i + 1}`,
  response: 125 + Math.round(Math.sin(i * 0.2) * 25) + Math.round(Math.random() * 15),
  throughput: 2100 + Math.round(Math.sin(i * 0.15) * 500),
  errors: Math.round(Math.random() * 10),
  availability: 99.90 + Math.random() * 0.09,
}));

const PERF_MAP: Record<TimeRange, typeof PERF_DATA_24H> = {
  '1h': PERF_DATA_1H,
  '24h': PERF_DATA_24H,
  '7d': PERF_DATA_7D,
  '30d': PERF_DATA_30D,
};

/* KPI sparklines */
const SPARK_UPTIME = [{ v: 99.95 }, { v: 99.96 }, { v: 99.97 }, { v: 99.96 }, { v: 99.98 }, { v: 99.97 }, { v: 99.98 }, { v: 99.99 }, { v: 99.98 }, { v: 99.97 }, { v: 99.98 }, { v: 99.98 }];
const SPARK_RESPONSE = [{ v: 155 }, { v: 148 }, { v: 152 }, { v: 145 }, { v: 140 }, { v: 144 }, { v: 138 }, { v: 142 }, { v: 139 }, { v: 143 }, { v: 141 }, { v: 142 }];
const SPARK_ERRORS = [{ v: 0.05 }, { v: 0.04 }, { v: 0.03 }, { v: 0.04 }, { v: 0.03 }, { v: 0.02 }, { v: 0.03 }, { v: 0.02 }, { v: 0.02 }, { v: 0.03 }, { v: 0.02 }, { v: 0.02 }];
const SPARK_SERVICES = [{ v: 16 }, { v: 17 }, { v: 17 }, { v: 18 }, { v: 17 }, { v: 18 }, { v: 18 }, { v: 18 }, { v: 17 }, { v: 18 }, { v: 18 }, { v: 18 }];
const SPARK_ALERTS = [{ v: 12 }, { v: 9 }, { v: 11 }, { v: 8 }, { v: 10 }, { v: 7 }, { v: 9 }, { v: 6 }, { v: 8 }, { v: 7 }, { v: 5 }, { v: 7 }];
const SPARK_CAPACITY = [{ v: 52 }, { v: 54 }, { v: 56 }, { v: 55 }, { v: 58 }, { v: 57 }, { v: 59 }, { v: 60 }, { v: 58 }, { v: 61 }, { v: 60 }, { v: 61 }];

/* ══════════════════════════════════════
   HOOKS
   ══════════════════════════════════════ */

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

function useLiveTimer(intervalMs = 12000) {
  const [lastSync, setLastSync] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setLastSync(0);
    }, intervalMs);
    const ticker = setInterval(() => {
      setLastSync((s) => s + 1);
    }, 1000);
    return () => { clearInterval(id); clearInterval(ticker); };
  }, [intervalMs]);

  return lastSync;
}

/* ══════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════ */

function Sparkline({ data, color, height = 30 }: { data: { v: number }[]; color: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} activeDot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function SysTooltip({ active, payload, label }: any) {
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

/* ── KPI Card ── */
function KPICard({
  title, rawValue, displaySuffix, change, icon: Icon, iconStyle, sparkline, sparkColor, delay, decimals = 0, onClick,
}: {
  title: string; rawValue: number; displaySuffix?: string; change?: string; decimals?: number;
  icon: any; iconStyle: string; sparkline: { v: number }[]; sparkColor: string; delay: number;
  onClick?: () => void;
}) {
  const animated = useCountUp(rawValue, 1800, decimals);

  return (
    <div
      className="sys-kpi-card group cursor-pointer"
      style={{ animation: `slide-up-fade 0.5s ease-out ${delay}s both` }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">{title}</p>
        <div className={`sys-kpi-icon-box ${iconStyle}`}>
          <Icon className="h-4 w-4 text-white" strokeWidth={1.5} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="sys-kpi-value">
            {decimals > 0 ? animated.toFixed(decimals) : animated.toLocaleString()}
            {displaySuffix && <span className="text-[16px] font-semibold text-[var(--fg-muted)] ml-0.5">{displaySuffix}</span>}
          </p>
          {change && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                change.startsWith('+') ? 'bg-[rgba(34,197,94,0.08)] text-[#4ADE80]' :
                change.startsWith('-') ? 'bg-[rgba(239,68,68,0.08)] text-[#F87171]' :
                'bg-[rgba(139,115,85,0.08)] text-[#8B7355]'
              }`}>
                {change.startsWith('+') && <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.5} />}
                {change.startsWith('-') && <TrendingDown className="h-2.5 w-2.5" strokeWidth={2.5} />}
                <span>{change}</span>
              </div>
            </div>
          )}
        </div>
        <div className="w-[72px] shrink-0 opacity-30 group-hover:opacity-100 transition-opacity duration-300">
          <Sparkline data={sparkline} color={sparkColor} />
        </div>
      </div>
    </div>
  );
}

/* ── Status helpers ── */
const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; dotClass: string }> = {
  operational: { label: 'Operational', color: '#10B981', dotClass: 'green' },
  warning: { label: 'Warning', color: '#F59E0B', dotClass: 'amber' },
  degraded: { label: 'Degraded', color: '#F97316', dotClass: 'amber' },
  down: { label: 'Down', color: '#EF4444', dotClass: 'red' },
  maintenance: { label: 'Maintenance', color: '#8B7355', dotClass: 'blue' },
};

/* ── Service Card ── */
function ServiceCard({ service, onClick }: { service: Service; onClick: () => void }) {
  const sc = STATUS_CONFIG[service.status];
  const Icon = service.icon;

  return (
    <div className={`sys-service-card ${service.status}`} onClick={onClick}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
            <Icon className="h-4 w-4 text-[var(--fg-secondary)]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--fg)] leading-tight">{service.name}</p>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--fg-muted)]">
              {service.env}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`sys-dot ${sc.dotClass}`} />
          <span className="text-[11px] font-semibold" style={{ color: sc.color }}>{sc.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-[11px] mb-3">
        <div>
          <span className="text-[var(--fg-muted)]">Response</span>
          <p className="font-semibold text-[var(--fg)]">{service.responseTime}ms</p>
        </div>
        <div>
          <span className="text-[var(--fg-muted)]">Uptime</span>
          <p className="font-semibold text-[var(--fg)]">{service.uptime}%</p>
        </div>
        <div>
          <span className="text-[var(--fg-muted)]">Req/min</span>
          <p className="font-semibold text-[var(--fg)]">{service.requests.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-[var(--fg-muted)]">Error %</span>
          <p className="font-semibold text-[var(--fg)]">{service.errorRate}%</p>
        </div>
        <div>
          <span className="text-[var(--fg-muted)]">CPU</span>
          <p className={`font-semibold ${service.cpu > 60 ? 'text-[#F59E0B]' : 'text-[var(--fg)]'}`}>{service.cpu}%</p>
        </div>
        <div>
          <span className="text-[var(--fg-muted)]">Instances</span>
          <p className="font-semibold text-[var(--fg)]">{service.instances}</p>
        </div>
      </div>

      <div className="sys-actions flex items-center gap-2 pt-2 border-t border-[var(--border)]">
        <button type="button" className="text-[10px] font-semibold text-[var(--fg-muted)] hover:text-[#8B7355] transition-colors flex items-center gap-1">
          <Terminal className="h-3 w-3" /> Logs
        </button>
        <button type="button" className="text-[10px] font-semibold text-[var(--fg-muted)] hover:text-[#8B7355] transition-colors flex items-center gap-1">
          <RotateCcw className="h-3 w-3" /> Restart
        </button>
        <button type="button" className="text-[10px] font-semibold text-[var(--fg-muted)] hover:text-[#8B7355] transition-colors flex items-center gap-1">
          <Scale className="h-3 w-3" /> Scale
        </button>
        <button type="button" className="ml-auto text-[10px] font-semibold text-[#8B7355] flex items-center gap-1">
          Details <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ── Service List Row ── */
function ServiceListRow({ service, onClick }: { service: Service; onClick: () => void }) {
  const sc = STATUS_CONFIG[service.status];
  const Icon = service.icon;

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 border-b border-[var(--border)] hover:bg-[rgba(139,115,85,0.02)] transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="h-8 w-8 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-[var(--fg-secondary)]" strokeWidth={1.5} />
      </div>
      <div className="min-w-[140px]">
        <p className="text-[12px] font-semibold text-[var(--fg)]">{service.name}</p>
        <span className="text-[10px] text-[var(--fg-muted)]">{service.env}</span>
      </div>
      <div className="flex items-center gap-1.5 min-w-[90px]">
        <span className={`sys-dot ${sc.dotClass}`} style={{ width: 6, height: 6 }} />
        <span className="text-[11px] font-semibold" style={{ color: sc.color }}>{sc.label}</span>
      </div>
      <span className="text-[11px] text-[var(--fg-secondary)] min-w-[60px]">{service.responseTime}ms</span>
      <span className="text-[11px] text-[var(--fg-secondary)] min-w-[60px]">{service.uptime}%</span>
      <span className="text-[11px] text-[var(--fg-secondary)] min-w-[70px]">{service.requests.toLocaleString()}/m</span>
      <span className={`text-[11px] min-w-[50px] ${service.errorRate > 0.05 ? 'text-[#F59E0B] font-semibold' : 'text-[var(--fg-secondary)]'}`}>{service.errorRate}%</span>
      <span className={`text-[11px] min-w-[40px] ${service.cpu > 60 ? 'text-[#F59E0B] font-semibold' : 'text-[var(--fg-secondary)]'}`}>{service.cpu}%</span>
      <ChevronRight className="h-3.5 w-3.5 text-[var(--fg-muted)] ml-auto shrink-0" />
    </div>
  );
}

/* ── SLA Ring ── */
function SLARing({ percentage }: { percentage: number }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="sys-sla-ring">
      <svg viewBox="0 0 100 100" width="100" height="100">
        <circle className="sys-sla-ring-bg" cx="50" cy="50" r="42" />
        <circle
          className="sys-sla-ring-fill"
          cx="50" cy="50" r="42"
          stroke={percentage >= 99.9 ? '#10B981' : percentage >= 99.5 ? '#F59E0B' : '#EF4444'}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[16px] font-bold text-[var(--fg)] leading-none">{percentage}%</span>
        <span className="text-[8px] text-[var(--fg-muted)] mt-0.5 uppercase tracking-wider">SLA</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════ */

export default function SystemHealthPage() {
  /* ── State ── */
  const [serviceSearch, setServiceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('all');
  const [envFilter, setEnvFilter] = useState<ServiceEnv | 'all'>('all');
  const [sortKey, setSortKey] = useState<ServiceSortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [chartTab, setChartTab] = useState<ChartTab>('response');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [incidentTab, setIncidentTab] = useState<IncidentTab>('active');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [drawerTab, setDrawerTab] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: string; service?: Service } | null>(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  const syncAge = useLiveTimer(12000);

  /* ── Derived data ── */
  const filteredServices = useMemo(() => {
    let list = SERVICES.filter((s) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase())
    );
    if (statusFilter !== 'all') list = list.filter((s) => s.status === statusFilter);
    if (envFilter !== 'all') list = list.filter((s) => s.env === envFilter);

    return [...list].sort((a, b) => {
      const key = sortKey === 'name' ? 'name' : sortKey;
      const av = a[key];
      const bv = b[key];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [serviceSearch, statusFilter, envFilter, sortKey, sortDir]);

  const filteredIncidents = useMemo(() => {
    if (incidentTab === 'active') return INCIDENTS.filter((i) => i.status === 'investigating' || i.status === 'monitoring');
    if (incidentTab === 'resolved') return INCIDENTS.filter((i) => i.status === 'resolved');
    return INCIDENTS.filter((i) => i.status === 'scheduled');
  }, [incidentTab]);

  const chartData = PERF_MAP[timeRange];

  const chartMetrics = useMemo(() => {
    const key = chartTab === 'response' ? 'response' : chartTab === 'throughput' ? 'throughput' : chartTab === 'errors' ? 'errors' : 'availability';
    const values = chartData.map((d) => (d as any)[key] as number);
    return {
      peak: Math.max(...values),
      low: Math.min(...values),
      avg: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
    };
  }, [chartData, chartTab]);

  /* ── Handlers ── */
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleSort = (key: ServiceSortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleServiceAction = (action: string, svc: Service) => {
    if (action === 'restart') setModal({ type: 'restart', service: svc });
    else if (action === 'scale') setModal({ type: 'scale', service: svc });
    else if (action === 'silence') setModal({ type: 'silence', service: svc });
    else if (action === 'maintenance') setModal({ type: 'maintenance', service: svc });
  };

  const confirmModal = () => {
    if (modal) {
      showToast(`${modal.type === 'restart' ? 'Restart initiated' : modal.type === 'scale' ? 'Scaling triggered' : modal.type === 'silence' ? 'Alerts silenced' : 'Maintenance mode enabled'} for ${modal.service?.name}`);
    }
    setModal(null);
  };

  const acknowledgeAlert = (id: string) => {
    setAcknowledgedAlerts((prev) => new Set(prev).add(id));
    showToast('Alert acknowledged');
  };

  const handleExport = () => {
    const header = 'Service,Status,Response(ms),Uptime(%),Requests/min,Error(%),CPU(%)';
    const rows = SERVICES.map((s) => `${s.name},${s.status},${s.responseTime},${s.uptime},${s.requests},${s.errorRate},${s.cpu}`);
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-health-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report exported');
  };

  const operationalCount = SERVICES.filter((s) => s.status === 'operational').length;
  const warningCount = SERVICES.filter((s) => s.status !== 'operational' && s.status !== 'maintenance').length;

  /* ══════════════════════════════════════
     RENDER
     ══════════════════════════════════════ */

  return (
    <div className="sys-dashboard relative mx-auto w-full max-w-[1600px] px-1">
      <div className="relative z-10 space-y-7">

        {/* ═══════ COMMAND HEADER ═══════ */}
        <div className="animate-stagger-1">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            {/* Left */}
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="adm-live-badge">
                  <span className="adm-live-dot" />
                  <span>Live</span>
                </div>
                <span className="text-[10px] text-[var(--fg-muted)]">Synced {syncAge}s ago</span>
              </div>
              <h1 className="sys-heading">
                System <span className="sys-accent-text">Health</span>
              </h1>
              <p className="text-[13px] text-[var(--fg-muted)] mt-2 leading-relaxed max-w-2xl">
                Real-time infrastructure monitoring, service reliability, capacity intelligence, and incident visibility.
              </p>
            </div>

            {/* Right Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 mt-1">
              <button type="button" className="adm-action-btn" onClick={handleRefresh}>
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
              </button>
              <button type="button" className="adm-action-btn">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Incidents</span>
              </button>
              <button type="button" className="adm-action-btn" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button type="button" className="adm-action-btn">
                <Bell className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Alert Rules</span>
              </button>
              <button type="button" className="adm-action-btn primary">
                <Brain className="h-3.5 w-3.5" />
                <span>AI Diagnostics</span>
              </button>
            </div>
          </div>

          {/* Live Status Strip */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="sys-status-chip">
              <span className="sys-dot green" />
              <span className="text-[#10B981] font-semibold">All Core Systems Online</span>
            </div>
            <div className="sys-status-chip">
              <Activity className="h-3 w-3 text-[#10B981]" />
              <span>Uptime <strong className="text-[var(--fg)]">99.98%</strong></span>
            </div>
            <div className="sys-status-chip">
              <Server className="h-3 w-3 text-[#8B7355]" />
              <span>{operationalCount + warningCount} / {SERVICES.length} Services Active</span>
            </div>
            {warningCount > 0 && (
              <div className="sys-status-chip">
                <span className="sys-dot amber" />
                <span className="text-[#F59E0B] font-semibold">{warningCount} Warning{warningCount > 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="sys-status-chip">
              <Clock className="h-3 w-3 text-[var(--fg-muted)]" />
              <span>Last Sync: <strong className="text-[var(--fg)]">{syncAge}s ago</strong></span>
            </div>
            <div className="sys-status-chip">
              <Globe className="h-3 w-3 text-[var(--fg-muted)]" />
              <span>Region: <strong className="text-[var(--fg)]">Global</strong></span>
            </div>
          </div>
        </div>

        {/* ═══════ KPI GRID ═══════ */}
        <div className="animate-stagger-2">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KPICard title="Global Uptime" rawValue={99.98} decimals={2} displaySuffix="%" change="+0.03%" icon={Activity} iconStyle="emerald" sparkline={SPARK_UPTIME} sparkColor="#10B981" delay={0.05} />
            <KPICard title="Avg Response" rawValue={142} displaySuffix="ms" change="-8ms" icon={Clock} iconStyle="blue" sparkline={SPARK_RESPONSE} sparkColor="#8B7355" delay={0.1} />
            <KPICard title="Error Rate" rawValue={0.02} decimals={2} displaySuffix="%" change="-0.01%" icon={AlertCircle} iconStyle="emerald" sparkline={SPARK_ERRORS} sparkColor="#10B981" delay={0.15} />
            <KPICard title="Active Services" rawValue={18} displaySuffix=" / 18" change="Healthy" icon={Server} iconStyle="cyan" sparkline={SPARK_SERVICES} sparkColor="#8B7355" delay={0.2} />
            <KPICard title="Alerts Today" rawValue={7} change="2 unresolved" icon={Bell} iconStyle="amber" sparkline={SPARK_ALERTS} sparkColor="#F59E0B" delay={0.25} />
            <KPICard title="Capacity Load" rawValue={61} displaySuffix="%" change="Normal" icon={Gauge} iconStyle="indigo" sparkline={SPARK_CAPACITY} sparkColor="#8B7355" delay={0.3} />
          </div>
        </div>

        {/* ═══════ MAIN LAYOUT: 70/30 ═══════ */}
        <div className="animate-stagger-3">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">

            {/* ──── LEFT PRIMARY CONTENT ──── */}
            <div className="space-y-6 min-w-0">

              {/* ── SERVICE STATUS GRID ── */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="adm-section-icon">
                      <Server className="h-3.5 w-3.5 text-[#8B7355]" />
                    </div>
                    <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Service Status</h2>
                    <span className="adm-count-badge">{SERVICES.length}</span>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="adm-table-search">
                      <Search className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                      <input
                        type="text"
                        placeholder="Search services..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="adm-table-search-input"
                      />
                    </div>
                    {/* Status Filter */}
                    <div className="flex items-center gap-1">
                      <Filter className="h-3 w-3 text-[var(--fg-muted)]" />
                      {(['all', 'operational', 'warning', 'degraded', 'maintenance'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setStatusFilter(f)}
                          className={`adm-filter-chip ${statusFilter === f ? 'active' : ''}`}
                        >
                          {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Sort */}
                    <select
                      value={`${sortKey}-${sortDir}`}
                      onChange={(e) => {
                        const [k, d] = e.target.value.split('-');
                        setSortKey(k as ServiceSortKey);
                        setSortDir(d as 'asc' | 'desc');
                      }}
                      className="text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 cursor-pointer"
                    >
                      <option value="name-asc">Name A-Z</option>
                      <option value="name-desc">Name Z-A</option>
                      <option value="responseTime-desc">Slowest First</option>
                      <option value="responseTime-asc">Fastest First</option>
                      <option value="errorRate-desc">Most Errors</option>
                      <option value="uptime-asc">Lowest Uptime</option>
                    </select>
                    {/* View Toggle */}
                    <div className="sys-view-toggle">
                      <button type="button" className={`sys-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                        <LayoutGrid className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className={`sys-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                        <List className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Service Grid */}
                {viewMode === 'grid' ? (
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {filteredServices.map((svc, i) => (
                      <div key={svc.id} style={{ animation: `slide-up-fade 0.4s ease-out ${0.02 * i}s both` }}>
                        <ServiceCard service={svc} onClick={() => { setSelectedService(svc); setDrawerTab(0); }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
                    {/* List Header */}
                    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                      <span className="w-8" />
                      <span className="min-w-[140px]">Service</span>
                      <span className="min-w-[90px]">Status</span>
                      <span className="min-w-[60px] cursor-pointer hover:text-[var(--fg)]" onClick={() => handleSort('responseTime')}>Latency</span>
                      <span className="min-w-[60px] cursor-pointer hover:text-[var(--fg)]" onClick={() => handleSort('uptime')}>Uptime</span>
                      <span className="min-w-[70px] cursor-pointer hover:text-[var(--fg)]" onClick={() => handleSort('requests')}>Req/min</span>
                      <span className="min-w-[50px] cursor-pointer hover:text-[var(--fg)]" onClick={() => handleSort('errorRate')}>Errors</span>
                      <span className="min-w-[40px]">CPU</span>
                      <span className="ml-auto w-4" />
                    </div>
                    {filteredServices.map((svc) => (
                      <ServiceListRow key={svc.id} service={svc} onClick={() => { setSelectedService(svc); setDrawerTab(0); }} />
                    ))}
                  </div>
                )}

                {filteredServices.length === 0 && (
                  <div className="text-center py-16 text-[var(--fg-muted)] text-sm">
                    No services match your filters.
                  </div>
                )}
              </div>

              {/* ── PERFORMANCE ANALYTICS ── */}
              <div className="adm-chart-card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Performance Analytics</h3>
                    <p className="text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-0.5">Infrastructure metrics over time</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Chart Tabs */}
                    <div className="flex items-center gap-1">
                      {([
                        ['response', 'Response'],
                        ['throughput', 'Throughput'],
                        ['errors', 'Errors'],
                        ['availability', 'Availability'],
                      ] as [ChartTab, string][]).map(([key, label]) => (
                        <button key={key} onClick={() => setChartTab(key)} className={`sys-chart-tab ${chartTab === key ? 'active' : ''}`}>{label}</button>
                      ))}
                    </div>
                    {/* Time Range */}
                    <div className="adm-header-btn-group">
                      {(['1h', '24h', '7d', '30d'] as TimeRange[]).map((r) => (
                        <button key={r} onClick={() => setTimeRange(r)} className={`adm-range-btn ${timeRange === r ? 'active' : ''}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metric Callouts */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                    <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">Peak</span>
                    <p className="text-[16px] font-bold text-[var(--fg)] mt-0.5">
                      {chartTab === 'response' ? `${chartMetrics.peak}ms` : chartTab === 'throughput' ? chartMetrics.peak.toLocaleString() : chartTab === 'errors' ? chartMetrics.peak : `${chartMetrics.peak.toFixed(2)}%`}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                    <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">Average</span>
                    <p className="text-[16px] font-bold text-[var(--fg)] mt-0.5">
                      {chartTab === 'response' ? `${chartMetrics.avg}ms` : chartTab === 'throughput' ? chartMetrics.avg.toLocaleString() : chartTab === 'errors' ? chartMetrics.avg : `${chartMetrics.avg.toFixed(2)}%`}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--bg-secondary)] p-3">
                    <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">Lowest</span>
                    <p className="text-[16px] font-bold text-[var(--fg)] mt-0.5">
                      {chartTab === 'response' ? `${chartMetrics.low}ms` : chartTab === 'throughput' ? chartMetrics.low.toLocaleString() : chartTab === 'errors' ? chartMetrics.low : `${chartMetrics.low.toFixed(2)}%`}
                    </p>
                  </div>
                </div>

                {/* Chart */}
                <ResponsiveContainer width="100%" height={300}>
                  {chartTab === 'response' ? (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="sysResFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B7355" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#8B7355" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip content={<SysTooltip />} />
                      <Area type="monotone" dataKey="response" stroke="#8B7355" strokeWidth={2.5} fill="url(#sysResFill)" animationDuration={1200} name="Response (ms)" />
                    </AreaChart>
                  ) : chartTab === 'throughput' ? (
                    <BarChart data={chartData}>
                      <defs>
                        <linearGradient id="sysThrFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B7355" stopOpacity={0.85} />
                          <stop offset="100%" stopColor="#8B7355" stopOpacity={0.2} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                      <Tooltip content={<SysTooltip />} />
                      <Bar dataKey="throughput" fill="url(#sysThrFill)" radius={[4, 4, 0, 0]} animationDuration={1200} name="Requests/min" />
                    </BarChart>
                  ) : chartTab === 'errors' ? (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="sysErrFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.15} />
                          <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                      <Tooltip content={<SysTooltip />} />
                      <Area type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={2} fill="url(#sysErrFill)" animationDuration={1200} name="Errors" />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData}>
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} domain={[99.8, 100]} />
                      <Tooltip content={<SysTooltip />} />
                      <Line type="monotone" dataKey="availability" stroke="#10B981" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} animationDuration={1200} name="Availability %" />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* ── RESOURCE CAPACITY CENTER ── */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="adm-section-icon">
                      <Cpu className="h-3.5 w-3.5 text-[#8B7355]" />
                    </div>
                    <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Resource Capacity</h2>
                  </div>
                  <button type="button" className="adm-text-btn">
                    Capacity Planning <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: 'CPU Usage', value: 42, threshold: 80, icon: Cpu, trend: '+2%', forecast: '~55% in 7d', severity: 'healthy' as const },
                    { label: 'Memory Usage', value: 61, threshold: 85, icon: MemoryStick, trend: '+4%', forecast: '~68% in 7d', severity: 'moderate' as const },
                    { label: 'Storage Usage', value: 38, threshold: 90, icon: HardDrive, trend: '+1%', forecast: '~41% in 7d', severity: 'healthy' as const },
                    { label: 'Network I/O', value: 72, threshold: 100, icon: Wifi, trend: '-3%', forecast: 'Stable', severity: 'moderate' as const },
                    { label: 'Queue Depth', value: 24, threshold: 100, icon: Layers, trend: '0%', forecast: 'Normal', severity: 'healthy' as const },
                  ].map((res, i) => {
                    const Icon = res.icon;
                    const fillClass = res.value >= res.threshold * 0.9 ? 'critical' : res.value >= res.threshold * 0.7 ? 'warning' : res.value >= res.threshold * 0.5 ? 'moderate' : 'healthy';
                    return (
                      <div key={res.label} className="sys-rail-widget" style={{ animation: `slide-up-fade 0.4s ease-out ${0.03 * i}s both` }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-[var(--fg-muted)]" strokeWidth={1.5} />
                            <span className="text-[12px] font-semibold text-[var(--fg)]">{res.label}</span>
                          </div>
                          <span className="text-[18px] font-bold text-[var(--fg)]">
                            {res.label === 'Network I/O' ? '72 MB/s' : res.label === 'Queue Depth' ? '24' : `${res.value}%`}
                          </span>
                        </div>
                        <div className="sys-resource-track relative">
                          <div className={`sys-resource-fill ${fillClass}`} style={{ width: `${(res.value / res.threshold) * 100}%` }} />
                          {res.threshold < 100 && (
                            <div className="sys-resource-threshold" style={{ left: `${(res.threshold / 100) * 100}%` }} />
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--fg-muted)]">
                          <div className="flex items-center gap-1">
                            {res.trend.startsWith('+') ? <TrendingUp className="h-2.5 w-2.5 text-[#F59E0B]" /> : res.trend.startsWith('-') ? <TrendingDown className="h-2.5 w-2.5 text-[#10B981]" /> : <ArrowRight className="h-2.5 w-2.5" />}
                            <span>{res.trend} 7d</span>
                          </div>
                          <span>Forecast: {res.forecast}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── INCIDENT CENTER ── */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="adm-section-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' }}>
                      <AlertTriangle className="h-3.5 w-3.5 text-[#EF4444]" />
                    </div>
                    <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Incident Center</h2>
                    <span className="adm-count-badge">{INCIDENTS.filter((i) => i.status !== 'resolved').length}</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-4">
                  {(['active', 'resolved', 'scheduled'] as IncidentTab[]).map((tab) => (
                    <button key={tab} onClick={() => setIncidentTab(tab)} className={`sys-chart-tab ${incidentTab === tab ? 'active' : ''}`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {tab === 'active' && <span className="ml-1 text-[9px] bg-[rgba(239,68,68,0.1)] text-[#EF4444] rounded-full px-1.5 py-0.5 font-bold">{INCIDENTS.filter((i) => i.status === 'investigating' || i.status === 'monitoring').length}</span>}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {filteredIncidents.map((inc, i) => (
                    <div key={inc.id} className="sys-incident-item" style={{ animation: `slide-up-fade 0.35s ease-out ${0.03 * i}s both` }}>
                      <div className="flex items-start gap-3">
                        <div className={`sys-incident-sev ${inc.severity} mt-1`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[12px] font-semibold text-[var(--fg)] truncate">{inc.title}</p>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--fg-muted)]">
                            <span className="font-medium" style={{ color: STATUS_CONFIG[inc.severity === 'critical' ? 'down' : inc.severity === 'high' ? 'degraded' : inc.severity === 'medium' ? 'warning' : 'operational']?.color }}>{inc.severity.toUpperCase()}</span>
                            <span>{inc.service}</span>
                            <span>{inc.timeAgo}</span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${
                              inc.status === 'investigating' ? 'bg-[rgba(239,68,68,0.08)] text-[#EF4444]' :
                              inc.status === 'monitoring' ? 'bg-[rgba(245,158,11,0.08)] text-[#F59E0B]' :
                              inc.status === 'scheduled' ? 'bg-[rgba(139,115,85,0.08)] text-[#8B7355]' :
                              'bg-[rgba(16,185,129,0.08)] text-[#10B981]'
                            }`}>{inc.status}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {(inc.status === 'investigating' || inc.status === 'monitoring') && !acknowledgedAlerts.has(inc.id) && (
                            <button type="button" onClick={() => acknowledgeAlert(inc.id)} className="text-[10px] font-semibold text-[#8B7355] hover:underline">Acknowledge</button>
                          )}
                          <button type="button" className="text-[10px] font-semibold text-[var(--fg-muted)] hover:text-[#8B7355] flex items-center gap-0.5">
                            Root Cause <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredIncidents.length === 0 && (
                    <div className="text-center py-10 text-[var(--fg-muted)] text-sm">No incidents in this category.</div>
                  )}
                </div>
              </div>
            </div>

            {/* ──── RIGHT INTELLIGENCE RAIL ──── */}
            <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">

              {/* AI Diagnostics */}
              <div className="sys-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.1s both' }}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#8B7355] to-[#A89478] flex items-center justify-center">
                    <Brain className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="sys-rail-widget-title">AI Diagnostics</span>
                  <span className="ml-auto text-[9px] font-semibold text-[#8B7355] bg-[rgba(139,115,85,0.08)] px-2 py-0.5 rounded-full">Live</span>
                </div>
                <div className="space-y-3">
                  {AI_DIAGNOSTICS.map((d) => (
                    <div key={d.id} className="rounded-xl border border-[var(--border)] p-3 hover:border-[rgba(139,115,85,0.15)] transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`sys-incident-sev ${d.severity}`} style={{ width: 6, height: 6 }} />
                        <p className="text-[11px] font-semibold text-[var(--fg)] line-clamp-1">{d.title}</p>
                      </div>
                      <p className="text-[10px] text-[var(--fg-muted)] leading-relaxed line-clamp-2 mb-2">{d.description}</p>
                      <div className="flex items-center gap-2">
                        <button type="button" className="text-[10px] font-semibold text-[#8B7355] hover:underline flex items-center gap-0.5">
                          <Eye className="h-2.5 w-2.5" /> {d.action}
                        </button>
                        <button type="button" className="text-[10px] font-semibold text-[#10B981] hover:underline flex items-center gap-0.5">
                          <Wrench className="h-2.5 w-2.5" /> Apply Fix
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Region Health */}
              <div className="sys-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.15s both' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-4 w-4 text-[var(--fg-secondary)]" />
                  <span className="sys-rail-widget-title">Region Health</span>
                </div>
                <div className="space-y-2.5">
                  {REGIONS.map((r) => (
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

              {/* SLA Compliance */}
              <div className="sys-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.2s both' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="h-4 w-4 text-[var(--fg-secondary)]" />
                  <span className="sys-rail-widget-title">SLA Compliance</span>
                </div>
                <div className="flex items-center gap-5">
                  <SLARing percentage={99.95} />
                  <div>
                    <p className="text-[18px] font-bold text-[#10B981]">99.95%</p>
                    <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">Target Met</p>
                    <p className="text-[10px] text-[var(--fg-muted)]">SLA: 99.90% threshold</p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Check className="h-3 w-3 text-[#10B981]" />
                      <span className="text-[10px] font-semibold text-[#10B981]">Compliant</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Summary */}
              <div className="sys-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.25s both' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Bell className="h-4 w-4 text-[var(--fg-secondary)]" />
                  <span className="sys-rail-widget-title">Alert Summary</span>
                </div>
                <div className="space-y-2">
                  {([
                    { label: 'Critical', count: ALERT_SUMMARY.critical, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)' },
                    { label: 'High', count: ALERT_SUMMARY.high, color: '#F97316', bg: 'rgba(249, 115, 22, 0.08)' },
                    { label: 'Medium', count: ALERT_SUMMARY.medium, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)' },
                    { label: 'Low', count: ALERT_SUMMARY.low, color: '#8B7355', bg: 'rgba(139,115,85, 0.08)' },
                  ]).map((a) => (
                    <div key={a.label} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: a.color }} />
                        <span className="text-[12px] font-medium text-[var(--fg-secondary)]">{a.label}</span>
                      </div>
                      <span className="text-[12px] font-bold rounded-md px-2 py-0.5" style={{ color: a.color, background: a.bg }}>
                        {a.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <div>
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <p className="text-[10px] text-[var(--fg-muted)] tracking-[0.04em] text-center pb-4 mt-4">
            Infrastructure monitoring updated in real-time &middot; Powered by <span className="font-semibold sys-accent-text">GLIMMORA</span> Operations Engine
          </p>
        </div>

      </div>

      {/* ═══════ SERVICE DEEP DIVE DRAWER ═══════ */}
      {selectedService && (
        <>
          <div className="sys-drawer-backdrop" onClick={() => setSelectedService(null)} />
          <div className="sys-drawer" style={{ animation: 'slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)] px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className={`h-3 w-3 rounded-full`} style={{ backgroundColor: STATUS_CONFIG[selectedService.status].color }} />
                  <h2 className="text-[16px] font-bold text-[var(--fg)]">{selectedService.name}</h2>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--fg-muted)]">{selectedService.env}</span>
                </div>
                <button type="button" onClick={() => setSelectedService(null)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors">
                  <X className="h-4 w-4 text-[var(--fg-muted)]" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 -mx-1 px-1">
                {['Overview', 'Metrics', 'Logs', 'Dependencies', 'Deployments', 'Alerts', 'Scaling'].map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => setDrawerTab(i)}
                    className={`sys-chart-tab whitespace-nowrap ${drawerTab === i ? 'active' : ''}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-6 space-y-5">
              {drawerTab === 0 && (
                <>
                  {/* Overview */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Version', value: selectedService.version },
                      { label: 'Team', value: selectedService.team },
                      { label: 'Last Deploy', value: selectedService.lastDeploy },
                      { label: 'Instances', value: String(selectedService.instances) },
                      { label: 'Response Time', value: `${selectedService.responseTime}ms` },
                      { label: 'Uptime', value: `${selectedService.uptime}%` },
                      { label: 'Requests/min', value: selectedService.requests.toLocaleString() },
                      { label: 'Error Rate', value: `${selectedService.errorRate}%` },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-[var(--bg-secondary)] p-3">
                        <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">{item.label}</span>
                        <p className="text-[14px] font-bold text-[var(--fg)] mt-0.5">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Traffic Sparkline */}
                  <div className="rounded-xl border border-[var(--border)] p-4">
                    <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-3">Traffic (Last 24h)</h4>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={PERF_DATA_24H}>
                        <defs>
                          <linearGradient id="drawerFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B7355" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#8B7355" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="throughput" stroke="#8B7355" strokeWidth={1.5} fill="url(#drawerFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => handleServiceAction('restart', selectedService)} className="adm-action-btn justify-center py-2.5">
                      <RotateCcw className="h-3.5 w-3.5" /> Restart Service
                    </button>
                    <button type="button" onClick={() => handleServiceAction('scale', selectedService)} className="adm-action-btn justify-center py-2.5">
                      <Scale className="h-3.5 w-3.5" /> Scale Service
                    </button>
                    <button type="button" onClick={() => handleServiceAction('silence', selectedService)} className="adm-action-btn justify-center py-2.5">
                      <BellOff className="h-3.5 w-3.5" /> Silence Alerts
                    </button>
                    <button type="button" onClick={() => handleServiceAction('maintenance', selectedService)} className="adm-action-btn justify-center py-2.5">
                      <Wrench className="h-3.5 w-3.5" /> Maintenance Mode
                    </button>
                  </div>

                  {/* Connected Services */}
                  <div className="rounded-xl border border-[var(--border)] p-4">
                    <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-3">Connected Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {SERVICES.filter((s) => s.id !== selectedService.id).slice(0, 4).map((s) => {
                        const sc = STATUS_CONFIG[s.status];
                        return (
                          <div key={s.id} className="flex items-center gap-1.5 text-[11px] rounded-lg bg-[var(--bg-secondary)] px-2.5 py-1.5">
                            <span className={`sys-dot ${sc.dotClass}`} style={{ width: 5, height: 5 }} />
                            <span className="text-[var(--fg-secondary)]">{s.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {drawerTab === 1 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-3">Response Time (24h)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={PERF_DATA_24H}>
                      <defs>
                        <linearGradient id="drawerMetric" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8B7355" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#8B7355" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} interval={3} />
                      <YAxis tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                      <Tooltip content={<SysTooltip />} />
                      <Area type="monotone" dataKey="response" stroke="#8B7355" strokeWidth={2} fill="url(#drawerMetric)" />
                    </AreaChart>
                  </ResponsiveContainer>
                  <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-3 mt-5">Error Rate (24h)</h4>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={PERF_DATA_24H}>
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} interval={3} />
                      <YAxis tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} />
                      <Tooltip content={<SysTooltip />} />
                      <Bar dataKey="errors" fill="#EF4444" radius={[3, 3, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {drawerTab === 2 && (
                <div className="space-y-2">
                  <div className="text-[10px] font-mono bg-[var(--bg-secondary)] rounded-xl p-4 space-y-1 text-[var(--fg-muted)] max-h-[400px] overflow-y-auto">
                    <p><span className="text-[#8B7355]">[14:35:12]</span> <span className="text-[#10B981]">INFO</span>  Request processed in 42ms — GET /api/v1/health</p>
                    <p><span className="text-[#8B7355]">[14:35:08]</span> <span className="text-[#10B981]">INFO</span>  Connection pool: 45/50 active</p>
                    <p><span className="text-[#8B7355]">[14:34:55]</span> <span className="text-[#F59E0B]">WARN</span>  Slow query detected: 245ms — users.findByEmail</p>
                    <p><span className="text-[#8B7355]">[14:34:42]</span> <span className="text-[#10B981]">INFO</span>  Health check passed — all dependencies healthy</p>
                    <p><span className="text-[#8B7355]">[14:34:30]</span> <span className="text-[#10B981]">INFO</span>  Request processed in 38ms — POST /api/v1/auth/verify</p>
                    <p><span className="text-[#8B7355]">[14:34:18]</span> <span className="text-[#EF4444]">ERROR</span> Connection timeout to cache-node-3 — retrying (1/3)</p>
                    <p><span className="text-[#8B7355]">[14:34:10]</span> <span className="text-[#10B981]">INFO</span>  Request processed in 51ms — GET /api/v1/properties</p>
                    <p><span className="text-[#8B7355]">[14:33:58]</span> <span className="text-[#10B981]">INFO</span>  Cache hit ratio: 94.2%</p>
                    <p><span className="text-[#8B7355]">[14:33:45]</span> <span className="text-[#10B981]">INFO</span>  Request processed in 29ms — GET /api/v1/user/profile</p>
                    <p><span className="text-[#8B7355]">[14:33:30]</span> <span className="text-[#F59E0B]">WARN</span>  Memory usage at 72% — monitoring threshold 85%</p>
                  </div>
                </div>
              )}

              {drawerTab === 3 && (
                <div className="space-y-3">
                  <h4 className="text-[11px] font-semibold text-[var(--fg)]">Upstream Dependencies</h4>
                  {SERVICES.filter((s) => s.id !== selectedService.id).slice(0, 3).map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <div className="flex items-center gap-2">
                        <span className={`sys-dot ${STATUS_CONFIG[s.status].dotClass}`} style={{ width: 6, height: 6 }} />
                        <span className="text-[12px] font-medium text-[var(--fg)]">{s.name}</span>
                      </div>
                      <span className="text-[11px] text-[var(--fg-muted)]">{s.responseTime}ms</span>
                    </div>
                  ))}
                  <h4 className="text-[11px] font-semibold text-[var(--fg)] mt-4">Downstream Consumers</h4>
                  {SERVICES.filter((s) => s.id !== selectedService.id).slice(3, 6).map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <div className="flex items-center gap-2">
                        <span className={`sys-dot ${STATUS_CONFIG[s.status].dotClass}`} style={{ width: 6, height: 6 }} />
                        <span className="text-[12px] font-medium text-[var(--fg)]">{s.name}</span>
                      </div>
                      <span className="text-[11px] text-[var(--fg-muted)]">{s.requests} req/min</span>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 4 && (
                <div className="space-y-3">
                  {[
                    { version: selectedService.version, time: selectedService.lastDeploy, status: 'success', by: 'CI Pipeline' },
                    { version: 'v' + (parseFloat(selectedService.version.slice(1)) - 0.1).toFixed(1), time: '3d ago', status: 'success', by: 'CI Pipeline' },
                    { version: 'v' + (parseFloat(selectedService.version.slice(1)) - 0.2).toFixed(1), time: '8d ago', status: 'rolled back', by: 'Manual' },
                    { version: 'v' + (parseFloat(selectedService.version.slice(1)) - 0.3).toFixed(1), time: '15d ago', status: 'success', by: 'CI Pipeline' },
                  ].map((d, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <GitBranch className="h-4 w-4 text-[var(--fg-muted)] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-[var(--fg)]">{d.version}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${d.status === 'success' ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981]' : 'bg-[rgba(239,68,68,0.1)] text-[#EF4444]'}`}>{d.status}</span>
                        </div>
                        <p className="text-[10px] text-[var(--fg-muted)]">{d.time} &middot; {d.by}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 5 && (
                <div className="space-y-2">
                  {INCIDENTS.filter((inc) => inc.service === selectedService.name).length > 0 ? (
                    INCIDENTS.filter((inc) => inc.service === selectedService.name).map((inc) => (
                      <div key={inc.id} className="sys-incident-item">
                        <div className="flex items-center gap-2">
                          <span className={`sys-incident-sev ${inc.severity}`} />
                          <div>
                            <p className="text-[11px] font-semibold text-[var(--fg)]">{inc.title}</p>
                            <p className="text-[10px] text-[var(--fg-muted)]">{inc.timeAgo} &middot; {inc.status}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-[var(--fg-muted)] text-sm">No alerts for this service.</div>
                  )}
                </div>
              )}

              {drawerTab === 6 && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-[var(--bg-secondary)] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-[var(--fg)]">Current Instances</span>
                      <span className="text-[16px] font-bold text-[var(--fg)]">{selectedService.instances}</span>
                    </div>
                    <div className="sys-resource-track">
                      <div className="sys-resource-fill healthy" style={{ width: `${(selectedService.instances / 12) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-[var(--fg-muted)] mt-1.5">Max capacity: 12 instances</p>
                  </div>
                  <div className="space-y-2">
                    {[
                      { event: `Scaled from ${selectedService.instances - 1} to ${selectedService.instances}`, time: '2d ago', trigger: 'Auto-scale (CPU > 70%)' },
                      { event: `Scaled from ${selectedService.instances} to ${selectedService.instances - 1}`, time: '5d ago', trigger: 'Auto-scale (CPU < 30%)' },
                      { event: 'Manual scale to ' + selectedService.instances, time: '12d ago', trigger: 'Manual' },
                    ].map((e, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                        <Scale className="h-3.5 w-3.5 text-[var(--fg-muted)] shrink-0" />
                        <div>
                          <p className="text-[11px] font-semibold text-[var(--fg)]">{e.event}</p>
                          <p className="text-[10px] text-[var(--fg-muted)]">{e.time} &middot; {e.trigger}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleServiceAction('scale', selectedService)}
                    className="adm-action-btn primary w-full justify-center py-2.5"
                  >
                    <Scale className="h-3.5 w-3.5" /> Scale Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══════ ENTERPRISE CONTROL MODALS ═══════ */}
      {modal && (
        <div className="sys-modal-backdrop" onClick={() => setModal(null)}>
          <div className="sys-modal" onClick={(e) => e.stopPropagation()} style={{ animation: 'slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-bold text-[var(--fg)]">
                {modal.type === 'restart' && 'Restart Service'}
                {modal.type === 'scale' && 'Scale Service'}
                {modal.type === 'silence' && 'Silence Alerts'}
                {modal.type === 'maintenance' && 'Maintenance Mode'}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors">
                <X className="h-4 w-4 text-[var(--fg-muted)]" />
              </button>
            </div>

            <div className="rounded-xl bg-[var(--bg-secondary)] p-3 mb-4">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full`} style={{ backgroundColor: STATUS_CONFIG[modal.service?.status || 'operational'].color }} />
                <span className="text-[13px] font-semibold text-[var(--fg)]">{modal.service?.name}</span>
                <span className="text-[10px] text-[var(--fg-muted)]">{modal.service?.env}</span>
              </div>
            </div>

            {modal.type === 'restart' && (
              <div className="mb-5">
                <div className="flex items-center gap-2 text-[12px] text-[#F59E0B] bg-[rgba(245,158,11,0.08)] rounded-xl p-3 mb-3">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>This will cause a brief service interruption. Active connections will be gracefully drained.</span>
                </div>
                <p className="text-[12px] text-[var(--fg-secondary)]">The service will be restarted with zero-downtime rolling deployment. Expected downtime: &lt;5 seconds.</p>
              </div>
            )}

            {modal.type === 'scale' && (
              <div className="mb-5 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Target Instances</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    {[2, 3, 4, 6, 8].map((n) => (
                      <button key={n} className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${n === (modal.service?.instances || 3) ? 'border-[#8B7355] bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : 'border-[var(--border)] text-[var(--fg-secondary)] hover:border-[var(--fg-muted)]'}`}>
                        {n}
                      </button>
                    ))}
                    <span className="text-[11px] text-[var(--fg-muted)] ml-1">Auto</span>
                  </div>
                </div>
              </div>
            )}

            {modal.type === 'silence' && (
              <div className="mb-5">
                <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Duration</label>
                <div className="flex items-center gap-2 mt-1.5">
                  {['30 min', '1 hour', '4 hours', '24 hours'].map((d) => (
                    <button key={d} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[#8B7355] hover:text-[#8B7355] transition-all">
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {modal.type === 'maintenance' && (
              <div className="mb-5">
                <div className="flex items-center gap-2 text-[12px] text-[#8B7355] bg-[rgba(139,115,85,0.08)] rounded-xl p-3 mb-3">
                  <Wrench className="h-4 w-4 shrink-0" />
                  <span>Maintenance mode will redirect all traffic and suppress alerts for this service.</span>
                </div>
                <label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider">Scheduled Duration</label>
                <div className="flex items-center gap-2 mt-1.5">
                  {['1 hour', '2 hours', '4 hours', 'Custom'].map((d) => (
                    <button key={d} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[#8B7355] hover:text-[#8B7355] transition-all">
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 justify-end">
              <button type="button" onClick={() => setModal(null)} className="adm-action-btn">Cancel</button>
              <button type="button" onClick={confirmModal} className="adm-action-btn primary">
                <Check className="h-3.5 w-3.5" /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TOAST NOTIFICATION ═══════ */}
      {toast && (
        <div className="sys-toast">
          <Check className="h-4 w-4 text-[#10B981]" />
          <span>{toast}</span>
        </div>
      )}

      {/* Drawer slide-in keyframe (inline) */}
      <style>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
