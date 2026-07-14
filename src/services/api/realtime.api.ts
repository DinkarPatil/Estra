/**
 * Live area-scoped property scrape client.
 *
 * Backend: POST /realtime/properties — scrapes 99acres / MagicBricks /
 * Housing.com / NoBroker concurrently for the given areas and returns
 * normalized listings + image URLs.
 */

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface RealtimeListing {
  id: string;
  source: 'magicbricks' | '99acres' | 'housing' | 'nobroker' | string;
  title?: string | null;
  city?: string | null;
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
  images: string[];
  scraped_at?: string | null;
}

export interface RealtimeScrapeResponse {
  areas: string[];
  city: string | null;
  total: number;
  by_source: Record<string, number>;
  listings: RealtimeListing[];
  elapsed_ms: number;
  cached: boolean;
  errors: string[];
}

export interface RealtimeScrapeRequest {
  areas: string[];
  city?: string;
  sources?: string[];
  limit_per_source?: number;
  fresh?: boolean;
}

export async function fetchRealtimeProperties(
  body: RealtimeScrapeRequest,
  signal?: AbortSignal,
): Promise<RealtimeScrapeResponse> {
  const res = await fetch(`${BASE}/realtime/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Realtime scrape failed: ${res.status} ${txt}`.trim());
  }
  return (await res.json()) as RealtimeScrapeResponse;
}

/**
 * Single-listing lookup. Returns null on 404 (cache expired).
 * Used by the Property Detail page as a network fallback when sessionStorage
 * doesn't have the listing (e.g. user opened the URL in a new tab).
 */
export async function fetchRealtimeListing(
  id: string,
): Promise<RealtimeListing | null> {
  const res = await fetch(`${BASE}/realtime/property/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Realtime detail failed: ${res.status} ${txt}`.trim());
  }
  return (await res.json()) as RealtimeListing;
}

/* ─── sessionStorage cache ─── */

const CACHE_KEY = 'glimmora.live_listings';

export function cacheLiveListings(listings: RealtimeListing[]): void {
  if (typeof window === 'undefined') return;
  try {
    const map: Record<string, RealtimeListing> = {};
    // Merge with anything already cached so prior batches stay reachable.
    try {
      const prev = sessionStorage.getItem(CACHE_KEY);
      if (prev) Object.assign(map, JSON.parse(prev));
    } catch { /* corrupt — overwrite */ }
    for (const l of listings) {
      if (l && l.id) map[l.id] = l;
    }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(map));
  } catch {
    // Quota / private mode — silently skip; backend lookup still works.
  }
}

export function readCachedLiveListing(id: string): RealtimeListing | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, RealtimeListing>;
    return map[id] ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns every live-scraped listing currently held in sessionStorage,
 * in arbitrary order. Used by the Compare page to build its pool entirely
 * from real scraped data instead of hitting the DB-backed /properties.
 */
export function readAllCachedLiveListings(): RealtimeListing[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const map = JSON.parse(raw) as Record<string, RealtimeListing>;
    return Object.values(map);
  } catch {
    return [];
  }
}
