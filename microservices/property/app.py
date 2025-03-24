"""
Property Microservice

This microservice provides APIs for managing real estate property listings and valuations.
"""

import os
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, Query, Path
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..common.fastapi_utils import create_app, register_exception_handlers, get_db
from ..common.db_init import PropertyListing, PropertyValuation

# Create FastAPI app
app = create_app(
    name="property",
    description="API for managing real estate property listings and valuations"
)

# Register exception handlers
register_exception_handlers(app)

# Pydantic models for request/response
class PropertyListingCreate(BaseModel):
    address: str
    city: str
    state: str
    zip_code: str
    price: float
    beds: int
    baths: float
    sqft: int
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    property_type: Optional[str] = None
    status: str = "for_sale"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "address": "123 Main St",
                "city": "Grandview",
                "state": "WA",
                "zip_code": "98930",
                "price": 345000,
                "beds": 4,
                "baths": 2.5,
                "sqft": 2450,
                "lot_size": 0.25,
                "year_built": 1998,
                "property_type": "single_family",
                "status": "for_sale",
                "latitude": 46.2546,
                "longitude": -119.9021,
                "description": "Beautiful family home in quiet neighborhood with mountain views."
            }
        }

class PropertyListingResponse(BaseModel):
    id: int
    address: str
    city: str
    state: str
    zip_code: str
    price: float
    beds: int
    baths: float
    sqft: int
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    property_type: Optional[str] = None
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    created_date: str
    updated_date: str
    listed_date: Optional[str] = None
    
    class Config:
        orm_mode = True

class PropertyValuationCreate(BaseModel):
    property_id: int
    estimated_value: float
    confidence_score: Optional[float] = None
    valuation_method: Optional[str] = None
    valuation_details: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "property_id": 1,
                "estimated_value": 350000,
                "confidence_score": 0.85,
                "valuation_method": "sales_comparison",
                "valuation_details": {
                    "comparable_properties": [2, 3, 4],
                    "adjustments": {
                        "size": 5000,
                        "location": -2000,
                        "condition": 0
                    }
                },
                "created_by": "appraiser@example.com"
            }
        }

class PropertyValuationResponse(BaseModel):
    id: int
    property_id: int
    valuation_date: str
    estimated_value: float
    confidence_score: Optional[float] = None
    valuation_method: Optional[str] = None
    valuation_details: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None
    
    class Config:
        orm_mode = True

class MarketSummary(BaseModel):
    count: int
    average_price: float
    median_price: float
    price_range: List[float]
    average_price_per_sqft: float
    average_days_on_market: float
    most_common_property_type: str
    newest_listing: Dict[str, Any]
    
# Endpoints for Property Listings
@app.get("/properties", response_model=List[PropertyListingResponse], tags=["Properties"])
async def get_properties(
    city: Optional[str] = None,
    state: Optional[str] = None,
    zip_code: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_beds: Optional[int] = None,
    min_baths: Optional[float] = None,
    min_sqft: Optional[int] = None,
    property_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
) -> List[PropertyListingResponse]:
    """
    Get a list of property listings with optional filtering
    """
    query = db.query(PropertyListing)
    
    # Apply filters
    if city:
        query = query.filter(PropertyListing.city == city)
    if state:
        query = query.filter(PropertyListing.state == state)
    if zip_code:
        query = query.filter(PropertyListing.zip_code == zip_code)
    if min_price:
        query = query.filter(PropertyListing.price >= min_price)
    if max_price:
        query = query.filter(PropertyListing.price <= max_price)
    if min_beds:
        query = query.filter(PropertyListing.beds >= min_beds)
    if min_baths:
        query = query.filter(PropertyListing.baths >= min_baths)
    if min_sqft:
        query = query.filter(PropertyListing.sqft >= min_sqft)
    if property_type:
        query = query.filter(PropertyListing.property_type == property_type)
    if status:
        query = query.filter(PropertyListing.status == status)
    
    # Apply pagination
    query = query.order_by(desc(PropertyListing.created_date)).offset(offset).limit(limit)
    
    # Convert to response model
    properties = query.all()
    return [property_obj.to_dict() for property_obj in properties]

@app.get("/properties/{property_id}", response_model=PropertyListingResponse, tags=["Properties"])
async def get_property(
    property_id: int = Path(..., ge=1),
    db: Session = Depends(get_db)
) -> PropertyListingResponse:
    """
    Get a single property listing by ID
    """
    property_obj = db.query(PropertyListing).filter(PropertyListing.id == property_id).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail=f"Property with ID {property_id} not found")
    
    return property_obj.to_dict()

@app.post("/properties", response_model=PropertyListingResponse, status_code=201, tags=["Properties"])
async def create_property(
    property_data: PropertyListingCreate,
    db: Session = Depends(get_db)
) -> PropertyListingResponse:
    """
    Create a new property listing
    """
    # Convert Pydantic model to SQLAlchemy model
    property_obj = PropertyListing(
        **property_data.dict(),
        created_date=datetime.utcnow(),
        updated_date=datetime.utcnow(),
        listed_date=datetime.utcnow()
    )
    
    # Add to database
    db.add(property_obj)
    db.commit()
    db.refresh(property_obj)
    
    return property_obj.to_dict()

# Endpoints for Property Valuations
@app.get("/properties/{property_id}/valuations", response_model=List[PropertyValuationResponse], tags=["Valuations"])
async def get_property_valuations(
    property_id: int = Path(..., ge=1),
    db: Session = Depends(get_db)
) -> List[PropertyValuationResponse]:
    """
    Get all valuations for a property
    """
    # Check if property exists
    property_obj = db.query(PropertyListing).filter(PropertyListing.id == property_id).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail=f"Property with ID {property_id} not found")
    
    # Get valuations
    valuations = db.query(PropertyValuation).filter(PropertyValuation.property_id == property_id)\
                   .order_by(desc(PropertyValuation.valuation_date)).all()
    
    return [valuation.to_dict() for valuation in valuations]

@app.post("/valuations", response_model=PropertyValuationResponse, status_code=201, tags=["Valuations"])
async def create_valuation(
    valuation_data: PropertyValuationCreate,
    db: Session = Depends(get_db)
) -> PropertyValuationResponse:
    """
    Create a new property valuation
    """
    # Check if property exists
    property_obj = db.query(PropertyListing).filter(PropertyListing.id == valuation_data.property_id).first()
    if not property_obj:
        raise HTTPException(status_code=404, detail=f"Property with ID {valuation_data.property_id} not found")
    
    # Convert Pydantic model to SQLAlchemy model
    valuation_obj = PropertyValuation(
        **valuation_data.dict(),
        valuation_date=datetime.utcnow()
    )
    
    # Add to database
    db.add(valuation_obj)
    db.commit()
    db.refresh(valuation_obj)
    
    return valuation_obj.to_dict()

# Market Summary Endpoint
@app.get("/market-summary", response_model=MarketSummary, tags=["Market"])
async def get_market_summary(
    city: Optional[str] = None,
    state: Optional[str] = None,
    zip_code: Optional[str] = None,
    property_type: Optional[str] = None,
    db: Session = Depends(get_db)
) -> MarketSummary:
    """
    Get market summary statistics for specified area
    """
    from sqlalchemy import func, desc
    import statistics
    
    # Base query
    query = db.query(PropertyListing)
    
    # Apply filters
    if city:
        query = query.filter(PropertyListing.city == city)
    if state:
        query = query.filter(PropertyListing.state == state)
    if zip_code:
        query = query.filter(PropertyListing.zip_code == zip_code)
    if property_type:
        query = query.filter(PropertyListing.property_type == property_type)
    
    # Only include active listings
    query = query.filter(PropertyListing.status == "for_sale")
    
    # Get all matching properties
    properties = query.all()
    
    if not properties:
        raise HTTPException(status_code=404, detail="No properties found matching the criteria")
    
    # Calculate statistics
    prices = [p.price for p in properties]
    avg_price = sum(prices) / len(prices)
    median_price = statistics.median(prices)
    price_range = [min(prices), max(prices)]
    
    # Calculate price per square foot
    price_per_sqft = [p.price / p.sqft for p in properties if p.sqft > 0]
    avg_price_per_sqft = sum(price_per_sqft) / len(price_per_sqft) if price_per_sqft else 0
    
    # Get most common property type
    property_types = {}
    for p in properties:
        if p.property_type:
            property_types[p.property_type] = property_types.get(p.property_type, 0) + 1
    
    most_common_type = max(property_types.items(), key=lambda x: x[1])[0] if property_types else "unknown"
    
    # Calculate average days on market
    days_on_market = []
    for p in properties:
        if p.listed_date:
            listed_date = p.listed_date if isinstance(p.listed_date, datetime) else datetime.fromisoformat(p.listed_date.replace('Z', '+00:00'))
            days = (datetime.utcnow() - listed_date).days
            days_on_market.append(days)
    
    avg_days = sum(days_on_market) / len(days_on_market) if days_on_market else 0
    
    # Get newest listing
    newest = sorted(properties, key=lambda p: p.listed_date if isinstance(p.listed_date, datetime) else 
                  datetime.fromisoformat(p.listed_date.replace('Z', '+00:00')), reverse=True)[0]
    
    # Return market summary
    return MarketSummary(
        count=len(properties),
        average_price=avg_price,
        median_price=median_price,
        price_range=price_range,
        average_price_per_sqft=avg_price_per_sqft,
        average_days_on_market=avg_days,
        most_common_property_type=most_common_type,
        newest_listing=newest.to_dict()
    )

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8001))
    
    # Run application
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )