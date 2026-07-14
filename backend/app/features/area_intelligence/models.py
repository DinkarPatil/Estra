import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, String, Text, JSON
from app.core.database import Base

def _uuid() -> str:
    return str(uuid.uuid4())

def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

class MicroMarket(Base):
    """
    Area-Wise Intelligence Database for Maharashtra.
    Stores numerical and text-based intelligence for micro-markets.
    """
    __tablename__ = "micro_markets"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False, index=True)      # e.g., "Kalyani Nagar"
    city = Column(String, nullable=False, index=True)      # e.g., "Pune"
    state = Column(String, nullable=False, default="Maharashtra", index=True)
    
    # 1. Numerical Core Signals
    historical_price_trend_pct = Column(Float, nullable=True) # 1-3yr trend
    roi_trend_pct = Column(Float, nullable=True)
    volatility_index = Column(Float, nullable=True)           # 0.0 - 1.0
    projected_uplift_pct = Column(Float, nullable=True)       # Future growth
    projected_downside_pct = Column(Float, nullable=True)     # Risk protection
    project_score_trend = Column(Float, nullable=True)        # Avg increment-decrement

    # 2. Textual Intelligence (For LLM interpretation by Pooja's pipeline)
    infra_news_impact = Column(Text, nullable=True)           # Raw news/summary
    risk_signals = Column(Text, nullable=True)                # Flood, crime, policy
    legal_regulatory_friction = Column(Text, nullable=True)   # Zoning, disputes, RERA status
    recent_news_sentiment = Column(Text, nullable=True)       # Social/News sentiment
    upcoming_infra_pipeline = Column(Text, nullable=True)     # Metro, highways, etc.
    
    # 3. Market Momentum & Supply
    rental_demand_strength = Column(String, nullable=True)    # "High" | "Medium" | "Low"
    supply_pressure = Column(Float, nullable=True)            # New inventory volume
    transaction_velocity = Column(Float, nullable=True)       # Days on market proxy
    
    # 4. Complex/Structured Signals (Stored as JSON for flexibility)
    distressed_asset_signals = Column(JSON, nullable=True)    # Auction/Distressed listings
    developer_concentration = Column(JSON, nullable=True)     # [{name, reputation_score}]
    legal_approval_signals = Column(JSON, nullable=True)      # Specific approval statuses
    livability_indicators = Column(JSON, nullable=True)       # {schools, hospitals, parks}
    infrastructure_proximity = Column(JSON, nullable=True)    # Distance to key nodes
    
    # Metadata for Ingestion Tracking
    raw_data_dump = Column(JSON, nullable=True)               # Store the unparsed scraper output
    last_scraped_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
    created_at = Column(DateTime, default=_utcnow)
