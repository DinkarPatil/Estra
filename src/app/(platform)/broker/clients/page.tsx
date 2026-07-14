'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, DollarSign, TrendingUp, Search, Download, Upload,
  Plus, Mail, Phone, MapPin, Eye, MessageSquare,
  Star, Calendar, X, CheckCircle, LayoutGrid, List,
  Building2, Globe, ChevronRight, Flame, Zap, AlertTriangle,
  Activity, ArrowUp, Brain, MoreHorizontal, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  country: string;
  status: 'Active' | 'Prospect' | 'Past';
  deals: number;
  totalVolume: number;
  currency: string;
  lastContact: string;
  owner: string;
  ownerInitials: string;
  ownerColor: string;
  tag: string;
  starred: boolean;
  avatar: string;
  avatarColor: string;
  joined: string;
  nextFollowUp: string | null;
  dealProbability: number;
  aiScore: number;
  isHotLead: boolean;
  aiPriority: number;
  aiAction: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CLIENTS: Client[] = [
  {
    id: 'c-001', name: 'Arjun Mehta', email: 'arjun@mehta.com', phone: '+91 98200 11223',
    location: 'Mumbai, India', country: 'IN', status: 'Active', deals: 2,
    totalVolume: 54800000, currency: 'INR', lastContact: '2026-04-22',
    owner: 'Sarah K.', ownerInitials: 'SK', ownerColor: '#8B7355',
    tag: 'Investor', starred: true, avatar: 'AM', avatarColor: '#8B7355',
    joined: '2025-03-10', nextFollowUp: '2026-04-30',
    dealProbability: 82, aiScore: 9.1, isHotLead: true, aiPriority: 1,
    aiAction: 'Schedule site visit this week',
  },
  {
    id: 'c-002', name: 'Sofia Andersson', email: 'sofia@ander.se', phone: '+46 70 123 4567',
    location: 'Stockholm, Sweden', country: 'SE', status: 'Active', deals: 1,
    totalVolume: 2000000, currency: 'EUR', lastContact: '2026-04-20',
    owner: 'Mark D.', ownerInitials: 'MD', ownerColor: '#10b981',
    tag: 'Buyer', starred: false, avatar: 'SA', avatarColor: '#ec4899',
    joined: '2025-05-18', nextFollowUp: '2026-04-25',
    dealProbability: 61, aiScore: 7.4, isHotLead: false, aiPriority: 3,
    aiAction: 'Send financing options',
  },
  {
    id: 'c-003', name: 'Khalid Al-Rashid', email: 'khalid@rashid.ae', phone: '+971 50 234 5678',
    location: 'Dubai, UAE', country: 'AE', status: 'Active', deals: 1,
    totalVolume: 20000000, currency: 'AED', lastContact: '2026-04-21',
    owner: 'Sarah K.', ownerInitials: 'SK', ownerColor: '#8B7355',
    tag: 'Investor', starred: true, avatar: 'KA', avatarColor: '#f59e0b',
    joined: '2025-08-02', nextFollowUp: '2026-04-28',
    dealProbability: 74, aiScore: 8.6, isHotLead: true, aiPriority: 2,
    aiAction: 'Offer premium portfolio review',
  },
  {
    id: 'c-004', name: 'Emma Fitzgerald', email: 'emma@fitz.co.uk', phone: '+44 7700 900123',
    location: 'London, UK', country: 'GB', status: 'Prospect', deals: 1,
    totalVolume: 5000000, currency: 'GBP', lastContact: '2026-04-18',
    owner: 'James R.', ownerInitials: 'JR', ownerColor: '#f97316',
    tag: 'Buyer', starred: false, avatar: 'EF', avatarColor: '#6F5C46',
    joined: '2025-11-14', nextFollowUp: '2026-04-30',
    dealProbability: 45, aiScore: 6.2, isHotLead: false, aiPriority: 5,
    aiAction: 'Follow up on property shortlist',
  },
  {
    id: 'c-005', name: 'Takeshi Yamada', email: 'takeshi@yamada.jp', phone: '+81 90 1234 5678',
    location: 'Tokyo, Japan', country: 'JP', status: 'Past', deals: 3,
    totalVolume: 300000000, currency: 'JPY', lastContact: '2026-03-15',
    owner: 'Mark D.', ownerInitials: 'MD', ownerColor: '#10b981',
    tag: 'Developer', starred: false, avatar: 'TY', avatarColor: '#8B7355',
    joined: '2024-06-01', nextFollowUp: null,
    dealProbability: 28, aiScore: 4.1, isHotLead: false, aiPriority: 7,
    aiAction: 'Re-engage with new listings',
  },
  {
    id: 'c-006', name: 'Layla Hassan', email: 'layla@hassan.qa', phone: '+974 3312 3456',
    location: 'Doha, Qatar', country: 'QA', status: 'Active', deals: 2,
    totalVolume: 9500000, currency: 'QAR', lastContact: '2026-04-23',
    owner: 'Sarah K.', ownerInitials: 'SK', ownerColor: '#8B7355',
    tag: 'Investor', starred: true, avatar: 'LH', avatarColor: '#ef4444',
    joined: '2025-09-22', nextFollowUp: '2026-04-25',
    dealProbability: 68, aiScore: 8.0, isHotLead: false, aiPriority: 4,
    aiAction: 'Introduce Jumeirah project',
  },
  {
    id: 'c-007', name: 'Marco Bianchi', email: 'marco@bianchi.it', phone: '+39 333 123 4567',
    location: 'Milan, Italy', country: 'IT', status: 'Prospect', deals: 0,
    totalVolume: 0, currency: 'EUR', lastContact: '2026-04-17',
    owner: 'James R.', ownerInitials: 'JR', ownerColor: '#f97316',
    tag: 'Buyer', starred: false, avatar: 'MB', avatarColor: '#22c55e',
    joined: '2026-02-08', nextFollowUp: '2026-04-29',
    dealProbability: 38, aiScore: 5.5, isHotLead: false, aiPriority: 6,
    aiAction: 'Share market report',
  },
];

const INSIGHTS_DATA = [
  { month: 'Nov', clients: 2 }, { month: 'Dec', clients: 3 }, { month: 'Jan', clients: 5 },
  { month: 'Feb', clients: 4 }, { month: 'Mar', clients: 6 }, { month: 'Apr', clients: 7 },
];

const KPI_TRENDS = {
  total:    [3, 4, 4, 5, 6, 7],
  active:   [2, 3, 3, 4, 4, 4],
  avgDeal:  [2.1, 2.3, 2.5, 2.6, 2.7, 2.8],
  newMonth: [0, 1, 1, 2, 1, 2],
};

const TOP_LOCATIONS = [
  { city: 'Dubai, UAE', count: 2, pct: 68, flag: '🇦🇪' },
  { city: 'Mumbai, India', count: 2, pct: 54, flag: '🇮🇳' },
  { city: 'London, UK', count: 1, pct: 32, flag: '🇬🇧' },
  { city: 'Stockholm', count: 1, pct: 28, flag: '🇸🇪' },
  { city: 'Doha, Qatar', count: 1, pct: 22, flag: '🇶🇦' },
];

const TODAY = '2026-04-30';

const FOLLOW_UPS = MOCK_CLIENTS
  .filter((c) => c.nextFollowUp)
  .sort((a, b) => (a.nextFollowUp! > b.nextFollowUp! ? 1 : -1))
  .slice(0, 4);

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatVolume(v: number, _cur: string) {
  void _cur;  // currency on mock data is heterogeneous; UI is INR-only
  if (v === 0) return '—';
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)} Cr`;
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(1)} L`;
  if (v >= 1_000)       return `₹${(v / 1_000).toFixed(0)}K`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

function daysAgo(date: string) {
  const d = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

function parseFollowUp(date: string) {
  const isToday = date === TODAY;
  const isPast = date < TODAY;
  const label = isToday
    ? 'Today'
    : new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label, isUrgent: isToday || isPast };
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { dot: string; badge: string }> = {
  Active:   { dot: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  Prospect: { dot: '#f59e0b', badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  Past:     { dot: '#9A8B7E', badge: 'bg-stone-100 text-stone-500 border border-stone-200' },
};

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

// ─── Animated Status Badge ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.badge}`}>
      {status === 'Active' ? (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: cfg.dot }} />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: cfg.dot }} />
        </span>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      )}
      {status}
    </span>
  );
}

// ─── Deal Probability Bar ─────────────────────────────────────────────────────
function ProbabilityBar({ pct }: { pct: number }) {
  const color = pct >= 70 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden flex-shrink-0">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function Counter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.ceil(value / (900 / 16));
    const t = setInterval(() => {
      cur = Math.min(cur + step, value);
      setDisplay(cur);
      if (cur >= value) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [value]);
  return <>{display}</>;
}

// ─── Add Client Modal ─────────────────────────────────────────────────────────
function AddClientModal({
  open, onClose, onAdd,
}: { open: boolean; onClose: () => void; onAdd: (name: string) => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', status: 'Prospect', tag: 'Buyer' });
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
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto border border-stone-100 overflow-hidden"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            >
              {/* accent bar */}
              <div className="h-0.5 bg-gradient-to-r from-stone-400 via-amber-400 to-stone-500" />
              {/* header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div>
                  <h2 className="text-sm font-semibold text-stone-900">Add New Client</h2>
                  <p className="text-xs text-stone-400 mt-0.5">Fill in the client details below</p>
                </div>
                <button onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors">
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              </div>
              {/* form */}
              <div className="p-5 space-y-3">
                {[
                  { key: 'name',     label: 'Full Name', placeholder: 'John Smith',        type: 'text'  },
                  { key: 'email',    label: 'Email',     placeholder: 'john@example.com',  type: 'email' },
                  { key: 'phone',    label: 'Phone',     placeholder: '+1 555 000 0000',   type: 'tel'   },
                  { key: 'location', label: 'Location',  placeholder: 'Dubai, UAE',        type: 'text'  },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-stone-600 mb-1">{f.label}</label>
                    <input
                      type={f.type} placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => set(f.key, e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-300 transition-all"
                    />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'status', label: 'Status', opts: ['Prospect', 'Active', 'Past'] },
                    { key: 'tag',    label: 'Type',   opts: ['Buyer', 'Investor', 'Developer'] },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-stone-600 mb-1">{f.label}</label>
                      <select value={form[f.key as keyof typeof form]} onChange={(e) => set(f.key, e.target.value)}
                        className="w-full h-9 px-3 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 focus:outline-none cursor-pointer">
                        {f.opts.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              {/* footer */}
              <div className="flex gap-2 px-5 pb-5">
                <button onClick={onClose}
                  className="flex-1 h-10 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors">
                  Cancel
                </button>
                <motion.button
                  onClick={() => { onAdd(form.name || 'New Client'); onClose(); }}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-stone-700 to-stone-600 text-white text-sm font-semibold"
                  whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.97 }}
                >
                  Add Client
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Client Drawer ────────────────────────────────────────────────────────────
function ClientDrawer({ client, onClose, onToast }: {
  client: Client | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  if (!client) return null;

  return (
    <AnimatePresence>
      {client && (
        <>
          <motion.div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* accent line */}
            <div className="h-0.5 bg-gradient-to-r from-stone-400 via-amber-400 to-stone-500 flex-shrink-0" />

            {/* Light header */}
            <div className="bg-gradient-to-br from-stone-50 to-white p-5 border-b border-stone-100 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                      style={{ background: `linear-gradient(135deg, ${client.avatarColor}, ${client.avatarColor}bb)` }}
                    >{client.avatar}</div>
                    {client.isHotLead && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                        <Flame className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-stone-900">{client.name}</h2>
                      {client.starred && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={client.status} />
                      <span className="text-xs text-stone-400">{client.tag}</span>
                    </div>
                  </div>
                </div>
                <button onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-stone-100 transition-colors">
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              </div>

              {/* Hot lead alert */}
              {client.isHotLead && (
                <div className="mb-3 flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-3 py-2">
                  <Flame className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-amber-700 font-medium">Hot Lead — follow up today for high conversion</span>
                </div>
              )}

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Deals',       value: client.deals },
                  { label: 'Portfolio',   value: formatVolume(client.totalVolume, client.currency) },
                  { label: 'Last Active', value: daysAgo(client.lastContact) },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-stone-100 rounded-xl p-2.5 text-center shadow-sm">
                    <div className="text-sm font-bold text-stone-900 leading-tight">{s.value}</div>
                    <div className="text-[10px] text-stone-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* AI Intelligence */}
              <div className="rounded-xl border border-stone-100 bg-gradient-to-br from-stone-50/60 to-white p-4">
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-stone-400" /> AI Intelligence
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-stone-500">Deal Probability</span>
                      <span className="text-xs font-bold" style={{
                        color: client.dealProbability >= 70 ? '#10b981' : client.dealProbability >= 50 ? '#f59e0b' : '#ef4444',
                      }}>{client.dealProbability}%</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full"
                        style={{ background: client.dealProbability >= 70 ? '#10b981' : client.dealProbability >= 50 ? '#f59e0b' : '#ef4444' }}
                        initial={{ width: 0 }} animate={{ width: `${client.dealProbability}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-500">Interaction Score</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i < Math.round(client.aiScore / 2) ? 'bg-amber-400' : 'bg-stone-100'}`} />
                      ))}
                      <span className="text-xs font-semibold text-stone-700 ml-1">{client.aiScore}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                    <Zap className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-blue-700 font-medium">{client.aiAction}</span>
                  </div>
                </div>
              </div>

              {/* Contact details */}
              <div className="rounded-xl border border-stone-100 p-4 space-y-2.5">
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1">Contact</h3>
                {[
                  { icon: Mail,      label: client.email },
                  { icon: Phone,     label: client.phone },
                  { icon: MapPin,    label: client.location },
                  { icon: Building2, label: client.tag },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                    <span className="text-xs text-stone-600">{label}</span>
                  </div>
                ))}
              </div>

              {/* Account owner */}
              <div className="rounded-xl border border-stone-100 p-4">
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Account Owner</h3>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: client.ownerColor }}>{client.ownerInitials}</div>
                  <div>
                    <div className="text-sm font-medium text-stone-800">{client.owner}</div>
                    <div className="text-xs text-stone-400">Account Manager</div>
                  </div>
                </div>
              </div>

              {/* Next follow-up */}
              {client.nextFollowUp && (() => {
                const fu = parseFollowUp(client.nextFollowUp);
                return (
                  <div className={`rounded-xl border p-4 ${fu.isUrgent ? 'border-red-100 bg-red-50/40' : 'border-stone-100'}`}>
                    <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Next Follow-up</h3>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      <span className="text-sm font-medium text-stone-700">{fu.label}</span>
                      {fu.isUrgent && (
                        <span className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full font-semibold">Urgent</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Recent activity */}
              <div className="rounded-xl border border-stone-100 p-4">
                <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  {[
                    { icon: Mail,         text: 'Email sent — property brochure',  time: daysAgo(client.lastContact), color: '#8B7355' },
                    { icon: Phone,        text: 'Call logged — budget discussion',  time: '5d ago',                   color: '#10b981' },
                    { icon: CheckCircle,  text: 'Deal created — Listing #L-012',   time: '12d ago',                  color: '#f59e0b' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: item.color + '18' }}>
                        <item.icon className="w-3 h-3" style={{ color: item.color }} />
                      </div>
                      <div>
                        <p className="text-xs text-stone-700">{item.text}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-t border-stone-100 p-4 flex gap-2 flex-shrink-0">
              <motion.button
                className="flex-1 h-9 rounded-xl bg-gradient-to-r from-stone-700 to-stone-600 text-white text-sm font-medium flex items-center justify-center gap-1.5"
                whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.97 }}
                onClick={() => onToast(`Opening message to ${client.name}…`)}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </motion.button>
              <motion.button
                className="flex-1 h-9 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium flex items-center justify-center gap-1.5"
                whileHover={{ backgroundColor: '#f9fafb' }} whileTap={{ scale: 0.97 }}
                onClick={() => onToast('Opening calendar…')}
              >
                <Calendar className="w-3.5 h-3.5" /> Schedule
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tagFilter, setTagFilter]       = useState('All');
  const [sortBy, setSortBy]             = useState('aiPriority');
  const [viewMode, setViewMode]         = useState<'table' | 'grid'>('table');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [starred, setStarred]           = useState<Set<string>>(new Set(['c-001', 'c-003', 'c-006']));
  const [toast, setToast]               = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const filtered = useMemo(() => {
    let list = [...MOCK_CLIENTS];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'All') list = list.filter((c) => c.status === statusFilter);
    if (tagFilter !== 'All')    list = list.filter((c) => c.tag === tagFilter);
    list.sort((a, b) => {
      if (sortBy === 'name')        return a.name.localeCompare(b.name);
      if (sortBy === 'deals')       return b.deals - a.deals;
      if (sortBy === 'volume')      return b.totalVolume - a.totalVolume;
      if (sortBy === 'probability') return b.dealProbability - a.dealProbability;
      if (sortBy === 'aiPriority')  return a.aiPriority - b.aiPriority;
      return b.lastContact.localeCompare(a.lastContact);
    });
    return list;
  }, [search, statusFilter, tagFilter, sortBy]);

  const kpis = useMemo(() => ({
    total:       MOCK_CLIENTS.length,
    active:      MOCK_CLIENTS.filter((c) => c.status === 'Active').length,
    newThisMonth: 2,
    hotLeads:    MOCK_CLIENTS.filter((c) => c.isHotLead).length,
  }), []);

  const toggleStar = (id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const STATUS_PILLS = [
    { key: 'All',      label: 'All Clients', count: MOCK_CLIENTS.length },
    { key: 'Active',   label: 'Active',      count: MOCK_CLIENTS.filter((c) => c.status === 'Active').length },
    { key: 'Prospect', label: 'Prospects',   count: MOCK_CLIENTS.filter((c) => c.status === 'Prospect').length },
    { key: 'Past',     label: 'Past',        count: MOCK_CLIENTS.filter((c) => c.status === 'Past').length },
  ];

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
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <ClientDrawer client={selectedClient} onClose={() => setSelectedClient(null)} onToast={showToast} />
      <AddClientModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onAdd={(n) => showToast(`${n} added successfully`)} />

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="bkr-hero mb-7">
        <div className="bkr-hero-inner flex-wrap !items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                <Users className="h-4 w-4 text-[#8B6F47]" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--fg)] tracking-tight">Clients</h1>
              <span className="text-xs bg-[var(--bg-secondary)] text-[var(--fg-muted)] px-2.5 py-1 rounded-full font-medium border border-[var(--border)]">
                {MOCK_CLIENTS.length} total
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[#16A34A] bg-[#F0FDF4] border border-[#86EFAC] px-2.5 py-[3px] rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                Soon
              </span>
            </div>
            <p className="text-sm text-[var(--fg-muted)]">AI-powered client intelligence &amp; relationship management</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { icon: Download, label: 'Export', action: () => showToast('Exporting clients…') },
              { icon: Upload,   label: 'Import', action: () => showToast('Opening import wizard…') },
            ].map(({ icon: Icon, label, action }) => (
              <motion.button key={label} onClick={action}
                className="h-9 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--fg-secondary)] text-sm font-medium flex items-center gap-1.5 shadow-sm"
                whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.07)' }}
                whileTap={{ scale: 0.97 }}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </motion.button>
            ))}
            <motion.button onClick={() => setAddModalOpen(true)}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#6F5443] to-[#8B6F47] text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm"
              whileHover={{ y: -1, opacity: 0.92 }} whileTap={{ scale: 0.97 }}
            >
              <Plus className="w-4 h-4" /> Add Client
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Clients', value: kpis.total, display: null,
            change: '+10%', positive: true, changeNote: 'this month',
            icon: Users, iconColor: '#8B7355', iconBg: 'rgba(139,115,85,0.08)',
            trend: KPI_TRENDS.total, sparkId: 'sk0', sparkColor: '#8B7355',
            insight: 'Steady month-over-month growth',
          },
          {
            label: 'Active Clients', value: kpis.active, display: null,
            change: '+20%', positive: true, changeNote: 'vs last month',
            icon: Activity, iconColor: '#10b981', iconBg: 'rgba(16,185,129,0.08)',
            trend: KPI_TRENDS.active, sparkId: 'sk1', sparkColor: '#10b981',
            insight: '2 clients likely to convert this week',
          },
          {
            label: 'Avg Deal Value', value: 0, display: '$2.8M',
            change: '+5.2%', positive: true, changeNote: 'vs last month',
            icon: DollarSign, iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.08)',
            trend: KPI_TRENDS.avgDeal, sparkId: 'sk2', sparkColor: '#f59e0b',
            insight: '+20% growth driven by Dubai clients',
          },
          {
            label: 'Hot Leads', value: kpis.hotLeads, display: null,
            change: '+100%', positive: true, changeNote: 'new this cycle',
            icon: Flame, iconColor: '#ef4444', iconBg: 'rgba(239,68,68,0.08)',
            trend: KPI_TRENDS.newMonth, sparkId: 'sk3', sparkColor: '#ef4444',
            insight: 'High-priority clients ready to close',
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
              {/* Icon + numbers */}
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
              {/* Mini sparkline */}
              <div className="w-20 flex-shrink-0 opacity-75">
                <MiniSparkline data={kpi.trend} color={kpi.sparkColor} id={kpi.sparkId} />
              </div>
            </div>

            {/* Trend badge */}
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                kpi.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
              }`}>
                <ArrowUp className="w-2.5 h-2.5" />{kpi.change}
              </span>
              <span className="text-[10px] text-stone-400">{kpi.changeNote}</span>
            </div>

            {/* AI insight line */}
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
            onClick={() => setStatusFilter(pill.key)}
            className={`h-8 px-3.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === pill.key
                ? 'bg-stone-800 text-white shadow-sm'
                : 'bg-white border border-[#E5E7EB] text-stone-600 hover:border-stone-300 hover:bg-stone-50'
            }`}
            whileTap={{ scale: 0.96 }}
          >
            {pill.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
              statusFilter === pill.key ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-400'
            }`}>{pill.count}</span>
          </motion.button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}
            className="h-8 px-3 rounded-full border border-[#E5E7EB] bg-white text-xs text-stone-600 focus:outline-none cursor-pointer">
            <option value="All">All Types</option>
            <option value="Investor">Investor</option>
            <option value="Buyer">Buyer</option>
            <option value="Developer">Developer</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="h-8 px-3 rounded-full border border-[#E5E7EB] bg-white text-xs text-stone-600 focus:outline-none cursor-pointer">
            <option value="aiPriority">AI Priority</option>
            <option value="probability">Deal Probability</option>
            <option value="lastContact">Last Contact</option>
            <option value="name">Name A–Z</option>
            <option value="deals">Most Deals</option>
            <option value="volume">Volume</option>
          </select>
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* ── Left: table / grid ─── */}
        <div className="flex-1 min-w-0">

          {/* Search + view toolbar */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] mb-3 px-4 py-3"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search clients, email, location…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all"
                />
              </div>

              {(search || statusFilter !== 'All' || tagFilter !== 'All') && (
                <motion.button
                  onClick={() => { setSearch(''); setStatusFilter('All'); setTagFilter('All'); }}
                  className="h-8 px-3 rounded-xl border border-stone-200 text-stone-500 text-xs hover:bg-stone-50 flex items-center gap-1"
                  whileTap={{ scale: 0.96 }}
                >
                  <X className="w-3 h-3" /> Clear
                </motion.button>
              )}

              <div className="flex items-center bg-stone-100 rounded-xl p-0.5 gap-0.5">
                {(['table', 'grid'] as const).map((v) => (
                  <button key={v} onClick={() => setViewMode(v)}
                    className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                      viewMode === v ? 'bg-white shadow-sm text-stone-700' : 'text-stone-400 hover:text-stone-600'
                    }`}>
                    {v === 'table' ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Count + bulk actions */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs text-stone-400">
              {filtered.length} client{filtered.length !== 1 ? 's' : ''}
              {selectedClients.size > 0 && ` · ${selectedClients.size} selected`}
            </span>
            <AnimatePresence>
              {selectedClients.size > 0 && (
                <motion.div className="flex items-center gap-2"
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <button onClick={() => showToast(`Emailing ${selectedClients.size} clients…`)}
                    className="h-7 px-3 rounded-lg bg-stone-100 text-stone-600 text-xs font-medium hover:bg-stone-200 transition-colors flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email All
                  </button>
                  <button onClick={() => setSelectedClients(new Set())}
                    className="h-7 px-3 rounded-lg border border-stone-200 text-stone-500 text-xs hover:bg-stone-50 transition-colors">
                    Deselect
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── TABLE VIEW ──────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {viewMode === 'table' && (
              <motion.div key="table"
                className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                {/* header row */}
                <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1.8fr_0.8fr_auto] gap-3 px-5 py-3 border-b border-stone-100 bg-stone-50/60">
                  <div className="flex items-center gap-2.5">
                    <input type="checkbox"
                      checked={selectedClients.size === filtered.length && filtered.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedClients(new Set(filtered.map((c) => c.id)));
                        else setSelectedClients(new Set());
                      }}
                      className="w-3.5 h-3.5 rounded border-stone-300 flex-shrink-0 cursor-pointer"
                    />
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Client</span>
                  </div>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest self-center">Status</span>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest self-center">Portfolio</span>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest self-center">Probability</span>
                  <div className="flex items-center gap-1 self-center">
                    <Brain className="w-3 h-3 text-stone-300" />
                    <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">AI Recommendation</span>
                  </div>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest self-center">Last Active</span>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest self-center">Actions</span>
                </div>

                {filtered.length === 0 ? (
                  <div className="py-16 text-center text-stone-400 text-sm">No clients match your filters</div>
                ) : (
                  filtered.map((client, i) => (
                    <motion.div
                      key={client.id}
                      className={`grid grid-cols-[2.5fr_1fr_1fr_1fr_1.8fr_0.8fr_auto] gap-3 items-center px-5 py-3.5 border-b border-stone-50 cursor-pointer group transition-colors ${
                        selectedClients.has(client.id) ? 'bg-stone-50/80' : 'hover:bg-stone-50/70'
                      }`}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => setSelectedClient(client)}
                    >
                      {/* Client cell */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input type="checkbox"
                          checked={selectedClients.has(client.id)}
                          onChange={() => toggleSelect(client.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-3.5 h-3.5 rounded border-stone-300 flex-shrink-0 cursor-pointer"
                        />
                        <button onClick={(e) => { e.stopPropagation(); toggleStar(client.id); }} className="flex-shrink-0">
                          <Star className={`w-3.5 h-3.5 transition-colors ${
                            starred.has(client.id) ? 'fill-amber-400 text-amber-400' : 'text-stone-200 hover:text-amber-300'
                          }`} />
                        </button>
                        <div className="relative w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${client.avatarColor}, ${client.avatarColor}99)` }}>
                          {client.avatar}
                          {client.isHotLead && (
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                              <Flame className="w-2 h-2 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-semibold text-stone-800 truncate leading-tight">{client.name}</span>
                            {client.isHotLead && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-50 text-red-500 rounded-full border border-red-100 flex-shrink-0 leading-none">HOT</span>
                            )}
                          </div>
                          <div className="text-xs text-stone-400 truncate">{client.email}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 text-stone-300 flex-shrink-0" />
                            <span className="text-[10px] text-stone-400 truncate">{client.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      <div><StatusBadge status={client.status} /></div>

                      {/* Portfolio */}
                      <div>
                        <div className="text-sm font-semibold text-stone-800 leading-tight">{client.deals} deal{client.deals !== 1 ? 's' : ''}</div>
                        <div className="text-xs text-stone-400 mt-0.5">{formatVolume(client.totalVolume, client.currency)}</div>
                      </div>

                      {/* Probability */}
                      <div><ProbabilityBar pct={client.dealProbability} /></div>

                      {/* AI recommendation */}
                      <div className="flex items-start gap-1.5 min-w-0">
                        <Zap className="w-3 h-3 text-stone-300 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-stone-500 leading-tight line-clamp-2">{client.aiAction}</span>
                      </div>

                      {/* Last active */}
                      <div className="text-xs text-stone-500 tabular-nums">{daysAgo(client.lastContact)}</div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {[
                          { icon: Phone,    tip: 'Call',     fn: () => showToast(`Calling ${client.name}…`) },
                          { icon: Mail,     tip: 'Email',    fn: () => showToast(`Email to ${client.name}…`) },
                          { icon: Calendar, tip: 'Schedule', fn: () => showToast('Opening scheduler…') },
                        ].map(({ icon: Icon, tip, fn }) => (
                          <motion.button key={tip} title={tip}
                            onClick={(e) => { e.stopPropagation(); fn(); }}
                            className="h-7 w-7 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                            whileTap={{ scale: 0.88 }}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}

            {/* ── GRID VIEW ──────────────────────────────────── */}
            {viewMode === 'grid' && (
              <motion.div key="grid" className="grid grid-cols-2 gap-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {filtered.map((client, i) => (
                  <motion.div key={client.id}
                    className="bg-white rounded-2xl border border-[#E5E7EB] p-4 cursor-pointer relative overflow-hidden"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelectedClient(client)}
                    whileHover={{ y: -3, boxShadow: '0 8px 24px -4px rgba(0,0,0,0.09)' }}
                  >
                    {/* Hot lead accent */}
                    {client.isHotLead && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-400 to-orange-400" />
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${client.avatarColor}, ${client.avatarColor}99)` }}>
                          {client.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-stone-800">{client.name}</span>
                            {client.isHotLead && <Flame className="w-3 h-3 text-red-500" />}
                          </div>
                          <div className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-2.5 h-2.5" /> {client.location}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={client.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: 'Deals',       value: client.deals },
                        { label: 'Volume',       value: formatVolume(client.totalVolume, client.currency) },
                        { label: 'Probability',  value: `${client.dealProbability}%` },
                      ].map((s) => (
                        <div key={s.label} className="bg-stone-50 rounded-xl p-2 text-center border border-stone-100">
                          <div className="text-sm font-bold text-stone-800 leading-tight">{s.value}</div>
                          <div className="text-[10px] text-stone-400 mt-0.5">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 bg-stone-50 rounded-xl px-2.5 py-1.5 border border-stone-100">
                      <Zap className="w-3 h-3 text-stone-400 flex-shrink-0" />
                      <span className="text-xs text-stone-500 truncate">{client.aiAction}</span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT SIDEBAR ──────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 space-y-4">

          {/* Growth Insights chart */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-800">Growth Insights</h3>
              <div className="flex items-center bg-stone-50 rounded-lg p-0.5 gap-0.5 border border-stone-100">
                {['6M', 'YTD'].map((t, ti) => (
                  <button key={t}
                    className={`text-[10px] px-2 py-1 rounded-md font-medium transition-all ${
                      ti === 0 ? 'bg-white shadow-sm text-stone-700 border border-stone-100' : 'text-stone-400 hover:text-stone-600'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={INSIGHTS_DATA} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="sideGrad" x1="0" y1="0" x2="0" y2="1">
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
                  cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="clients" stroke="#8B7355" strokeWidth={2}
                  fill="url(#sideGrad)"
                  dot={{ r: 2.5, fill: '#8B7355', strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: '#8B7355', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-2 flex items-center justify-between text-xs pt-1 border-t border-stone-50">
              <span className="text-stone-400">Total period</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-stone-800">{MOCK_CLIENTS.length} clients</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">+17%</span>
              </div>
            </div>
          </div>

          {/* Top Locations */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 className="text-sm font-semibold text-stone-800 mb-3">Top Locations</h3>
            <div className="space-y-3">
              {TOP_LOCATIONS.map((loc, i) => (
                <motion.button
                  key={loc.city}
                  className="w-full text-left rounded-xl px-1 py-0.5 hover:bg-stone-50 transition-colors"
                  onClick={() => { setSearch(loc.city.split(',')[0]); showToast(`Filtering: ${loc.city}`); }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                      <span className="text-sm leading-none">{loc.flag}</span>
                      <span className="text-xs">{loc.city}</span>
                    </div>
                    <span className="text-stone-400 font-medium tabular-nums">{loc.count}</span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-stone-500 to-stone-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${loc.pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.1 }}
                    />
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Follow-ups Timeline */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-800">Follow-ups</h3>
              <span className="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-100 font-medium">
                {FOLLOW_UPS.length} pending
              </span>
            </div>
            <div>
              {FOLLOW_UPS.map((c, i) => {
                const fu = parseFollowUp(c.nextFollowUp!);
                return (
                  <div key={c.id} className="relative flex gap-2.5 pb-3">
                    {i < FOLLOW_UPS.length - 1 && (
                      <div className="absolute left-2.5 top-5 bottom-0 w-px bg-stone-100" />
                    )}
                    {/* Timeline dot */}
                    <div className={`relative w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 ${
                      fu.isUrgent ? 'bg-red-50' : 'bg-amber-50'
                    }`}>
                      {fu.isUrgent ? (
                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-300" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <button
                          className="text-xs font-medium text-stone-700 truncate hover:text-stone-900 transition-colors text-left"
                          onClick={() => setSelectedClient(c)}
                        >{c.name}</button>
                        <span className={`text-[10px] font-semibold flex-shrink-0 ${fu.isUrgent ? 'text-red-500' : 'text-amber-600'}`}>
                          {fu.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-[10px] text-stone-400 hover:text-emerald-500 transition-colors flex items-center gap-0.5"
                          onClick={() => showToast(`${c.name} marked done`)}
                        >
                          <CheckCircle className="w-2.5 h-2.5" /> Done
                        </button>
                        <span className="text-stone-200">·</span>
                        <button
                          className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors"
                          onClick={() => showToast('Reschedule coming soon')}
                        >Reschedule</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pipeline Health — white glass card (FIXED from dark) */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 relative overflow-hidden"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* gradient top accent */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400" />
            {/* ultra-subtle bg tint */}
            <div className="absolute inset-0 bg-gradient-to-br from-stone-50/40 to-white/0 pointer-events-none rounded-2xl" />

            <h3 className="relative text-sm font-semibold text-stone-800 mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-stone-400" /> Pipeline Health
            </h3>

            <div className="relative space-y-2">
              {[
                {
                  label: 'Active Clients',
                  value: `${kpis.active} / ${kpis.total}`,
                  icon: CheckCircle,
                  iconColor: '#10b981', bg: 'rgba(16,185,129,0.06)',
                  badge: '+12%', badgeClass: 'bg-emerald-50 text-emerald-600',
                },
                {
                  label: 'Overdue Follow-ups',
                  value: '1',
                  icon: AlertTriangle,
                  iconColor: '#f59e0b', bg: 'rgba(245,158,11,0.06)',
                  badge: 'Review', badgeClass: 'bg-amber-50 text-amber-600',
                },
                {
                  label: 'New Prospects',
                  value: '2',
                  icon: Zap,
                  iconColor: '#8B7355', bg: 'rgba(139,115,85,0.06)',
                  badge: '+100%', badgeClass: 'bg-stone-100 text-stone-600',
                },
              ].map((item) => (
                <div key={item.label}
                  className="flex items-center justify-between p-2.5 rounded-xl transition-colors hover:brightness-95"
                  style={{ background: item.bg }}>
                  <div className="flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.iconColor }} />
                    <span className="text-xs text-stone-600 font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-800 tabular-nums">{item.value}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
