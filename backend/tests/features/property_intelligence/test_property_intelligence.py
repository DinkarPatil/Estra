import pytest

from app.features.property_intelligence import cache


# --- helpers ---

def _basic_fixture():
    """Inject two synthetic listings into the in-memory cache."""
    cache._reset_for_test([
        {
            "id": "p1",
            "source": "test",
            "listing_type": "sale",
            "city": "Pune",
            "state": "Maharashtra",
            "locality_text": "Kalyani Nagar, Pune",
            "title": "Spacious 2 BHK in Kalyani Nagar",
            "bedrooms": 2,
            "bathrooms": 2,
            "area_sqft": 1200.0,
            "price_inr": 5_000_000.0,
            "price_per_sqft": 4166.67,
            "scraped_at": "2026-04-01T00:00:00",
        },
        {
            "id": "p2",
            "source": "test",
            "listing_type": "rent",
            "city": "Mumbai",
            "state": "Maharashtra",
            "locality_text": "Bandra West, Mumbai",
            "title": "Premium 3 BHK Sea View",
            "bedrooms": 3,
            "bathrooms": 3,
            "area_sqft": 1800.0,
            "price_inr": 150_000.0,
            "price_per_sqft": 83.33,
            "scraped_at": "2026-04-01T00:00:00",
        },
    ])


@pytest.fixture(autouse=True)
def reset_prop_cache():
    """Clear cache before every test so tests are isolated."""
    cache._reset_for_test([])
    yield
    cache._reset_for_test(None)


# --- list endpoint ---

class TestListProperties:
    def test_empty_list(self, client):
        response = client.get("/properties")
        assert response.status_code == 200
        assert response.json() == {"items": [], "total": 0, "limit": 20, "offset": 0}

    def test_returns_seeded(self, client):
        _basic_fixture()
        data = client.get("/properties").json()
        assert data["total"] == 2
        assert {item["id"] for item in data["items"]} == {"p1", "p2"}

    def test_filter_by_city(self, client):
        _basic_fixture()
        assert client.get("/properties?city=Pune").json()["total"] == 1
        assert client.get("/properties?city=Nowhere").json()["total"] == 0

    def test_filter_by_locality(self, client):
        _basic_fixture()
        assert client.get("/properties?locality=Kalyani").json()["total"] == 1
        assert client.get("/properties?locality=Bandra").json()["total"] == 1
        assert client.get("/properties?locality=Andheri").json()["total"] == 0

    def test_filter_by_property_type(self, client):
        _basic_fixture()
        # property_type does a title match; "2 BHK" and "3 BHK" both match
        assert client.get("/properties?property_type=2 BHK").json()["total"] == 1
        assert client.get("/properties?property_type=3 BHK").json()["total"] == 1
        assert client.get("/properties?property_type=villa").json()["total"] == 0

    def test_filter_by_listing_type(self, client):
        _basic_fixture()
        assert client.get("/properties?listing_type=sale").json()["total"] == 1
        assert client.get("/properties?listing_type=rent").json()["total"] == 1

    def test_filter_by_source(self, client):
        _basic_fixture()
        assert client.get("/properties?source=test").json()["total"] == 2
        assert client.get("/properties?source=99acres").json()["total"] == 0

    def test_filter_by_price_range(self, client):
        _basic_fixture()
        data = client.get("/properties?min_price=1_000_000&max_price=10_000_000").json()
        assert data["total"] == 1
        assert data["items"][0]["id"] == "p1"

        data = client.get("/properties?min_price=200_000").json()
        assert data["total"] == 1  # p1 at 5M still matches
        assert data["items"][0]["id"] == "p1"

    def test_filter_by_bedrooms(self, client):
        _basic_fixture()
        assert client.get("/properties?min_bedrooms=2&max_bedrooms=2").json()["total"] == 1
        assert client.get("/properties?min_bedrooms=3").json()["total"] == 1
        assert client.get("/properties?min_bedrooms=4").json()["total"] == 0

    def test_pagination(self, client):
        _basic_fixture()
        data = client.get("/properties?limit=1&offset=0").json()
        assert data["total"] == 2
        assert data["limit"] == 1
        assert data["offset"] == 0
        assert len(data["items"]) == 1

    def test_limit_validation_too_high(self, client):
        assert client.get("/properties?limit=500").status_code == 422

    def test_limit_validation_too_low(self, client):
        assert client.get("/properties?limit=0").status_code == 422

    def test_min_price_validation_negative(self, client):
        assert client.get("/properties?min_price=-1").status_code == 422


# --- detail endpoint ---

class TestGetProperty:
    def test_success(self, client):
        _basic_fixture()
        data = client.get("/properties/p1").json()

        assert data["id"] == "p1"
        assert data["title"] == "Spacious 2 BHK in Kalyani Nagar"
        assert data["city"] == "Pune"
        assert data["state"] == "Maharashtra"
        assert data["locality_text"] == "Kalyani Nagar, Pune"
        assert data["price_inr"] == 5_000_000.0
        assert data["bedrooms"] == 2
        assert data["listing_type"] == "sale"
        assert data["source"] == "test"

    def test_not_found(self, client):
        response = client.get("/properties/does-not-exist")
        assert response.status_code == 404
        assert response.json()["detail"] == "Property listing not found"
