'use client';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Building2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import Link from 'next/link';

const mockProjects = [
  { id: 'proj-001', name: 'Skyline Residences', location: 'Dubai Marina, UAE', type: 'Residential Tower', units: 120, sold: 48, reserved: 18, completionDate: '2026-06-30', status: 'active', value: 850000000, currency: 'AED', progress: 65 },
  { id: 'proj-002', name: 'Palm Gardens', location: 'Palm Jumeirah, UAE', type: 'Villa Complex', units: 24, sold: 8, reserved: 4, completionDate: '2025-12-31', status: 'active', value: 320000000, currency: 'AED', progress: 82 },
  { id: 'proj-003', name: 'Downtown Retail Hub', location: 'Downtown Dubai, UAE', type: 'Commercial', units: 32, sold: 12, reserved: 6, completionDate: '2027-03-31', status: 'planning', value: 180000000, currency: 'AED', progress: 20 },
];

const statusBadge: Record<string, 'success' | 'info' | 'default'> = {
  active: 'success',
  planning: 'info',
  completed: 'default',
};

export default function ProjectsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Developer Projects"
        description="Manage your real estate development projects"
        actions={
          <Link
            href="/developer/projects/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((proj) => {
          const available = proj.units - proj.sold - proj.reserved;
          const soldPct = Math.round((proj.sold / proj.units) * 100);
          return (
            <div key={proj.id} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 flex flex-col gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[var(--fg)]">{proj.name}</h3>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[var(--fg-muted)]">
                    <MapPin className="h-3 w-3" />
                    {proj.location}
                  </div>
                </div>
                <Badge variant={statusBadge[proj.status] ?? 'default'}>
                  {proj.status.charAt(0).toUpperCase() + proj.status.slice(1)}
                </Badge>
              </div>

              {/* Type */}
              <div className="flex items-center gap-2 text-sm text-[var(--fg-secondary)]">
                <Building2 className="h-4 w-4 text-[var(--fg-muted)]" />
                {proj.type}
              </div>

              {/* Units Breakdown */}
              <div className="rounded-lg bg-[var(--bg-secondary)] p-3">
                <p className="text-xs font-medium text-[var(--fg-muted)] mb-2">Unit Breakdown</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-success">{proj.sold}</p>
                    <p className="text-xs text-[var(--fg-muted)]">Sold</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-warning">{proj.reserved}</p>
                    <p className="text-xs text-[var(--fg-muted)]">Reserved</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[var(--fg)]">{available}</p>
                    <p className="text-xs text-[var(--fg-muted)]">Available</p>
                  </div>
                </div>
              </div>

              {/* Construction Progress */}
              <div>
                <div className="flex justify-between text-xs text-[var(--fg-secondary)] mb-1">
                  <span>Construction Progress</span>
                  <span className="font-medium">{proj.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className="h-2 rounded-full bg-primary-500"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>

              {/* Value & Date */}
              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-xs text-[var(--fg-muted)]">Total Value</p>
                  <p className="font-semibold text-[var(--fg)]">
                    {formatCurrency({ amount: proj.value, currency: proj.currency as 'AED' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1 justify-end">
                    <Calendar className="h-3 w-3" /> Completion
                  </p>
                  <p className="text-sm text-[var(--fg)]">{proj.completionDate}</p>
                </div>
              </div>

              {/* View Link */}
              <Link
                href={`/developer/projects/${proj.id}`}
                className="block text-center py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                View Project
              </Link>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
