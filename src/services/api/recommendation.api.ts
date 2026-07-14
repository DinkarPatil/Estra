/**
 * AI property comparison / recommendation client.
 *
 * Talks to the backend `POST /recommendation/compare` endpoint built on top of
 * `data/listings.json` (or inline properties for the Compare page). Returns a
 * structured payload the UI can render directly — pros / cons per property +
 * comparison summary + final recommendation + tradeoffs + risks.
 *
 * The backend always responds (even when GEMINI_API_KEY is missing — it falls
 * back to a deterministic narrative and tags `source: "offline"`).
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface RecommendationProperty {
  id?: string | null;
  title?: string | null;
  city?: string | null;
  state?: string | null;
  locality_text?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
  price_inr?: number | null;
  price_per_sqft?: number | null;
  description?: string | null;
  project_name?: string | null;
  builder_name?: string | null;
  listing_url?: string | null;
}

export interface RecommendationRequestBody {
  user_query: string;
  property_ids?: string[];
  properties?: RecommendationProperty[];
  top_n?: number;
}

export interface RankedPropertyResponse {
  id?: string | null;
  title?: string | null;
  score: number;
  reason: string;
  pros: string[];
  cons: string[];
  breakdown: {
    budget?: number;
    value_for_money?: number;
    size?: number;
    location?: number;
    roi?: number;
    risk?: number;
  };
  property: RecommendationProperty;
}

export interface RecommendationResponseBody {
  intent: {
    raw_query: string;
    city: string | null;
    bhk: number | null;
    budget_inr: number | null;
    target_area_sqft: number | null;
    wants_high_roi: boolean;
    wants_low_risk: boolean;
    wants_high_risk: boolean;
  };
  ranked_properties: RankedPropertyResponse[];
  comparison_summary: string;
  final_recommendation: string;
  tradeoffs: string[];
  risks: string[];
  source: 'gemini' | 'offline';
  source_detail?: string | null;
}

export async function compareProperties(
  body: RecommendationRequestBody,
): Promise<RecommendationResponseBody> {
  const res = await fetch(`${BASE}/recommendation/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Recommendation request failed: ${res.status} ${txt}`.trim());
  }
  return (await res.json()) as RecommendationResponseBody;
}
