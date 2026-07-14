'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppDrawer, DrawerHero, DrawerTabs, DrawerFooter, DrawerMetricsGrid, DrawerProgressBar, type DrawerTab as DrawerTabDef } from '@/components/ui/drawer';
import {
  Building2, DollarSign, TrendingUp, TrendingDown, Plus, Download, Brain,
  Search, Filter, MoreHorizontal, Edit3, Trash2, X, Check, AlertTriangle,
  Eye, ChevronDown, ChevronRight, BarChart3, ArrowUpRight, ArrowDownRight,
  Activity, Upload, Grid3X3, List, MapPin, Users, Calendar, FileText,
  Shield, Wrench, Clock, Target, Wallet, ShieldAlert, Loader2,
  Home, Key, Receipt, Briefcase, ChevronLeft, Info, Copy, Archive,
} from 'lucide-react';
import {
  mockPortfolioAssets, portfolioSummary, aiInsights,
  type PortfolioAsset, type AIInsight,
} from '@/mock-data/portfolio';
import { formatCurrency, formatDate, formatPercent } from '@/lib/formatters';
import {
  LineChart, Line, ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip as RTooltip, CartesianGrid,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ─────────────────────────────────────────────
   CONSTANTS
   ───────────────────────────────────────────── */

const BRAND = '#8B7355';
const GREEN = '#22C55E';
const RED = '#EF4444';

const PROPERTY_IMAGES: Record<string, string> = {
  'asset-001': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop&q=80',
  'asset-002': 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&h=500&fit=crop&q=80',
  'asset-003': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop&q=80',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'rented', label: 'Rented' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'listed', label: 'Listed' },
  { value: 'managed', label: 'Managed' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'Residential', label: 'Residential' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Land', label: 'Land' },
];

const SORT_OPTIONS = [
  { value: 'value-desc', label: 'Value: High to Low' },
  { value: 'value-asc', label: 'Value: Low to High' },
  { value: 'roi-desc', label: 'ROI: High to Low' },
  { value: 'roi-asc', label: 'ROI: Low to High' },
  { value: 'appreciation', label: 'Appreciation' },
];

const VALUE_TREND = [
  { m: 'Jul', v: 8.8 }, { m: 'Aug', v: 8.9 }, { m: 'Sep', v: 9.0 },
  { m: 'Oct', v: 9.05 }, { m: 'Nov', v: 9.1 }, { m: 'Dec', v: 9.16 },
];

const SPARKLINE_TOTAL = [
  { v: 2 }, { v: 2 }, { v: 2 }, { v: 3 }, { v: 3 }, { v: 3 }, { v: 3 }, { v: 3 },
];

const SPARKLINE_VALUE = [
  { v: 7.5 }, { v: 7.8 }, { v: 8.1 }, { v: 8.5 }, { v: 8.8 }, { v: 9.0 }, { v: 9.16 },
];

const SPARKLINE_OCC = [
  { v: 100 }, { v: 100 }, { v: 80 }, { v: 67 }, { v: 67 }, { v: 67 },
];

const SPARKLINE_ROI = [
  { v: 4.8 }, { v: 5.0 }, { v: 5.1 }, { v: 5.2 }, { v: 5.3 }, { v: 5.4 },
];

/* INSIGHT CATEGORIES */
type InsightCategory = 'opportunity' | 'alert' | 'cashflow' | 'risk';

const INSIGHT_CONFIG: Record<InsightCategory, { icon: React.ElementType; label: string; color: string; bgTint: string; borderColor: string; barColor: string }> = {
  opportunity: { icon: TrendingUp, label: 'Growth Opportunity', color: '#8B7355', bgTint: 'rgba(139,115,85,0.04)', borderColor: 'rgba(139,115,85,0.15)', barColor: 'rgba(139,115,85,0.35)' },
  alert: { icon: AlertTriangle, label: 'Performance Alert', color: '#F59E0B', bgTint: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.15)', barColor: 'rgba(245,158,11,0.30)' },
  cashflow: { icon: Wallet, label: 'Cash Flow Optimization', color: '#8B7355', bgTint: 'rgba(139,115,85,0.04)', borderColor: 'rgba(139,115,85,0.15)', barColor: 'rgba(139,115,85,0.30)' },
  risk: { icon: ShieldAlert, label: 'Risk Warning', color: '#EF4444', bgTint: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.15)', barColor: 'rgba(239,68,68,0.30)' },
};

const INSIGHT_CATEGORY_MAP: Record<string, InsightCategory> = {
  'ins-1': 'opportunity',
  'ins-2': 'alert',
  'ins-3': 'risk',
  'ins-4': 'cashflow',
};

/* ─────────────────────────────────────────────
   HELPERS
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

function formatCompactValue(amount: number, _currency: string): string {
  void _currency;  // mock data tags heterogeneous currencies; UI is INR-only
  if (amount >= 1_00_00_000) return `\u20b9${(amount / 1_00_00_000).toFixed(2)} Cr`;
  if (amount >= 1_00_000)    return `\u20b9${(amount / 1_00_000).toFixed(2)} L`;
  if (amount >= 1_000)       return `\u20b9${(amount / 1_000).toFixed(0)}K`;
  return `\u20b9${amount}`;
}

function getCountryFromLocation(location: string): string {
  if (location.includes('Singapore')) return 'Singapore';
  if (location.includes('Japan') || location.includes('Tokyo')) return 'Japan';
  if (location.includes('USA') || location.includes('Miami')) return 'USA';
  return location;
}

/* ─────────────────────────────────────────────
   MINI SPARKLINE
   ───────────────────────────────────────────── */

function MiniSparkline({ data, color = BRAND }: { data: { v: number }[]; color?: string }) {
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%" minWidth={40} minHeight={20}>
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANIMATED COUNTER
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
      if (target >= 1000000) setDisplay(prefix + '$' + (current / 1000000).toFixed(2) + 'M');
      else if (target >= 100) setDisplay(prefix + Math.round(current).toString() + suffix);
      else setDisplay(prefix + current.toFixed(1) + suffix);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration, prefix, suffix]);
  return display;
}

/* ─────────────────────────────────────────────
   PORTAL TOOLTIP
   ───────────────────────────────────────────── */

function PortalTooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const updatePos = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 10 });
    }
  }, []);

  return (
    <>
      <div ref={triggerRef} onMouseEnter={() => { updatePos(); setShow(true); }} onMouseLeave={() => setShow(false)} className="inline-flex">
        {children}
      </div>
      {show && mounted && createPortal(
        <div style={{ position: 'fixed', left: pos.x, top: pos.y, transform: 'translate(-50%, -100%)', zIndex: 99999, pointerEvents: 'none' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', lineHeight: '1.5', color: '#374151', maxWidth: '240px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
            {content}
            <div style={{ position: 'absolute', left: '50%', top: '100%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #ffffff' }} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ─────────────────────────────────────────────
   ADD ASSET MODAL
   ───────────────────────────────────────────── */

function AddAssetModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (asset: PortfolioAsset) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', type: 'Residential', purchasePrice: '', currentValue: '', rentStatus: 'vacant' });
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
    await new Promise(r => setTimeout(r, 1200));
    const newAsset: PortfolioAsset = {
      id: `asset-${Date.now()}`,
      propertyId: `prop-${Date.now()}`,
      title: form.name,
      location: form.location,
      type: form.type,
      purchasePrice: { amount: Number(form.purchasePrice), currency: 'USD' },
      currentValue: { amount: Number(form.currentValue), currency: 'USD' },
      purchaseDate: new Date().toISOString().slice(0, 10),
      status: form.rentStatus as PortfolioAsset['status'],
      occupancyRate: form.rentStatus === 'rented' ? 100 : 0,
      appreciation: Number(((Number(form.currentValue) - Number(form.purchasePrice)) / Number(form.purchasePrice) * 100).toFixed(1)),
      roi: 0,
      maintenanceDue: 0,
    };
    onSave(newAsset);
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
          <Input label="Purchase Price (USD)" type="number" placeholder="0" value={form.purchasePrice} onChange={e => setForm(p => ({ ...p, purchasePrice: e.target.value }))} error={errors.purchasePrice} />
          <Input label="Current Value (USD)" type="number" placeholder="0" value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue: e.target.value }))} error={errors.currentValue} />
        </div>
        <Select label="Rent Status" value={form.rentStatus} onChange={v => setForm(p => ({ ...p, rentStatus: v }))} options={STATUS_OPTIONS.filter(o => o.value !== 'all')} />
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
   EDIT ASSET MODAL
   ───────────────────────────────────────────── */

function EditAssetModal({ open, onClose, asset, onSave }: { open: boolean; onClose: () => void; asset: PortfolioAsset | null; onSave: (a: PortfolioAsset) => void }) {
  const [form, setForm] = useState({ title: '', location: '', type: '', status: '', currentValue: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (asset) setForm({ title: asset.title, location: asset.location, type: asset.type, status: asset.status, currentValue: String(asset.currentValue.amount) });
  }, [asset]);

  if (!asset) return null;

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    onSave({
      ...asset,
      title: form.title,
      location: form.location,
      type: form.type,
      status: form.status as PortfolioAsset['status'],
      currentValue: { ...asset.currentValue, amount: Number(form.currentValue) },
    });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader>
        <DialogTitle>Edit Asset</DialogTitle>
        <DialogDescription>Update property details</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        <Input label="Property Name" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        <Input label="Location" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
        <Select label="Property Type" value={form.type} onChange={v => setForm(p => ({ ...p, type: v }))} options={TYPE_OPTIONS.filter(o => o.value !== 'all')} />
        <Select label="Status" value={form.status} onChange={v => setForm(p => ({ ...p, status: v }))} options={STATUS_OPTIONS.filter(o => o.value !== 'all')} />
        <Input label="Current Value" type="number" value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
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

function DeleteConfirmModal({ open, onClose, asset, onDelete }: { open: boolean; onClose: () => void; asset: PortfolioAsset | null; onDelete: (id: string) => void }) {
  if (!asset) return null;
  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <div className="text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(239,68,68,0.08)]">
          <Trash2 className="h-6 w-6 text-[#EF4444]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--fg)]">Delete Asset</h3>
          <p className="text-sm text-[var(--fg-secondary)] mt-1">
            Are you sure you want to remove <strong>{asset.title}</strong> from your portfolio? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[#EF4444] hover:bg-[#DC2626] text-white" onClick={() => { onDelete(asset.id); onClose(); }}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   SCENARIO MODAL
   ───────────────────────────────────────────── */

function ScenarioModal({ open, onClose, insight }: { open: boolean; onClose: () => void; insight: AIInsight | null }) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { if (!open) setDone(false); }, [open]);

  if (!insight) return null;

  const handleRun = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 2000));
    setRunning(false);
    setDone(true);
  };

  return (
    <Dialog open={open} onClose={onClose} size="lg">
      <DialogHeader>
        <DialogTitle>AI Scenario Analysis</DialogTitle>
        <DialogDescription>{insight.title}</DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <div className="rounded-xl bg-[var(--bg-secondary)] p-4 border border-[var(--border-light)]">
          <p className="text-sm text-[var(--fg-secondary)]">{insight.description}</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-xs text-[var(--fg-muted)]">Confidence: <strong className="text-[#8B7355]">{insight.confidence}%</strong></span>
            <span className="text-xs text-[var(--fg-muted)]">Impact: <strong className="text-[#22C55E]">{insight.impact}</strong></span>
          </div>
        </div>
        {done && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.04)] p-4">
            <p className="text-sm font-semibold text-[#22C55E]">Scenario Complete</p>
            <p className="text-xs text-[var(--fg-secondary)] mt-1">Based on current market conditions and your portfolio composition, implementing this action could yield the projected impact within 6-12 months.</p>
          </motion.div>
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
        <Button variant="outline" onClick={onClose}>Close</Button>
        {!done && (
          <Button onClick={handleRun} isLoading={running} className="">
            <Brain className="h-4 w-4" /> Run Analysis
          </Button>
        )}
      </div>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────
   ASSET DETAIL DRAWER
   ───────────────────────────────────────────── */

const DRAWER_TABS = ['Overview', 'Financials', 'Tenant', 'Documents', 'Activity'] as const;
type DrawerTab = typeof DRAWER_TABS[number];

const ACTIVITY_TIMELINE = [
  { date: '2024-12-15', title: 'Annual maintenance completed', icon: Wrench },
  { date: '2024-10-30', title: 'Lease renewed for 12 months', icon: FileText },
  { date: '2024-06-01', title: 'Tenant moved in', icon: Users },
  { date: '2024-03-15', title: 'Insurance renewed', icon: Shield },
  { date: '2023-12-01', title: 'Property purchased', icon: Key },
];

const DOCUMENTS = [
  { name: 'Sale Deed', type: 'PDF', size: '2.4 MB', icon: FileText },
  { name: 'Lease Agreement', type: 'PDF', size: '1.8 MB', icon: FileText },
  { name: 'Tax Receipt - 2024', type: 'PDF', size: '340 KB', icon: Receipt },
  { name: 'Insurance Policy', type: 'PDF', size: '1.2 MB', icon: Shield },
];

function AssetDrawer({ asset, onClose, onEdit }: { asset: PortfolioAsset | null; onClose: () => void; onEdit: (a: PortfolioAsset) => void }) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('Overview');

  useEffect(() => { if (asset) setActiveTab('Overview'); }, [asset]);

  if (!asset) return null;

  const unrealizedGain = asset.currentValue.amount - asset.purchasePrice.amount;
  const isGain = unrealizedGain >= 0;

  const handleDownload = (fileName: string) => {
    const blob = new Blob([`${fileName} — ${asset.title}\nGenerated: ${new Date().toLocaleDateString()}\nThis is a placeholder document.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\s/g, '_')}_${asset.title.replace(/\s/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: DrawerTabDef[] = [
    { key: 'Overview', label: 'Overview' },
    { key: 'Financials', label: 'Financials' },
    { key: 'Tenant', label: 'Tenant' },
    { key: 'Documents', label: 'Documents' },
    { key: 'Activity', label: 'Activity' },
  ];

  return (
    <AppDrawer open={!!asset} onClose={onClose} size="lg">
      <DrawerHero
        imageSrc={PROPERTY_IMAGES[asset.id] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=300&fit=crop&q=80'}
        imageAlt={asset.title}
        title={asset.title}
        subtitle={asset.location}
        badges={[
          { label: asset.status.replace('-', ' '), variant: statusVariant(asset.status) },
          { label: asset.type },
        ]}
        onClose={onClose}
      />

      <DrawerTabs tabs={tabs} activeTab={activeTab} onTabChange={(k) => setActiveTab(k as DrawerTab)} layoutId="asset-drawer-tab" />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {activeTab === 'Overview' && (
              <div className="space-y-5">
                <DrawerMetricsGrid metrics={[
                  { label: 'Purchase Price', value: formatCurrency(asset.purchasePrice), color: 'var(--fg)' },
                  { label: 'Current Value', value: formatCurrency(asset.currentValue), color: BRAND },
                  { label: 'Unrealized Gain', value: `${isGain ? '+' : ''}${formatCurrency({ amount: unrealizedGain, currency: asset.currentValue.currency })}`, color: isGain ? GREEN : RED },
                  { label: 'ROI', value: `${asset.roi}%`, color: asset.roi > 5 ? GREEN : BRAND },
                ]} />

                <DrawerProgressBar
                  label="Occupancy Rate"
                  value={asset.occupancyRate}
                />

                {/* Value trend chart */}
                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-4">
                  <p className="text-xs font-medium text-[var(--fg-secondary)] mb-3">Value Trend</p>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                      <AreaChart data={VALUE_TREND}>
                        <defs>
                          <linearGradient id="drawBrand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={BRAND} stopOpacity={0.15} />
                            <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                        <XAxis dataKey="m" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} axisLine={false} tickLine={false} domain={['dataMin - 0.2', 'dataMax + 0.1']} />
                        <RTooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px' }} />
                        <Area type="monotone" dataKey="v" stroke={BRAND} strokeWidth={2} fill="url(#drawBrand)" isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Financials' && (
              <div className="space-y-4">
                {[
                  { label: 'Monthly Rental Income', value: asset.monthlyRental ? formatCurrency(asset.monthlyRental) : 'N/A', color: GREEN },
                  { label: 'Mortgage Payment', value: '$1,500/mo', color: 'var(--fg)' },
                  { label: 'Property Tax', value: '$600/mo', color: 'var(--fg)' },
                  { label: 'Maintenance', value: '$400/mo', color: 'var(--fg)' },
                  { label: 'Net Profit', value: asset.monthlyRental ? formatCurrency({ amount: asset.monthlyRental.amount - 2500, currency: asset.monthlyRental.currency }) : 'N/A', color: GREEN },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                    <span className="text-sm text-[var(--fg-secondary)]">{item.label}</span>
                    <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Tenant' && (
              <div className="space-y-4">
                {asset.status === 'rented' && asset.tenantName ? (
                  <>
                    <div className="rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-[rgba(139,115,85,0.1)] flex items-center justify-center">
                          <Users className="h-5 w-5 text-[#8B7355]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--fg)]">{asset.tenantName}</p>
                          <p className="text-[11px] text-[var(--fg-muted)]">Active Tenant</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
                          <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Lease Expiry</p>
                          <p className="text-sm font-semibold text-[var(--fg)] mt-0.5">{asset.leaseExpiry ? formatDate(asset.leaseExpiry) : 'N/A'}</p>
                        </div>
                        <div className="rounded-lg bg-[var(--bg-elevated)] p-3">
                          <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">Payment Status</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                            <p className="text-sm font-semibold text-[#22C55E]">Current</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-secondary)]">
                      <Users className="h-8 w-8 text-[var(--fg-muted)] opacity-40" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--fg)]">No Tenant</p>
                      <p className="text-xs text-[var(--fg-muted)] mt-1">This property is currently vacant</p>
                    </div>
                    <Button size="sm" className="">
                      <Search className="h-3.5 w-3.5" /> Find Tenant
                    </Button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Documents' && (
              <div className="space-y-3">
                {DOCUMENTS.map(doc => (
                  <div key={doc.name} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] group hover:border-[rgba(139,115,85,0.3)] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-[rgba(139,115,85,0.08)] flex items-center justify-center">
                        <doc.icon className="h-4 w-4 text-[#8B7355]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--fg)]">{doc.name}</p>
                        <p className="text-[10px] text-[var(--fg-muted)]">{doc.type} &middot; {doc.size}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDownload(doc.name)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'Activity' && (
              <div className="space-y-0">
                {ACTIVITY_TIMELINE.map((item, i) => (
                  <div key={i} className="flex gap-3 relative">
                    {i < ACTIVITY_TIMELINE.length - 1 && (
                      <div className="absolute left-[15px] top-[32px] bottom-0 w-px bg-[var(--border)]" />
                    )}
                    <div className="h-8 w-8 rounded-full bg-[rgba(139,115,85,0.08)] border border-[var(--border-light)] flex items-center justify-center z-10 flex-shrink-0 mt-1">
                      <item.icon className="h-3.5 w-3.5 text-[#8B7355]" />
                    </div>
                    <div className="pb-6 flex-1">
                      <p className="text-sm font-medium text-[var(--fg)]">{item.title}</p>
                      <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{formatDate(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <DrawerFooter>
        <Button variant="outline" className="flex-1" onClick={() => onEdit(asset)}>
          <Edit3 className="h-4 w-4" /> Edit Asset
        </Button>
        <Button className="flex-1" onClick={() => handleDownload('Statement')}>
          <Download className="h-4 w-4" /> Download Statement
        </Button>
      </DrawerFooter>
    </AppDrawer>
  );
}

/* ─────────────────────────────────────────────
   EXPORT DROPDOWN
   ───────────────────────────────────────────── */

function ExportDropdown({ assets }: { assets: PortfolioAsset[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const downloadCSV = () => {
    const header = ['Property', 'Location', 'Type', 'Purchase Price', 'Current Value', 'Currency', 'Appreciation %', 'ROI %', 'Status', 'Occupancy %'];
    const rows = assets.map(a => [a.title, a.location, a.type, a.purchasePrice.amount, a.currentValue.amount, a.currentValue.currency, a.appreciation, a.roi, a.status, a.occupancyRate]);
    const csv = [header.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'assets_export.csv'; a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const downloadJSON = () => {
    const json = JSON.stringify({ exportDate: new Date().toISOString(), assets }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'assets_export.json'; a.click();
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
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
            className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_16px_48px_rgba(0,0,0,0.15),0_0_0_1px_rgba(139,115,85,0.06)] overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-[var(--border-light)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">Export Assets</p>
            </div>
            <button onClick={downloadCSV} className="premium-dropdown-item cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-secondary)]"><FileText className="h-3.5 w-3.5 text-[var(--fg-muted)]" /></div>
              <div><p className="text-xs font-medium">CSV</p><p className="text-[10px] text-[var(--fg-muted)]">Spreadsheet data</p></div>
            </button>
            <button onClick={downloadJSON} className="premium-dropdown-item cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-secondary)]"><FileText className="h-3.5 w-3.5 text-[var(--fg-muted)]" /></div>
              <div><p className="text-xs font-medium">JSON</p><p className="text-[10px] text-[var(--fg-muted)]">Structured data</p></div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EMPTY STATE
   ───────────────────────────────────────────── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-card rounded-2xl py-20 px-8 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[rgba(139,115,85,0.06)] border border-[rgba(139,115,85,0.12)] mb-6">
        <Building2 className="h-10 w-10 text-[#8B7355] opacity-60" />
      </div>
      <h3 className="text-xl font-semibold text-[var(--fg)]">No assets added yet</h3>
      <p className="text-sm text-[var(--fg-secondary)] mt-2 max-w-md mx-auto">
        Start building your global portfolio by adding your first property or importing your existing assets.
      </p>
      <div className="flex items-center justify-center gap-3 mt-8">
        <Button onClick={onAdd} className="">
          <Plus className="h-4 w-4" /> Add Asset
        </Button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */

export default function AssetsPage() {
  /* ── State ── */
  const [assets, setAssets] = useState<PortfolioAsset[]>(() => [...mockPortfolioAssets]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('value-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<PortfolioAsset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<PortfolioAsset | null>(null);
  const [drawerAsset, setDrawerAsset] = useState<PortfolioAsset | null>(null);
  const [scenarioInsight, setScenarioInsight] = useState<AIInsight | null>(null);

  // AI
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiRefreshing, setAiRefreshing] = useState(false);

  // More menu
  const [moreMenuId, setMoreMenuId] = useState<string | null>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreMenuId) return;
    function handleClick(e: MouseEvent) { if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuId(null); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [moreMenuId]);

  /* ── Computed values ── */
  const totalValue = useMemo(() => assets.reduce((sum, a) => sum + (a.currentValue.currency === 'USD' ? a.currentValue.amount : a.currentValue.amount * 0.0067), 0), [assets]);
  const avgOccupancy = useMemo(() => assets.length ? Math.round(assets.reduce((s, a) => s + a.occupancyRate, 0) / assets.length) : 0, [assets]);
  const avgROI = useMemo(() => assets.length ? Number((assets.reduce((s, a) => s + a.roi, 0) / assets.length).toFixed(1)) : 0, [assets]);

  const totalValueDisplay = useCountUp(totalValue, 1200, '', '');
  const avgOccDisplay = useCountUp(avgOccupancy, 1000, '', '%');
  const avgROIDisplay = useCountUp(avgROI, 1000, '', '%');

  /* ── Top performer ID ── */
  const topPerformerId = useMemo(() => {
    if (!assets.length) return null;
    return assets.reduce((best, a) => a.roi > best.roi ? a : best, assets[0]).id;
  }, [assets]);

  /* ── Filtered & sorted assets ── */
  const filteredAssets = useMemo(() => {
    let result = [...assets];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(q) || a.location.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter(a => a.status === statusFilter);
    if (typeFilter !== 'all') result = result.filter(a => a.type === typeFilter);

    switch (sortBy) {
      case 'value-desc': result.sort((a, b) => b.currentValue.amount - a.currentValue.amount); break;
      case 'value-asc': result.sort((a, b) => a.currentValue.amount - b.currentValue.amount); break;
      case 'roi-desc': result.sort((a, b) => b.roi - a.roi); break;
      case 'roi-asc': result.sort((a, b) => a.roi - b.roi); break;
      case 'appreciation': result.sort((a, b) => b.appreciation - a.appreciation); break;
    }
    return result;
  }, [assets, searchQuery, statusFilter, typeFilter, sortBy]);

  /* ── Callbacks ── */
  const handleAddAsset = useCallback((asset: PortfolioAsset) => {
    setAssets(prev => [...prev, asset]);
  }, []);

  const handleUpdateAsset = useCallback((updated: PortfolioAsset) => {
    setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    setDrawerAsset(prev => prev?.id === updated.id ? updated : prev);
  }, []);

  const handleDeleteAsset = useCallback((id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    setDrawerAsset(prev => prev?.id === id ? null : prev);
  }, []);

  const handleAiAnalyze = () => {
    setAiDrawerOpen(true);
    setAiRefreshing(true);
    setTimeout(() => setAiRefreshing(false), 2500);
  };

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
    setAiDrawerOpen(false);
  }, [assets]);

  /* ── KPI data ── */
  const kpis = [
    { title: 'Total Assets', value: String(assets.length), icon: Building2, sparkline: SPARKLINE_TOTAL, color: '#A89478', tooltip: 'Total number of properties in your portfolio.', change: 1, changeLabel: 'vs last quarter' },
    { title: 'Total Market Value', value: formatCompactValue(totalValue, 'INR'), icon: DollarSign, sparkline: SPARKLINE_VALUE, color: BRAND, tooltip: 'Combined market value of all assets.', change: 6.2, changeLabel: 'vs last year' },
    { title: 'Avg Occupancy', value: `${avgOccupancy}%`, icon: Activity, sparkline: SPARKLINE_OCC, color: avgOccupancy >= 80 ? GREEN : BRAND, tooltip: 'Average occupancy rate across all properties.', change: -11, changeLabel: 'vs last quarter' },
    { title: 'Avg ROI', value: `${avgROI}%`, icon: TrendingUp, sparkline: SPARKLINE_ROI, color: '#8B7355', tooltip: 'Average return on investment across portfolio.', change: 0.8, changeLabel: 'vs last quarter' },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">

        {/* ═══════════════════════════════════
            1. HERO HEADER
            ═══════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="premium-card rounded-2xl p-6 lg:p-8 relative"
          style={{ overflow: 'visible' }}
        >
          <div className="absolute inset-0 rounded-2xl opacity-[0.03] pointer-events-none" style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(139,115,85,1) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(168,148,120,0.6) 0%, transparent 50%)',
          }} />
          <div className="relative flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            {/* Left: title + live metric */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--fg)] tracking-tight">My Assets</h1>
              <p className="mt-1 text-sm text-[var(--fg-secondary)]">Manage and monitor your real estate holdings</p>
              {/* Live metrics row */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.12)] px-2.5 py-1.5">
                  <ArrowUpRight className="h-3 w-3 text-[#4ADE80]" />
                  <span className="text-[11px] font-bold text-[#4ADE80]">+6.2% YTD</span>
                  <span className="text-[10px] text-[var(--fg-muted)]">Portfolio Growth</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] px-2.5 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
                  </span>
                  <span className="text-[11px] font-medium text-[#22C55E]">Live</span>
                </div>
              </div>
            </div>

            {/* Right: CTAs with separation */}
            <div className="flex items-center gap-2 flex-shrink-0 pt-1">
              {/* Primary CTA */}
              <Button onClick={() => setAddModalOpen(true)} className="" size="sm">
                <Plus className="h-4 w-4" /> Add Asset
              </Button>

              {/* Divider */}
              <div className="h-6 w-px bg-[var(--border)] mx-0.5" />

              {/* Secondary CTAs */}
              <ExportDropdown assets={assets} />

              <Button variant="outline" size="sm" onClick={handleAiAnalyze} className="border-[rgba(139,115,85,0.3)] hover:border-[rgba(139,115,85,0.5)] hover:bg-[rgba(139,115,85,0.04)]">
                <Brain className="h-4 w-4 text-[#8B7355]" /> AI Analyze
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════
            2. KPI SUMMARY CARDS
            ═══════════════════════════════════ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="premium-card rounded-2xl p-5 group cursor-default hover:shadow-[0_12px_32px_rgba(139,115,85,0.08)] hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="glow-icon-container">
                    <kpi.icon className="h-4.5 w-4.5 text-[var(--accent)]" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)]">{kpi.title}</p>
                </div>
                <PortalTooltip content={kpi.tooltip}>
                  <Info className="h-3.5 w-3.5 text-[var(--fg-muted)] opacity-40 group-hover:opacity-70 transition-opacity cursor-help" />
                </PortalTooltip>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-[28px] font-extrabold text-[var(--fg)] tracking-[-0.03em] leading-none">{kpi.value}</p>
                  {/* Comparison label */}
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className={cn(
                      'flex items-center gap-0.5 rounded-full px-1.5 py-0.5',
                      kpi.change >= 0 ? 'bg-[rgba(34,197,94,0.08)]' : 'bg-[rgba(239,68,68,0.08)]'
                    )}>
                      {kpi.change >= 0
                        ? <ArrowUpRight className="h-3 w-3 text-[#4ADE80]" />
                        : <ArrowDownRight className="h-3 w-3 text-[#F87171]" />
                      }
                      <span className={cn('text-[10px] font-semibold', kpi.change >= 0 ? 'text-[#4ADE80]' : 'text-[#F87171]')}>
                        {kpi.change >= 0 ? '+' : ''}{kpi.change}{typeof kpi.change === 'number' && kpi.change % 1 !== 0 ? '%' : ''}
                      </span>
                    </div>
                    <span className="text-[9px] text-[var(--fg-muted)]">{kpi.changeLabel}</span>
                  </div>
                </div>
                {/* Larger sparkline */}
                <div className="h-10 w-24">
                  <ResponsiveContainer width="100%" height="100%" minWidth={40} minHeight={20}>
                    <AreaChart data={kpi.sparkline}>
                      <defs>
                        <linearGradient id={`kpi-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={kpi.color} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={kpi.color} strokeWidth={1.5} fill={`url(#kpi-grad-${i})`} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════════
            3. SMART FILTER TOOLBAR
            ═══════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="premium-card rounded-2xl p-4 space-y-3"
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
              <input
                type="text"
                placeholder="Search by property name or city..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 rounded-xl border border-[var(--border)] bg-transparent pl-10 pr-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(139,115,85,0.3)] focus:border-[rgba(139,115,85,0.4)] transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-36">
                <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="Status" />
              </div>
              <div className="w-36">
                <Select value={typeFilter} onChange={setTypeFilter} options={TYPE_OPTIONS} placeholder="Type" />
              </div>
              <div className="w-44">
                <Select value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} placeholder="Sort by" />
              </div>

              {/* View toggle with brand active glow */}
              <div className="flex items-center rounded-xl border border-[var(--border)] overflow-hidden ml-auto">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2.5 transition-all cursor-pointer',
                    viewMode === 'grid'
                      ? 'bg-[rgba(139,115,85,0.1)] text-[#8B7355] shadow-[inset_0_0_12px_rgba(139,115,85,0.08)]'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)]'
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <div className="h-5 w-px bg-[var(--border)]" />
                <button
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'p-2.5 transition-all cursor-pointer',
                    viewMode === 'table'
                      ? 'bg-[rgba(139,115,85,0.1)] text-[#8B7355] shadow-[inset_0_0_12px_rgba(139,115,85,0.08)]'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)]'
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {(statusFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold">Active:</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="flex items-center gap-1 rounded-full bg-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.15)] px-2.5 py-1 text-[11px] font-medium text-[#8B7355] hover:bg-[rgba(139,115,85,0.12)] transition-colors cursor-pointer">
                  &ldquo;{searchQuery}&rdquo; <X className="h-3 w-3 ml-0.5" />
                </button>
              )}
              {statusFilter !== 'all' && (
                <button onClick={() => setStatusFilter('all')} className="flex items-center gap-1 rounded-full bg-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.15)] px-2.5 py-1 text-[11px] font-medium text-[#8B7355] hover:bg-[rgba(139,115,85,0.12)] transition-colors cursor-pointer capitalize">
                  {statusFilter} <X className="h-3 w-3 ml-0.5" />
                </button>
              )}
              {typeFilter !== 'all' && (
                <button onClick={() => setTypeFilter('all')} className="flex items-center gap-1 rounded-full bg-[rgba(139,115,85,0.08)] border border-[rgba(139,115,85,0.15)] px-2.5 py-1 text-[11px] font-medium text-[#8B7355] hover:bg-[rgba(139,115,85,0.12)] transition-colors cursor-pointer">
                  {typeFilter} <X className="h-3 w-3 ml-0.5" />
                </button>
              )}
              <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); }} className="text-[10px] text-[var(--fg-muted)] hover:text-[#EF4444] transition-colors cursor-pointer font-medium ml-1">
                Clear all
              </button>
            </div>
          )}
        </motion.div>

        {/* ═══════════════════════════════════
            4. ASSETS GRID / TABLE
            ═══════════════════════════════════ */}
        {assets.length === 0 ? (
          <EmptyState onAdd={() => setAddModalOpen(true)} />
        ) : filteredAssets.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="premium-card rounded-2xl py-16 text-center">
            <Search className="h-10 w-10 mx-auto text-[var(--fg-muted)] opacity-40 mb-4" />
            <p className="text-sm font-medium text-[var(--fg-secondary)]">No assets match your filters</p>
            <p className="text-xs text-[var(--fg-muted)] mt-1">Try adjusting your search or filter criteria</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); }}>
              Clear Filters
            </Button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW ── */
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssets.map((asset, i) => {
              const isTopPerformer = asset.id === topPerformerId;
              return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className={cn(
                  'premium-card rounded-2xl overflow-hidden group hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-300 relative',
                  isTopPerformer && 'ring-1 ring-[rgba(139,115,85,0.3)] shadow-[0_0_24px_rgba(139,115,85,0.06)]'
                )}
              >
                {/* Top performer badge */}
                {isTopPerformer && (
                  <div className="absolute top-0 left-0 right-0 z-20 flex justify-center">
                    <div className="bg-gradient-to-r from-[#6F5C46] to-[#A89478] text-white text-[9px] font-bold uppercase tracking-[0.1em] px-3 py-0.5 rounded-b-lg shadow-sm">
                      Top Performer
                    </div>
                  </div>
                )}

                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={PROPERTY_IMAGES[asset.id] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=300&fit=crop&q=80'}
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge className="backdrop-blur-md bg-black/40 text-white border-white/20 text-[10px] shadow-md font-semibold">
                      {asset.type}
                    </Badge>
                    <Badge variant={statusVariant(asset.status)} className="backdrop-blur-md bg-black/40 text-white border-white/20 text-[10px] capitalize shadow-md font-semibold">
                      {asset.status.replace('-', ' ')}
                    </Badge>
                  </div>

                  {/* ROI pill */}
                  <div className="absolute top-3 right-3">
                    <div className={cn(
                      'flex items-center gap-0.5 rounded-full px-2.5 py-1 backdrop-blur-md text-[10px] font-bold shadow-md',
                      asset.roi >= 5 ? 'bg-[rgba(34,197,94,0.25)] text-[#4ADE80] border border-[rgba(34,197,94,0.3)]' : 'bg-[rgba(139,115,85,0.25)] text-[#A89478] border border-[rgba(139,115,85,0.3)]'
                    )}>
                      <TrendingUp className="h-3 w-3" />
                      {asset.roi}% ROI
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-[var(--fg)] truncate">{asset.title}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-[var(--fg-muted)]" />
                        <span className="text-xs text-[var(--fg-muted)]">{asset.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="text-xl font-extrabold text-[var(--fg)] tracking-tight">
                      {formatCurrency(asset.currentValue)}
                    </p>
                    <div className={cn(
                      'flex items-center gap-0.5 rounded-full px-1.5 py-0.5',
                      asset.appreciation >= 0 ? 'bg-[rgba(34,197,94,0.08)]' : 'bg-[rgba(239,68,68,0.08)]'
                    )}>
                      {asset.appreciation >= 0 ? <ArrowUpRight className="h-3 w-3 text-[#4ADE80]" /> : <ArrowDownRight className="h-3 w-3 text-[#F87171]" />}
                      <span className={cn('text-[11px] font-semibold', asset.appreciation >= 0 ? 'text-[#4ADE80]' : 'text-[#F87171]')}>
                        {asset.appreciation >= 0 ? '+' : ''}{asset.appreciation}%
                      </span>
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-2.5 mt-4">
                    {[
                      { label: 'Occupancy', value: `${asset.occupancyRate}%`, highlight: asset.occupancyRate >= 80 },
                      { label: 'Yield', value: asset.monthlyRental ? `${((asset.monthlyRental.amount * 12 / asset.currentValue.amount) * 100).toFixed(1)}%` : 'N/A', highlight: false },
                      { label: 'Rent/mo', value: asset.monthlyRental ? formatCurrency(asset.monthlyRental) : 'N/A', highlight: false },
                    ].map(m => (
                      <div key={m.label} className="text-center rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] py-2.5 px-2">
                        <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)] font-medium">{m.label}</p>
                        <p className={cn('text-[12px] font-bold mt-0.5', m.highlight ? 'text-[#8B7355]' : 'text-[var(--fg)]')}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-light)]">
                    <PortalTooltip content="Open full asset details">
                      <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setDrawerAsset(asset)}>
                        <Eye className="h-3.5 w-3.5" /> View Details
                      </Button>
                    </PortalTooltip>
                    <PortalTooltip content="Edit asset">
                      <button onClick={() => setEditAsset(asset)} className="h-8 w-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] hover:text-[#8B7355] hover:border-[rgba(139,115,85,0.3)] hover:bg-[rgba(139,115,85,0.04)] transition-all cursor-pointer">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                    </PortalTooltip>
                    <div className="relative" ref={moreMenuId === asset.id ? moreMenuRef : undefined}>
                      <PortalTooltip content="More actions">
                        <button onClick={() => setMoreMenuId(moreMenuId === asset.id ? null : asset.id)} className="h-8 w-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </PortalTooltip>
                      <AnimatePresence>
                        {moreMenuId === asset.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 bottom-full mb-2 z-50 w-48 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_16px_48px_rgba(0,0,0,0.15),0_0_0_1px_rgba(139,115,85,0.04)] overflow-hidden"
                          >
                            <div className="px-3 py-2 border-b border-[var(--border-light)]">
                              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">Actions</p>
                            </div>
                            <button onClick={() => { setDrawerAsset(asset); setMoreMenuId(null); }} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                              <Eye className="h-3.5 w-3.5 text-[var(--fg-muted)]" /> View Details
                            </button>
                            <button onClick={() => { setEditAsset(asset); setMoreMenuId(null); }} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                              <Edit3 className="h-3.5 w-3.5 text-[var(--fg-muted)]" /> Edit Asset
                            </button>
                            <button onClick={() => setMoreMenuId(null)} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                              <Copy className="h-3.5 w-3.5 text-[var(--fg-muted)]" /> Duplicate
                            </button>
                            <button onClick={() => setMoreMenuId(null)} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                              <Archive className="h-3.5 w-3.5 text-[var(--fg-muted)]" /> Archive
                            </button>
                            <div className="border-t border-[var(--border-light)]">
                              <button onClick={() => { setDeleteAsset(asset); setMoreMenuId(null); }} className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#EF4444] hover:bg-[rgba(239,68,68,0.04)] transition-colors cursor-pointer">
                                <Trash2 className="h-3.5 w-3.5" /> Delete Asset
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })}
          </div>
        ) : (
          /* ── TABLE VIEW ── */
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="premium-card rounded-2xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Property', 'Type', 'Value', 'ROI', 'Status', 'Country', 'Actions'].map(col => (
                      <th key={col} className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] bg-[var(--bg-secondary)] sticky top-0">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(asset => (
                    <tr key={asset.id} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-secondary)] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={PROPERTY_IMAGES[asset.id] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=100&h=60&fit=crop&q=80'}
                            alt={asset.title}
                            className="h-10 w-14 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[var(--fg)]">{asset.title}</p>
                            <p className="text-[11px] text-[var(--fg-muted)]">{asset.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-[var(--fg-secondary)]">{asset.type}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-[var(--fg)]">{formatCurrency(asset.currentValue)}</p>
                        <span className={cn('text-[10px] font-medium', asset.appreciation >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]')}>
                          {asset.appreciation >= 0 ? '+' : ''}{asset.appreciation}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn('text-sm font-bold', asset.roi >= 5 ? 'text-[#22C55E]' : 'text-[#8B7355]')}>
                          {asset.roi}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant(asset.status)} className="capitalize text-[10px]">
                          {asset.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-[var(--fg-secondary)]">{getCountryFromLocation(asset.location)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDrawerAsset(asset)} className="rounded-lg p-1.5 text-[var(--fg-muted)] hover:text-[#8B7355] hover:bg-[rgba(139,115,85,0.06)] transition-all cursor-pointer" title="View">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditAsset(asset)} className="rounded-lg p-1.5 text-[var(--fg-muted)] hover:text-[#8B7355] hover:bg-[rgba(139,115,85,0.06)] transition-all cursor-pointer" title="Edit">
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteAsset(asset)} className="rounded-lg p-1.5 text-[var(--fg-muted)] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.04)] transition-all cursor-pointer" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════
            5. AI INSIGHTS SECTION
            ═══════════════════════════════════ */}
        {assets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--fg)]">AI Insights</h2>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">Actionable intelligence for your portfolio</p>
              </div>
              <Badge className="bg-[rgba(139,115,85,0.08)] text-[#8B7355] border-[rgba(139,115,85,0.15)] text-[10px]">
                {aiInsights.length} insights
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {aiInsights.map((insight, i) => {
                const category = INSIGHT_CATEGORY_MAP[insight.id] || 'opportunity';
                const config = INSIGHT_CONFIG[category];
                const Icon = config.icon;
                const ctaLabel = insight.action === 'View Asset' ? 'View Asset' : insight.action === 'Run Scenario' ? 'Run AI Scenario' : insight.action === 'Resolve Risk' ? 'Resolve Now' : insight.action;
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                    className="premium-card rounded-xl overflow-hidden hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200"
                    style={{ borderLeft: '3px solid #8B7355' }}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.bgTint, border: `1px solid ${config.borderColor}` }}>
                          <Icon className="h-5 w-5" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: config.color }}>{config.label}</p>
                          <h4 className="text-sm font-semibold text-[var(--fg)] leading-snug">{insight.title}</h4>
                          <p className="text-xs text-[var(--fg-muted)] mt-1.5 leading-relaxed">{insight.description}</p>

                          {/* Confidence bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-[var(--fg-muted)] font-medium">Confidence</span>
                              <span className="text-[10px] font-bold" style={{ color: config.color }}>{insight.confidence}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: config.barColor }}
                                initial={{ width: 0 }}
                                animate={{ width: `${insight.confidence}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 + i * 0.1 }}
                              />
                            </div>
                          </div>

                          {/* Impact + CTA */}
                          <div className="flex items-center justify-between mt-3.5">
                            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{ background: config.bgTint, border: `1px solid ${config.borderColor}` }}>
                              <span className="text-[10px] font-bold" style={{ color: config.color }}>{insight.impact}</span>
                            </div>
                            <Button size="sm" className="text-[11px] h-7 px-3 text-white" style={{ backgroundColor: config.color }} onClick={() => handleInsightAction(insight)}>
                              {ctaLabel} <ChevronRight className="h-3 w-3" />
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
        )}

      </div>

      {/* ═══════════════════════════════════
          MODALS & DRAWERS
          ═══════════════════════════════════ */}
      <AddAssetModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSave={handleAddAsset} />
      <EditAssetModal open={!!editAsset} onClose={() => setEditAsset(null)} asset={editAsset} onSave={handleUpdateAsset} />
      <DeleteConfirmModal open={!!deleteAsset} onClose={() => setDeleteAsset(null)} asset={deleteAsset} onDelete={handleDeleteAsset} />
      <ScenarioModal open={!!scenarioInsight} onClose={() => setScenarioInsight(null)} insight={scenarioInsight} />
      <AssetDrawer asset={drawerAsset} onClose={() => setDrawerAsset(null)} onEdit={(a) => { setDrawerAsset(null); setEditAsset(a); }} />

      {/* AI Analysis Drawer */}
      <AppDrawer open={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} size="md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[rgba(139,115,85,0.1)] flex items-center justify-center">
              <Brain className="h-4 w-4 text-[#8B7355]" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--fg)]">AI Portfolio Analysis</h3>
              <p className="text-[11px] text-[var(--fg-muted)]">{aiInsights.length} insights found</p>
            </div>
          </div>
          <button onClick={() => setAiDrawerOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <AnimatePresence mode="wait">
            {aiRefreshing ? (
              <motion.div
                key="ai-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-16 gap-5"
              >
                {/* Orbital spinner */}
                <div className="relative h-20 w-20">
                  <motion.div
                    className="absolute -inset-3 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(139,115,85,0.12) 0%, transparent 70%)' }}
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="absolute inset-0 rounded-full border-[2px] border-[var(--bg-tertiary)]" />
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ border: '2.5px solid transparent', borderTopColor: '#8B7355', borderRightColor: 'rgba(139,115,85,0.3)' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full"
                    style={{ border: '2px solid transparent', borderBottomColor: 'rgba(139,115,85,0.5)', borderLeftColor: 'rgba(139,115,85,0.15)' }}
                    animate={{ rotate: -360 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="absolute inset-3 rounded-full bg-[rgba(139,115,85,0.06)] flex items-center justify-center">
                    <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                      <Brain className="h-6 w-6 text-[#8B7355]" />
                    </motion.div>
                  </div>
                  {[0, 1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      className="absolute h-1.5 w-1.5 rounded-full bg-[#8B7355]"
                      style={{ top: '50%', left: '50%' }}
                      animate={{ x: [0, Math.cos((i * Math.PI) / 2) * 36, 0], y: [0, Math.sin((i * Math.PI) / 2) * 36, 0], opacity: [0, 0.7, 0], scale: [0, 1, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
                <div className="text-center">
                  <motion.p className="text-sm font-semibold text-[var(--fg)]"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    Re-analyzing deals...
                  </motion.p>
                  <motion.p className="text-[11px] text-[var(--fg-muted)] mt-1"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    Running AI models on latest market data
                  </motion.p>
                </div>
                <motion.div className="w-48 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden"
                  initial={{ opacity: 0, scaleX: 0.8 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.2 }}>
                  <motion.div className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6F5C46, #A89478, #A89478)' }}
                    initial={{ width: '0%' }} animate={{ width: '100%' }}
                    transition={{ duration: 2.3, ease: [0.25, 0.46, 0.45, 0.94] }} />
                </motion.div>
                <div className="flex items-center gap-2.5">
                  {['Scanning market data', 'Evaluating risks', 'Computing insights'].map((step, i) => (
                    <motion.span key={step}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.2, duration: 0.3 }}
                      className="text-[10px] font-medium text-[#8B7355] px-2.5 py-1 rounded-full bg-[rgba(139,115,85,0.06)] border border-[rgba(139,115,85,0.12)] relative overflow-hidden">
                      <motion.span className="absolute inset-0 rounded-full"
                        style={{ background: 'linear-gradient(90deg, transparent, rgba(139,115,85,0.08), transparent)' }}
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }} />
                      <span className="relative">{step}</span>
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="ai-insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-4">
                {aiInsights.map(insight => {
                  const category = INSIGHT_CATEGORY_MAP[insight.id] || 'opportunity';
                  const config = INSIGHT_CONFIG[category];
                  const Icon = config.icon;
                  const ctaLabel = insight.action === 'View Asset' ? 'View Asset' : insight.action === 'Run Scenario' ? 'Run AI Scenario' : insight.action === 'Resolve Risk' ? 'Resolve Now' : insight.action;
                  return (
                    <div key={insight.id} className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200" style={{ borderLeft: '3px solid #8B7355' }}>
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.bgTint, border: `1px solid ${config.borderColor}` }}>
                            <Icon className="h-5 w-5" style={{ color: config.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: config.color }}>{config.label}</p>
                            <h4 className="text-sm font-semibold text-[var(--fg)]">{insight.title}</h4>
                            <p className="text-xs text-[var(--fg-muted)] mt-1 leading-relaxed">{insight.description}</p>
                            <div className="mt-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-[var(--fg-muted)]">Confidence</span>
                                <span className="text-[10px] font-bold" style={{ color: config.color }}>{insight.confidence}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ backgroundColor: config.barColor, width: `${insight.confidence}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: config.bgTint, border: `1px solid ${config.borderColor}` }}>
                                <span className="text-[10px] font-bold" style={{ color: config.color }}>{insight.impact}</span>
                              </div>
                              <Button size="sm" className="text-[11px] h-7 px-3 text-white" style={{ backgroundColor: config.color }} onClick={() => handleInsightAction(insight)}>
                                {ctaLabel} <ChevronRight className="h-3 w-3" />
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
      </AppDrawer>
    </PageContainer>
  );
}
