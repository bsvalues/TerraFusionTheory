# TerraFusion - Location Intelligence Layer (LIL) Engine
# Core spatial scoring pipeline to compute location-based valuation influence scores

import geopandas as gpd
import pandas as pd
import numpy as np
import rasterio
from rasterio.features import geometry_mask
from shapely.geometry import Point
from shapely.ops import unary_union
from sklearn.preprocessing import MinMaxScaler
import json
import os
import math
import hashlib
import sys
import time
import threading
import requests
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('lil-engine')

# Load config from DriftGuard-protected ConfigMap
CONFIG_PATH = os.environ.get("LIL_CONFIG_PATH", "./lil_weights_config.json")
EXPECTED_HASH = os.environ.get("LIL_CONFIG_EXPECTED_HASH")
NAMESPACE = os.environ.get("NAMESPACE", "terrafusion-system")
DRIFTGUARD_NAME = os.environ.get("DRIFTGUARD_NAME", "lil-weights-config-guard")
DRIFTGUARD_ENABLED = os.environ.get("DRIFTGUARD_ENABLED", "true").lower() in ["true", "1", "yes"]

def compute_hash(config_data):
    """Compute SHA-256 hash of the configuration data"""
    return hashlib.sha256(config_data.encode('utf-8')).hexdigest()

def get_expected_hash():
    """Get the expected hash from the DriftGuard operator"""
    if EXPECTED_HASH:
        return EXPECTED_HASH
    
    if not DRIFTGUARD_ENABLED:
        logger.warning("DriftGuard validation disabled, skipping hash verification")
        return None
    
    try:
        # Try to get the DriftGuard status from the operator API
        url = f"http://driftguard-operator.{NAMESPACE}.svc.cluster.local/api/v1/driftguards/{NAMESPACE}/{DRIFTGUARD_NAME}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("expectedHash")
    except Exception as e:
        logger.warning(f"Could not fetch expected hash from DriftGuard API: {e}")
    
    return None

def verify_config_integrity():
    """Verify the configuration file integrity against the expected hash"""
    try:
        # Read the configuration file
        with open(CONFIG_PATH, 'r') as f:
            config_data = f.read()
        
        # Calculate the hash
        actual_hash = compute_hash(config_data)
        
        # Get the expected hash
        expected_hash = get_expected_hash()
        
        # If we don't have an expected hash, we can't verify
        if not expected_hash:
            logger.warning("No expected hash available, skipping verification")
            return True, json.loads(config_data)
        
        # Compare the hashes
        if actual_hash == expected_hash:
            logger.info(f"Configuration hash verified: {actual_hash}")
            return True, json.loads(config_data)
        else:
            logger.error(f"Configuration hash mismatch!")
            logger.error(f"  - Actual:   {actual_hash}")
            logger.error(f"  - Expected: {expected_hash}")
            
            if os.environ.get("LIL_FAIL_ON_CONFIG_MISMATCH", "false").lower() in ["true", "1", "yes"]:
                logger.critical("Exiting due to configuration integrity failure")
                sys.exit(1)
            return False, json.loads(config_data)
    
    except Exception as e:
        logger.error(f"Failed to verify configuration: {e}")
        return False, None

def watch_for_config_changes(callback):
    """
    Watch for changes to the configuration file and call callback when changes are detected
    """
    last_modified = os.path.getmtime(CONFIG_PATH)
    
    while True:
        time.sleep(30)  # Check every 30 seconds
        try:
            current_modified = os.path.getmtime(CONFIG_PATH)
            
            if current_modified > last_modified:
                logger.info(f"Configuration file changed at {time.ctime(current_modified)}")
                callback()
                last_modified = current_modified
        except Exception as e:
            logger.error(f"Error in config watcher: {e}")

def load_config():
    """Load configuration from file with integrity verification"""
    config_valid, config = verify_config_integrity()
    
    if not config:
        logger.warning("Using default configuration due to verification failure")
        return {
            "poi_buffer_distances": [250, 500, 1000],
            "ndvi_threshold": 0.3,
            "entropy_radius": 300,
            "viewshed_raster_path": "./data/viewshed.tif",
            "score_weights": {
                "poi_score": 0.4,
                "entropy_score": 0.3,
                "viewshed_score": 0.3
            }
        }
    
    logger.info("Configuration loaded successfully")
    return config

# Load initial configuration
CONFIG = load_config()

# Start the config watcher in a background thread
config_watcher_thread = threading.Thread(
    target=watch_for_config_changes, 
    args=(lambda: globals().update(CONFIG=load_config()),),
    daemon=True
)
config_watcher_thread.start()

# Constants from config
BUFFER_DISTANCES = CONFIG.get("poi_buffer_distances", [250, 500, 1000])
NDVI_THRESHOLD = CONFIG.get("ndvi_threshold", 0.3)
ENTROPY_RADIUS = CONFIG.get("entropy_radius", 300)
VIEWSHED_SCORE_PATH = CONFIG.get("viewshed_raster_path", "./data/viewshed.tif")

# Helper: Distance-weighted POI score
def compute_poi_accessibility(parcels, pois):
    weights = []
    for dist in BUFFER_DISTANCES:
        joined = gpd.sjoin(parcels.copy(), pois, how="left", predicate="intersects")
        score = joined.groupby("index_left").size().reindex(parcels.index, fill_value=0)
        weights.append(score / dist)
    total_score = sum(weights)
    scaler = MinMaxScaler()
    return scaler.fit_transform(total_score.values.reshape(-1, 1)).flatten()

# Helper: Shannon entropy of landuse diversity
def compute_entropy(parcels, landuse):
    scores = []
    for parcel in parcels.geometry:
        buffer = parcel.buffer(ENTROPY_RADIUS)
        intersected = landuse[landuse.intersects(buffer)]
        counts = intersected["landuse_type"].value_counts(normalize=True)
        entropy = -sum(p * math.log(p, 2) for p in counts if p > 0)
        scores.append(entropy)
    scaler = MinMaxScaler()
    return scaler.fit_transform(np.array(scores).reshape(-1, 1)).flatten()

# Helper: Viewshed raster scoring
def compute_viewshed_scores(parcels):
    viewshed_scores = []
    with rasterio.open(VIEWSHED_SCORE_PATH) as src:
        for geom in parcels.geometry:
            mask = geometry_mask([geom], transform=src.transform, invert=True,
                                 out_shape=src.shape)
            data = src.read(1)
            visible = data[mask]
            score = np.nanmean(visible) if visible.size > 0 else 0
            viewshed_scores.append(score)
    scaler = MinMaxScaler()
    return scaler.fit_transform(np.array(viewshed_scores).reshape(-1, 1)).flatten()

def main():
    """Main LIL engine processing pipeline"""
    try:
        logger.info("Starting LIL Engine spatial scoring pipeline")
        
        # Load input data
        logger.info("Loading input data...")
        parcels = gpd.read_file("./data/parcels.geojson").to_crs(epsg=3857)
        pois = gpd.read_file("./data/pois.geojson").to_crs(parcels.crs)
        landuse = gpd.read_file("./data/landuse.geojson").to_crs(parcels.crs)
        
        # Compute features
        logger.info("Computing POI accessibility scores...")
        parcels["poi_score"] = compute_poi_accessibility(parcels, pois)
        
        logger.info("Computing land use entropy...")
        parcels["entropy_score"] = compute_entropy(parcels, landuse)
        
        logger.info("Computing viewshed score...")
        parcels["viewshed_score"] = compute_viewshed_scores(parcels)
        
        # Weighted location score
        logger.info("Calculating final location scores...")
        weights = CONFIG.get("score_weights", {
            "poi_score": 0.4,
            "entropy_score": 0.3,
            "viewshed_score": 0.3
        })
        
        parcels["location_score"] = (
            parcels["poi_score"] * weights["poi_score"] +
            parcels["entropy_score"] * weights["entropy_score"] +
            parcels["viewshed_score"] * weights["viewshed_score"]
        )
        
        # Save result
        output_path = CONFIG.get("output_path", "./output/location_scores.geojson")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        parcels[["parcel_id", "location_score", "poi_score", "entropy_score", "viewshed_score"]].to_file(
            output_path, driver="GeoJSON")
        logger.info(f"Location scores saved to {output_path}")
        
        return 0
    
    except Exception as e:
        logger.error(f"Error in LIL Engine: {e}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())