'use client';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/formatters';
import { useVoiceSearch, type VoiceState } from '@/hooks/use-voice-search';
import { useFunnel } from '@/contexts/investor-funnel-context';
import { apiPropertyService } from '@/services';
import type { Property } from '@/types/property';
import {
  Search, Brain, MapPin, Building2,
  TrendingUp, Sparkles, Mic, AlertCircle,
  Home, Landmark, Mountain, Layers, X, Bath,
  BedDouble, Maximize2, ArrowRight,
  Heart, BarChart3, Zap, Star, Flame, Loader2,
  Check, LayoutGrid, List, Globe, Eye,
} from 'lucide-react';
import { InvestorPageHeader } from '@/components/layout/investor-page-header';
import { useSavedDeals } from '@/lib/saved-deals-store';

/* ─────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────── */
const PROPERTY_TYPES = [
  { label: 'All', value: 'All', icon: Layers },
  { label: 'Residential', value: 'Residential', icon: Home },
  { label: 'Commercial', value: 'Commercial', icon: Landmark },
  { label: 'Land', value: 'Land', icon: Mountain },
  { label: 'Mixed-Use', value: 'Mixed-Use', icon: Building2 },
];

const RISK_LEVELS = [
  { label: 'All Risk', value: 'All' },
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
];

const AI_SUGGESTIONS = [
  { text: 'Luxury villa in Dubai', filters: { type: 'Residential', query: 'villa dubai' } },
  { text: 'High ROI Singapore', filters: { query: 'singapore' } },
  { text: 'Low-risk London', filters: { risk: 'Low', query: 'london' } },
  { text: 'Commercial DIFC', filters: { type: 'Commercial', query: 'dubai' } },
];

const DYNAMIC_PLACEHOLDERS = [
  '"$3M villa in Dubai with 8% ROI"',
  '"Low-risk apartment in Singapore"',
  '"Commercial office in London under $5M"',
  '"High yield property in Miami"',
  '"Luxury penthouse with sea view"',
];

// 1×1 transparent PNG. Property cards in this app render real-time
// scraped images only — when a listing has no image we hide the broken
// <img> via this transparent placeholder rather than substituting stock
// photos. (No mock/hardcoded property photos anywhere.)
const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const FALLBACK_IMAGES: Record<string, string> = {
  residential: TRANSPARENT_PIXEL,
  commercial:  TRANSPARENT_PIXEL,
  land:        TRANSPARENT_PIXEL,
  'mixed-use': TRANSPARENT_PIXEL,
  default:     TRANSPARENT_PIXEL,
};

const SORT_OPTIONS = [
  { label: 'AI Score',          value: 'aiScore'      },
  { label: 'Price: Low → High', value: 'priceAsc'     },
  { label: 'Price: High → Low', value: 'priceDesc'    },
  { label: 'Highest Yield',     value: 'yield'        },
  { label: 'Capital Growth',    value: 'appreciation' },
] as const;

type SortBy    = 'aiScore' | 'priceAsc' | 'priceDesc' | 'yield' | 'appreciation';
type ViewMode  = 'grid' | 'list';

/* ─────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────── */
function getAiScoreColor(score: number): string {
  if (score >= 90) return '#4ADE80';
  if (score >= 75) return '#8B7355';
  return 'var(--fg-muted)';
}

function getRiskColor(risk: string): string {
  if (risk === 'low')    return '#4ADE80';
  if (risk === 'medium') return '#F59E0B';
  return '#EF4444';
}

function getPropertyBadges(prop: {
  aiScore: number; capitalAppreciation: number; rentalYield: number; isLuxury?: boolean;
}) {
  const badges: { label: string; icon: typeof Star; className: string }[] = [];
  if (prop.aiScore >= 90)           badges.push({ label: 'AI Pick',  icon: Zap,   className: 'p-badge-ai-pick'  });
  if (prop.isLuxury || prop.rentalYield >= 5)
                                    badges.push({ label: 'Featured', icon: Star,  className: 'p-badge-featured' });
  if (prop.capitalAppreciation >= 10) badges.push({ label: 'Trending', icon: Flame, className: 'p-badge-trending' });
  return badges.slice(0, 2);
}

/* ─────────────────────────────────────────────────
   Voice query parser
───────────────────────────────────────────────── */
const TYPE_KEYWORDS: Record<string, string> = {
  villa: 'Residential', apartment: 'Residential', penthouse: 'Residential', house: 'Residential', condo: 'Residential',
  office: 'Commercial', retail: 'Commercial', warehouse: 'Commercial',
  land: 'Land', plot: 'Land',
};
const RISK_KEYWORDS: Record<string, string> = {
  'low risk': 'Low', 'low-risk': 'Low', safe: 'Low', stable: 'Low',
  'medium risk': 'Medium', moderate: 'Medium',
  'high risk': 'High', 'high-risk': 'High', aggressive: 'High',
};

function parseVoiceQuery(text: string): { query: string; type?: string; risk?: string } {
  const lower = text.toLowerCase();
  let type: string | undefined;
  let risk: string | undefined;
  for (const [keyword, typeValue] of Object.entries(TYPE_KEYWORDS)) {
    if (lower.includes(keyword)) { type = typeValue; break; }
  }
  for (const [keyword, riskValue] of Object.entries(RISK_KEYWORDS)) {
    if (lower.includes(keyword)) { risk = riskValue; break; }
  }
  return { query: text, type, risk };
}

/* ─────────────────────────────────────────────────
   Voice Button
───────────────────────────────────────────────── */
function VoiceButton({
  voiceState, isSupported, onStart, onStop,
}: {
  voiceState: VoiceState; isSupported: boolean; onStart: () => void; onStop: () => void;
}) {
  if (!isSupported) return null;
  const isListening  = voiceState === 'listening';
  const isProcessing = voiceState === 'processing';
  const isError      = voiceState === 'error';
  return (
    <button
      onClick={isListening ? onStop : isProcessing ? undefined : onStart}
      className={`voice-btn shrink-0 h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer
        ${isListening  ? 'voice-btn-listening'  : ''}
        ${isError      ? 'voice-btn-error'       : ''}
        ${isProcessing ? 'voice-btn-processing'  : ''}`}
      title={isListening ? 'Stop listening' : isProcessing ? 'Processing…' : 'Voice search'}
      disabled={isProcessing}
    >
      {isListening  && <span className="voice-pulse" />}
      {isProcessing && <span className="voice-processing-ring" />}
      {isProcessing
        ? <Loader2    className="h-4 w-4 relative z-10 animate-spin" strokeWidth={1.8} />
        : isError
          ? <AlertCircle className="h-4 w-4 relative z-10" strokeWidth={1.8} />
          : <Mic        className="h-4 w-4 relative z-10" strokeWidth={1.8} />}
    </button>
  );
}

/* ─────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────── */
export default function PropertiesPage() {
  const [query,          setQuery]          = useState('');
  const [typeFilter,     setTypeFilter]     = useState('All');
  const [riskFilter,     setRiskFilter]     = useState('All');
  const [sortBy,         setSortBy]         = useState<SortBy>('aiScore');
  const [viewMode,       setViewMode]       = useState<ViewMode>('grid');
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused,      setIsFocused]      = useState(false);
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isSaved, toggleSave } = useSavedDeals();

  const {
    selectedAreaIds, selectedAreaNames, selectedPropertyIds,
    toggleProperty, setCurrentStep, completeStep, clearProperties,
    intent,
  } = useFunnel();

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { setCurrentStep(3); }, [setCurrentStep]);

  // Fetch broker-listed properties for the user's selected areas.
  // No scraping — backend reads broker_listings from the DB filtered by
  // the area names the user picked in step 2.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const data = await apiPropertyService.searchByAreas(
          selectedAreaNames.slice(0, 3),
          intent.rawQuery,
        );
        if (cancelled) return;
        setProperties(data);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load properties');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedAreaNames, intent.rawQuery, refreshKey]);

  useEffect(() => {
    const iv = setInterval(() => setPlaceholderIdx(i => (i + 1) % DYNAMIC_PLACEHOLDERS.length), 4000);
    return () => clearInterval(iv);
  }, []);

  const handleVoiceResult = useCallback((text: string) => {
    const parsed = parseVoiceQuery(text);
    setQuery(parsed.query);
    if (parsed.type) setTypeFilter(parsed.type);
    if (parsed.risk) setRiskFilter(parsed.risk);
    inputRef.current?.focus();
  }, []);

  const { state: voiceState, transcript, interimText, error: voiceError,
          startListening, stopListening, clearError, isSupported } = useVoiceSearch(handleVoiceResult);

  /* ── Filtered ── */
  const filtered = useMemo(() =>
    properties.filter((p) => {
      const q = query.toLowerCase();
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.location.city.toLowerCase().includes(q) ||
        p.location.country.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.subType.toLowerCase().includes(q);
      const matchType = typeFilter === 'All' || p.type.toLowerCase() === typeFilter.toLowerCase();
      const matchRisk = riskFilter === 'All' || p.riskScore.toLowerCase() === riskFilter.toLowerCase();
      return matchQuery && matchType && matchRisk;
    }),
    [properties, query, typeFilter, riskFilter],
  );

  /* ── Sorted ── */
  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case 'priceAsc':     return arr.sort((a, b) => a.price.amount - b.price.amount);
      case 'priceDesc':    return arr.sort((a, b) => b.price.amount - a.price.amount);
      case 'yield':        return arr.sort((a, b) => b.rentalYield - a.rentalYield);
      case 'appreciation': return arr.sort((a, b) => b.capitalAppreciation - a.capitalAppreciation);
      default:             return arr.sort((a, b) => b.aiScore - a.aiScore);
    }
  }, [filtered, sortBy]);

  /* ── AI Top Picks ── */
  const topPicks = useMemo(() =>
    [...properties].sort((a, b) => b.aiScore - a.aiScore).slice(0, 3),
    [properties],
  );

  /* ── Live stats ── */
  const liveStats = useMemo(() => {
    const count = properties.length;
    const avgYield = count > 0
      ? (properties.reduce((s, p) => s + p.rentalYield, 0) / count).toFixed(1)
      : '—';
    const markets  = new Set(properties.map(p => p.location.city)).size;
    return [
      { icon: Building2, value: `${count}`,      label: 'Properties', color: '#8B7355' },
      { icon: TrendingUp, value: `${avgYield}%`, label: 'Avg Yield',  color: '#4ADE80' },
      { icon: Globe,     value: `${markets}`,    label: 'Markets',    color: '#F59E0B' },
    ];
  }, [properties]);

  /* ── Parsed filter chips ── */
  const parsedFilters = useMemo(() => {
    const chips: { label: string; value: string; key: string }[] = [];
    if (typeFilter !== 'All') chips.push({ label: 'Type', value: typeFilter, key: 'type' });
    if (riskFilter !== 'All') chips.push({ label: 'Risk', value: riskFilter, key: 'risk' });
    return chips;
  }, [typeFilter, riskFilter]);

  const removeFilter = useCallback((key: string) => {
    if (key === 'type') setTypeFilter('All');
    if (key === 'risk') setRiskFilter('All');
  }, []);

  const handleSuggestion = useCallback((suggestion: typeof AI_SUGGESTIONS[number]) => {
    if (suggestion.filters.query) setQuery(suggestion.filters.query);
    if (suggestion.filters.type)  setTypeFilter(suggestion.filters.type);
    if (suggestion.filters.risk)  setRiskFilter(suggestion.filters.risk);
  }, []);

  const selectedProperties = useMemo(
    () => properties.filter(p => selectedPropertyIds.includes(p.id)),
    [properties, selectedPropertyIds],
  );

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    <div className={`mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8 ${selectedPropertyIds.length > 0 ? 'pb-24' : 'pb-8'}`}>

      {/* ══════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════ */}
      <InvestorPageHeader
        icon={Building2}
        title="Property Intelligence"
        subtitle="AI-powered discovery across global real estate markets"
        actions={
          <button
            onClick={() => router.push('/investor/compare')}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition-all duration-200 hover:bg-[#6F5C46] hover:-translate-y-px"
            style={{ background: '#8B7355', boxShadow: '0 1px 2px rgba(139,115,85,0.18)' }}
          >
            <BarChart3 className="h-4 w-4" strokeWidth={1.8} />
            Compare
          </button>
        }
      >
        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-3">
          {liveStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center gap-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] px-4 py-2.5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stat.color}14` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: stat.color }} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-[16px] font-bold text-[var(--fg)] leading-none">{stat.value}</p>
                  <p className="text-[10px] text-[var(--fg-muted)] mt-0.5 font-medium">{stat.label}</p>
                </div>
              </div>
            );
          })}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.06)] px-3 py-2 text-[10px] font-bold text-[#16A34A] tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A] animate-pulse" />
            LIVE
          </span>
        </div>
      </InvestorPageHeader>

      {/* ══════════════════════════════════════════
          AREA FILTER BANNER
      ══════════════════════════════════════════ */}
      {selectedAreaNames.length > 0 && (
        <div className="!mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(139,115,85,0.25)] bg-[rgba(139,115,85,0.09)] px-4 py-3">
          <MapPin size={14} className="text-[#8B7355]" />
          <span className="text-xs font-medium text-[var(--fg-muted)]">Filtering by selected areas:</span>
          {selectedAreaNames.map((name) => (
            <span key={name} className="rounded-full bg-[rgba(139,115,85,0.10)] px-2.5 py-0.5 text-xs font-semibold text-[#8B7355]">
              {name}
            </span>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════
          SEARCH BAR
      ══════════════════════════════════════════ */}
      <div className={`!mt-6 p-search-bar px-5 py-4 ${
        voiceState === 'listening' ? 'voice-search-active' :
        voiceState === 'error'     ? 'voice-search-error'  :
        isFocused                  ? 'p-search-bar-focused' : ''
      }`}>
        <div className="flex items-center gap-4">
          <div className="p-search-icon">
            {voiceState === 'listening' ? (
              <div className="voice-waveform"><span /><span /><span /><span /></div>
            ) : (
              <Search className="h-5 w-5 text-[var(--fg-muted)]" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={
                voiceState === 'listening'  ? (transcript || interimText || '') :
                voiceState === 'processing' ? transcript : query
              }
              onChange={(e) => {
                if (voiceState === 'idle' || voiceState === 'error') {
                  setQuery(e.target.value);
                  if (voiceState === 'error') clearError();
                }
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                voiceState === 'listening'  ? 'Listening…'   :
                voiceState === 'processing' ? 'Processing…'  :
                `Try: ${DYNAMIC_PLACEHOLDERS[placeholderIdx]}`
              }
              className={`w-full bg-transparent text-[14px] text-[var(--fg)] placeholder:text-[var(--fg-muted)]/60 focus:outline-none ${
                voiceState === 'listening' ? 'placeholder:text-[#8B7355]/70' : ''
              }`}
              readOnly={voiceState === 'listening' || voiceState === 'processing'}
            />
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-[var(--fg-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--fg)] transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <VoiceButton voiceState={voiceState} isSupported={isSupported} onStart={startListening} onStop={stopListening} />
          <button
            onClick={() => inputRef.current?.focus()}
            className="shrink-0 px-5 py-2 flex items-center gap-2 cursor-pointer text-[12px] font-semibold text-white rounded-xl transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #8B7355 0%, #6F5C46 100%)' }}
          >
            Search
          </button>
        </div>

        {/* Voice error */}
        {voiceState === 'error' && voiceError && (
          <div className="voice-error-bar flex items-start gap-2.5 mt-3 pt-3 border-t border-[var(--border)]">
            <AlertCircle className="h-3.5 w-3.5 text-[#EF4444] shrink-0 mt-0.5" strokeWidth={1.8} />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-[var(--fg)]">{voiceError.message}</p>
              {voiceError.hint && <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">{voiceError.hint}</p>}
            </div>
            <button
              onClick={() => { clearError(); startListening(); }}
              className="text-[11px] font-medium text-[#8B7355] hover:text-[#6F5C46] transition-colors cursor-pointer shrink-0"
            >
              Try again
            </button>
          </div>
        )}

        {/* Active filter chips */}
        {parsedFilters.length > 0 && voiceState === 'idle' && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border)]">
            <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold shrink-0">Active</span>
            {parsedFilters.map((f) => (
              <span key={f.key} className="parsed-filter-chip">
                <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--fg-muted)]">{f.label}</span>
                <span className="text-[11px] font-medium text-[var(--fg)]">{f.value}</span>
                <button onClick={() => removeFilter(f.key)} className="ml-0.5 text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => { setTypeFilter('All'); setRiskFilter('All'); setQuery(''); }}
              className="text-[10px] text-[var(--fg-muted)] hover:text-[#EF4444] transition-colors cursor-pointer ml-auto"
            >
              Clear all
            </button>
          </div>
        )}

        {/* AI Suggestions */}
        {!query && parsedFilters.length === 0 && voiceState === 'idle' && (
          <div className="flex items-center gap-2.5 mt-3.5 pt-3.5 border-t border-[var(--border)]">
            <span className="text-[9px] uppercase tracking-[0.12em] text-[var(--fg-muted)]/50 font-semibold shrink-0">Try</span>
            {AI_SUGGESTIONS.map((s) => (
              <button key={s.text} onClick={() => handleSuggestion(s)} className="p-suggestion">
                <Sparkles className="h-3 w-3 text-[var(--fg-muted)]/50" />
                {s.text}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          AI SMART PICKS
      ══════════════════════════════════════════ */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(139,115,85,0.10)]">
              <Brain className="h-4 w-4 text-[#8B7355]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[var(--fg)] leading-tight">AI Smart Picks</p>
              <p className="text-[11px] text-[var(--fg-muted)]">Top-ranked by market intelligence</p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[10px] font-medium text-[var(--fg-muted)]">
            {properties.length} properties analyzed
          </span>
        </div>

        {/* Horizontal scroll carousel */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mb-2" style={{ scrollbarWidth: 'none' }}>
          {(isLoading ? [...Array(3)] : topPicks).map((pick, i) => {
            if (isLoading || !pick) {
              return (
                <div key={i} className="flex-none w-[280px] rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
                  <div className="h-44 bg-[var(--bg-tertiary)] animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-[var(--bg-tertiary)] animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-[var(--bg-tertiary)] animate-pulse" />
                    <div className="h-3 w-full rounded bg-[var(--bg-tertiary)] animate-pulse" />
                  </div>
                </div>
              );
            }
            const scoreColor = getAiScoreColor(pick.aiScore);
            const imgSrc = pick.images?.[0] || FALLBACK_IMAGES[pick.type] || FALLBACK_IMAGES.default;
            const insight = pick.aiScore >= 90
              ? 'AI top pick — exceptional yield-to-risk ratio in this micro-market.'
              : pick.rentalYield >= 5
              ? 'Strong rental income potential driven by high occupancy demand.'
              : 'Balanced growth and yield profile with stable fundamentals.';
            return (
              <button
                key={pick.id}
                onClick={() => router.push(`/investor/properties/${pick.id}`)}
                className="group flex-none w-[280px] rounded-xl border border-[var(--border)] overflow-hidden text-left transition-all duration-200 cursor-pointer hover:border-[rgba(139,115,85,0.40)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)] hover:-translate-y-0.5"
                style={{ background: 'var(--card-bg)' }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={imgSrc} alt={pick.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGES.default; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  {/* Rank + Risk badge top row */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold backdrop-blur-sm"
                      style={{ background: `${getRiskColor(pick.riskScore)}20`, color: getRiskColor(pick.riskScore), border: `1px solid ${getRiskColor(pick.riskScore)}30` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: getRiskColor(pick.riskScore) }} />
                      {pick.riskScore} risk
                    </span>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B7355] text-white text-[10px] font-bold shadow-md">
                      {i + 1}
                    </div>
                  </div>

                  {/* AI Score overlay bottom-right */}
                  <div className="absolute bottom-2 right-2">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold"
                      style={{ background: `${scoreColor}25`, color: scoreColor, border: `2px solid ${scoreColor}40`, backdropFilter: 'blur(4px)' }}
                      title="AI Score"
                    >
                      {pick.aiScore}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-[12px] font-semibold text-[var(--fg)] leading-snug line-clamp-1">{pick.title}</p>
                    <p className="text-[10px] text-[var(--fg-muted)] flex items-center gap-0.5 mt-0.5">
                      <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
                      {pick.location.city}, {pick.location.country}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[var(--fg)]">{formatCurrency(pick.price)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-[#4ADE80]">↑ {pick.rentalYield}%</span>
                      <span className="text-[10px] text-[var(--fg-muted)]">+{pick.capitalAppreciation}% cap</span>
                    </div>
                  </div>
                  {/* Why recommended */}
                  <p className="text-[10px] text-[var(--fg-muted)] leading-relaxed line-clamp-2 border-t border-[var(--border)] pt-1.5">
                    {insight}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FILTER + SORT CONTROLS
      ══════════════════════════════════════════ */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Type tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
          {PROPERTY_TYPES.map((t) => {
            const Icon = t.icon;
            const isActive = typeFilter === t.value;
            return (
              <button
                key={t.value} onClick={() => setTypeFilter(t.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--card-bg)] text-[#8B7355] shadow-sm'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                <Icon className="h-3 w-3" strokeWidth={1.5} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Risk tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
          {RISK_LEVELS.map((r) => {
            const isActive = riskFilter === r.value;
            const color    = r.value !== 'All' ? getRiskColor(r.value.toLowerCase()) : undefined;
            return (
              <button
                key={r.value} onClick={() => setRiskFilter(r.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--card-bg)] text-[#8B7355] shadow-sm'
                    : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                }`}
              >
                {color && <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />}
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortBy)}
            className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-[12px] font-medium text-[var(--fg)] focus:outline-none focus:border-[#8B7355] cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-[var(--card-bg)] text-[#8B7355] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-[var(--card-bg)] text-[#8B7355] shadow-sm' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}`}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Result count */}
          <span className="whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-[11px] font-medium text-[var(--fg-muted)]">
            {sorted.length} {sorted.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DB-PULL STATUS BAR
      ══════════════════════════════════════════ */}
      {selectedAreaNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-[11px] text-[var(--fg-muted)]">
          <span className="font-semibold text-[var(--fg)]">Broker listings</span>
          <span>·</span>
          <span>areas: {selectedAreaNames.slice(0, 3).join(', ')}</span>
          <span>·</span>
          <span>{properties.length} matched</span>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={isLoading}
            className="ml-auto rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[11px] font-semibold text-[var(--fg)] hover:bg-[var(--bg-subtle)] disabled:opacity-50"
          >
            {isLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      )}
      {loadError && (
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-[13px] text-red-700 dark:text-red-300">
          Failed to load properties: {loadError}. Check that the backend is running on {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}.
        </div>
      )}
      {isLoading && (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
              <div className="h-48 bg-[var(--bg-secondary)] animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
                <div className="h-3 w-1/2 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-3 w-1/4 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
                  <div className="h-3 w-1/4 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
                  <div className="h-3 w-1/4 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
                </div>
                <div className="h-6 w-1/3 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
                <div className="h-8 w-full rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════
          PROPERTY GRID
      ══════════════════════════════════════════ */}
      {!isLoading && viewMode === 'grid' && sorted.length > 0 && (
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((prop) => {
            const scoreColor = getAiScoreColor(prop.aiScore);
            const imgSrc     = prop.images?.[0];
            const badges     = getPropertyBadges(prop);
            const isSelected = selectedPropertyIds.includes(prop.id);
            return (
              <div
                key={prop.id}
                onClick={() => router.push(`/investor/properties/${prop.id}`)}
                className={`group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
                  isSelected
                    ? 'border-2 border-[#8B7355] shadow-[0_6px_24px_rgba(139,115,85,0.20)]'
                    : 'border border-[var(--border)] hover:border-[rgba(139,115,85,0.30)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] hover:-translate-y-[3px]'
                }`}
                style={{ background: 'var(--card-bg)' }}
              >
                {/* Selection checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleProperty(prop.id); }}
                  className={`absolute top-3 left-3 z-20 flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-[#8B7355] bg-[#8B7355] text-white shadow-md'
                      : 'border-white/60 bg-black/30 text-transparent hover:border-white hover:bg-black/50'
                  }`}
                >
                  <Check size={14} strokeWidth={2.5} />
                </button>

                {/* Image */}
                <div className="relative h-[220px] overflow-hidden bg-[var(--bg-secondary)] shrink-0">
                  <img
                    src={imgSrc || FALLBACK_IMAGES[prop.type] || FALLBACK_IMAGES.default}
                    alt={prop.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    loading="lazy"
                    onError={(e) => {
                      const t = e.currentTarget;
                      const fb = FALLBACK_IMAGES[prop.type] || FALLBACK_IMAGES.default;
                      if (t.src !== fb) t.src = fb;
                    }}
                  />
                  {/* Cinematic overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/30 to-transparent" />

                  {/* Property badges — positioned below the checkbox */}
                  {badges.length > 0 && (
                    <div className="absolute top-11 left-3 z-10 flex flex-col gap-1">
                      {badges.map((b) => {
                        const BIcon = b.icon;
                        return (
                          <span key={b.label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm ${b.className}`}>
                            <BIcon className="h-2.5 w-2.5" />{b.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Top right: Save + Compare + AI Score */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSave(prop.id); }}
                      className={`flex h-7 w-7 items-center justify-center rounded-full backdrop-blur-sm transition-all cursor-pointer ${
                        isSaved(prop.id)
                          ? 'bg-rose-500/80 text-white hover:bg-rose-600/90'
                          : 'bg-black/30 text-white/80 hover:bg-black/60 hover:text-white'
                      }`}
                      title={isSaved(prop.id) ? 'Remove from saved' : 'Save deal'}
                    >
                      <Heart className={`h-3.5 w-3.5 ${isSaved(prop.id) ? 'fill-current' : ''}`} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:bg-black/60 hover:text-white transition-all cursor-pointer"
                      title="Compare"
                    >
                      <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                      style={{ background: `${scoreColor}22`, color: scoreColor, border: `2px solid ${scoreColor}55`, backdropFilter: 'blur(4px)', boxShadow: `0 0 14px ${scoreColor}25` }}
                      title="AI Score"
                    >
                      {prop.aiScore}
                    </div>
                  </div>

                  {/* Quick View hover pill */}
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#8B7355] shadow-lg backdrop-blur-sm">
                      <Eye className="h-3 w-3" strokeWidth={2} />
                      Quick View
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 px-4 pt-4 pb-4 gap-3">
                  {/* Title + location */}
                  <div>
                    <h3 className="text-[15px] font-semibold text-[var(--fg)] leading-snug group-hover:text-[#8B7355] transition-colors duration-200 line-clamp-1">
                      {prop.title}
                    </h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-[#8B7355]/60 shrink-0" strokeWidth={1.5} />
                      <p className="text-[11px] text-[var(--fg-muted)] truncate">
                        {prop.location.city}, {prop.location.country}
                      </p>
                    </div>
                  </div>

                  {/* Specs row */}
                  <div className="flex items-center gap-2 text-[11px] text-[var(--fg-muted)]">
                    {prop.bedrooms != null && (
                      <>
                        <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" strokeWidth={1.5} />{prop.bedrooms}</span>
                        <span className="w-px h-3 bg-[var(--border)]" />
                      </>
                    )}
                    {prop.bathrooms != null && (
                      <>
                        <span className="flex items-center gap-1"><Bath className="h-3 w-3" strokeWidth={1.5} />{prop.bathrooms}</span>
                        <span className="w-px h-3 bg-[var(--border)]" />
                      </>
                    )}
                    <span className="flex items-center gap-1">
                      <Maximize2 className="h-3 w-3" strokeWidth={1.5} />
                      {prop.area.value.toLocaleString()} {prop.area.unit}
                    </span>
                  </div>

                  {/* Price + risk badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[19px] font-bold text-[var(--fg)] tracking-[-0.025em] leading-none">
                      {formatCurrency(prop.price)}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold"
                      style={{ background: `${getRiskColor(prop.riskScore)}12`, color: getRiskColor(prop.riskScore), border: `1px solid ${getRiskColor(prop.riskScore)}28` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: getRiskColor(prop.riskScore) }} />
                      {prop.riskScore} risk
                    </span>
                  </div>

                  {/* Yield metrics row */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 font-semibold text-[#4ADE80]">
                      <TrendingUp className="h-3 w-3" strokeWidth={1.5} />
                      {prop.rentalYield}% yield
                    </div>
                    <span className="text-[var(--fg-muted)]">+{prop.capitalAppreciation}% cap</span>
                  </div>

                  {/* Yield bar */}
                  <div className="h-[3px] rounded-full overflow-hidden bg-[var(--bg-secondary)]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(prop.rentalYield * 10, 100)}%`,
                        background: 'linear-gradient(90deg, #4ADE80 0%, #22C55E 100%)',
                      }}
                    />
                  </div>

                  {/* CTA row */}
                  <div className="mt-auto flex items-center justify-between pt-2.5 border-t border-[var(--border)]">
                    <span className="text-[12px] font-semibold text-[#8B7355] group-hover:text-[#6F5C46] transition-colors">
                      Explore Property
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-[#8B7355] group-hover:translate-x-1 transition-transform duration-200" strokeWidth={2} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════
          PROPERTY LIST VIEW
      ══════════════════════════════════════════ */}
      {!isLoading && viewMode === 'list' && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((prop) => {
            const scoreColor = getAiScoreColor(prop.aiScore);
            const imgSrc     = prop.images?.[0] || FALLBACK_IMAGES[prop.type] || FALLBACK_IMAGES.default;
            const badges     = getPropertyBadges(prop);
            const isSelected = selectedPropertyIds.includes(prop.id);
            return (
              <div
                key={prop.id}
                onClick={() => router.push(`/investor/properties/${prop.id}`)}
                className={`group relative flex items-center gap-4 rounded-2xl border bg-[var(--card-bg)] p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                  isSelected
                    ? 'border-[rgba(139,115,85,0.50)] ring-1 ring-[rgba(139,115,85,0.20)]'
                    : 'border-[var(--border)] hover:border-[rgba(139,115,85,0.30)]'
                }`}
              >
                {/* Select checkbox */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleProperty(prop.id); }}
                  className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#8B7355] bg-[#8B7355] text-white'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] text-transparent group-hover:border-[rgba(139,115,85,0.50)]'
                  }`}
                >
                  <Check size={11} strokeWidth={2.5} />
                </button>

                {/* Image */}
                <div className="h-16 w-20 rounded-xl overflow-hidden shrink-0">
                  <img
                    src={imgSrc} alt={prop.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGES.default; }}
                  />
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-[14px] text-[var(--fg)] truncate">{prop.title}</h3>
                    {badges[0] && (() => {
                      const badge = badges[0];
                      const BadgeIcon = badge.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold shrink-0 ${badge.className}`}>
                          <BadgeIcon className="h-2.5 w-2.5" />{badge.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-[11px] text-[var(--fg-muted)] flex items-center gap-1 mt-0.5">
                    <MapPin className="h-2.5 w-2.5 shrink-0" strokeWidth={1.5} />
                    {prop.location.city}, {prop.location.country}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {prop.bedrooms  != null && <span className="flex items-center gap-1 text-[11px] text-[var(--fg-secondary)]"><BedDouble className="h-3 w-3" strokeWidth={1.5} />{prop.bedrooms}</span>}
                    {prop.bathrooms != null && <span className="flex items-center gap-1 text-[11px] text-[var(--fg-secondary)]"><Bath      className="h-3 w-3" strokeWidth={1.5} />{prop.bathrooms}</span>}
                    <span className="flex items-center gap-1 text-[11px] text-[var(--fg-secondary)]">
                      <Maximize2 className="h-3 w-3" strokeWidth={1.5} />{prop.area.value.toLocaleString()} {prop.area.unit}
                    </span>
                    <span className="text-[10px] text-[var(--fg-muted)] capitalize">· {prop.subType}</span>
                  </div>
                </div>

                {/* Metrics row — hidden on mobile */}
                <div className="hidden md:flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-[17px] font-bold text-[var(--fg)] tracking-tight leading-tight">{formatCurrency(prop.price)}</p>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: getRiskColor(prop.riskScore) }} />
                      <p className="text-[10px] text-[var(--fg-muted)] capitalize">{prop.riskScore} risk</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[13px] font-bold text-[#4ADE80]">{prop.rentalYield}%</span>
                    <span className="text-[9px] text-[var(--fg-muted)]">yield</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[13px] font-bold text-[#8B7355]">+{prop.capitalAppreciation}%</span>
                    <span className="text-[9px] text-[var(--fg-muted)]">cap growth</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-[12px] font-bold"
                      style={{ background: `${scoreColor}15`, color: scoreColor, border: `2px solid ${scoreColor}30` }}
                    >
                      {prop.aiScore}
                    </div>
                    <span className="text-[9px] text-[var(--fg-muted)] font-medium">AI</span>
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSave(prop.id); }}
                  className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-full border transition-all cursor-pointer ${
                    isSaved(prop.id)
                      ? 'border-rose-400/60 bg-rose-500/10 text-rose-500'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--fg-muted)] hover:border-rose-400/40 hover:text-rose-400'
                  }`}
                  title={isSaved(prop.id) ? 'Remove from saved' : 'Save deal'}
                >
                  <Heart className={`h-3.5 w-3.5 ${isSaved(prop.id) ? 'fill-current' : ''}`} strokeWidth={1.5} />
                </button>

                {/* Arrow */}
                <ArrowRight className="h-4 w-4 text-[var(--fg-muted)] group-hover:text-[#8B7355] group-hover:translate-x-0.5 transition-all shrink-0" strokeWidth={1.5} />
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════
          EMPTY STATE
      ══════════════════════════════════════════ */}
      {!isLoading && !loadError && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-secondary)] mb-4">
            <Search className="h-6 w-6 text-[var(--fg-muted)]" strokeWidth={1.5} />
          </div>
          <p className="font-semibold text-[var(--fg)] mb-1">No properties match your search</p>
          <p className="text-[12px] text-[var(--fg-muted)] mb-5 text-center max-w-xs">
            Try adjusting your filters, selecting a different property type, or clearing the search term.
          </p>
          <button
            onClick={() => { setQuery(''); setTypeFilter('All'); setRiskFilter('All'); }}
            className="c-btn-secondary px-5 py-2 text-[12px] cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          FLOATING SELECTION BAR
      ══════════════════════════════════════════ */}
      {selectedPropertyIds.length > 0 && (
        <div className="sticky bottom-0 -mx-4 lg:-mx-6 z-40 border-t border-[var(--border)] bg-[var(--card-bg)]/95 backdrop-blur-xl shadow-[0_-6px_24px_rgba(0,0,0,0.10)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
            {/* Left: thumbnails + info */}
            <div className="flex items-center gap-3.5">
              <div className="flex -space-x-2.5 shrink-0">
                {selectedProperties.slice(0, 4).map((prop, idx) => {
                  const imgSrc = prop.images?.[0] || FALLBACK_IMAGES[prop.type] || FALLBACK_IMAGES.default;
                  return (
                    <div
                      key={prop.id}
                      className="h-8 w-8 rounded-full border-2 border-[var(--card-bg)] overflow-hidden shadow-sm"
                      style={{ zIndex: 4 - idx }}
                    >
                      <img src={imgSrc} alt={prop.title} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = FALLBACK_IMAGES.default; }} />
                    </div>
                  );
                })}
                {selectedPropertyIds.length > 4 && (
                  <div
                    className="h-8 w-8 rounded-full border-2 border-[var(--card-bg)] bg-[var(--bg-secondary)] flex items-center justify-center text-[10px] font-bold text-[#8B7355]"
                    style={{ zIndex: 0 }}
                  >
                    +{selectedPropertyIds.length - 4}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <p className="text-[13px] font-semibold text-[var(--fg)] leading-none">
                  {selectedPropertyIds.length} of 5 selected
                </p>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i <= selectedPropertyIds.length ? 'w-4 bg-[#8B7355]' : 'w-2.5 bg-[var(--border)]'
                      }`}
                    />
                  ))}
                  <span className="mx-1 h-3 w-px bg-[var(--border)]" />
                  <button
                    onClick={clearProperties}
                    className="text-[10px] text-[var(--fg-muted)] hover:text-[#EF4444] transition-colors cursor-pointer leading-none"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </div>

            {/* Right: CTA */}
            <button
              onClick={() => { completeStep(3); setCurrentStep(4); router.push('/investor/compare'); }}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#6F5C46] to-[#A89478] px-5 py-2.5 text-[13px] font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:from-[#3A7FAD] hover:to-[#A89478] active:scale-[0.98] cursor-pointer"
            >
              Compare Selected <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
