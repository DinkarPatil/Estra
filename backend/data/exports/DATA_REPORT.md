# ESTRA Glimmora — Area Intelligence Data Report

**Prepared by:** Ritesh Chavan
**Date:** April 21, 2026
**Version:** v1.0 (MVP)

---

## 1. Overview

This report documents the data pipeline powering the ESTRA Glimmora area intelligence database. The system covers **56 micro-market areas** across **6 Maharashtra cities**, producing area-level signals that feed the property search and recommendation engine.

### Deliverables

| File | Contents |
|---|---|
| `lead_snapshot.db` | SQLite database — 430 property listings joined with area intelligence signals |
| `lead_snapshot.csv` | Same data in CSV format |
| `99acres/listings_2026-04.csv` | 621 raw property listings from 99acres |
| `99acres/trends_2026-04.json` | Quarterly price trends for 55 areas (2014–2026) |
| `99acres/pois_2026-04.json` | 4,069 nearby points of interest |

---

## 2. Data Sources

### 2.1 99acres SSR Scraping (Primary Source)

**What:** Property listings, price trends, and nearby POIs extracted from 99acres.com server-side rendered pages.

**How:** 99acres embeds ~640KB of structured JSON in `window.__initialData__` on every search page. This data includes project listings with price ranges, BHK configurations, builder names, and coordinates — as well as quarterly price trend data going back to 2014.

**URL formats:**
- Slug-based: `99acres.com/property-in-{area}-{city}-ffid` (Pune, Nagpur, Aurangabad, Kolhapur)
- Search-based: `99acres.com/search/property/buy?city={id}&locality={id}` (Mumbai, Navi Mumbai, Thane)

**Coverage:**

| City | Areas Scraped | Listings | Trends |
|---|---|---|---|
| Pune | 24 | 242 | 24 |
| Mumbai | 18 | 283 | 18 |
| Navi Mumbai | 3 | 43 | 3 |
| Nagpur | 5 | 72 | 5 |
| Aurangabad | 3 | 4 | 3 |
| Kolhapur | 3 | 2 | 2 |
| **Total** | **56** | **621** | **55** |

**Data points per listing:**
- Project name, builder, BHK options
- Price range (min–max in INR)
- Location (locality, city, lat/lon)
- Possession status
- Landing page URL

**Data points per area trend:**
- 52 quarterly psf values (Q1 2014 – Q1 2026)
- 1-year, 3-year, 5-year price change %
- Current psf rate
- Budget segment classification

**Refresh cadence:** Monthly (worker: `python -m app.workers.scrape_acres99_v2 --all`)

### 2.2 Kaggle Datasets (Historical Baseline)

**What:** Vintage property listings used for trend computation baseline and city-level imputation.

| Dataset | Vintage | Rows | Used For |
|---|---|---|---|
| Pune House Prices | 2021 | ~8,000 | Sale price baseline, CAGR trend |
| Pune Rentals | 2023 | ~4,000 | Rental yield, demand strength |
| 7 Indian Cities | 2021 | ~14,000 | Mumbai/Pune sale baseline |

**Status:** Kaggle data is retained in the database for backward compatibility but is **no longer the primary trend source**. 99acres quarterly data (52 points, 2014–2026) replaces the Kaggle 2-point CAGR for `historical_price_trend_pct`.

**Note:** Kaggle rows are excluded from the lead snapshot CSV (source policy: `is_displayable` filter).

### 2.3 MahaRERA (Legal/Compliance Signals)

**What:** Complaints and suspended/deregistered project data from Maharashtra Real Estate Regulatory Authority.

**Source:** MahaRERA public drupal tables (`maharera.maharashtra.gov.in`)

**Fields populated:**
- `legal_regulatory_friction` — complaints text, substring-matched to area project names
- `legal_approval_signals` — suspended project count per area

### 2.4 Google News RSS (Infrastructure News)

**What:** Recent news headlines related to real estate infrastructure in each area.

**Source:** Google News RSS feeds, queried per area with keywords like "real estate infrastructure metro".

**Fields populated:**
- `infra_news_impact` — 8 headlines per area, publication-tagged
- Used by ROI composite for news bonus calculation

### 2.5 OpenStreetMap PBF (Geo Intelligence)

**What:** Points of interest extracted from a Maharashtra OSM extract (PBF file), parsed offline.

**Source:** Geofabrik Maharashtra extract, filtered to relevant POI categories.

**POI categories indexed:**
- Education (schools, colleges, universities)
- Healthcare (hospitals, clinics, pharmacies)
- Recreation (parks, gardens)
- Food (restaurants, cafes)
- Finance (banks, ATMs)
- Transport (bus stations, railway stations, airports)
- Commercial (offices, hotels, malls)

**Fields populated:**
- `livability_indicators` — count of schools, hospitals, restaurants, banks, parks within 1.5 km
- `infrastructure_proximity` — distance to nearest railway station, airport, bus station, highway
- `commercial_density` — count of offices, hotels, malls within 2 km (used by ROI composite)

### 2.6 Local CSV Data (Risk Signals)

| Source | Data | Fields |
|---|---|---|
| IS 1893:2016 | Seismic zone per district | `seismic_zone` |
| NCRB 2022 | IPC crime rate per 100K population | `crime_per_100k` |
| MSDMA | Flood risk per district | `flood_risk` |

---

## 3. Calculated Fields

### 3.1 `historical_price_trend_pct` — 3-Year Price Trend

**Formula:** 99acres `trend_3yr` — the 3-year compound annual growth rate computed from 52 quarterly psf data points (Q1 2014 – Q1 2026).

**Fallback:** If 99acres data is unavailable, computed as CAGR from Kaggle 2021 median psf vs current 99acres entry psf.

**Range observed:** -8.7% to +48.4% across Maharashtra areas.

### 3.2 `volatility_index` — Price Volatility

**Formula:** Annualised standard deviation of quarter-over-quarter percentage returns.

```
quarterly_returns[i] = (psf[i] - psf[i-1]) / psf[i-1]
volatility = stdev(quarterly_returns) * sqrt(4)
```

**Fallback:** Coefficient of variation (CV) of Kaggle psf values.

**Range observed:** 0.02 to 0.51 across areas.

### 3.3 `roi_trend_pct` — Buy-Side ROI Composite

**Formula:**
```
roi = historical_price_trend_pct
    + infra_bonus        (≤ 2.0)
    + commercial_bonus   (≤ 2.0)
    + news_bonus         (≤ 1.5)

clamp: 0.0 ≤ roi ≤ historical_price_trend_pct + 5.0
```

**Components:**
- **infra_bonus:** +0.5 per transit node (metro/rail/highway/airport) within 3 km
- **commercial_bonus:** `min(2.0, log1p(offices + hotels + malls) * 0.6)` within 2 km
- **news_bonus:** +0.5 per matched development keyword in headlines (metro, highway, airport, expressway, corridor, IT park, SEZ, flyover, ring road, monorail)

**Range observed:** 1.7% to 7.0% across areas.

**Note:** Rental yield (the previous `roi_trend_pct`) is retained in `raw_data_dump.rental_yield_pct` for background reference but is not shown in the product layer.

### 3.4 `projected_uplift_pct` / `projected_downside_pct`

**Formula:** Derived from `historical_price_trend_pct` and `volatility_index`.

```
uplift   = trend * (1 + volatility * 0.5)
downside = trend * (1 - volatility * 1.5)  if trend > 0
          = trend * (1 + volatility * 0.5)  if trend ≤ 0
```

### 3.5 `rental_demand_strength`

**Formula:** Classified from the ratio of rental to sale listings in the area.

| Ratio | Classification |
|---|---|
| > 0.4 | Very High |
| 0.2–0.4 | High |
| 0.1–0.2 | Medium |
| < 0.1 | Low |
| ≤ 3 rental listings | Insufficient Data |

### 3.6 `developer_concentration`

**Formula:** Frequency count of project names in the listing dataset, ranked by share.

```
output = {
  "unique_projects": count(distinct project names),
  "top_projects": [
    {"name": "...", "share_pct": count/total * 100},
    ...top 5
  ]
}
```

---

## 4. Data Quality Notes

### Coverage Gaps

| Area | Issue | Reason |
|---|---|---|
| Camp, Pune | 0 listings | Low inventory on 99acres |
| Civil Lines, Nagpur | 0 listings, no trend | Sparse area |
| Cidco, Aurangabad | 0 listings, no trend | Limited online listings |
| Kolhapur (all) | 0–2 listings | Tier 3 city, minimal digital presence |
| Jalna Road, Aurangabad | No trend data | 99acres has listings but no trend page |

### Known Limitations

1. **Price accuracy:** 99acres shows project price ranges (min–max), not individual unit prices. The midpoint is used for computations.
2. **Vintage:** Listings are current as of scrape date (April 2026). No historical listing tracking.
3. **Rental data:** 99acres is sale-only. Rental demand signals rely on Kaggle vintage data (2023).
4. **Mumbai locality IDs:** Mumbai areas use numeric locality IDs, not slug URLs. ID mapping is maintained in `scrape_acres99_v2.py`.
5. **Nashik/Solapur:** Not yet covered — 99acres returns 400/404 for these cities. Alternative URL formats needed.

### Pending Signals (Phase 2)

| Signal | Status | Required Source |
|---|---|---|
| `recent_news_sentiment` | NULL | LLM pass on headlines |
| `upcoming_infra_pipeline` | NULL | MMRDA/PMRDA announcement scrape |
| `supply_pressure` | NULL | MahaRERA project count per area |
| `transaction_velocity` | NULL | Listing posting date tracking |
| `distressed_asset_signals` | NULL | Bank auction portal scrape (IBAPI/SBI) |

---

## 5. Reproducing the Data

```bash
cd backend
source .venv/bin/activate

# Step 1: Scrape 99acres (monthly)
python -m app.workers.scrape_acres99_v2 --all

# Step 2: Run area intelligence ingestion
python -m app.workers.ingestion

# Step 3: Generate lead snapshot
python -m app.workers.export_lead_snapshot
```

**Output files:**
- `data/exports/lead_snapshot.db` — ready to share
- `data/exports/lead_snapshot.csv` — same data in CSV
- `data/exports/99acres/` — raw scrape data

---

*Report generated automatically by ESTRA Glimmora backend pipeline.*
