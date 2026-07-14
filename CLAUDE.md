@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the **repo-root** orientation. The two halves of the product each have their own deeper guide — read the relevant one before editing that side:

- Backend (FastAPI, Python): [`backend/CLAUDE.md`](backend/CLAUDE.md)
- Frontend (Next.js, TypeScript): [`frontend/CLAUDE.md`](frontend/CLAUDE.md)

## What this repo is

**ESTRA Glimmora** is an AI-powered real-estate decision-support tool for Maharashtra (Pune + Mumbai micro-markets). It is **not** a listings catalogue — the funnel is *area-first*:

```
user query → parsed intent → ranked micro-markets → user picks 3–4 areas
          → ranked properties in those areas → Gemini deep-dive → QA follow-up
```

Two services run side by side:

- `backend/` — FastAPI on `:8000`, SQLite (`backend/glimmora.db`, gitignored), Gemini for intent parsing / explanations / deep-dives / QA. Composition of features lives in `app/orchestrator/`, which exposes the two-stage `POST /orchestrator/areas` (stage 1) and `POST /orchestrator/analyze` (stage 2). Workers (ingestion, cache export, scrapers) under `app/workers/`.
- `frontend/` — Next.js App Router on `:3000`. All data-touching pages are `"use client"`; there is no SSR data-fetching. Pages map 1:1 to the funnel: `/`, `/areas`, `/compare/areas`, `/properties`, `/properties/[id]`, `/orchestrator`, `/auth`.

Working DB and committed JSON caches under `backend/data/cache/` (`normalized_areas.json`, `properties.json`, `deepdives.json`) let teammates boot the API without running scrapers. **If you change `normalize.py`, any `derivations/*.py`, or seed JSON, regen with `python -m app.workers.export_cache` and recommit** — otherwise the running API serves stale data. (Detail in `backend/CLAUDE.md`.)

## Common commands

Backend (`cd backend`, venv active):
- Run API: `uvicorn app.main:app --reload`
- Tests: `pytest` (or `pytest tests/features/<feat>/test_x.py::test_name` for one)
- Reset local DB: delete `backend/glimmora.db` (recreated + reseeded on next boot)
- Regen committed caches: `python -m app.workers.export_cache`

Frontend (`cd frontend`):
- **Use `npm run build && npm run start`**, NOT `npm run dev`. Next 16 + Turbopack dev mode swap-thrashes on machines with < 16 GB RAM (see `frontend/CLAUDE.md`).
- `.env.local` holds `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).

## Cross-cutting gotchas

### Stale Next.js project at the repo root

The repo root contains a leftover `package.json` / `tsconfig.json` / `next.config.ts` / root `node_modules/` from an earlier abandoned attempt. Its tsconfig globs `**/*.tsx`, so running `npm run build` from `/` tries to compile `frontend/app/**/*.tsx` with the wrong path aliases and fails with misleading "no exported member" errors.

**Always `cd frontend` first.** The root files are scheduled for deletion post-demo — do not edit or rely on them.

### Two ROI concepts — don't conflate

`NormalizedAreaIntelligence` carries both:

- `rental_yield_pct` — real rental yield, ~2–4% (India range).
- `roi_composite_pct` — buy-side 3-year total-return proxy, ~10–40%.

User queries like *"10% ROI in 3 years"* are total-return goals — match against `roi_composite_pct`, not yield. The UI shows `roi_composite_pct` as the headline ROI number with `rental_yield_pct` as a small secondary line. Collapsing them was a real bug (commit `eecb485`); keep them separate.

### `SearchCandidate.property` is inlined on the area-first path

Since backend commit `a921e3b`, `/search` candidates carry an inline `property: PropertySummary` populated by the cache-backed area-first retrieval. The frontend reads this instead of round-tripping `/properties/{id}`. If you edit `search/service.py` or `property_retrieval.py`, keep the inlining — losing it blanks the properties UI.

### Branch model

Active development happens on a feature branch (e.g. `mvp`, `backend`). `main` is the PR target. Don't push directly to `main`.

## Where to find things

- Product spec / scope: `Docs/`, `ESTRA Glimmora MVP.docx`, `context.md`.
- Per-side architecture, conventions, "what's remaining": `backend/CLAUDE.md`, `frontend/CLAUDE.md`.
- Auth seeds, env setup, end-to-end smoke test: `README.md`.
