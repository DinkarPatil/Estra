// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from '@/components/layout/page-container';
import { InvestorPageHeader } from '@/components/layout/investor-page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppDrawer, DrawerHero, DrawerTabs, DrawerFooter, DrawerProgressBar, type DrawerTab } from '@/components/ui/drawer';
import {
  Briefcase, DollarSign, TrendingUp, TrendingDown, Building2, MapPin,
  Plus, Download, Brain, ExternalLink, Search, Filter, MoreHorizontal,
  Edit3, Trash2, ChevronRight, X, Check, AlertTriangle, Zap,
  Target, Clock, FileText, Shield, Wrench, Calendar, ArrowUpRight,
  ArrowDownRight, Activity, Eye, Archive, Info, Loader2, ChevronDown,
  BarChart3, Maximize2, Share2, LineChart as LineChartIcon, ShieldAlert,
  Wallet, TrendingDown as TrendDown,
} from 'lucide-react';
import {
  mockPortfolioAssets, portfolioSummary, monthlyCashFlow, cashFlowSummary,
  upcomingActions, aiInsights,
  type PortfolioAsset, type UpcomingAction, type AIInsight,
} from '@/mock-data/portfolio';
import { portfolioValueHistory } from '@/mock-data/market-data';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, ReferenceLine,
} from 'recharts';

/* ─────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────── */

const BRAND = '#8B7355';
const BRAND_DARK = '#6F5C46';
const BRAND_LIGHT = 'rgba(139,115,85,0.10)';
const GREEN = '#22C55E';
const RED = '#EF4444';
const PURPLE = '#A89478';

const TIME_RANGES = ['1M', '3M', '6M', '1Y', 'ALL'] as const;
type TimeRange = typeof TIME_RANGES[number];

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'rented', label: 'Rented' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'listed', label: 'Listed' },
  { value: 'managed', label: 'Managed' },
  { value: 'under-review', label: 'Under Review' },
];

const SORT_OPTIONS = [
  { value: 'currentValue', label: 'Value' },
  { value: 'roi', label: 'ROI' },
  { value: 'appreciation', label: 'Appreciation' },
];

const PROPERTY_IMAGES: Record<string, string> = {
  'asset-001': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop&q=80',
  'asset-002': 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&h=500&fit=crop&q=80',
  'asset-003': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop&q=80',
};

const SPARKLINE_DATA = {
  totalValue: [
    { v: 4.80 }, { v: 4.96 }, { v: 5.12 }, { v: 5.25 },
    { v: 5.42 }, { v: 5.56 }, { v: 5.75 }, { v: 5.92 }, { v: 6.11 },
  ],
  rental: [
    { v: 1.45 }, { v: 1.50 }, { v: 1.55 }, { v: 1.60 },
    { v: 1.65 }, { v: 1.68 }, { v: 1.72 }, { v: 1.75 }, { v: 1.77 },
  ],
  roi: [
    { v: 4.8 }, { v: 5.0 }, { v: 5.3 }, { v: 5.6 },
    { v: 5.8 }, { v: 5.9 }, { v: 6.0 }, { v: 6.0 }, { v: 6.1 },
  ],
  properties: [
    { v: 1 }, { v: 1 }, { v: 2 }, { v: 2 },
    { v: 2 }, { v: 3 }, { v: 3 }, { v: 3 }, { v: 3 },
  ],
};

/* Benchmark data — INR amounts (rupees), parallel to portfolioValueHistory */
const BENCHMARK_DATA = [
  { date: '2024-01', value: 53700000, benchmark: 53700000 },
  { date: '2024-02', value: 54500000, benchmark: 54200000 },
  { date: '2024-03', value: 54200000, benchmark: 54700000 },
  { date: '2024-04', value: 55800000, benchmark: 55300000 },
  { date: '2024-05', value: 56900000, benchmark: 55800000 },
  { date: '2024-06', value: 56400000, benchmark: 56300000 },
  { date: '2024-07', value: 57800000, benchmark: 56800000 },
  { date: '2024-08', value: 58900000, benchmark: 57400000 },
  { date: '2024-09', value: 58300000, benchmark: 57900000 },
  { date: '2024-10', value: 60200000, benchmark: 58600000 },
  { date: '2024-11', value: 60800000, benchmark: 59200000 },
  { date: '2024-12', value: 61100000, benchmark: 59900000 },
  /* Forecast */
  { date: '2025-01', value: 61100000, benchmark: 60400000, forecast: 62800000 },
  { date: '2025-02', benchmark: 61000000, forecast: 64400000 },
  { date: '2025-03', benchmark: 61700000, forecast: 66200000 },
];

/* KPI tooltip descriptions */
const KPI_TOOLTIPS: Record<string, string> = {
  'Total Value': 'Total current market value of all owned properties.',
  'Monthly Rental': 'Combined monthly rental income from all leased assets.',
  'Avg ROI': 'Average annualized return on investment across portfolio.',
  'Properties': 'Total number of properties in your portfolio.',
};

/* ─────────────────────────────────────────────
   INSIGHT CATEGORIES — Issue 6 fix
   ───────────────────────────────────────────── */

type InsightCategory = 'opportunity' | 'alert' | 'cashflow' | 'risk';

const INSIGHT_CONFIG: Record<InsightCategory, { icon: React.ElementType; borderColor: string; bgTint: string; label: string }> = {
  opportunity: { icon: TrendingUp, borderColor: '#22C55E', bgTint: 'rgba(34,197,94,0.04)', label: 'Growth Opportunity' },
  alert: { icon: AlertTriangle, borderColor: '#F59E0B', bgTint: 'rgba(245,158,11,0.04)', label: 'Performance Alert' },
  cashflow: { icon: Wallet, borderColor: '#8B7355', bgTint: 'rgba(139,115,85,0.04)', label: 'Cash Flow Optimization' },
  risk: { icon: ShieldAlert, borderColor: '#EF4444', bgTint: 'rgba(239,68,68,0.04)', label: 'Risk Warning' },
};

/* Map insight IDs to categories for unique visual treatment */
const INSIGHT_CATEGORY_MAP: Record<string, InsightCategory> = {
  'ins-1': 'opportunity',
  'ins-2': 'alert',
  'ins-3': 'risk',
  'ins-4': 'cashflow',
};

/* ─────────────────────────────────────────────
   HELPER: status badge variant
   ───────────────────────────────────────────── */

function statusVariant(status: PortfolioAsset['status']) {
  switch (status) {
    case 'rented': return 'success';
    case 'vacant': return 'danger';
    case 'listed': return 'info';
    case 'managed': return 'default';
    case 'under-review': return 'warning';
    default: return 'secondary';
  }
}

/* ─────────────────────────────────────────────
   HELPER: Animated count-up number
   ───────────────────────────────────────────── */

function useCountUp(target: number, duration = 1200, prefix = '', suffix = '') {
  const [display, setDisplay] = useState(prefix + '0' + suffix);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      if (target >= 10000000) {
        setDisplay(prefix + '₹' + (current / 10000000).toFixed(1) + ' Cr');
      } else if (target >= 100000) {
        setDisplay(prefix + '₹' + (current / 100000).toFixed(2) + ' L');
      } else if (target >= 1000) {
        setDisplay(prefix + '₹' + Math.round(current).toLocaleString('en-IN'));
      } else if (Number.isInteger(target)) {
        setDisplay(prefix + Math.round(current).toString() + suffix);
      } else {
        setDisplay(prefix + current.toFixed(1) + suffix);
      }
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration, prefix, suffix]);

  return display;
}

/* ─────────────────────────────────────────────
   MINI SPARKLINE
   ───────────────────────────────────────────── */

function MiniSparkline({ data, color = BRAND, className = '' }: { data: { v: number }[]; color?: string; className?: string }) {
  return (
    <div className={`h-8 w-20 ${className}`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={40} minHeight={20}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PORTAL TOOLTIP — Issue 2 fix
   ───────────────────────────────────────────── */

function PortalTooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const updatePos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    }
  }, []);

  const handleEnter = () => {
    clearTimeout(hideTimer.current ?? undefined);
    updatePos();
    setShow(true);
  };

  const handleLeave = () => {
    hideTimer.current = setTimeout(() => setShow(false), 150);
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={(e) => { e.stopPropagation(); updatePos(); setShow(s => !s); }}
        className="inline-flex"
      >
        {children}
      </div>
      {show && mounted && createPortal(
        <div
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '12px',
              lineHeight: '1.5',
              color: '#374151',
              maxWidth: '240px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {content}
            {/* Arrow */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '100%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderTop: '7px solid #e5e5e5',
            }} />
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '100%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #ffffff',
              marginTop: '-1px',
            }} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   PORTFOLIO SCORE CARD — Premium mini dashboard
   ───────────────────────────────────────────── */

/* PortfolioScoreCard removed — health score now lives inline in the KPI grid */

/* ─────────────────────────────────────────────
   CUSTOM SORT DROPDOWN — Issue 4 fix
   ───────────────────────────────────────────── */

const SORT_ICONS: Record<string, React.ElementType> = {
  currentValue: DollarSign,
  roi: TrendingUp,
  appreciation: ArrowUpRight,
};

const SORT_DESCRIPTIONS: Record<string, string> = {
  currentValue: 'Sort by current market value',
  roi: 'Sort by return on investment',
  appreciation: 'Sort by price appreciation %',
};

function PremiumSortDropdown({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find(o => o.value === value)?.label || '';

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 h-9 rounded-xl border px-3.5 text-xs transition-all cursor-pointer shadow-sm ${
          open
            ? 'border-[rgba(139,115,85,0.4)] bg-[rgba(139,115,85,0.04)] text-[#8B7355] shadow-[0_0_0_3px_rgba(139,115,85,0.08)]'
            : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg)] hover:border-[rgba(139,115,85,0.3)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
        }`}
      >
        <Filter className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
        <span className="text-[var(--fg-muted)]">Sort:</span>
        <span className="font-semibold">{selectedLabel}</span>
        <ChevronDown className={`h-3 w-3 text-[var(--fg-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_16px_48px_rgba(0,0,0,0.15),0_0_0_1px_rgba(139,115,85,0.06)] overflow-hidden"
          >
            <div className="px-3.5 py-2.5 border-b border-[var(--border)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">Sort Assets By</p>
            </div>
            {options.map((opt, i) => {
              const SortIcon = SORT_ICONS[opt.value] || TrendingUp;
              const isActive = value === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`flex w-full items-center gap-3 px-3.5 py-3 text-xs transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-[rgba(139,115,85,0.06)] text-[var(--fg)]'
                      : 'text-[var(--fg)] hover:bg-[var(--bg-secondary)]'
                  } ${i < options.length - 1 ? 'border-b border-[var(--border-light)]' : ''}`}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#8B7355]" />
                  )}
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0 ${
                    isActive ? 'bg-[rgba(139,115,85,0.12)]' : 'bg-[var(--bg-secondary)]'
                  }`}>
                    <SortIcon className={`h-3.5 w-3.5 ${isActive ? 'text-[#8B7355]' : 'text-[var(--fg-muted)]'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-xs ${isActive ? 'font-semibold text-[#8B7355]' : 'font-medium'}`}>{opt.label}</p>
                    <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{SORT_DESCRIPTIONS[opt.value]}</p>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-[#8B7355] flex-shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ADD ASSET MODAL
   ───────────────────────────────────────────── */

function AddAssetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', location: '', type: 'Residential', purchasePrice: '', currentValue: '', rentStatus: 'vacant',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Property name is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.purchasePrice || isNaN(Number(form.purchasePrice))) e.purchasePrice = 'Valid price required';
    if (!form.currentValue || isNaN(Number(form.currentValue))) e.currentValue = 'Valid value required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setSaving(false);
    onClose();
    setForm({ name: '', location: '', type: 'Residential', purchasePrice: '', currentValue: '', rentStatus: 'vacant' });
    setErrors({});
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader>
        <DialogTitle>Add New Asset</DialogTitle>
        <DialogDescription>Add a property to your portfolio</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        <Input label="Property Name" placeholder="e.g. Marina Bay Penthouse" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} error={errors.name} />
        <Input label="Location" placeholder="e.g. Singapore" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} error={errors.location} />
        <Select label="Property Type" value={form.type} onChange={v => setForm(p => ({ ...p, type: v }))} options={[
          { value: 'Residential', label: 'Residential' },
          { value: 'Commercial', label: 'Commercial' },
          { value: 'Land', label: 'Land' },
          { value: 'Mixed-Use', label: 'Mixed-Use' },
        ]} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Purchase Price (₹ INR)" type="number" placeholder="0" value={form.purchasePrice} onChange={e => setForm(p => ({ ...p, purchasePrice: e.target.value }))} error={errors.purchasePrice} />
          <Input label="Current Value (₹ INR)" type="number" placeholder="0" value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue: e.target.value }))} error={errors.currentValue} />
        </div>
        <Select label="Rent Status" value={form.rentStatus} onChange={v => setForm(p => ({ ...p, rentStatus: v }))} options={[
          { value: 'vacant', label: 'Vacant' },
          { value: 'rented', label: 'Rented' },
          { value: 'listed', label: 'Listed' },
        ]} />
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} isLoading={saving} className="">
          <Plus className="h-4 w-4" /> Save Asset
        </Button>
      </div>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   EXPORT DROPDOWN
   ───────────────────────────────────────────── */

function generateCSV(): string {
  const header = ['Property', 'Location', 'Type', 'Purchase Price', 'Current Value', 'Currency', 'Appreciation %', 'ROI %', 'Status', 'Occupancy %', 'Monthly Rental', 'Tenant', 'Lease Expiry'];
  const rows = mockPortfolioAssets.map(a => [
    a.title, a.location, a.type,
    a.purchasePrice.amount, a.currentValue.amount, a.currentValue.currency,
    a.appreciation, a.roi, a.status, a.occupancyRate,
    a.monthlyRental?.amount ?? '', a.tenantName ?? '', a.leaseExpiry ?? '',
  ]);
  return [header.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
}

function generateJSON(): string {
  const report = {
    exportDate: new Date().toISOString(),
    summary: portfolioSummary,
    assets: mockPortfolioAssets.map(a => ({
      title: a.title, location: a.location, type: a.type,
      purchasePrice: a.purchasePrice, currentValue: a.currentValue,
      appreciation: a.appreciation, roi: a.roi, status: a.status,
      occupancyRate: a.occupancyRate, monthlyRental: a.monthlyRental,
      tenantName: a.tenantName, leaseExpiry: a.leaseExpiry,
    })),
    cashFlow: { monthly: monthlyCashFlow, summary: cashFlowSummary },
  };
  return JSON.stringify(report, null, 2);
}

function downloadFile(content: string | Uint8Array, filename: string, mimeType: string) {
  const blob = content instanceof Uint8Array
    ? new Blob([content as unknown as BlobPart], { type: mimeType })
    : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────
   REAL PDF GENERATOR — valid binary PDF
   ───────────────────────────────────────────── */

function generatePortfolioPDF(): Uint8Array {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let bytePos = 0;

  function w(s: string) {
    const b = enc.encode(s);
    chunks.push(b);
    bytePos += b.length;
  }

  function esc(s: string) {
    return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  /* --- Build report lines --- */
  const lines: { text: string; bold?: boolean; size?: number; gap?: number }[] = [
    { text: 'ESTRA GLIMMORA', bold: true, size: 18 },
    { text: 'Portfolio Report', size: 12, gap: 6 },
    { text: `Generated: ${new Date().toLocaleDateString()}`, size: 9, gap: 20 },
    { text: 'PORTFOLIO SUMMARY', bold: true, size: 11 },
    { text: `Total Value:  Rs.${portfolioSummary.totalValue.amount.toLocaleString('en-IN')}`, size: 10 },
    { text: `Total Invested:  Rs.${portfolioSummary.totalInvested.amount.toLocaleString('en-IN')}`, size: 10 },
    { text: `Unrealized Gain:  Rs.${portfolioSummary.unrealizedGain.amount.toLocaleString('en-IN')}`, size: 10 },
    { text: `Monthly Rental:  Rs.${portfolioSummary.monthlyRental.amount.toLocaleString('en-IN')}`, size: 10 },
    { text: `Average ROI:  ${portfolioSummary.avgROI}%`, size: 10 },
    { text: `Avg Occupancy:  ${portfolioSummary.avgOccupancy}%`, size: 10 },
    { text: `Total Assets:  ${portfolioSummary.totalAssets}`, size: 10, gap: 16 },
  ];

  mockPortfolioAssets.forEach(a => {
    lines.push({ text: a.title, bold: true, size: 11 });
    lines.push({ text: `${a.location}  |  ${a.type}  |  ${a.status}`, size: 9 });
    lines.push({ text: `Purchase: ${a.purchasePrice.amount.toLocaleString()} ${a.purchasePrice.currency}    Current: ${a.currentValue.amount.toLocaleString()} ${a.currentValue.currency}`, size: 9 });
    lines.push({ text: `Appreciation: +${a.appreciation}%    ROI: ${a.roi}%    Occupancy: ${a.occupancyRate}%`, size: 9 });
    if (a.tenantName) lines.push({ text: `Tenant: ${a.tenantName}`, size: 9 });
    if (a.monthlyRental) lines.push({ text: `Monthly Rent: ${a.monthlyRental.amount.toLocaleString()} ${a.monthlyRental.currency}`, size: 9 });
    lines.push({ text: '', size: 9, gap: 10 });
  });

  lines.push({ text: 'CASH FLOW SUMMARY', bold: true, size: 11 });
  lines.push({ text: `Rent Income: $${cashFlowSummary.rentIncome.toLocaleString()}    Taxes: -$${cashFlowSummary.taxes.toLocaleString()}`, size: 9 });
  lines.push({ text: `Maintenance: -$${cashFlowSummary.maintenance.toLocaleString()}    Mortgage: -$${cashFlowSummary.mortgage.toLocaleString()}`, size: 9 });
  lines.push({ text: `Net Profit: $${cashFlowSummary.netProfit.toLocaleString()}`, size: 10, gap: 20 });
  lines.push({ text: 'Report generated by Estra Glimmora', size: 8 });

  /* --- Build PDF text stream --- */
  let y = 740;
  const streamLines: string[] = [];
  for (const line of lines) {
    if (y < 60) break;
    const font = line.bold ? '/F2' : '/F1';
    const sz = line.size || 10;
    if (line.text) {
      streamLines.push(`BT ${font} ${sz} Tf 56 ${y} Td (${esc(line.text)}) Tj ET`);
    }
    y -= (line.gap || (sz + 4));
  }
  const streamText = streamLines.join('\n');
  const streamBytes = enc.encode(streamText);

  /* --- PDF structure --- */
  const offsets: number[] = [];

  // Header
  w('%PDF-1.4\n');

  // Obj 1: Catalog
  offsets.push(bytePos);
  w('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  offsets.push(bytePos);
  w('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Obj 3: Page
  offsets.push(bytePos);
  w('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n');

  // Obj 4: Content stream
  offsets.push(bytePos);
  w(`4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
  chunks.push(streamBytes);
  bytePos += streamBytes.length;
  w('\nendstream\nendobj\n');

  // Obj 5: Font (regular)
  offsets.push(bytePos);
  w('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');

  // Obj 6: Font (bold)
  offsets.push(bytePos);
  w('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');

  // Cross-reference table
  const xrefPos = bytePos;
  w('xref\n');
  w(`0 7\n`);
  w('0000000000 65535 f \n');
  for (const off of offsets) {
    w(String(off).padStart(10, '0') + ' 00000 n \n');
  }

  // Trailer
  w('trailer\n<< /Root 1 0 R /Size 7 >>\n');
  w('startxref\n');
  w(`${xrefPos}\n`);
  w('%%EOF');

  // Concatenate all chunks
  const total = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function ExportDropdown() {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exported, setExported] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExport = async (format: string) => {
    setExporting(format);
    // small delay for UX feedback
    await new Promise(r => setTimeout(r, 400));
    const dateStr = new Date().toISOString().split('T')[0];
    switch (format) {
      case 'CSV':
        downloadFile(generateCSV(), `estra-portfolio-${dateStr}.csv`, 'text/csv;charset=utf-8');
        break;
      case 'PDF': {
        const pdfBytes = generatePortfolioPDF();
        downloadFile(pdfBytes, `estra-portfolio-${dateStr}.pdf`, 'application/pdf');
        break;
      }
      case 'Excel':
        // Excel-compatible CSV with BOM for proper encoding
        downloadFile('\uFEFF' + generateCSV(), `estra-portfolio-${dateStr}.xls`, 'application/vnd.ms-excel');
        break;
    }
    setExporting(null);
    setExported(format);
    setTimeout(() => { setExported(null); setOpen(false); }, 1200);
  };

  const EXPORT_FORMATS = [
    { key: 'CSV', desc: 'Spreadsheet data', icon: FileText },
    { key: 'PDF', desc: 'Portfolio report', icon: FileText },
    { key: 'Excel', desc: 'Microsoft Excel', icon: BarChart3 },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 h-9 rounded-xl border px-3.5 text-xs font-medium transition-all cursor-pointer ${
          open
            ? 'border-[rgba(139,115,85,0.4)] bg-[rgba(139,115,85,0.04)] text-[#8B7355] shadow-[0_0_0_3px_rgba(139,115,85,0.08)]'
            : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg)] hover:border-[rgba(139,115,85,0.3)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
        }`}
      >
        <Download className="h-3.5 w-3.5" />
        Export
        <ChevronDown className={`h-3 w-3 text-[var(--fg-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_16px_48px_rgba(0,0,0,0.15),0_0_0_1px_rgba(139,115,85,0.06)] overflow-hidden"
          >
            <div className="px-3.5 py-2.5 border-b border-[var(--border)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">Export Portfolio</p>
            </div>
            {EXPORT_FORMATS.map((fmt, i) => {
              const FmtIcon = fmt.icon;
              const isDone = exported === fmt.key;
              return (
                <button
                  key={fmt.key}
                  onClick={() => handleExport(fmt.key)}
                  disabled={exporting !== null}
                  className={`flex w-full items-center gap-3 px-3.5 py-3 text-xs transition-all disabled:opacity-50 cursor-pointer group ${
                    isDone
                      ? 'bg-[rgba(34,197,94,0.04)] text-[var(--fg)]'
                      : 'text-[var(--fg)] hover:bg-[var(--bg-secondary)]'
                  } ${i < EXPORT_FORMATS.length - 1 ? 'border-b border-[var(--border-light)]' : ''}`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${
                    isDone ? 'bg-[rgba(34,197,94,0.1)]' : 'bg-[var(--bg-secondary)] group-hover:bg-[rgba(139,115,85,0.08)]'
                  } transition-colors`}>
                    {exporting === fmt.key ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8B7355]" />
                    ) : isDone ? (
                      <Check className="h-3.5 w-3.5 text-[#22C55E]" />
                    ) : (
                      <FmtIcon className="h-3.5 w-3.5 text-[var(--fg-muted)] group-hover:text-[#8B7355] transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium">{fmt.key}</p>
                    <p className={`text-[10px] ${isDone ? 'text-[#22C55E] font-medium' : 'text-[var(--fg-muted)]'}`}>{isDone ? 'Downloaded!' : fmt.desc}</p>
                  </div>
                  {!isDone && !exporting && (
                    <Download className="h-3 w-3 text-[var(--fg-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   AI ANALYZE DRAWER
   ───────────────────────────────────────────── */

function AIDrawer({ open, onClose, insights, onAction, aiRefreshing }: { open: boolean; onClose: () => void; insights: AIInsight[]; onAction?: (insight: AIInsight) => void; aiRefreshing?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="ai-drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-[1000] w-full max-w-md bg-[var(--bg-elevated)] border-l border-[var(--border)] shadow-2xl flex flex-col"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#8B7355] to-[#6F5C46] shadow-[0_2px_8px_rgba(139,115,85,0.3)]">
                  <Brain className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--fg)]">AI Portfolio Analysis</h3>
                  <p className="text-[10px] text-[var(--fg-muted)]">Powered by Glimmora AI</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                <X className="h-4 w-4 text-[var(--fg-muted)]" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 pb-8">
              <AnimatePresence mode="wait">
                {aiRefreshing ? (
                  <motion.div key="ai-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-16 gap-5">
                    <div className="relative h-20 w-20">
                      <motion.div className="absolute -inset-3 rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(139,115,85,0.12) 0%, transparent 70%)' }}
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
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
                        <motion.div key={i} className="absolute h-1.5 w-1.5 rounded-full bg-[#8B7355]"
                          style={{ top: '50%', left: '50%' }}
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
                  </motion.div>
                ) : (
                  <motion.div key="ai-insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-4">
                    {/* Summary bar */}
                    <div className="rounded-xl bg-[rgba(139,115,85,0.04)] border border-[rgba(139,115,85,0.12)] p-3.5 flex items-center gap-3">
                      <Zap className="h-4 w-4 text-[#8B7355] flex-shrink-0" />
                      <p className="text-xs text-[var(--fg-secondary)] leading-relaxed">
                        <span className="font-semibold text-[var(--fg)]">{insights.length} actionable insights</span> detected across your portfolio based on market data, tenant history, and financial trends.
                      </p>
                    </div>

              {insights.map((insight, i) => {
                const category = INSIGHT_CATEGORY_MAP[insight.id] || 'opportunity';
                const config = INSIGHT_CONFIG[category];
                const CatIcon = config.icon;
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.1 }}
                    className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
                  >
                    {/* Category header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[rgba(139,115,85,0.08)]">
                        <CatIcon className="h-3.5 w-3.5 text-[#8B7355]" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8B7355]">{config.label}</span>
                    </div>

                    {/* Content */}
                    <h4 className="text-sm font-semibold text-[var(--fg)] leading-snug mb-2">{insight.title}</h4>
                    <p className="text-xs text-[var(--fg-muted)] leading-relaxed mb-4">{insight.description}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)]">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#8B7355]">{insight.impact}</span>
                        <div className="flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] px-2 py-0.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#8B7355]" />
                          <span className="text-[10px] font-medium text-[var(--fg-secondary)]">{insight.confidence}%</span>
                        </div>
                      </div>
                      <Button
                        size="sm" variant="outline"
                        className="text-xs h-7 hover:border-[var(--fg-muted)]"
                        onClick={() => { onAction?.(insight); onClose(); }}
                      >
                        {insight.action} <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────────────────────
   PROPERTY DETAIL DRAWER — Issue 5 upgrade
   ───────────────────────────────────────────── */

function PropertyDrawer({ asset, onClose }: { asset: PortfolioAsset | null; onClose: () => void }) {
  const [tab, setTab] = useState<string>('overview');
  const [saving, setSaving] = useState(false);

  if (!asset) return null;

  const drawerTabs: DrawerTab[] = [
    { key: 'overview', label: 'Overview', icon: Eye },
    { key: 'financials', label: 'Financials', icon: DollarSign },
    { key: 'tenant', label: 'Tenant', icon: Building2 },
    { key: 'documents', label: 'Docs', icon: FileText },
    { key: 'activity', label: 'Activity', icon: Activity },
  ];

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    setSaving(false);
  };

  const handleDownloadStatement = () => {
    const g = asset.currentValue.amount - asset.purchasePrice.amount;
    const header = ['Field', 'Value'];
    const rows = [
      ['Property', asset.title],
      ['Location', asset.location],
      ['Type', asset.type],
      ['Status', asset.status],
      ['Purchase Price', `${asset.purchasePrice.amount} ${asset.purchasePrice.currency}`],
      ['Current Value', `${asset.currentValue.amount} ${asset.currentValue.currency}`],
      ['Unrealized Gain', `${g} ${asset.currentValue.currency}`],
      ['Appreciation', `${asset.appreciation}%`],
      ['ROI', `${asset.roi}%`],
      ['Occupancy Rate', `${asset.occupancyRate}%`],
      ['Tenant', asset.tenantName || 'Vacant'],
      ['Monthly Rental', asset.monthlyRental ? `${asset.monthlyRental.amount} ${asset.monthlyRental.currency}` : 'N/A'],
      ['Lease Expiry', asset.leaseExpiry || 'N/A'],
      ['Report Generated', new Date().toLocaleDateString()],
    ];
    const csv = [header.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    downloadFile(csv, `${asset.title.replace(/\s+/g, '-').toLowerCase()}-statement.csv`, 'text/csv;charset=utf-8');
  };

  const ACTIVITY_LOG = [
    { date: '2025-04-10', text: 'Quarterly valuation updated', type: 'valuation', icon: TrendingUp },
    { date: '2025-03-15', text: 'Rent payment received', type: 'payment', icon: DollarSign },
    { date: '2025-02-28', text: 'Insurance renewed', type: 'document', icon: Shield },
    { date: '2025-01-20', text: 'Property inspection completed', type: 'maintenance', icon: Wrench },
    { date: '2024-12-01', text: 'Lease agreement signed', type: 'lease', icon: FileText },
  ];

  const ACTIVITY_COLORS: Record<string, string> = {
    valuation: '#8B7355', payment: '#22C55E', document: '#8B7355', maintenance: '#F59E0B', lease: '#A89478',
  };

  const gain = asset.currentValue.amount - asset.purchasePrice.amount;
  const gainPercent = ((gain / asset.purchasePrice.amount) * 100).toFixed(1);

  /* Simple value history for the property mini chart */
  const PROPERTY_VALUE_HISTORY = [
    { m: 'Purchase', v: asset.purchasePrice.amount },
    { m: 'Q1', v: asset.purchasePrice.amount * (1 + asset.appreciation * 0.25 / 100) },
    { m: 'Q2', v: asset.purchasePrice.amount * (1 + asset.appreciation * 0.5 / 100) },
    { m: 'Q3', v: asset.purchasePrice.amount * (1 + asset.appreciation * 0.75 / 100) },
    { m: 'Now', v: asset.currentValue.amount },
  ];

  return (
    <AppDrawer open={!!asset} onClose={onClose} size="md">
      <DrawerHero
        imageSrc={PROPERTY_IMAGES[asset.id] || PROPERTY_IMAGES['asset-001']}
        imageAlt={asset.title}
        title={asset.title}
        subtitle={asset.location}
        badges={[
          { label: asset.type },
          { label: asset.status.replace('-', ' '), variant: statusVariant(asset.status) },
        ]}
        onClose={onClose}
      />

      {/* Quick stats bar */}
      <div className="grid grid-cols-3 gap-px bg-[var(--border)] flex-shrink-0">
        {[
          { label: 'Value', value: formatCurrency(asset.currentValue), gold: false },
          { label: 'Gain', value: `+${gainPercent}%`, gold: true },
          { label: 'ROI', value: `${asset.roi}%`, gold: false },
        ].map(s => (
          <div key={s.label} className="bg-[var(--bg-elevated)] px-3 py-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)]">{s.label}</p>
            <p className={`text-sm font-bold mt-0.5 ${s.gold ? 'text-[#8B7355]' : 'text-[var(--fg)]'}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <DrawerTabs tabs={drawerTabs} activeTab={tab} onTabChange={setTab} layoutId="property-drawer-tab" />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {tab === 'overview' && (
            <>
              {/* Value trend mini chart */}
              <div className="rounded-xl bg-[var(--bg-secondary)] p-4 border border-[var(--border-light)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">Value Trend</p>
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-[#4ADE80]" />
                    <span className="text-xs font-semibold text-[#4ADE80]">+{asset.appreciation}%</span>
                  </div>
                </div>
                <div className="h-[100px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={PROPERTY_VALUE_HISTORY}>
                      <defs>
                        <linearGradient id="propValueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={BRAND} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="m" tick={{ fontSize: 9 }} stroke="var(--fg-muted)" tickLine={false} axisLine={false} />
                      <Area type="monotone" dataKey="v" stroke={BRAND} strokeWidth={2} fill="url(#propValueGrad)" dot={{ r: 3, fill: BRAND, strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key details grid */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-3">Property Details</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Purchase Price', value: formatCurrency(asset.purchasePrice), icon: DollarSign },
                    { label: 'Current Value', value: formatCurrency(asset.currentValue), icon: TrendingUp },
                    { label: 'Unrealized Gain', value: formatCurrency({ amount: gain, currency: asset.currentValue.currency }), icon: Zap, highlight: true },
                    { label: 'Annual ROI', value: `${asset.roi}%`, icon: Target },
                    { label: 'Property Type', value: asset.type, icon: Building2 },
                    { label: 'Purchased', value: formatDate(asset.purchaseDate), icon: Calendar },
                  ].map(item => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={item.label} className="rounded-xl bg-[var(--bg-secondary)] p-3 border border-[var(--border-light)] hover:border-[var(--border)] transition-all group">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <ItemIcon className={`h-3 w-3 ${item.highlight ? 'text-[#8B7355]' : 'text-[var(--fg-muted)]'}`} />
                          <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)]">{item.label}</p>
                        </div>
                        <p className={`text-sm font-semibold ${item.highlight ? 'text-[#8B7355]' : 'text-[var(--fg)]'}`}>{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <DrawerProgressBar
                label="Occupancy Rate"
                value={asset.occupancyRate}
                description={
                  asset.occupancyRate === 100 ? 'Fully occupied — generating maximum rental income' :
                  asset.occupancyRate === 0 ? 'Currently vacant — consider listing to generate income' :
                  'Partially occupied — opportunity to increase occupancy'
                }
              />

              {/* AI Insight for this property */}
              {aiInsights.filter(ins => ins.assetId === asset.id).map(insight => (
                <div key={insight.id} className="rounded-xl border border-[rgba(139,115,85,0.2)] bg-[rgba(139,115,85,0.03)] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-3.5 w-3.5 text-[#8B7355]" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B7355]">AI Insight</span>
                  </div>
                  <p className="text-xs text-[var(--fg-secondary)] leading-relaxed">{insight.description}</p>
                  <p className="text-xs font-bold text-[#8B7355] mt-2">{insight.impact}</p>
                </div>
              ))}
            </>
          )}
          {tab === 'financials' && (
            <div className="space-y-4">
              {/* Mini income chart */}
              <div className="rounded-xl bg-[var(--bg-secondary)] p-4 border border-[var(--border-light)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-3">Income vs Expenses</p>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyCashFlow.slice(-4)} barCategoryGap="25%">
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="var(--fg-muted)" tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9 }} stroke="var(--fg-muted)" tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/100000).toFixed(1)}L`} width={40} />
                      <Bar dataKey="income" fill={GREEN} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill={RED} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Financial details */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-3">Breakdown</p>
                <div className="space-y-2">
                  {[
                    { label: 'Monthly Rental', value: asset.monthlyRental ? formatCurrency(asset.monthlyRental) : 'N/A', icon: DollarSign },
                    { label: 'Annual Yield', value: `${asset.roi}%`, icon: TrendingUp },
                    { label: 'Unrealized Gain', value: formatCurrency({ amount: gain, currency: asset.currentValue.currency }), highlight: true, icon: Zap },
                    { label: 'Maintenance Due', value: `${asset.maintenanceDue} tasks`, icon: Wrench },
                  ].map(item => {
                    const ItemIcon = item.icon;
                    return (
                      <div key={item.label} className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] px-4 py-3 border border-[var(--border-light)]">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0 ${item.highlight ? 'bg-[rgba(139,115,85,0.08)]' : 'bg-[var(--bg-tertiary)]'}`}>
                          <ItemIcon className={`h-3.5 w-3.5 ${item.highlight ? 'text-[#8B7355]' : 'text-[var(--fg-muted)]'}`} />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm text-[var(--fg-muted)]">{item.label}</span>
                          <span className={`text-sm font-semibold ${item.highlight ? 'text-[#8B7355]' : 'text-[var(--fg)]'}`}>{item.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {tab === 'tenant' && (
            <div className="space-y-3">
              {asset.tenantName ? (
                <>
                  <div className="rounded-xl bg-[var(--bg-secondary)] p-4 border border-[var(--border-light)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(139,115,85,0.08)]">
                        <Building2 className="h-5 w-5 text-[#8B7355]" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Current Tenant</p>
                        <p className="text-sm font-semibold text-[var(--fg)]">{asset.tenantName}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {asset.leaseExpiry && (
                      <div className="rounded-xl bg-[var(--bg-secondary)] p-3.5 border border-[var(--border-light)]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Calendar className="h-3 w-3 text-[var(--fg-muted)]" />
                          <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)]">Lease Expiry</p>
                        </div>
                        <p className="text-sm font-medium text-[var(--fg)]">{formatDate(asset.leaseExpiry)}</p>
                      </div>
                    )}
                    {asset.monthlyRental && (
                      <div className="rounded-xl bg-[var(--bg-secondary)] p-3.5 border border-[var(--border-light)]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <DollarSign className="h-3 w-3 text-[#8B7355]" />
                          <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)]">Monthly Rent</p>
                        </div>
                        <p className="text-sm font-semibold text-[#8B7355]">{formatCurrency(asset.monthlyRental)}</p>
                      </div>
                    )}
                  </div>
                  <div className="rounded-xl bg-[var(--bg-secondary)] p-3.5 border border-[var(--border-light)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-[#22C55E]" />
                        <span className="text-sm text-[var(--fg)]">Payment Status</span>
                      </div>
                      <Badge variant="success">Current</Badge>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-secondary)] mb-4">
                    <Building2 className="h-7 w-7 text-[var(--fg-muted)] opacity-40" />
                  </div>
                  <p className="text-sm font-medium text-[var(--fg-secondary)]">No tenant assigned</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-1 max-w-[200px]">This property is currently vacant. List it to start generating rental income.</p>
                  <Button size="sm" className="mt-4 text-xs">
                    <Plus className="h-3.5 w-3.5" /> List Property
                  </Button>
                </div>
              )}
            </div>
          )}
          {tab === 'documents' && (
            <div className="space-y-2.5">
              {[
                { name: 'Lease Agreement.pdf', size: '2.4 MB', date: '2024-10-15' },
                { name: 'Tax Assessment 2024.pdf', size: '1.1 MB', date: '2024-11-15' },
                { name: 'Title Deed.pdf', size: '856 KB', date: '2024-12-15' },
              ].map((doc) => (
                <div key={doc.name} className="flex items-center justify-between rounded-xl bg-[var(--bg-secondary)] p-3.5 border border-[var(--border-light)] hover:border-[var(--border)] transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[rgba(139,115,85,0.08)]">
                      <FileText className="h-4 w-4 text-[#8B7355]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--fg)]">{doc.name}</p>
                      <p className="text-[10px] text-[var(--fg-muted)]">{doc.size} &middot; {formatDate(doc.date)}</p>
                    </div>
                  </div>
                  <button className="rounded-lg p-2 text-[var(--fg-muted)] hover:text-[#8B7355] hover:bg-[rgba(139,115,85,0.06)] transition-colors cursor-pointer opacity-0 group-hover:opacity-100">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-3">
                <Plus className="h-3.5 w-3.5" /> Upload Document
              </Button>
            </div>
          )}
          {tab === 'activity' && (
            <div className="space-y-0">
              {ACTIVITY_LOG.map((entry, i) => {
                const EntryIcon = entry.icon;
                const color = ACTIVITY_COLORS[entry.type] || BRAND;
                return (
                  <div key={i} className="flex gap-3 pb-5 last:pb-0">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg mt-0.5 flex-shrink-0"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <EntryIcon className="h-3.5 w-3.5" style={{ color }} />
                      </div>
                      {i < ACTIVITY_LOG.length - 1 && <div className="w-px flex-1 bg-[var(--border)] mt-1.5" />}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-medium text-[var(--fg)]">{entry.text}</p>
                      <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      <DrawerFooter>
        <Button
          onClick={handleSave} isLoading={saving} size="sm"
          className="flex-1"
        >
          <Check className="h-3.5 w-3.5" /> Save Changes
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadStatement}>
          <Download className="h-3.5 w-3.5" /> Statement
        </Button>
      </DrawerFooter>
    </AppDrawer>
  );
}

/* ─────────────────────────────────────────────
   SCENARIO MODAL — AI "Run Scenario" action
   ───────────────────────────────────────────── */

function ScenarioModal({ insight, open, onClose }: { insight: AIInsight | null; open: boolean; onClose: () => void }) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  if (!insight || !open) return null;

  const isRefinance = insight.id === 'ins-4';
  const scenarios = isRefinance
    ? { title: 'Refinance Marina Bay', current: '$4,200/mo', projected: '$3,100/mo', savings: '$1,100/mo', timeline: '6-8 weeks', confidence: insight.confidence }
    : { title: 'Rent Renegotiation — Tokyo', current: '¥580,000/mo', projected: '¥680,000/mo', savings: '+¥100,000/mo', timeline: 'At lease renewal', confidence: insight.confidence };

  const handleRun = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 1800));
    setRunning(false);
    setDone(true);
  };

  const handleClose = () => {
    setDone(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} size="md">
      <DialogHeader>
        <DialogTitle>{scenarios.title}</DialogTitle>
        <DialogDescription>AI-generated scenario projection</DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[var(--bg-secondary)] p-4 border border-[var(--border-light)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Current Payment</p>
            <p className="text-lg font-bold text-[var(--fg)]">{scenarios.current}</p>
          </div>
          <div className="rounded-xl bg-[rgba(34,197,94,0.04)] p-4 border border-[rgba(34,197,94,0.12)]">
            <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-1">Projected</p>
            <p className="text-lg font-bold text-[#22C55E]">{scenarios.projected}</p>
          </div>
        </div>
        <div className="rounded-xl bg-[rgba(139,115,85,0.04)] p-4 border border-[rgba(139,115,85,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Estimated Savings</p>
              <p className="text-xl font-bold text-[#8B7355] mt-0.5">{scenarios.savings}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Confidence</p>
              <p className="text-xl font-bold text-[var(--fg)] mt-0.5">{scenarios.confidence}%</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
          <Clock className="h-3.5 w-3.5" />
          <span>Estimated timeline: {scenarios.timeline}</span>
        </div>
        {done && (
          <div className="rounded-xl bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.15)] p-3 flex items-center gap-2">
            <Check className="h-4 w-4 text-[#22C55E]" />
            <p className="text-xs text-[#22C55E] font-medium">Scenario analysis saved to your reports</p>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
        <Button variant="outline" onClick={handleClose}>Close</Button>
        {!done && (
          <Button onClick={handleRun} isLoading={running} className="">
            <Zap className="h-4 w-4" /> Run Analysis
          </Button>
        )}
      </div>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   EDIT ASSET MODAL
   ───────────────────────────────────────────── */

function EditAssetModal({ asset, open, onClose, onSave }: { asset: PortfolioAsset | null; open: boolean; onClose: () => void; onSave: (updated: PortfolioAsset) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', location: '', purchasePrice: '', currentValue: '', status: '' as PortfolioAsset['status'] });

  // Reset form when asset changes
  useEffect(() => {
    if (asset) {
      setForm({
        title: asset.title,
        location: asset.location,
        purchasePrice: asset.purchasePrice.amount.toString(),
        currentValue: asset.currentValue.amount.toString(),
        status: asset.status,
      });
    }
  }, [asset]);

  if (!asset) return null;

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    const updated: PortfolioAsset = {
      ...asset,
      title: form.title || asset.title,
      location: form.location || asset.location,
      purchasePrice: { ...asset.purchasePrice, amount: Number(form.purchasePrice) || asset.purchasePrice.amount },
      currentValue: { ...asset.currentValue, amount: Number(form.currentValue) || asset.currentValue.amount },
      status: form.status || asset.status,
    };
    onSave(updated);
    setSaving(false);
    onClose();
  };

  const handleCancel = () => {
    setForm({
      title: asset.title,
      location: asset.location,
      purchasePrice: asset.purchasePrice.amount.toString(),
      currentValue: asset.currentValue.amount.toString(),
      status: asset.status,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} size="lg">
      <DialogHeader>
        <DialogTitle>Edit {asset.title}</DialogTitle>
        <DialogDescription>Update property details</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        <Input label="Property Name" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <Input label="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Purchase Price" type="number" value={form.purchasePrice} onChange={e => setForm(p => ({ ...p, purchasePrice: e.target.value }))} />
          <Input label="Current Value" type="number" value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue: e.target.value }))} />
        </div>
        <Select label="Status" value={form.status} onChange={v => setForm(p => ({ ...p, status: v as PortfolioAsset['status'] }))} options={[
          { value: 'rented', label: 'Rented' },
          { value: 'vacant', label: 'Vacant' },
          { value: 'listed', label: 'Listed' },
          { value: 'managed', label: 'Managed' },
          { value: 'under-review', label: 'Under Review' },
        ]} />
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
        <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} isLoading={saving} className="">
          <Check className="h-4 w-4" /> Save Changes
        </Button>
      </div>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   DELETE CONFIRM MODAL
   ───────────────────────────────────────────── */

function DeleteConfirmModal({ asset, open, onClose, onDelete }: { asset: PortfolioAsset | null; open: boolean; onClose: () => void; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  if (!asset) return null;

  const handleDelete = async () => {
    setDeleting(true);
    await new Promise(r => setTimeout(r, 1000));
    onDelete(asset.id);
    setDeleting(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <DialogHeader>
        <DialogTitle>Delete Asset</DialogTitle>
        <DialogDescription>
          Are you sure you want to remove <strong>{asset.title}</strong> from your portfolio? This action cannot be undone.
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
        <Button variant="destructive" onClick={handleDelete} isLoading={deleting}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   ACTION ICON MAPPING
   ───────────────────────────────────────────── */

const ACTION_ICONS: Record<UpcomingAction['type'], React.ElementType> = {
  lease: Calendar,
  payment: DollarSign,
  tax: FileText,
  document: Shield,
  maintenance: Wrench,
};

const PRIORITY_COLORS: Record<UpcomingAction['priority'], string> = {
  high: '#EF4444',
  medium: '#F59E0B',
  low: '#22C55E',
};

/* ─────────────────────────────────────────────
   CUSTOM CHART TOOLTIP — Issue 3 fix
   ───────────────────────────────────────────── */

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const portfolioVal = payload.find((p: any) => p.dataKey === 'value');
  const benchmarkVal = payload.find((p: any) => p.dataKey === 'benchmark');
  const forecastVal = payload.find((p: any) => p.dataKey === 'forecast');

  return (
    <div className="rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.15)] min-w-[180px]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] mb-2">{label}</p>
      {portfolioVal && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: BRAND }} />
            <span className="text-xs text-[var(--fg-secondary)]">Portfolio</span>
          </div>
          <span className="text-xs font-semibold text-[var(--fg)]">${(portfolioVal.value / 1000000).toFixed(2)}M</span>
        </div>
      )}
      {benchmarkVal && (
        <div className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: PURPLE }} />
            <span className="text-xs text-[var(--fg-secondary)]">Benchmark</span>
          </div>
          <span className="text-xs font-semibold text-[var(--fg)]">${(benchmarkVal.value / 1000000).toFixed(2)}M</span>
        </div>
      )}
      {forecastVal && forecastVal.value && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full border border-[#8B7355] bg-transparent" />
            <span className="text-xs text-[var(--fg-secondary)]">Forecast</span>
          </div>
          <span className="text-xs font-semibold text-[var(--fg-muted)]">${(forecastVal.value / 1000000).toFixed(2)}M</span>
        </div>
      )}
      {portfolioVal && benchmarkVal && (
        <div className="border-t border-[var(--border)] mt-2 pt-2">
          <span className={`text-[10px] font-medium ${portfolioVal.value >= benchmarkVal.value ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
            {portfolioVal.value >= benchmarkVal.value ? '+' : ''}{((portfolioVal.value - benchmarkVal.value) / benchmarkVal.value * 100).toFixed(1)}% vs benchmark
          </span>
        </div>
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═════════════════════════════════════════════ */

export default function PortfolioPage() {
  /* ── State ── */
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<PortfolioAsset[]>(() => [...mockPortfolioAssets]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [editAsset, setEditAsset] = useState<PortfolioAsset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<PortfolioAsset | null>(null);
  const [drawerAsset, setDrawerAsset] = useState<PortfolioAsset | null>(null);
  const [scenarioInsight, setScenarioInsight] = useState<AIInsight | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y');
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [showForecast, setShowForecast] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('currentValue');
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  const [cashFlowView, setCashFlowView] = useState<'monthly' | 'quarterly'>('monthly');
  const [moreMenuAsset, setMoreMenuAsset] = useState<string | null>(null);

  /* ── Asset update handler ── */
  const handleUpdateAsset = useCallback((updated: PortfolioAsset) => {
    setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    // Also update the drawer if it's showing the same asset
    setDrawerAsset(prev => prev?.id === updated.id ? updated : prev);
  }, []);

  /* ── Delete asset handler ── */
  const handleDeleteAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setDrawerAsset(prev => prev?.id === id ? null : prev);
  }, []);

  /* ── AI Insight action handler ── */
  const handleInsightAction = useCallback((insight: AIInsight) => {
    if (insight.action === 'View Asset' && insight.assetId) {
      const asset = assets.find(a => a.id === insight.assetId);
      if (asset) setDrawerAsset(asset);
    } else if (insight.action === 'Run Scenario') {
      setScenarioInsight(insight);
    } else if (insight.action === 'Resolve Risk' && insight.assetId) {
      const asset = assets.find(a => a.id === insight.assetId);
      if (asset) setEditAsset(asset);
    }
  }, [assets]);

  /* ── Simulate initial load ── */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  /* ── AI Analyze handler ── */
  const handleAiAnalyze = useCallback(() => {
    setAiDrawerOpen(true);
    setAiRefreshing(true);
    setTimeout(() => setAiRefreshing(false), 2500);
  }, []);

  /* ── Filtered chart data with benchmark ── */
  const filteredChartData = useMemo(() => {
    const sliceMap: Record<TimeRange, number> = { '1M': 1, '3M': 3, '6M': 6, '1Y': 12, 'ALL': 15 };
    const count = sliceMap[timeRange];
    const base = showForecast ? BENCHMARK_DATA : BENCHMARK_DATA.slice(0, 12);
    return base.slice(-count);
  }, [timeRange, showForecast]);

  /* ── Chart stats ── */
  const chartStats = useMemo(() => {
    const realData = filteredChartData.filter(d => d.value != null);
    const values = realData.map(d => d.value!);
    const changes = realData.map((d, i) => i === 0 ? 0 : ((d.value! - realData[i-1].value!) / realData[i-1].value! * 100));
    const bestIdx = changes.reduce((best, c, i) => c > changes[best] ? i : best, 0);
    const worstIdx = changes.length > 1
      ? changes.reduce((worst, c, i) => c < changes[worst] ? i : worst, 1)
      : 0;
    return {
      best: { month: realData[bestIdx]?.date, change: changes[bestIdx] },
      worst: { month: realData[worstIdx]?.date, change: changes[worstIdx] },
      projected: Math.round(values[values.length - 1] * 1.08),
    };
  }, [filteredChartData]);

  /* ── Filtered & sorted assets ── */
  const filteredAssets = useMemo(() => {
    let result = [...assets];
    if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(q) || a.location.toLowerCase().includes(q));
    }
    result.sort((a, b) => {
      const key = sortBy as keyof PortfolioAsset;
      const aVal = key === 'currentValue' ? (a[key] as any).amount : a[key];
      const bVal = key === 'currentValue' ? (b[key] as any).amount : b[key];
      return (bVal as number) - (aVal as number);
    });
    return result;
  }, [assets, statusFilter, searchQuery, sortBy]);

  /* ── Quarterly cash flow aggregation ── */
  const quarterlyCashFlow = useMemo(() => {
    const quarters = [
      { label: 'Q1', months: monthlyCashFlow.slice(0, 3) },
      { label: 'Q2', months: monthlyCashFlow.slice(3, 6) },
    ];
    // If not enough data for full quarters, pad
    return quarters.filter(q => q.months.length > 0).map(q => ({
      month: q.label,
      income: q.months.reduce((s, m) => s + m.income, 0),
      expenses: q.months.reduce((s, m) => s + m.expenses, 0),
      net: q.months.reduce((s, m) => s + m.net, 0),
    }));
  }, []);

  const activeCashFlowData = cashFlowView === 'quarterly' ? quarterlyCashFlow : monthlyCashFlow;

  const activeCashFlowSummary = useMemo(() => {
    if (cashFlowView === 'monthly') return cashFlowSummary;
    const totalIncome = quarterlyCashFlow.reduce((s, q) => s + q.income, 0);
    const totalExpenses = quarterlyCashFlow.reduce((s, q) => s + q.expenses, 0);
    const totalNet = quarterlyCashFlow.reduce((s, q) => s + q.net, 0);
    return {
      rentIncome: totalIncome,
      taxes: Math.round(totalExpenses * 0.4),
      maintenance: Math.round(totalExpenses * 0.27),
      mortgage: Math.round(totalExpenses * 0.33),
      netProfit: totalNet,
    };
  }, [cashFlowView, quarterlyCashFlow]);

  /* ── Visible insights ── */
  const visibleInsights = useMemo(() => aiInsights.filter(i => !dismissedInsights.has(i.id)), [dismissedInsights]);

  /* ── Visible actions ── */
  const visibleActions = useMemo(() =>
    upcomingActions.filter(a => !a.completed && !completedActions.has(a.id)),
    [completedActions]
  );

  /* ── Count-up values ── */
  const totalValueDisplay = useCountUp(61100000, 1400);
  const rentalDisplay = useCountUp(177000, 1200);
  const roiDisplay = useCountUp(6.1, 1000, '', '%');
  const propertiesDisplay = useCountUp(3, 800);

  /* ── Close more menu on outside click ── */
  useEffect(() => {
    if (!moreMenuAsset) return;
    const handler = () => setMoreMenuAsset(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [moreMenuAsset]);

  /* ═══ SKELETON LOADING STATE ═══ */
  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-[420px] rounded-2xl" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-12">
      <div className="space-y-6">

      {/* ═══════════════════════════════════
          1. HERO SECTION
          ═══════════════════════════════════ */}
      <InvestorPageHeader
        icon={Briefcase}
        title="My Portfolio"
        subtitle="Asset management & performance overview"
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setAddModalOpen(true)} size="sm">
              <Plus className="h-4 w-4" /> Add Asset
            </Button>
            <ExportDropdown />
            <Button variant="outline" size="sm" onClick={handleAiAnalyze}>
              <Brain className="h-4 w-4" /> AI Analyze
            </Button>
          </div>
        }
      >
        {/* Wealth summary chips + live indicator */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { label: 'Net Worth', value: '$2.8M', positive: true },
            { label: 'YTD', value: '+10.7%', positive: true },
            { label: 'Cash Flow', value: '+$18,580', positive: true },
            { label: 'Occupancy', value: '67%', positive: false },
          ].map(chip => (
            <div key={chip.label} className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] px-2.5 py-1.5">
              <span className="text-[10px] text-[var(--fg-muted)]">{chip.label}</span>
              <span className={`text-[11px] font-bold ${chip.positive ? 'text-[#8B7355]' : 'text-[var(--fg)]'}`}>{chip.value}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
            </span>
            <span className="text-[11px] font-medium text-[#22C55E]">Market Active</span>
          </div>
        </div>
      </InvestorPageHeader>

      {/* ═══════════════════════════════════
          2. KPI METRICS ROW — Issue 2 portal tooltip
          ═══════════════════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { title: 'Total Value', value: totalValueDisplay, change: 10.7, label: 'vs last year', icon: Briefcase, sparkline: SPARKLINE_DATA.totalValue, color: BRAND, insight: '+$120K this quarter' },
          { title: 'Monthly Rental', value: rentalDisplay, change: 8.3, label: 'vs last month', icon: DollarSign, sparkline: SPARKLINE_DATA.rental, color: GREEN, insight: '97% collection rate' },
          { title: 'Avg ROI', value: roiDisplay, change: 2.1, label: 'vs last quarter', icon: TrendingUp, sparkline: SPARKLINE_DATA.roi, color: '#8B7355', insight: 'Above regional avg' },
          { title: 'Properties', value: propertiesDisplay, icon: Building2, sparkline: SPARKLINE_DATA.properties, color: '#A89478', insight: '1 asset needs attention' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="premium-card rounded-2xl p-5 group cursor-default"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="glow-icon-container">
                  <kpi.icon className="h-4.5 w-4.5 text-[var(--accent)]" />
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)]">{kpi.title}</p>
              </div>
              <PortalTooltip content={KPI_TOOLTIPS[kpi.title] || `${kpi.title} metric`}>
                <Info className="h-3.5 w-3.5 text-[var(--fg-muted)] opacity-40 group-hover:opacity-70 transition-opacity cursor-help" />
              </PortalTooltip>
            </div>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[26px] font-bold text-[var(--fg)] tracking-[-0.025em]">{kpi.value}</p>
                {kpi.change !== undefined && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 ${kpi.change >= 0 ? 'bg-[rgba(34,197,94,0.1)]' : 'bg-[rgba(239,68,68,0.1)]'}`}>
                      {kpi.change >= 0 ? <ArrowUpRight className="h-3 w-3 text-[#4ADE80]" /> : <ArrowDownRight className="h-3 w-3 text-[#F87171]" />}
                      <span className={`text-[11px] font-medium ${kpi.change >= 0 ? 'text-[#4ADE80]' : 'text-[#F87171]'}`}>
                        {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                      </span>
                    </div>
                    {kpi.label && <span className="text-[10px] text-[var(--fg-muted)]">{kpi.label}</span>}
                  </div>
                )}
                {/* Decision context */}
                <p className="text-[10px] text-[var(--fg-muted)] mt-2 leading-snug opacity-0 group-hover:opacity-100 transition-opacity">{kpi.insight}</p>
              </div>
              <MiniSparkline data={kpi.sparkline} color={kpi.color} />
            </div>
          </motion.div>
        ))}

        {/* Portfolio Health — 5th KPI card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + 4 * 0.08 }}
          className="premium-card rounded-2xl p-5 group cursor-default sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="glow-icon-container">
                <Activity className="h-4.5 w-4.5 text-[var(--accent)]" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)]">Health Score</p>
            </div>
            <PortalTooltip content="Composite score measuring overall portfolio strength based on ROI, occupancy, and growth.">
              <Info className="h-3.5 w-3.5 text-[var(--fg-muted)] opacity-40 group-hover:opacity-70 transition-opacity cursor-help" />
            </PortalTooltip>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <p className="text-[26px] font-bold text-[var(--fg)] tracking-[-0.025em]">{portfolioSummary.portfolioHealth}</p>
              <span className="text-[11px] text-[var(--fg-muted)]">/ 100</span>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 bg-[rgba(34,197,94,0.1)]">
                <ArrowUpRight className="h-3 w-3 text-[#4ADE80]" />
                <span className="text-[11px] font-medium text-[#4ADE80]">+4</span>
              </div>
              <span className="text-[10px] text-[var(--fg-muted)]">vs last month</span>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#8B7355] to-[#A89478]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(portfolioSummary.portfolioHealth, 100)}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[10px] text-[var(--fg-muted)] mt-2 leading-snug opacity-0 group-hover:opacity-100 transition-opacity">
              {portfolioSummary.portfolioHealth >= 80 ? 'Excellent condition' : portfolioSummary.portfolioHealth >= 60 ? 'Strong, minor attention needed' : 'Needs improvement'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════
          3. PERFORMANCE ANALYTICS — Issue 3 upgrade
          ═══════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="premium-card rounded-2xl p-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Portfolio Performance</h2>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--fg-muted)]">Value history & trends</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowBenchmark(!showBenchmark)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all cursor-pointer border ${
                  showBenchmark ? 'border-[rgba(168,148,120,0.3)] bg-[rgba(168,148,120,0.06)] text-[#A89478]' : 'border-[var(--border)] text-[var(--fg-muted)]'
                }`}
              >
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: showBenchmark ? PURPLE : 'var(--fg-muted)' }} />
                Benchmark
              </button>
              <button
                onClick={() => setShowForecast(!showForecast)}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-all cursor-pointer border ${
                  showForecast ? 'border-[rgba(139,115,85,0.3)] bg-[rgba(139,115,85,0.06)] text-[#8B7355]' : 'border-[var(--border)] text-[var(--fg-muted)]'
                }`}
              >
                <div className="h-1.5 w-1.5 rounded-full border" style={{ borderColor: showForecast ? BRAND : 'var(--fg-muted)', backgroundColor: showForecast ? 'transparent' : 'transparent' }} />
                Forecast
              </button>
            </div>
            {/* Time range */}
            <div className="flex items-center rounded-lg bg-[var(--bg-secondary)] p-0.5">
              {TIME_RANGES.map(tr => (
                <button
                  key={tr}
                  onClick={() => setTimeRange(tr)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    timeRange === tr
                      ? 'bg-[var(--card-bg)] text-[var(--fg)] shadow-sm'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                  }`}
                >
                  {tr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats row — tinted backgrounds */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-[rgba(34,197,94,0.04)] border border-[rgba(34,197,94,0.08)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Best Month</p>
            <p className="text-sm font-semibold text-[#22C55E] mt-0.5">
              {chartStats.best.month} ({(chartStats.best.change ?? 0) > 0 ? '+' : ''}{(chartStats.best.change ?? 0).toFixed(1)}%)
            </p>
          </div>
          <div className="rounded-xl bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.08)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Worst Month</p>
            <p className="text-sm font-semibold text-[#EF4444] mt-0.5">
              {chartStats.worst.month} ({(chartStats.worst.change ?? 0).toFixed(1)}%)
            </p>
          </div>
          <div className="rounded-xl bg-[rgba(139,115,85,0.04)] border border-[rgba(139,115,85,0.08)] px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Projected EOY</p>
            <p className="text-sm font-semibold text-[#8B7355] mt-0.5">${(chartStats.projected / 1000000).toFixed(2)}M</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredChartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="portfolioAreaGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.25} />
                  <stop offset="50%" stopColor={BRAND} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BRAND} stopOpacity={0.08} />
                  <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
              <XAxis
                dataKey="date" tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
                stroke="var(--border-light)" tickLine={false} axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--fg-muted)' }} tickLine={false} axisLine={false}
                tickFormatter={(v) => `₹${(v / 10000000).toFixed(1)}Cr`}
                width={60} stroke="var(--border-light)"
              />
              <RTooltip content={<ChartTooltipContent />} cursor={{ stroke: 'var(--fg-muted)', strokeWidth: 1, strokeDasharray: '4 4' }} />
              {/* Benchmark line */}
              {showBenchmark && (
                <Line
                  type="monotone" dataKey="benchmark"
                  stroke={PURPLE} strokeWidth={1.5} strokeDasharray="6 4"
                  dot={false} animationDuration={1200}
                  connectNulls
                />
              )}
              {/* Forecast area */}
              {showForecast && (
                <Area
                  type="monotone" dataKey="forecast"
                  stroke={BRAND} strokeWidth={1.5} strokeDasharray="4 4"
                  fill="url(#forecastGrad)"
                  animationDuration={1200}
                  connectNulls
                />
              )}
              {/* Main portfolio line */}
              <Area
                type="monotone" dataKey="value"
                stroke={BRAND} strokeWidth={2.5}
                fill="url(#portfolioAreaGrad2)"
                animationDuration={1200}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom legend + CTA */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-[10px] text-[var(--fg-muted)]">
            <div className="flex items-center gap-1.5">
              <div className="h-0.5 w-4 rounded-full" style={{ backgroundColor: BRAND }} />
              <span>Portfolio</span>
            </div>
            {showBenchmark && (
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded-full border-b border-dashed" style={{ borderColor: PURPLE }} />
                <span>Benchmark Index</span>
              </div>
            )}
            {showForecast && (
              <div className="flex items-center gap-1.5">
                <div className="h-0.5 w-4 rounded-full border-b border-dotted" style={{ borderColor: BRAND }} />
                <span>Forecast</span>
              </div>
            )}
          </div>
          <Link href="/investor/intelligence">
            <Button variant="ghost" size="sm" className="text-xs text-[var(--fg-muted)] hover:text-[#8B7355]">
              View Full Analytics <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          4. ASSET PORTFOLIO CARDS
          ═══════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--fg)]">My Assets</h2>
          <span className="text-xs text-[var(--fg-muted)]">{assets.length} properties</span>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset, i) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="premium-card rounded-2xl overflow-hidden group"
            >
              {/* Image */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={PROPERTY_IMAGES[asset.id] || PROPERTY_IMAGES['asset-001']}
                  alt={asset.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge variant={statusVariant(asset.status)} className="backdrop-blur-md bg-black/30 text-white border-white/20 text-[10px] capitalize shadow-sm">
                    {asset.status.replace('-', ' ')}
                  </Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-[#8B7355]">
                    ROI {asset.roi}%
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-base font-bold text-white leading-tight">{asset.title}</p>
                  <p className="flex items-center gap-1 text-xs text-white/75 mt-0.5">
                    <MapPin className="h-3 w-3" /> {asset.location}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Current Value</p>
                    <p className="text-xl font-bold text-[var(--fg)] tracking-tight">{formatCurrency(asset.currentValue)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Appreciation</p>
                    <p className="text-sm font-semibold text-[#8B7355]">+{asset.appreciation}%</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 rounded-lg bg-[var(--bg-secondary)] px-2.5 py-1.5 text-center">
                    <p className="text-[9px] uppercase text-[var(--fg-muted)]">Occupancy</p>
                    <p className="text-xs font-semibold text-[var(--fg)]">{asset.occupancyRate}%</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-[var(--bg-secondary)] px-2.5 py-1.5 text-center">
                    <p className="text-[9px] uppercase text-[var(--fg-muted)]">Yield</p>
                    <p className="text-xs font-semibold text-[var(--fg)]">{asset.roi}%</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-[var(--bg-secondary)] px-2.5 py-1.5 text-center">
                    <p className="text-[9px] uppercase text-[var(--fg-muted)]">Rent</p>
                    <p className="text-xs font-semibold text-[var(--fg)]">
                      {asset.monthlyRental ? formatCurrency(asset.monthlyRental) : '—'}
                    </p>
                  </div>
                </div>

                {asset.leaseExpiry && (
                  <p className="text-[11px] text-[var(--fg-muted)] mb-4 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Lease expires {formatDate(asset.leaseExpiry)}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setDrawerAsset(asset)}>
                    <Eye className="h-3.5 w-3.5" /> View Details
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => setEditAsset(asset)}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <div className="relative">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); setMoreMenuAsset(moreMenuAsset === asset.id ? null : asset.id); }}>
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                    <AnimatePresence>
                      {moreMenuAsset === asset.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute right-0 bottom-full mb-1 z-50 w-40 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_12px_36px_rgba(0,0,0,0.12)] overflow-hidden"
                        >
                          <button className="flex w-full items-center gap-2 px-3.5 py-2.5 text-xs text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer" onClick={() => setMoreMenuAsset(null)}>
                            <BarChart3 className="h-3.5 w-3.5 text-[var(--fg-muted)]" /> Sell Estimate
                          </button>
                          <button className="flex w-full items-center gap-2 px-3.5 py-2.5 text-xs text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer" onClick={() => setMoreMenuAsset(null)}>
                            <Archive className="h-3.5 w-3.5 text-[var(--fg-muted)]" /> Archive
                          </button>
                          <button className="flex w-full items-center gap-2 px-3.5 py-2.5 text-xs text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-colors cursor-pointer" onClick={() => { setMoreMenuAsset(null); setDeleteAsset(asset); }}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════
          5. ALL ASSETS TABLE — Issue 4 custom dropdown
          ═══════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="premium-card rounded-2xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--fg)]">All Assets</h2>
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--fg-muted)]">Full portfolio table</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 w-44 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] pl-9 pr-3 text-xs text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all shadow-sm"
              />
            </div>
            <div className="flex items-center rounded-lg bg-[var(--bg-secondary)] p-0.5">
              {STATUS_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                    statusFilter === f.value
                      ? 'bg-[var(--card-bg)] text-[var(--fg)] shadow-sm'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <PremiumSortDropdown value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/60">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--fg-muted)]">Property</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--fg-muted)]">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--fg-muted)]">Current Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--fg-muted)]">Appreciation</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--fg-muted)]">ROI</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--fg-muted)]">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--fg-muted)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Building2 className="h-8 w-8 text-[var(--fg-muted)] mx-auto mb-2 opacity-40" />
                    <p className="text-sm text-[var(--fg-secondary)]">No assets match your filters</p>
                    <p className="text-xs text-[var(--fg-muted)] mt-1">Try adjusting your search or filter criteria</p>
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr key={asset.id} className="border-b border-[var(--border-light)] transition-colors duration-200 hover:bg-[var(--bg-secondary)]/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={PROPERTY_IMAGES[asset.id] || PROPERTY_IMAGES['asset-001']} alt={asset.title} className="h-full w-full object-cover" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--fg)] text-sm">{asset.title}</p>
                          <p className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {asset.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant="secondary">{asset.type}</Badge></td>
                    <td className="px-4 py-3"><span className="font-semibold text-[var(--fg)]">{formatCurrency(asset.currentValue)}</span></td>
                    <td className="px-4 py-3"><span className="font-medium text-[#8B7355]">+{asset.appreciation}%</span></td>
                    <td className="px-4 py-3"><span className="font-medium text-[var(--fg)]">{asset.roi}%</span></td>
                    <td className="px-4 py-3"><Badge variant={statusVariant(asset.status)} className="capitalize">{asset.status.replace('-', ' ')}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setDrawerAsset(asset)} className="rounded-md p-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer" title="View"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditAsset(asset)} className="rounded-md p-1.5 text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer" title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteAsset(asset)} className="rounded-md p-1.5 text-[var(--fg-muted)] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-colors cursor-pointer" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════
          6. AI INSIGHTS — Issue 6 unique category cards
          ═══════════════════════════════════ */}
      {visibleInsights.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#8B7355] to-[#6F5C46]">
                <Brain className="h-3.5 w-3.5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-[var(--fg)]">AI Insights</h2>
            </div>
            <span className="text-xs text-[var(--fg-muted)]">{visibleInsights.length} actionable</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {visibleInsights.map((insight) => {
                const category = INSIGHT_CATEGORY_MAP[insight.id] || 'opportunity';
                const config = INSIGHT_CONFIG[category];
                const CatIcon = config.icon;
                return (
                  <motion.div
                    key={insight.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96, height: 0 }}
                    className="premium-card rounded-xl p-5 overflow-hidden border border-[var(--border)]"
                  >
                    {/* Category header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(139,115,85,0.08)]">
                          <CatIcon className="h-3.5 w-3.5 text-[#8B7355]" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8B7355]">{config.label}</span>
                      </div>
                      <button
                        onClick={() => setDismissedInsights(prev => new Set([...prev, insight.id]))}
                        className="rounded-md p-1 text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                        title="Dismiss"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <h3 className="text-sm font-medium text-[var(--fg)] mb-1.5 leading-snug">{insight.title}</h3>
                    <p className="text-xs text-[var(--fg-muted)] leading-relaxed mb-3">{insight.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-[#8B7355]">{insight.impact}</span>
                        <Badge variant={insight.priority === 'high' ? 'danger' : insight.priority === 'medium' ? 'warning' : 'secondary'} className="text-[9px]">
                          {insight.confidence}%
                        </Badge>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleInsightAction(insight)}>
                        {insight.action} <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════
          7. CASH FLOW + UPCOMING ACTIONS
          ═══════════════════════════════════ */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Cash Flow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="premium-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--fg)]">Monthly Cash Flow</h2>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--fg-muted)]">Income vs expenses</p>
            </div>
            <div className="flex items-center rounded-lg bg-[var(--bg-secondary)] p-0.5">
              {(['monthly', 'quarterly'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setCashFlowView(v)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-all cursor-pointer ${
                    cashFlowView === v ? 'bg-[var(--card-bg)] text-[var(--fg)] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[200px] mb-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeCashFlowData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--fg-muted)" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--fg-muted)" tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/100000).toFixed(1)}L`} width={48} />
                <RTooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  }}
                  formatter={(v: any, name: any) => [`$${typeof v === 'number' ? v.toLocaleString() : v}`, typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name]}
                />
                <Bar dataKey="income" fill={GREEN} radius={[4, 4, 0, 0]} animationDuration={800} />
                <Bar dataKey="expenses" fill={RED} radius={[4, 4, 0, 0]} animationDuration={800} />
                <Bar dataKey="net" fill={BRAND} radius={[4, 4, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary metrics row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-lg bg-[rgba(34,197,94,0.04)] border border-[rgba(34,197,94,0.08)] px-3 py-2 text-center">
              <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)]">Profit Margin</p>
              <p className="text-sm font-bold text-[#22C55E] mt-0.5">{activeCashFlowSummary.rentIncome > 0 ? Math.round((activeCashFlowSummary.netProfit / activeCashFlowSummary.rentIncome) * 100) : 0}%</p>
            </div>
            <div className="rounded-lg bg-[rgba(139,115,85,0.04)] border border-[rgba(139,115,85,0.08)] px-3 py-2 text-center">
              <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)]">{cashFlowView === 'quarterly' ? 'QoQ Change' : 'MoM Change'}</p>
              <p className="text-sm font-bold text-[#8B7355] mt-0.5">+3.2%</p>
            </div>
            <div className="rounded-lg bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.08)] px-3 py-2 text-center">
              <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)]">Top Cost</p>
              <p className="text-sm font-bold text-[#EF4444] mt-0.5">Mortgage</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Rent Income', value: `$${activeCashFlowSummary.rentIncome.toLocaleString()}`, color: GREEN },
              { label: 'Taxes', value: `-$${activeCashFlowSummary.taxes.toLocaleString()}`, color: RED },
              { label: 'Maintenance', value: `-$${activeCashFlowSummary.maintenance.toLocaleString()}`, color: RED },
              { label: 'Mortgage', value: `-$${activeCashFlowSummary.mortgage.toLocaleString()}`, color: RED },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="text-[var(--fg-muted)]">{item.label}</span>
                <span className="font-medium" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
            <div className="border-t border-[var(--border)] pt-2 flex items-center justify-between text-sm">
              <span className="font-medium text-[var(--fg)]">Net Profit</span>
              <span className="font-bold text-[#8B7355]">${activeCashFlowSummary.netProfit.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-[var(--fg-muted)] pt-1">Mortgage cost reduced 8% this quarter</p>
          </div>
        </motion.div>

        {/* Upcoming Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
          className="premium-card rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--fg)]">Upcoming Actions</h2>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.08em] text-[var(--fg-muted)]">Tasks requiring attention</p>
            </div>
            <span className="text-xs text-[var(--fg-muted)]">{visibleActions.length} pending</span>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {visibleActions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Check className="h-8 w-8 text-[#22C55E] mb-2 opacity-60" />
                  <p className="text-sm font-medium text-[var(--fg-secondary)]">All caught up</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-1">No pending actions</p>
                </div>
              ) : (
                visibleActions.map((action) => {
                  const Icon = ACTION_ICONS[action.type];
                  const daysUntil = Math.ceil((new Date(action.date).getTime() - Date.now()) / 86400000);
                  return (
                    <motion.div
                      key={action.id}
                      layout
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] p-3.5 group transition-colors hover:bg-[var(--bg-tertiary)]"
                    >
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${PRIORITY_COLORS[action.priority]}15` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: PRIORITY_COLORS[action.priority] }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--fg)] truncate">{action.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-[var(--fg-muted)]">{formatDate(action.date)}</span>
                          <Badge
                            variant={action.priority === 'high' ? 'danger' : action.priority === 'medium' ? 'warning' : 'secondary'}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {daysUntil > 0 ? `${daysUntil}d` : 'Overdue'}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm" variant="outline"
                        className="text-[11px] h-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        onClick={() => setCompletedActions(prev => new Set([...prev, action.id]))}
                      >
                        {action.cta}
                      </Button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      </div>{/* end space-y-6 wrapper */}

      {/* ═══════════════════════════════════
          MODALS & DRAWERS
          ═══════════════════════════════════ */}
      <AddAssetModal open={addModalOpen} onClose={() => setAddModalOpen(false)} />
      <AIDrawer open={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} insights={aiInsights} onAction={handleInsightAction} aiRefreshing={aiRefreshing} />
      {drawerAsset && <PropertyDrawer asset={drawerAsset} onClose={() => setDrawerAsset(null)} />}
      <EditAssetModal asset={editAsset} open={!!editAsset} onClose={() => setEditAsset(null)} onSave={handleUpdateAsset} />
      <DeleteConfirmModal asset={deleteAsset} open={!!deleteAsset} onClose={() => setDeleteAsset(null)} onDelete={handleDeleteAsset} />
      <ScenarioModal insight={scenarioInsight} open={!!scenarioInsight} onClose={() => setScenarioInsight(null)} />

    </PageContainer>
  );
}
