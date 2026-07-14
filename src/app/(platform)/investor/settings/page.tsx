'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/theme-context';
import { useNotifications } from '@/contexts/notification-context';
import {
  User, Bell, Shield, Sliders,
  Smartphone, Mail, Globe, Lock,
  Monitor, Laptop, CheckCircle2, Eye, EyeOff,
} from 'lucide-react';

type TabId = 'profile' | 'notifications' | 'security' | 'preferences';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#8B7355] focus:ring-offset-1 ${
        checked ? 'bg-[#8B7355]' : 'bg-[var(--bg-tertiary)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0">
      <div>
        <p className="text-sm font-medium text-[var(--fg)]">{label}</p>
        {description && <p className="text-xs text-[var(--fg-muted)] mt-0.5">{description}</p>}
      </div>
      <div className="ml-4 shrink-0">{children}</div>
    </div>
  );
}

const activeSessions = [
  { id: 1, device: 'MacBook Pro 16"', browser: 'Chrome 124', location: 'Dubai, UAE', lastActive: '2 minutes ago', current: true, icon: Laptop },
  { id: 2, device: 'iPhone 15 Pro', browser: 'Safari Mobile', location: 'Dubai, UAE', lastActive: '1 hour ago', current: false, icon: Smartphone },
  { id: 3, device: 'Windows PC', browser: 'Edge 123', location: 'London, UK', lastActive: '3 days ago', current: false, icon: Monitor },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [showPassword, setShowPassword] = useState(false);

  // Theme — wired to ThemeContext
  const { theme: currentTheme, setTheme: applyTheme } = useTheme();

  // Notifications — wired to NotificationContext
  const { preferences, updatePreferences } = useNotifications();
  const notifEmail = preferences.email;
  const notifSMS = preferences.sms;
  const notifPush = preferences.push;
  const notifMarket = preferences.marketUpdates;
  const notifDeals = preferences.dealAlerts;
  const setNotifEmail = (v: boolean) => updatePreferences({ email: v });
  const setNotifSMS = (v: boolean) => updatePreferences({ sms: v });
  const setNotifPush = (v: boolean) => updatePreferences({ push: v });
  const setNotifMarket = (v: boolean) => updatePreferences({ marketUpdates: v });
  const setNotifDeals = (v: boolean) => updatePreferences({ dealAlerts: v });

  // Security
  const [twoFA, setTwoFA] = useState(true);

  // Preferences
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('English');

  // Map theme context to settings UI
  const themeLabel = currentTheme === 'dark' ? 'Dark' : 'Light';
  const theme = themeLabel;
  const setTheme = (t: string) => {
    if (t === 'Light') applyTheme('light');
    else if (t === 'Dark') applyTheme('dark');
  };

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
  ];

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage your account preferences" />

      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
        {/* Sidebar Nav */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-2 h-fit shadow-card">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[rgba(139,115,85,0.06)] text-[#8B7355]'
                    : 'text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card overflow-hidden">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <h2 className="text-base font-semibold text-[var(--fg)] mb-6">Profile Information</h2>

              {/* Avatar */}
              <div className="flex items-center gap-5 mb-8 pb-6 border-b border-[var(--border)]">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#8B7355] to-[#A89478] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">SL</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--fg)]">Sarah Lim</h3>
                  <p className="text-sm text-[var(--fg-muted)]">UHNI Investor · Member since 2023</p>
                  <button className="mt-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
                    Change Photo
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Full Name', value: 'Sarah Lim', type: 'text' },
                  { label: 'Email Address', value: 'sarah.lim@example.com', type: 'email' },
                  { label: 'Phone Number', value: '+65 9123 4567', type: 'tel' },
                  { label: 'Country', value: 'Singapore', type: 'text' },
                  { label: 'Timezone', value: 'Asia/Singapore (UTC+8)', type: 'text' },
                  { label: 'Tax Residency', value: 'Singapore', type: 'text' },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-xs font-medium text-[var(--fg-secondary)] block mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      defaultValue={field.value}
                      readOnly
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--fg)] cursor-default focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button className="c-btn-primary px-4 py-2 text-sm cursor-pointer">
                  Save Changes
                </button>
                <button className="c-btn-secondary px-4 py-2 text-sm cursor-pointer">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-6">
              <h2 className="text-base font-semibold text-[var(--fg)] mb-6">Notification Preferences</h2>

              <div className="space-y-1">
                <SettingRow
                  label="Email Alerts"
                  description="Receive important updates and summaries via email"
                >
                  <Toggle checked={notifEmail} onChange={setNotifEmail} />
                </SettingRow>
                <SettingRow
                  label="SMS Notifications"
                  description="Get instant alerts via SMS for critical events"
                >
                  <Toggle checked={notifSMS} onChange={setNotifSMS} />
                </SettingRow>
                <SettingRow
                  label="Push Notifications"
                  description="Browser and mobile push alerts for real-time updates"
                >
                  <Toggle checked={notifPush} onChange={setNotifPush} />
                </SettingRow>
                <SettingRow
                  label="Market Updates"
                  description="Weekly AI market intelligence reports and trend alerts"
                >
                  <Toggle checked={notifMarket} onChange={setNotifMarket} />
                </SettingRow>
                <SettingRow
                  label="Deal Alerts"
                  description="Notifications when new matching deals are available"
                >
                  <Toggle checked={notifDeals} onChange={setNotifDeals} />
                </SettingRow>
              </div>

              <div className="mt-6">
                <button className="c-btn-primary px-4 py-2 text-sm cursor-pointer">
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-6 space-y-8">
              <div>
                <h2 className="text-base font-semibold text-[var(--fg)] mb-5">Change Password</h2>
                <div className="grid gap-4 max-w-md">
                  <div>
                    <label className="text-xs font-medium text-[var(--fg-secondary)] block mb-1.5">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter current password"
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355] pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--fg-secondary)] block mb-1.5">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--fg-secondary)] block mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                    />
                  </div>
                  <button className="c-btn-primary w-fit px-4 py-2 text-sm flex items-center gap-2 cursor-pointer">
                    <Lock className="h-4 w-4" />
                    Update Password
                  </button>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-6">
                <h2 className="text-base font-semibold text-[var(--fg)] mb-4">Two-Factor Authentication</h2>
                <SettingRow
                  label="Enable 2FA"
                  description="Add an extra layer of security using an authenticator app"
                >
                  <Toggle checked={twoFA} onChange={setTwoFA} />
                </SettingRow>
                {twoFA && (
                  <div className="mt-3 rounded-lg border border-success/20 bg-success-light/30 p-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#8B7355]" />
                    <p className="text-xs text-green-800">2FA is active. Your account is protected.</p>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border)] pt-6">
                <h2 className="text-base font-semibold text-[var(--fg)] mb-4">Active Sessions</h2>
                <div className="space-y-3">
                  {activeSessions.map((session) => {
                    const Icon = session.icon;
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--fg-secondary)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-[var(--fg)]">{session.device}</p>
                              {session.current && <Badge variant="success">Current</Badge>}
                            </div>
                            <p className="text-xs text-[var(--fg-muted)]">
                              {session.browser} · {session.location} · {session.lastActive}
                            </p>
                          </div>
                        </div>
                        {!session.current && (
                          <button className="text-xs text-danger hover:underline">
                            Revoke
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="p-6">
              <h2 className="text-base font-semibold text-[var(--fg)] mb-6">App Preferences</h2>

              <div className="grid gap-5 max-w-lg">
                <div>
                  <label className="text-xs font-medium text-[var(--fg-secondary)] block mb-1.5">
                    <Globe className="h-4 w-4 inline mr-1.5 mb-0.5" />
                    Currency Display
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                  >
                    {['USD', 'EUR', 'GBP', 'AED', 'INR', 'SGD', 'JPY', 'AUD'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--fg-secondary)] block mb-1.5">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                  >
                    {['English', 'Arabic', 'French', 'Mandarin', 'Hindi', 'Japanese'].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--fg-secondary)] block mb-1.5">Theme</label>
                  <div className="flex gap-3">
                    {['Light', 'Dark'].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition-all ${
                          theme === t
                            ? 'border-[#8B7355] bg-[rgba(139,115,85,0.06)] text-[#8B7355]'
                            : 'border-[var(--border)] text-[var(--fg-secondary)] hover:border-[rgba(139,115,85,0.3)] hover:text-[var(--fg)]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button className="c-btn-primary px-4 py-2 text-sm cursor-pointer">
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
