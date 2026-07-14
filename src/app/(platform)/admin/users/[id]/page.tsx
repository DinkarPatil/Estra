'use client';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Mail, Globe, Calendar, Clock, Briefcase, Monitor, MapPin,
  ShieldOff, ShieldCheck, KeyRound, MessageSquare, Trash2, ArrowLeft,
} from 'lucide-react';

const mockUsers = [
  { id: 'u-001', name: 'Sarah Chen', email: 'investor@glimmora.com', role: 'investor', status: 'active', joined: '2024-10-01', lastActive: '2025-01-28', deals: 3, country: 'Singapore', device: 'MacBook Pro', location: 'Singapore, SG', loginTime: '2025-01-28 09:14 AM' },
  { id: 'u-002', name: 'James Okafor', email: 'broker@glimmora.com', role: 'broker', status: 'active', joined: '2024-09-15', lastActive: '2025-01-28', deals: 8, country: 'Nigeria', device: 'Windows 11 PC', location: 'Lagos, NG', loginTime: '2025-01-28 07:52 AM' },
  { id: 'u-003', name: 'Priya Sharma', email: 'developer@glimmora.com', role: 'developer', status: 'active', joined: '2024-08-01', lastActive: '2025-01-27', deals: 12, country: 'India', device: 'Ubuntu 22.04', location: 'Bangalore, IN', loginTime: '2025-01-27 11:05 PM' },
  { id: 'u-004', name: 'Alex Rivera', email: 'admin@glimmora.com', role: 'admin', status: 'active', joined: '2024-07-01', lastActive: '2025-01-28', deals: 0, country: 'USA', device: 'MacBook Air', location: 'New York, US', loginTime: '2025-01-28 08:00 AM' },
  { id: 'u-005', name: 'Mohammed Al-Farsi', email: 'mfarsi@email.com', role: 'investor', status: 'active', joined: '2024-11-10', lastActive: '2025-01-25', deals: 1, country: 'UAE', device: 'iPad Pro', location: 'Dubai, AE', loginTime: '2025-01-25 03:30 PM' },
  { id: 'u-006', name: 'Elena Vasquez', email: 'evasquez@email.com', role: 'broker', status: 'suspended', joined: '2024-10-20', lastActive: '2025-01-10', deals: 2, country: 'Spain', device: 'iPhone 15', location: 'Madrid, ES', loginTime: '2025-01-10 02:44 PM' },
  { id: 'u-007', name: 'David Kim', email: 'dkim@email.com', role: 'investor', status: 'pending', joined: '2025-01-20', lastActive: '2025-01-20', deals: 0, country: 'South Korea', device: 'Galaxy S24', location: 'Seoul, KR', loginTime: '2025-01-20 10:00 AM' },
];

const activityLog = [
  { id: 1, action: 'Logged in', detail: 'Authenticated via email + MFA', time: '2025-01-28 09:14 AM', type: 'auth' },
  { id: 2, action: 'Viewed property', detail: 'Marina Tower — Unit 3B, Dubai', time: '2025-01-28 09:22 AM', type: 'property' },
  { id: 3, action: 'Submitted investment offer', detail: 'AED 4,200,000 on Bluewaters Residence', time: '2025-01-28 09:45 AM', type: 'transaction' },
  { id: 4, action: 'Downloaded KYC report', detail: 'Compliance report PDF', time: '2025-01-27 04:10 PM', type: 'document' },
  { id: 5, action: 'Updated profile', detail: 'Changed preferred currency to AED', time: '2025-01-26 11:30 AM', type: 'settings' },
];

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

const activityTypeColor: Record<string, string> = {
  auth: 'bg-stone-500',
  property: 'bg-green-500',
  transaction: 'bg-amber-500',
  document: 'bg-stone-500',
  settings: 'bg-gray-400',
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const user = mockUsers.find((u) => u.id === id) ?? mockUsers[0];

  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <PageContainer>
      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <button
            onClick={() => router.push('/admin/users')}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column — Profile */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
                {initials}
              </div>
              <h2 className="mt-3 text-lg font-semibold text-[var(--fg)]">{user.name}</h2>
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                <Badge variant={roleVariant[user.role] ?? 'default'}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Badge>
                <Badge variant={statusVariant[user.status] ?? 'default'}>
                  {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                </Badge>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="text-[var(--fg-secondary)]">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Globe className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="text-[var(--fg-secondary)]">{user.country}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="text-[var(--fg-secondary)]">Joined {user.joined}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-[var(--fg-muted)]" />
                <span className="text-[var(--fg-secondary)]">Last active {user.lastActive}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Activity & Actions */}
        <div className="space-y-4 lg:col-span-2">
          {/* Activity Summary */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">Activity Summary</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
                <p className="text-xl font-bold text-[var(--fg)]">{user.deals}</p>
                <p className="text-xs text-[var(--fg-muted)]">Total Deals</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
                <p className="text-xs font-semibold text-[var(--fg)] truncate">{user.loginTime}</p>
                <p className="text-xs text-[var(--fg-muted)]">Last Login</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Monitor className="h-4 w-4 text-[var(--fg-muted)]" />
                </div>
                <p className="text-xs font-semibold text-[var(--fg)] truncate">{user.device}</p>
                <p className="text-xs text-[var(--fg-muted)]">Device</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <MapPin className="h-4 w-4 text-[var(--fg-muted)]" />
                </div>
                <p className="text-xs font-semibold text-[var(--fg)] truncate">{user.location}</p>
                <p className="text-xs text-[var(--fg-muted)]">Location</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {user.status === 'suspended' ? (
                <button className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] p-3 text-xs font-medium text-success hover:bg-[var(--bg-secondary)] transition-colors">
                  <ShieldCheck className="h-5 w-5" />
                  Activate
                </button>
              ) : (
                <button className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] p-3 text-xs font-medium text-warning hover:bg-[var(--bg-secondary)] transition-colors">
                  <ShieldOff className="h-5 w-5" />
                  Suspend
                </button>
              )}
              <button className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] p-3 text-xs font-medium text-info hover:bg-[var(--bg-secondary)] transition-colors">
                <KeyRound className="h-5 w-5" />
                Reset Password
              </button>
              <button className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] p-3 text-xs font-medium text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
                <MessageSquare className="h-5 w-5" />
                Send Message
              </button>
              <button className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] p-3 text-xs font-medium text-danger hover:bg-[var(--bg-secondary)] transition-colors">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h3 className="mb-4 text-sm font-semibold text-[var(--fg)]">Activity Log</h3>
            <div className="space-y-4">
              {activityLog.map((entry, idx) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`h-2.5 w-2.5 rounded-full ${activityTypeColor[entry.type]} inline-block mt-1`} />
                    {idx < activityLog.length - 1 && (
                      <div className="w-px flex-1 bg-[var(--border)] mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-[var(--fg)]">{entry.action}</p>
                    <p className="text-xs text-[var(--fg-muted)]">{entry.detail}</p>
                    <p className="mt-1 text-xs text-[var(--fg-muted)]">{entry.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
