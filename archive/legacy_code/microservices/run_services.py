"""
Microservices Runner

This script is a lightweight wrapper around init_and_run.py, making it easier
to start and stop microservices without remembering command line arguments.

It also includes pre-configured commands for common operations.
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

def run_command(command):
    """Run a command and print output"""
    print(f"Running: {' '.join(command)}")
    result = subprocess.run(command, capture_output=True, text=True)
    
    if result.stdout:
        print(result.stdout)
    
    if result.stderr:
        print(f"Error: {result.stderr}", file=sys.stderr)
    
    return result.returncode

def install_dependencies():
    """Install required Python dependencies"""
    packages = [
        "fastapi", 
        "uvicorn", 
        "sqlalchemy", 
        "psycopg2-binary", 
        "pandas", 
        "scikit-learn",
        "pydantic"
    ]
    
    print("\n1. Installing Python dependencies...")
    for package in packages:
        print(f"Installing {package}...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-U", package], 
                       capture_output=True)
    
    print("All dependencies installed.")

def check_database():
    """Check if the database is accessible"""
    print("\n2. Checking database connection...")
    try:
        # Import here to avoid errors if dependencies aren't installed
        from microservices.common.db_init import get_db_session
        
        # Get a session and try a simple query
        session = get_db_session()
        session.execute("SELECT 1")
        session.close()
        
        print("Database connection successful!")
        return True
        
    except Exception as e:
        print(f"Database connection failed: {e}")
        print("\nMake sure PostgreSQL is running and the environment variables are set:")
        print("  - DATABASE_URL or PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT")
        return False

def init_database():
    """Initialize the database schema and sample data"""
    print("\n3. Initializing database...")
    
    # Use init_and_run.py to initialize the database
    result = run_command([sys.executable, "microservices/init_and_run.py", "--init-db"])
    
    if result == 0:
        print("Database initialization complete!")
        return True
    else:
        print("Database initialization failed.")
        return False

def start_all_services():
    """Start all microservices"""
    print("\n4. Starting all microservices...")
    
    # Use init_and_run.py to start all services
    result = run_command([sys.executable, "microservices/init_and_run.py", "--start"])
    
    if result == 0:
        print("All microservices started!")
        return True
    else:
        print("Failed to start all microservices.")
        return False

def start_service(service_name):
    """Start a specific microservice"""
    print(f"\nStarting {service_name} microservice...")
    
    # Use init_and_run.py to start a specific service
    result = run_command([
        sys.executable, 
        "microservices/init_and_run.py", 
        "--start", 
        "--service", 
        service_name
    ])
    
    if result == 0:
        print(f"{service_name} microservice started!")
        return True
    else:
        print(f"Failed to start {service_name} microservice.")
        return False

def stop_all_services():
    """Stop all microservices"""
    print("\nStopping all microservices...")
    
    # Use init_and_run.py to stop all services
    result = run_command([sys.executable, "microservices/init_and_run.py", "--stop"])
    
    if result == 0:
        print("All microservices stopped!")
        return True
    else:
        print("Failed to stop all microservices.")
        return False

def setup_and_start():
    """Complete setup process and start all services"""
    print("==== IntelligentEstate Microservices Setup and Start ====")
    
    install_dependencies()
    
    if not check_database():
        print("\nDatabase check failed. Do you want to continue with initialization? (y/n)")
        if input().lower() != 'y':
            return False
    
    if not init_database():
        print("\nDatabase initialization failed. Cannot continue.")
        return False
    
    if not start_all_services():
        print("\nFailed to start microservices.")
        return False
    
    print("\n==== Setup Complete ====")
    print("All microservices are running.")
    print("API documentation is available at:")
    print("  - Property API:   http://localhost:8001/docs")
    print("  - Market API:     http://localhost:8002/docs")
    print("  - Spatial API:    http://localhost:8003/docs")
    print("  - Analytics API:  http://localhost:8004/docs")
    
    return True

def check_services_status():
    """Check the status of all services"""
    print("\nChecking microservices status...")
    
    # Use init_and_run.py to check status
    run_command([sys.executable, "microservices/init_and_run.py", "--status"])

def check_services_health():
    """Check the health of all services"""
    print("\nChecking microservices health...")
    
    # Use init_and_run.py to check health
    run_command([sys.executable, "microservices/init_and_run.py", "--health"])

def main():
    """Main entry point for script"""
    parser = argparse.ArgumentParser(
        description="IntelligentEstate Microservices Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python microservices/run_services.py setup        # Setup and start all services
  python microservices/run_services.py start        # Start all services
  python microservices/run_services.py start-one property   # Start property service
  python microservices/run_services.py stop         # Stop all services
  python microservices/run_services.py status       # Check status
  python microservices/run_services.py health       # Check health
  python microservices/run_services.py init-db      # Initialize database
        """
    )
    
    # Available commands
    commands = parser.add_subparsers(dest="command", help="Command to run")
    
    # Setup command
    commands.add_parser("setup", help="Complete setup and start all services")
    
    # Start command
    commands.add_parser("start", help="Start all services")
    
    # Start one service command
    start_one_cmd = commands.add_parser("start-one", help="Start a specific service")
    start_one_cmd.add_argument("service", choices=["property", "market", "spatial", "analytics"], 
                              help="Service to start")
    
    # Stop command
    commands.add_parser("stop", help="Stop all services")
    
    # Status command
    commands.add_parser("status", help="Check status of all services")
    
    # Health command
    commands.add_parser("health", help="Check health of all services")
    
    # Init database command
    commands.add_parser("init-db", help="Initialize database")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Handle no command
    if not args.command:
        parser.print_help()
        return
    
    # Execute the requested command
    if args.command == "setup":
        setup_and_start()
    elif args.command == "start":
        start_all_services()
    elif args.command == "start-one":
        start_service(args.service)
    elif args.command == "stop":
        stop_all_services()
    elif args.command == "status":
        check_services_status()
    elif args.command == "health":
        check_services_health()
    elif args.command == "init-db":
        init_database()
    else:
        parser.print_help()

if __name__ == "__main__":
    main()