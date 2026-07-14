'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Key, Shield, Lock, Database, RefreshCw, Check, Clock, Globe,
  ArrowRight, AlertTriangle, CheckCircle, Settings, FileText,
  X, Eye, EyeOff, Copy, Download, Upload, Trash2, Plus,
  Sparkles, Activity, Zap, TrendingUp, TrendingDown, Search,
  ChevronDown, ChevronRight, Layers, Server, BarChart3,
  AlertCircle, RotateCcw, ShieldCheck, Fingerprint, Hash,
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
   CUSTOM DROPDOWN COMPONENT
   ────────────────────────────── */
interface DropdownOption { value: string; label: string; icon?: React.ReactNode; dot?: string }

function CustomDropdown({ options, value, onChange, icon }: { options: DropdownOption[]; value: string; onChange: (v: string) => void; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`enc-dropdown-trigger ${open ? 'enc-dropdown-open' : ''}`}
      >
        {icon && <span className="text-[var(--fg-muted)]">{icon}</span>}
        {selected?.dot && <span className="w-[6px] h-[6px] rounded-full" style={{ background: selected.dot }} />}
        <span className="flex-1 text-left truncate">{selected?.label || 'Select'}</span>
        <ChevronDown className={`h-3 w-3 text-[var(--fg-muted)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="enc-dropdown-menu">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`enc-dropdown-item ${value === opt.value ? 'enc-dropdown-item-active' : ''}`}
            >
              {opt.dot && <span className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: opt.dot }} />}
              {opt.icon && <span className="shrink-0">{opt.icon}</span>}
              <span className="flex-1 text-left">{opt.label}</span>
              {value === opt.value && <Check className="h-3 w-3 text-[#8B7355] shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────
   TYPES & MOCK DATA
   ────────────────────────────── */

interface EncryptionKey {
  id: string;
  name: string;
  algorithm: string;
  keySize: number;
  provider: string;
  status: 'active' | 'rotating' | 'expired' | 'revoked';
  created: string;
  lastRotated: string;
  nextRotation: string;
  usage: string;
  usageCount: number;
  environment: 'production' | 'staging' | 'development';
  fingerprint: string;
  tags: string[];
}

interface Standard {
  name: string;
  category: 'encryption' | 'protocol' | 'compliance' | 'storage';
  compliant: boolean;
  score: number;
  detail: string;
  lastAudit: string;
}

interface RotationEvent {
  id: string;
  keyName: string;
  from: string;
  to: string;
  timestamp: string;
  status: 'completed' | 'in-progress' | 'scheduled' | 'failed';
  initiator: string;
}

const INITIAL_KEYS: EncryptionKey[] = [
  { id: 'key-01', name: 'Master Data Key', algorithm: 'AES-256-GCM', keySize: 256, provider: 'AWS KMS', status: 'active', created: 'Jan 15, 2025', lastRotated: 'Apr 10, 2026', nextRotation: 'Jul 10, 2026', usage: 'At-rest encryption for all stored data', usageCount: 14283, environment: 'production', fingerprint: 'SHA256:9f:3a:b2:c1:d4:e5', tags: ['primary', 'at-rest'] },
  { id: 'key-02', name: 'Transit Key (TLS)', algorithm: 'TLS 1.3 / ECDHE', keySize: 384, provider: 'DigiCert', status: 'active', created: 'Mar 2, 2025', lastRotated: 'Mar 28, 2026', nextRotation: 'Jun 28, 2026', usage: 'In-transit encryption for all API & web traffic', usageCount: 892451, environment: 'production', fingerprint: 'SHA256:4d:7e:a1:f8:b2:c3', tags: ['transit', 'tls'] },
  { id: 'key-03', name: 'Token Signing Key', algorithm: 'RS256 (RSA-PSS)', keySize: 4096, provider: 'Internal HSM', status: 'active', created: 'Jun 12, 2025', lastRotated: 'Apr 1, 2026', nextRotation: 'Jul 1, 2026', usage: 'JWT signing, session tokens, OAuth2', usageCount: 203881, environment: 'production', fingerprint: 'SHA256:e2:f1:a9:c7:d3:b8', tags: ['signing', 'jwt'] },
  { id: 'key-04', name: 'Backup Encryption Key', algorithm: 'AES-256-CBC', keySize: 256, provider: 'AWS KMS', status: 'active', created: 'Feb 8, 2025', lastRotated: 'Feb 15, 2026', nextRotation: 'May 15, 2026', usage: 'Database backup encryption', usageCount: 847, environment: 'production', fingerprint: 'SHA256:b8:c4:d2:e9:f1:a6', tags: ['backup', 'at-rest'] },
  { id: 'key-05', name: 'PII Field Key', algorithm: 'AES-256-GCM', keySize: 256, provider: 'Internal HSM', status: 'rotating', created: 'Sep 20, 2025', lastRotated: 'Apr 18, 2026', nextRotation: 'Jul 18, 2026', usage: 'Sensitive field-level encryption (PII)', usageCount: 65210, environment: 'production', fingerprint: 'SHA256:a1:b3:c5:d7:e9:f2', tags: ['pii', 'field-level'] },
  { id: 'key-06', name: 'Staging Environment Key', algorithm: 'AES-256-GCM', keySize: 256, provider: 'AWS KMS', status: 'active', created: 'Nov 1, 2025', lastRotated: 'Apr 5, 2026', nextRotation: 'Jul 5, 2026', usage: 'All staging environment data', usageCount: 3281, environment: 'staging', fingerprint: 'SHA256:c2:d4:e6:f8:a1:b3', tags: ['staging'] },
  { id: 'key-07', name: 'Dev Signing Key', algorithm: 'Ed25519', keySize: 256, provider: 'Internal', status: 'active', created: 'Dec 10, 2025', lastRotated: 'Mar 10, 2026', nextRotation: 'Jun 10, 2026', usage: 'Development environment tokens', usageCount: 12044, environment: 'development', fingerprint: 'SHA256:f1:a2:b3:c4:d5:e6', tags: ['development', 'signing'] },
  { id: 'key-08', name: 'Legacy RSA Key', algorithm: 'RSA-2048', keySize: 2048, provider: 'DigiCert', status: 'expired', created: 'Jan 5, 2024', lastRotated: 'Jan 5, 2025', nextRotation: 'Expired', usage: 'Deprecated — migrated to RS256 4096', usageCount: 0, environment: 'production', fingerprint: 'SHA256:d9:e8:f7:a6:b5:c4', tags: ['deprecated', 'legacy'] },
];

const STANDARDS: Standard[] = [
  { name: 'AES-256 at Rest', category: 'encryption', compliant: true, score: 100, detail: 'All stored data encrypted with AES-256-GCM', lastAudit: 'Apr 15, 2026' },
  { name: 'TLS 1.3 in Transit', category: 'protocol', compliant: true, score: 100, detail: 'All API & web traffic uses TLS 1.3', lastAudit: 'Apr 15, 2026' },
  { name: 'Key Rotation (90-day)', category: 'compliance', compliant: true, score: 100, detail: 'Auto-rotation policy enforced on all keys', lastAudit: 'Apr 15, 2026' },
  { name: 'HSM Key Storage', category: 'storage', compliant: true, score: 100, detail: 'Critical keys stored in FIPS 140-2 L3 HSM', lastAudit: 'Apr 15, 2026' },
  { name: 'Forward Secrecy (ECDHE)', category: 'protocol', compliant: true, score: 100, detail: 'Perfect forward secrecy via ECDHE exchange', lastAudit: 'Apr 15, 2026' },
  { name: 'Zero-Knowledge PII', category: 'encryption', compliant: false, score: 68, detail: 'In progress — targeting Q3 2026 completion', lastAudit: 'Mar 28, 2026' },
  { name: 'Quantum-Safe Prep', category: 'compliance', compliant: false, score: 42, detail: 'Post-quantum algorithm evaluation ongoing', lastAudit: 'Mar 15, 2026' },
  { name: 'Certificate Pinning', category: 'protocol', compliant: true, score: 100, detail: 'Mobile & API clients pin to leaf certificate', lastAudit: 'Apr 10, 2026' },
];

const ROTATION_HISTORY: RotationEvent[] = [
  { id: 'rot-01', keyName: 'PII Field Key', from: 'v4', to: 'v5', timestamp: '2026-04-18 14:30', status: 'in-progress', initiator: 'Auto-Policy' },
  { id: 'rot-02', keyName: 'Master Data Key', from: 'v7', to: 'v8', timestamp: '2026-04-10 02:00', status: 'completed', initiator: 'Auto-Policy' },
  { id: 'rot-03', keyName: 'Staging Environment Key', from: 'v3', to: 'v4', timestamp: '2026-04-05 06:15', status: 'completed', initiator: 'admin@glimmora.com' },
  { id: 'rot-04', keyName: 'Token Signing Key', from: 'v2', to: 'v3', timestamp: '2026-04-01 02:00', status: 'completed', initiator: 'Auto-Policy' },
  { id: 'rot-05', keyName: 'Transit Key (TLS)', from: 'v5', to: 'v6', timestamp: '2026-03-28 02:00', status: 'completed', initiator: 'Auto-Policy' },
  { id: 'rot-06', keyName: 'Backup Encryption Key', from: 'v6', to: 'v7', timestamp: '2026-02-15 02:00', status: 'completed', initiator: 'Auto-Policy' },
];

const CRYPTO_HEALTH = {
  overallScore: 94,
  weakAlgorithms: 1,
  expiredKeys: 1,
  upcomingRotations: 3,
  avgKeyAge: 142,
};

const ENV_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All Environments', icon: <Globe className="h-3.5 w-3.5" /> },
  { value: 'production', label: 'Production', dot: '#8B7355' },
  { value: 'staging', label: 'Staging', dot: '#F59E0B' },
  { value: 'development', label: 'Development', dot: '#6B7280' },
];

const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All Status', icon: <Layers className="h-3.5 w-3.5" /> },
  { value: 'active', label: 'Active', dot: '#4ADE80' },
  { value: 'rotating', label: 'Rotating', dot: '#8B7355' },
  { value: 'expired', label: 'Expired', dot: '#EF4444' },
  { value: 'revoked', label: 'Revoked', dot: '#6B7280' },
];

/* ══════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════ */

export default function EncryptionPage() {
  const [keys, setKeys] = useState(INITIAL_KEYS);
  const [selectedKey, setSelectedKey] = useState<EncryptionKey | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateKey, setShowCreateKey] = useState(false);
  const [showAiScan, setShowAiScan] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [rotatedIds, setRotatedIds] = useState<Set<string>>(new Set());
  const [showFingerprint, setShowFingerprint] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'vault' | 'rotations' | 'standards'>('vault');

  // Live counters
  const [liveOps, setLiveOps] = useState(1482903);
  useEffect(() => {
    const id = setInterval(() => setLiveOps((c) => c + Math.floor(Math.random() * 12) + 1), 3000);
    return () => clearInterval(id);
  }, []);

  // Count-up animations
  const countKeys = useCountUp(keys.filter(k => k.status === 'active').length);
  const countOps = useCountUp(1482903);
  const countScore = useCountUp(CRYPTO_HEALTH.overallScore);
  const countRotations = useCountUp(ROTATION_HISTORY.filter(r => r.status === 'completed').length);

  // Handlers
  const handleRotate = useCallback((id: string) => {
    setRotatingId(id);
    setTimeout(() => {
      setRotatingId(null);
      setRotatedIds((prev) => new Set([...prev, id]));
      setKeys((prev) => prev.map((k) => k.id === id ? { ...k, lastRotated: 'Apr 20, 2026', status: 'active' as const } : k));
      setTimeout(() => setRotatedIds((prev) => { const next = new Set(prev); next.delete(id); return next; }), 2500);
    }, 2200);
  }, []);

  const handleRevoke = useCallback((id: string) => {
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, status: 'revoked' as const } : k));
    setSelectedKey(null);
  }, []);

  const handleCopyFingerprint = useCallback((id: string, fingerprint: string) => {
    navigator.clipboard.writeText(fingerprint);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCreateKey = useCallback((name: string, algorithm: string, env: string) => {
    const newKey: EncryptionKey = {
      id: `key-${Date.now()}`,
      name,
      algorithm,
      keySize: algorithm.includes('256') ? 256 : 4096,
      provider: 'Internal HSM',
      status: 'active',
      created: 'Apr 20, 2026',
      lastRotated: 'Apr 20, 2026',
      nextRotation: 'Jul 20, 2026',
      usage: 'Custom key',
      usageCount: 0,
      environment: env as EncryptionKey['environment'],
      fingerprint: `SHA256:${Math.random().toString(36).slice(2, 8)}`,
      tags: ['custom'],
    };
    setKeys((prev) => [newKey, ...prev]);
    setShowCreateKey(false);
  }, []);

  // Filters
  const filteredKeys = keys
    .filter((k) => envFilter === 'all' || k.environment === envFilter)
    .filter((k) => statusFilter === 'all' || k.status === statusFilter)
    .filter((k) => search === '' || k.name.toLowerCase().includes(search.toLowerCase()) || k.algorithm.toLowerCase().includes(search.toLowerCase()) || k.tags.some(t => t.includes(search.toLowerCase())));

  const activeKeys = keys.filter(k => k.status === 'active').length;
  const compliantCount = STANDARDS.filter(s => s.compliant).length;

  return (
    <div className="sec-dashboard relative mx-auto w-full max-w-7xl">
      <div className="relative z-10 space-y-6">

        {/* ═══════ HERO HEADER (no badges here) ═══════ */}
        <div className="animate-stagger-1">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="sec-heading">Encryption <span className="sec-accent-text">Management</span></h1>
              <p className="text-[14px] text-[var(--fg-muted)] mt-2 leading-relaxed max-w-xl">
                Central vault for key lifecycle, rotation policies, cryptographic health, and encryption standards.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button type="button" onClick={() => setShowCreateKey(true)} className="sec-action-btn primary">
                <Plus className="h-3.5 w-3.5" /><span>New Key</span>
              </button>
              <button type="button" onClick={() => setShowAiScan(true)} className="sec-action-btn primary">
                <Sparkles className="h-3.5 w-3.5" /><span>AI Scan</span>
              </button>
              <button type="button" onClick={() => setShowSettings(true)} className="sec-action-btn">
                <Settings className="h-3.5 w-3.5" /><span>Policy</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════ STATUS BADGES (above KPIs) ═══════ */}
        <div className="flex items-center gap-2.5 flex-wrap" style={{ animation: 'slide-up-fade 0.4s ease-out 0.02s both' }}>
          <div className="sec-status-badge secure"><span className="sec-status-dot" /><span>Vault Secured</span></div>
          <div className="sec-status-badge" style={{ background: 'rgba(139,115,85,0.06)', border: '1px solid rgba(139,115,85,0.15)', color: '#8B7355' }}>
            <Activity className="h-3 w-3" /><span>{liveOps.toLocaleString()} Ops</span>
          </div>
          {keys.some(k => k.status === 'rotating') && (
            <div className="sec-status-badge warning"><RefreshCw className="h-3 w-3" /><span>Rotation Active</span></div>
          )}
          {keys.some(k => k.status === 'expired') && (
            <div className="sec-status-badge incident"><AlertTriangle className="h-3 w-3" /><span>1 Expired Key</span></div>
          )}
          <span className="text-[10px] text-[var(--fg-muted)]">HSM-backed &middot; FIPS 140-2 L3</span>
        </div>

        {/* ═══════ KPI CARDS ═══════ */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.05s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Active Keys</p>
              <div className="sec-kpi-icon-box blue"><Key className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{countKeys}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">{keys.length} total &middot; {keys.filter(k => k.status === 'expired').length} expired</p>
          </div>
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.11s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Crypto Ops</p>
              <div className="sec-kpi-icon-box green"><Zap className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{(countOps / 1000).toFixed(0)}K</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">Encryptions this month</p>
          </div>
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.17s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Health Score</p>
              <div className="sec-kpi-icon-box blue"><ShieldCheck className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{countScore}%</p>
            <div className="mt-1.5">
              <div className="sec-progress-track" style={{ height: 4 }}>
                <div className="sec-progress-fill" style={{ width: `${CRYPTO_HEALTH.overallScore}%`, background: CRYPTO_HEALTH.overallScore >= 90 ? '#4ADE80' : '#F59E0B' }} />
              </div>
            </div>
          </div>
          <div className="sec-kpi-card" style={{ animation: 'slide-up-fade 0.5s ease-out 0.23s both' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--fg-muted)]">Rotations (90d)</p>
              <div className="sec-kpi-icon-box amber"><RotateCcw className="h-4 w-4 text-white" strokeWidth={1.5} /></div>
            </div>
            <p className="text-[28px] font-bold text-[var(--fg)] tracking-[-0.03em] leading-none">{countRotations}</p>
            <p className="text-[10px] text-[var(--fg-muted)] mt-1">{CRYPTO_HEALTH.upcomingRotations} upcoming &middot; 0 failed</p>
          </div>
        </div>

        {/* ═══════ SECTION TABS ═══════ */}
        <div className="flex items-center gap-1 border-b border-[var(--border)]">
          {([['vault', 'Key Vault'], ['rotations', 'Rotation Center'], ['standards', 'Standards']] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              className={`px-4 py-2.5 text-[12px] font-medium transition-colors relative ${activeSection === key ? 'text-[#8B7355]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}
            >
              {label}
              {activeSection === key && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8B7355] rounded-t" />}
            </button>
          ))}
        </div>

        {/* ═══════ KEY VAULT SECTION ═══════ */}
        {activeSection === 'vault' && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* LEFT — Key vault */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Filter bar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="sec-table-search flex-1 min-w-[180px]">
                  <Search className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search keys, algorithms, tags..." className="sec-table-search-input" />
                </div>
                <CustomDropdown options={ENV_OPTIONS} value={envFilter} onChange={setEnvFilter} />
                <CustomDropdown options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
                <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
                  <button type="button" onClick={() => setViewMode('grid')} className={`px-2.5 py-1.5 text-[11px] transition-colors ${viewMode === 'grid' ? 'bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : 'text-[var(--fg-muted)]'}`}>Grid</button>
                  <button type="button" onClick={() => setViewMode('list')} className={`px-2.5 py-1.5 text-[11px] transition-colors ${viewMode === 'list' ? 'bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : 'text-[var(--fg-muted)]'}`}>List</button>
                </div>
              </div>

              {/* Active filters */}
              {(envFilter !== 'all' || statusFilter !== 'all' || search) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-[var(--fg-muted)]">Filters:</span>
                  {envFilter !== 'all' && <span className="enc-active-chip">{envFilter} <button type="button" onClick={() => setEnvFilter('all')}><X className="h-2.5 w-2.5" /></button></span>}
                  {statusFilter !== 'all' && <span className="enc-active-chip">{statusFilter} <button type="button" onClick={() => setStatusFilter('all')}><X className="h-2.5 w-2.5" /></button></span>}
                  {search && <span className="enc-active-chip">&quot;{search}&quot; <button type="button" onClick={() => setSearch('')}><X className="h-2.5 w-2.5" /></button></span>}
                  <button type="button" onClick={() => { setEnvFilter('all'); setStatusFilter('all'); setSearch(''); }} className="text-[10px] text-[#8B7355] hover:underline">Clear all</button>
                </div>
              )}

              {/* Key cards — Grid view */}
              {viewMode === 'grid' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {filteredKeys.map((key, idx) => (
                    <div
                      key={key.id}
                      onClick={() => setSelectedKey(key)}
                      className="enc-key-card group cursor-pointer"
                      style={{ animation: `slide-up-fade 0.4s ease-out ${0.03 + idx * 0.04}s both` }}
                    >
                      {/* top accent bar */}
                      <div className={`enc-card-accent ${key.status}`} />
                      <div className="flex items-center justify-between mb-2.5">
                        <div className={`enc-status-pill ${key.status}`}>
                          <span className="enc-status-dot-sm" />
                          {key.status}
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-semibold tracking-wide uppercase ${key.environment === 'production' ? 'bg-[rgba(139,115,85,0.1)] text-[#8B7355]' : key.environment === 'staging' ? 'bg-[rgba(245,158,11,0.1)] text-[#F59E0B]' : 'bg-[rgba(107,114,128,0.1)] text-[#6B7280]'}`}>{key.environment}</span>
                      </div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="enc-key-icon">
                          <Lock className="h-4 w-4 text-[#8B7355]" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-[13px] font-semibold text-[var(--fg)] truncate">{key.name}</h3>
                          <p className="text-[10px] font-mono text-[var(--fg-muted)]">{key.algorithm}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-[var(--fg-secondary)] mb-2.5 line-clamp-1">{key.usage}</p>
                      <div className="flex items-center justify-between text-[10px] text-[var(--fg-muted)] mb-3">
                        <span>Rotated: {key.lastRotated}</span>
                        <span className="font-medium">{key.usageCount.toLocaleString()} ops</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {key.tags.map(tag => (
                          <span key={tag} className="enc-tag">{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRotate(key.id); }}
                          disabled={key.status === 'expired' || key.status === 'revoked'}
                          className="enc-action-btn flex-1"
                        >
                          {rotatingId === key.id
                            ? <><RefreshCw className="h-3 w-3 animate-spin" /> Rotating...</>
                            : rotatedIds.has(key.id)
                              ? <><Check className="h-3 w-3 text-[#4ADE80]" /> Done</>
                              : <><RefreshCw className="h-3 w-3" /> Rotate</>
                          }
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleCopyFingerprint(key.id, key.fingerprint); }}
                          className="enc-action-btn"
                          title="Copy fingerprint"
                        >
                          {copiedId === key.id ? <Check className="h-3 w-3 text-[#4ADE80]" /> : <Copy className="h-3 w-3" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Key cards — List view */}
              {viewMode === 'list' && (
                <div className="sec-chart-card overflow-hidden !p-0">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="sec-table-head">
                        <th className="sec-table-th py-3 pl-4">Key</th>
                        <th className="sec-table-th py-3">Algorithm</th>
                        <th className="sec-table-th py-3">Provider</th>
                        <th className="sec-table-th py-3">Status</th>
                        <th className="sec-table-th py-3">Env</th>
                        <th className="sec-table-th py-3">Last Rotated</th>
                        <th className="sec-table-th py-3 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredKeys.map((key) => (
                        <tr key={key.id} onClick={() => setSelectedKey(key)} className="sec-table-row cursor-pointer">
                          <td className="py-2.5 pl-4">
                            <div className="flex items-center gap-2">
                              <Lock className="h-3.5 w-3.5 text-[#8B7355]" />
                              <span className="text-[11px] font-medium text-[var(--fg)]">{key.name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 text-[10px] font-mono text-[var(--fg-muted)]">{key.algorithm}</td>
                          <td className="py-2.5 text-[10px] text-[var(--fg-muted)]">{key.provider}</td>
                          <td className="py-2.5">
                            <span className={`enc-status-pill ${key.status}`}><span className="enc-status-dot-sm" />{key.status}</span>
                          </td>
                          <td className="py-2.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${key.environment === 'production' ? 'bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : key.environment === 'staging' ? 'bg-[rgba(245,158,11,0.08)] text-[#F59E0B]' : 'bg-[rgba(107,114,128,0.08)] text-[#6B7280]'}`}>{key.environment}</span>
                          </td>
                          <td className="py-2.5 text-[10px] text-[var(--fg-muted)]">{key.lastRotated}</td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleRotate(key.id); }} className="enc-action-btn-sm" title="Rotate">
                                {rotatingId === key.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                              </button>
                              <button type="button" onClick={(e) => { e.stopPropagation(); handleCopyFingerprint(key.id, key.fingerprint); }} className="enc-action-btn-sm" title="Copy fingerprint">
                                {copiedId === key.id ? <Check className="h-3 w-3 text-[#4ADE80]" /> : <Fingerprint className="h-3 w-3" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* RIGHT — Insights panel */}
            <div className="w-full lg:w-[280px] shrink-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
              {/* Crypto Health */}
              <div className="sec-chart-card rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="h-4 w-4 text-[#4ADE80]" strokeWidth={1.5} />
                  <h3 className="text-[12px] font-semibold text-[var(--fg)]">Crypto Health</h3>
                </div>
                <div className="flex items-center justify-center mb-3">
                  <div className="relative w-20 h-20">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={CRYPTO_HEALTH.overallScore >= 90 ? '#4ADE80' : '#F59E0B'} strokeWidth="3" strokeDasharray={`${CRYPTO_HEALTH.overallScore}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[16px] font-bold text-[var(--fg)]">{CRYPTO_HEALTH.overallScore}%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--fg-muted)]">Weak Algorithms</span>
                    <span className={CRYPTO_HEALTH.weakAlgorithms > 0 ? 'text-[#F59E0B] font-medium' : 'text-[#4ADE80] font-medium'}>{CRYPTO_HEALTH.weakAlgorithms}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--fg-muted)]">Expired Keys</span>
                    <span className={CRYPTO_HEALTH.expiredKeys > 0 ? 'text-[#EF4444] font-medium' : 'text-[#4ADE80] font-medium'}>{CRYPTO_HEALTH.expiredKeys}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--fg-muted)]">Upcoming Rotations</span>
                    <span className="text-[#8B7355] font-medium">{CRYPTO_HEALTH.upcomingRotations}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-[var(--fg-muted)]">Avg Key Age</span>
                    <span className="text-[var(--fg)] font-medium">{CRYPTO_HEALTH.avgKeyAge}d</span>
                  </div>
                </div>
              </div>

              {/* Provider Distribution */}
              <div className="sec-chart-card rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="h-4 w-4 text-[#8B7355]" strokeWidth={1.5} />
                  <h3 className="text-[12px] font-semibold text-[var(--fg)]">Key Providers</h3>
                </div>
                <div className="space-y-2.5">
                  {[
                    { name: 'AWS KMS', count: keys.filter(k => k.provider === 'AWS KMS').length, color: '#8B7355' },
                    { name: 'Internal HSM', count: keys.filter(k => k.provider === 'Internal HSM').length, color: '#4ADE80' },
                    { name: 'DigiCert', count: keys.filter(k => k.provider === 'DigiCert').length, color: '#F59E0B' },
                    { name: 'Internal', count: keys.filter(k => k.provider === 'Internal').length, color: '#6B7280' },
                  ].filter(p => p.count > 0).map((prov) => (
                    <div key={prov.name} className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: prov.color }} />
                      <span className="text-[10px] text-[var(--fg-muted)] flex-1">{prov.name}</span>
                      <span className="text-[10px] font-medium text-[var(--fg)]">{prov.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="sec-chart-card rounded-2xl">
                <h3 className="text-[12px] font-semibold text-[var(--fg)] mb-3">Quick Actions</h3>
                <div className="space-y-1.5">
                  <button type="button" onClick={() => { keys.filter(k => k.status === 'active').forEach(k => handleRotate(k.id)); }} className="enc-quick-action">
                    <RefreshCw className="h-3.5 w-3.5 text-[#8B7355]" />
                    <span>Rotate All Keys</span>
                    <ChevronRight className="h-3 w-3 text-[var(--fg-muted)] ml-auto" />
                  </button>
                  <button type="button" onClick={() => setShowAiScan(true)} className="enc-quick-action">
                    <Sparkles className="h-3.5 w-3.5 text-[#8B7355]" />
                    <span>Run Security Scan</span>
                    <ChevronRight className="h-3 w-3 text-[var(--fg-muted)] ml-auto" />
                  </button>
                  <button type="button" onClick={() => setShowSettings(true)} className="enc-quick-action">
                    <FileText className="h-3.5 w-3.5 text-[#8B7355]" />
                    <span>Export Compliance</span>
                    <ChevronRight className="h-3 w-3 text-[var(--fg-muted)] ml-auto" />
                  </button>
                  <button type="button" onClick={() => setShowCreateKey(true)} className="enc-quick-action">
                    <Plus className="h-3.5 w-3.5 text-[#8B7355]" />
                    <span>Generate New Key</span>
                    <ChevronRight className="h-3 w-3 text-[var(--fg-muted)] ml-auto" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ ROTATION CENTER ═══════ */}
        {activeSection === 'rotations' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="sec-section-icon"><RotateCcw className="h-3.5 w-3.5 text-[#8B7355]" /></div>
              <h2 className="text-[13px] font-semibold text-[var(--fg)]">Rotation History & Schedule</h2>
              <span className="sec-count-badge">{ROTATION_HISTORY.length}</span>
            </div>

            <div className="sec-chart-card overflow-hidden !p-0">
              <table className="w-full text-left">
                <thead>
                  <tr className="sec-table-head">
                    <th className="sec-table-th py-3 pl-4">Key</th>
                    <th className="sec-table-th py-3">Version</th>
                    <th className="sec-table-th py-3">Timestamp</th>
                    <th className="sec-table-th py-3">Status</th>
                    <th className="sec-table-th py-3 pr-4">Initiator</th>
                  </tr>
                </thead>
                <tbody>
                  {ROTATION_HISTORY.map((event) => (
                    <tr key={event.id} className="sec-table-row">
                      <td className="py-3 pl-4">
                        <span className="text-[11px] font-medium text-[var(--fg)]">{event.keyName}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-[10px] font-mono text-[var(--fg-muted)]">{event.from} → {event.to}</span>
                      </td>
                      <td className="py-3 text-[10px] text-[var(--fg-muted)]">{event.timestamp}</td>
                      <td className="py-3">
                        <span className={`enc-status-pill ${event.status === 'completed' ? 'active' : event.status === 'in-progress' ? 'rotating' : event.status === 'failed' ? 'expired' : 'active'}`}>
                          <span className="enc-status-dot-sm" />
                          {event.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-[10px] text-[var(--fg-muted)]">{event.initiator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rotation policy cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sec-control-tile">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-[#8B7355]" />
                  <h3 className="text-[12px] font-semibold text-[var(--fg)]">Auto-Rotation</h3>
                </div>
                <p className="text-[10px] text-[var(--fg-muted)] mb-2">Keys are rotated every 90 days automatically via policy engine.</p>
                <div className="flex items-center gap-2">
                  <span className="enc-status-pill active"><span className="enc-status-dot-sm" />Enabled</span>
                  <span className="text-[9px] text-[var(--fg-muted)]">Next: May 15, 2026</span>
                </div>
              </div>
              <div className="sec-control-tile">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-[#4ADE80]" />
                  <h3 className="text-[12px] font-semibold text-[var(--fg)]">Zero-Downtime</h3>
                </div>
                <p className="text-[10px] text-[var(--fg-muted)] mb-2">Dual-key overlap ensures no service interruption during rotation.</p>
                <div className="flex items-center gap-2">
                  <span className="enc-status-pill active"><span className="enc-status-dot-sm" />Active</span>
                  <span className="text-[9px] text-[var(--fg-muted)]">Overlap: 24h</span>
                </div>
              </div>
              <div className="sec-control-tile">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                  <h3 className="text-[12px] font-semibold text-[var(--fg)]">Emergency Revoke</h3>
                </div>
                <p className="text-[10px] text-[var(--fg-muted)] mb-2">Instant key revocation with automatic failover to backup.</p>
                <button type="button" className="enc-action-btn text-[#EF4444] border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.05)]">
                  <AlertCircle className="h-3 w-3" /> Emergency Revoke
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ STANDARDS MATRIX ═══════ */}
        {activeSection === 'standards' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="sec-section-icon"><Shield className="h-3.5 w-3.5 text-[#8B7355]" /></div>
                <h2 className="text-[13px] font-semibold text-[var(--fg)]">Encryption Standards & Compliance</h2>
                <span className="sec-count-badge">{compliantCount}/{STANDARDS.length}</span>
              </div>
              <span className="sec-metric-pill">{Math.round((compliantCount / STANDARDS.length) * 100)}% Compliant</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {STANDARDS.map((std, idx) => (
                <div key={std.name} className="sec-control-tile" style={{ animation: `slide-up-fade 0.4s ease-out ${0.03 + idx * 0.04}s both` }}>
                  <div className="flex items-start gap-3">
                    <div className={`sec-check-box ${std.compliant ? 'done' : ''}`} style={{ width: 22, height: 22, flexShrink: 0 }}>
                      {std.compliant && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-[12px] font-semibold ${std.compliant ? 'text-[var(--fg)]' : 'text-[var(--fg-secondary)]'}`}>{std.name}</h3>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${std.category === 'encryption' ? 'bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : std.category === 'protocol' ? 'bg-[rgba(74,222,128,0.08)] text-[#4ADE80]' : std.category === 'compliance' ? 'bg-[rgba(245,158,11,0.08)] text-[#F59E0B]' : 'bg-[rgba(107,114,128,0.08)] text-[#6B7280]'}`}>{std.category}</span>
                      </div>
                      <p className="text-[10px] text-[var(--fg-muted)] mb-2">{std.detail}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="sec-progress-track" style={{ height: 4 }}>
                            <div className="sec-progress-fill" style={{ width: `${std.score}%`, background: std.score === 100 ? '#4ADE80' : std.score >= 60 ? '#F59E0B' : '#EF4444' }} />
                          </div>
                        </div>
                        <span className="text-[9px] font-medium text-[var(--fg-muted)]">{std.score}%</span>
                      </div>
                      <p className="text-[9px] text-[var(--fg-muted)] mt-1.5">Last audit: {std.lastAudit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ FOOTER ═══════ */}
        <div>
          <div className="h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
          <p className="text-[10px] text-[var(--fg-muted)] tracking-[0.04em] text-center pb-4 mt-4">
            Encryption managed by <span className="font-semibold sec-accent-text">GLIMMORA</span> Trust Engine &middot; HSM-backed &middot; FIPS 140-2 Level 3
          </p>
        </div>

      </div>

      {/* ═══════ KEY DETAIL DRAWER ═══════ */}
      {selectedKey && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedKey(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-[var(--bg)] border-l border-[var(--border)] h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <style jsx>{`
              @keyframes slide-in-drawer { from { transform: translateX(100%); } to { transform: translateX(0); } }
              .drawer-animate { animation: slide-in-drawer 0.3s ease-out; }
            `}</style>
            <div className="drawer-animate p-6 space-y-5">
              {/* Drawer header */}
              <div className="flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-[var(--fg)]">Key Details</h2>
                <button type="button" onClick={() => setSelectedKey(null)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                  <X className="h-4 w-4 text-[var(--fg-muted)]" />
                </button>
              </div>

              {/* Key identity */}
              <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="enc-key-icon"><Lock className="h-5 w-5 text-[#8B7355]" /></div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[var(--fg)]">{selectedKey.name}</h3>
                    <p className="text-[11px] text-[var(--fg-muted)]">{selectedKey.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`enc-status-pill ${selectedKey.status}`}><span className="enc-status-dot-sm" />{selectedKey.status}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${selectedKey.environment === 'production' ? 'bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : selectedKey.environment === 'staging' ? 'bg-[rgba(245,158,11,0.08)] text-[#F59E0B]' : 'bg-[rgba(107,114,128,0.08)] text-[#6B7280]'}`}>{selectedKey.environment}</span>
                  {selectedKey.tags.map(tag => <span key={tag} className="enc-tag">{tag}</span>)}
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">Configuration</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Algorithm', selectedKey.algorithm],
                    ['Key Size', `${selectedKey.keySize}-bit`],
                    ['Created', selectedKey.created],
                    ['Last Rotated', selectedKey.lastRotated],
                    ['Next Rotation', selectedKey.nextRotation],
                    ['Usage Count', selectedKey.usageCount.toLocaleString()],
                  ].map(([label, val]) => (
                    <div key={label} className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
                      <p className="text-[9px] text-[var(--fg-muted)] mb-0.5">{label}</p>
                      <p className="text-[11px] font-medium text-[var(--fg)]">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fingerprint */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">Fingerprint</h4>
                <div className="flex items-center gap-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] font-mono text-[11px] text-[var(--fg-secondary)]">
                  {showFingerprint === selectedKey.id ? (
                    <span className="flex-1 break-all">{selectedKey.fingerprint}</span>
                  ) : (
                    <span className="flex-1">••••••••••••••••••</span>
                  )}
                  <button type="button" onClick={() => setShowFingerprint(showFingerprint === selectedKey.id ? null : selectedKey.id)} className="p-1 rounded hover:bg-[var(--bg-secondary)]">
                    {showFingerprint === selectedKey.id ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button type="button" onClick={() => handleCopyFingerprint(selectedKey.id, selectedKey.fingerprint)} className="p-1 rounded hover:bg-[var(--bg-secondary)]">
                    {copiedId === selectedKey.id ? <Check className="h-3.5 w-3.5 text-[#4ADE80]" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Usage */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">Purpose</h4>
                <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">{selectedKey.usage}</p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button type="button" onClick={() => handleRotate(selectedKey.id)} disabled={selectedKey.status === 'expired' || selectedKey.status === 'revoked'} className="w-full enc-action-btn justify-center py-2.5">
                  {rotatingId === selectedKey.id ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Rotating...</> : <><RefreshCw className="h-3.5 w-3.5" /> Rotate Key Now</>}
                </button>
                {selectedKey.status !== 'revoked' && (
                  <button type="button" onClick={() => handleRevoke(selectedKey.id)} className="w-full enc-action-btn justify-center py-2.5 text-[#EF4444] border-[rgba(239,68,68,0.2)] hover:bg-[rgba(239,68,68,0.05)]">
                    <Trash2 className="h-3.5 w-3.5" /> Revoke Key
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ CREATE KEY MODAL ═══════ */}
      {showCreateKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateKey(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-[var(--bg)] rounded-2xl border border-[var(--border)] shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-[var(--fg)]">Generate New Key</h2>
              <button type="button" onClick={() => setShowCreateKey(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]">
                <X className="h-4 w-4 text-[var(--fg-muted)]" />
              </button>
            </div>
            <CreateKeyForm onSubmit={handleCreateKey} />
          </div>
        </div>
      )}

      {/* ═══════ AI SECURITY SCAN MODAL ═══════ */}
      {showAiScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAiScan(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-[var(--bg)] rounded-2xl border border-[var(--border)] shadow-xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#8B7355]" />
                <h2 className="text-[16px] font-bold text-[var(--fg)]">AI Security Scan</h2>
              </div>
              <button type="button" onClick={() => setShowAiScan(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]">
                <X className="h-4 w-4 text-[var(--fg-muted)]" />
              </button>
            </div>
            <p className="text-[12px] text-[var(--fg-muted)] mb-4">AI-powered analysis of your encryption posture, key health, and vulnerability detection.</p>
            <div className="space-y-3">
              {[
                { severity: 'high', title: 'Legacy RSA-2048 key still present', description: 'key-08 uses RSA-2048 which is below recommended strength. Migrate to RSA-4096 or Ed25519.', action: 'Revoke & Migrate' },
                { severity: 'medium', title: 'PII Field Key rotation in progress for 48h+', description: 'Rotation started Apr 18 but has not completed. Verify HSM connectivity.', action: 'Check Status' },
                { severity: 'low', title: 'Staging key uses same provider as production', description: 'Consider using a separate KMS instance for staging to reduce blast radius.', action: 'Review Policy' },
                { severity: 'info', title: 'Post-quantum readiness at 42%', description: 'Begin evaluating CRYSTALS-Kyber and CRYSTALS-Dilithium for future migration.', action: 'View Roadmap' },
                { severity: 'low', title: 'Certificate pinning renewal due in 60 days', description: 'DigiCert leaf certificate expires Jun 19. Plan renewal and pin update.', action: 'Schedule' },
              ].map((finding, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-[var(--border)] hover:border-[rgba(139,115,85,0.12)] transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-0.5 text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${finding.severity === 'high' ? 'bg-[rgba(239,68,68,0.08)] text-[#EF4444]' : finding.severity === 'medium' ? 'bg-[rgba(245,158,11,0.08)] text-[#F59E0B]' : finding.severity === 'info' ? 'bg-[rgba(139,115,85,0.08)] text-[#8B7355]' : 'bg-[rgba(107,114,128,0.08)] text-[#6B7280]'}`}>{finding.severity}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-semibold text-[var(--fg)] mb-0.5">{finding.title}</h4>
                      <p className="text-[10px] text-[var(--fg-muted)] mb-2">{finding.description}</p>
                      <button type="button" className="text-[10px] font-medium text-[#8B7355] hover:underline">{finding.action} →</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ SETTINGS / POLICY MODAL ═══════ */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-[var(--bg)] rounded-2xl border border-[var(--border)] shadow-xl p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-[var(--fg)]">Encryption Policy</h2>
              <button type="button" onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)]">
                <X className="h-4 w-4 text-[var(--fg-muted)]" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Auto-Rotation (90 days)', enabled: true, desc: 'Automatically rotate all keys every 90 days' },
                { label: 'HSM Key Storage', enabled: true, desc: 'Store all production keys in hardware security module' },
                { label: 'Dual-Key Overlap', enabled: true, desc: '24-hour overlap window during key rotation' },
                { label: 'Weak Algorithm Alert', enabled: true, desc: 'Alert when keys use algorithms below threshold' },
                { label: 'Auto-Revoke Expired', enabled: false, desc: 'Automatically revoke keys past expiration date' },
                { label: 'Quantum-Safe Enforcement', enabled: false, desc: 'Require post-quantum algorithms for new keys' },
              ].map((policy) => (
                <PolicyToggle key={policy.label} {...policy} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────
   SUB-COMPONENTS
   ────────────────────────────── */

function CreateKeyForm({ onSubmit }: { onSubmit: (name: string, algo: string, env: string) => void }) {
  const [name, setName] = useState('');
  const [algo, setAlgo] = useState('AES-256-GCM');
  const [env, setEnv] = useState('production');

  return (
    <div className="space-y-4">
      <div>
        <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 block">Key Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Payment Encryption Key" className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[12px] text-[var(--fg)] focus:outline-none focus:border-[#8B7355] transition-colors" />
      </div>
      <div>
        <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 block">Algorithm</label>
        <select value={algo} onChange={(e) => setAlgo(e.target.value)} className="enc-select w-full">
          <option value="AES-256-GCM">AES-256-GCM</option>
          <option value="AES-256-CBC">AES-256-CBC</option>
          <option value="RSA-4096">RSA-4096</option>
          <option value="Ed25519">Ed25519</option>
          <option value="ECDSA P-384">ECDSA P-384</option>
        </select>
      </div>
      <div>
        <label className="text-[11px] font-medium text-[var(--fg-muted)] mb-1.5 block">Environment</label>
        <select value={env} onChange={(e) => setEnv(e.target.value)} className="enc-select w-full">
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
        </select>
      </div>
      <button type="button" onClick={() => { if (name.trim()) onSubmit(name.trim(), algo, env); }} disabled={!name.trim()} className="w-full py-2.5 rounded-xl bg-[#8B7355] text-white text-[12px] font-medium hover:bg-[#6F5C46] disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
        Generate Key
      </button>
    </div>
  );
}

function PolicyToggle({ label, enabled: initialEnabled, desc }: { label: string; enabled: boolean; desc: string }) {
  const [enabled, setEnabled] = useState(initialEnabled);

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border)] hover:border-[rgba(139,115,85,0.12)] transition-colors">
      <button type="button" onClick={() => setEnabled(!enabled)} className={`mt-0.5 w-8 h-[18px] rounded-full flex items-center px-0.5 transition-colors shrink-0 ${enabled ? 'bg-[#8B7355]' : 'bg-[var(--border)]'}`}>
        <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-3.5' : 'translate-x-0'}`} />
      </button>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-[var(--fg)]">{label}</p>
        <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
