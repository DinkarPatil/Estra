import json
from datetime import datetime

from app.models.property import Property

from tests.conftest import TestingSessionLocal, client


# --- helpers ---

def _make_property(**overrides):
    base = dict(
        id="prop-test-001",
        title="Test Villa",
        description="A test property",
        city="Dubai",
        state=None,
        country="United Arab Emirates",
        country_code="AE",
        neighborhood="Marina",
        lat=25.0,
        lng=55.0,
        price=1_000_000.0,
        currency="USD",
        type="residential",
        sub_type="Villa",
        bedrooms=3,
        bathrooms=2,
        area=2000.0,
        area_unit="sqft",
        year_built=2020,
        developer="Test Dev",
        ai_score=85,
        rental_yield=5.0,
        capital_appreciation=8.0,
        risk_score="low",
        images=json.dumps(["https://example.com/a.jpg"]),
        features=json.dumps(["Pool", "Garden"]),
        status="available",
        is_luxury=True,
        is_fractional=False,
        created_at=datetime(2024, 1, 1),
    )
    base.update(overrides)
    return Property(**base)


def _seed(*props):
    db = TestingSessionLocal()
    try:
        for p in props:
            db.add(p)
        db.commit()
    finally:
        db.close()


# --- tests ---

class TestListProperties:
    def test_empty_list(self):
        response = client.get("/properties")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["limit"] == 20
        assert data["offset"] == 0

    def test_returns_all(self):
        _seed(
            _make_property(id="p1", title="Villa 1"),
            _make_property(id="p2", title="Villa 2"),
        )
        response = client.get("/properties")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert {p["id"] for p in data["items"]} == {"p1", "p2"}

    def test_filter_by_city(self):
        _seed(
            _make_property(id="p1", city="Dubai"),
            _make_property(id="p2", city="Singapore"),
        )
        response = client.get("/properties?city=Dubai")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["location"]["city"] == "Dubai"

    def test_filter_by_type(self):
        _seed(
            _make_property(id="p1", type="residential"),
            _make_property(id="p2", type="commercial"),
        )
        response = client.get("/properties?type=residential")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["type"] == "residential"

    def test_filter_by_status(self):
        _seed(
            _make_property(id="p1", status="available"),
            _make_property(id="p2", status="sold"),
        )
        response = client.get("/properties?status=available")
        assert response.json()["total"] == 1

    def test_filter_by_country_code(self):
        _seed(
            _make_property(id="p1", country_code="AE"),
            _make_property(id="p2", country_code="GB"),
        )
        response = client.get("/properties?country_code=AE")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["location"]["countryCode"] == "AE"

    def test_filter_by_risk_score(self):
        _seed(
            _make_property(id="p1", risk_score="low"),
            _make_property(id="p2", risk_score="high"),
        )
        response = client.get("/properties?risk_score=high")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["riskScore"] == "high"

    def test_filter_by_price_range(self):
        _seed(
            _make_property(id="p1", price=500_000),
            _make_property(id="p2", price=2_000_000),
            _make_property(id="p3", price=5_000_000),
        )
        response = client.get("/properties?min_price=1000000&max_price=3000000")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["id"] == "p2"

    def test_filter_by_min_yield(self):
        _seed(
            _make_property(id="p1", rental_yield=3.0),
            _make_property(id="p2", rental_yield=6.0),
        )
        response = client.get("/properties?min_yield=5")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["id"] == "p2"

    def test_combined_filters(self):
        _seed(
            _make_property(id="p1", type="residential", city="Dubai", risk_score="low"),
            _make_property(id="p2", type="commercial", city="Dubai", risk_score="low"),
            _make_property(id="p3", type="residential", city="London", risk_score="low"),
        )
        response = client.get("/properties?type=residential&city=Dubai")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["id"] == "p1"

    def test_pagination(self):
        _seed(*[_make_property(id=f"p{i}") for i in range(5)])
        response = client.get("/properties?limit=2&offset=2")
        data = response.json()
        assert data["total"] == 5
        assert data["limit"] == 2
        assert data["offset"] == 2
        assert len(data["items"]) == 2

    def test_limit_validation_too_high(self):
        response = client.get("/properties?limit=500")
        assert response.status_code == 422

    def test_limit_validation_too_low(self):
        response = client.get("/properties?limit=0")
        assert response.status_code == 422

    def test_offset_validation_negative(self):
        response = client.get("/properties?offset=-1")
        assert response.status_code == 422

    def test_min_price_validation_negative(self):
        response = client.get("/properties?min_price=-100")
        assert response.status_code == 422

    def test_ordered_by_created_at_desc(self):
        _seed(
            _make_property(id="older", created_at=datetime(2024, 1, 1)),
            _make_property(id="newer", created_at=datetime(2024, 6, 1)),
            _make_property(id="newest", created_at=datetime(2024, 12, 1)),
        )
        response = client.get("/properties")
        ids = [p["id"] for p in response.json()["items"]]
        assert ids == ["newest", "newer", "older"]


class TestGetProperty:
    def test_get_success(self):
        _seed(_make_property(id="prop-abc"))
        response = client.get("/properties/prop-abc")
        assert response.status_code == 200
        assert response.json()["id"] == "prop-abc"

    def test_get_not_found(self):
        response = client.get("/properties/does-not-exist")
        assert response.status_code == 404
        assert response.json()["detail"] == "Property not found"

    def test_response_shape_nested(self):
        """Response must match the frontend Property interface exactly."""
        _seed(_make_property(id="shape-test"))
        data = client.get("/properties/shape-test").json()

        # nested location
        assert data["location"]["city"] == "Dubai"
        assert data["location"]["country"] == "United Arab Emirates"
        assert data["location"]["countryCode"] == "AE"
        assert data["location"]["neighborhood"] == "Marina"
        assert data["location"]["coordinates"]["lat"] == 25.0
        assert data["location"]["coordinates"]["lng"] == 55.0

        # nested price
        assert data["price"]["amount"] == 1_000_000.0
        assert data["price"]["currency"] == "USD"

        # nested area
        assert data["area"]["value"] == 2000.0
        assert data["area"]["unit"] == "sqft"

        # camelCase top-level fields
        assert data["subType"] == "Villa"
        assert data["yearBuilt"] == 2020
        assert data["aiScore"] == 85
        assert data["rentalYield"] == 5.0
        assert data["capitalAppreciation"] == 8.0
        assert data["riskScore"] == "low"
        assert data["isLuxury"] is True
        assert data["isFractional"] is False

        # JSON-decoded arrays
        assert data["images"] == ["https://example.com/a.jpg"]
        assert data["features"] == ["Pool", "Garden"]

    def test_response_shape_list(self):
        """List items should have the same nested shape."""
        _seed(_make_property(id="list-shape"))
        data = client.get("/properties").json()
        item = data["items"][0]
        assert item["location"]["coordinates"]["lat"] == 25.0
        assert item["price"]["amount"] == 1_000_000.0
        assert item["area"]["unit"] == "sqft"

    def test_nullable_bedrooms_bathrooms(self):
        _seed(_make_property(id="office", type="commercial", bedrooms=None, bathrooms=None))
        data = client.get("/properties/office").json()
        assert data["bedrooms"] is None
        assert data["bathrooms"] is None
