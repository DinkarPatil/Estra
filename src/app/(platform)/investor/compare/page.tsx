'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, Plus, X, Trophy, TrendingUp, TrendingDown, DollarSign,
  MapPin, Building2, Shield, BarChart3, Sparkles, Brain,
  ChevronDown, Check, ArrowRight, AlertTriangle, Activity,
  SlidersHorizontal, Eye, Target, Zap, Lock, Users,
  CheckCircle2, Percent, Globe, MessageCircle, Send, Info, Minus,
  Star, Bookmark, Download, Share2,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { mockProperties } from '@/mock-data/properties';
import { ConfidenceMeter } from '@/components/shared';
import { useFunnel } from '@/contexts/investor-funnel-context';
import { apiPropertyService } from '@/services';
import { adaptBackendProperty } from '@/services/api/property.api';
import type { Property, PropertyType } from '@/types/property';
import {
  compareProperties as aiCompareProperties,
  type RecommendationProperty,
  type RecommendationResponseBody,
} from '@/services/api/recommendation.api';
import {
  readAllCachedLiveListings,
  type RealtimeListing,
} from '@/services/api/realtime.api';

function formatCurrency(n: number) {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

/* ─── Types ─── */

interface ComparisonMetric {
  label: string;
  key: string;
  format: (v: number) => string;
  higherIsBetter: boolean;
  category: string;
  icon: typeof DollarSign;
}

interface ScoreDimension {
  label: string;
  key: string;
  weight: number;
  tooltip?: string;
}

/* ─── Constants ─── */

/* Warm Glimmora palette — monochromatic earth tones, no rainbow */
const PROPERTY_COLORS = ['#8B7355', '#5A4A38', '#A89478', '#D4B896', '#C4A882'];

const METRICS: ComparisonMetric[] = [
  { label: 'Price', key: 'price.amount', format: (v) => formatCurrency(v), higherIsBetter: false, category: 'Financial', icon: DollarSign },
  { label: 'AI Score', key: 'aiScore', format: (v) => `${v}/100`, higherIsBetter: true, category: 'AI Analysis', icon: Brain },
  { label: 'Rental Yield', key: 'rentalYield', format: (v) => `${v}%`, higherIsBetter: true, category: 'Returns', icon: Percent },
  { label: 'Capital Appreciation', key: 'capitalAppreciation', format: (v) => `${v}%`, higherIsBetter: true, category: 'Returns', icon: TrendingUp },
  { label: 'Bedrooms', key: 'bedrooms', format: (v) => `${v}`, higherIsBetter: true, category: 'Property', icon: Building2 },
  { label: 'Bathrooms', key: 'bathrooms', format: (v) => `${v}`, higherIsBetter: true, category: 'Property', icon: Building2 },
  { label: 'Area (sqft)', key: 'area.value', format: (v) => `${v.toLocaleString()}`, higherIsBetter: true, category: 'Property', icon: Target },
];

const DEFAULT_WEIGHTS: ScoreDimension[] = [
  { label: 'ROI Potential', key: 'roi', weight: 30, tooltip: 'Expected return on investment over the holding period' },
  { label: 'Risk Level', key: 'risk', weight: 25, tooltip: 'Investment risk and market volatility assessment' },
  { label: 'Growth Outlook', key: 'growth', weight: 20, tooltip: 'Long-term capital appreciation forecast' },
  { label: 'Liquidity', key: 'liquidity', weight: 15, tooltip: 'Ease of converting the property back to cash' },
  { label: 'Location Quality', key: 'location', weight: 10, tooltip: 'Infrastructure, amenities & demand in the area' },
];

/* Score data — derived from property metrics so any property works */
function getDimensionScores(p: Property): Record<string, number> {
  const riskScore = p.riskScore === 'low' ? 88 : p.riskScore === 'medium' ? 68 : 42;
  const roi = Math.min(98, Math.round(p.rentalYield * 7 + p.capitalAppreciation * 2.5));
  const growth = Math.min(98, Math.round(p.capitalAppreciation * 5 + 25));
  const liquidity = riskScore >= 80 ? 75 : riskScore >= 60 ? 58 : 42;
  const location = Math.min(98, Math.round(p.aiScore * 0.88 + 12));
  return { roi, risk: riskScore, growth, liquidity, location };
}

/* Fallback static scores for mock properties (preserved for backward compat) */
const DIMENSION_SCORES: Record<string, Record<string, number>> = {
  [mockProperties[0]?.id || '']: { roi: 85, risk: 88, growth: 78, liquidity: 72, location: 95 },
  [mockProperties[1]?.id || '']: { roi: 78, risk: 82, growth: 92, liquidity: 60, location: 90 },
  [mockProperties[2]?.id || '']: { roi: 82, risk: 75, growth: 70, liquidity: 55, location: 85 },
  [mockProperties[3]?.id || '']: { roi: 72, risk: 65, growth: 85, liquidity: 68, location: 92 },
  [mockProperties[4]?.id || '']: { roi: 90, risk: 55, growth: 65, liquidity: 78, location: 70 },
};

/* Projection data */
function generateProjection(basePrice: number, appreciation: number, rentalYield: number) {
  const years = [0, 1, 2, 3, 4, 5];
  return years.map((y) => ({
    year: y === 0 ? 'Now' : `${y}Y`,
    value: Math.round(basePrice * Math.pow(1 + appreciation / 100, y)),
    totalReturn: y === 0 ? 0 : Math.round(basePrice * (Math.pow(1 + appreciation / 100, y) - 1) + basePrice * (rentalYield / 100) * y),
  }));
}

/* AI verdicts — generated from property metrics so any property gets a verdict */
function getAiVerdict(p: Property): { verdict: string; rating: string; color: string; reasoning: string[] } {
  const score = p.aiScore;
  if (score >= 88) return {
    verdict: 'Strong Buy', rating: 'A+', color: '#8B7355',
    reasoning: [
      `Rental yield of ${p.rentalYield}% outperforms area median — strong income foundation`,
      `Low-risk profile with ${p.capitalAppreciation}% annual appreciation supports total return`,
      `AI score of ${score}/100 — top-tier across all evaluated dimensions`,
      'Fundamentals support both income and growth objectives',
    ],
  };
  if (score >= 78) return {
    verdict: 'Buy', rating: 'A', color: '#A89478',
    reasoning: [
      `${p.rentalYield}% yield provides stable cash flow with upside potential`,
      `Capital appreciation of ${p.capitalAppreciation}% annually at moderate risk`,
      `AI score of ${score}/100 reflects solid investment case`,
      'Well-balanced profile across income, growth, and risk dimensions',
    ],
  };
  if (score >= 65) return {
    verdict: 'Hold / Income Buy', rating: 'B+', color: '#F59E0B',
    reasoning: [
      `${p.rentalYield}% yield — primarily an income play with limited growth upside`,
      `Moderate capital appreciation of ${p.capitalAppreciation}% constrains total return`,
      `AI score of ${score}/100 — adequate for conservative income-focused investors`,
      'Suitable for capital preservation with steady cash yield',
    ],
  };
  if (score >= 50) return {
    verdict: 'Speculative Buy', rating: 'B', color: '#F59E0B',
    reasoning: [
      `${p.riskScore} risk classification requires careful position sizing`,
      `${p.rentalYield}% yield partially offsets capital risk`,
      `AI score of ${score}/100 — above-average risk warrants deeper due diligence`,
      'Suitable for experienced investors with higher risk tolerance',
    ],
  };
  return {
    verdict: 'High Risk / Avoid', rating: 'C', color: '#EF4444',
    reasoning: [
      `AI score of ${score}/100 — significant concerns flagged across key metrics`,
      `${p.riskScore} risk level combined with ${p.rentalYield}% yield may not justify exposure`,
      'Recommend stronger alternatives in the current comparison set',
      'If proceeding, limit position size and set defined exit criteria',
    ],
  };
}

/* Static verdicts for known mock properties (preserved for demo) */
const AI_VERDICTS_STATIC: Record<string, { verdict: string; rating: string; color: string; reasoning: string[] }> = {
  [mockProperties[0]?.id || '']: {
    verdict: 'Strong Buy', rating: 'A+', color: '#8B7355',
    reasoning: [
      'Excellent rental yield at 4.8% — top quartile for Singapore residential',
      'Low vacancy risk (98% historical occupancy)',
      'Infrastructure catalyst (MRT extension 2027) supports 12% appreciation',
      'Risk-adjusted return of 15.2% ranks #1 in our comparison set',
    ],
  },
  [mockProperties[1]?.id || '']: {
    verdict: 'Buy', rating: 'A', color: '#A89478',
    reasoning: [
      'Priced 8% below comparable beachfront villas — immediate value',
      'Highest capital appreciation potential at 12.8% annually',
      'Premium location with strictly limited future supply',
      'Currency stability (AED peg) reduces forex risk',
    ],
  },
  [mockProperties[2]?.id || '']: {
    verdict: 'Hold / Income Buy', rating: 'B+', color: '#F59E0B',
    reasoning: [
      'Strongest yield at 7.8% — best pure income play in the set',
      'Government tenant eliminates vacancy risk for 15 years',
      'Limited growth upside caps total return potential',
      'Commercial segment has lower liquidity — longer exit timeline',
    ],
  },
  [mockProperties[3]?.id || '']: {
    verdict: 'Speculative Buy', rating: 'B', color: '#F59E0B',
    reasoning: [
      'Heritage premium provides natural price floor',
      'London market has high regulatory complexity',
      'Lower rental yield at 3.2% — growth-dependent thesis',
      'GBP currency exposure adds a risk dimension',
    ],
  },
  [mockProperties[4]?.id || '']: {
    verdict: 'High Risk Buy', rating: 'B-', color: '#EF4444',
    reasoning: [
      'Highest raw ROI potential at 28.4% via renovation',
      'Execution risk is significant — requires hands-on management',
      'Zero income during 6-8 month renovation period',
      'Suitable only for experienced investors with renovation expertise',
    ],
  },
};

/* Downside analysis */
const DOWNSIDE: Record<string, { scenario: string; drawdown: string; recovery: string; mitigation: string }> = {
  [mockProperties[0]?.id || '']: { scenario: 'SG cooling measures + expat outflow', drawdown: '-8 to -12%', recovery: '12-18 months', mitigation: 'Strong rental demand provides income floor' },
  [mockProperties[1]?.id || '']: { scenario: 'Gulf market correction + oil shock', drawdown: '-15 to -20%', recovery: '18-24 months', mitigation: 'Palm Jumeirah scarcity limits downside' },
  [mockProperties[2]?.id || '']: { scenario: 'Tenant exit + commercial downturn', drawdown: '-6 to -10%', recovery: '6-12 months', mitigation: 'Prime location ensures re-leasing demand' },
  [mockProperties[3]?.id || '']: { scenario: 'UK recession + interest rate spike', drawdown: '-18 to -25%', recovery: '24-36 months', mitigation: 'Heritage listing provides value floor' },
  [mockProperties[4]?.id || '']: { scenario: 'Renovation delays + market softening', drawdown: '-5 to -15%', recovery: 'Variable', mitigation: 'Below-market entry price limits downside' },
};

/* ─── Markdown renderer (handles **bold** patterns) ─── */
function renderMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-[var(--fg)]">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/* ─── Page Component ─── */

export default function DealComparisonPage() {
  const router = useRouter();
  const { selectedPropertyIds, selectedAreaNames, intent, setCurrentStep, completeStep } = useFunnel();

  // ── Pool resolution ──
  //    1. Live-scraped listings cached in sessionStorage by the Properties page.
  //    2. DB-backed search results (legacy properties) as fallback.
  //    3. Mock data only as last resort to keep the layout from collapsing.
  const [backendProps, setBackendProps] = useState<Property[]>([]);
  const [poolReady, setPoolReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  /* Adapter — RealtimeListing → Property (same shape as properties page). */
  const adaptLive = (r: RealtimeListing): Property => {
    const cityName = r.city || 'Mumbai';
    return {
      id: r.id,
      title: r.title || `${r.bedrooms ?? ''} BHK in ${r.locality_text ?? cityName}`.trim(),
      description: r.description || r.title || '',
      location: {
        city: cityName,
        state: 'Maharashtra',
        country: 'India',
        countryCode: 'IN',
        coordinates: { lat: 0, lng: 0 },
        neighborhood: r.locality_text ?? undefined,
      },
      price: { amount: r.price_inr ?? 0, currency: 'INR' },
      type: 'residential' as PropertyType,
      subType: 'Apartment',
      bedrooms: r.bedrooms ?? 0,
      bathrooms: r.bathrooms ?? 0,
      area: { value: r.area_sqft ?? 0, unit: 'sqft' },
      yearBuilt: 2024,
      developer: r.builder_name || r.project_name || 'Developer',
      aiScore: 80,
      rentalYield: 3.5,
      capitalAppreciation: 8,
      riskScore: 'medium',
      images: r.images && r.images.length > 0 ? r.images : [],
      features: [r.source.toUpperCase()],
      status: 'available',
      isLuxury: (r.price_inr ?? 0) > 50_000_000,
      createdAt: r.scraped_at || new Date().toISOString(),
    } as Property;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1. Live-scraped listings (real-time data the user already saw).
        const live = readAllCachedLiveListings();
        if (live.length > 0) {
          if (!cancelled) setBackendProps(live.map(adaptLive));
          return;
        }

        // 2. DB-backed search as fallback.
        const data = selectedAreaNames.length > 0
          ? await apiPropertyService.searchByAreas(selectedAreaNames, intent.rawQuery)
          : (await apiPropertyService.listProperties({ limit: 60 })).properties as unknown as Property[];
        if (!cancelled) setBackendProps(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Could not load listings');
      } finally {
        if (!cancelled) setPoolReady(true);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Unified pool: live + DB; mock only if both fail entirely.
  const pool: Property[] = backendProps.length > 0 ? backendProps : mockProperties;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // Resolve the funnel's pre-selected ids against the pool exactly once after
  // the pool is loaded. Without this, real backend UUIDs never match the mock
  // ids the page used to default to, so the "compare" view stayed empty.
  const initFromFunnelRef = useRef(false);
  useEffect(() => {
    if (!poolReady || initFromFunnelRef.current) return;
    initFromFunnelRef.current = true;
    const fromFunnel = pool.filter(p => selectedPropertyIds.includes(p.id)).map(p => p.id);
    if (fromFunnel.length === selectedPropertyIds.length && fromFunnel.length > 0) {
      // All selected properties are already in the pool — use them directly.
      setSelectedIds(fromFunnel);
    } else if (selectedPropertyIds.length > 0) {
      // Some or all selected properties are missing from the pool (e.g., different
      // area filter or backend pagination). Fetch the missing ones by ID so the
      // comparison always shows exactly what the user picked.
      const missingIds = selectedPropertyIds.filter(id => !fromFunnel.includes(id));
      const alreadyInPool = fromFunnel;
      Promise.all(
        missingIds.map(id =>
          apiPropertyService.getDetail(id).then(adaptBackendProperty).catch(() => null)
        )
      ).then(results => {
        const fetched = results.filter((p): p is Property => p !== null);
        if (fetched.length > 0) {
          setBackendProps(prev => [...prev, ...fetched.filter(f => !prev.some(e => e.id === f.id))]);
        }
        const allIds = [...alreadyInPool, ...fetched.map(p => p.id)];
        if (allIds.length > 0) {
          setSelectedIds(allIds);
        } else {
          setSelectedIds(pool.slice(0, 2).map(p => p.id));
        }
      });
    } else {
      // No funnel selection — default to first 2 from pool.
      setSelectedIds(pool.slice(0, 2).map(p => p.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolReady]);

  const [showSelector, setShowSelector] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Financial');
  const [weights, setWeights] = useState<ScoreDimension[]>(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);
  const [projectionHorizon, setProjectionHorizon] = useState<'1Y' | '3Y' | '5Y'>('5Y');
  const [showDownside, setShowDownside] = useState(false);
  const [showCompareAI, setShowCompareAI] = useState(false);
  const [compareAIInput, setCompareAIInput] = useState('');
  const [compareAIMessages, setCompareAIMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([]);
  const [compareAITyping, setCompareAITyping] = useState(false);
  const [compareAILoading, setCompareAILoading] = useState(false);
  const [compareAITab, setCompareAITab] = useState<'chat' | 'financial' | 'returns' | 'property'>('chat');
  const [activeChartTab, setActiveChartTab] = useState<'radar' | 'projection' | 'score'>('radar');
  // Structured AI result, separate from chat transcript — used to render the
  // prominent AI Verdict panel directly on the compare page.
  const [aiResult, setAiResult] = useState<RecommendationResponseBody | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiUserQuery, setAiUserQuery] = useState('');
  const compareAIMsgEnd = useRef<HTMLDivElement>(null);

  useEffect(() => { setCurrentStep(4); }, [setCurrentStep]);
  useEffect(() => { compareAIMsgEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [compareAIMessages]);

  /* Reset all modal state every time the modal opens — fixes stale property names */
  useEffect(() => {
    if (!showCompareAI) return;
    setCompareAIMessages([]);
    setCompareAITab('chat');
    setCompareAIInput('');
    setCompareAITyping(false);
    setCompareAILoading(true);
    const currentProps = selectedIds.map((id) => pool.find((p) => p.id === id)).filter(Boolean);
    const propNames = currentProps.map((p) => p!.title).join(' vs ');
    const getScore = (propId: string) => {
      const scores = DIMENSION_SCORES[propId];
      if (!scores) return 0;
      const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
      return Math.round(weights.reduce((sum, dim) => sum + (scores[dim.key] || 0) * dim.weight, 0) / totalWeight);
    };
    let winnerName = '';
    let winnerScore = 0;
    if (currentProps.length >= 2) {
      let bestId = currentProps[0]!.id;
      let bestScore = getScore(currentProps[0]!.id);
      currentProps.forEach((p) => {
        const score = getScore(p!.id);
        if (score > bestScore) { bestScore = score; bestId = p!.id; }
      });
      const winner = currentProps.find((p) => p!.id === bestId);
      if (winner) { winnerName = winner.title; winnerScore = bestScore; }
    }
    const timer = setTimeout(() => {
      setCompareAILoading(false);
      setCompareAIMessages([{
        role: 'ai',
        text: `I've analyzed your comparison of **${propNames}**.${winnerName ? `\n\n**${winnerName}** leads with a weighted score of ${winnerScore}/100.` : ''}\n\nI can help you with:\n• Deeper risk analysis\n• Negotiation strategy for the winner\n• Tax implications by jurisdiction\n• Exit strategy recommendations\n\nWhat would you like to explore?`,
      }]);
    }, 1400);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCompareAI]);

  const selectedProperties = selectedIds.map((id) => pool.find((p) => p.id === id)).filter(Boolean);
  const availableProperties = pool.filter((p) => !selectedIds.includes(p.id));

  // ── Deterministic per-property score derivation for real backend listings.
  //    Maps property attributes onto the 5 weighted dimensions so the radar
  //    chart, score breakdown, and weighted total all render with non-zero
  //    bars even when the static DIMENSION_SCORES map has no entry.
  function _hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }
  function deriveDims(p: Property): Record<string, number> {
    if (DIMENSION_SCORES[p.id]) return DIMENSION_SCORES[p.id];
    const yieldPct = typeof p.rentalYield === 'number' ? p.rentalYield : 4;
    const apprPct = typeof p.capitalAppreciation === 'number' ? p.capitalAppreciation : 6;
    const ai = typeof p.aiScore === 'number' ? p.aiScore : 70;
    const riskBoost = p.riskScore === 'low' ? 12 : p.riskScore === 'high' ? -12 : 0;
    const noise = (_hash(p.id) % 11) - 5;
    return {
      roi: Math.max(40, Math.min(98, Math.round(yieldPct * 8 + apprPct * 4 + noise))),
      risk: Math.max(40, Math.min(98, Math.round(60 + riskBoost + (ai - 70) / 2 + noise))),
      growth: Math.max(40, Math.min(98, Math.round(apprPct * 7 + noise))),
      liquidity: Math.max(40, Math.min(95, Math.round(ai * 0.8 + noise))),
      location: Math.max(40, Math.min(98, Math.round(ai * 0.95 + noise))),
    };
  }
  function deriveVerdict(p: Property): { verdict: string; rating: string; color: string; reasoning: string[] } {
    if (AI_VERDICTS_STATIC[p.id]) return AI_VERDICTS_STATIC[p.id];
    const ai = typeof p.aiScore === 'number' ? p.aiScore : 70;
    const rating = ai >= 90 ? 'A+' : ai >= 80 ? 'A' : ai >= 70 ? 'B+' : ai >= 60 ? 'B' : 'C';
    const verdict = ai >= 85 ? 'Strong Buy' : ai >= 75 ? 'Buy' : ai >= 65 ? 'Hold / Watch' : 'Speculative';
    const color = ai >= 80 ? '#22C55E' : ai >= 65 ? '#F59E0B' : '#EF4444';
    const reasoning: string[] = [];
    if (typeof p.rentalYield === 'number')
      reasoning.push(`Rental yield of ${p.rentalYield}% — ${p.rentalYield >= 5 ? 'top quartile' : 'in line with the market'}.`);
    if (typeof p.capitalAppreciation === 'number')
      reasoning.push(`${p.capitalAppreciation}% expected capital appreciation supports medium-term thesis.`);
    if (p.location?.neighborhood)
      reasoning.push(`Located in ${p.location.neighborhood}, ${p.location.city} — established sub-market.`);
    if (p.area?.value)
      reasoning.push(`Carpet area ~${p.area.value.toLocaleString()} ${p.area.unit ?? 'sqft'}; sized for the headline configuration.`);
    if (reasoning.length === 0) reasoning.push('Composite AI score derived from price, yield and locality.');
    return { verdict, rating, color, reasoning };
  }
  function deriveDownside(p: Property): { scenario: string; drawdown: string; recovery: string; mitigation: string } {
    if (DOWNSIDE[p.id]) return DOWNSIDE[p.id];
    const risk = p.riskScore ?? 'medium';
    const dd = risk === 'low' ? '-8 to -12%' : risk === 'high' ? '-18 to -28%' : '-12 to -18%';
    const rec = risk === 'low' ? '12-18 months' : risk === 'high' ? '24-36 months' : '18-24 months';
    return {
      scenario: `Local market correction in ${p.location?.city ?? 'the city'} or interest-rate shock.`,
      drawdown: dd,
      recovery: rec,
      mitigation: `Established locality (${p.location?.neighborhood ?? p.location?.city ?? 'core area'}) limits permanent capital loss.`,
    };
  }

  const addProperty = (id: string) => {
    if (selectedIds.length < 5) {
      setSelectedIds([...selectedIds, id]);
      setShowSelector(false);
    }
  };

  const removeProperty = (id: string) => {
    if (selectedIds.length > 1) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    }
  };

  const getMetricValue = (property: Property, key: string): number => {
    const parts = key.split('.');
    let val: unknown = property;
    for (const part of parts) {
      val = (val as Record<string, unknown>)?.[part];
    }
    return (typeof val === 'number' ? val : 0);
  };

  const findWinner = (metric: ComparisonMetric): string | null => {
    if (selectedProperties.length < 2) return null;
    let winnerId = selectedProperties[0]!.id;
    let bestVal = getMetricValue(selectedProperties[0]!, metric.key);
    for (const p of selectedProperties.slice(1)) {
      const val = getMetricValue(p!, metric.key);
      if (metric.higherIsBetter ? val > bestVal : val < bestVal) {
        bestVal = val;
        winnerId = p!.id;
      }
    }
    return winnerId;
  };

  /* Weighted score */
  const getWeightedScore = (propertyId: string): number => {
    const prop = pool.find((p) => p.id === propertyId);
    if (!prop) return 0;
    const scores = deriveDims(prop);
    const totalWeight = weights.reduce((s, w) => s + w.weight, 0);
    return Math.round(weights.reduce((sum, dim) => sum + (scores[dim.key] || 0) * dim.weight, 0) / totalWeight);
  };

  const updateWeight = (key: string, value: number) => {
    setWeights((prev) => prev.map((w) => w.key === key ? { ...w, weight: value } : w));
  };

  /* Projections */
  const projections = useMemo(() => {
    return selectedProperties.map((p) => ({
      id: p!.id,
      title: p!.title,
      data: generateProjection(p!.price?.amount ?? 0, p!.capitalAppreciation ?? 6, p!.rentalYield ?? 4),
    }));
  }, [selectedProperties]);

  const horizonIndex = projectionHorizon === '1Y' ? 1 : projectionHorizon === '3Y' ? 3 : 5;

  /* Radar chart data */
  const radarData = useMemo(() => {
    return weights.map((dim) => {
      const entry: Record<string, string | number> = { dimension: dim.label };
      selectedProperties.forEach((p) => {
        entry[p!.id] = deriveDims(p!)[dim.key] || 0;
      });
      return entry;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProperties, weights]);

  /* Overall winner */
  const overallWinner = useMemo(() => {
    if (selectedProperties.length < 2) return null;
    let bestId = selectedProperties[0]!.id;
    let bestScore = getWeightedScore(selectedProperties[0]!.id);
    selectedProperties.forEach((p) => {
      const score = getWeightedScore(p!.id);
      if (score > bestScore) { bestScore = score; bestId = p!.id; }
    });
    return bestId;
  }, [selectedProperties, weights]);

  const categories = [...new Set(METRICS.map((m) => m.category))];

  /* ── AI compare adapter ──
   * Maps the page's mock Property shape into the backend RecommendationProperty
   * shape and calls POST /recommendation/compare. Falls back to a clear error
   * message in the chat when the API is unreachable.
   */
  const buildAIPayload = (): RecommendationProperty[] =>
    selectedProperties.map((p) => ({
      id: p!.id,
      title: p!.title,
      city: p!.location.city,
      state: p!.location.state ?? null,
      locality_text: p!.location.neighborhood ?? null,
      bedrooms: p!.bedrooms ?? null,
      bathrooms: p!.bathrooms ?? null,
      area_sqft: p!.area?.value ?? null,
      price_inr: p!.price?.amount ?? null,
      price_per_sqft:
        p!.area?.value && p!.price?.amount
          ? Math.round(p!.price.amount / p!.area.value)
          : null,
      description: p!.description ?? null,
      project_name: null,
      builder_name: p!.developer ?? null,
      listing_url: null,
    }));

  const renderAIResponseAsText = (body: RecommendationResponseBody): string => {
    const lines: string[] = [];
    lines.push(`**Final recommendation**\n${body.final_recommendation}`);
    lines.push(`\n**Comparison summary**\n${body.comparison_summary}`);
    lines.push('\n**Ranked**');
    body.ranked_properties.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.title} — ${r.score}/10`);
      if (r.reason) lines.push(`   • ${r.reason}`);
      if (r.pros?.length) lines.push(`   ✓ ${r.pros.slice(0, 2).join(' / ')}`);
      if (r.cons?.length) lines.push(`   ✗ ${r.cons.slice(0, 2).join(' / ')}`);
    });
    if (body.tradeoffs?.length) {
      lines.push('\n**Tradeoffs**');
      body.tradeoffs.forEach((t) => lines.push(`• ${t}`));
    }
    if (body.risks?.length) {
      lines.push('\n**Risks**');
      body.risks.forEach((t) => lines.push(`• ${t}`));
    }
    lines.push(`\n_Source: ${body.source === 'gemini' ? 'Gemini AI' : 'Deterministic offline'}_`);
    return lines.join('\n');
  };

  /* Fire the structured AI compare. Populates `aiResult` for the verdict
   * panel AND echoes a transcript line in the chat modal. Uses Gemini
   * (free tier, gemini-2.5-flash) via POST /recommendation/compare. */
  const runAiVerdict = async (userText: string) => {
    if (selectedProperties.length < 2) {
      setAiError('Select at least 2 properties to compare.');
      return null;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const body = await aiCompareProperties({
        user_query: userText,
        properties: buildAIPayload(),
        top_n: selectedProperties.length,
      });
      setAiResult(body);
      return body;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setAiError(
        `Could not reach the AI service: ${msg}. ` +
        `Backend should be on ${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}.`
      );
      setAiResult(null);
      return null;
    } finally {
      setAiLoading(false);
    }
  };

  const askCompareAI = async (userText: string) => {
    if (selectedProperties.length < 2) {
      setCompareAIMessages((prev) => [
        ...prev,
        { role: 'ai', text: 'Please select at least 2 properties to compare.' },
      ]);
      return;
    }
    setCompareAIMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setCompareAITyping(true);
    try {
      const body = await runAiVerdict(userText);
      if (body) {
        setCompareAIMessages((prev) => [
          ...prev,
          { role: 'ai', text: renderAIResponseAsText(body) },
        ]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setCompareAIMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          text:
            `I couldn't reach the recommendation service. ${msg}\n\n` +
            `Make sure the backend is running on ${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}.`,
        },
      ]);
    } finally {
      setCompareAITyping(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="cmp-page"
    >
      {/* ── Hero Header ── */}
      <div className="ai-deal-hero cmp-hero">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8B7355] to-[#8B7355] flex items-center justify-center shadow-md shadow-[rgba(139,115,85,0.20)] shrink-0">
              <Scale className="h-[18px] w-[18px] text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[20px] font-semibold text-[var(--fg)] tracking-tight leading-tight">Deal Comparison Engine</h1>
              <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1.5 mt-1.5">
                <Brain className="h-3 w-3 text-[#8B7355]" />
                AI-powered side-by-side analysis with weighted scoring and projections
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:ml-auto shrink-0">
            <button
              onClick={() => setShowWeights(!showWeights)}
              className="ai-deal-cta"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {showWeights ? 'Hide Weights' : 'Adjust Weights'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Weight Adjustment Panel ── */}
      <AnimatePresence>
        {showWeights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="cmp-weights-panel">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="h-4 w-4 text-[#8B7355]" />
                <span className="text-sm font-bold text-[var(--fg)]">Weighted Comparison</span>
                <span className="text-[10px] text-[var(--fg-muted)] ml-1">Adjust importance of each factor</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {weights.map((dim) => (
                  <div key={dim.key} className="cmp-weight-slider">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-[var(--fg-secondary)]">{dim.label}</span>
                        {dim.tooltip && (
                          <div className="relative group/tip flex-shrink-0">
                            <Info className="h-3 w-3 text-[var(--fg-muted)] opacity-50 hover:opacity-100 cursor-default transition-opacity" />
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--fg-secondary)] shadow-lg opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
                              {dim.tooltip}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#8B7355]">{dim.weight}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={dim.weight}
                      onChange={(e) => updateWeight(dim.key, Number(e.target.value))}
                      className="cmp-range-input"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Property Selection Headers ── */}
      <div
        className="cmp-property-grid"
        style={{ gridTemplateColumns: `repeat(${selectedProperties.length + (selectedIds.length < 5 ? 1 : 0)}, minmax(0, 1fr))` }}
      >
        {selectedProperties.map((property, i) => {
          const propColor = PROPERTY_COLORS[i];
          const score = getWeightedScore(property!.id);
          const isWinner = overallWinner === property!.id && selectedProperties.length >= 2;
          const verdict = deriveVerdict(property!);

          return (
            <motion.div
              key={property!.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`cmp-col-header ${isWinner ? 'winner' : ''}`}
              style={{ '--cmp-accent': propColor } as React.CSSProperties}
            >
              {selectedProperties.length > 1 && (
                <button onClick={() => removeProperty(property!.id)} className="cmp-col-remove">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <div className="cmp-col-image">
                <img
                  src={property!.images?.[0] || '/images/property-placeholder.jpg'}
                  alt={property!.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'; }}
                />
                {isWinner && (
                  <div className="absolute top-2 left-2 cmp-winner-badge">
                    <Trophy className="h-3 w-3" /> Best Match
                  </div>
                )}
              </div>

              <div className="cmp-col-title">
                <h3 className="text-sm font-semibold text-[var(--fg)] leading-snug line-clamp-2">{property!.title}</h3>
                <p className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1 justify-center mt-1.5">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{property!.location?.city}, {property!.location?.country}</span>
                </p>
              </div>

              <div className="cmp-col-score">
                <ConfidenceMeter score={property!.aiScore} size={44} strokeWidth={4} />
                <div className="text-left">
                  <p className="text-[14px] font-semibold text-[var(--fg)] leading-none">{score}</p>
                  <p className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)] mt-1">Weighted</p>
                </div>
              </div>

              <div className="cmp-col-verdict">
                {verdict && (
                  <div className="px-3 py-1 rounded-lg inline-flex items-center gap-1" style={{ background: `${verdict.color}12`, color: verdict.color }}>
                    <span className="text-[10px] font-bold">{verdict.rating}</span>
                    <span className="text-[10px] font-semibold">{verdict.verdict}</span>
                  </div>
                )}
              </div>

              <p className="cmp-col-price">{formatCurrency(property!.price?.amount ?? 0)}</p>
            </motion.div>
          );
        })}

        {/* Add property */}
        {selectedIds.length < 5 && (
          <div className="relative cmp-add-wrap">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowSelector(!showSelector)}
              className="cmp-add-btn"
            >
              <div className="cmp-add-icon">
                <Plus className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold mt-1">Add Property</span>
              <span className="text-[11px] text-[var(--fg-muted)]">Up to {4 - selectedIds.length} more</span>
            </motion.button>

            <AnimatePresence>
              {showSelector && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="cmp-property-dropdown"
                >
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--fg-muted)]">Select a property</p>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto">
                    {availableProperties.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => addProperty(p.id)}
                        className="cmp-property-option"
                      >
                        <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=80&h=80&fit=crop&q=60'}
                            alt={p.title}
                            className="h-full w-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=80&h=80&fit=crop&q=60'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[var(--fg)] truncate">{p.title}</p>
                          <p className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {p.location.city}, {p.location.country}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-[#8B7355]">{p.aiScore}</p>
                          <p className="text-[9px] text-[var(--fg-muted)]">AI Score</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Comparison Content ── */}
      {selectedProperties.length >= 2 && (
        <div className="space-y-5">

          {/* ── Radar Chart + Score Breakdown ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Radar chart */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="ex-glass p-5 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-[#8B7355]" />
                <h3 className="text-sm font-semibold text-[var(--fg)]">Multi-Dimensional Comparison</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="rgba(139,115,85,0.12)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  {selectedProperties.map((p, i) => (
                    <Radar
                      key={p!.id}
                      name={p!.title}
                      dataKey={p!.id}
                      stroke={PROPERTY_COLORS[i]}
                      fill={PROPERTY_COLORS[i]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="cmp-tooltip">
                          <p className="cmp-tooltip-label">{label}</p>
                          <div className="cmp-tooltip-items">
                            {payload.map((entry: any, idx: number) => (
                              <div key={idx} className="cmp-tooltip-row">
                                <span className="cmp-tooltip-dot" style={{ background: entry.color }} />
                                <span className="cmp-tooltip-name">{entry.name}</span>
                                <span className="cmp-tooltip-value">{entry.value}/100</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                {selectedProperties.map((p, i) => (
                  <div key={p!.id} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: PROPERTY_COLORS[i] }} />
                    <span className="text-[10px] text-[var(--fg-secondary)]">{p!.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Score breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="ex-glass p-5 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-[#FFD700]" />
                <h3 className="text-sm font-semibold text-[var(--fg)]">Weighted Score Breakdown</h3>
              </div>
              <div className="space-y-4">
                {weights.map((dim) => (
                  <div key={dim.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-[var(--fg-secondary)]">{dim.label}</span>
                        {dim.tooltip && (
                          <div className="relative group/tip flex-shrink-0">
                            <Info className="h-3 w-3 text-[var(--fg-muted)] opacity-50 hover:opacity-100 cursor-default transition-opacity" />
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--fg-secondary)] shadow-lg opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
                              {dim.tooltip}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--fg-muted)]">Weight: {dim.weight}%</span>
                    </div>
                    <div className="flex gap-2">
                      {selectedProperties.map((p, i) => {
                        const score = deriveDims(p!)[dim.key] || 0;
                        const allScores = selectedProperties.map((sp) => deriveDims(sp!)[dim.key] || 0);
                        const maxScore = Math.max(...allScores);
                        const isMax = score === maxScore;
                        return (
                          <div key={p!.id} className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`text-xs font-bold ${isMax ? 'text-[#B8956A]' : 'text-[var(--fg)]'}`}>
                                {score}
                              </span>
                              {isMax && <Check className="h-2.5 w-2.5 text-[#B8956A]" />}
                            </div>
                            <div className="cmp-metric-bar">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${score}%` }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="cmp-metric-fill"
                                style={{ background: isMax ? '#B8956A' : PROPERTY_COLORS[i] }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {/* Total weighted */}
                <div className="pt-3 border-t border-[rgba(139,115,85,0.08)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[var(--fg)]">Weighted Total</span>
                  </div>
                  <div
                    className="cmp-weighted-grid"
                    style={{ ['--cmp-cols' as string]: selectedProperties.length } as React.CSSProperties}
                  >
                    {selectedProperties.map((p) => {
                      const score = getWeightedScore(p!.id);
                      const isWinner = overallWinner === p!.id;
                      return (
                        <div
                          key={p!.id}
                          className={`min-w-0 h-full flex flex-col items-center justify-center text-center px-2.5 py-3 rounded-xl ${isWinner ? 'cmp-score-winner' : 'cmp-score-cell'}`}
                        >
                          <p className={`text-[15px] font-bold leading-tight ${isWinner ? 'text-[#22C55E]' : 'text-[var(--fg)]'}`}>{score}</p>
                          <p className="w-full text-[9px] uppercase tracking-wide text-[var(--fg-muted)] mt-1 truncate">{p!.title}</p>
                          {isWinner && (
                            <div className="flex items-center justify-center gap-1 mt-1.5">
                              <Trophy className="h-2.5 w-2.5 text-[#FFD700]" />
                              <span className="text-[9px] font-bold tracking-wide text-[#FFD700]">WINNER</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── AI VERDICT PANEL — Dynamic with animations ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="relative overflow-hidden rounded-2xl border border-[rgba(139,115,85,0.18)]"
            style={{ background: 'linear-gradient(135deg, rgba(139,115,85,0.07) 0%, rgba(139,115,85,0.02) 60%, rgba(139,115,85,0.05) 100%)' }}
          >
            {/* Ambient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,115,85,0.08) 0%, transparent 70%)' }} />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,115,85,0.06) 0%, transparent 70%)' }} />
            </div>

            <div className="relative z-10 p-5">
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-5">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#8B7355] to-[#6F5C46] flex items-center justify-center shrink-0 shadow-md"
                  style={{ boxShadow: '0 4px 12px rgba(139,115,85,0.3)' }}
                >
                  <Sparkles className="h-4 w-4 text-white" />
                </motion.div>
                <div>
                  <p className="text-[14px] font-bold text-[var(--fg)]">AI Verdict Panel</p>
                  <p className="text-[10px] text-[var(--fg-muted)]">Powered by Glimmora Intelligence</p>
                </div>
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className="ml-auto flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full bg-[rgba(139,115,85,0.10)] text-[#8B7355] border border-[rgba(139,115,85,0.18)] shrink-0"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8B7355] opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#8B7355]" />
                  </span>
                  Live Analysis
                </motion.span>
              </div>

              {/* Winner announcement banner */}
              {overallWinner && selectedProperties.find(p => p!.id === overallWinner) && (() => {
                const w = selectedProperties.find(p => p!.id === overallWinner)!;
                const winnerScore = getWeightedScore(overallWinner!);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: -16, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 150 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl mb-5 border border-[rgba(139,115,85,0.22)]"
                    style={{ background: 'linear-gradient(135deg, rgba(139,115,85,0.13) 0%, rgba(139,115,85,0.05) 100%)' }}
                  >
                    <motion.div
                      initial={{ rotate: -20, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ delay: 0.5, type: 'spring', stiffness: 280 }}
                    >
                      <Trophy className="h-5 w-5 text-[#C6A86B]" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#8B7355] mb-0.5">Top Recommendation</p>
                      <p className="text-[13px] font-bold text-[var(--fg)] truncate">{w.title}</p>
                      <p className="text-[10px] text-[var(--fg-muted)]">{w.location.city} · {w.rentalYield}% yield · {w.capitalAppreciation}% appreciation</p>
                    </div>
                    <div className="text-right shrink-0">
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.3 }}
                        className="text-[26px] font-black text-[#8B7355] leading-none"
                      >
                        {winnerScore}
                      </motion.p>
                      <p className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">/ 100</p>
                    </div>
                  </motion.div>
                );
              })()}

              {/* 5 badge cards with stagger */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
                {([
                  { label: 'Best Overall',  prop: selectedProperties.find(p => p!.id === overallWinner),                                                                                                                   Icon: Trophy,    color: '#8B7355',  bg: 'rgba(139,115,85,0.10)' },
                  { label: 'Best Yield',    prop: [...selectedProperties].sort((a,b) => (b!.rentalYield ?? 0) - (a!.rentalYield ?? 0))[0],                                                                                 Icon: TrendingUp, color: '#B8956A',  bg: 'rgba(184,149,106,0.12)' },
                  { label: 'Best Luxury',   prop: [...selectedProperties].sort((a,b) => (b!.price?.amount ?? 0) - (a!.price?.amount ?? 0))[0],                                                                             Icon: Star,       color: '#C6A86B',  bg: 'rgba(198,168,107,0.12)' },
                  { label: 'Best Value',    prop: [...selectedProperties].sort((a,b) => ((a!.price?.amount ?? 0)/(a!.area?.value || 1)) - ((b!.price?.amount ?? 0)/(b!.area?.value || 1)))[0],                             Icon: DollarSign, color: '#A89478',  bg: 'rgba(168,148,120,0.12)' },
                  { label: 'Lowest Risk',   prop: [...selectedProperties].sort((a,b) => (deriveDims(b!).risk||0) - (deriveDims(a!).risk||0))[0],                                                                           Icon: Shield,     color: '#7A6248',  bg: 'rgba(122,98,72,0.12)' },
                ] as const).map(({ label, prop, Icon, color, bg }, badgeIdx) => prop ? (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 18, scale: 0.88 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.12 + badgeIdx * 0.09, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    className="cmp-verdict-badge-card cursor-default"
                    style={{ borderColor: color + '30' }}
                  >
                    <div className="cmp-verdict-badge-icon" style={{ background: bg }}>
                      <Icon className="h-3.5 w-3.5" style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-semibold uppercase tracking-wide mb-0.5" style={{ color }}>{label}</p>
                      <p className="text-[12px] font-bold text-[var(--fg)] truncate">{prop.title}</p>
                      <p className="text-[10px] text-[var(--fg-muted)] truncate">{prop.location.city}</p>
                    </div>
                    {/* Mini confidence bar */}
                    <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(139,115,85,0.10)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${prop.aiScore ?? 70}%` }}
                        transition={{ duration: 0.9, delay: 0.35 + badgeIdx * 0.09, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ background: color }}
                      />
                    </div>
                  </motion.div>
                ) : null)}
              </div>

              {/* Dynamic summary */}
              {overallWinner && selectedProperties.find(p => p!.id === overallWinner) && (() => {
                const w = selectedProperties.find(p => p!.id === overallWinner)!;
                return (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.65 }}
                    className="text-[13px] leading-relaxed text-[var(--fg-secondary)] pl-3.5 border-l-2 border-[rgba(139,115,85,0.35)]"
                  >
                    {`${w.title} leads with a weighted score of ${getWeightedScore(overallWinner!)} — ${w.rentalYield}% rental yield, ${w.capitalAppreciation}% appreciation, and AI Score of ${w.aiScore}/100 make it the strongest all-round investment.`}
                  </motion.p>
                );
              })()}
            </div>
          </motion.div>

          {/* ── PREMIUM METRIC COMPARISON GRID ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="cmp-metrics-table">
              {/* Column headers */}
              <div className="cmp-metrics-header-row">
                <div className="cmp-metrics-label-col">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-muted)]">Metric</p>
                </div>
                <div className="cmp-metrics-value-cols">
                  {selectedProperties.map((p, i) => (
                    <div key={p!.id} className="cmp-metrics-col-head">
                      <span className="cmp-col-dot" style={{ background: PROPERTY_COLORS[i], boxShadow: `0 0 6px ${PROPERTY_COLORS[i]}40` }} />
                      <p className="cmp-col-name">{p!.title}</p>
                      {overallWinner === p!.id && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: 'spring' }}>
                          <Trophy className="h-3 w-3 text-[#C6A86B] shrink-0" />
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grouped metric rows */}
              {([
                {
                  category: 'Financial', categoryIcon: DollarSign, categoryColor: '#8B7355',
                  rows: [
                    { label: 'Price',        Icon: DollarSign, getValue: (p: typeof selectedProperties[0]) => p!.price?.amount ?? 0,                                                          format: (v: number) => formatCurrency(v),        higherIsBetter: false, barMax: null as null | number },
                    { label: 'Price / sqft', Icon: Target,     getValue: (p: typeof selectedProperties[0]) => p!.area?.value ? Math.round((p!.price?.amount ?? 0) / p!.area.value) : 0,      format: (v: number) => `₹${v.toLocaleString('en-IN')}`,  higherIsBetter: false, barMax: null as null | number },
                  ],
                },
                {
                  category: 'Returns', categoryIcon: TrendingUp, categoryColor: '#A89478',
                  rows: [
                    { label: 'Rental Yield', Icon: TrendingUp, getValue: (p: typeof selectedProperties[0]) => p!.rentalYield ?? 0,                   format: (v: number) => `${v}%`,         higherIsBetter: true, barMax: 10 as null | number },
                    { label: 'Appreciation', Icon: BarChart3,  getValue: (p: typeof selectedProperties[0]) => p!.capitalAppreciation ?? 0,           format: (v: number) => `${v}%`,         higherIsBetter: true, barMax: 15 as null | number },
                  ],
                },
                {
                  category: 'AI Analysis', categoryIcon: Brain, categoryColor: '#6F5C46',
                  rows: [
                    { label: 'AI Score',     Icon: Brain,      getValue: (p: typeof selectedProperties[0]) => p!.aiScore ?? 0,                       format: (v: number) => `${v}/100`,      higherIsBetter: true, barMax: 100 as null | number },
                    { label: 'ROI Score',    Icon: Percent,    getValue: (p: typeof selectedProperties[0]) => deriveDims(p!).roi || 0,               format: (v: number) => `${v}`,          higherIsBetter: true, barMax: 100 as null | number },
                    { label: 'Risk Score',   Icon: Shield,     getValue: (p: typeof selectedProperties[0]) => deriveDims(p!).risk || 0,              format: (v: number) => `${v}`,          higherIsBetter: true, barMax: 100 as null | number },
                    { label: 'Growth Score', Icon: Activity,   getValue: (p: typeof selectedProperties[0]) => deriveDims(p!).growth || 0,            format: (v: number) => `${v}`,          higherIsBetter: true, barMax: 100 as null | number },
                  ],
                },
                {
                  category: 'Property', categoryIcon: Building2, categoryColor: '#8B7355',
                  rows: [
                    { label: 'Bedrooms',     Icon: Building2,  getValue: (p: typeof selectedProperties[0]) => p!.bedrooms || 0,                      format: (v: number) => `${v} BR`,       higherIsBetter: true, barMax: null as null | number },
                    { label: 'Area (sqft)',  Icon: Globe,      getValue: (p: typeof selectedProperties[0]) => p!.area?.value ?? 0,                   format: (v: number) => `${v.toLocaleString()}`, higherIsBetter: true, barMax: null as null | number },
                  ],
                },
              ]).map((group, groupIdx) => (
                <div key={group.category}>
                  {/* Category header row */}
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + groupIdx * 0.07 }}
                    className="cmp-metric-category-row"
                    style={{ background: `linear-gradient(90deg, ${group.categoryColor}0D 0%, transparent 60%)` }}
                  >
                    <group.categoryIcon className="h-3 w-3 shrink-0" style={{ color: group.categoryColor }} />
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: group.categoryColor }}>{group.category}</span>
                    <div className="flex-1 h-px ml-1" style={{ background: `${group.categoryColor}25` }} />
                  </motion.div>

                  {/* Rows within category */}
                  {group.rows.map((row, rowIdx) => {
                    const values = selectedProperties.map(p => row.getValue(p));
                    const winnerVal = row.higherIsBetter ? Math.max(...values) : Math.min(...values);
                    const maxVal = Math.max(...values);
                    const sortedVals = [...values].sort((a, b) => row.higherIsBetter ? b - a : a - b);
                    const delta = sortedVals.length >= 2 && sortedVals[0] !== 0
                      ? Math.abs(((sortedVals[0] - sortedVals[1]) / (sortedVals[0] || 1)) * 100).toFixed(1)
                      : null;
                    const globalRowIdx = groupIdx * 10 + rowIdx;
                    return (
                      <motion.div
                        key={row.label}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.18 + globalRowIdx * 0.04 }}
                        className="cmp-metric-data-row group/row"
                      >
                        <div className="cmp-metrics-label-col">
                          <row.Icon className="h-3.5 w-3.5 shrink-0" style={{ color: group.categoryColor, opacity: 0.7 }} />
                          <span className="text-[11px] text-[var(--fg-secondary)] whitespace-nowrap">{row.label}</span>
                          {delta && Number(delta) > 5 && (
                            <span
                              className="ml-auto text-[8px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                              style={{ background: `${group.categoryColor}12`, color: group.categoryColor }}
                            >
                              &Delta;{delta}%
                            </span>
                          )}
                        </div>
                        <div className="cmp-metrics-value-cols">
                          {selectedProperties.map((p) => {
                            const val = row.getValue(p);
                            const isWinner = val === winnerVal;
                            return (
                              <div key={p!.id} className={`cmp-metric-value-cell ${isWinner ? 'winner' : ''}`}>
                                {isWinner && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4 + globalRowIdx * 0.03, type: 'spring', stiffness: 250 }}
                                    className="cmp-winner-crown-sm"
                                  >
                                    <Trophy className="h-2.5 w-2.5" />
                                  </motion.span>
                                )}
                                <span className="cmp-metric-display-value" style={isWinner ? { color: group.categoryColor } : undefined}>
                                  {row.format(val)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── CHARTS WITH TABS ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="ex-glass p-5 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[#8B7355]" />
                <h3 className="text-sm font-semibold text-[var(--fg)]">Performance Analysis</h3>
              </div>
              <div className="cmp-chart-tab-group">
                {(['radar', 'projection', 'score'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveChartTab(tab)}
                    className={`cmp-chart-tab-pill ${activeChartTab === tab ? 'active' : ''}`}
                  >
                    {tab === 'radar' ? 'Risk Radar' : tab === 'projection' ? 'Value Projection' : 'Score Breakdown'}
                  </button>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeChartTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {activeChartTab === 'radar' && (
                  <>
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                        <PolarGrid stroke="rgba(139,115,85,0.12)" />
                        <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: 'var(--fg-muted)' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                        {selectedProperties.map((p, i) => (
                          <Radar key={p!.id} name={p!.title} dataKey={p!.id} stroke={PROPERTY_COLORS[i]} fill={PROPERTY_COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
                        ))}
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="cmp-tooltip">
                                <p className="cmp-tooltip-label">{label}</p>
                                <div className="cmp-tooltip-items">
                                  {payload.map((entry: any, idx: number) => (
                                    <div key={idx} className="cmp-tooltip-row">
                                      <span className="cmp-tooltip-dot" style={{ background: entry.color }} />
                                      <span className="cmp-tooltip-name">{entry.name}</span>
                                      <span className="cmp-tooltip-value">{entry.value}/100</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
                      {selectedProperties.map((p, i) => (
                        <div key={p!.id} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-sm" style={{ background: PROPERTY_COLORS[i] }} />
                          <span className="text-[10px] text-[var(--fg-secondary)]">{p!.title}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeChartTab === 'projection' && (
                  <>
                    <div className="flex items-center justify-end mb-4">
                      <div className="cmp-horizon-group">
                        {(['1Y', '3Y', '5Y'] as const).map((h) => (
                          <button key={h} onClick={() => setProjectionHorizon(h)} className={`cmp-horizon-pill ${projectionHorizon === h ? 'active' : ''}`}>{h}</button>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,115,85,0.08)" />
                        <XAxis dataKey="year" allowDuplicatedCategory={false} tick={{ fontSize: 11, fill: 'var(--fg-muted)' }} stroke="transparent" />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--fg-muted)' }} stroke="transparent" tickFormatter={(v) => formatCurrency(v)} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            return (
                              <div className="cmp-tooltip">
                                <p className="cmp-tooltip-label">{label}</p>
                                <div className="cmp-tooltip-items">
                                  {payload.map((entry: any, idx: number) => (
                                    <div key={idx} className="cmp-tooltip-row">
                                      <span className="cmp-tooltip-dot" style={{ background: entry.color }} />
                                      <span className="cmp-tooltip-name">{entry.name}</span>
                                      <span className="cmp-tooltip-value">{formatCurrency(entry.value as number)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }}
                        />
                        {projections.map((proj, i) => {
                          const sliced = proj.data.slice(0, horizonIndex + 1);
                          return (
                            <Area key={proj.id} data={sliced} type="monotone" dataKey="value" name={proj.title} stroke={PROPERTY_COLORS[i]} fill={PROPERTY_COLORS[i]} fillOpacity={0.06} strokeWidth={2} dot={{ r: 4, fill: PROPERTY_COLORS[i], strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6, fill: PROPERTY_COLORS[i], strokeWidth: 2, stroke: 'white' }} />
                          );
                        })}
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="grid gap-3 mt-4" style={{ gridTemplateColumns: `repeat(${selectedProperties.length}, 1fr)` }}>
                      {projections.map((proj, i) => {
                        const endData = proj.data[horizonIndex];
                        const startValue = proj.data[0].value;
                        const gain = endData ? endData.value - startValue : 0;
                        const gainPct = startValue > 0 ? ((gain / startValue) * 100).toFixed(1) : '0';
                        const totalReturn = endData?.totalReturn || 0;
                        return (
                          <div key={proj.id} className="cmp-projection-card" style={{ '--cmp-accent': PROPERTY_COLORS[i] } as React.CSSProperties}>
                            <p className="text-[10px] font-medium text-[var(--fg-muted)] truncate">{proj.title}</p>
                            <p className="text-base font-bold text-[var(--fg)] mt-1">{endData ? formatCurrency(endData.value) : '-'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-semibold text-[#8B7355]">+{gainPct}%</span>
                              <span className="text-[10px] text-[var(--fg-muted)]">cap gain</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-semibold text-[#8B7355]">{formatCurrency(totalReturn)}</span>
                              <span className="text-[10px] text-[var(--fg-muted)]">total return</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {activeChartTab === 'score' && (
                  <div className="space-y-4">
                    {weights.map((dim) => (
                      <div key={dim.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-medium text-[var(--fg-secondary)]">{dim.label}</span>
                          <span className="text-[10px] text-[var(--fg-muted)]">Weight: {dim.weight}%</span>
                        </div>
                        <div className="flex gap-2">
                          {selectedProperties.map((p, i) => {
                            const score = deriveDims(p!)[dim.key] || 0;
                            const allScores = selectedProperties.map((sp) => deriveDims(sp!)[dim.key] || 0);
                            const maxScore = Math.max(...allScores);
                            const isMax = score === maxScore;
                            return (
                              <div key={p!.id} className="flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className={`text-xs font-bold ${isMax ? 'text-[#8B7355]' : 'text-[var(--fg)]'}`}>{score}</span>
                                  {isMax && <Check className="h-2.5 w-2.5 text-[#8B7355]" />}
                                </div>
                                <div className="cmp-metric-bar">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 0.6, delay: 0.1 }} className="cmp-metric-fill" style={{ background: isMax ? '#8B7355' : PROPERTY_COLORS[i] }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-[rgba(139,115,85,0.08)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[var(--fg)]">Weighted Total</span>
                      </div>
                      <div
                        className="cmp-weighted-grid"
                        style={{ ['--cmp-cols' as string]: selectedProperties.length } as React.CSSProperties}
                      >
                        {selectedProperties.map((p) => {
                          const score = getWeightedScore(p!.id);
                          const isWinner = overallWinner === p!.id;
                          return (
                            <div
                              key={p!.id}
                              className={`min-w-0 h-full flex flex-col items-center justify-center text-center px-2.5 py-3 rounded-xl ${isWinner ? 'cmp-score-winner' : 'cmp-score-cell'}`}
                            >
                              <p className={`text-[15px] font-bold leading-tight ${isWinner ? 'text-primary-600' : 'text-[var(--fg)]'}`}>{score}</p>
                              <p className="w-full text-[9px] uppercase tracking-wide text-[var(--fg-muted)] mt-1 truncate">{p!.title}</p>
                              {isWinner && (
                                <div className="flex items-center justify-center gap-1 mt-1.5">
                                  <Trophy className="h-2.5 w-2.5 text-primary-600" />
                                  <span className="text-[9px] font-bold uppercase tracking-wide text-primary-600">Winner</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ── AI INVESTMENT VERDICT CARDS ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="ex-glass p-5 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-4 w-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-[var(--fg)]">AI Investment Verdict</h3>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedProperties.length}, 1fr)` }}>
              {selectedProperties.map((property, i) => {
                const verdict = deriveVerdict(property!);
                const isWinner = overallWinner === property!.id;
                if (!verdict) return null;
                return (
                  <div key={property!.id} className={`cmp-verdict-card ${isWinner ? 'winner' : ''}`} style={{ '--cmp-accent': PROPERTY_COLORS[i] } as React.CSSProperties}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: `${verdict.color}15`, color: verdict.color }}>
                          {verdict.rating}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--fg)]">{property!.title}</p>
                          <p className="text-[10px] font-semibold" style={{ color: verdict.color }}>{verdict.verdict}</p>
                        </div>
                      </div>
                      {isWinner && <Trophy className="h-4 w-4 text-primary-600" />}
                    </div>
                    <ul className="space-y-1.5">
                      {verdict.reasoning.map((r, ri) => (
                        <li key={ri} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5" style={{ color: verdict.color }} />
                          <span className="text-[11px] text-[var(--fg-secondary)] leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ── DEAL INTELLIGENCE ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="ex-glass p-5 overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-[#8B7355]" />
              <h3 className="text-sm font-semibold text-[var(--fg)]">Deal Intelligence</h3>
              <span className="ml-auto text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[rgba(139,115,85,0.10)] text-[#8B7355] border border-[rgba(139,115,85,0.15)]">AI Powered</span>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedProperties.length}, 1fr)` }}>
              {selectedProperties.map((p, i) => {
                const verdict = deriveVerdict(p!);
                const askingPrice = p!.price?.amount ?? 0;
                const fairValue = verdict?.rating === 'A+' || verdict?.rating === 'A'
                  ? Math.round(askingPrice * 1.05)
                  : verdict?.rating === 'B-'
                  ? Math.round(askingPrice * 0.88)
                  : Math.round(askingPrice * 0.96);
                const negRoom = fairValue < askingPrice
                  ? `${Math.round(((askingPrice - fairValue) / askingPrice) * 100)}%`
                  : '2–5%';
                const isWinner = overallWinner === p!.id;
                return (
                  <div key={p!.id} className="cmp-intelligence-card" style={{ '--cmp-accent': PROPERTY_COLORS[i] } as React.CSSProperties}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PROPERTY_COLORS[i] }} />
                      <p className="text-[11px] font-bold text-[var(--fg)] truncate">{p!.title}</p>
                      {isWinner && <Trophy className="h-3 w-3 text-[#8B7355] shrink-0" />}
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Asking Price</p>
                        <p className="text-sm font-bold text-[var(--fg)] mt-0.5">{formatCurrency(askingPrice)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">AI Fair Value</p>
                        <p className={`text-sm font-bold mt-0.5 ${fairValue >= askingPrice ? 'text-[#22C55E]' : 'text-[#F59E0B]'}`}>{formatCurrency(fairValue)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">Negotiation Room</p>
                        <p className="text-sm font-bold text-[#8B7355] mt-0.5">{negRoom}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">AI Confidence</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${p!.aiScore}%` }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-[#8B7355]" />
                          </div>
                          <span className="text-[10px] font-bold text-[#8B7355]">{p!.aiScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Downside Analysis ── */}
          <AnimatePresence>
            {showDownside && (
              <motion.div
                initial={{ height: 0, opacity: 0, scale: 0.97 }}
                animate={{ height: 'auto', opacity: 1, scale: 1 }}
                exit={{ height: 0, opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="ex-glass p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <motion.div initial={{ rotate: -90 }} animate={{ rotate: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
                        <AlertTriangle className="h-4 w-4 text-[#F59E0B]" />
                      </motion.div>
                      <h3 className="text-sm font-semibold text-[var(--fg)]">Downside & Risk Exposure</h3>
                    </div>
                    <button onClick={() => setShowDownside(false)} className="p-1 rounded-md hover:bg-[rgba(239,68,68,0.08)] text-[var(--fg-muted)] hover:text-[#EF4444] transition-colors cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selectedProperties.length}, 1fr)` }}>
                    {selectedProperties.map((property, i) => {
                      const ds = deriveDownside(property!);
                      if (!ds) return null;
                      return (
                        <motion.div key={property!.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }} className="cmp-downside-card" style={{ '--cmp-accent': PROPERTY_COLORS[i] } as React.CSSProperties}>
                          <p className="text-xs font-bold text-[var(--fg)] mb-3">{property!.title}</p>
                          <div className="space-y-2.5">
                            <div><span className="text-[9px] font-bold uppercase tracking-wide text-[var(--fg-muted)]">Worst Case</span><p className="text-[11px] text-[var(--fg-secondary)] mt-0.5">{ds.scenario}</p></div>
                            <div className="flex gap-3">
                              <div><span className="text-[9px] font-bold uppercase tracking-wide text-[var(--fg-muted)]">Drawdown</span><p className="text-sm font-bold text-[#EF4444] mt-0.5">{ds.drawdown}</p></div>
                              <div><span className="text-[9px] font-bold uppercase tracking-wide text-[var(--fg-muted)]">Recovery</span><p className="text-sm font-bold text-[#F59E0B] mt-0.5">{ds.recovery}</p></div>
                            </div>
                            <div><span className="text-[9px] font-bold uppercase tracking-wide text-[var(--fg-muted)]">Mitigation</span><p className="text-[11px] text-[#8B7355] mt-0.5">{ds.mitigation}</p></div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {!poolReady && (
        <div className="cmp-empty-state">
          <div className="cmp-empty-icon">
            <Scale className="h-8 w-8 text-[#8B7355]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--fg)] mt-5 mb-2">Loading listings…</h3>
          <p className="text-sm text-[var(--fg-muted)] max-w-md mx-auto">
            Fetching properties from the backend.
          </p>
        </div>
      )}
      {poolReady && loadError && backendProps.length === 0 && (
        <div className="cmp-empty-state">
          <div className="cmp-empty-icon">
            <AlertTriangle className="h-8 w-8 text-[#F59E0B]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--fg)] mt-5 mb-2">Backend unreachable — using sample data</h3>
          <p className="text-sm text-[var(--fg-muted)] max-w-md mx-auto">{loadError}</p>
        </div>
      )}
      {poolReady && selectedProperties.length < 2 && (
        <div className="cmp-empty-state">
          <div className="cmp-empty-icon">
            <Scale className="h-8 w-8 text-[#8B7355]" />
          </div>
          <h3 className="text-[15px] font-semibold text-[var(--fg)] mt-5 mb-2">Select at least 2 properties to compare</h3>
          <p className="text-sm text-[var(--fg-muted)] max-w-md mx-auto">
            Add properties above to begin AI-powered comparison analysis with weighted scoring, projections, and risk assessment.
          </p>
          <div className="flex items-center gap-4 mt-6 justify-center">
            {[
              { icon: Target, label: 'Multi-dimensional scoring' },
              { icon: TrendingUp, label: '5-year projections' },
              { icon: Shield, label: 'Risk assessment' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] text-[var(--fg-muted)]">
                <Icon className="h-3 w-3 text-[#8B7355]" />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Verdict Panel — calls Gemini (free tier) and renders the
              structured comparison directly on the page. */}
      {selectedProperties.length >= 2 && (
        <div className="ex-glass p-5 mt-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-[#C6A86B]" />
                <span className="text-sm font-semibold text-[var(--fg)]">AI Verdict</span>
                {aiResult && (
                  <span
                    className="ml-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{
                      background: aiResult.source === 'gemini' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                      color:      aiResult.source === 'gemini' ? '#22C55E' : '#F59E0B',
                    }}
                    title={aiResult.source_detail || ''}
                  >
                    {aiResult.source === 'gemini'
                      ? 'Powered by Gemini'
                      : `Offline · ${aiResult.source_detail || 'AI unavailable'}`}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--fg-muted)]">
                Comparison powered by Gemini 2.5 Flash. Add an optional query (budget / goals) for sharper reasoning.
              </p>
            </div>
            <button
              onClick={() => {
                completeStep(4);
                void runAiVerdict(aiUserQuery.trim() || `Compare these ${selectedProperties.length} properties and recommend the best one with reasoning.`);
              }}
              disabled={aiLoading}
              className="cmp-ask-ai-btn shrink-0"
            >
              <Brain size={16} />
              {aiLoading ? 'Analyzing…' : (aiResult ? 'Re-run AI' : 'Compare with AI')}
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={aiUserQuery}
              onChange={(e) => setAiUserQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !aiLoading) {
                  void runAiVerdict(aiUserQuery.trim() || `Compare these ${selectedProperties.length} properties and recommend the best one with reasoning.`);
                }
              }}
              placeholder="Optional: e.g. ‘best ROI under 2 Cr’ or ‘low-risk family home’"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--fg)] placeholder-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(139,115,85,0.35)]"
            />
          </div>

          {aiError && (
            <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-[12px] text-red-700 dark:text-red-300 mb-3">
              {aiError}
            </div>
          )}

          {!aiResult && !aiLoading && !aiError && (
            <p className="text-[12px] text-[var(--fg-muted)] italic">
              Click <strong>Compare with AI</strong> above to get a Gemini-powered verdict — ranking, pros/cons per property, comparison summary, and recommendation with reasoning.
            </p>
          )}

          {aiLoading && (
            <p className="text-[12px] text-[var(--fg-muted)] italic">
              Sending {selectedProperties.length} properties to Gemini for analysis…
            </p>
          )}

          {aiResult && (
            <div className="space-y-4">
              {/* Final recommendation */}
              <div className="rounded-2xl bg-gradient-to-br from-[rgba(139,115,85,0.08)] to-[rgba(34,197,94,0.05)] p-4 border border-[rgba(139,115,85,0.15)]">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-[#FFD700]" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">Final Recommendation</span>
                </div>
                <p className="text-[14px] font-semibold text-[var(--fg)] leading-relaxed">
                  {aiResult.final_recommendation}
                </p>
              </div>

              {/* Comparison summary */}
              {aiResult.comparison_summary && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-1.5">
                    Comparison Summary
                  </div>
                  <p className="text-[13px] text-[var(--fg-secondary)] leading-relaxed">
                    {aiResult.comparison_summary}
                  </p>
                </div>
              )}

              {/* Ranked properties */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                  Ranked Properties ({aiResult.ranked_properties.length})
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(aiResult.ranked_properties.length, 3)}, 1fr)` }}>
                  {aiResult.ranked_properties.map((rp, idx) => (
                    <div key={rp.id ?? idx} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                          #{idx + 1} · Score
                        </span>
                        <span className="text-base font-bold text-[#8B7355]">{rp.score.toFixed(1)}</span>
                      </div>
                      <p className="text-[13px] font-semibold text-[var(--fg)] mb-1.5 leading-tight line-clamp-2">
                        {rp.title}
                      </p>
                      {rp.reason && (
                        <p className="text-[11px] text-[var(--fg-secondary)] leading-relaxed mb-2 italic">
                          {rp.reason}
                        </p>
                      )}
                      {rp.pros?.length > 0 && (
                        <div className="mb-1.5">
                          {rp.pros.slice(0, 3).map((p, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <CheckCircle2 className="h-3 w-3 text-[#22C55E] shrink-0 mt-0.5" />
                              <span className="text-[11px] text-[var(--fg-secondary)] leading-snug">{p}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {rp.cons?.length > 0 && (
                        <div>
                          {rp.cons.slice(0, 3).map((c, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <X className="h-3 w-3 text-[#EF4444] shrink-0 mt-0.5" />
                              <span className="text-[11px] text-[var(--fg-secondary)] leading-snug">{c}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tradeoffs + Risks */}
              <div className="grid gap-4 md:grid-cols-2">
                {aiResult.tradeoffs?.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                      Tradeoffs
                    </div>
                    <ul className="space-y-1.5">
                      {aiResult.tradeoffs.map((t, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Minus className="h-3 w-3 text-[#F59E0B] shrink-0 mt-0.5" />
                          <span className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {aiResult.risks?.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                      Risks
                    </div>
                    <ul className="space-y-1.5">
                      {aiResult.risks.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-[#EF4444] shrink-0 mt-0.5" />
                          <span className="text-[12px] text-[var(--fg-secondary)] leading-relaxed">{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Compare AI Context Modal ── */}
      <AnimatePresence>
        {showCompareAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="cmp-ai-modal-overlay"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCompareAI(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 28, scale: 0.95 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="cmp-ai-modal"
            >
              {/* ── Header ── */}
              <div className="cmp-ai-modal-header">
                <div className="flex items-center gap-3">
                  <div className="cmp-ai-modal-avatar">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--fg)]">Compare AI</h3>
                    <p className="text-[10px] text-[var(--fg-muted)] flex items-center gap-1.5 mt-0.5">
                      <motion.span
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-[#8B7355] inline-block shrink-0"
                      />
                      {compareAILoading
                        ? `Analyzing ${selectedProperties.map((p) => p!.title).join(' vs ')}…`
                        : `Analyzing ${selectedProperties.length} propert${selectedProperties.length > 1 ? 'ies' : 'y'}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCompareAI(false)}
                  className="p-1.5 rounded-lg hover:bg-[rgba(239,68,68,0.08)] text-[var(--fg-muted)] hover:text-[#EF4444] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Context Chips — always reflect current selection ── */}
              <div className="cmp-ai-modal-context">
                {selectedProperties.map((p, i) => (
                  <div
                    key={p!.id}
                    className="cmp-ai-context-chip"
                    style={{
                      background: `${PROPERTY_COLORS[i]}12`,
                      borderColor: `${PROPERTY_COLORS[i]}22`,
                    }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PROPERTY_COLORS[i] }} />
                    <span className="text-[10px] font-semibold truncate max-w-[96px]">{p!.title}</span>
                    <span
                      className="text-[9px] font-bold px-1 py-0.5 rounded shrink-0"
                      style={{ background: `${PROPERTY_COLORS[i]}18`, color: PROPERTY_COLORS[i] }}
                    >
                      {p!.aiScore}
                    </span>
                    {overallWinner === p!.id && <Trophy className="h-2.5 w-2.5 text-primary-600 shrink-0" />}
                  </div>
                ))}
              </div>

              {/* ── Tabs ── */}
              <div className="cmp-ai-modal-tabs">
                {([
                  { key: 'chat', label: 'AI Chat', icon: MessageCircle },
                  { key: 'financial', label: 'Financial', icon: DollarSign },
                  { key: 'returns', label: 'Returns', icon: TrendingUp },
                  { key: 'property', label: 'Property', icon: Building2 },
                ] as const).map(({ key, label, icon: TabIcon }) => (
                  <button
                    key={key}
                    onClick={() => setCompareAITab(key)}
                    className={`cmp-ai-tab ${compareAITab === key ? 'active' : ''}`}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Loading Skeleton (chat tab only) ── */}
              {compareAILoading && compareAITab === 'chat' && (
                <div className="cmp-ai-loading-state">
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="h-4 w-4 text-[#8B7355]" />
                    </motion.div>
                    <span className="text-xs font-semibold text-[var(--fg-secondary)]">Running deep analysis…</span>
                  </div>
                  <div className="space-y-3">
                    {[85, 65, 78, 52].map((w, i) => (
                      <div
                        key={i}
                        className="cmp-ai-loading-bar"
                        style={{ width: `${w}%`, animationDelay: `${i * 0.18}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Chat Tab ── */}
              {compareAITab === 'chat' && !compareAILoading && (
                <>
                  <div className="cmp-ai-modal-messages">
                    <AnimatePresence initial={false}>
                      {compareAIMessages.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          className={`cmp-ai-msg ${msg.role === 'ai' ? 'cmp-ai-msg-ai' : 'cmp-ai-msg-user'}`}
                        >
                          {msg.role === 'ai' && <Sparkles className="h-3 w-3 text-[#8B7355] shrink-0 mt-0.5" />}
                          <div className="whitespace-pre-line text-[13px] leading-relaxed">
                            {renderMarkdown(msg.text)}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {compareAITyping && (
                      <div className="cmp-ai-msg cmp-ai-msg-ai">
                        <div className="flex items-center gap-1 py-0.5">
                          {[0, 0.15, 0.3].map((delay, i) => (
                            <motion.span
                              key={i}
                              animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                              transition={{ duration: 0.8, repeat: Infinity, delay }}
                              className="w-1.5 h-1.5 rounded-full bg-[#8B7355] inline-block"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div ref={compareAIMsgEnd} />
                  </div>

                  {compareAIMessages.length <= 1 && (
                    <div className="cmp-ai-modal-prompts">
                      {[
                        { icon: Shield, text: 'Which has the best risk-adjusted return?' },
                        { icon: Globe, text: 'Compare tax implications across jurisdictions' },
                        { icon: ArrowRight, text: 'Best exit strategy for the winner?' },
                        { icon: AlertTriangle, text: 'Analyze downside scenarios in detail' },
                      ].map(({ icon: PromptIcon, text: prompt }) => (
                        <button
                          key={prompt}
                          onClick={() => { void askCompareAI(prompt); }}
                          className="cmp-ai-prompt-chip"
                        >
                          <PromptIcon className="h-3 w-3 shrink-0" />
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="cmp-ai-modal-input">
                    <input
                      type="text"
                      value={compareAIInput}
                      onChange={(e) => setCompareAIInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && compareAIInput.trim()) {
                          e.preventDefault();
                          const text = compareAIInput.trim();
                          setCompareAIInput('');
                          void askCompareAI(text);
                        }
                      }}
                      placeholder={`Ask about ${selectedProperties.length > 1 ? 'these properties' : 'this property'}…`}
                      className="cmp-ai-modal-text-input"
                    />
                    <button
                      onClick={() => {
                        if (!compareAIInput.trim()) return;
                        const text = compareAIInput.trim();
                        setCompareAIInput('');
                        void askCompareAI(text);
                      }}
                      disabled={!compareAIInput.trim() || compareAITyping}
                      className="cmp-ai-modal-send"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}

              {/* ── Financial Tab ── */}
              {compareAITab === 'financial' && (
                <div className="cmp-ai-tab-content">
                  {selectedProperties.map((p, i) => {
                    const verdict = deriveVerdict(p!);
                    return (
                      <div key={p!.id} className="cmp-ai-tab-card" style={{ '--cmp-accent': PROPERTY_COLORS[i] } as React.CSSProperties}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: PROPERTY_COLORS[i] }} />
                          <span className="text-xs font-bold text-[var(--fg)]">{p!.title}</span>
                          {verdict && <span className="text-[10px] font-semibold" style={{ color: verdict.color }}>{verdict.rating}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">Price</span><p className="text-sm font-bold text-[var(--fg)]">{formatCurrency(p!.price?.amount ?? 0)}</p></div>
                          <div><span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">AI Score</span><p className="text-sm font-bold text-[#8B7355]">{p!.aiScore}/100</p></div>
                          <div><span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">Rental Yield</span><p className="text-sm font-bold text-[#22C55E]">{p!.rentalYield}%</p></div>
                          <div><span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">Appreciation</span><p className="text-sm font-bold text-[#F59E0B]">{p!.capitalAppreciation}%</p></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Returns Tab ── */}
              {compareAITab === 'returns' && (
                <div className="cmp-ai-tab-content">
                  {selectedProperties.map((p, i) => {
                    const proj = generateProjection(p!.price?.amount ?? 0, p!.capitalAppreciation ?? 6, p!.rentalYield ?? 4);
                    return (
                      <div key={p!.id} className="cmp-ai-tab-card" style={{ '--cmp-accent': PROPERTY_COLORS[i] } as React.CSSProperties}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full" style={{ background: PROPERTY_COLORS[i] }} />
                          <span className="text-xs font-bold text-[var(--fg)]">{p!.title}</span>
                        </div>
                        <div className="space-y-2">
                          {[1, 3, 5].map((y) => {
                            const d = proj[y];
                            const gain = d ? ((d.value - proj[0].value) / proj[0].value * 100).toFixed(1) : '0';
                            return (
                              <div key={y} className="flex items-center justify-between">
                                <span className="text-[10px] text-[var(--fg-muted)]">{y}Y Projection</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-[var(--fg)]">{d ? formatCurrency(d.value) : '-'}</span>
                                  <span className="text-[10px] font-semibold text-[#22C55E]">+{gain}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Property Tab ── */}
              {compareAITab === 'property' && (
                <div className="cmp-ai-tab-content">
                  {selectedProperties.map((p, i) => (
                    <div key={p!.id} className="cmp-ai-tab-card" style={{ '--cmp-accent': PROPERTY_COLORS[i] } as React.CSSProperties}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: PROPERTY_COLORS[i] }} />
                        <span className="text-xs font-bold text-[var(--fg)]">{p!.title}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">Type</span><p className="text-xs font-semibold text-[var(--fg)] capitalize">{p!.type}</p></div>
                        <div><span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">Developer</span><p className="text-xs font-semibold text-[var(--fg)]">{p!.developer}</p></div>
                        <div><span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">Area</span><p className="text-xs font-semibold text-[var(--fg)]">{p!.area.value.toLocaleString()} {p!.area.unit}</p></div>
                        <div><span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">Year Built</span><p className="text-xs font-semibold text-[var(--fg)]">{p!.yearBuilt}</p></div>
                        {p!.bedrooms && <div><span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">Bedrooms</span><p className="text-xs font-semibold text-[var(--fg)]">{p!.bedrooms}</p></div>}
                        {p!.bathrooms && <div><span className="text-[9px] uppercase tracking-wide text-[var(--fg-muted)]">Bathrooms</span><p className="text-xs font-semibold text-[var(--fg)]">{p!.bathrooms}</p></div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed Action Bar ── */}
      {selectedProperties.length >= 2 && (
        <div className="cmp-action-bar">
          <div className="cmp-action-bar-inner">

            {/* ── LEFT: Status ── */}
            <div className="cmp-bar-left">
              <div className="flex items-center gap-2">
                <Scale className="h-3.5 w-3.5 text-[#8B7355] shrink-0" />
                <span className="text-[12px] font-semibold text-[var(--fg-secondary)]">
                  Comparing <span className="text-[var(--fg)] font-bold">{selectedProperties.length}</span> properties
                </span>
              </div>
              {overallWinner && selectedProperties.find(p => p!.id === overallWinner) && (
                <div className="cmp-bar-best-badge">
                  <Trophy className="h-3 w-3 shrink-0" />
                  <span className="hidden md:inline truncate max-w-[140px]">
                    {selectedProperties.find(p => p!.id === overallWinner)!.title}
                  </span>
                  <span className="md:hidden">Best Match</span>
                </div>
              )}
            </div>

            {/* ── CENTER: Secondary Actions ── */}
            <div className="cmp-bar-center">
              <button className="cmp-bar-secondary">
                <Bookmark className="h-3.5 w-3.5" />
                <span>Save</span>
              </button>
              <button className="cmp-bar-secondary">
                <Download className="h-3.5 w-3.5" />
                <span>Export</span>
              </button>
              <button className="cmp-bar-secondary hidden lg:inline-flex">
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </button>
            </div>

            {/* ── RIGHT: Primary Actions ── */}
            <div className="cmp-bar-right">
              <button
                onClick={() => setShowDownside(prev => !prev)}
                className={`cmp-bar-primary ${showDownside ? 'active' : ''}`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{showDownside ? 'Hide Analysis' : 'Deep Analysis'}</span>
                <span className="sm:hidden">Analysis</span>
              </button>
              <button
                onClick={() => {
                  completeStep(4);
                  setCurrentStep(5);
                  router.push('/investor/ai-qa');
                }}
                className="cmp-bar-primary"
              >
                <Brain className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">AI Q&amp;A</span>
                <span className="sm:hidden">AI</span>
              </button>
              <button
                onClick={() => {
                  if (overallWinner) router.push(`/investor/properties/${overallWinner}`);
                }}
                disabled={!overallWinner}
                className="cmp-bar-invest"
              >
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Invest in Winner</span>
                <span className="sm:hidden">Invest</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </motion.div>
  );
}
