#!/usr/bin/env bash
# Estra Glimmora — Quick curl demo flow
# Run the server first: uvicorn app.main:app --host 127.0.0.1 --port 8000

BASE="http://127.0.0.1:8000"

echo ""
echo "============================================================"
echo "  STEP 1: Area-First Search"
echo "============================================================"
echo "Query: '2 BHK in Pune under 1 crore'"
echo ""

curl -s -X POST "$BASE/search/areas" \
  -H "Content-Type: application/json" \
  -d '{"query": "2 BHK in Pune under 1 crore"}' | python3 -m json.tool

echo ""
echo "============================================================"
echo "  STEP 2: Property Search in selected area"
echo "============================================================"
echo "Selected area: Balewadi (top result from step 1)"
echo ""

curl -s -X POST "$BASE/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "2 BHK in Pune under 1 crore", "area_names": ["Balewadi"]}' | python3 -m json.tool

echo ""
echo "============================================================"
echo "  STEP 3: Rank properties"
echo "============================================================"
echo "Takes property IDs from step 2 and overlays area intelligence"
echo ""

curl -s -X POST "$BASE/ranking/rank" \
  -H "Content-Type: application/json" \
  -d '{
    "property_ids": [
      "prop_balewadi_001", "prop_balewadi_002", "prop_balewadi_003",
      "prop_balewadi_004", "prop_balewadi_005"
    ],
    "preferences": {}
  }' | python3 -m json.tool

echo ""
echo "============================================================"
echo "  STEP 4: Full orchestrator pipeline"
echo "============================================================"
echo "Runs search → rank → ROI → geo-risk → compliance"
echo ""

curl -s -X POST "$BASE/orchestrator/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "2 BHK in Pune under 1 crore",
    "horizon_years": 5,
    "buyer_country": "India"
  }' | python3 -m json.tool

echo ""
