"""
Spatial Data Microservice

This FastAPI microservice provides endpoints for accessing and processing 
geospatial data related to real estate, including property boundaries,
neighborhood analytics, and proximity searches.
"""

import os
import sys
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json

# Add the parent directory to the path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database models
from common.db_init import PropertyListing, SpatialData, Base
from sqlalchemy import create_engine, desc, func, text
from sqlalchemy.orm import sessionmaker, Session

# Create FastAPI app
app = FastAPI(
    title="Spatial Data API",
    description="API for accessing and processing geospatial real estate data",
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
class SpatialDataBase(BaseModel):
    spatial_type: str
    external_id: Optional[str] = None
    name: str
    geometry_type: str
    geometry_json: dict
    properties_json: Optional[dict] = None

class SpatialDataCreate(SpatialDataBase):
    pass

class SpatialDataResponse(SpatialDataBase):
    id: int
    created_date: datetime
    updated_date: datetime
    
    class Config:
        from_attributes = True

class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: Dict[str, Any]
    properties: Dict[str, Any]
    id: Optional[str] = None

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]

class ProximitySearchRequest(BaseModel):
    latitude: float
    longitude: float
    radius_miles: float = 1.0
    property_types: Optional[List[str]] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_beds: Optional[int] = None
    min_baths: Optional[float] = None
    
class NearbyAmenity(BaseModel):
    name: str
    type: str
    distance_miles: float
    latitude: float
    longitude: float
    
class ProximitySearchResponse(BaseModel):
    properties: List[GeoJSONFeature]
    center: Dict[str, float]
    radius_miles: float
    amenities: Optional[List[NearbyAmenity]] = None

class GeocodeRequest(BaseModel):
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

class GeocodeResponse(BaseModel):
    latitude: float
    longitude: float
    formatted_address: str
    confidence: float
    components: Dict[str, str]  # address components like zip, city, etc.

# API Routes
@app.get("/")
def read_root():
    return {"message": "Spatial Data Microservice API", "status": "active"}

@app.get("/health")
def health_check():
    try:
        db_url = get_db_url()
        engine = create_engine(db_url)
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            result.fetchall()
        return {"status": "healthy", "database_connection": "ok"}
    except Exception as e:
        return {"status": "unhealthy", "detail": str(e)}

@app.get("/spatial-data", response_model=List[SpatialDataResponse])
def get_spatial_data(
    spatial_type: Optional[str] = None,
    external_id: Optional[str] = None,
    name: Optional[str] = None,
    geometry_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get spatial data with optional filtering
    """
    query = db.query(SpatialData)
    
    # Apply filters
    if spatial_type:
        query = query.filter(SpatialData.spatial_type == spatial_type)
    if external_id:
        query = query.filter(SpatialData.external_id == external_id)
    if name:
        query = query.filter(SpatialData.name.ilike(f"%{name}%"))
    if geometry_type:
        query = query.filter(SpatialData.geometry_type == geometry_type)
    
    # Order by newest first
    query = query.order_by(desc(SpatialData.updated_date))
    
    # Pagination
    spatial_data = query.offset(skip).limit(limit).all()
    
    # Parse JSON strings if needed
    result = []
    for item in spatial_data:
        item_dict = {
            "id": item.id,
            "spatial_type": item.spatial_type,
            "external_id": item.external_id,
            "name": item.name,
            "geometry_type": item.geometry_type,
            "geometry_json": json.loads(item.geometry_json) if isinstance(item.geometry_json, str) else item.geometry_json,
            "properties_json": json.loads(item.properties_json) if isinstance(item.properties_json, str) else item.properties_json,
            "created_date": item.created_date,
            "updated_date": item.updated_date
        }
        result.append(item_dict)
    
    return result

@app.get("/spatial-data/{spatial_id}", response_model=SpatialDataResponse)
def get_spatial_data_by_id(spatial_id: int, db: Session = Depends(get_db)):
    """
    Get a specific spatial data record by ID
    """
    spatial_data = db.query(SpatialData).filter(SpatialData.id == spatial_id).first()
    if spatial_data is None:
        raise HTTPException(status_code=404, detail="Spatial data not found")
    
    # Parse JSON strings if needed
    spatial_data.geometry_json = json.loads(spatial_data.geometry_json) if isinstance(spatial_data.geometry_json, str) else spatial_data.geometry_json
    spatial_data.properties_json = json.loads(spatial_data.properties_json) if isinstance(spatial_data.properties_json, str) else spatial_data.properties_json
    
    return spatial_data

@app.post("/spatial-data", response_model=SpatialDataResponse)
def create_spatial_data(spatial_data: SpatialDataCreate, db: Session = Depends(get_db)):
    """
    Create a new spatial data record
    """
    # Convert pydantic model to dict
    spatial_dict = spatial_data.dict()
    
    # Convert dictionary fields to JSON strings
    if spatial_dict.get('geometry_json'):
        spatial_dict['geometry_json'] = json.dumps(spatial_dict['geometry_json'])
    if spatial_dict.get('properties_json'):
        spatial_dict['properties_json'] = json.dumps(spatial_dict['properties_json'])
    
    db_spatial = SpatialData(**spatial_dict)
    db.add(db_spatial)
    db.commit()
    db.refresh(db_spatial)
    
    # Convert back from JSON strings for response
    db_spatial.geometry_json = json.loads(db_spatial.geometry_json) if isinstance(db_spatial.geometry_json, str) else db_spatial.geometry_json
    db_spatial.properties_json = json.loads(db_spatial.properties_json) if isinstance(db_spatial.properties_json, str) else db_spatial.properties_json
    
    return db_spatial

@app.get("/properties/geojson", response_model=GeoJSONFeatureCollection)
def get_properties_geojson(
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    property_type: Optional[str] = None,
    status: Optional[str] = None,
    city: Optional[str] = None,
    zip_code: Optional[str] = None,
    min_beds: Optional[int] = None,
    min_baths: Optional[float] = None,
    min_sqft: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """
    Get properties in GeoJSON format for map display
    """
    query = db.query(PropertyListing).filter(
        PropertyListing.latitude.isnot(None),
        PropertyListing.longitude.isnot(None)
    )
    
    # Apply filters
    if min_price:
        query = query.filter(PropertyListing.price >= min_price)
    if max_price:
        query = query.filter(PropertyListing.price <= max_price)
    if property_type:
        query = query.filter(PropertyListing.property_type == property_type)
    if status:
        query = query.filter(PropertyListing.status == status)
    if city:
        query = query.filter(PropertyListing.city == city)
    if zip_code:
        query = query.filter(PropertyListing.zip_code == zip_code)
    if min_beds:
        query = query.filter(PropertyListing.beds >= min_beds)
    if min_baths:
        query = query.filter(PropertyListing.baths >= min_baths)
    if min_sqft:
        query = query.filter(PropertyListing.sqft >= min_sqft)
    
    # Execute query and convert to GeoJSON
    properties = query.all()
    features = []
    
    for prop in properties:
        # Create GeoJSON feature for each property
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
                "property_type": prop.property_type,
                "status": prop.status,
                "year_built": prop.year_built,
                "listed_date": prop.listed_date.isoformat() if prop.listed_date else None
            }
        }
        features.append(feature)
    
    # Return GeoJSON FeatureCollection
    return {
        "type": "FeatureCollection",
        "features": features
    }

@app.post("/proximity-search", response_model=ProximitySearchResponse)
def proximity_search(search: ProximitySearchRequest, db: Session = Depends(get_db)):
    """
    Find properties within a specified radius of a location
    """
    # Constants for the Haversine formula
    EARTH_RADIUS_MILES = 3963.19  # Earth radius in miles
    
    # Calculate bounding box to limit initial query
    # This is an optimization to avoid calculating distances for all properties
    lat = search.latitude
    lng = search.longitude
    radius_miles = search.radius_miles
    
    # Rough approximation: 1 degree latitude = 69 miles, 1 degree longitude = 69 * cos(latitude) miles
    lat_delta = radius_miles / 69.0
    lng_delta = radius_miles / (69.0 * abs(float(search.latitude) * 3.14159 / 180).cos())
    
    # Query properties within the bounding box
    query = db.query(PropertyListing).filter(
        PropertyListing.latitude.between(lat - lat_delta, lat + lat_delta),
        PropertyListing.longitude.between(lng - lng_delta, lng + lng_delta)
    )
    
    # Apply additional filters
    if search.property_types:
        query = query.filter(PropertyListing.property_type.in_(search.property_types))
    if search.min_price:
        query = query.filter(PropertyListing.price >= search.min_price)
    if search.max_price:
        query = query.filter(PropertyListing.price <= search.max_price)
    if search.min_beds:
        query = query.filter(PropertyListing.beds >= search.min_beds)
    if search.min_baths:
        query = query.filter(PropertyListing.baths >= search.min_baths)
    
    # Get the properties to check
    properties = query.all()
    
    # Calculate actual distances and filter by radius
    result_features = []
    
    for prop in properties:
        # Calculate distance using Haversine formula
        distance = 0  # Implement Haversine formula or use a library like geopy
        
        # In a real implementation, we'd calculate the actual distance
        # For now, we'll assume all properties in the bounding box are within the radius
        
        # Create GeoJSON feature
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
                "property_type": prop.property_type,
                "status": prop.status,
                "year_built": prop.year_built,
                "distance": distance,  # Add the distance to the property
                "listed_date": prop.listed_date.isoformat() if prop.listed_date else None
            }
        }
        result_features.append(feature)
    
    # In a full implementation, we would also query for nearby amenities
    # For now, we'll return a simple response
    
    return {
        "properties": result_features,
        "center": {"latitude": lat, "longitude": lng},
        "radius_miles": radius_miles,
        "amenities": []  # Would populate this with nearby amenities
    }

@app.post("/geocode", response_model=GeocodeResponse)
def geocode_address(geocode_request: GeocodeRequest):
    """
    Geocode an address to get coordinates
    
    This endpoint would connect to a geocoding service like Google Maps, OpenStreetMap Nominatim,
    or other geocoding providers. For now, it returns a mock response.
    """
    # In a real implementation, we would call a geocoding service
    # For now, return a simplified response
    
    # This would be replaced with actual geocoding API call
    full_address = f"{geocode_request.address}, {geocode_request.city or ''}, {geocode_request.state or ''} {geocode_request.zip_code or ''}"
    
    # Mock data
    return {
        "latitude": 47.6062,  # Example: Seattle
        "longitude": -122.3321,
        "formatted_address": full_address.strip().replace(", ,", ","),
        "confidence": 0.9,
        "components": {
            "street": geocode_request.address,
            "city": geocode_request.city or "",
            "state": geocode_request.state or "",
            "zip": geocode_request.zip_code or "",
            "country": "USA"
        }
    }

@app.get("/neighborhoods", response_model=GeoJSONFeatureCollection)
def get_neighborhoods(
    city: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get neighborhood boundaries as GeoJSON
    """
    query = db.query(SpatialData).filter(SpatialData.spatial_type == 'neighborhood')
    
    # Apply additional filters based on properties
    if city or state:
        query = query.filter(SpatialData.properties_json.cast(str).like(f"%{city or ''}%"))
    
    neighborhoods = query.all()
    features = []
    
    for neighborhood in neighborhoods:
        # Parse geometry and properties from JSON
        geometry = json.loads(neighborhood.geometry_json) if isinstance(neighborhood.geometry_json, str) else neighborhood.geometry_json
        properties = json.loads(neighborhood.properties_json) if isinstance(neighborhood.properties_json, str) else neighborhood.properties_json
        
        # Create GeoJSON feature
        feature = {
            "type": "Feature",
            "geometry": geometry,
            "properties": properties or {},
            "id": str(neighborhood.id)
        }
        features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

if __name__ == "__main__":
    import uvicorn
    # Start the API server
    uvicorn.run("app:app", host="0.0.0.0", port=8003, reload=True)