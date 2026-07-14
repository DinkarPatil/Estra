'use client';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { ChartCard } from '@/components/data-display/chart-card';
import { DataTable, type Column } from '@/components/data-display/data-table';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import { DollarSign, Package, TrendingUp, Layers } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const monthlyRevenue = [
  { month: 'Jan', revenue: 8000000 },
  { month: 'Feb', revenue: 11000000 },
  { month: 'Mar', revenue: 9500000 },
  { month: 'Apr', revenue: 14000000 },
  { month: 'May', revenue: 12500000 },
  { month: 'Jun', revenue: 16000000 },
  { month: 'Jul', revenue: 13000000 },
  { month: 'Aug', revenue: 18000000 },
  { month: 'Sep', revenue: 15500000 },
  { month: 'Oct', revenue: 22000000 },
  { month: 'Nov', revenue: 19000000 },
  { month: 'Dec', revenue: 28000000 },
];

const unitsByProject = [
  { project: 'Skyline', units: 48 },
  { project: 'Palm Gardens', units: 8 },
  { project: 'Downtown', units: 12 },
];

const revenueByType = [
  { name: 'Residential', value: 65 },
  { name: 'Commercial', value: 25 },
  { name: 'Retail', value: 10 },
];

const PIE_COLORS = ['#F97316', '#8B7355', '#22C55E'];

const topBuyers = [
  { id: 'buyer-001', name: 'Khalid Al Mansoori', unitsPurchased: 3, totalValue: 24600000, preferredType: 'Penthouse' },
  { id: 'buyer-002', name: 'Priya Investments LLC', unitsPurchased: 5, totalValue: 18500000, preferredType: 'Apartment' },
  { id: 'buyer-003', name: 'James & Sarah Thornton', unitsPurchased: 2, totalValue: 22000000, preferredType: 'Villa' },
];

type BuyerRow = typeof topBuyers[number];

const buyerColumns: Column<Record<string, unknown>>[] = [
  { key: 'name', header: 'Buyer Name', sortable: true },
  { key: 'unitsPurchased', header: 'Units Purchased', sortable: true },
  {
    key: 'totalValue',
    header: 'Total Value',
    sortable: true,
    render: (item) => {
      const b = item as unknown as BuyerRow;
      return formatCurrency({ amount: b.totalValue, currency: 'AED' });
    },
  },
  { key: 'preferredType', header: 'Preferred Type' },
];

export default function AnalyticsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Developer Analytics"
        description="Comprehensive development performance analytics"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue YTD" value="AED 156M" icon={DollarSign} change={24} changeLabel="YoY" iconColor="text-success" />
        <StatCard title="Units Sold YTD" value="69" icon={Package} change={15.3} changeLabel="vs last year" iconColor="text-info" />
        <StatCard title="Sales Growth" value="+24%" icon={TrendingUp} change={24} changeLabel="YoY" iconColor="text-success" />
        <StatCard title="Pipeline Value" value="AED 850M" icon={Layers} iconColor="text-warning" />
      </div>

      {/* Revenue Area Chart */}
      <ChartCard title="Monthly Revenue" subtitle="Jan – Dec 2025 (AED)">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyRevenue}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="var(--fg-muted)"
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
            />
            <Tooltip formatter={(v) => [`AED ${(Number(v) / 1000000).toFixed(1)}M`, 'Revenue']} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#F97316"
              strokeWidth={2}
              fill="url(#revGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Units per Project */}
        <ChartCard title="Units Sold by Project" subtitle="All time">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={unitsByProject}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="project" tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--fg-muted)" allowDecimals={false} />
              <Tooltip formatter={(v) => [`${Number(v)} units`, 'Sold']} />
              <Bar dataKey="units" fill="#8B7355" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue by Type */}
        <ChartCard title="Revenue by Property Type" subtitle="Percentage breakdown">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={revenueByType}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {revenueByType.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${Number(v)}%`, 'Share']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-[var(--fg)]">Top Buyers</h2>
        <DataTable
          columns={buyerColumns as any}
          data={topBuyers as unknown as Record<string, unknown>[]}
          keyField="id"
        />
      </div>
    </PageContainer>
  );
}
