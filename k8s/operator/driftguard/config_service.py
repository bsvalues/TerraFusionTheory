#!/usr/bin/env python3
"""
TerraFusion Configuration Service

This service provides a REST API to manage configuration for TerraFusion components.
It serves as the source of truth for configurations that are monitored by DriftGuard.

For use in the TerraFusion enterprise deployment with GAMA simulation.
"""

import os
import json
import hashlib
import logging
import argparse
from typing import Dict, Any, Optional
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('terrafusion-config-service')

# Configuration store (in-memory for simplicity)
# In a production environment, this would use a database or Git repository
CONFIG_STORE = {
    'gamaconfig': {
        'gama-main': {
            'parameters': {
                'modelType': 'hybrid',
                'coefficients': {
                    'locationFactor': 0.35,
                    'sizeFactor': 0.25,
                    'ageFactor': 0.15,
                    'qualityFactor': 0.25
                },
                'spatialParameters': {
                    'bandwidthType': 'adaptive',
                    'kernelFunction': 'gaussian',
                    'bandwidthValue': 30
                },
                'updateSettings': {
                    'autoRevalidate': True,
                    'revalidationInterval': 30
                }
            },
            'metadata': {
                'version': '1.5.0',
                'lastUpdated': '2025-05-14T00:00:00Z',
                'updatedBy': 'system'
            }
        }
    }
}


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


def get_config(kind: str, name: str) -> Optional[Dict]:
    """
    Get configuration by kind and name
    
    Args:
        kind: Config kind (gamaconfig, etc.)
        name: Config name
        
    Returns:
        Optional[Dict]: Configuration if found, None otherwise
    """
    kind = kind.lower()
    if kind in CONFIG_STORE and name in CONFIG_STORE[kind]:
        return CONFIG_STORE[kind][name]
    return None


def update_config(kind: str, name: str, config: Dict) -> bool:
    """
    Update configuration by kind and name
    
    Args:
        kind: Config kind (gamaconfig, etc.)
        name: Config name
        config: New configuration
        
    Returns:
        bool: True if update was successful, False otherwise
    """
    kind = kind.lower()
    if kind not in CONFIG_STORE:
        CONFIG_STORE[kind] = {}
    
    CONFIG_STORE[kind][name] = config
    return True


class ConfigHandler(BaseHTTPRequestHandler):
    """HTTP request handler for configuration service"""
    
    def do_GET(self):
        """Handle GET requests to retrieve configurations"""
        # Parse path to get configuration kind and name
        parts = self.path.strip('/').split('/')
        
        if len(parts) >= 3 and parts[0] == 'configurations':
            kind = parts[1]
            name = parts[2]
            
            config = get_config(kind, name)
            if config:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(config).encode('utf-8'))
            else:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': f'Configuration {kind}/{name} not found'
                }).encode('utf-8'))
        elif self.path == '/healthz':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'healthy')
        elif self.path == '/configurations':
            # List all available configurations
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            result = {}
            for kind, configs in CONFIG_STORE.items():
                result[kind] = list(configs.keys())
            
            self.wfile.write(json.dumps(result).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Not found'
            }).encode('utf-8'))
    
    def do_POST(self):
        """Handle POST requests to create configurations"""
        if self.path == '/configurations':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            
            try:
                data = json.loads(post_data)
                if 'kind' in data and 'name' in data and 'config' in data:
                    kind = data['kind']
                    name = data['name']
                    config = data['config']
                    
                    if update_config(kind, name, config):
                        self.send_response(201)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        
                        # Return the hash for the new configuration
                        hash_value = compute_hash(config)
                        self.wfile.write(json.dumps({
                            'status': 'created',
                            'hash': hash_value
                        }).encode('utf-8'))
                    else:
                        self.send_response(500)
                        self.send_header('Content-Type', 'application/json')
                        self.end_headers()
                        self.wfile.write(json.dumps({
                            'error': 'Failed to update configuration'
                        }).encode('utf-8'))
                else:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': 'Missing required fields: kind, name, config'
                    }).encode('utf-8'))
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Invalid JSON'
                }).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Not found'
            }).encode('utf-8'))
    
    def do_PUT(self):
        """Handle PUT requests to update configurations"""
        parts = self.path.strip('/').split('/')
        
        if len(parts) >= 3 and parts[0] == 'configurations':
            kind = parts[1]
            name = parts[2]
            
            content_length = int(self.headers['Content-Length'])
            put_data = self.rfile.read(content_length).decode('utf-8')
            
            try:
                config = json.loads(put_data)
                if update_config(kind, name, config):
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    
                    # Return the hash for the updated configuration
                    hash_value = compute_hash(config)
                    self.wfile.write(json.dumps({
                        'status': 'updated',
                        'hash': hash_value
                    }).encode('utf-8'))
                else:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': 'Failed to update configuration'
                    }).encode('utf-8'))
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Invalid JSON'
                }).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': 'Not found'
            }).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Override log_message to use our logger"""
        logger.info("%s - - %s" % (self.address_string(), format % args))


def run_server(host='0.0.0.0', port=8000):
    """Run the configuration service HTTP server"""
    server_address = (host, port)
    httpd = HTTPServer(server_address, ConfigHandler)
    logger.info(f'Starting configuration service on {host}:{port}')
    httpd.serve_forever()


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='TerraFusion Configuration Service')
    parser.add_argument('--host', default='0.0.0.0', help='Server host (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=8000, help='Server port (default: 8000)')
    return parser.parse_args()


def main():
    """Main entry point"""
    args = parse_arguments()
    run_server(args.host, args.port)


if __name__ == '__main__':
    main()