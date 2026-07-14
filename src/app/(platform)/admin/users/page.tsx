'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { DataTable, type Column } from '@/components/data-display/data-table';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

const mockUsers = [
  { id: 'u-001', name: 'Sarah Chen', email: 'investor@glimmora.com', role: 'investor', status: 'active', joined: '2024-10-01', lastActive: '2025-01-28', deals: 3, country: 'Singapore' },
  { id: 'u-002', name: 'James Okafor', email: 'broker@glimmora.com', role: 'broker', status: 'active', joined: '2024-09-15', lastActive: '2025-01-28', deals: 8, country: 'Nigeria' },
  { id: 'u-003', name: 'Priya Sharma', email: 'developer@glimmora.com', role: 'developer', status: 'active', joined: '2024-08-01', lastActive: '2025-01-27', deals: 12, country: 'India' },
  { id: 'u-004', name: 'Alex Rivera', email: 'admin@glimmora.com', role: 'admin', status: 'active', joined: '2024-07-01', lastActive: '2025-01-28', deals: 0, country: 'USA' },
  { id: 'u-005', name: 'Mohammed Al-Farsi', email: 'mfarsi@email.com', role: 'investor', status: 'active', joined: '2024-11-10', lastActive: '2025-01-25', deals: 1, country: 'UAE' },
  { id: 'u-006', name: 'Elena Vasquez', email: 'evasquez@email.com', role: 'broker', status: 'suspended', joined: '2024-10-20', lastActive: '2025-01-10', deals: 2, country: 'Spain' },
  { id: 'u-007', name: 'David Kim', email: 'dkim@email.com', role: 'investor', status: 'pending', joined: '2025-01-20', lastActive: '2025-01-20', deals: 0, country: 'South Korea' },
];

const roleTabs = ['All', 'Investor', 'Broker', 'Developer', 'Admin'] as const;

type RoleTab = typeof roleTabs[number];

const roleVariant: Record<string, 'info' | 'default' | 'success' | 'warning'> = {
  investor: 'info',
  broker: 'default',
  developer: 'success',
  admin: 'warning',
};

const statusVariant: Record<string, 'success' | 'danger' | 'warning'> = {
  active: 'success',
  suspended: 'danger',
  pending: 'warning',
};

type MockUser = typeof mockUsers[0];

export default function UsersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RoleTab>('All');

  const filtered = activeTab === 'All'
    ? mockUsers
    : mockUsers.filter((u) => u.role === activeTab.toLowerCase());

  const totalUsers = mockUsers.length;
  const activeUsers = mockUsers.filter((u) => u.status === 'active').length;
  const suspendedUsers = mockUsers.filter((u) => u.status === 'suspended').length;
  const pendingUsers = mockUsers.filter((u) => u.status === 'pending').length;

  const columns: Column<MockUser>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (item) => (
        <div>
          <p className="font-medium text-[var(--fg)]">{item.name}</p>
          <p className="text-xs text-[var(--fg-muted)]">{item.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (item) => (
        <Badge variant={roleVariant[item.role] ?? 'default'}>
          {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={statusVariant[item.status] ?? 'default'}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Badge>
      ),
    },
    { key: 'country', header: 'Country', sortable: true },
    { key: 'joined', header: 'Joined', sortable: true },
    { key: 'lastActive', header: 'Last Active', sortable: true },
    { key: 'deals', header: 'Deals', sortable: true },
    {
      key: 'id',
      header: 'Actions',
      render: (item) => (
        <button
          onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${item.id}`); }}
          className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Platform Users"
        description="Manage platform users across all roles"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={String(totalUsers)} icon={Users} />
        <StatCard title="Active" value={String(activeUsers)} icon={UserCheck} iconColor="text-success" />
        <StatCard title="Suspended" value={String(suspendedUsers)} icon={UserX} iconColor="text-danger" />
        <StatCard title="Pending" value={String(pendingUsers)} icon={Clock} iconColor="text-warning" />
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <div className="mb-4 flex flex-wrap gap-2">
          {roleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-primary-600 text-white'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns as any}
          data={filtered as unknown as MockUser[]}
          keyField="id"
          onRowClick={(item) => router.push(`/admin/users/${item.id}`)}
        />
      </div>
    </PageContainer>
  );
}
