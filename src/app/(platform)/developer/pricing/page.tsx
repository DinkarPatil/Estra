'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { ChartCard } from '@/components/data-display/chart-card';
import { DataTable, type Column } from '@/components/data-display/data-table';
import { Badge } from '@/components/ui/badge';
import {
  LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { DollarSign, TrendingUp, Building2, Sparkles } from 'lucide-react';

const pricePerSqftTrend = [
  { month: 'May', price: 2310 },
  { month: 'Jun', price: 2380 },
  { month: 'Jul', price: 2420 },
  { month: 'Aug', price: 2395 },
  { month: 'Sep', price: 2460 },
  { month: 'Oct', price: 2510 },
  { month: 'Nov', price: 2540 },
  { month: 'Dec', price: 2580 },
  { month: 'Jan', price: 2600 },
  { month: 'Feb', price: 2620 },
  { month: 'Mar', price: 2638 },
  { month: 'Apr', price: 2650 },
];

const pricingComparison = [
  { id: 'pt-001', type: 'Penthouse', avgSize: 3200, aiSuggested: 8840000, marketMin: 7800000, marketMax: 9500000, currentPrice: 8500000, variance: '+4.0%' },
  { id: 'pt-002', type: '4BR', avgSize: 2800, aiSuggested: 6720000, marketMin: 6000000, marketMax: 7400000, currentPrice: 6400000, variance: '+5.0%' },
  { id: 'pt-003', type: '3BR', avgSize: 1850, aiSuggested: 3328000, marketMin: 2900000, marketMax: 3700000, currentPrice: 3200000, variance: '+4.0%' },
  { id: 'pt-004', type: '2BR', avgSize: 1200, aiSuggested: 2184000, marketMin: 1900000, marketMax: 2400000, currentPrice: 2100000, variance: '+4.0%' },
  { id: 'pt-005', type: '1BR', avgSize: 750, aiSuggested: 1423000, marketMin: 1200000, marketMax: 1600000, currentPrice: 1350000, variance: '+5.4%' },
  { id: 'pt-006', type: 'Studio', avgSize: 450, aiSuggested: 882000, marketMin: 750000, marketMax: 1000000, currentPrice: 850000, variance: '+3.8%' },
];

type PricingRow = typeof pricingComparison[number];

const fmt = (v: number) => `AED ${(v / 1000000).toFixed(2)}M`;

const columns: Column<Record<string, unknown>>[] = [
  { key: 'type', header: 'Type', sortable: true },
  {
    key: 'avgSize',
    header: 'Avg Size (sqft)',
    render: (item) => {
      const r = item as unknown as PricingRow;
      return r.avgSize.toLocaleString();
    },
  },
  {
    key: 'aiSuggested',
    header: 'AI Suggested',
    render: (item) => {
      const r = item as unknown as PricingRow;
      return (
        <span className="font-semibold text-success">{fmt(r.aiSuggested)}</span>
      );
    },
  },
  {
    key: 'marketMin',
    header: 'Market Min',
    render: (item) => {
      const r = item as unknown as PricingRow;
      return <span className="text-[var(--fg-muted)]">{fmt(r.marketMin)}</span>;
    },
  },
  {
    key: 'marketMax',
    header: 'Market Max',
    render: (item) => {
      const r = item as unknown as PricingRow;
      return <span className="text-[var(--fg-muted)]">{fmt(r.marketMax)}</span>;
    },
  },
  {
    key: 'currentPrice',
    header: 'Current Price',
    render: (item) => {
      const r = item as unknown as PricingRow;
      return fmt(r.currentPrice);
    },
  },
  {
    key: 'variance',
    header: 'AI Variance',
    render: (item) => {
      const r = item as unknown as PricingRow;
      const isPositive = r.variance.startsWith('+');
      return <Badge variant={isPositive ? 'success' : 'danger'}>{r.variance}</Badge>;
    },
  },
];

export default function AIPricingPage() {
  const [sliderValue, setSliderValue] = useState(8500000);
  const aiRecommended = 8840000;
  const upliftPct = (((sliderValue - 8500000) / 8500000) * 100).toFixed(1);

  return (
    <PageContainer>
      <PageHeader
        title="AI Pricing"
        description="Intelligent pricing recommendations"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Avg Price / sqft" value="AED 2,650" icon={DollarSign} iconColor="text-success" change={8.2} changeLabel="YoY" />
        <StatCard title="Price Index" value="112" icon={TrendingUp} change={3.4} changeLabel="vs base" iconColor="text-info" />
        <StatCard title="Premium Projects" value="2" icon={Building2} iconColor="text-warning" />
        <StatCard title="Price Growth" value="+8.2%" icon={TrendingUp} change={8.2} changeLabel="YoY" iconColor="text-success" />
      </div>

      <ChartCard title="Price per sqft Trend — Dubai Marina" subtitle="May 2025 – Apr 2026 (AED)">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={pricePerSqftTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="var(--fg-muted)"
              domain={[2200, 2800]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip formatter={(v) => [`AED ${Number(v).toLocaleString()}`, 'Price/sqft']} />
            <Line type="monotone" dataKey="price" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div>
        <h2 className="mb-4 text-base font-semibold text-[var(--fg)]">Pricing Comparison by Unit Type</h2>
        <DataTable
          columns={columns as any}
          data={pricingComparison as unknown as Record<string, unknown>[]}
          keyField="id"
        />
      </div>

      {/* AI Price Optimizer Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary-600" />
          <h2 className="text-base font-semibold text-[var(--fg)]">AI Price Optimizer</h2>
          <Badge variant="info">Penthouse — Tower A 4201</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--fg-secondary)]">Current Price</span>
              <span className="font-semibold text-[var(--fg)]">AED {sliderValue.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={7000000}
              max={10000000}
              step={50000}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-[var(--fg-muted)]">
              <span>AED 7M (Min)</span>
              <span>AED 10M (Max)</span>
            </div>
          </div>

          <div className="rounded-lg bg-[var(--bg-secondary)] p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--fg-secondary)]">AI Recommended</span>
              <span className="font-bold text-success">AED {aiRecommended.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--fg-secondary)]">Your Price</span>
              <span className="font-semibold text-[var(--fg)]">AED {sliderValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--fg-secondary)]">Potential Uplift</span>
              <span className={`font-bold ${Number(upliftPct) >= 0 ? 'text-success' : 'text-danger'}`}>
                {Number(upliftPct) >= 0 ? '+' : ''}{upliftPct}%
              </span>
            </div>
            <button className="w-full mt-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
              Apply AI Price
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
