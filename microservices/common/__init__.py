"""
Common module for shared functionality across microservices
"""

# Import important modules to make them available directly from common
from .db_init import (
    Base, 
    PropertyListing, 
    PropertyValuation, 
    DataSource, 
    DataFetchLog, 
    ETLJob, 
    SpatialData, 
    MarketMetrics, 
    MarketPrediction, 
    MLModel, 
    init_db
)