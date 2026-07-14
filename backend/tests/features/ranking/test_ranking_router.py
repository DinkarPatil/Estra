import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.features.property_intelligence.models import PropertyListing

def test_rank_endpoint(client: TestClient, db_session: Session):
    # 1. Seed properties
    p1 = PropertyListing(id="p1", source="test", listing_type="sale", city="Pune", title="Prop 1", price_inr=100)
    p2 = PropertyListing(id="p2", source="test", listing_type="sale", city="Pune", title="Prop 2", price_inr=200)
    db_session.add(p1)
    db_session.add(p2)
    db_session.commit()

    # 2. Call rank
    payload = {
        "property_ids": ["p1", "p2"],
        "preferences": {"roi_target": "high"}
    }
    response = client.post("/ranking/rank", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) == 2
    assert data["items"][0]["property_id"] in ["p1", "p2"]
    assert data["items"][0]["score"] >= 1.0
