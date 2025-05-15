# DriftGuard - LIL Engine Integration Guide

This guide explains how to integrate the TerraFusion Location Intelligence Layer (LIL) Engine with DriftGuard to ensure configuration integrity and prevent unauthorized changes to critical valuation parameters.

## Why Protect the LIL Engine?

The LIL Engine is a core component of TerraFusion's spatial analysis pipeline that:

1. Computes location-based influence scores for property valuation
2. Uses carefully calibrated weights that directly impact assessment outcomes
3. Requires consistent configuration to maintain valuation equity across jurisdictions

Unauthorized changes to these parameters could lead to:
- Inconsistent valuations
- Assessment challenges
- Regulatory compliance issues
- Loss of public trust in the assessment process

## Integration Steps

### 1. Prepare the LIL Engine for DriftGuard Protection

Modify your LIL Engine application to load configuration from a standard location:

```python
# Load config from DriftGuard-protected ConfigMap
import os
import json

CONFIG_PATH = os.environ.get("LIL_CONFIG_PATH", "./lil_weights_config.json")

def load_config():
    with open(CONFIG_PATH, "r") as f:
        return json.load(f)

CONFIG = load_config()
```

### 2. Deploy the ConfigMap

Create a ConfigMap containing your LIL Engine configuration:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: lil-weights-config
  namespace: terrafusion-system
data:
  lil_weights_config.json: |
    {
      "poi_buffer_distances": [250, 500, 1000],
      "ndvi_threshold": 0.3, 
      "entropy_radius": 300,
      "score_weights": {
        "poi_score": 0.4,
        "entropy_score": 0.3,
        "viewshed_score": 0.3
      }
    }
```

### 3. Generate a Hash of the Configuration

Use the provided script to generate a SHA-256 hash of your configuration:

```bash
./generate_hash.sh
```

This will output a hash like:
```
SHA-256 hash for LIL weights configuration:
d9fd73529604cde803aedecc78a0142c5b4823e019dbeefdc6072b9423b7fde9
```

### 4. Create a DriftGuard Resource

Create a DriftGuard resource to protect your configuration:

```yaml
apiVersion: terrafusion.ai/v1
kind: DriftGuard
metadata:
  name: lil-weights-config-guard
spec:
  targetKind: ConfigMap
  targetName: lil-weights-config
  targetNamespace: terrafusion-system
  expectedHash: "d9fd73529604cde803aedecc78a0142c5b4823e019dbeefdc6072b9423b7fde9"
  autoRemediate: true
  maxFailuresBeforeAlert: 1
  sourceOfTruthRef:
    kind: service
    name: terrafusion-config-service
    namespace: terrafusion-system
    path: /configurations/kubernetes/configmaps/lil-weights-config
```

### 5. Deploy Your LIL Engine

Update your deployment to mount the protected ConfigMap:

```yaml
spec:
  containers:
  - name: lil-engine
    env:
    - name: LIL_CONFIG_PATH
      value: "/etc/terrafusion/config/lil_weights_config.json"
    volumeMounts:
    - name: lil-config
      mountPath: /etc/terrafusion/config
      readOnly: true
  volumes:
  - name: lil-config
    configMap:
      name: lil-weights-config
```

### 6. Verify Protection

After deployment, verify the DriftGuard is properly protecting your configuration:

```bash
kubectl get driftguards -n terrafusion-system
```

## Making Authorized Changes

When you need to update the LIL Engine configuration:

1. Update the ConfigMap YAML file
2. Generate a new hash using the script
3. Update the DriftGuard resource with the new hash
4. Apply both changes together:
   ```bash
   kubectl apply -f lil-config.yaml
   kubectl apply -f lil-config-guard.yaml
   ```

## Handling Configuration Updates

The LIL Engine should reload its configuration when changes occur. This can be implemented using:

1. A file watching mechanism that detects changes to the mounted config file
2. A startup process that checks for updated configuration
3. A webhook that receives notifications from the DriftGuard operator

Example reload logic:

```python
def watch_for_config_changes(config_path, callback):
    """
    Watch for changes to the configuration file and call the callback when changes are detected
    """
    last_modified = os.path.getmtime(config_path)
    
    while True:
        time.sleep(30)  # Check every 30 seconds
        current_modified = os.path.getmtime(config_path)
        
        if current_modified > last_modified:
            print(f"Configuration file changed at {time.ctime(current_modified)}")
            callback()
            last_modified = current_modified

def reload_config():
    """Reload configuration and update running parameters"""
    global CONFIG
    CONFIG = load_config()
    print("Configuration reloaded successfully")

# Start the watcher in a background thread
import threading
threading.Thread(
    target=watch_for_config_changes, 
    args=(CONFIG_PATH, reload_config),
    daemon=True
).start()
```

## Troubleshooting

If you encounter issues with DriftGuard protection:

1. Check DriftGuard status with detailed output:
   ```
   kubectl describe driftguard lil-weights-config-guard -n terrafusion-system
   ```

2. Check DriftGuard operator logs:
   ```
   kubectl logs -l app=driftguard-operator -n terrafusion-system
   ```

3. Verify the ConfigMap is properly mounted:
   ```
   kubectl exec -it <lil-engine-pod> -n terrafusion-system -- cat /etc/terrafusion/config/lil_weights_config.json
   ```

## Security Considerations

- Use RBAC to restrict who can modify ConfigMaps and DriftGuard resources
- Implement audit logging for all configuration changes
- Require approval workflows for configuration updates
- Create backups of known-good configurations