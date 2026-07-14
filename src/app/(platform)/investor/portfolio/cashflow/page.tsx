'use client';

import { useState } from 'react';
import {
  Wallet, TrendingUp, ArrowUpRight, ArrowDownRight,
  Calendar, Building2, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

/* ─── Mock Data ─── */

const ALL_CASHFLOW = [
  { month: 'Jan', income: 14200, expenses: 5800, net: 8400 },
  { month: 'Feb', income: 14200, expenses: 4200, net: 10000 },
  { month: 'Mar', income: 15100, expenses: 6300, net: 8800 },
  { month: 'Apr', income: 14800, expenses: 5100, net: 9700 },
  { month: 'May', income: 15400, expenses: 7200, net: 8200 },
  { month: 'Jun', income: 15400, expenses: 4800, net: 10600 },
  { month: 'Jul', income: 16200, expenses: 5500, net: 10700 },
  { month: 'Aug', income: 15800, expenses: 6100, net: 9700 },
  { month: 'Sep', income: 16500, expenses: 5200, net: 11300 },
  { month: 'Oct', income: 16800, expenses: 8400, net: 8400 },
  { month: 'Nov', income: 17100, expenses: 5600, net: 11500 },
  { month: 'Dec', income: 17500, expenses: 6200, net: 11300 },
];

const PERIOD_SLICES: Record<string, number> = { '3M': 3, '6M': 6, '12M': 12, YTD: 4 };

const EXPENSE_CATEGORIES = [
  { name: 'Mortgage',      amount: 3200, pct: 42, color: '#8B7355' },
  { name: 'Management',   amount: 900,  pct: 12, color: '#6F5C46' },
  { name: 'Maintenance',  amount: 1100, pct: 14, color: '#A89478' },
  { name: 'Insurance',    amount: 800,  pct: 10, color: '#C4B19A' },
  { name: 'Property Tax', amount: 650,  pct: 8,  color: '#9A8B7E' },
  { name: 'Utilities',    amount: 550,  pct: 7,  color: '#B8A898' },
  { name: 'Other',        amount: 500,  pct: 7,  color: '#D4B896' },
];

const PROPERTY_INCOME = [
  { property: 'Marina Bay Penthouse', income: 6500, expenses: 2100, net: 4400, occupancy: 98, color: '#8B7355' },
  { property: 'Palm Jumeirah Villa',  income: 5200, expenses: 1800, net: 3400, occupancy: 100, color: '#6F5C46' },
  { property: 'Singapore Condo',      income: 3800, expenses: 1200, net: 2600, occupancy: 95, color: '#A89478' },
  { property: 'London Flat',          income: 2000, expenses: 1100, net: 900,  occupancy: 88, color: '#C4B19A' },
];

const RECENT_TRANSACTIONS = [
  { id: '1', type: 'income'  as const, description: 'Rent — Marina Bay Penthouse',  amount: 6500,  date: 'Apr 1, 2026'  },
  { id: '2', type: 'income'  as const, description: 'Rent — Palm Jumeirah Villa',   amount: 5200,  date: 'Apr 1, 2026'  },
  { id: '3', type: 'expense' as const, description: 'Mortgage Payment',             amount: -3200, date: 'Apr 5, 2026'  },
  { id: '4', type: 'expense' as const, description: 'Property Management Fee',      amount: -900,  date: 'Apr 8, 2026'  },
  { id: '5', type: 'income'  as const, description: 'Rent — Singapore Condo',       amount: 3800,  date: 'Apr 10, 2026' },
  { id: '6', type: 'expense' as const, description: 'Maintenance — HVAC repair',    amount: -1200, date: 'Apr 12, 2026' },
  { id: '7', type: 'expense' as const, description: 'Insurance Premium',            amount: -800,  date: 'Apr 15, 2026' },
  { id: '8', type: 'income'  as const, description: 'Rent — London Flat',           amount: 2000,  date: 'Apr 15, 2026' },
];

function fmtAmt(n: number) {
  return `₹${Math.abs(n).toLocaleString()}`;
}


export default function CashflowTrackerPage() {
  const [period, setPeriod] = useState('12M');
  const [aiOpen, setAiOpen] = useState(false);

  const sliceCount = PERIOD_SLICES[period] ?? 12;
  const data = ALL_CASHFLOW.slice(-sliceCount);

  const totalIncome   = data.reduce((s, m) => s + m.income, 0);
  const totalExpenses = data.reduce((s, m) => s + m.expenses, 0);
  const totalNet      = totalIncome - totalExpenses;
  const avgMonthly    = Math.round(totalNet / data.length);

  const KPIS = [
    { label: 'Total Income',    value: fmtAmt(totalIncome),   icon: ArrowUpRight,   color: '#22C55E', delta: '+8.2%',  positive: true  },
    { label: 'Total Expenses',  value: fmtAmt(totalExpenses), icon: ArrowDownRight, color: '#EF4444', delta: '+3.1%',  positive: false },
    { label: 'Net Cashflow',    value: fmtAmt(totalNet),      icon: TrendingUp,     color: '#8B7355', delta: '+12.4%', positive: true  },
    { label: 'Avg Monthly',     value: fmtAmt(avgMonthly),    icon: Calendar,       color: '#A89478', delta: '/month', positive: true  },
  ];

  return (
    <div className="space-y-6 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full">

      {/* ── Header ── */}
      <div className="ai-deal-hero">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#8B7355] to-[#6F5C46] flex items-center justify-center shadow-lg">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--fg)]">Smart Cashflow Tracker</h1>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">Real-time income &amp; expense monitoring</p>
            </div>
          </div>

          {/* Period selector */}
          <div className="ex-pill-group">
            {['3M', '6M', '12M', 'YTD'].map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`ex-pill ${period === p ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {KPIS.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="cf-metric"
                style={{ '--cf-bg': `${kpi.color}0d`, '--cf-border': `${kpi.color}1f` } as React.CSSProperties}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}18` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: kpi.color }} />
                  </div>
                  <span className="text-[10px] uppercase tracking-wide font-semibold text-[var(--fg-muted)]">{kpi.label}</span>
                </div>
                <p className="cf-metric-value">{kpi.value}</p>
                <p className="cf-metric-delta" style={{ color: kpi.color }}>{kpi.delta}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Charts + Property ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Bar + Trend chart */}
          <div className="cf-summary">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-[var(--fg)]">Cashflow Overview</h3>
              <div className="flex items-center gap-4 text-[11px] text-[var(--fg-muted)]">
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-[#22C55E]" /> Income</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-[#EF4444]" /> Expenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,115,85,0.07)" vertical={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--fg-muted)' } as any} axisLine={false} tickLine={false} />
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <YAxis tick={{ fontSize: 11, fill: 'var(--fg-muted)' } as any} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.10)' }}
                  labelStyle={{ color: 'var(--fg)', fontWeight: 700, marginBottom: 6 }}
                  itemStyle={{ color: 'var(--fg-secondary)', fontWeight: 500 }}
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                  cursor={{ fill: 'rgba(139,115,85,0.04)' }}
                />
                <Bar dataKey="income" fill="#22C55E" radius={[5, 5, 0, 0]} opacity={0.85} name="Income" maxBarSize={28} />
                <Bar dataKey="expenses" fill="#EF4444" radius={[5, 5, 0, 0]} opacity={0.65} name="Expenses" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[var(--fg-muted)]">Net Cashflow Trend</p>
                <span className="text-xs font-bold text-[#8B7355]">+12.4% vs prior period</span>
              </div>
              <ResponsiveContainer width="100%" height={72}>
                <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cfNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B7355" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#8B7355" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="net" stroke="#8B7355" fill="url(#cfNet)" strokeWidth={2.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income by Property */}
          <div className="cf-summary">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-[var(--fg)]">Income by Property</h3>
              <span className="text-[11px] text-[var(--fg-muted)] font-medium">Monthly</span>
            </div>
            <div className="space-y-4">
              {PROPERTY_INCOME.map((prop) => (
                <div key={prop.property}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${prop.color}18` }}>
                      <Building2 className="h-3.5 w-3.5" style={{ color: prop.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[var(--fg)] truncate">{prop.property}</p>
                        <span className="text-sm font-bold ml-2" style={{ color: prop.color }}>₹{prop.income.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-[var(--fg-muted)]">{prop.occupancy}% occupancy · −${prop.expenses.toLocaleString()} expenses</span>
                        <span className="text-[11px] font-bold text-[var(--fg)]">net ${prop.net.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="cf-prop-bar-wrap ml-11">
                    <div
                      className="cf-prop-bar-fill"
                      style={{ width: `${prop.occupancy}%`, background: `linear-gradient(90deg, ${prop.color}88, ${prop.color})` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* AI Insight — collapsible */}
          {(() => {
            const bestProp     = [...PROPERTY_INCOME].sort((a, b) => b.net - a.net)[0];
            const worstProp    = [...PROPERTY_INCOME].sort((a, b) => a.occupancy - b.occupancy)[0];
            const expenseRatio = Math.round((totalExpenses / totalIncome) * 100);
            const lastNet      = data[data.length - 1]?.net ?? 0;
            const firstNet     = data[0]?.net ?? 0;
            const trending     = lastNet > firstNet;
            const netMargin    = Math.round((totalNet / totalIncome) * 100);

            let insight = '';
            if (expenseRatio > 45) {
              insight = `Expenses are consuming ${expenseRatio}% of your income this period — above the healthy 40% threshold. The largest driver is ${EXPENSE_CATEGORIES[0].name} at ${EXPENSE_CATEGORIES[0].pct}%. Consider refinancing or renegotiating management fees.`;
            } else if (!trending) {
              insight = `Net cashflow dipped in the last months of this period. ${worstProp.property} is your weakest asset at ${worstProp.occupancy}% occupancy — a rent review or marketing push could recover ₹${(worstProp.income * (1 - worstProp.occupancy / 100)).toFixed(0)} in lost income.`;
            } else {
              insight = `Strong period: net margin of ${netMargin}% with an upward trend. ${bestProp.property} leads at ₹${bestProp.net.toLocaleString()} net/month. ${worstProp.occupancy < 95 ? `${worstProp.property} at ${worstProp.occupancy}% occupancy has room to improve.` : 'All properties are performing above 95% occupancy.'}`;
            }

            return (
              <div className="cf-summary overflow-hidden">
                {/* Toggle header */}
                <button
                  onClick={() => setAiOpen((v) => !v)}
                  className="w-full flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-[rgba(139,115,85,0.12)] flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-[#8B7355]" />
                    </div>
                    <span className="text-sm font-bold text-[var(--fg)]">AI Insight</span>
                    <span className="text-[10px] font-semibold text-[#8B7355] bg-[rgba(139,115,85,0.1)] px-2 py-0.5 rounded-full">Live</span>
                  </div>
                  {aiOpen
                    ? <ChevronUp className="h-4 w-4 text-[var(--fg-muted)]" />
                    : <ChevronDown className="h-4 w-4 text-[var(--fg-muted)]" />}
                </button>

                {/* Collapsible body */}
                {aiOpen && (
                  <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed mt-3 pt-3 border-t border-[var(--border-light)]">
                    {insight}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Expense Breakdown */}
          <div className="cf-summary">
            <h3 className="text-sm font-bold text-[var(--fg)] mb-4">Expense Breakdown</h3>

            {/* Segmented bar */}
            <div className="cf-category-bar mb-5">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  className="cf-category-segment"
                  style={{ width: `${cat.pct}%`, background: cat.color }}
                  title={`${cat.name}: ${cat.pct}%`}
                />
              ))}
            </div>

            <div className="space-y-2.5">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <span className="text-xs text-[var(--fg-secondary)] flex-1">{cat.name}</span>
                  <span className="text-xs font-bold text-[var(--fg)] font-variant-numeric">₹{cat.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-[var(--fg-muted)] w-7 text-right">{cat.pct}%</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 pt-3 border-t border-[var(--border-light)] flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--fg-muted)]">Total Monthly Expenses</span>
              <span className="text-sm font-bold text-[#EF4444]">
                ${EXPENSE_CATEGORIES.reduce((s, c) => s + c.amount, 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="cf-summary">
            <h3 className="text-sm font-bold text-[var(--fg)] mb-3">Recent Transactions</h3>
            <div className="cf-txn-scroll overflow-y-auto space-y-0.5 pr-1" style={{ maxHeight: 220 }}>
              {RECENT_TRANSACTIONS.map((txn) => (
                <div key={txn.id} className="cf-txn-row">
                  <div className={`cf-txn-icon ${txn.type === 'income' ? 'cf-txn-income' : 'cf-txn-expense'}`}>
                    {txn.type === 'income'
                      ? <ArrowUpRight className="h-3.5 w-3.5" />
                      : <ArrowDownRight className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--fg)] truncate">{txn.description}</p>
                    <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{txn.date}</p>
                  </div>
                  <p className={`text-xs font-bold tabular-nums ${txn.type === 'income' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {txn.type === 'income' ? '+' : ''}{fmtAmt(txn.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
