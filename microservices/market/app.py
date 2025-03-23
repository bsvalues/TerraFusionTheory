"""
Market Analytics Microservice

This FastAPI microservice provides endpoints for accessing real estate market analytics
and trend data. It calculates and provides real-time market metrics.
"""

import os
import sys
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
import pandas as pd
import numpy as np
from enum import Enum

# Add the parent directory to the path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database models
from common.db_init import PropertyListing, MarketMetrics, MarketPrediction, Base
from sqlalchemy import create_engine, desc, func, text, and_, or_
from sqlalchemy.orm import sessionmaker, Session

# Create FastAPI app
app = FastAPI(
    title="Market Analytics API",
    description="API for accessing real estate market analytics and trends",
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
class MarketMetricsBase(BaseModel):
    area_type: str
    area_value: str
    period_start: datetime
    period_end: datetime
    median_price: Optional[float] = None
    average_price: Optional[float] = None
    price_per_sqft: Optional[float] = None
    total_listings: Optional[int] = None
    new_listings: Optional[int] = None
    total_sales: Optional[int] = None
    avg_days_on_market: Optional[float] = None
    list_to_sale_ratio: Optional[float] = None
    price_drops: Optional[int] = None
    metrics_json: Optional[dict] = None

class MarketMetricsCreate(MarketMetricsBase):
    pass

class MarketMetricsResponse(MarketMetricsBase):
    id: int
    created_date: datetime
    
    class Config:
        from_attributes = True

class MarketPredictionBase(BaseModel):
    area_type: str
    area_value: str
    for_date: datetime
    median_price: float
    average_price: Optional[float] = None
    price_per_sqft: Optional[float] = None
    confidence_score: Optional[float] = None
    features_used: Optional[dict] = None
    model_version: Optional[str] = None
    metrics_json: Optional[dict] = None

class MarketPredictionCreate(MarketPredictionBase):
    pass

class MarketPredictionResponse(MarketPredictionBase):
    id: int
    prediction_date: datetime
    
    class Config:
        from_attributes = True

class TimeFrame(str, Enum):
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"
    FIVE_YEARS = "five_years"

class MarketTrendPoint(BaseModel):
    date: datetime
    value: float

class MarketTrend(BaseModel):
    metric: str
    area_type: str
    area_value: str
    timeframe: TimeFrame
    data_points: List[MarketTrendPoint]
    change_pct: float
    trend_direction: str  # "up", "down", "stable"

class MarketCondition(str, Enum):
    HOT = "hot"
    WARM = "warm"
    BALANCED = "balanced"
    COOL = "cool"
    COLD = "cold"

class MarketOverview(BaseModel):
    area_type: str
    area_value: str
    current_condition: MarketCondition
    median_price: float
    average_price: float
    price_per_sqft: float
    total_active_listings: int
    new_listings_last_30_days: int
    avg_days_on_market: float
    price_trends: Dict[str, MarketTrend]  # Dict of metric name to trend
    inventory_level: str  # "high", "medium", "low"
    affordability_index: float  # Lower is less affordable

# API Routes
@app.get("/")
def read_root():
    return {"message": "Market Analytics Microservice API", "status": "active"}

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

@app.get("/metrics", response_model=List[MarketMetricsResponse])
def get_market_metrics(
    area_type: Optional[str] = None,
    area_value: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get market metrics with optional filtering
    """
    query = db.query(MarketMetrics)
    
    # Apply filters
    if area_type:
        query = query.filter(MarketMetrics.area_type == area_type)
    if area_value:
        query = query.filter(MarketMetrics.area_value == area_value)
    if start_date:
        query = query.filter(MarketMetrics.period_start >= start_date)
    if end_date:
        query = query.filter(MarketMetrics.period_end <= end_date)
    
    # Order by newest first
    query = query.order_by(desc(MarketMetrics.period_end))
    
    # Pagination
    metrics = query.offset(skip).limit(limit).all()
    
    return metrics

@app.get("/metrics/{metric_id}", response_model=MarketMetricsResponse)
def get_market_metric_by_id(metric_id: int, db: Session = Depends(get_db)):
    """
    Get a specific market metric by ID
    """
    metric = db.query(MarketMetrics).filter(MarketMetrics.id == metric_id).first()
    if metric is None:
        raise HTTPException(status_code=404, detail="Market metric not found")
    return metric

@app.post("/metrics", response_model=MarketMetricsResponse)
def create_market_metric(metric_data: MarketMetricsCreate, db: Session = Depends(get_db)):
    """
    Create a new market metric
    """
    # Convert pydantic model to dict
    metric_dict = metric_data.dict()
    
    # Convert JSON fields
    if metric_dict.get('metrics_json'):
        metric_dict['metrics_json'] = json.dumps(metric_dict['metrics_json'])
    
    db_metric = MarketMetrics(**metric_dict)
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    
    return db_metric

@app.get("/predictions", response_model=List[MarketPredictionResponse])
def get_market_predictions(
    area_type: Optional[str] = None,
    area_value: Optional[str] = None,
    forecast_date: Optional[datetime] = None,
    model_version: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get market predictions with optional filtering
    """
    query = db.query(MarketPrediction)
    
    # Apply filters
    if area_type:
        query = query.filter(MarketPrediction.area_type == area_type)
    if area_value:
        query = query.filter(MarketPrediction.area_value == area_value)
    if forecast_date:
        query = query.filter(MarketPrediction.for_date == forecast_date)
    if model_version:
        query = query.filter(MarketPrediction.model_version == model_version)
    
    # Order by prediction date (newest) and then forecast date
    query = query.order_by(desc(MarketPrediction.prediction_date), MarketPrediction.for_date)
    
    # Pagination
    predictions = query.offset(skip).limit(limit).all()
    
    return predictions

@app.post("/predictions", response_model=MarketPredictionResponse)
def create_market_prediction(prediction_data: MarketPredictionCreate, db: Session = Depends(get_db)):
    """
    Create a new market prediction
    """
    # Convert pydantic model to dict
    prediction_dict = prediction_data.dict()
    
    # Convert JSON fields
    if prediction_dict.get('features_used'):
        prediction_dict['features_used'] = json.dumps(prediction_dict['features_used'])
    if prediction_dict.get('metrics_json'):
        prediction_dict['metrics_json'] = json.dumps(prediction_dict['metrics_json'])
    
    # Set prediction date to now
    prediction_dict['prediction_date'] = datetime.utcnow()
    
    db_prediction = MarketPrediction(**prediction_dict)
    db.add(db_prediction)
    db.commit()
    db.refresh(db_prediction)
    
    return db_prediction

@app.get("/trends/{metric}", response_model=MarketTrend)
def get_market_trend(
    metric: str,
    area_type: str,
    area_value: str,
    timeframe: TimeFrame = TimeFrame.YEAR,
    db: Session = Depends(get_db)
):
    """
    Get trend data for a specific market metric
    """
    # Set date range based on timeframe
    now = datetime.utcnow()
    if timeframe == TimeFrame.WEEK:
        start_date = now - timedelta(days=7)
    elif timeframe == TimeFrame.MONTH:
        start_date = now - timedelta(days=30)
    elif timeframe == TimeFrame.QUARTER:
        start_date = now - timedelta(days=90)
    elif timeframe == TimeFrame.YEAR:
        start_date = now - timedelta(days=365)
    elif timeframe == TimeFrame.FIVE_YEARS:
        start_date = now - timedelta(days=365 * 5)
    
    # Query market metrics for the specified period
    metrics = db.query(MarketMetrics).filter(
        MarketMetrics.area_type == area_type,
        MarketMetrics.area_value == area_value,
        MarketMetrics.period_end >= start_date
    ).order_by(MarketMetrics.period_end).all()
    
    if not metrics:
        raise HTTPException(status_code=404, detail=f"No data found for {metric} in {area_value}")
    
    # Extract data points for the requested metric
    data_points = []
    values = []
    
    for m in metrics:
        date = m.period_end
        
        # Get the metric value based on the requested metric name
        if metric == "median_price":
            value = m.median_price
        elif metric == "average_price":
            value = m.average_price
        elif metric == "price_per_sqft":
            value = m.price_per_sqft
        elif metric == "total_listings":
            value = m.total_listings
        elif metric == "new_listings":
            value = m.new_listings
        elif metric == "total_sales":
            value = m.total_sales
        elif metric == "avg_days_on_market":
            value = m.avg_days_on_market
        elif metric == "list_to_sale_ratio":
            value = m.list_to_sale_ratio
        else:
            # Try to get from metrics_json
            try:
                metrics_json = json.loads(m.metrics_json) if isinstance(m.metrics_json, str) else m.metrics_json
                value = metrics_json.get(metric)
            except:
                value = None
        
        if value is not None:
            data_points.append({"date": date, "value": value})
            values.append(value)
    
    # Calculate change percentage
    if len(values) >= 2:
        first_value = values[0]
        last_value = values[-1]
        if first_value > 0:
            change_pct = ((last_value - first_value) / first_value) * 100
        else:
            change_pct = 0
    else:
        change_pct = 0
    
    # Determine trend direction
    if change_pct > 5:
        trend_direction = "up"
    elif change_pct < -5:
        trend_direction = "down"
    else:
        trend_direction = "stable"
    
    return {
        "metric": metric,
        "area_type": area_type,
        "area_value": area_value,
        "timeframe": timeframe,
        "data_points": data_points,
        "change_pct": change_pct,
        "trend_direction": trend_direction
    }

@app.get("/overview", response_model=MarketOverview)
def get_market_overview(
    area_type: str,
    area_value: str,
    db: Session = Depends(get_db)
):
    """
    Get comprehensive market overview for an area
    """
    # Query the most recent market metrics
    latest_metrics = db.query(MarketMetrics).filter(
        MarketMetrics.area_type == area_type,
        MarketMetrics.area_value == area_value
    ).order_by(desc(MarketMetrics.period_end)).first()
    
    if not latest_metrics:
        raise HTTPException(status_code=404, detail=f"No market data found for {area_value}")
    
    # Query property listings for inventory levels
    active_listings = db.query(func.count(PropertyListing.id)).filter(
        PropertyListing.status == 'for_sale'
    )
    
    if area_type == 'zip':
        active_listings = active_listings.filter(PropertyListing.zip_code == area_value)
    elif area_type == 'city':
        active_listings = active_listings.filter(PropertyListing.city == area_value)
    
    total_active_listings = active_listings.scalar() or 0
    
    # New listings in the last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    new_listings_query = db.query(func.count(PropertyListing.id)).filter(
        PropertyListing.status == 'for_sale',
        PropertyListing.listed_date >= thirty_days_ago
    )
    
    if area_type == 'zip':
        new_listings_query = new_listings_query.filter(PropertyListing.zip_code == area_value)
    elif area_type == 'city':
        new_listings_query = new_listings_query.filter(PropertyListing.city == area_value)
    
    new_listings_last_30_days = new_listings_query.scalar() or 0
    
    # Get price trends for the overview
    price_trends = {}
    for metric in ["median_price", "average_price", "price_per_sqft"]:
        try:
            trend = get_market_trend(
                metric=metric,
                area_type=area_type,
                area_value=area_value,
                timeframe=TimeFrame.YEAR,
                db=db
            )
            price_trends[metric] = trend
        except:
            # Skip if trend data is not available
            pass
    
    # Determine market condition
    market_condition = MarketCondition.BALANCED
    
    # Simple rule-based market condition
    # This would be more sophisticated in production
    if latest_metrics.avg_days_on_market < 30 and (latest_metrics.list_to_sale_ratio or 0) > 0.98:
        market_condition = MarketCondition.HOT
    elif latest_metrics.avg_days_on_market < 45 and (latest_metrics.list_to_sale_ratio or 0) > 0.95:
        market_condition = MarketCondition.WARM
    elif latest_metrics.avg_days_on_market > 90 and (latest_metrics.list_to_sale_ratio or 0) < 0.9:
        market_condition = MarketCondition.COLD
    elif latest_metrics.avg_days_on_market > 60 and (latest_metrics.list_to_sale_ratio or 0) < 0.93:
        market_condition = MarketCondition.COOL
    
    # Determine inventory level - this would be based on historical data and market size
    if total_active_listings < 10:
        inventory_level = "low"
    elif total_active_listings < 50:
        inventory_level = "medium"
    else:
        inventory_level = "high"
    
    # Simple affordability index - lower is less affordable
    # This would be more sophisticated in production, incorporating income data
    try:
        # Assume median home price to median income ratio
        # We're using a placeholder
        median_income = 70000  # This would come from census or other data
        affordability_index = median_income / (latest_metrics.median_price or 1)
    except:
        affordability_index = 0
    
    return {
        "area_type": area_type,
        "area_value": area_value,
        "current_condition": market_condition,
        "median_price": latest_metrics.median_price or 0,
        "average_price": latest_metrics.average_price or 0,
        "price_per_sqft": latest_metrics.price_per_sqft or 0,
        "total_active_listings": total_active_listings,
        "new_listings_last_30_days": new_listings_last_30_days,
        "avg_days_on_market": latest_metrics.avg_days_on_market or 0,
        "price_trends": price_trends,
        "inventory_level": inventory_level,
        "affordability_index": affordability_index
    }

if __name__ == "__main__":
    import uvicorn
    # Start the API server
    uvicorn.run("app:app", host="0.0.0.0", port=8002, reload=True)