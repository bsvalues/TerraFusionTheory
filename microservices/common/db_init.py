"""
Database initialization script for IntelligentEstate platform
Creates all necessary tables for the ETL pipeline and microservices
"""

import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker
from datetime import datetime
import json

# Get database URL from environment variables
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    raise EnvironmentError("DATABASE_URL environment variable not set")

# Create SQLAlchemy engine
engine = create_engine(db_url)
Base = declarative_base()

# Define data models
class PropertyListing(Base):
    """Property listing data from MLS or other sources"""
    __tablename__ = 'property_listings'
    
    id = Column(Integer, primary_key=True)
    external_id = Column(String(50), index=True, unique=True)
    address = Column(String(200), nullable=False)
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    price = Column(Float)
    beds = Column(Integer)
    baths = Column(Float)
    sqft = Column(Float)
    lot_size = Column(Float)
    year_built = Column(Integer)
    property_type = Column(String(50))
    status = Column(String(50))
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(Text)
    features = Column(JSON)
    images = Column(JSON)
    listed_date = Column(DateTime)
    updated_date = Column(DateTime, default=datetime.utcnow)
    created_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    valuation_history = relationship("PropertyValuation", back_populates="property")
    
    def __repr__(self):
        return f"<Property(id={self.id}, address='{self.address}', price=${self.price})>"


class PropertyValuation(Base):
    """Historical and predicted property valuations"""
    __tablename__ = 'property_valuations'
    
    id = Column(Integer, primary_key=True)
    property_id = Column(Integer, ForeignKey('property_listings.id'))
    valuation_date = Column(DateTime, default=datetime.utcnow)
    estimated_value = Column(Float)
    confidence_score = Column(Float)  # 0-1 confidence in the estimate
    method = Column(String(50))  # e.g., 'ml-prediction', 'appraiser', 'tax-assessment'
    features_used = Column(JSON)  # JSON of features used in the valuation
    is_prediction = Column(Boolean, default=False)
    
    # Relationships
    property = relationship("PropertyListing", back_populates="valuation_history")
    
    def __repr__(self):
        return f"<Valuation(property_id={self.property_id}, value=${self.estimated_value}, date={self.valuation_date})>"


class MarketMetrics(Base):
    """Real estate market metrics by area and time period"""
    __tablename__ = 'market_metrics'
    
    id = Column(Integer, primary_key=True)
    area_type = Column(String(50))  # e.g., 'zip', 'city', 'neighborhood'
    area_value = Column(String(100))  # e.g., '98001', 'Seattle', 'Ballard'
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    median_price = Column(Float)
    average_price = Column(Float)
    price_per_sqft = Column(Float)
    total_listings = Column(Integer)
    new_listings = Column(Integer)
    total_sales = Column(Integer)
    avg_days_on_market = Column(Float)
    list_to_sale_ratio = Column(Float)  # sale price / list price
    price_drops = Column(Integer)
    metrics_json = Column(JSON)  # Additional metrics in JSON format
    created_date = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<MarketMetrics(area='{self.area_value}', period='{self.period_start.strftime('%Y-%m')}', median=${self.median_price})>"


class MarketPrediction(Base):
    """Predicted future market metrics"""
    __tablename__ = 'market_predictions'
    
    id = Column(Integer, primary_key=True)
    area_type = Column(String(50))
    area_value = Column(String(100))
    prediction_date = Column(DateTime)
    for_date = Column(DateTime)  # Date being predicted
    median_price = Column(Float)
    average_price = Column(Float)
    price_per_sqft = Column(Float)
    confidence_score = Column(Float)  # 0-1 confidence in prediction
    features_used = Column(JSON)
    model_version = Column(String(50))
    metrics_json = Column(JSON)  # Additional predicted metrics
    
    def __repr__(self):
        return f"<MarketPrediction(area='{self.area_value}', for_date='{self.for_date.strftime('%Y-%m')}', median=${self.median_price})>"


class SpatialData(Base):
    """Spatial and GIS data for properties and areas"""
    __tablename__ = 'spatial_data'
    
    id = Column(Integer, primary_key=True)
    spatial_type = Column(String(50))  # e.g., 'property', 'neighborhood', 'school_district'
    external_id = Column(String(100))
    name = Column(String(200))
    geometry_type = Column(String(50))  # e.g., 'point', 'polygon', 'multipolygon'
    geometry_json = Column(JSON)  # GeoJSON geometry
    properties_json = Column(JSON)  # Additional properties
    created_date = Column(DateTime, default=datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<SpatialData(id={self.id}, type='{self.spatial_type}', name='{self.name}')>"


class DataSource(Base):
    """Information about external data sources"""
    __tablename__ = 'data_sources'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True)
    source_type = Column(String(50))  # e.g., 'mls', 'tax', 'geodata'
    url = Column(String(255))
    credentials_json = Column(JSON)  # Securely stored credentials, if needed
    is_active = Column(Boolean, default=True)
    last_fetch_date = Column(DateTime)
    fetch_frequency_minutes = Column(Integer)  # How often to fetch from this source
    config_json = Column(JSON)  # Additional configuration
    created_date = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    fetch_logs = relationship("DataFetchLog", back_populates="data_source")
    
    def __repr__(self):
        return f"<DataSource(name='{self.name}', type='{self.source_type}', active={self.is_active})>"


class DataFetchLog(Base):
    """Logs of data fetch operations from external sources"""
    __tablename__ = 'data_fetch_logs'
    
    id = Column(Integer, primary_key=True)
    source_id = Column(Integer, ForeignKey('data_sources.id'))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String(50))  # e.g., 'success', 'failed', 'partial'
    records_fetched = Column(Integer)
    error_message = Column(Text)
    details_json = Column(JSON)
    
    # Relationships
    data_source = relationship("DataSource", back_populates="fetch_logs")
    
    def __repr__(self):
        return f"<DataFetchLog(source='{self.data_source.name if self.data_source else None}', status='{self.status}', records={self.records_fetched})>"


class ETLJob(Base):
    """Information about ETL job runs"""
    __tablename__ = 'etl_jobs'
    
    id = Column(Integer, primary_key=True)
    job_name = Column(String(100))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    status = Column(String(50))  # e.g., 'running', 'success', 'failed'
    records_processed = Column(Integer)
    error_message = Column(Text)
    details_json = Column(JSON)
    created_date = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<ETLJob(name='{self.job_name}', status='{self.status}', records={self.records_processed})>"


def init_db():
    """Initialize the database by creating all tables"""
    try:
        Base.metadata.create_all(engine)
        print("Database tables created successfully")
        
        # Create a session to add initial data if needed
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Check if we need to add default data sources
        if session.query(DataSource).count() == 0:
            # Add some default data sources
            default_sources = [
                DataSource(
                    name="MLS Demo Source",
                    source_type="mls",
                    url="https://api.example-mls.com",
                    fetch_frequency_minutes=60,
                    config_json=json.dumps({
                        "api_version": "v2",
                        "region": "Northwest"
                    })
                ),
                DataSource(
                    name="Tax Records",
                    source_type="tax",
                    url="https://api.example-county-tax.gov",
                    fetch_frequency_minutes=1440,  # Daily
                    config_json=json.dumps({
                        "counties": ["King", "Pierce", "Snohomish"]
                    })
                ),
                DataSource(
                    name="GIS County Data",
                    source_type="geodata",
                    url="https://gis.example-county.gov/arcgis/rest/services",
                    fetch_frequency_minutes=10080,  # Weekly
                    config_json=json.dumps({
                        "layers": ["parcels", "zoning", "flood_zones"]
                    })
                )
            ]
            
            for source in default_sources:
                session.add(source)
            
            session.commit()
            print("Default data sources added")
        
        session.close()
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False


if __name__ == "__main__":
    init_db()