'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Dialog } from '@/components/ui/dialog';
import { PageContainer } from '@/components/layout/page-container';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  DollarSign, Percent, Clock, TrendingUp,
  Building2, Sparkles, Shield, Activity, Heart, Target,
  Download, Save, ArrowRight, Scale, ChevronDown, ChevronUp, AlertTriangle,
  CreditCard, BarChart3, Wallet, BanknoteArrowDown,
  Home, Briefcase, Building, Key, CheckCircle2,
  Phone, FileText,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   CALCULATIONS
   ══════════════════════════════════════════════════════════ */

function calculateEMI(principal: number, annualRate: number, tenureMonths: number) {
  if (!principal || !annualRate || !tenureMonths) return 0;
  const r = annualRate / 100 / 12;
  const n = tenureMonths;
  return Math.round((principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
}

function buildFullAmortization(principal: number, annualRate: number, emi: number, months: number) {
  let balance = principal;
  const monthlyRate = annualRate / 100 / 12;
  const schedule = [];
  for (let i = 0; i < months; i++) {
    const interest = Math.round(balance * monthlyRate);
    const principalPaid = Math.round(Math.min(emi - interest, balance));
    balance = Math.max(0, balance - principalPaid);
    const equityPct = principal > 0 ? Math.round(((principal - balance) / principal) * 100) : 0;
    schedule.push({ month: i + 1, principal: principalPaid, interest, balance, equityPct });
  }
  return schedule;
}

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n.toLocaleString()}`;
}
function fmtFull(n: number) { return `₹${n.toLocaleString()}`; }

/* ══════════════════════════════════════════════════════════
   PRESETS
   ══════════════════════════════════════════════════════════ */

const SCENARIOS = [
  { label: 'Luxury Villa', price: 5_000_000, down: 25, rate: 4.25, tenure: 300, rent: 32_000, icon: Home, color: '#8B7355' },
  { label: 'Rental Apt', price: 1_500_000, down: 20, rate: 5.0, tenure: 240, rent: 8_500, icon: Key, color: '#4ADE80' },
  { label: 'Commercial', price: 3_000_000, down: 30, rate: 5.5, tenure: 180, rent: 18_000, icon: Briefcase, color: '#8B7355' },
  { label: 'Starter', price: 500_000, down: 20, rate: 4.75, tenure: 300, rent: 3_200, icon: Building, color: '#F59E0B' },
];

const BANKS = [
  { name: 'HSBC Premier', rate: 4.25, maxLTV: 80, processingFee: 1.0, bestFor: 'Premium clients' },
  { name: 'Standard Chartered', rate: 4.50, maxLTV: 75, processingFee: 1.0, bestFor: 'Expat buyers' },
  { name: 'Emirates NBD', rate: 4.75, maxLTV: 80, processingFee: 0.5, bestFor: 'UAE nationals' },
  { name: 'ADCB Private', rate: 4.10, maxLTV: 70, processingFee: 1.25, bestFor: 'Low rates' },
];

/* ══════════════════════════════════════════════════════════
   COMPACT SLIDER  (label | track | value — single row)
   ══════════════════════════════════════════════════════════ */

function CompactSlider({
  label, value, onChange, min, max, step, formatValue, icon: Icon,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number;
  formatValue: (v: number) => string;
  icon: React.ElementType;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-[rgba(139,115,85,0.06)] flex items-center justify-center">
            <Icon className="h-3 w-3 text-[#8B7355]" strokeWidth={2} />
          </div>
          <span className="text-[11px] font-semibold text-[var(--fg-secondary)]">{label}</span>
        </div>
        <span className="text-xs font-bold text-[var(--fg)] tabular-nums">{formatValue(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--bg-tertiary)] accent-[#8B7355]"
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HEALTH SCORE RING
   ══════════════════════════════════════════════════════════ */

function HealthScoreRing({ score, size = 72, strokeWidth = 6 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#4ADE80' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}30)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-extrabold tracking-tight tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[7px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.1em]">/100</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CHART TOOLTIPS
   ══════════════════════════════════════════════════════════ */

function PremiumTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <p className="text-[9px] font-semibold text-[var(--fg-muted)] uppercase tracking-[0.08em] mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: entry.color }} />
              <span className="text-[var(--fg-secondary)] font-medium">{entry.name}</span>
            </span>
            <span className="font-bold text-[var(--fg)] tabular-nums">{fmtFull(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieTooltipContent({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.4)] backdrop-blur-md">
      <p className="text-[12px] font-bold text-[var(--fg)]">{d.name}</p>
      <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 tabular-nums">{fmtFull(d.value)}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */

export default function EMICalculatorPage() {
  const [propertyPrice, setPropertyPrice] = useState(3_000_000);
  const [downPaymentPct, setDownPaymentPct] = useState(25);
  const [interestRate, setInterestRate] = useState(4.5);
  const [tenure, setTenure] = useState(240);
  const [monthlyRent, setMonthlyRent] = useState(18_000);
  const [vacancyPct, setVacancyPct] = useState(5);
  const [appreciationPct, setAppreciationPct] = useState(5);
  const [serviceCharges, setServiceCharges] = useState(2_000);
  const [closingCostPct, setClosingCostPct] = useState(4);
  const [stressOpen, setStressOpen] = useState(false);
  const [amortOpen, setAmortOpen] = useState(false);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'save' | 'compare' | 'export' | 'banker' | 'apply' | 'portfolio'>('save');
  const [inputTab, setInputTab] = useState<'basic' | 'advanced' | 'rental'>('basic');
  const [chartTab, setChartTab] = useState<'cashflow' | 'equity' | 'balance' | 'split'>('cashflow');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  /* ── Derived ── */
  const downPayment = Math.round(propertyPrice * (downPaymentPct / 100));
  const loanAmount = propertyPrice - downPayment;
  const closingCosts = Math.round(propertyPrice * (closingCostPct / 100));
  const cashInvested = downPayment + closingCosts;

  const emi = useMemo(() => calculateEMI(loanAmount, interestRate, tenure), [loanAmount, interestRate, tenure]);
  const totalPayable = emi * tenure;
  const totalInterest = totalPayable - loanAmount;
  const interestPct = loanAmount > 0 ? Math.round((totalInterest / totalPayable) * 100) : 0;

  const effectiveRent = Math.round(monthlyRent * (1 - vacancyPct / 100));
  const netMonthlyCashFlow = effectiveRent - emi - serviceCharges;
  const annualNetIncome = netMonthlyCashFlow * 12;
  const annualROI = cashInvested > 0 ? +((annualNetIncome / cashInvested) * 100).toFixed(1) : 0;
  const breakEvenYears = annualNetIncome > 0 ? +(cashInvested / annualNetIncome).toFixed(1) : 0;
  const ltv = propertyPrice > 0 ? Math.round((loanAmount / propertyPrice) * 100) : 0;

  const amortization = useMemo(
    () => buildFullAmortization(loanAmount, interestRate, emi, tenure),
    [loanAmount, interestRate, emi, tenure],
  );
  const month60 = amortization[Math.min(59, amortization.length - 1)];
  const appreciatedValue = Math.round(propertyPrice * Math.pow(1 + appreciationPct / 100, 5));
  const equityAfter5 = appreciatedValue - (month60?.balance ?? loanAmount);

  const healthScore = useMemo(() => {
    const ltvS = ltv <= 60 ? 25 : ltv <= 70 ? 20 : ltv <= 80 ? 12 : 5;
    const cfS = netMonthlyCashFlow > 10000 ? 25 : netMonthlyCashFlow > 5000 ? 20 : netMonthlyCashFlow > 0 ? 12 : 0;
    const roiS = annualROI > 8 ? 20 : annualROI > 5 ? 15 : annualROI > 0 ? 8 : 0;
    const rateS = interestRate < 4.0 ? 15 : interestRate < 4.5 ? 12 : interestRate < 5.5 ? 8 : 3;
    const debtS = emi > 0 && effectiveRent > 0 ? (effectiveRent / emi >= 1.5 ? 15 : effectiveRent / emi >= 1.2 ? 12 : effectiveRent / emi >= 1 ? 8 : 3) : 5;
    return Math.min(100, ltvS + cfS + roiS + rateS + debtS);
  }, [ltv, netMonthlyCashFlow, annualROI, interestRate, emi, effectiveRent]);

  const healthBreakdown = useMemo(() => [
    { label: 'LTV Risk', score: ltv <= 60 ? 25 : ltv <= 70 ? 20 : ltv <= 80 ? 12 : 5, max: 25, color: '#4ADE80' },
    { label: 'Cash Flow', score: netMonthlyCashFlow > 10000 ? 25 : netMonthlyCashFlow > 5000 ? 20 : netMonthlyCashFlow > 0 ? 12 : 0, max: 25, color: '#8B7355' },
    { label: 'ROI Quality', score: annualROI > 8 ? 20 : annualROI > 5 ? 15 : annualROI > 0 ? 8 : 0, max: 20, color: '#8B7355' },
    { label: 'Rate Efficiency', score: interestRate < 4.0 ? 15 : interestRate < 4.5 ? 12 : interestRate < 5.5 ? 8 : 3, max: 15, color: '#F59E0B' },
    { label: 'Debt Safety', score: emi > 0 && effectiveRent > 0 ? (effectiveRent / emi >= 1.5 ? 15 : effectiveRent / emi >= 1.2 ? 12 : effectiveRent / emi >= 1 ? 8 : 3) : 5, max: 15, color: '#A89478' },
  ], [ltv, netMonthlyCashFlow, annualROI, interestRate, emi, effectiveRent]);

  const emiSplitData = [
    { name: 'Principal', value: loanAmount, color: '#4ADE80' },
    { name: 'Interest', value: totalInterest, color: '#8B7355' },
  ];

  const equityGrowthData = useMemo(() => {
    const data = [];
    for (let y = 0; y <= Math.min(tenure / 12, 25); y++) {
      const idx = Math.min(y * 12 - 1, amortization.length - 1);
      const paidOff = y === 0 ? downPayment : downPayment + (loanAmount - (amortization[Math.max(0, idx)]?.balance ?? loanAmount));
      const propVal = Math.round(propertyPrice * Math.pow(1 + appreciationPct / 100, y));
      data.push({ year: `Y${y}`, equity: paidOff + (propVal - propertyPrice), propertyValue: propVal });
    }
    return data;
  }, [amortization, downPayment, loanAmount, propertyPrice, appreciationPct, tenure]);

  const cashFlowProjection = useMemo(() => {
    const data = [];
    for (let y = 1; y <= 10; y++) {
      const rent = Math.round(effectiveRent * Math.pow(1.03, y - 1)) * 12;
      const emiAnnual = y * 12 <= tenure ? emi * 12 : 0;
      const expenses = serviceCharges * 12;
      data.push({ year: `Y${y}`, income: rent, emi: emiAnnual, net: rent - emiAnnual - expenses });
    }
    return data;
  }, [effectiveRent, emi, tenure, serviceCharges]);

  const loanDeclineData = useMemo(() => {
    const data = [];
    for (let y = 0; y <= Math.min(tenure / 12, 25); y++) {
      const idx = Math.min(y * 12 - 1, amortization.length - 1);
      const bal = y === 0 ? loanAmount : (amortization[Math.max(0, idx)]?.balance ?? 0);
      data.push({ year: `Y${y}`, balance: bal });
    }
    return data;
  }, [amortization, loanAmount, tenure]);

  const stressTests = useMemo(() => {
    return [
      { label: 'Rate +1%', rate: interestRate + 1, rent: effectiveRent },
      { label: 'Rate +2%', rate: interestRate + 2, rent: effectiveRent },
      { label: 'Rent −10%', rate: interestRate, rent: Math.round(effectiveRent * 0.9) },
      { label: 'Vacancy +15%', rate: interestRate, rent: Math.round(monthlyRent * (1 - (vacancyPct + 15) / 100)) },
    ].map((t) => {
      const newEmi = calculateEMI(loanAmount, t.rate, tenure);
      const newCf = t.rent - newEmi - serviceCharges;
      const newRoi = cashInvested > 0 ? +((newCf * 12 / cashInvested) * 100).toFixed(1) : 0;
      return { ...t, emi: newEmi, cashFlow: newCf, roi: newRoi };
    });
  }, [interestRate, effectiveRent, monthlyRent, vacancyPct, loanAmount, tenure, serviceCharges, cashInvested]);

  const recommendations = useMemo(() => {
    const recs: { id: string; icon: React.ElementType; priority: 'high' | 'medium' | 'low'; title: string; desc: string; impact: string }[] = [];
    if (downPaymentPct < 30 && ltv > 70)
      recs.push({ id: 'r1', icon: Target, priority: 'high', title: 'Increase down payment to 30%', desc: `Reduces LTV to 70%, saving ~${fmtFull(Math.round(totalInterest * 0.12))} in total interest.`, impact: `-${fmt(Math.round(totalInterest * 0.12))}` });
    if (tenure > 240)
      recs.push({ id: 'r2', icon: Clock, priority: 'medium', title: '20-year tenure is optimal', desc: 'Shorter tenure significantly reduces total interest while keeping EMI manageable.', impact: 'Better ROI' });
    if (interestRate > 4.5)
      recs.push({ id: 'r3', icon: BanknoteArrowDown, priority: 'high', title: 'Refinance recommended after year 3', desc: `At ${interestRate}%, you qualify for 4.0–4.25% after 3 years of repayment history.`, impact: `-${(interestRate - 4.25).toFixed(2)}% rate` });
    const dscr = emi > 0 ? +(effectiveRent / emi).toFixed(1) : 0;
    if (dscr >= 1.2)
      recs.push({ id: 'r4', icon: Shield, priority: 'low', title: `DSCR ${dscr}x — ${dscr >= 1.5 ? 'Healthy' : 'Adequate'}`, desc: `Rent covers EMI by ${dscr}x. ${dscr >= 1.5 ? 'Excellent safety margin.' : 'Target 1.5x+ for maximum safety.'}`, impact: `${dscr}x` });
    recs.push({ id: 'r5', icon: Sparkles, priority: healthScore >= 80 ? 'low' : healthScore >= 60 ? 'medium' : 'high', title: `Deal scores ${healthScore}/100`, desc: healthScore >= 80 ? 'Excellent structure — strong cash flow and competitive rate.' : healthScore >= 60 ? 'Moderate. Improve down payment or negotiate rate.' : 'Needs improvement. LTV or cash flow below thresholds.', impact: `${healthScore}/100` });
    return recs;
  }, [downPaymentPct, ltv, tenure, interestRate, effectiveRent, emi, healthScore, totalInterest]);

  const bankComparison = useMemo(() => {
    const bestRate = Math.min(...BANKS.map(b => b.rate));
    return BANKS.map((bank) => {
      const bankEmi = calculateEMI(loanAmount, bank.rate, tenure);
      const bankTotalInterest = bankEmi * tenure - loanAmount;
      return { ...bank, emi: bankEmi, totalInterest: bankTotalInterest, isBest: bank.rate === bestRate };
    });
  }, [loanAmount, tenure]);

  function loadScenario(s: typeof SCENARIOS[number]) {
    setPropertyPrice(s.price); setDownPaymentPct(s.down);
    setInterestRate(s.rate); setTenure(s.tenure); setMonthlyRent(s.rent);
  }
  function openModal(type: typeof modalType) { setModalType(type); setModalOpen(true); }

  const tenureYears = Math.floor(tenure / 12);
  const healthLabel = healthScore >= 90 ? 'Excellent' : healthScore >= 80 ? 'Good' : healthScore >= 60 ? 'Moderate' : 'Risky';
  const healthColor = healthScore >= 80 ? '#4ADE80' : healthScore >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <PageContainer className="space-y-5 pb-32">

      {/* ═══ HERO HEADER ═══ */}
      <div className="premium-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">EMI Calculator</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(74,222,128,0.06)] border border-[rgba(74,222,128,0.12)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                <span className="text-[10px] font-semibold text-[#4ADE80]">AI Active</span>
              </div>
            </div>
            <p className="text-sm text-[var(--fg-secondary)]">Model leverage, returns & financing scenarios</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-[var(--fg-muted)]">
              <span><strong className="text-[var(--fg)]">{fmtFull(emi)}</strong> Monthly EMI</span>
              <span className="h-3 w-px bg-[var(--border)]" />
              <span><strong style={{ color: ltv <= 70 ? '#4ADE80' : '#F59E0B' }}>{ltv}%</strong> LTV</span>
              <span className="h-3 w-px bg-[var(--border)]" />
              <span><strong style={{ color: annualROI > 5 ? '#4ADE80' : '#F59E0B' }}>{annualROI}%</strong> Annual ROI</span>
              <span className="h-3 w-px bg-[var(--border)]" />
              <span><strong style={{ color: healthColor }}>{healthScore}/100</strong> Score</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <HealthScoreRing score={healthScore} size={64} strokeWidth={5} />
            <div className="text-right">
              <p className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Health</p>
              <p className="text-sm font-extrabold mt-0.5" style={{ color: healthColor }}>{healthLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SCENARIO PRESET CARDS ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SCENARIOS.map((s) => {
          const isActive = propertyPrice === s.price && interestRate === s.rate;
          return (
            <button
              key={s.label}
              onClick={() => loadScenario(s)}
              className="group relative rounded-2xl border bg-[var(--card-bg)] p-4 text-left cursor-pointer transition-all duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 active:translate-y-0 shadow-[var(--shadow-card)]"
              style={{
                borderColor: isActive ? `${s.color}50` : 'var(--border)',
                boxShadow: isActive ? `0 0 0 1px ${s.color}30, 0 4px 16px ${s.color}12` : undefined,
              }}
            >
              {isActive && <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.color }} />}
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}20` }}
              >
                <s.icon className="h-4.5 w-4.5" style={{ color: s.color }} />
              </div>
              <p className="text-sm font-bold text-[var(--fg)] leading-tight">{s.label}</p>
              <p className="text-xs tabular-nums mt-1 font-semibold" style={{ color: s.color }}>{fmt(s.price)}</p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{s.rate}% · {s.tenure / 12}yr</p>
            </button>
          );
        })}
      </div>

      {/* ═══ INPUT PANEL + HERO RESULTS ═══ */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* LEFT — TABBED INPUT */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, #8B7355 50%, transparent 100%)' }} />
          <div className="p-5">

          {/* Tab switcher */}
          <div className="flex gap-1 mb-5 p-1 rounded-xl bg-[var(--bg-secondary)]">
            {(['basic', 'advanced', 'rental'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setInputTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer capitalize ${
                  inputTab === tab
                    ? 'bg-[var(--bg-elevated)] text-[#8B7355] shadow-sm'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Loan amount chip */}
          <div className="flex items-center justify-between mb-5 rounded-xl bg-[rgba(139,115,85,0.04)] border border-[rgba(139,115,85,0.12)] px-4 py-3">
            <span className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Loan Amount</span>
            <span className="text-base font-extrabold text-[var(--fg)] tabular-nums">{fmtFull(loanAmount)}</span>
          </div>

          <div className="space-y-5">
            {inputTab === 'basic' && (<>
              <CompactSlider label="Property Price" value={propertyPrice} onChange={setPropertyPrice} min={200_000} max={50_000_000} step={100_000} formatValue={fmtFull} icon={Building2} />
              <CompactSlider label="Down Payment" value={downPaymentPct} onChange={setDownPaymentPct} min={5} max={60} step={1} formatValue={(v) => `${v}% · ${fmt(Math.round(propertyPrice * v / 100))}`} icon={Wallet} />
              <CompactSlider label="Interest Rate" value={interestRate} onChange={setInterestRate} min={2} max={12} step={0.05} formatValue={(v) => `${v.toFixed(2)}%`} icon={Percent} />
              <CompactSlider label="Loan Tenure" value={tenure} onChange={setTenure} min={12} max={360} step={12} formatValue={(v) => `${Math.floor(v / 12)}yr`} icon={Clock} />
            </>)}

            {inputTab === 'advanced' && (<>
              <CompactSlider label="Closing Costs" value={closingCostPct} onChange={setClosingCostPct} min={0} max={8} step={0.5} formatValue={(v) => `${v}% · ${fmt(Math.round(propertyPrice * v / 100))}`} icon={CreditCard} />
              <CompactSlider label="Appreciation" value={appreciationPct} onChange={setAppreciationPct} min={0} max={15} step={0.5} formatValue={(v) => `${v}% p.a.`} icon={TrendingUp} />
              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-3 space-y-2">
                {([['Cash Invested', fmtFull(cashInvested), ''], ['Closing Costs', fmtFull(closingCosts), ''], ['Equity @ 5yr', fmt(equityAfter5), '#4ADE80']] as [string, string, string][]).map(([k, v, c]) => (
                  <div key={k} className="flex justify-between items-center text-[11px]">
                    <span className="text-[var(--fg-muted)]">{k}</span>
                    <span className="font-bold tabular-nums" style={{ color: c || 'var(--fg)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </>)}

            {inputTab === 'rental' && (<>
              <CompactSlider label="Monthly Rent" value={monthlyRent} onChange={setMonthlyRent} min={0} max={100_000} step={500} formatValue={fmtFull} icon={DollarSign} />
              <CompactSlider label="Vacancy Rate" value={vacancyPct} onChange={setVacancyPct} min={0} max={30} step={1} formatValue={(v) => `${v}%`} icon={Activity} />
              <CompactSlider label="Service Charges" value={serviceCharges} onChange={setServiceCharges} min={0} max={20_000} step={500} formatValue={fmtFull} icon={FileText} />
              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-3 space-y-2">
                {([
                  ['Effective Rent', fmtFull(effectiveRent), ''],
                  ['Net Cash Flow', `${netMonthlyCashFlow >= 0 ? '+' : ''}${fmtFull(netMonthlyCashFlow)}`, netMonthlyCashFlow >= 0 ? '#4ADE80' : '#EF4444'],
                  ['Annual ROI', `${annualROI}%`, annualROI > 5 ? '#4ADE80' : annualROI > 0 ? '#F59E0B' : '#EF4444'],
                ] as [string, string, string][]).map(([k, v, c]) => (
                  <div key={k} className="flex justify-between items-center text-[11px]">
                    <span className="text-[var(--fg-muted)]">{k}</span>
                    <span className="font-bold tabular-nums" style={{ color: c || 'var(--fg)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </>)}
          </div>
          </div>{/* /p-5 */}
        </div>

        {/* RIGHT — HERO RESULTS */}
        <div className="lg:col-span-3 space-y-4">

          {/* EMI Command Center */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, #6F5C46 0%, #A89478 40%, #E2BF6A 100%)' }} />
            <div className="p-6">
              <div className="mb-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--fg-muted)] mb-1.5">Monthly EMI</p>
                <p className="text-[42px] font-extrabold text-[var(--fg)] tracking-[-0.03em] leading-none tabular-nums">{fmtFull(emi)}</p>
                <p className="text-xs text-[var(--fg-muted)] mt-2">{tenureYears}yr · {interestRate}% p.a. · {fmtFull(loanAmount)} loan</p>
              </div>

              {/* 6-KPI grid */}
              <div className="grid grid-cols-3 gap-3">
                {([
                  ['Total Interest', fmt(totalInterest), '#8B7355', DollarSign],
                  ['Total Payable', fmt(totalPayable), '#8B7355', CreditCard],
                  ['Cash Invested', fmt(cashInvested), '#F59E0B', Wallet],
                  ['Net Cash Flow', `${netMonthlyCashFlow >= 0 ? '+' : ''}${fmtFull(netMonthlyCashFlow)}`, netMonthlyCashFlow >= 0 ? '#4ADE80' : '#EF4444', TrendingUp],
                  ['Annual ROI', `${annualROI}%`, annualROI > 5 ? '#4ADE80' : annualROI > 0 ? '#F59E0B' : '#EF4444', Percent],
                  ['LTV Ratio', `${ltv}%`, ltv <= 60 ? '#4ADE80' : ltv <= 75 ? '#F59E0B' : '#EF4444', Shield],
                ] as [string, string, string, React.ElementType][]).map(([label, value, color, Icon]) => (
                  <div key={label} className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-3.5 relative overflow-hidden group hover:border-[rgba(139,115,85,0.2)] transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: `${color}10` }}>
                        <Icon className="h-3 w-3" style={{ color }} />
                      </div>
                      <p className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide">{label}</p>
                    </div>
                    <p className="text-lg font-extrabold tabular-nums tracking-tight" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3 secondary KPI cards */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: 'Break-Even', value: breakEvenYears > 0 ? `${breakEvenYears}yr` : 'N/A', sub: 'Full investment return', color: breakEvenYears > 0 && breakEvenYears < 10 ? '#4ADE80' : '#F59E0B', icon: Target },
              { label: 'Equity @ 5yr', value: fmt(equityAfter5), sub: `${appreciationPct}% annual appreciation`, color: '#4ADE80', icon: TrendingUp },
              { label: 'Principal Paid', value: fmt(loanAmount - (month60?.balance ?? loanAmount)), sub: 'First 5 years of payments', color: '#8B7355', icon: Wallet },
            ]).map((kpi) => (
              <div key={kpi.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)] overflow-hidden relative group hover:border-[rgba(139,115,85,0.2)] transition-all">
                <div className="absolute top-0 right-0 h-16 w-16 rounded-full blur-2xl opacity-60" style={{ background: `${kpi.color}15` }} />
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}10`, border: `1px solid ${kpi.color}20` }}>
                    <kpi.icon className="h-4 w-4" style={{ color: kpi.color }} />
                  </div>
                  <p className="text-[10px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide">{kpi.label}</p>
                </div>
                <p className="text-2xl font-extrabold tabular-nums tracking-tight" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Health breakdown */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-7 w-7 rounded-lg bg-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.15)] flex items-center justify-center">
                <Heart className="h-3.5 w-3.5 text-[#8B7355]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--fg)]">Health Breakdown</p>
                <p className="text-[10px] text-[var(--fg-muted)]">Investment score components</p>
              </div>
            </div>
            <div className="space-y-3">
              {healthBreakdown.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-[110px] shrink-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-[11px] text-[var(--fg-secondary)] font-medium">{item.label}</span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.score / item.max) * 100}%`, background: `linear-gradient(90deg, ${item.color}aa, ${item.color})` }} />
                  </div>
                  <span className="text-[11px] font-bold tabular-nums w-[40px] text-right shrink-0" style={{ color: item.color }}>{item.score}/{item.max}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TABBED ANALYTICS ═══ */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[var(--border)]">
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-secondary)]">
            {([
              { key: 'cashflow', label: 'Cash Flow' },
              { key: 'equity', label: 'Equity' },
              { key: 'balance', label: 'Loan Balance' },
              { key: 'split', label: 'Split' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setChartTab(tab.key)}
                className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  chartTab === tab.key
                    ? 'bg-[var(--bg-elevated)] text-[#8B7355] shadow-sm'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[var(--fg-muted)] hidden sm:block">
            {chartTab === 'cashflow' && 'Rental income vs EMI · 10yr projection'}
            {chartTab === 'equity' && 'Ownership builds over time'}
            {chartTab === 'balance' && 'Outstanding loan amount decline'}
            {chartTab === 'split' && 'Principal vs interest over lifetime'}
          </p>
        </div>
        <div className="p-5">

        {chartTab === 'cashflow' && (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cashFlowProjection} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={52} />
              <Tooltip content={<PremiumTooltip />} wrapperStyle={{ outline: 'none', border: 'none' }} />
              <Bar dataKey="income" name="Income" fill="#4ADE80" radius={[4, 4, 0, 0]} />
              <Bar dataKey="emi" name="EMI" fill="#8B7355" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {chartTab === 'equity' && (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={equityGrowthData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={52} />
              <Tooltip content={<PremiumTooltip />} wrapperStyle={{ outline: 'none', border: 'none' }} />
              <Area type="monotone" dataKey="equity" name="Equity" stroke="#4ADE80" fill="url(#eqFill)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartTab === 'balance' && (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={loanDeclineData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
              <defs>
                <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B7355" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#8B7355" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(v)} width={52} />
              <Tooltip content={<PremiumTooltip />} wrapperStyle={{ outline: 'none', border: 'none' }} />
              <Area type="monotone" dataKey="balance" name="Balance" stroke="#8B7355" fill="url(#balFill)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {chartTab === 'split' && (
          <div className="flex items-center gap-8">
            <div className="w-[45%] shrink-0">
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={emiSplitData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none" paddingAngle={2}>
                    {emiSplitData.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
                  </Pie>
                  <Tooltip content={<PieTooltipContent />} wrapperStyle={{ outline: 'none', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-4">
              {([
                ['Principal', fmtFull(loanAmount), `${100 - interestPct}%`, '#4ADE80'],
                ['Total Interest', fmtFull(totalInterest), `${interestPct}%`, '#8B7355'],
                ['Total Payable', fmtFull(totalPayable), '100%', 'var(--fg)'],
              ] as [string, string, string, string][]).map(([label, value, pct, color]) => (
                <div key={label}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-[11px] text-[var(--fg-muted)] font-medium">{label}</span>
                    <span className="text-[10px] text-[var(--fg-muted)] ml-auto">{pct}</span>
                  </div>
                  <p className="text-[15px] font-extrabold tabular-nums pl-4" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>{/* /p-5 */}
      </div>

      {/* ═══ LOAN COMPARISON + STRESS TESTS ═══ */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Compact bank cards */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded-xl bg-[rgba(139,115,85,0.08)] flex items-center justify-center">
              <Scale className="h-4 w-4 text-[#8B7355]" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[var(--fg)]">Loan Comparison</h3>
              <p className="text-[10px] text-[var(--fg-muted)]">{fmtFull(loanAmount)} · {tenureYears}yr tenure</p>
            </div>
          </div>
          <div className="space-y-2">
            {bankComparison.map((bank) => (
              <div
                key={bank.name}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all"
                style={{
                  borderColor: bank.isBest ? 'rgba(74,222,128,0.2)' : 'var(--border)',
                  background: bank.isBest ? 'rgba(74,222,128,0.02)' : 'transparent',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-[var(--fg)]">{bank.name}</span>
                    {bank.isBest && (
                      <span className="text-[8px] font-bold text-[#4ADE80] bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.15)] px-1.5 py-0.5 rounded-full">BEST</span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--fg-muted)]">{bank.bestFor} · {bank.maxLTV}% LTV · {bank.processingFee}% fee</span>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-extrabold tabular-nums" style={{ color: bank.isBest ? '#4ADE80' : 'var(--fg)' }}>{bank.rate}%</p>
                  <p className="text-[10px] text-[var(--fg-muted)] tabular-nums">{fmtFull(bank.emi)}/mo</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stress test accordion */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
          <button
            onClick={() => setStressOpen(!stressOpen)}
            className="flex items-center justify-between w-full mb-3 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-[rgba(245,158,11,0.08)] flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-[var(--fg)]">Stress Tests</h3>
                <p className="text-[10px] text-[var(--fg-muted)]">Baseline: {fmtFull(emi)}/mo</p>
              </div>
            </div>
            {stressOpen ? <ChevronUp className="h-4 w-4 text-[var(--fg-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--fg-muted)]" />}
          </button>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {([
              ['EMI', fmtFull(emi), 'var(--fg)'],
              ['Cash Flow', `${netMonthlyCashFlow >= 0 ? '+' : ''}${fmtFull(netMonthlyCashFlow)}`, netMonthlyCashFlow >= 0 ? '#4ADE80' : '#EF4444'],
              ['ROI', `${annualROI}%`, annualROI > 5 ? '#4ADE80' : annualROI > 0 ? '#F59E0B' : '#EF4444'],
            ] as [string, string, string][]).map(([label, value, color]) => (
              <div key={label} className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-2.5 text-center">
                <p className="text-[8px] text-[var(--fg-muted)] uppercase tracking-wide font-medium mb-1">{label}</p>
                <p className="text-[12px] font-extrabold tabular-nums" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
          {stressOpen && (
            <div className="space-y-2 border-t border-[var(--border)] pt-3">
              {stressTests.map((test) => (
                <div key={test.label} className="flex items-center gap-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] px-3 py-2.5">
                  <span className="text-[11px] font-bold text-[var(--fg)] w-[82px] shrink-0">{test.label}</span>
                  <div className="flex flex-1 items-center justify-between gap-2 text-[10px]">
                    <div className="text-center">
                      <p className="text-[var(--fg-muted)]">EMI</p>
                      <p className="font-bold text-[var(--fg)] tabular-nums">{fmtFull(test.emi)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[var(--fg-muted)]">Cash Flow</p>
                      <p className="font-bold tabular-nums" style={{ color: test.cashFlow >= 0 ? '#4ADE80' : '#EF4444' }}>{test.cashFlow >= 0 ? '+' : ''}{fmtFull(test.cashFlow)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[var(--fg-muted)]">ROI</p>
                      <p className="font-bold tabular-nums" style={{ color: test.roi > 0 ? '#4ADE80' : '#EF4444' }}>{test.roi}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ AI INSIGHT CHIPS ═══ */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="h-8 w-8 rounded-xl bg-[rgba(139,115,85,0.08)] flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-[#8B7355]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--fg)]">AI Insights</h3>
            <p className="text-[10px] text-[var(--fg-muted)]">Recommendations based on your scenario</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {recommendations.map((rec) => {
            const c = rec.priority === 'high'
              ? { bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.15)', text: '#4ADE80' }
              : rec.priority === 'medium'
                ? { bg: 'rgba(139,115,85,0.06)', border: 'rgba(139,115,85,0.15)', text: '#8B7355' }
                : { bg: 'rgba(107,114,128,0.06)', border: 'rgba(107,114,128,0.12)', text: 'var(--fg-muted)' };
            return (
              <div
                key={rec.id}
                className="group relative rounded-xl border px-3 py-2 flex items-center gap-2 cursor-default transition-all hover:shadow-sm"
                style={{ background: c.bg, borderColor: c.border }}
              >
                <rec.icon className="h-3 w-3 shrink-0" style={{ color: c.text }} />
                <span className="text-[11px] font-semibold" style={{ color: c.text }}>{rec.title}</span>
                <span className="text-[10px] text-[var(--fg-muted)] font-medium">· {rec.impact}</span>
                <div className="absolute bottom-full left-0 mb-2 z-20 w-[230px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.3)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-[11px] font-bold text-[var(--fg)] mb-1">{rec.title}</p>
                  <p className="text-[11px] text-[var(--fg-secondary)] leading-relaxed">{rec.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ AMORTIZATION ACCORDION ═══ */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-[var(--shadow-card)] overflow-hidden">
        <button
          onClick={() => setAmortOpen(!amortOpen)}
          className="flex items-center justify-between w-full px-5 py-4 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[rgba(139,115,85,0.08)] flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-[#8B7355]" />
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-[var(--fg)]">Amortization Schedule</span>
              <p className="text-[10px] text-[var(--fg-muted)]">{amortization.length} months · {tenureYears} years</p>
            </div>
          </div>
          {amortOpen ? <ChevronUp className="h-4 w-4 text-[var(--fg-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--fg-muted)]" />}
        </button>

        {amortOpen && (
          <div className="border-t border-[var(--border)]">
            <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 z-10 bg-[var(--bg-secondary)]">
                  <tr className="border-b border-[var(--border)]">
                    {['Month', 'EMI', 'Principal', 'Interest', 'Balance', 'Equity'].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[9px] font-semibold text-[var(--fg-muted)] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(showAllMonths ? amortization : amortization.slice(0, 24)).map((row) => (
                    <tr key={row.month} className="border-b border-[var(--border-light)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="px-4 py-2 font-medium text-[var(--fg)]">M{row.month}</td>
                      <td className="px-4 py-2 tabular-nums text-[var(--fg)]">{fmtFull(emi)}</td>
                      <td className="px-4 py-2 tabular-nums text-[#4ADE80]">{fmtFull(row.principal)}</td>
                      <td className="px-4 py-2 tabular-nums text-[var(--fg-secondary)]">{fmtFull(row.interest)}</td>
                      <td className="px-4 py-2 tabular-nums font-semibold text-[var(--fg)]">{fmtFull(row.balance)}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <div className="h-1 w-10 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                            <div className="h-full rounded-full bg-[#8B7355]" style={{ width: `${row.equityPct}%` }} />
                          </div>
                          <span className="tabular-nums text-[var(--fg-muted)]">{row.equityPct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!showAllMonths && amortization.length > 24 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
                <p className="text-[10px] text-[var(--fg-muted)]">Showing 24 of {amortization.length} months</p>
                <button onClick={() => setShowAllMonths(true)} className="text-[10px] font-semibold text-[#8B7355] hover:text-[var(--fg)] transition-colors cursor-pointer">Show all →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ PREMIUM COMMAND DOCK (portal — truly fixed to viewport) ═══ */}
      {mounted && createPortal(
        <div
          className="fixed bottom-0 right-0 z-50 pointer-events-none lg:left-[var(--spacing-sidebar)] left-0"
          role="toolbar"
          aria-label="Loan command dock"
        >
          <div
            className="pointer-events-auto mx-3 mb-3 lg:mx-5 lg:mb-4"
            style={{ animation: 'dockSlideUp 0.55s cubic-bezier(0.16,1,0.3,1) 0.15s both' }}
          >
            <div
              className="rounded-2xl overflow-hidden max-w-7xl mx-auto"
              style={{
                background: 'var(--bg-elevated)',
                backdropFilter: 'blur(24px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
                border: '1px solid rgba(139,115,85,0.15)',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.08), 0 8px 40px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div style={{ height: 2, background: 'linear-gradient(90deg, #6F5C46 0%, #A89478 35%, #E2BF6A 65%, #8B7355 100%)' }} />

              {/* ── DESKTOP layout ── */}
              <div className="hidden lg:flex items-center gap-5 px-6 py-3.5">

                {/* LEFT — live financing metrics */}
                <div className="flex items-center gap-5 shrink-0">
                  <div>
                    <p className="text-lg font-extrabold tabular-nums leading-none text-[var(--fg)]">{fmtFull(emi)}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] mt-1">Monthly EMI</p>
                  </div>
                  <div className="h-8 w-px bg-[var(--border)] shrink-0" />
                  {([
                    ['LTV', `${ltv}%`, ltv > 80 ? '#EF4444' : ltv > 70 ? '#F59E0B' : '#4ADE80'],
                    ['Annual ROI', `${annualROI}%`, annualROI > 5 ? '#4ADE80' : annualROI > 0 ? '#F59E0B' : '#EF4444'],
                    ['Score', `${healthScore}/100`, healthScore >= 80 ? '#4ADE80' : healthScore >= 60 ? '#F59E0B' : '#EF4444'],
                  ] as [string, string, string][]).map(([label, value, color]) => (
                    <div key={label} className="text-center min-w-[56px]">
                      <p className="text-sm font-bold tabular-nums leading-none" style={{ color }}>{value}</p>
                      <p className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)] mt-1 font-medium">{label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex-1" />

                {/* CENTER — secondary actions */}
                <div className="flex items-center gap-2">
                  {([
                    { icon: Save,     label: 'Save',    action: () => openModal('save') },
                    { icon: Download, label: 'Export',  action: () => openModal('export') },
                    { icon: Phone,    label: 'Banker',  action: () => openModal('banker') },
                    { icon: Scale,    label: 'Compare', action: () => openModal('compare') },
                  ] as { icon: React.ElementType; label: string; action: () => void }[]).map((btn) => (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      className="group inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3.5 py-2 text-[11px] font-semibold text-[var(--fg-secondary)] transition-all duration-150 hover:border-[rgba(139,115,85,0.3)] hover:text-[#8B7355] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:translate-y-0 cursor-pointer"
                    >
                      <btn.icon className="h-3.5 w-3.5 transition-transform duration-150 group-hover:scale-110" strokeWidth={1.5} />
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="h-8 w-px bg-[var(--border)] shrink-0" />

                {/* RIGHT — primary CTA */}
                <button
                  onClick={() => openModal('apply')}
                  className="c-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-bold cursor-pointer whitespace-nowrap transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,115,85,0.25)] active:translate-y-0"
                >
                  Apply for Loan
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* ── MOBILE layout ── */}
              <div className="lg:hidden">
                <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
                  <div className="min-w-0">
                    <p className="text-base font-extrabold tabular-nums text-[var(--fg)] leading-none">
                      {fmtFull(emi)}<span className="text-[10px] font-normal text-[var(--fg-muted)] ml-1">/mo</span>
                    </p>
                    <p className="text-[10px] text-[var(--fg-muted)] mt-1">{ltv}% LTV · {annualROI}% ROI · {healthScore}/100</p>
                  </div>
                  <button
                    onClick={() => openModal('apply')}
                    className="c-btn-primary shrink-0 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[11px] font-bold cursor-pointer"
                  >
                    Apply <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex border-t border-[var(--border-light)]">
                  {([
                    { icon: Save,     label: 'Save',    action: () => openModal('save') },
                    { icon: Download, label: 'Export',  action: () => openModal('export') },
                    { icon: Phone,    label: 'Banker',  action: () => openModal('banker') },
                    { icon: Scale,    label: 'Compare', action: () => openModal('compare') },
                  ] as { icon: React.ElementType; label: string; action: () => void }[]).map((btn) => (
                    <button
                      key={btn.label}
                      onClick={btn.action}
                      className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold text-[var(--fg-secondary)] hover:text-[#8B7355] hover:bg-[var(--bg-secondary)] transition-all border-r border-[var(--border-light)] last:border-r-0 cursor-pointer"
                    >
                      <btn.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ═══ MODAL ═══ */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} size="md">
        {modalType === 'save' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[18px] font-bold text-[var(--fg)]">Save Scenario</h2>
              <p className="text-[12px] text-[var(--fg-muted)] mt-1">Save current parameters for comparison</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-4 space-y-2 text-[12px]">
              {([
                ['Property', fmtFull(propertyPrice)],
                ['Down Payment', `${downPaymentPct}% (${fmtFull(downPayment)})`],
                ['Loan Amount', fmtFull(loanAmount)],
                ['Rate / Tenure', `${interestRate}% / ${tenureYears}yr`],
                ['Monthly EMI', fmtFull(emi)],
                ['Net Cash Flow', `${netMonthlyCashFlow >= 0 ? '+' : ''}${fmtFull(netMonthlyCashFlow)}`],
                ['Health Score', `${healthScore}/100`],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[var(--fg-muted)]">{k}</span>
                  <span className="font-semibold text-[var(--fg)]">{v}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setModalOpen(false)} className="c-btn-primary w-full py-3 text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer rounded-xl">
              <Save className="h-4 w-4" /> Save to My Scenarios
            </button>
          </div>
        )}

        {modalType === 'export' && (
          <div className="text-center py-4 space-y-4">
            <div className="h-14 w-14 rounded-full bg-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.12)] flex items-center justify-center mx-auto">
              <Download className="h-7 w-7 text-[#8B7355]" />
            </div>
            <div>
              <p className="text-[16px] font-bold text-[var(--fg)]">Export PDF Report</p>
              <p className="text-[12px] text-[var(--fg-muted)] mt-1">Full analysis with charts, amortization & recommendations</p>
            </div>
            <button onClick={() => setModalOpen(false)} className="c-btn-primary px-6 py-2.5 text-[12px] font-semibold cursor-pointer rounded-xl">
              Generate PDF
            </button>
          </div>
        )}

        {modalType === 'compare' && (
          <div className="space-y-4">
            <h2 className="text-[18px] font-bold text-[var(--fg)]">Compare Loans</h2>
            <p className="text-[12px] text-[var(--fg-muted)]">Side-by-side for {fmtFull(loanAmount)} · {tenureYears}yr</p>
            <div className="space-y-2">
              {bankComparison.map((bank) => (
                <div key={bank.name} className={`rounded-xl border px-4 py-3 flex items-center justify-between ${bank.isBest ? 'border-[rgba(74,222,128,0.2)] bg-[rgba(74,222,128,0.02)]' : 'border-[var(--border)]'}`}>
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--fg)]">{bank.name}</p>
                    <p className="text-[11px] text-[var(--fg-muted)]">{bank.rate}% · {fmtFull(bank.emi)}/mo</p>
                  </div>
                  {bank.isBest && <span className="text-[9px] font-bold text-[#4ADE80] bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.15)] px-2 py-0.5 rounded-full">Best</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(modalType === 'banker' || modalType === 'apply' || modalType === 'portfolio') && (
          <div className="text-center py-4 space-y-4">
            <div className="h-14 w-14 rounded-full bg-[rgba(74,222,128,0.08)] border border-[rgba(74,222,128,0.12)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7 text-[#4ADE80]" />
            </div>
            <div>
              <p className="text-[16px] font-bold text-[var(--fg)]">
                {modalType === 'banker' ? 'Send to Banker' : modalType === 'apply' ? 'Apply for Loan' : 'Add to Portfolio'}
              </p>
              <p className="text-[12px] text-[var(--fg-muted)] mt-1">
                {modalType === 'banker' ? 'Your financing scenario will be sent to your private banker.' : modalType === 'apply' ? 'Start your loan application with pre-filled details.' : 'Add this scenario to your portfolio tracker.'}
              </p>
            </div>
            <button onClick={() => setModalOpen(false)} className="c-btn-primary px-6 py-2.5 text-[12px] font-semibold cursor-pointer rounded-xl">
              {modalType === 'banker' ? 'Send Now' : modalType === 'apply' ? 'Start Application' : 'Add to Portfolio'}
            </button>
          </div>
        )}
      </Dialog>

    </PageContainer>
  );
}
