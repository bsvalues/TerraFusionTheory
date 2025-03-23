"""
Analytics Microservice

This FastAPI microservice provides endpoints for machine learning predictions,
trend forecasting, and advanced analytics for real estate data.
"""

import os
import sys
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, Query, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import json
import numpy as np
import pandas as pd
from enum import Enum

# Add the parent directory to the path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database models
from common.db_init import PropertyListing, PropertyValuation, MarketMetrics, MarketPrediction, Base
from sqlalchemy import create_engine, desc, func, text
from sqlalchemy.orm import sessionmaker, Session

# Create FastAPI app
app = FastAPI(
    title="Real Estate Analytics API",
    description="API for machine learning predictions and analytics on real estate data",
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

# ML Model versions
class ModelVersion(str, Enum):
    BASIC_LINEAR = "basic_linear"
    RANDOM_FOREST = "random_forest"
    GRADIENT_BOOST = "gradient_boost"
    NEURAL_NETWORK = "neural_network"

# Prediction types
class PredictionType(str, Enum):
    PROPERTY_VALUE = "property_value"
    MARKET_TREND = "market_trend"
    DAYS_ON_MARKET = "days_on_market"
    PRICE_RANGE = "price_range"

# Pydantic models for API
class PropertyFeatures(BaseModel):
    """Features used to predict property value"""
    beds: int
    baths: float
    sqft: float
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    property_type: str
    zip_code: str
    city: str
    state: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    features: Optional[Dict[str, Any]] = None  # Additional features

class PropertyValuationRequest(BaseModel):
    """Request for property valuation prediction"""
    property_id: Optional[int] = None  # If predicting for existing property
    features: PropertyFeatures
    model_version: ModelVersion = ModelVersion.GRADIENT_BOOST

class PropertyValuationResponse(BaseModel):
    """Response for property valuation prediction"""
    estimated_value: float
    confidence_interval_low: float
    confidence_interval_high: float
    confidence_score: float  # 0-1 score
    comparable_properties: Optional[List[int]] = None  # IDs of comparable properties
    features_importance: Optional[Dict[str, float]] = None  # Feature importance scores
    model_version: ModelVersion
    prediction_date: datetime = Field(default_factory=datetime.utcnow)

class MarketTrendRequest(BaseModel):
    """Request for market trend prediction"""
    area_type: str  # 'zip', 'city', 'neighborhood'
    area_value: str  # ZIP code, city name, neighborhood name
    forecast_months: int = 6  # How many months to forecast
    model_version: ModelVersion = ModelVersion.GRADIENT_BOOST
    include_historical: bool = True  # Whether to include historical data

class MarketMetricPoint(BaseModel):
    """Single data point for a market metric"""
    date: datetime
    value: float
    is_prediction: bool = False
    confidence_interval_low: Optional[float] = None
    confidence_interval_high: Optional[float] = None

class MarketTrendResponse(BaseModel):
    """Response for market trend prediction"""
    area_type: str
    area_value: str
    metric: str  # e.g., 'median_price', 'avg_days_on_market'
    data_points: List[MarketMetricPoint]
    forecast_months: int
    model_version: ModelVersion
    prediction_date: datetime = Field(default_factory=datetime.utcnow)
    expected_change_pct: float  # Expected percentage change over forecast period
    trend_direction: str  # 'up', 'down', 'stable'
    confidence_score: float  # 0-1 score

class TrainingRequest(BaseModel):
    """Request to train a new ML model"""
    model_type: ModelVersion
    prediction_type: PredictionType
    start_date: Optional[datetime] = None  # Start date for training data
    end_date: Optional[datetime] = None  # End date for training data
    area_filter: Optional[Dict[str, str]] = None  # Filter by area
    hyperparameters: Optional[Dict[str, Any]] = None  # Custom hyperparameters

class TrainingResponse(BaseModel):
    """Response after training a model"""
    job_id: str
    model_version: ModelVersion
    prediction_type: PredictionType
    status: str  # 'queued', 'running', 'completed', 'failed'
    message: str

class TrainingJobStatus(BaseModel):
    """Status of a model training job"""
    job_id: str
    model_version: ModelVersion
    prediction_type: PredictionType
    status: str
    start_time: datetime
    end_time: Optional[datetime] = None
    metrics: Optional[Dict[str, float]] = None  # Evaluation metrics
    error_message: Optional[str] = None

class HotspotRequest(BaseModel):
    """Request to identify real estate hotspots"""
    state: str
    min_price_growth: float = 5.0  # Minimum percentage price growth to be a hotspot
    min_sales_count: int = 10  # Minimum number of sales to consider
    time_period_months: int = 6  # Time period to analyze

class HotspotResponse(BaseModel):
    """Identified real estate hotspot"""
    area_type: str  # 'zip', 'neighborhood', 'city'
    area_value: str
    price_growth_pct: float
    median_price: float
    avg_days_on_market: float
    total_sales: int
    score: float  # Composite score ranking the hotspot
    latitude: float  # Center point
    longitude: float

class InvestmentAnalysisRequest(BaseModel):
    """Request for investment property analysis"""
    property_id: Optional[int] = None
    purchase_price: float
    down_payment_pct: float = 20.0
    interest_rate: float = 4.5
    loan_term_years: int = 30
    monthly_rent: float
    property_tax_annual: float
    insurance_annual: float
    maintenance_pct: float = 1.0
    vacancy_rate_pct: float = 5.0
    property_management_pct: float = 10.0
    appreciation_rate_pct: float = 3.0
    holding_period_years: int = 5

class InvestmentAnalysisResponse(BaseModel):
    """Investment property analysis results"""
    monthly_mortgage: float
    monthly_expenses: float
    monthly_cash_flow: float
    annual_cash_flow: float
    cap_rate: float
    cash_on_cash_return: float
    roi_5year: float
    roi_10year: float
    break_even_months: int
    irr: float  # Internal Rate of Return
    suggested_rent: float
    risk_assessment: str  # 'low', 'medium', 'high'
    sensitivity_analysis: Dict[str, Dict[str, float]]  # Analysis of how changes affect outcomes

# API Routes
@app.get("/")
def read_root():
    return {"message": "Real Estate Analytics Microservice API", "status": "active"}

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

@app.post("/predict/property-value", response_model=PropertyValuationResponse)
def predict_property_value(request: PropertyValuationRequest, db: Session = Depends(get_db)):
    """
    Predict the value of a property based on its features using machine learning
    """
    try:
        # For demo purposes, we're using a simplified approach
        # In a real implementation, this would load a trained ML model
        
        # Extract features
        features = request.features
        
        # Base calculation (very simplified example)
        base_price = 200000  # Base price
        
        # Add value for each bedroom
        bed_value = 25000 * features.beds
        
        # Add value for each bathroom
        bath_value = 15000 * features.baths
        
        # Add value for square footage
        sqft_value = 150 * features.sqft
        
        # Location adjustment (in a real model, this would be data-driven)
        location_multiplier = 1.0  # Default
        
        # Simple estimated value
        estimated_value = (base_price + bed_value + bath_value + sqft_value) * location_multiplier
        
        # Confidence interval (simplified)
        confidence_score = 0.85
        interval_width = estimated_value * 0.1  # 10% range
        
        # In a real implementation, we would:
        # 1. Preprocess the input features
        # 2. Load the appropriate ML model based on request.model_version
        # 3. Make a prediction with the model
        # 4. Calculate confidence intervals and scores
        # 5. Find comparable properties
        # 6. Extract feature importance values
        
        # Generate a simulated response
        response = {
            "estimated_value": estimated_value,
            "confidence_interval_low": estimated_value - interval_width,
            "confidence_interval_high": estimated_value + interval_width,
            "confidence_score": confidence_score,
            "comparable_properties": [],  # Would contain IDs of comparable properties
            "features_importance": {
                "beds": 0.25,
                "baths": 0.15,
                "sqft": 0.40,
                "location": 0.20
            },
            "model_version": request.model_version,
            "prediction_date": datetime.utcnow()
        }
        
        # If property_id is provided, save this valuation to the database
        if request.property_id:
            # Create new property valuation record
            valuation = PropertyValuation(
                property_id=request.property_id,
                estimated_value=estimated_value,
                confidence_score=confidence_score,
                method=f"ml-prediction-{request.model_version}",
                features_used=json.dumps(request.features.dict()),
                is_prediction=True,
                valuation_date=datetime.utcnow()
            )
            db.add(valuation)
            db.commit()
        
        return response
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/predict/market-trend", response_model=MarketTrendResponse)
def predict_market_trend(request: MarketTrendRequest, db: Session = Depends(get_db)):
    """
    Predict market trends for a specific area using time series forecasting
    """
    try:
        # In a real implementation, this would:
        # 1. Load historical market data for the specified area
        # 2. Train/load a time series forecasting model
        # 3. Generate predictions for future months
        
        # For demo purposes, we'll simulate this with a simplified approach
        
        # First, check if we have historical data
        historical_data = db.query(MarketMetrics).filter(
            MarketMetrics.area_type == request.area_type,
            MarketMetrics.area_value == request.area_value
        ).order_by(MarketMetrics.period_end).all()
        
        # If we don't have sufficient historical data, return an error
        if len(historical_data) < 3:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient historical data for {request.area_type} {request.area_value}"
            )
        
        # Get the last known median price
        last_metric = historical_data[-1]
        last_price = last_metric.median_price or 300000  # Fallback if NULL
        
        # Create data points array
        data_points = []
        
        # Add historical data points if requested
        if request.include_historical:
            for metric in historical_data[-12:]:  # Last 12 months of history
                if metric.median_price:
                    data_points.append({
                        "date": metric.period_end,
                        "value": metric.median_price,
                        "is_prediction": False
                    })
        
        # Simulate future predictions with a simple growth model
        # In a real implementation, this would use a properly trained forecasting model
        current_date = datetime.utcnow()
        current_value = last_price
        
        # Simulate a trend (random walk with drift)
        # This is just a demo - a real implementation would use actual ML models
        monthly_drift = 0.005  # 0.5% average monthly appreciation
        monthly_volatility = 0.01  # 1% monthly standard deviation
        
        # Generate forecast points
        for i in range(request.forecast_months):
            # Calculate next month's date
            next_date = current_date + timedelta(days=30 * (i + 1))
            
            # Generate random change with drift (simplified time series model)
            change = np.random.normal(monthly_drift, monthly_volatility)
            current_value = current_value * (1 + change)
            
            # Add confidence intervals (wider as we go further into the future)
            interval_width = current_value * 0.02 * (i + 1)  # Increasing uncertainty
            
            # Add to data points
            data_points.append({
                "date": next_date,
                "value": current_value,
                "is_prediction": True,
                "confidence_interval_low": current_value - interval_width,
                "confidence_interval_high": current_value + interval_width
            })
        
        # Calculate expected change percentage
        if data_points:
            first_value = data_points[0]["value"] if data_points else last_price
            last_value = data_points[-1]["value"]
            expected_change_pct = ((last_value - first_value) / first_value) * 100
        else:
            expected_change_pct = 0
        
        # Determine trend direction
        if expected_change_pct > 5:
            trend_direction = "up"
        elif expected_change_pct < -5:
            trend_direction = "down"
        else:
            trend_direction = "stable"
        
        return {
            "area_type": request.area_type,
            "area_value": request.area_value,
            "metric": "median_price",
            "data_points": data_points,
            "forecast_months": request.forecast_months,
            "model_version": request.model_version,
            "prediction_date": datetime.utcnow(),
            "expected_change_pct": expected_change_pct,
            "trend_direction": trend_direction,
            "confidence_score": 0.8  # Simulated confidence score
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast error: {str(e)}")

@app.post("/models/train", response_model=TrainingResponse)
def train_model(request: TrainingRequest, background_tasks: BackgroundTasks):
    """
    Launch a background task to train a new ML model
    """
    # In a real implementation, this would queue a model training job
    # For demo purposes, we'll simulate this
    
    job_id = f"train-{request.prediction_type}-{request.model_type}-{int(datetime.utcnow().timestamp())}"
    
    # In a real implementation, we would:
    # 1. Validate the request and check permissions
    # 2. Queue a background job for model training
    # 3. Return a job ID for status tracking
    
    # Simulate queuing a background task
    background_tasks.add_task(
        simulate_model_training,
        job_id=job_id,
        model_version=request.model_type,
        prediction_type=request.prediction_type
    )
    
    return {
        "job_id": job_id,
        "model_version": request.model_type,
        "prediction_type": request.prediction_type,
        "status": "queued",
        "message": "Model training job has been queued"
    }

@app.get("/models/status/{job_id}", response_model=TrainingJobStatus)
def get_model_training_status(job_id: str):
    """
    Check the status of a model training job
    """
    # In a real implementation, this would check a job queue or database
    # For demo purposes, we'll simulate a successful training
    
    # Parse job ID to extract details
    parts = job_id.split("-")
    if len(parts) < 4:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    try:
        prediction_type = parts[1]
        model_version = parts[2]
        timestamp = int(parts[3])
    except:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    # Create job start time from timestamp
    start_time = datetime.fromtimestamp(timestamp)
    
    # Simulate job completion
    now = datetime.utcnow()
    job_duration = (now - start_time).total_seconds()
    
    if job_duration < 10:
        # Job is still running
        status = "running"
        end_time = None
        metrics = None
        message = "Model training is in progress"
    else:
        # Job is complete
        status = "completed"
        end_time = start_time + timedelta(seconds=job_duration)
        metrics = {
            "accuracy": 0.92,
            "mae": 15000,  # Mean Absolute Error
            "rmse": 22000,  # Root Mean Squared Error
            "r2": 0.86
        }
        message = "Model training completed successfully"
    
    return {
        "job_id": job_id,
        "model_version": model_version,
        "prediction_type": prediction_type,
        "status": status,
        "start_time": start_time,
        "end_time": end_time,
        "metrics": metrics,
        "error_message": None
    }

@app.post("/analyze/hotspots", response_model=List[HotspotResponse])
def find_real_estate_hotspots(request: HotspotRequest, db: Session = Depends(get_db)):
    """
    Identify real estate hotspots based on price trends and other metrics
    """
    # In a real implementation, this would analyze price trends and activity data
    # For demo purposes, we'll return simulated hotspots
    
    # Calculate the start date for the analysis period
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30 * request.time_period_months)
    
    # Simulated hotspots - in a real implementation, these would be calculated from data
    hotspots = [
        {
            "area_type": "zip",
            "area_value": "98001",
            "price_growth_pct": 12.5,
            "median_price": 450000,
            "avg_days_on_market": 15,
            "total_sales": 42,
            "score": 8.7,
            "latitude": 47.3053,
            "longitude": -122.2569
        },
        {
            "area_type": "zip",
            "area_value": "98059",
            "price_growth_pct": 10.2,
            "median_price": 550000,
            "avg_days_on_market": 12,
            "total_sales": 38,
            "score": 8.5,
            "latitude": 47.4900,
            "longitude": -122.1651
        },
        {
            "area_type": "neighborhood",
            "area_value": "Ballard",
            "price_growth_pct": 8.7,
            "median_price": 725000,
            "avg_days_on_market": 10,
            "total_sales": 65,
            "score": 8.3,
            "latitude": 47.6792,
            "longitude": -122.3860
        },
        {
            "area_type": "zip",
            "area_value": "98117",
            "price_growth_pct": 7.5,
            "median_price": 780000,
            "avg_days_on_market": 8,
            "total_sales": 51,
            "score": 7.9,
            "latitude": 47.6823,
            "longitude": -122.3722
        },
        {
            "area_type": "neighborhood",
            "area_value": "Capitol Hill",
            "price_growth_pct": 6.8,
            "median_price": 685000,
            "avg_days_on_market": 14,
            "total_sales": 88,
            "score": 7.5,
            "latitude": 47.6251,
            "longitude": -122.3220
        }
    ]
    
    # Filter by minimum price growth
    hotspots = [h for h in hotspots if h["price_growth_pct"] >= request.min_price_growth]
    
    # Filter by minimum sales count
    hotspots = [h for h in hotspots if h["total_sales"] >= request.min_sales_count]
    
    # Sort by score (highest first)
    hotspots.sort(key=lambda x: x["score"], reverse=True)
    
    return hotspots

@app.post("/analyze/investment", response_model=InvestmentAnalysisResponse)
def analyze_investment_property(request: InvestmentAnalysisRequest):
    """
    Perform financial analysis on a potential investment property
    """
    # Calculate loan amount
    loan_amount = request.purchase_price * (1 - request.down_payment_pct / 100)
    
    # Calculate monthly mortgage payment
    monthly_rate = request.interest_rate / 12 / 100
    num_payments = request.loan_term_years * 12
    monthly_mortgage = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
    
    # Calculate monthly expenses
    property_tax_monthly = request.property_tax_annual / 12
    insurance_monthly = request.insurance_annual / 12
    maintenance_monthly = (request.maintenance_pct / 100) * request.purchase_price / 12
    vacancy_cost = (request.vacancy_rate_pct / 100) * request.monthly_rent
    property_management = (request.property_management_pct / 100) * request.monthly_rent
    
    total_monthly_expenses = property_tax_monthly + insurance_monthly + maintenance_monthly + vacancy_cost + property_management
    
    # Calculate cash flow
    monthly_cash_flow = request.monthly_rent - monthly_mortgage - total_monthly_expenses
    annual_cash_flow = monthly_cash_flow * 12
    
    # Calculate cap rate
    annual_noi = (request.monthly_rent * 12) - (total_monthly_expenses * 12)  # Net Operating Income
    cap_rate = (annual_noi / request.purchase_price) * 100
    
    # Calculate cash on cash return
    down_payment = request.purchase_price * (request.down_payment_pct / 100)
    closing_costs = request.purchase_price * 0.03  # Estimated closing costs
    total_investment = down_payment + closing_costs
    cash_on_cash_return = (annual_cash_flow / total_investment) * 100
    
    # Calculate ROI for 5 and 10 years including appreciation
    future_value_5yr = request.purchase_price * (1 + request.appreciation_rate_pct / 100) ** 5
    future_value_10yr = request.purchase_price * (1 + request.appreciation_rate_pct / 100) ** 10
    
    equity_5yr = future_value_5yr - loan_amount + (annual_cash_flow * 5)
    equity_10yr = future_value_10yr - loan_amount + (annual_cash_flow * 10)
    
    roi_5yr = ((equity_5yr - total_investment) / total_investment) * 100
    roi_10yr = ((equity_10yr - total_investment) / total_investment) * 100
    
    # Calculate months to break even
    if monthly_cash_flow > 0:
        break_even_months = int(total_investment / monthly_cash_flow)
    else:
        break_even_months = -1  # Never breaks even
    
    # Calculate IRR (simplified)
    # In a real implementation, this would use the numpy IRR function
    yearly_cash_flows = [-(total_investment)]
    for year in range(1, request.holding_period_years + 1):
        if year == request.holding_period_years:
            # Last year: add property sale
            cash_flow = annual_cash_flow + future_value_5yr - loan_amount
        else:
            cash_flow = annual_cash_flow
        yearly_cash_flows.append(cash_flow)
    
    irr = 10.0  # Placeholder - would calculate actual IRR
    
    # Determine suggested rent
    # In a real implementation, this would be based on market data
    suggested_rent = request.purchase_price * 0.008  # Rule of thumb: 0.8% of purchase price
    
    # Risk assessment
    if cap_rate >= 7 and cash_on_cash_return >= 8:
        risk_assessment = "low"
    elif cap_rate >= 5 and cash_on_cash_return >= 5:
        risk_assessment = "medium"
    else:
        risk_assessment = "high"
    
    # Sensitivity analysis
    sensitivity_analysis = {
        "interest_rate": {
            "plus_1_percent": monthly_mortgage * 1.12,  # Approximate effect of 1% higher rate
            "minus_1_percent": monthly_mortgage * 0.88,  # Approximate effect of 1% lower rate
        },
        "vacancy_rate": {
            "plus_5_percent": monthly_cash_flow - (0.05 * request.monthly_rent),
            "minus_5_percent": monthly_cash_flow + (0.05 * request.monthly_rent),
        },
        "appreciation_rate": {
            "plus_2_percent": future_value_5yr * 1.1,  # Approximate effect
            "minus_2_percent": future_value_5yr * 0.9,  # Approximate effect
        }
    }
    
    return {
        "monthly_mortgage": monthly_mortgage,
        "monthly_expenses": total_monthly_expenses,
        "monthly_cash_flow": monthly_cash_flow,
        "annual_cash_flow": annual_cash_flow,
        "cap_rate": cap_rate,
        "cash_on_cash_return": cash_on_cash_return,
        "roi_5year": roi_5yr,
        "roi_10year": roi_10yr,
        "break_even_months": break_even_months,
        "irr": irr,
        "suggested_rent": suggested_rent,
        "risk_assessment": risk_assessment,
        "sensitivity_analysis": sensitivity_analysis
    }

# Helper functions
async def simulate_model_training(job_id: str, model_version: str, prediction_type: str):
    """Simulated background task for model training"""
    # In a real implementation, this would:
    # 1. Load training data from the database
    # 2. Preprocess the data
    # 3. Train a model with the specified configuration
    # 4. Evaluate the model on test data
    # 5. Save the model and update its status
    
    # For demo purposes, we'll just wait a few seconds
    import asyncio
    await asyncio.sleep(15)
    
    # The actual model training would happen here
    # ...
    
    # In a real implementation, we would update a database record with the results
    print(f"Training completed for job {job_id}")

if __name__ == "__main__":
    import uvicorn
    # Start the API server
    uvicorn.run("app:app", host="0.0.0.0", port=8004, reload=True)