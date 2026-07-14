'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AppDrawer, DrawerHero, DrawerTabs, DrawerFooter, DrawerMetricsGrid, DrawerProgressBar, type DrawerTab } from '@/components/ui/drawer';
import {
  Activity, DollarSign, CheckCircle, CheckCircle2, Clock, ExternalLink, TrendingUp,
  TrendingDown, ArrowUpRight, ArrowDownRight, Building2, Search, Filter,
  MoreHorizontal, Edit3, Download, Brain, X, Plus, ChevronDown, ChevronRight,
  FileText, Shield, Calendar, User, MapPin, AlertTriangle, Target, Zap,
  Eye, MessageSquare, Upload, Loader2, BarChart3, Circle, Briefcase,
  ArrowRight, Check, Mail, Phone, Sparkles, Info,
} from 'lucide-react';
import {
  mockTransactions, type Transaction, type TransactionStatus, type TransactionStage,
} from '@/mock-data/transactions';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/formatters';
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RTooltip,
} from 'recharts';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════ */

const BRAND = '#6F5C46';
const BRAND_LIGHT = '#A89478';
const GREEN = '#22C55E';
const RED = '#EF4444';
const ORANGE = '#F59E0B';
const PURPLE = '#A89478';
const BLUE = '#8B7355';

const STAGES: TransactionStage[] = ['offer', 'due-diligence', 'financing', 'legal', 'closing', 'closed'];
const stageLabel = (s: TransactionStage) => s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');

function statusVariant(status: TransactionStatus) {
  switch (status) {
    case 'completed': return 'success' as const;
    case 'in-progress': return 'info' as const;
    case 'pending': return 'warning' as const;
    case 'cancelled': return 'danger' as const;
  }
}

function stageColor(stage: TransactionStage) {
  switch (stage) {
    case 'closed': return GREEN;
    case 'closing': return BLUE;
    case 'legal': return PURPLE;
    case 'financing': return ORANGE;
    case 'due-diligence': return BLUE;
    case 'offer': return BRAND;
  }
}

const DEAL_IMAGES: Record<string, string> = {
  'txn-001': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=400&fit=crop&q=80',
  'txn-002': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=400&fit=crop&q=80',
  'txn-003': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=400&fit=crop&q=80',
};

/* Additional mock transactions for richer demo */
const EXTENDED_TRANSACTIONS: Transaction[] = [
  ...mockTransactions,
  {
    id: 'txn-004',
    propertyId: 'prop-006',
    propertyTitle: 'Tokyo Roppongi Tower',
    propertyLocation: 'Tokyo, Japan',
    amount: { amount: 8500000, currency: 'USD' },
    status: 'in-progress',
    stage: 'financing',
    stageProgress: 60,
    buyerId: 'inv-001',
    sellerId: 'dev-004',
    agentName: 'Yuki Tanaka',
    escrowAmount: { amount: 850000, currency: 'USD' },
    closingDate: '2025-06-15',
    createdAt: '2025-01-10T08:00:00Z',
    documents: [
      { id: 'doc-010', name: 'Purchase Agreement', status: 'signed' },
      { id: 'doc-011', name: 'Financing Approval', status: 'pending' },
      { id: 'doc-012', name: 'Property Survey', status: 'uploaded' },
    ],
    milestones: [
      { label: 'Offer Submitted', completed: true, date: '2025-01-10' },
      { label: 'Offer Accepted', completed: true, date: '2025-01-15' },
      { label: 'Escrow Funded', completed: true, date: '2025-01-22' },
      { label: 'Due Diligence', completed: true, date: '2025-02-15' },
      { label: 'Financing Approved', completed: false },
      { label: 'Title Transfer', completed: false },
    ],
  },
  {
    id: 'txn-005',
    propertyId: 'prop-007',
    propertyTitle: 'London Mayfair Residence',
    propertyLocation: 'London, UK',
    amount: { amount: 12000000, currency: 'USD' },
    status: 'in-progress',
    stage: 'legal',
    stageProgress: 75,
    buyerId: 'inv-001',
    sellerId: 'dev-005',
    agentName: 'Sophie Clarke',
    escrowAmount: { amount: 1200000, currency: 'USD' },
    closingDate: '2025-05-20',
    createdAt: '2024-11-05T08:00:00Z',
    documents: [
      { id: 'doc-013', name: 'Sale Agreement', status: 'signed' },
      { id: 'doc-014', name: 'Legal Review', status: 'pending' },
      { id: 'doc-015', name: 'Property Valuation', status: 'uploaded' },
      { id: 'doc-016', name: 'Title Search', status: 'signed' },
    ],
    milestones: [
      { label: 'Offer Submitted', completed: true, date: '2024-11-05' },
      { label: 'Offer Accepted', completed: true, date: '2024-11-12' },
      { label: 'Escrow Funded', completed: true, date: '2024-11-20' },
      { label: 'Due Diligence', completed: true, date: '2024-12-15' },
      { label: 'Legal Review', completed: false },
      { label: 'Title Transfer', completed: false },
    ],
  },
];

DEAL_IMAGES['txn-004'] = 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&h=400&fit=crop&q=80';
DEAL_IMAGES['txn-005'] = 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop&q=80';

/* KPI sparkline data */
const KPI_SPARKLINES = {
  deals: [2, 3, 2, 4, 3, 5, 4].map((v, i) => ({ v })),
  pipeline: [8, 12, 14, 11, 18, 22, 25].map((v, i) => ({ v })),
  completed: [1, 0, 2, 1, 3, 2, 4].map((v, i) => ({ v })),
  approvals: [3, 2, 4, 3, 2, 3, 2].map((v, i) => ({ v })),
};

/* AI insights */
const AI_DEAL_INSIGHTS = [
  {
    id: 'di-1',
    category: 'risk' as const,
    title: 'Palm Jumeirah closing risk increased',
    description: 'Legal review delay has pushed the expected closing date by 6 days. Consider escalating with the legal team.',
    confidence: 88,
    impact: 'High Risk',
    impactColor: RED,
    asset: 'Palm Jumeirah Villa',
    cta: 'View Deal',
  },
  {
    id: 'di-2',
    category: 'opportunity' as const,
    title: 'Marina Bay achieved below-market price',
    description: 'Acquisition was 8.3% below market valuation — strong entry point for long-term appreciation.',
    confidence: 95,
    impact: '+$374K Upside',
    impactColor: GREEN,
    asset: 'Marina Bay Penthouse',
    cta: 'View Analysis',
  },
  {
    id: 'di-3',
    category: 'growth' as const,
    title: 'Manhattan deal has strong renovation upside',
    description: 'Post-renovation value projected to increase 22-28% based on comparable recent sales.',
    confidence: 82,
    impact: '+$1.4M Potential',
    impactColor: GREEN,
    asset: 'Manhattan Skyline Apartment',
    cta: 'Run Scenario',
  },
  {
    id: 'di-4',
    category: 'savings' as const,
    title: 'Tokyo financing terms can be optimized',
    description: 'Current terms are 15bps above market. Refinancing through partner banks could save $120K over 5 years.',
    confidence: 79,
    impact: '$120K Savings',
    impactColor: BRAND,
    asset: 'Tokyo Roppongi Tower',
    cta: 'Explore Options',
  },
];

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  risk: AlertTriangle,
  opportunity: TrendingUp,
  growth: Zap,
  savings: DollarSign,
};

/* ═══════════════════════════════════════════════════
   HELPER: Count-Up Hook
   ═══════════════════════════════════════════════════ */

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.round(start));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

/* ═══════════════════════════════════════════════════
   HELPER: Days Remaining
   ═══════════════════════════════════════════════════ */

function daysRemaining(closingDate: string): { days: number; delayed: boolean } {
  const diff = Math.ceil((new Date(closingDate).getTime() - Date.now()) / 86400000);
  return { days: Math.abs(diff), delayed: diff < 0 };
}

/* ═══════════════════════════════════════════════════
   HELPER: Normalize to USD
   ═══════════════════════════════════════════════════ */

function toUSD(t: Transaction): number {
  return t.amount.currency === 'AED' ? t.amount.amount / 3.67 : t.amount.amount;
}

/* ═══════════════════════════════════════════════════
   SUB: New Deal Modal
   ═══════════════════════════════════════════════════ */

function NewDealModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [location, setLocation] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [currency, setCurrency] = useState('');
  const [agentName, setAgentName] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [notes, setNotes] = useState('');

  const isValid = propertyName.trim() !== '' && location.trim() !== '' && dealValue.trim() !== '' && currency !== '' && agentName.trim() !== '' && closingDate !== '';

  const resetForm = () => {
    setPropertyName(''); setLocation(''); setDealValue(''); setCurrency(''); setAgentName(''); setClosingDate(''); setNotes('');
    setSaving(false); setSaved(false);
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => { resetForm(); onClose(); }, 1200);
  };

  const handleClose = () => { resetForm(); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} size="lg">
      <DialogHeader>
        <DialogTitle>Create New Deal</DialogTitle>
        <DialogDescription>Start a new property acquisition pipeline</DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Property Name" placeholder="e.g., Palm Jumeirah Villa" value={propertyName} onChange={e => setPropertyName(e.target.value)} />
          <Input label="Location" placeholder="e.g., Dubai, UAE" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Deal Value" placeholder="e.g., 5,000,000" type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} />
          <Select
            label="Currency"
            value={currency}
            onChange={v => setCurrency(v)}
            options={[
              { value: 'USD', label: 'USD' },
              { value: 'AED', label: 'AED' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
            ]}
            placeholder="Select currency"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Agent Name" placeholder="e.g., James Okafor" value={agentName} onChange={e => setAgentName(e.target.value)} />
          <Input label="Expected Closing Date" type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} />
        </div>
        <Input label="Notes" placeholder="Any additional details..." value={notes} onChange={e => setNotes(e.target.value)} />

        {/* Validation hint */}
        {!isValid && (propertyName || location || dealValue || currency || agentName || closingDate) && (
          <p className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1.5">
            <Info className="h-3 w-3" /> Fill all required fields to enable the Create button
          </p>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
        <Button className="flex-1" onClick={handleSubmit} isLoading={saving} disabled={!isValid}>
          {saved ? <><Check className="h-4 w-4" /> Created!</> : <><Plus className="h-4 w-4" /> Create Deal</>}
        </Button>
      </div>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════
   SUB: Edit Deal Modal
   ═══════════════════════════════════════════════════ */

function EditDealModal({ txn, onClose }: { txn: Transaction | null; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [propertyName, setPropertyName] = useState('');
  const [location, setLocation] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [currency, setCurrency] = useState('');
  const [agentName, setAgentName] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (txn) {
      setPropertyName(txn.propertyTitle);
      setLocation(txn.propertyLocation);
      setDealValue(txn.amount.amount.toString());
      setCurrency(txn.amount.currency);
      setAgentName(txn.agentName);
      setClosingDate(txn.closingDate);
      setNotes('');
      setSaving(false);
      setSaved(false);
    }
  }, [txn]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  };

  return (
    <Dialog open={!!txn} onClose={onClose} size="lg">
      <DialogHeader>
        <DialogTitle>Edit Deal</DialogTitle>
        <DialogDescription>Modify deal details for {txn?.propertyTitle}</DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Property Name" value={propertyName} onChange={e => setPropertyName(e.target.value)} />
          <Input label="Location" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Deal Value" value={dealValue} onChange={e => setDealValue(e.target.value)} type="number" />
          <Select
            label="Currency"
            value={currency}
            onChange={v => setCurrency(v)}
            options={[
              { value: 'USD', label: 'USD' },
              { value: 'AED', label: 'AED' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
            ]}
            placeholder="Select currency"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Agent Name" value={agentName} onChange={e => setAgentName(e.target.value)} />
          <Input label="Expected Closing Date" value={closingDate} onChange={e => setClosingDate(e.target.value)} type="date" />
        </div>
        <Input label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional details..." />

        {/* Current stage indicator */}
        {txn && (
          <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-[rgba(139,115,85,0.1)] flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 text-[#8B7355]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--fg)]">Current Stage</p>
                  <p className="text-[11px] text-[var(--fg-muted)]">{stageLabel(txn.stage)} — {txn.stageProgress}% complete</p>
                </div>
              </div>
              <Badge variant={statusVariant(txn.status)} className="capitalize">{txn.status.replace('-', ' ')}</Badge>
            </div>
          </div>
        )}
      </div>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
        <Button className="flex-1" onClick={handleSave} isLoading={saving}>
          {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Edit3 className="h-4 w-4" /> Save Changes</>}
        </Button>
      </div>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════
   SUB: Export Dropdown
   ═══════════════════════════════════════════════════ */

function ExportDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleExport = (format: string) => {
    const data = EXTENDED_TRANSACTIONS.map(t => ({
      Property: t.propertyTitle,
      Location: t.propertyLocation,
      Amount: `${t.amount.amount} ${t.amount.currency}`,
      Stage: stageLabel(t.stage),
      Status: t.status,
      Agent: t.agentName,
      ClosingDate: t.closingDate,
      Progress: `${t.stageProgress}%`,
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n');
      const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'transactions.csv'; a.click();
      URL.revokeObjectURL(url);
    } else {
      const rows = data.map(d => `
        <tr>
          <td>${d.Property}</td>
          <td>${d.Location}</td>
          <td>${d.Amount}</td>
          <td>${d.Stage}</td>
          <td style="text-transform:capitalize">${d.Status}</td>
          <td>${d.Agent}</td>
          <td>${d.ClosingDate}</td>
          <td>${d.Progress}</td>
        </tr>`).join('');
      const html = `<!DOCTYPE html><html><head><title>Transactions Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          p.sub { font-size: 12px; color: #555; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #1e3a5f; color: #fff; padding: 8px 10px; text-align: left; }
          td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) td { background: #F9F7F4; }
          @media print { body { padding: 16px; } }
        </style></head><body>
        <h1>Transaction Report</h1>
        <p class="sub">Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <table><thead><tr>
          <th>Property</th><th>Location</th><th>Amount</th><th>Stage</th>
          <th>Status</th><th>Agent</th><th>Closing Date</th><th>Progress</th>
        </tr></thead><tbody>${rows}</tbody></table>
        <script>window.onload=function(){window.print();}<\/script>
        </body></html>`;
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" onClick={() => setOpen(!open)}>
        <Download className="h-4 w-4" /> Export <ChevronDown className="h-3 w-3" />
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_16px_48px_rgba(0,0,0,0.15),0_0_0_1px_rgba(139,115,85,0.06)] overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-[var(--border-light)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">Export Transactions</p>
            </div>
            <button onClick={() => handleExport('csv')} className="premium-dropdown-item cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-secondary)]"><FileText className="h-3.5 w-3.5 text-[var(--fg-muted)]" /></div>
              <div><p className="text-xs font-medium">CSV</p><p className="text-[10px] text-[var(--fg-muted)]">Spreadsheet data</p></div>
            </button>
            <button onClick={() => handleExport('pdf')} className="premium-dropdown-item cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-secondary)]"><FileText className="h-3.5 w-3.5 text-[var(--fg-muted)]" /></div>
              <div><p className="text-xs font-medium">PDF</p><p className="text-[10px] text-[var(--fg-muted)]">Formatted report</p></div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUB: Transaction Detail Drawer
   ═══════════════════════════════════════════════════ */

function TransactionDrawer({ txn, onClose }: { txn: Transaction | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [msgSent, setMsgSent] = useState(false);

  useEffect(() => { if (txn) { setActiveTab('overview'); setMsgOpen(false); setMsgText(''); setMsgSent(false); } }, [txn]);

  if (!txn) return null;

  const currentStageIdx = STAGES.indexOf(txn.stage);
  const { days, delayed } = daysRemaining(txn.closingDate);

  const tabs: DrawerTab[] = [
    { key: 'overview', label: 'Overview', icon: Eye },
    { key: 'financials', label: 'Financials', icon: DollarSign },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'activity', label: 'Activity', icon: Activity },
  ];

  const handleDownload = (name: string) => {
    const blob = new Blob([`${name} — ${txn.propertyTitle}\nGenerated: ${new Date().toLocaleDateString()}\nPlaceholder document`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${name.replace(/\s/g, '_')}_${txn.propertyTitle.replace(/\s/g, '_')}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <AppDrawer open={!!txn} onClose={onClose} size="lg">
      <DrawerHero
        imageSrc={DEAL_IMAGES[txn.id] || DEAL_IMAGES['txn-001']}
        imageAlt={txn.propertyTitle}
        title={txn.propertyTitle}
        subtitle={txn.propertyLocation}
        badges={[
          { label: txn.status.replace('-', ' '), variant: statusVariant(txn.status) },
          { label: stageLabel(txn.stage) },
        ]}
        onClose={onClose}
      />

      {/* Quick summary stats */}
      <div className="grid grid-cols-4 gap-px bg-[var(--border)] flex-shrink-0">
        {[
          { label: 'Deal Value', value: formatCurrency(txn.amount) },
          { label: 'Stage', value: stageLabel(txn.stage), highlight: true },
          { label: 'Closing', value: formatDate(txn.closingDate) },
          { label: 'Agent', value: txn.agentName },
        ].map(s => (
          <div key={s.label} className="bg-[var(--bg-elevated)] px-3 py-3 text-center">
            <p className="text-[9px] uppercase tracking-wider text-[var(--fg-muted)]">{s.label}</p>
            <p className={cn('text-xs font-bold mt-0.5 truncate', s.highlight ? 'text-[#8B7355]' : 'text-[var(--fg)]')}>{s.value}</p>
          </div>
        ))}
      </div>

      <DrawerTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} layoutId="txn-drawer-tab" />

      <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Stage Tracker */}
                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-4">Deal Progress</p>
                  <div className="flex items-start gap-0 overflow-x-auto pb-1">
                    {STAGES.map((stage, idx) => {
                      const isPast = idx < currentStageIdx;
                      const isCurrent = idx === currentStageIdx;
                      return (
                        <div key={stage} className="flex items-start">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                              isPast ? 'border-[#8B7355] bg-gradient-to-r from-[#6F5C46] to-[#A89478] text-white' :
                              isCurrent ? 'border-[#8B7355] bg-[rgba(139,115,85,0.08)] text-[#8B7355] ring-4 ring-[rgba(139,115,85,0.08)]' :
                              'border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--fg-muted)]'
                            )}>
                              {isPast ? <Check className="h-4 w-4" /> : idx + 1}
                            </div>
                            <span className={cn('mt-1.5 text-[10px] text-center whitespace-nowrap font-medium',
                              isCurrent ? 'text-[#8B7355]' : isPast ? 'text-[var(--fg-secondary)]' : 'text-[var(--fg-muted)]'
                            )}>
                              {stageLabel(stage)}
                            </span>
                          </div>
                          {idx < STAGES.length - 1 && (
                            <div className={cn('mt-4 h-0.5 w-6 mx-0.5 shrink-0', isPast ? 'bg-[#8B7355]' : 'bg-[var(--bg-tertiary)]')} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <DrawerProgressBar label="Overall Progress" value={txn.stageProgress} />

                {/* Delayed warning */}
                {delayed && (
                  <div className="rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.04)] p-4 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#EF4444] flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#EF4444]">Closing Delayed</p>
                      <p className="text-xs text-[var(--fg-secondary)]">This deal is {days} days past expected closing date</p>
                    </div>
                  </div>
                )}

                {/* Milestones timeline */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)] mb-3">Milestones</p>
                  <div className="space-y-0">
                    {txn.milestones.map((m, i) => (
                      <div key={i} className="flex gap-3 pb-4 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            'flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0',
                            m.completed ? 'bg-[rgba(139,115,85,0.1)]' : 'bg-[var(--bg-tertiary)]'
                          )}>
                            {m.completed ? <Check className="h-3.5 w-3.5 text-[#8B7355]" /> : <Circle className="h-3.5 w-3.5 text-[var(--fg-muted)]" />}
                          </div>
                          {i < txn.milestones.length - 1 && <div className="w-px flex-1 bg-[var(--border)] mt-1" />}
                        </div>
                        <div className="pt-0.5">
                          <p className={cn('text-sm font-medium', m.completed ? 'text-[var(--fg)]' : 'text-[var(--fg-muted)]')}>{m.label}</p>
                          {m.date && <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{formatDate(m.date)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agent info */}
                <div className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[rgba(139,115,85,0.1)] flex items-center justify-center">
                      <User className="h-5 w-5 text-[#8B7355]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[var(--fg)]">{txn.agentName}</p>
                      <p className="text-[11px] text-[var(--fg-muted)]">Assigned Agent</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => setMsgOpen(!msgOpen)}>
                      <Mail className="h-3 w-3" /> Message
                    </Button>
                  </div>
                  {msgOpen && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-light)] space-y-2">
                      {msgSent ? (
                        <div className="flex items-center gap-2 py-3 justify-center">
                          <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                          <span className="text-sm font-medium text-[#22C55E]">Message sent to {txn.agentName}</span>
                        </div>
                      ) : (
                        <>
                          <textarea
                            value={msgText}
                            onChange={e => setMsgText(e.target.value)}
                            placeholder={`Message ${txn.agentName} about ${txn.propertyTitle}...`}
                            className="w-full h-20 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[#8B7355]/30 focus:border-[#8B7355]/50"
                          />
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => { setMsgOpen(false); setMsgText(''); }} className="text-xs">Cancel</Button>
                            <Button size="sm" disabled={!msgText.trim()} onClick={() => { setMsgSent(true); setTimeout(() => { setMsgSent(false); setMsgOpen(false); setMsgText(''); }, 2000); }} className="text-xs">
                              <Mail className="h-3 w-3" /> Send
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'financials' && (
              <div className="space-y-4">
                <DrawerMetricsGrid metrics={[
                  { label: 'Deal Value', value: formatCurrency(txn.amount), color: BRAND},
                  { label: 'Escrow Amount', value: formatCurrency(txn.escrowAmount), color: 'var(--fg)' },
                ]} />
                {[
                  { label: 'Deposit (10%)', value: formatCurrency({ amount: txn.amount.amount * 0.1, currency: txn.amount.currency }), color: 'var(--fg)' },
                  { label: 'Agent Commission (2%)', value: formatCurrency({ amount: txn.amount.amount * 0.02, currency: txn.amount.currency }), color: 'var(--fg)' },
                  { label: 'Legal Fees', value: formatCurrency({ amount: 25000, currency: 'USD' }), color: 'var(--fg)' },
                  { label: 'Stamp Duty (4%)', value: formatCurrency({ amount: txn.amount.amount * 0.04, currency: txn.amount.currency }), color: ORANGE },
                  { label: 'Total Payable', value: formatCurrency({ amount: txn.amount.amount * 1.06 + 25000, currency: txn.amount.currency }), color: BRAND},
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                    <span className="text-sm text-[var(--fg-secondary)]">{item.label}</span>
                    <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-3">
                {txn.documents.map(doc => {
                  const docIcon = doc.status === 'signed' ? CheckCircle2 : doc.status === 'uploaded' ? Upload : FileText;
                  const DocIcon = docIcon;
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] group hover:border-[rgba(139,115,85,0.3)] transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[rgba(139,115,85,0.08)] flex items-center justify-center">
                          <DocIcon className="h-4 w-4 text-[#8B7355]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--fg)]">{doc.name}</p>
                          <Badge variant={doc.status === 'signed' ? 'success' : doc.status === 'uploaded' ? 'info' : 'warning'} className="mt-0.5">
                            {doc.status}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(doc.name)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-0">
                {txn.milestones.filter(m => m.completed && m.date).map((m, i, arr) => (
                  <div key={i} className="flex gap-3 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(139,115,85,0.1)] flex-shrink-0">
                        <Check className="h-3.5 w-3.5 text-[#8B7355]" />
                      </div>
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-[var(--border)] mt-1" />}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-sm font-medium text-[var(--fg)]">{m.label}</p>
                      {m.date && <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{formatDate(m.date)}</p>}
                    </div>
                  </div>
                ))}
                {txn.milestones.filter(m => m.completed && m.date).length === 0 && (
                  <div className="text-center py-10">
                    <Activity className="h-8 w-8 text-[var(--fg-muted)] opacity-40 mx-auto mb-3" />
                    <p className="text-sm text-[var(--fg-muted)]">No activity recorded yet</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <DrawerFooter>
        <Button variant="outline" className="flex-1" onClick={() => handleDownload('Statement')}>
          <Download className="h-4 w-4" /> Statement
        </Button>
        <Button className="flex-1">
          <Check className="h-4 w-4" /> Save Changes
        </Button>
      </DrawerFooter>
    </AppDrawer>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */

export default function TransactionsPage() {
  /* State */
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('closing');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [showNewDeal, setShowNewDeal] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [isRefreshAction, setIsRefreshAction] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

  /* Computed values */
  const active = EXTENDED_TRANSACTIONS.filter(t => t.status === 'in-progress').length;
  const completed = EXTENDED_TRANSACTIONS.filter(t => t.status === 'completed').length;
  const pending = EXTENDED_TRANSACTIONS.filter(t => t.status === 'pending').length;
  const totalPipeline = EXTENDED_TRANSACTIONS.filter(t => t.status !== 'completed' && t.status !== 'cancelled').reduce((s, t) => s + toUSD(t), 0);
  const avgCycle = 45; // mock

  /* Animated KPI values */
  const cActive = useCountUp(active + pending);
  const cPipeline = useCountUp(Math.round(totalPipeline / 1000000 * 10) / 10 * 10, 1400);
  const cCompleted = useCountUp(completed);
  const cApprovals = useCountUp(pending);

  /* Filtered + Sorted */
  const filtered = useMemo(() => {
    let list = [...EXTENDED_TRANSACTIONS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.propertyTitle.toLowerCase().includes(q) || t.propertyLocation.toLowerCase().includes(q) || t.agentName.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter);
    if (stageFilter !== 'all') list = list.filter(t => t.stage === stageFilter);

    list.sort((a, b) => {
      if (sortBy === 'closing') return new Date(a.closingDate).getTime() - new Date(b.closingDate).getTime();
      if (sortBy === 'value') return toUSD(b) - toUSD(a);
      if (sortBy === 'progress') return b.stageProgress - a.stageProgress;
      return 0;
    });

    return list;
  }, [searchQuery, statusFilter, stageFilter, sortBy]);

  const delayed = EXTENDED_TRANSACTIONS.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && daysRemaining(t.closingDate).delayed).length;
  const cDelayed = useCountUp(delayed);

  /* ─── KPI Cards ─── */
  const kpis = [
    { label: 'Total Deals', value: `${cActive + cCompleted}`, trend: '+2 this month', trendUp: true, icon: Briefcase, color: BRAND, sparkline: KPI_SPARKLINES.deals },
    { label: 'Closed Value', value: `$4.5M`, trend: `${cCompleted} deals closed`, trendUp: true, icon: CheckCircle, color: GREEN, sparkline: KPI_SPARKLINES.completed },
    { label: 'Active Pipeline', value: `₹${(cPipeline / 10).toFixed(1)}M`, trend: '+18.3% YTD', trendUp: true, icon: TrendingUp, color: BLUE, sparkline: KPI_SPARKLINES.pipeline },
    { label: 'Delayed Deals', value: `${cDelayed}`, trend: 'Needs attention', trendUp: false, icon: AlertTriangle, color: RED, sparkline: KPI_SPARKLINES.approvals },
    { label: 'Avg Closing', value: `${avgCycle}d`, trend: '-5d vs last Q', trendUp: true, icon: Clock, color: ORANGE, sparkline: KPI_SPARKLINES.deals },
  ];

  return (
    <PageContainer>
      {/* ═══════ 1. HERO HEADER ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="wl-kpi-card px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 relative z-10"
        style={{ overflow: 'visible' }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-[18px] font-bold text-[var(--fg)] tracking-tight leading-none">Investor Transactions</h1>
            <motion.span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[rgba(34,197,94,0.06)] border border-[rgba(34,197,94,0.12)]"
              animate={{ boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 10px rgba(34,197,94,0.1)', '0 0 0px rgba(34,197,94,0)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
              </span>
              <span className="text-[10px] font-bold text-[#22C55E] tracking-[0.04em] uppercase">Live</span>
            </motion.span>
          </div>
          <p className="text-[12px] text-[var(--fg-muted)]">
            Track acquisitions, closings, and active deal pipelines
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button onClick={() => setShowNewDeal(true)} className="wl-btn-banker inline-flex items-center gap-2.5 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(111,92,70,0.25)]">
            <Plus className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">New Deal</span>
          </button>
          <ExportDropdown />
          <motion.div
            animate={{ boxShadow: ['0 0 0px rgba(111,92,70,0)', '0 0 12px rgba(111,92,70,0.2)', '0 0 0px rgba(111,92,70,0)'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-[14px]"
          >
            <Button variant="outline" onClick={() => { setShowAiPanel(true); setIsRefreshAction(false); setAiRefreshing(true); setTimeout(() => setAiRefreshing(false), 2500); }} className="border-[rgba(111,92,70,0.25)] hover:border-[rgba(111,92,70,0.4)] hover:bg-[rgba(111,92,70,0.04)] relative overflow-hidden px-4 text-[12px]">
              <Brain className="h-4 w-4 text-[#6F5C46]" /> AI Analyze
              <motion.span
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(111,92,70,0.06), transparent)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ═══════ 2. KPI CARDS ═══════ */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {kpis.map((kpi, idx) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.06, duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="wl-kpi-card group p-3 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-full pointer-events-none" style={{ background: `linear-gradient(to bottom left, ${kpi.color}08, transparent)` }} />
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold text-[var(--fg-muted)] uppercase tracking-[0.1em]">{kpi.label}</p>
                <div className="h-6 w-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${kpi.color}0D` }}>
                  <KpiIcon className="h-3 w-3" style={{ color: kpi.color }} />
                </div>
              </div>
              <p className="text-[16px] font-bold text-[var(--fg)] tracking-tight leading-none tabular-nums">{kpi.value}</p>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1">
                  {kpi.trendUp ? <ArrowUpRight className="h-3 w-3 text-[#22C55E]" /> : <ArrowDownRight className="h-3 w-3 text-[#F59E0B]" />}
                  <span className={cn('text-[10px] font-medium', kpi.trendUp ? 'text-[#22C55E]' : 'text-[#F59E0B]')}>{kpi.trend}</span>
                </div>
                <div className="h-6 w-12">
                  <ResponsiveContainer width="100%" height="100%" minWidth={40} minHeight={16}>
                    <AreaChart data={kpi.sparkline}>
                      <defs>
                        <linearGradient id={`kpi-g-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={kpi.color} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={kpi.color} strokeWidth={1.5} fill={`url(#kpi-g-${idx})`} dot={false} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ═══════ 4. PREMIUM FILTER BAR ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="sticky top-0 z-30 wl-kpi-card px-4 py-3 backdrop-blur-xl"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full lg:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search property, city, or agent..."
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(111,92,70,0.25)] focus:border-[rgba(111,92,70,0.4)] transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors">
                <X className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
              </button>
            )}
          </div>

          {/* Filter controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-[150px]">
              <Select
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Status"
              />
            </div>
            <div className="w-[150px]">
              <Select
                options={[
                  { value: 'all', label: 'All Stages' },
                  ...STAGES.map(s => ({ value: s, label: stageLabel(s) })),
                ]}
                value={stageFilter}
                onChange={setStageFilter}
                placeholder="Stage"
              />
            </div>
            <div className="w-[170px]">
              <Select
                options={[
                  { value: 'closing', label: 'Sort: Closing Date' },
                  { value: 'value', label: 'Sort: Deal Value' },
                  { value: 'progress', label: 'Sort: Progress' },
                ]}
                value={sortBy}
                onChange={setSortBy}
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-7 bg-[var(--border)]" />

            {/* View toggle */}
            <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1 gap-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5',
                  viewMode === 'cards'
                    ? 'bg-gradient-to-r from-[#6F5C46] to-[#A89478] text-white shadow-[0_2px_8px_rgba(111,92,70,0.2)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)]'
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" /> Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5',
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-[#6F5C46] to-[#A89478] text-white shadow-[0_2px_8px_rgba(111,92,70,0.2)]'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)]'
                )}
              >
                <Filter className="h-3.5 w-3.5" /> Table
              </button>
            </div>

            {/* Results count */}
            <span className="text-[11px] font-medium text-[var(--fg-muted)] tabular-nums">
              {filtered.length} deal{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Active filter chips */}
        {(statusFilter !== 'all' || stageFilter !== 'all' || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-[var(--border-light)]">
            <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--fg-muted)] font-bold">Filters:</span>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(111,92,70,0.06)] border border-[rgba(111,92,70,0.15)] text-[11px] font-semibold text-[#6F5C46] hover:bg-[rgba(111,92,70,0.12)] hover:border-[rgba(111,92,70,0.25)] transition-all cursor-pointer">
                <Search className="h-3 w-3" /> &ldquo;{searchQuery}&rdquo; <X className="h-3 w-3 ml-0.5" />
              </button>
            )}
            {statusFilter !== 'all' && (
              <button onClick={() => setStatusFilter('all')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(111,92,70,0.06)] border border-[rgba(111,92,70,0.15)] text-[11px] font-semibold text-[#6F5C46] hover:bg-[rgba(111,92,70,0.12)] hover:border-[rgba(111,92,70,0.25)] transition-all cursor-pointer capitalize">
                {statusFilter} <X className="h-3 w-3 ml-0.5" />
              </button>
            )}
            {stageFilter !== 'all' && (
              <button onClick={() => setStageFilter('all')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[rgba(111,92,70,0.06)] border border-[rgba(111,92,70,0.15)] text-[11px] font-semibold text-[#6F5C46] hover:bg-[rgba(111,92,70,0.12)] hover:border-[rgba(111,92,70,0.25)] transition-all cursor-pointer">
                {stageLabel(stageFilter as TransactionStage)} <X className="h-3 w-3 ml-0.5" />
              </button>
            )}
            <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setStageFilter('all'); }} className="text-[10px] text-[var(--fg-muted)] hover:text-[#EF4444] transition-colors cursor-pointer font-semibold ml-1 flex items-center gap-1">
              <X className="h-3 w-3" /> Clear all
            </button>
          </div>
        )}
      </motion.div>

      {/* ═══════ 3. DEAL PIPELINE CARDS ═══════ */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {/* Section header */}
          <div className="rounded-xl px-4 py-3 flex items-center gap-3 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #6F5C46 0%, #A89478 100%)', boxShadow: '0 4px 16px rgba(111,92,70,0.22)' }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.07) 0%, transparent 65%)' }} />
            <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 relative"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}>
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <div className="relative">
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-white tracking-tight">Deal Pipeline</h2>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.95)' }}>
                  {filtered.length}
                </span>
              </div>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>Track active acquisitions and closings</p>
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((txn, idx) => {
              const currentStageIdx = STAGES.indexOf(txn.stage);
              const { days, delayed } = daysRemaining(txn.closingDate);
              const isCompleted = txn.status === 'completed';
              const statusGradient = isCompleted ? 'linear-gradient(135deg, #22C55E, #16A34A)' : txn.status === 'in-progress' ? 'linear-gradient(135deg, #6F5C46, #A89478)' : delayed ? 'linear-gradient(135deg, #EF4444, #F97316)' : 'linear-gradient(135deg, #F59E0B, #EAB308)';
              return (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="wl-kpi-card group relative overflow-hidden"
                >
                  {/* Left accent bar */}
                  <div className="absolute top-0 left-0 bottom-0 w-[3px]" style={{ background: statusGradient }} />

                  <div className="pl-5 pr-4 pt-3.5 pb-3.5 space-y-3">
                    {/* Row 1: Property info + amount */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-[rgba(111,92,70,0.06)] border border-[rgba(111,92,70,0.08)] flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-[#6F5C46]" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[13px] font-semibold text-[var(--fg)] truncate leading-tight">{txn.propertyTitle}</h3>
                          <p className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 shrink-0" />{txn.propertyLocation}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <Badge variant={statusVariant(txn.status)} className="capitalize text-[10px]">{txn.status.replace('-', ' ')}</Badge>
                        <p className="text-[14px] font-bold text-[var(--fg)] tabular-nums whitespace-nowrap leading-tight">{formatCurrency(txn.amount)}</p>
                      </div>
                    </div>

                    {/* Banner: closed / delayed */}
                    {(isCompleted || delayed) && (
                      <div className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold',
                        isCompleted
                          ? 'bg-[rgba(34,197,94,0.05)] border border-[rgba(34,197,94,0.15)] text-[#22C55E]'
                          : 'bg-[rgba(239,68,68,0.05)] border border-[rgba(239,68,68,0.15)] text-[#EF4444]'
                      )}>
                        {isCompleted
                          ? <><CheckCircle2 className="h-3 w-3" /> Closed on {formatDate(txn.closingDate)}</>
                          : <><AlertTriangle className="h-3 w-3" /> Delayed by {days}d — escalation recommended</>}
                      </div>
                    )}

                    {/* Stage timeline */}
                    <div className="flex items-center">
                      {STAGES.map((stage, sIdx) => {
                        const isPast = sIdx < currentStageIdx;
                        const isCurrent = sIdx === currentStageIdx;
                        return (
                          <div key={stage} className="flex items-center flex-1 last:flex-none">
                            <div className="flex flex-col items-center" style={{ minWidth: 0 }}>
                              <div className={cn(
                                'h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold transition-all',
                                isPast ? 'bg-gradient-to-r from-[#6F5C46] to-[#A89478] text-white' :
                                isCurrent ? 'bg-[rgba(111,92,70,0.1)] text-[#6F5C46] ring-[2px] ring-[rgba(111,92,70,0.2)]' :
                                'bg-[var(--bg-secondary)] text-[var(--fg-muted)] border border-[var(--border)]'
                              )}>
                                {isPast ? <Check className="h-2.5 w-2.5" /> : sIdx + 1}
                              </div>
                              <span className={cn(
                                'mt-0.5 text-[8px] whitespace-nowrap font-medium hidden sm:block',
                                isCurrent ? 'text-[#6F5C46]' : isPast ? 'text-[var(--fg-secondary)]' : 'text-[var(--fg-muted)]'
                              )}>
                                {stageLabel(stage)}
                              </span>
                            </div>
                            {sIdx < STAGES.length - 1 && (
                              <div
                                className="flex-1 h-[1.5px] mx-0.5 rounded-full"
                                style={{ background: isPast ? 'linear-gradient(90deg, #6F5C46, #A89478)' : 'var(--bg-tertiary)' }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Progress bar + dates */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: isCompleted ? 'linear-gradient(90deg, #22C55E, #16A34A)' : 'linear-gradient(90deg, #6F5C46, #A89478)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${txn.stageProgress}%` }}
                          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: idx * 0.06 }}
                        />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums text-[var(--fg-secondary)] w-7 text-right shrink-0">{txn.stageProgress}%</span>
                      <span className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--fg-muted)] shrink-0">
                        <Calendar className="h-3 w-3" />{formatDate(txn.closingDate)}
                      </span>
                      {!isCompleted && !delayed && (
                        <span className="hidden sm:flex items-center gap-1 text-[10px] text-[var(--fg-muted)] shrink-0">
                          <Clock className="h-3 w-3" />{days}d left
                        </span>
                      )}
                    </div>

                    {/* Footer: agent + doc count + actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-light)]">
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-[rgba(111,92,70,0.06)] flex items-center justify-center">
                          <User className="h-3 w-3 text-[var(--fg-muted)]" />
                        </div>
                        <span className="text-[11px] text-[var(--fg-muted)] font-medium">{txn.agentName}</span>
                        <span className="text-[var(--border)] px-1">·</span>
                        <span className="text-[10px] text-[var(--fg-muted)]">{txn.documents.length} docs</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedTxn(txn)}
                          className="c-btn-primary px-3 py-1.5 text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" /> View
                        </button>
                        <button
                          onClick={() => setEditingTxn(txn)}
                          className="c-btn-secondary px-3 py-1.5 text-[11px] font-semibold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit3 className="h-3 w-3" /> Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════ 5. TABLE VIEW ═══════ */}
      {viewMode === 'table' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="wl-kpi-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {['Property', 'Amount', 'Stage', 'Status', 'Agent', 'Closing', 'Updated', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--fg-muted)] text-left whitespace-nowrap bg-[var(--bg-secondary)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((txn, idx) => {
                  const { delayed: isDelayed } = daysRemaining(txn.closingDate);
                  const rowAccent = txn.status === 'completed' ? '#22C55E' : txn.status === 'in-progress' ? '#6F5C46' : isDelayed ? '#EF4444' : '#F59E0B';
                  return (
                    <motion.tr
                      key={txn.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-[var(--border-light)] hover:bg-[rgba(111,92,70,0.02)] transition-all group cursor-pointer"
                      onClick={() => setSelectedTxn(txn)}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: rowAccent }} />
                          <div>
                            <p className="text-[13px] font-semibold text-[var(--fg)]">{txn.propertyTitle}</p>
                            <p className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{txn.propertyLocation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[14px] font-bold text-[var(--fg)] tabular-nums">{formatCurrency(txn.amount)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <Badge variant="secondary" className="text-[10px] font-semibold">{stageLabel(txn.stage)}</Badge>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${txn.stageProgress}%`, background: txn.status === 'completed' ? 'linear-gradient(90deg, #22C55E, #16A34A)' : 'linear-gradient(90deg, #6F5C46, #A89478)' }} />
                            </div>
                            <span className="text-[10px] font-bold text-[var(--fg-muted)] tabular-nums">{txn.stageProgress}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={statusVariant(txn.status)} className="capitalize text-[10px]">{txn.status.replace('-', ' ')}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[rgba(111,92,70,0.06)] flex items-center justify-center">
                            <User className="h-3 w-3 text-[var(--fg-muted)]" />
                          </div>
                          <span className="text-[12px] font-medium text-[var(--fg-secondary)]">{txn.agentName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[12px] font-medium text-[var(--fg-secondary)]">{formatDate(txn.closingDate)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[11px] text-[var(--fg-muted)]">{formatRelativeTime(txn.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedTxn(txn); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-[#6F5C46] to-[#A89478] shadow-[0_2px_6px_rgba(111,92,70,0.2)] hover:shadow-[0_4px_12px_rgba(111,92,70,0.3)] transition-all cursor-pointer">
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setEditingTxn(txn); }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[var(--fg-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[rgba(111,92,70,0.3)] hover:text-[#6F5C46] transition-all cursor-pointer">
                            <Edit3 className="h-3 w-3" /> Edit
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <div className="h-14 w-14 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-[var(--fg-muted)] opacity-40" />
              </div>
              <p className="text-sm font-semibold text-[var(--fg-muted)]">No transactions match your filters</p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-1">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </motion.div>
      )}


      {/* ═══════ MODALS & DRAWERS ═══════ */}
      <NewDealModal open={showNewDeal} onClose={() => setShowNewDeal(false)} />
      <EditDealModal txn={editingTxn} onClose={() => setEditingTxn(null)} />
      <TransactionDrawer txn={selectedTxn} onClose={() => setSelectedTxn(null)} />

      {/* AI Panel Drawer */}
      <AppDrawer open={showAiPanel} onClose={() => setShowAiPanel(false)} size="lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <motion.div
              className="h-9 w-9 rounded-xl bg-[rgba(139,115,85,0.1)] flex items-center justify-center relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Brain className="h-4 w-4 text-[#8B7355]" />
              <motion.div
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#22C55E]"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <motion.h2
                className="text-[15px] font-semibold text-[var(--fg)]"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >AI Deal Analysis</motion.h2>
              <motion.p
                className="text-[11px] text-[var(--fg-muted)]"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >{AI_DEAL_INSIGHTS.length} actionable insights detected</motion.p>
            </div>
          </div>
          <button
            onClick={() => setShowAiPanel(false)}
            className="drawer-close-btn cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin relative">
          <AnimatePresence mode="wait">
            {aiRefreshing ? (
              <motion.div
                key="refreshing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center py-16 gap-5"
              >
                {isRefreshAction ? (
                  /* ── Refresh Analysis animation: bar chart wave + green theme ── */
                  <>
                    {/* Animated bar chart */}
                    <div className="relative flex items-end gap-1.5 h-16">
                      {[0.4, 0.7, 0.55, 1, 0.65, 0.85, 0.5, 0.75, 0.9, 0.6].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-3 rounded-t-sm"
                          style={{ background: `linear-gradient(180deg, #10B981, #059669)`, height: `${h * 56}px` }}
                          animate={{ scaleY: [h, h * 0.4 + 0.3, h * 1.1, h], opacity: [0.7, 1, 0.8, 0.7] }}
                          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                        />
                      ))}
                      {/* Scan line */}
                      <motion.div
                        className="absolute inset-y-0 w-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.5)', top: 0, bottom: 0 }}
                        animate={{ left: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>

                    <div className="text-center">
                      <motion.p
                        className="text-sm font-semibold text-[var(--fg)]"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        Refreshing analysis...
                      </motion.p>
                      <motion.p
                        className="text-[11px] text-[var(--fg-muted)] mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                      >
                        Syncing with latest market signals
                      </motion.p>
                    </div>

                    {/* Green progress bar */}
                    <motion.div
                      className="w-48 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7)' }}
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                      />
                    </motion.div>

                    {/* Step checklist */}
                    <div className="flex flex-col gap-2 w-44">
                      {[['Fetching new data', 0.3], ['Recalculating scores', 0.8], ['Updating insights', 1.4]].map(([label, delay], i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: delay as number, duration: 0.3 }}
                        >
                          <motion.div
                            className="h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.3)' }}
                            animate={{ borderColor: ['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.8)', 'rgba(16,185,129,0.3)'] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                          >
                            <motion.div className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
                              animate={{ scale: [0.6, 1, 0.6] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                            />
                          </motion.div>
                          <span className="text-[11px] text-[var(--fg-muted)]">{label as string}</span>
                        </motion.div>
                      ))}
                    </div>
                  </>
                ) : (
                  /* ── AI Analyze animation: orbiting spinner + blue theme ── */
                  <>
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
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <Brain className="h-6 w-6 text-[#8B7355]" />
                        </motion.div>
                      </div>
                      {[0, 1, 2, 3].map(i => (
                        <motion.div
                          key={i}
                          className="absolute h-1.5 w-1.5 rounded-full bg-[#8B7355]"
                          style={{ top: '50%', left: '50%' }}
                          animate={{
                            x: [0, Math.cos((i * Math.PI) / 2) * 36, 0],
                            y: [0, Math.sin((i * Math.PI) / 2) * 36, 0],
                            opacity: [0, 0.7, 0],
                            scale: [0, 1, 0],
                          }}
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

                    <motion.div className="w-48 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden mt-1"
                      initial={{ opacity: 0, scaleX: 0.8 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.2 }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #6F5C46, #A89478, #A89478)' }}
                        initial={{ width: '0%' }} animate={{ width: '100%' }}
                        transition={{ duration: 2.3, ease: [0.25, 0.46, 0.45, 0.94] }} />
                    </motion.div>

                    <div className="flex items-center gap-2.5 mt-1">
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
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="insights"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="space-y-4"
              >
                {AI_DEAL_INSIGHTS.map((insight, idx) => {
                  const InsIcon = INSIGHT_ICONS[insight.category] || Brain;
                  return (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: idx * 0.1, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-5 hover:shadow-lg hover:border-[rgba(139,115,85,0.2)] transition-all duration-300 group relative overflow-hidden"
                      style={{ borderLeft: '3px solid #8B7355' }}
                    >
                      {/* Subtle shimmer on entry */}
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(139,115,85,0.04) 50%, transparent 60%)' }}
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ delay: 0.5 + idx * 0.1, duration: 0.8, ease: 'easeOut' }}
                      />
                      <div className="flex items-start gap-3 relative">
                        <motion.div
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: idx * 0.1 + 0.15, duration: 0.35, type: 'spring', stiffness: 300 }}
                          className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${insight.impactColor}10` }}
                        >
                          <InsIcon className="h-4.5 w-4.5" style={{ color: insight.impactColor }} />
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-[var(--fg)]">{insight.title}</p>
                          </div>
                          <p className="text-xs text-[var(--fg-secondary)] leading-relaxed">{insight.description}</p>
                          <p className="text-[11px] text-[var(--fg-muted)] mt-2">Related: {insight.asset}</p>

                          {/* Animated confidence bar */}
                          <div className="flex items-center gap-2 mt-3">
                            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: `${insight.impactColor}50` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${insight.confidence}%` }}
                                transition={{ delay: idx * 0.1 + 0.3, duration: 0.6, ease: 'easeOut' }}
                              />
                            </div>
                            <motion.span
                              className="text-[10px] font-semibold text-[var(--fg-muted)] tabular-nums"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.1 + 0.5 }}
                            >{insight.confidence}%</motion.span>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ color: insight.impactColor, backgroundColor: `${insight.impactColor}10`, border: `1px solid ${insight.impactColor}20` }}>
                              {insight.impact}
                            </span>
                            <Button size="sm" variant="outline" onClick={() => {
                              const t = EXTENDED_TRANSACTIONS.find(tx => tx.propertyTitle === insight.asset);
                              if (t) { setShowAiPanel(false); setSelectedTxn(t); }
                            }} className="text-xs">
                              {insight.cta} <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <DrawerFooter>
          <Button variant="outline" className="flex-1" onClick={() => setShowAiPanel(false)}>
            Close
          </Button>
          <Button className="flex-1" disabled={aiRefreshing} onClick={() => { setIsRefreshAction(true); setAiRefreshing(true); setTimeout(() => setAiRefreshing(false), 2800); }}>
            {aiRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} {aiRefreshing ? 'Updating...' : 'Refresh Analysis'}
          </Button>
        </DrawerFooter>
      </AppDrawer>
    </PageContainer>
  );
}
