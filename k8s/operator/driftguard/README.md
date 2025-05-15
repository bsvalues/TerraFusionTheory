# TerraFusion DriftGuard Operator

The DriftGuard Operator is a Kubernetes operator that monitors resources for configuration drift and can automatically remediate unauthorized changes. It's an essential component for maintaining system integrity in enterprise environments.

## Overview

DriftGuard uses a hash-based approach to detect unauthorized changes to Kubernetes resources, including:

- ConfigMaps
- Secrets
- Deployments
- Custom Resources (like GAMAConfig)

When drift is detected, DriftGuard can automatically restore resources to their expected state, ensuring consistent system operation.

## Architecture

The DriftGuard system consists of several components:

1. **DriftGuard Operator**: Kubernetes operator running the main drift detection logic
2. **Configuration Service**: Source-of-truth for configurations
3. **CRDs**: Custom Resource Definitions for the DriftGuard resources
4. **Telemetry Service**: Collects drift detection events for monitoring and analysis

## Installation

### Prerequisites

- Kubernetes cluster (v1.16+)
- kubectl configured to manage the cluster
- Helm (optional for chart-based installation)

### Option 1: Direct Installation

Apply the CRDs and deployment manifests:

```bash
# Create namespace
kubectl create namespace terrafusion-system

# Deploy CRDs
kubectl apply -f crds/

# Deploy operator
kubectl apply -f deployment.yaml

# Deploy configuration service
kubectl apply -f config-service-deployment.yaml
```

### Option 2: Helm Installation (Coming Soon)

```bash
helm repo add terrafusion https://charts.terrafusion.ai
helm install driftguard terrafusion/driftguard-operator -n terrafusion-system
```

## Usage

### Creating a DriftGuard Resource

A DriftGuard resource defines what to monitor and how to respond to drift:

```yaml
apiVersion: terrafusion.ai/v1
kind: DriftGuard
metadata:
  name: example-configmap-guard
  namespace: default
spec:
  targetKind: ConfigMap
  targetName: my-config
  # SHA-256 hash of the expected configuration
  expectedHash: "8a7b4a9f6e5d2c1b0a9e8d7c6b5a4f3e2d1c0b9a8e7d6c5b4a3f2e1d0c9b8a7"
  autoRemediate: true
  maxFailuresBeforeAlert: 3
  sourceOfTruthRef:
    kind: git
    name: terrafusion-configs
    namespace: default
    path: /configs/my-config.yaml
```

### Computing Config Hashes

The `expectedHash` is a SHA-256 hash of the configuration data. You can compute it with tools like:

```bash
# For a ConfigMap
kubectl get configmap my-config -o json | jq -S '.data' | sha256sum

# For a GAMAConfig (custom resource)
kubectl get gamaconfig my-gama-config -o json | jq -S '.spec.parameters' | sha256sum
```

The DriftGuard Configuration Service can also compute hashes for you:

```bash
curl -X POST http://terrafusion-update-service/configurations \
  -H "Content-Type: application/json" \
  -d '{"kind":"gamaconfig","name":"gama-main","config":{...}}'
```

## GAMA Integration

TerraFusion's GAMA simulation system uses DriftGuard to ensure valuation model integrity:

1. The GAMA model parameters are stored in GAMAConfig custom resources
2. DriftGuard monitors these resources for unauthorized changes 
3. The Configuration Service provides the source of truth for valid configurations
4. Auto-remediation ensures consistency across instances

## Troubleshooting

### Common Issues

- **DriftGuard not detecting changes**: Verify the hash computation matches the resource structure
- **Auto-remediation failing**: Check the sourceOfTruthRef configuration
- **Operator pods not running**: Check RBAC permissions

### Logs

```bash
kubectl logs -n terrafusion-system -l app=driftguard-operator
```

## Security Considerations

- The DriftGuard operator requires permissions to read and update resources it monitors
- RBAC should be configured to limit DriftGuard to only necessary resources
- Changes to DriftGuard resources should be audited to prevent tampering with security controls

## Integration with CI/CD

DriftGuard works alongside CI/CD pipelines by:

1. Computing expected hashes during the build process
2. Updating DriftGuard resources after successful deployments
3. Alerting when unauthorized changes occur between deployments

See the TerraFusion CI/CD documentation for more details on pipeline integration.

## Contributing

Contributions to DriftGuard are welcome! Please see our [contributing guidelines](../../CONTRIBUTING.md) for more information.

## License

TerraFusion DriftGuard is licensed under the Apache 2.0 license.