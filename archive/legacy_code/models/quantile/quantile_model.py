"""
Quantile Gradient Boosting model for uncertainty estimation in valuations.

This module provides implementation of quantile regression using gradient
boosting for property valuation uncertainty estimation and prediction intervals.
"""

import numpy as np
import pandas as pd
import geopandas as gpd
from typing import List, Dict, Tuple, Any, Optional, Union
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import matplotlib.pyplot as plt
import os
import json

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    print("Warning: xgboost not available. Using sklearn's GradientBoostingRegressor.")


class QuantileGradientBoostingModel:
    """
    Quantile Gradient Boosting model for uncertainty estimation.
    
    This class implements quantile regression using gradient boosting
    to estimate prediction intervals and uncertainty in property valuations.
    """
    
    def __init__(self, 
                quantiles: List[float] = [0.1, 0.5, 0.9],
                n_estimators: int = 100,
                max_depth: int = 5,
                learning_rate: float = 0.1,
                subsample: float = 0.8,
                random_state: int = 42,
                data_dir: str = './data'):
        """
        Initialize a quantile gradient boosting model.
        
        Args:
            quantiles: List of quantiles to estimate
            n_estimators: Number of boosting stages
            max_depth: Maximum tree depth
            learning_rate: Boosting learning rate
            subsample: Subsample ratio of training instances
            random_state: Random seed
            data_dir: Directory for data storage
        """
        self.quantiles = quantiles
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.subsample = subsample
        self.random_state = random_state
        self.data_dir = data_dir
        self.models = {}
        self.feature_names = None
        self.importance = {}
        self.performance = {}
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Ensure the data directory exists."""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir, exist_ok=True)
    
    def fit(self, 
           data: Union[pd.DataFrame, gpd.GeoDataFrame], 
           dependent_var: str, 
           independent_vars: List[str],
           test_size: float = 0.2) -> Dict[str, Any]:
        """
        Fit the quantile regression models to the data.
        
        Args:
            data: DataFrame or GeoDataFrame containing property data
            dependent_var: Name of the target variable (e.g., 'price')
            independent_vars: List of feature names
            test_size: Proportion of data to use for testing
            
        Returns:
            Dictionary of model performance metrics
        """
        # Store feature names
        self.feature_names = independent_vars
        
        # Prepare data
        X = data[independent_vars].values
        y = data[dependent_var].values
        
        # Split data for validation
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state
        )
        
        # Train a model for each quantile
        for quantile in self.quantiles:
            if XGB_AVAILABLE:
                model = xgb.XGBRegressor(
                    objective='reg:quantile',
                    quantile_alpha=quantile,
                    n_estimators=self.n_estimators,
                    max_depth=self.max_depth,
                    learning_rate=self.learning_rate,
                    subsample=self.subsample,
                    random_state=self.random_state
                )
            else:
                # Using scikit-learn's GBR with a custom quantile loss
                # Define quantile loss
                def quantile_loss(y_true, y_pred, alpha):
                    return np.mean(
                        np.where(
                            y_true >= y_pred,
                            alpha * (y_true - y_pred),
                            (1 - alpha) * (y_pred - y_true)
                        )
                    )
                
                model = GradientBoostingRegressor(
                    loss='quantile',
                    alpha=quantile,
                    n_estimators=self.n_estimators,
                    max_depth=self.max_depth,
                    learning_rate=self.learning_rate,
                    subsample=self.subsample,
                    random_state=self.random_state
                )
            
            # Fit the model
            model.fit(X_train, y_train)
            
            # Store the model
            self.models[quantile] = model
            
            # Store feature importance
            if hasattr(model, 'feature_importances_'):
                self.importance[quantile] = {
                    'feature': independent_vars,
                    'importance': model.feature_importances_
                }
        
        # Evaluate models
        median_idx = self.quantiles.index(0.5) if 0.5 in self.quantiles else 0
        median_model = self.models[self.quantiles[median_idx]]
        
        # Make predictions on test set
        y_pred_median = median_model.predict(X_test)
        
        # Calculate performance metrics
        self.performance = {
            'RMSE': np.sqrt(mean_squared_error(y_test, y_pred_median)),
            'MAE': mean_absolute_error(y_test, y_pred_median),
            'R2': r2_score(y_test, y_pred_median)
        }
        
        # Calculate prediction intervals
        y_pred_lower = self.models[min(self.quantiles)].predict(X_test)
        y_pred_upper = self.models[max(self.quantiles)].predict(X_test)
        
        # Calculate coverage probability
        coverage = np.mean((y_test >= y_pred_lower) & (y_test <= y_pred_upper))
        self.performance['coverage_probability'] = coverage
        
        # Calculate average interval width
        interval_width = np.mean(y_pred_upper - y_pred_lower)
        self.performance['avg_interval_width'] = interval_width
        
        # Calculate normalized interval width
        normalized_width = interval_width / np.mean(y_test)
        self.performance['normalized_interval_width'] = normalized_width
        
        return self.performance
    
    def predict(self, 
               data: Union[pd.DataFrame, gpd.GeoDataFrame], 
               independent_vars: Optional[List[str]] = None) -> Dict[str, np.ndarray]:
        """
        Make predictions using the fitted quantile models.
        
        Args:
            data: DataFrame or GeoDataFrame containing property data
            independent_vars: List of feature names (use same as fit if None)
            
        Returns:
            Dictionary with predictions for each quantile
        """
        if not self.models:
            raise ValueError("Models have not been fitted yet. Call fit() first.")
        
        if independent_vars is None:
            independent_vars = self.feature_names
            
        # Prepare independent variables
        X = data[independent_vars].values
        
        # Make predictions for each quantile
        predictions = {}
        
        for quantile, model in self.models.items():
            predictions[f'quantile_{quantile}'] = model.predict(X)
        
        # Add prediction intervals
        lower_quantile = min(self.quantiles)
        upper_quantile = max(self.quantiles)
        median_quantile = 0.5 if 0.5 in self.quantiles else self.quantiles[len(self.quantiles) // 2]
        
        predictions['lower_bound'] = predictions[f'quantile_{lower_quantile}']
        predictions['upper_bound'] = predictions[f'quantile_{upper_quantile}']
        predictions['median'] = predictions[f'quantile_{median_quantile}']
        
        # Calculate interval width
        predictions['interval_width'] = predictions['upper_bound'] - predictions['lower_bound']
        
        # Calculate normalized interval width (as percentage of median)
        predictions['uncertainty_pct'] = (predictions['interval_width'] / predictions['median']) * 100
        
        return predictions
    
    def plot_uncertainty(self, 
                        data: Union[pd.DataFrame, gpd.GeoDataFrame],
                        dependent_var: str, 
                        independent_vars: Optional[List[str]] = None,
                        output_dir: Optional[str] = None) -> Dict[str, str]:
        """
        Plot prediction intervals against observed values.
        
        Args:
            data: DataFrame or GeoDataFrame containing property data
            dependent_var: Name of the target variable (e.g., 'price')
            independent_vars: List of feature names (use same as fit if None)
            output_dir: Directory to save plots (if None, uses self.data_dir)
            
        Returns:
            Dictionary mapping plot names to file paths
        """
        if not self.models:
            raise ValueError("Models have not been fitted yet. Call fit() first.")
        
        if independent_vars is None:
            independent_vars = self.feature_names
            
        if output_dir is None:
            output_dir = os.path.join(self.data_dir, 'uncertainty_plots')
            
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # Make predictions
        predictions = self.predict(data, independent_vars)
        
        # Extract actual values
        y_true = data[dependent_var].values
        
        # Plot observed vs predicted with intervals
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # Plot prediction intervals
        ax.fill_between(
            range(len(y_true)),
            predictions['lower_bound'],
            predictions['upper_bound'],
            alpha=0.3,
            color='gray',
            label=f'{min(self.quantiles)}-{max(self.quantiles)} Prediction Interval'
        )
        
        # Plot median prediction
        ax.scatter(
            range(len(y_true)), 
            predictions['median'], 
            color='blue',
            alpha=0.5,
            label='Median Prediction'
        )
        
        # Plot actual values
        ax.scatter(
            range(len(y_true)), 
            y_true, 
            color='red',
            alpha=0.5,
            label='Actual Value'
        )
        
        ax.set_title('Quantile Regression Predictions with Uncertainty')
        ax.set_xlabel('Observation Index')
        ax.set_ylabel(dependent_var)
        ax.legend()
        
        # Save figure
        file_path = os.path.join(output_dir, 'prediction_intervals.png')
        plt.savefig(file_path)
        plt.close()
        
        # Plot feature importance for median model
        median_importance = self.importance.get(0.5) or next(iter(self.importance.values()))
        
        if median_importance:
            fig, ax = plt.subplots(figsize=(12, 8))
            
            # Sort features by importance
            sorted_idx = np.argsort(median_importance['importance'])
            features = np.array(median_importance['feature'])[sorted_idx]
            importances = np.array(median_importance['importance'])[sorted_idx]
            
            # Plot horizontal bar chart
            ax.barh(range(len(features)), importances, align='center')
            ax.set_yticks(range(len(features)))
            ax.set_yticklabels(features)
            ax.set_title('Feature Importance (Median Model)')
            ax.set_xlabel('Importance')
            
            # Save figure
            file_path_importance = os.path.join(output_dir, 'feature_importance.png')
            plt.savefig(file_path_importance)
            plt.close()
        else:
            file_path_importance = None
        
        # Plot uncertainty vs value
        fig, ax = plt.subplots(figsize=(10, 8))
        
        ax.scatter(
            y_true,
            predictions['uncertainty_pct'],
            alpha=0.5
        )
        
        ax.set_title('Uncertainty vs Property Value')
        ax.set_xlabel(dependent_var)
        ax.set_ylabel('Uncertainty (% of Median Prediction)')
        
        # Save figure
        file_path_uncertainty = os.path.join(output_dir, 'uncertainty_vs_value.png')
        plt.savefig(file_path_uncertainty)
        plt.close()
        
        return {
            'prediction_intervals': file_path,
            'feature_importance': file_path_importance,
            'uncertainty_vs_value': file_path_uncertainty
        }
    
    def save_model(self, filename: Optional[str] = None) -> str:
        """
        Save the model to a file.
        
        Args:
            filename: Path to save the model (if None, auto-generated)
            
        Returns:
            Path to saved model file
        """
        if filename is None:
            filename = os.path.join(self.data_dir, f'quantile_model_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}.json')
        
        # Create a dictionary of model parameters
        model_data = {
            'quantiles': self.quantiles,
            'n_estimators': self.n_estimators,
            'max_depth': self.max_depth,
            'learning_rate': self.learning_rate,
            'subsample': self.subsample,
            'random_state': self.random_state,
            'feature_names': self.feature_names,
            'performance': self.performance,
            'importance': {
                str(k): {
                    'feature': v['feature'],
                    'importance': v['importance'].tolist() if isinstance(v['importance'], np.ndarray) else v['importance']
                }
                for k, v in self.importance.items()
            }
        }
        
        # Save model metadata to file
        with open(filename, 'w') as f:
            json.dump(model_data, f, indent=2)
        
        # Save individual model files
        model_dir = os.path.splitext(filename)[0] + '_models'
        os.makedirs(model_dir, exist_ok=True)
        
        for quantile, model in self.models.items():
            model_file = os.path.join(model_dir, f'quantile_{quantile}.pkl')
            
            if XGB_AVAILABLE and isinstance(model, xgb.XGBRegressor):
                model.save_model(model_file)
            else:
                import joblib
                joblib.dump(model, model_file)
        
        return filename
    
    @classmethod
    def load_model(cls, filename: str) -> 'QuantileGradientBoostingModel':
        """
        Load a model from a file.
        
        Args:
            filename: Path to model file
            
        Returns:
            Loaded QuantileGradientBoostingModel instance
        """
        # Load model metadata
        with open(filename, 'r') as f:
            model_data = json.load(f)
        
        # Create a new model instance
        model = cls(
            quantiles=model_data['quantiles'],
            n_estimators=model_data['n_estimators'],
            max_depth=model_data['max_depth'],
            learning_rate=model_data['learning_rate'],
            subsample=model_data['subsample'],
            random_state=model_data['random_state']
        )
        
        # Restore model parameters
        model.feature_names = model_data['feature_names']
        model.performance = model_data['performance']
        model.importance = {
            float(k): {
                'feature': v['feature'],
                'importance': np.array(v['importance']) if isinstance(v['importance'], list) else v['importance']
            }
            for k, v in model_data['importance'].items()
        }
        
        # Load individual model files
        model_dir = os.path.splitext(filename)[0] + '_models'
        
        for quantile in model_data['quantiles']:
            model_file = os.path.join(model_dir, f'quantile_{quantile}.pkl')
            
            if XGB_AVAILABLE:
                try:
                    # Try to load as XGBoost model
                    model.models[quantile] = xgb.XGBRegressor()
                    model.models[quantile].load_model(model_file)
                    continue
                except Exception as e:
                    print(f"Could not load as XGBoost model, trying joblib: {e}")
            
            # Fallback to joblib
            import joblib
            model.models[quantile] = joblib.load(model_file)
        
        return model