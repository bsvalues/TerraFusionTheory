#!/usr/bin/env python3
"""
LIL Engine Configuration Validator

This script verifies that the LIL Engine configuration matches the expected hash.
It's designed to run at LIL Engine startup to ensure configuration integrity.

Usage:
  python lil_config_validator.py [--config-path CONFIG_PATH]
"""

import argparse
import hashlib
import json
import os
import sys
import requests


def compute_hash(config_data):
    """
    Compute SHA-256 hash of the configuration data
    
    Args:
        config_data: The JSON configuration data as a string
    
    Returns:
        str: The SHA-256 hash of the configuration
    """
    return hashlib.sha256(config_data.encode('utf-8')).hexdigest()


def get_expected_hash(namespace, name):
    """
    Get the expected hash from the DriftGuard operator
    
    Args:
        namespace: The namespace of the DriftGuard
        name: The name of the DriftGuard
    
    Returns:
        str: The expected hash or None if not found
    """
    try:
        # Try to get the DriftGuard status from the operator API
        url = f"http://driftguard-operator.{namespace}.svc.cluster.local/api/v1/driftguards/{namespace}/{name}"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("expectedHash")
    except Exception as e:
        print(f"WARNING: Could not fetch expected hash from DriftGuard API: {e}")
    
    return None


def verify_config_integrity(config_path, expected_hash=None, namespace=None, guard_name=None):
    """
    Verify the configuration file integrity against the expected hash
    
    Args:
        config_path: Path to the configuration file
        expected_hash: Expected SHA-256 hash (optional)
        namespace: Namespace of the DriftGuard (optional)
        guard_name: Name of the DriftGuard (optional)
    
    Returns:
        bool: True if configuration is valid, False otherwise
    """
    try:
        # Read the configuration file
        with open(config_path, 'r') as f:
            config_data = f.read()
        
        # Calculate the hash
        actual_hash = compute_hash(config_data)
        
        # If expected hash is not provided, try to get it from the operator
        if not expected_hash and namespace and guard_name:
            expected_hash = get_expected_hash(namespace, guard_name)
        
        # If we still don't have an expected hash, we can't verify
        if not expected_hash:
            print("WARNING: No expected hash available, skipping verification")
            return True
        
        # Compare the hashes
        if actual_hash == expected_hash:
            print(f"SUCCESS: Configuration hash verified: {actual_hash}")
            return True
        else:
            print(f"ERROR: Configuration hash mismatch!")
            print(f"  - Actual:   {actual_hash}")
            print(f"  - Expected: {expected_hash}")
            return False
    
    except Exception as e:
        print(f"ERROR: Failed to verify configuration: {e}")
        return False


def parse_args():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(description="LIL Engine Configuration Validator")
    
    parser.add_argument("--config-path", default=os.environ.get("LIL_CONFIG_PATH", "./lil_weights_config.json"),
                        help="Path to the configuration file")
    
    parser.add_argument("--expected-hash", default=os.environ.get("LIL_CONFIG_EXPECTED_HASH"),
                        help="Expected SHA-256 hash of the configuration")
    
    parser.add_argument("--namespace", default=os.environ.get("NAMESPACE", "terrafusion-system"),
                        help="Namespace of the DriftGuard")
    
    parser.add_argument("--guard-name", default=os.environ.get("DRIFTGUARD_NAME", "lil-weights-config-guard"),
                        help="Name of the DriftGuard")
    
    parser.add_argument("--fail-on-mismatch", action="store_true",
                        help="Exit with non-zero code if hashes don't match")
    
    return parser.parse_args()


def main():
    """Main entry point"""
    args = parse_args()
    
    print(f"Verifying configuration integrity: {args.config_path}")
    
    # Verify configuration integrity
    valid = verify_config_integrity(
        config_path=args.config_path,
        expected_hash=args.expected_hash,
        namespace=args.namespace,
        guard_name=args.guard_name
    )
    
    # Exit with appropriate code based on verification result
    if not valid and args.fail_on_mismatch:
        print("Exiting due to configuration integrity failure")
        sys.exit(1)


if __name__ == "__main__":
    main()