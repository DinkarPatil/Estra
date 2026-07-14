import asyncio
import sys
from contextlib import asynccontextmanager

# Windows: uvicorn's default asyncio loop is SelectorEventLoop, which does NOT
# support subprocess transports. Playwright spawns Chromium as a subprocess and
# fails with NotImplementedError on Selector. Force Proactor before any async
# code (uvicorn, FastAPI, Playwright) imports the loop.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.features  # noqa: F401  — registers every feature's models on Base.metadata
from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.core.migrations import run_migrations
from app.features.auth.router import router as auth_router
from app.features.auth.seed import seed_users
from app.features.area_intelligence.router import router as area_intelligence_router
from app.features.area_intelligence.seed import seed_area_intelligence
from app.features.billing.router import router as billing_router
from app.features.compliance.router import router as compliance_router
from app.features.property_intelligence.seed import seed_property_intelligence
from app.features.deals.router import router as deals_router
from app.features.geo_risk.router import router as geo_risk_router
from app.features.property_intelligence.router import router as property_router
from app.features.ranking.router import router as ranking_router
from app.features.roi.router import router as roi_router
from app.features.search.router import router as search_router
from app.features.broker.router import router as broker_router
from app.features.broker.seed import seed_broker_listings, seed_leads
from app.features.recommendation.router import router as recommendation_router
from app.features.realtime_scrape.router import router as realtime_router
from app.orchestrator.router import router as orchestrator_router

log = get_logger("app.main")


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    run_migrations()
    Base.metadata.create_all(bind=engine)
    seed_users()
    seed_property_intelligence()
    seed_area_intelligence()
    from app.core.database import SessionLocal as _SessionLocal
    _broker_session = _SessionLocal()
    try:
        seed_leads(_broker_session)
        seed_broker_listings(_broker_session)
    finally:
        _broker_session.close()
    # Load in-memory JSON caches for area-first search flow
    from app.features.area_intelligence.cache import load as load_area_cache
    from app.features.property_intelligence.cache import load as load_prop_cache
    from app.features.property_intelligence.cache_deepdive import load as load_deepdive_cache
    load_area_cache()
    load_prop_cache()
    load_deepdive_cache()
    log.info("startup complete")
    yield


app = FastAPI(
    title="Glimmora Estra API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.FRONTEND_URL.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth_router)
app.include_router(billing_router)
app.include_router(area_intelligence_router)
app.include_router(search_router)
app.include_router(property_router)
app.include_router(ranking_router)
app.include_router(broker_router)
app.include_router(roi_router)
app.include_router(geo_risk_router)
app.include_router(compliance_router)
app.include_router(deals_router)
app.include_router(recommendation_router)
app.include_router(realtime_router)
app.include_router(orchestrator_router)


@app.get("/")
def root():
    return {"message": "Glimmora Estra API", "docs": "/docs"}
