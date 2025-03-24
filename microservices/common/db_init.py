"""
Database Initialization Module

This module defines SQLAlchemy models and provides database connection utilities
for the IntelligentEstate microservices.
"""

import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

import sqlalchemy
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, 
    ForeignKey, Text, JSON, create_engine, Index
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker, Session

# Create SQLAlchemy base
Base = declarative_base()

# Property Listing Model
class PropertyListing(Base):
    __tablename__ = "property_listings"
    
    id = Column(Integer, primary_key=True)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(20), nullable=False)
    price = Column(Float, nullable=False)
    beds = Column(Integer, nullable=False)
    baths = Column(Float, nullable=False)
    sqft = Column(Integer, nullable=False)
    lot_size = Column(Float, nullable=True)
    year_built = Column(Integer, nullable=True)
    property_type = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="for_sale")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_date = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    listed_date = Column(DateTime, nullable=True)
    
    # Relationships
    valuations = relationship("PropertyValuation", back_populates="property")
    
    # Indexes for frequently queried fields
    __table_args__ = (
        Index('idx_property_location', 'city', 'state', 'zip_code'),
        Index('idx_property_features', 'beds', 'baths', 'sqft'),
        Index('idx_property_price', 'price'),
        Index('idx_property_status', 'status'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'zip_code': self.zip_code,
            'price': self.price,
            'beds': self.beds,
            'baths': self.baths,
            'sqft': self.sqft,
            'lot_size': self.lot_size,
            'year_built': self.year_built,
            'property_type': self.property_type,
            'description': self.description,
            'status': self.status,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None,
            'listed_date': self.listed_date.isoformat() if self.listed_date else None,
        }

# Property Valuation Model
class PropertyValuation(Base):
    __tablename__ = "property_valuations"
    
    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey('property_listings.id'), nullable=False)
    valuation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    estimated_value = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=True)
    valuation_method = Column(String(50), nullable=True)
    valuation_details = Column(JSON, nullable=True)
    created_by = Column(String(255), nullable=True)
    
    # Relationships
    property = relationship("PropertyListing", back_populates="valuations")
    
    # Indexes
    __table_args__ = (
        Index('idx_valuation_property', 'property_id'),
        Index('idx_valuation_date', 'valuation_date'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'property_id': self.property_id,
            'valuation_date': self.valuation_date.isoformat() if self.valuation_date else None,
            'estimated_value': self.estimated_value,
            'confidence_score': self.confidence_score,
            'valuation_method': self.valuation_method,
            'valuation_details': self.valuation_details,
            'created_by': self.created_by,
        }

# Market Metrics Model
class MarketMetrics(Base):
    __tablename__ = "market_metrics"
    
    id = Column(Integer, primary_key=True)
    area_type = Column(String(20), nullable=False)  # zip, city, county, state
    area_value = Column(String(50), nullable=False) # e.g., "98930", "Grandview", "Yakima", "WA"
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    median_price = Column(Float, nullable=True)
    average_price = Column(Float, nullable=True)
    price_per_sqft = Column(Float, nullable=True)
    total_listings = Column(Integer, nullable=True)
    new_listings = Column(Integer, nullable=True)
    total_sales = Column(Integer, nullable=True)
    avg_days_on_market = Column(Float, nullable=True)
    list_to_sale_ratio = Column(Float, nullable=True)
    price_drops = Column(Integer, nullable=True)
    created_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_market_area', 'area_type', 'area_value'),
        Index('idx_market_period', 'period_start', 'period_end'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'area_type': self.area_type,
            'area_value': self.area_value,
            'period_start': self.period_start.isoformat() if self.period_start else None,
            'period_end': self.period_end.isoformat() if self.period_end else None,
            'median_price': self.median_price,
            'average_price': self.average_price,
            'price_per_sqft': self.price_per_sqft,
            'total_listings': self.total_listings,
            'new_listings': self.new_listings,
            'total_sales': self.total_sales,
            'avg_days_on_market': self.avg_days_on_market,
            'list_to_sale_ratio': self.list_to_sale_ratio,
            'price_drops': self.price_drops,
            'created_date': self.created_date.isoformat() if self.created_date else None,
        }

# Market Prediction Model
class MarketPrediction(Base):
    __tablename__ = "market_predictions"
    
    id = Column(Integer, primary_key=True)
    area_type = Column(String(20), nullable=False)  # zip, city, county, state
    area_value = Column(String(50), nullable=False) # e.g., "98930", "Grandview", "Yakima", "WA"
    prediction_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    target_date = Column(DateTime, nullable=False)
    median_price_predicted = Column(Float, nullable=True)
    price_change_percent = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    model_version = Column(String(50), nullable=True)
    prediction_factors = Column(JSON, nullable=True)
    
    # Indexes
    __table_args__ = (
        Index('idx_prediction_area', 'area_type', 'area_value'),
        Index('idx_prediction_target', 'target_date'),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'area_type': self.area_type,
            'area_value': self.area_value,
            'prediction_date': self.prediction_date.isoformat() if self.prediction_date else None,
            'target_date': self.target_date.isoformat() if self.target_date else None,
            'median_price_predicted': self.median_price_predicted,
            'price_change_percent': self.price_change_percent,
            'confidence_score': self.confidence_score,
            'model_version': self.model_version,
            'prediction_factors': self.prediction_factors,
        }

# Spatial Data Model
class SpatialData(Base):
    __tablename__ = "spatial_data"
    
    id = Column(Integer, primary_key=True)
    spatial_type = Column(String(50), nullable=False)  # e.g., neighborhood, school_district, flood_zone
    name = Column(String(255), nullable=False)
    geometry_type = Column(String(20), nullable=False)  # point, polygon, linestring
    geometry_json = Column(JSON, nullable=False)
    properties_json = Column(JSON, nullable=True)
    created_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_date = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'spatial_type': self.spatial_type,
            'name': self.name,
            'geometry_type': self.geometry_type,
            'geometry_json': self.geometry_json,
            'properties_json': self.properties_json,
            'created_date': self.created_date.isoformat() if self.created_date else None,
            'updated_date': self.updated_date.isoformat() if self.updated_date else None,
        }

# Database Connection Functions
def get_database_url() -> str:
    """
    Get database URL from environment variables
    """
    # Default to using environment variable if set
    if os.environ.get('DATABASE_URL'):
        return os.environ['DATABASE_URL']
    
    # Otherwise construct from individual components
    host = os.environ.get('PGHOST', 'localhost')
    port = os.environ.get('PGPORT', '5432')
    user = os.environ.get('PGUSER', 'postgres')
    password = os.environ.get('PGPASSWORD', 'postgres')
    database = os.environ.get('PGDATABASE', 'intelligentEstate')
    
    return f"postgresql://{user}:{password}@{host}:{port}/{database}"

def init_db() -> None:
    """
    Create all database tables if they don't exist
    """
    engine = create_engine(get_database_url())
    Base.metadata.create_all(bind=engine)

def get_db_engine():
    """
    Get a SQLAlchemy database engine
    """
    return create_engine(get_database_url())

def get_db_session() -> Session:
    """
    Get a SQLAlchemy database session
    """
    engine = get_db_engine()
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def create_sample_data():
    """
    Create sample data for development
    """
    session = get_db_session()
    
    # Check if data already exists
    if session.query(PropertyListing).count() > 0:
        print("Sample data already exists, skipping creation")
        session.close()
        return
    
    # Add sample property listings
    properties = [
        PropertyListing(
            address="123 Main St",
            city="Grandview",
            state="WA",
            zip_code="98930",
            price=350000,
            beds=4,
            baths=2.5,
            sqft=2450,
            lot_size=0.25,
            year_built=1998,
            property_type="single_family",
            status="for_sale",
            latitude=46.2546,
            longitude=-119.9021,
            description="Beautiful family home in quiet neighborhood with mountain views.",
            listed_date=datetime.utcnow()
        ),
        PropertyListing(
            address="456 Elm Ave",
            city="Grandview",
            state="WA",
            zip_code="98930",
            price=275000,
            beds=3,
            baths=2,
            sqft=1850,
            lot_size=0.18,
            year_built=1985,
            property_type="single_family",
            status="for_sale",
            latitude=46.2522,
            longitude=-119.9077,
            description="Well-maintained home with updated kitchen and bathrooms.",
            listed_date=datetime.utcnow()
        ),
        PropertyListing(
            address="789 Oak Dr",
            city="Grandview",
            state="WA",
            zip_code="98930",
            price=425000,
            beds=5,
            baths=3,
            sqft=3100,
            lot_size=0.35,
            year_built=2005,
            property_type="single_family",
            status="for_sale",
            latitude=46.2598,
            longitude=-119.8967,
            description="Spacious modern home with open floor plan and large backyard.",
            listed_date=datetime.utcnow()
        ),
        PropertyListing(
            address="101 Maple Ln",
            city="Grandview",
            state="WA",
            zip_code="98930",
            price=320000,
            beds=3,
            baths=2.5,
            sqft=2100,
            lot_size=0.22,
            year_built=2000,
            property_type="single_family",
            status="sold",
            latitude=46.2535,
            longitude=-119.9055,
            description="Recently updated home with new appliances and finished basement.",
            listed_date=datetime.utcnow() 
        ),
        PropertyListing(
            address="202 Pine St",
            city="Grandview",
            state="WA",
            zip_code="98930",
            price=240000,
            beds=2,
            baths=1,
            sqft=1350,
            lot_size=0.15,
            year_built=1975,
            property_type="single_family",
            status="for_sale",
            latitude=46.2488,
            longitude=-119.9112,
            description="Charming starter home in established neighborhood.",
            listed_date=datetime.utcnow()
        ),
    ]
    
    # Add properties to session
    for property_listing in properties:
        session.add(property_listing)
    
    # Create sample valuations
    session.flush()  # Flush to get IDs
    
    for property_listing in properties:
        valuation = PropertyValuation(
            property_id=property_listing.id,
            estimated_value=property_listing.price * 1.05,  # Slightly higher than listing
            confidence_score=0.85,
            valuation_method="sales_comparison",
            valuation_details={
                "comparable_properties": [p.id for p in properties if p.id != property_listing.id][:3],
                "adjustments": {
                    "size": 5000,
                    "location": -2000,
                    "condition": 0
                }
            },
            created_by="system"
        )
        session.add(valuation)
    
    # Create sample market metrics
    market_metrics = [
        MarketMetrics(
            area_type="zip",
            area_value="98930",
            period_start=datetime(2024, 1, 1),
            period_end=datetime(2024, 1, 31),
            median_price=315000,
            average_price=330000,
            price_per_sqft=175,
            total_listings=25,
            new_listings=8,
            total_sales=12,
            avg_days_on_market=45,
            list_to_sale_ratio=0.97,
            price_drops=5
        ),
        MarketMetrics(
            area_type="zip",
            area_value="98930",
            period_start=datetime(2024, 2, 1),
            period_end=datetime(2024, 2, 29),
            median_price=322000,
            average_price=335000,
            price_per_sqft=178,
            total_listings=28,
            new_listings=10,
            total_sales=14,
            avg_days_on_market=42,
            list_to_sale_ratio=0.96,
            price_drops=4
        ),
        MarketMetrics(
            area_type="city",
            area_value="Grandview",
            period_start=datetime(2024, 1, 1),
            period_end=datetime(2024, 1, 31),
            median_price=318000,
            average_price=332000,
            price_per_sqft=172,
            total_listings=30,
            new_listings=10,
            total_sales=15,
            avg_days_on_market=48,
            list_to_sale_ratio=0.95,
            price_drops=6
        ),
        MarketMetrics(
            area_type="city",
            area_value="Grandview",
            period_start=datetime(2024, 2, 1),
            period_end=datetime(2024, 2, 29),
            median_price=325000,
            average_price=340000,
            price_per_sqft=175,
            total_listings=32,
            new_listings=12,
            total_sales=18,
            avg_days_on_market=45,
            list_to_sale_ratio=0.96,
            price_drops=5
        )
    ]
    
    for metric in market_metrics:
        session.add(metric)
    
    # Create sample market predictions
    market_predictions = [
        MarketPrediction(
            area_type="zip",
            area_value="98930",
            target_date=datetime(2024, 6, 30),
            median_price_predicted=335000,
            price_change_percent=5.0,
            confidence_score=0.8,
            model_version="v1.0",
            prediction_factors={
                "historical_trend": 0.7,
                "seasonality": 0.2,
                "economic_indicators": 0.1
            }
        ),
        MarketPrediction(
            area_type="zip",
            area_value="98930",
            target_date=datetime(2024, 12, 31),
            median_price_predicted=350000,
            price_change_percent=8.2,
            confidence_score=0.7,
            model_version="v1.0",
            prediction_factors={
                "historical_trend": 0.65,
                "seasonality": 0.15,
                "economic_indicators": 0.2
            }
        ),
        MarketPrediction(
            area_type="city",
            area_value="Grandview",
            target_date=datetime(2024, 6, 30),
            median_price_predicted=338000,
            price_change_percent=4.5,
            confidence_score=0.8,
            model_version="v1.0",
            prediction_factors={
                "historical_trend": 0.7,
                "seasonality": 0.2,
                "economic_indicators": 0.1
            }
        ),
        MarketPrediction(
            area_type="city",
            area_value="Grandview",
            target_date=datetime(2024, 12, 31),
            median_price_predicted=355000,
            price_change_percent=7.8,
            confidence_score=0.7,
            model_version="v1.0",
            prediction_factors={
                "historical_trend": 0.65,
                "seasonality": 0.15,
                "economic_indicators": 0.2
            }
        )
    ]
    
    for prediction in market_predictions:
        session.add(prediction)
    
    # Create sample spatial data (simplified neighborhood boundaries)
    downtown_geo = {
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
    }
    
    eastside_geo = {
        "type": "Polygon",
        "coordinates": [
            [
                [-119.8900, 46.2400],
                [-119.8600, 46.2400],
                [-119.8600, 46.2600],
                [-119.8900, 46.2600],
                [-119.8900, 46.2400]
            ]
        ]
    }
    
    westside_geo = {
        "type": "Polygon",
        "coordinates": [
            [
                [-119.9500, 46.2400],
                [-119.9200, 46.2400],
                [-119.9200, 46.2600],
                [-119.9500, 46.2600],
                [-119.9500, 46.2400]
            ]
        ]
    }
    
    spatial_data = [
        SpatialData(
            spatial_type="neighborhood",
            name="Downtown Grandview",
            geometry_type="Polygon",
            geometry_json=downtown_geo,
            properties_json={
                "city": "Grandview",
                "state": "WA",
                "population": 2500,
                "median_income": 58000
            }
        ),
        SpatialData(
            spatial_type="neighborhood",
            name="Eastside",
            geometry_type="Polygon",
            geometry_json=eastside_geo,
            properties_json={
                "city": "Grandview",
                "state": "WA",
                "population": 1850,
                "median_income": 62000
            }
        ),
        SpatialData(
            spatial_type="neighborhood",
            name="Westside",
            geometry_type="Polygon",
            geometry_json=westside_geo,
            properties_json={
                "city": "Grandview",
                "state": "WA",
                "population": 2100,
                "median_income": 55000
            }
        )
    ]
    
    for data in spatial_data:
        session.add(data)
    
    # Commit all changes
    session.commit()
    session.close()
    
    print("Sample data created successfully")

if __name__ == "__main__":
    # Initialize database
    print("Initializing database...")
    init_db()
    
    # Create sample data if in development mode
    if os.environ.get('ENVIRONMENT', 'development') == 'development':
        print("Creating sample data...")
        create_sample_data()
    
    print("Database initialization complete")