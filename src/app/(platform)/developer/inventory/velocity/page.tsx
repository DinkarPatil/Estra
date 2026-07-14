'use client';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { ChartCard } from '@/components/data-display/chart-card';
import { DataTable, type Column } from '@/components/data-display/data-table';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { TrendingUp, Package, Clock, DollarSign } from 'lucide-react';

const monthlySales = [
  { month: 'Jan', units: 0 },
  { month: 'Feb', units: 0 },
  { month: 'Mar', units: 1 },
  { month: 'Apr', units: 0 },
  { month: 'May', units: 0 },
  { month: 'Jun', units: 0 },
];

const cumulativeRevenue = [
  { month: 'Jan', revenue: 0 },
  { month: 'Feb', revenue: 0 },
  { month: 'Mar', revenue: 2100000 },
  { month: 'Apr', revenue: 2100000 },
  { month: 'May', revenue: 2100000 },
  { month: 'Jun', revenue: 2100000 },
];

const projectVelocity = [
  { id: 'v-001', project: 'Skyline Residences', totalUnits: 120, sold: 48, available: 54, absorptionRate: '40.0%' },
  { id: 'v-002', project: 'Palm Gardens', totalUnits: 24, sold: 8, available: 12, absorptionRate: '33.3%' },
  { id: 'v-003', project: 'Downtown Retail Hub', totalUnits: 32, sold: 12, available: 14, absorptionRate: '37.5%' },
];

type VelocityRow = typeof projectVelocity[number];

const columns: Column<Record<string, unknown>>[] = [
  { key: 'project', header: 'Project', sortable: true },
  { key: 'totalUnits', header: 'Total Units', sortable: true },
  { key: 'sold', header: 'Sold', sortable: true },
  { key: 'available', header: 'Available', sortable: true },
  {
    key: 'absorptionRate',
    header: 'Absorption Rate',
    render: (item) => {
      const row = item as unknown as VelocityRow;
      return <span className="font-semibold text-success">{row.absorptionRate}</span>;
    },
  },
];

export default function SalesVelocityPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Sales Velocity"
        description="Unit sales performance and absorption rate"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Units Sold" value="1" icon={Package} iconColor="text-success" />
        <StatCard title="Absorption Rate" value="16.7%" icon={TrendingUp} change={2.3} changeLabel="vs last period" iconColor="text-info" />
        <StatCard title="Avg Days to Sale" value="45" icon={Clock} iconColor="text-warning" />
        <StatCard title="Revenue Realized" value="AED 2.1M" icon={DollarSign} change={0} changeLabel="YTD" iconColor="text-success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Monthly Units Sold" subtitle="Jan – Jun 2026">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--fg-muted)" allowDecimals={false} />
              <Tooltip formatter={(v) => [`${Number(v)} units`, 'Sold']} />
              <Bar dataKey="units" fill="#F97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cumulative Revenue" subtitle="Jan – Jun 2026 (AED)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={cumulativeRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="var(--fg-muted)"
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip formatter={(v) => [`AED ${Number(v).toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#8B7355" strokeWidth={2} dot={{ fill: '#8B7355' }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-[var(--fg)]">Velocity by Project</h2>
        <DataTable
          columns={columns as any}
          data={projectVelocity as unknown as Record<string, unknown>[]}
          keyField="id"
        />
      </div>
    </PageContainer>
  );
}
