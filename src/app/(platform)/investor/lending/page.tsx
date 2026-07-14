// @ts-nocheck
'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, Shield, Zap, DollarSign,
  Building2, Sparkles, ChevronRight, AlertTriangle,
  Target, Scale, Wallet, BanknoteArrowDown, CircleDollarSign,
  Unlock, BarChart3, Activity, Heart, ArrowUpRight,
  RefreshCw, Download, Phone, CheckCircle2, Clock,
  Upload, User, CalendarClock, MapPin, TrendingDown,
  Percent, CalendarDays, Landmark, BadgeDollarSign,
} from 'lucide-react';
import type { FinancedProperty, LoanApplication, AIRecommendation } from './types';
import { fmt, fmtFull, refinanceColor, recColor } from './helpers';
import { type ModalState, getModalSize, ModalContent } from './lending-modals';

/* ══════════════════════════════════════════════════════════
   MOTION VARIANTS
   ══════════════════════════════════════════════════════════ */

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const scaleUpItem: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const metricStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const metricItem: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ══════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════ */

const financedProperties: FinancedProperty[] = [
  {
    id: 'fp-001', name: 'Marina Bay Penthouse', location: 'Dubai Marina',
    marketValue: 5_200_000, loanOutstanding: 2_450_000, originalLoan: 3_200_000,
    interestRate: 4.25, monthlyEMI: 18_500, monthlyRental: 28_000,
    lender: 'HSBC Premier', ltv: 47, tenure: 240, maturityDate: '2044-10',
    status: 'active', aiRefinanceScore: 72, potentialSaving: 850,
  },
  {
    id: 'fp-002', name: 'DIFC Liberty Tower', location: 'DIFC',
    marketValue: 3_800_000, loanOutstanding: 2_100_000, originalLoan: 2_600_000,
    interestRate: 5.10, monthlyEMI: 14_200, monthlyRental: 22_500,
    lender: 'Standard Chartered', ltv: 55, tenure: 180, maturityDate: '2041-03',
    status: 'refinance-ready', aiRefinanceScore: 94, potentialSaving: 2_100,
  },
  {
    id: 'fp-003', name: 'Palm Royal Residences', location: 'Palm Jumeirah',
    marketValue: 8_500_000, loanOutstanding: 4_200_000, originalLoan: 5_000_000,
    interestRate: 3.85, monthlyEMI: 24_800, monthlyRental: 42_000,
    lender: 'Emirates NBD Private', ltv: 49, tenure: 300, maturityDate: '2049-06',
    status: 'active', aiRefinanceScore: 45, potentialSaving: 0,
  },
  {
    id: 'fp-004', name: 'Business Bay Square', location: 'Business Bay',
    marketValue: 2_100_000, loanOutstanding: 1_600_000, originalLoan: 1_600_000,
    interestRate: 5.50, monthlyEMI: 0, monthlyRental: 0,
    lender: 'Mashreq Bank', ltv: 76, tenure: 240, maturityDate: '2046-01',
    status: 'review', aiRefinanceScore: 0, potentialSaving: 0,
  },
];

/* ── Loan Applications ─────────────────────────── */
const loanApplications: LoanApplication[] = [
  {
    id: 'la-001', lender: 'HSBC Premier', property: 'Marina Bay Penthouse',
    requestedAmount: 3_200_000, offeredRate: 4.25, status: 'approved',
    stage: 'Disbursed', estimatedApproval: 'Completed', rm: 'Sarah Al-Mansoori',
  },
  {
    id: 'la-002', lender: 'Standard Chartered', property: 'DIFC Liberty Tower',
    requestedAmount: 2_600_000, offeredRate: 5.10, status: 'approved',
    stage: 'Disbursed', estimatedApproval: 'Completed', rm: 'James Reynolds',
  },
  {
    id: 'la-003', lender: 'Mashreq Bank', property: 'Business Bay Square',
    requestedAmount: 1_600_000, offeredRate: 5.50, status: 'in-review',
    stage: 'Credit Assessment', estimatedApproval: 'May 8, 2026', rm: 'Aisha Khan',
  },
  {
    id: 'la-004', lender: 'ADCB Private', property: 'Creek Harbour Tower',
    requestedAmount: 2_800_000, offeredRate: 4.10, status: 'pending',
    stage: 'Documentation', estimatedApproval: 'May 22, 2026', rm: 'Mohamed Hassan',
  },
];

/* ── Chart Data ────────────────────────────────── */
const leverageHistory = [
  { month: 'May', equity: 7.2, debt: 10.1 },
  { month: 'Jun', equity: 7.5, debt: 9.9 },
  { month: 'Jul', equity: 7.9, debt: 9.7 },
  { month: 'Aug', equity: 8.3, debt: 9.5 },
  { month: 'Sep', equity: 8.8, debt: 9.3 },
  { month: 'Oct', equity: 9.1, debt: 9.2 },
  { month: 'Nov', equity: 9.5, debt: 9.0 },
  { month: 'Dec', equity: 9.9, debt: 8.8 },
  { month: 'Jan', equity: 10.2, debt: 8.6 },
  { month: 'Feb', equity: 10.5, debt: 8.5 },
  { month: 'Mar', equity: 10.8, debt: 8.3 },
  { month: 'Apr', equity: 11.25, debt: 8.15 },
];

const debtAllocation = [
  { name: 'Marina Bay', value: 2_450_000, color: '#8B7355' },
  { name: 'DIFC Liberty', value: 2_100_000, color: '#4ADE80' },
  { name: 'Palm Royal', value: 4_200_000, color: '#A89478' },
  { name: 'BB Square', value: 1_600_000, color: '#F59E0B' },
];

/* ── AI Recommendations ────────────────────────── */
const aiRecommendations = [
  {
    id: 'rec-1', type: 'refinance' as const, priority: 'high' as const,
    title: 'Refinance DIFC Liberty Tower',
    description: 'Current rate 5.10% is 85bps above market. Switch to ADCB at 4.25% to save ₹2,100/mo (₹25,200/yr).',
    impact: '+₹25,200/yr', confidence: 94,
  },
  {
    id: 'rec-2', type: 'leverage' as const, priority: 'high' as const,
    title: 'Unlock equity from Palm Royal',
    description: 'LTV at 49% with ₹4.3M equity. Draw ₹1.5M at 4.0% for new acquisition — net yield spread +2.8%.',
    impact: '+₹42,000/yr', confidence: 87,
  },
  {
    id: 'rec-3', type: 'optimize' as const, priority: 'medium' as const,
    title: 'Accelerate Marina Bay principal',
    description: 'Extra ₹3K/mo reduces tenure by 4.2 years, saves ₹187K in interest. Cash flow supports this.',
    impact: '-₹187K interest', confidence: 91,
  },
  {
    id: 'rec-4', type: 'alert' as const, priority: 'medium' as const,
    title: 'Rate lock expires in 38 days',
    description: 'HSBC Premier rate lock on Marina Bay expires May 23. Market rates trending up — consider locking.',
    impact: 'Risk mitigation', confidence: 78,
  },
  {
    id: 'rec-5', type: 'optimize' as const, priority: 'low' as const,
    title: 'Improve credit score for better terms',
    description: 'Reducing revolving credit utilization by 15% could push score to 800+, unlocking 0.25% better rates across portfolio.',
    impact: '-0.25% rates', confidence: 82,
  },
];

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */

function recIcon(type: string) {
  switch (type) {
    case 'refinance': return <BanknoteArrowDown className="h-4 w-4" />;
    case 'leverage': return <Unlock className="h-4 w-4" />;
    case 'optimize': return <Target className="h-4 w-4" />;
    case 'alert': return <AlertTriangle className="h-4 w-4" />;
    default: return <Sparkles className="h-4 w-4" />;
  }
}

function statusConfig(status: string) {
  switch (status) {
    case 'approved': return { variant: 'success' as const, icon: CheckCircle2, label: 'Approved' };
    case 'in-review': return { variant: 'warning' as const, icon: Clock, label: 'In Review' };
    default: return { variant: 'secondary' as const, icon: CalendarClock, label: 'Pending' };
  }
}

/* ── Chart Tooltips ──────────────────────────────── */

function EquityDebtTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1E222B] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] px-5 py-4 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <p className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.08em] mb-2.5">{label} 2026</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-6 text-[12px]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}40` }} />
              <span className="text-[var(--fg-secondary)] font-medium">{entry.name}</span>
            </span>
            <span className="font-bold text-[var(--fg)] tabular-nums">₹{entry.value}M</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-2xl bg-white dark:bg-[#1E222B] border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] px-5 py-4 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <p className="text-[13px] font-bold text-[var(--fg)]">{d.name}</p>
      <p className="text-[11px] text-[var(--fg-muted)] mt-1 tabular-nums">{fmtFull(d.value)} outstanding</p>
    </div>
  );
}

/* ── Animated Counter ─────────────────────────────── */

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v: number) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(mv, value, { duration, ease: 'easeOut' });
      return () => controls.stop();
    }
  }, [isInView, value, duration, mv]);

  useEffect(() => {
    const unsub = rounded.on('change', setDisplay);
    return unsub;
  }, [rounded]);

  return <span ref={ref}>{display}</span>;
}

/* ── Animated Health Score Ring ───────────────────── */

function AnimatedHealthRing({ score, size = 130, strokeWidth = 9 }: { score: number; size?: number; strokeWidth?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const color = score >= 80 ? '#4ADE80' : score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div ref={ref} className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset: circumference - (score / 100) * circumference } : { strokeDashoffset: circumference }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${color}30)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-extrabold tracking-tight tabular-nums" style={{ color }}>
          <AnimatedCounter value={score} duration={1.2} />
        </span>
        <span className="text-[9px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.1em] -mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

/* ── Borrowing Power Ring ───────────────────── */

function BorrowingPowerRing({ used, total, size = 72, strokeWidth = 6 }: { used: number; total: number; size?: number; strokeWidth?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.round((used / total) * 100));
  const remaining = 100 - pct;

  return (
    <div ref={ref} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#A89478" strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={isInView ? { strokeDashoffset: circumference - (pct / 100) * circumference } : { strokeDashoffset: circumference }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(168,148,120,0.3))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-extrabold tracking-tight tabular-nums text-[var(--fg)]">
          {remaining}%
        </span>
        <span className="text-[7px] font-bold text-[var(--fg-muted)] uppercase tracking-[0.1em]">avail</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */

export default function LendingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'properties' | 'recommendations'>('overview');
  const [modal, setModal] = useState<ModalState>({ type: 'closed' });
  const closeModal = () => setModal({ type: 'closed' });

  const totals = useMemo(() => {
    const props = financedProperties;
    const totalMarketValue = props.reduce((s, p) => s + p.marketValue, 0);
    const totalDebt = props.reduce((s, p) => s + p.loanOutstanding, 0);
    const totalEquity = totalMarketValue - totalDebt;
    const portfolioLTV = Math.round((totalDebt / totalMarketValue) * 100);
    const totalEMI = props.filter(p => p.monthlyEMI > 0).reduce((s, p) => s + p.monthlyEMI, 0);
    const totalRental = props.filter(p => p.monthlyRental > 0).reduce((s, p) => s + p.monthlyRental, 0);
    const netCashFlow = totalRental - totalEMI;
    const weightedRate = props.filter(p => p.loanOutstanding > 0 && p.interestRate > 0)
      .reduce((s, p) => s + (p.interestRate * p.loanOutstanding), 0) / (totalDebt || 1);
    const borrowingPower = Math.max(0, totalMarketValue * 0.75 - totalDebt);
    const leverageRatio = totalDebt > 0 ? +(totalMarketValue / totalDebt).toFixed(2) : 0;
    const roiAfterFinancing = totalMarketValue > 0
      ? +((totalRental * 12 - totalEMI * 12) / totalEquity * 100).toFixed(1) : 0;
    const totalPotentialSavings = props.reduce((s, p) => s + p.potentialSaving, 0) * 12;
    const activeLoans = props.filter(p => p.status === 'active').length;

    // Health score
    const ltvScore = portfolioLTV <= 40 ? 30 : portfolioLTV <= 55 ? 25 : portfolioLTV <= 70 ? 15 : 5;
    const cashFlowScore = netCashFlow > 30000 ? 25 : netCashFlow > 15000 ? 20 : netCashFlow > 0 ? 12 : 0;
    const diversScore = props.length >= 4 ? 15 : props.length >= 3 ? 12 : 8;
    const rateScore = weightedRate < 4.0 ? 15 : weightedRate < 4.5 ? 12 : weightedRate < 5.0 ? 8 : 4;
    const equityGrowthScore = 15;
    const healthScore = Math.min(100, ltvScore + cashFlowScore + diversScore + rateScore + equityGrowthScore);

    return {
      totalMarketValue, totalDebt, totalEquity, portfolioLTV,
      totalEMI, totalRental, netCashFlow, weightedRate,
      borrowingPower, leverageRatio, roiAfterFinancing, totalPotentialSavings,
      healthScore, ltvScore, cashFlowScore, diversScore, rateScore, equityGrowthScore,
      activeLoans,
    };
  }, []);

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { key: 'properties' as const, label: 'Financed Assets', icon: Building2 },
    { key: 'recommendations' as const, label: 'AI Insights', icon: Sparkles },
  ];

  const healthBreakdown = [
    { label: 'LTV Position', score: totals.ltvScore, max: 30, color: '#4ADE80' },
    { label: 'Cash Flow', score: totals.cashFlowScore, max: 25, color: '#8B7355' },
    { label: 'Diversification', score: totals.diversScore, max: 15, color: '#A89478' },
    { label: 'Rate Efficiency', score: totals.rateScore, max: 15, color: '#F59E0B' },
    { label: 'Equity Growth', score: totals.equityGrowthScore, max: 15, color: '#A89478' },
  ];

  return (
    <PageContainer className="space-y-10 animate-[fade-in_0.4s_ease-out]">

      {/* ════════════════════════════════════════════
          SECTION 1 — HEADER
         ════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-4">
            <h1 className="text-[42px] font-extrabold tracking-[-0.03em] text-[var(--fg)] leading-[1.1]">Wealth Leverage</h1>
            <motion.span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{
                background: 'rgba(74,222,128,0.06)',
                border: '1px solid rgba(74,222,128,0.15)',
                boxShadow: '0 0 20px rgba(74,222,128,0.08)',
              }}
              animate={{ boxShadow: [
                '0 0 20px rgba(74,222,128,0.08)',
                '0 0 30px rgba(74,222,128,0.15)',
                '0 0 20px rgba(74,222,128,0.08)',
              ]}}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ADE80]" />
              </span>
              <span className="text-[11px] font-bold text-[#4ADE80] tracking-[0.06em] uppercase">AI Active</span>
            </motion.span>
          </div>
          <p className="text-[16px] font-medium text-[var(--fg-muted)] leading-relaxed max-w-lg">
            Debt optimization, refinance intelligence & borrowing power across your portfolio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModal({ type: 'contact-banker' })}
            className="wl-btn-banker inline-flex items-center gap-2.5 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(139,115,85,0.3)]"
          >
            <Phone className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Contact Banker</span>
          </button>
          <button
            onClick={() => setModal({ type: 'export' })}
            className="wl-btn-action inline-flex items-center gap-2.5 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(139,115,85,0.25)]"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setModal({ type: 'refresh' })}
            className="wl-btn-action wl-refresh-spin inline-flex items-center gap-2.5 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(139,115,85,0.25)]"
          >
            <RefreshCw className="h-4 w-4 wl-refresh-icon" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════
          SECTION 2 — PRIMARY KPI CARDS
         ════════════════════════════════════════════ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
        className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Net Equity */}
        <motion.div variants={scaleUpItem} className="wl-kpi-card p-6 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[rgba(74,222,128,0.05)] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-[var(--fg-muted)] uppercase tracking-[0.12em]">Net Equity</p>
            <div className="glow-icon-container"><Wallet className="h-5 w-5 text-[#8B7355]" /></div>
          </div>
          <p className="text-[36px] font-extrabold text-[var(--fg)] tracking-[-0.02em] leading-none tabular-nums">
            <AnimatedCounter value={totals.totalEquity} prefix="$" />
          </p>
          <div className="mt-3 flex items-center gap-2">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.6 }}
              className="flex items-center gap-1 rounded-full bg-[rgba(34,197,94,0.08)] px-2.5 py-1"
            >
              <TrendingUp className="h-3 w-3 text-[#4ADE80]" />
              <span className="text-xs font-bold text-[#4ADE80] tabular-nums">+12.4%</span>
            </motion.div>
            <span className="text-[11px] text-[var(--fg-muted)] font-medium">YoY</span>
          </div>
        </motion.div>

        {/* Portfolio LTV */}
        <motion.div variants={scaleUpItem} className="wl-kpi-card p-6 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[rgba(245,158,11,0.05)] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-[var(--fg-muted)] uppercase tracking-[0.12em]">Portfolio LTV</p>
            <div className="glow-icon-container"><Scale className="h-5 w-5 text-[#8B7355]" /></div>
          </div>
          <p className="text-[36px] font-extrabold text-[var(--fg)] tracking-[-0.02em] leading-none tabular-nums">{totals.portfolioLTV}%</p>
          <div className="mt-3.5 space-y-2">
            {/* Segmented LTV meter */}
            <div className="wl-ltv-meter">
              <motion.div
                className="wl-ltv-segment"
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(totals.portfolioLTV, 50)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
                style={{ background: 'linear-gradient(90deg, #4ADE80, #22C55E)' }}
              />
              {totals.portfolioLTV > 50 && (
                <motion.div
                  className="wl-ltv-segment"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(totals.portfolioLTV - 50, 20)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.5 }}
                  style={{ background: 'linear-gradient(90deg, #F59E0B, #EAB308)' }}
                />
              )}
              {totals.portfolioLTV > 70 && (
                <motion.div
                  className="wl-ltv-segment"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${totals.portfolioLTV - 70}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.8 }}
                  style={{ background: 'linear-gradient(90deg, #EF4444, #DC2626)' }}
                />
              )}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
                <span className="text-[9px] text-[var(--fg-muted)] font-medium">Safe</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                <span className="text-[9px] text-[var(--fg-muted)] font-medium">Moderate</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                <span className="text-[9px] text-[var(--fg-muted)] font-medium">High</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Net Cash Flow */}
        <motion.div variants={scaleUpItem} className="wl-kpi-card p-6 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[rgba(74,222,128,0.05)] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-[var(--fg-muted)] uppercase tracking-[0.12em]">Net Cash Flow</p>
            <div className="glow-icon-container"><CircleDollarSign className="h-5 w-5 text-[#8B7355]" /></div>
          </div>
          <p className={`text-[36px] font-extrabold tracking-[-0.02em] leading-none tabular-nums ${totals.netCashFlow >= 0 ? 'wl-value-positive' : ''}`} style={totals.netCashFlow < 0 ? { color: '#EF4444' } : undefined}>
            {totals.netCashFlow >= 0 ? '+' : ''}{fmtFull(totals.netCashFlow)}
          </p>
          <div className="mt-3.5 flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center h-5 w-5 rounded-md bg-[rgba(74,222,128,0.1)]">
                <TrendingUp className="h-3 w-3 text-[#4ADE80]" />
              </div>
              <span className="text-[11px] font-semibold text-[var(--fg-secondary)] tabular-nums">{fmtFull(totals.totalRental)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center h-5 w-5 rounded-md bg-[rgba(239,68,68,0.08)]">
                <TrendingDown className="h-3 w-3 text-[#EF4444]" />
              </div>
              <span className="text-[11px] font-semibold text-[var(--fg-secondary)] tabular-nums">{fmtFull(totals.totalEMI)}</span>
            </div>
          </div>
        </motion.div>

        {/* Borrowing Power */}
        <motion.div variants={scaleUpItem} className="wl-kpi-card p-6 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[rgba(139,115,85,0.05)] to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold text-[var(--fg-muted)] uppercase tracking-[0.12em]">Borrowing Power</p>
            <div className="glow-icon-container"><Zap className="h-5 w-5 text-[#8B7355]" /></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[36px] font-extrabold text-[var(--fg)] tracking-[-0.02em] leading-none tabular-nums">{fmt(totals.borrowingPower)}</p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-2 font-medium">at 75% max LTV threshold</p>
            </div>
            <BorrowingPowerRing used={totals.totalDebt} total={totals.totalMarketValue * 0.75} />
          </div>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════
          SECTION 3 — PORTFOLIO DETAIL GRID
         ════════════════════════════════════════════ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={metricStagger}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
      >
        {([
          { label: 'Credit Score', value: '780', accent: '#4ADE80', icon: Shield },
          { label: 'Active Loans', value: `${totals.activeLoans} of ${financedProperties.length}`, icon: Building2 },
          { label: 'Total Portfolio', value: fmt(totals.totalMarketValue), accent: '#8B7355', icon: Wallet },
          { label: 'Total Debt', value: fmt(totals.totalDebt), icon: Scale },
          { label: 'Monthly EMI', value: fmtFull(totals.totalEMI), icon: DollarSign },
          { label: 'Avg LTV', value: `${totals.portfolioLTV}%`, icon: BarChart3 },
          { label: 'Wtd Avg Rate', value: `${totals.weightedRate.toFixed(2)}%`, icon: Percent },
          { label: 'Leverage', value: `${totals.leverageRatio}x`, icon: TrendingUp },
          { label: 'ROI', value: `${totals.roiAfterFinancing}%`, accent: '#4ADE80', icon: ArrowUpRight },
          { label: 'Refi Savings', value: `${fmtFull(totals.totalPotentialSavings)}/yr`, accent: '#8B7355', icon: Sparkles },
        ] as { label: string; value: string; accent?: string; icon: typeof Shield }[]).map((m) => (
          <motion.div key={m.label} variants={metricItem} className="wl-metric-card p-4 group/metric">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-[rgba(139,115,85,0.06)] group-hover/metric:bg-[rgba(139,115,85,0.12)] transition-colors">
                <m.icon className="h-3.5 w-3.5 text-[var(--fg-muted)] group-hover/metric:text-[#8B7355] transition-colors" />
              </div>
            </div>
            <p className="text-[9px] font-bold text-[var(--fg-muted)] uppercase tracking-[0.1em] mb-1">{m.label}</p>
            <p className={`text-[15px] font-bold tabular-nums tracking-tight ${m.accent === '#4ADE80' ? 'wl-value-positive' : m.accent === '#8B7355' ? 'wl-value-blue' : 'text-[var(--fg)]'}`}>{m.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ════════════════════════════════════════════
          SECTION 5 — TABS
         ════════════════════════════════════════════ */}
      <div className="wl-tab-container p-1.5 w-fit">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <motion.button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              whileTap={{ scale: 0.97 }}
              whileHover={!isActive ? { scale: 1.02 } : undefined}
              className={`outline-none inline-flex items-center gap-2 px-7 py-3.5 rounded-[14px] text-sm font-semibold transition-all duration-200 cursor-pointer focus-visible:ring-[3px] focus-visible:ring-[rgba(139,115,85,0.25)] ${
                isActive
                  ? 'wl-tab-active'
                  : 'wl-tab-inactive'
              }`}
            >
              <tab.icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 1.5} />
              {tab.label}
              {tab.key === 'recommendations' && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.5 }}
                  className={`ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-extrabold px-1.5 ${isActive ? 'bg-[rgba(255,255,255,0.25)] text-white' : 'bg-[rgba(74,222,128,0.12)] text-[#4ADE80]'}`}
                >
                  {aiRecommendations.length}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════
          SECTION 6 — OVERVIEW TAB
         ════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-8"
        >
          {/* Charts + Health */}
          <div className="grid gap-6 lg:grid-cols-7">
            {/* Equity vs Debt */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-4 glass-card p-7"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[rgba(74,222,128,0.08)] flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-[#4ADE80]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--fg)] tracking-tight">Equity vs Debt Trajectory</h3>
                    <p className="text-xs text-[var(--fg-muted)] mt-0.5">12-month portfolio balance</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-xs">
                  <span className="flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-[#4ADE80]" /><span className="text-[var(--fg-muted)] font-medium">Equity</span></span>
                  <span className="flex items-center gap-2"><span className="h-2 w-5 rounded-full bg-[#A89478]" /><span className="text-[var(--fg-muted)] font-medium">Debt</span></span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={leverageHistory} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                  <defs>
                    <linearGradient id="eqG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ADE80" stopOpacity={0.18} /><stop offset="100%" stopColor="#4ADE80" stopOpacity={0} /></linearGradient>
                    <linearGradient id="dbG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#A89478" stopOpacity={0.14} /><stop offset="100%" stopColor="#A89478" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--fg-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--fg-muted)', fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}M`} width={60} />
                  <Tooltip content={<EquityDebtTooltip />} wrapperStyle={{ outline: 'none', border: 'none' }} />
                  <Area type="monotone" dataKey="equity" name="Equity" stroke="#4ADE80" fill="url(#eqG)" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#4ADE80', stroke: 'var(--bg-elevated)', strokeWidth: 3 }} />
                  <Area type="monotone" dataKey="debt" name="Debt" stroke="#A89478" fill="url(#dbG)" strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: '#A89478', stroke: 'var(--bg-elevated)', strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Portfolio Health */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3 glass-card p-7 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-[rgba(139,115,85,0.08)] flex items-center justify-center">
                  <Heart className="h-4 w-4 text-[#8B7355]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--fg)] tracking-tight">Portfolio Health</h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">Overall leverage score</p>
                </div>
              </div>
              <div className="flex justify-center mb-5"><AnimatedHealthRing score={totals.healthScore} size={140} strokeWidth={10} /></div>
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 1.0 }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.08em]" style={{
                  background: totals.healthScore >= 80 ? 'rgba(74,222,128,0.08)' : 'rgba(245,158,11,0.08)',
                  color: totals.healthScore >= 80 ? '#4ADE80' : '#F59E0B',
                  border: `1px solid ${totals.healthScore >= 80 ? 'rgba(74,222,128,0.15)' : 'rgba(245,158,11,0.15)'}`,
                }}>
                  <Activity className="h-3.5 w-3.5" />
                  {totals.healthScore >= 90 ? 'Excellent' : totals.healthScore >= 80 ? 'Strong' : totals.healthScore >= 60 ? 'Moderate' : 'Needs Attention'}
                </span>
              </motion.div>
              <div className="space-y-4 flex-1">
                {healthBreakdown.map((item, idx) => {
                  const pct = Math.round((item.score / item.max) * 100);
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.6 + idx * 0.1 }}
                    >
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[var(--fg-secondary)] font-medium">{item.label}</span>
                        <span className="font-bold tabular-nums" style={{ color: item.color }}>
                          {item.score}<span className="text-[var(--fg-muted)] font-normal text-[11px]">/{item.max}</span>
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.07)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.7 + idx * 0.1 }}
                          style={{ background: `linear-gradient(90deg, ${item.color}cc, ${item.color})` }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Debt Allocation + Cash Flow */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Debt Pie */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="lg:col-span-2 glass-card p-7"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-[rgba(168,148,120,0.08)] flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-[#A89478]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--fg)] tracking-tight">Debt Allocation</h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">Outstanding by property</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={debtAllocation} cx="50%" cy="50%" innerRadius={60} outerRadius={95} dataKey="value" stroke="none" paddingAngle={3}>
                    {debtAllocation.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} wrapperStyle={{ outline: 'none', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-4">
                {debtAllocation.map((d) => {
                  const totalDebt = debtAllocation.reduce((s, x) => s + x.value, 0);
                  const pctOfTotal = Math.round((d.value / totalDebt) * 100);
                  return (
                    <div key={d.name} className="flex items-center justify-between text-[13px] group/row">
                      <span className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ background: d.color }} />
                        <span className="text-[var(--fg-secondary)] group-hover/row:text-[var(--fg)] transition-colors font-medium">{d.name}</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[var(--fg-muted)] tabular-nums">{pctOfTotal}%</span>
                        <span className="font-bold text-[var(--fg)] tabular-nums">{fmt(d.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Cash Flow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-3 glass-card p-7"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[rgba(74,222,128,0.08)] flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-[#4ADE80]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[var(--fg)] tracking-tight">Monthly Cash Flow</h3>
                    <p className="text-xs text-[var(--fg-muted)] mt-0.5">Rental income vs mortgage payment</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]" /><span className="text-[var(--fg-muted)] font-medium">Income</span></span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#A89478]" /><span className="text-[var(--fg-muted)] font-medium">EMI</span></span>
                </div>
              </div>
              <motion.div
                className="space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                {financedProperties.filter(p => p.monthlyRental > 0).map((p, idx) => {
                  const net = p.monthlyRental - p.monthlyEMI;
                  const ratio = Math.round((p.monthlyEMI / p.monthlyRental) * 100);
                  return (
                    <motion.div
                      key={p.id}
                      variants={fadeUpItem}
                      whileHover={{ y: -2 }}
                      className="group/cf flex items-center gap-5 rounded-xl bg-[rgba(255,255,255,0.6)] dark:bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.4)] dark:border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.8)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] px-5 py-4 transition-all duration-200"
                    >
                      <div className="min-w-[150px]">
                        <p className="text-sm font-semibold text-[var(--fg)]">{p.name}</p>
                        <p className="text-xs text-[var(--fg-muted)] mt-0.5">{p.location}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex h-3 rounded-full overflow-hidden bg-[var(--bg-tertiary)]">
                          <motion.div
                            className="bg-[#4ADE80] rounded-l-full"
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 + idx * 0.1 }}
                            style={{ width: `${100 - ratio}%`, transformOrigin: 'left' }}
                          />
                          <motion.div
                            className="bg-[#A89478] rounded-r-full"
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 + idx * 0.1 }}
                            style={{ width: `${ratio}%`, transformOrigin: 'right' }}
                          />
                        </div>
                      </div>
                      <div className="text-right min-w-[115px]">
                        <p className="text-base font-bold tabular-nums" style={{ color: net >= 0 ? '#4ADE80' : '#EF4444' }}>{net >= 0 ? '+' : ''}{fmtFull(net)}</p>
                        <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 tabular-nums">{fmtFull(p.monthlyRental)} − {fmtFull(p.monthlyEMI)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════
          SECTION 7 — FINANCED ASSETS TAB
         ════════════════════════════════════════════ */}
      {activeTab === 'properties' && (
        <motion.div
          key="properties"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-10"
        >
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-7 sm:grid-cols-2"
          >
            {financedProperties.map((p) => {
              const equity = p.marketValue - p.loanOutstanding;
              const repaidPct = Math.round(((p.originalLoan - p.loanOutstanding) / p.originalLoan) * 100);
              const net = p.monthlyRental - p.monthlyEMI;
              const ltvColor = p.ltv <= 50 ? '#4ADE80' : p.ltv <= 70 ? '#F59E0B' : '#EF4444';
              const scoreColor = refinanceColor(p.aiRefinanceScore);

              return (
                <motion.div
                  key={p.id}
                  variants={scaleUpItem}
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="wl-kpi-card group relative overflow-hidden"
                >
                  <div className="p-7">
                    {/* ── Header ──────────────────────────── */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center bg-[rgba(139,115,85,0.06)] group-hover:bg-[rgba(139,115,85,0.1)] transition-colors">
                          <Building2 className="h-5.5 w-5.5 text-[#8B7355]" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[18px] font-bold text-[var(--fg)] tracking-tight truncate">{p.name}</h3>
                          <p className="flex items-center gap-1.5 text-[12px] text-[var(--fg-muted)] mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {p.location}
                            <span className="text-[var(--border)] mx-0.5">·</span>
                            <Landmark className="h-3 w-3 shrink-0" />
                            {p.lender}
                          </p>
                        </div>
                      </div>
                      <Badge variant={p.status === 'active' ? 'success' : p.status === 'refinance-ready' ? 'warning' : 'secondary'} className="shrink-0 ml-3">
                        {p.status === 'active' ? 'Active' : p.status === 'refinance-ready' ? 'Refinance Ready' : 'In Review'}
                      </Badge>
                    </div>

                    {/* ── KPI Boxes ───────────────────────── */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="rounded-[18px] p-4 text-center bg-[rgba(139,115,85,0.03)] border border-[rgba(139,115,85,0.06)]">
                        <p className="text-[9px] font-bold text-[var(--fg-muted)] uppercase tracking-[0.12em] mb-2">Market Value</p>
                        <p className="text-[20px] font-extrabold text-[var(--fg)] tabular-nums tracking-tight leading-none">{fmt(p.marketValue)}</p>
                      </div>
                      <div className="rounded-[18px] p-4 text-center bg-[rgba(139,115,85,0.03)] border border-[rgba(139,115,85,0.06)]">
                        <p className="text-[9px] font-bold text-[var(--fg-muted)] uppercase tracking-[0.12em] mb-2">Outstanding</p>
                        <p className="text-[20px] font-extrabold text-[var(--fg)] tabular-nums tracking-tight leading-none">{fmt(p.loanOutstanding)}</p>
                      </div>
                      <div className="rounded-[18px] p-4 text-center bg-[rgba(74,222,128,0.04)] border border-[rgba(74,222,128,0.08)]">
                        <p className="text-[9px] font-bold text-[var(--fg-muted)] uppercase tracking-[0.12em] mb-2">Net Equity</p>
                        <p className="text-[20px] font-extrabold tabular-nums tracking-tight leading-none wl-value-positive">{fmt(equity)}</p>
                      </div>
                    </div>

                    {/* ── Detail Grid ─────────────────────── */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-6">
                      {[
                        { icon: Percent, label: 'Interest Rate', value: `${p.interestRate}%`, color: 'var(--fg)' },
                        { icon: Scale, label: 'LTV', value: `${p.ltv}%`, color: ltvColor },
                        { icon: CalendarDays, label: 'Tenure', value: `${p.tenure / 12} yrs`, color: 'var(--fg)' },
                        { icon: CalendarClock, label: 'Maturity', value: p.maturityDate, color: 'var(--fg-secondary)' },
                        { icon: BadgeDollarSign, label: 'Monthly EMI', value: p.monthlyEMI ? fmtFull(p.monthlyEMI) : 'TBD', color: 'var(--fg)' },
                        { icon: TrendingUp, label: 'Rental Income', value: p.monthlyRental ? fmtFull(p.monthlyRental) : '—', color: p.monthlyRental > 0 ? '#4ADE80' : 'var(--fg-muted)' },
                      ].map((d) => (
                        <div key={d.label} className="flex items-center justify-between gap-2 group/detail">
                          <span className="flex items-center gap-2 text-xs text-[var(--fg-muted)] font-medium shrink-0">
                            <div className="h-7 w-7 rounded-lg bg-[rgba(139,115,85,0.05)] group-hover/detail:bg-[rgba(139,115,85,0.1)] flex items-center justify-center transition-colors">
                              <d.icon className="h-3.5 w-3.5 shrink-0 text-[var(--fg-muted)] group-hover/detail:text-[#8B7355] transition-colors" />
                            </div>
                            {d.label}
                          </span>
                          <span className="text-[14px] font-bold tabular-nums truncate" style={{ color: d.color }}>{d.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* ── Net Cash Flow Strip ─────────────── */}
                    {p.monthlyRental > 0 && (
                      <div className="rounded-[18px] px-5 py-4 mb-5 flex items-center justify-between" style={{
                        background: net >= 0
                          ? 'linear-gradient(90deg,rgba(74,222,128,0.06),rgba(74,222,128,0.02))'
                          : 'linear-gradient(90deg,rgba(239,68,68,0.06),rgba(239,68,68,0.02))',
                        border: `1px solid ${net >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)'}`,
                      }}>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{
                            background: net >= 0 ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
                          }}>
                            {net >= 0
                              ? <TrendingUp className="h-4 w-4 text-[#4ADE80]" />
                              : <TrendingDown className="h-4 w-4 text-[#EF4444]" />
                            }
                          </div>
                          <span className="text-xs font-semibold" style={{ color: net >= 0 ? '#4ADE80' : '#EF4444' }}>
                            Net Monthly Cash Flow
                          </span>
                        </div>
                        <span className={`text-xl font-extrabold tabular-nums tracking-tight ${net >= 0 ? 'wl-value-positive' : ''}`} style={net < 0 ? { color: '#EF4444' } : undefined}>
                          {net >= 0 ? '+' : ''}{fmtFull(net)}
                        </span>
                      </div>
                    )}

                    {/* ── Repayment Progress ──────────────── */}
                    {repaidPct > 0 && (
                      <div className="mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[var(--fg-muted)] font-medium">Loan Repayment</span>
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold wl-value-blue" style={{
                            background: 'rgba(139,115,85,0.08)',
                          }}>
                            {repaidPct}% paid
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.05)' }}>
                          <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${repaidPct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                            style={{ background: 'linear-gradient(90deg,#6F5C46,#A89478,#A89478)' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* ── AI Refinance Score ──────────────── */}
                    {p.aiRefinanceScore > 0 && (
                      <div className="rounded-[18px] px-5 py-5 mb-5 flex items-center justify-between group-hover:shadow-[0_4px_20px_rgba(139,115,85,0.08)] transition-shadow duration-300" style={{
                        background: 'linear-gradient(90deg,rgba(139,115,85,0.05),rgba(139,115,85,0.01))',
                        border: '1px solid rgba(139,115,85,0.1)',
                      }}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(139,115,85,0.08)' }}>
                            <Sparkles className="h-5 w-5 text-[#8B7355]" />
                          </div>
                          <div>
                            <p className="text-[10px] text-[var(--fg-muted)] font-bold uppercase tracking-[0.1em]">AI Refinance Score</p>
                            <p className="text-xs font-semibold mt-0.5" style={{ color: scoreColor }}>
                              {p.aiRefinanceScore >= 85 ? 'Highly Recommended' : p.aiRefinanceScore >= 60 ? 'Consider Refinancing' : 'Monitor Rates'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-[32px] font-extrabold tabular-nums tracking-tight leading-none" style={{ color: scoreColor }}>
                              {p.aiRefinanceScore}
                            </span>
                            <span className="text-xs text-[var(--fg-muted)] font-medium">/100</span>
                          </div>
                          {p.potentialSaving > 0 && (
                            <div className="flex items-center gap-1 rounded-full px-3 py-1.5" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.12)' }}>
                              <ArrowUpRight className="h-3.5 w-3.5 text-[#4ADE80]" />
                              <span className="text-xs font-bold text-[#4ADE80]">{fmtFull(p.potentialSaving)}/mo</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Actions ─────────────────────────── */}
                    <div className="flex gap-2.5 pt-1">
                      <button
                        onClick={() => setModal(
                          p.status === 'refinance-ready' ? { type: 'start-refinance', property: p }
                          : p.status === 'review' ? { type: 'track-application', property: p }
                          : { type: 'view-statement', property: p }
                        )}
                        className="c-btn-primary flex-1 py-3 text-[13px] font-semibold cursor-pointer outline-none"
                      >
                        {p.status === 'refinance-ready' ? 'Start Refinance' : p.status === 'review' ? 'Track Application' : 'View Statement'}
                      </button>
                      <button
                        onClick={() => setModal({ type: 'property-details', property: p })}
                        className="c-btn-secondary px-4 py-3 text-[13px] font-semibold cursor-pointer outline-none"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ════════════════════════════════════════
              SECTION 8 — ACTIVE LOAN APPLICATIONS
             ════════════════════════════════════════ */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[rgba(139,115,85,0.08)] flex items-center justify-center">
                  <Landmark className="h-5 w-5 text-[#8B7355]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--fg)] tracking-tight">Loan Applications</h2>
                  <p className="text-sm text-[var(--fg-muted)] mt-0.5">Track all active and pending financing requests</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-[rgba(74,222,128,0.06)] border border-[rgba(74,222,128,0.12)] px-3.5 py-1.5">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ADE80] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ADE80]" />
                </div>
                <span className="text-xs font-semibold text-[#4ADE80]">{loanApplications.length} applications</span>
              </div>
            </div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid gap-5 sm:grid-cols-2"
            >
              {loanApplications.map((loan) => {
                const sc = statusConfig(loan.status);
                const accentColor = loan.status === 'approved' ? '#4ADE80' : loan.status === 'in-review' ? '#F59E0B' : '#A89478';
                return (
                  <motion.div key={loan.id} variants={scaleUpItem} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="wl-kpi-card group overflow-hidden">
                    {/* Accent top line */}
                    <div className="h-[2px]" style={{ background: `linear-gradient(90deg,${accentColor},${accentColor}40)` }} />
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-5">
                        <div className="min-w-0">
                          <h3 className="text-[16px] font-bold text-[var(--fg)] tracking-tight">{loan.lender}</h3>
                          <p className="text-[12px] text-[var(--fg-muted)] mt-0.5 truncate">{loan.property}</p>
                        </div>
                        <Badge variant={sc.variant} className="shrink-0 ml-3">
                          <span className="flex items-center gap-1"><sc.icon className="h-3 w-3" /> {sc.label}</span>
                        </Badge>
                      </div>

                      {/* KPI grid */}
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        {[
                          { label: 'Requested', value: fmtFull(loan.requestedAmount), tint: 'rgba(139,115,85,0.05)', accent: '#8B7355' },
                          { label: 'Offered Rate', value: `${loan.offeredRate}% p.a.`, tint: 'rgba(168,148,120,0.05)', accent: '#A89478' },
                          { label: 'Stage', value: loan.stage, tint: 'rgba(74,222,128,0.04)', accent: '#4ADE80' },
                          { label: 'Est. Approval', value: loan.estimatedApproval, tint: 'rgba(0,0,0,0.025)', accent: 'var(--fg-muted)' },
                        ].map((item) => (
                          <div key={item.label} className="rounded-2xl p-4 border border-[var(--border-light)]" style={{ background: item.tint }}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.09em] mb-2" style={{ color: item.accent }}>{item.label}</p>
                            <p className="text-base font-bold text-[var(--fg)] tabular-nums leading-tight">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* RM strip */}
                      <div className="flex items-center gap-2.5 rounded-2xl px-4 py-3 mb-5" style={{
                        background: 'rgba(0,0,0,0.025)',
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}>
                        <div className="h-7 w-7 rounded-full bg-[rgba(139,115,85,0.08)] flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-[#8B7355]" />
                        </div>
                        <span className="text-[11px] text-[var(--fg-muted)]">Relationship Manager</span>
                        <span className="text-[12px] font-bold text-[var(--fg)] ml-auto">{loan.rm}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal(loan.status === 'approved' ? { type: 'loan-statement', loan } : { type: 'loan-track', loan })}
                          className="c-btn-primary flex-1 py-2.5 text-[11px] font-semibold cursor-pointer outline-none"
                        >
                          {loan.status === 'approved' ? 'View Statement' : 'Track Application'}
                        </button>
                        {loan.status !== 'approved' && (
                          <button onClick={() => setModal({ type: 'loan-docs', loan })} className="c-btn-secondary px-3.5 py-2.5 text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 outline-none">
                            <Upload className="h-3 w-3" />Docs
                          </button>
                        )}
                        <button onClick={() => setModal({ type: 'loan-rm', loan })} className="c-btn-secondary px-3.5 py-2.5 text-[11px] font-semibold cursor-pointer flex items-center gap-1.5 outline-none">
                          <Phone className="h-3 w-3" />RM
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════
          SECTION 9 — AI INSIGHTS TAB
         ════════════════════════════════════════════ */}
      {activeTab === 'recommendations' && (
        <motion.div
          key="recommendations"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-8"
        >
          {/* Summary banner */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-2xl bg-[rgba(255,255,255,0.92)] dark:bg-[rgba(255,255,255,0.03)] border border-[rgba(139,115,85,0.2)] p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-[14px] relative overflow-hidden"
          >
            {/* Shimmer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                className="absolute -inset-full"
                style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(139,115,85,0.04) 50%, transparent 60%)' }}
                animate={{ x: ['-50%', '150%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div className="flex items-center gap-4 relative">
              <motion.div
                className="h-14 w-14 rounded-2xl bg-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.12)] flex items-center justify-center shrink-0 relative"
                animate={{ boxShadow: ['0 0 0px rgba(139,115,85,0)', '0 0 18px rgba(139,115,85,0.15)', '0 0 0px rgba(139,115,85,0)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="h-6 w-6 text-[#8B7355]" />
                <motion.div
                  className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-[#4ADE80] border-2 border-white dark:border-[var(--bg)]"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div>
                <p className="text-base font-bold text-[var(--fg)] tracking-tight">GLIMMORA AI identified {aiRecommendations.length} optimization opportunities</p>
                <p className="text-sm text-[var(--fg-muted)] mt-1">
                  Estimated annual impact: <span className="font-bold text-[#4ADE80]">+{fmtFull(totals.totalPotentialSavings + 42_000)}</span> in combined savings & yield
                </p>
              </div>
            </div>
          </motion.div>

          {/* Recommendation cards */}
          <motion.div
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {aiRecommendations.map((rec, idx) => {
              const colors = recColor(rec.priority);
              return (
                <motion.div
                  key={rec.id}
                  variants={fadeUpItem}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  onClick={() => setModal({ type: 'ai-insight', recommendation: rec as AIRecommendation })}
                  className="glass-card p-6 hover:border-[rgba(139,115,85,0.35)] group/rec cursor-pointer relative overflow-hidden"
                >
                  {/* Entry shimmer */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(139,115,85,0.03) 50%, transparent 60%)' }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ delay: 0.3 + idx * 0.1, duration: 0.8, ease: 'easeOut' }}
                  />
                  <div className="flex items-start gap-5 relative">
                    <motion.div
                      className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 group-hover/rec:scale-110"
                      style={{ background: colors.bg, border: `1px solid ${colors.border}`, boxShadow: `0 4px 12px ${colors.glow}` }}
                      initial={{ scale: 0, rotate: -15 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: idx * 0.08 + 0.1, type: 'spring', stiffness: 300 }}
                    >
                      <span style={{ color: colors.text }}>{recIcon(rec.type)}</span>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h4 className="text-base font-bold text-[var(--fg)] tracking-tight">{rec.title}</h4>
                        <Badge variant={rec.priority === 'high' ? 'success' : rec.priority === 'medium' ? 'default' : 'secondary'} className="capitalize">{rec.priority}</Badge>
                      </div>
                      <p className="text-sm text-[var(--fg-secondary)] leading-[1.6]">{rec.description}</p>
                      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-[var(--border-light)]">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-[rgba(74,222,128,0.06)] flex items-center justify-center"><DollarSign className="h-3.5 w-3.5 text-[#4ADE80]" /></div>
                          <span className="text-sm font-bold text-[#4ADE80]">{rec.impact}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center"><Shield className="h-3.5 w-3.5 text-[var(--fg-muted)]" /></div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-[#8B7355]"
                                initial={{ width: 0 }}
                                animate={{ width: `${rec.confidence}%` }}
                                transition={{ delay: idx * 0.08 + 0.4, duration: 0.6 }}
                              />
                            </div>
                            <span className="text-xs text-[var(--fg-secondary)] font-semibold tabular-nums">{rec.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setModal({ type: 'ai-insight', recommendation: rec as AIRecommendation })} className="outline-none shrink-0 h-10 w-10 rounded-xl bg-[rgba(255,255,255,0.6)] border border-[rgba(255,255,255,0.4)] flex items-center justify-center text-[var(--fg-muted)] hover:text-white hover:border-[rgba(139,115,85,0.3)] hover:bg-[#8B7355] transition-all duration-200 cursor-pointer focus-visible:ring-[3px] focus-visible:ring-[rgba(139,115,85,0.25)]">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════
          MODAL DIALOG
         ════════════════════════════════════════════ */}
      <Dialog open={modal.type !== 'closed'} onClose={closeModal} size={getModalSize(modal)}>
        <ModalContent state={modal} onClose={closeModal} />
      </Dialog>

    </PageContainer>
  );
}
