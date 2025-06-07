import pandas as pd
import numpy as np
from prophet import Prophet
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectFromModel, f_regression
from sklearn.linear_model import Lasso
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
        self.features = None

    def train(self, historical_data: pd.DataFrame):
        # Feature engineering
        self._engineer_features(historical_data)

        # Split data for training
        X = self.features
        y = historical_data['price']
        X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

        # Train models
        self._train_xgboost(X_train, y_train, X_val, y_val)
        self._train_random_forest(X_train, y_train)
        self._train_prophet(historical_data)

    def _engineer_features(self, data: pd.DataFrame):
        # Advanced feature engineering
        self.features = pd.DataFrame()
        self.features['sqft_price_ratio'] = data['price'] / data['sqft']
        self.features['age'] = (pd.Timestamp.now().year - data['year_built'])
        self.features['renovation_age'] = (pd.Timestamp.now().year - data['last_renovation'])
        self.features['location_score'] = self._calculate_location_score(data)

        # Scale features
        self.features = self.scaler.fit_transform(self.features)


    def _train_xgboost(self, X_train, y_train, X_val, y_val):
        # XGBoost training with early stopping
        self.xgb_model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            early_stopping_rounds=10,
            verbose=False
        )

    def _train_random_forest(self, X_train, y_train):
        self.rf_model.fit(X_train, y_train)

    def _train_prophet(self, historical_data):
        price_df = pd.DataFrame({
            'ds': historical_data['date'],
            'y': historical_data['price']
        })
        self.price_model.fit(price_df)

    def _calculate_location_score(self, data: pd.DataFrame) -> pd.Series:
        # Calculate location score based on amenities and market factors
        base_score = data['walkability_score'] * 0.4
        base_score += data['school_rating'] * 0.3
        base_score += data['crime_safety_score'] * 0.3
        return base_score

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
        # Assuming scaler is already fitted during training
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

        # Get feature importance (needs modification as feature names are now different)
        feature_importance = self._get_feature_importance(input_data.columns) #Approximation -  needs better feature importance handling

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
        #This is a placeholder, needs improvement to correctly handle feature importance with scaled data.
        xgb_importance = self.xgb_model.feature_importances_
        rf_importance = self.rf_model.feature_importances_

        # Average importance scores (this is a simplification, needs improvement)
        avg_importance = (xgb_importance + rf_importance) / 2

        #Handle potential mismatch in feature names.  This part is highly speculative and needs refinement based on actual feature names
        feature_names = ['sqft_price_ratio', 'age', 'renovation_age', 'location_score']
        return dict(zip(feature_names, avg_importance))