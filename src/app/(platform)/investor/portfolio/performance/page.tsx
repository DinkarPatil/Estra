'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppDrawer, DrawerFooter } from '@/components/ui/drawer';
import {
  TrendingUp, TrendingDown, DollarSign, Download, Brain, ChevronRight,
  ArrowUpRight, ArrowDownRight, Activity, Building2, Search, Info,
  Eye, BarChart3, Shield, AlertTriangle, Wallet, ShieldAlert, X,
  ChevronDown, FileText, Briefcase, Target, Zap, MapPin,
  PieChart as PieIcon, Loader2, Check, Layers,
} from 'lucide-react';
import {
  mockPortfolioAssets, portfolioSummary, monthlyCashFlow, cashFlowSummary,
  aiInsights, type PortfolioAsset, type AIInsight,
} from '@/mock-data/portfolio';
import { portfolioValueHistory, rentalIncomeHistory } from '@/mock-data/market-data';
import { formatCurrency } from '@/lib/formatters';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
  ComposedChart,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════
   CONSTANTS & DATA
   ═══════════════════════════════════════════════════ */

const BRAND = '#8B7355';
const BRAND_DARK = '#6F5C46';
const GREEN = '#22C55E';
const RED = '#EF4444';
const PURPLE = '#A89478';
const BLUE = '#8B7355';

const TIME_RANGES = ['1M', '3M', '6M', '1Y', '3Y', 'ALL'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

/* Benchmark data aligned with portfolio value history */
const PERFORMANCE_DATA = portfolioValueHistory.map((p, i) => ({
  date: p.date,
  portfolio: p.value,
  benchmark: 2000000 + i * 28000,
  income: rentalIncomeHistory[i]?.value || 0,
  expenses: 3800 + i * 60,
}));

/* Extra forecast points */
const FORECAST = [
  { date: '2025-01', portfolio: 2800000, benchmark: 2336000, income: 12200, expenses: 4560, forecast: 2870000 },
  { date: '2025-02', benchmark: 2364000, income: 12600, expenses: 4620, forecast: 2940000 },
  { date: '2025-03', benchmark: 2392000, income: 13000, expenses: 4680, forecast: 3020000 },
];

const FULL_CHART_DATA = [...PERFORMANCE_DATA, ...FORECAST];

/* Allocation data */
const COUNTRY_ALLOCATION = [
  { name: 'Singapore', value: 54, color: BRAND },
  { name: 'Japan', value: 26, color: PURPLE },
  { name: 'USA', value: 20, color: BLUE },
];

const TYPE_ALLOCATION = [
  { name: 'Luxury Residential', value: 60, color: BRAND },
  { name: 'Standard Residential', value: 25, color: GREEN },
  { name: 'Waterfront', value: 15, color: PURPLE },
];

/* Cash flow with breakdown */
const CASH_FLOW_DATA = monthlyCashFlow.map(c => ({
  ...c,
  taxes: Math.round(c.expenses * 0.35),
  mortgage: Math.round(c.expenses * 0.38),
  maintenance: Math.round(c.expenses * 0.27),
}));

/* KPI sparklines */
const SP_VALUE = [{ v: 6.2 }, { v: 6.5 }, { v: 6.9 }, { v: 7.2 }, { v: 7.6 }, { v: 7.9 }, { v: 8.26 }];
const SP_RETURN = [{ v: 3.2 }, { v: 5.1 }, { v: 6.8 }, { v: 8.4 }, { v: 9.7 }, { v: 11.1 }, { v: 12.4 }];
const SP_CASH = [{ v: 8.2 }, { v: 9.1 }, { v: 10.2 }, { v: 10.8 }, { v: 11.3 }, { v: 11.85 }, { v: 18.58 }];
const SP_BENCH = [{ v: 0.8 }, { v: 1.2 }, { v: 1.5 }, { v: 1.9 }, { v: 2.1 }, { v: 2.4 }, { v: 2.7 }];
const SP_RISK = [{ v: 45 }, { v: 42 }, { v: 38 }, { v: 36 }, { v: 34 }, { v: 33 }, { v: 32 }];

/* Insight categories */
type InsightCategory = 'growth' | 'rebalance' | 'yield' | 'refinance';
const PERF_INSIGHTS: { id: string; category: InsightCategory; title: string; description: string; impact: string; confidence: number; action: string; color: string; barColor: string; icon: React.ElementType }[] = [
  { id: 'pi-1', category: 'growth', title: 'Portfolio beating benchmark by 2.7%', description: 'Your portfolio has consistently outperformed the regional index. Consider increasing allocation to high-performing Singapore assets.', impact: '+₹78K annualized', confidence: 88, action: 'View Details', color: GREEN, barColor: 'rgba(34,197,94,0.35)', icon: TrendingUp },
  { id: 'pi-2', category: 'rebalance', title: 'US exposure too high at 42%', description: 'Portfolio is overweight in US real estate. Diversifying into emerging markets could reduce risk and improve returns.', impact: '-8% risk reduction', confidence: 74, action: 'Run Scenario', color: PURPLE, barColor: 'rgba(168,148,120,0.35)', icon: Layers },
  { id: 'pi-3', category: 'yield', title: 'Vacant Miami condo can add ₹4,200/mo', description: 'Listing the South Beach property at market rate would significantly boost monthly cash flow and portfolio yield.', impact: '+₹4,200/mo', confidence: 91, action: 'View Asset', color: BRAND, barColor: 'rgba(139,115,85,0.35)', icon: Wallet },
  { id: 'pi-4', category: 'refinance', title: 'Mortgage rates lower by 0.8%', description: 'Current rates are favorable for refinancing. The Marina Bay property could save ₹1,100/month with a new rate.', impact: 'Save ₹1,100/mo', confidence: 78, action: 'Run Scenario', color: BLUE, barColor: 'rgba(139,115,85,0.35)', icon: Zap },
];

/* ═══════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════ */

function statusVariant(s: PortfolioAsset['status']) {
  switch (s) { case 'rented': return 'success'; case 'vacant': return 'danger'; case 'listed': return 'info'; case 'managed': return 'default'; case 'under-review': return 'warning'; default: return 'secondary'; }
}

/* ─── Animated Counter ─── */
function useCountUp(target: number, dur = 1200, prefix = '', suffix = '') {
  const [display, setDisplay] = useState(prefix + '0' + suffix);
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const c = e * target;
      if (target >= 1000000) setDisplay(prefix + '$' + (c / 1000000).toFixed(2) + 'M');
      else if (target >= 1000) setDisplay(prefix + '$' + Math.round(c).toLocaleString());
      else if (Number.isInteger(target)) setDisplay(prefix + Math.round(c).toString() + suffix);
      else setDisplay(prefix + c.toFixed(1) + suffix);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, dur, prefix, suffix]);
  return display;
}

/* ─── Portal Tooltip ─── */
function PortalTooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const [m, setM] = useState(false);
  useEffect(() => { setM(true); }, []);
  const up = useCallback(() => { if (ref.current) { const r = ref.current.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.top - 10 }); } }, []);
  return (
    <>
      <div ref={ref} onMouseEnter={() => { up(); setShow(true); }} onMouseLeave={() => setShow(false)} className="inline-flex">{children}</div>
      {show && m && createPortal(
        <div style={{ position: 'fixed', left: pos.x, top: pos.y, transform: 'translate(-50%,-100%)', zIndex: 99999, pointerEvents: 'none' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '10px 14px', fontSize: 12, lineHeight: 1.5, color: '#374151', maxWidth: 240, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
            {content}
            <div style={{ position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #fff' }} />
          </div>
        </div>, document.body)}
    </>
  );
}

/* ─── Scenario Modal ─── */
const SIM_STEPS = ['Loading portfolio data', 'Running Monte Carlo simulation', 'Calculating risk metrics', 'Generating 12-month projections', 'Finalizing output'];

function ScenarioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rentChange, setRentChange] = useState(10);
  const [vacancyReduce, setVacancyReduce] = useState(50);
  const [refinance, setRefinance] = useState(false);
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState(false);

  useEffect(() => { if (!open) { setDone(false); setRunning(false); setStep(-1); } }, [open]);

  const projectedROI = useMemo(() => (7.2 + rentChange * 0.08 + (vacancyReduce / 100) * 2.1 + (refinance ? 0.6 : 0)).toFixed(1), [rentChange, vacancyReduce, refinance]);
  const projectedCash = useMemo(() => Math.round(18580 + rentChange * 180 + (vacancyReduce / 100) * 4200 + (refinance ? 1100 : 0)), [rentChange, vacancyReduce, refinance]);
  const projectedValue = useMemo(() => (8.26 + rentChange * 0.02 + (vacancyReduce / 100) * 0.3 + (refinance ? 0.1 : 0)).toFixed(2), [rentChange, vacancyReduce, refinance]);
  const annualGain = useMemo(() => Math.round((parseFloat(projectedROI) - 7.2) * 82600), [projectedROI]);
  const riskScore = useMemo(() => Math.max(18, 32 - Math.round((vacancyReduce / 100) * 8) - (refinance ? 3 : 0)), [vacancyReduce, refinance]);

  const handleRun = async () => {
    setRunning(true); setStep(0);
    for (let i = 0; i < SIM_STEPS.length; i++) {
      setStep(i);
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
    }
    setRunning(false); setDone(true); setStep(-1);
  };

  return (
    <Dialog open={open} onClose={onClose} size="xl">
      <DialogHeader><DialogTitle>Scenario Simulator</DialogTitle><DialogDescription>Model portfolio changes and see projected outcomes</DialogDescription></DialogHeader>
      <div className="mt-4 space-y-5">
        <AnimatePresence mode="wait">
          {running ? (
            /* ── Simulation running animation ── */
            <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6 flex flex-col items-center gap-5">
              {/* Pulsing ring + Brain */}
              <div className="relative h-16 w-16">
                <motion.div className="absolute -inset-2 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,115,85,0.15) 0%, transparent 70%)' }}
                  animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0.15, 0.6] }} transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }} />
                <div className="absolute inset-0 rounded-full border-[2px] border-[var(--bg-tertiary)]" />
                <motion.div className="absolute inset-0 rounded-full"
                  style={{ border: '2.5px solid transparent', borderTopColor: '#8B7355', borderRightColor: 'rgba(139,115,85,0.25)' }}
                  animate={{ rotate: 360 }} transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }} />
                <motion.div className="absolute inset-2 rounded-full"
                  style={{ border: '2px solid transparent', borderBottomColor: 'rgba(139,115,85,0.45)', borderLeftColor: 'rgba(139,115,85,0.12)' }}
                  animate={{ rotate: -360 }} transition={{ duration: 1.7, repeat: Infinity, ease: 'linear' }} />
                <div className="absolute inset-2.5 rounded-full bg-[rgba(139,115,85,0.05)] flex items-center justify-center">
                  <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>
                    <Brain className="h-5 w-5 text-[#8B7355]" />
                  </motion.div>
                </div>
              </div>
              {/* Step checklist */}
              <div className="w-full max-w-xs space-y-2">
                {SIM_STEPS.map((s, i) => (
                  <motion.div key={s} className="flex items-center gap-2.5" initial={{ opacity: 0, x: -8 }} animate={{ opacity: i <= step ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className={cn('h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all', i < step ? 'bg-[#22C55E]' : i === step ? 'bg-[rgba(139,115,85,0.15)] border-2 border-[#8B7355]' : 'bg-[var(--bg-tertiary)]')}>
                      {i < step
                        ? <Check className="h-3 w-3 text-white" />
                        : i === step
                          ? <motion.div className="h-2 w-2 rounded-full bg-[#8B7355]" animate={{ scale: [0.7, 1, 0.7] }} transition={{ duration: 0.8, repeat: Infinity }} />
                          : null}
                    </div>
                    <span className={cn('text-xs', i < step ? 'text-[#22C55E] font-medium' : i === step ? 'text-[var(--fg)] font-semibold' : 'text-[var(--fg-muted)]')}>{s}</span>
                  </motion.div>
                ))}
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6F5C46, #A89478, #A89478)' }}
                  animate={{ width: `${Math.round(((step + 1) / SIM_STEPS.length) * 100)}%` }} transition={{ duration: 0.35, ease: 'easeOut' }} />
              </div>
              <p className="text-[11px] text-[var(--fg-muted)]">Running simulation — please wait...</p>
            </motion.div>
          ) : done ? (
            /* ── Simulation results ── */
            <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-2 rounded-xl border border-[rgba(34,197,94,0.25)] bg-[rgba(34,197,94,0.05)] px-4 py-3">
                <Check className="h-4 w-4 text-[#22C55E] flex-shrink-0" />
                <p className="text-sm font-semibold text-[#22C55E]">Simulation Complete</p>
                <span className="ml-auto text-[10px] text-[var(--fg-muted)]">Confidence: 91%</span>
              </div>
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Projected ROI', value: `${projectedROI}%`, base: '7.2%', color: GREEN },
                  { label: 'Monthly Cash Flow', value: `₹${projectedCash.toLocaleString()}`, base: '₹18,580', color: BRAND },
                  { label: 'Portfolio Value', value: `₹${projectedValue}M`, base: '₹8.26M', color: PURPLE },
                ].map((m, i) => (
                  <motion.div key={m.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                    className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-3.5 text-center">
                    <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)]">{m.label}</p>
                    <p className="text-lg font-extrabold mt-0.5" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-[9px] text-[var(--fg-muted)] mt-0.5">was {m.base}</p>
                  </motion.div>
                ))}
              </div>
              {/* Detailed breakdown */}
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[var(--border-light)] bg-[var(--bg-elevated)]">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">12-Month Impact Breakdown</p>
                </div>
                {[
                  { label: 'Annual rental income gain', value: `+₹${(rentChange * 180 * 12).toLocaleString()}`, color: GREEN },
                  { label: 'Vacancy reduction benefit', value: `+₹${(Math.round((vacancyReduce / 100) * 4200) * 12).toLocaleString()}`, color: GREEN },
                  { label: 'Refinancing savings', value: refinance ? '+₹13,200' : '—', color: refinance ? GREEN : 'var(--fg-muted)' },
                  { label: 'Estimated transaction costs', value: refinance ? '-₹4,200' : '—', color: refinance ? '#EF4444' : 'var(--fg-muted)' },
                  { label: 'Net additional gain (12mo)', value: `+₹${annualGain.toLocaleString()}`, color: BRAND },
                  { label: 'New risk score', value: `${riskScore}/100`, color: riskScore < 25 ? GREEN : BRAND },
                ].map((row, i) => (
                  <motion.div key={row.label} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-light)] last:border-0">
                    <span className="text-xs text-[var(--fg-secondary)]">{row.label}</span>
                    <span className="text-xs font-bold" style={{ color: row.color }}>{row.value}</span>
                  </motion.div>
                ))}
              </motion.div>
              {/* Recommendation */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                className="rounded-xl border border-[rgba(139,115,85,0.2)] bg-[rgba(139,115,85,0.04)] p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B7355] mb-1">AI Recommendation</p>
                <p className="text-xs text-[var(--fg-secondary)] leading-relaxed">
                  Implementing {refinance ? 'all three' : 'both'} scenario changes is estimated to improve annualized portfolio performance by <span className="font-semibold text-[var(--fg)]">~{Math.round((parseFloat(projectedROI) - 7.2) * 10) / 10}%</span>. Priority action: reduce vacancy first — highest ROI lever with lowest execution risk.
                </p>
              </motion.div>
            </motion.div>
          ) : (
            /* ── Configuration ── */
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2"><span className="text-xs font-medium text-[var(--fg-secondary)]">Increase rent by</span><span className="text-xs font-bold text-[#8B7355]">+{rentChange}%</span></div>
                  <input type="range" min={0} max={30} value={rentChange} onChange={e => setRentChange(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${BRAND} ${(rentChange / 30) * 100}%, var(--bg-tertiary) ${(rentChange / 30) * 100}%)` }} />
                </div>
                <div>
                  <div className="flex justify-between mb-2"><span className="text-xs font-medium text-[var(--fg-secondary)]">Reduce vacancy by</span><span className="text-xs font-bold text-[#22C55E]">{vacancyReduce}%</span></div>
                  <input type="range" min={0} max={100} value={vacancyReduce} onChange={e => setVacancyReduce(Number(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${GREEN} ${vacancyReduce}%, var(--bg-tertiary) ${vacancyReduce}%)` }} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                  <span className="text-xs font-medium text-[var(--fg-secondary)]">Refinance mortgage (-0.8% rate)</span>
                  <button onClick={() => setRefinance(!refinance)} className={cn('h-6 w-11 rounded-full transition-colors cursor-pointer relative', refinance ? 'bg-[#8B7355]' : 'bg-[var(--bg-tertiary)]')}>
                    <div className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', refinance ? 'left-[22px]' : 'left-0.5')} />
                  </button>
                </div>
              </div>
              {/* Live preview */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Projected ROI', value: `${projectedROI}%`, color: GREEN },
                  { label: 'Monthly Cash Flow', value: `₹${projectedCash.toLocaleString()}`, color: BRAND },
                  { label: 'Portfolio Value', value: `₹${projectedValue}M`, color: PURPLE },
                ].map(m => (
                  <motion.div key={m.label} layout className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-4 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">{m.label}</p>
                    <p className="text-xl font-extrabold mt-1" style={{ color: m.color }}>{m.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
        <Button variant="outline" onClick={done ? () => { setDone(false); setStep(-1); } : onClose}>{done ? 'Re-configure' : 'Close'}</Button>
        {!done && !running && <Button onClick={handleRun}><Brain className="h-4 w-4" /> Run Simulation</Button>}
        {done && <Button variant="outline" onClick={onClose}>Close</Button>}
      </div>
    </Dialog>
  );
}

/* ─── Export Dropdown ─── */
function ReportDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const download = (name: string) => {
    const blob = new Blob([`${name}\nGenerated: ${new Date().toLocaleDateString()}\nPortfolio Performance Report\n\nTotal Value: ₹8.26M\nYTD Return: +12.4%\nMonthly Yield: ₹18,580\nBenchmark: +2.7% outperformance`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name.replace(/\s/g, '_')}.txt`; a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Download className="h-4 w-4" /> Export <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_16px_48px_rgba(0,0,0,0.15)] overflow-hidden">
            <div className="px-3.5 py-2 border-b border-[var(--border-light)]"><p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">Download Report</p></div>
            {[{ label: 'PDF Report', icon: FileText }, { label: 'Excel Analytics', icon: BarChart3 }, { label: 'Investor Summary Deck', icon: Briefcase }].map(item => (
              <button key={item.label} onClick={() => download(item.label)} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                <item.icon className="h-3.5 w-3.5 text-[var(--fg-muted)]" /> {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Custom Donut Label ─── */
function DonutLabel({ viewBox, total }: { viewBox?: { cx: number; cy: number }; total: string }) {
  if (!viewBox) return null;
  return (
    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={viewBox.cx} dy="-6" fontSize="18" fontWeight="800" fill="var(--fg)">{total}</tspan>
      <tspan x={viewBox.cx} dy="18" fontSize="10" fill="var(--fg-muted)">allocation</tspan>
    </text>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function PerformancePage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showIncome, setShowIncome] = useState(true);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showForecast, setShowForecast] = useState(true);
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [isRefreshAction, setIsRefreshAction] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCol, setSortCol] = useState<'roi' | 'value' | 'appreciation' | 'occupancy'>('roi');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  /* KPI data */
  const valDisplay = useCountUp(8260000, 1200);
  const retDisplay = useCountUp(12.4, 1000, '+', '%');
  const cashDisplay = useCountUp(18580, 1000, '$');
  const benchDisplay = useCountUp(2.7, 1000, '+', '%');

  /* Chart time filtering */
  const chartData = useMemo(() => {
    const all = showForecast ? FULL_CHART_DATA : PERFORMANCE_DATA;
    switch (timeRange) {
      case '1M': return all.slice(-2);
      case '3M': return all.slice(-4);
      case '6M': return all.slice(-7);
      case '1Y': return all;
      case '3Y': return all;
      case 'ALL': return all;
      default: return all;
    }
  }, [timeRange, showForecast]);

  /* Asset table sort/filter */
  const sortedAssets = useMemo(() => {
    let result = [...mockPortfolioAssets];
    if (searchQuery) { const q = searchQuery.toLowerCase(); result = result.filter(a => a.title.toLowerCase().includes(q) || a.location.toLowerCase().includes(q)); }
    result.sort((a, b) => {
      let va: number, vb: number;
      switch (sortCol) {
        case 'roi': va = a.roi; vb = b.roi; break;
        case 'value': va = a.currentValue.amount; vb = b.currentValue.amount; break;
        case 'appreciation': va = a.appreciation; vb = b.appreciation; break;
        case 'occupancy': va = a.occupancyRate; vb = b.occupancyRate; break;
        default: va = a.roi; vb = b.roi;
      }
      return sortDir === 'desc' ? vb - va : va - vb;
    });
    return result;
  }, [searchQuery, sortCol, sortDir]);

  const handleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  /* Chart stats */
  const chartStats = useMemo(() => {
    const data = PERFORMANCE_DATA;
    let bestIdx = 0, worstIdx = 0;
    for (let i = 1; i < data.length; i++) {
      const change = ((data[i].portfolio - data[i - 1].portfolio) / data[i - 1].portfolio) * 100;
      const bestChange = ((data[bestIdx + 1 < data.length ? bestIdx + 1 : bestIdx].portfolio - data[bestIdx].portfolio) / data[bestIdx].portfolio) * 100;
      const worstChange = ((data[worstIdx + 1 < data.length ? worstIdx + 1 : worstIdx].portfolio - data[worstIdx].portfolio) / data[worstIdx].portfolio) * 100;
      if (i > 0) {
        const thisChange = ((data[i].portfolio - data[i - 1].portfolio) / data[i - 1].portfolio) * 100;
        if (thisChange > bestChange) bestIdx = i - 1;
        if (thisChange < worstChange) worstIdx = i - 1;
      }
    }
    return {
      totalReturn: ((data[data.length - 1].portfolio - data[0].portfolio) / data[0].portfolio * 100).toFixed(1),
      best: { month: data[9]?.date || 'Oct', change: 7.4 },
      worst: { month: data[2]?.date || 'Mar', change: -0.7 },
    };
  }, []);

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* ═══════════════ 1. HERO HEADER ═══════════════ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="premium-card rounded-2xl p-5 relative" style={{ overflow: 'visible' }}>
          <div className="absolute inset-0 rounded-2xl opacity-[0.03] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(139,115,85,1) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168,148,120,0.6) 0%, transparent 50%)' }} />
          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--fg)] tracking-tight">Portfolio Performance</h1>
              <p className="mt-1 text-sm text-[var(--fg-secondary)]">Track returns, growth trends, and portfolio efficiency</p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.12)] px-2.5 py-1.5">
                  <ArrowUpRight className="h-3 w-3 text-[#4ADE80]" />
                  <span className="text-[11px] font-bold text-[#4ADE80]">+{chartStats.totalReturn}% Total Return</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] px-2.5 py-1.5">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" /></span>
                  <span className="text-[11px] font-medium text-[#22C55E]">Live</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 pt-1">
              <ReportDropdown />
              <Button variant="outline" size="sm" onClick={() => { setAiDrawerOpen(true); setIsRefreshAction(false); setAiRefreshing(true); setTimeout(() => setAiRefreshing(false), 2500); }} className="border-[rgba(139,115,85,0.3)] hover:border-[rgba(139,115,85,0.5)] hover:bg-[rgba(139,115,85,0.04)]">
                <Brain className="h-4 w-4 text-[#8B7355]" /> AI Analysis
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════ 2. KPI ROW ═══════════════ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { title: 'Portfolio Value', value: valDisplay, change: 12.4, label: 'vs last year', sparkline: SP_VALUE, color: BRAND, tooltip: 'Total current market value of all assets.' },
            { title: 'YTD Return', value: retDisplay, change: 3.1, label: 'vs benchmark', sparkline: SP_RETURN, color: GREEN, tooltip: 'Year-to-date total return including appreciation and income.' },
            { title: 'Monthly Cash Yield', value: cashDisplay, change: 8.3, label: 'vs last month', sparkline: SP_CASH, color: BLUE, tooltip: 'Combined monthly rental income from all leased assets.' },
            { title: 'Benchmark Beat', value: benchDisplay, change: 0.4, label: 'vs last quarter', sparkline: SP_BENCH, color: PURPLE, tooltip: 'How much your portfolio outperforms the regional index.' },
            { title: 'Risk Score', value: '32/100', change: -3, label: 'improving', sparkline: SP_RISK, color: GREEN, tooltip: 'Composite risk score — lower is better. Based on vacancy, leverage, and concentration.' },
          ].map((kpi, i) => (
            <motion.div key={kpi.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
              className="premium-card rounded-2xl p-5 group cursor-default hover:shadow-[0_12px_32px_rgba(139,115,85,0.08)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="glow-icon-container"><Activity className="h-4.5 w-4.5 text-[var(--accent)]" /></div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)]">{kpi.title}</p>
                </div>
                <PortalTooltip content={kpi.tooltip}><Info className="h-3.5 w-3.5 text-[var(--fg-muted)] opacity-40 group-hover:opacity-70 transition-opacity cursor-help" /></PortalTooltip>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-extrabold text-[var(--fg)] tracking-[-0.03em] leading-none">{kpi.value}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className={cn('flex items-center gap-0.5 rounded-full px-1.5 py-0.5', kpi.change >= 0 ? 'bg-[rgba(34,197,94,0.08)]' : 'bg-[rgba(239,68,68,0.08)]')}>
                      {kpi.change >= 0 ? <ArrowUpRight className="h-3 w-3 text-[#4ADE80]" /> : <ArrowDownRight className="h-3 w-3 text-[#F87171]" />}
                      <span className={cn('text-[10px] font-semibold', kpi.change >= 0 ? 'text-[#4ADE80]' : 'text-[#F87171]')}>{kpi.change >= 0 ? '+' : ''}{kpi.change}{Math.abs(kpi.change) < 10 ? '%' : ''}</span>
                    </div>
                    <span className="text-[9px] text-[var(--fg-muted)]">{kpi.label}</span>
                  </div>
                </div>
                <div className="h-10 w-24">
                  <ResponsiveContainer width="100%" height="100%" minWidth={40} minHeight={20}>
                    <AreaChart data={kpi.sparkline}>
                      <defs><linearGradient id={`sp-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={kpi.color} stopOpacity={0.2} /><stop offset="100%" stopColor={kpi.color} stopOpacity={0} /></linearGradient></defs>
                      <Area type="monotone" dataKey="v" stroke={kpi.color} strokeWidth={1.5} fill={`url(#sp-${i})`} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════ 3. MAIN PERFORMANCE CHART ═══════════════ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="premium-card rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--fg)]">Portfolio Performance</h2>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--fg-muted)]">Growth, income & benchmark comparison</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggles */}
              {[
                { label: 'Portfolio', active: true, color: BRAND, locked: true },
                { label: 'Benchmark', active: showBenchmark, color: PURPLE, toggle: () => setShowBenchmark(!showBenchmark) },
                { label: 'Income', active: showIncome, color: GREEN, toggle: () => setShowIncome(!showIncome) },
                { label: 'Expenses', active: showExpenses, color: RED, toggle: () => setShowExpenses(!showExpenses) },
              ].map(t => (
                <button key={t.label} onClick={t.toggle} disabled={t.locked}
                  className={cn('flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all border cursor-pointer',
                    t.active ? `border-[${t.color}30] bg-[${t.color}08]` : 'border-[var(--border)] text-[var(--fg-muted)]'
                  )}
                  style={t.active ? { borderColor: `${t.color}40`, background: `${t.color}08`, color: t.color } : undefined}
                >
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: t.active ? t.color : 'var(--fg-muted)' }} />
                  {t.label}
                </button>
              ))}
              <div className="h-5 w-px bg-[var(--border)] mx-1" />
              {/* Time range */}
              <div className="flex items-center rounded-lg bg-[var(--bg-secondary)] p-0.5">
                {TIME_RANGES.map(tr => (
                  <button key={tr} onClick={() => setTimeRange(tr)}
                    className={cn('px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
                      timeRange === tr ? 'bg-[var(--card-bg)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                    )}>{tr}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl bg-[rgba(34,197,94,0.04)] border border-[rgba(34,197,94,0.08)] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Best Month</p>
              <p className="text-sm font-semibold text-[#22C55E] mt-0.5">Oct 2024 (+7.4%)</p>
            </div>
            <div className="rounded-xl bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.08)] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Worst Month</p>
              <p className="text-sm font-semibold text-[#EF4444] mt-0.5">Mar 2024 (-0.7%)</p>
            </div>
            <div className="rounded-xl bg-[rgba(139,115,85,0.04)] border border-[rgba(139,115,85,0.08)] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Projected EOY</p>
              <p className="text-sm font-semibold text-[#8B7355] mt-0.5">₹3.02M</p>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="perfBrand" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={BRAND} stopOpacity={0.12} /><stop offset="100%" stopColor={BRAND} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000000).toFixed(1)}M`} />
                {(showIncome || showExpenses) && <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />}
                <RTooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} formatter={(value, name) => {
                  const v = Number(value);
                  const n = String(name);
                  if (n === 'income' || n === 'expenses') return [`₹${v.toLocaleString()}`, n.charAt(0).toUpperCase() + n.slice(1)];
                  return [`₹${(v / 1000000).toFixed(2)}M`, n.charAt(0).toUpperCase() + n.slice(1)];
                }} />
                {/* Portfolio area */}
                <Area yAxisId="left" type="monotone" dataKey="portfolio" stroke={BRAND} strokeWidth={2.5} fill="url(#perfBrand)" dot={false} isAnimationActive={false} />
                {/* Forecast */}
                {showForecast && <Area yAxisId="left" type="monotone" dataKey="forecast" stroke={BRAND} strokeWidth={2} strokeDasharray="6 4" fill="none" dot={false} isAnimationActive={false} />}
                {/* Benchmark */}
                {showBenchmark && <Line yAxisId="left" type="monotone" dataKey="benchmark" stroke={PURPLE} strokeWidth={1.5} strokeDasharray="5 5" dot={false} isAnimationActive={false} />}
                {/* Income */}
                {showIncome && <Line yAxisId="right" type="monotone" dataKey="income" stroke={GREEN} strokeWidth={1.5} dot={false} isAnimationActive={false} />}
                {/* Expenses */}
                {showExpenses && <Line yAxisId="right" type="monotone" dataKey="expenses" stroke={RED} strokeWidth={1.5} dot={false} isAnimationActive={false} />}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ═══════════════ 4. PERFORMANCE INSIGHT CARDS ═══════════════ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Best Performing', asset: 'Marina Bay Penthouse', value: '+10.7%', sub: 'ROI', color: GREEN, icon: TrendingUp },
            { label: 'Worst Performing', asset: 'Minato-ku Residence', value: '+3.9%', sub: 'ROI', color: RED, icon: TrendingDown },
            { label: 'Highest Yield', asset: 'Marina Bay Penthouse', value: '4.3%', sub: 'Annual yield', color: BRAND, icon: DollarSign },
            { label: 'Vacancy Loss Risk', asset: 'Miami Condo', value: '-₹4,200/mo', sub: 'Potential income lost', color: RED, icon: AlertTriangle },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.07 }}
              className="premium-card rounded-2xl p-5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200"
              style={{ borderTop: `3px solid ${card.color}` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${card.color}10`, border: `1px solid ${card.color}20` }}>
                  <card.icon className="h-4 w-4" style={{ color: card.color }} />
                </div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--fg-muted)]">{card.label}</p>
              </div>
              <p className="text-sm font-semibold text-[var(--fg)]">{card.asset}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-xl font-extrabold" style={{ color: card.color }}>{card.value}</span>
                <span className="text-[10px] text-[var(--fg-muted)]">{card.sub}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════ 5. ASSET COMPARISON TABLE ═══════════════ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="premium-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--fg)]">Asset Comparison</h2>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">Click column headers to sort</p>
            </div>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
              <input type="text" placeholder="Search assets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-9 rounded-xl border border-[var(--border)] bg-transparent pl-9 pr-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(139,115,85,0.3)] focus:border-[rgba(139,115,85,0.4)] transition-all" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] bg-[var(--bg-secondary)]">Property</th>
                  {[
                    { key: 'value' as const, label: 'Current Value' },
                    { key: 'roi' as const, label: 'ROI' },
                    { key: 'appreciation' as const, label: 'Appreciation' },
                  ].map(col => (
                    <th key={col.key} onClick={() => handleSort(col.key)} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] bg-[var(--bg-secondary)] cursor-pointer hover:text-[#8B7355] transition-colors">
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortCol === col.key && <ChevronDown className={cn('h-3 w-3 transition-transform', sortDir === 'asc' && 'rotate-180')} />}
                      </div>
                    </th>
                  ))}
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] bg-[var(--bg-secondary)]">Monthly Income</th>
                  <th onClick={() => handleSort('occupancy')} className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] bg-[var(--bg-secondary)] cursor-pointer hover:text-[#8B7355] transition-colors">
                    <div className="flex items-center gap-1">Occupancy {sortCol === 'occupancy' && <ChevronDown className={cn('h-3 w-3 transition-transform', sortDir === 'asc' && 'rotate-180')} />}</div>
                  </th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] bg-[var(--bg-secondary)]">Risk</th>
                  <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] bg-[var(--bg-secondary)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedAssets.map(asset => (
                  <tr key={asset.id} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[var(--fg)]">{asset.title}</p>
                      <p className="text-[11px] text-[var(--fg-muted)]">{asset.location}</p>
                    </td>
                    <td className="px-5 py-4"><span className="text-sm font-semibold text-[var(--fg)]">{formatCurrency(asset.currentValue)}</span></td>
                    <td className="px-5 py-4"><span className={cn('text-sm font-bold', asset.roi >= 5 ? 'text-[#22C55E]' : 'text-[#8B7355]')}>{asset.roi}%</span></td>
                    <td className="px-5 py-4">
                      <span className={cn('text-sm font-semibold', asset.appreciation >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>
                        {asset.appreciation >= 0 ? '+' : ''}{asset.appreciation}%
                      </span>
                    </td>
                    <td className="px-5 py-4"><span className="text-sm text-[var(--fg)]">{asset.monthlyRental ? formatCurrency(asset.monthlyRental) : '—'}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden max-w-[60px]">
                          <div className="h-full rounded-full" style={{ width: `${asset.occupancyRate}%`, backgroundColor: asset.occupancyRate >= 80 ? GREEN : asset.occupancyRate >= 40 ? BRAND : RED }} />
                        </div>
                        <span className="text-xs font-medium text-[var(--fg)]">{asset.occupancyRate}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={asset.occupancyRate === 0 ? 'danger' : asset.roi < 5 ? 'warning' : 'success'} className="text-[10px]">
                        {asset.occupancyRate === 0 ? 'High' : asset.roi < 5 ? 'Medium' : 'Low'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={statusVariant(asset.status)} className="capitalize text-[10px]">{asset.status.replace('-', ' ')}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ═══════════════ 6. ALLOCATION ANALYTICS ═══════════════ */}
        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { title: 'Allocation by Country', data: COUNTRY_ALLOCATION },
            { title: 'Allocation by Type', data: TYPE_ALLOCATION },
          ].map((chart, ci) => (
            <motion.div key={chart.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 + ci * 0.1 }}
              className="premium-card rounded-2xl p-6">
              <h2 className="text-[15px] font-semibold text-[var(--fg)] mb-1">{chart.title}</h2>
              <p className="text-[11px] text-[var(--fg-muted)] mb-4">Portfolio distribution</p>
              <div className="flex items-center gap-6">
                <div className="h-[180px] w-[180px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chart.data} cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                        {chart.data.map((d, j) => <Cell key={j} fill={d.color} stroke="none" />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {chart.data.map(d => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <div className="flex-1">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-medium text-[var(--fg)]">{d.name}</span>
                          <span className="text-xs font-bold text-[var(--fg)]">{d.value}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[var(--bg-tertiary)] mt-1 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${d.value}%`, backgroundColor: d.color, opacity: 0.6 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════ 7. CASH FLOW INTELLIGENCE ═══════════════ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="premium-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--fg)]">Cash Flow Intelligence</h2>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--fg-muted)]">Income vs expenses analysis</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Chart */}
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={CASH_FLOW_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <RTooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="income" fill={GREEN} radius={[4, 4, 0, 0]} barSize={20} opacity={0.8} name="Rent Income" />
                  <Bar dataKey="expenses" fill={RED} radius={[4, 4, 0, 0]} barSize={20} opacity={0.4} name="Costs" />
                  <Line type="monotone" dataKey="net" stroke={BRAND} strokeWidth={2.5} dot={{ r: 3, fill: BRAND }} name="Net Profit" isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Summary */}
            <div className="space-y-3">
              {[
                { label: 'Gross Income', value: `₹${cashFlowSummary.rentIncome.toLocaleString()}`, color: GREEN },
                { label: 'Taxes', value: `-₹${cashFlowSummary.taxes.toLocaleString()}`, color: 'var(--fg-secondary)' },
                { label: 'Mortgage', value: `-₹${cashFlowSummary.mortgage.toLocaleString()}`, color: 'var(--fg-secondary)' },
                { label: 'Maintenance', value: `-₹${cashFlowSummary.maintenance.toLocaleString()}`, color: 'var(--fg-secondary)' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                  <span className="text-xs text-[var(--fg-secondary)]">{item.label}</span>
                  <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[rgba(139,115,85,0.04)] border border-[rgba(139,115,85,0.15)]">
                <span className="text-xs font-semibold text-[#8B7355]">Net Profit</span>
                <span className="text-lg font-extrabold text-[#8B7355]">₹{cashFlowSummary.netProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════ 8. AI PERFORMANCE ADVISOR ═══════════════ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--fg)]">AI Performance Advisor</h2>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">Actionable intelligence from portfolio analysis</p>
            </div>
            <Badge className="bg-[rgba(139,115,85,0.08)] text-[#8B7355] border-[rgba(139,115,85,0.15)] text-[10px]">{PERF_INSIGHTS.length} recommendations</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {PERF_INSIGHTS.map((ins, i) => {
              const Icon = ins.icon;
              return (
                <motion.div
                  key={ins.id}
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, ease: 'easeOut', delay: 0.55 + i * 0.12 }}
                  whileHover={{ y: -3, boxShadow: `0 16px 40px ${ins.color}18` }}
                  className="premium-card rounded-xl overflow-hidden transition-shadow duration-300 cursor-default"
                  style={{ borderLeft: `3px solid ${ins.color}` }}
                >
                  {/* animated shimmer bar across top */}
                  <motion.div
                    className="h-[2px] w-full"
                    style={{ background: `linear-gradient(90deg, transparent, ${ins.color}, transparent)` }}
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.6, ease: 'easeInOut', delay: 0.8 + i * 0.15, repeat: Infinity, repeatDelay: 4 }}
                  />
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <motion.div
                        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${ins.color}10`, border: `1px solid ${ins.color}20` }}
                        animate={{ boxShadow: [`0 0 0px ${ins.color}00`, `0 0 10px ${ins.color}40`, `0 0 0px ${ins.color}00`] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: 1 + i * 0.3 }}
                      >
                        <Icon className="h-5 w-5" style={{ color: ins.color }} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: ins.color }}>{ins.category}</p>
                        <h4 className="text-sm font-semibold text-[var(--fg)] leading-snug">{ins.title}</h4>
                        <p className="text-xs text-[var(--fg-muted)] mt-1.5 leading-relaxed">{ins.description}</p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-[var(--fg-muted)] font-medium">Confidence</span>
                            <motion.span
                              className="text-[10px] font-bold"
                              style={{ color: ins.color }}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 1 + i * 0.1 }}
                            >
                              {ins.confidence}%
                            </motion.span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: `linear-gradient(90deg, ${ins.color}80, ${ins.color})` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${ins.confidence}%` }}
                              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.8 + i * 0.12 }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3.5">
                          <motion.div
                            className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                            style={{ background: `${ins.color}10`, border: `1px solid ${ins.color}20` }}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 + i * 0.1 }}
                          >
                            <span className="text-[10px] font-bold" style={{ color: ins.color }}>{ins.impact}</span>
                          </motion.div>
                          <Button size="sm" className="text-[11px] h-7 px-3" onClick={() => setScenarioOpen(true)}>
                            {ins.action} <ChevronRight className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══════════════ 9. SCENARIO SIMULATOR CTA ═══════════════ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
          className="premium-card rounded-2xl p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(139,115,85,1) 0%, transparent 60%)' }} />
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.15)] flex items-center justify-center flex-shrink-0">
                <Target className="h-7 w-7 text-[#8B7355]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--fg)]">Scenario Simulator</h3>
                <p className="text-sm text-[var(--fg-secondary)] mt-0.5">Model rent changes, refinancing, vacancy reduction and see projected ROI, cash flow & portfolio value</p>
              </div>
            </div>
            <Button onClick={() => setScenarioOpen(true)} className="">
              <Zap className="h-4 w-4" /> Launch Simulator
            </Button>
          </div>
        </motion.div>

        {/* ═══════════════ 10. REPORT DOWNLOAD ═══════════════ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="premium-card rounded-2xl p-6">
          <h2 className="text-[15px] font-semibold text-[var(--fg)] mb-1">Reports & Exports</h2>
          <p className="text-[11px] text-[var(--fg-muted)] mb-4">Download comprehensive performance reports</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { title: 'PDF Report', desc: 'Full performance summary with charts', icon: FileText, color: RED },
              { title: 'Excel Analytics', desc: 'Raw data tables and pivot analysis', icon: BarChart3, color: GREEN },
              { title: 'Investor Deck', desc: 'Presentation-ready portfolio overview', icon: Briefcase, color: PURPLE },
            ].map(report => {
              const handleDL = () => {
                const blob = new Blob([`${report.title}\nGenerated: ${new Date().toLocaleDateString()}\nPortfolio Performance Report — ESTRA GLIMMORA`], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `${report.title.replace(/\s/g, '_')}.txt`; a.click();
                URL.revokeObjectURL(url);
              };
              return (
                <button key={report.title} onClick={handleDL}
                  className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] hover:border-[rgba(139,115,85,0.3)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-all cursor-pointer text-left group">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${report.color}10`, border: `1px solid ${report.color}20` }}>
                    <report.icon className="h-5 w-5" style={{ color: report.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--fg)] group-hover:text-[#8B7355] transition-colors">{report.title}</p>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{report.desc}</p>
                  </div>
                  <Download className="h-4 w-4 text-[var(--fg-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </motion.div>

      </div>

      {/* Scenario Modal */}
      <ScenarioModal open={scenarioOpen} onClose={() => setScenarioOpen(false)} />

      {/* AI Analysis Drawer */}
      <AppDrawer open={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} size="md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[rgba(139,115,85,0.1)] flex items-center justify-center">
              <Brain className="h-4 w-4 text-[#8B7355]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--fg)]">AI Portfolio Analysis</h3>
              <p className="text-[11px] text-[var(--fg-muted)]">{PERF_INSIGHTS.length} actionable insights detected</p>
            </div>
          </div>
          <button onClick={() => setAiDrawerOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <AnimatePresence mode="wait">
            {aiRefreshing ? (
              <motion.div key={isRefreshAction ? 'refreshing' : 'analyzing'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-16 gap-5">
                {isRefreshAction ? (
                  /* ── Refresh Analysis: green bar chart animation ── */
                  <>
                    <div className="relative flex items-end gap-1.5 h-16">
                      {[0.4, 0.7, 0.55, 1, 0.65, 0.85, 0.5, 0.75, 0.9, 0.6].map((h, i) => (
                        <motion.div key={i} className="w-3 rounded-t-sm"
                          style={{ background: 'linear-gradient(180deg, #10B981, #059669)', height: `${h * 56}px` }}
                          animate={{ scaleY: [h, h * 0.4 + 0.3, h * 1.1, h], opacity: [0.7, 1, 0.8, 0.7] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }} />
                      ))}
                      <motion.div className="absolute inset-y-0 w-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.5)', top: 0, bottom: 0 }}
                        animate={{ left: ['0%', '100%', '0%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                    </div>
                    <div className="text-center">
                      <motion.p className="text-sm font-semibold text-[var(--fg)]" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>Refreshing analysis...</motion.p>
                      <motion.p className="text-[11px] text-[var(--fg-muted)] mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>Syncing with latest market signals</motion.p>
                    </div>
                    <motion.div className="w-48 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                      <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7)' }} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.6, ease: [0.25, 0.46, 0.45, 0.94] }} />
                    </motion.div>
                    <div className="flex flex-col gap-2 w-44">
                      {[['Fetching new data', 0.3], ['Recalculating scores', 0.8], ['Updating insights', 1.4]].map(([label, delay], i) => (
                        <motion.div key={i} className="flex items-center gap-2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: delay as number, duration: 0.3 }}>
                          <motion.div className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.3)' }}
                            animate={{ borderColor: ['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.8)', 'rgba(16,185,129,0.3)'] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}>
                            <motion.div className="h-1.5 w-1.5 rounded-full bg-[#10B981]" animate={{ scale: [0.6, 1, 0.6] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }} />
                          </motion.div>
                          <span className="text-[11px] text-[var(--fg-muted)]">{label as string}</span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* ── AI Analysis: blue orbital spinner ── */
                  <>
                    <div className="relative h-20 w-20">
                      <motion.div className="absolute -inset-3 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(139,115,85,0.12) 0%, transparent 70%)' }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
                      <div className="absolute inset-0 rounded-full border-[2px] border-[var(--bg-tertiary)]" />
                      <motion.div className="absolute inset-0 rounded-full"
                        style={{ border: '2.5px solid transparent', borderTopColor: '#8B7355', borderRightColor: 'rgba(139,115,85,0.3)' }}
                        animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }} />
                      <motion.div className="absolute inset-2 rounded-full"
                        style={{ border: '2px solid transparent', borderBottomColor: 'rgba(139,115,85,0.5)', borderLeftColor: 'rgba(139,115,85,0.15)' }}
                        animate={{ rotate: -360 }} transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }} />
                      <div className="absolute inset-3 rounded-full bg-[rgba(139,115,85,0.06)] flex items-center justify-center">
                        <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                          <Brain className="h-6 w-6 text-[#8B7355]" />
                        </motion.div>
                      </div>
                      {[0, 1, 2, 3].map(i => (
                        <motion.div key={i} className="absolute h-1.5 w-1.5 rounded-full bg-[#8B7355]" style={{ top: '50%', left: '50%' }}
                          animate={{ x: [0, Math.cos((i * Math.PI) / 2) * 36, 0], y: [0, Math.sin((i * Math.PI) / 2) * 36, 0], opacity: [0, 0.7, 0], scale: [0, 1, 0] }}
                          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }} />
                      ))}
                    </div>
                    <div className="text-center">
                      <motion.p className="text-sm font-semibold text-[var(--fg)]" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>Re-analyzing deals...</motion.p>
                      <motion.p className="text-[11px] text-[var(--fg-muted)] mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>Running AI models on latest market data</motion.p>
                    </div>
                    <motion.div className="w-48 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden" initial={{ opacity: 0, scaleX: 0.8 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.2 }}>
                      <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6F5C46, #A89478, #A89478)' }} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.3, ease: [0.25, 0.46, 0.45, 0.94] }} />
                    </motion.div>
                    <div className="flex items-center gap-2.5">
                      {['Scanning market data', 'Evaluating risks', 'Computing insights'].map((step, i) => (
                        <motion.span key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.2, duration: 0.3 }}
                          className="text-[10px] font-medium text-[#8B7355] px-2.5 py-1 rounded-full bg-[rgba(139,115,85,0.06)] border border-[rgba(139,115,85,0.12)] relative overflow-hidden">
                          <motion.span className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(139,115,85,0.08), transparent)' }} animate={{ x: ['-100%', '200%'] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }} />
                          <span className="relative">{step}</span>
                        </motion.span>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div key="ai-insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-4">
                {PERF_INSIGHTS.map((ins) => {
                  const Icon = ins.icon;
                  return (
                    <div key={ins.id} className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200" style={{ borderLeft: `3px solid ${ins.color}` }}>
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${ins.color}15` }}>
                            <Icon className="h-4 w-4" style={{ color: ins.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-[var(--fg)]">{ins.title}</h4>
                            <p className="text-xs text-[var(--fg-muted)] mt-1 leading-relaxed">{ins.description}</p>
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-[var(--fg-muted)]">Confidence</span>
                                <span className="text-[10px] font-bold" style={{ color: ins.color }}>{ins.confidence}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                                <div className="h-full rounded-full" style={{ backgroundColor: ins.barColor, width: `${ins.confidence}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[10px] font-bold" style={{ color: ins.color }}>{ins.impact}</span>
                              <Button size="sm" className="text-[11px] h-7 px-3" onClick={() => { setAiDrawerOpen(false); setScenarioOpen(true); }}>
                                {ins.action} <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <DrawerFooter>
          <Button variant="outline" className="flex-1" onClick={() => setAiDrawerOpen(false)}>Close</Button>
          <Button className="flex-1" onClick={() => { setIsRefreshAction(true); setAiRefreshing(true); setTimeout(() => setAiRefreshing(false), 2800); }}>
            <Zap className="h-4 w-4" /> Refresh Analysis
          </Button>
        </DrawerFooter>
      </AppDrawer>
    </PageContainer>
  );
}
