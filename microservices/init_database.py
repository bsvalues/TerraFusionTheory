"""
Database Initialization Script

This script initializes the database for the IntelligentEstate platform.
It creates all necessary tables and seeds initial data.
"""

import os
import sys
import argparse
from sqlalchemy.exc import SQLAlchemyError

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import database initialization functions
from common.db_init import init_db

def main():
    """Main function to initialize the database"""
    parser = argparse.ArgumentParser(description='Initialize IntelligentEstate database')
    parser.add_argument('--force', action='store_true', help='Force recreation of tables (WARNING: This will delete all data)')
    args = parser.parse_args()
    
    print("Initializing IntelligentEstate Database...")
    print("==========================================")
    
    # Check for DATABASE_URL
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL environment variable is not set!")
        print("Please set the DATABASE_URL environment variable to your PostgreSQL connection string.")
        print("Example: export DATABASE_URL='postgresql://username:password@localhost:5432/intelligentestate'")
        return 1
    
    try:
        # Initialize the database
        success = init_db()
        
        if success:
            print("\nDatabase initialization completed successfully!")
            print("\nYou can now start the microservices using:")
            print("    python launch.py")
            return 0
        else:
            print("\nERROR: Database initialization failed!")
            return 1
            
    except SQLAlchemyError as e:
        print(f"\nDatabase Error: {str(e)}")
        return 1
    except Exception as e:
        print(f"\nUnexpected Error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())