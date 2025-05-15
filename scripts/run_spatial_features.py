#!/usr/bin/env python3
"""
Spatial Feature Engineering Runner Script

This script loads property data and engineers spatial features using the SpatialFeatureEngineer.
It is designed to be called from the Node.js server to integrate Python-based spatial analytics
with the IntelligentEstate platform.
"""

import os
import sys
import json
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
import logging
from typing import Dict, List, Any, Union, Optional
import uuid

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('spatial_features')

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import our spatial feature engineering module
try:
    from spatial.features.engineer_features import SpatialFeatureEngineer
except ImportError as e:
    logger.error(f"Failed to import SpatialFeatureEngineer: {e}")
    sys.exit(1)

def load_dataset(dataset_id: str) -> Optional[gpd.GeoDataFrame]:
    """
    Load a dataset from the database or file system.
    
    Args:
        dataset_id: ID of the dataset to load
        
    Returns:
        GeoDataFrame with property data and geometries
    """
    try:
        # For demo purposes, support loading from CSV with geometry conversion
        # In a production environment, this would load from a database
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
        file_path = os.path.join(data_dir, f'{dataset_id}.csv')
        
        if not os.path.exists(file_path):
            logger.error(f"Dataset not found: {file_path}")
            return None
        
        # Load CSV data
        df = pd.read_csv(file_path)
        
        # Check if geometry columns are present
        if 'latitude' in df.columns and 'longitude' in df.columns:
            # Convert to GeoDataFrame
            geometry = [Point(lon, lat) for lon, lat in zip(df['longitude'], df['latitude'])]
            gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326")
            return gdf
        elif 'geometry' in df.columns:
            # Geometry already present as WKT
            df['geometry'] = gpd.GeoSeries.from_wkt(df['geometry'])
            gdf = gpd.GeoDataFrame(df, crs="EPSG:4326")
            return gdf
        elif 'geometry_wkt' in df.columns:
            # Geometry present as WKT in different column
            df['geometry'] = gpd.GeoSeries.from_wkt(df['geometry_wkt'])
            gdf = gpd.GeoDataFrame(df, crs="EPSG:4326")
            return gdf
        else:
            logger.error("No geometry columns found in dataset")
            return None
    
    except Exception as e:
        logger.error(f"Error loading dataset: {e}")
        return None

def save_dataset(gdf: gpd.GeoDataFrame, dataset_id: str, suffix: str = 'spatial') -> str:
    """
    Save the GeoDataFrame with engineered features.
    
    Args:
        gdf: GeoDataFrame with engineered features
        dataset_id: Original dataset ID
        suffix: Suffix to add to the new dataset name
        
    Returns:
        Path to the saved dataset
    """
    try:
        # Create a new dataset ID
        new_dataset_id = f"{dataset_id}_{suffix}"
        
        # Save to data directory
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data')
        file_path = os.path.join(data_dir, f'{new_dataset_id}.csv')
        
        # Convert geometry to WKT before saving
        gdf_copy = gdf.copy()
        gdf_copy['geometry_wkt'] = gdf_copy['geometry'].apply(lambda x: x.wkt)
        
        # Save to CSV
        gdf_copy.drop(columns=['geometry']).to_csv(file_path, index=False)
        
        return new_dataset_id
    
    except Exception as e:
        logger.error(f"Error saving dataset: {e}")
        return ""

def run_spatial_feature_engineering(
    dataset_id: str, 
    include_pois: bool = False,
    include_network_centrality: bool = False,
    include_viewshed: bool = False,
    include_spatial_lag: bool = False,
    include_knn_features: bool = True,
    k: int = 5
) -> Dict[str, Any]:
    """
    Main function to run spatial feature engineering.
    
    Args:
        dataset_id: ID of the dataset to process
        include_pois: Whether to include POI features
        include_network_centrality: Whether to include network centrality metrics
        include_viewshed: Whether to include viewshed metrics
        include_spatial_lag: Whether to include spatial lag variables
        include_knn_features: Whether to include k-nearest neighbor features
        k: Number of neighbors to consider
        
    Returns:
        Dictionary with results and engineered features
    """
    # Load the dataset
    properties = load_dataset(dataset_id)
    
    if properties is None:
        return {
            'status': 'error',
            'message': f'Failed to load dataset: {dataset_id}'
        }
    
    try:
        # Initialize the feature engineer
        engineer = SpatialFeatureEngineer()
        
        # Parse numeric columns
        numeric_columns = properties.select_dtypes(include=['number']).columns.tolist()
        
        # Spatial lag variables to engineer
        spatial_lag_vars = []
        if include_spatial_lag and len(numeric_columns) > 0:
            # Use first 5 numeric columns or fewer if not available
            spatial_lag_vars = numeric_columns[:5]
        
        # Engineer features
        properties_with_features = engineer.engineer_features(
            data=properties,
            poi_categories=["school", "hospital", "park", "shopping"] if include_pois else [],
            include_network_centrality=include_network_centrality,
            include_viewshed=include_viewshed,
            spatial_lag_vars=spatial_lag_vars,
            include_knn_features=include_knn_features,
            k=k
        )
        
        # Get the list of engineered features
        original_columns = set(properties.columns)
        new_columns = set(properties_with_features.columns)
        engineered_features = list(new_columns - original_columns)
        
        # Save the dataset with engineered features
        new_dataset_id = save_dataset(properties_with_features, dataset_id)
        
        if not new_dataset_id:
            return {
                'status': 'error',
                'message': 'Failed to save dataset with engineered features'
            }
        
        return {
            'status': 'success',
            'message': 'Spatial features engineered successfully',
            'dataset_id': new_dataset_id,
            'engineered_features': engineered_features,
            'feature_count': len(engineered_features)
        }
    
    except Exception as e:
        logger.error(f"Error in spatial feature engineering: {e}")
        return {
            'status': 'error',
            'message': 'Error in spatial feature engineering',
            'error': str(e)
        }

if __name__ == '__main__':
    # Parse command line arguments
    if len(sys.argv) < 2:
        print(json.dumps({
            'status': 'error',
            'message': 'Missing required parameter: dataset_id'
        }))
        sys.exit(1)
    
    dataset_id = sys.argv[1]
    include_pois = sys.argv[2].lower() == 'true' if len(sys.argv) > 2 else False
    include_network_centrality = sys.argv[3].lower() == 'true' if len(sys.argv) > 3 else False
    include_viewshed = sys.argv[4].lower() == 'true' if len(sys.argv) > 4 else False
    include_spatial_lag = sys.argv[5].lower() == 'true' if len(sys.argv) > 5 else False
    include_knn_features = sys.argv[6].lower() == 'true' if len(sys.argv) > 6 else True
    k = int(sys.argv[7]) if len(sys.argv) > 7 else 5
    
    # Run spatial feature engineering
    result = run_spatial_feature_engineering(
        dataset_id=dataset_id,
        include_pois=include_pois,
        include_network_centrality=include_network_centrality,
        include_viewshed=include_viewshed,
        include_spatial_lag=include_spatial_lag,
        include_knn_features=include_knn_features,
        k=k
    )
    
    # Output JSON result to stdout for the Node.js process to capture
    print(json.dumps(result))