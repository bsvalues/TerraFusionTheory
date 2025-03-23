
import pandas as pd
import numpy as np
from prophet import Prophet
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Any

class MarketPredictor:
    def __init__(self):
        # Time series model
        self.price_model = Prophet(
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10.0,
            yearly_seasonality=True,
            weekly_seasonality=True
        )
        
        # Gradient boosting model with optimized parameters
        self.xgb_model = XGBRegressor(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=1,
            gamma=0.1,
            reg_alpha=0.1,
            reg_lambda=1,
            random_state=42
        )
        
        # Random forest with enhanced parameters
        self.rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            max_features='sqrt',
            bootstrap=True,
            random_state=42
        )
        
        # Feature preprocessing
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=0.95)
        self.feature_selector = SelectFromModel(Lasso(alpha=0.01))
        
    def train(self, historical_data: pd.DataFrame):
        # Time series training
        price_df = pd.DataFrame({
            'ds': historical_data['date'],
            'y': historical_data['price']
        })
        self.price_model.fit(price_df)
        
        # Feature engineering for ML models
        features = self._engineer_features(historical_data)
        target = historical_data['price']
        
        # Scale features
        scaled_features = self.scaler.fit_transform(features)
        
        # Train ML models
        self.xgb_model.fit(scaled_features, target)
        self.rf_model.fit(scaled_features, target)
        
    def _engineer_features(self, data: pd.DataFrame) -> pd.DataFrame:
        features = pd.DataFrame()
        features['sqft'] = data['sqft']
        features['beds'] = data['beds']
        features['baths'] = data['baths']
        features['lot_size'] = data['lot_size']
        features['year_built'] = data['year_built']
        features['days_on_market'] = data['days_on_market']
        
        # Advanced features
        features['price_per_sqft'] = data['price'] / data['sqft']
        features['beds_per_sqft'] = data['beds'] / data['sqft']
        features['total_rooms'] = data['beds'] + data['baths']
        features['age'] = pd.to_datetime('now').year - data['year_built']
        features['is_new'] = (features['age'] <= 5).astype(int)
        
        # Market dynamics
        features['month'] = pd.to_datetime(data['date']).dt.month
        features['season'] = pd.to_datetime(data['date']).dt.quarter
        features['market_velocity'] = data['price'].pct_change().fillna(0)
        
        # Normalize key metrics
        for col in ['sqft', 'lot_size', 'price_per_sqft']:
            features[f'{col}_norm'] = (features[col] - features[col].mean()) / features[col].std()
            
        return features
        features['days_on_market'] = data['days_on_market']
        
        # Add market context features
        features['price_per_sqft'] = data['price'] / data['sqft']
        features['month'] = pd.to_datetime(data['date']).dt.month
        features['year'] = pd.to_datetime(data['date']).dt.year
        
        return features
        
    def calculate_confidence(self, predictions: np.ndarray, features: pd.DataFrame) -> float:
        # Calculate prediction variance across models
        std_dev = np.std(predictions)
        mean_price = np.mean(predictions)
        cv = std_dev / mean_price
        
        # Base confidence score
        base_confidence = max(0.1, 1 - cv)
        
        # Adjust for data quality
        feature_completeness = 1 - (features.isnull().sum().sum() / features.size)
        
        # Final confidence score
        confidence = base_confidence * feature_completeness * 0.9
        return min(0.95, max(0.1, confidence))
        
    def predict(self, input_data: pd.DataFrame, periods: int = 30) -> Dict[str, Any]:
        # Generate time series forecast
        future = self.price_model.make_future_dataframe(periods=periods)
        forecast = self.price_model.predict(future)
        
        # Prepare features for ML predictions
        features = self._engineer_features(input_data)
        scaled_features = self.scaler.transform(features)
        
        # Get predictions from both ML models
        xgb_pred = self.xgb_model.predict(scaled_features)
        rf_pred = self.rf_model.predict(scaled_features)
        
        # Ensemble predictions
        all_predictions = np.column_stack([
            forecast['yhat'].tail(periods).values,
            xgb_pred[-periods:],
            rf_pred[-periods:]
        ])
        
        # Calculate weighted average predictions
        weights = [0.4, 0.35, 0.25]  # Time series, XGBoost, Random Forest
        final_predictions = np.average(all_predictions, weights=weights, axis=1)
        
        # Calculate confidence
        confidence = self.calculate_confidence(final_predictions, features.tail(periods))
        
        # Get feature importance
        feature_importance = self._get_feature_importance(features.columns)
        
        return {
            'dates': forecast['ds'].tail(periods).tolist(),
            'predictions': final_predictions.tolist(),
            'confidence_score': confidence,
            'feature_importance': feature_importance,
            'model_weights': {
                'time_series': weights[0],
                'xgboost': weights[1],
                'random_forest': weights[2]
            }
        }
    
    def _get_feature_importance(self, feature_names: List[str]) -> Dict[str, float]:
        xgb_importance = self.xgb_model.feature_importances_
        rf_importance = self.rf_model.feature_importances_
        
        # Average importance scores
        avg_importance = (xgb_importance + rf_importance) / 2
        
        return dict(zip(feature_names, avg_importance))
