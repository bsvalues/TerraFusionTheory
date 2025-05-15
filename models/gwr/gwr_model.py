"""
Geographically Weighted Regression (GWR) module for spatial modeling.

This module provides a robust implementation of GWR that estimates
spatially varying coefficients for property valuation models.
"""

import numpy as np
import pandas as pd
import geopandas as gpd
from typing import List, Dict, Tuple, Any, Optional, Union
from sklearn.metrics import mean_squared_error, r2_score
import statsmodels.api as sm
from statsmodels.regression.linear_model import OLS
import matplotlib.pyplot as plt
import json
import os

try:
    import mgwr
    from mgwr.gwr import GWR
    from mgwr.sel_bw import Sel_BW
    MGWR_AVAILABLE = True
except ImportError:
    MGWR_AVAILABLE = False
    print("Warning: mgwr package not available. Using statsmodels implementation.")


class GWRModel:
    """
    Geographically Weighted Regression model for spatial heterogeneity.
    
    This class implements GWR to capture spatial variation in the relationship
    between features and property values across different locations.
    """
    
    def __init__(self, 
                bandwidth: str = 'AIC', 
                kernel_type: str = 'gaussian',
                fixed: bool = False,
                data_dir: str = './data'):
        """
        Initialize a GWR model.
        
        Args:
            bandwidth: Bandwidth selection method ('AIC', 'CV', 'fixed')
            kernel_type: Kernel function ('gaussian', 'bisquare', 'exponential')
            fixed: Whether to use fixed or adaptive bandwidth
            data_dir: Directory for data storage
        """
        self.bandwidth = bandwidth
        self.kernel_type = kernel_type
        self.fixed = fixed
        self.data_dir = data_dir
        self.model = None
        self.results = None
        self.coordinates = None
        self.feature_names = None
        self.summary_stats = {}
        self.local_r2 = None
        self.coefficients = None
        self.prediction_intervals = None
        self._ensure_data_dir()
    
    def _ensure_data_dir(self):
        """Ensure the data directory exists."""
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir, exist_ok=True)
    
    def fit(self, 
           data: gpd.GeoDataFrame, 
           dependent_var: str, 
           independent_vars: List[str]) -> Dict[str, Any]:
        """
        Fit the GWR model to the data.
        
        Args:
            data: GeoDataFrame containing property data
            dependent_var: Name of the target variable (e.g., 'price')
            independent_vars: List of feature names
            
        Returns:
            Dictionary of model results and diagnostics
        """
        # Extract coordinates from geometry
        if 'geometry' in data.columns:
            coords = np.vstack((data.geometry.x, data.geometry.y)).T
        else:
            raise ValueError("GeoDataFrame must have a 'geometry' column")
        
        self.coordinates = coords
        self.feature_names = independent_vars
        
        # Prepare dependent and independent variables
        y = data[dependent_var].values
        X = data[independent_vars].values
        
        # Add constant term
        X = sm.add_constant(X)
        
        # Check if MGWR package is available
        if MGWR_AVAILABLE:
            # Determine optimal bandwidth using specified criterion
            bw_selector = Sel_BW(coords, y, X)
            
            if self.bandwidth == 'AIC':
                bw = bw_selector.search(criterion='AIC')
            elif self.bandwidth == 'CV':
                bw = bw_selector.search(criterion='CV')
            else:
                bw = float(self.bandwidth)
            
            # Initialize and fit GWR model
            model = GWR(coords, y, X, bw=bw, kernel=self.kernel_type, fixed=self.fixed)
            results = model.fit()
            
            # Store model and results
            self.model = model
            self.results = results
            
            # Calculate and store diagnostics
            self.summary_stats = {
                'bandwidth': bw,
                'AICc': results.aicc,
                'R2': results.r2,
                'Adj R2': results.adj_r2,
                'residual_sum_of_squares': results.rss
            }
            
            # Extract local coefficients and R-squared
            self.coefficients = results.params
            self.local_r2 = results.localR2
            
            # Compute prediction intervals (basic implementation)
            residuals = results.resid
            std_resid = np.std(residuals)
            self.prediction_intervals = {
                'std_resid': std_resid,
                'lower_80': results.predy - 1.28 * std_resid,
                'upper_80': results.predy + 1.28 * std_resid,
                'lower_95': results.predy - 1.96 * std_resid,
                'upper_95': results.predy + 1.96 * std_resid
            }
            
            return self.summary_stats
        
        else:
            # Fallback to statsmodels with spatial weights
            # This is a simplified approximation, not true GWR
            print("Using statsmodels approximation for GWR")
            
            # Create local models for different regions
            n_clusters = min(20, len(data) // 10) if len(data) > 20 else 2
            
            from sklearn.cluster import KMeans
            kmeans = KMeans(n_clusters=n_clusters, random_state=42)
            clusters = kmeans.fit_predict(coords)
            
            # Initialize arrays for coefficients and local R2
            self.coefficients = np.zeros((len(data), X.shape[1]))
            self.local_r2 = np.zeros(len(data))
            
            # Fit OLS model to each cluster
            global_predictions = np.zeros(len(data))
            
            for cluster_id in range(n_clusters):
                cluster_mask = clusters == cluster_id
                
                if sum(cluster_mask) < len(independent_vars) + 5:
                    # Not enough data points, use global model
                    continue
                
                # Fit OLS model to this cluster
                X_cluster = X[cluster_mask]
                y_cluster = y[cluster_mask]
                
                try:
                    model = sm.OLS(y_cluster, X_cluster)
                    results = model.fit()
                    
                    # Assign coefficients to all points in this cluster
                    self.coefficients[cluster_mask] = results.params
                    
                    # Calculate local R2
                    y_pred = results.predict(X_cluster)
                    local_r2 = r2_score(y_cluster, y_pred)
                    self.local_r2[cluster_mask] = local_r2
                    
                    # Store predictions
                    global_predictions[cluster_mask] = y_pred
                    
                except Exception as e:
                    print(f"Error fitting cluster {cluster_id}: {e}")
                    # Fallback to global model for this cluster
            
            # Fit global model for overall diagnostics
            global_model = sm.OLS(y, X)
            global_results = global_model.fit()
            
            # Store diagnostics from global model
            self.summary_stats = {
                'bandwidth': 'N/A (statsmodels approximation)',
                'AICc': global_results.aic,
                'R2': global_results.rsquared,
                'Adj R2': global_results.rsquared_adj,
                'residual_sum_of_squares': sum(global_results.resid**2)
            }
            
            # Compute prediction intervals
            residuals = y - global_predictions
            std_resid = np.std(residuals)
            self.prediction_intervals = {
                'std_resid': std_resid,
                'lower_80': global_predictions - 1.28 * std_resid,
                'upper_80': global_predictions + 1.28 * std_resid,
                'lower_95': global_predictions - 1.96 * std_resid,
                'upper_95': global_predictions + 1.96 * std_resid
            }
            
            return self.summary_stats
    
    def predict(self, 
               data: gpd.GeoDataFrame, 
               independent_vars: Optional[List[str]] = None) -> Dict[str, np.ndarray]:
        """
        Make predictions using the fitted GWR model.
        
        Args:
            data: GeoDataFrame containing new property data
            independent_vars: List of feature names (use same as fit if None)
            
        Returns:
            Dictionary with predictions and uncertainty intervals
        """
        if self.model is None and not self.coefficients.any():
            raise ValueError("Model has not been fitted yet. Call fit() first.")
        
        if independent_vars is None:
            independent_vars = self.feature_names
            
        # Extract coordinates from geometry
        if 'geometry' in data.columns:
            coords = np.vstack((data.geometry.x, data.geometry.y)).T
        else:
            raise ValueError("GeoDataFrame must have a 'geometry' column")
        
        # Prepare independent variables
        X = data[independent_vars].values
        
        # Add constant term
        X = sm.add_constant(X)
        
        # Check if using MGWR or statsmodels approximation
        if MGWR_AVAILABLE and self.results is not None:
            # Use MGWR for predictions
            predictions = self.model.predict(coords, X, self.results.params)
            
            std_resid = self.prediction_intervals['std_resid']
            
            # Create prediction intervals
            return {
                'predictions': predictions,
                'lower_80': predictions - 1.28 * std_resid,
                'upper_80': predictions + 1.28 * std_resid,
                'lower_95': predictions - 1.96 * std_resid,
                'upper_95': predictions + 1.96 * std_resid
            }
        else:
            # Use nearest neighbor approach with statsmodels approximation
            from scipy.spatial import cKDTree
            
            # Build KD-tree of training coordinates
            tree = cKDTree(self.coordinates)
            
            # Find nearest neighbor for each new point
            _, indices = tree.query(coords, k=1)
            
            # Use coefficients from nearest neighbor
            predictions = np.sum(X * self.coefficients[indices], axis=1)
            
            std_resid = self.prediction_intervals['std_resid']
            
            # Create prediction intervals
            return {
                'predictions': predictions,
                'lower_80': predictions - 1.28 * std_resid,
                'upper_80': predictions + 1.28 * std_resid,
                'lower_95': predictions - 1.96 * std_resid,
                'upper_95': predictions + 1.96 * std_resid
            }
    
    def plot_coefficient_maps(self, 
                             data: gpd.GeoDataFrame, 
                             output_dir: Optional[str] = None) -> Dict[str, str]:
        """
        Plot spatial distribution of coefficients.
        
        Args:
            data: GeoDataFrame containing property data
            output_dir: Directory to save plots (if None, uses self.data_dir)
            
        Returns:
            Dictionary mapping coefficient names to file paths
        """
        if self.coefficients is None:
            raise ValueError("Model has not been fitted yet. Call fit() first.")
        
        if output_dir is None:
            output_dir = os.path.join(self.data_dir, 'coefficient_maps')
            
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # Create a copy of the data with coefficient values
        result_data = data.copy()
        
        # Add coefficients as columns
        coef_names = ['Intercept'] + self.feature_names
        for i, name in enumerate(coef_names):
            result_data[f'coef_{name}'] = self.coefficients[:, i]
        
        # Add local R2
        result_data['local_r2'] = self.local_r2
        
        # Plot each coefficient
        file_paths = {}
        
        for i, name in enumerate(coef_names):
            col_name = f'coef_{name}'
            fig, ax = plt.subplots(figsize=(10, 8))
            
            # Plot coefficient values
            result_data.plot(column=col_name, 
                             ax=ax, 
                             legend=True, 
                             cmap='viridis',
                             scheme='quantiles',
                             k=5,
                             legend_kwds={'title': f'Coefficient: {name}'})
            
            ax.set_title(f'Spatial Distribution of {name} Coefficient')
            
            # Save figure
            file_path = os.path.join(output_dir, f'coefficient_{name}.png')
            plt.savefig(file_path)
            plt.close()
            
            file_paths[name] = file_path
        
        # Plot local R2
        fig, ax = plt.subplots(figsize=(10, 8))
        result_data.plot(column='local_r2', 
                         ax=ax, 
                         legend=True, 
                         cmap='RdYlGn',
                         scheme='quantiles',
                         k=5,
                         legend_kwds={'title': 'Local R²'})
        
        ax.set_title('Spatial Distribution of Local R²')
        
        # Save figure
        file_path = os.path.join(output_dir, 'local_r2.png')
        plt.savefig(file_path)
        plt.close()
        
        file_paths['local_r2'] = file_path
        
        return file_paths
    
    def save_model(self, filename: Optional[str] = None) -> str:
        """
        Save the model to a file.
        
        Args:
            filename: Path to save the model (if None, auto-generated)
            
        Returns:
            Path to saved model file
        """
        if filename is None:
            filename = os.path.join(self.data_dir, f'gwr_model_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}.json')
        
        # Create a dictionary of model parameters
        model_data = {
            'bandwidth': self.bandwidth,
            'kernel_type': self.kernel_type,
            'fixed': self.fixed,
            'summary_stats': self.summary_stats,
            'feature_names': self.feature_names,
            'coordinates': self.coordinates.tolist() if self.coordinates is not None else None,
            'coefficients': self.coefficients.tolist() if self.coefficients is not None else None,
            'local_r2': self.local_r2.tolist() if self.local_r2 is not None else None,
            'prediction_intervals': {
                k: v.tolist() if isinstance(v, np.ndarray) else v
                for k, v in self.prediction_intervals.items()
            } if self.prediction_intervals is not None else None
        }
        
        # Save to file
        with open(filename, 'w') as f:
            json.dump(model_data, f, indent=2)
        
        return filename
    
    @classmethod
    def load_model(cls, filename: str) -> 'GWRModel':
        """
        Load a model from a file.
        
        Args:
            filename: Path to model file
            
        Returns:
            Loaded GWRModel instance
        """
        # Load from file
        with open(filename, 'r') as f:
            model_data = json.load(f)
        
        # Create a new model instance
        model = cls(
            bandwidth=model_data['bandwidth'],
            kernel_type=model_data['kernel_type'],
            fixed=model_data['fixed']
        )
        
        # Restore model parameters
        model.summary_stats = model_data['summary_stats']
        model.feature_names = model_data['feature_names']
        model.coordinates = np.array(model_data['coordinates']) if model_data['coordinates'] is not None else None
        model.coefficients = np.array(model_data['coefficients']) if model_data['coefficients'] is not None else None
        model.local_r2 = np.array(model_data['local_r2']) if model_data['local_r2'] is not None else None
        
        if model_data['prediction_intervals'] is not None:
            model.prediction_intervals = {
                k: np.array(v) if isinstance(v, list) else v
                for k, v in model_data['prediction_intervals'].items()
            }
        
        return model