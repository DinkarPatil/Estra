'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, MapPin, Zap, Users, Clock, Shield,
  TrendingUp, Coins, Heart, AlertTriangle, DollarSign,
  Lock, CheckCircle2, Building2, Brain,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis,
} from 'recharts';
import { mockFractionalTokens, type FractionalToken } from '@/mock-data/fractional';
import { formatCurrency, formatNumber } from '@/lib/formatters';

function riskVariant(risk: FractionalToken['riskLevel']) {
  switch (risk) {
    case 'low': return 'success';
    case 'medium': return 'warning';
    case 'high': return 'danger';
  }
}

const BRAND = '#8B7355';
const GREEN = '#22C55E';

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

export default function FractionalDetailPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;

  const token = mockFractionalTokens.find((t) => t.id === id);

  const [tokenCount, setTokenCount] = useState(5);
  const [watchlisted, setWatchlisted] = useState(false);

  if (!token) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Coins className="h-12 w-12 text-[var(--fg-muted)] mb-4" />
          <h2 className="text-xl font-semibold text-[var(--fg)]">Token Not Found</h2>
          <Link href="/investor/fractional" className="mt-4 text-[#8B7355] hover:underline text-sm">
            Back to Marketplace
          </Link>
        </div>
      </PageContainer>
    );
  }

  const investmentCost = tokenCount * token.tokenPrice.amount;
  const annualIncome = investmentCost * (token.expectedYield / 100);

  const investorPieData = [
    { name: 'Tokens Sold', value: token.totalTokens - token.availableTokens },
    { name: 'Available', value: token.availableTokens },
  ];

  return (
    <PageContainer>
      <div className="mb-2">
        <Link
          href="/investor/fractional"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>
      </div>

      {/* Hero Image + Title */}
      {token.image && (
        <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden border border-[var(--border)]">
          <Image src={token.image} alt={token.propertyTitle} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={riskVariant(token.riskLevel)}>{token.riskLevel} risk</Badge>
              {token.isNew && <Badge variant="info">New Listing</Badge>}
              <Badge variant="default">{token.propertyType}</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{token.propertyTitle}</h1>
            <p className="text-sm text-white/70 flex items-center gap-1.5 mt-1">
              <MapPin className="h-4 w-4" /> {token.location}
            </p>
          </div>
        </div>
      )}

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Token Price', value: formatCurrency(token.tokenPrice), icon: Coins, color: BRAND },
          { label: 'Expected Yield', value: `${token.expectedYield}%`, icon: TrendingUp, color: GREEN },
          { label: 'AI Score', value: `${token.aiScore}/100`, icon: Zap, color: BRAND },
          { label: 'Days Left', value: token.daysLeft ? `${token.daysLeft} days` : 'Open', icon: Clock, color: '#8B7355' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${stat.color}14` }}>
                  <Icon className="h-4 w-4" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xs text-[var(--fg-muted)]">{stat.label}</p>
                  <p className="text-lg font-bold text-[var(--fg)]">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Funding Progress */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[var(--fg-secondary)] font-medium">Funding Progress</span>
          <span className="font-bold text-[var(--fg)]">{token.funded}% Funded</span>
        </div>
        <div className="h-3 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${token.funded}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-3 rounded-full bg-[#8B7355]"
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--fg-muted)] mt-2">
          <span>{token.investors} investors</span>
          <span>{formatCurrency(token.propertyValue)} property value</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Description + Terms + Performance */}
        <div className="space-y-6">
          {/* Description */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-3">About This Property</h2>
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="h-4 w-4 text-[#8B7355] mt-0.5 shrink-0" />
              <p className="text-sm text-[var(--fg-secondary)]">{token.location}</p>
            </div>
            <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
              {token.propertyTitle} is a premium {token.propertyType.toLowerCase()} offering fractional ownership
              through blockchain-backed tokens. Each token grants proportional rights to rental income and capital
              appreciation, secured by {token.spvName}.
            </p>
            <p className="text-sm text-[var(--fg-secondary)] leading-relaxed mt-3">
              This property has been independently valued and undergone full due diligence by ESTRA GLIMMORA&apos;s
              AI-powered analysis engine, achieving an AI score of {token.aiScore}/100 — placing it in the
              top-tier investment category.
            </p>
          </div>

          {/* Investment Terms */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-4">Investment Terms</h2>
            <div className="space-y-3">
              {[
                { label: 'Total Tokens', value: token.totalTokens.toLocaleString() },
                { label: 'Available Tokens', value: token.availableTokens.toLocaleString() },
                { label: 'Token Price', value: formatCurrency(token.tokenPrice) },
                { label: 'Minimum Investment', value: formatCurrency(token.minInvestment) },
                { label: 'Lockup Period', value: token.lockupPeriod },
                { label: 'Distribution', value: token.distributionFrequency },
                { label: 'Risk Level', value: token.riskLevel.charAt(0).toUpperCase() + token.riskLevel.slice(1) },
                { label: 'Expected Annual Yield', value: `${token.expectedYield}%` },
                { label: 'SPV', value: token.spvName },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm text-[var(--fg-muted)]">{item.label}</span>
                  <span className="text-sm font-semibold text-[var(--fg)]">{item.value}</span>
                </div>
              ))}
            </div>

            {token.riskLevel !== 'low' && (
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-[rgba(245,158,11,0.06)] border border-[rgba(245,158,11,0.2)] p-3">
                <AlertTriangle className="h-4 w-4 text-[#F59E0B] mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--fg-secondary)]">
                  This is a <strong>{token.riskLevel}-risk</strong> investment. Capital at risk. Please review all terms carefully before investing.
                </p>
              </div>
            )}
          </div>

          {/* Price Performance Chart */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-4">Token Price Performance</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={performanceData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="detailPerfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--fg-muted)' }} />
                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v}%`, 'Index']}
                />
                <Area type="monotone" dataKey="value" stroke={BRAND} strokeWidth={2} fill="url(#detailPerfGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            {token.appreciation && (
              <div className="flex items-center gap-2 mt-3 text-sm">
                <TrendingUp className="h-4 w-4 text-[#22C55E]" />
                <span className="text-[var(--fg-secondary)]">12M Appreciation:</span>
                <span className="font-semibold text-[#22C55E]">+{token.appreciation}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Invest Panel + Distribution */}
        <div className="space-y-6">
          {/* Invest Panel */}
          <div className="rounded-xl border-2 border-[#8B7355]/60 bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-4">Invest Now</h2>

            <div className="mb-4">
              <label className="text-xs font-medium text-[var(--fg-secondary)] block mb-1.5">
                Number of Tokens
              </label>
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
            </div>

            <div className="rounded-lg bg-[var(--bg-secondary)] p-4 space-y-2 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--fg-muted)]">Tokens</span>
                <span className="font-medium text-[var(--fg)]">{tokenCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--fg-muted)]">Token Price</span>
                <span className="font-medium text-[var(--fg)]">{formatCurrency(token.tokenPrice)}</span>
              </div>
              <div className="h-px bg-[var(--border)]" />
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-[var(--fg)]">Total Cost</span>
                <span className="text-lg font-bold text-[#8B7355]">
                  {token.tokenPrice.currency} {investmentCost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[var(--fg-muted)]">
                <span>Est. Annual Income</span>
                <span className="text-[#8B7355] font-medium">
                  {token.tokenPrice.currency} {Math.round(annualIncome).toLocaleString()}
                </span>
              </div>
              {token.monthlyIncome && (
                <div className="flex justify-between text-xs text-[var(--fg-muted)]">
                  <span>Property Monthly Income</span>
                  <span className="text-[#22C55E] font-medium">{formatCurrency(token.monthlyIncome)}</span>
                </div>
              )}
            </div>

            <button className="c-btn-primary w-full py-3 text-sm font-semibold mb-2 cursor-pointer">
              Invest Now
            </button>
            <button
              onClick={() => setWatchlisted(!watchlisted)}
              className={`w-full flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                watchlisted
                  ? 'border-[#8B7355] bg-[rgba(139,115,85,0.06)] text-[#8B7355]'
                  : 'border-[var(--border)] text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <Heart className={`h-4 w-4 ${watchlisted ? 'fill-current' : ''}`} />
              {watchlisted ? 'Watchlisted' : 'Add to Watchlist'}
            </button>
          </div>

          {/* Legal Structure */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-4">Legal & Security</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]">
                <Shield className="h-4 w-4 text-[#8B7355] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[var(--fg)]">SPV Structure</p>
                  <p className="text-xs text-[var(--fg-muted)]">{token.spvName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]">
                <Lock className="h-4 w-4 text-[#8B7355] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[var(--fg)]">Lockup Period</p>
                  <p className="text-xs text-[var(--fg-muted)]">Tokens locked for {token.lockupPeriod} from purchase</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-secondary)]">
                <CheckCircle2 className="h-4 w-4 text-[#22C55E] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-[var(--fg)]">Compliance</p>
                  <p className="text-xs text-[var(--fg-muted)]">Independently audited and RERA-compliant</p>
                </div>
              </div>
            </div>
          </div>

          {/* Token Distribution */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card">
            <h2 className="text-sm font-semibold text-[var(--fg)] mb-4">Token Distribution</h2>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={investorPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  paddingAngle={3}
                >
                  <Cell fill="#8B7355" />
                  <Cell fill="var(--bg-tertiary)" />
                </Pie>
                <Tooltip formatter={(v) => [`${Number(v).toLocaleString()} tokens`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-[var(--bg-secondary)] p-2">
                <p className="text-xs text-[var(--fg-muted)]">Total Tokens</p>
                <p className="text-sm font-bold text-[var(--fg)]">{token.totalTokens.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-secondary)] p-2">
                <p className="text-xs text-[var(--fg-muted)]">Investors</p>
                <p className="text-sm font-bold text-[var(--fg)]">{token.investors}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-secondary)] p-2">
                <p className="text-xs text-[var(--fg-muted)]">Available</p>
                <p className="text-sm font-bold text-[var(--fg)]">{token.availableTokens.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
