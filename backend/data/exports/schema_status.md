# Area Intelligence DB — Schema Status

Snapshot companion to `lead_snapshot.csv`. 43 micro-market rows + 38K property listings underpin this CSV; the file itself is a stratified 1,000-row sample.

**Legend:**
- ✅ Real — sourced and computed for every row where the area-join works.
- 🟡 Partial — real for some cities, NULL for others due to data sparsity.
- ⏳ Pending — column exists in the schema, no source yet wired; owner and unblocker listed.

## Column state

| Column | State | Fill % | Source / Why pending |
|---|---|---|---|
| `property_id` | ✅ | 100.0% | PropertyListing primary key |
| `source` | ✅ | 100.0% | Scraped sources only (99acres_*, nobroker_*). Kaggle rows excluded from CSV — kept in DB for CAGR trend / baseline imputation. |
| `listing_type` | ✅ | 100.0% | sale or rent |
| `city` | ✅ | 100.0% | Parsed from dataset |
| `locality_text` | ✅ | 100.0% | Raw locality from CSV; used for area match |
| `matched_area` | ✅ | 100.0% | Substring match against target_areas.json |
| `bedrooms` | ✅ | 100.0% | CSV column |
| `bathrooms` | ✅ | 52.8% | CSV column |
| `area_sqft` | ✅ | 99.8% | CSV column |
| `price_inr` | ✅ | 46.7% | Parsed ₹Cr/₹Lac/₹lakh into rupees |
| `price_per_sqft` | ✅ | 46.5% | Computed price/area with outlier bounds |
| `area_median_sale_psf` | 🟡 | 100.0% | Computed from Kaggle sales. NULL for Nagpur/Aurangabad (no Kaggle data). |
| `area_median_rent_psf` | 🟡 | 100.0% | Computed from Pune rental CSV. NULL for Mumbai/Thane/Nashik/Nagpur/Aurangabad (no rental data). |
| `roi_trend_pct` | ✅ | 100.0% | Buy-side ROI composite: historical trend + infra proximity + commercial density + dev news. 0–(trend+5) clamp. Rental yield moved to raw_data_dump. |
| `volatility_index` | 🟡 | 100.0% | CV of ₹/sqft. Real for Pune; partial for Mumbai/Thane/Nashik; NULL for Nagpur/Aurangabad. |
| `rental_demand_strength` | 🟡 | 100.0% | Bucket from rent:sale ratio. 'Insufficient rental data' where rent ≤3. |
| `historical_price_trend_pct` | ⏳ | 100.0% | Needs YoY data. Unblocker: RBI RESIDEX CSV (city-level) or Wayback snapshots (per-area). Owner: Ritesh. |
| `projected_uplift_pct` | ⏳ | 100.0% | Needs historical trend + forward model. Blocked by historical data + Harsh's scoring layer. |
| `projected_downside_pct` | ⏳ | 100.0% | Same as uplift. |
| `top_project_name` | ✅ | 100.0% | Top society/project by listing count (developer_concentration derivation). |
| `top_project_share_pct` | ✅ | 100.0% | Same source. |
| `unique_projects_in_area` | ✅ | 100.0% | Same source. |
| `supply_pressure` | ⏳ | 0.0% | Needs full MahaRERA project registry (JS-rendered; Playwright or XHR reverse-engineering). Owner: Ritesh. |
| `project_score_trend` | ⏳ | 0.0% | Needs Harsh's scoring layer to run first. |
| `legal_regulatory_friction` | ✅ | 100.0% | MahaRERA complaints report. Substring-matched to project names. |
| `suspended_project_count_in_area` | ✅ | 100.0% | MahaRERA suspended/deregistered list. |
| `distressed_asset_signals` | ⏳ | 0.0% | Bank auction portal scrape (IBAPI / SBI auction). Low priority, separate commit. |
| `seismic_zone` | ✅ | 100.0% | IS 1893:2016 per district (Maharashtra CSV). |
| `crime_per_100k` | ✅ | 100.0% | NCRB 2022, city-level (per 100K population). |
| `flood_risk` | ✅ | 100.0% | Maharashtra State Disaster Management Authority, district-level. |
| `livability_schools` | ✅ | 100.0% | OSM Overpass → local PBF parse; count within 1.5 km. |
| `livability_hospitals_or_clinics` | ✅ | 100.0% | Same. |
| `livability_restaurants_or_cafes` | ✅ | 100.0% | Same. |
| `livability_banks_or_atms` | ✅ | 100.0% | Same. |
| `livability_parks_or_gardens` | ✅ | 100.0% | Same. |
| `nearest_railway_station_km` | ✅ | 100.0% | OSM haversine from area centroid. |
| `nearest_airport_km` | ✅ | 100.0% | Same. |
| `nearest_bus_station_km` | ✅ | 100.0% | Same. |
| `nearest_highway_km` | ⏳ | 0.0% | OSM local scraper currently indexes nodes only; highways are OSM ways and need node-location-on-ways indexing. Unblocker: switch osm_local.py to osmium.FileProcessor().with_locations(). Owner: Ritesh, small follow-up. |
| `infra_news_impact` | ✅ | 100.0% | Google News RSS headlines, 8 per area, publication-tagged. |
| `recent_news_sentiment` | ⏳ | 0.0% | LLM sentiment pass at query time. Owner: Arnav. Raw headlines are stored in micro_markets.raw_data_dump.news_items for him to consume. |
| `upcoming_infra_pipeline` | ⏳ | 0.0% | MMRDA / PMRDA / PMC announcement scrape. Unblocked by simple HTTP scrape of public project pages. Owner: Ritesh. |
| `transaction_velocity` | ⏳ | 0.0% | Median days-on-market. Needs listing posting dates Kaggle doesn't expose. Unblocker: monthly 99acres/MagicBricks scrape with date fields. |

## Totals

- Real (✅): 29 columns
- Partial (🟡): 4 columns
- Pending (⏳): 10 columns
- Total columns: 43

## Coverage footnotes

- **Pune** (18 areas): fully populated — roi, volatility, demand all real.
- **Mumbai** (7 areas): sale-side real (volatility); rent data absent → roi NULL.
- **Thane** (4 areas): price metrics imputed from sparse city baseline.
- **Nashik** (5 areas): partial, sparse Kaggle coverage.
- **Nagpur / Aurangabad** (9 areas): price metrics NULL — no Kaggle data.
  OSM, risk, legal, news all populate for every area regardless of Kaggle coverage.

*Generated by `python -m app.workers.export_lead_snapshot`.*