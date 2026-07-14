'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  AppDrawer, DrawerHeader, DrawerTabs, DrawerFooter,
  DrawerMetricsGrid, DrawerProgressBar, DrawerSection,
  type DrawerTab,
} from '@/components/ui/drawer';
import {
  Coins, TrendingUp, Users, DollarSign, Zap, Shield,
  Clock, MapPin, Search, Filter, ChevronDown, X,
  Heart, Brain, BarChart3, Sparkles, AlertTriangle,
  Building2, ArrowUpRight, ArrowRight, Check, Star,
  Eye, ExternalLink, Info, Lock, PieChart, Target,
  Globe, CheckCircle2, LayoutGrid, List,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip,
  PieChart as RPieChart, Pie, Cell,
} from 'recharts';
import { mockFractionalTokens, type FractionalToken } from '@/mock-data/fractional';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════ */

const BRAND = '#8B7355';
const BRAND_DARK = '#6F5C46';
const GREEN = '#22C55E';
const RED = '#EF4444';
const BLUE = '#8B7355';
const PURPLE = '#A89478';

type RiskLevel = FractionalToken['riskLevel'];
type SortKey = 'yield' | 'aiScore' | 'funded' | 'investors' | 'daysLeft';
type ViewMode = 'grid' | 'list';

function riskColor(risk: RiskLevel) {
  switch (risk) {
    case 'low': return GREEN;
    case 'medium': return BRAND;
    case 'high': return RED;
  }
}

function riskVariant(risk: RiskLevel) {
  switch (risk) {
    case 'low': return 'success' as const;
    case 'medium': return 'warning' as const;
    case 'high': return 'danger' as const;
  }
}

/* ═══════════════════════════════════════════════════
   ANIMATED COUNT HOOK
   ═══════════════════════════════════════════════════ */

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(id); }
      else setValue(Math.round(start * 10) / 10);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return value;
}

/* ═══════════════════════════════════════════════════
   SPARKLINE DATA
   ═══════════════════════════════════════════════════ */

const kpiSparklines = {
  totalValue: [40, 45, 43, 50, 55, 52, 60, 62, 58, 65, 70, 75],
  avgYield: [5.8, 6.0, 5.9, 6.2, 6.1, 6.3, 6.4, 6.2, 6.5, 6.3, 6.4, 6.2],
  investors: [800, 850, 920, 980, 1020, 1100, 1180, 1250, 1320, 1400, 1480, 1560],
  aiScore: [82, 84, 83, 85, 86, 85, 87, 88, 87, 89, 88, 87],
};

function MiniSparkline({ data, color, height = 28 }: { data: number[]; color: string; height?: number }) {
  const points = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#spark-${color.replace('#', '')})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════════════════════════
   TOKEN IMAGES
   ═══════════════════════════════════════════════════ */

const TOKEN_IMAGES: Record<string, string> = {
  'tok-001': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop&q=80',
  'tok-002': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=400&fit=crop&q=80',
  'tok-003': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=400&fit=crop&q=80',
  'tok-004': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=400&fit=crop&q=80',
  'tok-005': 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=400&fit=crop&q=80',
  'tok-006': 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=400&fit=crop&q=80',
};

/* ═══════════════════════════════════════════════════
   INVEST MODAL
   ═══════════════════════════════════════════════════ */

function InvestModal({ token, open, onClose }: { token: FractionalToken | null; open: boolean; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [tokenCount, setTokenCount] = useState(5);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (open) { setStep(1); setTokenCount(5); } }, [open]);

  if (!mounted || !token) return null;

  const investmentCost = tokenCount * token.tokenPrice.amount;
  const annualIncome = investmentCost * (token.expectedYield / 100);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div>
                <h2 className="text-lg font-semibold text-[var(--fg)]">Invest in {token.propertyTitle}</h2>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">{token.location}</p>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[var(--bg-secondary)] transition-colors">
                <X className="h-4 w-4 text-[var(--fg-muted)]" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 px-5 pt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all',
                    s < step ? 'bg-gradient-to-r from-[#6F5C46] to-[#A89478] text-white'
                      : s === step ? 'border-2 border-[#8B7355] text-[#8B7355]'
                      : 'border border-[var(--border)] text-[var(--fg-muted)]',
                  )}>
                    {s < step ? <Check className="h-3 w-3" /> : s}
                  </div>
                  {s < 3 && (
                    <div className={cn('flex-1 h-px', s < step ? 'bg-[#8B7355]' : 'bg-[var(--border)]')} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex px-5 mt-1 mb-4">
              {['Select Tokens', 'Review', 'Confirm'].map((label, i) => (
                <span key={label} className={cn('flex-1 text-[10px]', i === step - 1 ? 'text-[#8B7355] font-semibold' : 'text-[var(--fg-muted)]')}>
                  {label}
                </span>
              ))}
            </div>

            {/* Step 1: Select Tokens */}
            {step === 1 && (
              <div className="px-5 pb-5 space-y-4">
                <div>
                  <label className="text-xs font-medium text-[var(--fg-secondary)] block mb-1.5">Number of Tokens</label>
                  <input
                    type="number"
                    min={1}
                    max={token.availableTokens}
                    value={tokenCount}
                    onChange={(e) => setTokenCount(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                  />
                  <input
                    type="range"
                    min={1}
                    max={Math.min(100, token.availableTokens)}
                    value={tokenCount}
                    onChange={(e) => setTokenCount(Number(e.target.value))}
                    className="w-full mt-2 accent-[#8B7355]"
                  />
                  <div className="flex justify-between text-xs text-[var(--fg-muted)] mt-1">
                    <span>1 token</span>
                    <span>{Math.min(100, token.availableTokens)} tokens</span>
                  </div>
                </div>

                <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--fg-muted)]">Token Price</span>
                    <span className="font-medium text-[var(--fg)]">{formatCurrency(token.tokenPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--fg-muted)]">Quantity</span>
                    <span className="font-medium text-[var(--fg)]">{tokenCount}</span>
                  </div>
                  <div className="h-px bg-[var(--border)]" />
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold text-[var(--fg)]">Total Investment</span>
                    <span className="text-lg font-bold text-[#8B7355]">
                      {token.tokenPrice.currency} {investmentCost.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button onClick={() => setStep(2)} className="c-btn-primary w-full py-2.5 text-sm font-semibold cursor-pointer">
                  Continue to Review
                </button>
              </div>
            )}

            {/* Step 2: Review */}
            {step === 2 && (
              <div className="px-5 pb-5 space-y-4">
                <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Investment Summary</h3>
                  {[
                    { label: 'Property', value: token.propertyTitle },
                    { label: 'Tokens', value: tokenCount.toString() },
                    { label: 'Total Cost', value: `${token.tokenPrice.currency} ${investmentCost.toLocaleString()}` },
                    { label: 'Expected Yield', value: `${token.expectedYield}% p.a.` },
                    { label: 'Est. Annual Income', value: `${token.tokenPrice.currency} ${Math.round(annualIncome).toLocaleString()}` },
                    { label: 'Lockup Period', value: token.lockupPeriod },
                    { label: 'SPV', value: token.spvName },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-[var(--fg-muted)]">{item.label}</span>
                      <span className="font-medium text-[var(--fg)]">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-[rgba(139,115,85,0.06)] border border-[rgba(139,115,85,0.15)] p-3">
                  <Shield className="h-4 w-4 text-[#8B7355] mt-0.5 shrink-0" />
                  <p className="text-xs text-[var(--fg-secondary)]">
                    Your investment is secured by an SPV structure with full legal title ownership.
                    Tokens are blockchain-backed and transferable after the lockup period.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="c-btn-secondary flex-1 py-2.5 text-sm cursor-pointer">Back</button>
                  <button onClick={() => setStep(3)} className="c-btn-primary flex-1 py-2.5 text-sm font-semibold cursor-pointer">Confirm Investment</button>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="px-5 pb-5 space-y-4 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(34,197,94,0.1)] mt-2"
                >
                  <CheckCircle2 className="h-8 w-8 text-[#22C55E]" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--fg)]">Investment Submitted</h3>
                  <p className="text-sm text-[var(--fg-muted)] mt-1">
                    Your order for {tokenCount} tokens in {token.propertyTitle} has been submitted for processing.
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-4 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--fg-muted)]">Order ID</span>
                    <span className="font-mono text-xs text-[var(--fg)]">ORD-{Date.now().toString(36).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--fg-muted)]">Amount</span>
                    <span className="font-semibold text-[#8B7355]">{token.tokenPrice.currency} {investmentCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--fg-muted)]">Status</span>
                    <Badge variant="info">Processing</Badge>
                  </div>
                </div>
                <button onClick={onClose} className="c-btn-primary w-full py-2.5 text-sm font-semibold cursor-pointer">Done</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ═══════════════════════════════════════════════════
   TOKEN DETAIL DRAWER
   ═══════════════════════════════════════════════════ */

const DRAWER_TABS: DrawerTab[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'terms', label: 'Terms', icon: Shield },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp },
];

const performanceData = [
  { month: 'Jul', value: 96 },
  { month: 'Aug', value: 98 },
  { month: 'Sep', value: 97 },
  { month: 'Oct', value: 100 },
  { month: 'Nov', value: 102 },
  { month: 'Dec', value: 101 },
  { month: 'Jan', value: 104 },
  { month: 'Feb', value: 106 },
  { month: 'Mar', value: 105 },
  { month: 'Apr', value: 108 },
];

function TokenDetailDrawer({
  token,
  open,
  onClose,
  onInvest,
}: {
  token: FractionalToken | null;
  open: boolean;
  onClose: () => void;
  onInvest: (t: FractionalToken) => void;
}) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!token) return null;

  const pieData = [
    { name: 'Sold', value: token.totalTokens - token.availableTokens },
    { name: 'Available', value: token.availableTokens },
  ];

  return (
    <AppDrawer open={open} onClose={onClose} size="lg">
      {/* Hero Image */}
      <div className="relative h-44 shrink-0 overflow-hidden">
        <Image
          src={TOKEN_IMAGES[token.id] || TOKEN_IMAGES['tok-001']}
          alt={token.propertyTitle}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full bg-black/40 backdrop-blur-sm p-1.5 text-white/90 hover:bg-black/60 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={riskVariant(token.riskLevel)}>{token.riskLevel} risk</Badge>
            {token.isNew && <Badge variant="info">New</Badge>}
            <Badge variant="default">{token.propertyType}</Badge>
          </div>
          <h2 className="text-lg font-bold text-white">{token.propertyTitle}</h2>
          <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" /> {token.location}
          </p>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-3 divide-x divide-[var(--border)] border-b border-[var(--border)] shrink-0">
        {[
          { label: 'Yield', value: `${token.expectedYield}%`, color: GREEN },
          { label: 'AI Score', value: `${token.aiScore}/100`, color: BRAND },
          { label: 'Funded', value: `${token.funded}%`, color: BLUE },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3 text-center">
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <DrawerTabs
        tabs={DRAWER_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        layoutId="fractional-drawer-tab"
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <DrawerMetricsGrid
                columns={2}
                metrics={[
                  { label: 'Property Value', value: formatCurrency(token.propertyValue), icon: Building2 },
                  { label: 'Token Price', value: formatCurrency(token.tokenPrice), icon: Coins },
                  { label: 'Min Investment', value: formatCurrency(token.minInvestment), icon: DollarSign },
                  { label: 'Investors', value: formatNumber(token.investors), icon: Users, color: BLUE },
                ]}
              />

              <DrawerProgressBar
                label="Funding Progress"
                value={token.funded}
                description={`${token.availableTokens.toLocaleString()} tokens remaining`}
              />

              {/* Token Distribution Pie */}
              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-4">
                <h4 className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-3">Token Distribution</h4>
                <ResponsiveContainer width="100%" height={140}>
                  <RPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      <Cell fill={BRAND} />
                      <Cell fill="var(--bg-tertiary)" />
                    </Pie>
                    <RTooltip formatter={(v) => [`${Number(v).toLocaleString()} tokens`, '']} />
                  </RPieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full" style={{ background: BRAND }} />
                    <span className="text-[var(--fg-muted)]">Sold: {(token.totalTokens - token.availableTokens).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 rounded-full bg-[var(--bg-tertiary)]" />
                    <span className="text-[var(--fg-muted)]">Available: {token.availableTokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-4">
                <h4 className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-2">About</h4>
                <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
                  {token.propertyTitle} is a premium {token.propertyType.toLowerCase()} offering fractional ownership
                  through blockchain-backed tokens. Each token grants proportional rights to rental income
                  and capital appreciation, secured by {token.spvName}.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-4 space-y-3">
                <h4 className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider">Investment Terms</h4>
                {[
                  { label: 'Total Tokens', value: token.totalTokens.toLocaleString() },
                  { label: 'Available Tokens', value: token.availableTokens.toLocaleString() },
                  { label: 'Token Price', value: formatCurrency(token.tokenPrice) },
                  { label: 'Minimum Investment', value: formatCurrency(token.minInvestment) },
                  { label: 'Expected Yield', value: `${token.expectedYield}% p.a.` },
                  { label: 'Lockup Period', value: token.lockupPeriod },
                  { label: 'Distribution', value: token.distributionFrequency },
                  { label: 'Risk Level', value: token.riskLevel.charAt(0).toUpperCase() + token.riskLevel.slice(1) },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-[var(--border)] last:border-0">
                    <span className="text-xs text-[var(--fg-muted)]">{item.label}</span>
                    <span className="text-xs font-semibold text-[var(--fg)]">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-4">
                <h4 className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-2">Legal Structure</h4>
                <div className="space-y-2 text-xs text-[var(--fg-secondary)]">
                  <div className="flex items-start gap-2">
                    <Shield className="h-3.5 w-3.5 text-[#8B7355] mt-0.5 shrink-0" />
                    <p>SPV: <span className="font-medium text-[var(--fg)]">{token.spvName}</span></p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="h-3.5 w-3.5 text-[#8B7355] mt-0.5 shrink-0" />
                    <p>Tokens are locked for {token.lockupPeriod} from purchase date.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E] mt-0.5 shrink-0" />
                    <p>Independently audited and RERA-compliant where applicable.</p>
                  </div>
                </div>
              </div>

              {token.riskLevel !== 'low' && (
                <div className="flex items-start gap-2 rounded-xl bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] p-3">
                  <AlertTriangle className="h-4 w-4 text-[#F59E0B] mt-0.5 shrink-0" />
                  <p className="text-xs text-[var(--fg-secondary)]">
                    This is a <strong>{token.riskLevel}-risk</strong> investment. Capital at risk. Past performance is not indicative of future results.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-5"
            >
              {/* Performance Chart */}
              <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-4">
                <h4 className="text-xs font-semibold text-[var(--fg-secondary)] uppercase tracking-wider mb-3">Token Price Performance</h4>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={performanceData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} />
                    <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                    <RTooltip
                      contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                      formatter={(v) => [`${v}%`, 'Index']}
                    />
                    <Area type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2} fill="url(#perfGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <DrawerMetricsGrid
                columns={2}
                metrics={[
                  { label: 'Monthly Income', value: token.monthlyIncome ? formatCurrency(token.monthlyIncome) : 'N/A', icon: DollarSign, color: GREEN },
                  { label: '12M Appreciation', value: token.appreciation ? `+${token.appreciation}%` : 'N/A', icon: TrendingUp, color: BRAND },
                  { label: 'Distribution', value: token.distributionFrequency, icon: Clock },
                  { label: 'AI Confidence', value: `${token.aiScore}%`, icon: Brain, color: PURPLE },
                ]}
              />

              {/* AI Analysis */}
              <div className="rounded-xl bg-gradient-to-br from-[rgba(139,115,85,0.04)] to-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.15)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-[#8B7355]" />
                  <h4 className="text-xs font-semibold text-[var(--fg)]">AI Analysis</h4>
                </div>
                <p className="text-xs text-[var(--fg-secondary)] leading-relaxed">
                  Based on {token.investors} investor activity patterns and regional market data,
                  this property shows <span className="text-[#8B7355] font-semibold">strong fundamentals</span> with
                  projected yield stability over the next 12 months. The {token.location} market is trending
                  favorably for {token.propertyType.toLowerCase()} assets.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <DrawerFooter>
        <button className="c-btn-secondary flex-1 py-2.5 text-sm cursor-pointer" onClick={onClose}>Close</button>
        <button className="c-btn-primary flex-1 py-2.5 text-sm font-semibold cursor-pointer" onClick={() => onInvest(token)}>
          <Coins className="h-4 w-4 mr-1.5 inline" /> Invest Now
        </button>
      </DrawerFooter>
    </AppDrawer>
  );
}

/* ═══════════════════════════════════════════════════
   INVESTMENT CARD
   ═══════════════════════════════════════════════════ */

function InvestmentCard({
  token,
  view,
  onView,
  onInvest,
}: {
  token: FractionalToken;
  view: ViewMode;
  onView: () => void;
  onInvest: () => void;
}) {
  const [watchlisted, setWatchlisted] = useState(false);

  if (view === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="group rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card hover:shadow-card-hover transition-all hover:border-[rgba(139,115,85,0.3)] cursor-pointer"
        onClick={onView}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Thumbnail */}
          <div className="relative h-16 w-24 rounded-lg overflow-hidden shrink-0">
            <Image
              src={TOKEN_IMAGES[token.id] || TOKEN_IMAGES['tok-001']}
              alt={token.propertyTitle}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--fg)] truncate">{token.propertyTitle}</h3>
              {token.isNew && <Badge variant="info">New</Badge>}
            </div>
            <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" /> {token.location}
            </p>
          </div>

          {/* Stats */}
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center">
              <p className="text-sm font-bold text-[#8B7355]">{token.expectedYield}%</p>
              <p className="text-[10px] text-[var(--fg-muted)]">Yield</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-[var(--fg)]">{token.aiScore}</p>
              <p className="text-[10px] text-[var(--fg-muted)]">AI Score</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: riskColor(token.riskLevel) }}>{token.funded}%</p>
              <p className="text-[10px] text-[var(--fg-muted)]">Funded</p>
            </div>
            <div className="text-center">
              <Badge variant={riskVariant(token.riskLevel)}>{token.riskLevel}</Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setWatchlisted(!watchlisted); }}
              className="rounded-lg p-2 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <Heart className={cn('h-4 w-4', watchlisted ? 'text-[#EF4444] fill-current' : 'text-[var(--fg-muted)]')} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onInvest(); }}
              className="c-btn-primary px-3 py-1.5 text-xs font-semibold cursor-pointer"
            >
              Invest
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 hover:border-[rgba(139,115,85,0.3)] overflow-hidden cursor-pointer"
      onClick={onView}
    >
      {/* Image */}
      <div className="relative h-40 overflow-hidden">
        <Image
          src={TOKEN_IMAGES[token.id] || TOKEN_IMAGES['tok-001']}
          alt={token.propertyTitle}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Badge variant={riskVariant(token.riskLevel)}>{token.riskLevel} risk</Badge>
          {token.isNew && <Badge variant="info">New</Badge>}
        </div>

        {/* Watchlist */}
        <button
          onClick={(e) => { e.stopPropagation(); setWatchlisted(!watchlisted); }}
          className="absolute top-3 right-3 rounded-full bg-black/30 backdrop-blur-sm p-1.5 hover:bg-black/50 transition-colors"
        >
          <Heart className={cn('h-3.5 w-3.5', watchlisted ? 'text-[#EF4444] fill-current' : 'text-white/80')} />
        </button>

        {/* AI Score Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2 py-1">
          <Zap className="h-3 w-3 text-[#8B7355]" />
          <span className="text-[10px] font-bold text-white">{token.aiScore}</span>
        </div>

        {/* Days left */}
        {token.daysLeft && token.daysLeft <= 30 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm px-2 py-1">
            <Clock className="h-3 w-3 text-[#F59E0B]" />
            <span className="text-[10px] font-bold text-white">{token.daysLeft}d left</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-[var(--fg)] mb-0.5">{token.propertyTitle}</h3>
        <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1 mb-3">
          <MapPin className="h-3 w-3" /> {token.location}
        </p>

        {/* Yield Highlight */}
        <div className="rounded-lg bg-gradient-to-r from-[rgba(139,115,85,0.06)] to-[rgba(139,115,85,0.1)] border border-[rgba(139,115,85,0.15)] p-3 text-center mb-3">
          <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Expected Annual Yield</p>
          <p className="text-2xl font-bold text-[#8B7355]">{token.expectedYield}%</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="rounded-lg bg-[var(--bg-secondary)] p-2.5">
            <p className="text-[var(--fg-muted)]">Token Price</p>
            <p className="font-semibold text-[var(--fg)]">{formatCurrency(token.tokenPrice)}</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-secondary)] p-2.5">
            <p className="text-[var(--fg-muted)]">Min Investment</p>
            <p className="font-semibold text-[var(--fg)]">{formatCurrency(token.minInvestment)}</p>
          </div>
        </div>

        {/* Funding Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--fg-muted)]">Funded</span>
            <span className="font-semibold text-[var(--fg)]">{token.funded}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${token.funded}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-[#8B7355]"
            />
          </div>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-xs text-[var(--fg-muted)] mb-3">
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {token.investors}</span>
          <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> {token.lockupPeriod}</span>
        </div>

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); onInvest(); }}
          className="c-btn-primary flex w-full items-center justify-center gap-1.5 py-2.5 text-sm font-semibold cursor-pointer"
        >
          <Coins className="h-4 w-4" /> Invest Now
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function FractionalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [sortBy, setSortBy] = useState<SortKey>('aiScore');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [selectedToken, setSelectedToken] = useState<FractionalToken | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [investToken, setInvestToken] = useState<FractionalToken | null>(null);
  const [investModalOpen, setInvestModalOpen] = useState(false);

  /* Computed: filtered + sorted tokens */
  const filteredTokens = useMemo(() => {
    let tokens = [...mockFractionalTokens];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      tokens = tokens.filter(
        (t) => t.propertyTitle.toLowerCase().includes(q) || t.location.toLowerCase().includes(q),
      );
    }

    if (riskFilter !== 'all') {
      tokens = tokens.filter((t) => t.riskLevel === riskFilter);
    }

    tokens.sort((a, b) => {
      switch (sortBy) {
        case 'yield': return b.expectedYield - a.expectedYield;
        case 'aiScore': return b.aiScore - a.aiScore;
        case 'funded': return b.funded - a.funded;
        case 'investors': return b.investors - a.investors;
        case 'daysLeft': return (a.daysLeft ?? 999) - (b.daysLeft ?? 999);
      }
    });

    return tokens;
  }, [searchQuery, riskFilter, sortBy]);

  /* KPI computations */
  const totalValue = mockFractionalTokens.reduce((s, t) => s + t.propertyValue.amount / 1000, 0);
  const avgYield = mockFractionalTokens.reduce((s, t) => s + t.expectedYield, 0) / mockFractionalTokens.length;
  const totalInvestors = mockFractionalTokens.reduce((s, t) => s + t.investors, 0);
  const avgAiScore = Math.round(mockFractionalTokens.reduce((s, t) => s + t.aiScore, 0) / mockFractionalTokens.length);

  /* Animated counts */
  const animTotalValue = useCountUp(Math.round(totalValue));
  const animAvgYield = useCountUp(avgYield);
  const animInvestors = useCountUp(totalInvestors);
  const animAiScore = useCountUp(avgAiScore);

  function openDrawer(token: FractionalToken) {
    setSelectedToken(token);
    setDrawerOpen(true);
  }

  function openInvestModal(token: FractionalToken) {
    setInvestToken(token);
    setInvestModalOpen(true);
    setDrawerOpen(false);
  }

  return (
    <PageContainer>
      {/* ── Hero Header ────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--card-bg)] via-[var(--card-bg)] to-[rgba(139,115,85,0.04)] p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[rgba(139,115,85,0.15)] to-[rgba(139,115,85,0.05)] text-[#8B7355]">
                <Coins className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">Fractional Ownership</h1>
                <p className="text-sm text-[var(--fg-secondary)]">Premium tokenized real estate marketplace</p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
                </span>
                <span className="text-xs text-[var(--fg-muted)]">Live Marketplace</span>
              </div>
              <span className="text-xs text-[var(--fg-muted)]">{mockFractionalTokens.length} Active Offerings</span>
              <span className="text-xs text-[var(--fg-muted)]">{totalInvestors.toLocaleString()} Total Investors</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (filteredTokens.length > 0) openInvestModal(filteredTokens[0]);
              }}
              className="c-btn-primary px-4 py-2.5 text-sm font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <Target className="h-4 w-4" /> Quick Invest
            </button>
          </div>
        </div>
      </div>

      {/* ── How It Works — Collapsible Section ── */}
      <details className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card group" open>
        <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[rgba(139,115,85,0.08)] flex items-center justify-center">
              <Info className="h-4 w-4 text-[#8B7355]" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--fg)]">How Fractional Ownership Works</h3>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--fg-muted)] transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-5 pb-5 pt-2">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: BarChart3, title: 'Browse Properties', desc: 'Explore curated opportunities with AI-driven scoring.', color: BRAND, step: '01' },
              { icon: Coins, title: 'Purchase Tokens', desc: 'Select tokens representing fractional ownership in premium assets.', color: '#8B7355', step: '02' },
              { icon: TrendingUp, title: 'Earn Returns', desc: 'Receive proportional rental income plus capital appreciation.', color: GREEN, step: '03' },
              { icon: Shield, title: 'Exit Flexibly', desc: 'After lockup, trade tokens or redeem for fiat currency.', color: PURPLE, step: '04' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="flex items-start gap-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-4 hover:border-[rgba(139,115,85,0.15)] transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: `${s.color}14` }}>
                    <Icon className="h-5 w-5" style={{ color: s.color }} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider">Step {s.step}</span>
                    <h4 className="text-sm font-semibold text-[var(--fg)] mt-0.5">{s.title}</h4>
                    <p className="text-[11px] text-[var(--fg-muted)] mt-0.5 leading-snug">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </details>

      {/* ── KPI Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Property Value',
            value: `₹${Math.round(animTotalValue).toLocaleString()}K`,
            change: '+12.4%',
            changeUp: true,
            icon: Building2,
            color: BRAND,
            sparkData: kpiSparklines.totalValue,
          },
          {
            label: 'Avg. Expected Yield',
            value: `${animAvgYield.toFixed(1)}%`,
            change: '+0.3%',
            changeUp: true,
            icon: TrendingUp,
            color: GREEN,
            sparkData: kpiSparklines.avgYield,
          },
          {
            label: 'Total Investors',
            value: Math.round(animInvestors).toLocaleString(),
            change: '+8.2%',
            changeUp: true,
            icon: Users,
            color: BLUE,
            sparkData: kpiSparklines.investors,
          },
          {
            label: 'Avg. AI Score',
            value: `${animAiScore}/100`,
            change: '+2pts',
            changeUp: true,
            icon: Brain,
            color: PURPLE,
            sparkData: kpiSparklines.aiScore,
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${kpi.color}14` }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: kpi.color }} strokeWidth={1.5} />
                </div>
                <div className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md',
                  kpi.changeUp ? 'text-[#22C55E] bg-[rgba(34,197,94,0.08)]' : 'text-[#EF4444] bg-[rgba(239,68,68,0.08)]',
                )}>
                  {kpi.changeUp ? <ArrowUpRight className="h-3 w-3" /> : null}
                  {kpi.change}
                </div>
              </div>
              <p className="text-xl font-bold text-[var(--fg)] tracking-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                {kpi.value}
              </p>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5 mb-2">{kpi.label}</p>
              <MiniSparkline data={kpi.sparkData} color={kpi.color} />
            </motion.div>
          );
        })}
      </div>

      {/* ── Filter + Search Bar ────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
          <input
            type="text"
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] pl-9 pr-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[#8B7355] transition-shadow"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 hover:bg-[var(--bg-tertiary)]"
            >
              <X className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
            </button>
          )}
        </div>

        {/* Risk Filter */}
        <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
          {(['all', 'low', 'medium', 'high'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer',
                riskFilter === r
                  ? 'bg-[var(--card-bg)] text-[var(--fg)] shadow-sm'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]',
              )}
            >
              {r === 'all' ? 'All Risk' : `${r.charAt(0).toUpperCase() + r.slice(1)}`}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--fg)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
          >
            <option value="aiScore">AI Score</option>
            <option value="yield">Yield</option>
            <option value="funded">% Funded</option>
            <option value="investors">Investors</option>
            <option value="daysLeft">Days Left</option>
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5 ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'rounded-md p-1.5 transition-all cursor-pointer',
              viewMode === 'grid' ? 'bg-[var(--card-bg)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)]',
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded-md p-1.5 transition-all cursor-pointer',
              viewMode === 'list' ? 'bg-[var(--card-bg)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)]',
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Investment Cards ───────────────────────── */}
      {filteredTokens.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-12 text-center">
          <Search className="h-10 w-10 text-[var(--fg-muted)] mx-auto mb-3" />
          <p className="text-[var(--fg-secondary)] font-medium">No properties match your filters</p>
          <p className="text-sm text-[var(--fg-muted)] mt-1">Try adjusting your search or filter criteria.</p>
          <button
            onClick={() => { setSearchQuery(''); setRiskFilter('all'); }}
            className="c-btn-secondary mt-4 px-4 py-2 text-sm cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
            : 'space-y-3',
        )}>
          {filteredTokens.map((token) => (
            <InvestmentCard
              key={token.id}
              token={token}
              view={viewMode}
              onView={() => openDrawer(token)}
              onInvest={() => openInvestModal(token)}
            />
          ))}
        </div>
      )}

      {/* ── AI Recommendations ─────────────────────── */}
      <div className="rounded-xl border border-[var(--border)] bg-gradient-to-br from-[var(--card-bg)] via-[var(--card-bg)] to-[rgba(139,115,85,0.04)] p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[rgba(139,115,85,0.15)] to-[rgba(139,115,85,0.05)]">
            <Brain className="h-4 w-4 text-[#8B7355]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--fg)]">AI Investment Recommendations</h2>
            <p className="text-xs text-[var(--fg-muted)]">Powered by GLIMMORA Intelligence Engine</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: 'High Conviction Pick',
              token: mockFractionalTokens[0],
              reason: 'Highest AI score (94) with strong rental yields and prime Dubai location. Filling fast — 68% funded.',
              signal: 'Strong Buy',
              signalColor: GREEN,
            },
            {
              title: 'Best Value Entry',
              token: mockFractionalTokens[5],
              reason: 'Lowest entry point at ₹350/token with Manhattan exposure. Early stage (28% funded) means more upside potential.',
              signal: 'Opportunity',
              signalColor: BRAND,
            },
            {
              title: 'Momentum Alert',
              token: mockFractionalTokens[2],
              reason: 'Closing in 7 days with 83% funded. Mumbai market showing 11.3% appreciation. Act before close.',
              signal: 'Closing Soon',
              signalColor: '#F59E0B',
            },
          ].map((rec) => (
            <div
              key={rec.title}
              className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] p-4 hover:border-[rgba(139,115,85,0.3)] transition-colors cursor-pointer"
              onClick={() => openDrawer(rec.token)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">{rec.title}</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ color: rec.signalColor, background: `${rec.signalColor}14`, border: `1px solid ${rec.signalColor}30` }}
                >
                  {rec.signal}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[var(--fg)] mb-1">{rec.token.propertyTitle}</h3>
              <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1 mb-2">
                <MapPin className="h-3 w-3" /> {rec.token.location}
              </p>
              <p className="text-xs text-[var(--fg-secondary)] leading-relaxed mb-3">{rec.reason}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#8B7355]">{rec.token.expectedYield}% yield</span>
                <span className="text-xs text-[var(--fg-muted)] flex items-center gap-1">
                  View Details <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Social Proof & Trust ───────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Shield,
            title: 'Legally Protected',
            description: 'All properties held through SPV structures with full title ownership and regulatory compliance.',
            color: GREEN,
          },
          {
            icon: Globe,
            title: 'Global Marketplace',
            description: `${totalInvestors.toLocaleString()} investors across 6 countries trust GLIMMORA for fractional real estate investing.`,
            color: BLUE,
          },
          {
            icon: Zap,
            title: 'AI-Powered Analysis',
            description: 'Every listing undergoes rigorous AI due diligence with scores updated in real-time.',
            color: BRAND,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card text-center">
              <div
                className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl mb-3"
                style={{ background: `${item.color}14` }}
              >
                <Icon className="h-5 w-5" style={{ color: item.color }} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-[var(--fg)] mb-1">{item.title}</h3>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </div>

      {/* ── Drawers & Modals ───────────────────────── */}
      <TokenDetailDrawer
        token={selectedToken}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedToken(null); }}
        onInvest={openInvestModal}
      />

      <InvestModal
        token={investToken}
        open={investModalOpen}
        onClose={() => { setInvestModalOpen(false); setInvestToken(null); }}
      />
    </PageContainer>
  );
}
