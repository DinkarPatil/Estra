"""Unit tests for the cache-derived graph_lookup pipeline stage."""

import pytest

from app.features.property_intelligence import cache
from app.features.property_intelligence.pipeline import graph_lookup


@pytest.fixture
def kalyani_cluster():
    """Three Kalyani Nagar listings + one Bandra outlier.

    Subject is p1 at ₹5000/sqft. p2 and p3 sit at ₹4500 and ₹5500 → median 5000,
    so subject is "near_area_median". p1 and p3 share the developer token "Manav".
    """
    cache._reset_for_test([
        {
            "id": "p1",
            "title": "Manav La Moda",
            "city": "Pune",
            "locality_text": "Kalyani Nagar, Pune",
            "bedrooms": 2,
            "area_sqft": 1000.0,
            "price_inr": 5_000_000.0,
            "price_per_sqft": 5000.0,
        },
        {
            "id": "p2",
            "title": "Sunshine Heights",
            "city": "Pune",
            "locality_text": "Kalyani Nagar, Pune",
            "bedrooms": 2,
            "area_sqft": 1100.0,
            "price_inr": 4_950_000.0,
            "price_per_sqft": 4500.0,
        },
        {
            "id": "p3",
            "title": "Manav Greens",
            "city": "Pune",
            "locality_text": "Kalyani Nagar West, Pune",  # different first segment
            "bedrooms": 2,
            "area_sqft": 950.0,
            "price_inr": 5_225_000.0,
            "price_per_sqft": 5500.0,
        },
        {
            "id": "p4",
            "title": "Bandra Premium",
            "city": "Mumbai",
            "locality_text": "Bandra West, Mumbai",
            "bedrooms": 3,
            "area_sqft": 1800.0,
            "price_inr": 35_000_000.0,
            "price_per_sqft": 19444.0,
        },
    ])
    yield
    cache._reset_for_test(None)


def test_missing_property_returns_empty():
    cache._reset_for_test([])
    assert graph_lookup.run("does-not-exist") == {}


def test_happy_path_builds_full_graph(kalyani_cluster):
    out = graph_lookup.run("p1")

    # Subject summary
    assert out["subject"]["id"] == "p1"

    # p2 shares "Kalyani Nagar" first-segment; p3 does NOT (different first segment)
    area_peer_ids = [p["id"] for p in out["area_peers"]]
    assert area_peer_ids == ["p2"]

    # Same-developer peers — both titles start with "Manav"
    same_dev_ids = {p["id"] for p in out["same_developer_peers"]}
    assert same_dev_ids == {"p3"}

    # Similar listings: same BHK + ±20% price → p2 qualifies (₹4.95M), p3 also
    # (₹5.225M), but p4 is 3 BHK + far price → excluded.
    similar_ids = {p["id"] for p in out["similar_listings"]}
    assert similar_ids == {"p2", "p3"}

    # Price position — only p2 is in the same-locality peer pool (PSF 4500),
    # so median = 4500 → subject 5000 is +11.11%, label "above_area_median".
    pp = out["price_position"]
    assert pp["peer_count"] == 1
    assert pp["area_median_psf"] == 4500.0
    assert pp["label"] == "above_area_median"
    assert pp["delta_pct"] == pytest.approx(11.11, abs=0.05)

    # Developer context: 2 cached "Manav" listings across 2 locality clusters
    dev = out["developer_context"]
    assert dev["name"] == "Manav"
    assert dev["known_project_count"] == 2
    assert dev["locality_count"] == 2

    # Notes are non-empty and string-only
    assert out["relationship_notes"]
    assert all(isinstance(n, str) for n in out["relationship_notes"])


def test_below_median_label_and_note():
    cache._reset_for_test([
        {
            "id": "subj",
            "title": "Cheap Project",
            "locality_text": "Hinjewadi, Pune",
            "bedrooms": 2,
            "price_inr": 4_000_000.0,
            "price_per_sqft": 4000.0,
        },
        {
            "id": "peer1",
            "title": "Other A",
            "locality_text": "Hinjewadi, Pune",
            "bedrooms": 2,
            "price_inr": 5_000_000.0,
            "price_per_sqft": 5000.0,
        },
        {
            "id": "peer2",
            "title": "Other B",
            "locality_text": "Hinjewadi, Pune",
            "bedrooms": 2,
            "price_inr": 5_500_000.0,
            "price_per_sqft": 5000.0,
        },
    ])

    out = graph_lookup.run("subj")
    assert out["price_position"]["label"] == "below_area_median"
    assert out["price_position"]["delta_pct"] == -20.0
    assert any("below" in n.lower() for n in out["relationship_notes"])


def test_locality_thin_note_when_no_peers():
    cache._reset_for_test([
        {
            "id": "lonely",
            "title": "Solo Project",
            "locality_text": "Obscure Lane, Pune",
            "bedrooms": 2,
            "price_inr": 5_000_000.0,
            "price_per_sqft": 5000.0,
        },
    ])

    out = graph_lookup.run("lonely")
    assert out["area_peers"] == []
    assert out["price_position"]["label"] == "unknown"
    assert any("locality-thin" in n for n in out["relationship_notes"])
