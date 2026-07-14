from typing import Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class MicroMarketBase(BaseModel):
    name: str
    city: str
    state: str = "Maharashtra"
    
    historical_price_trend_pct: Optional[float] = None
    roi_trend_pct: Optional[float] = None
    volatility_index: Optional[float] = None
    projected_uplift_pct: Optional[float] = None
    projected_downside_pct: Optional[float] = None
    project_score_trend: Optional[float] = None
    
    infra_news_impact: Optional[str] = None
    risk_signals: Optional[str] = None
    legal_regulatory_friction: Optional[str] = None
    recent_news_sentiment: Optional[str] = None
    upcoming_infra_pipeline: Optional[str] = None
    
    rental_demand_strength: Optional[str] = None
    supply_pressure: Optional[float] = None
    transaction_velocity: Optional[float] = None
    
    distressed_asset_signals: Optional[dict[str, Any]] = None
    developer_concentration: Optional[dict[str, Any]] = None
    legal_approval_signals: Optional[dict[str, Any]] = None
    livability_indicators: Optional[dict[str, Any]] = None
    infrastructure_proximity: Optional[dict[str, Any]] = None
    
    raw_data_dump: Optional[dict[str, Any]] = None

class MicroMarketCreate(MicroMarketBase):
    pass

class MicroMarketUpdate(MicroMarketBase):
    name: Optional[str] = None
    city: Optional[str] = None

class MicroMarketResponse(MicroMarketBase):
    id: str
    last_scraped_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
