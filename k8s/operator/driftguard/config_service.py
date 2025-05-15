"""
TerraFusion Configuration Service

This service acts as a centralized source of truth for configurations
across the TerraFusion platform. It provides a REST API for fetching
approved configurations and their expected SHA-256 hashes.

Used by the DriftGuard operator for configuration verification and
automatic remediation when configuration drift is detected.
"""

import os
import json
import hashlib
import logging
import asyncio
import base64
from typing import Dict, Any, Optional, List, Tuple

import kubernetes as k8s
from kubernetes import client, config, watch
from fastapi import FastAPI, HTTPException, Depends, Security, status
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [ConfigService] %(message)s'
)
logger = logging.getLogger('config_service')

# Initialize the FastAPI app
app = FastAPI(
    title="TerraFusion Configuration Service",
    description="Enterprise configuration management for TerraFusion platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
API_KEY_NAME = "X-API-Key"
API_KEY = os.getenv("CONFIG_SERVICE_API_KEY", "development-key-replace-in-production")
api_key_header = APIKeyHeader(name=API_KEY_NAME)

# Configuration store
# In production, this would be backed by a database
configurations: Dict[str, Dict[str, Any]] = {}

# Models
class ConfigurationResponse(BaseModel):
    name: str
    namespace: str
    kind: str
    data: Dict[str, Any]
    hash: str
    version: str = "1.0"


class ConfigurationItem(BaseModel):
    name: str
    namespace: str
    kind: str
    data: Dict[str, Any]
    version: str = "1.0"

# Security dependency
async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    return api_key

# Helpers
def compute_hash(data: Dict[str, Any]) -> str:
    """Compute SHA-256 hash of configuration data"""
    data_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(data_str.encode('utf-8')).hexdigest()

async def load_initial_configurations():
    """Load initial configurations from Kubernetes or local storage"""
    try:
        # Try to load from Kubernetes ConfigMaps if running in cluster
        try:
            config.load_incluster_config()
            v1 = client.CoreV1Api()
            
            # Load from designated ConfigMap in the terrafusion-system namespace
            config_map = v1.read_namespaced_config_map(
                name="terrafusion-configurations",
                namespace="terrafusion-system"
            )
            
            if config_map.data:
                for key, value in config_map.data.items():
                    try:
                        parsed = json.loads(value)
                        path_parts = key.split('/')
                        if len(path_parts) >= 3:  # Expect format: <type>/<name>.<ext>
                            conf_type = path_parts[0]
                            if conf_type not in configurations:
                                configurations[conf_type] = {}
                            
                            name = path_parts[1]
                            configurations[conf_type][name] = parsed
                            logger.info(f"Loaded configuration: {conf_type}/{name}")
                    except json.JSONDecodeError:
                        logger.error(f"Failed to parse configuration: {key}")
                
                logger.info(f"Loaded {len(config_map.data)} configurations from Kubernetes")
        except Exception as e:
            logger.warning(f"Failed to load from Kubernetes: {str(e)}")
            
            # Fall back to local file system if not in cluster
            config_dir = os.environ.get("CONFIG_DIR", "./configurations")
            if os.path.exists(config_dir):
                for root, dirs, files in os.walk(config_dir):
                    for file in files:
                        if file.endswith('.json'):
                            path = os.path.join(root, file)
                            rel_path = os.path.relpath(path, config_dir)
                            path_parts = rel_path.split('/')
                            
                            if len(path_parts) >= 2:
                                conf_type = path_parts[0]
                                name = os.path.splitext(path_parts[1])[0]
                                
                                try:
                                    with open(path, 'r') as f:
                                        data = json.load(f)
                                        
                                        if conf_type not in configurations:
                                            configurations[conf_type] = {}
                                        
                                        configurations[conf_type][name] = data
                                        logger.info(f"Loaded configuration: {conf_type}/{name}")
                                except Exception as e:
                                    logger.error(f"Failed to load {path}: {str(e)}")
                
                logger.info(f"Loaded configurations from local filesystem")
    except Exception as e:
        logger.error(f"Error loading configurations: {str(e)}")

    # Always have some default configurations for testing
    if not configurations:
        logger.warning("No configurations found, creating defaults for testing")
        
        # GAMA configurations
        if "gama" not in configurations:
            configurations["gama"] = {}
        
        configurations["gama"]["gama-valuation-model"] = {
            "apiVersion": "terrafusion.ai/v1",
            "kind": "GAMAConfig",
            "metadata": {
                "name": "gama-valuation-model",
                "namespace": "terrafusion-system"
            },
            "spec": {
                "modelParams": {
                    "spatialWeighting": "gaussian",
                    "bandwidth": 2500,
                    "minNeighbors": 15,
                    "maxNeighbors": 50,
                    "coefficientConstraints": {
                        "landSqFt": {"min": 0.1, "max": None},
                        "buildingSqFt": {"min": 10, "max": None},
                        "age": {"min": None, "max": 0},
                        "bedrooms": {"min": 0, "max": None},
                        "bathrooms": {"min": 0, "max": None}
                    },
                    "propertyTypeMask": ["residential", "agricultural", "commercial"],
                    "trimOutliers": True,
                    "outlierStdDev": 3.0,
                    "crossValidation": True,
                    "crossValidationFolds": 5
                },
                "dataPreprocessing": {
                    "standardizeFeatures": True,
                    "imputeMissingValues": "median",
                    "removeOutliers": True,
                    "outlierMethod": "iqr",
                    "outlierThreshold": 1.5
                },
                "spatialFeatures": {
                    "includeNeighborhoodIndicators": True,
                    "includeDistanceToAmenities": True,
                    "includeElevation": True,
                    "amenityTypes": ["school", "park", "hospital", "retail", "transit"]
                },
                "reportingConfig": {
                    "generateRSquared": True,
                    "generateMAPE": True,
                    "generateResidualPlots": True,
                    "generateSpatialAutocorrelation": True,
                    "saveIndividualCoefficients": True,
                    "savePredictions": True
                }
            }
        }

        # Add a sample market settings ConfigMap
        if "kubernetes" not in configurations:
            configurations["kubernetes"] = {}
            
        configurations["kubernetes"]["configmaps"] = {}
        configurations["kubernetes"]["configmaps"]["market-settings"] = {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {
                "name": "market-settings",
                "namespace": "terrafusion-system",
                "labels": {
                    "app": "terrafusion-market",
                    "component": "settings"
                }
            },
            "data": {
                "settings.json": json.dumps({
                    "updateFrequency": "daily",
                    "dataSources": ["zillow", "redfin", "county-records"],
                    "marketSegments": ["residential", "commercial", "agricultural"],
                    "indicatorWeights": {
                        "salesVolume": 0.3,
                        "priceChange": 0.4,
                        "daysOnMarket": 0.2,
                        "listToSoldRatio": 0.1
                    },
                    "historicalWindow": 36,
                    "forecastWindow": 12
                })
            }
        }

        # Add a sample database secrets (just structure, not real values)
        if "kubernetes" not in configurations:
            configurations["kubernetes"] = {}
            
        configurations["kubernetes"]["secrets"] = {}
        configurations["kubernetes"]["secrets"]["db-credentials"] = {
            "apiVersion": "v1",
            "kind": "Secret",
            "metadata": {
                "name": "db-credentials",
                "namespace": "terrafusion-system",
                "labels": {
                    "app": "terrafusion-database",
                    "component": "credentials"
                }
            },
            "type": "Opaque",
            "data": {
                "username": base64.b64encode(b"terrafusion-app").decode('utf-8'),
                "password": base64.b64encode(b"example-password-replaced-in-prod").decode('utf-8'),
                "host": base64.b64encode(b"postgres.terrafusion-system.svc.cluster.local").decode('utf-8'),
                "port": base64.b64encode(b"5432").decode('utf-8'),
                "database": base64.b64encode(b"terrafusion").decode('utf-8')
            }
        }

@app.on_event("startup")
async def startup_event():
    """Initialize the service on startup"""
    await load_initial_configurations()
    
    # Watch for changes to ConfigMaps if running in Kubernetes
    asyncio.create_task(watch_for_configuration_changes())

async def watch_for_configuration_changes():
    """Watch for changes to configuration resources in Kubernetes"""
    try:
        config.load_incluster_config()
        v1 = client.CoreV1Api()
        
        resource_version = ""
        w = watch.Watch()
        
        while True:
            try:
                for event in w.stream(
                    v1.list_namespaced_config_map,
                    namespace="terrafusion-system",
                    label_selector="managed-by=terrafusion-config-service",
                    resource_version=resource_version
                ):
                    obj = event["object"]
                    operation = event["type"]
                    
                    # Update our resource version for bookmarking
                    metadata = obj.metadata
                    resource_version = metadata.resource_version
                    name = metadata.name
                    
                    logger.info(f"Configuration {operation}: {name}")
                    
                    # Update local cache based on event type
                    if operation in ["ADDED", "MODIFIED"]:
                        if obj.data:
                            for key, value in obj.data.items():
                                try:
                                    parsed = json.loads(value)
                                    path_parts = key.split('/')
                                    if len(path_parts) >= 2:
                                        conf_type = path_parts[0]
                                        if conf_type not in configurations:
                                            configurations[conf_type] = {}
                                        
                                        name = path_parts[1]
                                        configurations[conf_type][name] = parsed
                                except json.JSONDecodeError:
                                    logger.error(f"Failed to parse configuration: {key}")
                    elif operation == "DELETED":
                        # Remove from cache if deleted
                        if obj.data:
                            for key in obj.data.keys():
                                path_parts = key.split('/')
                                if len(path_parts) >= 2:
                                    conf_type = path_parts[0]
                                    name = path_parts[1]
                                    
                                    if conf_type in configurations and name in configurations[conf_type]:
                                        del configurations[conf_type][name]
            except Exception as e:
                logger.error(f"Error watching configurations: {str(e)}")
                # Wait before retrying
                await asyncio.sleep(10)
    except Exception as e:
        logger.warning(f"Not running in Kubernetes or insufficient permissions: {str(e)}")
        # If not in Kubernetes, just skip the watch

# Endpoints
@app.get("/")
async def root():
    """Service health check"""
    return {"status": "healthy", "service": "TerraFusion Configuration Service"}

@app.get("/configurations", dependencies=[Depends(verify_api_key)])
async def list_configurations():
    """List all available configurations"""
    result = []
    
    for conf_type, configs in configurations.items():
        for name, data in configs.items():
            result.append({
                "type": conf_type,
                "name": name,
                "path": f"/configurations/{conf_type}/{name}"
            })
    
    return {"configurations": result}

@app.get("/configurations/{conf_type}", dependencies=[Depends(verify_api_key)])
async def list_configurations_by_type(conf_type: str):
    """List configurations of a specific type"""
    if conf_type not in configurations:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration type '{conf_type}' not found"
        )
    
    result = []
    for name, data in configurations[conf_type].items():
        result.append({
            "type": conf_type,
            "name": name,
            "path": f"/configurations/{conf_type}/{name}"
        })
    
    return {"configurations": result}

@app.get("/configurations/{conf_type}/{name}", dependencies=[Depends(verify_api_key)])
async def get_configuration(conf_type: str, name: str):
    """Get a specific configuration by type and name"""
    if conf_type not in configurations or name not in configurations[conf_type]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration '{conf_type}/{name}' not found"
        )
    
    data = configurations[conf_type][name]
    hash_value = compute_hash(data)
    
    # Extract metadata from the configuration
    kind = data.get("kind", "Unknown")
    namespace = "default"
    
    if "metadata" in data and isinstance(data["metadata"], dict):
        if "namespace" in data["metadata"]:
            namespace = data["metadata"]["namespace"]
    
    return ConfigurationResponse(
        name=name,
        namespace=namespace,
        kind=kind,
        data=data,
        hash=hash_value
    )

@app.get("/hash/{conf_type}/{name}", dependencies=[Depends(verify_api_key)])
async def get_configuration_hash(conf_type: str, name: str):
    """Get just the hash of a specific configuration"""
    if conf_type not in configurations or name not in configurations[conf_type]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Configuration '{conf_type}/{name}' not found"
        )
    
    data = configurations[conf_type][name]
    hash_value = compute_hash(data)
    
    return {"hash": hash_value}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)