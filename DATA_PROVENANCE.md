# Data Provenance — Investor Surface (integration-mvp)

What's served by the backend vs. filled in from `src/mock-data/` by the
adapter layer. Adapters merge deterministically: real backend values win,
mock fills the gaps, and the same backend `id` always picks the same mock
entry across renders so the UI is stable.

Adapter sources:
- `src/services/api/area.api.ts` → `adapt()` (consumes `BackendAreaCandidate`)
- `src/services/api/property.api.ts` → `adaptBackendProperty()` (consumes `BackendPropertySummary`)

---

## Area card — `/investor/areas`

Backend endpoint: `POST /orchestrator/areas` → `AreasResponse.areas[]`.

| Frontend field | Source | Backend origin |
| --- | --- | --- |
| `id` | derived | slug of `area_name` |
| `name` | **backend** | `area_name` |
| `city` | **backend** | `city` |
| `country` / `countryCode` / `flag` | hardcoded | `'India'` / `'IN'` / 🇮🇳 (Maharashtra-only MVP) |
| `matchScore` | **backend** | `score` (or `final_area_score`) |
| `avgPrice` | **backend** | formatted from `signals.latest_psf` |
| `avgYield` | **backend** with mock fallback | `signals.rental_yield_pct`; mock if null |
| `growth3Y` | **backend** with mock fallback | `signals.trend_3yr_pct`; mock if null |
| `demand` | **backend** | normalized from `signals.demand_strength` |
| `recentChange` | **backend** with mock fallback | from `signals.trend_1yr_pct`; mock if null |
| `properties` | **backend** | `property_count` (counts cached listings whose `locality_text` matches the area) |
| `highlights` | **backend** | extracted from `reasons[]` (Recent / Attractive / Outlook lines) |
| `whyMatched` | **backend** | first `Why:` line in `reasons[]` |
| `image` | **mock** | `mockAreas[hash(id) % N].image` |
| `riskLevel` | **mock** | `mockAreas[hash(id) % N].riskLevel` (backend has no categorical risk_level yet) |
| `trendData` | **mock** | `mockAreas[hash(id) % N].trendData` (12-point sparkline) |
| `isRecommended` | derived | top-3 by `matchScore` |

---

## Property card — `/investor/properties`, `/investor/properties/[id]`

Backend endpoint: `POST /orchestrator/analyze` → `AnalyzeResponse.search.candidates[].property` (or `GET /properties` fallback).

| Frontend field | Source | Backend origin |
| --- | --- | --- |
| `id` | **backend** | `id` |
| `title` | **backend** with synthetic fallback | `title`, else `"<beds> BHK for <listing_type> in <locality>"` |
| `price.amount` | **backend** with mock fallback | `price_inr` |
| `price.currency` | hardcoded | `'INR'` |
| `bedrooms` | **backend** with mock fallback | `bedrooms` |
| `bathrooms` | **backend** with mock fallback | `bathrooms` |
| `area.value` | **backend** with mock fallback | `area_sqft` |
| `area.unit` | hardcoded | `'sqft'` |
| `location.city` | **backend** with mock fallback | `city` |
| `location.state` | **backend** | `state` |
| `location.neighborhood` | **backend** | `locality_text` |
| `location.country` / `countryCode` | hardcoded | `'India'` / `'IN'` |
| `subType` | **backend** with mock fallback | `listing_type` |
| `aiScore` | **backend** with mock fallback | candidate `score` |
| `description` | derived from backend, mock fallback | built from `listing_type` + locality; mock if no locality |
| `location.coordinates` | **mock** | `mockProperties[hash(id) % N].location.coordinates` |
| `type` | **mock** | mock `type` (residential / commercial / land / mixed-use) |
| `images` | **mock** | mock `images[]` |
| `features` | **mock** | mock `features[]` |
| `rentalYield` | **mock** | mock `rentalYield` |
| `capitalAppreciation` | **mock** | mock `capitalAppreciation` |
| `riskScore` | **mock** | mock `riskScore` (low / medium / high) |
| `yearBuilt` | **mock** | mock `yearBuilt` |
| `developer` | **mock** | mock `developer` |
| `status` | **mock** | mock `status` (always `available` in mock pool) |
| `isLuxury` | **mock** | mock `isLuxury` |
| `createdAt` | **mock** | mock `createdAt` |

Computed UI that mixes real + mock:
- "AI Pick" badge — real `aiScore`
- "Featured" badge — `isLuxury` (mock) OR `rentalYield ≥ 5` (mock)
- "Trending" badge — `capitalAppreciation ≥ 10` (mock)

So the badges *function* but their values come from the mock pool, not the real backend listing.

---

## QA — `/investor/ai-qa`

Backend endpoint: `POST /properties/{id}/qa` → `{ answer, source }` (singular `source`).

| Frontend field | Source |
| --- | --- |
| `answer` | **backend** (Gemini-grounded on the deep-dive cache; falls back to keyword heuristic with `source` tagged `(offline)` if Gemini key missing) |
| `source` | **backend** |

---

## Deep-dive — `/investor/properties/[id]` rich panels

Backend endpoint: `GET /properties/{id}/deepdive` → 9-field `DeepDiveResponse`.

All 9 fields (`verdict`, `narrative`, `sections` (7 sub-sections), `action_items`, `key_highlights`, `investment_thesis`, `property`, `area_context`, `graph_context`) are **backend** — Gemini-generated, cached in `data/cache/deepdives.json`.

---

## Pages still entirely on mock (not wired)

These investor sub-routes have no backend wiring yet and continue reading
straight from `src/mock-data/`:

- `/investor/properties/[id]/analytics`
- `/investor/properties/[id]/digital-twin`
- `/investor/properties/[id]/legal`
- `/investor/properties/[id]/negotiate`
- `/investor/properties/map` (map view; coordinates come from mock anyway)
- `/investor/portfolio` and all sub-routes
- `/investor/fractional`
- `/investor/transactions`
- `/investor/negotiations`
- `/investor/ai-deals`
- `/investor/intelligence` (heatmap, risk-alerts)
- `/investor/lending`
- `/investor/concierge`
- `/investor/decision`

Broker surface (`/broker/...`) — endpoints exist on backend (commit `bd69d55`)
but frontend wiring is pending.

---

_Last updated: 2026-04-27 — integration-mvp branch._
