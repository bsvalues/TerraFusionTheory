"""
Database Initialization and Model Definitions

This module defines the database models for the IntelligentEstate platform and 
provides initialization functions.
"""

import os
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean, DateTime, 
    ForeignKey, Text, JSON, Table, MetaData, inspect, func
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

# Create the declarative base
Base = declarative_base()

# Define database models
class PropertyListing(Base):
    """
    Property listing model representing real estate properties
    """
    __tablename__ = 'property_listings'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    external_id = Column(String(50), unique=True, nullable=True, index=True)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=True, index=True)
    state = Column(String(50), nullable=True, index=True)
    zip_code = Column(String(20), nullable=True, index=True)
    price = Column(Float, nullable=True, index=True)
    beds = Column(Integer, nullable=True)
    baths = Column(Float, nullable=True)
    sqft = Column(Float, nullable=True)
    lot_size = Column(Float, nullable=True)
    year_built = Column(Integer, nullable=True)
    property_type = Column(String(50), nullable=True, index=True)
    status = Column(String(50), nullable=True, index=True)
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    description = Column(Text, nullable=True)
    features = Column(Text, nullable=True)  # JSON stored as text
    images = Column(Text, nullable=True)  # JSON stored as text
    listed_date = Column(DateTime, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    valuations = relationship("PropertyValuation", back_populates="property", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<PropertyListing(id={self.id}, address='{self.address}', price={self.price})>"


class PropertyValuation(Base):
    """
    Property valuation model for storing estimated property values
    """
    __tablename__ = 'property_valuations'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    property_id = Column(Integer, ForeignKey('property_listings.id'), nullable=False, index=True)
    estimated_value = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=True)
    method = Column(String(100), nullable=False)  # e.g., "comp-analysis", "ml-prediction", "appraisal"
    features_used = Column(Text, nullable=True)  # JSON stored as text
    is_prediction = Column(Boolean, default=False)
    valuation_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    property = relationship("PropertyListing", back_populates="valuations")
    
    def __repr__(self):
        return f"<PropertyValuation(id={self.id}, property_id={self.property_id}, value={self.estimated_value})>"


class DataSource(Base):
    """
    Data source configuration for ETL pipelines
    """
    __tablename__ = 'data_sources'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False, unique=True)
    source_type = Column(String(50), nullable=False, index=True)  # e.g., "mls", "tax", "county"
    url = Column(String(255), nullable=True)
    auth_type = Column(String(50), nullable=True)  # e.g., "api_key", "oauth", "basic"
    config_json = Column(Text, nullable=True)  # JSON configuration stored as text
    is_active = Column(Boolean, default=True)
    last_fetch_date = Column(DateTime, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    fetch_logs = relationship("DataFetchLog", back_populates="source", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<DataSource(id={self.id}, name='{self.name}', type='{self.source_type}')>"


class DataFetchLog(Base):
    """
    Log of data fetching operations for auditing and troubleshooting
    """
    __tablename__ = 'data_fetch_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(Integer, ForeignKey('data_sources.id'), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=False, index=True)  # e.g., "running", "success", "failed"
    records_fetched = Column(Integer, nullable=True)
    details_json = Column(Text, nullable=True)  # JSON details stored as text
    error_message = Column(Text, nullable=True)
    
    # Relationships
    source = relationship("DataSource", back_populates="fetch_logs")
    
    def __repr__(self):
        return f"<DataFetchLog(id={self.id}, source_id={self.source_id}, status='{self.status}')>"


class ETLJob(Base):
    """
    ETL job tracking for monitoring and auditing ETL processes
    """
    __tablename__ = 'etl_jobs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_name = Column(String(100), nullable=False, index=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=False, index=True)  # e.g., "running", "success", "failed"
    records_processed = Column(Integer, nullable=True)
    details_json = Column(Text, nullable=True)  # JSON details stored as text
    error_message = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<ETLJob(id={self.id}, job_name='{self.job_name}', status='{self.status}')>"


class SpatialData(Base):
    """
    Spatial data for boundaries, zones, and other geographic entities
    """
    __tablename__ = 'spatial_data'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    spatial_type = Column(String(50), nullable=False, index=True)  # e.g., "neighborhood", "zip", "school_district"
    external_id = Column(String(50), nullable=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    geometry_type = Column(String(50), nullable=False)  # e.g., "polygon", "point", "linestring"
    geometry_json = Column(Text, nullable=False)  # GeoJSON geometry stored as text
    properties_json = Column(Text, nullable=True)  # Properties JSON stored as text
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SpatialData(id={self.id}, name='{self.name}', type='{self.spatial_type}')>"


class MarketMetrics(Base):
    """
    Market metrics for real estate market analysis
    """
    __tablename__ = 'market_metrics'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    area_type = Column(String(50), nullable=False, index=True)  # e.g., "zip", "city", "neighborhood"
    area_value = Column(String(100), nullable=False, index=True)  # e.g., "98001", "Seattle", "Ballard"
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False, index=True)
    median_price = Column(Float, nullable=True)
    average_price = Column(Float, nullable=True)
    price_per_sqft = Column(Float, nullable=True)
    total_listings = Column(Integer, nullable=True)
    new_listings = Column(Integer, nullable=True)
    total_sales = Column(Integer, nullable=True)
    avg_days_on_market = Column(Float, nullable=True)
    list_to_sale_ratio = Column(Float, nullable=True)  # sale price / list price
    price_drops = Column(Integer, nullable=True)
    metrics_json = Column(Text, nullable=True)  # Additional metrics JSON stored as text
    created_date = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<MarketMetrics(id={self.id}, area='{self.area_value}', period_end='{self.period_end}')>"


class MarketPrediction(Base):
    """
    Market predictions based on ML models
    """
    __tablename__ = 'market_predictions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    area_type = Column(String(50), nullable=False, index=True)  # e.g., "zip", "city", "neighborhood"
    area_value = Column(String(100), nullable=False, index=True)  # e.g., "98001", "Seattle", "Ballard"
    for_date = Column(DateTime, nullable=False, index=True)  # The date the prediction is for
    median_price = Column(Float, nullable=False)
    average_price = Column(Float, nullable=True)
    price_per_sqft = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    features_used = Column(Text, nullable=True)  # JSON features used in prediction stored as text
    model_version = Column(String(50), nullable=True)
    metrics_json = Column(Text, nullable=True)  # Additional metrics JSON stored as text
    prediction_date = Column(DateTime, default=datetime.utcnow)  # When the prediction was made
    
    def __repr__(self):
        return f"<MarketPrediction(id={self.id}, area='{self.area_value}', for_date='{self.for_date}')>"


class MLModel(Base):
    """
    ML model metadata and versioning
    """
    __tablename__ = 'ml_models'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(100), nullable=False, index=True)
    model_type = Column(String(50), nullable=False)  # e.g., "linear", "random_forest", "neural_network"
    version = Column(String(50), nullable=False)
    target_variable = Column(String(100), nullable=False)  # What the model predicts
    features_json = Column(Text, nullable=True)  # JSON list of features used
    hyperparams_json = Column(Text, nullable=True)  # JSON hyperparameters
    metrics_json = Column(Text, nullable=True)  # JSON performance metrics
    is_active = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<MLModel(id={self.id}, name='{self.model_name}', version='{self.version}')>"


def init_db():
    """
    Initialize the database and create all tables
    """
    try:
        # Get database URL from environment
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            print("ERROR: DATABASE_URL environment variable not set!")
            return False
        
        # Create engine and connect
        engine = create_engine(db_url)
        
        # Create all tables
        Base.metadata.create_all(engine)
        
        # Check if the required tables exist
        inspector = inspect(engine)
        all_tables = [
            PropertyListing.__tablename__, 
            PropertyValuation.__tablename__,
            DataSource.__tablename__,
            DataFetchLog.__tablename__,
            ETLJob.__tablename__,
            SpatialData.__tablename__,
            MarketMetrics.__tablename__,
            MarketPrediction.__tablename__,
            MLModel.__tablename__
        ]
        
        existing_tables = inspector.get_table_names()
        missing_tables = set(all_tables) - set(existing_tables)
        
        if missing_tables:
            print(f"ERROR: Failed to create tables: {', '.join(missing_tables)}")
            return False
        
        print(f"Database initialized with {len(all_tables)} tables")
        
        # Create a session factory for future use
        SessionFactory = sessionmaker(bind=engine)
        
        # Initialize with seed data if needed
        seed_data(SessionFactory)
        
        return True
    
    except Exception as e:
        print(f"ERROR initializing database: {str(e)}")
        return False


def seed_data(SessionFactory):
    """
    Seed the database with initial data
    """
    try:
        session = SessionFactory()
        
        # Check if we need to seed data
        if session.query(DataSource).count() == 0:
            print("Seeding initial data sources...")
            
            # Create default data sources
            sources = [
                DataSource(
                    name="Demo MLS",
                    source_type="mls",
                    url="https://api.demo-mls.example.com",
                    auth_type="api_key",
                    config_json='{"api_key_param": "api_key", "result_limit": 100}',
                    is_active=True
                ),
                DataSource(
                    name="Demo Tax Records",
                    source_type="tax",
                    url="https://api.demo-tax.example.com",
                    auth_type="basic",
                    config_json='{"username_param": "user", "password_param": "pass"}',
                    is_active=True
                ),
                DataSource(
                    name="Yakima County",
                    source_type="county",
                    url="https://api.yakima.gov/properties",
                    auth_type="api_key",
                    config_json='{"api_key_param": "key", "format": "json"}',
                    is_active=True
                )
            ]
            
            session.add_all(sources)
            session.commit()
            print(f"Added {len(sources)} data sources")
        
        # Close the session
        session.close()
        
    except Exception as e:
        print(f"ERROR seeding data: {str(e)}")


if __name__ == "__main__":
    # Initialize the database if this script is run directly
    init_db()