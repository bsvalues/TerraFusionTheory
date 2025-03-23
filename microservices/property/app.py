"""
Property Data Microservice

This FastAPI microservice provides endpoints for accessing and managing property listings data.
It interfaces with the database and provides a RESTful API for the frontend.
"""

import os
import sys
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json

# Add the parent directory to the path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database models
from common.db_init import PropertyListing, PropertyValuation, Base, ETLJob
from sqlalchemy import create_engine, desc, func
from sqlalchemy.orm import sessionmaker, Session

# Create FastAPI app
app = FastAPI(
    title="Property Data API",
    description="API for accessing and managing property listings data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
def get_db_url():
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        raise HTTPException(status_code=500, detail="DATABASE_URL environment variable not set")
    return db_url

def get_db():
    db_url = get_db_url()
    engine = create_engine(db_url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic models for API
class PropertyListingBase(BaseModel):
    external_id: Optional[str] = None
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    price: Optional[float] = None
    beds: Optional[int] = None
    baths: Optional[float] = None
    sqft: Optional[float] = None
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    property_type: Optional[str] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    features: Optional[dict] = None
    images: Optional[list] = None
    listed_date: Optional[datetime] = None

class PropertyListingCreate(PropertyListingBase):
    pass

class PropertyListingResponse(PropertyListingBase):
    id: int
    created_date: datetime
    updated_date: datetime
    
    class Config:
        from_attributes = True

class PropertyValuationBase(BaseModel):
    property_id: int
    estimated_value: float
    confidence_score: Optional[float] = None
    method: str
    features_used: Optional[dict] = None
    is_prediction: bool = False

class PropertyValuationCreate(PropertyValuationBase):
    pass

class PropertyValuationResponse(PropertyValuationBase):
    id: int
    valuation_date: datetime
    
    class Config:
        from_attributes = True

class MarketSummaryResponse(BaseModel):
    total_listings: int
    total_for_sale: int
    total_sold_last_30_days: int
    median_price: float
    average_price: float
    avg_days_on_market: float
    avg_price_per_sqft: float
    min_price: float
    max_price: float
    price_ranges: dict
    
    class Config:
        from_attributes = True

# API Routes
@app.get("/")
def read_root():
    return {"message": "Property Data Microservice API", "status": "active"}

@app.get("/health")
def health_check():
    try:
        db_url = get_db_url()
        engine = create_engine(db_url)
        with engine.connect() as connection:
            result = connection.execute("SELECT 1")
            result.fetchall()
        return {"status": "healthy", "database_connection": "ok"}
    except Exception as e:
        return {"status": "unhealthy", "detail": str(e)}

@app.get("/properties", response_model=List[PropertyListingResponse])
def get_properties(
    skip: int = 0,
    limit: int = 100,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    beds: Optional[int] = None,
    baths: Optional[float] = None,
    min_sqft: Optional[float] = None,
    property_type: Optional[str] = None,
    status: Optional[str] = None,
    city: Optional[str] = None,
    zip_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get property listings with optional filtering
    """
    query = db.query(PropertyListing)
    
    # Apply filters
    if min_price:
        query = query.filter(PropertyListing.price >= min_price)
    if max_price:
        query = query.filter(PropertyListing.price <= max_price)
    if beds:
        query = query.filter(PropertyListing.beds >= beds)
    if baths:
        query = query.filter(PropertyListing.baths >= baths)
    if min_sqft:
        query = query.filter(PropertyListing.sqft >= min_sqft)
    if property_type:
        query = query.filter(PropertyListing.property_type == property_type)
    if status:
        query = query.filter(PropertyListing.status == status)
    if city:
        query = query.filter(PropertyListing.city == city)
    if zip_code:
        query = query.filter(PropertyListing.zip_code == zip_code)
    
    # Order by newest first
    query = query.order_by(desc(PropertyListing.created_date))
    
    # Pagination
    properties = query.offset(skip).limit(limit).all()
    
    return properties

@app.get("/properties/{property_id}", response_model=PropertyListingResponse)
def get_property(property_id: int, db: Session = Depends(get_db)):
    """
    Get a specific property by ID
    """
    property = db.query(PropertyListing).filter(PropertyListing.id == property_id).first()
    if property is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return property

@app.post("/properties", response_model=PropertyListingResponse)
def create_property(property_data: PropertyListingCreate, db: Session = Depends(get_db)):
    """
    Create a new property listing
    """
    # Convert pydantic model to dict
    property_dict = property_data.dict()
    
    # Convert JSON fields
    if property_dict.get('features'):
        property_dict['features'] = json.dumps(property_dict['features'])
    if property_dict.get('images'):
        property_dict['images'] = json.dumps(property_dict['images'])
    
    db_property = PropertyListing(**property_dict)
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    
    return db_property

@app.get("/valuations/{property_id}", response_model=List[PropertyValuationResponse])
def get_property_valuations(property_id: int, db: Session = Depends(get_db)):
    """
    Get valuation history for a specific property
    """
    valuations = db.query(PropertyValuation).filter(
        PropertyValuation.property_id == property_id
    ).order_by(desc(PropertyValuation.valuation_date)).all()
    
    return valuations

@app.post("/valuations", response_model=PropertyValuationResponse)
def create_valuation(valuation_data: PropertyValuationCreate, db: Session = Depends(get_db)):
    """
    Create a new property valuation
    """
    # Convert pydantic model to dict
    valuation_dict = valuation_data.dict()
    
    # Convert JSON fields
    if valuation_dict.get('features_used'):
        valuation_dict['features_used'] = json.dumps(valuation_dict['features_used'])
    
    db_valuation = PropertyValuation(**valuation_dict)
    db.add(db_valuation)
    db.commit()
    db.refresh(db_valuation)
    
    return db_valuation

@app.get("/market-summary", response_model=MarketSummaryResponse)
def get_market_summary(
    city: Optional[str] = None,
    zip_code: Optional[str] = None,
    property_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get market summary statistics
    """
    query = db.query(PropertyListing)
    
    # Apply filters
    if city:
        query = query.filter(PropertyListing.city == city)
    if zip_code:
        query = query.filter(PropertyListing.zip_code == zip_code)
    if property_type:
        query = query.filter(PropertyListing.property_type == property_type)
    
    # Base statistics
    total_listings = query.count()
    
    # For sale listings
    for_sale_query = query.filter(PropertyListing.status == 'for_sale')
    total_for_sale = for_sale_query.count()
    
    # Recently sold listings (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    sold_query = query.filter(
        PropertyListing.status == 'sold',
        PropertyListing.updated_date >= thirty_days_ago
    )
    total_sold_last_30_days = sold_query.count()
    
    # Price statistics
    price_stats = db.query(
        func.avg(PropertyListing.price).label('avg_price'),
        func.percentile_cont(0.5).within_group(PropertyListing.price.asc()).label('median_price'),
        func.min(PropertyListing.price).label('min_price'),
        func.max(PropertyListing.price).label('max_price'),
        func.avg(PropertyListing.price / PropertyListing.sqft).label('avg_price_per_sqft')
    ).filter(PropertyListing.price > 0).first()
    
    # Days on market
    dom_stats = db.query(
        func.avg(func.extract('day', PropertyListing.updated_date - PropertyListing.listed_date)).label('avg_days_on_market')
    ).filter(
        PropertyListing.status == 'sold'
    ).first()
    
    # Price ranges
    price_ranges = {
        "under_250k": query.filter(PropertyListing.price < 250000).count(),
        "250k_500k": query.filter(PropertyListing.price >= 250000, PropertyListing.price < 500000).count(),
        "500k_750k": query.filter(PropertyListing.price >= 500000, PropertyListing.price < 750000).count(),
        "750k_1m": query.filter(PropertyListing.price >= 750000, PropertyListing.price < 1000000).count(),
        "over_1m": query.filter(PropertyListing.price >= 1000000).count()
    }
    
    return {
        "total_listings": total_listings,
        "total_for_sale": total_for_sale,
        "total_sold_last_30_days": total_sold_last_30_days,
        "median_price": price_stats.median_price if price_stats.median_price else 0,
        "average_price": price_stats.avg_price if price_stats.avg_price else 0,
        "avg_days_on_market": dom_stats.avg_days_on_market if dom_stats and dom_stats.avg_days_on_market else 0,
        "avg_price_per_sqft": price_stats.avg_price_per_sqft if price_stats.avg_price_per_sqft else 0,
        "min_price": price_stats.min_price if price_stats.min_price else 0,
        "max_price": price_stats.max_price if price_stats.max_price else 0,
        "price_ranges": price_ranges
    }

if __name__ == "__main__":
    import uvicorn
    # Start the API server
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)