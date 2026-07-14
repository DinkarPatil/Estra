import type { AreaRecommendation } from '@/mock-data/areas';
import { mockAreas } from '@/mock-data/areas';
import type { IAreaService } from '../interfaces/area.interface';

/** Deterministic hash → index into the mock-area pool. Same backend id
 *  always picks the same mock entry for image/trendData/riskLevel. */
function _pickMockArea(id: string): AreaRecommendation {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return mockAreas[Math.abs(h) % mockAreas.length];
}

/** Mirrors backend AreaSignals (search/schemas.py). All fields optional —
 *  cached areas may be missing newer derived metrics. */
interface BackendAreaSignals {
  historical_trend_score?: number | null;
  trend_1yr_pct?: number | null;
  trend_3yr_pct?: number | null;
  trend_5yr_pct?: number | null;
  latest_psf?: number | null;
  uplift_potential_score?: number | null;
  downside_risk_score?: number | null;
  legal_safety_score?: number | null;
  infra_impact_score?: number | null;
  market_momentum_score?: number | null;
  news_relevance_score?: number | null;
  liquidity_demand_score?: number | null;
  rental_yield_pct?: number | null;
  roi_composite_pct?: number | null;
  volatility_index?: number | null;
  demand_strength?: string | null;
}

/** Mirrors backend AreaCandidate (search/schemas.py). */
interface BackendAreaCandidate {
  area_name: string;
  city: string;
  score: number;
  final_area_score?: number | null;
  reasons?: string[];
  signals?: BackendAreaSignals;
  property_count?: number;
}

interface BackendAreasResponse {
  intent: unknown;
  areas: BackendAreaCandidate[];
}

function formatPsf(psf: number | null | undefined): string {
  if (!psf || psf <= 0) return '—';
  if (psf >= 100000) return `₹${(psf / 100000).toFixed(1)}L/sqft`;
  return `₹${Math.round(psf).toLocaleString('en-IN')}/sqft`;
}

function extractWhyMatched(reasons: string[]): string {
  const why = reasons.find((r) => r.startsWith('Why:'));
  if (why) return why.replace(/^Why:\s*/, '');
  return reasons[0] ?? '';
}

function extractHighlights(reasons: string[]): string[] {
  const tagged: string[] = [];
  for (const r of reasons) {
    const m = r.match(/^(Recent|Attractive|Outlook):\s*(.+)$/);
    if (m) tagged.push(m[2].split(/[.,]/)[0].trim().slice(0, 40));
    if (tagged.length >= 3) break;
  }
  return tagged;
}

function normalizeDemand(s: string | undefined): 'high' | 'medium' | 'low' {
  const v = (s || '').toLowerCase();
  if (v.includes('high')) return 'high';
  if (v.includes('low')) return 'low';
  return 'medium';
}

function _slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || name;
}

function adapt(c: BackendAreaCandidate): AreaRecommendation {
  const signals = c.signals ?? {};
  const id = _slug(c.area_name);
  const mock = _pickMockArea(id);

  return {
    id,
    name: c.area_name,
    city: c.city,
    country: 'India',
    countryCode: 'IN',
    flag: '🇮🇳',
    image: mock.image,
    matchScore: Math.round(c.score ?? c.final_area_score ?? 0),
    avgPrice: formatPsf(signals.latest_psf),
    avgYield: signals.rental_yield_pct ?? mock.avgYield,
    growth3Y: signals.trend_3yr_pct ?? mock.growth3Y,
    demand: normalizeDemand(signals.demand_strength ?? undefined),
    // Backend doesn't ship a categorical risk_level yet; mirror the mock
    // entry until we either derive from downside_risk_score or add the
    // field server-side.
    riskLevel: mock.riskLevel,
    properties: c.property_count ?? 0,
    trendData: mock.trendData,
    highlights: extractHighlights(c.reasons ?? []),
    whyMatched: extractWhyMatched(c.reasons ?? []),
    recentChange:
      signals.trend_1yr_pct != null
        ? `${signals.trend_1yr_pct > 0 ? '+' : ''}${signals.trend_1yr_pct.toFixed(1)}% YoY`
        : mock.recentChange,
    isRecommended: false,
  };
}

export class ApiAreaService implements IAreaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  }

  async searchAreas(query: string): Promise<AreaRecommendation[]> {
    try {
      const res = await fetch(`${this.baseUrl}/orchestrator/areas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query || 'investment areas in Maharashtra' }),
      });
      if (!res.ok) throw new Error(`/orchestrator/areas ${res.status}`);
      const data = (await res.json()) as BackendAreasResponse;

      const adapted = data.areas.map(adapt);
      if (adapted.length > 0) {
        const top = [...adapted].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
        const topIds = new Set(top.map((a) => a.id));
        return adapted.map((a) => ({ ...a, isRecommended: topIds.has(a.id) }));
      }
      // Backend returned empty list — fall through to mock
    } catch {
      // Backend unavailable — silently fall back to mock data
    }
    return mockAreas;
  }
}
