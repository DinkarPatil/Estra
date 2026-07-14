'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Gavel, Coins, TrendingUp, TrendingDown, Users, Phone,
  Plus, FileText, Download, Sparkles, Brain, Activity, Clock,
  Building2, MapPin, ArrowUpRight, ArrowRight, Flame, Eye, Calendar,
  ChevronDown, ChevronRight, Search, Bookmark, Zap, BarChart3,
  MessageSquare, Star, CheckCircle2, AlertCircle, CircleDot,
} from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid,
} from 'recharts';
import { PageContainer } from '@/components/layout/page-container';
import { brokerLeads } from '@/mock-data/market-data';
import { formatCurrency } from '@/lib/formatters';
import { useAuth } from '@/contexts/auth-context';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';
import type { Lead as PipelineLead, IntentLevel } from '@/types/lead';

/* ═══════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════ */

const COMMISSION_DATA = [
  { month: 'Jul', amount: 32000, target: 35000 },
  { month: 'Aug', amount: 28000, target: 35000 },
  { month: 'Sep', amount: 41000, target: 38000 },
  { month: 'Oct', amount: 38000, target: 38000 },
  { month: 'Nov', amount: 52000, target: 42000 },
  { month: 'Dec', amount: 45200, target: 42000 },
];

const FUNNEL_DATA = [
  { stage: 'Leads', value: 247, color: '#8B7355' },
  { stage: 'Qualified', value: 142, color: '#8B7355' },
  { stage: 'Viewing', value: 68, color: '#6F5C46' },
  { stage: 'Negotiation', value: 31, color: '#F59E0B' },
  { stage: 'Closed', value: 18, color: '#22C55E' },
];

const AI_INSIGHTS = [
  { text: 'Emma Watson has 82% close probability', type: 'hot' as const, icon: Flame },
  { text: 'Dubai villa demand up 14% this quarter', type: 'trend' as const, icon: TrendingUp },
  { text: '3 leads need follow-up today', type: 'action' as const, icon: AlertCircle },
  { text: 'Palm Villa listing is trending now', type: 'trending' as const, icon: Zap },
  { text: 'Raj Patel viewed 4 properties this week', type: 'activity' as const, icon: Eye },
];

const ACTIVITY_FEED = [
  { user: 'Michael Turner', action: 'viewed listing', target: 'Marina Bay Penthouse', time: '5m ago', icon: Eye },
  { user: 'Raj Patel', action: 'booked a property tour', target: 'Downtown Dubai Tower', time: '23m ago', icon: Calendar },
  { user: 'Emma Watson', action: 'requested callback', target: '', time: '1h ago', icon: Phone },
  { user: 'Ahmed Al-Rashid', action: 'submitted offer on', target: 'Palm Jumeirah Villa', time: '2h ago', icon: Gavel },
  { user: 'Sophie Chen', action: 'saved listing', target: 'Sentosa Cove Residence', time: '3h ago', icon: Bookmark },
];

const KPI_CARDS = [
  { label: 'Active Leads', value: 24, change: +15, icon: Target, color: '#8B7355', sparkData: [14, 16, 18, 20, 22, 24] },
  { label: 'Open Deals', value: 8, change: +3, icon: Gavel, color: '#8B7355', sparkData: [4, 5, 5, 6, 7, 8] },
  { label: 'Monthly Commission', value: '$45.2K', change: +22, icon: Coins, color: '#22C55E', sparkData: [28, 32, 35, 38, 41, 45] },
  { label: 'Conversion Rate', value: '34%', change: +5.2, icon: TrendingUp, color: '#6F5C46', sparkData: [22, 25, 28, 30, 32, 34] },
  { label: 'Avg Deal Size', value: '$1.8M', change: +8.4, icon: Building2, color: '#F59E0B', sparkData: [1.2, 1.3, 1.5, 1.6, 1.7, 1.8] },
  { label: 'Response Time', value: '12m', change: -18, icon: Clock, color: '#EF4444', sparkData: [22, 20, 18, 16, 14, 12] },
];

const QUICK_ACTIONS = [
  { label: 'Add Lead', icon: Plus, route: '/broker/leads', accent: '#8B7355' },
  { label: 'Add Listing', icon: Building2, route: '/broker/listings', accent: '#8B7355' },
  { label: 'Schedule Call', icon: Phone, route: '/broker/leads', accent: '#6F5C46' },
  { label: 'Negotiations', icon: Gavel, route: '/broker/negotiations', accent: '#22C55E' },
  { label: 'View Listings', icon: Download, route: '/broker/listings', accent: '#F59E0B' },
];

/* ═══════════════════════════════════════════════════
   PIPELINE LEAD → DASHBOARD LEAD MAPPER
   ═══════════════════════════════════════════════════ */

function intentToStatus(level: IntentLevel): 'hot' | 'warm' | 'cold' {
  return level === 'high' ? 'hot' : level === 'medium' ? 'warm' : 'cold';
}

function mapPipelineLead(pl: PipelineLead): typeof brokerLeads[number] {
  return {
    id: pl.id,
    name: pl.investorName,
    email: pl.investorEmail ?? '',
    phone: pl.investorPhone ?? '',
    location: pl.propertyLocation,
    interest: pl.propertyName,
    budget: (pl.investorBudget ?? pl.propertyPrice ?? { amount: 0, currency: 'AED' }) as unknown as typeof brokerLeads[number]['budget'],
    score: pl.aiScore,
    status: intentToStatus(pl.intentLevel),
    createdAt: pl.createdAt,
  } as unknown as typeof brokerLeads[number];
}

/* ═══════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ═══════════════════════════════════════════════════
   MINI SPARKLINE
   ═══════════════════════════════════════════════════ */

function KPISparkline({ data, color }: { data: number[]; color: string }) {
  const id = `kpi-${color.replace('#', '')}`;
  return (
    <div className="bkr-kpi-spark">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.map((v) => ({ v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════ */

function AnimatedValue({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => { setDisplay(value); }, [value]);
  return <span className="tabular-nums">{display}</span>;
}

/* ═══════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: string }) {
  const config = {
    hot: { bg: 'rgba(239,68,68,0.08)', color: '#EF4444', border: 'rgba(239,68,68,0.15)' },
    warm: { bg: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: 'rgba(245,158,11,0.15)' },
    cold: { bg: 'rgba(139,115,85,0.08)', color: '#8B7355', border: 'rgba(139,115,85,0.15)' },
  }[status] || { bg: 'rgba(154,139,126,0.08)', color: '#9A8B7E', border: 'rgba(154,139,126,0.15)' };

  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: config.color }} />
      {status}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   AI SCORE PILL
   ═══════════════════════════════════════════════════ */

function AIScorePill({ score }: { score: number }) {
  const color = score >= 85 ? '#22C55E' : score >= 70 ? '#F59E0B' : '#9A8B7E';
  const bg = score >= 85 ? 'rgba(34,197,94,0.08)' : score >= 70 ? 'rgba(245,158,11,0.08)' : 'rgba(154,139,126,0.08)';
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ background: bg, color }}
    >
      <Brain className="h-3 w-3" />
      {score}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good Morning';
  if (h >= 12 && h < 17) return 'Good Afternoon';
  if (h >= 17 && h < 21) return 'Good Evening';
  return 'Good Evening';
}

export default function BrokerDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { leads: pipelineLeads, isHydrated } = useLeadPipeline();
  const [chartPeriod, setChartPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadSort, setLeadSort] = useState<'score' | 'name' | 'budget'>('score');
  const [leadFilter, setLeadFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');

  const allLeads = useMemo(() => {
    if (!isHydrated) return brokerLeads;
    const investorCreated = pipelineLeads
      .filter((pl) => pl.source !== 'legacy-mock')
      .map(mapPipelineLead);
    if (investorCreated.length === 0) return brokerLeads;
    const createdIds = new Set(investorCreated.map((l) => l.id));
    return [...investorCreated, ...brokerLeads.filter((l) => !createdIds.has(l.id))];
  }, [pipelineLeads, isHydrated]);

  const filteredLeads = useMemo(() => {
    let leads = [...allLeads];
    if (leadFilter !== 'all') leads = leads.filter((l) => l.status === leadFilter);
    if (leadSearch) leads = leads.filter((l) => l.name.toLowerCase().includes(leadSearch.toLowerCase()));
    switch (leadSort) {
      case 'score': leads.sort((a, b) => b.score - a.score); break;
      case 'name': leads.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'budget': leads.sort((a, b) => b.budget.amount - a.budget.amount); break;
    }
    return leads;
  }, [allLeads, leadFilter, leadSearch, leadSort]);

  return (
    <PageContainer className="bkr-dashboard">
      {/* ═══════════════════════════════════
          1. WELCOME HERO
          ═══════════════════════════════════ */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.5 }}
        className="bkr-hero"
      >
        <div className="bkr-hero-inner">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] text-[var(--fg-muted)]">{getGreeting()}</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[var(--fg)] tracking-tight leading-tight">
              Welcome back, {user?.name ?? 'there'}
            </h1>
            <p className="text-sm text-[var(--fg-secondary)] mt-1.5 max-w-md">
              Your brokerage performance is strong today. Here&apos;s your overview.
            </p>

            {/* Insight Chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { label: '3 Hot Leads', color: '#EF4444' },
                { label: '2 Deals Closing', color: '#8B7355' },
                { label: 'Revenue +18%', color: '#22C55E' },
                { label: '5 Follow-ups', color: '#F59E0B' },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="bkr-hero-chip"
                  style={{ '--chip-color': chip.color } as React.CSSProperties}
                >
                  <CircleDot className="h-3 w-3" style={{ color: chip.color }} />
                  {chip.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: abstract floating metric */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            <div className="bkr-hero-metric">
              <div className="bkr-hero-metric-ring">
                <span className="text-2xl font-bold text-[var(--fg)]">87</span>
                <span className="text-[9px] text-[var(--fg-muted)] uppercase tracking-wider font-semibold">Score</span>
              </div>
              <p className="text-[10px] text-[var(--fg-muted)] mt-2 text-center font-medium">Performance</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          2. KPI STATS GRID
          ═══════════════════════════════════ */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {KPI_CARDS.map((kpi, i) => {
          const Icon = kpi.icon;
          const isNegativeBetter = kpi.label === 'Response Time';
          const isPositive = isNegativeBetter ? kpi.change < 0 : kpi.change > 0;
          return (
            <motion.div
              key={kpi.label}
              variants={fadeUp}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="bkr-kpi-card group"
            >
              <div className="flex items-start justify-between">
                <div
                  className="bkr-kpi-icon"
                  style={{ '--kpi-color': kpi.color } as React.CSSProperties}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <KPISparkline data={kpi.sparkData} color={kpi.color} />
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold text-[var(--fg)] tracking-tight">
                  <AnimatedValue value={String(kpi.value)} />
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[var(--fg-muted)] font-semibold uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  <span className={`bkr-kpi-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <ArrowUpRight className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {Math.abs(kpi.change)}%
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══════════════════════════════════
          3. QUICK ACTIONS + AI INSIGHTS ROW
          ═══════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Quick Actions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-3 bkr-section-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4 text-[#F59E0B]" />
            <h2 className="text-sm font-semibold text-[var(--fg)]">Quick Actions</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => router.push(action.route)}
                  className="bkr-quick-action"
                  style={{ '--action-color': action.accent } as React.CSSProperties}
                >
                  <Icon className="h-4 w-4" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2 bkr-section-card bkr-ai-panel"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B7355] to-[#6F5C46]">
              <Brain className="h-3.5 w-3.5 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-[var(--fg)]">AI Broker Insights</h2>
            <span className="bkr-ai-live-dot" />
          </div>
          <div className="space-y-2.5 max-h-[200px] overflow-y-auto bkr-ai-scroll">
            {AI_INSIGHTS.map((insight, i) => {
              const Icon = insight.icon;
              return (
                <div key={i} className="bkr-ai-insight-row">
                  <div className={`bkr-ai-insight-icon bkr-ai-insight-${insight.type}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed flex-1">{insight.text}</p>
                  <ChevronRight className="h-3 w-3 text-[var(--fg-muted)] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════
          4. SMART LEADS TABLE
          ═══════════════════════════════════ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={fadeUp}
        transition={{ duration: 0.5 }}
        className="bkr-section-card"
      >
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#8B7355]" />
            <h2 className="text-base font-semibold text-[var(--fg)]">Smart Leads</h2>
            <span className="text-[10px] text-[var(--fg-muted)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full font-medium">
              {allLeads.length} total
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="bkr-table-search">
              <Search className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder="Search leads..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="bkr-table-search-input"
              />
            </div>

            {/* Filter pills */}
            <div className="flex gap-1">
              {(['all', 'hot', 'warm', 'cold'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setLeadFilter(f)}
                  className={`bkr-filter-pill ${leadFilter === f ? 'active' : ''}`}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={leadSort}
              onChange={(e) => setLeadSort(e.target.value as 'score' | 'name' | 'budget')}
              className="bkr-sort-select"
            >
              <option value="score">AI Score</option>
              <option value="name">Name</option>
              <option value="budget">Budget</option>
            </select>
          </div>
        </div>

        {/* Table — Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="bkr-table w-full">
            <thead>
              <tr>
                <th>Client</th>
                <th>Location</th>
                <th>Interest</th>
                <th>Budget</th>
                <th>AI Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="bkr-table-row cursor-pointer"
                  onClick={() => router.push(`/broker/leads/${lead.id}`)}
                >
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="bkr-avatar" style={{ '--avatar-color': lead.score >= 85 ? '#8B7355' : '#8B7355' } as React.CSSProperties}>
                        {lead.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--fg)]">{lead.name}</p>
                        <p className="text-[10px] text-[var(--fg-muted)]">{lead.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="flex items-center gap-1 text-[12px] text-[var(--fg-secondary)]">
                      <MapPin className="h-3 w-3 text-[var(--fg-muted)]" /> {lead.location}
                    </span>
                  </td>
                  <td className="text-[12px] text-[var(--fg-secondary)]">{lead.interest}</td>
                  <td className="text-[12px] font-semibold text-[var(--fg)]">{formatCurrency(lead.budget)}</td>
                  <td><AIScorePill score={lead.score} /></td>
                  <td><StatusBadge status={lead.status} /></td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/broker/leads/${lead.id}`); }}
                        className="bkr-table-action"
                        title="View"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button className="bkr-table-action" title="Call" onClick={(e) => e.stopPropagation()}>
                        <Phone className="h-3.5 w-3.5" />
                      </button>
                      <button className="bkr-table-action" title="Message" onClick={(e) => e.stopPropagation()}>
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table — Mobile Card View */}
        <div className="md:hidden space-y-3">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bkr-lead-card"
              onClick={() => router.push(`/broker/leads/${lead.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bkr-avatar" style={{ '--avatar-color': lead.score >= 85 ? '#8B7355' : '#8B7355' } as React.CSSProperties}>
                    {lead.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--fg)]">{lead.name}</p>
                    <p className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" /> {lead.location}
                    </p>
                  </div>
                </div>
                <AIScorePill score={lead.score} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9px] text-[var(--fg-muted)] uppercase font-semibold">Interest</p>
                  <p className="text-[12px] text-[var(--fg-secondary)] font-medium">{lead.interest}</p>
                </div>
                <div>
                  <p className="text-[9px] text-[var(--fg-muted)] uppercase font-semibold">Budget</p>
                  <p className="text-[12px] text-[var(--fg)] font-semibold">{formatCurrency(lead.budget)}</p>
                </div>
                <div className="flex items-end justify-end">
                  <StatusBadge status={lead.status} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-8 w-8 text-[var(--fg-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--fg-muted)]">No leads match your search</p>
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════
          5. CHARTS ROW
          ═══════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Commission Trend Chart */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="lg:col-span-3 bkr-section-card"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#8B7355]" />
              <h2 className="text-base font-semibold text-[var(--fg)]">Commission Trend</h2>
            </div>
            <div className="flex gap-1">
              {(['monthly', 'quarterly'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`bkr-filter-pill ${chartPeriod === p ? 'active' : ''}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={COMMISSION_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B7355" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#8B7355" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `₹${(v / 1000)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 12,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((v: number) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Commission']) as any}
                />
                <Bar dataKey="amount" fill="url(#commGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                <Bar dataKey="target" fill="var(--border)" radius={[6, 6, 0, 0]} maxBarSize={40} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Lead Conversion Funnel */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          variants={fadeUp}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 bkr-section-card"
        >
          <div className="flex items-center gap-2 mb-5">
            <Activity className="h-4 w-4 text-[#6F5C46]" />
            <h2 className="text-base font-semibold text-[var(--fg)]">Conversion Funnel</h2>
          </div>

          <div className="space-y-3">
            {FUNNEL_DATA.map((stage, i) => {
              const maxVal = FUNNEL_DATA[0].value;
              const pct = Math.round((stage.value / maxVal) * 100);
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[var(--fg-secondary)]">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-[var(--fg)]">{stage.value}</span>
                      {i > 0 && (
                        <span className="text-[9px] text-[var(--fg-muted)]">
                          ({Math.round((stage.value / FUNNEL_DATA[i - 1].value) * 100)}%)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--fg-muted)] font-medium">Overall Conversion</span>
              <span className="text-sm font-bold text-[#22C55E]">
                {Math.round((FUNNEL_DATA[FUNNEL_DATA.length - 1].value / FUNNEL_DATA[0].value) * 100)}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════
          6. ACTIVITY FEED
          ═══════════════════════════════════ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        variants={fadeUp}
        transition={{ duration: 0.5 }}
        className="bkr-section-card"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#8B7355]" />
            <h2 className="text-base font-semibold text-[var(--fg)]">Recent Activity</h2>
          </div>
          <button
            onClick={() => router.push('/broker/leads')}
            className="text-[11px] font-semibold text-[var(--fg-muted)] hover:text-[#8B7355] transition-colors flex items-center gap-1"
          >
            View all <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="bkr-activity-timeline">
          {ACTIVITY_FEED.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="bkr-activity-item">
                <div className="bkr-activity-dot">
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">
                    <span className="font-semibold text-[var(--fg)]">{item.user}</span>{' '}
                    {item.action}{' '}
                    {item.target && <span className="font-medium text-[#8B7355]">{item.target}</span>}
                  </p>
                </div>
                <span className="text-[10px] text-[var(--fg-muted)] shrink-0">{item.time}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </PageContainer>
  );
}
