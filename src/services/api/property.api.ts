import type { Property, PropertyType } from '@/types/property';
import type { PaginatedResponse } from '@/types/common';
import type { IPropertyService } from '../interfaces/property.interface';
import { mockProperties } from '@/mock-data/properties';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

/** Deterministic hash → index into a fixed mock pool so the same backend
 *  id always picks the same mock entry across renders/sessions. */
function _pickMock<T>(pool: T[], id: string): T {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

/** Backend PropertySummary shape (mirrors property_intelligence/schemas.py). */
export interface BackendPropertySummary {
  id: string;
  source: string;
  listing_type: string;
  title?: string | null;
  city?: string | null;
  state?: string | null;
  locality_text?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
  price_inr?: number | null;
  price_per_sqft?: number | null;
}

interface BackendSearchCandidate {
  property_id: string;
  score: number;
  reasons?: string[];
  property?: BackendPropertySummary | null;
}

interface BackendAnalyzeResponse {
  search: {
    candidates: BackendSearchCandidate[];
  };
}

interface BackendPropertyListResponseRaw {
  items: BackendPropertySummary[];
  total: number;
  limit: number;
  offset: number;
}

/** Adapt the minimal backend PropertySummary to the rich frontend Property
 *  type. Real backend fields win; gaps are filled deterministically from
 *  the mock pool keyed by backend id, so the demo UI never shows zeros
 *  for yield / risk / images / coords. */
export function adaptBackendProperty(
  s: BackendPropertySummary,
  score?: number,
): Property {
  const localityBits = [s.locality_text, s.city].filter(Boolean).join(', ');
  const titleFallback =
    s.title ||
    [
      s.bedrooms ? `${s.bedrooms} BHK` : null,
      s.listing_type ? `for ${s.listing_type}` : null,
      localityBits ? `in ${localityBits}` : null,
    ]
      .filter(Boolean)
      .join(' ') ||
    'Property';

  const mock = _pickMock(mockProperties, s.id);

  return {
    id: s.id,
    title: titleFallback,
    description: localityBits
      ? `${s.listing_type ?? 'Property'} listing in ${localityBits}.`
      : mock.description,
    location: {
      city: s.city ?? mock.location.city,
      state: s.state ?? undefined,
      country: 'India',
      countryCode: 'IN',
      coordinates: mock.location.coordinates,
      neighborhood: s.locality_text ?? undefined,
    },
    price: { amount: s.price_inr ?? mock.price.amount, currency: 'INR' },
    type: mock.type as PropertyType,
    subType: s.listing_type ?? mock.subType,
    bedrooms: s.bedrooms ?? mock.bedrooms,
    bathrooms: s.bathrooms ?? mock.bathrooms,
    area: { value: s.area_sqft ?? mock.area.value, unit: 'sqft' },
    yearBuilt: mock.yearBuilt,
    developer: mock.developer,
    aiScore: score != null ? Math.round(score * 100) / 100 : mock.aiScore,
    rentalYield: mock.rentalYield,
    capitalAppreciation: mock.capitalAppreciation,
    riskScore: mock.riskScore,
    images: mock.images,
    features: mock.features,
    status: mock.status,
    isLuxury: mock.isLuxury,
    createdAt: mock.createdAt,
  };
}

/** Backend PropertyDetail shape — extends PropertySummary with detail-only
 *  fields (mirrors property_intelligence/schemas.py). */
export interface BackendPropertyDetail extends BackendPropertySummary {
  external_id?: string | null;
  raw?: string | null;
  scraped_at?: string | null;
  last_seen_at?: string | null;
}

export interface BackendPropertyListResponse {
  total: number;
  properties: BackendPropertyDetail[];
}

/** Mirrors backend DeepDiveSections (property_intelligence/schemas.py). */
export interface DeepDiveSections {
  property_overview: string;
  area_investment_context: string;
  value_analysis: string;
  risk_compliance: string;
  developer_project_quality: string;
  amenities_lifestyle: string;
  final_recommendation: string;
}

/** Mirrors backend DeepDiveResponse. */
export interface DeepDiveResponse {
  property_id: string;
  property: Record<string, unknown>;
  area_context: Record<string, unknown>;
  graph_context: Record<string, unknown>;
  verdict: 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'AVOID' | string;
  narrative: string;
  sections: DeepDiveSections;
  action_items: string[];
  key_highlights: string[];
  investment_thesis: string;
}

/** Mirrors backend QAResponse. Note: backend returns `source` (singular
 *  string), not `sources` (array) — earlier interface had a typo that
 *  silently produced undefined on the UI. */
export interface QAResponse {
  property_id: string;
  question: string;
  answer: string;
  source: string;
}

export interface QAMessage {
  role: 'user' | 'bot';
  text: string;
}

export class ApiPropertyService implements IPropertyService {
  async searchProperties(
    _query: string,
    _filters?: Record<string, unknown>,
  ): Promise<PaginatedResponse<Property>> {
    // Not yet mapped — returns empty result
    return { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
  }

  async getPropertyById(id: string): Promise<Property> {
    try {
      const res = await fetch(`${BASE}/properties/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`GET /properties/${id} ${res.status}`);
      return res.json();
    } catch {
      // Backend unavailable — return deterministic mock entry for this id
      return _pickMock(mockProperties, id);
    }
  }

  async getRecommendations(_limit?: number): Promise<Property[]> {
    return [];
  }

  async getFeaturedProperties(): Promise<Property[]> {
    return [];
  }

  // ── Backend-native convenience methods ──

  async listProperties(params?: {
    city?: string;
    locality?: string;
    limit?: number;
    offset?: number;
  }): Promise<BackendPropertyListResponse> {
    try {
      const qs = new URLSearchParams();
      if (params?.city) qs.set('city', params.city);
      if (params?.locality) qs.set('locality', params.locality);
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.offset) qs.set('offset', String(params.offset));

      const res = await fetch(`${BASE}/properties?${qs}`);
      if (!res.ok) throw new Error(`GET /properties ${res.status}`);
      const raw = await res.json();
      return {
        total: raw.total ?? 0,
        properties: raw.items ?? [],
      };
    } catch {
      return { total: 0, properties: [] };
    }
  }

  async getDetail(id: string): Promise<BackendPropertyDetail> {
    try {
      const res = await fetch(`${BASE}/properties/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`GET /properties/${id} ${res.status}`);
      return res.json();
    } catch {
      // Backend unavailable — synthesize from mock pool so the detail page renders
      const mock = _pickMock(mockProperties, id);
      return {
        id,
        source: 'mock',
        listing_type: mock.subType ?? 'Residential',
        title: mock.title,
        city: mock.location.city,
        state: mock.location.state ?? null,
        locality_text: mock.location.neighborhood ?? null,
        bedrooms: mock.bedrooms ?? null,
        bathrooms: mock.bathrooms ?? null,
        area_sqft: mock.area.value ?? null,
        price_inr: mock.price.amount ?? null,
        price_per_sqft: mock.area.value > 0 ? Math.round(mock.price.amount / mock.area.value) : null,
      };
    }
  }

  async getDeepDive(id: string): Promise<DeepDiveResponse> {
    const res = await fetch(`${BASE}/properties/${encodeURIComponent(id)}/deepdive`);
    if (!res.ok) throw new Error(`GET /properties/${id}/deepdive ${res.status}`);
    return res.json();
  }

  /** Area-first property search. Calls /orchestrator/analyze with the
   *  user-selected area names; falls back to the flat /properties listing
   *  if the orchestrator returns zero candidates (e.g. uncached area). */
  async searchByAreas(areaNames: string[], query?: string): Promise<Property[]> {
    try {
      if (areaNames.length > 0) {
        const res = await fetch(`${BASE}/orchestrator/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query || 'investment properties',
            area_names: areaNames,
          }),
        });
        if (!res.ok) throw new Error(`POST /orchestrator/analyze ${res.status}`);
        const data = (await res.json()) as BackendAnalyzeResponse;
        const props = (data.search?.candidates ?? [])
          .filter((c) => c.property)
          .map((c) => adaptBackendProperty(c.property!, c.score));
        if (props.length > 0) return props;
      }
      // Fallback: flat listing. Useful when no areas selected or the
      // orchestrator returned nothing for the chosen areas.
      const params = new URLSearchParams({ limit: '60' });
      const res = await fetch(`${BASE}/properties?${params}`);
      if (!res.ok) throw new Error(`GET /properties ${res.status}`);
      const raw = (await res.json()) as BackendPropertyListResponseRaw;
      return (raw.items ?? []).map((s) => adaptBackendProperty(s));
    } catch {
      // Backend unavailable — return mock properties
      return mockProperties;
    }
  }

  async askQuestion(
    propertyId: string,
    question: string,
    history: QAMessage[] = [],
    additionalPropertyIds: string[] = [],
  ): Promise<QAResponse> {
    const cleanedAdditionalIds = [...new Set(
      additionalPropertyIds.filter((id): id is string => Boolean(id) && id !== propertyId),
    )];
    const res = await fetch(
      `${BASE}/properties/${encodeURIComponent(propertyId)}/qa`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          history,
          additional_property_ids: cleanedAdditionalIds,
        }),
      },
    );
    if (!res.ok) throw new Error(`POST /properties/${propertyId}/qa ${res.status}`);
    return res.json();
  }
}
