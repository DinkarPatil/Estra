'use client';
import { useState } from 'react';
import {
  ClipboardCheck, MapPin, DollarSign, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, Building2, Users, BarChart3, Zap, Shield,
  ChevronRight, ArrowUpRight, FileText, Percent, Calendar,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   MOCK DATA — Feasibility Review
   ═══════════════════════════════════════════ */

const PROJECT = {
  name: 'Marina Heights Residences',
  location: 'Dubai Marina, Dubai, UAE',
  type: 'Mixed-Use Residential + Retail',
  units: 248,
  floors: 42,
  plotArea: '12,500 sqm',
  builtUpArea: '68,400 sqm',
  startDate: 'Q3 2026',
  completionDate: 'Q1 2029',
  status: 'Under Review',
};

const FINANCIAL_SUMMARY = {
  totalInvestment: '$142M',
  landCost: '$38M',
  constructionCost: '$76M',
  softCosts: '$18M',
  contingency: '$10M',
  projectedRevenue: '$198M',
  netProfit: '$56M',
  irr: '22.4%',
  roi: '39.4%',
  paybackPeriod: '3.2 years',
  breakEvenOccupancy: '64%',
};

const RISK_FACTORS = [
  { label: 'Market Risk', level: 'Low', score: 85, desc: 'Strong demand in Dubai Marina corridor with 12% YoY growth' },
  { label: 'Regulatory Risk', level: 'Low', score: 90, desc: 'All RERA approvals obtained, DLD compliance confirmed' },
  { label: 'Construction Risk', level: 'Medium', score: 68, desc: 'Steel price volatility and labor market constraints' },
  { label: 'Financial Risk', level: 'Low', score: 82, desc: 'Conservative LTV at 60%, strong pre-sales pipeline' },
  { label: 'Environmental Risk', level: 'Low', score: 88, desc: 'LEED Gold target, EIA approved, no contamination' },
  { label: 'Competition Risk', level: 'Medium', score: 62, desc: '3 competing projects in 2km radius, differentiation needed' },
];

const MILESTONES = [
  { phase: 'Land Acquisition', status: 'completed', date: 'Jan 2026' },
  { phase: 'Design & Permits', status: 'completed', date: 'Apr 2026' },
  { phase: 'Feasibility Review', status: 'in-progress', date: 'May 2026' },
  { phase: 'Pre-Sales Launch', status: 'pending', date: 'Jul 2026' },
  { phase: 'Construction Start', status: 'pending', date: 'Sep 2026' },
  { phase: 'Structure Complete', status: 'pending', date: 'Jun 2028' },
  { phase: 'Handover', status: 'pending', date: 'Jan 2029' },
];

const DEMAND_METRICS = [
  { label: 'Absorption Rate', value: '8.2%', trend: '+1.4%', icon: TrendingUp },
  { label: 'Avg. Market Price', value: '$820/sqft', trend: '+6.3%', icon: DollarSign },
  { label: 'Pre-Registration', value: '312', trend: '', icon: Users },
  { label: 'Competitor Units', value: '1,240', trend: '-3.1%', icon: Building2 },
];

const COST_BREAKDOWN = [
  { category: 'Land Acquisition', amount: '$38M', pct: 26.8 },
  { category: 'Construction', amount: '$76M', pct: 53.5 },
  { category: 'Design & Consultants', amount: '$8.4M', pct: 5.9 },
  { category: 'Marketing & Sales', amount: '$5.6M', pct: 3.9 },
  { category: 'Financing Costs', amount: '$4M', pct: 2.8 },
  { category: 'Contingency', amount: '$10M', pct: 7.0 },
];

const AI_RECOMMENDATIONS = [
  'Consider phased launch strategy — Phase 1 (120 units) to test market appetite before committing to Phase 2.',
  'Current unit mix skews toward 2BR (55%). Market data suggests increasing 1BR allocation to 30% for better absorption.',
  'Pre-sales target of 40% before construction is achievable given the 312 pre-registrations and 8.2% absorption rate.',
  'Recommend hedging steel costs through forward contracts to mitigate the identified construction risk.',
];

/* ═══════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════ */

export default function FeasibilityReviewPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'risk' | 'timeline'>('overview');
  const overallScore = 78;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(24,104,150,0.08)] border border-[rgba(24,104,150,0.15)] text-[10px] font-semibold text-[#8B7355] uppercase tracking-wider">
              <ClipboardCheck className="h-3 w-3" /> Feasibility Review
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
              <Clock className="h-3 w-3" /> {PROJECT.status}
            </span>
          </div>
          <h1 className="type-page-title mt-2">{PROJECT.name}</h1>
          <p className="flex items-center gap-1.5 text-sm text-[var(--fg-muted)] mt-1">
            <MapPin className="h-3.5 w-3.5" /> {PROJECT.location}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <FileText className="h-4 w-4" /> Export PDF
          </button>
          <button className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#8B7355] text-white text-sm font-semibold hover:bg-[#6F5C46] transition-colors shadow-sm">
            <CheckCircle2 className="h-4 w-4" /> Approve
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] w-fit">
        {(['overview', 'financial', 'risk', 'timeline'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-[var(--bg-elevated)] text-[var(--fg)] shadow-sm border border-[var(--border)]'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overall Score + Project Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Feasibility Score Card */}
        <div className="premium-card p-6 flex flex-col items-center justify-center text-center">
          <p className="type-label mb-3">Feasibility Score</p>
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                stroke="#8B7355" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${overallScore * 3.267} 326.7`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-[var(--fg)]">{overallScore}</span>
              <span className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wider">/100</span>
            </div>
          </div>
          <span className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#22C55E]/10 text-[11px] font-semibold text-[#22C55E]">
            <CheckCircle2 className="h-3 w-3" /> Viable
          </span>
        </div>

        {/* Project Details */}
        <div className="lg:col-span-3 premium-card p-6">
          <h3 className="type-section mb-4">Project Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-6">
            {[
              { label: 'Project Type', value: PROJECT.type },
              { label: 'Total Units', value: PROJECT.units.toString() },
              { label: 'Floors', value: PROJECT.floors.toString() },
              { label: 'Plot Area', value: PROJECT.plotArea },
              { label: 'Built-Up Area', value: PROJECT.builtUpArea },
              { label: 'Start Date', value: PROJECT.startDate },
              { label: 'Completion', value: PROJECT.completionDate },
              { label: 'Duration', value: '30 months' },
            ].map((item) => (
              <div key={item.label}>
                <p className="type-label mb-1">{item.label}</p>
                <p className="text-[14px] font-semibold text-[var(--fg)]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Investment', value: FINANCIAL_SUMMARY.totalInvestment, icon: DollarSign },
          { label: 'Projected Revenue', value: FINANCIAL_SUMMARY.projectedRevenue, icon: TrendingUp },
          { label: 'Net Profit', value: FINANCIAL_SUMMARY.netProfit, icon: BarChart3 },
          { label: 'IRR', value: FINANCIAL_SUMMARY.irr, icon: Percent },
          { label: 'Payback Period', value: FINANCIAL_SUMMARY.paybackPeriod, icon: Calendar },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="premium-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(24,104,150,0.08)]">
                  <Icon className="h-3.5 w-3.5 text-[#8B7355]" />
                </div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--fg-muted)]">{kpi.label}</p>
              </div>
              <p className="text-xl font-bold text-[var(--fg)]">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cost Breakdown */}
        <div className="lg:col-span-2 premium-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="type-section">Cost Breakdown</h3>
            <span className="text-[12px] text-[var(--fg-muted)]">Total: {FINANCIAL_SUMMARY.totalInvestment}</span>
          </div>
          <div className="space-y-3">
            {COST_BREAKDOWN.map((item) => (
              <div key={item.category} className="flex items-center gap-4">
                <span className="text-[13px] text-[var(--fg-secondary)] w-40 shrink-0">{item.category}</span>
                <div className="flex-1 h-7 rounded-lg bg-[var(--bg-secondary)] overflow-hidden relative">
                  <div
                    className="h-full rounded-lg bg-gradient-to-r from-[#8B7355] to-[#8B7355] transition-all duration-500"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="text-[13px] font-semibold text-[var(--fg)] w-16 text-right">{item.amount}</span>
                <span className="text-[11px] text-[var(--fg-muted)] w-10 text-right">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Demand Metrics */}
        <div className="premium-card p-6">
          <h3 className="type-section mb-5">Market Demand</h3>
          <div className="space-y-4">
            {DEMAND_METRICS.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(24,104,150,0.08)] shrink-0">
                    <Icon className="h-4 w-4 text-[#8B7355]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[var(--fg-muted)] uppercase tracking-wider">{m.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[15px] font-bold text-[var(--fg)]">{m.value}</span>
                      {m.trend && (
                        <span className={`text-[11px] font-semibold ${m.trend.startsWith('+') ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                          {m.trend}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="premium-card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="h-4 w-4 text-[#8B7355]" />
          <h3 className="type-section">Risk Assessment</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {RISK_FACTORS.map((risk) => (
            <div
              key={risk.label}
              className="p-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] hover:border-[rgba(24,104,150,0.15)] transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] font-semibold text-[var(--fg)]">{risk.label}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  risk.level === 'Low' ? 'bg-[#22C55E]/10 text-[#22C55E]' :
                  risk.level === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-[#EF4444]/10 text-[#EF4444]'
                }`}>
                  {risk.level}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    risk.score >= 80 ? 'bg-[#22C55E]' : risk.score >= 60 ? 'bg-amber-500' : 'bg-[#EF4444]'
                  }`}
                  style={{ width: `${risk.score}%` }}
                />
              </div>
              <p className="text-[12px] text-[var(--fg-muted)] leading-relaxed">{risk.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline + AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Timeline */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock className="h-4 w-4 text-[#8B7355]" />
            <h3 className="type-section">Project Timeline</h3>
          </div>
          <div className="space-y-0">
            {MILESTONES.map((m, i) => (
              <div key={m.phase} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
                    m.status === 'completed' ? 'bg-[#22C55E] border-[#22C55E]' :
                    m.status === 'in-progress' ? 'bg-[#8B7355] border-[#8B7355] ring-4 ring-[rgba(24,104,150,0.15)]' :
                    'bg-transparent border-[var(--border)]'
                  }`} />
                  {i < MILESTONES.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-[32px] ${
                      m.status === 'completed' ? 'bg-[#22C55E]/30' : 'bg-[var(--border)]'
                    }`} />
                  )}
                </div>
                <div className="pb-6 -mt-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[13px] font-semibold ${
                      m.status === 'completed' ? 'text-[var(--fg)]' :
                      m.status === 'in-progress' ? 'text-[#8B7355]' :
                      'text-[var(--fg-muted)]'
                    }`}>
                      {m.phase}
                    </span>
                    {m.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />}
                    {m.status === 'in-progress' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[rgba(24,104,150,0.10)] text-[#8B7355]">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[var(--fg-muted)]">{m.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="h-4 w-4 text-[#8B7355]" />
            <h3 className="type-section">AI Recommendations</h3>
            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-[rgba(24,104,150,0.08)] text-[#8B7355]">
              AI Powered
            </span>
          </div>
          <div className="space-y-3">
            {AI_RECOMMENDATIONS.map((rec, i) => (
              <div
                key={i}
                className="flex gap-3 p-3.5 rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] hover:border-[rgba(24,104,150,0.12)] transition-colors"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(24,104,150,0.08)] text-[10px] font-bold text-[#8B7355] shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-[13px] text-[var(--fg-secondary)] leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>

          <button className="flex items-center gap-2 mt-4 text-[13px] font-medium text-[#8B7355] hover:text-[#8B7355] transition-colors">
            Generate detailed report <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
