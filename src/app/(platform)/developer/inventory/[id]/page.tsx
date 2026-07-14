'use client';
import { use } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Maximize2, Layers, Tag, MapPin, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const mockInventory = [
  { id: 'inv-001', unit: 'Tower A - 4201', project: 'Skyline Residences', type: 'Penthouse', floor: 42, area: 3200, price: 8500000, currency: 'AED', status: 'available', bedrooms: 4 },
  { id: 'inv-002', unit: 'Tower A - 3101', project: 'Skyline Residences', type: 'Apartment', floor: 31, area: 1850, price: 3200000, currency: 'AED', status: 'reserved', bedrooms: 3 },
  { id: 'inv-003', unit: 'Tower B - 2001', project: 'Skyline Residences', type: 'Apartment', floor: 20, area: 1200, price: 2100000, currency: 'AED', status: 'sold', bedrooms: 2 },
  { id: 'inv-004', unit: 'Villa 01', project: 'Palm Gardens', type: 'Villa', floor: 0, area: 5500, price: 12000000, currency: 'AED', status: 'available', bedrooms: 5 },
  { id: 'inv-005', unit: 'Villa 02', project: 'Palm Gardens', type: 'Villa', floor: 0, area: 4800, price: 10500000, currency: 'AED', status: 'available', bedrooms: 4 },
  { id: 'inv-006', unit: 'Shop 01', project: 'Downtown Retail Hub', type: 'Retail', floor: 1, area: 800, price: 1800000, currency: 'AED', status: 'reserved', bedrooms: 0 },
];

const statusBadgeVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
  available: 'success',
  reserved: 'warning',
  sold: 'secondary',
};

const activityLog = [
  { id: 1, action: 'Unit created in inventory', date: '2025-10-01', user: 'System' },
  { id: 2, action: 'Price updated from AED 8,200,000 to current listing', date: '2025-11-15', user: 'Priya D.' },
  { id: 3, action: 'Reservation request received from potential buyer', date: '2026-01-22', user: 'Broker Portal' },
];

export default function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const unit = mockInventory.find((u) => u.id === id) ?? mockInventory[0];

  const pricePerSqft = Math.round(unit.price / unit.area);

  return (
    <PageContainer>
      <PageHeader
        title={unit.unit}
        description={unit.project}
        actions={
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors">
              Reserve Unit
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors">
              Update Price
            </button>
            <button className="px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors">
              View on Map
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Price"
          value={formatCurrency({ amount: unit.price, currency: unit.currency as 'AED' })}
          icon={DollarSign}
          iconColor="text-success"
        />
        <StatCard
          title="Area"
          value={`${unit.area.toLocaleString()} sqft`}
          icon={Maximize2}
          iconColor="text-info"
        />
        <StatCard
          title="Floor"
          value={unit.floor === 0 ? 'Ground' : `Floor ${unit.floor}`}
          icon={Layers}
          iconColor="text-warning"
        />
        <StatCard
          title="Status"
          value={unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
          icon={Tag}
          iconColor={unit.status === 'available' ? 'text-success' : unit.status === 'reserved' ? 'text-warning' : 'text-[var(--fg-muted)]'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Unit Specs */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-4">Unit Specifications</h2>
          <dl className="grid grid-cols-2 gap-4">
            {[
              { label: 'Type', value: unit.type },
              { label: 'Bedrooms', value: unit.bedrooms === 0 ? 'N/A' : unit.bedrooms },
              { label: 'Area', value: `${unit.area.toLocaleString()} sqft` },
              { label: 'Floor', value: unit.floor === 0 ? 'Ground' : unit.floor },
              {
                label: 'Status',
                value: (
                  <Badge variant={statusBadgeVariant[unit.status] ?? 'default'}>
                    {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                  </Badge>
                ),
              },
              { label: 'Project', value: unit.project },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wide">{label}</dt>
                <dd className="mt-1 text-sm font-semibold text-[var(--fg)]">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Price Analysis */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-4">Price Analysis</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--fg-secondary)]">List Price</span>
              <span className="text-sm font-semibold text-[var(--fg)]">
                {formatCurrency({ amount: unit.price, currency: unit.currency as 'AED' })}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--fg-secondary)]">Price / sqft</span>
              <span className="text-sm font-semibold text-[var(--fg)]">
                AED {pricePerSqft.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
              <span className="text-sm text-[var(--fg-secondary)]">Comparable Units Range</span>
              <span className="text-sm font-semibold text-[var(--fg)]">
                AED {(pricePerSqft * 0.92).toFixed(0)} – {(pricePerSqft * 1.08).toFixed(0)}/sqft
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-[var(--fg-secondary)]">AI Price Recommendation</span>
              <div className="flex items-center gap-2">
                <Badge variant="info">AI</Badge>
                <span className="text-sm font-semibold text-success">
                  {formatCurrency({ amount: Math.round(unit.price * 1.04), currency: unit.currency as 'AED' })}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-[var(--fg-muted)]">
            AI recommendation based on comparable sales, location demand, and market trends as of April 2026.
          </p>
        </div>
      </div>

      {/* Activity Log */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <h2 className="text-base font-semibold text-[var(--fg)] mb-4">Activity Log</h2>
        <ul className="space-y-4">
          {activityLog.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--fg)]">{entry.action}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                  <Calendar className="h-3 w-3" />
                  <span>{entry.date}</span>
                  <span>·</span>
                  <MapPin className="h-3 w-3" />
                  <span>{entry.user}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-start">
        <Link href="/developer/inventory" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">
          ← Back to Inventory
        </Link>
      </div>
    </PageContainer>
  );
}
