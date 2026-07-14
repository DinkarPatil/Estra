from sqlalchemy.orm import Session
from app.features.area_intelligence.models import MicroMarket
from app.features.area_intelligence.schemas import MicroMarketCreate, MicroMarketUpdate
from app.core.logging import get_logger

log = get_logger("features.area_intelligence.service")

def get_area_by_name(db: Session, name: str, city: str):
    return db.query(MicroMarket).filter(
        MicroMarket.name == name,
        MicroMarket.city == city
    ).first()

def upsert_area(db: Session, area_data: MicroMarketCreate):
    """
    Update an existing micro-market or create a new one.
    This is the primary endpoint for the ingestion worker.
    """
    existing = get_area_by_name(db, area_data.name, area_data.city)
    
    if existing:
        log.info(f"Updating area: {area_data.name}, {area_data.city}")
        for key, value in area_data.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    
    log.info(f"Creating new area: {area_data.name}, {area_data.city}")
    new_area = MicroMarket(**area_data.model_dump())
    db.add(new_area)
    db.commit()
    db.refresh(new_area)
    return new_area

def list_areas(db: Session, city: str = None):
    query = db.query(MicroMarket)
    if city:
        query = query.filter(MicroMarket.city == city)
    return query.all()
