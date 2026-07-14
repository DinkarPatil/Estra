'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, Clock, Download, FileText,
  Search, X, CheckCircle2, Calendar, Zap, ArrowUp,
  AlertCircle, ChevronRight, Receipt, Activity,
  Brain, AlertTriangle, Building2, Plus, Shield,
  MoreHorizontal, Check, Wallet, CreditCard, ChevronDown,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip,
} from 'recharts';

// ─── Types ────────────────────────────────────────────────────────────────────
type CommStatus  = 'paid' | 'pending' | 'processing' | 'failed';
type PaymentRisk = 'low' | 'medium' | 'high';

interface CommRow {
  id: string;
  property: string;
  client: string;
  clientInitials: string;
  clientColor: string;
  dealValue: number;
  currency: string;
  rate: number;
  earned: number;
  earnedUSD: number;
  status: CommStatus;
  payoutDate: string | null;
  invoiceId: string;
  location: string;
  closedDate: string;
  paymentRisk: PaymentRisk;
  aiPayout: string;
  trendPoints: number[];
  isHighValue: boolean;
  aiNote: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const TREND_DATA = [
  { month: 'Nov', amount: 52000 },
  { month: 'Dec', amount: 45200 },
  { month: 'Jan', amount: 38400 },
  { month: 'Feb', amount: 49800 },
  { month: 'Mar', amount: 43600 },
  { month: 'Apr', amount: 45200 },
];

const KPI_TRENDS = {
  earned:   [38, 49, 44, 52, 44, 46],
  pending:  [12,  8, 15, 22, 18, 22],
  rate:     [1.8, 1.85, 1.9, 1.88, 1.87, 1.88],
  next:     [30, 45, 38, 62, 48, 63],
};

const COMM_ROWS: CommRow[] = [
  {
    id: 'inv-001', property: 'Palm Jumeirah Villa', client: 'Khalid Al-Rashid',
    clientInitials: 'KA', clientColor: '#f59e0b',
    dealValue: 15000000, currency: 'AED', rate: 2,
    earned: 300000, earnedUSD: 81719,
    status: 'paid', payoutDate: '2026-03-15',
    invoiceId: 'INV-2026-001', location: 'Dubai, UAE', closedDate: '2026-03-10',
    paymentRisk: 'low', aiPayout: 'Paid Mar 15',
    trendPoints: [3, 5, 4, 7, 6, 8], isHighValue: false,
    aiNote: 'Payment received on schedule — excellent payer',
  },
  {
    id: 'inv-002', property: 'Marina Bay Penthouse', client: 'Arjun Mehta',
    clientInitials: 'AM', clientColor: '#8B7355',
    dealValue: 4800000, currency: 'USD', rate: 2,
    earned: 96000, earnedUSD: 96000,
    status: 'paid', payoutDate: '2026-03-28',
    invoiceId: 'INV-2026-002', location: 'Singapore', closedDate: '2026-03-20',
    paymentRisk: 'low', aiPayout: 'Paid Mar 28',
    trendPoints: [5, 4, 6, 5, 7, 8], isHighValue: false,
    aiNote: 'Client has excellent payment track record',
  },
  {
    id: 'inv-003', property: 'Monaco Penthouse', client: 'Pierre Dupont',
    clientInitials: 'PD', clientColor: '#6366f1',
    dealValue: 12000000, currency: 'EUR', rate: 1.5,
    earned: 180000, earnedUSD: 196752,
    status: 'paid', payoutDate: '2026-01-15',
    invoiceId: 'INV-2026-003', location: 'Monaco', closedDate: '2026-01-08',
    paymentRisk: 'low', aiPayout: 'Paid Jan 15',
    trendPoints: [8, 7, 9, 8, 9, 10], isHighValue: true,
    aiNote: 'Highest single commission this quarter — exceptional deal',
  },
  {
    id: 'inv-004', property: 'Lake Geneva Chalet', client: 'Hans Mueller',
    clientInitials: 'HM', clientColor: '#10b981',
    dealValue: 8900000, currency: 'CHF', rate: 1.5,
    earned: 133500, earnedUSD: 152300,
    status: 'paid', payoutDate: '2026-02-10',
    invoiceId: 'INV-2026-004', location: 'Geneva, Switzerland', closedDate: '2026-02-01',
    paymentRisk: 'low', aiPayout: 'Paid Feb 10',
    trendPoints: [6, 7, 6, 8, 7, 9], isHighValue: true,
    aiNote: 'Premium chalet sale — recurring client relationship',
  },
  {
    id: 'inv-005', property: 'Canary Wharf Office', client: 'Sofia Andersson',
    clientInitials: 'SA', clientColor: '#ec4899',
    dealValue: 3500000, currency: 'GBP', rate: 2,
    earned: 70000, earnedUSD: 88481,
    status: 'pending', payoutDate: null,
    invoiceId: 'INV-2026-005', location: 'London, UK', closedDate: '2026-04-05',
    paymentRisk: 'medium', aiPayout: 'May 5, 2026 (est.)',
    trendPoints: [3, 4, 3, 5, 4, 4], isHighValue: false,
    aiNote: 'Follow up recommended — 25 days pending, risk of delay',
  },
  {
    id: 'inv-006', property: 'Mayfair Townhouse', client: 'Emma Fitzgerald',
    clientInitials: 'EF', clientColor: '#6F5C46',
    dealValue: 5200000, currency: 'GBP', rate: 2,
    earned: 104000, earnedUSD: 131481,
    status: 'pending', payoutDate: null,
    invoiceId: 'INV-2026-006', location: 'London, UK', closedDate: '2026-04-12',
    paymentRisk: 'high', aiPayout: 'May 12, 2026 (est.)',
    trendPoints: [2, 3, 4, 3, 5, 4], isHighValue: true,
    aiNote: 'High-value deal — payment delay risk detected, escalate',
  },
  {
    id: 'inv-007', property: 'Bandra Sea View Flat', client: 'Priya Sharma',
    clientInitials: 'PS', clientColor: '#f97316',
    dealValue: 35000000, currency: 'INR', rate: 2,
    earned: 700000, earnedUSD: 8400,
    status: 'processing', payoutDate: null,
    invoiceId: 'INV-2026-007', location: 'Mumbai, India', closedDate: '2026-04-18',
    paymentRisk: 'low', aiPayout: 'Apr 28, 2026 (est.)',
    trendPoints: [4, 3, 5, 4, 6, 5], isHighValue: false,
    aiNote: 'Wire transfer in progress — expected within 3 business days',
  },
  {
    id: 'inv-008', property: 'Skyline Residences', client: 'Takeshi Yamada',
    clientInitials: 'TY', clientColor: '#8B7355',
    dealValue: 3600000, currency: 'AED', rate: 2,
    earned: 72000, earnedUSD: 19600,
    status: 'processing', payoutDate: null,
    invoiceId: 'INV-2026-008', location: 'Dubai, UAE', closedDate: '2026-04-20',
    paymentRisk: 'low', aiPayout: 'Apr 30, 2026 (est.)',
    trendPoints: [3, 4, 4, 5, 4, 6], isHighValue: false,
    aiNote: 'Standard processing pipeline — on track for Apr 30',
  },
];

const TOP_CLIENTS_DATA = [
  { name: 'Pierre Dupont',    initials: 'PD', color: '#6366f1', amount: 196752, deals: 1, pct: 100 },
  { name: 'Hans Mueller',     initials: 'HM', color: '#10b981', amount: 152300, deals: 1, pct: 77  },
  { name: 'Emma Fitzgerald',  initials: 'EF', color: '#6F5C46', amount: 131481, deals: 1, pct: 67  },
  { name: 'Arjun Mehta',      initials: 'AM', color: '#8B7355', amount: 96000,  deals: 2, pct: 49  },
];

const RECENT_PAYMENTS = [
  { property: 'Palm Jumeirah Villa',   amount: '$81.7K',  date: '2 days ago',  color: '#f59e0b' },
  { property: 'Marina Bay Penthouse',  amount: '$96K',    date: '5 days ago',  color: '#8B7355' },
  { property: 'Monaco Penthouse',      amount: '$196.7K', date: '15 days ago', color: '#6366f1' },
  { property: 'Lake Geneva Chalet',    amount: '$152.3K', date: '42 days ago', color: '#10b981' },
];

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<CommStatus, { dot: string; badge: string; label: string; pulse: boolean }> = {
  paid:       { dot: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Paid',       pulse: false },
  pending:    { dot: '#f59e0b', badge: 'bg-amber-50 text-amber-700 border border-amber-200',       label: 'Pending',    pulse: true  },
  processing: { dot: '#3b82f6', badge: 'bg-blue-50 text-blue-700 border border-blue-200',          label: 'Processing', pulse: true  },
  failed:     { dot: '#ef4444', badge: 'bg-red-50 text-red-600 border border-red-200',              label: 'Failed',     pulse: true  },
};

const RISK_CFG: Record<PaymentRisk, { badge: string; label: string; icon: typeof Shield }> = {
  low:    { badge: 'bg-emerald-50 text-emerald-600 border border-emerald-100', label: 'Low Risk',  icon: Shield        },
  medium: { badge: 'bg-amber-50 text-amber-600 border border-amber-100',       label: 'Med Risk',  icon: AlertTriangle },
  high:   { badge: 'bg-red-50 text-red-600 border border-red-100',             label: 'High Risk', icon: AlertCircle   },
};

// ─── Utilities ────────────────────────────────────────────────────────────────
function fmtUSD(v: number) {
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)} Cr`;
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)} L`;
  if (v >= 1_000)       return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function MiniSparkline({ data, color, id }: { data: number[]; color: string; id: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#${id})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Commission Trend Bars ─────────────────────────────────────────────────────
function CommTrend({ points }: { points: number[] }) {
  const max = Math.max(...points);
  return (
    <div className="flex items-end gap-0.5 h-5 w-12">
      {points.map((v, i) => (
        <motion.div key={i}
          className="flex-1 rounded-sm"
          style={{ background: i === points.length - 1 ? '#8B7355' : '#e5e7eb' }}
          initial={{ scaleY: 0, originY: 1 }}
          animate={{ scaleY: 1, height: `${(v / max) * 100}%` }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
        />
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function CommStatusBadge({ status }: { status: CommStatus }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.badge}`}>
      {cfg.pulse ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: cfg.dot }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: cfg.dot }} />
        </span>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      )}
      {cfg.label}
    </span>
  );
}

// ─── Payment Risk Badge ───────────────────────────────────────────────────────
function PaymentRiskBadge({ risk }: { risk: PaymentRisk }) {
  const cfg = RISK_CFG[risk];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.badge}`}>
      <Icon style={{ width: 10, height: 10 }} /> {cfg.label}
    </span>
  );
}

// ─── Premium Select Dropdown ──────────────────────────────────────────────────
type SelectOption = {
  value: string;
  label: string;
  dot?: string;
  icon?: typeof Shield;
};

function PremiumSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find((o) => o.value === value) ?? options[0];
  const SelectedIcon = selected.icon;

  return (
    <div ref={ref} className="relative">
      <motion.button
        onClick={() => setOpen((p) => !p)}
        whileHover={{ borderColor: '#d1d5db' }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.12 }}
        className="h-8 pl-3 pr-7 rounded-full border border-[#E5E7EB] bg-white text-xs flex items-center gap-1.5 relative whitespace-nowrap select-none"
        style={{
          boxShadow: open
            ? '0 0 0 3px rgba(120,113,108,0.08), 0 1px 3px rgba(0,0,0,0.06)'
            : '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {selected.dot && (
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${selected.dot}`} />
        )}
        {SelectedIcon && (
          <SelectedIcon style={{ width: 11, height: 11 }} className="text-stone-400 flex-shrink-0" />
        )}
        <span className="font-medium text-stone-700">
          {placeholder && value === options[0].value ? placeholder : selected.label}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none"
        >
          <ChevronDown className="w-3 h-3 text-stone-400" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full mt-2 min-w-[168px] bg-white rounded-2xl border border-[#E5E7EB] py-1.5 z-50 overflow-hidden"
            style={{ boxShadow: '0 12px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)' }}
          >
            {options.map((opt, i) => {
              const OptIcon = opt.icon;
              const isActive = value === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.028)' }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition-colors ${
                    isActive ? 'text-stone-800 font-semibold' : 'text-stone-500'
                  }`}
                >
                  {opt.dot && (
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${opt.dot}`} />
                  )}
                  {OptIcon && (
                    <OptIcon
                      style={{ width: 11, height: 11 }}
                      className={isActive ? 'text-stone-600' : 'text-stone-350'}
                    />
                  )}
                  <span>{opt.label}</span>
                  {isActive && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="ml-auto"
                    >
                      <Check className="w-3 h-3 text-stone-400" />
                    </motion.span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ value, prefix = '₹', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const dur = 900;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay(Math.floor((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  const fmt = display >= 1_00_00_000 ? `${(display / 1_00_00_000).toFixed(1)}Cr`
            : display >= 1_00_000    ? `${(display / 1_00_000).toFixed(1)}L`
            : display >= 1_000       ? `${(display / 1_000).toFixed(1)}K`
            : display.toLocaleString('en-IN');
  return <>{prefix}{fmt}{suffix}</>;
}

// ─── Generate Invoice Modal ────────────────────────────────────────────────────
function GenerateInvoiceModal({
  open, onClose, onGenerate,
}: { open: boolean; onClose: () => void; onGenerate: () => void }) {
  const [form, setForm] = useState({
    property: '', client: '', amount: '', currency: 'USD', date: '', notes: '',
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/25 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto border border-[#E5E7EB] overflow-hidden"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-stone-500" />
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">Generate Invoice</h2>
                  <p className="text-xs text-stone-400 mt-0.5">Create a commission invoice for this deal</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors">
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                {[
                  { key: 'property', label: 'Property Name',  placeholder: 'Palm Jumeirah Villa', type: 'text' },
                  { key: 'client',   label: 'Client Name',    placeholder: 'Khalid Al-Rashid',    type: 'text' },
                  { key: 'amount',   label: 'Commission (USD)', placeholder: '81,719',             type: 'number' },
                  { key: 'date',     label: 'Issue Date',      placeholder: '',                    type: 'date'   },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-stone-600 mb-1">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Notes</label>
                  <textarea placeholder="Additional notes…" rows={2}
                    value={form.notes} onChange={(e) => set('notes', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 px-5 pb-5">
                <button onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors">
                  Cancel
                </button>
                <motion.button
                  onClick={() => { onGenerate(); onClose(); }}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-stone-700 to-stone-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5"
                  whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.97 }}
                >
                  <FileText className="w-4 h-4" /> Generate Invoice
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Invoice Drawer ────────────────────────────────────────────────────────────
function InvoiceDrawer({ row, onClose, onMarkPaid, onToast }: {
  row: CommRow | null;
  onClose: () => void;
  onMarkPaid: (id: string) => void;
  onToast: (msg: string) => void;
}) {
  const [tab, setTab] = useState<'overview' | 'history' | 'notes'>('overview');
  if (!row) return null;
  const cfg = STATUS_CFG[row.status];
  const tax = Math.round(row.earnedUSD * 0.15);
  const net = row.earnedUSD - tax;

  return (
    <AnimatePresence>
      {row && (
        <>
          <motion.div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            initial={{ x: 430 }} animate={{ x: 0 }} exit={{ x: 430 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            {/* accent bar */}
            <div className="h-0.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-stone-500 flex-shrink-0" />

            {/* Light header (replaces dark stone-900) */}
            <div className="bg-gradient-to-br from-stone-50 to-white p-5 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] text-stone-400 font-mono mb-1 tracking-wider">{row.invoiceId}</p>
                  <h2 className="text-base font-bold text-stone-900 leading-tight">{row.property}</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ background: row.clientColor }}>{row.clientInitials}</div>
                    <span className="text-xs text-stone-500">{row.client}</span>
                    <span className="text-stone-200">·</span>
                    <span className="text-xs text-stone-400">{row.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CommStatusBadge status={row.status} />
                  <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors">
                    <X className="w-4 h-4 text-stone-500" />
                  </button>
                </div>
              </div>

              {/* High-value alert */}
              {row.isHighValue && (
                <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-amber-700 font-medium">High-value commission — priority monitoring active</span>
                </div>
              )}

              {/* Financials row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Gross',      value: `₹${row.earnedUSD.toLocaleString('en-IN')}` },
                  { label: 'Tax (15%)',  value: `₹${tax.toLocaleString('en-IN')}` },
                  { label: 'Net Payout', value: `₹${net.toLocaleString('en-IN')}` },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-2.5 text-center shadow-sm">
                    <div className="text-sm font-bold text-stone-900 leading-tight">{s.value}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-100 px-4 flex-shrink-0">
              {(['overview', 'history', 'notes'] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`py-3 px-4 text-xs font-semibold capitalize border-b-2 transition-colors ${
                    tab === t
                      ? 'border-stone-600 text-stone-800'
                      : 'border-transparent text-stone-400 hover:text-stone-600'
                  }`}>
                  {t === 'history' ? 'Payment History' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {tab === 'overview' && (
                <>
                  {/* Commission breakdown */}
                  <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-4 space-y-2">
                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Commission Breakdown</h3>
                    {[
                      { label: 'Deal Value',        value: `₹${row.dealValue.toLocaleString('en-IN')}` },
                      { label: 'Rate',              value: `${row.rate}%` },
                      { label: 'Gross Commission',  value: `₹${row.earned.toLocaleString('en-IN')}` },
                      { label: 'INR Equivalent',    value: `₹${row.earnedUSD.toLocaleString('en-IN')}` },
                      { label: 'Closed Date',       value: fmtDate(row.closedDate) },
                      { label: 'Payout Date',       value: row.payoutDate ? fmtDate(row.payoutDate) : row.aiPayout },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-stone-400 text-xs">{label}</span>
                        <span className="font-semibold text-stone-800 text-xs">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI insight */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Brain style={{ width: 12, height: 12, color: '#6366f1' }} /> AI Intelligence
                    </h3>
                    <div className="flex items-start gap-2">
                      <Zap className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700">{row.aiNote}</p>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="text-[10px] text-stone-500">Payment Risk:</div>
                      <PaymentRiskBadge risk={row.paymentRisk} />
                    </div>
                  </div>

                  {/* Property & location */}
                  <div className="rounded-xl border border-stone-100 p-4 space-y-2">
                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Deal Details</h3>
                    {[
                      { icon: Building2, label: row.property },
                      { icon: Receipt,   label: row.invoiceId },
                      { icon: Calendar,  label: `Closed ${fmtDate(row.closedDate)}` },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-3 h-3 text-stone-400" />
                        </div>
                        <span className="text-xs text-stone-600">{label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === 'history' && (
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Payment Timeline</h3>
                  {[
                    { icon: FileText,    text: 'Invoice generated',        time: fmtDate(row.closedDate), color: '#8B7355' },
                    { icon: CreditCard,  text: 'Payment initiated',        time: '+3 days',               color: '#3b82f6' },
                    { icon: CheckCircle2, text: row.status === 'paid' ? 'Payment confirmed' : 'Awaiting confirmation',
                      time: row.payoutDate ? fmtDate(row.payoutDate) : 'Pending', color: row.status === 'paid' ? '#10b981' : '#f59e0b' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 relative">
                      {i < 2 && <div className="absolute left-3 top-6 bottom-0 w-px bg-stone-100" />}
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                        style={{ background: item.color + '18' }}>
                        <item.icon className="w-3 h-3" style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-stone-700">{item.text}</p>
                        <p className="text-[10px] text-stone-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'notes' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-4">
                    <h3 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Deal Notes</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Commission for {row.property} — {row.client}. Deal closed on {fmtDate(row.closedDate)}
                      at a {row.rate}% rate on {row.dealValue.toLocaleString()} {row.currency}.
                    </p>
                  </div>
                  <textarea
                    placeholder="Add a note…"
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 resize-none"
                  />
                  <button
                    onClick={() => onToast('Note saved')}
                    className="w-full h-8 rounded-xl bg-stone-100 text-stone-600 text-xs font-medium hover:bg-stone-200 transition-colors"
                  >
                    Save Note
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-100 p-4 flex gap-2 flex-shrink-0">
              {row.status !== 'paid' && (
                <motion.button
                  className="flex-1 h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-sm font-medium flex items-center justify-center gap-1.5"
                  whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { onMarkPaid(row.id); onClose(); onToast(`${row.property} marked as paid`); }}
                >
                  <Check className="w-3.5 h-3.5" /> Mark Paid
                </motion.button>
              )}
              <motion.button
                className="flex-1 h-9 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium flex items-center justify-center gap-1.5"
                whileHover={{ backgroundColor: '#f9fafb' }} whileTap={{ scale: 0.97 }}
                onClick={() => onToast(`Downloading invoice ${row.invoiceId}…`)}
              >
                <Download className="w-3.5 h-3.5" /> Download
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommissionsPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | CommStatus>('all');
  const [riskFilter,   setRiskFilter]   = useState('all');
  const [sortBy,       setSortBy]       = useState('closedDate');
  const [search,       setSearch]       = useState('');
  const [selectedRow,  setSelectedRow]  = useState<CommRow | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [toast,        setToast]        = useState<string | null>(null);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [rows,         setRows]         = useState<CommRow[]>(COMM_ROWS);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleMarkPaid = (id: string) => {
    setRows((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'paid' as CommStatus, payoutDate: '2026-04-30' } : r)
    );
  };

  const filtered = useMemo(() => {
    let list = [...rows];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.property.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    if (riskFilter !== 'all')   list = list.filter((r) => r.paymentRisk === riskFilter);
    list.sort((a, b) => {
      if (sortBy === 'earned')   return b.earnedUSD - a.earnedUSD;
      if (sortBy === 'risk')     return ['high', 'medium', 'low'].indexOf(a.paymentRisk) - ['high', 'medium', 'low'].indexOf(b.paymentRisk);
      if (sortBy === 'status')   return a.status.localeCompare(b.status);
      return b.closedDate.localeCompare(a.closedDate);
    });
    return list;
  }, [rows, search, statusFilter, riskFilter, sortBy]);

  const kpis = useMemo(() => {
    const earned   = rows.reduce((s, r) => s + r.earnedUSD, 0);
    const pending  = rows.filter((r) => r.status === 'pending').reduce((s, r) => s + r.earnedUSD, 0);
    const processing = rows.filter((r) => r.status === 'processing').reduce((s, r) => s + r.earnedUSD, 0);
    const avgRate  = rows.reduce((s, r) => s + r.rate, 0) / rows.length;
    const highRisk = rows.filter((r) => r.paymentRisk === 'high' && r.status !== 'paid').length;
    return { earned, pending, processing, unpaid: pending + processing, avgRate: Math.round(avgRate * 100) / 100, highRisk };
  }, [rows]);

  const STATUS_PILLS = [
    { key: 'all',        label: 'All',        count: rows.length },
    { key: 'paid',       label: 'Paid',       count: rows.filter((r) => r.status === 'paid').length },
    { key: 'pending',    label: 'Pending',    count: rows.filter((r) => r.status === 'pending').length },
    { key: 'processing', label: 'Processing', count: rows.filter((r) => r.status === 'processing').length },
    { key: 'failed',     label: 'Failed',     count: rows.filter((r) => r.status === 'failed').length },
  ];

  const toggleSelect = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6">

      {/* ── Toast ─────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-6 right-6 z-[100] bg-white border border-stone-200 text-stone-800 text-sm px-4 py-3 rounded-2xl flex items-center gap-2.5"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)' }}
            initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <InvoiceDrawer
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onMarkPaid={handleMarkPaid}
        onToast={showToast}
      />

      <GenerateInvoiceModal
        open={invoiceModal}
        onClose={() => setInvoiceModal(false)}
        onGenerate={() => showToast('Invoice generated successfully')}
      />

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="bkr-hero mb-7">
        <div className="bkr-hero-inner flex-wrap !items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <Wallet className="h-4 w-4 text-[#8B6F47]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">Commissions</h1>
              <span className="text-xs bg-[var(--bg-secondary)] text-[var(--fg-muted)] px-2.5 py-1 rounded-full font-medium border border-[var(--border)]">
                {rows.length} deals
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#16A34A] bg-[#F0FDF4] border border-[#86EFAC] px-2.5 py-[3px] rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                Soon
              </span>
            </div>
            <p className="text-sm text-[var(--fg-muted)]">AI-powered earnings intelligence &amp; payout tracking</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { icon: Download, label: 'Export', fn: () => showToast('Exporting commissions…') },
            ].map(({ icon: Icon, label, fn }) => (
              <motion.button key={label} onClick={fn}
                className="h-9 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--fg-secondary)] text-sm font-medium flex items-center gap-1.5"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
                whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.07)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </motion.button>
            ))}
            <motion.button
              onClick={() => setInvoiceModal(true)}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#6F5443] to-[#8B6F47] text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              whileHover={{ y: -1, opacity: 0.92 }} whileTap={{ scale: 0.97 }}
            >
              <Plus className="w-4 h-4" /> Generate Invoice
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Earned (YTD)', value: kpis.earned,
            icon: DollarSign, iconColor: '#8B7355', iconBg: 'rgba(139,115,85,0.08)',
            change: '+22%', positive: true, changeNote: 'vs last year',
            trend: KPI_TRENDS.earned, sparkId: 'cs0', sparkColor: '#8B7355',
            insight: '+22% growth driven by high-value deals',
          },
          {
            label: 'Pending Payouts', value: kpis.unpaid,
            icon: Clock, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.08)',
            change: kpis.highRisk > 0 ? `${kpis.highRisk} at risk` : 'On track', positive: kpis.highRisk === 0, changeNote: 'payout pipeline',
            trend: KPI_TRENDS.pending, sparkId: 'cs1', sparkColor: '#f59e0b',
            insight: kpis.highRisk > 0 ? 'Delayed payout risk detected — act now' : 'All pending deals on track',
          },
          {
            label: 'Avg Commission Rate', value: 0, display: `${kpis.avgRate}%`,
            icon: TrendingUp, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.08)',
            change: '+0.2%', positive: true, changeNote: 'vs last quarter',
            trend: KPI_TRENDS.rate, sparkId: 'cs2', sparkColor: '#10b981',
            insight: 'Negotiated rate above market average',
          },
          {
            label: 'Next Expected Payout', value: 0, display: '$28K',
            icon: Wallet, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.08)',
            change: 'Apr 30', positive: true, changeNote: 'estimated date',
            trend: KPI_TRENDS.next, sparkId: 'cs3', sparkColor: '#6366f1',
            insight: '2 payouts arriving before May 1st',
          },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            className="bg-white rounded-2xl border border-[#E5E7EB] p-4 cursor-default overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -3, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.09), 0 2px 8px -2px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: kpi.iconBg }}>
                  <kpi.icon style={{ color: kpi.iconColor, width: 18, height: 18 }} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider leading-tight">{kpi.label}</p>
                  <p className="text-xl font-bold text-stone-900 leading-tight mt-0.5">
                    {kpi.value > 0 ? <Counter value={kpi.value} /> : kpi.display}
                  </p>
                </div>
              </div>
              <div className="w-20 flex-shrink-0 opacity-75">
                <MiniSparkline data={kpi.trend} color={kpi.sparkColor} id={kpi.sparkId} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-2.5">
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                kpi.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
              }`}>
                {kpi.positive && <ArrowUp className="w-2.5 h-2.5" />}{kpi.change}
              </span>
              <span className="text-[10px] text-stone-400">{kpi.changeNote}</span>
            </div>

            <div className="flex items-center gap-1.5 bg-stone-50 rounded-xl px-2.5 py-1.5 border border-stone-100">
              <Zap style={{ color: kpi.sparkColor, width: 11, height: 11, flexShrink: 0 }} />
              <span className="text-[10px] text-stone-500 leading-tight truncate">{kpi.insight}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Status Filter Pills ─────────────────────────────── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {STATUS_PILLS.map((pill) => (
          <motion.button
            key={pill.key}
            onClick={() => setStatusFilter(pill.key as 'all' | CommStatus)}
            className={`h-8 px-3.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === pill.key
                ? 'bg-stone-800 text-white shadow-sm'
                : 'bg-white border border-[#E5E7EB] text-stone-600 hover:border-stone-300 hover:bg-stone-50'
            }`}
            whileTap={{ scale: 0.96 }}
          >
            {pill.label}
            {pill.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                statusFilter === pill.key ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-400'
              }`}>{pill.count}</span>
            )}
          </motion.button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <PremiumSelect
            value={riskFilter}
            onChange={setRiskFilter}
            options={[
              { value: 'all',    label: 'All Risk' },
              { value: 'high',   label: 'High Risk',   dot: 'bg-red-400' },
              { value: 'medium', label: 'Medium Risk',  dot: 'bg-amber-400' },
              { value: 'low',    label: 'Low Risk',     dot: 'bg-emerald-400' },
            ]}
          />
          <PremiumSelect
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'closedDate', label: 'Date (newest)',   icon: Calendar },
              { value: 'earned',     label: 'Highest Earned',  icon: TrendingUp },
              { value: 'risk',       label: 'Payment Risk',    icon: Shield },
              { value: 'status',     label: 'Status',          icon: Activity },
            ]}
          />
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* ── Commission Grid ── */}
        <div className="flex-1 min-w-0">

          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] mb-3 px-4 py-3"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search property, client, location…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                />
              </div>
              {search && (
                <motion.button
                  onClick={() => setSearch('')}
                  className="h-8 px-3 rounded-xl border border-stone-200 text-stone-500 text-xs flex items-center gap-1"
                  whileTap={{ scale: 0.96 }}
                >
                  <X className="w-3 h-3" /> Clear
                </motion.button>
              )}
            </div>
          </div>

          {/* Count + bulk actions */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs text-stone-400">
              {filtered.length} commission{filtered.length !== 1 ? 's' : ''}
              {selectedRows.size > 0 && ` · ${selectedRows.size} selected`}
            </span>
            <AnimatePresence>
              {selectedRows.size > 0 && (
                <motion.div className="flex items-center gap-2"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <button
                    onClick={() => {
                      const paidCount = Array.from(selectedRows).filter((id) =>
                        rows.find((r) => r.id === id)?.status !== 'paid'
                      ).length;
                      Array.from(selectedRows).forEach((id) => handleMarkPaid(id));
                      showToast(`${paidCount} commission${paidCount !== 1 ? 's' : ''} marked paid`);
                      setSelectedRows(new Set());
                    }}
                    className="h-7 px-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors flex items-center gap-1 border border-emerald-200"
                  >
                    <Check className="w-3 h-3" /> Mark Paid
                  </button>
                  <button
                    onClick={() => showToast(`Downloading ${selectedRows.size} invoice${selectedRows.size !== 1 ? 's' : ''}…`)}
                    className="h-7 px-3 rounded-lg bg-stone-100 text-stone-600 text-xs font-medium hover:bg-stone-200 transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                  <button onClick={() => setSelectedRows(new Set())}
                    className="h-7 px-3 rounded-lg border border-stone-200 text-stone-500 text-xs hover:bg-stone-50">
                    Deselect
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Table */}
          <motion.div
            className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            {/* Header */}
            <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1.2fr_auto] gap-3 px-5 py-3 border-b border-stone-100 bg-stone-50/60">
              <div className="flex items-center gap-2.5">
                <input type="checkbox"
                  checked={selectedRows.size === filtered.length && filtered.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedRows(new Set(filtered.map((r) => r.id)));
                    else setSelectedRows(new Set());
                  }}
                  className="w-3.5 h-3.5 rounded border-stone-300 flex-shrink-0 cursor-pointer"
                />
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Commission</span>
              </div>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest self-center">Status</span>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest self-center">Earned</span>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest self-center">Trend</span>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest self-center">Risk</span>
              <div className="flex items-center gap-1 self-center">
                <Brain style={{ width: 11, height: 11, color: '#c4b5a4' }} />
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Est. Payout</span>
              </div>
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest self-center">Actions</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-stone-400 text-sm">No commissions match your filters</div>
            ) : (
              filtered.map((row, i) => (
                <motion.div
                  key={row.id}
                  className={`grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1.2fr_auto] gap-3 items-center px-5 py-3.5 border-b border-stone-50 cursor-pointer group transition-colors ${
                    selectedRows.has(row.id) ? 'bg-stone-50/80' : 'hover:bg-stone-50/70'
                  }`}
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedRow(row)}
                >
                  {/* Commission cell */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 rounded border-stone-300 flex-shrink-0 cursor-pointer"
                    />
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${row.clientColor}, ${row.clientColor}99)` }}>
                      {row.clientInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-semibold text-stone-800 truncate leading-tight">{row.property}</span>
                        {row.isHighValue && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100 flex-shrink-0">TOP</span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400 truncate">{row.client}</div>
                      <div className="text-[10px] text-stone-300 mt-0.5 flex items-center gap-1">
                        <Building2 style={{ width: 9, height: 9 }} /> {row.location}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div><CommStatusBadge status={row.status} /></div>

                  {/* Earned */}
                  <div>
                    <div className="text-sm font-bold text-stone-900">{fmtUSD(row.earnedUSD)}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{row.rate}% of {row.dealValue >= 1_000_000 ? `${(row.dealValue / 1_000_000).toFixed(1)}M` : `${(row.dealValue / 1000).toFixed(0)}K`} {row.currency}</div>
                  </div>

                  {/* Trend */}
                  <div className="flex items-center">
                    <CommTrend points={row.trendPoints} />
                  </div>

                  {/* Risk */}
                  <div><PaymentRiskBadge risk={row.paymentRisk} /></div>

                  {/* Est. Payout */}
                  <div>
                    <div className="text-xs font-medium text-stone-700 leading-tight">{row.aiPayout}</div>
                    {row.status !== 'paid' && (
                      <div className="text-[10px] text-stone-400 mt-0.5">AI predicted</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {[
                      { icon: FileText, tip: 'View Invoice', fn: () => setSelectedRow(row) },
                      { icon: Download, tip: 'Download',     fn: () => showToast(`Downloading ${row.invoiceId}…`) },
                    ].map(({ icon: Icon, tip, fn }) => (
                      <motion.button key={tip} title={tip}
                        onClick={(e) => { e.stopPropagation(); fn(); }}
                        className="h-7 w-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                        whileTap={{ scale: 0.88 }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </motion.button>
                    ))}
                    {row.status !== 'paid' && (
                      <motion.button title="Mark Paid"
                        onClick={(e) => { e.stopPropagation(); handleMarkPaid(row.id); showToast(`${row.property} marked as paid`); }}
                        className="h-7 w-7 rounded-lg border border-emerald-200 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                        whileTap={{ scale: 0.88 }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* ── Right Sidebar ────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 space-y-4">

          {/* Revenue Trend Chart */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-stone-800">Revenue Trend</h3>
              <span className="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-100 font-medium">6 months</span>
            </div>
            <div className="text-xs text-stone-400 mb-3 flex items-center gap-1.5">
              <span className="text-lg font-bold text-stone-900"><Counter value={274200} /></span>
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold border border-emerald-100">+22% YTD</span>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={TREND_DATA} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8B7355" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B7355" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: '#fff', border: '1px solid #E5E7EB', borderRadius: 10,
                    fontSize: 11, color: '#374151', padding: '4px 10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(v) => [`₹${(Number(v) / 1000).toFixed(0)}K`, 'Earned']}
                  cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="amount" stroke="#8B7355" strokeWidth={2}
                  fill="url(#revGrad)"
                  dot={{ r: 2.5, fill: '#8B7355', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#8B7355', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top Clients by Revenue */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 className="text-sm font-semibold text-stone-800 mb-3">Top Clients</h3>
            <div className="space-y-3">
              {TOP_CLIENTS_DATA.map((c, i) => (
                <motion.button
                  key={c.name}
                  className="w-full text-left hover:bg-stone-50 rounded-xl px-1 py-0.5 transition-colors"
                  onClick={() => { setSearch(c.name.split(' ')[1] || c.name); showToast(`Filtering: ${c.name}`); }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ background: c.color }}>{c.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-stone-700 truncate">{c.name}</span>
                        <span className="text-xs font-bold text-stone-900 ml-2 tabular-nums">{fmtUSD(c.amount)}</span>
                      </div>
                      <span className="text-[10px] text-stone-400">{c.deals} deal{c.deals !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${c.color}, ${c.color}99)` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${c.pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.1 }}
                    />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent Payments — Timeline UI */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-800">Recent Payments</h3>
              <span className="text-[10px] text-stone-400 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 font-semibold">
                All paid
              </span>
            </div>
            <div>
              {RECENT_PAYMENTS.map((p, i) => (
                <div key={i} className="relative flex gap-2.5 pb-3">
                  {i < RECENT_PAYMENTS.length - 1 && (
                    <div className="absolute left-2.5 top-5 bottom-0 w-px bg-stone-100" />
                  )}
                  {/* Timeline dot */}
                  <div className="relative w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 bg-emerald-50">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-stone-700 truncate">{p.property}</span>
                      <span className="text-xs font-bold text-stone-900 flex-shrink-0 tabular-nums">{p.amount}</span>
                    </div>
                    <span className="text-[10px] text-stone-400">{p.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Forecast — FIXED: white card (was dark) */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 relative overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* gradient top accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-stone-400" />
            {/* ultra-subtle bg tint */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 to-white/0 pointer-events-none rounded-2xl" />

            <h3 className="relative text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-stone-400" /> Revenue Forecast
            </h3>

            <div className="relative space-y-3">
              {/* Next month */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-stone-500">Next Month</span>
                  <div className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-emerald-500" />
                    <span className="font-bold text-stone-900">₹52K</span>
                  </div>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                    initial={{ width: 0 }} animate={{ width: '72%' }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>

              {/* Q2 Target */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-stone-500">Q2 Target</span>
                  <span className="font-bold text-stone-900">₹140K / ₹180K</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                    initial={{ width: 0 }} animate={{ width: '78%' }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                  />
                </div>
              </div>

              {/* YTD growth badge */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-800">YTD Growth</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">vs same period last year</p>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-base font-bold text-emerald-700">+22%</span>
                </div>
              </div>

              {/* AI insight */}
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                <Zap className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="text-[10px] text-blue-700 leading-tight">
                  On track to exceed Q2 target — high-value pipeline remains strong
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
