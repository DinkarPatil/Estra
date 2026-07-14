'use client';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { ChartCard } from '@/components/data-display/chart-card';
import { DataTable, type Column } from '@/components/data-display/data-table';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { TrendingUp, MapPin, Zap, Target } from 'lucide-react';

const demandByArea = [
  { area: 'Dubai Marina', score: 92 },
  { area: 'Downtown', score: 88 },
  { area: 'Palm Jumeirah', score: 95 },
  { area: 'Business Bay', score: 75 },
  { area: 'JVC', score: 68 },
  { area: 'DIFC', score: 71 },
];

const getBarColor = (score: number) => {
  if (score >= 90) return '#22C55E';
  if (score >= 75) return '#F97316';
  return '#6B7280';
};

const demographicSegments = [
  { id: 'seg-001', segment: 'Investor — UHNI', share: '35%', demandScore: 94, trend: 'Rising' },
  { id: 'seg-002', segment: 'Investor — Retail', share: '28%', demandScore: 82, trend: 'Stable' },
  { id: 'seg-003', segment: 'End-User', share: '22%', demandScore: 76, trend: 'Rising' },
  { id: 'seg-004', segment: 'Corporate', share: '10%', demandScore: 61, trend: 'Declining' },
  { id: 'seg-005', segment: 'Other', share: '5%', demandScore: 45, trend: 'Stable' },
];

type DemoSegment = typeof demographicSegments[number];

const trendBadge: Record<string, 'success' | 'danger' | 'secondary'> = {
  Rising: 'success',
  Declining: 'danger',
  Stable: 'secondary',
};

const columns: Column<Record<string, unknown>>[] = [
  { key: 'segment', header: 'Segment', sortable: true },
  { key: 'share', header: 'Market Share' },
  {
    key: 'demandScore',
    header: 'Demand Score',
    sortable: true,
    render: (item) => {
      const seg = item as unknown as DemoSegment;
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-20 rounded-full bg-[var(--bg-tertiary)]">
            <div
              className="h-2 rounded-full bg-primary-500"
              style={{ width: `${seg.demandScore}%` }}
            />
          </div>
          <span className="text-sm font-medium text-[var(--fg)]">{seg.demandScore}</span>
        </div>
      );
    },
  },
  {
    key: 'trend',
    header: 'Trend',
    render: (item) => {
      const seg = item as unknown as DemoSegment;
      return <Badge variant={trendBadge[seg.trend] ?? 'default'}>{seg.trend}</Badge>;
    },
  },
];

export default function DemandPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Demand Analysis"
        description="AI-powered market demand intelligence"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Market Score" value="87 / 100" icon={Target} iconColor="text-success" change={4.2} changeLabel="vs last month" />
        <StatCard title="Hot Zones" value="3" icon={MapPin} iconColor="text-danger" />
        <StatCard title="Demand Change" value="+22%" icon={TrendingUp} change={22} changeLabel="YoY" iconColor="text-success" />
        <StatCard title="Predicted Absorption" value="78%" icon={Zap} iconColor="text-warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Demand Score by Area" subtitle="Dubai zones — April 2026">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={demandByArea} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
              <YAxis dataKey="area" type="category" tick={{ fontSize: 11 }} stroke="var(--fg-muted)" width={90} />
              <Tooltip formatter={(v) => [`${Number(v)}`, 'Demand Score']} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {demandByArea.map((entry, i) => (
                  <Cell key={i} fill={getBarColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Demand Heatmap Placeholder */}
        <ChartCard title="Demand Heatmap" subtitle="Geospatial demand overlay">
          <div className="relative h-[280px] rounded-lg overflow-hidden bg-[var(--bg-tertiary)] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/60 via-primary-700/30 to-success/20 rounded-lg" />
            <div className="relative z-10 text-center">
              <div className="text-4xl mb-3">🗺</div>
              <p className="text-sm font-semibold text-white drop-shadow">Interactive heatmap coming soon</p>
              <p className="text-xs text-white/70 mt-1">Powered by ESTRA GLIMMORA AI Engine</p>
            </div>
          </div>
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-4 text-base font-semibold text-[var(--fg)]">Buyer Demographic Segments</h2>
        <DataTable
          columns={columns as any}
          data={demographicSegments as unknown as Record<string, unknown>[]}
          keyField="id"
        />
      </div>
    </PageContainer>
  );
}
