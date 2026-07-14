'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Lock, Users, Search, ChevronDown, ChevronUp, Check, Plus,
  Eye, Edit3, Trash2, Settings, Filter, AlertTriangle,
  X, Copy, Clock, Activity, Zap, BarChart3, GitBranch, UserCheck,
  RefreshCw, Download, Layers, Crown, Sparkles, TrendingUp, Globe,
  Key, UserPlus, ShieldCheck, History,
} from 'lucide-react';

/* ──────────────────────────────
   HOOK: COUNT UP
   ────────────────────────────── */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(id); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return value;
}

/* ──────────────────────────────
   MOCK DATA
   ────────────────────────────── */

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: number;
  totalPermissions: number;
  level: 'system' | 'custom';
  status: 'active' | 'inactive';
  lastModified: string;
  riskScore: 'low' | 'medium' | 'high';
  icon: string;
  color: string;
}

const INITIAL_ROLES: Role[] = [
  { id: 'r-01', name: 'Super Admin', description: 'Full platform access with system-level controls', userCount: 2, permissions: 48, totalPermissions: 48, level: 'system', status: 'active', lastModified: 'Apr 18, 2026', riskScore: 'high', icon: 'crown', color: '#EF4444' },
  { id: 'r-02', name: 'Admin', description: 'Platform management without system config access', userCount: 5, permissions: 38, totalPermissions: 48, level: 'system', status: 'active', lastModified: 'Apr 15, 2026', riskScore: 'high', icon: 'shield', color: '#F59E0B' },
  { id: 'r-03', name: 'Investor', description: 'Portfolio management, property browsing, transactions', userCount: 6420, permissions: 22, totalPermissions: 48, level: 'system', status: 'active', lastModified: 'Mar 28, 2026', riskScore: 'low', icon: 'users', color: '#8B7355' },
  { id: 'r-04', name: 'Broker', description: 'Property listings, deal management, client tools', userCount: 340, permissions: 26, totalPermissions: 48, level: 'system', status: 'active', lastModified: 'Mar 20, 2026', riskScore: 'medium', icon: 'globe', color: '#A89478' },
  { id: 'r-05', name: 'Developer', description: 'API access, project submissions, analytics', userCount: 120, permissions: 18, totalPermissions: 48, level: 'system', status: 'active', lastModified: 'Feb 14, 2026', riskScore: 'medium', icon: 'key', color: '#6F5C46' },
  { id: 'r-06', name: 'Compliance Officer', description: 'KYC/AML oversight, audit log access, regulatory tools', userCount: 8, permissions: 30, totalPermissions: 48, level: 'custom', status: 'active', lastModified: 'Apr 10, 2026', riskScore: 'medium', icon: 'check', color: '#4ADE80' },
  { id: 'r-07', name: 'Support Agent', description: 'User assistance, ticket management, read-only data', userCount: 15, permissions: 14, totalPermissions: 48, level: 'custom', status: 'active', lastModified: 'Jan 22, 2026', riskScore: 'low', icon: 'users', color: '#9A8B7E' },
  { id: 'r-08', name: 'Auditor (External)', description: 'Read-only audit and compliance report access', userCount: 3, permissions: 8, totalPermissions: 48, level: 'custom', status: 'inactive', lastModified: 'Dec 10, 2025', riskScore: 'low', icon: 'eye', color: '#6B7280' },
];

const PERMISSION_GROUPS = [
  { group: 'User Management', icon: 'users', permissions: ['user.read', 'user.create', 'user.update', 'user.delete', 'user.suspend'], critical: true, rolesUsing: 4 },
  { group: 'Properties', icon: 'globe', permissions: ['property.read', 'property.create', 'property.update', 'property.delete', 'property.approve'], critical: false, rolesUsing: 6 },
  { group: 'Transactions', icon: 'activity', permissions: ['transaction.read', 'transaction.create', 'transaction.approve', 'transaction.void'], critical: true, rolesUsing: 5 },
  { group: 'Security', icon: 'shield', permissions: ['security.view', 'security.configure', 'audit.read', 'rbac.manage'], critical: true, rolesUsing: 3 },
  { group: 'Platform', icon: 'settings', permissions: ['settings.read', 'settings.update', 'api.manage', 'ai.configure', 'system.health'], critical: false, rolesUsing: 2 },
  { group: 'Financial', icon: 'chart', permissions: ['finance.read', 'finance.approve', 'finance.refund', 'payout.initiate'], critical: true, rolesUsing: 3 },
];

const ACTIVITY_TIMELINE = [
  { id: 'a-1', time: '2 hours ago', user: 'Sarah K.', avatar: 'SK', action: 'Added "export-reports" to Compliance Officer', type: 'permission' as const },
  { id: 'a-2', time: '5 hours ago', user: 'System', avatar: 'SY', action: 'Auto-revoked temp access for auditor@deloitte.com', type: 'revoke' as const },
  { id: 'a-3', time: '1 day ago', user: 'Michael R.', avatar: 'MR', action: 'Created new role: Support Agent', type: 'create' as const },
  { id: 'a-4', time: '2 days ago', user: 'Sarah K.', avatar: 'SK', action: 'Updated Broker role permissions', type: 'update' as const },
  { id: 'a-5', time: '3 days ago', user: 'AI Engine', avatar: 'AI', action: 'Flagged 3 over-privileged accounts', type: 'ai' as const },
];

const GOVERNANCE_INSIGHTS = {
  overPrivileged: 3,
  unusedPermissions: 12,
  pendingReviews: 2,
  complianceScore: 94,
};

const ROLE_TEMPLATES = [
  { name: 'Read-Only Viewer', permissions: 6, description: 'View-only access to all resources' },
  { name: 'Transaction Manager', permissions: 18, description: 'Full transaction lifecycle management' },
  { name: 'Content Editor', permissions: 12, description: 'Property listing and content mgmt' },
  { name: 'API Developer', permissions: 15, description: 'API access with rate limiting' },
];

/* ──────────────────────────────
   SORT
   ────────────────────────────── */

type SortKey = 'name' | 'userCount' | 'permissions' | 'riskScore';
type SortDir = 'asc' | 'desc';
const riskOrder = { high: 3, medium: 2, low: 1 };

function sortRoles(data: Role[], key: SortKey, dir: SortDir) {
  return [...data].sort((a, b) => {
    if (key === 'riskScore') {
      return dir === 'asc' ? riskOrder[a.riskScore] - riskOrder[b.riskScore] : riskOrder[b.riskScore] - riskOrder[a.riskScore];
    }
    const av = a[key]; const bv = b[key];
    if (typeof av === 'number' && typeof bv === 'number') return dir === 'asc' ? av - bv : bv - av;
    return dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });
}

/* ──────────────────────────────
   ROLE ICON
   ────────────────────────────── */
function RoleIcon({ icon, color }: { icon: string; color: string }) {
  const props = { style: { color }, strokeWidth: 1.5, className: 'h-4 w-4' };
  switch (icon) {
    case 'crown': return <Crown {...props} />;
    case 'shield': return <Shield {...props} />;
    case 'users': return <Users {...props} />;
    case 'globe': return <Globe {...props} />;
    case 'key': return <Key {...props} />;
    case 'check': return <ShieldCheck {...props} />;
    case 'eye': return <Eye {...props} />;
    default: return <Users {...props} />;
  }
}

/* ──────────────────────────────
   SCORE RING
   ────────────────────────────── */
function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} opacity={0.3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={score >= 90 ? '#4ADE80' : score >= 70 ? '#F59E0B' : '#EF4444'} strokeWidth={4} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
    </svg>
  );
}

/* ══════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════ */

export default function RBACPage() {
  // Core state
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'system' | 'custom'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('userCount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // UI state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'users' | 'permissions' | 'history'>('overview');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAssignUser, setShowAssignUser] = useState(false);
  const [showTempAccess, setShowTempAccess] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'permission' | 'create' | 'revoke' | 'update' | 'ai'>('all');

  // Dynamic feedback state
  const [exportingCsv, setExportingCsv] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [deletingRole, setDeletingRole] = useState<string | null>(null);
  const [clonedRole, setClonedRole] = useState<string | null>(null);
  const [assignedUser, setAssignedUser] = useState(false);
  const [tempAccessGranted, setTempAccessGranted] = useState(false);
  const [liveCounter, setLiveCounter] = useState(0);

  // Live pulse — simulates real-time activity
  useEffect(() => {
    const id = setInterval(() => setLiveCounter((c) => c + 1), 8000);
    return () => clearInterval(id);
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = roles
    .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase()))
    .filter((r) => levelFilter === 'all' || r.level === levelFilter)
    .filter((r) => statusFilter === 'all' || r.status === statusFilter);
  const sorted = sortRoles(filtered, sortKey, sortDir);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="h-3 w-3 text-[var(--fg-muted)] opacity-0 group-hover/th:opacity-100 transition-opacity" />;
    return sortDir === 'asc' ? <ChevronUp className="h-3 w-3 text-[#8B7355]" /> : <ChevronDown className="h-3 w-3 text-[#8B7355]" />;
  };

  const totalUsers = roles.reduce((s, r) => s + r.userCount, 0);
  const activeRoles = roles.filter((r) => r.status === 'active').length;
  const highRiskRoles = roles.filter((r) => r.riskScore === 'high').length;
  const countUpUsers = useCountUp(totalUsers);
  const countUpScore = useCountUp(GOVERNANCE_INSIGHTS.complianceScore);

  const filteredActivity = ACTIVITY_TIMELINE.filter(
    (a) => activityFilter === 'all' || a.type === activityFilter
  );

  /* ── HANDLERS ── */

  const handleExport = useCallback(() => {
    setExportingCsv(true);
    const csv = [
      ['Role', 'Type', 'Status', 'Users', 'Permissions', 'Risk', 'Last Modified'].join(','),
      ...roles.map((r) => [r.name, r.level, r.status, r.userCount, `${r.permissions}/${r.totalPermissions}`, r.riskScore, r.lastModified].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rbac-roles-export.csv'; a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setExportingCsv(false), 1800);
  }, [roles]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleToggleStatus = (roleId: string) => {
    setTogglingStatus(roleId);
    setTimeout(() => {
      setRoles((prev) => prev.map((r) => r.id === roleId ? { ...r, status: r.status === 'active' ? 'inactive' : 'active', lastModified: 'Apr 20, 2026' } : r));
      setTogglingStatus(null);
    }, 800);
  };

  const handleDeleteRole = (roleId: string) => {
    setDeletingRole(roleId);
    setTimeout(() => {
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      setDeletingRole(null);
    }, 600);
  };

  const handleCloneRole = (role: Role) => {
    const clone: Role = { ...role, id: `r-${Date.now()}`, name: `${role.name} (Copy)`, level: 'custom', lastModified: 'Apr 20, 2026' };
    setRoles((prev) => [...prev, clone]);
    setClonedRole(role.id);
    setTimeout(() => setClonedRole(null), 1500);
  };

  const handleAssignUser = (email: string) => {
    setAssignedUser(true);
    setTimeout(() => { setAssignedUser(false); setShowAssignUser(false); }, 1200);
  };

  const handleGrantTempAccess = () => {
    setTempAccessGranted(true);
    setTimeout(() => { setTempAccessGranted(false); setShowTempAccess(false); }, 1200);
  };

  return (
    <div className="sec-dashboard relative mx-auto w-full max-w-7xl">
      <div className="relative z-10 space-y-8">

        {/* ═══════ HERO HEADER ═══════ */}
        <div className="animate-stagger-1">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                <div className="sec-status-badge secure"><span className="sec-status-dot" /><span>RBAC Active</span></div>
                <div className="sec-status-badge" style={{ background: 'rgba(139,115,85,0.06)', border: '1px solid rgba(139,115,85,0.15)', color: '#8B7355' }}>
                  <Shield className="h-3 w-3" /><span>{activeRoles} roles enforced</span>
                </div>
                {highRiskRoles > 0 && (
                  <div className="sec-status-badge warning"><AlertTriangle className="h-3 w-3" /><span>{highRiskRoles} high-privilege</span></div>
                )}
                {/* Live pulse indicator */}
                <div className="flex items-center gap-1.5 ml-2">
                  <span className="h-2 w-2 rounded-full bg-[#4ADE80] animate-pulse" />
                  <span className="text-[10px] text-[var(--fg-muted)]">Live</span>
                </div>
              </div>
              <h1 className="sec-heading">Access Control <span className="sec-accent-text">Command Center</span></h1>
              <p className="text-[14px] text-[var(--fg-muted)] mt-2 leading-relaxed max-w-xl">
                Manage roles, permissions, and governance policies in real-time.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={handleRefresh} className="sec-action-btn">
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} /><span>{refreshing ? 'Syncing...' : 'Sync'}</span>
              </button>
              <button type="button" onClick={handleExport} className="sec-action-btn">
                <Download className={`h-3.5 w-3.5 ${exportingCsv ? 'animate-bounce' : ''}`} /><span>{exportingCsv ? 'Exported!' : 'Export'}</span>
              </button>
              <button type="button" onClick={() => setShowTemplates(true)} className="sec-action-btn primary">
                <Plus className="h-3.5 w-3.5" /><span>Create Role</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ KPI CARDS ═══════ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.05s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Total Roles</p>
              <div className="sec-kpi-icon-box blue"><Layers className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{roles.length}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">{activeRoles} active &middot; {roles.length - activeRoles} inactive</p>
            <div className="flex gap-1 mt-2">
              {roles.slice(0, 8).map((r) => (
                <div key={r.id} className="h-1.5 flex-1 rounded-full transition-all duration-500" style={{ background: r.status === 'active' ? r.color : 'var(--border)', opacity: r.status === 'active' ? 0.7 : 0.3 }} />
              ))}
            </div>
          </div>

          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.11s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Users Governed</p>
              <div className="sec-kpi-icon-box green"><Users className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{countUpUsers.toLocaleString()}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">Across {activeRoles} active roles</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-3 w-3 text-[#4ADE80]" />
              <span className="text-[10px] text-[#4ADE80] font-medium">+142 this month</span>
            </div>
          </div>

          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.17s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Governance Score</p>
              <div className="relative flex items-center justify-center">
                <ScoreRing score={GOVERNANCE_INSIGHTS.complianceScore} size={38} />
                <span className="absolute text-[9px] font-bold text-[var(--fg)]">{countUpScore}</span>
              </div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{countUpScore}%</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">Least-privilege compliance</p>
          </div>

          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.23s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Risk Alerts</p>
              <div className="sec-kpi-icon-box amber"><AlertTriangle className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{GOVERNANCE_INSIGHTS.overPrivileged}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">Over-privileged detected</p>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-[10px] text-[#F59E0B] font-medium">{GOVERNANCE_INSIGHTS.unusedPermissions} unused perms</span>
            </div>
          </div>
        </div>

        {/* ═══════ MAIN 2-COLUMN LAYOUT ═══════ */}
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">

          {/* LEFT: Roles Table */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="sec-section-icon"><Lock className="h-3.5 w-3.5 text-[#8B7355]" /></div>
              <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Roles & Permissions</h2>
              <span className="sec-count-badge">{roles.length}</span>
            </div>

            <div className="sec-table-card">
              {/* Toolbar */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 pb-0">
                <div className="sec-table-search">
                  <Search className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                  <input type="text" placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} className="sec-table-search-input" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Filter className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                    {(['all', 'system', 'custom'] as const).map((f) => (
                      <button key={f} type="button" onClick={() => setLevelFilter(f)} className={`sec-filter-chip ${levelFilter === f ? 'active' : ''}`}>
                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="h-4 w-px bg-[var(--border)]" />
                  {(['all', 'active', 'inactive'] as const).map((f) => (
                    <button key={f} type="button" onClick={() => setStatusFilter(f)} className={`sec-filter-chip ${statusFilter === f ? 'active' : ''}`}>
                      {f === 'all' ? 'Status' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="sec-table-head">
                      <th onClick={() => handleSort('name')} className="group/th sec-table-th cursor-pointer select-none"><div className="flex items-center gap-1">Role<SortIcon col="name" /></div></th>
                      <th className="sec-table-th">Type</th>
                      <th onClick={() => handleSort('userCount')} className="group/th sec-table-th cursor-pointer select-none"><div className="flex items-center gap-1">Users<SortIcon col="userCount" /></div></th>
                      <th onClick={() => handleSort('permissions')} className="group/th sec-table-th cursor-pointer select-none"><div className="flex items-center gap-1">Perms<SortIcon col="permissions" /></div></th>
                      <th onClick={() => handleSort('riskScore')} className="group/th sec-table-th cursor-pointer select-none"><div className="flex items-center gap-1">Risk<SortIcon col="riskScore" /></div></th>
                      <th className="sec-table-th">Status</th>
                      <th className="sec-table-th text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((role, idx) => (
                      <tr
                        key={role.id}
                        className={`sec-table-row ${idx % 2 === 1 ? 'striped' : ''} cursor-pointer transition-all duration-300 ${deletingRole === role.id ? 'opacity-0 scale-95' : ''}`}
                        onClick={() => { setSelectedRole(role); setDrawerTab('overview'); }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-110" style={{ background: `${role.color}12` }}>
                              <RoleIcon icon={role.icon} color={role.color} />
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--fg)] text-[12px]">{role.name}</p>
                              <p className="text-[10px] text-[var(--fg-muted)] mt-0.5 max-w-[160px] truncate">{role.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`sec-compliance-tag ${role.level === 'system' ? 'passed' : 'in-progress'}`}>
                            {role.level === 'system' ? 'System' : 'Custom'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[var(--fg-secondary)] font-medium text-[12px]">{role.userCount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="sec-progress-track" style={{ width: 44 }}>
                              <div className="sec-progress-fill transition-all duration-500" style={{ width: `${(role.permissions / role.totalPermissions) * 100}%`, background: role.permissions === role.totalPermissions ? '#EF4444' : role.permissions > 30 ? '#F59E0B' : '#8B7355' }} />
                            </div>
                            <span className="text-[10px] text-[var(--fg-secondary)]">{role.permissions}/{role.totalPermissions}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rbac-risk-badge" data-risk={role.riskScore}>
                            <span className="rbac-risk-dot" />
                            {role.riskScore}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <button type="button" onClick={() => handleToggleStatus(role.id)} className="sec-sev-tag cursor-pointer transition-all hover:scale-105" style={{
                            background: role.status === 'active' ? 'rgba(74,222,128,0.08)' : 'rgba(107,114,128,0.08)',
                            color: role.status === 'active' ? '#4ADE80' : '#6B7280',
                          }}>
                            {togglingStatus === role.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: role.status === 'active' ? '#4ADE80' : '#6B7280' }} />
                            )}
                            {togglingStatus === role.id ? '...' : role.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-0.5">
                            <button type="button" onClick={() => { setSelectedRole(role); setDrawerTab('overview'); }} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--fg-muted)] hover:text-[#8B7355]" title="View"><Eye className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => { setSelectedRole(role); setDrawerTab('permissions'); }} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--fg-muted)] hover:text-[#8B7355]" title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => handleCloneRole(role)} className={`p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-all text-[var(--fg-muted)] hover:text-[#8B7355] ${clonedRole === role.id ? 'text-[#4ADE80]! scale-110' : ''}`} title="Clone">
                              {clonedRole === role.id ? <Check className="h-3.5 w-3.5 text-[#4ADE80]" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                            {role.level === 'custom' && (
                              <button type="button" onClick={() => handleDeleteRole(role.id)} className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.06)] transition-colors text-[var(--fg-muted)] hover:text-[#EF4444]" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sorted.length === 0 && <div className="text-center py-10 text-[var(--fg-muted)] text-sm">No roles match your search.</div>}
              </div>
            </div>
          </div>

          {/* RIGHT: Compact Governance Panel */}
          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            {/* Governance Insights */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-[rgba(139,115,85,0.12)] transition-colors duration-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} />
                <h3 className="text-[12px] font-semibold text-[var(--fg)]">Governance</h3>
                <div className="ml-auto relative flex items-center justify-center">
                  <ScoreRing score={GOVERNANCE_INSIGHTS.complianceScore} size={32} />
                  <span className="absolute text-[8px] font-bold text-[var(--fg)]">{countUpScore}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[rgba(245,158,11,0.1)] flex items-center justify-center"><AlertTriangle className="h-3 w-3 text-[#F59E0B]" /></div>
                    <span className="text-[10px] font-medium text-[var(--fg)]">Over-Privileged</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#F59E0B]">{GOVERNANCE_INSIGHTS.overPrivileged}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[rgba(139,115,85,0.1)] flex items-center justify-center"><Key className="h-3 w-3 text-[#8B7355]" /></div>
                    <span className="text-[10px] font-medium text-[var(--fg)]">Unused Perms</span>
                  </div>
                  <span className="text-[13px] font-bold text-[var(--fg-secondary)]">{GOVERNANCE_INSIGHTS.unusedPermissions}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--bg-secondary)]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[rgba(74,222,128,0.1)] flex items-center justify-center"><UserCheck className="h-3 w-3 text-[#4ADE80]" /></div>
                    <span className="text-[10px] font-medium text-[var(--fg)]">Pending Reviews</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#8B7355]">{GOVERNANCE_INSIGHTS.pendingReviews}</span>
                </div>
              </div>
            </div>

            {/* Permission Heatmap — compact */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-[rgba(139,115,85,0.12)] transition-colors duration-200">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} />
                <h3 className="text-[12px] font-semibold text-[var(--fg)]">Permission Load</h3>
              </div>
              <div className="space-y-1.5">
                {roles.filter(r => r.status === 'active').slice(0, 5).map((role) => (
                  <div key={role.id} className="flex items-center gap-2">
                    <span className="text-[9px] text-[var(--fg-muted)] w-16 truncate">{role.name}</span>
                    <div className="flex-1 h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(role.permissions / role.totalPermissions) * 100}%`, background: `linear-gradient(90deg, ${role.color}40, ${role.color})` }} />
                    </div>
                    <span className="text-[9px] font-medium text-[var(--fg-secondary)] w-7 text-right">{Math.round((role.permissions / role.totalPermissions) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions — compact */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-[rgba(139,115,85,0.12)] transition-colors duration-200">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-3.5 w-3.5 text-[#F59E0B]" strokeWidth={1.5} />
                <h3 className="text-[12px] font-semibold text-[var(--fg)]">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setShowAssignUser(true)} className="rbac-quick-action">
                  <UserPlus className="h-3.5 w-3.5 text-[#8B7355]" />
                  <span>Assign User</span>
                </button>
                <button type="button" onClick={() => setShowTemplates(true)} className="rbac-quick-action">
                  <Copy className="h-3.5 w-3.5 text-[#6F5C46]" />
                  <span>Templates</span>
                </button>
                <button type="button" onClick={() => setShowTempAccess(true)} className="rbac-quick-action">
                  <Clock className="h-3.5 w-3.5 text-[#F59E0B]" />
                  <span>Temp Access</span>
                </button>
                <button type="button" onClick={() => { document.getElementById('perm-groups')?.scrollIntoView({ behavior: 'smooth' }); }} className="rbac-quick-action">
                  <GitBranch className="h-3.5 w-3.5 text-[#4ADE80]" />
                  <span>Hierarchy</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ PERMISSION GROUPS ═══════ */}
        <div id="perm-groups">
          <div className="flex items-center gap-2 mb-4">
            <div className="sec-section-icon"><Shield className="h-3.5 w-3.5 text-[#8B7355]" /></div>
            <h2 className="text-[13px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Permission Groups</h2>
            <span className="sec-count-badge">{PERMISSION_GROUPS.length}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PERMISSION_GROUPS.map((group, idx) => (
              <div key={group.group} className="sec-control-tile group" style={{ animation: `slide-up-fade 0.5s ease-out ${0.05 + idx * 0.06}s both` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {group.critical && <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444] animate-pulse" />}
                    <span className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">{group.permissions.length} perms</span>
                  </div>
                  <span className="text-[10px] text-[var(--fg-muted)]">{group.rolesUsing} roles</span>
                </div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="sec-control-icon">
                    {group.icon === 'users' && <Users className="h-4 w-4 text-[#8B7355]" />}
                    {group.icon === 'globe' && <Globe className="h-4 w-4 text-[#8B7355]" />}
                    {group.icon === 'activity' && <Activity className="h-4 w-4 text-[#8B7355]" />}
                    {group.icon === 'shield' && <Shield className="h-4 w-4 text-[#8B7355]" />}
                    {group.icon === 'settings' && <Settings className="h-4 w-4 text-[#8B7355]" />}
                    {group.icon === 'chart' && <BarChart3 className="h-4 w-4 text-[#8B7355]" />}
                  </div>
                  <h3 className="text-[12px] font-semibold text-[var(--fg)]">{group.group}</h3>
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.permissions.map((p) => (
                    <span key={p} className="rbac-perm-tag">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ ACTIVITY TIMELINE ═══════ */}
        <div className="sec-chart-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-[#8B7355]" strokeWidth={1.5} />
              <h3 className="text-[14px] font-semibold text-[var(--fg)] tracking-[-0.01em]">Activity Timeline</h3>
            </div>
            <div className="flex items-center gap-1">
              {(['all', 'permission', 'create', 'revoke', 'ai'] as const).map((f) => (
                <button key={f} type="button" onClick={() => setActivityFilter(f)} className={`sec-filter-chip ${activityFilter === f ? 'active' : ''}`}>
                  {f === 'all' ? 'All' : f === 'ai' ? 'AI' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-0">
            {filteredActivity.map((item) => (
              <div key={item.id} className="rbac-timeline-item">
                <div className="rbac-timeline-line" />
                <div className={`rbac-timeline-avatar ${item.type === 'ai' ? 'ai' : ''}`}>
                  {item.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[var(--fg)] leading-snug">{item.action}</p>
                  <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{item.user} &middot; {item.time}</p>
                </div>
                <span className={`rbac-activity-type ${item.type}`}>{item.type}</span>
              </div>
            ))}
            {filteredActivity.length === 0 && (
              <p className="text-center text-[var(--fg-muted)] text-[12px] py-6">No activity matching this filter</p>
            )}
          </div>
        </div>

        {/* ═══════ FOOTER ═══════ */}
        <div>
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <p className="text-[10px] text-[var(--fg-muted)] tracking-[0.04em] text-center pb-4 mt-4">
            RBAC policies enforced in real-time &middot; Powered by <span className="font-semibold sec-accent-text">GLIMMORA</span> Trust Engine &middot; SOC 2 Compliant
          </p>
        </div>

      </div>

      {/* ═══════ ROLE DETAIL DRAWER ═══════ */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedRole(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-l-2xl bg-[var(--card-bg)] border-l border-[var(--border)] shadow-2xl overflow-y-auto animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 bg-[var(--card-bg)] border-b border-[var(--border)] p-5 rounded-tl-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${selectedRole.color}15` }}>
                    <RoleIcon icon={selectedRole.icon} color={selectedRole.color} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[var(--fg)]">{selectedRole.name}</h3>
                    <p className="text-[10px] text-[var(--fg-muted)]">{selectedRole.description}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedRole(null)} className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--fg-muted)]">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-1">
                {(['overview', 'users', 'permissions', 'history'] as const).map((tab) => (
                  <button key={tab} type="button" onClick={() => setDrawerTab(tab)} className={`rbac-drawer-tab ${drawerTab === tab ? 'active' : ''}`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-5 space-y-5">
              {drawerTab === 'overview' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rbac-drawer-stat"><Users className="h-3.5 w-3.5 text-[#8B7355]" /><div><p className="text-[16px] font-bold text-[var(--fg)]">{selectedRole.userCount.toLocaleString()}</p><p className="text-[9px] text-[var(--fg-muted)]">Users</p></div></div>
                    <div className="rbac-drawer-stat"><Key className="h-3.5 w-3.5 text-[#4ADE80]" /><div><p className="text-[16px] font-bold text-[var(--fg)]">{selectedRole.permissions}</p><p className="text-[9px] text-[var(--fg-muted)]">Permissions</p></div></div>
                    <div className="rbac-drawer-stat"><AlertTriangle className="h-3.5 w-3.5" style={{ color: selectedRole.riskScore === 'high' ? '#EF4444' : selectedRole.riskScore === 'medium' ? '#F59E0B' : '#4ADE80' }} /><div><p className="text-[14px] font-bold text-[var(--fg)] capitalize">{selectedRole.riskScore}</p><p className="text-[9px] text-[var(--fg-muted)]">Risk</p></div></div>
                    <div className="rbac-drawer-stat"><Clock className="h-3.5 w-3.5 text-[var(--fg-muted)]" /><div><p className="text-[11px] font-bold text-[var(--fg)]">{selectedRole.lastModified}</p><p className="text-[9px] text-[var(--fg-muted)]">Modified</p></div></div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-[var(--fg)] mb-2">Permission Coverage</p>
                    <div className="h-3 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(selectedRole.permissions / selectedRole.totalPermissions) * 100}%`, background: `linear-gradient(90deg, ${selectedRole.color}80, ${selectedRole.color})` }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-[var(--fg-muted)]">{selectedRole.permissions}/{selectedRole.totalPermissions}</span>
                      <span className="text-[10px] font-medium" style={{ color: selectedRole.color }}>{Math.round((selectedRole.permissions / selectedRole.totalPermissions) * 100)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="rbac-meta-row"><span>Type</span><span className="capitalize">{selectedRole.level}</span></div>
                    <div className="rbac-meta-row"><span>Status</span><span className="capitalize">{selectedRole.status}</span></div>
                    <div className="rbac-meta-row"><span>Created</span><span>Jan 2025</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setDrawerTab('permissions')} className="flex-1 rbac-drawer-btn primary"><Edit3 className="h-3.5 w-3.5" />Edit</button>
                    <button type="button" onClick={() => { handleCloneRole(selectedRole); setSelectedRole(null); }} className="flex-1 rbac-drawer-btn"><Copy className="h-3.5 w-3.5" />Clone</button>
                    <button type="button" onClick={() => { handleToggleStatus(selectedRole.id); setSelectedRole(null); }} className="flex-1 rbac-drawer-btn">
                      {selectedRole.status === 'active' ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      {selectedRole.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </>
              )}

              {drawerTab === 'users' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-[var(--fg-muted)]">{selectedRole.userCount.toLocaleString()} users assigned</p>
                  {['alice@glimmora.com', 'bob@glimmora.com', 'charlie@glimmora.com', 'admin@glimmora.com', 'support@glimmora.com'].slice(0, Math.min(5, selectedRole.userCount)).map((email) => (
                    <div key={email} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
                      <div className="w-7 h-7 rounded-full bg-[rgba(139,115,85,0.1)] flex items-center justify-center text-[10px] font-bold text-[#8B7355]">
                        {email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-[var(--fg)] truncate">{email}</p>
                        <p className="text-[9px] text-[var(--fg-muted)]">Active 2h ago</p>
                      </div>
                      <button type="button" className="p-1 rounded-lg hover:bg-[rgba(239,68,68,0.06)] text-[var(--fg-muted)] hover:text-[#EF4444]"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                  {selectedRole.userCount > 5 && <p className="text-[10px] text-[#8B7355] font-medium text-center cursor-pointer hover:underline">View all {selectedRole.userCount.toLocaleString()} users</p>}
                  <button type="button" onClick={() => { setSelectedRole(null); setShowAssignUser(true); }} className="w-full rbac-drawer-btn primary"><UserPlus className="h-3.5 w-3.5" />Add User</button>
                </div>
              )}

              {drawerTab === 'permissions' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-[var(--fg-muted)]">{selectedRole.permissions} permissions across {PERMISSION_GROUPS.length} groups</p>
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.group} className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-[var(--fg)]">{group.group}</p>
                      <div className="flex flex-wrap gap-1">
                        {group.permissions.map((p) => (<span key={p} className="rbac-perm-tag">{p}</span>))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === 'history' && (
                <div className="space-y-3">
                  <p className="text-[11px] text-[var(--fg-muted)]">Recent changes</p>
                  {ACTIVITY_TIMELINE.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex gap-2.5 p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
                      <div className="w-5 h-5 rounded-full bg-[rgba(139,115,85,0.1)] flex items-center justify-center text-[8px] font-bold text-[#8B7355] shrink-0 mt-0.5">{item.avatar}</div>
                      <div><p className="text-[11px] text-[var(--fg)] leading-snug">{item.action}</p><p className="text-[9px] text-[var(--fg-muted)] mt-0.5">{item.time}</p></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ROLE TEMPLATES MODAL ═══════ */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTemplates(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-[var(--fg)]">Role Templates</h3>
                  <p className="text-[12px] text-[var(--fg-muted)] mt-1">Start from a template or create from scratch</p>
                </div>
                <button type="button" onClick={() => setShowTemplates(false)} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--fg-muted)]"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="p-6 space-y-3 max-h-[400px] overflow-y-auto">
              {ROLE_TEMPLATES.map((tmpl) => (
                <button key={tmpl.name} type="button" onClick={() => { setRoles((prev) => [...prev, { id: `r-${Date.now()}`, name: tmpl.name, description: tmpl.description, userCount: 0, permissions: tmpl.permissions, totalPermissions: 48, level: 'custom', status: 'active', lastModified: 'Apr 20, 2026', riskScore: 'low', icon: 'users', color: '#8B7355' }]); setShowTemplates(false); }} className="rbac-template-card group w-full text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-semibold text-[var(--fg)]">{tmpl.name}</h4>
                      <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{tmpl.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--fg-muted)]">{tmpl.permissions} perms</span>
                      <Plus className="h-3.5 w-3.5 text-[#8B7355] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </button>
              ))}
              <button type="button" className="rbac-template-card border-dashed flex items-center justify-center gap-2 py-4 cursor-pointer w-full" onClick={() => { setRoles((prev) => [...prev, { id: `r-${Date.now()}`, name: 'New Custom Role', description: 'Configure permissions for this role', userCount: 0, permissions: 0, totalPermissions: 48, level: 'custom', status: 'active', lastModified: 'Apr 20, 2026', riskScore: 'low', icon: 'users', color: '#8B7355' }]); setShowTemplates(false); }}>
                <Plus className="h-4 w-4 text-[#8B7355]" />
                <span className="text-[12px] font-medium text-[#8B7355]">Create from scratch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ASSIGN USER MODAL ═══════ */}
      {showAssignUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAssignUser(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[var(--fg)]">Assign User to Role</h3>
              <button type="button" onClick={() => setShowAssignUser(false)} className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--fg-muted)]"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--fg-secondary)] mb-1 block">Email Address</label>
                <input type="email" placeholder="user@company.com" className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/30" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--fg-secondary)] mb-1 block">Role</label>
                <select className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/30">
                  {roles.filter(r => r.status === 'active').map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                </select>
              </div>
              <button type="button" onClick={() => handleAssignUser('user@company.com')} className="w-full rbac-drawer-btn primary mt-2">
                {assignedUser ? <><Check className="h-3.5 w-3.5" />Assigned!</> : <><UserPlus className="h-3.5 w-3.5" />Assign User</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TEMP ACCESS MODAL ═══════ */}
      {showTempAccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTempAccess(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-2xl bg-[var(--card-bg)] border border-[var(--border)] shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[var(--fg)]">Grant Temporary Access</h3>
              <button type="button" onClick={() => setShowTempAccess(false)} className="p-1.5 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--fg-muted)]"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--fg-secondary)] mb-1 block">Email</label>
                <input type="email" placeholder="auditor@external.com" className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/30" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--fg-secondary)] mb-1 block">Role</label>
                <select className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/30">
                  {roles.filter(r => r.status === 'active').map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--fg-secondary)] mb-1 block">Duration</label>
                <select className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[#8B7355]/30">
                  <option>1 hour</option>
                  <option>4 hours</option>
                  <option>24 hours</option>
                  <option>7 days</option>
                  <option>30 days</option>
                </select>
              </div>
              <button type="button" onClick={handleGrantTempAccess} className="w-full rbac-drawer-btn primary mt-2">
                {tempAccessGranted ? <><Check className="h-3.5 w-3.5" />Granted!</> : <><Clock className="h-3.5 w-3.5" />Grant Access</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
