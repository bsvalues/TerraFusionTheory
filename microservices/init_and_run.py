#!/usr/bin/env python
"""
IntelligentEstate Microservices Initializer and Runner

This script:
1. Initializes the database schema
2. Seeds the database with initial sample data
3. Launches all microservices with proper configuration
"""

import os
import sys
import subprocess
import time
import argparse
import json
from datetime import datetime

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import database initialization
from common.db_init import init_db
from run_services import MICROSERVICES, start_service

def setup_database():
    """Initialize the database schema and seed with initial data"""
    print("\n===== Initializing Database =====")
    
    # Check if DATABASE_URL is set
    if not os.environ.get('DATABASE_URL'):
        print("ERROR: DATABASE_URL environment variable not set!")
        print("Please set DATABASE_URL to a valid PostgreSQL connection string.")
        return False
    
    # Initialize the database schema
    success = init_db()
    if not success:
        print("ERROR: Failed to initialize database schema!")
        return False
    
    print("Database initialization successful!")
    return True

def load_sample_data():
    """Load sample data into the database for testing"""
    print("\n===== Loading Sample Data =====")
    
    # Import required modules
    try:
        from common.db_init import PropertyListing, PropertyValuation, MarketMetrics, SpatialData
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        import pandas as pd
        import json
        from datetime import datetime, timedelta
    except ImportError as e:
        print(f"Error importing modules: {e}")
        return False
    
    # Get database connection
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL environment variable not set!")
        return False
    
    try:
        # Create engine and session
        engine = create_engine(db_url)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Check if we already have data
        existing_properties = session.query(PropertyListing).count()
        if existing_properties > 0:
            print(f"Database already contains {existing_properties} property listings.")
            print("Skipping sample data load.")
            return True
        
        # Create sample property listings
        print("Creating sample property listings...")
        
        # Grandview, WA property data
        property_data = [
            {
                "address": "2204 Hill Dr",
                "city": "Grandview",
                "state": "WA",
                "zip_code": "98930",
                "price": 345000,
                "beds": 4,
                "baths": 2.5,
                "sqft": 2450,
                "lot_size": 0.25,
                "year_built": 1998,
                "property_type": "single_family",
                "status": "for_sale",
                "latitude": 46.2546,
                "longitude": -119.9021,
                "description": "Beautiful family home in quiet neighborhood with mountain views."
            },
            {
                "address": "123 Vineyard Ave",
                "city": "Grandview",
                "state": "WA",
                "zip_code": "98930",
                "price": 289000,
                "beds": 3,
                "baths": 2,
                "sqft": 1850,
                "lot_size": 0.18,
                "year_built": 2005,
                "property_type": "single_family",
                "status": "for_sale",
                "latitude": 46.2501,
                "longitude": -119.9102,
                "description": "Cozy home near vineyards with modern updates."
            },
            {
                "address": "456 Orchard Rd",
                "city": "Grandview",
                "state": "WA",
                "zip_code": "98930",
                "price": 425000,
                "beds": 5,
                "baths": 3,
                "sqft": 3200,
                "lot_size": 0.5,
                "year_built": 2010,
                "property_type": "single_family",
                "status": "for_sale",
                "latitude": 46.2478,
                "longitude": -119.8998,
                "description": "Spacious family home with large yard and fruit trees."
            },
            {
                "address": "789 Valley View Dr",
                "city": "Grandview",
                "state": "WA",
                "zip_code": "98930",
                "price": 199000,
                "beds": 2,
                "baths": 1,
                "sqft": 1200,
                "lot_size": 0.15,
                "year_built": 1975,
                "property_type": "single_family",
                "status": "for_sale",
                "latitude": 46.2533,
                "longitude": -119.9067,
                "description": "Affordable starter home with amazing valley views."
            },
            {
                "address": "101 Main St",
                "city": "Grandview",
                "state": "WA",
                "zip_code": "98930",
                "price": 159000,
                "beds": 2,
                "baths": 1,
                "sqft": 950,
                "lot_size": 0.1,
                "year_built": 1960,
                "property_type": "condo",
                "status": "for_sale",
                "latitude": 46.2506,
                "longitude": -119.9018,
                "description": "Downtown condo with easy access to shops and restaurants."
            }
        ]
        
        # Add property listings to database
        for data in property_data:
            property_listing = PropertyListing(
                **data,
                created_date=datetime.utcnow(),
                updated_date=datetime.utcnow(),
                listed_date=datetime.utcnow() - timedelta(days=30)
            )
            session.add(property_listing)
        
        # Create market metrics
        print("Creating sample market metrics...")
        
        # Add market metrics for Grandview ZIP code
        current_date = datetime.utcnow()
        for i in range(12):  # Last 12 months
            month_start = datetime(current_date.year, current_date.month, 1) - timedelta(days=30 * i)
            month_end = datetime(current_date.year, current_date.month, 1) - timedelta(days=30 * (i-1) if i > 0 else 0)
            
            # Simulate some trends in the data
            price_factor = 1.0 + (0.02 * i/12)  # Slight upward trend
            
            market_metric = MarketMetrics(
                area_type="zip",
                area_value="98930",
                period_start=month_start,
                period_end=month_end,
                median_price=300000 * price_factor,
                average_price=330000 * price_factor,
                price_per_sqft=175 * price_factor,
                total_listings=20 + i % 5,
                new_listings=8 + i % 3,
                total_sales=10 + i % 4,
                avg_days_on_market=45 - (i % 10),
                list_to_sale_ratio=0.95 + (0.01 * (i % 3)),
                price_drops=3 - (i % 3),
                created_date=datetime.utcnow()
            )
            session.add(market_metric)
        
        # Create spatial data (neighborhood boundaries)
        print("Creating sample spatial data...")
        
        # Simple GeoJSON polygon for Grandview
        grandview_geojson = {
            "type": "Polygon",
            "coordinates": [[
                [-119.9200, 46.2400],
                [-119.8900, 46.2400],
                [-119.8900, 46.2600],
                [-119.9200, 46.2600],
                [-119.9200, 46.2400]
            ]]
        }
        
        spatial_data = SpatialData(
            spatial_type="city",
            name="Grandview",
            geometry_type="polygon",
            geometry_json=json.dumps(grandview_geojson),
            properties_json=json.dumps({
                "city": "Grandview",
                "state": "WA",
                "population": 11000,
                "median_income": 56000
            }),
            created_date=datetime.utcnow(),
            updated_date=datetime.utcnow()
        )
        session.add(spatial_data)
        
        # Commit all the sample data
        session.commit()
        print(f"Successfully added {len(property_data)} property listings, 12 market metrics, and 1 spatial area.")
        
        session.close()
        return True
        
    except Exception as e:
        print(f"Error loading sample data: {e}")
        return False

def start_all_services(services_to_run):
    """Start all microservices in separate processes"""
    print("\n===== Starting Microservices =====")
    
    processes = {}
    
    # Start each service
    for name in services_to_run:
        if name in MICROSERVICES:
            service_info = MICROSERVICES[name]
            processes[name] = start_service(name, service_info["module"], service_info["port"])
            # Small delay to prevent overwhelming the system
            time.sleep(1)
    
    # Print summary
    print("\nRunning services:")
    for name in processes:
        service_info = MICROSERVICES[name]
        print(f"- {name}: {service_info['description']} (http://localhost:{service_info['port']})")
    
    print("\nPress Ctrl+C to stop all services")
    
    # Keep the script running and monitor process output
    try:
        while True:
            for name, process in list(processes.items()):
                if process.poll() is not None:
                    # Process has terminated
                    return_code = process.returncode
                    print(f"Process {name} terminated with code {return_code}")
                    
                    # Restart the process
                    print(f"Restarting {name} service...")
                    service_info = MICROSERVICES[name]
                    processes[name] = start_service(name, service_info["module"], service_info["port"])
                
                # Print any output from the process
                if process.stdout:
                    line = process.stdout.readline()
                    if line:
                        print(f"[{name}] {line.strip()}")
            
            # Sleep to avoid high CPU usage
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\nShutting down all microservices...")
        for name, process in processes.items():
            print(f"Terminating {name} service...")
            process.terminate()
        sys.exit(0)

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Initialize and run IntelligentEstate microservices")
    parser.add_argument(
        "--skip-db-init", 
        action="store_true",
        help="Skip database initialization"
    )
    parser.add_argument(
        "--skip-sample-data", 
        action="store_true",
        help="Skip loading sample data"
    )
    parser.add_argument(
        "--services", 
        nargs="+", 
        choices=list(MICROSERVICES.keys()) + ["all"],
        default=["all"],
        help="Specify which services to run (default: all)"
    )
    
    args = parser.parse_args()
    
    # Initialize database if needed
    if not args.skip_db_init:
        if not setup_database():
            print("ERROR: Database initialization failed!")
            return 1
    
    # Load sample data if needed
    if not args.skip_sample_data:
        if not load_sample_data():
            print("WARNING: Sample data load failed, but continuing...")
    
    # Determine which services to run
    services_to_run = list(MICROSERVICES.keys()) if "all" in args.services else args.services
    
    # Start all services
    start_all_services(services_to_run)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())