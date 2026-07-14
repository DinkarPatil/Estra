'use client';
import { use } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { DataTable, type Column } from '@/components/data-display/data-table';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const mockProjects = [
  { id: 'proj-001', name: 'Skyline Residences' },
  { id: 'proj-002', name: 'Palm Gardens' },
  { id: 'proj-003', name: 'Downtown Retail Hub' },
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

type InventoryItem = typeof mockInventory[number];

const columns: Column<Record<string, unknown>>[] = [
  { key: 'unit', header: 'Unit', sortable: true },
  { key: 'project', header: 'Project', sortable: true },
  {
    key: 'type',
    header: 'Type',
    render: (item) => {
      const inv = item as unknown as InventoryItem;
      return <Badge variant="default">{inv.type}</Badge>;
    },
  },
  { key: 'floor', header: 'Floor', sortable: true },
  {
    key: 'area',
    header: 'Area (sqft)',
    sortable: true,
    render: (item) => {
      const inv = item as unknown as InventoryItem;
      return inv.area.toLocaleString();
    },
  },
  {
    key: 'price',
    header: 'Price',
    sortable: true,
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

export default function ProjectUnitsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const project = mockProjects.find((p) => p.id === id) ?? mockProjects[0];
  const units = mockInventory.filter((u) => u.projectId === project.id);

  return (
    <PageContainer>
      <PageHeader
        title={`Units — ${project.name}`}
        description={`Manage units for ${project.name}`}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/developer/projects/${project.id}`}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              Back to Project
            </Link>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors">
              <Plus className="h-4 w-4" />
              Add Unit
            </button>
          </div>
        }
      />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
        <div className="mb-4 flex items-center gap-4 text-sm text-[var(--fg-secondary)]">
          <span>{units.length} unit{units.length !== 1 ? 's' : ''} in this project</span>
          <span>·</span>
          <span className="text-success">{units.filter((u) => u.status === 'available').length} available</span>
          <span>·</span>
          <span className="text-warning">{units.filter((u) => u.status === 'reserved').length} reserved</span>
          <span>·</span>
          <span className="text-[var(--fg-muted)]">{units.filter((u) => u.status === 'sold').length} sold</span>
        </div>
        <DataTable
          columns={columns as any}
          data={units as unknown as Record<string, unknown>[]}
          keyField="id"
          emptyMessage="No units found for this project"
        />
      </div>
    </PageContainer>
  );
}
