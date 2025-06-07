"""
Launch Script for IntelligentEstate Platform

This script initializes the database and starts all the microservices.
"""

import os
import sys
import subprocess
import argparse
import time

# Import database initialization
from common.db_init import init_db

def main():
    """Main entry point for the platform startup"""
    parser = argparse.ArgumentParser(description="Launch IntelligentEstate Platform")
    parser.add_argument(
        "--skip-db-init", 
        action="store_true", 
        help="Skip database initialization"
    )
    parser.add_argument(
        "--services", 
        nargs="+", 
        choices=["all", "property", "market", "spatial", "analytics"],
        default=["all"],
        help="Specify which services to run (default: all)"
    )
    
    args = parser.parse_args()
    
    # Initialize the database
    if not args.skip_db_init:
        print("Initializing database...")
        if init_db():
            print("Database initialized successfully!")
        else:
            print("Database initialization failed. Exiting.")
            sys.exit(1)
    
    # Launch the microservices using the run_services.py script
    services_arg = " ".join(args.services)
    cmd = [sys.executable, "run_services.py", "--services"] + args.services
    
    # Run the microservices script
    try:
        print(f"Launching microservices: {services_arg}")
        process = subprocess.Popen(cmd)
        process.wait()
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error launching microservices: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    # Change working directory to the script's directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()