"""
Common module for shared functionality across microservices
"""

# Import important modules to make them available directly from common
from .db_init import (
    Base, 
    PropertyListing, 
    PropertyValuation, 
    SpatialData, 
    MarketMetrics, 
    MarketPrediction, 
    init_db
)