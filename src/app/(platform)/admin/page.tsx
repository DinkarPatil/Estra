'use client';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { ChartCard } from '@/components/data-display/chart-card';
import { DataTable, type Column } from '@/components/data-display/data-table';
import { Badge } from '@/components/ui/badge';
import { Users, Activity, Server, Brain, CheckCircle } from 'lucide-react';
import { systemMetrics, recentAuditLogs } from '@/mock-data/market-data';
import { formatNumber, formatRelativeTime } from '@/lib/formatters';

const services = [
  { name: 'API Gateway', status: 'healthy', uptime: '99.99%', latency: '45ms' },
  { name: 'ML Engine', status: 'healthy', uptime: '99.95%', latency: '230ms' },
  { name: 'PostgreSQL', status: 'healthy', uptime: '99.99%', latency: '12ms' },
  { name: 'Redis Cache', status: 'healthy', uptime: '99.97%', latency: '3ms' },
  { name: 'Search Engine', status: 'healthy', uptime: '99.98%', latency: '85ms' },
  { name: 'Notification Service', status: 'degraded', uptime: '98.50%', latency: '520ms' },
];

const auditColumns: Column<typeof recentAuditLogs[0]>[] = [
  { key: 'user', header: 'User', sortable: true },
  { key: 'action', header: 'Action' },
  { key: 'target', header: 'Target' },
  { key: 'timestamp', header: 'Time', render: (item) => formatRelativeTime(item.timestamp) },
  { key: 'severity', header: 'Severity', render: (item) => (
    <Badge variant={item.severity === 'warning' ? 'warning' : 'info'}>
      {item.severity}
    </Badge>
  )},
];

export default function AdminDashboard() {
  return (
    <PageContainer>
      <PageHeader title="Platform Administration" description="System overview and monitoring" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={formatNumber(systemMetrics.totalUsers)} change={5.2} changeLabel="this month" icon={Users} />
        <StatCard title="Active Sessions" value={String(systemMetrics.activeSessionsNow)} icon={Activity} iconColor="text-[#8B7355]" />
        <StatCard title="System Uptime" value={`${systemMetrics.systemUptime}%`} icon={Server} iconColor="text-info" />
        <StatCard title="AI Requests Today" value={formatNumber(systemMetrics.aiRequestsToday)} icon={Brain} iconColor="text-role-admin" />
      </div>

      {/* System Health */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--fg)]">System Health</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center gap-3 rounded-xl border border-[var(--border)] premium-card p-4 shadow-card">
              <CheckCircle className={`h-5 w-5 ${svc.status === 'healthy' ? 'text-[#8B7355]' : 'text-warning'}`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--fg)]">{svc.name}</p>
                <p className="text-xs text-[var(--fg-muted)]">{svc.uptime} uptime · {svc.latency}</p>
              </div>
              <Badge variant={svc.status === 'healthy' ? 'success' : 'warning'}>{svc.status}</Badge>
            </div>
          ))}
        </div>
      </div>

      <ChartCard title="Recent Audit Logs" subtitle="Latest platform activity">
        <DataTable columns={auditColumns as any} data={recentAuditLogs as any} keyField="id" />
      </ChartCard>
    </PageContainer>
  );
}
