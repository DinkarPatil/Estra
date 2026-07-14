import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.features.area_intelligence.models import MicroMarket
from app.features.property_intelligence.models import PropertyListing
from app.features.search.pipeline import intent_parser


class _FakeModel:
    def __init__(self, payload):
        self._payload = payload

    def generate_content(self, query: str):
        text = json.dumps(self._payload)
        return SimpleNamespace(text=text)


def test_full_search_pipeline(client: TestClient, db_session: Session, monkeypatch):
    # 1. Seed data
    p1 = PropertyListing(
        id="prop1",
        source="test",
        listing_type="sale",
        city="Mumbai",
        locality_text="Bandra",
        title="Beautiful 2 BHK in Bandra",
        price_inr=10000000,
        bedrooms=2,
    )
    p2 = PropertyListing(
        id="prop2",
        source="test",
        listing_type="sale",
        city="Mumbai",
        locality_text="Andheri",
        title="Cosy 1 BHK in Andheri",
        price_inr=5000000,
        bedrooms=1,
    )
    db_session.add(p1)
    db_session.add(p2)

    m1 = MicroMarket(
        name="Bandra",
        city="Mumbai",
        roi_trend_pct=15.0,
        projected_uplift_pct=10.0,
    )
    db_session.add(m1)
    db_session.commit()

    # 2. Mock LLM
    fake = _FakeModel(
        {
            "location": "Mumbai",
            "budget_min": None,
            "budget_max": 12000000,
            "property_type": "2 BHK",
            "raw_entities": {"bhk": 2},
        }
    )
    # Ensure intent_parser._model is reset and mocked
    intent_parser._model = None
    monkeypatch.setattr(intent_parser, "_get_model", lambda: fake)

    # 3. Call search endpoint
    response = client.post("/search", json={"query": "2 BHK in Mumbai under 1.2 cr"})

    assert response.status_code == 200
    data = response.json()

    assert data["intent"]["location"] == "Mumbai"
    assert data["intent"]["budget_max"] == 12000000
    
    # We expect prop1 to be found and ranked high
    candidates = data["candidates"]
    assert len(candidates) > 0
    
    # prop1 matches 2 BHK (via title) and budget
    # prop2 does NOT match 2 BHK (it's 1 BHK)
    
    found_p1 = next((c for c in candidates if c["property_id"] == "prop1"), None)
    assert found_p1 is not None
    assert found_p1["score"] > 1.0  # Should have boost from MicroMarket
    
    # Verify prop2 is NOT in candidates (because of filters)
    found_p2 = next((c for c in candidates if c["property_id"] == "prop2"), None)
    assert found_p2 is None
