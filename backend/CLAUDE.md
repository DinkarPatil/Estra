# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Scope: this file covers the **FastAPI backend** in `backend/`. The repo root also hosts a Next.js frontend with its own AGENTS.md — don't conflate the two. Work in this tree is done on the `backend` branch.

## Commands

All commands assume `cd backend` with the venv activated (`source venv/bin/activate`).

- Run the API with autoreload: `uvicorn app.main:app --reload` (listens on `:8000`, Swagger at `/docs`).
- Run the full test suite: `pytest`
- Run a single test file: `pytest tests/features/property_intelligence/test_router.py`
- Run a single test by node id: `pytest tests/features/auth/test_login.py::test_login_returns_tokens`
- Run the area-intelligence ingestion worker ad-hoc: `python -m app.workers.ingestion`
- Reset local DB: delete `backend/glimmora.db`. Schema is recreated and re-seeded on next boot.
- Regenerate seed files after a fresh ingest: `python -m app.workers.export_seed` (writes `data/seed/micro_markets.json` + `data/seed/property_listings.csv`).

`.env` is loaded by `app/core/config.py` via `python-dotenv` + `pydantic-settings`. See `.env.example` for the full surface (JWT, DB URL, seed admin creds).

## Architecture

### Feature-sliced layout

The backbone is `app/features/<feature>/` — each feature owns its own vertical slice and is largely self-contained:

```
app/features/<feature>/
  models.py       # SQLAlchemy models (only when the feature persists data)
  schemas.py      # Pydantic request/response DTOs
  service.py      # Business logic — pure functions that take a Session
  router.py       # FastAPI APIRouter; thin — delegates to service
  pipeline/       # Multi-step processing stages (e.g. enrichment, retrieval)
  seed.py         # Optional: idempotent seed run from lifespan
  dependencies.py # Optional: FastAPI dependencies scoped to this feature
```

Current features: `auth`, `search`, `property_intelligence`, `ranking`, `roi`, `geo_risk`, `compliance`, `deals`, `area_intelligence`. Features without persistent data (`ranking`, `roi`, `geo_risk`, `compliance`) have no `models.py`.

`app/core/` holds cross-cutting infra only: `config.py` (settings), `database.py` (engine/`Base`/`get_db`), `security.py` (JWT encode/decode), `dependencies.py` (shared FastAPI deps like `Pagination`), `exceptions.py` (domain errors), `logging.py`, `migrations.py`.

`app/orchestrator/` composes feature services into the end-to-end analyze pipeline (`search → rank → roi/risk/compliance`). The composition lives in `orchestrator/composition.py` and calls each feature's `service.py`; `orchestrator/router.py` exposes two endpoints that together implement the **area-first two-stage flow**:

- `POST /orchestrator/areas` — stage 1. Runs `analyze_areas` → `search_service.run_area_search`. Parses the user query, ranks Maharashtra micro-markets, and returns the top-N with per-area explanations for the user to choose from.
- `POST /orchestrator/analyze` — stage 2 (area-first) or flat fallback. `AnalyzeRequest.area_names` is the handoff field: when set, the orchestrator threads it through to `SearchRequest(area_names=...)`, which drives the **DB-backed `property_retrieval_db`** path (properties restricted to the user-chosen localities, sourced from the `BrokerListing` table). When omitted, the same DB path runs without the area filter. Downstream stages (ranking, ROI per property, geo-risk per property, compliance per property) are wrapped in per-stage try/except so a single downstream failure does not break the response — the payload returns whatever succeeded.

  Both `/orchestrator/areas` and `/orchestrator/analyze` are wrapped in an in-process TTL cache (10 min, keyed on the request body) in `composition.py`. Repeat hits during a single user session — back-navigation through the funnel — return instantly without re-running the LLM stages. Restart uvicorn to clear.

`app/workers/` holds batch/background jobs (`ingestion.py`, `cache_warmup.py`, `reindex.py`, `scoring_refresh.py`). Each exposes `run()` and can be invoked with `python -m app.workers.<name>`.

### Adding a new feature

1. Create `app/features/<feature>/` with `models.py` (if persistent), `schemas.py`, `service.py`, `router.py`.
2. **Register models on `Base.metadata`** by adding `from app.features.<feature> import models as _<feature>_models  # noqa: F401` to `app/features/__init__.py`. Without this, `Base.metadata.create_all` at startup won't know about the tables.
3. Register the router in `app/main.py` (both the import and `app.include_router(...)`).
4. If the feature needs seeded data, add a `seed.py` that is idempotent (guard with a `count() > 0` check like `property_intelligence/seed.py`) and call it from `main.py`'s `lifespan`.

### Schema evolution

There are two mechanisms that cooperate at startup (see `app/main.py` `lifespan`):

- **`Base.metadata.create_all`** creates any *new* tables on first boot. This is how new feature tables land. It does NOT alter existing tables.
- **`app/core/migrations.py`** is a hand-written migration runner keyed on a `schema_version` table. Use it for any change that `create_all` cannot express (column additions, index changes, backfills). Add a new `if current_version < N:` block, bump the inserted version, and commit.

Do not reach for Alembic — the project deliberately uses this minimal scheme.

### Area-intelligence seeding

`backend/glimmora.db` is gitignored (locally-mutating working DB). On first boot, `app/features/area_intelligence/seed.py` hydrates `micro_markets` (43 rows) and the displayable `property_listings` (~430 99acres rows) from committed seed files at `backend/data/seed/`. Kaggle vintage rows (`kaggle_*` sources) are excluded from the seed — they exist in the full working DB for baseline CAGR computation but are not user-facing data and can be repopulated by running `python -m app.workers.load_kaggle_listings --force` if needed.

Teammates pulling a fresh clone only need to `uvicorn app.main:app --reload` — no scraper runs, no manual import. Seed is idempotent: skips if `micro_markets` already has rows.

### Auth model

JWT access + refresh tokens, signed HS256 with `SECRET_KEY`. Bearer scheme via `HTTPBearer` in `features/auth/dependencies.py`:

- `get_current_user` — resolves the `User`, validates token type is `access`, and checks the `jti` against the `blocked_tokens` table (populated by logout).
- `require_role("admin", ...)` — role-gated dependency factory.

Token revocation is database-backed via `blocked_tokens` (created by migration 1). Logout inserts the `jti`; subsequent requests with that token are rejected.

### Domain errors

Raise subclasses of `app.core.exceptions.DomainError` (`NotFoundError`, `ConflictError`, `AuthError`, `ForbiddenError`) from service code. The global handler registered in `register_exception_handlers` converts them to `JSONResponse` with the right status. Do not reach for `HTTPException` inside services — keep that in routers when the mapping is trivially HTTP-shaped.

### Logging

Use `get_logger("feature.module")` for ordinary logs and `get_pipeline_logger("search.intent")` inside `pipeline/` stages (it prefixes with `pipeline.` so pipeline activity is filterable). `configure_logging()` runs once from `lifespan`; tests don't need to call it.

### Tests

`tests/conftest.py` swaps the DB engine for an in-memory SQLite with a `StaticPool` and overrides `get_db`. The `setup_database` fixture is `autouse=True` and drops+recreates all tables between tests, so tests are fully isolated. Two fixtures to reach for:

- `client` — a `TestClient(app)` for HTTP-level tests.
- `db_session` — a `Session` for seeding fixtures without going through HTTP.

Tests live in `tests/features/<feature>/` mirroring the app layout.

## Conventions worth knowing

- Keep routers thin — they should parse the request, call one `service.*` function, and return. Business logic, joins, and branching belong in `service.py`.
- Services take a `Session` as their first arg (except for feature pipelines that are pure). Do not import `SessionLocal` in services; receive the session from the router via `Depends(get_db)`.
- Seeds must be idempotent. The lifespan runs on every boot.
- SQLite-specific concessions in `database.py` (`check_same_thread=False`) are intentional for the MVP — do not generalise without a plan to move off SQLite.

## Project context — ESTRA Glimmora MVP (Maharashtra, area-first)

The product is **decision-support, not a listings catalogue**. The lead's flow (Harsh, locked 2026-04-22) is area-first: user query → parsed intent → ranked micro-markets → user picks 3–4 → ranked properties in those areas → deep-dive → QA follow-up. Backend must serve this two-stage handoff cleanly.

**Phase scope**: Maharashtra only (Pune + Mumbai micro-markets), ~43 areas seeded. Scraping sources: 99acres (listings + quarterly SSR trends), MahaRERA (project registry, complaints, suspensions), Google News RSS (infra/news sentiment), OSM local PBF (POI proximity), Kaggle vintage listings (baseline CAGR only — not user-facing).

**Team execution order** (from Harsh's plan, 21–27 Apr):
1. ✅ Area-wise ingestion pipeline — Ritesh (this repo's owner), 23 Apr
2. ✅ Normalize into structured area intelligence — Pooja, 24 Apr (landed in `features/area_intelligence/normalize.py`)
3. ✅ Weighted area scores — Harsh, 24 Apr (landed in `normalize._weighted_final` + `DEFAULT_WEIGHTS`)
4. ✅ LLM query interpretation — Arnav, 21 Apr (`features/search/pipeline/intent_parser.py`, Gemini-backed with heuristic fallback)
5. ✅ Area shortlisting + explanations — Arnav, 24 Apr (`features/search/pipeline/area_explanation.py` — 6-point Why / Recent / Attractive / Risk / Outlook / Confidence)
6. ✅ Property scrapers + ranking — Ritesh + Harsh, 24 Apr. Originally 99acres v2 scraper + cache-backed `property_retrieval` + `ranking.scoring_cache`; the live path has since been **replaced with a DB-first flow** sourced from the `BrokerListing` table (`property_retrieval_db.py`). The cache-backed `property_retrieval.py` and `scoring_cache.py` files still exist but are dead code — the search service no longer routes through them. Ranking still uses `scoring.py` (DB-backed), which falls through to `scoring_cache.run` only if the DB returns nothing.
7. ✅ Deep-dive property intelligence — Arnav + Ritesh, 26 Apr (`property_intelligence/deepdive_service.py` — async Gemini, cached in `data/cache/deepdives.json`)
8. ✅ **QA bot — Ritesh + Pooja, 27 Apr** (`property_intelligence/qa_service.py` + `POST /properties/{id}/qa`). Loads the property's deep-dive (cache-hit in practice), serializes property + area signals + all 7 sections + verdict/thesis/action items into the Gemini system prompt, and answers grounded follow-ups. Uses `settings.QA_MODEL` (default `gemini-2.5-flash-lite`). Accepts optional `history: [{role, text}]` for follow-ups — last 8 turns are folded into the prompt. Returns `{answer, source}`. If the key is missing or the call fails, drops to a keyword-driven fallback that mirrors the frontend's client-side parser and tags `source` with `(offline)` so the UI can indicate degraded mode.
9. ✅ Orchestrator integration — Harsh, 27 Apr (`app/orchestrator/` with two-stage `/areas` + `/analyze` endpoints)

### Area intelligence schema — two ROI concepts

`NormalizedAreaIntelligence` carries **both** yield flavours; don't conflate them:

- `rental_yield_pct` → real yield `(median_rent_psf_month × 12) / median_sale_psf × 100`. Indian range 2–4%. Sourced from `raw.rental_yield_pct` → `price_metrics.rental_yield_pct` (fallback chain deliberately stops there).
- `roi_composite_pct` → buy-side 3Y total-return proxy = `historical_trend_pct + infra_bonus + commercial_bonus + news_bonus`, clamped to `[0, trend + 5]`. Typical range 10–40%. Sourced from `raw.roi_trend_pct` (which is what `compute_roi_composite` writes during ingestion).

User queries like *"10% ROI in 3 years"* are total-return goals — match them against `roi_composite_pct`, not yield. `cache.rank_for_intent` does this correctly. Previously these two concepts were collapsed into the single `rental_yield_pct` field (inherited from an earlier data model), which inflated UI-displayed yields to 30%+; the split commit is `eecb485`.

### Data caches — regenerate after touching ingestion logic

Two JSON caches live under `backend/data/cache/` and are **committed to git** so teammates can boot without running scrapers:

- `normalized_areas.json` — 43 `NormalizedAreaIntelligence` rows consumed by `area_intelligence.cache`
- `properties.json` — ~430 cached listings consumed by `property_intelligence.cache`
- `deepdives.json` — Gemini-generated reports, keyed by `property_id`

Regenerate both with `python -m app.workers.export_cache`. If you modify `normalize.py`, a `derivations/*.py` file, or the seed JSON, you MUST regen and recommit the cache file — otherwise the running API serves stale data.

### `/search` response shape — `candidates[].property` is inlined

Since `a921e3b`, `SearchCandidate` carries an optional `property: PropertySummary` field populated inline. The frontend reads this instead of round-tripping to `/properties/{id}` for every row. Today the live `property_retrieval_db.py` always inlines a `PropertySummary` built from the `BrokerListing` row. When editing `search/service.py` or `property_retrieval_db.py`, keep the inlining in place or the UI goes blank.

`SearchCandidate.score` was hard-coded to `1.0` in the original cache-backed path and inherited by the DB-backed replacement; the frontend reads this directly as `aiScore` and rendered "1/100" on the compare page. Fixed in `property_retrieval_db.py` to use the matched area's `final_area_score` (0–100) when available, with a neutral 50 fallback when locality fuzzy-match misses.

## What's remaining

### Near-term (pre-demo-day)
- **Compare-areas AI narrative** — `/compare/areas` currently reuses per-area AI reasons but has no dedicated head-to-head LLM narrative. A new `POST /search/areas/compare` that takes 2–3 area names + intent and returns `{winner, tl_dr, axes[]}` would close this gap. ~1 hour.
- **ROI composite calibration** — `roi_composite.py` openly labels itself v1 heuristic with uncalibrated constants. Pick up once there's user-feedback data.

### Nice-to-have
- **MahaRERA project-search** (supply_pressure + real developer concentration) — scraper stubbed, waits on XHR reverse-engineering or Playwright (flagged in `_scrape_area` as a `TODO(ritesh)`).
- **Upcoming infra pipeline** field is currently always `None` — waiting on MMRDA/PMRDA announcement scrape.
- **Auth `country` field** is required on register but there's no UI flow for non-India users — consider defaulting or removing.
- **Alembic vs hand-rolled migrations** — deliberate minimal scheme today, but will not scale past ~migration 20 without painful rollback stories.

### Known stale config
- `app/core/config.py` hardcodes `GEMINI_API_KEY` as a default (line ~16). Move to `.env` before any public repo push. Same for `USE_AI_AREA_EXPLANATIONS=True` — fine locally, but the flag is meant to gate Gemini cost in prod.
