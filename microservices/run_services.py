"""
Microservices Runner

This script starts all the microservices for the IntelligentEstate platform
using FastAPI and uvicorn.
"""

import os
import sys
import subprocess
import signal
import time
from typing import List, Dict
import argparse

# Define the microservices
MICROSERVICES = {
    "property": {
        "module": "property.app",
        "port": 8001,
        "description": "Property data and valuations API"
    },
    "market": {
        "module": "market.app",
        "port": 8002,
        "description": "Market metrics and analytics API"
    },
    "spatial": {
        "module": "spatial.app",
        "port": 8003,
        "description": "Geospatial data and mapping API"
    },
    "analytics": {
        "module": "analytics.app",
        "port": 8004,
        "description": "ML and predictive analytics API"
    }
}

# Store running processes
processes: Dict[str, subprocess.Popen] = {}

def signal_handler(sig, frame):
    """Handle Ctrl+C and terminate all processes gracefully"""
    print("\nShutting down all microservices...")
    for name, process in processes.items():
        print(f"Terminating {name} service...")
        process.terminate()
    sys.exit(0)

def start_service(name: str, module: str, port: int) -> subprocess.Popen:
    """Start a microservice using uvicorn"""
    # Convert module path to Python import path
    module_path = module.replace("/", ".")
    
    # Build the command
    cmd = [
        sys.executable, "-m", "uvicorn",
        module_path + ":app",
        "--host", "0.0.0.0",
        "--port", str(port),
        "--reload"
    ]
    
    # Print the command we're running
    print(f"Starting {name} service: {' '.join(cmd)}")
    
    # Run the process
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )
    
    return process

def monitor_processes():
    """Monitor running processes and restart if they fail"""
    while True:
        for name, process in list(processes.items()):
            # Check if process is still running
            if process.poll() is not None:
                # Process has terminated
                return_code = process.returncode
                print(f"Process {name} terminated with code {return_code}")
                
                # Restart the process
                print(f"Restarting {name} service...")
                service_info = MICROSERVICES[name]
                processes[name] = start_service(name, service_info["module"], service_info["port"])
        
        # Sleep to avoid high CPU usage
        time.sleep(1)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run IntelligentEstate microservices")
    parser.add_argument(
        "--services", 
        nargs="+", 
        choices=list(MICROSERVICES.keys()) + ["all"],
        default=["all"],
        help="Specify which services to run (default: all)"
    )
    
    args = parser.parse_args()
    
    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Determine which services to run
    services_to_run = list(MICROSERVICES.keys()) if "all" in args.services else args.services
    
    # Start the specified services
    for name in services_to_run:
        if name in MICROSERVICES:
            service_info = MICROSERVICES[name]
            processes[name] = start_service(name, service_info["module"], service_info["port"])
    
    # Print summary
    print("\nRunning services:")
    for name in processes:
        service_info = MICROSERVICES[name]
        print(f"- {name}: {service_info['description']} (http://localhost:{service_info['port']})")
    
    print("\nPress Ctrl+C to stop all services")
    
    # Monitor and restart processes if they fail
    try:
        monitor_processes()
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()