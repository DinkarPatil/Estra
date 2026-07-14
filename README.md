# Estra Glimmora

AI-powered real-estate intelligence platform for Maharashtra (Pune + Mumbai micro-markets). Decision-support, not a listings catalogue — the funnel is **area-first**: query → ranked areas → user picks 3–4 → ranked properties → Gemini deep-dive → QA follow-up.

Two halves run side by side:

- **Frontend** — Next.js (App Router) in the repo root (`src/`).
- **Backend** — FastAPI in [backend/](backend/), SQLite/Postgres, Gemini (Vertex AI).

---

## Prerequisites

- Python 3.11+
- Node.js 20+
- npm (or pnpm / yarn / bun)
- A Gemini API key (free tier is fine — get one at https://aistudio.google.com/apikey). Optional: leave blank and the AI features run in offline-fallback mode.

---

## 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then edit .env and set GEMINI / GCP creds
uvicorn app.main:app --reload
```

Backend runs on **http://localhost:8000**. Swagger UI at **http://localhost:8000/docs**.

On first boot the app:

- creates the SQLite DB at `backend/glimmora.db` (or connects to Postgres if `DATABASE_URL` is set)
- runs schema migrations
- seeds two accounts (override in `.env`):

  | Role       | Email                      | Password        |
  | ---------- | -------------------------- | --------------- |
  | superadmin | `superadmin@glimmora.ai`   | `superadmin123` |
  | admin      | `admin@glimmora.ai`        | `admin123`      |

- hydrates micro-markets and property listings from committed seed files at `backend/data/seed/`
- loads the AI caches (`normalized_areas.json`, `properties.json`, `deepdives.json`) from `backend/data/cache/`

**No scrapers run on first boot.** All ingestion data is committed — you do not need to run Kaggle imports, 99acres scrapes, or OSM downloads to get a working API.

To reset the local DB, delete `backend/glimmora.db` and restart `uvicorn`.

### Backend tests

```bash
cd backend
source venv/bin/activate
pytest                                      # all tests
pytest tests/features/auth/test_login.py    # one file
```

---

## 2. Frontend

In a second terminal, from the repo root:

```bash
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**. It expects the backend at `http://localhost:8000` — set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if different.

> **Avoid `npm run dev`** on machines with < 16 GB RAM — Next 16 + Turbopack dev mode swap-thrashes. Use `npm run build && npm run start` instead (production server runs ~200–400 MB steady-state).

---

## 3. Verify end-to-end

1. Open http://localhost:3000, type a query like *"3BHK in Pune under 1.5cr with 10% ROI in 3 years"*.
2. Land on `/areas` — pick 3–4 micro-markets.
3. Land on `/properties` — see ranked listings inside those areas.
4. Open a deep-dive — Gemini-generated 7-section report + QA panel.

You can also sign in at `/auth` with the seeded admin (`admin@glimmora.ai` / `admin123`) or register a fresh user.

---

## Project layout

```
.
├── src/                  # Next.js App Router — pages, components, contexts
│   ├── app/              # App Router routes
│   ├── components/
│   ├── lib/api/          # HTTP client + typed endpoint calls
│   └── lib/auth/         # token storage + role mapping
├── backend/              # FastAPI — see backend/CLAUDE.md
│   ├── app/
│   │   ├── main.py       # FastAPI bootstrap + migrations + seeding
│   │   ├── core/         # config, database, JWT, logging, migrations
│   │   ├── features/     # auth, search, area_intelligence, property_intelligence, ranking, roi, geo_risk, compliance, deals, billing, broker, recommendation, realtime_scrape
│   │   ├── orchestrator/ # two-stage area-first composition
│   │   └── workers/      # ingestion, export_cache, scrapers
│   ├── data/
│   │   ├── seed/         # micro_markets.json, property_listings.csv (committed)
│   │   └── cache/        # normalized_areas.json, properties.json, deepdives.json (committed)
│   └── tests/
├── Docs/                 # SOW, MVP spec, design docs
├── CLAUDE.md             # Repo orientation for Claude Code
└── README.md
```

---

## Troubleshooting

- **`GEMINI_API_KEY` is blank** — deep-dive and QA endpoints still work, but use template fallbacks and tag responses with `(offline)`. Set the key in `backend/.env` and restart.
- **Port 8000 / 3000 already in use** — change with `uvicorn app.main:app --reload --port 8001` and update `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.
- **Stale data after editing ingestion code** — if you modify `backend/app/features/area_intelligence/normalize.py` or any `derivations/*.py`, regen the committed caches: `python -m app.workers.export_cache` and recommit.

For deeper architecture and conventions, see [`backend/CLAUDE.md`](backend/CLAUDE.md) and [`CLAUDE.md`](CLAUDE.md).
