'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Brain, Cpu, Network, TrendingUp, TrendingDown, RefreshCw, Download,
  Bell, Search, Filter, LayoutGrid, List, Globe, ArrowRight, X, Check,
  AlertTriangle, ChevronRight, Shield, Zap, Plus, Eye, Settings,
  BarChart3, Sparkles, Clock, Activity, Gauge, Play, Pause, GitBranch,
  AlertCircle, Layers, Radio, ExternalLink, Target, Lightbulb,
  RotateCcw, Scale, FileText, Lock, Users, Sliders, ChevronDown,
  DollarSign, Timer, Workflow, TriangleAlert, CircleCheck, Binary,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

/* ══════════════════════════════════════
   TYPES
   ══════════════════════════════════════ */

type ModelStatus = 'active' | 'training' | 'paused' | 'warning' | 'deprecated';
type PageSection = 'models' | 'analytics' | 'knowledge' | 'automation' | 'governance' | 'incidents';
type AnalyticsTab = 'accuracy' | 'latency' | 'predictions' | 'impact' | 'drift';
type TimeRange = '24h' | '7d' | '30d' | '6m';
type ModelSortKey = 'name' | 'accuracy' | 'usage' | 'latency' | 'drift';
type IncidentTab = 'active' | 'resolved' | 'scheduled';

interface AiModel {
  id: string;
  name: string;
  version: string;
  status: ModelStatus;
  accuracy: number;
  usage: number;
  inferenceTime: number;
  lastTrained: string;
  drift: number;
  successRate: number;
  description: string;
  icon: any;
  color: string;
  datasetSize: string;
  features: number;
  type: string;
  team: string;
  deployedAt: string;
}

interface AiIncident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  model: string;
  status: 'active' | 'resolved' | 'scheduled';
  timeAgo: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  lastTriggered: string;
  successRate: number;
  icon: any;
}

/* ══════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════ */

const MODELS: AiModel[] = [
  { id: 'm1', name: 'Property Cognition', version: 'v3.2', status: 'active', accuracy: 94.2, usage: 28000, inferenceTime: 68, lastTrained: '3 days ago', drift: 0.8, successRate: 97.1, description: 'Understands property attributes, amenities, and market positioning for intelligent search and recommendations.', icon: Brain, color: '#6F5C46', datasetSize: '2.4M records', features: 128, type: 'Classification', team: 'AI/ML', deployedAt: '2025-01-25' },
  { id: 'm2', name: 'Price Prediction', version: 'v2.8', status: 'active', accuracy: 97.1, usage: 18000, inferenceTime: 42, lastTrained: '1 week ago', drift: 2.4, successRate: 98.2, description: 'Predicts property valuations using comparable sales, market trends, and neighborhood intelligence.', icon: TrendingUp, color: '#10B981', datasetSize: '1.8M records', features: 96, type: 'Regression', team: 'Data Science', deployedAt: '2025-01-22' },
  { id: 'm3', name: 'Market Intelligence', version: 'v4.1', status: 'warning', accuracy: 91.0, usage: 12000, inferenceTime: 120, lastTrained: '2 weeks ago', drift: 4.8, successRate: 93.5, description: 'Analyzes macro market signals, supply/demand dynamics, and investment opportunity scoring.', icon: BarChart3, color: '#F59E0B', datasetSize: '3.1M records', features: 256, type: 'Ensemble', team: 'AI/ML', deployedAt: '2025-01-18' },
  { id: 'm4', name: 'Negotiation AI', version: 'v2.1', status: 'active', accuracy: 89.0, usage: 4200, inferenceTime: 95, lastTrained: '5 days ago', drift: 1.2, successRate: 91.8, description: 'Powers smart negotiation suggestions, offer optimization, and deal closing probability estimates.', icon: Target, color: '#EC4899', datasetSize: '820K records', features: 64, type: 'Reinforcement', team: 'Product AI', deployedAt: '2025-01-15' },
  { id: 'm5', name: 'Fraud Detection', version: 'v5.0', status: 'active', accuracy: 99.2, usage: 42000, inferenceTime: 12, lastTrained: '1 day ago', drift: 0.3, successRate: 99.8, description: 'Real-time fraud detection across transactions, identity verification, and anomaly scoring.', icon: Shield, color: '#EF4444', datasetSize: '5.2M records', features: 192, type: 'Anomaly Detection', team: 'Security AI', deployedAt: '2025-01-28' },
  { id: 'm6', name: 'Recommendation Engine', version: 'v3.5', status: 'training', accuracy: 92.8, usage: 0, inferenceTime: 85, lastTrained: 'Training now...', drift: 1.5, successRate: 95.4, description: 'Personalized property recommendations based on investor profiles, behavior patterns, and preferences.', icon: Sparkles, color: '#8B7355', datasetSize: '4.0M records', features: 320, type: 'Collaborative Filter', team: 'AI/ML', deployedAt: 'Pending', },
];

const AI_INCIDENTS: AiIncident[] = [
  { id: 'ai1', title: 'Drift spike detected in Price Prediction model', severity: 'high', model: 'Price Prediction', status: 'active', timeAgo: '25 min ago' },
  { id: 'ai2', title: 'Market Intelligence accuracy dipped below 92%', severity: 'medium', model: 'Market Intelligence', status: 'active', timeAgo: '2 hrs ago' },
  { id: 'ai3', title: 'Recommendation Engine retraining started', severity: 'info', model: 'Recommendation Engine', status: 'active', timeAgo: '35 min ago' },
  { id: 'ai4', title: 'Fraud model false positives increased +0.3%', severity: 'medium', model: 'Fraud Detection', status: 'resolved', timeAgo: '6 hrs ago' },
  { id: 'ai5', title: 'Knowledge graph sync delayed by 4 hours', severity: 'low', model: 'Knowledge Graph', status: 'resolved', timeAgo: '8 hrs ago' },
  { id: 'ai6', title: 'Negotiation AI v2.2 deployment scheduled', severity: 'info', model: 'Negotiation AI', status: 'scheduled', timeAgo: 'in 2 hrs' },
  { id: 'ai7', title: 'Property Cognition v3.3 rollout at 25%', severity: 'info', model: 'Property Cognition', status: 'scheduled', timeAgo: 'Tomorrow 06:00' },
];

const AUTOMATION_RULES: AutomationRule[] = [
  { id: 'r1', name: 'Auto-suggest property pricing', description: 'Applies Price Prediction model to new listings automatically', enabled: true, priority: 1, lastTriggered: '2 min ago', successRate: 96.4, icon: DollarSign },
  { id: 'r2', name: 'Recommend investors automatically', description: 'Matches investor profiles with new opportunities in real-time', enabled: true, priority: 2, lastTriggered: '8 min ago', successRate: 89.2, icon: Users },
  { id: 'r3', name: 'Detect fraud anomalies', description: 'Monitors all transactions for suspicious patterns', enabled: true, priority: 1, lastTriggered: '30 sec ago', successRate: 99.8, icon: Shield },
  { id: 'r4', name: 'Auto-classify leads', description: 'Scores and categorizes incoming leads by conversion probability', enabled: true, priority: 3, lastTriggered: '15 min ago', successRate: 91.0, icon: Layers },
  { id: 'r5', name: 'Predict market demand', description: 'Weekly demand forecasting for development zones', enabled: false, priority: 4, lastTriggered: '3 days ago', successRate: 87.5, icon: BarChart3 },
  { id: 'r6', name: 'Smart negotiation suggestions', description: 'Generates optimal counter-offer recommendations', enabled: true, priority: 2, lastTriggered: '1 hr ago', successRate: 88.1, icon: Target },
];

const AI_RECOMMENDATIONS = [
  { id: 1, text: 'Retrain Market Intelligence — drift at 4.8%', severity: 'high' as const, action: 'Retrain' },
  { id: 2, text: 'Recommendation Engine underused at 0 req/day', severity: 'medium' as const, action: 'Review' },
  { id: 3, text: 'Increase Fraud AI confidence threshold to 0.92', severity: 'low' as const, action: 'Configure' },
  { id: 4, text: 'Property Cognition v3.3 ready for deployment', severity: 'info' as const, action: 'Deploy' },
];

const KNOWLEDGE_GRAPH = {
  nodes: 2400000, relationships: 8100000, dataSources: 24, freshness: 94,
  lastSync: '28 min ago', brokenLinks: 12, confidence: 96.2,
};

const GOVERNANCE = {
  explainability: true, humanReview: 24, biasScore: 97, privacyMask: true,
  confidenceThreshold: 0.85, accessControl: 'Role-based',
};

/* Chart data */
function genPerfData(count: number, labelFn: (i: number) => string) {
  return Array.from({ length: count }, (_, i) => ({
    time: labelFn(i),
    accuracy: 92 + Math.sin(i * 0.3) * 2 + Math.random() * 1.5,
    latency: 60 + Math.sin(i * 0.4) * 15 + Math.random() * 10,
    predictions: 6000 + Math.round(Math.sin(i * 0.25) * 2000) + Math.round(Math.random() * 800),
    impact: 12 + Math.sin(i * 0.35) * 4 + Math.random() * 2,
    drift: 1.0 + Math.sin(i * 0.5) * 1.5 + Math.random() * 0.8,
  }));
}

const PERF_24H = genPerfData(24, (i) => (i < 10 ? `0${i}:00` : `${i}:00`));
const PERF_7D = genPerfData(7, (i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toLocaleDateString('en', { weekday: 'short' }); });
const PERF_30D = genPerfData(30, (i) => `${i + 1}`);
const PERF_6M = genPerfData(6, (i) => ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'][i]);
const PERF_MAP: Record<TimeRange, typeof PERF_24H> = { '24h': PERF_24H, '7d': PERF_7D, '30d': PERF_30D, '6m': PERF_6M };

/* Sparklines */
const SP_ACC = [{ v: 93.2 }, { v: 93.8 }, { v: 94.1 }, { v: 94.5 }, { v: 95.0 }, { v: 95.2 }, { v: 95.5 }, { v: 95.8 }, { v: 95.6 }, { v: 95.9 }, { v: 96.0 }, { v: 96.0 }];
const SP_MOD = [{ v: 3 }, { v: 3 }, { v: 3 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 4 }, { v: 4 }];
const SP_PRED = [{ v: 142 }, { v: 148 }, { v: 155 }, { v: 160 }, { v: 162 }, { v: 168 }, { v: 170 }, { v: 174 }, { v: 176 }, { v: 180 }, { v: 182 }, { v: 184 }];
const SP_LAT = [{ v: 82 }, { v: 80 }, { v: 78 }, { v: 77 }, { v: 76 }, { v: 75 }, { v: 76 }, { v: 74 }, { v: 75 }, { v: 74 }, { v: 74 }, { v: 74 }];
const SP_DRIFT = [{ v: 2.1 }, { v: 1.9 }, { v: 1.8 }, { v: 1.5 }, { v: 1.4 }, { v: 1.3 }, { v: 1.2 }, { v: 1.3 }, { v: 1.1 }, { v: 1.0 }, { v: 1.1 }, { v: 1.0 }];
const SP_SAVE = [{ v: 80 }, { v: 88 }, { v: 94 }, { v: 100 }, { v: 106 }, { v: 110 }, { v: 114 }, { v: 118 }, { v: 122 }, { v: 126 }, { v: 130 }, { v: 132 }];

/* Knowledge graph source contribution */
const KG_SOURCES = [
  { name: 'Property Listings', pct: 34 },
  { name: 'Transaction History', pct: 24 },
  { name: 'Market Reports', pct: 18 },
  { name: 'User Interactions', pct: 14 },
  { name: 'External APIs', pct: 10 },
];

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

function useLiveTimer(intervalMs = 10000) {
  const [lastSync, setLastSync] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setLastSync(0), intervalMs);
    const t = setInterval(() => setLastSync((s) => s + 1), 1000);
    return () => { clearInterval(id); clearInterval(t); };
  }, [intervalMs]);
  return lastSync;
}

/* ══════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════ */

function MiniSparkline({ data, color, height = 30 }: { data: { v: number }[]; color: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} activeDot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function AicTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="adm-tooltip">
        <p className="text-[10px] text-white/50 mb-0.5">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} className="text-[12px] font-semibold text-white">
            {typeof p.value === 'number' ? (p.value % 1 !== 0 ? p.value.toFixed(2) : p.value.toLocaleString()) : p.value}
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
    <div className="aic-kpi-card group" style={{ animation: `slide-up-fade 0.5s ease-out ${delay}s both` }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">{title}</p>
        <div className={`aic-kpi-icon-box ${iconStyle}`}><Icon className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="aic-kpi-value">
            {decimals > 0 ? animated.toFixed(decimals) : animated.toLocaleString()}
            {displaySuffix && <span className="text-[16px] font-semibold text-[var(--fg-muted)] ml-0.5">{displaySuffix}</span>}
          </p>
          {change && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                change.startsWith('+') ? 'bg-[rgba(16,185,129,0.08)] text-[#10B981]' :
                change.startsWith('-') ? 'bg-[rgba(239,68,68,0.08)] text-[#F87171]' :
                'bg-[rgba(111,92,70,0.08)] text-[#6F5C46]'
              }`}>
                {change.startsWith('+') && <TrendingUp className="h-2.5 w-2.5" strokeWidth={2.5} />}
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
  const c = 2 * Math.PI * 38;
  const off = c - (score / 100) * c;
  const col = score >= 90 ? '#10B981' : score >= 70 ? '#F59E0B' : '#EF4444';
  return (
    <div className="aic-health-ring">
      <svg viewBox="0 0 90 90" width="90" height="90">
        <circle className="aic-health-ring-bg" cx="45" cy="45" r="38" />
        <circle className="aic-health-ring-fill" cx="45" cy="45" r="38" stroke={col} strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[18px] font-bold text-[var(--fg)] leading-none">{score}</span>
        <span className="text-[8px] text-[var(--fg-muted)] mt-0.5 uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

const STATUS_CFG: Record<ModelStatus, { label: string; css: string; color: string }> = {
  active: { label: 'Active', css: 'active', color: '#10B981' },
  training: { label: 'Training', css: 'training', color: '#8B7355' },
  paused: { label: 'Paused', css: 'paused', color: '#F59E0B' },
  warning: { label: 'Warning', css: 'warning', color: '#F97316' },
  deprecated: { label: 'Deprecated', css: 'deprecated', color: '#6B7280' },
};

/* ══════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════ */

export default function AiConfigPage() {
  const [activeSection, setActiveSection] = useState<PageSection>('models');
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('accuracy');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [modelSearch, setModelSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ModelStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<ModelSortKey>('accuracy');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);
  const [drawerTab, setDrawerTab] = useState(0);
  const [incidentTab, setIncidentTab] = useState<IncidentTab>('active');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [modal, setModal] = useState<{ type: string; model?: AiModel } | null>(null);
  const [automationRules, setAutomationRules] = useState(AUTOMATION_RULES);
  const [confidenceThreshold, setConfidenceThreshold] = useState(GOVERNANCE.confidenceThreshold);
  const [retrainingId, setRetrainingId] = useState<string | null>(null);

  const syncAge = useLiveTimer(10000);

  const filteredModels = useMemo(() => {
    let list = MODELS.filter((m) => m.name.toLowerCase().includes(modelSearch.toLowerCase()));
    if (statusFilter !== 'all') list = list.filter((m) => m.status === statusFilter);
    return [...list].sort((a, b) => {
      const key = sortKey === 'name' ? 'name' : sortKey === 'usage' ? 'usage' : sortKey === 'latency' ? 'inferenceTime' : sortKey === 'drift' ? 'drift' : 'accuracy';
      const av = (a as any)[key]; const bv = (b as any)[key];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [modelSearch, statusFilter, sortKey, sortDir]);

  const filteredIncidents = useMemo(() => {
    if (incidentTab === 'active') return AI_INCIDENTS.filter((i) => i.status === 'active');
    if (incidentTab === 'resolved') return AI_INCIDENTS.filter((i) => i.status === 'resolved');
    return AI_INCIDENTS.filter((i) => i.status === 'scheduled');
  }, [incidentTab]);

  const chartData = PERF_MAP[timeRange];
  const activeModels = MODELS.filter((m) => m.status === 'active').length;
  const trainingModels = MODELS.filter((m) => m.status === 'training').length;

  const showToast = useCallback((msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); }, []);
  const handleRefresh = () => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 1500); };
  const handleRetrain = (m: AiModel) => { setRetrainingId(m.id); showToast(`Retraining ${m.name} started`); setTimeout(() => setRetrainingId(null), 3000); };
  const toggleRule = (id: string) => { setAutomationRules((r) => r.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)); };
  const confirmModal = () => {
    if (modal?.type === 'deploy') showToast('Model deployed successfully');
    else if (modal?.type === 'retrain') showToast('Retraining job queued');
    else if (modal?.type === 'rollback') showToast('Rollback completed');
    setModal(null);
  };
  const handleExport = () => {
    const rows = MODELS.map((m) => `${m.name},${m.version},${m.status},${m.accuracy}%,${m.usage},${m.inferenceTime}ms,${m.drift}%`);
    const blob = new Blob([['Model,Version,Status,Accuracy,Usage/day,Latency,Drift', ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `ai-models-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    showToast('Report exported');
  };

  const NAV: { key: PageSection; label: string; icon: any }[] = [
    { key: 'models', label: 'Model Fleet', icon: Brain },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'knowledge', label: 'Knowledge Graph', icon: Network },
    { key: 'automation', label: 'Automation', icon: Zap },
    { key: 'governance', label: 'Governance', icon: Shield },
    { key: 'incidents', label: 'Incidents', icon: AlertTriangle },
  ];

  return (
    <div className="aic-dashboard relative mx-auto w-full max-w-[1600px] px-1">
      <div className="relative z-10 space-y-7">

        {/* ═══════ HEADER ═══════ */}
        <div className="animate-stagger-1">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="adm-live-badge"><span className="adm-live-dot" /><span>Live</span></div>
                <span className="text-[10px] text-[var(--fg-muted)]">Synced {syncAge}s ago</span>
              </div>
              <h1 className="aic-heading">AI <span className="aic-accent-text">Configuration</span></h1>
              <p className="text-[13px] text-[var(--fg-muted)] mt-2 leading-relaxed max-w-2xl">
                Manage models, intelligence systems, predictions, governance, and learning performance across the platform.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0 mt-1">
              <button type="button" className="adm-action-btn primary" onClick={() => setModal({ type: 'deploy' })}><Plus className="h-3.5 w-3.5" /><span>Deploy Model</span></button>
              <button type="button" className="adm-action-btn"><Shield className="h-3.5 w-3.5" /><span className="hidden sm:inline">AI Policies</span></button>
              <button type="button" className="adm-action-btn" onClick={handleExport}><Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">Export</span></button>
              <button type="button" className="adm-action-btn"><Sparkles className="h-3.5 w-3.5" /><span className="hidden sm:inline">Diagnostics</span></button>
              <button type="button" className="adm-action-btn" onClick={handleRefresh}><RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="sys-status-chip"><span className="sys-dot green" /><span className="text-[#10B981] font-semibold">AI Accuracy 96%</span></div>
            <div className="sys-status-chip"><Brain className="h-3 w-3 text-[#6F5C46]" /><span>{activeModels} Models Active</span></div>
            <div className="sys-status-chip"><Activity className="h-3 w-3 text-[#8B7355]" /><span>184K Predictions Today</span></div>
            <div className="sys-status-chip"><span className="sys-dot amber" /><span className="text-[#F59E0B] font-semibold">Drift Alerts: 1</span></div>
            <div className="sys-status-chip"><Network className="h-3 w-3 text-[#10B981]" /><span>Knowledge Graph Healthy</span></div>
            <div className="sys-status-chip"><Clock className="h-3 w-3 text-[var(--fg-muted)]" /><span>Last Sync: <strong className="text-[var(--fg)]">{syncAge}s ago</strong></span></div>
          </div>
        </div>

        {/* ═══════ KPIs ═══════ */}
        <div className="animate-stagger-2">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KPICard title="Global Accuracy" rawValue={96} decimals={0} displaySuffix="%" change="+1.8%" icon={Target} iconStyle="violet" sparkline={SP_ACC} sparkColor="#6F5C46" delay={0.05} />
            <KPICard title="Models Running" rawValue={activeModels} change={`${trainingModels} training`} icon={Cpu} iconStyle="indigo" sparkline={SP_MOD} sparkColor="#8B7355" delay={0.1} />
            <KPICard title="Daily Predictions" rawValue={184} displaySuffix="K" change="+12%" icon={Activity} iconStyle="emerald" sparkline={SP_PRED} sparkColor="#10B981" delay={0.15} />
            <KPICard title="Avg Inference" rawValue={74} displaySuffix="ms" change="-6ms" icon={Timer} iconStyle="blue" sparkline={SP_LAT} sparkColor="#8B7355" delay={0.2} />
            <KPICard title="Drift Risk" rawValue={1.0} decimals={1} displaySuffix="%" change="Low" icon={AlertTriangle} iconStyle="amber" sparkline={SP_DRIFT} sparkColor="#F59E0B" delay={0.25} />
            <KPICard title="Automation Savings" rawValue={132} displaySuffix=" hrs" change="+18 this month" icon={Zap} iconStyle="cyan" sparkline={SP_SAVE} sparkColor="#8B7355" delay={0.3} />
          </div>
        </div>

        {/* ═══════ NAV ═══════ */}
        <div className="animate-stagger-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {NAV.map((n) => { const I = n.icon; return (
              <button key={n.key} onClick={() => setActiveSection(n.key)} className={`aic-chart-tab ${activeSection === n.key ? 'active' : ''}`}><I className="h-3.5 w-3.5" />{n.label}</button>
            ); })}
          </div>
        </div>

        {/* ═══════ MAIN 70/30 ═══════ */}
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6 min-w-0">

            {/* ── MODEL FLEET ── */}
            {activeSection === 'models' && (
              <div style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><div className="adm-section-icon"><Brain className="h-3.5 w-3.5 text-[#6F5C46]" /></div><h2 className="text-[13px] font-semibold text-[var(--fg)]">Model Fleet</h2><span className="adm-count-badge">{MODELS.length}</span></div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="adm-table-search"><Search className="h-3.5 w-3.5 text-[var(--fg-muted)]" /><input type="text" placeholder="Search models..." value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} className="adm-table-search-input" /></div>
                    <div className="flex items-center gap-1"><Filter className="h-3 w-3 text-[var(--fg-muted)]" />
                      {(['all', 'active', 'training', 'warning', 'paused'] as const).map((f) => (
                        <button key={f} onClick={() => setStatusFilter(f)} className={`adm-filter-chip ${statusFilter === f ? 'active' : ''}`}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={`${sortKey}-${sortDir}`} onChange={(e) => { const [k, d] = e.target.value.split('-'); setSortKey(k as ModelSortKey); setSortDir(d as 'asc' | 'desc'); }} className="text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 cursor-pointer">
                      <option value="accuracy-desc">Highest Accuracy</option><option value="usage-desc">Most Used</option><option value="latency-asc">Fastest</option><option value="drift-desc">Most Drift</option><option value="name-asc">Name A-Z</option>
                    </select>
                    <div className="sys-view-toggle">
                      <button type="button" className={`sys-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid className="h-3.5 w-3.5" /></button>
                      <button type="button" className={`sys-view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {filteredModels.map((m, i) => { const I = m.icon; const sc = STATUS_CFG[m.status]; return (
                      <div key={m.id} className={`aic-model-card ${m.status}`} style={{ animation: `slide-up-fade 0.4s ease-out ${0.03 * i}s both` }} onClick={() => { setSelectedModel(m); setDrawerTab(0); }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${m.color}12` }}><I className="h-4.5 w-4.5" style={{ color: m.color }} strokeWidth={1.5} /></div>
                            <div><p className="text-[13px] font-semibold text-[var(--fg)] leading-tight">{m.name}</p><div className="flex items-center gap-1.5 mt-0.5"><span className="text-[10px] text-[var(--fg-muted)]">{m.version}</span><span className={`aic-badge ${sc.css}`}>{sc.label}</span></div></div>
                          </div>
                        </div>
                        <p className="text-[10px] text-[var(--fg-muted)] leading-relaxed line-clamp-2 mb-3">{m.description}</p>
                        <div className="grid grid-cols-3 gap-x-3 gap-y-2 text-[11px] mb-3">
                          <div><span className="text-[var(--fg-muted)]">Accuracy</span><p className="font-semibold text-[var(--fg)]">{m.accuracy}%</p></div>
                          <div><span className="text-[var(--fg-muted)]">Usage/day</span><p className="font-semibold text-[var(--fg)]">{m.usage > 0 ? `${(m.usage / 1000).toFixed(0)}K` : '—'}</p></div>
                          <div><span className="text-[var(--fg-muted)]">Latency</span><p className="font-semibold text-[var(--fg)]">{m.inferenceTime}ms</p></div>
                          <div><span className="text-[var(--fg-muted)]">Trained</span><p className="font-semibold text-[var(--fg)]">{m.lastTrained}</p></div>
                          <div><span className="text-[var(--fg-muted)]">Drift</span><p className={`font-semibold ${m.drift > 3 ? 'text-[#F59E0B]' : 'text-[var(--fg)]'}`}>{m.drift}%</p></div>
                          <div><span className="text-[var(--fg-muted)]">Success</span><p className="font-semibold text-[var(--fg)]">{m.successRate}%</p></div>
                        </div>
                        <div className="aic-actions flex items-center gap-2 pt-2 border-t border-[var(--border)]">
                          <button type="button" onClick={(e) => { e.stopPropagation(); handleRetrain(m); }} className="text-[10px] font-semibold text-[var(--fg-muted)] hover:text-[#6F5C46] transition-colors flex items-center gap-1"><RefreshCw className={`h-3 w-3 ${retrainingId === m.id ? 'animate-spin' : ''}`} /> Retrain</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setModal({ type: 'deploy', model: m }); }} className="text-[10px] font-semibold text-[var(--fg-muted)] hover:text-[#6F5C46] transition-colors flex items-center gap-1"><Play className="h-3 w-3" /> Deploy</button>
                          <button type="button" className="ml-auto text-[10px] font-semibold text-[#6F5C46] flex items-center gap-1" onClick={(e) => { e.stopPropagation(); setSelectedModel(m); setDrawerTab(0); }}>Details <ChevronRight className="h-3 w-3" /></button>
                        </div>
                      </div>
                    ); })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
                    <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
                      <span className="min-w-[180px]">Model</span><span className="min-w-[60px]">Status</span><span className="min-w-[60px] text-right">Accuracy</span><span className="min-w-[50px] text-right">Usage</span><span className="min-w-[55px] text-right">Latency</span><span className="min-w-[45px] text-right">Drift</span><span className="ml-auto w-4" />
                    </div>
                    {filteredModels.map((m) => { const I = m.icon; const sc = STATUS_CFG[m.status]; return (
                      <div key={m.id} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] hover:bg-[rgba(111,92,70,0.02)] transition-colors cursor-pointer" onClick={() => { setSelectedModel(m); setDrawerTab(0); }}>
                        <div className="flex items-center gap-2.5 min-w-[180px]">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${m.color}12` }}><I className="h-4 w-4" style={{ color: m.color }} strokeWidth={1.5} /></div>
                          <div><p className="text-[12px] font-semibold text-[var(--fg)]">{m.name}</p><span className="text-[10px] text-[var(--fg-muted)]">{m.version}</span></div>
                        </div>
                        <span className="min-w-[60px]"><span className={`aic-badge ${sc.css}`}>{sc.label}</span></span>
                        <span className="text-[11px] font-semibold text-[var(--fg)] min-w-[60px] text-right">{m.accuracy}%</span>
                        <span className="text-[11px] text-[var(--fg-secondary)] min-w-[50px] text-right">{m.usage > 0 ? `${(m.usage / 1000).toFixed(0)}K` : '—'}</span>
                        <span className="text-[11px] text-[var(--fg-secondary)] min-w-[55px] text-right">{m.inferenceTime}ms</span>
                        <span className={`text-[11px] min-w-[45px] text-right font-medium ${m.drift > 3 ? 'text-[#F59E0B]' : 'text-[var(--fg-secondary)]'}`}>{m.drift}%</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[var(--fg-muted)] ml-auto shrink-0" />
                      </div>
                    ); })}
                  </div>
                )}
                {filteredModels.length === 0 && <div className="text-center py-16 text-[var(--fg-muted)] text-sm">No models match your filters.</div>}
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {activeSection === 'analytics' && (
              <div className="adm-chart-card" style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                  <div><h3 className="text-[14px] font-semibold text-[var(--fg)]">Performance Analytics</h3><p className="text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-0.5">Model intelligence metrics</p></div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {(['accuracy', 'latency', 'predictions', 'impact', 'drift'] as AnalyticsTab[]).map((t) => (
                        <button key={t} onClick={() => setAnalyticsTab(t)} className={`aic-chart-tab ${analyticsTab === t ? 'active' : ''}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                      ))}
                    </div>
                    <div className="adm-header-btn-group">
                      {(['24h', '7d', '30d', '6m'] as TimeRange[]).map((r) => (
                        <button key={r} onClick={() => setTimeRange(r)} className={`adm-range-btn ${timeRange === r ? 'active' : ''}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  {analyticsTab === 'accuracy' ? (
                    <AreaChart data={chartData}><defs><linearGradient id="aicAccFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6F5C46" stopOpacity={0.15} /><stop offset="100%" stopColor="#6F5C46" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} domain={[88, 100]} /><Tooltip content={<AicTooltip />} /><Area type="monotone" dataKey="accuracy" stroke="#6F5C46" strokeWidth={2.5} fill="url(#aicAccFill)" animationDuration={1200} name="Accuracy %" /></AreaChart>
                  ) : analyticsTab === 'latency' ? (
                    <LineChart data={chartData}><XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><Tooltip content={<AicTooltip />} /><Line type="monotone" dataKey="latency" stroke="#8B7355" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} animationDuration={1200} name="Latency (ms)" /></LineChart>
                  ) : analyticsTab === 'predictions' ? (
                    <BarChart data={chartData}><defs><linearGradient id="aicPredFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B7355" stopOpacity={0.85} /><stop offset="100%" stopColor="#8B7355" stopOpacity={0.2} /></linearGradient></defs><XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><Tooltip content={<AicTooltip />} /><Bar dataKey="predictions" fill="url(#aicPredFill)" radius={[4, 4, 0, 0]} animationDuration={1200} name="Predictions" /></BarChart>
                  ) : analyticsTab === 'impact' ? (
                    <AreaChart data={chartData}><defs><linearGradient id="aicImpFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.15} /><stop offset="100%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><Tooltip content={<AicTooltip />} /><Area type="monotone" dataKey="impact" stroke="#10B981" strokeWidth={2} fill="url(#aicImpFill)" animationDuration={1200} name="Impact %" /></AreaChart>
                  ) : (
                    <AreaChart data={chartData}><defs><linearGradient id="aicDriftFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity={0.15} /><stop offset="100%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><Tooltip content={<AicTooltip />} /><Area type="monotone" dataKey="drift" stroke="#F59E0B" strokeWidth={2} fill="url(#aicDriftFill)" animationDuration={1200} name="Drift %" /></AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}

            {/* ── KNOWLEDGE GRAPH ── */}
            {activeSection === 'knowledge' && (
              <div className="space-y-5" style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="flex items-center justify-between mb-1"><div className="flex items-center gap-2"><div className="adm-section-icon"><Network className="h-3.5 w-3.5 text-[#8B7355]" /></div><h2 className="text-[13px] font-semibold text-[var(--fg)]">Knowledge Graph</h2></div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="adm-action-btn" onClick={() => showToast('Graph sync started')}><RefreshCw className="h-3.5 w-3.5" /> Sync Now</button>
                    <button type="button" className="adm-action-btn"><Plus className="h-3.5 w-3.5" /> Add Source</button>
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Total Nodes', value: '2.4M', sub: '+12K this week' },
                    { label: 'Relationships', value: '8.1M', sub: '+48K this week' },
                    { label: 'Data Sources', value: `${KNOWLEDGE_GRAPH.dataSources}`, sub: '3 pending sync' },
                    { label: 'Freshness Score', value: `${KNOWLEDGE_GRAPH.freshness}%`, sub: 'Last sync: ' + KNOWLEDGE_GRAPH.lastSync },
                    { label: 'Confidence', value: `${KNOWLEDGE_GRAPH.confidence}%`, sub: 'Above threshold' },
                    { label: 'Broken Links', value: `${KNOWLEDGE_GRAPH.brokenLinks}`, sub: 'Needs review' },
                  ].map((s, i) => (
                    <div key={s.label} className="aic-rail-widget" style={{ animation: `slide-up-fade 0.35s ease-out ${0.04 * i}s both` }}>
                      <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">{s.label}</span>
                      <p className="text-[20px] font-bold text-[var(--fg)] mt-1">{s.value}</p>
                      <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="adm-chart-card">
                  <h4 className="text-[12px] font-semibold text-[var(--fg)] mb-3">Source Contribution</h4>
                  <div className="space-y-2.5">
                    {KG_SOURCES.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-3" style={{ animation: `slide-up-fade 0.3s ease-out ${0.03 * i}s both` }}>
                        <span className="text-[11px] text-[var(--fg-secondary)] min-w-[130px]">{s.name}</span>
                        <div className="flex-1 h-5 bg-[var(--bg-secondary)] rounded-lg overflow-hidden">
                          <div className="h-full rounded-lg bg-gradient-to-r from-[#8B7355] to-[#A89478] transition-all duration-1000" style={{ width: `${s.pct}%` }} />
                        </div>
                        <span className="text-[11px] font-semibold text-[var(--fg)] min-w-[30px] text-right">{s.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="adm-action-btn justify-center py-2.5"><Check className="h-3.5 w-3.5" /> Validate Graph</button>
                  <button type="button" className="adm-action-btn justify-center py-2.5"><RotateCcw className="h-3.5 w-3.5" /> Rebuild Index</button>
                </div>
              </div>
            )}

            {/* ── AUTOMATION ── */}
            {activeSection === 'automation' && (
              <div style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><div className="adm-section-icon" style={{ background: 'rgba(139,115,85, 0.08)', borderColor: 'rgba(139,115,85, 0.15)' }}><Zap className="h-3.5 w-3.5 text-[#8B7355]" /></div><h2 className="text-[13px] font-semibold text-[var(--fg)]">Automation Rules</h2><span className="adm-count-badge">{automationRules.length}</span></div></div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
                  {automationRules.map((rule, i) => { const I = rule.icon; return (
                    <div key={rule.id} className="aic-rule-row" style={{ animation: `slide-up-fade 0.3s ease-out ${0.04 * i}s both` }}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center shrink-0"><I className="h-4 w-4 text-[var(--fg-secondary)]" /></div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2"><p className="text-[12px] font-semibold text-[var(--fg)] truncate">{rule.name}</p><span className="text-[9px] font-bold bg-[rgba(111,92,70,0.08)] text-[#6F5C46] px-1.5 py-0.5 rounded">P{rule.priority}</span></div>
                          <p className="text-[10px] text-[var(--fg-muted)] truncate">{rule.description}</p>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--fg-muted)] mt-0.5">
                            <span>Last: {rule.lastTriggered}</span>
                            <span>Success: <strong className={rule.successRate > 95 ? 'text-[#10B981]' : 'text-[var(--fg)]'}>{rule.successRate}%</strong></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button type="button" className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"><Settings className="h-3.5 w-3.5 text-[var(--fg-muted)]" /></button>
                        <div onClick={() => toggleRule(rule.id)} className={`h-6 w-11 rounded-full cursor-pointer transition-colors flex items-center ${rule.enabled ? 'bg-[#10B981] justify-end' : 'bg-[var(--bg-tertiary)] justify-start'}`}><div className="h-5 w-5 rounded-full bg-white shadow-md mx-0.5" /></div>
                      </div>
                    </div>
                  ); })}
                </div>
              </div>
            )}

            {/* ── GOVERNANCE ── */}
            {activeSection === 'governance' && (
              <div className="space-y-5" style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="flex items-center gap-2 mb-1"><div className="adm-section-icon"><Shield className="h-3.5 w-3.5 text-[#8B7355]" /></div><h2 className="text-[13px] font-semibold text-[var(--fg)]">AI Governance Center</h2></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Explainability', desc: 'Reasoning summaries for all predictions', icon: Lightbulb, enabled: GOVERNANCE.explainability },
                    { label: 'Privacy Controls', desc: 'Mask PII in model inputs', icon: Lock, enabled: GOVERNANCE.privacyMask },
                  ].map((g, i) => { const I = g.icon; return (
                    <div key={g.label} className="aic-rail-widget flex items-center justify-between" style={{ animation: `slide-up-fade 0.3s ease-out ${0.04 * i}s both` }}>
                      <div className="flex items-center gap-3"><div className="h-9 w-9 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center"><I className="h-4 w-4 text-[var(--fg-secondary)]" /></div><div><p className="text-[12px] font-semibold text-[var(--fg)]">{g.label}</p><p className="text-[10px] text-[var(--fg-muted)]">{g.desc}</p></div></div>
                      <div className={`h-6 w-11 rounded-full cursor-pointer transition-colors flex items-center ${g.enabled ? 'bg-[#10B981] justify-end' : 'bg-[var(--bg-tertiary)] justify-start'}`}><div className="h-5 w-5 rounded-full bg-white shadow-md mx-0.5" /></div>
                    </div>
                  ); })}
                  <div className="aic-rail-widget" style={{ animation: 'slide-up-fade 0.3s ease-out 0.08s both' }}>
                    <div className="flex items-center gap-3 mb-3"><div className="h-9 w-9 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center"><Eye className="h-4 w-4 text-[var(--fg-secondary)]" /></div><div><p className="text-[12px] font-semibold text-[var(--fg)]">Human Review Queue</p><p className="text-[10px] text-[var(--fg-muted)]">Predictions requiring manual approval</p></div></div>
                    <div className="flex items-center gap-2"><span className="text-[20px] font-bold text-[var(--fg)]">{GOVERNANCE.humanReview}</span><span className="text-[10px] text-[var(--fg-muted)]">pending reviews</span></div>
                  </div>
                  <div className="aic-rail-widget" style={{ animation: 'slide-up-fade 0.3s ease-out 0.12s both' }}>
                    <div className="flex items-center gap-3 mb-3"><div className="h-9 w-9 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center"><Scale className="h-4 w-4 text-[var(--fg-secondary)]" /></div><div><p className="text-[12px] font-semibold text-[var(--fg)]">Bias Monitoring</p><p className="text-[10px] text-[var(--fg-muted)]">Fairness score across demographics</p></div></div>
                    <div className="flex items-center gap-2"><span className="text-[20px] font-bold text-[#10B981]">{GOVERNANCE.biasScore}%</span><span className="text-[10px] font-semibold text-[#10B981]">Fair</span></div>
                  </div>
                </div>
                <div className="aic-rail-widget" style={{ animation: 'slide-up-fade 0.3s ease-out 0.16s both' }}>
                  <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-3"><Sliders className="h-4 w-4 text-[var(--fg-secondary)]" /><div><p className="text-[12px] font-semibold text-[var(--fg)]">Confidence Threshold</p><p className="text-[10px] text-[var(--fg-muted)]">Minimum confidence for automated actions</p></div></div><span className="text-[16px] font-bold text-[var(--fg)]">{(confidenceThreshold * 100).toFixed(0)}%</span></div>
                  <input type="range" min={50} max={99} value={confidenceThreshold * 100} onChange={(e) => setConfidenceThreshold(parseInt(e.target.value) / 100)} className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--bg-tertiary)] accent-[#6F5C46]" />
                  <div className="flex justify-between text-[9px] text-[var(--fg-muted)] mt-1"><span>50%</span><span>75%</span><span>99%</span></div>
                </div>
                <div className="aic-rail-widget" style={{ animation: 'slide-up-fade 0.3s ease-out 0.2s both' }}>
                  <div className="flex items-center gap-3"><Users className="h-4 w-4 text-[var(--fg-secondary)]" /><div><p className="text-[12px] font-semibold text-[var(--fg)]">Access Control</p><p className="text-[10px] text-[var(--fg-muted)]">{GOVERNANCE.accessControl} — 4 admins, 8 operators can retrain/deploy</p></div></div>
                </div>
              </div>
            )}

            {/* ── INCIDENTS ── */}
            {activeSection === 'incidents' && (
              <div style={{ animation: 'slide-up-fade 0.4s ease-out both' }}>
                <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><div className="adm-section-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.15)' }}><AlertTriangle className="h-3.5 w-3.5 text-[#EF4444]" /></div><h2 className="text-[13px] font-semibold text-[var(--fg)]">AI Incidents</h2><span className="adm-count-badge">{AI_INCIDENTS.filter((i) => i.status === 'active').length}</span></div></div>
                <div className="flex items-center gap-1 mb-4">
                  {(['active', 'resolved', 'scheduled'] as IncidentTab[]).map((t) => (
                    <button key={t} onClick={() => setIncidentTab(t)} className={`aic-chart-tab ${incidentTab === t ? 'active' : ''}`}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                  ))}
                </div>
                <div className="space-y-2">
                  {filteredIncidents.map((inc, i) => (
                    <div key={inc.id} className="sys-incident-item" style={{ animation: `slide-up-fade 0.35s ease-out ${0.03 * i}s both` }}>
                      <div className="flex items-start gap-3">
                        <div className={`aic-sev ${inc.severity} mt-1`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-semibold text-[var(--fg)] truncate">{inc.title}</p>
                          <div className="flex items-center gap-3 text-[10px] text-[var(--fg-muted)] mt-0.5">
                            <span className="font-medium" style={{ color: inc.severity === 'high' ? '#F97316' : inc.severity === 'medium' ? '#F59E0B' : '#8B7355' }}>{inc.severity.toUpperCase()}</span>
                            <span>{inc.model}</span><span>{inc.timeAgo}</span>
                            <span className={`px-1.5 py-0.5 rounded font-semibold ${inc.status === 'active' ? 'bg-[rgba(239,68,68,0.08)] text-[#EF4444]' : inc.status === 'scheduled' ? 'bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : 'bg-[rgba(16,185,129,0.08)] text-[#10B981]'}`}>{inc.status}</span>
                          </div>
                        </div>
                        {inc.status === 'active' && <button type="button" onClick={() => showToast('Incident resolved')} className="text-[10px] font-semibold text-[#10B981] hover:underline shrink-0">Resolve</button>}
                      </div>
                    </div>
                  ))}
                  {filteredIncidents.length === 0 && <div className="text-center py-10 text-[var(--fg-muted)] text-sm">No incidents.</div>}
                </div>
              </div>
            )}
          </div>

          {/* ──── RIGHT RAIL ──── */}
          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="aic-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.1s both' }}>
              <div className="flex items-center gap-2 mb-4"><div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#6F5C46] to-[#A89478] flex items-center justify-center"><Sparkles className="h-3.5 w-3.5 text-white" /></div><span className="aic-rail-widget-title">AI Recommendations</span><span className="ml-auto text-[9px] font-semibold text-[#6F5C46] bg-[rgba(111,92,70,0.08)] px-2 py-0.5 rounded-full">Live</span></div>
              <div className="space-y-3">
                {AI_RECOMMENDATIONS.map((r) => (
                  <div key={r.id} className="rounded-xl border border-[var(--border)] p-3 hover:border-[rgba(111,92,70,0.15)] transition-colors">
                    <div className="flex items-start gap-2 mb-1.5"><span className={`aic-sev ${r.severity} mt-1 shrink-0`} /><p className="text-[11px] font-medium text-[var(--fg)] leading-snug">{r.text}</p></div>
                    <button type="button" className="text-[10px] font-semibold text-[#6F5C46] hover:underline flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" /> {r.action}</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="aic-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.15s both' }}>
              <div className="flex items-center gap-2 mb-4"><Gauge className="h-4 w-4 text-[var(--fg-secondary)]" /><span className="aic-rail-widget-title">Health Score</span></div>
              <div className="flex items-center gap-5">
                <HealthRing score={94} />
                <div><p className="text-[18px] font-bold text-[#10B981]">94 / 100</p><p className="text-[10px] text-[var(--fg-muted)] mt-0.5">Excellent AI health</p><div className="flex items-center gap-1 mt-1.5"><TrendingUp className="h-3 w-3 text-[#10B981]" /><span className="text-[10px] font-semibold text-[#10B981]">+3 this month</span></div></div>
              </div>
            </div>

            <div className="aic-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.2s both' }}>
              <div className="flex items-center gap-2 mb-4"><TrendingUp className="h-4 w-4 text-[var(--fg-secondary)]" /><span className="aic-rail-widget-title">Business Impact</span></div>
              <div className="space-y-2.5">
                {[
                  { label: 'Pricing accuracy improved', value: '+18%', color: '#10B981' },
                  { label: 'Lead conversion faster', value: '+9%', color: '#8B7355' },
                  { label: 'Fraud prevented this month', value: '$142K', color: '#EF4444' },
                ].map((b) => (
                  <div key={b.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--fg-secondary)]">{b.label}</span>
                    <span className="text-[12px] font-bold" style={{ color: b.color }}>{b.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="aic-rail-widget" style={{ animation: 'slide-up-fade 0.5s ease-out 0.25s both' }}>
              <div className="flex items-center gap-2 mb-4"><Cpu className="h-4 w-4 text-[var(--fg-secondary)]" /><span className="aic-rail-widget-title">Resource Usage</span></div>
              <div className="space-y-3">
                {[
                  { label: 'GPU Inference', value: 58, color: '#6F5C46' },
                  { label: 'CPU Inference', value: 34, color: '#8B7355' },
                  { label: 'Memory', value: 72, color: '#F59E0B' },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-[10px] mb-1"><span className="text-[var(--fg-muted)]">{r.label}</span><span className="font-semibold text-[var(--fg)]">{r.value}%</span></div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden"><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${r.value}%`, background: r.color }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div><div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" /><p className="text-[10px] text-[var(--fg-muted)] tracking-[0.04em] text-center pb-4 mt-4">AI intelligence updated in real-time &middot; Powered by <span className="font-semibold aic-accent-text">GLIMMORA</span> Intelligence Engine</p></div>
      </div>

      {/* ═══════ DRAWER ═══════ */}
      {selectedModel && (
        <>
          <div className="aic-drawer-backdrop" onClick={() => setSelectedModel(null)} />
          <div className="aic-drawer" style={{ animation: 'slide-in-right 0.35s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div className="sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)] px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${selectedModel.color}12` }}>
                    {(() => { const I = selectedModel.icon; return <I className="h-4.5 w-4.5" style={{ color: selectedModel.color }} />; })()}
                  </div>
                  <div><h2 className="text-[16px] font-bold text-[var(--fg)]">{selectedModel.name}</h2><div className="flex items-center gap-2"><span className="text-[10px] text-[var(--fg-muted)]">{selectedModel.version}</span><span className={`aic-badge ${STATUS_CFG[selectedModel.status].css}`}>{STATUS_CFG[selectedModel.status].label}</span></div></div>
                </div>
                <button type="button" onClick={() => setSelectedModel(null)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"><X className="h-4 w-4 text-[var(--fg-muted)]" /></button>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {['Overview', 'Metrics', 'Training', 'Predictions', 'Drift', 'Features', 'Rollback', 'Audit'].map((tab, i) => (
                  <button key={tab} onClick={() => setDrawerTab(i)} className={`aic-chart-tab whitespace-nowrap ${drawerTab === i ? 'active' : ''}`}>{tab}</button>
                ))}
              </div>
            </div>
            <div className="p-6 space-y-5">
              {drawerTab === 0 && (
                <>
                  <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">{selectedModel.description}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { l: 'Accuracy', v: `${selectedModel.accuracy}%` }, { l: 'Inference', v: `${selectedModel.inferenceTime}ms` },
                      { l: 'Usage/day', v: selectedModel.usage > 0 ? `${(selectedModel.usage / 1000).toFixed(0)}K` : '—' }, { l: 'Drift', v: `${selectedModel.drift}%` },
                      { l: 'Dataset', v: selectedModel.datasetSize }, { l: 'Features', v: `${selectedModel.features}` },
                      { l: 'Type', v: selectedModel.type }, { l: 'Team', v: selectedModel.team },
                      { l: 'Last Trained', v: selectedModel.lastTrained }, { l: 'Deployed', v: selectedModel.deployedAt },
                    ].map((item) => (
                      <div key={item.l} className="rounded-xl bg-[var(--bg-secondary)] p-3"><span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">{item.l}</span><p className="text-[14px] font-bold text-[var(--fg)] mt-0.5">{item.v}</p></div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => handleRetrain(selectedModel)} className="adm-action-btn justify-center py-2.5"><RefreshCw className={`h-3.5 w-3.5 ${retrainingId === selectedModel.id ? 'animate-spin' : ''}`} /> Retrain</button>
                    <button type="button" onClick={() => setModal({ type: 'deploy', model: selectedModel })} className="adm-action-btn justify-center py-2.5"><Play className="h-3.5 w-3.5" /> Deploy</button>
                    <button type="button" className="adm-action-btn justify-center py-2.5"><Pause className="h-3.5 w-3.5" /> Pause</button>
                    <button type="button" onClick={() => setModal({ type: 'rollback', model: selectedModel })} className="adm-action-btn justify-center py-2.5"><RotateCcw className="h-3.5 w-3.5" /> Rollback</button>
                  </div>
                </>
              )}
              {drawerTab === 1 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-3">Accuracy Trend (30d)</h4>
                  <ResponsiveContainer width="100%" height={180}><AreaChart data={PERF_30D}><defs><linearGradient id="drwAcc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={selectedModel.color} stopOpacity={0.2} /><stop offset="100%" stopColor={selectedModel.color} stopOpacity={0} /></linearGradient></defs><XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} domain={[88, 100]} /><Tooltip content={<AicTooltip />} /><Area type="monotone" dataKey="accuracy" stroke={selectedModel.color} strokeWidth={2} fill="url(#drwAcc)" /></AreaChart></ResponsiveContainer>
                  <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-3 mt-5">Latency Trend (30d)</h4>
                  <ResponsiveContainer width="100%" height={140}><LineChart data={PERF_30D}><XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><Tooltip content={<AicTooltip />} /><Line type="monotone" dataKey="latency" stroke="#8B7355" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
                </div>
              )}
              {drawerTab === 2 && (
                <div className="space-y-3">
                  {[
                    { run: 'Run #142', date: selectedModel.lastTrained, status: 'completed', acc: selectedModel.accuracy, epochs: 50 },
                    { run: 'Run #141', date: '2 weeks ago', status: 'completed', acc: selectedModel.accuracy - 0.8, epochs: 45 },
                    { run: 'Run #140', date: '1 month ago', status: 'failed', acc: 0, epochs: 30 },
                    { run: 'Run #139', date: '6 weeks ago', status: 'completed', acc: selectedModel.accuracy - 1.5, epochs: 50 },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <GitBranch className="h-4 w-4 text-[var(--fg-muted)] shrink-0" />
                      <div className="flex-1"><div className="flex items-center gap-2"><span className="text-[12px] font-semibold text-[var(--fg)]">{r.run}</span><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${r.status === 'completed' ? 'bg-[rgba(16,185,129,0.1)] text-[#10B981]' : 'bg-[rgba(239,68,68,0.1)] text-[#EF4444]'}`}>{r.status}</span></div><p className="text-[10px] text-[var(--fg-muted)]">{r.date} &middot; {r.epochs} epochs{r.acc > 0 ? ` &middot; ${r.acc.toFixed(1)}% accuracy` : ''}</p></div>
                    </div>
                  ))}
                </div>
              )}
              {drawerTab === 3 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-3">Prediction Volume (24h)</h4>
                  <ResponsiveContainer width="100%" height={180}><BarChart data={PERF_24H.slice(-12)}><XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><Tooltip content={<AicTooltip />} /><Bar dataKey="predictions" fill={selectedModel.color} radius={[3, 3, 0, 0]} opacity={0.7} /></BarChart></ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-[var(--bg-secondary)] p-3 text-center"><p className="text-[16px] font-bold text-[var(--fg)]">{selectedModel.usage > 0 ? `${(selectedModel.usage / 1000).toFixed(0)}K` : '0'}</p><p className="text-[9px] text-[var(--fg-muted)] mt-0.5">Today</p></div>
                    <div className="rounded-xl bg-[var(--bg-secondary)] p-3 text-center"><p className="text-[16px] font-bold text-[var(--fg)]">{selectedModel.successRate}%</p><p className="text-[9px] text-[var(--fg-muted)] mt-0.5">Success Rate</p></div>
                    <div className="rounded-xl bg-[var(--bg-secondary)] p-3 text-center"><p className="text-[16px] font-bold text-[var(--fg)]">{selectedModel.inferenceTime}ms</p><p className="text-[9px] text-[var(--fg-muted)] mt-0.5">Avg Latency</p></div>
                  </div>
                </div>
              )}
              {drawerTab === 4 && (
                <div>
                  <div className="flex items-center gap-3 mb-4"><div className={`text-[20px] font-bold ${selectedModel.drift > 3 ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>{selectedModel.drift}%</div><span className={`aic-badge ${selectedModel.drift > 3 ? 'warning' : 'active'}`}>{selectedModel.drift > 3 ? 'Warning' : 'Healthy'}</span></div>
                  <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-3">Drift Over Time</h4>
                  <ResponsiveContainer width="100%" height={160}><AreaChart data={PERF_30D}><defs><linearGradient id="drwDrift" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity={0.15} /><stop offset="100%" stopColor="#F59E0B" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="time" tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><YAxis tick={{ fontSize: 9, fill: 'var(--fg-muted)' }} stroke="transparent" axisLine={false} tickLine={false} /><Tooltip content={<AicTooltip />} /><Area type="monotone" dataKey="drift" stroke="#F59E0B" strokeWidth={2} fill="url(#drwDrift)" /></AreaChart></ResponsiveContainer>
                  {selectedModel.drift > 3 && <div className="mt-3 p-3 rounded-xl bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.12)] text-[11px] text-[#F59E0B]"><AlertTriangle className="h-3.5 w-3.5 inline mr-1" />Drift exceeds threshold. Retraining recommended.</div>}
                </div>
              )}
              {drawerTab === 5 && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-2">Top Feature Inputs</h4>
                  {['Location Score', 'Square Footage', 'Comparable Sales', 'Market Index', 'Days on Market', 'Price Per SqFt', 'Amenity Score', 'Neighborhood Rating'].map((f, i) => (
                    <div key={f} className="flex items-center gap-3">
                      <span className="text-[11px] text-[var(--fg-secondary)] min-w-[130px]">{f}</span>
                      <div className="flex-1 h-4 bg-[var(--bg-secondary)] rounded-lg overflow-hidden"><div className="h-full rounded-lg transition-all duration-1000" style={{ width: `${90 - i * 8}%`, background: selectedModel.color, opacity: 0.7 }} /></div>
                      <span className="text-[10px] font-semibold text-[var(--fg)] min-w-[30px] text-right">{(0.95 - i * 0.08).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              {drawerTab === 6 && (
                <div className="space-y-3">
                  {[
                    { ver: selectedModel.version, date: selectedModel.deployedAt, status: 'current' },
                    { ver: `v${(parseFloat(selectedModel.version.slice(1)) - 0.1).toFixed(1)}`, date: '2 weeks ago', status: 'previous' },
                    { ver: `v${(parseFloat(selectedModel.version.slice(1)) - 0.3).toFixed(1)}`, date: '2 months ago', status: 'archived' },
                  ].map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <div><p className="text-[12px] font-semibold text-[var(--fg)]">{v.ver}</p><p className="text-[10px] text-[var(--fg-muted)]">{v.date}</p></div>
                      {v.status === 'current' ? <span className="aic-badge active">Current</span> : <button type="button" onClick={() => setModal({ type: 'rollback', model: selectedModel })} className="text-[10px] font-semibold text-[#6F5C46] hover:underline">Rollback</button>}
                    </div>
                  ))}
                </div>
              )}
              {drawerTab === 7 && (
                <div className="text-[10px] font-mono bg-[var(--bg-secondary)] rounded-xl p-4 space-y-1 text-[var(--fg-muted)] max-h-[400px] overflow-y-auto">
                  <p><span className="text-[#6F5C46]">[14:35:12]</span> <span className="text-[#10B981]">INFO</span>  Prediction served — confidence 0.94 — 68ms</p>
                  <p><span className="text-[#6F5C46]">[14:34:55]</span> <span className="text-[#10B981]">INFO</span>  Model health check passed</p>
                  <p><span className="text-[#6F5C46]">[14:34:30]</span> <span className="text-[#F59E0B]">WARN</span>  Low confidence prediction 0.62 — sent to review queue</p>
                  <p><span className="text-[#6F5C46]">[14:33:45]</span> <span className="text-[#10B981]">INFO</span>  Batch prediction: 240 items in 1.2s</p>
                  <p><span className="text-[#6F5C46]">[14:32:18]</span> <span className="text-[#10B981]">INFO</span>  Feature pipeline refreshed — 128 features</p>
                  <p><span className="text-[#6F5C46]">[12:00:00]</span> <span className="text-[#8B7355]">DEPLOY</span> Version {selectedModel.version} deployed to production</p>
                  <p><span className="text-[#6F5C46]">[11:58:30]</span> <span className="text-[#10B981]">INFO</span>  Training run #142 completed — accuracy {selectedModel.accuracy}%</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ═══════ MODALS ═══════ */}
      {modal && (
        <div className="aic-modal-backdrop" onClick={() => setModal(null)}>
          <div className="aic-modal" onClick={(e) => e.stopPropagation()} style={{ animation: 'slide-up-fade 0.3s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-[var(--fg)]">
                {modal.type === 'deploy' && 'Deploy Model'}{modal.type === 'retrain' && 'Retrain Model'}{modal.type === 'rollback' && 'Rollback Version'}
              </h3>
              <button type="button" onClick={() => setModal(null)} className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"><X className="h-4 w-4 text-[var(--fg-muted)]" /></button>
            </div>
            {modal.model && <div className="rounded-xl bg-[var(--bg-secondary)] p-3 mb-4"><div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: STATUS_CFG[modal.model.status].color }} /><span className="text-[13px] font-semibold text-[var(--fg)]">{modal.model.name}</span><span className="text-[10px] text-[var(--fg-muted)]">{modal.model.version}</span></div></div>}
            {modal.type === 'deploy' && (
              <div className="space-y-4">
                <div><label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1.5">Environment</label><div className="flex items-center gap-2">{['Production', 'Staging', 'Canary'].map((e) => (<button key={e} className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all ${e === 'Production' ? 'border-[#6F5C46] bg-[rgba(111,92,70,0.08)] text-[#6F5C46]' : 'border-[var(--border)] text-[var(--fg-secondary)] hover:border-[var(--fg-muted)]'}`}>{e}</button>))}</div></div>
                <div><label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1.5">Rollout %</label><div className="flex items-center gap-2">{['10%', '25%', '50%', '100%'].map((r) => (<button key={r} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[#6F5C46] hover:text-[#6F5C46] transition-all">{r}</button>))}</div></div>
                <div><label className="text-[11px] font-semibold text-[var(--fg-muted)] uppercase tracking-wider block mb-1.5">Schedule</label><div className="flex items-center gap-2">{['Now', '1 hour', 'Tomorrow 06:00', 'Custom'].map((s) => (<button key={s} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold border border-[var(--border)] text-[var(--fg-secondary)] hover:border-[#6F5C46] hover:text-[#6F5C46] transition-all">{s}</button>))}</div></div>
              </div>
            )}
            {modal.type === 'rollback' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[12px] text-[#F59E0B] bg-[rgba(245,158,11,0.06)] rounded-xl p-3"><AlertTriangle className="h-4 w-4 shrink-0" /><span>Rolling back will replace the current model in production. Ensure previous version was validated.</span></div>
              </div>
            )}
            <div className="flex items-center gap-2 justify-end mt-5">
              <button type="button" onClick={() => setModal(null)} className="adm-action-btn">Cancel</button>
              <button type="button" onClick={confirmModal} className="adm-action-btn primary"><Check className="h-3.5 w-3.5" /> Confirm</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="aic-toast"><Check className="h-4 w-4 text-[#10B981]" /><span>{toast}</span></div>}
      <style>{`@keyframes slide-in-right { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
    </div>
  );
}
