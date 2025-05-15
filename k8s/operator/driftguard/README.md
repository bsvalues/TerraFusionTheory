# TerraFusion DriftGuard Operator

## Overview

DriftGuard is a Kubernetes operator for detecting and remediating configuration drift in TerraFusion resources. Built on the [Kopf](https://github.com/nolar/kopf) (Kubernetes Operator Pythonic Framework), it provides enterprise-grade protection against unauthorized configuration changes.

![DriftGuard Architecture](./docs/driftguard-architecture.png)

## Key Features

- **Configuration Drift Detection**: Continuously monitors resources for unauthorized changes
- **Automatic Remediation**: Restores resources to their expected state (when enabled)
- **Multi-Source Fallback**: Uses multiple configuration sources to ensure resilience
- **Enhanced Telemetry**: Provides detailed logging with transaction tracking
- **Comprehensive Audit Trail**: Records all drift events and remediation actions
- **Resource Protection**: Supports ConfigMaps, Secrets, and GAMA configuration resources

## How It Works

DriftGuard uses SHA-256 hashing to detect configuration drift:

1. When a DriftGuard resource is created, it stores the expected hash of the target resource configuration
2. Periodically, it computes the current hash of the target resource
3. If the hashes don't match, it detects drift and can automatically restore the expected configuration
4. All events are logged with detailed metadata for audit and compliance purposes

## Architecture

DriftGuard consists of several components:

- **DriftGuard Operator**: The main Kubernetes operator that watches for DriftGuard resources
- **Configuration Service**: A central source of truth for approved configurations
- **Telemetry Service**: Records all drift events and remediation actions

## Prerequisites

- Kubernetes 1.16+
- Python 3.8+
- Kopf 1.35+
- Access to create CustomResourceDefinitions (CRDs)

## Installation

### Using Kubernetes Manifests

```bash
# Apply the CRD
kubectl apply -f crds/driftguard.yaml

# Create the namespace if it doesn't exist
kubectl create namespace terrafusion-system

# Apply the deployment
kubectl apply -f deployment.yaml
```

### Verifying the Installation

```bash
# Check if the operator is running
kubectl get pods -n terrafusion-system -l app=driftguard-operator

# Check if the configuration service is running
kubectl get pods -n terrafusion-system -l app=config-service

# Verify the CRD was installed correctly
kubectl get crds | grep driftguards.terrafusion.ai
```

## Usage

### Creating a DriftGuard

```yaml
apiVersion: terrafusion.ai/v1
kind: DriftGuard
metadata:
  name: gama-valuation-model-guard
  namespace: terrafusion-system
spec:
  targetKind: GAMAConfig
  targetName: gama-valuation-model
  targetNamespace: terrafusion-system
  expectedHash: "8a7b4a9f6e5d2c1b0a9e8d7c6b5a4f3e2d1c0b9a8e7d6c5b4a3f2e1d0c9b8a7f"
  autoRemediate: true
  maxFailuresBeforeAlert: 2
  sourceOfTruthRef:
    kind: service
    name: terrafusion-config-service
    namespace: terrafusion-system
    path: /configurations/gama/gama-valuation-model
```

### Monitoring Status

```bash
# List all DriftGuards
kubectl get driftguards -n terrafusion-system

# Get detailed status of a specific DriftGuard
kubectl describe driftguard gama-valuation-model-guard -n terrafusion-system
```

## Configuration

### DriftGuard Specification

| Field | Description | Type | Required | Default |
|-------|-------------|------|----------|---------|
| `targetKind` | Kind of resource to monitor | string | Yes | - |
| `targetName` | Name of the resource to monitor | string | Yes | - |
| `targetNamespace` | Namespace of the resource | string | No | DriftGuard's namespace |
| `expectedHash` | Expected SHA-256 hash of the configuration | string | Yes | - |
| `autoRemediate` | Automatically remediate drift when detected | boolean | No | false |
| `maxFailuresBeforeAlert` | Number of failures before triggering alert | integer | No | 3 |
| `sourceOfTruthRef` | Reference to source of truth for remediation | object | No | - |

### Source of Truth Reference

| Field | Description | Type | Required |
|-------|-------------|------|----------|
| `kind` | Type of source ("git", "configmap", "secret", "service") | string | Yes |
| `name` | Name of the source | string | Yes |
| `namespace` | Namespace of the source | string | No |
| `path` | Path within the source | string | No |

## Security Considerations

### RBAC Permissions

DriftGuard requires certain RBAC permissions to function correctly:

- `get`, `list`, `watch` permissions on the resources it monitors
- `update`, `patch` permissions for remediation
- `create` permissions for events

Review the `deployment.yaml` file for the complete RBAC configuration.

### Secret Management

For sensitive resources (like Secrets), consider:

- Using a more restrictive `maxFailuresBeforeAlert` (e.g., 1)
- Setting up immediate alerting when drift is detected
- Using a reference Secret in a more restricted namespace as the source of truth

## Examples

The `examples/` directory contains sample DriftGuard resources for various use cases:

- `gama-config-guard.yaml`: Protects GAMA valuation model configurations
- `configmap-guard.yaml`: Protects a ConfigMap with market settings
- `secret-guard.yaml`: Protects database credentials stored in a Secret

## Troubleshooting

### Common Issues

1. **DriftGuard operator pod not starting**:
   - Check logs: `kubectl logs -n terrafusion-system -l app=driftguard-operator`
   - Verify RBAC permissions: `kubectl describe clusterrole driftguard-operator`

2. **Configuration drift not detected**:
   - Verify the expected hash is correct
   - Check if the operator has permissions to access the target resource

3. **Remediation failing**:
   - Verify source of truth is accessible
   - Check if the operator has permissions to update the target resource

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](../../LICENSE) file for details.

## Acknowledgments

- [Kopf](https://github.com/nolar/kopf) - Kubernetes Operator Pythonic Framework
- [Kubernetes Python Client](https://github.com/kubernetes-client/python) - Official Kubernetes Python client