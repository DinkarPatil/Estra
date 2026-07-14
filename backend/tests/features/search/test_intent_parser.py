"""Unit tests for the search intent parser.

Gemini is mocked via monkeypatching `intent_parser._get_model` — no network
calls, no API key required.
"""

import json
from types import SimpleNamespace

import pytest

from app.features.search.pipeline import intent_parser
from app.features.search.schemas import SearchIntent


class _FakeModel:
    """Minimal stand-in for google.generativeai GenerativeModel."""

    def __init__(self, payload):
        self._payload = payload
        self.calls: list[str] = []

    def generate_content(self, query: str):
        self.calls.append(query)
        if isinstance(self._payload, Exception):
            raise self._payload
        text = self._payload if isinstance(self._payload, str) else json.dumps(self._payload)
        return SimpleNamespace(text=text)


@pytest.fixture(autouse=True)
def _reset_singleton():
    """Ensure the module-level _model cache doesn't leak between tests."""
    intent_parser._model = None
    yield
    intent_parser._model = None


def _install(monkeypatch, fake: _FakeModel):
    monkeypatch.setattr(intent_parser, "_get_model", lambda: fake)


class TestValidQueries:
    def test_city_budget_and_bhk(self, monkeypatch):
        fake = _FakeModel(
            {
                "location": "Mumbai",
                "budget_min": None,
                "budget_max": 10000000,
                "property_type": "2 BHK",
                "raw_entities": {},
            }
        )
        _install(monkeypatch, fake)

        intent = intent_parser.run("2 BHK in Mumbai under 1 crore")

        assert isinstance(intent, SearchIntent)
        assert intent.location == "Mumbai"
        assert intent.budget_max == 10000000
        assert intent.budget_min is None
        assert intent.property_type == "2 BHK"
        assert intent.raw_entities == {}
        assert fake.calls == ["2 BHK in Mumbai under 1 crore"]

    def test_budget_range(self, monkeypatch):
        _install(
            monkeypatch,
            _FakeModel(
                {
                    "location": "Bangalore",
                    "budget_min": 30000000,
                    "budget_max": 50000000,
                    "property_type": "villa",
                    "raw_entities": {},
                }
            ),
        )

        intent = intent_parser.run("Luxury villa in Bangalore 3 cr to 5 cr")

        assert intent.budget_min == 30000000
        assert intent.budget_max == 50000000
        assert intent.property_type == "villa"

    def test_raw_entities_captured(self, monkeypatch):
        _install(
            monkeypatch,
            _FakeModel(
                {
                    "location": "Pune",
                    "budget_min": None,
                    "budget_max": None,
                    "property_type": None,
                    "raw_entities": {"roi_target": "high", "timeframe_years": 5},
                }
            ),
        )

        intent = intent_parser.run("Property in Pune with high ROI in 5 years")

        assert intent.location == "Pune"
        assert intent.raw_entities == {"roi_target": "high", "timeframe_years": 5}

    def test_missing_optional_fields_tolerated(self, monkeypatch):
        # LLM returns only the fields it could extract
        _install(
            monkeypatch,
            _FakeModel({"location": "Pune", "raw_entities": {}}),
        )

        intent = intent_parser.run("Flats in Pune")

        assert intent.location == "Pune"
        assert intent.budget_min is None
        assert intent.budget_max is None
        assert intent.property_type is None

    def test_extra_top_level_keys_folded_into_raw_entities(self, monkeypatch):
        # LLM hallucinates an extra top-level key — must not crash, must be preserved
        _install(
            monkeypatch,
            _FakeModel(
                {
                    "location": "Mumbai",
                    "budget_min": None,
                    "budget_max": None,
                    "property_type": "flat",
                    "raw_entities": {"bhk": 2},
                    "near": "IT hubs",
                }
            ),
        )

        intent = intent_parser.run("2 BHK flat in Mumbai near IT hubs")

        assert intent.location == "Mumbai"
        assert intent.raw_entities["bhk"] == 2
        assert intent.raw_entities["near"] == "IT hubs"


class TestInvalidOrDegraded:
    def test_gibberish_query_returns_clarification(self, monkeypatch):
        _install(
            monkeypatch,
            _FakeModel(
                {
                    "location": None,
                    "budget_min": None,
                    "budget_max": None,
                    "property_type": None,
                    "raw_entities": {"clarification_needed": True},
                }
            ),
        )

        intent = intent_parser.run("asdfghjkl")

        assert intent.location is None
        assert intent.raw_entities == {"clarification_needed": True}

    def test_empty_query_short_circuits_without_llm_call(self, monkeypatch):
        fake = _FakeModel({"location": "should-not-happen"})
        _install(monkeypatch, fake)

        intent = intent_parser.run("   ")

        assert intent.raw_entities == {"clarification_needed": True}
        assert fake.calls == []  # never hit the LLM

    def test_missing_api_key_returns_fallback(self, monkeypatch):
        monkeypatch.setattr(intent_parser, "_get_model", lambda: None)

        intent = intent_parser.run("2 BHK in Mumbai under 1 crore")

        # Heuristic city extractor still patches location even without the LLM,
        # so the ranker doesn't collapse to the global pool on a known city query.
        assert intent.location == "Mumbai"
        assert intent.raw_entities == {"clarification_needed": True}

    def test_llm_exception_returns_fallback(self, monkeypatch):
        _install(monkeypatch, _FakeModel(RuntimeError("network down")))

        intent = intent_parser.run("2 BHK in Mumbai")

        assert intent.raw_entities == {"clarification_needed": True}

    def test_malformed_json_returns_fallback(self, monkeypatch):
        _install(monkeypatch, _FakeModel("this is not json {"))

        intent = intent_parser.run("2 BHK in Mumbai")

        assert intent.raw_entities == {"clarification_needed": True}

    def test_non_object_json_returns_fallback(self, monkeypatch):
        _install(monkeypatch, _FakeModel("[1, 2, 3]"))

        intent = intent_parser.run("2 BHK in Mumbai")

        assert intent.raw_entities == {"clarification_needed": True}

    def test_fallback_is_independent_instance(self, monkeypatch):
        """Mutating one fallback must not bleed into the next call."""
        monkeypatch.setattr(intent_parser, "_get_model", lambda: None)

        first = intent_parser.run("   ")
        first.raw_entities["leaked"] = True

        second = intent_parser.run("   ")
        assert "leaked" not in second.raw_entities
