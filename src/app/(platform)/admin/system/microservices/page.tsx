'use client';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';

interface Microservice {
  name: string;
  status: 'operational' | 'degraded' | 'maintenance';
  version: string;
  lastDeploy: string;
  instances: number;
  cpu: number;
  memory: number;
}

const microservices: Microservice[] = [
  { name: 'AGI Cognition', status: 'operational', version: 'v4.2.1', lastDeploy: '2025-01-27 03:00', instances: 4, cpu: 58, memory: 72 },
  { name: 'Property Graph', status: 'operational', version: 'v3.1.0', lastDeploy: '2025-01-26 18:30', instances: 3, cpu: 34, memory: 55 },
  { name: 'Investment Analytics', status: 'operational', version: 'v2.8.4', lastDeploy: '2025-01-25 12:00', instances: 2, cpu: 41, memory: 48 },
  { name: 'Digital Twin', status: 'maintenance', version: 'v1.5.0', lastDeploy: '2025-01-20 08:00', instances: 0, cpu: 0, memory: 0 },
  { name: 'Negotiation Engine', status: 'operational', version: 'v2.1.3', lastDeploy: '2025-01-27 09:15', instances: 2, cpu: 29, memory: 44 },
  { name: 'Legal Compliance', status: 'operational', version: 'v1.9.2', lastDeploy: '2025-01-24 14:00', instances: 2, cpu: 18, memory: 36 },
  { name: 'Transaction Engine', status: 'operational', version: 'v3.4.0', lastDeploy: '2025-01-28 01:00', instances: 4, cpu: 52, memory: 68 },
  { name: 'Lending Engine', status: 'operational', version: 'v2.2.1', lastDeploy: '2025-01-26 20:00', instances: 2, cpu: 31, memory: 42 },
  { name: 'Fractional Ownership', status: 'operational', version: 'v1.7.5', lastDeploy: '2025-01-25 16:45', instances: 2, cpu: 24, memory: 38 },
  { name: 'Asset Management', status: 'operational', version: 'v2.0.2', lastDeploy: '2025-01-27 11:30', instances: 3, cpu: 37, memory: 51 },
  { name: 'UHNI Concierge', status: 'operational', version: 'v1.3.0', lastDeploy: '2025-01-23 10:00', instances: 1, cpu: 12, memory: 28 },
  { name: 'Institutional Module', status: 'operational', version: 'v2.5.1', lastDeploy: '2025-01-26 06:00', instances: 2, cpu: 22, memory: 40 },
  { name: 'Broker Platform', status: 'operational', version: 'v3.0.4', lastDeploy: '2025-01-28 00:30', instances: 3, cpu: 44, memory: 59 },
  { name: 'API Ecosystem', status: 'operational', version: 'v4.1.2', lastDeploy: '2025-01-27 22:00', instances: 4, cpu: 61, memory: 74 },
  { name: 'Data Analytics', status: 'operational', version: 'v2.3.0', lastDeploy: '2025-01-25 08:00', instances: 2, cpu: 47, memory: 63 },
  { name: 'AI Core', status: 'operational', version: 'v5.0.1', lastDeploy: '2025-01-28 02:00', instances: 6, cpu: 71, memory: 80 },
  { name: 'Security Module', status: 'operational', version: 'v3.2.0', lastDeploy: '2025-01-24 20:00', instances: 2, cpu: 15, memory: 32 },
  { name: 'Infrastructure', status: 'operational', version: 'v1.8.3', lastDeploy: '2025-01-22 04:00', instances: 3, cpu: 28, memory: 45 },
];

const statusVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
  operational: 'success',
  degraded: 'warning',
  maintenance: 'secondary',
};

const statusDot: Record<string, string> = {
  operational: 'bg-green-500',
  degraded: 'bg-amber-400',
  maintenance: 'bg-gray-400',
};

export default function MicroservicesPage() {
  const operational = microservices.filter((m) => m.status === 'operational').length;
  const degraded = microservices.filter((m) => m.status === 'degraded').length;
  const maintenance = microservices.filter((m) => m.status === 'maintenance').length;

  return (
    <PageContainer>
      <PageHeader
        title="Microservices"
        description="All 18 platform modules status"
      />

      {/* Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />
          <span className="font-medium text-[var(--fg)]">Operational: {operational}</span>
        </div>
        {degraded > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
            <span className="font-medium text-warning">Degraded: {degraded}</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-400 inline-block" />
          <span className="font-medium text-[var(--fg-secondary)]">Maintenance: {maintenance}</span>
        </div>
      </div>

      {/* Microservice Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {microservices.map((svc) => (
          <div
            key={svc.name}
            className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full inline-block ${statusDot[svc.status]}`} />
                <span className="text-sm font-semibold text-[var(--fg)]">{svc.name}</span>
              </div>
              <Badge variant={statusVariant[svc.status]}>
                {svc.status.charAt(0).toUpperCase() + svc.status.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[var(--fg-muted)] mb-4">
              <span>Version: <span className="text-[var(--fg-secondary)] font-medium">{svc.version}</span></span>
              <span>Instances: <span className="text-[var(--fg-secondary)] font-medium">{svc.instances}</span></span>
              <span className="col-span-2">Last Deploy: <span className="text-[var(--fg-secondary)] font-medium">{svc.lastDeploy}</span></span>
            </div>

            {svc.status !== 'maintenance' ? (
              <div className="space-y-2">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-[var(--fg-muted)]">CPU</span>
                    <span className="text-[var(--fg-secondary)]">{svc.cpu}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-tertiary)]">
                    <div
                      className={`h-2 rounded-full ${svc.cpu > 70 ? 'bg-amber-400' : 'bg-primary-500'}`}
                      style={{ width: `${svc.cpu}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-[var(--fg-muted)]">Memory</span>
                    <span className="text-[var(--fg-secondary)]">{svc.memory}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-tertiary)]">
                    <div
                      className={`h-2 rounded-full ${svc.memory > 75 ? 'bg-amber-400' : 'bg-stone-500'}`}
                      style={{ width: `${svc.memory}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--fg-muted)] text-center">
                Scheduled maintenance in progress
              </div>
            )}
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
