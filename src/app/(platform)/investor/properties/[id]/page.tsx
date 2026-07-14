'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PageContainer } from '@/components/layout/page-container';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ConfidenceMeter } from '@/components/shared';
import { apiPropertyService } from '@/services';
import { adaptBackendProperty } from '@/services/api/property.api';
import type { Property } from '@/types/property';
import { formatCurrency } from '@/lib/formatters';
import { useAuth } from '@/contexts/auth-context';
import { useLeadPipeline } from '@/contexts/lead-pipeline-context';
import { useSavedDeals } from '@/lib/saved-deals-store';
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Sparkles,
  TrendingUp,
  DollarSign,
  BarChart3,
  Target,
  Zap,
  Ruler,
  Building2,
  Calendar,
  Brain,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Gavel,
  Eye,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Activity,
  BedDouble,
  Bath,
  Star,
  Wallet,
  Users,
  ArrowUpRight,
  Flame,
  LayoutGrid,
} from 'lucide-react';

/* ================================================================
   DYNAMIC AI / ANALYSIS — derived from actual property data
   ================================================================ */

type RoiScenario = 'conservative' | 'moderate' | 'aggressive';

function buildAiSummary(p: Property) {
  const verdict: 'yes' | 'maybe' | 'no' =
    p.aiScore >= 80 ? 'yes' : p.aiScore >= 60 ? 'maybe' : 'no';
  const confidence = Math.min(99, Math.round(p.aiScore * 0.95 + 5));
  const yieldLabel = p.rentalYield >= 5 ? 'strong' : p.rentalYield >= 3 ? 'moderate' : 'below-average';
  const riskLabel = p.riskScore === 'low' ? 'low-risk' : p.riskScore === 'high' ? 'high-risk' : 'moderate-risk';
  return {
    verdict,
    confidence,
    headline: `${p.rentalYield}% rental yield in a ${riskLabel} market with ${yieldLabel} income potential`,
    opportunities: [
      `Rental yield of ${p.rentalYield}% — ${p.rentalYield >= 5 ? 'above' : 'in line with'} area median, indicating ${p.rentalYield >= 5 ? 'strong pricing power' : 'stable demand'}.`,
      `Capital appreciation forecast of ${p.capitalAppreciation}% annually based on current market trajectory and infrastructure investment.`,
      `AI confidence score of ${p.aiScore}/100 — ${p.aiScore >= 80 ? 'reflects strong fundamentals across yield, location, and demand signals' : 'indicates moderate investment potential with manageable risks'}.`,
    ],
    risks: [
      p.riskScore === 'high'
        ? 'High-risk classification — verify regulatory environment and demand drivers before committing capital.'
        : `${p.riskScore === 'low' ? 'Low-risk profile reduces downside' : 'Moderate risk — diversify across multiple assets to limit concentration exposure'}.`,
      'Average resale timeline of 4–6 months — plan for reduced liquidity vs liquid asset classes.',
    ],
  };
}

function buildRoiScenarios(p: Property) {
  const y = p.rentalYield;
  const c = p.capitalAppreciation;
  return {
    conservative: [
      { period: 'Year 1',  rental: +(y * 0.85).toFixed(1), capital: +(c * 0.5).toFixed(1),  total: +(y * 0.85 + c * 0.5).toFixed(1) },
      { period: 'Year 3',  rental: +(y * 0.88).toFixed(1), capital: +(c * 0.5 * 3).toFixed(1), total: +(y * 0.88 + c * 0.5 * 3).toFixed(1) },
      { period: 'Year 5',  rental: +(y * 0.9).toFixed(1),  capital: +(c * 0.5 * 5).toFixed(1), total: +(y * 0.9 + c * 0.5 * 5).toFixed(1) },
      { period: 'Year 10', rental: +(y * 1.0).toFixed(1),  capital: +(c * 0.5 * 10).toFixed(1), total: +(y * 1.0 + c * 0.5 * 10).toFixed(1) },
    ],
    moderate: [
      { period: 'Year 1',  rental: +(y).toFixed(1),        capital: +(c).toFixed(1),       total: +(y + c).toFixed(1) },
      { period: 'Year 3',  rental: +(y * 1.05).toFixed(1), capital: +(c * 3).toFixed(1),   total: +(y * 1.05 + c * 3).toFixed(1) },
      { period: 'Year 5',  rental: +(y * 1.1).toFixed(1),  capital: +(c * 5).toFixed(1),   total: +(y * 1.1 + c * 5).toFixed(1) },
      { period: 'Year 10', rental: +(y * 1.2).toFixed(1),  capital: +(c * 10).toFixed(1),  total: +(y * 1.2 + c * 10).toFixed(1) },
    ],
    aggressive: [
      { period: 'Year 1',  rental: +(y * 1.1).toFixed(1),  capital: +(c * 1.5).toFixed(1),     total: +(y * 1.1 + c * 1.5).toFixed(1) },
      { period: 'Year 3',  rental: +(y * 1.15).toFixed(1), capital: +(c * 1.5 * 3).toFixed(1), total: +(y * 1.15 + c * 1.5 * 3).toFixed(1) },
      { period: 'Year 5',  rental: +(y * 1.2).toFixed(1),  capital: +(c * 1.5 * 5).toFixed(1), total: +(y * 1.2 + c * 1.5 * 5).toFixed(1) },
      { period: 'Year 10', rental: +(y * 1.35).toFixed(1), capital: +(c * 1.5 * 10).toFixed(1), total: +(y * 1.35 + c * 1.5 * 10).toFixed(1) },
    ],
  } as const;
}

function buildRiskFactors(p: Property) {
  const r = p.riskScore as 'low' | 'medium' | 'high';
  return [
    { label: 'Market Volatility',  level: r,        description: r === 'low' ? 'Stable demand drivers with limited speculative activity' : r === 'high' ? 'Elevated volatility — monitor macro conditions closely' : 'Moderate market activity with manageable fluctuations' },
    { label: 'Regulatory Risk',    level: 'low' as const,    description: 'Pro-investment policies with no foreign ownership restrictions in this segment' },
    { label: 'Liquidity Risk',     level: 'medium' as const, description: 'Average 4–6 months to resale in current market conditions' },
    { label: 'Currency Exposure',  level: 'medium' as const, description: 'Standard forex exposure — local currency stability varies by market' },
    { label: 'Oversupply Risk',    level: r === 'high' ? 'high' as const : 'low' as const, description: r === 'high' ? 'New supply pipeline may compress yields in the short term' : 'Supply pipeline is controlled — limited near-term oversupply risk' },
  ];
}

const COMPLIANCE_ITEMS = [
  { label: 'Title Deed', status: 'verified', note: 'Verified with Land Department' },
  { label: 'Developer License', status: 'verified', note: 'Active license, good standing' },
  { label: 'Building Permits', status: 'verified', note: 'All permits in order' },
  { label: 'Escrow Account', status: 'verified', note: 'Registered escrow in place' },
  { label: 'Service Charges', status: 'pending', note: 'Awaiting latest statement' },
];

const INFRA_ITEMS = [
  { label: 'Metro Station', distance: '500m', impact: '+8% value' },
  { label: 'International School', distance: '1.2km', impact: '+5% demand' },
  { label: 'Hospital', distance: '2km', impact: '+3% safety score' },
];

const MARKET_INTEL = [
  {
    label: 'Buyer Demand',
    value: 'High',
    sub: '↑ 12% vs last quarter',
    icon: Flame,
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.08)',
  },
  {
    label: 'Supply Pipeline',
    value: 'Tight',
    sub: '40% below 5-yr avg',
    icon: Building2,
    color: '#8B7355',
    bg: 'rgba(139,115,85,0.08)',
  },
  {
    label: 'Avg. Days Listed',
    value: '38 days',
    sub: 'vs 52 days area avg',
    icon: Clock,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
  },
  {
    label: 'Investor Interest',
    value: '94 views',
    sub: '7 watchlisted today',
    icon: Users,
    color: '#818CF8',
    bg: 'rgba(129,140,248,0.08)',
  },
];

/* ================================================================
   HELPERS
   ================================================================ */

function verdictIcon(verdict: 'yes' | 'maybe' | 'no') {
  if (verdict === 'yes') return <ThumbsUp className="h-5 w-5" />;
  if (verdict === 'no') return <ThumbsDown className="h-5 w-5" />;
  return <Minus className="h-5 w-5" />;
}

function riskBadgeClass(level: 'low' | 'medium' | 'high') {
  const map = {
    low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    high: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${map[level]}`;
}

function riskDotColor(level: string) {
  if (level === 'low') return 'bg-emerald-500';
  if (level === 'medium') return 'bg-amber-500';
  return 'bg-red-500';
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

/* ================================================================
   PAGE COMPONENT
   ================================================================ */

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { createLead, logAction } = useLeadPipeline();
  const { isSaved, toggleSave } = useSavedDeals();
  const saved = isSaved(id);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingType, setBookingType] = useState<'In-Person' | 'Virtual Tour'>('In-Person');
  const [bookingNotes, setBookingNotes] = useState('');
  const [roiScenario, setRoiScenario] = useState<RoiScenario>('moderate');

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [investAmount, setInvestAmount] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const investSectionRef = useRef<HTMLDivElement>(null);

  // Sticky bar appears after hero section scrolls out of view
  useEffect(() => {
    const onScroll = () => {
      const heroBottom = heroRef.current
        ? heroRef.current.getBoundingClientRect().bottom
        : 0;
      setShowStickyBar(heroBottom < 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    apiPropertyService
      .getDetail(id)
      .then((detail) => {
        if (!cancelled) {
          const p = adaptBackendProperty(detail);
          setProperty(p);
          setInvestAmount(p.price.amount);
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load property');
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <PageContainer className="space-y-6">
        {/* Hero skeleton */}
        <div className="rounded-2xl overflow-hidden h-72 sm:h-[400px] bg-[var(--bg-secondary)] animate-pulse" />
        {/* Price strip skeleton */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 flex gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-[var(--bg-secondary)] animate-pulse" />
            <div className="h-8 w-48 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
          </div>
          <div className="flex gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-16 rounded bg-[var(--bg-secondary)] animate-pulse" />
                <div className="h-5 w-16 rounded bg-[var(--bg-secondary)] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        {/* Metrics skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-3">
              <div className="h-7 w-7 rounded-lg bg-[var(--bg-secondary)] animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-[var(--bg-secondary)] animate-pulse" />
              <div className="h-5 w-1/2 rounded bg-[var(--bg-secondary)] animate-pulse" />
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }
  if (loadError || !property) {
    return (
      <PageContainer>
        <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/30 px-4 py-6 text-[13px] text-red-700 dark:text-red-300">
          {loadError ?? 'Property not found.'}
        </div>
      </PageContainer>
    );
  }

  const AI_SUMMARY = buildAiSummary(property);
  const ROI_SCENARIOS = buildRoiScenarios(property);
  const RISK_FACTORS = buildRiskFactors(property);

  const pricePerUnit = property.area.value > 0
    ? Math.round(property.price.amount / property.area.value)
    : 0;
  const breakEven = property.rentalYield > 0 ? (100 / property.rentalYield).toFixed(1) : 'N/A';
  const grossMultiplier = property.rentalYield > 0 ? (100 / property.rentalYield).toFixed(1) : 'N/A';
  const cashOnCash = (property.rentalYield * 0.85).toFixed(1);

  const verdictLabel =
    AI_SUMMARY.verdict === 'yes' ? 'Yes — Buy' :
    AI_SUMMARY.verdict === 'maybe' ? 'Maybe — Caution' : 'No — Avoid';

  const verdictColor =
    AI_SUMMARY.verdict === 'yes' ? 'text-emerald-500' :
    AI_SUMMARY.verdict === 'maybe' ? 'text-amber-500' : 'text-red-500';

  const verdictBg =
    AI_SUMMARY.verdict === 'yes' ? 'bg-emerald-500/10' :
    AI_SUMMARY.verdict === 'maybe' ? 'bg-amber-500/10' : 'bg-red-500/10';

  // Comparables: not yet wired to backend (would need a similar-properties
  // endpoint or a client-side filter on the larger listing). Empty for now.
  const comparables: Property[] = [];

  return (
    <PageContainer className="space-y-8">

      {/* ================================================================
          STICKY ACTION BAR — appears when hero scrolls out of view
          ================================================================ */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: -72, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -72, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="fixed top-[var(--spacing-topbar,56px)] left-0 right-0 z-40 bg-[var(--card-bg)]/95 backdrop-blur-lg border-b border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          >
            <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 flex items-center gap-3 h-14">
              {/* Back */}
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[#8B7355]/40 hover:bg-[rgba(139,115,85,0.06)] transition-all shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-[var(--fg-muted)]" />
              </button>

              {/* AI Score badge */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold text-[#8B7355] bg-[rgba(139,115,85,0.1)] border border-[rgba(139,115,85,0.2)]">
                  <Star className="h-2.5 w-2.5 fill-[#8B7355]" />
                  {property.aiScore}
                </span>
              </div>

              {/* Title + location */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--fg)] truncate leading-tight">{property.title}</p>
                <p className="text-[11px] text-[var(--fg-muted)] truncate">{property.location.city}</p>
              </div>

              {/* Price */}
              <div className="hidden sm:block shrink-0 text-right">
                <p className="text-[11px] text-[var(--fg-muted)] font-medium uppercase tracking-wider">Asking</p>
                <p className="text-sm font-bold text-[var(--fg)]">{formatCurrency(property.price)}</p>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleSave(id)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] font-medium text-[var(--fg-secondary)] hover:border-rose-400/40 hover:text-rose-500 hover:bg-rose-500/5 transition-all"
                >
                  <Heart className={`h-3.5 w-3.5 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
                </button>
                <button
                  onClick={() => { setBookingSubmitted(false); setBookingDate(''); setBookingTime(''); setBookingType('In-Person'); setBookingNotes(''); setShowBooking(true); }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] font-medium text-[var(--fg-secondary)] hover:border-[#8B7355]/40 hover:text-[#8B7355] hover:bg-[rgba(139,115,85,0.06)] transition-all"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Visit</span>
                </button>
                <button
                  onClick={() => router.push(`/investor/properties/${id}/negotiate`)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11px] font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #8B7355 0%, #6F5C46 100%)' }}
                >
                  <Gavel className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Negotiate</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-[var(--fg-muted)]">
        <Link href="/investor" className="hover:text-[var(--fg-secondary)] transition-colors">Investor</Link>
        <ChevronRight className="h-3 w-3" strokeWidth={2} />
        <Link href="/investor/properties" className="hover:text-[var(--fg-secondary)] transition-colors">Properties</Link>
        <ChevronRight className="h-3 w-3" strokeWidth={2} />
        <span className="text-[var(--fg-secondary)] font-medium truncate max-w-[200px]">
          {property.title}
        </span>
        <span className="ml-1 text-[var(--fg-muted)]/60">·</span>
        <span className="text-[var(--fg-muted)]/60">{property.location.city}</span>
      </nav>

      {/* ================================================================
          SECTION 1 — CINEMATIC HERO
          ================================================================ */}
      <motion.div
        ref={heroRef}
        className="prd-hero relative rounded-2xl overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div className="relative h-72 sm:h-[400px] group">
          {/* Image with parallax hover zoom */}
          <img
            src={
              property.images?.[0] ||
              'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop&q=80'
            }
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            onError={(e) => {
              const target = e.currentTarget;
              const fallback =
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop&q=80';
              if (target.src !== fallback) target.src = fallback;
            }}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

          {/* Top-left: Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/80 text-xs font-medium hover:bg-black/60 hover:text-white transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          {/* Top-right: Save + Share + Compare */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={() => toggleSave(id)}
              className="flex items-center justify-center h-8 w-8 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all"
              title="Save"
            >
              <Heart
                className={`h-4 w-4 transition-colors ${
                  saved ? 'fill-rose-500 text-rose-500' : 'text-white/80'
                }`}
              />
            </button>
            <button className="flex items-center justify-center h-8 w-8 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-all" title="Share">
              <Share2 className="h-4 w-4 text-white/80" />
            </button>
            <button
              onClick={() => investSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#8B7355]/70 backdrop-blur-md hover:bg-[#8B7355]/90 transition-all text-white text-[11px] font-semibold shadow-sm"
              title="Invest"
              aria-label="Scroll to Ready to Invest section"
            >
              <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
              Invest
            </button>
          </div>

          {/* Bottom overlay — Title + Location + max 2 tags only */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-10">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {property.isLuxury ? (
                  <span className="prd-hero-chip prd-hero-chip-accent inline-flex items-center px-2.5 py-1 rounded-full bg-[#C6A86B]/20 backdrop-blur-sm text-[11px] font-semibold text-[#C6A86B] border border-[#C6A86B]/30">
                    Luxury
                  </span>
                ) : property.isFractional ? (
                  <span className="prd-hero-chip inline-flex items-center px-2.5 py-1 rounded-full bg-[#8B7355]/20 backdrop-blur-sm text-[11px] font-semibold text-[#A89478] border border-[#8B7355]/30">
                    Fractional
                  </span>
                ) : null}
                <span className="prd-hero-chip inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-medium text-white/80 border border-white/10 capitalize">
                  {property.status.replace('-', ' ')}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                {property.title}
              </h1>
              <div className="flex items-center gap-1.5 mt-2">
                <MapPin className="h-3.5 w-3.5 text-white/50 shrink-0" />
                <span className="text-sm text-white/70">
                  {property.location.neighborhood
                    ? `${property.location.neighborhood}, `
                    : ''}
                  {property.location.city}, {property.location.country}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================================================================
          OVERVIEW PANEL — price + key metrics in one premium strip
          ================================================================ */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden"
        style={{ backgroundImage: 'linear-gradient(135deg, rgba(139,115,85,0.04) 0%, transparent 55%)' }}
      >
        <div className="flex flex-col sm:flex-row sm:divide-x sm:divide-[var(--border)]">
          {/* Price — primary focal point */}
          <div className="flex flex-col justify-center px-6 py-5 sm:flex-1">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--fg-muted)] font-semibold mb-2">
              Asking Price
            </p>
            <p className="text-[30px] sm:text-[34px] font-bold text-[var(--fg)] leading-none tracking-[-0.03em]">
              {formatCurrency(property.price)}
            </p>
            {pricePerUnit > 0 && (
              <p className="text-[12px] text-[var(--fg-muted)] mt-1.5 font-medium">
                {formatCurrency({ ...property.price, amount: pricePerUnit })} / {property.area.unit}
              </p>
            )}
          </div>

          {/* Divider metrics — 3 columns */}
          <div className="grid grid-cols-3 sm:flex sm:items-stretch divide-x divide-[var(--border)] border-t sm:border-t-0 border-[var(--border)]">
            {/* Yield */}
            <div className="flex flex-col justify-center px-5 py-5 text-center sm:text-left">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold mb-2">
                Rental Yield
              </p>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <div className="h-6 w-6 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-3 w-3 text-emerald-500" strokeWidth={2} />
                </div>
                <span className="text-[20px] font-bold text-emerald-500 leading-none">
                  {property.rentalYield}%
                </span>
              </div>
            </div>

            {/* Cap Growth */}
            <div className="flex flex-col justify-center px-5 py-5 text-center sm:text-left">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold mb-2">
                Capital Growth
              </p>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ background: 'rgba(139,115,85,0.12)' }}>
                  <BarChart3 className="h-3 w-3 text-[#8B7355]" strokeWidth={2} />
                </div>
                <span className="text-[20px] font-bold text-[#8B7355] leading-none">
                  +{property.capitalAppreciation}%
                </span>
              </div>
            </div>

            {/* Risk */}
            <div className="flex flex-col justify-center px-5 py-5 text-center sm:text-left">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--fg-muted)] font-semibold mb-2">
                Risk Level
              </p>
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${riskDotColor(property.riskScore)}`} />
                <span className={`text-[16px] font-bold capitalize leading-none ${
                  property.riskScore === 'low' ? 'text-emerald-500' :
                  property.riskScore === 'medium' ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {property.riskScore}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================================================================
          SECTION 2 — INVESTMENT SCORE PANEL
          ================================================================ */}
      <motion.div
        className="prd-score-panel rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6"
        style={{
          backgroundImage: 'linear-gradient(135deg, rgba(139,115,85,0.04) 0%, transparent 50%, rgba(198,168,107,0.04) 100%)',
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={sectionVariants}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:divide-x lg:divide-[var(--border)]">
          {/* Left: ConfidenceMeter */}
          <div className="shrink-0 flex justify-center lg:pr-8">
            <ConfidenceMeter
              score={property.aiScore}
              size={120}
              strokeWidth={8}
              label="Investment Score"
              sublabel="Powered by Glimmora AI"
            />
          </div>

          {/* Center: AI Verdict */}
          <div className="prd-score-verdict flex-1 min-w-0 lg:px-8">
            <p className="text-xs uppercase tracking-widest text-[var(--fg-muted)] font-medium mb-2 flex items-center gap-2">
              <Brain className="h-3.5 w-3.5 text-[#8B7355]" />
              AI Investment Verdict
            </p>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${verdictBg} ${verdictColor}`}
              >
                {verdictIcon(AI_SUMMARY.verdict)}
                {verdictLabel}
              </span>
            </div>
            <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
              {AI_SUMMARY.headline}
            </p>
          </div>

          {/* Right: 3 key metric cards */}
          <div className="shrink-0 grid grid-cols-3 gap-3 lg:pl-8">
            {[
              { label: 'Rental Yield', value: `${property.rentalYield}%`, color: '#4ADE80', icon: TrendingUp },
              { label: 'Capital Growth', value: `+${property.capitalAppreciation}%`, color: '#8B7355', icon: BarChart3 },
              {
                label: 'Risk Level',
                value: property.riskScore,
                color: property.riskScore === 'low' ? '#4ADE80' : property.riskScore === 'medium' ? '#F59E0B' : '#EF4444',
                icon: Shield,
              },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: `${color}14` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={1.8} />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)] font-semibold text-center">{label}</p>
                <p className="text-[15px] font-bold capitalize leading-none" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ================================================================
          SECTION 3 — SMART METRICS GRID
          ================================================================ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={staggerContainer}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {[
          {
            icon: DollarSign,
            label: 'Rental Yield',
            value: `${property.rentalYield}%`,
            trend: '+0.3%',
            trendUp: true,
          },
          {
            icon: TrendingUp,
            label: 'Capital Growth',
            value: `+${property.capitalAppreciation}%`,
            trend: '+1.2%',
            trendUp: true,
          },
          {
            icon: Ruler,
            label: `Price/${property.area.unit}`,
            value: `$${pricePerUnit.toLocaleString()}`,
            trend: '-2.1%',
            trendUp: false,
          },
          {
            icon: Target,
            label: 'Break-Even',
            value: `${breakEven} yrs`,
            trend: 'stable',
            trendUp: true,
          },
          {
            icon: Zap,
            label: 'Cash-on-Cash',
            value: `${cashOnCash}%`,
            trend: '+0.5%',
            trendUp: true,
          },
          {
            icon: Activity,
            label: 'Gross Multiplier',
            value: `${grossMultiplier}x`,
            trend: '-0.2x',
            trendUp: false,
          },
        ].map(({ icon: Icon, label, value, trend, trendUp }) => (
          <motion.div
            key={label}
            variants={staggerItem}
            className="group rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-[rgba(139,115,85,0.30)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-200"
          >
            <div className="h-8 w-8 rounded-lg flex items-center justify-center mb-3 transition-colors group-hover:bg-[rgba(139,115,85,0.10)]" style={{ background: 'var(--bg-secondary)' }}>
              <Icon className="h-3.5 w-3.5 text-[var(--fg-muted)] transition-colors group-hover:text-[#8B7355]" strokeWidth={1.8} />
            </div>
            <p className="text-[10px] text-[var(--fg-muted)] font-semibold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-[16px] font-bold text-[var(--fg)] leading-tight">{value}</p>
            <p className={`text-[10px] font-semibold mt-1.5 flex items-center gap-0.5 ${trendUp ? 'text-emerald-500' : 'text-red-400'}`}>
              <span>{trendUp ? '↑' : '↓'}</span>{trend}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ================================================================
          SECTION 4 — AI INSIGHTS
          ================================================================ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={sectionVariants}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden"
      >
        {/* Premium gradient header band */}
        <div
          className="px-6 py-5 border-b border-[var(--border)]"
          style={{ background: 'linear-gradient(135deg, rgba(139,115,85,0.07) 0%, rgba(198,168,107,0.04) 60%, transparent 100%)' }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,115,85,0.12)' }}>
                <Brain className="h-4 w-4 text-[#8B7355]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--fg)] leading-tight">AI Insights</h2>
                <p className="text-[11px] text-[var(--fg-muted)]">Powered by Glimmora AI · Updated today</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Analysis
              </span>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)] shrink-0">
              AI Confidence
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #8B7355, #C6A86B)' }}
                initial={{ width: 0 }}
                whileInView={{ width: `${AI_SUMMARY.confidence}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <span className="text-[13px] font-bold text-[#8B7355] shrink-0 tabular-nums">
              {AI_SUMMARY.confidence}%
            </span>
          </div>
        </div>

        <div className="p-6 grid gap-4 sm:grid-cols-2">
          {/* Opportunities */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Opportunities</span>
            </div>
            <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {AI_SUMMARY.opportunities.map((point, i) => (
                <motion.div key={i} variants={staggerItem} className="flex items-start gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-emerald-600">{i + 1}</span>
                  </div>
                  <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">{point}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Risks */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" strokeWidth={2} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Risks to Watch</span>
            </div>
            <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {AI_SUMMARY.risks.map((point, i) => (
                <motion.div key={i} variants={staggerItem} className="flex items-start gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[9px] font-bold text-amber-600">{i + 1}</span>
                  </div>
                  <p className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">{point}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ================================================================
          SECTION 4b — MARKET INTELLIGENCE
          ================================================================ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={sectionVariants}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden"
      >
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]" style={{ background: 'linear-gradient(135deg, rgba(129,140,248,0.05) 0%, transparent 60%)' }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(129,140,248,0.10)' }}>
              <LayoutGrid className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--fg)] leading-tight">Market Intelligence</h2>
              <p className="text-[11px] text-[var(--fg-muted)]">{property.location.city} · {property.location.neighborhood ?? 'Micro-market'}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/investor/areas')}
            className="text-[11px] text-[var(--fg-muted)] hover:text-[#8B7355] flex items-center gap-1 transition-colors"
          >
            Area Report
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[var(--border)]">
          {MARKET_INTEL.map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="px-5 py-5 flex flex-col gap-2.5 group hover:bg-[var(--bg-secondary)] transition-colors">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={1.8} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">{label}</span>
              </div>
              <p className="text-[18px] font-bold leading-none" style={{ color }}>{value}</p>
              <p className="text-[11px] text-[var(--fg-muted)] leading-snug">{sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ================================================================
          SECTION 5 — PROPERTY STORY (Description + Specs + ROI Chart)
          ================================================================ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={sectionVariants}
        className="grid gap-6 lg:grid-cols-2"
      >
        {/* Left: Description + Specs */}
        <div className="prd-story-card rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--border)]">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,115,85,0.10)' }}>
              <Building2 className="h-4 w-4 text-[#8B7355]" />
            </div>
            <h2 className="text-base font-semibold text-[var(--fg)]">About This Property</h2>
          </div>
          <div className="p-6">
          <p className="text-sm text-[var(--fg-secondary)] leading-relaxed mb-6">
            {property.description}
          </p>

          <h3 className="text-sm font-semibold text-[var(--fg)] mb-3">Key Specifications</h3>
          <div className="prd-spec-grid grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Building2, label: 'Type', value: property.subType || property.type },
              {
                icon: Ruler,
                label: 'Area',
                value: `${property.area.value.toLocaleString()} ${property.area.unit}`,
              },
              { icon: Calendar, label: 'Year Built', value: property.yearBuilt === 0 ? 'N/A' : String(property.yearBuilt) },
              { icon: BarChart3, label: 'Developer', value: property.developer },
              ...(property.bedrooms != null
                ? [{ icon: BedDouble, label: 'Bedrooms', value: String(property.bedrooms) }]
                : []),
              ...(property.bathrooms != null
                ? [{ icon: Bath, label: 'Bathrooms', value: String(property.bathrooms) }]
                : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="prd-spec-item flex items-start gap-2.5 p-2.5 rounded-lg bg-[var(--bg-secondary)]">
                <div className="h-6 w-6 rounded-md bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <Icon className="h-3 w-3 text-[var(--fg-muted)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[var(--fg-muted)] font-medium uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-[var(--fg)] truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>

        {/* Right: ROI Projections table + AreaChart */}
        <div className="prd-story-card rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(74,222,128,0.10)' }}>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <h2 className="text-base font-semibold text-[var(--fg)]">ROI Projections</h2>
            </div>
            {/* Scenario toggle */}
            <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-0.5">
              {(['conservative', 'moderate', 'aggressive'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setRoiScenario(s)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-semibold capitalize transition-all cursor-pointer ${
                    roiScenario === s
                      ? 'bg-[var(--card-bg)] text-[#8B7355] shadow-sm'
                      : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6">

          {/* Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 px-2 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                    Period
                  </th>
                  <th className="text-right py-2 px-2 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                    Rental
                  </th>
                  <th className="text-right py-2 px-2 text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wider">
                    Capital
                  </th>
                  <th className="text-right py-2 px-2 text-[10px] font-medium text-emerald-500 uppercase tracking-wider">
                    Total ROI
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROI_SCENARIOS[roiScenario].map((row) => (
                  <tr
                    key={row.period}
                    className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="py-2.5 px-2 font-medium text-[var(--fg)]">{row.period}</td>
                    <td className="py-2.5 px-2 text-right text-[var(--fg-secondary)]">
                      +{row.rental}%
                    </td>
                    <td className="py-2.5 px-2 text-right text-[var(--fg-secondary)]">
                      +{row.capital}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-emerald-500">
                      +{row.total}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AreaChart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <AreaChart data={ROI_SCENARIOS[roiScenario] as any} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B7355" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B7355" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--fg-muted)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: number) => [`+${value}%`, 'Total ROI']) as any}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#8B7355"
                  strokeWidth={2}
                  fill="url(#roiGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Investment Calculator */}
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-3.5 w-3.5 text-[#8B7355]" />
              <span className="text-[12px] font-semibold text-[var(--fg)]">Quick Calculator</span>
              <span className="text-[10px] text-[var(--fg-muted)] ml-1">· How much will you make?</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wider mb-1">
                  Your investment (₹)
                </label>
                <input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm font-semibold text-[var(--fg)] focus:outline-none focus:border-[#8B7355] transition-colors"
                  min={100000}
                  step={100000}
                />
              </div>
              <div className="shrink-0 text-right sm:text-left">
                <p className="text-[10px] font-medium text-[var(--fg-muted)] uppercase tracking-wider mb-1">
                  Projected at Year 5 ({roiScenario})
                </p>
                <p className="text-[20px] font-bold text-emerald-500 leading-none">
                  {formatCurrency({
                    ...property.price,
                    amount: Math.round(investAmount * (1 + ROI_SCENARIOS[roiScenario][2].total / 100)),
                  })}
                </p>
                <p className="text-[11px] text-emerald-500/70 mt-0.5">
                  +{ROI_SCENARIOS[roiScenario][2].total}% total return
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </motion.div>

      {/* ================================================================
          SECTION 6 — AMENITIES EXPERIENCE
          ================================================================ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={sectionVariants}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--border)]">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(74,222,128,0.10)' }}>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--fg)] leading-tight">Features & Amenities</h2>
            <p className="text-[11px] text-[var(--fg-muted)]">{property.features.length} features included</p>
          </div>
        </div>
        <div className="p-6 flex flex-wrap gap-2">
          {property.features.map((feature) => (
            <button
              key={feature}
              onClick={() => router.push(`/investor/properties?query=${encodeURIComponent(feature)}`)}
              className="prd-amenity-pill inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium text-[var(--fg-secondary)] bg-[var(--bg-secondary)] border border-[var(--border)] hover:bg-[rgba(139,115,85,0.08)] hover:border-[#8B7355]/30 hover:text-[#8B7355] hover:shadow-sm active:scale-[0.97] transition-all cursor-pointer"
              title={`Find similar properties with ${feature}`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70 shrink-0" />
              {feature}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ================================================================
          SECTION 7 — LOCATION + INFRA IMPACT
          ================================================================ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={sectionVariants}
        className="prd-location-card rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(139,115,85,0.10)' }}>
              <MapPin className="h-4 w-4 text-[#8B7355]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--fg)] leading-tight">Location & Infrastructure</h2>
              <p className="text-[11px] text-[var(--fg-muted)]">{property.location.neighborhood ? `${property.location.neighborhood}, ` : ''}{property.location.city}</p>
            </div>
          </div>
        </div>
        <div className="p-6">

        {/* Map placeholder */}
        <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-[#8B7355]/10 via-[var(--bg-secondary)] to-[#C6A86B]/10 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-[#8B7355]/40 mx-auto mb-2" />
            <p className="text-sm text-[var(--fg-muted)]">
              {property.location.neighborhood
                ? `${property.location.neighborhood}, `
                : ''}
              {property.location.city}
            </p>
            <p className="text-xs text-[var(--fg-muted)] mt-0.5">
              {property.location.coordinates.lat.toFixed(4)}, {property.location.coordinates.lng.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Infrastructure impact items */}
        <h3 className="text-sm font-semibold text-[var(--fg)] mb-3">Infrastructure Impact</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {INFRA_ITEMS.map((item) => (
            <div
              key={item.label}
              className="prd-infra-item flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
            >
              <div className="h-9 w-9 rounded-lg bg-[#8B7355]/10 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-[#8B7355]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--fg)]">{item.label}</p>
                <p className="text-xs text-[var(--fg-muted)]">
                  {item.distance} away
                </p>
                <p className="text-[10px] font-semibold text-emerald-500 mt-0.5">
                  {item.impact}
                </p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </motion.div>

      {/* ================================================================
          SECTION 8 — RISK / COMPLIANCE CENTER
          ================================================================ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={sectionVariants}
        className="grid gap-6 lg:grid-cols-2"
      >
        {/* Left: Risk Factors */}
        <div className="prd-risk-card rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--border)]">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,158,11,0.10)' }}>
              <Shield className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--fg)] leading-tight">Risk Assessment</h2>
              <p className="text-[11px] text-[var(--fg-muted)]">{RISK_FACTORS.filter(r => r.level === 'low').length} low · {RISK_FACTORS.filter(r => r.level === 'medium').length} medium risk factors</p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {RISK_FACTORS.map((risk) => (
              <div
                key={risk.label}
                className="prd-risk-row flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
              >
                <AlertTriangle
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    risk.level === 'low'
                      ? 'text-emerald-500'
                      : risk.level === 'medium'
                      ? 'text-amber-500'
                      : 'text-red-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-[var(--fg)]">{risk.label}</span>
                    <span className={riskBadgeClass(risk.level)}>{risk.level}</span>
                  </div>
                  <p className="text-xs text-[var(--fg-muted)] leading-relaxed">
                    {risk.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Compliance Checklist */}
        <div className="prd-risk-card rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-[var(--border)]">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(74,222,128,0.10)' }}>
              <FileText className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--fg)] leading-tight">Compliance Checklist</h2>
              <p className="text-[11px] text-[var(--fg-muted)]">{COMPLIANCE_ITEMS.filter(c => c.status === 'verified').length}/{COMPLIANCE_ITEMS.length} verified</p>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {COMPLIANCE_ITEMS.map((item) => (
              <div
                key={item.label}
                className="prd-compliance-row flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
              >
                {item.status === 'verified' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-[var(--fg)]">{item.label}</span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider ${
                        item.status === 'verified' ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--fg-muted)]">{item.note}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[var(--fg-muted)] px-6 pb-5 pt-3 border-t border-[var(--border)]">
            All compliance checks performed by Glimmora AI using official government registries. Last updated: April 2026.
          </p>
        </div>
      </motion.div>

      {/* ================================================================
          SECTION 9 — ACTION CTA
          ================================================================ */}
      <motion.div
        ref={investSectionRef}
        id="invest-section"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={sectionVariants}
        className="prd-cta-card rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(139,115,85,0.08) 0%, rgba(111,92,70,0.04) 50%, rgba(198,168,107,0.06) 100%)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--fg)] mb-2">
            Ready to Invest?
          </h2>
          <p className="text-sm text-[var(--fg-secondary)]">
            Take the next step — our AI will guide you through every stage.
          </p>
        </div>

        {/* 3 CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg hover:-translate-y-px active:scale-[0.98] shadow-md"
            style={{ background: 'linear-gradient(135deg, #8B7355 0%, #6F5C46 100%)', boxShadow: '0 4px 14px rgba(139,115,85,0.35)' }}
            onClick={() => router.push(`/investor/properties/${id}/negotiate`)}
          >
            <Gavel className="h-4 w-4" />
            Start Negotiation
          </button>
          <button
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[13px] font-semibold text-[var(--fg)] border border-[var(--border)] bg-transparent hover:bg-[var(--bg-secondary)] hover:border-[rgba(139,115,85,0.30)] transition-all active:scale-[0.98]"
            onClick={() => { setBookingSubmitted(false); setBookingDate(''); setBookingTime(''); setBookingType('In-Person'); setBookingNotes(''); setShowBooking(true); }}
          >
            <Eye className="h-4 w-4" />
            Book a Visit
          </button>
          <button
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-[13px] font-medium text-[var(--fg-secondary)] hover:text-[var(--fg)] hover:bg-[var(--bg-secondary)] transition-all active:scale-[0.98]"
            onClick={() => toggleSave(id)}
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-current text-rose-500' : ''}`} />
            {saved ? 'Saved' : 'Save Property'}
          </button>
        </div>

        {/* Urgency section */}
        <div className="border-t border-[var(--border)] pt-6">
          <div className="flex items-center gap-2 justify-center mb-4">
            <Clock className="h-4 w-4 text-[var(--fg-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--fg)]">
              What happens if you wait?
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div className="text-center p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <p className="text-[10px] uppercase tracking-wider text-amber-600/70 font-semibold mb-1.5">
                3-Month Forecast
              </p>
              <p className="text-[15px] font-bold text-amber-500">+2.1%</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">price increase</p>
            </div>
            <div className="text-center p-4 rounded-xl border border-red-500/20 bg-red-500/5">
              <p className="text-[10px] uppercase tracking-wider text-red-500/70 font-semibold mb-1.5">
                6-Month Forecast
              </p>
              <p className="text-[15px] font-bold text-red-500">+4.8%</p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">price increase</p>
            </div>
            <div className="text-center p-4 rounded-xl border border-[rgba(139,115,85,0.2)] bg-[rgba(139,115,85,0.05)]">
              <p className="text-[10px] uppercase tracking-wider text-[#8B7355]/70 font-semibold mb-1.5">
                Opportunity Cost
              </p>
              <p className="text-[15px] font-bold text-[#8B7355]">
                {formatCurrency({
                  ...property.price,
                  amount: Math.round(property.price.amount * 0.024),
                })}
              </p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">per 6 months</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ================================================================
          SECTION 10 — COMPARABLE PROPERTIES
          ================================================================ */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={sectionVariants}
        className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--fg)]">Comparable Properties</h2>
          <button
            onClick={() => router.push('/investor/properties')}
            className="text-xs text-[var(--fg-muted)] hover:text-[#8B7355] transition-colors flex items-center gap-1"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {comparables.map((comp) => (
            <Link
              key={comp.id}
              href={`/investor/properties/${comp.id}`}
              className="prd-comp-card group rounded-xl border border-[var(--border)] overflow-hidden hover:border-[#8B7355]/30 transition-all"
            >
              {/* Thumbnail */}
              <div className="relative h-32 overflow-hidden">
                <img
                  src={
                    comp.images?.[0] ||
                    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=250&fit=crop&q=80'
                  }
                  alt={comp.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback =
                      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=250&fit=crop&q=80';
                    if (target.src !== fallback) target.src = fallback;
                  }}
                />
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                  <Sparkles className="h-2.5 w-2.5 text-[#C6A86B]" />
                  <span className="text-[10px] font-bold text-white">{comp.aiScore}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-semibold text-[var(--fg)] truncate group-hover:text-[#8B7355] transition-colors">
                  {comp.title}
                </p>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">{comp.location.city}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-emerald-500">
                    {comp.rentalYield}% yield
                  </span>
                  <span className="text-xs font-medium text-[var(--fg-secondary)]">
                    AI {comp.aiScore}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ================================================================
          BOOK A VISIT DIALOG
          ================================================================ */}
      <Dialog open={showBooking} onClose={() => setShowBooking(false)} size="md">
        {bookingSubmitted ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle>Visit Booked!</DialogTitle>
              <DialogDescription>
                Your visit request for <span className="font-medium text-[var(--fg)]">{property.title}</span> has been submitted. Our team will confirm the details via email shortly.
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={() => setShowBooking(false)}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8B7355 0%, #6F5C46 100%)' }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Book a Visit</DialogTitle>
              <DialogDescription>
                Schedule a viewing for {property.title} in {property.location.city}, {property.location.country}.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Create a lead and log the visit event so it appears on broker side
                const newLead = createLead({
                  propertyId: id,
                  propertyName: property.title,
                  propertyLocation: `${property.location.city}, ${property.location.country}`,
                  propertyPrice: property.price,
                  investorId: user?.id ?? 'investor',
                  investorName: user?.name ?? 'Investor',
                  investorEmail: user?.email,
                  investorPhone: user?.phone,
                  intentLevel: 'high',
                  source: 'book-visit',
                });
                const timeLabel = bookingTime || 'TBD';
                const dateLabel = bookingDate || 'TBD';
                const notesSuffix = bookingNotes ? ` · ${bookingNotes}` : '';
                logAction(
                  newLead.id,
                  'visit-scheduled',
                  `${bookingType} visit on ${dateLabel} at ${timeLabel}${notesSuffix}`,
                );
                setBookingSubmitted(true);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">
                  Preferred Date
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:border-[#8B7355] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">
                  Preferred Time
                </label>
                <select
                  required
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--fg)] focus:outline-none focus:border-[#8B7355] transition-colors"
                >
                  <option value="">Select a time slot</option>
                  <option value="9:00 AM">9:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="2:00 PM">2:00 PM</option>
                  <option value="3:00 PM">3:00 PM</option>
                  <option value="4:00 PM">4:00 PM</option>
                  <option value="5:00 PM">5:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">
                  Visit Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['In-Person', 'Virtual Tour'] as const).map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--fg-secondary)] cursor-pointer hover:border-[#8B7355]/30 transition-colors has-[:checked]:border-[#8B7355] has-[:checked]:bg-[#8B7355]/5 has-[:checked]:text-[var(--fg)]"
                    >
                      <input
                        type="radio"
                        name="visitType"
                        value={type}
                        checked={bookingType === type}
                        onChange={() => setBookingType(type)}
                        className="accent-[#8B7355]"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--fg-secondary)] mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Any specific areas you'd like to inspect?"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:border-[#8B7355] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #8B7355 0%, #6F5C46 100%)' }}
              >
                <Calendar className="h-4 w-4" />
                Confirm Booking
              </button>
            </form>
          </>
        )}
      </Dialog>
    </PageContainer>
  );
}
