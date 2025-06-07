"""
Spatial Microservice

This microservice provides APIs for spatial data management and analysis, including:
- Geospatial data (e.g., neighborhood boundaries)
- Geocoding (address to coordinates)
- Proximity searches (find properties near a point)
- Spatial queries (points in polygon, etc.)
"""

import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import math

from fastapi import Depends, FastAPI, HTTPException, Query, Path
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from ..common.fastapi_utils import create_app, register_exception_handlers, get_db
from ..common.db_init import PropertyListing, SpatialData

# Create FastAPI app
app = create_app(
    name="spatial",
    description="API for spatial data management and geospatial analysis"
)

# Register exception handlers
register_exception_handlers(app)

# Pydantic models for request/response
class Point(BaseModel):
    lat: float
    lng: float

class GeoJSONGeometry(BaseModel):
    type: str
    coordinates: Any

class GeocodeRequest(BaseModel):
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "address": "123 Main St",
                "city": "Grandview",
                "state": "WA",
                "zip_code": "98930"
            }
        }

class GeocodeResponse(BaseModel):
    input: str
    formatted_address: str
    coordinates: Point
    confidence: float
    
    class Config:
        schema_extra = {
            "example": {
                "input": "123 Main St, Grandview, WA 98930",
                "formatted_address": "123 Main Street, Grandview, Washington 98930",
                "coordinates": {
                    "lat": 46.2546,
                    "lng": -119.9021
                },
                "confidence": 0.9
            }
        }

class ProximitySearchRequest(BaseModel):
    center: Point
    radius_miles: float = Field(..., gt=0, le=50)
    property_type: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_beds: Optional[int] = None
    min_baths: Optional[float] = None
    limit: int = Field(10, ge=1, le=100)
    
    class Config:
        schema_extra = {
            "example": {
                "center": {
                    "lat": 46.2546,
                    "lng": -119.9021
                },
                "radius_miles": 5,
                "property_type": "single_family",
                "min_price": 200000,
                "max_price": 500000,
                "min_beds": 3,
                "min_baths": 2,
                "limit": 10
            }
        }

class ProximitySearchResponse(BaseModel):
    properties: List[Dict[str, Any]]
    center: Point
    radius_miles: float
    count: int
    
    class Config:
        schema_extra = {
            "example": {
                "properties": [
                    {
                        "id": 1,
                        "address": "123 Main St",
                        "price": 350000,
                        "distance_miles": 0.8,
                        "coordinates": {
                            "lat": 46.2522,
                            "lng": -119.9077
                        }
                    }
                ],
                "center": {
                    "lat": 46.2546,
                    "lng": -119.9021
                },
                "radius_miles": 5,
                "count": 1
            }
        }

class SpatialDataResponse(BaseModel):
    id: int
    spatial_type: str
    name: str
    geometry_type: str
    geometry_json: Dict[str, Any]
    properties_json: Optional[Dict[str, Any]] = None
    created_date: str
    updated_date: str
    
    class Config:
        orm_mode = True

class SpatialDataCreate(BaseModel):
    spatial_type: str = Field(..., description="Type of spatial data (city, neighborhood, school_district, etc.)")
    name: str = Field(..., description="Name of the spatial area")
    geometry_type: str = Field(..., description="Type of geometry (point, polygon, linestring)")
    geometry_json: Dict[str, Any] = Field(..., description="GeoJSON geometry")
    properties_json: Optional[Dict[str, Any]] = Field(None, description="Associated properties")
    
    class Config:
        schema_extra = {
            "example": {
                "spatial_type": "neighborhood",
                "name": "Downtown Grandview",
                "geometry_type": "polygon",
                "geometry_json": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [-119.9200, 46.2400],
                            [-119.8900, 46.2400],
                            [-119.8900, 46.2600],
                            [-119.9200, 46.2600],
                            [-119.9200, 46.2400]
                        ]
                    ]
                },
                "properties_json": {
                    "city": "Grandview",
                    "state": "WA",
                    "population": 2500,
                    "median_income": 58000
                }
            }
        }

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

# Spatial Data Endpoints
@app.get("/spatial-data", response_model=List[SpatialDataResponse], tags=["Spatial Data"])
async def get_spatial_data(
    spatial_type: Optional[str] = None,
    name: Optional[str] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
) -> List[SpatialDataResponse]:
    """
    Get spatial data with optional filtering
    """
    query = db.query(SpatialData)
    
    # Apply filters
    if spatial_type:
        query = query.filter(SpatialData.spatial_type == spatial_type)
    if name:
        query = query.filter(SpatialData.name.ilike(f"%{name}%"))
    
    # Apply pagination
    query = query.order_by(SpatialData.spatial_type, SpatialData.name).offset(offset).limit(limit)
    
    # Get results
    spatial_data = query.all()
    
    return [data.to_dict() for data in spatial_data]

@app.get("/spatial-data/{spatial_id}", response_model=SpatialDataResponse, tags=["Spatial Data"])
async def get_spatial_data_by_id(
    spatial_id: int = Path(..., ge=1),
    db: Session = Depends(get_db)
) -> SpatialDataResponse:
    """
    Get spatial data by ID
    """
    spatial_data = db.query(SpatialData).filter(SpatialData.id == spatial_id).first()
    if not spatial_data:
        raise HTTPException(status_code=404, detail=f"Spatial data with ID {spatial_id} not found")
    
    return spatial_data.to_dict()

@app.post("/spatial-data", response_model=SpatialDataResponse, status_code=201, tags=["Spatial Data"])
async def create_spatial_data(
    spatial_data: SpatialDataCreate,
    db: Session = Depends(get_db)
) -> SpatialDataResponse:
    """
    Create new spatial data (e.g., neighborhood boundary)
    """
    # Validate GeoJSON
    if spatial_data.geometry_json.get("type") != spatial_data.geometry_type:
        raise HTTPException(
            status_code=400,
            detail=f"Geometry type mismatch: {spatial_data.geometry_type} vs {spatial_data.geometry_json.get('type')}"
        )
    
    # Create new spatial data
    new_spatial_data = SpatialData(
        spatial_type=spatial_data.spatial_type,
        name=spatial_data.name,
        geometry_type=spatial_data.geometry_type,
        geometry_json=spatial_data.geometry_json,
        properties_json=spatial_data.properties_json,
        created_date=datetime.utcnow(),
        updated_date=datetime.utcnow()
    )
    
    # Add to database
    db.add(new_spatial_data)
    db.commit()
    db.refresh(new_spatial_data)
    
    return new_spatial_data.to_dict()

# GeoJSON Endpoints
@app.get("/properties-geojson", response_model=GeoJSONFeatureCollection, tags=["GeoJSON"])
async def get_properties_geojson(
    city: Optional[str] = None,
    state: Optional[str] = None,
    zip_code: Optional[str] = None,
    property_type: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
) -> GeoJSONFeatureCollection:
    """
    Get properties as GeoJSON for mapping
    """
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
    
    # Ensure we have coordinates
    query = query.filter(PropertyListing.latitude.isnot(None))
    query = query.filter(PropertyListing.longitude.isnot(None))
    
    # Apply limit
    query = query.order_by(desc(PropertyListing.created_date)).limit(limit)
    
    # Get results
    properties = query.all()
    
    # Convert to GeoJSON
    features = []
    for prop in properties:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [prop.longitude, prop.latitude]
            },
            "properties": {
                "id": prop.id,
                "address": prop.address,
                "city": prop.city,
                "state": prop.state,
                "zip_code": prop.zip_code,
                "price": prop.price,
                "beds": prop.beds,
                "baths": prop.baths,
                "sqft": prop.sqft,
                "year_built": prop.year_built,
                "property_type": prop.property_type,
                "status": prop.status
            }
        }
        features.append(feature)
    
    return {"type": "FeatureCollection", "features": features}

@app.get("/neighborhoods", response_model=GeoJSONFeatureCollection, tags=["GeoJSON"])
async def get_neighborhoods(
    city: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
) -> GeoJSONFeatureCollection:
    """
    Get neighborhood boundaries as GeoJSON
    """
    query = db.query(SpatialData).filter(SpatialData.spatial_type == "neighborhood")
    
    # Apply filters if properties are available
    if city or state:
        # This assumes the properties_json has city and state fields
        # In a real implementation, you'd want to use a proper JSON query for PostgreSQL
        neighborhoods = query.all()
        
        filtered_neighborhoods = []
        for n in neighborhoods:
            props = n.properties_json
            if (not city or (props and props.get("city") == city)) and \
               (not state or (props and props.get("state") == state)):
                filtered_neighborhoods.append(n)
    else:
        filtered_neighborhoods = query.all()
    
    # Convert to GeoJSON
    features = []
    for neighborhood in filtered_neighborhoods:
        feature = {
            "type": "Feature",
            "geometry": neighborhood.geometry_json,
            "properties": {
                "id": neighborhood.id,
                "name": neighborhood.name,
                "spatial_type": neighborhood.spatial_type,
                **(neighborhood.properties_json or {})
            }
        }
        features.append(feature)
    
    return {"type": "FeatureCollection", "features": features}

# Geocoding Endpoint
@app.post("/geocode", response_model=GeocodeResponse, tags=["Geocoding"])
async def geocode_address(
    address_data: GeocodeRequest,
    db: Session = Depends(get_db)
) -> GeocodeResponse:
    """
    Geocode an address to get coordinates
    
    This is a simplified implementation that:
    1. First tries to find the address in our property database
    2. As a fallback, uses a very basic approximation for Grandview, WA
    
    In a production system, this would call an external geocoding service
    like Google Maps, Mapbox, or OpenStreetMap Nominatim.
    """
    # First try to find the address in our database
    address_pattern = f"%{address_data.address}%"
    query = db.query(PropertyListing).filter(PropertyListing.address.ilike(address_pattern))
    
    if address_data.city:
        query = query.filter(PropertyListing.city == address_data.city)
    if address_data.state:
        query = query.filter(PropertyListing.state == address_data.state)
    if address_data.zip_code:
        query = query.filter(PropertyListing.zip_code == address_data.zip_code)
    
    # Try to find the property with lat/lng
    property_match = query.filter(
        PropertyListing.latitude.isnot(None),
        PropertyListing.longitude.isnot(None)
    ).first()
    
    if property_match and property_match.latitude and property_match.longitude:
        # We found a match in our database
        formatted_address = f"{property_match.address}, {property_match.city}, {property_match.state} {property_match.zip_code}"
        return GeocodeResponse(
            input=address_data.address,
            formatted_address=formatted_address,
            coordinates=Point(lat=property_match.latitude, lng=property_match.longitude),
            confidence=0.95
        )
    
    # No match in our database, use simplified geocoding for Grandview area
    # This is a very basic approximation, meant only for demonstration
    city = address_data.city or "Grandview"
    state = address_data.state or "WA"
    zip_code = address_data.zip_code or "98930"
    
    if city.lower() == "grandview" and state.upper() == "WA":
        # Generate a point near the center of Grandview
        # (46.2506, -119.9018) - downtown Grandview center
        
        # Use the address number as a seed to generate a nearby point
        address_num = 0
        for char in address_data.address:
            if char.isdigit():
                address_num = int(''.join(c for c in address_data.address if c.isdigit()))
                break
        
        if address_num == 0:
            address_num = hash(address_data.address) % 1000
        
        # Use the address number to generate a small offset
        # This gives some variation but keeps points within the city
        lat_offset = (address_num % 100) / 10000  # ±0.01 degrees
        lng_offset = (address_num % 100) / 10000  # ±0.01 degrees
        
        # Center of Grandview plus offset
        lat = 46.2506 + (lat_offset - 0.005)  # Center ±0.005 degrees
        lng = -119.9018 + (lng_offset - 0.005)  # Center ±0.005 degrees
        
        formatted_address = f"{address_data.address}, {city}, {state} {zip_code}"
        return GeocodeResponse(
            input=address_data.address,
            formatted_address=formatted_address,
            coordinates=Point(lat=lat, lng=lng),
            confidence=0.7  # Lower confidence for approximation
        )
    
    # Not Grandview or no match
    raise HTTPException(
        status_code=404,
        detail="Address geocoding failed. This service currently only supports Grandview, WA area."
    )

# Proximity Search Endpoint
@app.post("/proximity-search", response_model=ProximitySearchResponse, tags=["Spatial Queries"])
async def proximity_search(
    search: ProximitySearchRequest,
    db: Session = Depends(get_db)
) -> ProximitySearchResponse:
    """
    Find properties within a radius of a point
    
    This is a simplified implementation that calculates distances using
    the Haversine formula directly in Python. In a production system with
    PostgreSQL, you would use PostGIS's ST_DWithin for better performance.
    """
    # Helper function to calculate distance using Haversine formula
    def haversine_distance(lat1, lon1, lat2, lon2):
        # Radius of the Earth in miles
        R = 3958.8
        
        # Convert latitude and longitude from degrees to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Differences in coordinates
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        # Haversine formula
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance
    
    # Get all properties with coordinates
    query = db.query(PropertyListing).filter(
        PropertyListing.latitude.isnot(None),
        PropertyListing.longitude.isnot(None)
    )
    
    # Apply property filters
    if search.property_type:
        query = query.filter(PropertyListing.property_type == search.property_type)
    if search.min_price:
        query = query.filter(PropertyListing.price >= search.min_price)
    if search.max_price:
        query = query.filter(PropertyListing.price <= search.max_price)
    if search.min_beds:
        query = query.filter(PropertyListing.beds >= search.min_beds)
    if search.min_baths:
        query = query.filter(PropertyListing.baths >= search.min_baths)
    
    # Get all potential matches
    properties = query.all()
    
    # Calculate distances and filter by radius
    results = []
    for prop in properties:
        if not prop.latitude or not prop.longitude:
            continue
        
        distance = haversine_distance(
            search.center.lat, search.center.lng,
            prop.latitude, prop.longitude
        )
        
        if distance <= search.radius_miles:
            results.append({
                **prop.to_dict(),
                "distance_miles": round(distance, 2),
                "coordinates": {
                    "lat": prop.latitude,
                    "lng": prop.longitude
                }
            })
    
    # Sort by distance and limit results
    results = sorted(results, key=lambda x: x["distance_miles"])[:search.limit]
    
    return ProximitySearchResponse(
        properties=results,
        center=search.center,
        radius_miles=search.radius_miles,
        count=len(results)
    )

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8003))
    
    # Run application
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )