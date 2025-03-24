"""
Market Microservice

This microservice provides APIs for market analytics, trends, and predictions.
"""

import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException, Query, Path
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_

from ..common.fastapi_utils import create_app, register_exception_handlers, get_db
from ..common.db_init import MarketMetrics, MarketPrediction

# Create FastAPI app
app = create_app(
    name="market",
    description="API for market analytics, trends, and predictions"
)

# Register exception handlers
register_exception_handlers(app)

# Pydantic models for request/response
class MarketMetricsResponse(BaseModel):
    id: int
    area_type: str
    area_value: str
    period_start: str
    period_end: str
    median_price: Optional[float] = None
    average_price: Optional[float] = None
    price_per_sqft: Optional[float] = None
    total_listings: Optional[int] = None
    new_listings: Optional[int] = None
    total_sales: Optional[int] = None
    avg_days_on_market: Optional[float] = None
    list_to_sale_ratio: Optional[float] = None
    price_drops: Optional[int] = None
    created_date: str
    
    class Config:
        orm_mode = True

class MarketMetricsCreate(BaseModel):
    area_type: str = Field(..., description="Type of area (zip, city, county, state)")
    area_value: str = Field(..., description="Value of the area (e.g., 98930)")
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
    
    class Config:
        schema_extra = {
            "example": {
                "area_type": "zip",
                "area_value": "98930",
                "period_start": "2024-02-01T00:00:00",
                "period_end": "2024-02-29T23:59:59",
                "median_price": 300000,
                "average_price": 330000,
                "price_per_sqft": 175,
                "total_listings": 20,
                "new_listings": 8,
                "total_sales": 10,
                "avg_days_on_market": 45,
                "list_to_sale_ratio": 0.95,
                "price_drops": 3
            }
        }

class MarketPredictionResponse(BaseModel):
    id: int
    area_type: str
    area_value: str
    prediction_date: str
    target_date: str
    median_price_predicted: Optional[float] = None
    price_change_percent: Optional[float] = None
    confidence_score: Optional[float] = None
    model_version: Optional[str] = None
    prediction_factors: Optional[Dict[str, Any]] = None
    
    class Config:
        orm_mode = True

class MarketPredictionCreate(BaseModel):
    area_type: str = Field(..., description="Type of area (zip, city, county, state)")
    area_value: str = Field(..., description="Value of the area (e.g., 98930)")
    target_date: datetime = Field(..., description="Date for which the prediction is made")
    median_price_predicted: float
    price_change_percent: Optional[float] = None
    confidence_score: Optional[float] = None
    model_version: Optional[str] = None
    prediction_factors: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "area_type": "zip",
                "area_value": "98930",
                "target_date": "2024-06-30T00:00:00",
                "median_price_predicted": 315000,
                "price_change_percent": 5.0,
                "confidence_score": 0.85,
                "model_version": "v1.0",
                "prediction_factors": {
                    "historical_trend": 0.7,
                    "seasonality": 0.2,
                    "economic_indicators": 0.1
                }
            }
        }

class MarketTrendResponse(BaseModel):
    metric: str
    area_type: str
    area_value: str
    periods: List[str]
    values: List[float]
    change_percent: float
    trend_direction: str  # "up", "down", "stable"

class MarketOverviewResponse(BaseModel):
    area_type: str
    area_value: str
    median_price: float
    price_trend: Dict[str, Any]
    inventory_trend: Dict[str, Any]
    days_on_market_trend: Dict[str, Any]
    market_health: str  # "hot", "neutral", "cold"
    price_per_sqft: float
    year_over_year_change: float
    predictions: Dict[str, Any]

# Market Metrics Endpoints
@app.get("/metrics", response_model=List[MarketMetricsResponse], tags=["Market Metrics"])
async def get_metrics(
    area_type: Optional[str] = None,
    area_value: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
) -> List[MarketMetricsResponse]:
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
        query = query.filter(MarketMetrics.period_end >= start_date)
    if end_date:
        query = query.filter(MarketMetrics.period_start <= end_date)
    
    # Order by period end date (most recent first)
    query = query.order_by(desc(MarketMetrics.period_end))
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    # Get results
    metrics = query.all()
    
    return [metric.to_dict() for metric in metrics]

@app.get("/metrics/{metric_id}", response_model=MarketMetricsResponse, tags=["Market Metrics"])
async def get_metric_by_id(
    metric_id: int = Path(..., ge=1),
    db: Session = Depends(get_db)
) -> MarketMetricsResponse:
    """
    Get market metrics by ID
    """
    metric = db.query(MarketMetrics).filter(MarketMetrics.id == metric_id).first()
    if not metric:
        raise HTTPException(status_code=404, detail=f"Market metrics with ID {metric_id} not found")
    
    return metric.to_dict()

@app.post("/metrics", response_model=MarketMetricsResponse, status_code=201, tags=["Market Metrics"])
async def create_metric(
    metric_data: MarketMetricsCreate,
    db: Session = Depends(get_db)
) -> MarketMetricsResponse:
    """
    Create new market metrics
    """
    # Check if metrics already exist for this area and period
    existing = db.query(MarketMetrics).filter(
        and_(
            MarketMetrics.area_type == metric_data.area_type,
            MarketMetrics.area_value == metric_data.area_value,
            MarketMetrics.period_start == metric_data.period_start,
            MarketMetrics.period_end == metric_data.period_end
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Market metrics already exist for {metric_data.area_type} {metric_data.area_value} "
                  f"from {metric_data.period_start} to {metric_data.period_end}"
        )
    
    # Create new metrics
    new_metric = MarketMetrics(
        **metric_data.dict(),
        created_date=datetime.utcnow()
    )
    
    # Add to database
    db.add(new_metric)
    db.commit()
    db.refresh(new_metric)
    
    return new_metric.to_dict()

# Market Predictions Endpoints
@app.get("/predictions", response_model=List[MarketPredictionResponse], tags=["Market Predictions"])
async def get_predictions(
    area_type: Optional[str] = None,
    area_value: Optional[str] = None,
    min_target_date: Optional[datetime] = None,
    max_target_date: Optional[datetime] = None,
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
) -> List[MarketPredictionResponse]:
    """
    Get market predictions with optional filtering
    """
    query = db.query(MarketPrediction)
    
    # Apply filters
    if area_type:
        query = query.filter(MarketPrediction.area_type == area_type)
    if area_value:
        query = query.filter(MarketPrediction.area_value == area_value)
    if min_target_date:
        query = query.filter(MarketPrediction.target_date >= min_target_date)
    if max_target_date:
        query = query.filter(MarketPrediction.target_date <= max_target_date)
    
    # Order by target date (closest future date first)
    query = query.order_by(MarketPrediction.target_date)
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    # Get results
    predictions = query.all()
    
    return [prediction.to_dict() for prediction in predictions]

@app.post("/predictions", response_model=MarketPredictionResponse, status_code=201, tags=["Market Predictions"])
async def create_prediction(
    prediction_data: MarketPredictionCreate,
    db: Session = Depends(get_db)
) -> MarketPredictionResponse:
    """
    Create a new market prediction
    """
    # Create new prediction
    new_prediction = MarketPrediction(
        **prediction_data.dict(),
        prediction_date=datetime.utcnow()
    )
    
    # Add to database
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)
    
    return new_prediction.to_dict()

# Market Trend Endpoint
@app.get("/trends/{metric}", response_model=MarketTrendResponse, tags=["Market Trends"])
async def get_trend(
    metric: str = Path(..., description="Metric to analyze (median_price, average_price, price_per_sqft, etc.)"),
    area_type: str = Query(..., description="Type of area (zip, city, county, state)"),
    area_value: str = Query(..., description="Value of the area (e.g., 98930)"),
    months: int = Query(6, ge=1, le=60, description="Number of months to analyze"),
    db: Session = Depends(get_db)
) -> MarketTrendResponse:
    """
    Get trend analysis for a specific market metric
    """
    # Validate metric name
    valid_metrics = [
        "median_price", "average_price", "price_per_sqft", 
        "total_listings", "new_listings", "total_sales", 
        "avg_days_on_market", "list_to_sale_ratio", "price_drops"
    ]
    
    if metric not in valid_metrics:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid metric name. Must be one of: {', '.join(valid_metrics)}"
        )
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30 * months)
    
    # Get metrics for the period
    query = db.query(MarketMetrics).filter(
        and_(
            MarketMetrics.area_type == area_type,
            MarketMetrics.area_value == area_value,
            MarketMetrics.period_end >= start_date,
            MarketMetrics.period_end <= end_date
        )
    ).order_by(MarketMetrics.period_end)
    
    metrics = query.all()
    
    if not metrics:
        raise HTTPException(
            status_code=404,
            detail=f"No market data found for {area_type} {area_value} in the past {months} months"
        )
    
    # Extract periods and values
    periods = []
    values = []
    
    for m in metrics:
        # Skip if the metric value is None
        metric_value = getattr(m, metric)
        if metric_value is None:
            continue
            
        period_end = m.period_end
        if isinstance(period_end, str):
            period_end = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
            
        period_str = period_end.strftime('%Y-%m')
        
        periods.append(period_str)
        values.append(metric_value)
    
    if not values:
        raise HTTPException(
            status_code=404,
            detail=f"No values found for metric '{metric}' in the specified period"
        )
    
    # Calculate change percent
    first_value = values[0] if values else 0
    last_value = values[-1] if values else 0
    
    if first_value == 0:
        change_percent = 0
    else:
        change_percent = ((last_value - first_value) / first_value) * 100
    
    # Determine trend direction
    if change_percent > 3:
        trend_direction = "up"
    elif change_percent < -3:
        trend_direction = "down"
    else:
        trend_direction = "stable"
    
    return MarketTrendResponse(
        metric=metric,
        area_type=area_type,
        area_value=area_value,
        periods=periods,
        values=values,
        change_percent=change_percent,
        trend_direction=trend_direction
    )

# Market Overview Endpoint
@app.get("/market-overview/{area_type}/{area_value}", response_model=MarketOverviewResponse, tags=["Market Overview"])
async def get_market_overview(
    area_type: str = Path(..., description="Type of area (zip, city, county, state)"),
    area_value: str = Path(..., description="Value of the area (e.g., 98930)"),
    db: Session = Depends(get_db)
) -> MarketOverviewResponse:
    """
    Get comprehensive market overview for an area
    """
    # Calculate date ranges
    current_date = datetime.utcnow()
    one_year_ago = current_date - timedelta(days=365)
    
    # Get current metrics (most recent)
    current_metrics = db.query(MarketMetrics).filter(
        and_(
            MarketMetrics.area_type == area_type,
            MarketMetrics.area_value == area_value
        )
    ).order_by(desc(MarketMetrics.period_end)).first()
    
    if not current_metrics:
        raise HTTPException(
            status_code=404,
            detail=f"No market data found for {area_type} {area_value}"
        )
    
    # Get year-ago metrics
    year_ago_metrics = db.query(MarketMetrics).filter(
        and_(
            MarketMetrics.area_type == area_type,
            MarketMetrics.area_value == area_value,
            MarketMetrics.period_end <= one_year_ago
        )
    ).order_by(desc(MarketMetrics.period_end)).first()
    
    # Calculate year-over-year change
    if year_ago_metrics and year_ago_metrics.median_price and current_metrics.median_price:
        yoy_change = ((current_metrics.median_price - year_ago_metrics.median_price) / 
                       year_ago_metrics.median_price * 100)
    else:
        yoy_change = 0
    
    # Get price trend (past 6 months)
    price_trend_data = await get_trend(
        metric="median_price",
        area_type=area_type,
        area_value=area_value,
        months=6,
        db=db
    )
    
    # Get inventory trend (past 6 months)
    try:
        inventory_trend_data = await get_trend(
            metric="total_listings",
            area_type=area_type,
            area_value=area_value,
            months=6,
            db=db
        )
    except HTTPException:
        # Use empty trend if no data
        inventory_trend_data = MarketTrendResponse(
            metric="total_listings",
            area_type=area_type,
            area_value=area_value,
            periods=[],
            values=[],
            change_percent=0,
            trend_direction="stable"
        )
    
    # Get days on market trend (past 6 months)
    try:
        dom_trend_data = await get_trend(
            metric="avg_days_on_market",
            area_type=area_type,
            area_value=area_value,
            months=6,
            db=db
        )
    except HTTPException:
        # Use empty trend if no data
        dom_trend_data = MarketTrendResponse(
            metric="avg_days_on_market",
            area_type=area_type,
            area_value=area_value,
            periods=[],
            values=[],
            change_percent=0,
            trend_direction="stable"
        )
    
    # Get future predictions
    future_predictions = db.query(MarketPrediction).filter(
        and_(
            MarketPrediction.area_type == area_type,
            MarketPrediction.area_value == area_value,
            MarketPrediction.target_date > current_date
        )
    ).order_by(MarketPrediction.target_date).limit(3).all()
    
    predictions_dict = {
        "available": len(future_predictions) > 0,
        "short_term": future_predictions[0].median_price_predicted if future_predictions else None,
        "long_term": future_predictions[-1].median_price_predicted if len(future_predictions) > 1 else None,
        "prediction_dates": [p.target_date.strftime('%Y-%m') if isinstance(p.target_date, datetime) else p.target_date 
                             for p in future_predictions]
    }
    
    # Determine market health
    # A hot market has:
    # - Rising prices (positive change)
    # - Decreasing inventory (negative change)
    # - Fast sales (low or decreasing days on market)
    market_health = "neutral"
    
    price_indicator = 1 if price_trend_data.trend_direction == "up" else (
        -1 if price_trend_data.trend_direction == "down" else 0
    )
    
    inventory_indicator = -1 if inventory_trend_data.trend_direction == "down" else (
        1 if inventory_trend_data.trend_direction == "up" else 0
    )
    
    dom_indicator = -1 if dom_trend_data.trend_direction == "down" else (
        1 if dom_trend_data.trend_direction == "up" else 0
    )
    
    market_score = price_indicator + inventory_indicator + dom_indicator
    
    if market_score >= 2:
        market_health = "hot"
    elif market_score <= -2:
        market_health = "cold"
    
    return MarketOverviewResponse(
        area_type=area_type,
        area_value=area_value,
        median_price=current_metrics.median_price or 0,
        price_trend={
            "periods": price_trend_data.periods,
            "values": price_trend_data.values,
            "change_percent": price_trend_data.change_percent,
            "direction": price_trend_data.trend_direction
        },
        inventory_trend={
            "periods": inventory_trend_data.periods,
            "values": inventory_trend_data.values,
            "change_percent": inventory_trend_data.change_percent,
            "direction": inventory_trend_data.trend_direction
        },
        days_on_market_trend={
            "periods": dom_trend_data.periods,
            "values": dom_trend_data.values,
            "change_percent": dom_trend_data.change_percent,
            "direction": dom_trend_data.trend_direction
        },
        market_health=market_health,
        price_per_sqft=current_metrics.price_per_sqft or 0,
        year_over_year_change=yoy_change,
        predictions=predictions_dict
    )

if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8002))
    
    # Run application
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )