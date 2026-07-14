'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign, TrendingUp, Building2, Users,
  CheckCircle2, Clock, AlertCircle, FileText,
  Shield, ClipboardList, BarChart3, ArrowLeft, Search,
} from 'lucide-react';
import { mockPortfolioAssets, type PortfolioAsset } from '@/mock-data/portfolio';
import { formatCurrency, formatDate } from '@/lib/formatters';

function statusVariant(status: PortfolioAsset['status']) {
  switch (status) {
    case 'rented': return 'success';
    case 'vacant': return 'danger';
    case 'listed': return 'warning';
    case 'managed': return 'info';
  }
}

const mockMaintenanceTasks = [
  { id: 1, title: 'HVAC System Service', description: 'Annual maintenance check for air conditioning units', status: 'pending', dueDate: '2026-04-15', priority: 'medium' },
  { id: 2, title: 'Plumbing Inspection', description: 'Routine inspection of all plumbing fixtures', status: 'in-progress', dueDate: '2026-04-10', priority: 'high' },
  { id: 3, title: 'Exterior Painting', description: 'Repaint exterior walls and touch-up balcony railings', status: 'completed', dueDate: '2026-03-30', priority: 'low' },
];

const mockDocuments = [
  { id: 1, name: 'Lease Agreement', type: 'Lease', size: '2.4 MB', date: '2024-11-01', status: 'signed' },
  { id: 2, name: 'Property Insurance Policy', type: 'Insurance', size: '1.8 MB', date: '2024-10-15', status: 'active' },
  { id: 3, name: 'Independent Valuation Report', type: 'Valuation', size: '5.1 MB', date: '2024-09-20', status: 'verified' },
  { id: 4, name: 'Title Deed', type: 'Legal', size: '890 KB', date: '2024-10-30', status: 'signed' },
];

const mockFinancials = {
  income: [
    { label: 'Monthly Rental Income', amount: 18000, currency: 'USD' as const },
    { label: 'Parking Fee', amount: 500, currency: 'USD' as const },
    { label: 'Service Charge Recovered', amount: 80, currency: 'USD' as const },
  ],
  expenses: [
    { label: 'Property Management Fee', amount: 900, currency: 'USD' as const },
    { label: 'Maintenance Reserve', amount: 450, currency: 'USD' as const },
    { label: 'Insurance Premium', amount: 280, currency: 'USD' as const },
    { label: 'Property Tax', amount: 620, currency: 'USD' as const },
  ],
};

type TabId = 'overview' | 'financials' | 'maintenance' | 'documents';

export default function PortfolioAssetDetailPage() {
  const params = useParams<{ id: string }>();
  const { id } = params;
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const asset = mockPortfolioAssets.find((a) => a.id === id);

  if (!asset) {
    return (
      <PageContainer>
        <div className="empty-state-wrapper">
          {/* Background radial glow */}
          <div className="empty-state-glow" aria-hidden="true" />

          <div className="empty-state-content">
            {/* Icon */}
            <div className="empty-state-icon-ring">
              <div className="empty-state-icon-inner">
                <Building2 className="h-7 w-7" strokeWidth={1.5} />
              </div>
            </div>

            {/* Text */}
            <h2 className="text-[22px] font-semibold text-[var(--fg)] tracking-[-0.01em] mt-6">
              Asset not found
            </h2>
            <p className="text-[14px] text-[var(--fg-muted)] mt-2 max-w-[340px] leading-relaxed">
              This asset may have been removed or the link is incorrect. You can explore your portfolio or add a new asset.
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-7">
              <Link
                href="/investor/properties"
                className="c-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-[13px] cursor-pointer rounded-xl"
              >
                <Search className="h-4 w-4" strokeWidth={1.5} />
                Browse Properties
              </Link>
              <Link
                href="/investor/portfolio"
                className="c-btn-secondary inline-flex items-center gap-2 px-5 py-2.5 text-[13px] cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                Back to Portfolio
              </Link>
            </div>

            {/* Help hint */}
            <p className="text-[11px] text-[var(--fg-muted)] mt-8 opacity-60">
              Need help? Contact your portfolio advisor or reach out to support.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const totalIncome = mockFinancials.income.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = mockFinancials.expenses.reduce((s, e) => s + e.amount, 0);
  const netCashflow = totalIncome - totalExpenses;

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'financials', label: 'Financials', icon: BarChart3 },
    { id: 'maintenance', label: 'Maintenance', icon: ClipboardList },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <PageContainer>
      <div className="mb-2">
        <Link
          href="/investor/portfolio"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Portfolio
        </Link>
      </div>

      <PageHeader
        title={asset.title}
        description={asset.location}
        actions={<Badge variant={statusVariant(asset.status)}>{asset.status}</Badge>}
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Value"
          value={formatCurrency(asset.currentValue)}
          change={asset.appreciation}
          changeLabel="appreciation"
          icon={Building2}
        />
        <StatCard
          title="Monthly Rental"
          value={asset.monthlyRental ? formatCurrency(asset.monthlyRental) : 'N/A'}
          icon={DollarSign}
          iconColor="text-[#8B7355]"
        />
        <StatCard
          title="ROI"
          value={`${asset.roi}%`}
          change={asset.roi}
          changeLabel="annual"
          icon={TrendingUp}
          iconColor="text-info"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${asset.occupancyRate}%`}
          icon={Users}
          iconColor="text-warning"
        />
      </div>

      {/* Tabs */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card overflow-hidden">
        {/* Tab Nav */}
        <div className="flex border-b border-[var(--border)] overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-[#8B7355] text-[#8B7355] bg-[rgba(139,115,85,0.06)]/50'
                    : 'border-transparent text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { label: 'Purchase Date', value: formatDate(asset.purchaseDate) },
                { label: 'Purchase Price', value: formatCurrency(asset.purchasePrice) },
                { label: 'Current Value', value: formatCurrency(asset.currentValue) },
                { label: 'Appreciation', value: `+${asset.appreciation}%` },
                { label: 'Property Type', value: asset.type },
                { label: 'Status', value: asset.status.charAt(0).toUpperCase() + asset.status.slice(1) },
                { label: 'Tenant', value: asset.tenantName ?? '—' },
                { label: 'Lease Expiry', value: asset.leaseExpiry ? formatDate(asset.leaseExpiry) : '—' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
                >
                  <span className="text-xs text-[var(--fg-muted)]">{item.label}</span>
                  <span className="text-sm font-semibold text-[var(--fg)]">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Financials Tab */}
          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-center">
                  <p className="text-xs text-[var(--fg-muted)] mb-1">Total Income</p>
                  <p className="text-xl font-bold text-[#8B7355]">${totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-[var(--fg-muted)]">per month</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-center">
                  <p className="text-xs text-[var(--fg-muted)] mb-1">Total Expenses</p>
                  <p className="text-xl font-bold text-danger">${totalExpenses.toLocaleString()}</p>
                  <p className="text-xs text-[var(--fg-muted)]">per month</p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-center">
                  <p className="text-xs text-[var(--fg-muted)] mb-1">Net Cashflow</p>
                  <p className="text-xl font-bold text-[#8B7355]">${netCashflow.toLocaleString()}</p>
                  <p className="text-xs text-[var(--fg-muted)]">per month</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--fg)] mb-3">Income Breakdown</h3>
                  <div className="space-y-2">
                    {mockFinancials.income.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5">
                        <span className="text-sm text-[var(--fg-secondary)]">{item.label}</span>
                        <span className="text-sm font-semibold text-[#8B7355]">${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--fg)] mb-3">Expense Breakdown</h3>
                  <div className="space-y-2">
                    {mockFinancials.expenses.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5">
                        <span className="text-sm text-[var(--fg-secondary)]">{item.label}</span>
                        <span className="text-sm font-semibold text-danger">${item.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-[rgba(139,115,85,0.15)] bg-[rgba(139,115,85,0.06)]/50 p-4">
                <p className="text-sm font-medium text-[var(--fg)]">Projected Annual Cashflow</p>
                <p className="text-2xl font-bold text-[#8B7355] mt-1">${(netCashflow * 12).toLocaleString()}</p>
                <p className="text-xs text-[var(--fg-muted)] mt-1">Based on current monthly figures</p>
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--fg-secondary)]">{asset.maintenanceDue} tasks pending</p>
                <button className="c-btn-primary px-3 py-1.5 text-xs cursor-pointer">
                  + Add Task
                </button>
              </div>
              {mockMaintenanceTasks.map((task) => {
                const statusIcon = task.status === 'completed'
                  ? <CheckCircle2 className="h-5 w-5 text-[#8B7355]" />
                  : task.status === 'in-progress'
                  ? <Clock className="h-5 w-5 text-warning" />
                  : <AlertCircle className="h-5 w-5 text-[var(--fg-muted)]" />;

                const priorityVariant = task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'secondary';

                return (
                  <div key={task.id} className="flex items-start gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                    {statusIcon}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-[var(--fg)]">{task.title}</h3>
                        <Badge variant={priorityVariant}>{task.priority} priority</Badge>
                        <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in-progress' ? 'warning' : 'secondary'}>
                          {task.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--fg-muted)] mt-1">{task.description}</p>
                      <p className="text-xs text-[var(--fg-muted)] mt-1">Due: {formatDate(task.dueDate)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              {mockDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(139,115,85,0.1)] text-[#8B7355] shrink-0">
                    {doc.type === 'Legal' || doc.type === 'Lease' ? <Shield className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg)]">{doc.name}</p>
                    <p className="text-xs text-[var(--fg-muted)]">{doc.type} · {doc.size} · {formatDate(doc.date)}</p>
                  </div>
                  <Badge variant={doc.status === 'signed' ? 'success' : doc.status === 'active' ? 'info' : 'secondary'}>
                    {doc.status}
                  </Badge>
                  <button className="text-xs text-[#8B7355] hover:underline whitespace-nowrap">
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
