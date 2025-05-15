#!/usr/bin/env python3
"""
TerraFusion DriftGuard Kubernetes Operator

This operator monitors Kubernetes resources for configuration drift using
a hash-based approach. It can detect unauthorized changes and automatically
remediate by restoring resources to their expected state.

Built on the Kopf framework for Kubernetes operators.
"""

import kopf
import hashlib
import asyncio
import kubernetes
import requests
import json
import base64
import logging
import time
import os
import aiohttp
from typing import Dict, Any, Optional, Tuple, List
from kubernetes.client import (
    ApiClient, CustomObjectsApi, CoreV1Api, AppsV1Api, 
    V1Patch, V1ConfigMap, V1Secret, V1Deployment
)

# Configure robust logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('driftguard-operator')

# Load Kubernetes configuration appropriately for all environments
try:
    kubernetes.config.load_incluster_config()
    logger.info("Running with in-cluster configuration")
except kubernetes.config.ConfigException:
    kubernetes.config.load_kube_config()
    logger.info("Running with kubeconfig configuration")

# Initialize API clients with retry logic
def create_k8s_client():
    """Create Kubernetes client with retry mechanism for resilience"""
    retry_count = 0
    max_retries = 5
    while retry_count < max_retries:
        try:
            api_client = ApiClient()
            core_api = CoreV1Api(api_client)
            custom_api = CustomObjectsApi(api_client)
            apps_api = AppsV1Api(api_client)
            return core_api, custom_api, apps_api
        except Exception as e:
            retry_count += 1
            logger.warning(f"Failed to create K8s client (attempt {retry_count}/{max_retries}): {e}")
            time.sleep(2 ** retry_count)  # Exponential backoff
    
    raise RuntimeError("Failed to initialize Kubernetes API clients")

core_api, custom_api, apps_api = create_k8s_client()

# Configuration constants with environment variable support
TELEMETRY_ENDPOINT = os.environ.get(
    "TELEMETRY_ENDPOINT", 
    "http://telemetry-service.terrafusion-system.svc/telemetry/driftguard"
)
RESOURCE_TYPES = {
    'configmap': {
        'api': core_api,
        'getter': lambda name, namespace: core_api.read_namespaced_config_map(name, namespace),
        'patcher': lambda name, namespace, patch: core_api.patch_namespaced_config_map(
            name, namespace, body=V1Patch(patch), type='strategic-merge'
        ),
        'get_data': lambda obj: obj.data
    },
    'secret': {
        'api': core_api,
        'getter': lambda name, namespace: core_api.read_namespaced_secret(name, namespace),
        'patcher': lambda name, namespace, patch: core_api.patch_namespaced_secret(
            name, namespace, body=V1Patch(patch), type='strategic-merge'
        ),
        'get_data': lambda obj: {k: base64.b64decode(v).decode('utf-8') if v else '' 
                                for k, v in (obj.data or {}).items()}
    },
    'deployment': {
        'api': apps_api,
        'getter': lambda name, namespace: apps_api.read_namespaced_deployment(name, namespace),
        'patcher': lambda name, namespace, patch: apps_api.patch_namespaced_deployment(
            name, namespace, body=V1Patch(patch), type='strategic-merge'
        ),
        'get_data': lambda obj: obj.spec.template.spec.containers
    },
    # Support for GAMA simulation configuration
    'gamaconfig': {
        'api': custom_api,
        'getter': lambda name, namespace: custom_api.get_namespaced_custom_object(
            'terrafusion.ai', 'v1', namespace, 'gamaconfigs', name
        ),
        'patcher': lambda name, namespace, patch: custom_api.patch_namespaced_custom_object(
            'terrafusion.ai', 'v1', namespace, 'gamaconfigs', name, 
            body=json.loads(patch)
        ),
        'get_data': lambda obj: obj.get('spec', {}).get('parameters', {})
    },
}

class DriftError(Exception):
    """Custom exception for drift-related errors"""
    pass

def compute_hash(obj: Any) -> str:
    """
    Compute deterministic hash for an object
    
    Args:
        obj: The object to hash
        
    Returns:
        str: SHA-256 hex digest of the object
    """
    # Convert to ordered JSON for consistent hashing
    json_str = json.dumps(obj, sort_keys=True)
    return hashlib.sha256(json_str.encode('utf-8')).hexdigest()

async def fetch_target_object(kind: str, name: str, namespace: str) -> Tuple[Any, Dict]:
    """
    Fetch target object with error handling
    
    Args:
        kind: Resource kind (configmap, secret, etc.)
        name: Resource name
        namespace: Resource namespace
        
    Returns:
        Tuple[Any, Dict]: The raw object and extracted data
        
    Raises:
        DriftError: If object cannot be fetched or kind is unsupported
    """
    kind = kind.lower()
    
    if kind not in RESOURCE_TYPES:
        raise DriftError(f"Unsupported target kind: {kind}")
    
    try:
        resource_type = RESOURCE_TYPES[kind]
        obj = resource_type['getter'](name, namespace)
        data = resource_type['get_data'](obj)
        return obj, data
    except kubernetes.client.exceptions.ApiException as e:
        if e.status == 404:
            raise DriftError(f"{kind.capitalize()} {name} not found in namespace {namespace}")
        else:
            raise DriftError(f"API error fetching {kind}/{name}: {e}")
    except Exception as e:
        raise DriftError(f"Error processing {kind}/{name}: {str(e)}")

async def apply_remediation(
    kind: str, 
    name: str, 
    namespace: str, 
    expected_hash: str, 
    source_of_truth: Optional[Dict] = None,
    logger: Any = None
) -> bool:
    """
    Apply remediation to a drifted resource
    
    Args:
        kind: Resource kind
        name: Resource name
        namespace: Resource namespace
        expected_hash: Expected configuration hash
        source_of_truth: Optional source of truth data to apply
        logger: Logger instance
        
    Returns:
        bool: True if remediation was successful
    """
    logger = logger or logging.getLogger('driftguard-remediation')
    logger.info(f"Applying remediation to {kind}/{name} in {namespace}")
    
    kind = kind.lower()
    
    if kind not in RESOURCE_TYPES:
        logger.error(f"Cannot remediate unsupported resource type: {kind}")
        return False
    
    if not source_of_truth:
        # Get source of truth from version control or configuration service
        # This is a placeholder for the actual implementation
        logger.warning(f"No source of truth provided for {kind}/{name}, fetching from repository")
        try:
            # Fetch from source of truth
            source_of_truth = await fetch_from_source_of_truth(kind, name, namespace)
        except Exception as e:
            logger.error(f"Failed to fetch source of truth: {e}")
            return False
    
    try:
        # Apply the remediation by patching the resource
        patch_json = json.dumps(source_of_truth)
        RESOURCE_TYPES[kind]['patcher'](name, namespace, patch_json)
        logger.info(f"Successfully remediated {kind}/{name}")
        return True
    except Exception as e:
        logger.error(f"Remediation failed for {kind}/{name}: {e}")
        return False

async def fetch_from_source_of_truth(kind: str, name: str, namespace: str) -> Dict:
    """
    Fetch resource configuration from source of truth (gitops repo, etc.)
    
    Args:
        kind: Resource kind
        name: Resource name
        namespace: Resource namespace
        
    Returns:
        Dict: Configuration from source of truth
    """
    # TerraFusion integration - fetch from version control or update service
    try:
        # For GAMA configurations, use the TerraFusion update service
        if kind.lower() == 'gamaconfig':
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"http://terrafusion-update-service.{namespace}.svc/configurations/{kind}/{name}",
                    timeout=10
                ) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        raise RuntimeError(f"Failed to fetch from update service: {response.status}")
        else:
            # For other resources, use GitOps repo if available
            # This would be implemented to integrate with your Git repository
            raise NotImplementedError("GitOps repository integration not implemented")
    except Exception as e:
        logger.error(f"Source of truth fetch error: {e}")
        raise

async def log_telemetry(
    name: str, 
    namespace: str, 
    status: Dict[str, Any], 
    target_kind: str,
    target_name: str
) -> None:
    """
    Log telemetry data to central monitoring
    
    Args:
        name: DriftGuard name
        namespace: DriftGuard namespace
        status: Status information
        target_kind: Kind of monitored resource
        target_name: Name of monitored resource
    """
    try:
        payload = {
            "driftguard": name,
            "namespace": namespace,
            "targetKind": target_kind,
            "targetName": target_name,
            "status": status,
            "timestamp": kopf.now().isoformat()
        }
        headers = {"Content-Type": "application/json"}
        
        # Using async HTTP client for non-blocking operation
        async with aiohttp.ClientSession() as session:
            async with session.post(
                TELEMETRY_ENDPOINT, 
                json=payload, 
                headers=headers, 
                timeout=5
            ) as response:
                if response.status >= 400:
                    logger.warning(f"Telemetry API returned error: {response.status}")
    except Exception as e:
        logger.error(f"Telemetry logging failed: {e}")

@kopf.on.create('driftguards.terrafusion.ai')
async def on_create(spec, name, namespace, logger, **kwargs):
    """Handler for DriftGuard resource creation"""
    logger.info(f"DriftGuard {name} created in {namespace}")
    
    # Perform initial check
    return await check_drift(spec, name, namespace, None, logger, **kwargs)

@kopf.on.update('driftguards.terrafusion.ai')
async def on_update(spec, name, namespace, logger, **kwargs):
    """Handler for DriftGuard resource updates"""
    logger.info(f"DriftGuard {name} updated in {namespace}")
    
    # Perform check after update
    return await check_drift(spec, name, namespace, None, logger, **kwargs)

@kopf.timer('driftguards.terrafusion.ai', interval=30.0)
async def check_drift(spec, name, namespace, status, logger, **kwargs):
    """
    Periodic check for configuration drift
    
    Args:
        spec: DriftGuard spec
        name: DriftGuard name
        namespace: DriftGuard namespace
        status: Current DriftGuard status
        logger: Kopf logger
        
    Returns:
        Dict: Updated status
    """
    target_kind = spec.get('targetKind')
    target_name = spec.get('targetName')
    target_ns = spec.get('targetNamespace', namespace)
    expected_hash = spec.get('expectedHash')
    auto_remediate = spec.get('autoRemediate', False)
    max_failures = spec.get('maxFailuresBeforeAlert', 3)
    source_of_truth_ref = spec.get('sourceOfTruthRef')
    
    # Validate required fields
    if not all([target_kind, target_name, expected_hash]):
        logger.warning(f"DriftGuard '{name}' missing required fields. Skipping.")
        return {
            'lastChecked': kopf.now().isoformat(),
            'hashMatch': None,
            'reason': 'Missing targetKind, targetName, or expectedHash',
            'status': 'Invalid'
        }
    
    # Track consecutive failures for alerting
    consecutive_failures = status.get('consecutiveFailures', 0) if status else 0
    
    try:
        # Fetch target resource and data
        target_obj, target_data = await fetch_target_object(target_kind, target_name, target_ns)
        
        # Check for drift
        current_hash = compute_hash(target_data)
        hash_match = (current_hash == expected_hash)
        
        logger.info(f"Checked {target_kind}/{target_name}: hash match = {hash_match}")
        
        # Determine if we need to alert based on consecutive failures
        should_alert = not hash_match and consecutive_failures >= max_failures
        
        # Apply auto-remediation if enabled and drift detected
        remediation_applied = False
        if not hash_match and auto_remediate:
            # Get source of truth data if available
            source_data = None
            if source_of_truth_ref:
                # Placeholder for retrieving source of truth data
                pass
                
            # Apply remediation
            remediation_applied = await apply_remediation(
                target_kind, target_name, target_ns, expected_hash, source_data, logger
            )
        
        # Update status and consecutive failures count
        if hash_match:
            consecutive_failures = 0
        else:
            consecutive_failures += 1
        
        # Log telemetry for drift detection
        status_data = {
            'lastChecked': kopf.now().isoformat(),
            'hashMatch': hash_match,
            'currentHash': current_hash,
            'expectedHash': expected_hash,
            'consecutiveFailures': consecutive_failures,
            'remediated': remediation_applied if not hash_match else None,
            'alerted': should_alert,
            'status': 'Healthy' if hash_match else 'Drifted'
        }
        
        # Log telemetry data asynchronously
        asyncio.create_task(log_telemetry(
            name, namespace, status_data, target_kind, target_name
        ))
        
        return status_data
        
    except DriftError as e:
        logger.error(f"Drift check error: {e}")
        return {
            'lastChecked': kopf.now().isoformat(),
            'hashMatch': None,
            'reason': str(e),
            'consecutiveFailures': consecutive_failures + 1,
            'status': 'Error'
        }
    except Exception as e:
        logger.exception(f"Unexpected error during drift check: {e}")
        return {
            'lastChecked': kopf.now().isoformat(),
            'hashMatch': None,
            'reason': f"Unexpected error: {str(e)}",
            'consecutiveFailures': consecutive_failures + 1,
            'status': 'Error'
        }

# Special handler for GAMA configuration drift
@kopf.on.field('gamaconfigs.terrafusion.ai', field='spec.parameters')
async def gama_config_changed(old, new, name, namespace, logger, **kwargs):
    """
    Handler for GAMA configuration changes to detect unauthorized modifications
    
    Args:
        old: Previous parameters value
        new: New parameters value
        name: GAMAConfig resource name
        namespace: Resource namespace
        logger: Kopf logger
    """
    if old is not None and new is not None:
        # Check if there's a DriftGuard for this GAMAConfig
        try:
            guards = custom_api.list_namespaced_custom_object(
                'terrafusion.ai', 'v1', namespace, 'driftguards',
                label_selector=f"targetRef=gamaconfig-{name}"
            )
            
            if guards.get('items'):
                # A DriftGuard exists for this config, check its spec
                for guard in guards.get('items', []):
                    guard_name = guard.get('metadata', {}).get('name')
                    expected_hash = guard.get('spec', {}).get('expectedHash')
                    
                    if expected_hash:
                        # Calculate new hash and compare
                        current_hash = compute_hash(new)
                        if current_hash != expected_hash:
                            logger.warning(
                                f"Unauthorized change detected to GAMAConfig {name}, "
                                f"current hash {current_hash} doesn't match expected {expected_hash}"
                            )
                            
                            # This field watcher can't modify status, so just log
                            # The regular timer will handle remediation
        except Exception as e:
            logger.error(f"Error checking DriftGuards for GAMAConfig {name}: {e}")

if __name__ == "__main__":
    # Start the Kopf operator
    kopf.run()