'use client';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { StatCard } from '@/components/data-display/stat-card';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Users, Lightbulb, DollarSign, Download, CalendarDays } from 'lucide-react';

const campaigns = [
  {
    id: 'camp-001',
    name: 'Skyline Residences Launch',
    channel: 'Digital',
    budget: 120000,
    reach: 22000,
    leads: 58,
    status: 'active',
    performance: 78,
  },
  {
    id: 'camp-002',
    name: 'Palm Gardens Exclusive',
    channel: 'Event',
    budget: 85000,
    reach: 8500,
    leads: 34,
    status: 'active',
    performance: 62,
  },
  {
    id: 'camp-003',
    name: 'Downtown Retail Awareness',
    channel: 'Social',
    budget: 45000,
    reach: 18000,
    leads: 32,
    status: 'active',
    performance: 55,
  },
];

const marketingBriefs = [
  { id: 'brief-001', title: 'Skyline Residences Q2 Brief', date: '2026-03-15', pages: 12 },
  { id: 'brief-002', title: 'Palm Gardens Media Kit', date: '2026-02-20', pages: 8 },
];

const upcomingEvents = [
  {
    id: 'evt-001',
    name: 'Dubai Property Expo',
    date: '2026-04-20',
    location: 'DWTC, Dubai',
    type: 'Expo',
  },
  {
    id: 'evt-002',
    name: 'Palm Gardens Private Viewing',
    date: '2026-04-28',
    location: 'Palm Jumeirah Sales Center',
    type: 'Private Event',
  },
];

const channelBadge: Record<string, 'info' | 'success' | 'warning'> = {
  Digital: 'info',
  Event: 'success',
  Social: 'warning',
};

const statusBadge: Record<string, 'success' | 'secondary'> = {
  active: 'success',
  paused: 'secondary',
};

export default function MarketingPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Developer Marketing"
        description="Campaign management and lead generation"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Campaigns" value="3" icon={Megaphone} iconColor="text-primary-600" />
        <StatCard title="Total Reach" value="48K" icon={Users} iconColor="text-info" />
        <StatCard title="Leads Generated" value="124" icon={Lightbulb} change={18.3} changeLabel="vs last month" iconColor="text-success" />
        <StatCard title="Cost per Lead" value="$42" icon={DollarSign} change={-6.7} changeLabel="vs last month" iconColor="text-warning" />
      </div>

      {/* Campaign Cards */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-[var(--fg)]">Active Campaigns</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[var(--fg)] text-sm">{c.name}</h3>
                  <Badge variant={channelBadge[c.channel] ?? 'default'} className="mt-1">{c.channel}</Badge>
                </div>
                <Badge variant={statusBadge[c.status] ?? 'default'}>
                  {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-[var(--fg-muted)]">Budget</p>
                  <p className="text-sm font-semibold text-[var(--fg)]">AED {(c.budget / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--fg-muted)]">Reach</p>
                  <p className="text-sm font-semibold text-[var(--fg)]">{(c.reach / 1000).toFixed(1)}K</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--fg-muted)]">Leads</p>
                  <p className="text-sm font-semibold text-success">{c.leads}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[var(--fg-muted)] mb-1">
                  <span>Performance</span>
                  <span>{c.performance}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-tertiary)]">
                  <div
                    className="h-2 rounded-full bg-primary-500"
                    style={{ width: `${c.performance}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Marketing Briefs */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-4">Marketing Briefs</h2>
          <ul className="space-y-3">
            {marketingBriefs.map((brief) => (
              <li key={brief.id} className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border)] p-3">
                <div>
                  <p className="text-sm font-medium text-[var(--fg)]">{brief.title}</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">{brief.date} · {brief.pages} pages</p>
                </div>
                <button className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline shrink-0">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Upcoming Events */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-4">Upcoming Events</h2>
          <ul className="space-y-3">
            {upcomingEvents.map((evt) => {
              const d = new Date(evt.date);
              const day = d.getDate();
              const mon = d.toLocaleString('en-US', { month: 'short' });
              return (
                <li key={evt.id} className="flex items-start gap-4 rounded-lg border border-[var(--border)] p-3">
                  <div className="flex flex-col items-center justify-center rounded-lg bg-primary-100 px-3 py-2 text-primary-800 min-w-[52px]">
                    <span className="text-lg font-bold leading-none">{day}</span>
                    <span className="text-xs font-medium">{mon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--fg)]">{evt.name}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-[var(--fg-muted)]">
                      <CalendarDays className="h-3 w-3" />
                      {evt.location}
                    </div>
                    <Badge variant="info" className="mt-1">{evt.type}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}
