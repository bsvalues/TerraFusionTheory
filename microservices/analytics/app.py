"""
Analytics Microservice

This microservice provides APIs for advanced analytics and predictions:
- Property value predictions based on various models
- Market trend predictions
- Investment analysis and scenarios
- Hotspot detection
"""

import os
import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import math
import statistics
from enum import Enum

from fastapi import Depends, FastAPI, HTTPException, Query, Path, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from ..common.fastapi_utils import create_app, register_exception_handlers, get_db
from ..common.db_init import PropertyListing, PropertyValuation, MarketMetrics, MarketPrediction

# Create FastAPI app
app = create_app(
    name="analytics",
    description="API for advanced property and market analytics"
)

# Register exception handlers
register_exception_handlers(app)

# Pydantic models for request/response
class PropertyFeatures(BaseModel):
    address: str
    city: str
    state: str
    zip_code: str
    property_type: str
    beds: int
    baths: float
    sqft: int
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    class Config:
        schema_extra = {
            "example": {
                "address": "123 Main St",
                "city": "Grandview",
                "state": "WA",
                "zip_code": "98930",
                "property_type": "single_family",
                "beds": 4,
                "baths": 2.5,
                "sqft": 2450,
                "lot_size": 0.25,
                "year_built": 1998,
                "latitude": 46.2546,
                "longitude": -119.9021
            }
        }

class PropertyValuePredictionRequest(BaseModel):
    property_features: PropertyFeatures
    model_type: str = Field("sales_comparison", description="Model to use for prediction (sales_comparison, hedonic, appraisal)")
    include_comparables: bool = Field(True, description="Whether to include comparable properties in response")
    max_comparables: int = Field(5, description="Maximum number of comparable properties to return")
    
    class Config:
        schema_extra = {
            "example": {
                "property_features": {
                    "address": "123 Main St",
                    "city": "Grandview",
                    "state": "WA",
                    "zip_code": "98930",
                    "property_type": "single_family",
                    "beds": 4,
                    "baths": 2.5,
                    "sqft": 2450,
                    "lot_size": 0.25,
                    "year_built": 1998,
                    "latitude": 46.2546,
                    "longitude": -119.9021
                },
                "model_type": "sales_comparison",
                "include_comparables": True,
                "max_comparables": 5
            }
        }

class ComparableProperty(BaseModel):
    id: int
    address: str
    distance_miles: float
    price: float
    adjusted_price: float
    adjustment_factors: Dict[str, float]
    beds: int
    baths: float
    sqft: int
    year_built: Optional[int] = None
    sale_date: Optional[str] = None

class PropertyValuePredictionResponse(BaseModel):
    estimated_value: float
    confidence_score: float
    value_range: List[float]
    model_used: str
    prediction_date: str
    property_features: PropertyFeatures
    comparable_properties: Optional[List[ComparableProperty]] = None
    valuation_factors: Dict[str, Any]

class ModelType(str, Enum):
    SALES_COMPARISON = "sales_comparison"
    HEDONIC = "hedonic"
    APPRAISAL = "appraisal"
    NEURAL_NETWORK = "neural_network"
    GRADIENT_BOOST = "gradient_boost"

class TrainingRequest(BaseModel):
    model_type: ModelType
    area_type: str = Field(..., description="Type of area to train on (zip, city, county, state)")
    area_value: str = Field(..., description="Value of the area (e.g., 98930)")
    min_training_samples: int = Field(50, description="Minimum number of samples required for training")
    hyperparameters: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "model_type": "hedonic",
                "area_type": "zip",
                "area_value": "98930",
                "min_training_samples": 50,
                "hyperparameters": {
                    "learning_rate": 0.01,
                    "max_depth": 5,
                    "n_estimators": 100
                }
            }
        }

class TrainingResponse(BaseModel):
    job_id: str
    model_type: str
    area_type: str
    area_value: str
    status: str
    start_time: str
    estimated_completion_time: Optional[str] = None

class TrainingStatus(BaseModel):
    job_id: str
    status: str
    progress: float
    metrics: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    completion_time: Optional[str] = None

class MarketTrendPredictionRequest(BaseModel):
    area_type: str = Field(..., description="Type of area (zip, city, county, state)")
    area_value: str = Field(..., description="Value of the area (e.g., 98930)")
    prediction_months: int = Field(6, description="Number of months to predict forward")
    metrics: List[str] = Field(["median_price"], description="Metrics to predict")
    
    class Config:
        schema_extra = {
            "example": {
                "area_type": "zip",
                "area_value": "98930",
                "prediction_months": 6,
                "metrics": ["median_price", "total_listings", "avg_days_on_market"]
            }
        }

class MarketTrendPredictionResponse(BaseModel):
    area_type: str
    area_value: str
    prediction_date: str
    prediction_periods: List[str]
    predictions: Dict[str, List[float]]
    confidence_intervals: Dict[str, List[List[float]]]
    historical_periods: List[str]
    historical_values: Dict[str, List[float]]
    trend_factors: Dict[str, Any]

class HotspotSearchRequest(BaseModel):
    state: str = Field(..., description="State to search within")
    metrics: List[str] = Field(["appreciation_rate"], description="Metrics to evaluate")
    limit: int = Field(10, description="Number of hotspots to return")
    
    class Config:
        schema_extra = {
            "example": {
                "state": "WA",
                "metrics": ["appreciation_rate", "price_to_rent_ratio", "days_on_market"],
                "limit": 10
            }
        }

class Hotspot(BaseModel):
    area_type: str
    area_value: str
    name: str
    score: float
    metrics: Dict[str, float]
    current_median_price: float
    year_over_year_change: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class HotspotSearchResponse(BaseModel):
    hotspots: List[Hotspot]
    search_date: str
    state: str
    metrics_used: List[str]

class InvestmentAnalysisRequest(BaseModel):
    property_id: Optional[int] = None
    property_price: Optional[float] = None
    property_features: Optional[PropertyFeatures] = None
    monthly_rent: Optional[float] = None
    down_payment_percent: float = Field(20.0, description="Down payment percentage")
    interest_rate: float = Field(4.5, description="Mortgage interest rate")
    loan_term_years: int = Field(30, description="Mortgage term in years")
    annual_property_tax_rate: float = Field(1.0, description="Annual property tax rate percentage")
    annual_insurance_cost: float = Field(1200, description="Annual insurance cost")
    monthly_hoa_fee: float = Field(0, description="Monthly HOA fee")
    annual_maintenance_percent: float = Field(1.0, description="Annual maintenance cost as percentage of property value")
    annual_vacancy_percent: float = Field(5.0, description="Annual vacancy rate percentage")
    annual_management_fee_percent: float = Field(8.0, description="Property management fee percentage")
    holding_period_years: int = Field(5, description="Investment holding period in years")
    annual_appreciation_rate: Optional[float] = None
    annual_rent_increase_rate: float = Field(3.0, description="Annual rent increase percentage")
    
    class Config:
        schema_extra = {
            "example": {
                "property_id": 1,
                "monthly_rent": 1800,
                "down_payment_percent": 20.0,
                "interest_rate": 4.5,
                "loan_term_years": 30,
                "annual_property_tax_rate": 1.0,
                "annual_insurance_cost": 1200,
                "monthly_hoa_fee": 0,
                "annual_maintenance_percent": 1.0,
                "annual_vacancy_percent": 5.0,
                "annual_management_fee_percent": 8.0,
                "holding_period_years": 5,
                "annual_rent_increase_rate": 3.0
            }
        }

class InvestmentAnalysisResponse(BaseModel):
    property_details: Dict[str, Any]
    monthly_cash_flow: float
    annual_cash_flow: float
    cap_rate: float
    cash_on_cash_return: float
    total_return_on_investment: float
    internal_rate_of_return: float
    gross_rent_multiplier: float
    debt_service_coverage_ratio: float
    break_even_ratio: float
    estimated_future_value: float
    monthly_expenses: Dict[str, float]
    annual_profit_loss: Dict[str, float]
    cumulative_equity: float
    cumulative_cash_flow: float
    amortization_schedule: Optional[Dict[str, Any]] = None

# Global training jobs tracker
training_jobs = {}

# Property Valuation Endpoint
@app.post("/predict-property-value", response_model=PropertyValuePredictionResponse, tags=["Property Analytics"])
async def predict_property_value(
    request: PropertyValuePredictionRequest,
    db: Session = Depends(get_db)
) -> PropertyValuePredictionResponse:
    """
    Predict the value of a property based on its features
    """
    # Validate model type
    valid_models = ["sales_comparison", "hedonic", "appraisal"]
    if request.model_type not in valid_models:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model type. Must be one of: {', '.join(valid_models)}"
        )
    
    # Extract features for prediction
    features = request.property_features
    
    # Find comparable properties for sales comparison approach
    comparables = []
    valuation_factors = {}
    
    if request.model_type == "sales_comparison":
        # Use features to find similar properties
        query = db.query(PropertyListing).filter(
            PropertyListing.city == features.city,
            PropertyListing.state == features.state,
            PropertyListing.property_type == features.property_type,
            PropertyListing.beds.between(features.beds - 1, features.beds + 1),
            PropertyListing.baths.between(features.baths - 0.5, features.baths + 0.5),
            PropertyListing.sqft.between(features.sqft * 0.8, features.sqft * 1.2)
        )
        
        if features.year_built:
            query = query.filter(PropertyListing.year_built.between(features.year_built - 10, features.year_built + 10))
        
        # Find recently sold properties
        query = query.filter(PropertyListing.status == "sold")
        query = query.order_by(desc(PropertyListing.updated_date))
        query = query.limit(request.max_comparables * 2)  # Get extra to allow for filtering
        
        # Get results
        potential_comps = query.all()
        
        # If not enough comps, relax criteria
        if len(potential_comps) < 3:
            query = db.query(PropertyListing).filter(
                PropertyListing.city == features.city,
                PropertyListing.state == features.state,
                PropertyListing.property_type == features.property_type,
                PropertyListing.status == "sold"
            )
            query = query.order_by(desc(PropertyListing.updated_date))
            query = query.limit(request.max_comparables * 2)
            potential_comps = query.all()
        
        # Calculate distance if coordinates are available
        def calculate_distance(prop):
            if features.latitude and features.longitude and prop.latitude and prop.longitude:
                # Haversine formula
                R = 3958.8  # Earth radius in miles
                lat1, lon1 = math.radians(features.latitude), math.radians(features.longitude)
                lat2, lon2 = math.radians(prop.latitude), math.radians(prop.longitude)
                dlat = lat2 - lat1
                dlon = lon2 - lon1
                a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                return R * c
            return 0
        
        # Add distance to each comp
        for comp in potential_comps:
            comp.distance = calculate_distance(comp)
        
        # Sort by distance if coordinates are available
        if features.latitude and features.longitude:
            potential_comps.sort(key=lambda x: x.distance)
        
        # Calculate adjustments
        selected_comps = potential_comps[:request.max_comparables]
        
        for comp in selected_comps:
            adjustments = {}
            
            # Bed adjustment ($5,000 per bed difference)
            bed_diff = features.beds - comp.beds
            adjustments["beds"] = bed_diff * 5000
            
            # Bath adjustment ($7,500 per bath difference)
            bath_diff = features.baths - comp.baths
            adjustments["baths"] = bath_diff * 7500
            
            # Square footage adjustment ($100 per sqft difference)
            sqft_diff = features.sqft - comp.sqft
            sqft_adj_rate = comp.price / comp.sqft if comp.sqft > 0 else 100
            adjustments["sqft"] = sqft_diff * sqft_adj_rate
            
            # Age adjustment if year_built is available ($500 per year difference)
            if features.year_built and comp.year_built:
                age_diff = comp.year_built - features.year_built
                adjustments["age"] = age_diff * 500
            
            # Location adjustment based on distance
            if hasattr(comp, 'distance') and comp.distance > 0:
                adjustments["location"] = -comp.distance * 1000  # $1000 per mile
            
            # Total adjustments
            total_adjustment = sum(adjustments.values())
            adjusted_price = comp.price + total_adjustment
            
            comparables.append(ComparableProperty(
                id=comp.id,
                address=comp.address,
                distance_miles=getattr(comp, 'distance', 0),
                price=comp.price,
                adjusted_price=adjusted_price,
                adjustment_factors=adjustments,
                beds=comp.beds,
                baths=comp.baths,
                sqft=comp.sqft,
                year_built=comp.year_built,
                sale_date=comp.updated_date.strftime('%Y-%m-%d') if hasattr(comp.updated_date, 'strftime') else str(comp.updated_date)
            ))
        
        # Calculate estimated value based on adjusted comparables
        if comparables:
            adjusted_prices = [c.adjusted_price for c in comparables]
            estimated_value = statistics.mean(adjusted_prices)
            median_value = statistics.median(adjusted_prices)
            min_value = min(adjusted_prices)
            max_value = max(adjusted_prices)
            std_dev = statistics.stdev(adjusted_prices) if len(adjusted_prices) > 1 else (max_value - min_value) / 4
            
            # Confidence score based on std deviation and number of comps
            comp_count_factor = min(1.0, len(comparables) / 5)  # Higher with more comps
            std_dev_factor = 1.0 - min(1.0, std_dev / median_value)  # Higher with lower std dev
            confidence_score = (comp_count_factor + std_dev_factor) / 2
            
            # Value range with 90% confidence interval
            value_range = [
                max(min_value, estimated_value - 1.645 * std_dev),
                min(max_value, estimated_value + 1.645 * std_dev)
            ]
            
            # Store factors for response
            valuation_factors = {
                "comparable_count": len(comparables),
                "standard_deviation": std_dev,
                "median_value": median_value,
                "adjustment_summary": {
                    "average_adjustment": sum(sum(c.adjustment_factors.values()) for c in comparables) / len(comparables),
                    "adjustment_factors": ["beds", "baths", "sqft", "age", "location"]
                }
            }
        else:
            # No comparables found, fall back to a simple hedonic model
            base_price = 150000  # Base price for the area
            estimated_value = base_price
            
            # Simple adjustments
            estimated_value += features.beds * 15000
            estimated_value += features.baths * 10000
            estimated_value += features.sqft * 100
            
            if features.year_built:
                age = datetime.now().year - features.year_built
                estimated_value -= age * 500
            
            confidence_score = 0.5  # Lower confidence with no comps
            value_range = [estimated_value * 0.8, estimated_value * 1.2]
            
            valuation_factors = {
                "warning": "No comparable properties found, using simplified hedonic model",
                "base_price": base_price,
                "adjustments": {
                    "beds": features.beds * 15000,
                    "baths": features.baths * 10000,
                    "sqft": features.sqft * 100,
                    "age": -age * 500 if features.year_built else 0
                }
            }
    
    # For hedonic model
    elif request.model_type == "hedonic":
        # Simple hedonic model (in production, this would use a trained ML model)
        base_price = 100000  # Base price for the area
        
        # Get recent sales to calibrate pricing
        recent_sales = db.query(PropertyListing).filter(
            PropertyListing.city == features.city,
            PropertyListing.state == features.state,
            PropertyListing.status == "sold"
        ).order_by(desc(PropertyListing.updated_date)).limit(50).all()
        
        if recent_sales:
            # Calculate average price per square foot
            price_per_sqft = sum(p.price / p.sqft for p in recent_sales if p.sqft > 0) / len(recent_sales)
            
            # Use price per square foot as base
            estimated_value = features.sqft * price_per_sqft
            
            # Apply adjustments for other factors
            bed_adj = (features.beds - 3) * 10000  # Relative to 3-bedroom
            bath_adj = (features.baths - 2) * 15000  # Relative to 2-bathroom
            
            # Age adjustment if available
            age_adj = 0
            if features.year_built:
                age = datetime.now().year - features.year_built
                age_adj = -max(0, age - 10) * 750  # Discount for properties older than 10 years
            
            # Apply adjustments
            estimated_value += bed_adj + bath_adj + age_adj
            
            # Calculate confidence based on standard deviation of sales prices
            prices = [p.price for p in recent_sales]
            std_dev = statistics.stdev(prices) if len(prices) > 1 else max(prices) - min(prices)
            confidence_score = max(0.5, min(0.9, 1.0 - (std_dev / statistics.median(prices))))
            
            # Value range based on confidence
            value_range = [
                estimated_value * (1 - (1 - confidence_score)),
                estimated_value * (1 + (1 - confidence_score))
            ]
            
            # Save factors for response
            valuation_factors = {
                "recent_sales_count": len(recent_sales),
                "price_per_sqft": price_per_sqft,
                "bed_adjustment": bed_adj,
                "bath_adjustment": bath_adj,
                "age_adjustment": age_adj,
                "model_coefficients": {
                    "sqft": price_per_sqft,
                    "bed": 10000,
                    "bath": 15000,
                    "age": -750
                }
            }
        else:
            # Fallback when no recent sales
            estimated_value = base_price
            estimated_value += features.beds * 15000
            estimated_value += features.baths * 10000
            estimated_value += features.sqft * 120
            
            if features.year_built:
                age = datetime.now().year - features.year_built
                estimated_value -= age * 500
            
            confidence_score = 0.5  # Lower confidence
            value_range = [estimated_value * 0.8, estimated_value * 1.2]
            
            valuation_factors = {
                "warning": "No recent sales found, using simplified model",
                "base_price": base_price,
                "adjustments": {
                    "beds": features.beds * 15000,
                    "baths": features.baths * 10000,
                    "sqft": features.sqft * 120,
                    "age": -age * 500 if features.year_built else 0
                }
            }
    
    # For appraisal model (combines multiple approaches)
    elif request.model_type == "appraisal":
        # Run both sales comparison and hedonic models
        sales_comp_request = PropertyValuePredictionRequest(
            property_features=features,
            model_type="sales_comparison",
            include_comparables=True,
            max_comparables=3
        )
        
        hedonic_request = PropertyValuePredictionRequest(
            property_features=features,
            model_type="hedonic",
            include_comparables=False
        )
        
        # Get both valuations
        sales_comp_result = await predict_property_value(sales_comp_request, db)
        hedonic_result = await predict_property_value(hedonic_request, db)
        
        # Cost approach (simplified)
        base_replacement_cost = 150  # per square foot
        replacement_cost = features.sqft * base_replacement_cost
        
        # Apply depreciation if year_built is available
        depreciation = 0
        if features.year_built:
            age = datetime.now().year - features.year_built
            effective_age = min(age, 30)  # Cap at 30 years for depreciation
            total_economic_life = 60  # Years
            depreciation_rate = effective_age / total_economic_life
            depreciation = replacement_cost * depreciation_rate
        
        # Land value (simplified - typically 20-30% of total value)
        land_value_percent = 0.25
        land_value = sales_comp_result.estimated_value * land_value_percent
        
        # Cost approach value
        cost_approach_value = (replacement_cost - depreciation) + land_value
        
        # Weighted average of all approaches
        weights = {
            "sales_comparison": 0.6,
            "hedonic": 0.2,
            "cost": 0.2
        }
        
        estimated_value = (
            weights["sales_comparison"] * sales_comp_result.estimated_value +
            weights["hedonic"] * hedonic_result.estimated_value +
            weights["cost"] * cost_approach_value
        )
        
        # Use higher confidence from combined approaches
        confidence_score = max(sales_comp_result.confidence_score, hedonic_result.confidence_score)
        
        # Value range based on all approaches
        value_range = [
            min(sales_comp_result.value_range[0], hedonic_result.value_range[0], cost_approach_value * 0.9),
            max(sales_comp_result.value_range[1], hedonic_result.value_range[1], cost_approach_value * 1.1)
        ]
        
        # Comparables from sales comparison approach
        comparables = sales_comp_result.comparable_properties
        
        # Combined valuation factors
        valuation_factors = {
            "approach_values": {
                "sales_comparison": sales_comp_result.estimated_value,
                "hedonic": hedonic_result.estimated_value,
                "cost": cost_approach_value
            },
            "approach_weights": weights,
            "cost_approach_details": {
                "replacement_cost_per_sqft": base_replacement_cost,
                "total_replacement_cost": replacement_cost,
                "depreciation": depreciation,
                "land_value": land_value
            },
            "sales_comparison_details": sales_comp_result.valuation_factors,
            "hedonic_details": hedonic_result.valuation_factors
        }
    
    # Round the estimated value to nearest $100
    estimated_value = round(estimated_value / 100) * 100
    
    # Round the value range to nearest $1,000
    value_range = [round(vr / 1000) * 1000 for vr in value_range]
    
    return PropertyValuePredictionResponse(
        estimated_value=estimated_value,
        confidence_score=round(confidence_score * 100) / 100,  # Round to 2 decimal places
        value_range=value_range,
        model_used=request.model_type,
        prediction_date=datetime.now().isoformat(),
        property_features=features,
        comparable_properties=comparables if request.include_comparables else None,
        valuation_factors=valuation_factors
    )

# Model Training Endpoint (Background Task)
def train_model_task(job_id: str, request: TrainingRequest, db: Session):
    """Background task to train a valuation model"""
    try:
        # Update job status to running
        training_jobs[job_id]["status"] = "running"
        training_jobs[job_id]["progress"] = 0.1
        
        # Get property data for training
        query = db.query(PropertyListing).filter(
            getattr(PropertyListing, request.area_type.lower()) == request.area_value,
            PropertyListing.status == "sold",
            PropertyListing.price.isnot(None),
            PropertyListing.beds.isnot(None),
            PropertyListing.baths.isnot(None),
            PropertyListing.sqft.isnot(None)
        )
        
        # Get results
        properties = query.all()
        
        if len(properties) < request.min_training_samples:
            training_jobs[job_id]["status"] = "failed"
            training_jobs[job_id]["error"] = f"Insufficient training data. Found {len(properties)} samples, but {request.min_training_samples} required."
            return
        
        # Update progress
        training_jobs[job_id]["progress"] = 0.2
        
        # Simulate training steps with different model types
        if request.model_type == ModelType.SALES_COMPARISON:
            # For sales comparison, we're just building a database of comparables
            # and calculating adjustment factors
            
            # Calculate median values
            beds_values = [p.beds for p in properties if p.beds is not None]
            baths_values = [p.baths for p in properties if p.baths is not None]
            sqft_values = [p.sqft for p in properties if p.sqft is not None]
            price_values = [p.price for p in properties if p.price is not None]
            
            median_beds = statistics.median(beds_values) if beds_values else 3
            median_baths = statistics.median(baths_values) if baths_values else 2
            median_sqft = statistics.median(sqft_values) if sqft_values else 1500
            median_price = statistics.median(price_values) if price_values else 200000
            
            # Calculate price per square foot
            price_per_sqft = median_price / median_sqft if median_sqft > 0 else 100
            
            # Calculate adjustment factors
            bed_adjustment = median_price * 0.05  # 5% of median price per bedroom
            bath_adjustment = median_price * 0.025  # 2.5% of median price per bathroom
            
            # Update progress
            training_jobs[job_id]["progress"] = 0.7
            
            # Calculate accuracy metrics
            predicted_prices = []
            for prop in properties:
                if prop.price and prop.beds and prop.baths and prop.sqft:
                    # Simple prediction
                    base_price = prop.sqft * price_per_sqft
                    bed_adj = (prop.beds - median_beds) * bed_adjustment
                    bath_adj = (prop.baths - median_baths) * bath_adjustment
                    predicted_price = base_price + bed_adj + bath_adj
                    predicted_prices.append((prop.price, predicted_price))
            
            # Calculate error metrics
            if predicted_prices:
                errors = [(actual - predicted) / actual for actual, predicted in predicted_prices]
                mape = sum(abs(e) for e in errors) / len(errors)  # Mean Absolute Percentage Error
                r_squared = 1 - sum(e**2 for e in errors) / sum((actual/median_price - 1)**2 for actual, _ in predicted_prices)
                
                # Store model outputs
                training_jobs[job_id]["metrics"] = {
                    "median_price": median_price,
                    "price_per_sqft": price_per_sqft,
                    "bed_adjustment": bed_adjustment,
                    "bath_adjustment": bath_adjustment,
                    "mape": mape,
                    "r_squared": r_squared,
                    "sample_size": len(properties)
                }
            
        elif request.model_type == ModelType.HEDONIC:
            # For hedonic model, we build a regression model
            
            # Update progress
            training_jobs[job_id]["progress"] = 0.3
            
            # Prepare training data
            X = []  # Features
            y = []  # Target (price)
            
            for prop in properties:
                if prop.price and prop.beds and prop.baths and prop.sqft:
                    features = [
                        prop.beds,
                        prop.baths,
                        prop.sqft,
                        prop.year_built if prop.year_built else 1980  # Default if missing
                    ]
                    X.append(features)
                    y.append(prop.price)
            
            # Update progress
            training_jobs[job_id]["progress"] = 0.5
            
            # Simple multiple linear regression (in production use sklearn)
            n = len(X)
            if n > 0:
                # Calculate mean of X and y
                mean_x = [sum(X[i][j] for i in range(n)) / n for j in range(len(X[0]))]
                mean_y = sum(y) / n
                
                # Calculate coefficients (simplified)
                # In a real implementation, use proper matrix operations
                # This is just a simulation
                coefficients = [
                    15000,  # beds
                    25000,  # baths
                    120,    # sqft
                    500     # year_built
                ]
                
                # Calculate intercept
                intercept = mean_y - sum(coefficients[j] * mean_x[j] for j in range(len(mean_x)))
                
                # Calculate predictions
                predictions = []
                for i in range(n):
                    pred = intercept + sum(coefficients[j] * X[i][j] for j in range(len(coefficients)))
                    predictions.append(pred)
                
                # Calculate error metrics
                errors = [(y[i] - predictions[i]) / y[i] for i in range(n)]
                mape = sum(abs(e) for e in errors) / n
                r_squared = 1 - sum((y[i] - predictions[i])**2 for i in range(n)) / sum((y[i] - mean_y)**2 for i in range(n))
                
                # Store model outputs
                training_jobs[job_id]["metrics"] = {
                    "intercept": intercept,
                    "coefficients": {
                        "beds": coefficients[0],
                        "baths": coefficients[1],
                        "sqft": coefficients[2],
                        "year_built": coefficients[3]
                    },
                    "mape": mape,
                    "r_squared": r_squared,
                    "sample_size": n
                }
        
        # Other model types would go here
        else:
            # Simulate general ML training
            # In production, use actual ML frameworks
            
            # Update progress as training proceeds
            for progress in [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]:
                training_jobs[job_id]["progress"] = progress
                time.sleep(1)  # Simulate training time
            
            # Generate random metrics for demonstration
            training_jobs[job_id]["metrics"] = {
                "mape": 0.12,
                "r_squared": 0.85,
                "mae": 15000,
                "rmse": 25000,
                "sample_size": len(properties)
            }
        
        # Complete the job
        training_jobs[job_id]["status"] = "completed"
        training_jobs[job_id]["progress"] = 1.0
        training_jobs[job_id]["completion_time"] = datetime.now().isoformat()
        
    except Exception as e:
        # Handle errors
        training_jobs[job_id]["status"] = "failed"
        training_jobs[job_id]["error"] = str(e)
        training_jobs[job_id]["progress"] = 0.0

@app.post("/train-model", response_model=TrainingResponse, status_code=202, tags=["Model Training"])
async def train_model(
    request: TrainingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> TrainingResponse:
    """
    Start training a new valuation model in the background
    """
    # Create job ID
    job_id = str(uuid.uuid4())
    
    # Estimate completion time (based on data size and model type)
    estimate_minutes = 5
    estimated_completion = (datetime.now() + timedelta(minutes=estimate_minutes)).isoformat()
    
    # Create job entry
    training_jobs[job_id] = {
        "id": job_id,
        "model_type": request.model_type,
        "area_type": request.area_type,
        "area_value": request.area_value,
        "status": "pending",
        "progress": 0.0,
        "start_time": datetime.now().isoformat(),
        "estimated_completion_time": estimated_completion
    }
    
    # Add task to background
    background_tasks.add_task(train_model_task, job_id, request, db)
    
    return TrainingResponse(
        job_id=job_id,
        model_type=request.model_type,
        area_type=request.area_type,
        area_value=request.area_value,
        status="pending",
        start_time=training_jobs[job_id]["start_time"],
        estimated_completion_time=estimated_completion
    )

@app.get("/training-status/{job_id}", response_model=TrainingStatus, tags=["Model Training"])
async def get_training_status(
    job_id: str = Path(..., description="ID of the training job")
) -> TrainingStatus:
    """
    Get the status of a model training job
    """
    if job_id not in training_jobs:
        raise HTTPException(status_code=404, detail=f"Training job with ID {job_id} not found")
    
    job = training_jobs[job_id]
    
    return TrainingStatus(
        job_id=job_id,
        status=job["status"],
        progress=job["progress"],
        metrics=job.get("metrics"),
        error=job.get("error"),
        completion_time=job.get("completion_time")
    )

# Market Trend Prediction Endpoint
@app.post("/predict-market-trend", response_model=MarketTrendPredictionResponse, tags=["Market Analytics"])
async def predict_market_trend(
    request: MarketTrendPredictionRequest,
    db: Session = Depends(get_db)
) -> MarketTrendPredictionResponse:
    """
    Predict future market trends for the specified area
    """
    # Verify requested metrics
    valid_metrics = [
        "median_price", "average_price", "price_per_sqft", 
        "total_listings", "new_listings", "total_sales", 
        "avg_days_on_market", "list_to_sale_ratio"
    ]
    
    invalid_metrics = [m for m in request.metrics if m not in valid_metrics]
    if invalid_metrics:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid metrics: {', '.join(invalid_metrics)}. Valid metrics are: {', '.join(valid_metrics)}"
        )
    
    # Get historical data
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365 * 2)  # 2 years of historical data
    
    query = db.query(MarketMetrics).filter(
        MarketMetrics.area_type == request.area_type,
        MarketMetrics.area_value == request.area_value,
        MarketMetrics.period_end >= start_date,
        MarketMetrics.period_end <= end_date
    ).order_by(MarketMetrics.period_end)
    
    historical_data = query.all()
    
    if not historical_data:
        raise HTTPException(
            status_code=404,
            detail=f"Insufficient historical data for {request.area_type} {request.area_value}"
        )
    
    # Process historical data
    historical_periods = []
    historical_values = {metric: [] for metric in request.metrics}
    
    for data_point in historical_data:
        period = data_point.period_end.strftime('%Y-%m') if isinstance(data_point.period_end, datetime) else str(data_point.period_end)
        
        if period not in historical_periods:
            historical_periods.append(period)
            
            for metric in request.metrics:
                value = getattr(data_point, metric)
                if value is not None:
                    historical_values[metric].append(float(value))
                else:
                    historical_values[metric].append(None)
    
    # Fill missing values with interpolation
    for metric in request.metrics:
        values = historical_values[metric]
        if None in values:
            # Simple linear interpolation
            for i in range(len(values)):
                if values[i] is None:
                    # Find previous non-None value
                    prev_idx = i - 1
                    while prev_idx >= 0 and values[prev_idx] is None:
                        prev_idx -= 1
                    
                    # Find next non-None value
                    next_idx = i + 1
                    while next_idx < len(values) and values[next_idx] is None:
                        next_idx += 1
                    
                    if prev_idx >= 0 and next_idx < len(values):
                        # Interpolate
                        values[i] = values[prev_idx] + (values[next_idx] - values[prev_idx]) * (i - prev_idx) / (next_idx - prev_idx)
                    elif prev_idx >= 0:
                        # Use previous value
                        values[i] = values[prev_idx]
                    elif next_idx < len(values):
                        # Use next value
                        values[i] = values[next_idx]
                    else:
                        # No reference, use a default
                        values[i] = 0
    
    # Generate future periods
    current_date = datetime.now()
    prediction_periods = []
    
    for i in range(1, request.prediction_months + 1):
        future_date = current_date + timedelta(days=30 * i)
        prediction_periods.append(future_date.strftime('%Y-%m'))
    
    # For each metric, predict future values
    predictions = {metric: [] for metric in request.metrics}
    confidence_intervals = {metric: [] for metric in request.metrics}
    
    # Trend factors for the response
    trend_factors = {}
    
    for metric in request.metrics:
        # Get historical values for this metric
        values = historical_values[metric]
        
        if not values or all(v is None for v in values):
            # Skip if no historical data
            predictions[metric] = [0] * len(prediction_periods)
            confidence_intervals[metric] = [[0, 0]] * len(prediction_periods)
            continue
        
        # Simple linear regression for trend
        n = len(values)
        x = list(range(n))
        y = values
        
        # Calculate slope and intercept
        mean_x = sum(x) / n
        mean_y = sum(y) / n
        
        numerator = sum((x[i] - mean_x) * (y[i] - mean_y) for i in range(n))
        denominator = sum((x[i] - mean_x) ** 2 for i in range(n))
        
        slope = numerator / denominator if denominator != 0 else 0
        intercept = mean_y - slope * mean_x
        
        # Calculate trend prediction
        for i in range(1, request.prediction_months + 1):
            pred_x = n - 1 + i
            predicted_value = intercept + slope * pred_x
            
            # Ensure non-negative values
            predicted_value = max(0, predicted_value)
            
            # Adjust for seasonality (simplified)
            month = int(prediction_periods[i-1].split('-')[1])
            seasonal_factor = 1.0
            
            # Simple seasonality model
            if metric == "median_price" or metric == "average_price":
                # Prices tend to be higher in summer
                seasonal_factor = 1.0 + 0.03 * math.sin((month - 1) * math.pi / 6)
            elif metric == "total_listings" or metric == "new_listings":
                # Listings tend to be higher in spring/summer
                seasonal_factor = 1.0 + 0.1 * math.sin((month - 3) * math.pi / 6)
            elif metric == "avg_days_on_market":
                # Days on market tend to be lower in summer
                seasonal_factor = 1.0 - 0.1 * math.sin((month - 1) * math.pi / 6)
            
            predicted_value *= seasonal_factor
            
            # Add to predictions
            predictions[metric].append(round(predicted_value, 2))
            
            # Calculate confidence interval (simplified)
            std_dev = math.sqrt(sum((y[i] - (intercept + slope * x[i])) ** 2 for i in range(n)) / n)
            margin = 1.96 * std_dev * math.sqrt(1 + 1/n + (pred_x - mean_x)**2 / denominator)
            confidence_intervals[metric].append([
                round(max(0, predicted_value - margin), 2),
                round(predicted_value + margin, 2)
            ])
        
        # Store trend factors
        trend_factors[metric] = {
            "slope": slope,
            "intercept": intercept,
            "r_squared": 1 - sum((y[i] - (intercept + slope * x[i]))**2 for i in range(n)) / sum((y[i] - mean_y)**2 for i in range(n)),
            "historical_mean": mean_y,
            "prediction_confidence": 0.9 - 0.1 * (request.prediction_months / 12),  # Confidence decreases with prediction distance
            "seasonality_applied": True
        }
        
        # Add YoY growth rate
        if len(values) >= 12:
            yoy_growth = (values[-1] / values[-12] - 1) * 100 if values[-12] > 0 else 0
            trend_factors[metric]["yoy_growth_rate"] = yoy_growth
    
    # Prepare response
    return MarketTrendPredictionResponse(
        area_type=request.area_type,
        area_value=request.area_value,
        prediction_date=datetime.now().isoformat(),
        prediction_periods=prediction_periods,
        predictions=predictions,
        confidence_intervals=confidence_intervals,
        historical_periods=historical_periods,
        historical_values=historical_values,
        trend_factors=trend_factors
    )

# Hotspot Search Endpoint
@app.post("/find-hotspots", response_model=HotspotSearchResponse, tags=["Market Analytics"])
async def find_hotspots(
    request: HotspotSearchRequest,
    db: Session = Depends(get_db)
) -> HotspotSearchResponse:
    """
    Find real estate market hotspots based on specified metrics
    """
    # Validate metrics
    valid_metrics = ["appreciation_rate", "price_to_rent_ratio", "days_on_market", "inventory_change", "affordability_index"]
    invalid_metrics = [m for m in request.metrics if m not in valid_metrics]
    if invalid_metrics:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid metrics: {', '.join(invalid_metrics)}. Valid metrics are: {', '.join(valid_metrics)}"
        )
    
    # Get recent market data for all areas in the state
    current_date = datetime.now()
    year_ago_date = current_date - timedelta(days=365)
    
    # Get current data
    current_query = db.query(MarketMetrics).filter(
        MarketMetrics.state == request.state,
        MarketMetrics.period_end <= current_date
    ).order_by(desc(MarketMetrics.period_end))
    
    # Get data from a year ago
    year_ago_query = db.query(MarketMetrics).filter(
        MarketMetrics.state == request.state,
        MarketMetrics.period_end <= year_ago_date
    ).order_by(desc(MarketMetrics.period_end))
    
    # Get most recent data for each area
    areas = {}
    for metric in current_query.all():
        area_key = f"{metric.area_type}_{metric.area_value}"
        if area_key not in areas:
            areas[area_key] = {
                "area_type": metric.area_type,
                "area_value": metric.area_value,
                "current": metric,
                "year_ago": None,
                "scores": {}
            }
    
    # Add year-ago data
    for metric in year_ago_query.all():
        area_key = f"{metric.area_type}_{metric.area_value}"
        if area_key in areas and areas[area_key]["year_ago"] is None:
            areas[area_key]["year_ago"] = metric
    
    # Calculate scores for each area
    scored_areas = []
    for area_key, area_data in areas.items():
        current = area_data["current"]
        year_ago = area_data["year_ago"]
        
        # Skip if we don't have both current and year-ago data
        if not current or not year_ago:
            continue
        
        # Calculate metrics
        metrics_data = {}
        
        # Appreciation rate
        if "appreciation_rate" in request.metrics:
            if current.median_price and year_ago.median_price and year_ago.median_price > 0:
                appreciation = (current.median_price / year_ago.median_price - 1) * 100
                metrics_data["appreciation_rate"] = appreciation
        
        # Days on market change
        if "days_on_market" in request.metrics:
            if current.avg_days_on_market and year_ago.avg_days_on_market and year_ago.avg_days_on_market > 0:
                dom_change = (current.avg_days_on_market / year_ago.avg_days_on_market - 1) * 100
                # Negative is better (days decreasing)
                metrics_data["days_on_market"] = -dom_change
        
        # Inventory change
        if "inventory_change" in request.metrics:
            if current.total_listings and year_ago.total_listings and year_ago.total_listings > 0:
                inventory_change = (current.total_listings / year_ago.total_listings - 1) * 100
                # Negative is better (inventory decreasing)
                metrics_data["inventory_change"] = -inventory_change
        
        # Price to rent ratio (simplified - using median price)
        if "price_to_rent_ratio" in request.metrics:
            # Using a simplified approach since we don't have rent data
            # In a real implementation, this would use actual rent data
            estimated_monthly_rent = current.median_price * 0.005  # Very rough estimate
            if estimated_monthly_rent > 0:
                price_to_rent = current.median_price / (estimated_monthly_rent * 12)
                # Lower is better (more affordable for investors)
                metrics_data["price_to_rent_ratio"] = 15 - abs(price_to_rent - 15)
        
        # Affordability index
        if "affordability_index" in request.metrics:
            # Using a simplified approach
            # In a real implementation, this would use income data
            median_income = 65000  # Placeholder for median income
            if current.median_price > 0:
                affordability = (median_income / current.median_price) * 100
                metrics_data["affordability_index"] = affordability
        
        # Calculate overall score (simple average of normalized scores)
        if metrics_data:
            area_data["metrics"] = metrics_data
            
            # Simplified scoring - just add the area if we have data
            scored_areas.append({
                "area_type": area_data["area_type"],
                "area_value": area_data["area_value"],
                "name": area_data["area_value"],  # Simplified - would use actual name in real implementation
                "metrics": metrics_data,
                "current_median_price": current.median_price,
                "year_over_year_change": (current.median_price / year_ago.median_price - 1) * 100 if current.median_price and year_ago.median_price and year_ago.median_price > 0 else 0,
                "latitude": None,  # Would use geocoding in real implementation
                "longitude": None  # Would use geocoding in real implementation
            })
    
    # Calculate combined score for each area
    for area in scored_areas:
        total_score = 0
        metrics_count = 0
        
        for metric in request.metrics:
            if metric in area["metrics"]:
                total_score += area["metrics"][metric]
                metrics_count += 1
        
        if metrics_count > 0:
            area["score"] = total_score / metrics_count
        else:
            area["score"] = 0
    
    # Sort by score and limit results
    scored_areas.sort(key=lambda x: x["score"], reverse=True)
    top_hotspots = scored_areas[:request.limit]
    
    # Convert to Hotspot objects
    hotspots = [
        Hotspot(
            area_type=area["area_type"],
            area_value=area["area_value"],
            name=area["name"],
            score=area["score"],
            metrics={k: round(v, 2) for k, v in area["metrics"].items()},
            current_median_price=area["current_median_price"],
            year_over_year_change=area["year_over_year_change"],
            latitude=area["latitude"],
            longitude=area["longitude"]
        )
        for area in top_hotspots
    ]
    
    return HotspotSearchResponse(
        hotspots=hotspots,
        search_date=datetime.now().isoformat(),
        state=request.state,
        metrics_used=request.metrics
    )

# Investment Analysis Endpoint
@app.post("/analyze-investment", response_model=InvestmentAnalysisResponse, tags=["Investment Analytics"])
async def analyze_investment(
    request: InvestmentAnalysisRequest,
    db: Session = Depends(get_db)
) -> InvestmentAnalysisResponse:
    """
    Analyze a real estate investment with detailed financial metrics
    """
    # Get property data if property_id is provided
    property_data = None
    if request.property_id:
        property_data = db.query(PropertyListing).filter(PropertyListing.id == request.property_id).first()
        if not property_data:
            raise HTTPException(status_code=404, detail=f"Property with ID {request.property_id} not found")
    
    # Determine property price
    property_price = None
    
    if property_data:
        property_price = property_data.price
        property_features = PropertyFeatures(
            address=property_data.address,
            city=property_data.city,
            state=property_data.state,
            zip_code=property_data.zip_code,
            property_type=property_data.property_type or "single_family",
            beds=property_data.beds,
            baths=property_data.baths,
            sqft=property_data.sqft,
            lot_size=property_data.lot_size,
            year_built=property_data.year_built,
            latitude=property_data.latitude,
            longitude=property_data.longitude
        )
    elif request.property_price:
        property_price = request.property_price
        property_features = request.property_features
    elif request.property_features:
        # Need to estimate the price
        property_value_request = PropertyValuePredictionRequest(
            property_features=request.property_features,
            model_type="hedonic",
            include_comparables=False
        )
        
        # Get property value
        value_prediction = await predict_property_value(property_value_request, db)
        property_price = value_prediction.estimated_value
        property_features = request.property_features
    else:
        raise HTTPException(
            status_code=400,
            detail="Must provide either property_id, property_price, or property_features"
        )
    
    # Determine monthly rent
    monthly_rent = request.monthly_rent
    if not monthly_rent:
        # Estimate rent based on property value
        # Simple 0.8% rule as a starting point
        monthly_rent = property_price * 0.008
        
        # Adjust based on property type
        if property_features and property_features.property_type:
            if property_features.property_type == "multi_family":
                monthly_rent *= 1.2
            elif property_features.property_type == "condo":
                monthly_rent *= 0.9
        
        # Adjust based on beds/baths
        if property_features:
            monthly_rent += (property_features.beds - 3) * 100
            monthly_rent += (property_features.baths - 2) * 75
    
    # Determine appreciation rate
    annual_appreciation_rate = request.annual_appreciation_rate
    if annual_appreciation_rate is None:
        # Try to get from market data
        if property_features:
            area_query = db.query(MarketMetrics).filter(
                MarketMetrics.zip_code == property_features.zip_code
            ).order_by(desc(MarketMetrics.period_end)).first()
            
            if area_query:
                # Look for historical data
                year_ago_query = db.query(MarketMetrics).filter(
                    MarketMetrics.zip_code == property_features.zip_code,
                    MarketMetrics.period_end <= datetime.now() - timedelta(days=365)
                ).order_by(desc(MarketMetrics.period_end)).first()
                
                if year_ago_query and year_ago_query.median_price and area_query.median_price:
                    annual_appreciation_rate = (area_query.median_price / year_ago_query.median_price - 1) * 100
        
        # Default if still None
        if annual_appreciation_rate is None:
            annual_appreciation_rate = 3.0  # National average
    
    # Calculate mortgage details
    down_payment = property_price * (request.down_payment_percent / 100)
    loan_amount = property_price - down_payment
    monthly_interest_rate = request.interest_rate / 100 / 12
    loan_term_months = request.loan_term_years * 12
    
    # Monthly mortgage payment (principal and interest)
    if monthly_interest_rate > 0:
        monthly_mortgage = loan_amount * (monthly_interest_rate * (1 + monthly_interest_rate)**loan_term_months) / ((1 + monthly_interest_rate)**loan_term_months - 1)
    else:
        monthly_mortgage = loan_amount / loan_term_months
    
    # Monthly expenses
    monthly_property_tax = property_price * (request.annual_property_tax_rate / 100) / 12
    monthly_insurance = request.annual_insurance_cost / 12
    monthly_hoa = request.monthly_hoa_fee
    monthly_maintenance = property_price * (request.annual_maintenance_percent / 100) / 12
    monthly_vacancy = monthly_rent * (request.annual_vacancy_percent / 100)
    monthly_management = monthly_rent * (request.annual_management_fee_percent / 100)
    
    total_monthly_expenses = (
        monthly_mortgage +
        monthly_property_tax +
        monthly_insurance +
        monthly_hoa +
        monthly_maintenance +
        monthly_vacancy +
        monthly_management
    )
    
    # Monthly cash flow
    monthly_cash_flow = monthly_rent - total_monthly_expenses
    annual_cash_flow = monthly_cash_flow * 12
    
    # Calculate cap rate
    annual_net_operating_income = (monthly_rent * 12) - (
        (monthly_property_tax + monthly_insurance + monthly_hoa + 
         monthly_maintenance + monthly_vacancy + monthly_management) * 12
    )
    cap_rate = (annual_net_operating_income / property_price) * 100
    
    # Calculate cash on cash return
    annual_cash_investment = down_payment
    cash_on_cash_return = (annual_cash_flow / annual_cash_investment) * 100
    
    # Calculate gross rent multiplier
    gross_rent_multiplier = property_price / (monthly_rent * 12)
    
    # Calculate debt service coverage ratio
    debt_service_coverage_ratio = annual_net_operating_income / (monthly_mortgage * 12)
    
    # Calculate break-even ratio
    break_even_ratio = (total_monthly_expenses / monthly_rent) * 100
    
    # Future value calculation
    future_value = property_price * (1 + annual_appreciation_rate / 100) ** request.holding_period_years
    
    # Remaining loan balance after holding period
    if monthly_interest_rate > 0:
        remaining_payments = loan_term_months - (request.holding_period_years * 12)
        if remaining_payments <= 0:
            remaining_loan_balance = 0
        else:
            remaining_loan_balance = loan_amount * (
                ((1 + monthly_interest_rate) ** loan_term_months) - 
                ((1 + monthly_interest_rate) ** (loan_term_months - remaining_payments))
            ) / (
                ((1 + monthly_interest_rate) ** loan_term_months) - 1
            )
    else:
        # Simple calculation for 0% interest (edge case)
        payments_made = request.holding_period_years * 12
        remaining_loan_balance = loan_amount - (loan_amount / loan_term_months) * payments_made
        remaining_loan_balance = max(0, remaining_loan_balance)
    
    # Equity after holding period
    final_equity = future_value - remaining_loan_balance
    equity_gained = final_equity - down_payment
    
    # Cumulative cash flow over holding period
    cumulative_cash_flow = 0
    cumulative_rent = 0
    
    for year in range(1, request.holding_period_years + 1):
        # Rent increases each year
        year_rent = monthly_rent * (1 + request.annual_rent_increase_rate / 100) ** (year - 1)
        cumulative_rent += year_rent * 12
        
        # Expenses other than mortgage also increase (simplified)
        year_expenses = (
            monthly_property_tax +
            monthly_insurance +
            monthly_hoa +
            monthly_maintenance
        ) * (1 + request.annual_rent_increase_rate / 100) ** (year - 1)
        
        # Vacancy and management are percentage of rent
        year_vacancy = year_rent * (request.annual_vacancy_percent / 100)
        year_management = year_rent * (request.annual_management_fee_percent / 100)
        
        year_cash_flow = (year_rent - (year_expenses + year_vacancy + year_management) - monthly_mortgage) * 12
        cumulative_cash_flow += year_cash_flow
    
    # Total return calculation
    total_return = equity_gained + cumulative_cash_flow
    total_return_on_investment = (total_return / down_payment) * 100
    
    # Internal rate of return (IRR) - simplified
    # In a real implementation, use a proper IRR calculation
    irr = ((future_value + cumulative_cash_flow) / down_payment) ** (1 / request.holding_period_years) - 1
    irr *= 100  # Convert to percentage
    
    # Compile monthly expenses for response
    monthly_expenses = {
        "mortgage": round(monthly_mortgage, 2),
        "property_tax": round(monthly_property_tax, 2),
        "insurance": round(monthly_insurance, 2),
        "hoa": round(monthly_hoa, 2),
        "maintenance": round(monthly_maintenance, 2),
        "vacancy": round(monthly_vacancy, 2),
        "management": round(monthly_management, 2),
        "total": round(total_monthly_expenses, 2)
    }
    
    # Compile annual profit & loss
    annual_profit_loss = {
        "rental_income": round(monthly_rent * 12, 2),
        "total_expenses": round(total_monthly_expenses * 12, 2),
        "net_operating_income": round(annual_net_operating_income, 2),
        "cash_flow": round(annual_cash_flow, 2)
    }
    
    # Compile property details
    property_details = {
        "price": property_price,
        "monthly_rent": monthly_rent,
        "down_payment": down_payment,
        "loan_amount": loan_amount,
        "interest_rate": request.interest_rate,
        "loan_term_years": request.loan_term_years,
        "annual_appreciation_rate": annual_appreciation_rate
    }
    
    if property_features:
        property_details.update({
            "address": property_features.address,
            "city": property_features.city,
            "state": property_features.state,
            "zip_code": property_features.zip_code,
            "property_type": property_features.property_type,
            "beds": property_features.beds,
            "baths": property_features.baths,
            "sqft": property_features.sqft
        })
    
    # Simplified amortization schedule (just key points)
    amortization_schedule = {
        "start": {
            "principal_balance": loan_amount,
            "equity": down_payment
        },
        "year_1": {
            "principal_balance": loan_amount - (monthly_mortgage - (loan_amount * monthly_interest_rate)) * 12,
            "equity": down_payment + (monthly_mortgage - (loan_amount * monthly_interest_rate)) * 12
        },
        "final_year": {
            "principal_balance": remaining_loan_balance,
            "equity": final_equity,
            "property_value": future_value
        }
    }
    
    return InvestmentAnalysisResponse(
        property_details=property_details,
        monthly_cash_flow=round(monthly_cash_flow, 2),
        annual_cash_flow=round(annual_cash_flow, 2),
        cap_rate=round(cap_rate, 2),
        cash_on_cash_return=round(cash_on_cash_return, 2),
        total_return_on_investment=round(total_return_on_investment, 2),
        internal_rate_of_return=round(irr, 2),
        gross_rent_multiplier=round(gross_rent_multiplier, 2),
        debt_service_coverage_ratio=round(debt_service_coverage_ratio, 2),
        break_even_ratio=round(break_even_ratio, 2),
        estimated_future_value=round(future_value, 2),
        monthly_expenses=monthly_expenses,
        annual_profit_loss=annual_profit_loss,
        cumulative_equity=round(equity_gained, 2),
        cumulative_cash_flow=round(cumulative_cash_flow, 2),
        amortization_schedule=amortization_schedule
    )

if __name__ == "__main__":
    import uvicorn
    import time  # for simulating training delays
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8004))
    
    # Run application
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )