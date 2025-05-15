#!/usr/bin/env python3
"""
GWR Model Runner Script

This script loads property data and fits a Geographically Weighted Regression (GWR) model.
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
logger = logging.getLogger('gwr_model')

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import our GWR model
try:
    from models.gwr.gwr_model import GWRModel
except ImportError as e:
    logger.error(f"Failed to import GWRModel: {e}")
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

def run_gwr_model(
    dataset_id: str, 
    dependent_var: str,
    independent_vars: List[str],
    bandwidth: str = 'AIC',
    kernel_type: str = 'gaussian',
    fixed: bool = False
) -> Dict[str, Any]:
    """
    Main function to run GWR model.
    
    Args:
        dataset_id: ID of the dataset to process
        dependent_var: Target variable name
        independent_vars: List of feature names
        bandwidth: Bandwidth selection method ('AIC', 'CV', 'fixed')
        kernel_type: Kernel function ('gaussian', 'bisquare', 'exponential')
        fixed: Whether to use fixed or adaptive bandwidth
        
    Returns:
        Dictionary with model results
    """
    # Load the dataset
    properties = load_dataset(dataset_id)
    
    if properties is None:
        return {
            'status': 'error',
            'message': f'Failed to load dataset: {dataset_id}'
        }
    
    # Check if dependent variable exists
    if dependent_var not in properties.columns:
        return {
            'status': 'error',
            'message': f'Dependent variable {dependent_var} not found in dataset'
        }
    
    # Check if independent variables exist
    for var in independent_vars:
        if var not in properties.columns:
            return {
                'status': 'error',
                'message': f'Independent variable {var} not found in dataset'
            }
    
    try:
        # Create model ID
        model_id = f"gwr_{uuid.uuid4().hex[:8]}"
        
        # Initialize GWR model
        model = GWRModel(
            bandwidth=bandwidth,
            kernel_type=kernel_type,
            fixed=fixed,
            data_dir='./data'
        )
        
        # Fit model
        summary = model.fit(
            data=properties,
            dependent_var=dependent_var,
            independent_vars=independent_vars
        )
        
        # Save model
        model_path = model.save_model(
            filename=f"./data/{model_id}.json"
        )
        
        return {
            'status': 'success',
            'message': 'GWR model fitted successfully',
            'model_id': model_id,
            'model_path': model_path,
            'model_summary': summary
        }
    
    except Exception as e:
        logger.error(f"Error in GWR modeling: {e}")
        return {
            'status': 'error',
            'message': 'Error in GWR modeling',
            'error': str(e)
        }

if __name__ == '__main__':
    # Parse command line arguments
    if len(sys.argv) < 4:
        print(json.dumps({
            'status': 'error',
            'message': 'Missing required parameters: dataset_id, dependent_var, independent_vars'
        }))
        sys.exit(1)
    
    dataset_id = sys.argv[1]
    dependent_var = sys.argv[2]
    independent_vars = json.loads(sys.argv[3])
    bandwidth = sys.argv[4] if len(sys.argv) > 4 else 'AIC'
    kernel_type = sys.argv[5] if len(sys.argv) > 5 else 'gaussian'
    fixed = sys.argv[6] == '1' if len(sys.argv) > 6 else False
    
    # Run GWR model
    result = run_gwr_model(
        dataset_id=dataset_id,
        dependent_var=dependent_var,
        independent_vars=independent_vars,
        bandwidth=bandwidth,
        kernel_type=kernel_type,
        fixed=fixed
    )
    
    # Output JSON result to stdout for the Node.js process to capture
    print(json.dumps(result))