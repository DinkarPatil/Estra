'use client';

import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Line, LineChart, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, Activity, Home } from 'lucide-react';

const PRICE_TREND = [
  { m: 'Jul', v: 1580 },
  { m: 'Aug', v: 1610 },
  { m: 'Sep', v: 1650 },
  { m: 'Oct', v: 1690 },
  { m: 'Nov', v: 1740 },
  { m: 'Dec', v: 1780 },
  { m: 'Jan', v: 1820 },
  { m: 'Feb', v: 1875 },
];

const DEMAND = [
  { m: 'Jul', v: 62 },
  { m: 'Aug', v: 68 },
  { m: 'Sep', v: 71 },
  { m: 'Oct', v: 74 },
  { m: 'Nov', v: 79 },
  { m: 'Dec', v: 82 },
  { m: 'Jan', v: 84 },
  { m: 'Feb', v: 87 },
];

const RENTAL_GROWTH = [
  { m: 'Jul', v: 4.2 },
  { m: 'Aug', v: 4.5 },
  { m: 'Sep', v: 4.6 },
  { m: 'Oct', v: 4.9 },
  { m: 'Nov', v: 5.1 },
  { m: 'Dec', v: 5.4 },
  { m: 'Jan', v: 5.6 },
  { m: 'Feb', v: 5.9 },
];

const TOOLTIP_STYLES = {
  contentStyle: {
    background: '#FFFFFF',
    border: '1px solid #E6E0D8',
    borderRadius: 8,
    fontSize: 12,
    color: '#1F1814',
    boxShadow: '0 8px 24px rgba(31,24,20, 0.08)',
    padding: '6px 10px',
  },
  labelStyle: { color: '#7A6B5E', fontSize: 11, marginBottom: 2 },
};

export function InsightsPanel() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Price trend */}
      <InsightCard
        icon={TrendingUp}
        title="Price Trend"
        caption="Avg ₹/sqft · 8 months"
        headlineValue="₹1,875"
        headlineDelta="+18.7%"
        deltaPositive
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={PRICE_TREND} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(22,101,52,0.14)" />
                <stop offset="100%" stopColor="rgba(22,101,52,0)" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F3EFEA" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#9A8B7E' }} tickLine={false} axisLine={false} />
            <YAxis hide domain={['dataMin - 40', 'dataMax + 40']} />
            <Tooltip {...TOOLTIP_STYLES} formatter={(v) => [`₹${Number(v).toLocaleString()}`, 'Avg']} />
            <Area type="monotone" dataKey="v" stroke="#166534" strokeWidth={2} fill="url(#price-fill)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </InsightCard>

      {/* Demand */}
      <InsightCard
        icon={Activity}
        title="Demand Indicator"
        caption="Search interest index"
        headlineValue="87"
        headlineDelta="Very High"
        deltaPositive
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={DEMAND} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#F3EFEA" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#9A8B7E' }} tickLine={false} axisLine={false} />
            <YAxis hide domain={[0, 100]} />
            <Tooltip {...TOOLTIP_STYLES} formatter={(v) => [`${v} / 100`, 'Index']} />
            <Bar dataKey="v" fill="#22C55E" radius={[3, 3, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </InsightCard>

      {/* Rental growth */}
      <InsightCard
        icon={Home}
        title="Rental Growth"
        caption="Yield trajectory · %"
        headlineValue="5.9%"
        headlineDelta="+40 bps YTD"
        deltaPositive
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={RENTAL_GROWTH} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#F3EFEA" vertical={false} />
            <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#9A8B7E' }} tickLine={false} axisLine={false} />
            <YAxis hide domain={[3.5, 7]} />
            <Tooltip {...TOOLTIP_STYLES} formatter={(v) => [`${v}%`, 'Yield']} />
            <Line type="monotone" dataKey="v" stroke="#22C55E" strokeWidth={2} dot={{ r: 2.5, fill: '#22C55E', strokeWidth: 0 }} />
          </LineChart>
        </ResponsiveContainer>
      </InsightCard>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  caption,
  headlineValue,
  headlineDelta,
  deltaPositive,
  children,
}: {
  icon: typeof TrendingUp;
  title: string;
  caption: string;
  headlineValue: string;
  headlineDelta: string;
  deltaPositive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_10px_30px_rgba(31,24,20,0.04)]">
      {/* Subtle top accent */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, rgba(168,148,120,0) 0%, rgba(168,148,120,0.5) 50%, rgba(168,148,120,0) 100%)', opacity: 0.7 }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#166534]">
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-stone-900 tracking-[-0.005em]">{title}</h3>
            <p className="text-[10.5px] text-stone-500">{caption}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-[22px] font-bold tracking-[-0.02em] text-stone-900">{headlineValue}</span>
        <span
          className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold ${
            deltaPositive ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {headlineDelta}
        </span>
      </div>

      <div className="mt-3 h-[120px]">
        {children}
      </div>
    </div>
  );
}
