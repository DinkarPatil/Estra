'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, TrendingUp, Sparkles, Check,
  Building2, BarChart3, ArrowRight, Zap, Users,
  Search, ChevronRight, Brain, X, Scale, Download, Bookmark,
  Shield, Trophy, Star, Share2, DollarSign,
} from 'lucide-react';
import { InvestorPageHeader } from '@/components/layout/investor-page-header';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  LineChart, Line,
} from 'recharts';
import { useFunnel } from '@/contexts/investor-funnel-context';
import type { AreaRecommendation } from '@/mock-data/areas';
import { areaService } from '@/services';

/* ══════════════════════════════════════
   HELPERS
   ══════════════════════════════════════ */

function getScoreColor(score: number): string {
  if (score >= 90) return '#22C55E';
  if (score >= 80) return '#8B7355';
  if (score >= 70) return '#F59E0B';
  return '#9CA3AF';
}

function getRiskColor(risk: string): string {
  if (risk === 'low') return '#22C55E';
  if (risk === 'medium') return '#F59E0B';
  return '#EF4444';
}

function getRiskBg(risk: string): string {
  if (risk === 'low') return 'rgba(34,197,94,0.10)';
  if (risk === 'medium') return 'rgba(245,158,11,0.10)';
  return 'rgba(239,68,68,0.10)';
}

function getDemandColor(demand: string): string {
  if (demand === 'high') return '#22C55E';
  if (demand === 'medium') return '#F59E0B';
  return '#9CA3AF';
}

function getDemandBg(demand: string): string {
  if (demand === 'high') return 'rgba(34,197,94,0.10)';
  if (demand === 'medium') return 'rgba(245,158,11,0.10)';
  return 'rgba(156,163,175,0.10)';
}

function getSupply(area: AreaRecommendation): 'high' | 'medium' | 'low' {
  if (area.demand === 'high') return 'low';
  if (area.demand === 'medium') return 'medium';
  return 'high';
}

function getLiquidity(area: AreaRecommendation): 'high' | 'medium' | 'low' {
  if (area.riskLevel === 'low' && area.demand !== 'low') return 'high';
  if (area.riskLevel === 'high') return 'low';
  return 'medium';
}

/* ══════════════════════════════════════
   AREA COLORS — Glimmora monochromatic palette
   ══════════════════════════════════════ */
const AREA_COLORS = ['#8B5A2B', '#6A3400', '#C58A3A'];

/* ══════════════════════════════════════
   YIELD TREND CONSTANTS
   ══════════════════════════════════════ */
const YIELD_QUARTERS = [
  "Q2 '22", "Q3 '22", "Q4 '22",
  "Q1 '23", "Q2 '23", "Q3 '23",
  "Q4 '23", "Q1 '24", "Q2 '24",
  "Q3 '24", "Q4 '24", "Q2 '25",
];
const SHOW_Q_TICKS = new Set([0, 3, 6, 9, 11]);

/* ══════════════════════════════════════
   MINI YIELD CHART COMPONENT
   ══════════════════════════════════════ */
function MiniYieldChart({
  trendData,
  avgYield,
  areaId,
}: {
  trendData: number[];
  avgYield: number;
  areaId: string;
}) {
  const lastRaw = trendData[trendData.length - 1] || 1;
  const scale = avgYield / lastRaw;
  const chartData = trendData.slice(0, 12).map((v, i) => ({
    quarter: YIELD_QUARTERS[i] ?? `Q${i}`,
    yield: Math.round(v * scale * 10) / 10,
  }));
  const gradId = `yg-${areaId}`;

  return (
    <div className="mt-3 border-t border-[rgba(139,90,43,0.10)] pt-3">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[8.5px] font-bold uppercase tracking-widest"
          style={{ color: '#8A7A68' }}
        >
          Yield Trend (Past 12 Quarters)
        </span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(139,90,43,0.10)',
            color: '#8B5A2B',
            border: '1px solid rgba(139,90,43,0.12)',
          }}
        >
          {avgYield}%
        </span>
      </div>

      {/* Chart */}
      <div className="h-[112px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 6, right: 4, left: 2, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5A2B" stopOpacity={0.12} />
                <stop offset="100%" stopColor="#8B5A2B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(139,90,43,0.10)"
              vertical={false}
            />
            <XAxis
              dataKey="quarter"
              tickFormatter={(_, i) =>
                SHOW_Q_TICKS.has(i) ? (chartData[i]?.quarter ?? '') : ''
              }
              tick={{ fontSize: 7.5, fill: '#8A7A68' }}
              tickLine={false}
              axisLine={false}
              interval={0}
            />
            <YAxis
              domain={[0, 8]}
              ticks={[0, 2, 4, 6]}
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 7.5, fill: '#8A7A68' }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as { quarter: string; yield: number };
                return (
                  <div
                    className="rounded-lg px-2.5 py-1.5 shadow-lg"
                    style={{
                      background: 'rgba(255,255,255,0.97)',
                      border: '1px solid rgba(139,90,43,0.12)',
                    }}
                  >
                    <p style={{ fontSize: 9, color: '#8A7A68', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      {d.quarter}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#3B2A1A' }}>
                      {d.yield}%
                    </p>
                  </div>
                );
              }}
              cursor={{ stroke: 'rgba(139,90,43,0.12)', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="yield"
              stroke="#8B5A2B"
              strokeWidth={1.75}
              dot={{ fill: '#8B5A2B', r: 2.5, strokeWidth: 0 }}
              activeDot={{ r: 4.5, fill: '#6A3400', strokeWidth: 2, stroke: 'rgba(139,90,43,0.25)' }}
              isAnimationActive
              animationDuration={1400}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   ANIMATION VARIANTS
   ══════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
} as const;

const _headerVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
} as const;

const stickyBarVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
} as const;

/* ══════════════════════════════════════
   AREA COMPARE MODAL — Premium v2
   ══════════════════════════════════════ */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MetricRow {
  Icon: React.ElementType;
  label: string;
  render: (a: AreaRecommendation) => React.ReactNode;
  barFn: ((a: AreaRecommendation) => number) | null;
  best: (a: AreaRecommendation) => boolean;
}

function AreaCompareModal({
  areas,
  onClose,
  onContinue,
}: {
  areas: AreaRecommendation[];
  onClose: () => void;
  onContinue: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'radar' | 'trend' | 'yield' | 'growth'>('radar');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* Price parser */
  const parsePrice = (s: string) => {
    const n = parseFloat(s.replace(/[^0-9.]/g, ''));
    if (s.includes('M')) return n * 1_000_000;
    if (s.includes('K')) return n * 1_000;
    return n;
  };

  const riskOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
  const demandScore: Record<string, number> = { high: 100, medium: 60, low: 30 };
  const safetyScore: Record<string, number> = { low: 100, medium: 55, high: 15 };

  /* Best-in-class per KPI */
  const bestScore  = areas.reduce((b, a) => (a.matchScore > b.matchScore ? a : b), areas[0]);
  const bestYield  = areas.reduce((b, a) => (a.avgYield > b.avgYield ? a : b), areas[0]);
  const bestGrowth = areas.reduce((b, a) => (a.growth3Y > b.growth3Y ? a : b), areas[0]);
  const bestRisk   = areas.reduce((b, a) => (riskOrder[a.riskLevel] < riskOrder[b.riskLevel] ? a : b), areas[0]);
  const bestDemand = areas.reduce((b, a) => (demandScore[a.demand] > demandScore[b.demand] ? a : b), areas[0]);
  const bestProps  = areas.reduce((b, a) => (a.properties > b.properties ? a : b), areas[0]);
  const bestValue  = areas.reduce((b, a) => (parsePrice(a.avgPrice) < parsePrice(b.avgPrice) ? a : b), areas[0]);
  const luxuryPick = areas.reduce((b, a) => (parsePrice(a.avgPrice) > parsePrice(b.avgPrice) ? a : b), areas[0]);
  const stablePick = areas
    .filter(a => riskOrder[a.riskLevel] === riskOrder[bestRisk.riskLevel])
    .reduce((b, a) => (a.matchScore > b.matchScore ? a : b), areas[0]);

  const maxProps = Math.max(...areas.map(a => a.properties));

  /* Verdict badges */
  const verdicts = [
    { label: 'Best Overall', area: bestScore,  Icon: Trophy,    color: '#8B7355', bg: 'rgba(139,115,85,0.10)' },
    { label: 'Best Yield',   area: bestYield,  Icon: TrendingUp, color: '#22C55E', bg: 'rgba(34,197,94,0.10)'  },
    { label: 'Luxury Pick',  area: luxuryPick, Icon: Star,      color: '#F59E0B', bg: 'rgba(245,158,11,0.10)' },
    { label: 'Stable Pick',  area: stablePick, Icon: Shield,    color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
  ];

  /* Chart data */
  const trendChartData = useMemo(() =>
    MONTHS.map((month, i) => {
      const entry: Record<string, string | number> = { month };
      areas.forEach(a => { entry[a.id] = a.trendData[i]; });
      return entry;
    }), [areas]);

  const radarData = useMemo(() => {
    const dims = ['AI Score', 'Yield', 'Growth', 'Demand', 'Safety', 'Supply'];
    return dims.map(dim => {
      const row: Record<string, string | number> = { subject: dim };
      areas.forEach(a => {
        switch (dim) {
          case 'AI Score': row[a.id] = a.matchScore; break;
          case 'Yield':    row[a.id] = Math.round(Math.min((a.avgYield / 10) * 100, 100)); break;
          case 'Growth':   row[a.id] = Math.round(Math.min((a.growth3Y / 40) * 100, 100)); break;
          case 'Demand':   row[a.id] = demandScore[a.demand]; break;
          case 'Safety':   row[a.id] = safetyScore[a.riskLevel]; break;
          case 'Supply':   row[a.id] = Math.round((a.properties / maxProps) * 100); break;
        }
      });
      return row;
    });
  }, [areas, maxProps]);

  /* Metric rows */
  const metricRows: MetricRow[] = [
    {
      Icon: Brain,
      label: 'AI Score',
      render: a => `${a.matchScore}/100`,
      barFn: a => a.matchScore / 100,
      best: a => a.id === bestScore.id,
    },
    {
      Icon: DollarSign,
      label: 'Avg Price',
      render: a => a.avgPrice,
      barFn: null,
      best: a => a.id === bestValue.id,
    },
    {
      Icon: TrendingUp,
      label: 'Rental Yield',
      render: a => `${a.avgYield}%`,
      barFn: a => Math.min(a.avgYield / 10, 1),
      best: a => a.id === bestYield.id,
    },
    {
      Icon: BarChart3,
      label: '3Y Growth',
      render: a => `+${a.growth3Y}%`,
      barFn: a => Math.min(a.growth3Y / 40, 1),
      best: a => a.id === bestGrowth.id,
    },
    {
      Icon: Shield,
      label: 'Risk Level',
      render: a => (
        <span
          className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full"
          style={{ background: getRiskBg(a.riskLevel), color: getRiskColor(a.riskLevel) }}
        >
          {a.riskLevel}
        </span>
      ),
      barFn: null,
      best: a => a.id === bestRisk.id,
    },
    {
      Icon: Users,
      label: 'Demand',
      render: a => (
        <span
          className="text-[11px] font-semibold capitalize px-2 py-0.5 rounded-full"
          style={{ background: getDemandBg(a.demand), color: getDemandColor(a.demand) }}
        >
          {a.demand}
        </span>
      ),
      barFn: null,
      best: a => a.id === bestDemand.id,
    },
    {
      Icon: Building2,
      label: 'Properties',
      render: a => a.properties.toLocaleString(),
      barFn: a => a.properties / maxProps,
      best: a => a.id === bestProps.id,
    },
  ];

  /* Insight helpers */
  function getInvestorType(a: AreaRecommendation): string {
    if (a.avgYield > 7 && a.riskLevel === 'low') return 'Income + Safety Investor';
    if (a.growth3Y > 25) return 'Capital Growth Investor';
    if (a.avgYield > 6) return 'Yield-Focused Investor';
    if (a.riskLevel === 'low') return 'Conservative Long-term Investor';
    if (parsePrice(a.avgPrice) > 2_000_000) return 'Luxury / UHNW Investor';
    return 'Balanced Portfolio Investor';
  }

  function getAreaRiskNote(a: AreaRecommendation): string {
    if (a.riskLevel === 'low') return `Stable market with ${a.demand} demand — minimal downside.`;
    if (a.riskLevel === 'medium') return `Moderate volatility; cushioned by ${a.demand} demand.`;
    return 'Higher volatility — suited for sophisticated investors.';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="area-cmp-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 52, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="area-cmp-modal"
      >

        {/* ══ HEADER ══ */}
        <div className="area-cmp-header">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="area-cmp-header-icon">
              <Scale className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-[var(--fg)] leading-tight">Area Comparison</h2>
              <p className="text-[10px] text-[var(--fg-muted)] hidden sm:block">AI-powered investment decision engine</p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 ml-2 min-w-0 overflow-hidden flex-wrap">
              {areas.map((area, i) => (
                <span key={area.id} className="area-cmp-area-chip">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: AREA_COLORS[i] }} />
                  <span className="truncate max-w-[90px]">{area.flag} {area.name}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="area-cmp-live-badge">
              <span className="area-cmp-live-dot" />
              Live
            </span>
            <button onClick={onClose} className="area-cmp-close-btn" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ══ SCROLLABLE BODY ══ */}
        <div className="area-cmp-body">

          {/* ── AI VERDICT PANEL ── */}
          <div className="area-cmp-ai-panel">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#8B7355] to-[#6F5C46] flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[var(--fg)]">AI Verdict Panel</p>
                <p className="text-[10px] text-[var(--fg-muted)]">Powered by Glimmora Intelligence</p>
              </div>
              <span className="ml-auto text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[rgba(139,115,85,0.10)] text-[#8B7355] border border-[rgba(139,115,85,0.18)] shrink-0">
                Live Analysis
              </span>
            </div>

            {/* 4 verdict badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              {verdicts.map(({ label, area, Icon, color, bg }) => (
                <div key={label} className="area-cmp-verdict-badge" style={{ borderColor: color + '28' }}>
                  <div className="area-cmp-verdict-icon" style={{ background: bg }}>
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color }}>{label}</p>
                    <p className="text-[12px] font-bold text-[var(--fg)] truncate">{area.name}</p>
                    <p className="text-[10px] text-[var(--fg-muted)] truncate">{area.city}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* AI narrative */}
            <p className="text-[13px] leading-relaxed text-[var(--fg-secondary)]">
              {`${bestScore.name} leads with an AI Score of ${bestScore.matchScore}/100 — ${bestScore.demand} demand, ${bestScore.riskLevel} risk, and ${bestScore.avgYield}% rental yield make it the strongest all-round bet.`}
              {bestYield.id !== bestScore.id && ` ${bestYield.name} delivers superior income at ${bestYield.avgYield}% p.a.`}
              {bestGrowth.id !== bestScore.id && ` ${bestGrowth.name} shows the highest capital growth at +${bestGrowth.growth3Y}%.`}
            </p>

            <div className="mt-3.5 pt-3.5 border-t border-[rgba(139,115,85,0.12)] flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#8B7355]" />
                <span className="text-[11px] font-semibold text-[var(--fg)]">Recommended: {bestScore.name}</span>
              </div>
              <div className="h-3 w-px bg-[var(--border)]" />
              <span className="text-[11px] text-[var(--fg-muted)]">Score {bestScore.matchScore}/100</span>
              <div className="h-3 w-px bg-[var(--border)]" />
              <span className="text-[11px] text-[var(--fg-muted)]">{bestScore.recentChange}</span>
            </div>
          </div>

          {/* ── METRIC COMPARISON ── */}
          <div className="area-cmp-metrics-section">
            {/* Column headers */}
            <div className="area-cmp-metrics-header">
              <div className="area-cmp-metric-label-col">
                <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">Metric</p>
              </div>
              <div className="area-cmp-metric-cells">
                {areas.map((area, i) => (
                  <div key={area.id} className="area-cmp-metric-cell area-cmp-metric-col-head">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: AREA_COLORS[i] }} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[var(--fg)] truncate">{area.name}</p>
                      <p className="text-[9px] text-[var(--fg-muted)] truncate">{area.city}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metric rows */}
            {metricRows.map(row => (
              <div key={row.label} className="area-cmp-metric-row">
                <div className="area-cmp-metric-label-col">
                  <row.Icon className="h-3.5 w-3.5 text-[var(--fg-muted)] shrink-0" />
                  <span className="text-[11px] text-[var(--fg-secondary)]">{row.label}</span>
                </div>
                <div className="area-cmp-metric-cells">
                  {areas.map(area => {
                    const isWinner = row.best(area);
                    const barWidth = row.barFn ? row.barFn(area) : null;
                    return (
                      <div key={area.id} className={`area-cmp-metric-cell ${isWinner ? 'winner' : ''}`}>
                        {isWinner && (
                          <span className="area-cmp-winner-crown">
                            <Trophy className="h-2.5 w-2.5" />
                          </span>
                        )}
                        <span className="area-cmp-cell-value capitalize">{row.render(area)}</span>
                        {barWidth !== null && (
                          <div className="area-cmp-mini-bar-track">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth * 100}%` }}
                              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                              className="area-cmp-mini-bar"
                              style={isWinner ? { background: '#8B5A2B' } : undefined}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ── PERFORMANCE CHARTS ── */}
          <div>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <p className="area-cmp-section-label">Performance Charts</p>
              <div className="area-cmp-tabs">
                {(['radar', 'trend', 'yield', 'growth'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`area-cmp-tab ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab === 'radar' ? 'Radar' : tab === 'trend' ? 'Price Trend' : tab === 'yield' ? 'Yield' : 'Growth'}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {/* Radar Compare */}
                {activeTab === 'radar' && (
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 10, right: 24, left: 24, bottom: 10 }}>
                        <PolarGrid stroke="rgba(139,90,43,0.10)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#8A7A68' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#8A7A68' }} tickCount={3} />
                        {areas.map((area, i) => (
                          <Radar
                            key={area.id}
                            name={area.name}
                            dataKey={area.id}
                            stroke={AREA_COLORS[i]}
                            fill={AREA_COLORS[i]}
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                        ))}
                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="area-cmp-tooltip">
                                <p className="text-[10px] font-semibold text-[var(--fg-muted)] mb-1.5">{label}</p>
                                {payload.map((entry: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1.5 py-0.5">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                                    <span className="text-[11px] text-[var(--fg-secondary)]">{entry.name}</span>
                                    <span className="text-[11px] font-semibold text-[var(--fg)] ml-auto pl-3">{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Price Trend */}
                {activeTab === 'trend' && (
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendChartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                        <defs>
                          {areas.map((area, i) => (
                            <linearGradient key={area.id} id={`cmpGradV2-${area.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={AREA_COLORS[i]} stopOpacity={0.18} />
                              <stop offset="100%" stopColor={AREA_COLORS[i]} stopOpacity={0} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,90,43,0.10)" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#8A7A68' }} stroke="transparent" tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#8A7A68' }} stroke="transparent" tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="area-cmp-tooltip">
                                <p className="text-[10px] font-semibold text-[var(--fg-muted)] mb-1.5">{label}</p>
                                {payload.map((entry: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1.5 py-0.5">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
                                    <span className="text-[11px] text-[var(--fg-secondary)]">{entry.name}</span>
                                    <span className="text-[11px] font-semibold text-[var(--fg)] ml-auto pl-3">{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }}
                        />
                        {areas.map((area, i) => (
                          <Area
                            key={area.id}
                            type="monotone"
                            dataKey={area.id}
                            name={area.name}
                            stroke={AREA_COLORS[i]}
                            fill={`url(#cmpGradV2-${area.id})`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, fill: AREA_COLORS[i], strokeWidth: 2, stroke: 'white' }}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Yield */}
                {activeTab === 'yield' && (
                  <div className="space-y-4 py-3">
                    {areas.map((area, i) => (
                      <div key={area.id} className="area-cmp-bar-row">
                        <div className="flex items-center gap-2" style={{ width: 140, flexShrink: 0 }}>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: AREA_COLORS[i] }} />
                          <span className="text-xs text-[var(--fg-secondary)] truncate">{area.name}</span>
                        </div>
                        <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: '#EEE8E1' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((area.avgYield / 10) * 100, 100)}%` }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full"
                            style={{ background: AREA_COLORS[i] }}
                          />
                        </div>
                        <span className="text-xs font-bold shrink-0 text-right" style={{ width: 44, color: '#8B5A2B' }}>
                          {area.avgYield}%
                        </span>
                      </div>
                    ))}
                    <p className="text-[10px] text-[var(--fg-muted)] text-right pt-1">Rental yield % p.a. (scale: 0–10%)</p>
                  </div>
                )}

                {/* Growth */}
                {activeTab === 'growth' && (
                  <div className="space-y-4 py-3">
                    {areas.map((area, i) => (
                      <div key={area.id} className="area-cmp-bar-row">
                        <div className="flex items-center gap-2" style={{ width: 140, flexShrink: 0 }}>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: AREA_COLORS[i] }} />
                          <span className="text-xs text-[var(--fg-secondary)] truncate">{area.name}</span>
                        </div>
                        <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: '#EEE8E1' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((area.growth3Y / 40) * 100, 100)}%` }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full"
                            style={{ background: AREA_COLORS[i] }}
                          />
                        </div>
                        <span className="text-xs font-bold shrink-0 text-right" style={{ width: 44, color: '#8B5A2B' }}>
                          +{area.growth3Y}%
                        </span>
                      </div>
                    ))}
                    <p className="text-[10px] text-[var(--fg-muted)] text-right pt-1">3-year capital growth % (scale: 0–40%)</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Chart legend */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border)]">
              {areas.map((area, i) => (
                <div key={area.id} className="flex items-center gap-1.5">
                  <div className="w-3 h-1.5 rounded-full" style={{ background: AREA_COLORS[i] }} />
                  <span className="text-[10px] text-[var(--fg-muted)]">{area.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── AREA INSIGHT CARDS ── */}
          <div>
            <p className="area-cmp-section-label mb-3">Area Insights</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {areas.map((area, i) => (
                <div key={area.id} className="area-cmp-insight-card">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: AREA_COLORS[i] }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold text-[var(--fg)] truncate">{area.name}</p>
                      <p className="text-[10px] text-[var(--fg-muted)] truncate">{area.city}</p>
                    </div>
                    {area.id === bestScore.id && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[rgba(139,115,85,0.12)] text-[#8B7355] border border-[rgba(139,115,85,0.20)] shrink-0">
                        Top Pick
                      </span>
                    )}
                  </div>

                  <div className="mb-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--fg-muted)] mb-1.5">Strengths</p>
                    <div className="flex flex-wrap gap-1">
                      {area.highlights.slice(0, 3).map(h => (
                        <span key={h} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--bg-secondary)] text-[var(--fg-secondary)] border border-[var(--border)]">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-2.5">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--fg-muted)] mb-1">Ideal For</p>
                    <p className="text-[11px] font-semibold" style={{ color: '#8B5A2B' }}>{getInvestorType(area)}</p>
                  </div>

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--fg-muted)] mb-1">Risk Note</p>
                    <p className="text-[11px] text-[var(--fg-secondary)] leading-relaxed">{getAreaRiskNote(area)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>{/* end body */}

        {/* ══ FOOTER ══ */}
        <div className="area-cmp-footer">
          <div className="flex items-center gap-2">

            {/* ── Save Analysis ── */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (saved || saving) return;
                setSaving(true);
                try {
                  const existing = JSON.parse(localStorage.getItem('estra_saved_analyses') || '[]');
                  const snapshot = {
                    id: `analysis-${Date.now()}`,
                    savedAt: new Date().toISOString(),
                    areas: areas.map(a => ({
                      id: a.id, name: a.name, city: a.city,
                      matchScore: a.matchScore, avgYield: a.avgYield,
                      growth3Y: a.growth3Y, riskLevel: a.riskLevel,
                      demand: a.demand, avgPrice: a.avgPrice,
                    })),
                    aiVerdict: {
                      bestOverall: bestScore.name,
                      bestYield: bestYield.name,
                      luxuryPick: luxuryPick.name,
                      stablePick: stablePick.name,
                    },
                  };
                  localStorage.setItem('estra_saved_analyses', JSON.stringify([snapshot, ...existing]));
                } catch { /* ignore storage errors */ }
                setTimeout(() => {
                  setSaving(false);
                  setSaved(true);
                  showToast('Analysis saved successfully');
                }, 700);
              }}
              disabled={saved}
              className={`area-cmp-btn-secondary ${saved ? 'area-cmp-btn-saved' : ''}`}
            >
              {saving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                  className="h-3.5 w-3.5 border-2 border-[#8B7355] border-t-transparent rounded-full"
                />
              ) : saved ? (
                <Check className="h-3.5 w-3.5 text-[#22C55E]" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Analysis'}</span>
            </motion.button>

            {/* ── Export PDF ── */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (exporting || exported) return;
                setExporting(true);
                setTimeout(() => {
                  /* Build a styled HTML report as download */
                  const rows = [
                    ['Metric', ...areas.map(a => a.name)],
                    ['AI Score', ...areas.map(a => `${a.matchScore}/100`)],
                    ['Avg Price', ...areas.map(a => a.avgPrice)],
                    ['Rental Yield', ...areas.map(a => `${a.avgYield}%`)],
                    ['3Y Growth', ...areas.map(a => `+${a.growth3Y}%`)],
                    ['Risk Level', ...areas.map(a => a.riskLevel)],
                    ['Demand', ...areas.map(a => a.demand)],
                    ['Properties', ...areas.map(a => String(a.properties))],
                  ];
                  const tableRows = rows.map((r, i) =>
                    `<tr style="${i === 0 ? 'background:#8B7355;color:#fff;' : i % 2 === 0 ? 'background:#faf8f5;' : ''}">${r.map(cell => `<td style="padding:10px 14px;border:1px solid #e8dfd5;font-size:13px;">${cell}</td>`).join('')}</tr>`
                  ).join('');
                  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Area Comparison — Glimmora</title>
<style>body{font-family:system-ui,sans-serif;color:#2A211B;margin:40px;background:#fff;}
h1{font-size:22px;font-weight:800;color:#6F5C46;margin-bottom:4px;}
p.sub{font-size:12px;color:#9A8B7E;margin-bottom:28px;}
table{border-collapse:collapse;width:100%;margin-bottom:28px;}
.verdict{display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap;}
.vcard{padding:12px 16px;border-radius:10px;border:1px solid #e8dfd5;background:#faf8f5;min-width:140px;}
.vcard .label{font-size:9px;font-weight:700;text-transform:uppercase;color:#A89478;margin-bottom:4px;}
.vcard .val{font-size:13px;font-weight:700;color:#6F5C46;}
.footer{font-size:10px;color:#B0A090;border-top:1px solid #e8dfd5;padding-top:12px;margin-top:8px;}
</style></head><body>
<h1>Area Comparison Report</h1>
<p class="sub">Generated by Glimmora Intelligence · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
<div class="verdict">
  <div class="vcard"><div class="label">Best Overall</div><div class="val">${bestScore.name}</div></div>
  <div class="vcard"><div class="label">Best Yield</div><div class="val">${bestYield.name}</div></div>
  <div class="vcard"><div class="label">Luxury Pick</div><div class="val">${luxuryPick.name}</div></div>
  <div class="vcard"><div class="label">Stable Pick</div><div class="val">${stablePick.name}</div></div>
</div>
<table>${tableRows}</table>
<p><strong>AI Recommendation:</strong> ${bestScore.name} leads with an AI Score of ${bestScore.matchScore}/100 — ${bestScore.demand} demand, ${bestScore.riskLevel} risk, and ${bestScore.avgYield}% rental yield.</p>
<p class="footer">Glimmora Platform · Confidential · For authorized investors only</p>
</body></html>`;
                  const blob = new Blob([html], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `glimmora-area-comparison-${Date.now()}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setExporting(false);
                  setExported(true);
                  showToast('Report downloaded successfully');
                  setTimeout(() => setExported(false), 4000);
                }, 1200);
              }}
              disabled={exporting}
              className="area-cmp-btn-secondary"
            >
              {exporting ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                  className="h-3.5 w-3.5 border-2 border-[#8B7355] border-t-transparent rounded-full"
                />
              ) : exported ? (
                <Check className="h-3.5 w-3.5 text-[#22C55E]" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {exporting ? 'Generating…' : exported ? 'Downloaded ✓' : 'Export PDF'}
              </span>
            </motion.button>

            {/* ── Share ── */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (sharing) return;
                setSharing(true);
                try {
                  const url = `${window.location.origin}/investor/areas?compare=${areas.map(a => a.id).join(',')}`;
                  navigator.clipboard.writeText(url).catch(() => {});
                } catch { /* ignore */ }
                setTimeout(() => {
                  setSharing(false);
                  showToast('Link copied to clipboard');
                }, 400);
              }}
              className="area-cmp-btn-secondary hidden sm:inline-flex"
            >
              {sharing ? (
                <Check className="h-3.5 w-3.5 text-[#22C55E]" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
              <span>{sharing ? 'Copied!' : 'Share'}</span>
            </motion.button>
          </div>

          <button onClick={onContinue} className="area-cmp-btn-primary">
            Continue to Properties
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── In-modal Toast ── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 12, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 8, x: '-50%' }}
              transition={{ duration: 0.22 }}
              className="area-cmp-toast"
            >
              <Check className="h-3.5 w-3.5 text-[#22C55E] shrink-0" />
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════
   AREA CARD COMPONENT
   ══════════════════════════════════════ */

function AreaCard({
  area,
  isSelected,
  onToggle,
}: {
  area: AreaRecommendation;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const scoreColor = getScoreColor(area.matchScore);
  const riskColor = getRiskColor(area.riskLevel);

  const visibleHighlights = area.highlights.slice(0, 3);
  const hiddenHighlightCount = Math.max(0, area.highlights.length - visibleHighlights.length);

  return (
    <motion.div
      variants={cardVariants}
      onClick={onToggle}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      className={`area-card group ${isSelected ? 'is-selected' : ''}`}
    >
      {/* ── Image Section ── */}
      <div className="area-card-image">
        <img
          src={area.image}
          alt={area.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <div className="area-card-image-overlay" />

        {area.isRecommended && (
          <span className="area-card-recommended">
            <Sparkles className="h-3 w-3" strokeWidth={1.75} />
            AI Recommended
          </span>
        )}

        {/* Area name + city overlay */}
        <div className="area-card-title-block">
          <h3 className="area-card-title">{area.name}</h3>
          <div className="area-card-loc">
            <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
            <span>{area.flag} {area.city}, {area.country}</span>
          </div>
        </div>
      </div>

      {/* Subtle selection check (top-right corner of card) */}
      {isSelected && (
        <span className="area-card-check" aria-hidden>
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      )}

      {/* ── Card Body ── */}
      <div className="area-card-body">

        {/* AI Score pill — integrated into content, not an image overlay */}
        <div className="area-card-score-row">
          <span className="area-card-score-pill">
            <span className="area-card-score-dot" style={{ background: scoreColor }} />
            AI Score
            <span className="area-card-score-num">{area.matchScore}</span>
          </span>
        </div>

        {/* Metrics grid 2x2 — flat, no inner cards */}
        <div className="area-card-metrics">
          <div>
            <div className="area-card-metric-label">Avg Price</div>
            <div className="area-card-metric-value">{area.avgPrice}</div>
          </div>
          <div>
            <div className="area-card-metric-label">3Y Growth</div>
            <div className="area-card-metric-value">+{area.growth3Y}%</div>
          </div>
          <div>
            <div className="area-card-metric-label">Rental Yield</div>
            <div className="area-card-metric-value flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-[#22C55E]" strokeWidth={2} />
              {area.avgYield}%
            </div>
          </div>
          <div>
            <div className="area-card-metric-label">Risk</div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: riskColor }} />
              <span className="text-[12.5px] font-semibold capitalize" style={{ color: riskColor }}>
                {area.riskLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Premium Yield Trend Chart */}
        <MiniYieldChart
          trendData={area.trendData}
          avgYield={area.avgYield}
          areaId={area.id}
        />

        {/* Why matched (1-line clamp) */}
        <p className="area-card-why">
          <Brain className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span>{area.whyMatched}</span>
        </p>

        {/* Highlights — capped at 3 */}
        {visibleHighlights.length > 0 && (
          <div className="area-card-tags">
            {visibleHighlights.map((h) => (
              <span key={h} className="area-card-tag">{h}</span>
            ))}
            {hiddenHighlightCount > 0 && (
              <span className="area-card-tag area-card-tag-more">+{hiddenHighlightCount}</span>
            )}
          </div>
        )}

        {/* Market Stats — Demand / Supply / Liquidity */}
        <div
          className="mt-3 pt-2.5 border-t grid grid-cols-3 gap-1"
          style={{ borderColor: 'rgba(139,90,43,0.10)' }}
        >
          {(
            [
              { label: 'Demand',    value: area.demand,         Icon: Users    },
              { label: 'Supply',    value: getSupply(area),     Icon: Building2 },
              { label: 'Liquidity', value: getLiquidity(area),  Icon: Zap      },
            ] as const
          ).map(({ label, value, Icon }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 py-1">
              <Icon className="h-3 w-3 mb-0.5" style={{ color: '#A89478' }} strokeWidth={1.5} />
              <span
                className="text-[7.5px] uppercase tracking-widest font-semibold"
                style={{ color: '#A89478' }}
              >
                {label}
              </span>
              <span
                className="text-[10.5px] font-semibold capitalize"
                style={{ color: '#6E5235' }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════ */

export default function AreasRecommendationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    searchQuery,
    selectedAreaIds,
    toggleArea,
    setCurrentStep,
    completeStep,
    clearAreas,
  } = useFunnel();

  // URL param wins over context — eliminates the hydration race condition.
  // Smart Search passes ?q=<term> so the areas page always has the query
  // available synchronously, even before the funnel context hydrates from
  // localStorage.
  const effectiveQuery = searchParams?.get('q') || searchQuery || '';

  const [areasData, setAreasData] = useState<AreaRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [sortBy, setSortBy] = useState<'score' | 'yield' | 'growth' | 'risk'>('score');
  const [filterDemand, setFilterDemand] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Prevents double-fire: once auto-selection runs we don't repeat it
  // (e.g. when user manually de-selects we don't override their choice).
  const autoSelectedRef = useRef(false);

  // Set funnel step on mount
  useEffect(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  // Fetch areas via service (mock or real per NEXT_PUBLIC_USE_MOCK_DATA).
  // Uses effectiveQuery so the correct search runs immediately on mount
  // without waiting for funnel context to hydrate.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    // Reset auto-select guard whenever the query changes so a fresh search
    // gets its own auto-selection pass.
    autoSelectedRef.current = false;
    areaService
      .searchAreas(effectiveQuery)
      .then((data) => {
        if (!cancelled) setAreasData(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load areas');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveQuery]);

  // Auto-select recommended areas once data loads, but only if:
  // 1. Data is present
  // 2. The user hasn't already selected anything
  // 3. We haven't auto-selected for this query yet (prevents re-firing)
  useEffect(() => {
    if (autoSelectedRef.current) return;
    if (areasData.length === 0) return;
    if (selectedAreaIds.length > 0) return;
    const recommended = areasData.filter((a) => a.isRecommended).slice(0, 3);
    if (recommended.length === 0) return;
    autoSelectedRef.current = true;
    clearAreas();
    recommended.forEach((a) => toggleArea(a.id, a.name));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areasData]);

  // Sort + filter logic
  const sortedAreas = useMemo(() => {
    let areas = [...areasData];

    // Filter by demand
    if (filterDemand !== 'all') {
      areas = areas.filter((a) => a.demand === filterDemand);
    }

    // Sort
    switch (sortBy) {
      case 'score':
        areas.sort((a, b) => b.matchScore - a.matchScore);
        break;
      case 'yield':
        areas.sort((a, b) => b.avgYield - a.avgYield);
        break;
      case 'growth':
        areas.sort((a, b) => b.growth3Y - a.growth3Y);
        break;
      case 'risk':
        {
          const riskOrder = { low: 0, medium: 1, high: 2 };
          areas.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
        }
        break;
    }

    return areas;
  }, [areasData, sortBy, filterDemand]);

  // Selected areas detail
  const selectedAreas = useMemo(
    () => areasData.filter((a) => selectedAreaIds.includes(a.id)),
    [areasData, selectedAreaIds],
  );

  // Auto-select top 3 recommended
  const handleAutoSelect = useCallback(() => {
    clearAreas();
    const recommended = areasData.filter((a) => a.isRecommended);
    recommended.forEach((a) => toggleArea(a.id, a.name));
  }, [areasData, clearAreas, toggleArea]);

  // Continue to properties
  const handleContinue = useCallback(() => {
    completeStep(2);
    setCurrentStep(3);
    router.push('/investor/properties');
  }, [completeStep, setCurrentStep, router]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-24 px-4 sm:px-6 lg:px-8">

      {/* ═══════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════ */}
      <InvestorPageHeader
        icon={MapPin}
        title="Area Recommendations"
        subtitle={
          effectiveQuery
            ? <>Based on your search: &lsquo;{effectiveQuery}&rsquo;</>
            : 'AI-curated investment areas based on your preferences'
        }
        actions={
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium bg-[var(--bg-secondary)] text-[var(--fg-secondary)]">
              <Zap className="h-3 w-3 text-[#8B7355]" strokeWidth={1.5} />
              {areasData.length} areas analyzed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium bg-[var(--bg-secondary)] text-[var(--fg-muted)]">
              Step 2 of 5
            </span>
          </div>
        }
      >
        {/* Top Picks bar */}
        <div className="rounded-[10px] px-4 py-3 bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-secondary)]">
                Top Picks
              </span>
            </div>

            {areasData
              .filter((a) => a.isRecommended)
              .map((area, i, arr) => (
                <button
                  key={area.id}
                  onClick={() => {
                    if (!selectedAreaIds.includes(area.id)) toggleArea(area.id, area.name);
                  }}
                  className="flex items-center gap-3 shrink-0 group cursor-pointer rounded-md transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-semibold text-[var(--fg-muted)] opacity-60">
                      0{i + 1}
                    </span>
                    <span className="text-[12px] font-medium text-[var(--fg-secondary)] group-hover:text-[var(--fg)] transition-colors">
                      {area.name}, {area.city}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold"
                      style={{ color: getScoreColor(area.matchScore) }}
                    >
                      <TrendingUp className="h-2.5 w-2.5" strokeWidth={2} />
                      {area.matchScore}%
                    </span>
                  </div>
                  {i < arr.length - 1 && <div className="h-3 w-px bg-[var(--border)]" />}
                </button>
              ))}

            <span className="ml-auto shrink-0 text-[10px] font-medium text-[var(--fg-muted)]">
              {selectedAreaIds.length} of 3 selected
            </span>
          </div>
        </div>
      </InvestorPageHeader>

      {/* Sort + Filter bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 mr-1">
          <BarChart3 className="h-3.5 w-3.5 text-[var(--fg-muted)]" strokeWidth={1.5} />
          <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold">
            Sort
          </span>
        </div>
        {(
          [
            { label: 'AI Score', value: 'score' },
            { label: 'Yield', value: 'yield' },
            { label: 'Growth', value: 'growth' },
            { label: 'Risk', value: 'risk' },
          ] as const
        ).map((s) => (
          <button
            key={s.value}
            onClick={() => setSortBy(s.value)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer ${
              sortBy === s.value
                ? 'bg-[#8B7355]/10 text-[#8B7355] border border-[#8B7355]/30'
                : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] border border-[var(--border)] hover:text-[var(--fg-secondary)]'
            }`}
          >
            {s.label}
          </button>
        ))}

        <div className="h-4 w-px bg-[var(--border)] mx-2" />

        <div className="flex items-center gap-1.5 mr-1">
          <Users className="h-3.5 w-3.5 text-[var(--fg-muted)]" strokeWidth={1.5} />
          <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold">
            Demand
          </span>
        </div>
        {(
          [
            { label: 'All', value: 'all' },
            { label: 'High', value: 'high' },
            { label: 'Medium', value: 'medium' },
            { label: 'Low', value: 'low' },
          ] as const
        ).map((d) => (
          <button
            key={d.value}
            onClick={() => setFilterDemand(d.value)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer ${
              filterDemand === d.value
                ? 'bg-[#8B7355]/10 text-[#8B7355] border border-[#8B7355]/30'
                : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] border border-[var(--border)] hover:text-[var(--fg-secondary)]'
            }`}
          >
            {d.label}
          </button>
        ))}

        <span className="ml-auto text-[11px] text-[var(--fg-muted)] px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)]">
          {sortedAreas.length} areas
        </span>
      </div>

      {/* ===== AREA CARDS GRID — 32px from header via parent space-y-8 ===== */}
      {loadError && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-[13px] text-red-700 dark:text-red-300">
          Failed to load areas: {loadError}. Check that the backend is running on {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}.
        </div>
      )}
      {isLoading ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] py-16 text-center">
          <p className="text-[var(--fg-muted)] font-medium">Loading areas…</p>
        </div>
      ) : sortedAreas.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {sortedAreas.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              isSelected={selectedAreaIds.includes(area.id)}
              onToggle={() => toggleArea(area.id, area.name)}
            />
          ))}
        </motion.div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] py-16 text-center">
          <Search className="h-8 w-8 text-[var(--fg-muted)] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-[var(--fg-muted)] font-medium">No areas match your filters</p>
          <p className="text-[12px] text-[var(--fg-muted)] mt-1">
            Try adjusting the demand filter
          </p>
          <button
            onClick={() => setFilterDemand('all')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-medium bg-[var(--bg-secondary)] text-[var(--fg-secondary)] border border-[var(--border)] hover:border-[#8B7355] transition-colors cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ===== BOTTOM STICKY BAR ===== */}
      <motion.div
        variants={stickyBarVariants}
        initial="hidden"
        animate="visible"
        className="sticky bottom-4 z-50"
      >
        <div className="area-bottom-bar">
          <div className="flex items-center justify-between gap-4 px-5 py-3">

            {/* Left: selection status */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[var(--fg)] leading-tight">
                  {selectedAreaIds.length} of 3 areas selected
                </p>
                {selectedAreaIds.length === 0 && (
                  <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                    Select up to 3 areas to continue
                  </p>
                )}
                {selectedAreaIds.length >= 2 && (
                  <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                    Ready to compare or view properties
                  </p>
                )}
              </div>

              {selectedAreas.length > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 min-w-0 overflow-hidden">
                  <div className="h-4 w-px bg-[var(--border)] shrink-0" />
                  {selectedAreas.map((area) => (
                    <span key={area.id} className="area-bottom-pill">
                      {area.flag} {area.name}
                      <button
                        type="button"
                        onClick={() => toggleArea(area.id)}
                        className="area-bottom-pill-close"
                        aria-label={`Remove ${area.name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 shrink-0">
              {selectedAreaIds.length === 0 && (
                <button
                  onClick={handleAutoSelect}
                  className="area-bottom-secondary hidden sm:inline-flex"
                >
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Auto-select top 3
                </button>
              )}

              {selectedAreaIds.length > 0 && (
                <button onClick={clearAreas} className="area-bottom-clear">
                  Clear
                </button>
              )}

              {/* Compare Areas — visible when 2+ selected */}
              <button
                onClick={() => setShowCompareModal(true)}
                disabled={selectedAreaIds.length < 2}
                className="area-bottom-compare"
              >
                <Scale className="h-4 w-4" />
                <span className="hidden sm:inline">Compare Areas</span>
              </button>

              <button
                onClick={handleContinue}
                disabled={selectedAreaIds.length === 0}
                className="area-bottom-primary"
              >
                View Properties
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== COMPARE AREAS MODAL ===== */}
      <AnimatePresence>
        {showCompareModal && selectedAreas.length >= 2 && (
          <AreaCompareModal
            areas={selectedAreas}
            onClose={() => setShowCompareModal(false)}
            onContinue={() => {
              setShowCompareModal(false);
              handleContinue();
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
