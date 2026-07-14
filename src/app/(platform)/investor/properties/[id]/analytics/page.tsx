'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { ChartCard } from '@/components/data-display/chart-card';
import { StatCard } from '@/components/data-display/stat-card';
import { useProperty } from '@/hooks/use-properties';
import { TrendingUp, DollarSign, BarChart3, Calendar } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const projectionData = [
  { year: 'Year 1', value: 100, rental: 4.8, total: 12.0 },
  { year: 'Year 2', value: 108, rental: 5.1, total: 13.1 },
  { year: 'Year 3', value: 116, rental: 5.5, total: 14.5 },
  { year: 'Year 5', value: 135, rental: 6.2, total: 17.4 },
  { year: 'Year 10', value: 195, rental: 8.1, total: 26.8 },
];

const cashflowData = [
  { month: 'Jan', income: 18000, expense: 3200, net: 14800 },
  { month: 'Feb', income: 18000, expense: 2800, net: 15200 },
  { month: 'Mar', income: 18000, expense: 4100, net: 13900 },
  { month: 'Apr', income: 18000, expense: 3000, net: 15000 },
  { month: 'May', income: 18000, expense: 2900, net: 15100 },
  { month: 'Jun', income: 18000, expense: 3500, net: 14500 },
];

export default function PropertyAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { property, loading, error } = useProperty(id);

  if (loading) {
    return (
      <PageContainer>
        <div className="py-16 text-center text-sm text-[var(--fg-muted)]">Loading property...</div>
      </PageContainer>
    );
  }
  if (error || !property) {
    return (
      <PageContainer>
        <div className="py-16 text-center">
          <p className="text-[var(--fg)] font-medium">Couldn&apos;t load property</p>
          <p className="text-xs text-[var(--fg-muted)] mt-1">{error || 'Not found'}</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Investment Analytics"
        description={property.title}
        actions={<button onClick={() => router.back()} className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg)]">← Back</button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Rental Yield" value={`${property.rentalYield}%`} change={0.3} changeLabel="vs market" icon={TrendingUp} iconColor="text-emerald-500" />
        <StatCard title="Capital Appreciation" value={`+${property.capitalAppreciation}%`} change={1.2} changeLabel="annual" icon={BarChart3} iconColor="text-stone-500" />
        <StatCard title="5-Year ROI" value="74.5%" icon={DollarSign} iconColor="text-stone-500" />
        <StatCard title="Payback Period" value="12.4 yrs" icon={Calendar} iconColor="text-amber-500" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Value Appreciation (10 Years)" subtitle="Indexed to purchase price = 100">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B7355" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B7355" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
              <Tooltip formatter={(v) => [`${Number(v)}`, 'Index']} />
              <Area type="monotone" dataKey="value" stroke="#8B7355" strokeWidth={2} fill="url(#valGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Cash Flow" subtitle="Income vs expenses (INR)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={cashflowData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--fg-muted)" tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
              <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[3, 3, 0, 0]} name="Expense" />
              <Bar dataKey="net" fill="#8B7355" radius={[3, 3, 0, 0]} name="Net" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ROI breakdown */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card">
        <h3 className="font-semibold text-[var(--fg)] mb-4">10-Year Projection Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Period', 'Property Value', 'Rental Yield', 'Total Return'].map(h => (
                  <th key={h} className="pb-3 text-left font-medium text-[var(--fg-secondary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {projectionData.map(row => (
                <tr key={row.year}>
                  <td className="py-3 text-[var(--fg)]">{row.year}</td>
                  <td className="py-3 text-stone-600 font-medium">{row.value}x</td>
                  <td className="py-3 text-emerald-600">{row.rental}%</td>
                  <td className="py-3 font-bold text-[var(--fg)]">{row.total}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
