'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark, Heart, Trash2, ArrowRight, Building2, MapPin,
  BedDouble, Bath, Maximize2, TrendingUp, Brain, Sparkles,
  Search, SlidersHorizontal, BarChart3, Star,
} from 'lucide-react';
import { InvestorPageHeader } from '@/components/layout/investor-page-header';
import { PageContainer } from '@/components/layout/page-container';
import { useSavedDeals } from '@/lib/saved-deals-store';
import { apiPropertyService } from '@/services';
import { adaptBackendProperty } from '@/services/api/property.api';
import type { Property } from '@/types/property';
import { formatCurrency } from '@/lib/formatters';

/* ── Helpers ── */

function getAiScoreColor(score: number) {
  if (score >= 85) return '#22C55E';
  if (score >= 70) return '#8B7355';
  if (score >= 55) return '#F59E0B';
  return '#EF4444';
}

function getRiskColor(risk: string) {
  if (risk === 'low')    return '#22C55E';
  if (risk === 'medium') return '#F59E0B';
  return '#EF4444';
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop&q=80';

type SortKey = 'saved' | 'aiScore' | 'price' | 'yield';

/* ═══════════════════════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════════════════════ */
function EmptyState() {
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        className="h-20 w-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(139,115,85,0.12), rgba(196,168,130,0.08))' }}
      >
        <Bookmark className="h-9 w-9 text-[#8B7355]" strokeWidth={1.4} />
      </div>
      <h2 className="text-[22px] font-semibold text-[var(--fg)] tracking-tight">No saved deals yet</h2>
      <p className="mt-2 text-[13px] text-[var(--fg-muted)] max-w-xs leading-relaxed">
        Browse the property feed and tap the{' '}
        <Heart className="inline h-3.5 w-3.5 text-rose-400 fill-rose-400 align-middle" />{' '}
        heart icon to save deals you want to revisit.
      </p>
      <button
        onClick={() => router.push('/investor/properties')}
        className="mt-8 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #8B7355, #6F5C46)', boxShadow: '0 4px 14px rgba(139,115,85,0.30)' }}
      >
        <Search className="h-4 w-4" />
        Browse Properties
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROPERTY CARD
═══════════════════════════════════════════════════════ */
function SavedDealCard({ property, onRemove }: { property: Property; onRemove: () => void }) {
  const router = useRouter();
  const imgSrc = property.images?.[0] || FALLBACK_IMG;
  const scoreColor = getAiScoreColor(property.aiScore);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -6 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card-bg)] transition-all duration-300 hover:border-[rgba(139,115,85,0.30)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.10)] hover:-translate-y-[2px]"
    >
      {/* Image */}
      <div className="relative h-[200px] overflow-hidden">
        <img
          src={imgSrc} alt={property.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* AI Score */}
        <div
          className="absolute top-3 left-3 h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold backdrop-blur-sm"
          style={{ background: `${scoreColor}25`, color: scoreColor, border: `2px solid ${scoreColor}55` }}
        >
          {property.aiScore}
        </div>

        {/* Remove */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-3 right-3 h-7 w-7 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm text-white/70 hover:bg-rose-500/80 hover:text-white transition-all cursor-pointer"
          title="Remove from saved"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Price + luxury badge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <span className="text-[15px] font-bold text-white drop-shadow-sm">
            {formatCurrency(property.price)}
          </span>
          {property.isLuxury && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#8B7355]/80 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
              <Star className="h-2.5 w-2.5" />Luxury
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-[14px] font-semibold text-[var(--fg)] leading-snug line-clamp-2">
          {property.title}
        </h3>
        <p className="flex items-center gap-1 text-[11px] text-[var(--fg-muted)] mt-1">
          <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.5} />
          {[property.location.neighborhood, property.location.city].filter(Boolean).join(', ')}
        </p>

        {/* Specs */}
        <div className="flex items-center gap-3 mt-2.5 flex-wrap">
          {property.bedrooms  != null && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--fg-secondary)]">
              <BedDouble className="h-3 w-3" strokeWidth={1.5} />{property.bedrooms}
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--fg-secondary)]">
              <Bath className="h-3 w-3" strokeWidth={1.5} />{property.bathrooms}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-[var(--fg-secondary)]">
            <Maximize2 className="h-3 w-3" strokeWidth={1.5} />
            {property.area.value.toLocaleString()} {property.area.unit}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ color: getRiskColor(property.riskScore), background: `${getRiskColor(property.riskScore)}15` }}
          >
            {property.riskScore} risk
          </span>
        </div>

        {/* Yield metrics */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-[var(--bg-secondary)] px-2.5 py-2">
            <p className="text-[10px] text-[var(--fg-muted)] font-medium">Rental Yield</p>
            <p className="text-[13px] font-bold text-[#4ADE80]">{property.rentalYield}%</p>
          </div>
          <div className="rounded-lg bg-[var(--bg-secondary)] px-2.5 py-2">
            <p className="text-[10px] text-[var(--fg-muted)] font-medium">Cap Growth</p>
            <p className="text-[13px] font-bold text-[#8B7355]">+{property.capitalAppreciation}%</p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => router.push(`/investor/properties/${property.id}`)}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98] cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #8B7355, #6F5C46)' }}
        >
          View Property
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════ */
export default function SavedDealsPage() {
  const router = useRouter();
  const { savedIds, removeSave, clearAll, count } = useSavedDeals();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('saved');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  /* ── Fetch property data for each saved ID ── */
  useEffect(() => {
    if (savedIds.length === 0) { setProperties([]); return; }
    let cancelled = false;
    setLoading(true);

    Promise.all(
      savedIds.map(async (id) => {
        try {
          const detail = await apiPropertyService.getDetail(id);
          return adaptBackendProperty(detail);
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      if (!cancelled) {
        setProperties(results.filter((p): p is Property => p !== null));
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [savedIds]);

  /* ── Sort ── */
  const sorted = [...properties].sort((a, b) => {
    if (sortBy === 'aiScore') return b.aiScore - a.aiScore;
    if (sortBy === 'price')   return a.price.amount - b.price.amount;
    if (sortBy === 'yield')   return b.rentalYield - a.rentalYield;
    return savedIds.indexOf(a.id) - savedIds.indexOf(b.id);
  });

  /* ── Stats ── */
  const avgScore   = properties.length ? Math.round(properties.reduce((s, p) => s + p.aiScore, 0) / properties.length) : 0;
  const avgYield   = properties.length ? (properties.reduce((s, p) => s + p.rentalYield, 0) / properties.length).toFixed(1) : '—';
  const totalValue = properties.reduce((s, p) => s + p.price.amount, 0);

  return (
    <PageContainer>
      {/* ── Header ── */}
      <InvestorPageHeader
        icon={Bookmark}
        title="Saved Deals"
        subtitle={
          count > 0
            ? `${count} propert${count === 1 ? 'y' : 'ies'} bookmarked for review`
            : 'Your personal deal watchlist'
        }
        actions={
          count > 0 ? (
            <button
              onClick={() => router.push('/investor/properties')}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90 cursor-pointer"
              style={{ background: '#8B7355', boxShadow: '0 1px 2px rgba(139,115,85,0.18)' }}
            >
              <Search className="h-3.5 w-3.5" />
              Browse More
            </button>
          ) : undefined
        }
      >
        {/* Summary stats */}
        {properties.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-1.5">
              <Brain className="h-3.5 w-3.5 text-[#8B7355]" strokeWidth={1.5} />
              <span className="text-[10px] text-[var(--fg-muted)]">Avg AI Score</span>
              <span className="text-[12px] font-bold text-[#8B7355]">{avgScore}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#4ADE80]" strokeWidth={1.5} />
              <span className="text-[10px] text-[var(--fg-muted)]">Avg Yield</span>
              <span className="text-[12px] font-bold text-[#4ADE80]">{avgYield}%</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] px-3 py-1.5">
              <BarChart3 className="h-3.5 w-3.5 text-[var(--fg-muted)]" strokeWidth={1.5} />
              <span className="text-[10px] text-[var(--fg-muted)]">Total Value</span>
              <span className="text-[12px] font-bold text-[var(--fg)]">
                {totalValue >= 1_000_000
                  ? `$${(totalValue / 1_000_000).toFixed(1)}M`
                  : totalValue >= 1_000
                  ? `$${(totalValue / 1_000).toFixed(0)}K`
                  : `$${totalValue.toLocaleString()}`}
              </span>
            </div>
          </div>
        )}
      </InvestorPageHeader>

      {/* ── Toolbar ── */}
      {count > 0 && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--fg-muted)]" strokeWidth={1.5} />
            <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold mr-1">Sort</span>
            {(
              [
                { label: 'Saved Order', value: 'saved'   },
                { label: 'AI Score',    value: 'aiScore' },
                { label: 'Price',       value: 'price'   },
                { label: 'Yield',       value: 'yield'   },
              ] as { label: string; value: SortKey }[]
            ).map((s) => (
              <button
                key={s.value}
                onClick={() => setSortBy(s.value)}
                className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                  sortBy === s.value
                    ? 'bg-[#8B7355]/10 text-[#8B7355] border border-[#8B7355]/30'
                    : 'bg-[var(--bg-secondary)] text-[var(--fg-muted)] border border-[var(--border)] hover:text-[var(--fg-secondary)]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-[var(--fg-muted)] border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-rose-400/40 hover:text-rose-500 transition-all cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            Clear All
          </button>
        </div>
      )}

      {/* ── Clear confirm ── */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.94, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl max-w-sm w-full mx-4"
            >
              <h3 className="text-[16px] font-semibold text-[var(--fg)]">Clear all saved deals?</h3>
              <p className="text-[12px] text-[var(--fg-muted)] mt-1.5">
                This removes all {count} saved propert{count === 1 ? 'y' : 'ies'} from your watchlist.
                You can re-save them at any time.
              </p>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-xl py-2 text-[12px] font-medium border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--fg-secondary)] hover:bg-[var(--border)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { clearAll(); setShowClearConfirm(false); }}
                  className="flex-1 rounded-xl py-2 text-[12px] font-semibold bg-rose-500 text-white hover:bg-rose-600 transition-all cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading skeleton ── */}
      {loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: Math.min(savedIds.length, 6) }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden animate-pulse">
              <div className="h-[200px] bg-[var(--bg-secondary)]" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4" />
                <div className="h-3 bg-[var(--bg-secondary)] rounded w-1/2" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-12 bg-[var(--bg-secondary)] rounded-lg" />
                  <div className="h-12 bg-[var(--bg-secondary)] rounded-lg" />
                </div>
                <div className="h-10 bg-[var(--bg-secondary)] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && count === 0 && <EmptyState />}

      {/* ── Property grid ── */}
      {!loading && sorted.length > 0 && (
        <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {sorted.map((property) => (
              <SavedDealCard
                key={property.id}
                property={property}
                onRemove={() => removeSave(property.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── AI Advisor CTA (only when 2+ properties saved) ── */}
      {!loading && sorted.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-[rgba(139,115,85,0.20)] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: 'linear-gradient(135deg, rgba(139,115,85,0.06), rgba(196,168,130,0.03))' }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #8B7355, #6F5C46)', boxShadow: '0 4px 14px rgba(139,115,85,0.20)' }}
            >
              <Sparkles className="h-[18px] w-[18px] text-white" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[var(--fg)]">Analyze your saved deals with AI</p>
              <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                Compare all {sorted.length} properties side-by-side or ask the AI Advisor anything
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push('/investor/compare')}
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold border border-[rgba(139,115,85,0.30)] text-[#8B7355] hover:bg-[rgba(139,115,85,0.08)] transition-all cursor-pointer"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Compare
            </button>
            <button
              onClick={() => router.push('/investor/ai-qa')}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #8B7355, #6F5C46)' }}
            >
              <Brain className="h-3.5 w-3.5" />
              Ask AI
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </PageContainer>
  );
}
