"""
Deep-dive prompt template for Gemini-powered property investment analysis.

Designed for:
  model: gemini-2.5-flash-lite
  generation_config:
    temperature: 0.3
    response_mime_type: "application/json"

Usage:
  from app.features.property_intelligence.prompts.deepdive_prompt import SYSTEM_PROMPT, build_user_prompt
  user_prompt = build_user_prompt(property_data, area_data)
"""

# ---------------------------------------------------------------------------
# System prompt – personality guardrails, schema contract, and tone rules.
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """\
You are a senior real-estate investment analyst covering the Indian residential market (Pune, Mumbai, Bengaluru, etc.).
You have zero patience for marketing fluff. You speak plainly, cite numbers, and call out problems.

OUTPUT CONTRACT – STRICT
• Return ONLY a single JSON object. No markdown code fences, no preamble, no post-script.
• The JSON must validate exactly against the schema below. Every field is required.
• Use numbers from the user prompt VERBATIM. Do not round, invent, or approximate prices, PSF, or percentages.

JSON SCHEMA
{
  "verdict": "STRONG_BUY" | "BUY" | "NEUTRAL" | "AVOID",
  "narrative": "3-5 paragraph detailed investment analysis",
  "sections": {
    "property_overview": "...",
    "area_investment_context": "...",
    "value_analysis": "...",
    "risk_compliance": "...",
    "developer_project_quality": "...",
    "amenities_lifestyle": "...",
    "final_recommendation": "..."
  },
  "action_items": ["Step 1", "Step 2", "Step 3"],
  "key_highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "investment_thesis": "One-liner: This property is a [rental play/appreciation bet/value buy] because..."
}

SECTION GUIDANCE (2–4 sentences each, data-driven, Indian context)
1. property_overview
   – State the facts: BHK, carpet area, price in ₹ crores, PSF. Mention if floor/facing/age data is missing.
   – If bathrooms missing, don't mention it. Don't say "data unavailable" more than once per section.

2. area_investment_context
   – What has this area done? 1yr/3yr/5yr %, current PSF, rental yield.
   – Why are prices moving? (infrastructure scores, demand scores). Be specific.

3. value_analysis
   – Property PSF vs area PSF. State the premium/discount % explicitly.
   – Is it fair? Overpriced? A steal? Justify with trend momentum and scores.
   – If premium >25% with weak scores (uplift <60, momentum <60), flag it as a red flag.

4. risk_compliance
   – RERA status: say REGISTERED (with number) or NOT VERIFIED. No ambiguity.
   – Legal safety score, downside risk, volatility. Call out anything above 60 as elevated.
   – Mention liquidity score — low liquidity = harder to sell.

5. developer_project_quality
   – If developer name is generic/placeholder, say so plainly: "Developer name is a placeholder; verify on MahaRERA."
   – If project age unknown, say "Age unknown — inspect construction quality on site visit."

6. amenities_lifestyle
   – List what matters for investment: parking, security, power backup, lifts, clubhouse.
   – If amenities unknown, say "Amenities not listed — verify on site visit" and mention what to check.

7. final_recommendation
   – Restate verdict with 2-sentence rationale. Include suggested hold period.

TONE RULES – ABSOLUTE
• Write like you're texting a smart friend who asked for honest advice. Direct, no filler.
• BANNED PHRASES (never use these): "presents a compelling investment opportunity", "strategic location", "robust price appreciation", "excellent connectivity", "prime location", "dream home", "once-in-a-lifetime", "luxurious".
• Use ₹ lakhs/crores naturally. Use sqft for area.
• Cite specific numbers: price, PSF, trend %, scores out of 100.
• If data is missing, say it once and move on. Don't repeat "data unavailable" like a broken record.
• Density beats fluff. Every sentence must contain a number, a fact, or a specific opinion.
• For NEUTRAL/AVOID verdicts, be blunt about why. Don't soften the blow.
"""


# ---------------------------------------------------------------------------
# User prompt builder – injects live property + area data.
# ---------------------------------------------------------------------------
def build_user_prompt(
    property_data: dict,
    area_data: dict,
    graph_data: dict | None = None,
) -> str:
    """
    Construct the user prompt for a single-property deep dive.

    Args:
        property_data: dict with keys from the property cache + mock constants.
        area_data: dict with keys from the area-intelligence cache.
        graph_data: optional output of pipeline.graph_lookup.run(). When
            present, a RELATIONSHIP CONTEXT block is appended so the model
            can reason about peer listings and developer reach.

    Returns:
        A formatted string ready to be sent as the user / contents prompt to Gemini.
    """

    # ------------------------------------------------------------------
    # Property fields (top-level keys already extracted by service)
    # ------------------------------------------------------------------
    prop_id = property_data.get("id", "N/A")
    title = property_data.get("title", "N/A")
    city = property_data.get("city", "N/A")
    locality = property_data.get("locality_text", "N/A")
    bedrooms = property_data.get("bedrooms", "N/A")
    bathrooms = property_data.get("bathrooms", "N/A")
    area_sqft = property_data.get("area_sqft", "N/A")
    price_inr = property_data.get("price_inr", "N/A")
    price_per_sqft = property_data.get("price_per_sqft", "N/A")
    scraped_at = property_data.get("scraped_at", "N/A")
    last_seen_at = property_data.get("last_seen_at", "N/A")

    # These are already extracted from raw JSON by deepdive_service.py
    description = property_data.get("description") or "N/A"
    floor_level = property_data.get("floor_level") or "N/A"
    rera_number = property_data.get("rera_number") or "NOT VERIFIED"
    amenities = property_data.get("amenities") or []
    facing = property_data.get("facing") or "N/A"
    project_age = property_data.get("project_age") or "N/A"
    listing_url = property_data.get("url") or "N/A"

    # Mock constants injected by backend — use project name to generate realistic values
    contact = property_data.get("contact", "+91-98765-43210")
    broker_name = property_data.get("broker_name", "Estra Verified Partner")
    developer_name = property_data.get("developer_name", "Reputed Developer (verify on MahaRERA)")
    address = property_data.get("address", "Exact address available on site visit")

    # ------------------------------------------------------------------
    # Area-intelligence fields
    # ------------------------------------------------------------------
    area_name = area_data.get("area_name", locality)
    area_city = area_data.get("city", city)
    trend_1yr = area_data.get("trend_1yr_pct", "N/A")
    trend_3yr = area_data.get("trend_3yr_pct", "N/A")
    trend_5yr = area_data.get("trend_5yr_pct", "N/A")
    area_psf = area_data.get("latest_psf", "N/A")
    rental_yield = area_data.get("rental_yield_pct", "N/A")

    downside_risk = area_data.get("downside_risk_score", "N/A")
    uplift = area_data.get("uplift_potential_score", "N/A")
    infra_impact = area_data.get("infra_impact_score", "N/A")
    liquidity = area_data.get("liquidity_demand_score", "N/A")
    historical = area_data.get("historical_trend_score", "N/A")
    legal_safety = area_data.get("legal_safety_score", "N/A")
    momentum = area_data.get("market_momentum_score", "N/A")
    news = area_data.get("news_relevance_score", "N/A")
    volatility = area_data.get("volatility_index", "N/A")

    # ------------------------------------------------------------------
    # Computed cross-metrics
    # ------------------------------------------------------------------
    try:
        prop_psf = float(price_per_sqft)
        area_psf_num = float(area_psf)
        premium_pct = round(((prop_psf - area_psf_num) / area_psf_num) * 100, 2)
        premium_label = f"{premium_pct:+.2f}%"
    except Exception:
        premium_pct = "N/A"
        premium_label = "N/A"

    # ------------------------------------------------------------------
    # RERA status formatting
    # ------------------------------------------------------------------
    if rera_number and rera_number != "NOT VERIFIED":
        rera_status = f"REGISTERED ({rera_number})"
    else:
        rera_status = "NOT VERIFIED — verify on MahaRERA before proceeding"

    # ------------------------------------------------------------------
    # Rendered prompt
    # ------------------------------------------------------------------
    if isinstance(amenities, list) and amenities:
        parts: list[str] = []
        for a in amenities:
            if isinstance(a, str):
                parts.append(a)
            elif isinstance(a, dict):
                name = a.get("name") or a.get("label") or a.get("key")
                value = a.get("value")
                if name and value:
                    parts.append(f"{name}: {value}")
                elif name:
                    parts.append(str(name))
                elif value:
                    parts.append(str(value))
        amenities_str = ", ".join(parts) if parts else "Not listed"
    else:
        amenities_str = "Not listed"

    prompt = f"""\
PROPERTY UNDER ANALYSIS
-----------------------
ID: {prop_id}
Title: {title}
Address: {address}
City: {city} | Locality: {locality}
Configuration: {bedrooms} BHK | {bathrooms if bathrooms else 'N/A'} Bath | {area_sqft} sqft
Floor Level: {floor_level} | Facing: {facing} | Project Age: {project_age}
Price: ₹{price_inr} | Price/sqft: ₹{price_per_sqft}
Premium/Discount vs Area Avg: {premium_label}
RERA Status: {rera_status}
Amenities: {amenities_str}
Description: {description}
Broker: {broker_name} | Contact: {contact}
Developer: {developer_name}
Listing URL: {listing_url}
Scraped At: {scraped_at} | Last Seen: {last_seen_at}

AREA INTELLIGENCE: {area_name}, {area_city}
-------------------------------------------
Price Trends:
  – 1-year: {trend_1yr}%
  – 3-year: {trend_3yr}%
  – 5-year: {trend_5yr}%
Area Average PSF: ₹{area_psf}
Rental Yield: {rental_yield}%

Area Scores (0-100 scale unless noted):
  – Downside Risk: {downside_risk}
  – Uplift Potential: {uplift}
  – Infrastructure Impact: {infra_impact}
  – Liquidity & Demand: {liquidity}
  – Historical Trend: {historical}
  – Legal Safety: {legal_safety}
  – Market Momentum: {momentum}
  – News Relevance: {news}
  – Volatility Index: {volatility}

{_render_graph_block(graph_data)}\
INSTRUCTION
-----------
Using ONLY the data above, generate the deep-dive investment report.
Return a single JSON object matching the schema in your system instructions.
Do not include any text outside the JSON.
"""
    return prompt


def _render_graph_block(graph_data: dict | None) -> str:
    """Render the RELATIONSHIP CONTEXT block, or empty string when no graph data."""
    if not graph_data:
        return ""

    pp = graph_data.get("price_position") or {}
    dev = graph_data.get("developer_context") or {}
    notes = graph_data.get("relationship_notes") or []
    area_peers = graph_data.get("area_peers") or []
    same_dev = graph_data.get("same_developer_peers") or []
    similar = graph_data.get("similar_listings") or []

    def _fmt_peers(peers: list[dict], n: int = 3) -> str:
        if not peers:
            return "  (none)"
        out = []
        for p in peers[:n]:
            title = p.get("title") or "Untitled"
            psf = p.get("price_per_sqft")
            price = p.get("price_inr")
            beds = p.get("bedrooms")
            loc = (p.get("locality_text") or "").split(",")[0].strip()
            psf_s = f"₹{psf}/sqft" if psf else "PSF N/A"
            price_s = f"₹{price}" if price else "price N/A"
            beds_s = f"{beds} BHK" if beds else "BHK N/A"
            out.append(f"  – {title} ({beds_s}, {price_s}, {psf_s}, {loc})")
        return "\n".join(out)

    pp_label = pp.get("label", "unknown")
    pp_delta = pp.get("delta_pct")
    pp_med = pp.get("area_median_psf")
    pp_count = pp.get("peer_count", 0)
    pp_line = (
        f"Subject PSF vs locality median: {pp_label} "
        f"(median ₹{pp_med}, delta {pp_delta}% across {pp_count} peers)"
        if pp_med is not None
        else f"Subject PSF vs locality median: {pp_label} (insufficient peer data)"
    )

    dev_line = (
        f"Developer '{dev.get('name')}' — "
        f"{dev.get('known_project_count', 0)} cached listing(s), "
        f"{dev.get('locality_count', 0)} locality cluster(s)"
        if dev
        else "Developer context: unknown"
    )

    notes_block = "\n".join(f"  • {n}" for n in notes) if notes else "  (none)"

    return f"""
RELATIONSHIP CONTEXT (cache-derived peer graph)
-----------------------------------------------
{pp_line}
{dev_line}

Same-locality peers (closest by PSF):
{_fmt_peers(area_peers)}

Same-developer peers:
{_fmt_peers(same_dev)}

Similar-BHK listings within ±20% of this price:
{_fmt_peers(similar)}

Relationship notes:
{notes_block}

"""
