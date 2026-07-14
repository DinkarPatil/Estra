'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { PageContainer } from '@/components/layout/page-container';
import { Save } from 'lucide-react';

const tabs = ['General', 'Roles & Permissions', 'Compliance', 'Maintenance'] as const;
type Tab = typeof tabs[number];

const roles = ['Investor', 'Broker', 'Developer', 'Admin'] as const;
const permissions = ['View Properties', 'Create Listings', 'Manage Transactions', 'Admin Panel', 'API Access'] as const;

type Role = typeof roles[number];
type Permission = typeof permissions[number];

const initialRolePermissions: Record<Role, Record<Permission, boolean>> = {
  Investor: {
    'View Properties': true,
    'Create Listings': false,
    'Manage Transactions': true,
    'Admin Panel': false,
    'API Access': false,
  },
  Broker: {
    'View Properties': true,
    'Create Listings': true,
    'Manage Transactions': true,
    'Admin Panel': false,
    'API Access': true,
  },
  Developer: {
    'View Properties': true,
    'Create Listings': true,
    'Manage Transactions': false,
    'Admin Panel': false,
    'API Access': true,
  },
  Admin: {
    'View Properties': true,
    'Create Listings': true,
    'Manage Transactions': true,
    'Admin Panel': true,
    'API Access': true,
  },
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-primary-600' : 'bg-[var(--bg-tertiary)]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('General');

  // General
  const [platformName, setPlatformName] = useState('ESTRA GLIMMORA');
  const [supportEmail, setSupportEmail] = useState('support@glimmora.com');
  const [defaultCurrency, setDefaultCurrency] = useState('AED');
  const [defaultLanguage, setDefaultLanguage] = useState('en');
  const [maxFileSize, setMaxFileSize] = useState('50');
  const [sessionTimeout, setSessionTimeout] = useState('60');

  // Roles & Permissions
  const [rolePerms, setRolePerms] = useState(initialRolePermissions);

  const togglePerm = (role: Role, perm: Permission) => {
    setRolePerms((prev) => ({
      ...prev,
      [role]: { ...prev[role], [perm]: !prev[role][perm] },
    }));
  };

  // Compliance
  const [kycRequired, setKycRequired] = useState(true);
  const [amlScreening, setAmlScreening] = useState(true);
  const [gdprMode, setGdprMode] = useState(true);
  const [dataRetention, setDataRetention] = useState('90');
  const [auditLogging, setAuditLogging] = useState(true);

  // Maintenance
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const platformVersion = 'v2.4.1';
  const lastDeploy = '2025-01-28 02:00 AM UTC';

  const inputClass = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-primary-500';
  const selectClass = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <PageContainer>
      <PageHeader
        title="Platform Settings"
        description="Global configuration and administration"
        actions={
          <button className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        }
      />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        {/* Tab Bar */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
          {tabs.map((tab) => (
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

        {/* General Tab */}
        {activeTab === 'General' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Platform Name</label>
              <input value={platformName} onChange={(e) => setPlatformName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Support Email</label>
              <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Default Currency</label>
              <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} className={selectClass}>
                {['AED', 'USD', 'EUR', 'GBP', 'SGD', 'INR'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Default Language</label>
              <select value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)} className={selectClass}>
                <option value="en">English</option>
                <option value="ar">Arabic</option>
                <option value="fr">French</option>
                <option value="zh">Chinese</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Max File Upload Size (MB)</label>
              <input type="number" value={maxFileSize} onChange={(e) => setMaxFileSize(e.target.value)} className={inputClass} min="1" max="500" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--fg-secondary)]">Session Timeout (minutes)</label>
              <input type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className={inputClass} min="5" max="1440" />
            </div>
          </div>
        )}

        {/* Roles & Permissions Tab */}
        {activeTab === 'Roles & Permissions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--fg-secondary)]">Permission</th>
                  {roles.map((role) => (
                    <th key={role} className="px-4 py-3 text-center font-medium text-[var(--fg-secondary)]">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm} className="border-b border-[var(--border)] hover:bg-[var(--bg-secondary)]">
                    <td className="px-4 py-3 font-medium text-[var(--fg)]">{perm}</td>
                    {roles.map((role) => (
                      <td key={role} className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            checked={rolePerms[role][perm]}
                            onChange={() => togglePerm(role, perm)}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Compliance Tab */}
        {activeTab === 'Compliance' && (
          <div className="space-y-4 max-w-xl">
            {[
              { label: 'KYC Required', desc: 'Require identity verification for all users', value: kycRequired, onChange: () => setKycRequired(!kycRequired) },
              { label: 'AML Screening', desc: 'Enable anti-money laundering transaction monitoring', value: amlScreening, onChange: () => setAmlScreening(!amlScreening) },
              { label: 'GDPR Mode', desc: 'Enable EU GDPR data privacy compliance controls', value: gdprMode, onChange: () => setGdprMode(!gdprMode) },
              { label: 'Audit Logging', desc: 'Log all user actions and system events', value: auditLogging, onChange: () => setAuditLogging(!auditLogging) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[var(--fg)]">{item.label}</p>
                  <p className="text-xs text-[var(--fg-muted)]">{item.desc}</p>
                </div>
                <Toggle checked={item.value} onChange={item.onChange} />
              </div>
            ))}
            <div className="rounded-lg border border-[var(--border)] px-4 py-3">
              <label className="block text-sm font-medium text-[var(--fg)] mb-2">Data Retention Period</label>
              <select value={dataRetention} onChange={(e) => setDataRetention(e.target.value)} className={selectClass}>
                {['30', '60', '90', '180', '365'].map((d) => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'Maintenance' && (
          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between rounded-lg border border-[var(--border)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--fg)]">Maintenance Mode</p>
                <p className="text-xs text-[var(--fg-muted)]">Take the platform offline for scheduled maintenance</p>
              </div>
              <Toggle checked={maintenanceMode} onChange={() => setMaintenanceMode(!maintenanceMode)} />
            </div>

            <div className="rounded-lg border border-[var(--border)] px-4 py-3">
              <label className="block text-sm font-medium text-[var(--fg)] mb-2">Announcement Banner</label>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                rows={3}
                placeholder="Enter a platform-wide announcement message..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-[var(--bg-secondary)] px-4 py-3">
                <p className="text-xs text-[var(--fg-muted)] mb-1">Platform Version</p>
                <p className="text-base font-bold text-[var(--fg)]">{platformVersion}</p>
              </div>
              <div className="rounded-lg bg-[var(--bg-secondary)] px-4 py-3">
                <p className="text-xs text-[var(--fg-muted)] mb-1">Last Deployed</p>
                <p className="text-sm font-semibold text-[var(--fg)]">{lastDeploy}</p>
              </div>
            </div>

            {maintenanceMode && (
              <div className="rounded-lg bg-warning/10 border border-warning/30 px-4 py-3 text-sm text-warning">
                Maintenance mode is active. All non-admin users will see a maintenance page.
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
