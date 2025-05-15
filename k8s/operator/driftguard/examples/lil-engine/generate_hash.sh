#!/bin/bash
# Script to generate SHA-256 hash for ConfigMap content
# This hash can be used in DriftGuard resources

CONFIG_DATA=$(cat k8s/operator/driftguard/examples/lil-engine/lil-config.yaml | grep -A 100 'lil_weights_config.json:' | tail -n +2 | sed 's/^  //')
HASH=$(echo "$CONFIG_DATA" | sha256sum | awk '{print $1}')

echo "SHA-256 hash for LIL weights configuration:"
echo "$HASH"