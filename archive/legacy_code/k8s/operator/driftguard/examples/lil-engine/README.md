# TerraFusion DriftGuard for Location Intelligence Layer (LIL) Engine

This directory contains example configurations for protecting the TerraFusion Location Intelligence Layer (LIL) Engine with DriftGuard.

## Overview

The Location Intelligence Layer (LIL) Engine is a core component of the TerraFusion platform that computes location-based valuation influence scores. These scores are critical for accurate property valuations, and their calculation depends on carefully calibrated weights and parameters.

The LIL Engine relies on a configuration that specifies:
- POI buffer distances for accessibility calculations
- NDVI thresholds for vegetation analysis
- Entropy radius for land use diversity computation
- Relative weights for different spatial factors

Any unauthorized changes to these parameters could significantly impact valuation results and lead to inconsistent assessments.

## Implementation

The implementation consists of:

1. **ConfigMap**: Contains the LIL Engine configuration in JSON format
2. **DriftGuard**: Protects the ConfigMap from unauthorized changes
3. **Deployment**: References the ConfigMap and deploys the LIL Engine

## Files

- `lil-config.yaml`: ConfigMap containing the LIL Engine configuration
- `lil-config-guard.yaml`: DriftGuard resource protecting the configuration
- `lil-engine-deployment.yaml`: Kubernetes Deployment for the LIL Engine
- `generate_hash.sh`: Utility script to generate SHA-256 hash for configuration validation

## Deployment Instructions

1. Apply the ConfigMap:
   ```
   kubectl apply -f lil-config.yaml
   ```

2. Apply the DriftGuard:
   ```
   kubectl apply -f lil-config-guard.yaml
   ```

3. Deploy the LIL Engine:
   ```
   kubectl apply -f lil-engine-deployment.yaml
   ```

## Monitoring

Once deployed, you can monitor the DriftGuard status:

```
kubectl get driftguards -n terrafusion-system
```

You should see output similar to:

```
NAME                       STATUS    AGE   LAST-CHECK        HASH-STATUS   REMEDIATION-COUNT
lil-weights-config-guard   Healthy   10m   2025-05-15T12:30  Valid         0
```

## Making Authorized Changes

To make authorized changes to the LIL Engine configuration:

1. Update the `lil-config.yaml` file with new parameters
2. Generate a new hash using the `generate_hash.sh` script
3. Update the `expectedHash` field in `lil-config-guard.yaml`
4. Apply both files:
   ```
   kubectl apply -f lil-config.yaml
   kubectl apply -f lil-config-guard.yaml
   ```

This ensures that all changes are properly tracked and authorized.

## Integration with LIL Engine

The LIL Engine Python script loads configuration from the ConfigMap at the path specified by the `LIL_CONFIG_PATH` environment variable. The DriftGuard operator ensures that this configuration remains consistent and prevents unauthorized changes that could impact valuation accuracy.