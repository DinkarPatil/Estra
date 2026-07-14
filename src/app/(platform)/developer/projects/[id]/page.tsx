'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { ChartCard } from '@/components/data-display/chart-card';
import { DataTable, type Column } from '@/components/data-display/data-table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Layers, TrendingUp, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';

const mockProjects = [
  { id: 'proj-001', name: 'Skyline Residences', location: 'Dubai Marina, UAE', type: 'Residential Tower', units: 120, sold: 48, reserved: 18, completionDate: '2026-06-30', status: 'active', value: 850000000, currency: 'AED', progress: 65, description: 'A premium 65-storey residential tower in the heart of Dubai Marina featuring world-class amenities, panoramic sea views, and smart home technology across 120 curated residences.' },
  { id: 'proj-002', name: 'Palm Gardens', location: 'Palm Jumeirah, UAE', type: 'Villa Complex', units: 24, sold: 8, reserved: 4, completionDate: '2025-12-31', status: 'active', value: 320000000, currency: 'AED', progress: 82, description: 'An exclusive gated community of 24 ultra-luxury villas on the iconic Palm Jumeirah, offering private beach access, lagoon pools, and bespoke landscaping.' },
  { id: 'proj-003', name: 'Downtown Retail Hub', location: 'Downtown Dubai, UAE', type: 'Commercial', units: 32, sold: 12, reserved: 6, completionDate: '2027-03-31', status: 'planning', value: 180000000, currency: 'AED', progress: 20, description: 'A flagship commercial retail destination in Downtown Dubai designed to attract premium brands, lifestyle concepts, and flagship stores across 32 curated retail units.' },
];

const mockInventory = [
  { id: 'inv-001', unit: 'Tower A - 4201', project: 'Skyline Residences', projectId: 'proj-001', type: 'Penthouse', floor: 42, area: 3200, price: 8500000, currency: 'AED', status: 'available', bedrooms: 4 },
  { id: 'inv-002', unit: 'Tower A - 3101', project: 'Skyline Residences', projectId: 'proj-001', type: 'Apartment', floor: 31, area: 1850, price: 3200000, currency: 'AED', status: 'reserved', bedrooms: 3 },
  { id: 'inv-003', unit: 'Tower B - 2001', project: 'Skyline Residences', projectId: 'proj-001', type: 'Apartment', floor: 20, area: 1200, price: 2100000, currency: 'AED', status: 'sold', bedrooms: 2 },
  { id: 'inv-004', unit: 'Villa 01', project: 'Palm Gardens', projectId: 'proj-002', type: 'Villa', floor: 0, area: 5500, price: 12000000, currency: 'AED', status: 'available', bedrooms: 5 },
  { id: 'inv-005', unit: 'Villa 02', project: 'Palm Gardens', projectId: 'proj-002', type: 'Villa', floor: 0, area: 4800, price: 10500000, currency: 'AED', status: 'available', bedrooms: 4 },
  { id: 'inv-006', unit: 'Shop 01', project: 'Downtown Retail Hub', projectId: 'proj-003', type: 'Retail', floor: 1, area: 800, price: 1800000, currency: 'AED', status: 'reserved', bedrooms: 0 },
];

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
  available: 'success',
  reserved: 'warning',
  sold: 'secondary',
};

const projectStatusBadge: Record<string, 'success' | 'info' | 'default'> = {
  active: 'success',
  planning: 'info',
  completed: 'default',
};

const PIE_COLORS = ['#22C55E', '#F59E0B', '#6B7280'];

const monthlySalesTrend = [
  { month: 'Oct', sold: 0 },
  { month: 'Nov', sold: 1 },
  { month: 'Dec', sold: 0 },
  { month: 'Jan', sold: 0 },
  { month: 'Feb', sold: 0 },
  { month: 'Mar', sold: 1 },
];

type InventoryItem = typeof mockInventory[number];

const unitColumns: Column<Record<string, unknown>>[] = [
  { key: 'unit', header: 'Unit', sortable: true },
  { key: 'type', header: 'Type' },
  { key: 'floor', header: 'Floor', sortable: true },
  {
    key: 'area',
    header: 'Area (sqft)',
    render: (item) => {
      const inv = item as unknown as InventoryItem;
      return inv.area.toLocaleString();
    },
  },
  {
    key: 'price',
    header: 'Price',
    render: (item) => {
      const inv = item as unknown as InventoryItem;
      return formatCurrency({ amount: inv.price, currency: inv.currency as 'AED' });
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (item) => {
      const inv = item as unknown as InventoryItem;
      return (
        <Badge variant={statusBadgeVariant[inv.status] ?? 'default'}>
          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
        </Badge>
      );
    },
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (item) => {
      const inv = item as unknown as InventoryItem;
      return (
        <Link
          href={`/developer/inventory/${inv.id}`}
          className="text-sm font-medium text-primary-600 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View
        </Link>
      );
    },
  },
];

const tabList = ['Overview', 'Units', 'Analytics'];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('Overview');

  const project = mockProjects.find((p) => p.id === id) ?? mockProjects[0];
  const projectUnits = mockInventory.filter((u) => u.projectId === project.id);

  const available = project.units - project.sold - project.reserved;
  const pieData = [
    { name: 'Available', value: available },
    { name: 'Reserved', value: project.reserved },
    { name: 'Sold', value: project.sold },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={project.name}
        description={project.location}
        actions={
          <div className="flex gap-2">
            <Badge variant={projectStatusBadge[project.status] ?? 'default'}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
            <Link
              href={`/developer/projects/${project.id}/units`}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Manage Units
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Value"
          value={formatCurrency({ amount: project.value, currency: project.currency as 'AED' })}
          icon={DollarSign}
          iconColor="text-success"
        />
        <StatCard
          title="Units Sold"
          value={`${project.sold} / ${project.units}`}
          icon={Layers}
          iconColor="text-info"
        />
        <StatCard
          title="Progress"
          value={`${project.progress}%`}
          icon={TrendingUp}
          iconColor="text-warning"
        />
        <StatCard
          title="Completion Date"
          value={project.completionDate}
          icon={Calendar}
          iconColor="text-[var(--fg-muted)]"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-0">
        {tabList.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h2 className="text-base font-semibold text-[var(--fg)] mb-2">Project Description</h2>
            <p className="text-sm text-[var(--fg-secondary)]">{project.description}</p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h2 className="text-base font-semibold text-[var(--fg)] mb-4">Key Specifications</h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: 'Type', value: project.type },
                { label: 'Total Units', value: project.units },
                { label: 'Sold', value: project.sold },
                { label: 'Reserved', value: project.reserved },
                { label: 'Available', value: available },
                { label: 'Status', value: project.status.charAt(0).toUpperCase() + project.status.slice(1) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wide">{label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-[var(--fg)]">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <div className="flex justify-between text-sm text-[var(--fg-secondary)] mb-2">
              <span className="font-medium">Construction Progress</span>
              <span className="font-bold text-[var(--fg)]">{project.progress}%</span>
            </div>
            <div className="h-4 rounded-full bg-[var(--bg-tertiary)]">
              <div
                className={`h-4 rounded-full ${project.progress >= 80 ? 'bg-success' : project.progress >= 50 ? 'bg-primary-500' : 'bg-warning'}`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--fg-muted)]">Estimated completion: {project.completionDate}</p>
          </div>
        </div>
      )}

      {/* Units Tab */}
      {activeTab === 'Units' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--fg)]">
              Units ({projectUnits.length} shown)
            </h2>
            <Link
              href={`/developer/projects/${project.id}/units`}
              className="text-sm text-primary-600 hover:underline"
            >
              View all units →
            </Link>
          </div>
          <DataTable
            columns={unitColumns as any}
            data={projectUnits as unknown as Record<string, unknown>[]}
            keyField="id"
            emptyMessage="No units found for this project"
          />
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'Analytics' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <ChartCard title="Unit Status Distribution" subtitle="Current snapshot">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${Number(v)} units`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="min-w-0">
            <ChartCard title="Monthly Sales Trend" subtitle="Oct 2025 – Mar 2026">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySalesTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--fg-muted)" />
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--fg-muted)" allowDecimals={false} />
                    <Tooltip formatter={(v) => [`${Number(v)} units`, 'Sold']} />
                    <Bar dataKey="sold" fill="#F97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
