'use client';

/**
 * Portfolio Simulator — step-based "what-if" modelling.
 *
 * Flow: pick a strategy (or go Custom) → tune parameters grouped by
 * Investment / Growth / Risk → read outcome cards + projection chart →
 * take action (Apply Scenario / Save Simulation).
 */

import { useMemo, useState, type CSSProperties } from 'react';
import {
  SlidersHorizontal, TrendingUp, TrendingDown, DollarSign,
  BarChart3, RefreshCw, Building2, AlertTriangle, Sparkles,
  Zap, Shield, Target,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from 'recharts';

/* ══════════════════════════════════════════
   Simulation engine
   ══════════════════════════════════════════ */

interface SimParams {
  initialInvestment: number;
  monthlyContribution: number;
  appreciationRate: number;
  rentalYield: number;
  holdingPeriod: number;
  vacancyRate: number;
  maintenancePct: number;
  leverageRatio: number;
}

const DEFAULT_PARAMS: SimParams = {
  initialInvestment: 500_000,
  monthlyContribution: 2_000,
  appreciationRate: 8,
  rentalYield: 6.5,
  holdingPeriod: 10,
  vacancyRate: 5,
  maintenancePct: 1.5,
  leverageRatio: 70,
};

type ScenarioKey = 'Conservative' | 'Moderate' | 'Aggressive' | 'Custom';

const SCENARIOS = [
  { label: 'Conservative' as ScenarioKey, icon: Shield, color: '#A89478', preset: { appreciationRate: 4, rentalYield: 5, vacancyRate: 8, leverageRatio: 50 } },
  { label: 'Moderate' as ScenarioKey, icon: BarChart3, color: '#8B7355', preset: { appreciationRate: 8, rentalYield: 6.5, vacancyRate: 5, leverageRatio: 70 } },
  { label: 'Aggressive' as ScenarioKey, icon: Zap, color: '#F59E0B', preset: { appreciationRate: 14, rentalYield: 8, vacancyRate: 3, leverageRatio: 80 } },
  { label: 'Custom' as ScenarioKey, icon: SlidersHorizontal, color: '#6F5C46', preset: null },
];

function simulate(params: SimParams) {
  const points: Array<{
    year: string; propertyValue: number; totalInvested: number;
    equity: number; cashflow: number;
  }> = [];

  const equity = params.initialInvestment * (1 - params.leverageRatio / 100);
  const annualRental = params.initialInvestment * (params.rentalYield / 100) * (1 - params.vacancyRate / 100);
  const annualMaintenance = params.initialInvestment * (params.maintenancePct / 100);
  const netRental = annualRental - annualMaintenance;
  const loanAmount = params.initialInvestment * (params.leverageRatio / 100);
  const interestRate = 0.055;
  const annualDebt = loanAmount * interestRate;

  let cumulativeCashflow = 0;

  for (let year = 0; year <= params.holdingPeriod; year++) {
    const added = year * params.monthlyContribution * 12;
    const totalInvested = equity + added;
    const propertyValue = params.initialInvestment * Math.pow(1 + params.appreciationRate / 100, year) + added;
    const yearCashflow = year === 0 ? 0 : netRental - annualDebt + params.monthlyContribution * 12;
    cumulativeCashflow += yearCashflow;

    points.push({
      year: `Yr ${year}`,
      propertyValue: Math.round(propertyValue),
      totalInvested: Math.round(totalInvested),
      equity: Math.round(propertyValue - loanAmount + cumulativeCashflow),
      cashflow: Math.round(cumulativeCashflow),
    });
  }

  const finalValue = points[points.length - 1];
  const totalROI = ((finalValue.equity - equity) / Math.max(equity, 1)) * 100;
  const annualizedROI = Math.pow(1 + totalROI / 100, 1 / params.holdingPeriod) * 100 - 100;
  const netProfit = finalValue.equity - equity;
  const monthlyCashflow = netRental / 12 - annualDebt / 12;

  return {
    points,
    totalROI: Math.round(totalROI * 10) / 10,
    annualizedROI: Math.round(annualizedROI * 10) / 10,
    netProfit: Math.round(netProfit),
    finalEquity: finalValue.equity,
    finalPropertyValue: finalValue.propertyValue,
    monthlyCashflow: Math.round(monthlyCashflow),
  };
}

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `₹${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n.toLocaleString()}`;
}

function sliderFill(value: number, min: number, max: number) {
  return `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)).toFixed(1)}%`;
}



export default function PortfolioSimulatorPage() {
  const [params, setParams] = useState<SimParams>(DEFAULT_PARAMS);
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>('Moderate');
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);

  const result = useMemo(() => simulate(params), [params]);

  const updateParam = (key: keyof SimParams, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    setActiveScenario('Custom');
    setApplied(false);
    setSaved(false);
  };

  const applyScenario = (key: ScenarioKey, preset: Partial<SimParams> | null) => {
    setActiveScenario(key);
    if (preset) setParams((prev) => ({ ...prev, ...preset }));
    setApplied(false);
    setSaved(false);
  };

  const resetAll = () => {
    setParams(DEFAULT_PARAMS);
    setActiveScenario('Moderate');
    setApplied(false);
    setSaved(false);
  };

  const SLIDERS = [
    { key: 'initialInvestment' as const, label: 'Initial Investment', min: 100000, max: 5000000, step: 50000, fmt: fmt },
    { key: 'monthlyContribution' as const, label: 'Monthly Contribution', min: 0, max: 10000, step: 250, fmt: fmt },
    { key: 'appreciationRate' as const, label: 'Annual Appreciation', min: 0, max: 25, step: 0.5, fmt: (v: number) => `${v}%` },
    { key: 'rentalYield' as const, label: 'Rental Yield', min: 0, max: 15, step: 0.5, fmt: (v: number) => `${v}%` },
    { key: 'holdingPeriod' as const, label: 'Holding Period', min: 1, max: 30, step: 1, fmt: (v: number) => `${v} yrs` },
    { key: 'vacancyRate' as const, label: 'Vacancy Rate', min: 0, max: 20, step: 1, fmt: (v: number) => `${v}%` },
    { key: 'maintenancePct' as const, label: 'Maintenance Cost', min: 0, max: 5, step: 0.25, fmt: (v: number) => `${v}%` },
    { key: 'leverageRatio' as const, label: 'Leverage (LTV)', min: 0, max: 90, step: 5, fmt: (v: number) => `${v}%` },
  ];

  const KPIS = [
    {
      label: 'Final Equity', value: fmt(result.finalEquity),
      delta: `${result.totalROI > 0 ? '+' : ''}${result.totalROI}%`,
      positive: result.totalROI > 0, icon: DollarSign, color: '#8B7355',
    },
    {
      label: 'Net Profit', value: fmt(result.netProfit),
      delta: `${result.netProfit > 0 ? '+' : ''}${fmt(result.netProfit)}`,
      positive: result.netProfit > 0, icon: TrendingUp, color: '#6F5C46',
    },
    {
      label: 'Annualized ROI', value: `${result.annualizedROI}%`,
      delta: result.annualizedROI > 8 ? 'Above avg' : 'Below avg',
      positive: result.annualizedROI > 8, icon: Target, color: '#A89478',
    },
    {
      label: 'Monthly Cashflow', value: fmt(result.monthlyCashflow),
      delta: result.monthlyCashflow > 0 ? 'Positive' : 'Negative',
      positive: result.monthlyCashflow > 0, icon: Building2, color: '#C4B19A',
    },
  ];

  return (
    <div className="space-y-6 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full">

      {/* ── Header ── */}
      <div className="ai-deal-hero">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#6F5C46] flex items-center justify-center shadow-lg">
              <SlidersHorizontal className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--fg)]">Portfolio Simulator</h1>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">Model &quot;What If&quot; scenarios for your investments</p>
            </div>
          </div>

          {/* Scenario Chips */}
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((s) => {
              const Icon = s.icon;
              const isActive = activeScenario === s.label;
              return (
                <button
                  key={s.label}
                  onClick={() => applyScenario(s.label, s.preset)}
                  className="sim-scenario-chip"
                  style={isActive ? { background: `linear-gradient(135deg, ${s.color}cc, ${s.color})`, borderColor: 'transparent', color: '#fff', boxShadow: `0 4px 14px ${s.color}44` } : {}}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Sliders ── */}
        <div className="sim-panel flex flex-col gap-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[rgba(139,115,85,0.12)] flex items-center justify-center">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#8B7355]" />
              </div>
              <h2 className="text-sm font-bold text-[var(--fg)]">Parameters</h2>
            </div>
            <button
              onClick={() => { setParams(DEFAULT_PARAMS); setActiveScenario('Moderate'); }}
              className="flex items-center gap-1.5 text-[11px] text-[#8B7355] font-semibold hover:opacity-75 transition-opacity"
            >
              <RefreshCw className="h-3 w-3" /> Reset
            </button>
          </div>

          {SLIDERS.map((s) => (
            <div key={s.key} className="sim-slider-group">
              <div className="sim-slider-label">
                <span>{s.label}</span>
                <span className="sim-slider-value">{s.fmt(params[s.key])}</span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={params[s.key]}
                onChange={(e) => updateParam(s.key, parseFloat(e.target.value))}
                className="sim-slider"
                style={{ '--sim-fill': sliderFill(params[s.key], s.min, s.max) } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        {/* ── Right: Results ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {KPIS.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="sim-result-card">
                  <div className="flex items-center justify-center mb-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                      <Icon className="h-4 w-4" style={{ color: kpi.color }} />
                    </div>
                  </div>
                  <div className="sim-result-value">{kpi.value}</div>
                  <div className="sim-result-label">{kpi.label}</div>
                  <div className={`sim-result-delta ${kpi.positive ? 'positive' : 'negative'}`}>
                    {kpi.positive
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {kpi.delta}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart */}
          <div className="sim-panel">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-[var(--fg)]">Projected Growth</h3>
              <div className="flex items-center gap-4 text-[11px] text-[var(--fg-muted)]">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#8B7355' }} />
                  Property Value
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#6F5C46' }} />
                  Equity
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5 rounded-sm" style={{ background: '#C4B19A', borderTop: '2px dashed #C4B19A', height: 0 }} />
                  Total Invested
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={result.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="simBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B7355" stopOpacity={0.22} />
                    <stop offset="100%" stopColor="#8B7355" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="simGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6F5C46" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#6F5C46" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,115,85,0.07)" />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--fg-muted)' } as any} axisLine={false} tickLine={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <YAxis tick={{ fontSize: 11, fill: 'var(--fg-muted)' } as any} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
                  labelStyle={{ color: 'var(--fg)', fontWeight: 700, marginBottom: 6 }}
                  itemStyle={{ color: 'var(--fg-secondary)', fontWeight: 500 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="propertyValue" stroke="#8B7355" fill="url(#simBlue)" strokeWidth={2.5} name="Property Value" dot={false} />
                <Area type="monotone" dataKey="equity" stroke="#6F5C46" fill="url(#simGreen)" strokeWidth={2.5} name="Equity" dot={false} />
                <Area type="monotone" dataKey="totalInvested" stroke="#C4B19A" fill="none" strokeWidth={1.5} strokeDasharray="5 4" name="Total Invested" dot={false} />
                <ReferenceLine
                  y={params.initialInvestment}
                  stroke="rgba(239,68,68,0.35)"
                  strokeDasharray="4 3"
                  label={{ value: 'Break-even', fill: 'rgba(239,68,68,0.6)', fontSize: 10, position: 'insideBottomRight' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Insight */}
          <div className="ai-deal-why flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-[rgba(139,115,85,0.15)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="h-4 w-4 text-[#8B7355]" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--fg)] mb-1.5 flex items-center gap-1.5">
                AI Insight
                <span className="text-[10px] font-semibold text-[#8B7355] bg-[rgba(139,115,85,0.1)] px-2 py-0.5 rounded-full">Live</span>
              </p>
              <p className="text-[13px] text-[var(--fg-secondary)] leading-relaxed">
                {result.annualizedROI > 12
                  ? `With ${params.appreciationRate}% appreciation and ${params.rentalYield}% yield, this scenario generates exceptional returns. Consider diversifying across 2–3 properties to reduce concentration risk.`
                  : result.annualizedROI > 6
                  ? `This is a balanced scenario with solid ${result.annualizedROI}% annualized returns. Your monthly cashflow of ${fmt(result.monthlyCashflow)} provides steady income while equity builds.`
                  : `Returns of ${result.annualizedROI}% are below the market average. Consider increasing leverage or targeting higher-yield properties to improve performance.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

