'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, RefreshCw, Save } from 'lucide-react';

const tabList = ['Company', 'Projects', 'Notifications', 'API Access'];

type NotifKey = 'leadInquiry' | 'reservation' | 'saleClosed' | 'paymentDue';

interface NotifSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

const defaultNotifs: Record<NotifKey, NotifSettings> = {
  leadInquiry: { email: true, sms: false, push: true },
  reservation: { email: true, sms: true, push: true },
  saleClosed: { email: true, sms: true, push: true },
  paymentDue: { email: true, sms: false, push: false },
};

const notifLabels: Record<NotifKey, string> = {
  leadInquiry: 'Lead Inquiry',
  reservation: 'Reservation',
  saleClosed: 'Sale Closed',
  paymentDue: 'Payment Due',
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('Company');
  const [showApiKey, setShowApiKey] = useState(false);
  const [autoAI, setAutoAI] = useState(true);
  const [priceNotifs, setPriceNotifs] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState('AED');
  const [notifs, setNotifs] = useState(defaultNotifs);

  const apiKey = 'eg_live_sk_2a9f83b1c74e0d56f219a0b7e3d4c8f0';
  const maskedKey = showApiKey ? apiKey : '••••••••••••••••••••••••••••••••';

  const toggleNotif = (event: NotifKey, channel: keyof NotifSettings) => {
    setNotifs((prev) => ({
      ...prev,
      [event]: { ...prev[event], [channel]: !prev[event][channel] },
    }));
  };

  return (
    <PageContainer>
      <PageHeader
        title="Developer Settings"
        description="Developer account settings"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-0 flex-wrap">
        {tabList.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Company Tab */}
      {activeTab === 'Company' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-4">Company Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Company Name', name: 'companyName', defaultValue: 'Priya Developments LLC', type: 'text' },
              { label: 'Registration Number', name: 'regNumber', defaultValue: 'DED-2019-04871', type: 'text' },
              { label: 'Country', name: 'country', defaultValue: 'United Arab Emirates', type: 'text' },
              { label: 'HQ Address', name: 'address', defaultValue: 'Office 2204, Jumeirah Bay Tower, Dubai', type: 'text' },
              { label: 'Contact Email', name: 'email', defaultValue: 'priya@priyadev.ae', type: 'email' },
              { label: 'Website', name: 'website', defaultValue: 'https://priyadev.ae', type: 'url' },
            ].map(({ label, name, defaultValue, type }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-[var(--fg-secondary)] mb-1">{label}</label>
                <input
                  name={name}
                  type={type}
                  defaultValue={defaultValue}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'Projects' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-6">
          <h2 className="text-base font-semibold text-[var(--fg)]">Project Defaults</h2>

          <div>
            <label className="block text-sm font-medium text-[var(--fg-secondary)] mb-1">Default Currency</label>
            <select
              value={defaultCurrency}
              onChange={(e) => setDefaultCurrency(e.target.value)}
              className="w-48 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="AED">AED</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div className="space-y-4">
            {[
              {
                label: 'Auto-assign AI Scoring',
                description: 'Automatically assign AI demand and pricing scores to new units',
                value: autoAI,
                onChange: () => setAutoAI((v) => !v),
              },
              {
                label: 'Price Update Notifications',
                description: 'Receive notifications when AI recommends price adjustments',
                value: priceNotifs,
                onChange: () => setPriceNotifs((v) => !v),
              },
            ].map(({ label, description, value, onChange }) => (
              <div key={label} className="flex items-center justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0">
                <div>
                  <p className="text-sm font-medium text-[var(--fg)]">{label}</p>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5">{description}</p>
                </div>
                <button
                  onClick={onChange}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    value ? 'bg-primary-600' : 'bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'Notifications' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <h2 className="text-base font-semibold text-[var(--fg)] mb-4">Notification Preferences</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="py-3 pr-4 text-left font-medium text-[var(--fg-secondary)] w-48">Event</th>
                  {(['email', 'sms', 'push'] as (keyof NotifSettings)[]).map((ch) => (
                    <th key={ch} className="py-3 px-6 text-center font-medium text-[var(--fg-secondary)] capitalize">{ch}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(notifs) as NotifKey[]).map((event) => (
                  <tr key={event} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-3 pr-4 text-[var(--fg)]">{notifLabels[event]}</td>
                    {(['email', 'sms', 'push'] as (keyof NotifSettings)[]).map((channel) => (
                      <td key={channel} className="py-3 px-6 text-center">
                        <button
                          onClick={() => toggleNotif(event, channel)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            notifs[event][channel] ? 'bg-primary-600' : 'bg-[var(--bg-tertiary)]'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notifs[event][channel] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API Access Tab */}
      {activeTab === 'API Access' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h2 className="text-base font-semibold text-[var(--fg)] mb-4">API Key</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--fg-secondary)] overflow-hidden">
                {maskedKey}
              </div>
              <button
                onClick={() => setShowApiKey((v) => !v)}
                className="p-2 rounded-lg border border-[var(--border)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors">
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--fg-muted)]">
              Keep your API key secret. Regenerating will invalidate the current key immediately.
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
            <h2 className="text-base font-semibold text-[var(--fg)] mb-4">API Usage</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Calls This Month', value: '1,204' },
                { label: 'Monthly Limit', value: '10,000' },
                { label: 'Remaining', value: '8,796' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-[var(--bg-secondary)] p-4">
                  <p className="text-xs text-[var(--fg-muted)]">{label}</p>
                  <p className="mt-1 text-xl font-bold text-[var(--fg)]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-[var(--fg-muted)] mb-1">
                <span>Usage</span>
                <span>12.0%</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-tertiary)]">
                <div className="h-2 rounded-full bg-primary-500" style={{ width: '12%' }} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="success">Active</Badge>
              <span className="text-xs text-[var(--fg-muted)]">API access is enabled for your account</span>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
