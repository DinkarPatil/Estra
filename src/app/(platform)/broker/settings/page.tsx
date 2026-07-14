'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Link2 } from 'lucide-react';

type TabType = 'profile' | 'commission' | 'notifications' | 'integrations';

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        enabled ? 'bg-primary-600' : 'bg-[var(--bg-tertiary)]'
      }`}
    >
      <div
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function InputField({
  label,
  defaultValue,
  type = 'text',
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] placeholder-[var(--fg-muted)] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
      />
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const [notifications, setNotifications] = useState({
    emailLeads: true,
    smsLeads: false,
    pushLeads: true,
    emailDeals: true,
    smsDeals: true,
    pushDeals: false,
    emailClosings: true,
    smsClosings: true,
    pushClosings: true,
  });

  const tabs: { id: TabType; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'commission', label: 'Commission' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'integrations', label: 'Integrations' },
  ];

  const integrations = [
    { name: 'Salesforce CRM', description: 'Sync leads and deals automatically', connected: true, logo: 'SF' },
    { name: 'Gmail', description: 'Send emails directly from the platform', connected: true, logo: 'G' },
    { name: 'Google Calendar', description: 'Sync appointments and follow-ups', connected: false, logo: 'GC' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Broker account settings" />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
        {/* Tab nav */}
        <div className="flex border-b border-[var(--border)] px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">
                  JO
                </div>
                <div>
                  <p className="font-semibold text-[var(--fg)]">James Okafor</p>
                  <p className="text-sm text-[var(--fg-muted)]">Senior Broker</p>
                </div>
                <button className="ml-auto rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--fg)] transition-colors hover:bg-[var(--bg-secondary)]">
                  Change Photo
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Full Name" defaultValue="James Okafor" />
                <InputField label="Email" type="email" defaultValue="james.okafor@estraglimmora.com" />
                <InputField label="License Number" defaultValue="RE-2021-GB-88492" />
                <InputField label="Agency Name" defaultValue="Estra Glimmora Brokers" />
                <InputField label="Phone" type="tel" defaultValue="+44 7700 123456" />
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Bio</label>
                  <textarea
                    rows={3}
                    defaultValue="Senior broker specializing in luxury residential and commercial properties across the MENA, APAC, and European markets. 10+ years of experience."
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Commission Tab */}
          {activeTab === 'commission' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">
                    Default Commission Rate (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      defaultValue="2"
                      min="0"
                      max="10"
                      step="0.5"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />
                    <span className="text-sm text-[var(--fg-muted)]">%</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">
                    Preferred Currency
                  </label>
                  <select className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                    <option value="USD">USD — US Dollar</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="AED">AED — UAE Dirham</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">
                    Payment Method
                  </label>
                  <select className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
                <p className="text-xs text-[var(--fg-muted)]">
                  Commission rates can be overridden on a per-deal basis. The default rate applies to new deals unless manually adjusted.
                </p>
              </div>

              <div className="flex justify-end">
                <button className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              {[
                {
                  category: 'New Leads',
                  description: 'Get notified when a new lead is assigned or scored',
                  keys: ['emailLeads', 'smsLeads', 'pushLeads'] as const,
                },
                {
                  category: 'Deal Updates',
                  description: 'Notifications for deal stage changes and offers',
                  keys: ['emailDeals', 'smsDeals', 'pushDeals'] as const,
                },
                {
                  category: 'Closings',
                  description: 'Alerts when a deal is completed or falls through',
                  keys: ['emailClosings', 'smsClosings', 'pushClosings'] as const,
                },
              ].map((section) => (
                <div key={section.category} className="rounded-xl border border-[var(--border)] p-4">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-[var(--fg)]">{section.category}</p>
                    <p className="text-xs text-[var(--fg-muted)]">{section.description}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(['Email', 'SMS', 'Push'] as const).map((channel, i) => {
                      const key = section.keys[i];
                      return (
                        <div key={channel} className="flex items-center justify-between rounded-lg bg-[var(--bg-secondary)] px-3 py-2">
                          <span className="text-sm text-[var(--fg-secondary)]">{channel}</span>
                          <Toggle
                            enabled={notifications[key]}
                            onChange={(v) => setNotifications((prev) => ({ ...prev, [key]: v }))}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <button className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-xs font-bold text-[var(--fg)]">
                      {integration.logo}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--fg)]">{integration.name}</p>
                      <p className="text-xs text-[var(--fg-muted)]">{integration.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {integration.connected ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <Badge variant="success">Connected</Badge>
                        </div>
                        <button className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light">
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-4 w-4 text-[var(--fg-muted)]" />
                          <Badge variant="secondary">Not Connected</Badge>
                        </div>
                        <button className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700">
                          <Link2 className="h-3.5 w-3.5" />
                          Connect
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
