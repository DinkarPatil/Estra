import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.features.area_intelligence.cache import _reset_for_test as reset_area_cache
from app.features.area_intelligence.normalize import NormalizedAreaIntelligence
from app.features.property_intelligence.cache import _reset_for_test as reset_prop_cache
from app.features.search.pipeline import intent_parser


class _FakeModel:
    def __init__(self, payload):
        self._payload = payload

    def generate_content(self, query: str):
        text = json.dumps(self._payload)
        return SimpleNamespace(text=text)


def _install_intent(monkeypatch, payload: dict):
    fake = _FakeModel(payload)
    intent_parser._model = None
    monkeypatch.setattr(intent_parser, "_get_model", lambda: fake)


@pytest.fixture(autouse=True)
def _reset_caches():
    reset_area_cache(None)
    reset_prop_cache(None)
    yield
    reset_area_cache(None)
    reset_prop_cache(None)


class TestAreaSearch:
    def test_area_search_returns_ranked_areas(self, client: TestClient, monkeypatch):
        # 1. Seed area cache
        area1 = NormalizedAreaIntelligence(
            area_name="Kalyani Nagar",
            city="Pune",
            final_area_score=85.0,
            historical_trend_score=80.0,
            uplift_potential_score=90.0,
            downside_risk_score=20.0,
            legal_safety_score=85.0,
            infra_impact_score=80.0,
            market_momentum_score=75.0,
            news_relevance_score=60.0,
            liquidity_demand_score=70.0,
            rental_yield_pct=5.5,
            demand_strength="High",
        )
        area2 = NormalizedAreaIntelligence(
            area_name="Wakad",
            city="Pune",
            final_area_score=72.0,
            historical_trend_score=70.0,
            uplift_potential_score=75.0,
            downside_risk_score=30.0,
            legal_safety_score=80.0,
            infra_impact_score=70.0,
            market_momentum_score=65.0,
            news_relevance_score=50.0,
            liquidity_demand_score=60.0,
            rental_yield_pct=4.2,
            demand_strength="Medium",
        )
        reset_area_cache([area1, area2])

        # 2. Mock intent parser
        _install_intent(
            monkeypatch,
            {
                "location": "Pune",
                "budget_min": None,
                "budget_max": 5_000_000,
                "property_type": "2 BHK",
                "raw_entities": {"roi_target": "high"},
            },
        )

        # 3. Call area search
        response = client.post("/search/areas", json={"query": "2 BHK in Pune under 50L with high ROI"})

        assert response.status_code == 200
        data = response.json()
        assert data["intent"]["location"] == "Pune"
        assert len(data["areas"]) == 2

        # Kalyani Nagar should rank higher
        first = data["areas"][0]
        assert first["area_name"] == "Kalyani Nagar"
        assert first["score"] > 0
        assert "Strong area fundamentals" in first["reasons"][0]

        second = data["areas"][1]
        assert second["area_name"] == "Wakad"
        assert first["score"] > second["score"]
        assert "signals" in second
        assert second["signals"]["demand_strength"] == "Medium"

    def test_area_search_filters_by_city(self, client: TestClient, monkeypatch):
        pune_area = NormalizedAreaIntelligence(
            area_name="Kalyani Nagar",
            city="Pune",
            final_area_score=80.0,
        )
        mumbai_area = NormalizedAreaIntelligence(
            area_name="Bandra",
            city="Mumbai",
            final_area_score=90.0,
        )
        reset_area_cache([pune_area, mumbai_area])

        _install_intent(
            monkeypatch,
            {"location": "Pune", "budget_min": None, "budget_max": None, "property_type": None, "raw_entities": {}},
        )

        response = client.post("/search/areas", json={"query": "flat in Pune"})
        assert response.status_code == 200
        areas = response.json()["areas"]
        assert len(areas) == 1
        assert areas[0]["area_name"] == "Kalyani Nagar"

    def test_area_search_empty_pool(self, client: TestClient, monkeypatch):
        reset_area_cache([])
        _install_intent(
            monkeypatch,
            {"location": "Nashik", "budget_min": None, "budget_max": None, "property_type": None, "raw_entities": {}},
        )

        response = client.post("/search/areas", json={"query": "flat in Nashik"})
        assert response.status_code == 200
        assert response.json()["areas"] == []


class TestPropertySearchWithAreaFilter:
    def test_filters_to_selected_areas(self, client: TestClient, monkeypatch):
        # 1. Seed caches
        area = NormalizedAreaIntelligence(
            area_name="Aundh",
            city="Pune",
            final_area_score=80.0,
            rental_yield_pct=7.0,
            demand_strength="High",
            uplift_potential_score=75.0,
        )
        reset_area_cache([area])

        props = [
            {
                "id": "prop-a1",
                "source": "test",
                "listing_type": "sale",
                "city": "Pune",
                "locality_text": "Aundh, Pune",
                "title": "2 BHK in Aundh",
                "bedrooms": 2,
                "price_inr": 4_500_000.0,
            },
            {
                "id": "prop-b1",
                "source": "test",
                "listing_type": "sale",
                "city": "Pune",
                "locality_text": "Baner, Pune",
                "title": "2 BHK in Baner",
                "bedrooms": 2,
                "price_inr": 5_000_000.0,
            },
        ]
        reset_prop_cache(props)

        # 2. Mock intent
        _install_intent(
            monkeypatch,
            {
                "location": "Pune",
                "budget_min": None,
                "budget_max": 5_000_000,
                "property_type": "2 BHK",
                "raw_entities": {"bhk": 2},
            },
        )

        # 3. Call property search with selected area
        response = client.post(
            "/search",
            json={
                "query": "2 BHK in Pune under 50L",
                "area_names": ["Aundh"],
            },
        )

        assert response.status_code == 200
        data = response.json()
        candidates = data["candidates"]

        # Only Aundh property should appear
        assert len(candidates) == 1
        assert candidates[0]["property_id"] == "prop-a1"
        assert candidates[0]["score"] > 1.0  # boosted by area score
        assert any("High rental yield" in r for r in candidates[0]["reasons"])

    def test_no_area_names_uses_db_path(self, client: TestClient, db_session, monkeypatch):
        # This verifies the original DB path still works when area_names is absent
        from app.features.property_intelligence.models import PropertyListing
        from app.features.area_intelligence.models import MicroMarket

        p1 = PropertyListing(
            id="db-prop1",
            source="test",
            listing_type="sale",
            city="Mumbai",
            locality_text="Bandra",
            title="2 BHK in Bandra",
            price_inr=10_000_000,
            bedrooms=2,
        )
        m1 = MicroMarket(name="Bandra", city="Mumbai", roi_trend_pct=15.0, projected_uplift_pct=10.0)
        db_session.add(p1)
        db_session.add(m1)
        db_session.commit()

        _install_intent(
            monkeypatch,
            {
                "location": "Mumbai",
                "budget_min": None,
                "budget_max": 12_000_000,
                "property_type": "2 BHK",
                "raw_entities": {"bhk": 2},
            },
        )

        response = client.post("/search", json={"query": "2 BHK in Mumbai under 1.2 cr"})
        assert response.status_code == 200
        data = response.json()
        candidates = data["candidates"]
        assert len(candidates) == 1
        assert candidates[0]["property_id"] == "db-prop1"
