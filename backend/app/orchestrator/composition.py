import hashlib
import json
import time

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.features.compliance import service as compliance_service
from app.features.compliance.schemas import ComplianceRequest
from app.features.geo_risk import service as geo_risk_service
from app.features.ranking import service as ranking_service
from app.features.ranking.schemas import RankRequest
from app.features.roi import service as roi_service
from app.features.roi.schemas import RoiRequest
from app.features.search import service as search_service
from app.features.search.schemas import SearchRequest
from app.orchestrator.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    AreasRequest,
    AreasResponse,
)

log = get_logger("orchestrator")

# ── In-process TTL cache ────────────────────────────────────────────────────
# Back-navigation through the funnel (areas → properties → compare → back)
# was re-running the full pipeline on every page mount, burning ~6 LLM calls
# per /analyze and ~2 per /areas. Cache identical requests for a short TTL so
# repeat hits during a single user session return instantly.
_CACHE_TTL_SECONDS = 600  # 10 min — covers a typical demo session
_areas_cache: dict[str, tuple[float, AreasResponse]] = {}
_analyze_cache: dict[str, tuple[float, AnalyzeResponse]] = {}


def _cache_key(payload: dict) -> str:
    """Stable hash over a request payload. Sorts keys / lists for determinism."""
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, default=str).encode("utf-8")
    ).hexdigest()


def _cache_get(cache: dict, key: str):
    entry = cache.get(key)
    if entry is None:
        return None
    ts, response = entry
    if time.time() - ts > _CACHE_TTL_SECONDS:
        cache.pop(key, None)
        return None
    return response


def _cache_set(cache: dict, key: str, response) -> None:
    cache[key] = (time.time(), response)


def analyze_areas(body: AreasRequest) -> AreasResponse:
    """Stage 1 of the area-first flow — rank micro-markets for the query.

    The frontend shows the top-N areas with explanations and lets the user
    pick 3–4. Those selected names are then passed back as ``area_names``
    into :func:`analyze` for the property-level pass.
    """
    cache_key = _cache_key({"query": body.query})
    cached = _cache_get(_areas_cache, cache_key)
    if cached is not None:
        log.info("analyze_areas cache hit")
        return cached

    log.info("analyze_areas start", extra={"query_len": len(body.query)})
    resp = search_service.run_area_search(SearchRequest(query=body.query))
    log.info("analyze_areas done", extra={"n_areas": len(resp.areas)})
    response = AreasResponse(intent=resp.intent, areas=resp.areas)
    _cache_set(_areas_cache, cache_key, response)
    return response


def analyze(db: Session, body: AnalyzeRequest) -> AnalyzeResponse:
    """Run the full MVP pipeline chain: search → rank → roi/risk/compliance.

    When ``body.area_names`` is provided, the search stage runs the
    area-first property path (stage 2) and restricts candidates to those
    localities. Otherwise the flat DB-backed search path is used.

    Partial failure is handled gracefully — if a downstream service fails,
    the response still contains whatever succeeded, plus error details.
    """
    cache_key = _cache_key({
        "query": body.query,
        "area_names": sorted(body.area_names or []),
        "horizon_years": body.horizon_years,
        "buyer_country": body.buyer_country,
    })
    cached = _cache_get(_analyze_cache, cache_key)
    if cached is not None:
        log.info("analyze cache hit")
        return cached

    log.info(
        "analyze start",
        extra={
            "query_len": len(body.query),
            "area_first": bool(body.area_names),
            "n_areas_selected": len(body.area_names) if body.area_names else 0,
        },
    )

    # 1. Search (required — if this fails, the whole pipeline fails)
    try:
        search = search_service.run_search(
            db,
            SearchRequest(query=body.query, area_names=body.area_names),
        )
        candidate_ids = [c.property_id for c in search.candidates]
    except Exception:
        log.exception("analyze failed at search stage")
        raise

    # 2. Ranking (optional — graceful failure)
    ranking = None
    try:
        ranking = ranking_service.rank(
            db, RankRequest(property_ids=candidate_ids, preferences={})
        )
    except Exception:
        log.exception("analyze: ranking stage failed, continuing without it")

    # 3. ROI (optional — per-property, skip failures)
    roi = []
    for pid in candidate_ids:
        try:
            roi.append(
                roi_service.compute(
                    RoiRequest(property_id=pid, horizon_years=body.horizon_years)
                )
            )
        except Exception:
            log.warning("analyze: roi failed for %s", pid, exc_info=True)

    # 4. Geo risk (optional — per-property, skip failures)
    geo = []
    for pid in candidate_ids:
        try:
            geo.append(geo_risk_service.summarize(db, pid))
        except Exception:
            log.warning("analyze: geo_risk failed for %s", pid, exc_info=True)

    # 5. Compliance (optional — per-property, skip failures)
    compliance = []
    for pid in candidate_ids:
        try:
            compliance.append(
                compliance_service.screen(
                    ComplianceRequest(property_id=pid, buyer_country=body.buyer_country)
                )
            )
        except Exception:
            log.warning("analyze: compliance failed for %s", pid, exc_info=True)

    log.info("analyze done", extra={
        "n_candidates": len(candidate_ids),
        "ranking_ok": ranking is not None,
        "n_roi": len(roi),
        "n_geo": len(geo),
        "n_compliance": len(compliance),
    })

    response = AnalyzeResponse(
        search=search,
        ranking=ranking,
        roi=roi,
        geo_risk=geo,
        compliance=compliance,
    )
    _cache_set(_analyze_cache, cache_key, response)
    return response
