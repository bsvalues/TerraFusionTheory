"""
Microservices Initialization and Runner

This script initializes the database and starts all microservices.
It handles:
1. Database connection and initialization
2. Sample data creation (in development mode)
3. Starting all microservices in separate processes
"""

import os
import sys
import time
import signal
import subprocess
import argparse
from pathlib import Path
import json
from datetime import datetime

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database initialization module
from microservices.common.db_init import init_db, create_sample_data

# Default port assignments
DEFAULT_PORTS = {
    "property": 8001,
    "market": 8002,
    "spatial": 8003,
    "analytics": 8004
}

# Microservice process tracking
processes = {}

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully by stopping all processes"""
    print("\nShutting down all microservices...")
    stop_all()
    sys.exit(0)

def start_service(service_name, port=None):
    """Start a microservice"""
    if service_name in processes and processes[service_name].poll() is None:
        print(f"Service {service_name} is already running")
        return

    if port is None:
        port = DEFAULT_PORTS.get(service_name)
        if port is None:
            print(f"No default port defined for {service_name}")
            return

    # Set environment variables for the process
    env = os.environ.copy()
    env["PORT"] = str(port)
    
    # Build the command to run the service
    module_path = f"microservices.{service_name}.app"
    command = [sys.executable, "-m", "uvicorn", f"{module_path}:app", "--host", "0.0.0.0", "--port", str(port), "--reload"]
    
    # Create log directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Prepare log file
    log_file = logs_dir / f"{service_name}_service.log"
    log_file_handle = open(log_file, "a")
    
    # Print timestamp at the start of the log
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_file_handle.write(f"\n\n===== SERVICE START: {timestamp} =====\n\n")
    log_file_handle.flush()
    
    # Start the process
    print(f"Starting {service_name} service on port {port}...")
    process = subprocess.Popen(
        command,
        stdout=log_file_handle,
        stderr=subprocess.STDOUT,
        env=env
    )
    
    # Store the process and log file handle
    processes[service_name] = process
    print(f"{service_name} service started with PID {process.pid}")
    
    return process

def stop_service(service_name):
    """Stop a microservice"""
    if service_name in processes:
        process = processes[service_name]
        if process.poll() is None:  # Process is still running
            print(f"Stopping {service_name} service (PID {process.pid})...")
            try:
                # Try to terminate gracefully first
                process.terminate()
                # Wait for up to 5 seconds
                for _ in range(10):
                    if process.poll() is not None:
                        break
                    time.sleep(0.5)
                    
                # If still running, kill it
                if process.poll() is None:
                    process.kill()
                    process.wait()
                    
                print(f"{service_name} service stopped")
            except Exception as e:
                print(f"Error stopping {service_name} service: {e}")
        else:
            print(f"{service_name} service is not running")
            
        # Remove from processes dict
        del processes[service_name]
    else:
        print(f"No process found for {service_name}")

def stop_all():
    """Stop all microservices"""
    service_names = list(processes.keys())
    for service_name in service_names:
        stop_service(service_name)

def check_service_health(service_name, port=None):
    """Check if a service is healthy by making a request to its health endpoint"""
    import requests
    
    if port is None:
        port = DEFAULT_PORTS.get(service_name)
        if port is None:
            print(f"No default port defined for {service_name}")
            return False
    
    url = f"http://localhost:{port}/health"
    try:
        response = requests.get(url, timeout=2)
        if response.status_code == 200:
            status = response.json().get("status")
            if status == "healthy":
                print(f"{service_name} service is healthy")
                return True
            else:
                print(f"{service_name} service status: {status}")
                return False
        else:
            print(f"{service_name} service health check failed with status {response.status_code}")
            return False
    except requests.RequestException as e:
        print(f"{service_name} service is not responding: {e}")
        return False

def check_all_services_health():
    """Check the health of all running services"""
    results = {}
    for service_name in DEFAULT_PORTS.keys():
        if service_name in processes:
            results[service_name] = check_service_health(service_name)
        else:
            results[service_name] = False
            print(f"{service_name} service is not running")
    
    return results

def display_service_status():
    """Display the status of all services"""
    print("\nService Status:")
    print("-" * 60)
    print(f"{'Service':<15} {'Status':<10} {'PID':<10} {'Port':<10}")
    print("-" * 60)
    
    for service_name, port in DEFAULT_PORTS.items():
        if service_name in processes:
            process = processes[service_name]
            if process.poll() is None:
                status = "RUNNING"
                pid = process.pid
            else:
                status = "STOPPED"
                pid = "-"
        else:
            status = "NOT STARTED"
            pid = "-"
            
        print(f"{service_name:<15} {status:<10} {str(pid):<10} {str(port):<10}")
    
    print("-" * 60)

def init_database():
    """Initialize the database schemas and sample data"""
    print("Initializing database...")
    try:
        # Create tables
        init_db()
        print("Database tables created successfully")
        
        # Create sample data in development mode
        if os.environ.get('ENVIRONMENT', 'development') == 'development':
            create_sample_data()
            print("Sample data created successfully")
        
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

def main():
    """Main function to parse arguments and run commands"""
    parser = argparse.ArgumentParser(description="Manage IntelligentEstate Microservices")
    
    # Commands
    command_group = parser.add_mutually_exclusive_group(required=True)
    command_group.add_argument("--init-db", action="store_true", help="Initialize database only")
    command_group.add_argument("--start", action="store_true", help="Start all services")
    command_group.add_argument("--stop", action="store_true", help="Stop all services")
    command_group.add_argument("--restart", action="store_true", help="Restart all services")
    command_group.add_argument("--status", action="store_true", help="Check status of all services")
    command_group.add_argument("--health", action="store_true", help="Check health of all services")
    
    # Optional service specification
    parser.add_argument("--service", help="Specify a single service to manage")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Handle Ctrl+C gracefully
    signal.signal(signal.SIGINT, signal_handler)
    
    # Process commands
    if args.init_db:
        success = init_database()
        if not success:
            sys.exit(1)
    
    elif args.start:
        if args.service:
            start_service(args.service)
        else:
            # Initialize database before starting services
            success = init_database()
            if not success:
                sys.exit(1)
                
            # Start all services
            for service_name in DEFAULT_PORTS.keys():
                start_service(service_name)
                # Small delay to prevent port conflicts during startup
                time.sleep(1)
            
            # Display status after starting
            display_service_status()
    
    elif args.stop:
        if args.service:
            stop_service(args.service)
        else:
            stop_all()
    
    elif args.restart:
        if args.service:
            stop_service(args.service)
            time.sleep(1)
            start_service(args.service)
        else:
            stop_all()
            time.sleep(1)
            for service_name in DEFAULT_PORTS.keys():
                start_service(service_name)
                time.sleep(1)
            
            # Display status after restarting
            display_service_status()
    
    elif args.status:
        display_service_status()
    
    elif args.health:
        check_all_services_health()

if __name__ == "__main__":
    main()