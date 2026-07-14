'use client';
import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useProperties } from '@/hooks/use-properties';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';
import {
  MapPin, Brain, Layers, Filter, Building2, TrendingUp, Shield,
  ChevronRight, X, Crown, BarChart3, Globe, Zap, ArrowUpRight,
  DollarSign, Maximize2, Activity,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { PropertyType } from '@/types/property';

/* SSR-safe dynamic import — Leaflet cannot run on server */
const PropertyMap = dynamic(() => import('@/components/map/property-map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-[var(--bg)]">
      <div className="flex flex-col items-center gap-3">
        <Globe className="h-8 w-8 text-[var(--fg-muted)] animate-pulse" strokeWidth={1.5} />
        <p className="text-[12px] text-[var(--fg-muted)]">Loading map...</p>
      </div>
    </div>
  ),
});

const LAYERS = [
  { id: 'Properties', icon: Building2, color: '#8B7355' },
  { id: 'Risk Heatmap', icon: Shield, color: '#EF4444' },
  { id: 'Demand', icon: BarChart3, color: '#4ADE80' },
  { id: 'Infrastructure', icon: Zap, color: '#F59E0B' },
];

const PROPERTY_TYPES: { label: string; value: PropertyType | 'all' }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Residential', value: 'residential' },
  { label: 'Commercial', value: 'commercial' },
  { label: 'Mixed-Use', value: 'mixed-use' },
  { label: 'Land', value: 'land' },
];

const BUDGET_RANGES = [
  { label: 'Any Budget', min: 0, max: Infinity },
  { label: 'Under $1M', min: 0, max: 1_000_000 },
  { label: '$1M – $5M', min: 1_000_000, max: 5_000_000 },
  { label: '$5M – $20M', min: 5_000_000, max: 20_000_000 },
  { label: '$20M+', min: 20_000_000, max: Infinity },
];

function scoreColor(score: number) {
  if (score >= 90) return '#4ADE80';
  if (score >= 80) return '#8B7355';
  if (score >= 70) return '#F59E0B';
  return '#EF4444';
}

function riskBadge(risk: string) {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    low: { bg: 'rgba(74,222,128,0.08)', text: '#4ADE80', border: 'rgba(74,222,128,0.15)' },
    medium: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', border: 'rgba(245,158,11,0.15)' },
    high: { bg: 'rgba(239,68,68,0.08)', text: '#EF4444', border: 'rgba(239,68,68,0.15)' },
  };
  return colors[risk] || colors.medium;
}

export default function MapViewPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeLayer, setActiveLayer] = useState('Properties');
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState<PropertyType | 'all'>('all');
  const [budgetIdx, setBudgetIdx] = useState(0);
  const [minYield, setMinYield] = useState(0);
  const [minAiScore, setMinAiScore] = useState(0);

  const budget = BUDGET_RANGES[budgetIdx];

  const { properties } = useProperties({ limit: 100 });

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (p.price.amount < budget.min || p.price.amount > budget.max) return false;
      if (p.rentalYield < minYield) return false;
      if (p.aiScore < minAiScore) return false;
      return true;
    });
  }, [properties, typeFilter, budget, minYield, minAiScore]);

  const selectedProp = filteredProperties.find((p) => p.id === selected) || null;

  const activeFilterCount = [
    typeFilter !== 'all',
    budgetIdx !== 0,
    minYield > 0,
    minAiScore > 0,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-[calc(100vh-var(--spacing-topbar))] overflow-hidden">

      {/* ─── TOP BAR ─── */}
      <div className="flex items-center justify-between px-4 lg:px-5 py-3 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[rgba(139,115,85,0.12)] to-[rgba(139,115,85,0.06)] border border-[rgba(139,115,85,0.1)] flex items-center justify-center">
              <Globe className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[14px] font-semibold text-[var(--fg)]">Property Map</h1>
                <span className="flex items-center gap-1 rounded-full bg-[rgba(74,222,128,0.1)] border border-[rgba(74,222,128,0.2)] px-1.5 py-0.5 text-[9px] font-semibold text-[#4ADE80]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[10px] text-[var(--fg-muted)]">
                {filteredProperties.length} properties · {new Set(filteredProperties.map(p => p.location.country)).size} countries
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer toggles */}
          <div className="hidden md:flex items-center gap-1 mr-2">
            {LAYERS.map((layer) => {
              const Icon = layer.icon;
              const isActive = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all cursor-pointer',
                    isActive
                      ? 'text-[var(--fg)]'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] hover:bg-[var(--bg-secondary)]'
                  )}
                  style={isActive ? {
                    background: `${layer.color}12`,
                    border: `1px solid ${layer.color}25`,
                    color: layer.color,
                  } : { border: '1px solid transparent' }}
                >
                  <Icon className="h-3 w-3" strokeWidth={1.5} />
                  {layer.id}
                </button>
              );
            })}
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all cursor-pointer border',
              showFilters
                ? 'bg-[rgba(139,115,85,0.08)] border-[rgba(139,115,85,0.2)] text-[#8B7355]'
                : 'border-[var(--border)] text-[var(--fg-secondary)] hover:border-[rgba(139,115,85,0.2)] hover:text-[var(--fg)]'
            )}
          >
            <Filter className="h-3 w-3" strokeWidth={1.5} />
            Filters
            {activeFilterCount > 0 && (
              <span className="h-4 min-w-4 flex items-center justify-center rounded-full bg-[#8B7355] text-[9px] font-bold text-[#1A1A1A] px-1">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Panel toggle */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className="hidden lg:flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium border border-[var(--border)] text-[var(--fg-secondary)] hover:text-[var(--fg)] transition-all cursor-pointer"
          >
            <Maximize2 className="h-3 w-3" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* ─── FILTER BAR (collapsible) ─── */}
      {showFilters && (
        <div className="px-4 lg:px-5 py-3 border-b border-[var(--border)] bg-[var(--bg)]/60 backdrop-blur-md z-10 shrink-0"
          style={{ animation: 'slide-up-fade 0.2s ease-out' }}
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Type */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold">Type</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as PropertyType | 'all')}
                className="map-filter-select"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-[var(--border)]" />

            {/* Budget */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold">Budget</span>
              <select
                value={budgetIdx}
                onChange={(e) => setBudgetIdx(Number(e.target.value))}
                className="map-filter-select"
              >
                {BUDGET_RANGES.map((b, i) => (
                  <option key={i} value={i}>{b.label}</option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-[var(--border)]" />

            {/* Min Yield */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold">Min Yield</span>
              <select
                value={minYield}
                onChange={(e) => setMinYield(Number(e.target.value))}
                className="map-filter-select"
              >
                <option value={0}>Any</option>
                <option value={3}>3%+</option>
                <option value={4}>4%+</option>
                <option value={5}>5%+</option>
                <option value={6}>6%+</option>
              </select>
            </div>

            <div className="h-4 w-px bg-[var(--border)]" />

            {/* Min AI Score */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold">AI Score</span>
              <select
                value={minAiScore}
                onChange={(e) => setMinAiScore(Number(e.target.value))}
                className="map-filter-select"
              >
                <option value={0}>Any</option>
                <option value={70}>70+</option>
                <option value={80}>80+</option>
                <option value={90}>90+</option>
              </select>
            </div>

            {activeFilterCount > 0 && (
              <>
                <div className="h-4 w-px bg-[var(--border)]" />
                <button
                  onClick={() => { setTypeFilter('all'); setBudgetIdx(0); setMinYield(0); setMinAiScore(0); }}
                  className="text-[11px] text-[#EF4444]/70 hover:text-[#EF4444] transition-colors cursor-pointer"
                >
                  Clear all
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── MAP + PANEL ─── */}
      <div className="flex flex-1 min-h-0 relative">

        {/* Map */}
        <div className="flex-1 relative">
          <PropertyMap
            properties={filteredProperties}
            selectedId={selected}
            onSelect={setSelected}
            activeLayer={activeLayer}
            onHover={setHovered}
            isDark={isDark}
          />

          {/* Map legend overlay */}
          {activeLayer !== 'Properties' && (
            <div className="absolute bottom-4 left-4 z-[500] rounded-xl bg-[var(--bg-elevated)] backdrop-blur-xl border border-[var(--border)] px-4 py-3 shadow-lg"
              style={{ animation: 'slide-up-fade 0.2s ease-out' }}
            >
              <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold mb-2">
                {activeLayer} Legend
              </p>
              <div className="flex items-center gap-4">
                {activeLayer === 'Risk Heatmap' && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]" />
                      <span className="text-[11px] text-[var(--fg-secondary)]">Low</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                      <span className="text-[11px] text-[var(--fg-secondary)]">Medium</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                      <span className="text-[11px] text-[var(--fg-secondary)]">High</span>
                    </div>
                  </>
                )}
                {activeLayer === 'Demand' && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80]" />
                      <span className="text-[11px] text-[var(--fg-secondary)]">High Demand</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                      <span className="text-[11px] text-[var(--fg-secondary)]">Moderate</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[var(--fg-muted)]" />
                      <span className="text-[11px] text-[var(--fg-secondary)]">Low</span>
                    </div>
                  </>
                )}
                {activeLayer === 'Infrastructure' && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#8B7355]" />
                      <span className="text-[11px] text-[var(--fg-secondary)]">Development Zones</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Property count overlay */}
          <div className="absolute top-4 left-4 z-[500] rounded-xl bg-[var(--bg-elevated)] backdrop-blur-xl border border-[var(--border)] px-3 py-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} />
              <span className="text-[12px] font-medium text-[var(--fg)]">{filteredProperties.length}</span>
              <span className="text-[11px] text-[var(--fg-muted)]">properties</span>
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL ─── */}
        {panelOpen && (
          <div className="hidden lg:flex w-[340px] flex-col border-l border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md overflow-hidden shrink-0">

            {/* Panel header */}
            <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} />
                <span className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[var(--fg-muted)]">
                  {selectedProp ? 'Property Detail' : 'All Properties'}
                </span>
              </div>
              {selectedProp && (
                <button
                  onClick={() => setSelected(null)}
                  className="h-6 w-6 rounded-md flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">

              {/* ── SELECTED PROPERTY DETAIL ── */}
              {selectedProp ? (
                <div className="p-4 space-y-4" style={{ animation: 'slide-up-fade 0.25s ease-out' }}>
                  {/* Image */}
                  <div className="relative h-44 rounded-xl overflow-hidden bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-tertiary)]">
                    <div className="p-card-img-skeleton" />
                    <img
                      src={selectedProp.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop&q=80'}
                      alt={selectedProp.title}
                      className="h-full w-full object-cover relative"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop&q=80';
                        if (target.src !== fallback) target.src = fallback;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,12,16,0.5)] via-transparent to-[rgba(10,12,16,0.2)]" />
                    {/* AI Score ring */}
                    <div className="absolute top-3 right-3 z-10">
                      <div
                        className="flex items-center justify-center w-9 h-9 rounded-full text-[11px] font-bold backdrop-blur-md"
                        style={{
                          background: `${scoreColor(selectedProp.aiScore)}12`,
                          border: `2px solid ${scoreColor(selectedProp.aiScore)}40`,
                          color: scoreColor(selectedProp.aiScore),
                        }}
                      >
                        {selectedProp.aiScore}
                      </div>
                    </div>
                    {/* Luxury badge */}
                    {selectedProp.isLuxury && (
                      <div className="absolute bottom-3 left-3 z-10">
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold bg-[rgba(139,115,85,0.1)] text-[#8B7355] border border-[rgba(139,115,85,0.18)] backdrop-blur-md">
                          <Crown className="h-2.5 w-2.5" strokeWidth={1.5} />
                          Luxury
                        </span>
                      </div>
                    )}
                    {/* Type badge */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold bg-[rgba(139,115,85,0.1)] text-[#8B7355] border border-[rgba(139,115,85,0.2)] backdrop-blur-md uppercase">
                        {selectedProp.type}
                      </span>
                    </div>
                  </div>

                  {/* Title + location */}
                  <div>
                    <h3 className="text-[15px] font-semibold text-[var(--fg)]" style={{ fontFamily: 'var(--font-serif)' }}>
                      {selectedProp.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-[#8B7355]/50" strokeWidth={1.5} />
                      <p className="text-[11px] text-[var(--fg-muted)]">
                        {selectedProp.location.neighborhood ? selectedProp.location.neighborhood + ', ' : ''}
                        {selectedProp.location.city}, {selectedProp.location.country}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-end justify-between">
                    <span
                      className="text-[22px] font-bold text-[var(--fg)] tracking-[-0.01em]"
                      style={{ fontFamily: 'var(--font-serif)' }}
                    >
                      {formatCurrency(selectedProp.price)}
                    </span>
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        background: riskBadge(selectedProp.riskScore).bg,
                        border: `1px solid ${riskBadge(selectedProp.riskScore).border}`,
                        color: riskBadge(selectedProp.riskScore).text,
                      }}
                    >
                      <Shield className="h-3 w-3" strokeWidth={1.5} />
                      {selectedProp.riskScore} risk
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Yield', value: `${selectedProp.rentalYield}%`, color: '#4ADE80' },
                      { label: 'Growth', value: `+${selectedProp.capitalAppreciation}%`, color: '#8B7355' },
                      { label: 'Area', value: `${selectedProp.area.value.toLocaleString()} ${selectedProp.area.unit}`, color: '#8B7355' },
                    ].map((m) => (
                      <div key={m.label} className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] p-2.5 text-center">
                        <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold">{m.label}</p>
                        <p className="text-[13px] font-semibold mt-0.5" style={{ color: m.color }}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Specs */}
                  {selectedProp.bedrooms && (
                    <div className="flex items-center gap-4 text-[12px] text-[var(--fg-secondary)]">
                      <span>{selectedProp.bedrooms} Beds</span>
                      <span className="text-[var(--fg-muted)]/30">|</span>
                      <span>{selectedProp.bathrooms} Baths</span>
                      <span className="text-[var(--fg-muted)]/30">|</span>
                      <span>Built {selectedProp.yearBuilt}</span>
                    </div>
                  )}

                  {/* Features */}
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProp.features.slice(0, 5).map((f) => (
                      <span
                        key={f}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--fg-secondary)]"
                      >
                        {f}
                      </span>
                    ))}
                    {selectedProp.features.length > 5 && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-[var(--fg-muted)]">
                        +{selectedProp.features.length - 5} more
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-[var(--fg-muted)] leading-[1.6] line-clamp-3">
                    {selectedProp.description}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => router.push(`/investor/properties/${selectedProp.id}`)}
                      className="c-btn-primary flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-semibold cursor-pointer"
                    >
                      View Details
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => router.push(`/investor/properties/${selectedProp.id}/analytics`)}
                      className="c-btn-secondary px-3 py-2.5 text-[12px] cursor-pointer"
                    >
                      <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              ) : (
                /* ── PROPERTY LIST ── */
                <div className="p-3 space-y-1.5">
                  {filteredProperties.map((prop) => {
                    const isActive = prop.id === selected;
                    const isHov = prop.id === hovered;
                    return (
                      <button
                        key={prop.id}
                        onClick={() => setSelected(prop.id)}
                        className={cn(
                          'w-full text-left rounded-xl border p-3 transition-all cursor-pointer',
                          isActive
                            ? 'border-[rgba(139,115,85,0.3)] bg-[rgba(139,115,85,0.06)]'
                            : isHov
                              ? 'border-[rgba(139,115,85,0.15)] bg-[var(--bg-secondary)]'
                              : 'border-[var(--border)] bg-transparent hover:border-[rgba(139,115,85,0.15)] hover:bg-[var(--bg-secondary)]'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-[var(--fg)] truncate">{prop.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 text-[var(--fg-muted)]" strokeWidth={1.5} />
                              <p className="text-[10px] text-[var(--fg-muted)] truncate">{prop.location.city}, {prop.location.country}</p>
                            </div>
                          </div>
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold shrink-0"
                            style={{
                              background: `${scoreColor(prop.aiScore)}10`,
                              border: `1.5px solid ${scoreColor(prop.aiScore)}30`,
                              color: scoreColor(prop.aiScore),
                            }}
                          >
                            {prop.aiScore}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[13px] font-bold text-[var(--fg)]" style={{ fontFamily: 'var(--font-serif)' }}>
                            {formatCurrency(prop.price)}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-[#4ADE80] font-medium flex items-center gap-0.5">
                              <TrendingUp className="h-2.5 w-2.5" strokeWidth={1.5} />
                              {prop.rentalYield}%
                            </span>
                            <span
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full capitalize"
                              style={{
                                background: riskBadge(prop.riskScore).bg,
                                color: riskBadge(prop.riskScore).text,
                                border: `1px solid ${riskBadge(prop.riskScore).border}`,
                              }}
                            >
                              {prop.riskScore}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {filteredProperties.length === 0 && (
                    <div className="py-12 text-center">
                      <Filter className="h-8 w-8 text-[var(--fg-muted)]/30 mx-auto mb-3" strokeWidth={1} />
                      <p className="text-[13px] text-[var(--fg-muted)]">No properties match your filters</p>
                      <button
                        onClick={() => { setTypeFilter('all'); setBudgetIdx(0); setMinYield(0); setMinAiScore(0); }}
                        className="mt-2 text-[12px] text-[#8B7355] hover:underline cursor-pointer"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
