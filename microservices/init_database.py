"""
Script to initialize the database for IntelligentEstate platform
"""

import os
import sys

# Add the common directory to the path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from common.db_init import init_db

if __name__ == "__main__":
    print("Initializing database for IntelligentEstate platform...")
    success = init_db()
    
    if success:
        print("Database initialization completed successfully!")
    else:
        print("Database initialization failed.")
        sys.exit(1)