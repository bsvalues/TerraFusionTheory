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
    
    # Start remediation transaction with audit logging
    transaction_id = f"remediation-{int(time.time())}-{name}-{namespace}"
    logger.info(f"Starting remediation transaction {transaction_id}")
    
    # Step 1: Fetch current state for backup purposes
    try:
        current_obj, current_data = await fetch_target_object(kind, name, namespace)
        # Store backup of current state (could be saved to persistent storage)
        backup_data = {
            'transaction_id': transaction_id,
            'timestamp': kopf.now().isoformat(),
            'kind': kind,
            'name': name,
            'namespace': namespace,
            'data': current_data
        }
        logger.info(f"Backed up current state for {kind}/{name}")
    except Exception as e:
        logger.error(f"Failed to backup current state: {e}")
        return False

    # Step 2: Get source of truth if not provided
    if not source_of_truth:
        logger.info(f"No source of truth provided for {kind}/{name}, fetching from repository")
        try:
            # Try multiple sources in order of preference
            try:
                # First try configuration service
                source_of_truth = await fetch_from_config_service(kind, name, namespace)
                logger.info(f"Retrieved configuration from config service for {kind}/{name}")
            except Exception as config_err:
                logger.warning(f"Config service fetch failed: {config_err}")
                # Fall back to GitOps repository
                source_of_truth = await fetch_from_git_repository(kind, name, namespace)
                logger.info(f"Retrieved configuration from git repository for {kind}/{name}")
        except Exception as e:
            logger.error(f"All source of truth retrieval methods failed: {e}")
            # Log telemetry for remediation failure
            await log_remediation_telemetry(transaction_id, kind, name, namespace, False, str(e))
            return False
    
    # Step 3: Validate the source of truth
    try:
        # Ensure the hash of the source_of_truth matches expected_hash
        source_hash = compute_hash(source_of_truth)
        if source_hash != expected_hash:
            logger.error(f"Source of truth hash {source_hash} doesn't match expected hash {expected_hash}")
            await log_remediation_telemetry(transaction_id, kind, name, namespace, False, 
                                           "Source hash mismatch")
            return False
        
        logger.info(f"Validated source of truth for {kind}/{name}")
    except Exception as e:
        logger.error(f"Source of truth validation failed: {e}")
        await log_remediation_telemetry(transaction_id, kind, name, namespace, False, f"Validation error: {e}")
        return False
    
    # Step 4: Apply the remediation by patching the resource
    try:
        if kind in ['configmap', 'secret']:
            # For ConfigMaps and Secrets, we need to structure the patch differently
            patch = {
                "data": source_of_truth
            }
        elif kind == 'gamaconfig':
            # For GAMAConfig, we patch the parameters field
            patch = {
                "spec": {
                    "parameters": source_of_truth
                }
            }
        else:
            # For other resource types
            patch = source_of_truth
            
        # Convert to JSON for the API call
        patch_json = json.dumps(patch)
        
        # Apply the patch
        RESOURCE_TYPES[kind]['patcher'](name, namespace, patch_json)
        
        # Verify the remediation was successful
        _, updated_data = await fetch_target_object(kind, name, namespace)
        updated_hash = compute_hash(updated_data)
        
        if updated_hash == expected_hash:
            logger.info(f"Successfully remediated {kind}/{name} to match expected hash")
            await log_remediation_telemetry(transaction_id, kind, name, namespace, True, 
                                           "Remediation successful")
            return True
        else:
            logger.error(f"Remediation didn't achieve expected hash: current={updated_hash}, expected={expected_hash}")
            await log_remediation_telemetry(transaction_id, kind, name, namespace, False, 
                                           "Post-remediation hash mismatch")
            return False
    except Exception as e:
        logger.error(f"Remediation failed for {kind}/{name}: {e}")
        await log_remediation_telemetry(transaction_id, kind, name, namespace, False, str(e))
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
        # First try configuration service
        try:
            return await fetch_from_config_service(kind, name, namespace)
        except Exception as e:
            logger.warning(f"Config service fetch failed: {e}")
            
        # Fall back to GitOps repository
        return await fetch_from_git_repository(kind, name, namespace)
            
    except Exception as e:
        logger.error(f"Source of truth fetch error: {e}")
        raise
        
async def fetch_from_config_service(kind: str, name: str, namespace: str) -> Dict:
    """
    Fetch resource configuration from TerraFusion Configuration Service
    
    Args:
        kind: Resource kind
        name: Resource name
        namespace: Resource namespace
        
    Returns:
        Dict: Configuration from the configuration service
    """
    logger.info(f"Fetching {kind}/{name} from config service")
    
    # Determine configuration service URL based on environment
    config_service_url = os.environ.get(
        "CONFIG_SERVICE_URL",
        f"http://terrafusion-config-service.{namespace}.svc"
    )
    
    # Build API path based on resource kind
    if kind.lower() == 'gamaconfig':
        api_path = f"/configurations/gama/{name}"
    elif kind.lower() == 'configmap':
        api_path = f"/configurations/configmaps/{name}"
    elif kind.lower() == 'secret':
        api_path = f"/configurations/secrets/{name}"
    else:
        api_path = f"/configurations/resources/{kind}/{name}"
    
    full_url = f"{config_service_url}{api_path}"
    
    # Add authentication if available
    headers = {}
    auth_token = os.environ.get("CONFIG_SERVICE_TOKEN")
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    # Fetch configuration with timeout
    async with aiohttp.ClientSession() as session:
        async with session.get(
            full_url,
            headers=headers,
            timeout=10
        ) as response:
            if response.status == 200:
                result = await response.json()
                logger.info(f"Successfully fetched {kind}/{name} from config service")
                
                # Extract actual configuration data based on kind
                if kind.lower() == 'gamaconfig':
                    return result.get('parameters', {})
                elif kind.lower() in ['configmap', 'secret']:
                    return result.get('data', {})
                else:
                    return result
            else:
                response_text = await response.text()
                raise RuntimeError(
                    f"Failed to fetch from config service: Status {response.status}, "
                    f"Response: {response_text[:100]}..."
                )

async def fetch_from_git_repository(kind: str, name: str, namespace: str) -> Dict:
    """
    Fetch resource configuration from GitOps repository
    
    Args:
        kind: Resource kind
        name: Resource name
        namespace: Resource namespace
        
    Returns:
        Dict: Configuration from the GitOps repository
    """
    logger.info(f"Fetching {kind}/{name} from GitOps repository")
    
    # Get Git repository information from environment variables
    git_api_url = os.environ.get("GIT_API_URL")
    git_token = os.environ.get("GIT_API_TOKEN")
    git_repo = os.environ.get("GIT_REPO")
    git_branch = os.environ.get("GIT_BRANCH", "main")
    
    if not all([git_api_url, git_token, git_repo]):
        raise ValueError("Missing Git repository configuration in environment variables")
    
    # Determine file path in repository based on resource kind
    if kind.lower() == 'gamaconfig':
        file_path = f"configs/gama/{namespace}/{name}.json"
    elif kind.lower() == 'configmap':
        file_path = f"configs/kubernetes/{namespace}/configmaps/{name}.yaml"
    elif kind.lower() == 'secret':
        file_path = f"configs/kubernetes/{namespace}/secrets/{name}.yaml"
    else:
        file_path = f"configs/kubernetes/{namespace}/{kind.lower()}s/{name}.yaml"
    
    # Build API URL based on Git provider (example: GitHub API)
    # This example assumes GitHub, adapt for GitLab, BitBucket, etc.
    api_url = f"{git_api_url}/repos/{git_repo}/contents/{file_path}?ref={git_branch}"
    
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "Authorization": f"token {git_token}"
    }
    
    # Fetch file from Git repository
    async with aiohttp.ClientSession() as session:
        async with session.get(api_url, headers=headers, timeout=15) as response:
            if response.status == 200:
                result = await response.json()
                
                # GitHub API returns content as base64-encoded string
                content = base64.b64decode(result.get("content", "")).decode("utf-8")
                
                # Parse content based on file type (JSON/YAML)
                if file_path.endswith(".json"):
                    config = json.loads(content)
                elif file_path.endswith(".yaml") or file_path.endswith(".yml"):
                    # Placeholder for YAML parsing
                    # We'd need to add PyYAML dependency for proper implementation
                    raise NotImplementedError("YAML parsing not implemented")
                else:
                    raise ValueError(f"Unsupported file format for {file_path}")
                
                # Extract actual configuration data based on kind
                if kind.lower() == 'gamaconfig':
                    return config.get('parameters', {})
                elif kind.lower() in ['configmap', 'secret']:
                    return config.get('data', {})
                else:
                    return config
            else:
                raise RuntimeError(f"Failed to fetch from Git repository: {response.status}")
                
async def log_remediation_telemetry(
    transaction_id: str,
    kind: str,
    name: str,
    namespace: str,
    success: bool,
    details: str
) -> None:
    """
    Log telemetry specifically for remediation operations
    
    Args:
        transaction_id: Unique identifier for this remediation transaction
        kind: Resource kind
        name: Resource name
        namespace: Resource namespace
        success: Whether remediation was successful
        details: Additional details about the remediation
    """
    try:
        remediation_endpoint = os.environ.get(
            "REMEDIATION_TELEMETRY_ENDPOINT", 
            f"{TELEMETRY_ENDPOINT}/remediation"
        )
        
        payload = {
            "transaction_id": transaction_id,
            "kind": kind,
            "name": name,
            "namespace": namespace,
            "success": success,
            "details": details,
            "timestamp": kopf.now().isoformat(),
            "operator_version": os.environ.get("OPERATOR_VERSION", "unknown"),
            "node": os.environ.get("NODE_NAME", "unknown"),
            "cluster": os.environ.get("CLUSTER_NAME", "unknown")
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Transaction-ID": transaction_id,
            "X-Source": "driftguard-operator"
        }
        
        # Using async HTTP client for non-blocking operation
        async with aiohttp.ClientSession() as session:
            async with session.post(
                remediation_endpoint, 
                json=payload, 
                headers=headers, 
                timeout=5
            ) as response:
                if response.status >= 400:
                    logger.warning(f"Remediation telemetry API returned error: {response.status}")
                else:
                    logger.info(f"Remediation telemetry logged successfully: {transaction_id}")
    except Exception as e:
        logger.error(f"Remediation telemetry logging failed: {e}")

async def log_telemetry(
    name: str, 
    namespace: str, 
    status: Dict[str, Any], 
    target_kind: str,
    target_name: str
) -> bool:
    """
    Log telemetry data to central monitoring with retry logic and backup
    
    Args:
        name: DriftGuard name
        namespace: DriftGuard namespace
        status: Status information
        target_kind: Kind of monitored resource
        target_name: Name of monitored resource
        
    Returns:
        bool: True if telemetry was successfully logged
    """
    # Create a unique identifier for this telemetry event
    event_id = f"telemetry-{int(time.time())}-{name}-{target_name}"
    
    # Enrich the payload with additional diagnostic information
    payload = {
        "event_id": event_id,
        "driftguard": name,
        "namespace": namespace,
        "targetKind": target_kind,
        "targetName": target_name,
        "status": status,
        "timestamp": kopf.now().isoformat(),
        "environment": os.environ.get("ENVIRONMENT", "production"),
        "operator_version": os.environ.get("OPERATOR_VERSION", "unknown"),
        "node": os.environ.get("NODE_NAME", "unknown"),
        "cluster": os.environ.get("CLUSTER_NAME", "unknown")
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-Event-ID": event_id,
        "X-Source": "driftguard-operator"
    }
    
    # First, try to write to local backup in case the remote endpoint is unavailable
    try:
        # Ensure the telemetry directory exists
        telemetry_dir = os.environ.get("TELEMETRY_BACKUP_DIR", "/tmp/driftguard-telemetry")
        os.makedirs(telemetry_dir, exist_ok=True)
        
        # Write to a local file as backup
        backup_path = f"{telemetry_dir}/{event_id}.json"
        with open(backup_path, 'w') as f:
            json.dump(payload, f)
    except Exception as backup_err:
        logger.warning(f"Could not write telemetry backup: {backup_err}")
    
    # Try to send to the remote endpoint with retries
    max_retries = 3
    retry_delay = 1  # seconds
    success = False
    
    for attempt in range(max_retries):
        try:
            # Using async HTTP client for non-blocking operation
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    TELEMETRY_ENDPOINT, 
                    json=payload, 
                    headers=headers, 
                    timeout=5
                ) as response:
                    if response.status < 400:
                        # Request succeeded
                        logger.info(f"Telemetry logged successfully: {event_id}")
                        success = True
                        
                        # Clean up any backup file if the request was successful
                        try:
                            if os.path.exists(backup_path):
                                os.remove(backup_path)
                        except Exception:
                            pass  # Ignore cleanup errors
                            
                        break
                    else:
                        # Server error
                        response_text = await response.text()
                        logger.warning(
                            f"Telemetry API returned error (attempt {attempt+1}/{max_retries}): "
                            f"Status {response.status}, Response: {response_text[:100]}..."
                        )
        except aiohttp.ClientError as e:
            # Network error, retry
            logger.warning(f"Telemetry network error (attempt {attempt+1}/{max_retries}): {e}")
        except Exception as e:
            # Unexpected error
            logger.error(f"Telemetry unexpected error (attempt {attempt+1}/{max_retries}): {e}")
        
        # Wait before retrying (except on the last attempt)
        if attempt < max_retries - 1:
            await asyncio.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
    
    if not success:
        logger.error(f"Telemetry logging failed after {max_retries} attempts for event {event_id}")
        
        # Schedule a background task to retry sending failed telemetry later
        asyncio.create_task(retry_failed_telemetry(backup_path))
    
    return success

async def retry_failed_telemetry(backup_path: str) -> None:
    """
    Background task to retry sending failed telemetry
    
    Args:
        backup_path: Path to the backup file containing the telemetry data
    """
    # Wait some time before retrying (e.g., 5 minutes)
    await asyncio.sleep(300)
    
    try:
        # Check if the file still exists (hasn't been processed by another task)
        if not os.path.exists(backup_path):
            return
            
        # Load the telemetry data from the backup file
        with open(backup_path, 'r') as f:
            payload = json.load(f)
            
        # Extract event ID from the payload
        event_id = payload.get("event_id", "unknown")
        
        # Try to send the telemetry again
        headers = {
            "Content-Type": "application/json",
            "X-Event-ID": event_id,
            "X-Source": "driftguard-operator",
            "X-Retry": "true"
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                TELEMETRY_ENDPOINT, 
                json=payload, 
                headers=headers, 
                timeout=10  # Longer timeout for retries
            ) as response:
                if response.status < 400:
                    logger.info(f"Retry telemetry logged successfully: {event_id}")
                    # Remove the backup file
                    os.remove(backup_path)
                else:
                    logger.warning(f"Retry telemetry failed: Status {response.status} for {event_id}")
    except Exception as e:
        logger.error(f"Retry telemetry error: {e}")

async def log_remediation_telemetry(
    transaction_id: str,
    kind: str,
    name: str,
    namespace: str,
    success: bool,
    details: str
) -> None:
    """
    Log telemetry specifically for remediation operations
    
    Args:
        transaction_id: Unique identifier for this remediation transaction
        kind: Resource kind
        name: Resource name
        namespace: Resource namespace
        success: Whether remediation was successful
        details: Additional details about the remediation
    """
    try:
        remediation_endpoint = os.environ.get(
            "REMEDIATION_TELEMETRY_ENDPOINT", 
            f"{TELEMETRY_ENDPOINT}/remediation"
        )
        
        payload = {
            "transaction_id": transaction_id,
            "kind": kind,
            "name": name,
            "namespace": namespace,
            "success": success,
            "details": details,
            "timestamp": kopf.now().isoformat(),
            "operator_version": os.environ.get("OPERATOR_VERSION", "unknown")
        }
        
        headers = {
            "Content-Type": "application/json",
            "X-Transaction-ID": transaction_id,
            "X-Source": "driftguard-operator"
        }
        
        # Using async HTTP client for non-blocking operation
        async with aiohttp.ClientSession() as session:
            async with session.post(
                remediation_endpoint, 
                json=payload, 
                headers=headers, 
                timeout=5
            ) as response:
                if response.status >= 400:
                    logger.warning(f"Remediation telemetry API returned error: {response.status}")
    except Exception as e:
        logger.error(f"Remediation telemetry logging failed: {e}")

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