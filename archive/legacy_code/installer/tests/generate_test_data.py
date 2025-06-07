#!/usr/bin/env python3
"""
Test Data Generator for TerraFusion GAMA Enterprise Installer Tests

This script generates sample test data that can be used for testing the
TerraFusion GAMA Enterprise installer. It creates:
1. Sample configuration files
2. Mock executable files
3. Sample log files
4. Test data files

Usage:
    python generate_test_data.py [--output-dir DIR]
"""

import os
import sys
import argparse
import json
import random
import datetime
import shutil
import logging
import hashlib
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('test-data-generator')

# Default paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_OUTPUT = os.path.join(SCRIPT_DIR, 'test_data')

def generate_config_file(output_dir):
    """Generate a sample GAMA configuration file"""
    config_dir = os.path.join(output_dir, 'config')
    os.makedirs(config_dir, exist_ok=True)
    
    config_file = os.path.join(config_dir, 'gama_config.json')
    
    # Define sample configuration
    config = {
        "version": "1.2.0",
        "install_date": datetime.datetime.now().strftime('%Y-%m-%d'),
        "system": {
            "update_check_interval": 86400,
            "log_level": "info",
            "max_log_size_mb": 10,
            "max_log_files": 5,
            "telemetry_enabled": False
        },
        "valuation": {
            "models": [
                "spatial_regression",
                "hybrid_hedonic",
                "machine_learning"
            ],
            "default_model": "hybrid_hedonic",
            "use_enhanced_features": True,
            "spatial_bandwidth": "adaptive",
            "sample_size": 1000,
            "distance_type": "euclidean"
        },
        "database": {
            "type": "postgresql",
            "connection_pool_size": 5,
            "connection_timeout": 30,
            "retry_attempts": 3
        },
        "ui": {
            "theme": "system",
            "show_welcome": True,
            "default_view": "dashboard",
            "map_provider": "leaflet",
            "initial_map_center": [-122.3321, 47.6062],
            "initial_map_zoom": 12
        },
        "experimental": {
            "enable_alpha_features": False,
            "debug_mode": False
        }
    }
    
    # Write configuration file
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    logger.info(f"Generated configuration file: {config_file}")
    
    # Calculate and return hash
    with open(config_file, 'rb') as f:
        config_hash = hashlib.sha256(f.read()).hexdigest()
    
    # Save hash file
    with open(f"{config_file}.sha256", 'w') as f:
        f.write(f"{config_hash}  {os.path.basename(config_file)}")
    
    logger.info(f"Generated configuration hash: {config_hash}")
    
    return config_file, config_hash

def generate_mock_executable(output_dir):
    """Generate a mock executable file"""
    bin_dir = os.path.join(output_dir, 'bin')
    os.makedirs(bin_dir, exist_ok=True)
    
    exe_file = os.path.join(bin_dir, 'GamaLauncher.exe')
    
    # Create a mock executable (just a text file with .exe extension)
    with open(exe_file, 'w') as f:
        f.write("#!/usr/bin/env python3\n")
        f.write("# This is a mock executable for testing purposes only\n")
        f.write("print('TerraFusion GAMA Enterprise Launcher')\n")
        f.write("print('Version 1.2.0')\n")
        f.write("print('© 2025 TerraFusion. All rights reserved.')\n")
        f.write("# This would launch the actual application in production\n")
    
    # Make it executable
    try:
        os.chmod(exe_file, 0o755)
    except:
        logger.warning(f"Could not make {exe_file} executable")
    
    logger.info(f"Generated mock executable: {exe_file}")
    
    return exe_file

def generate_sample_logs(output_dir):
    """Generate sample log files"""
    logs_dir = os.path.join(output_dir, 'logs')
    os.makedirs(logs_dir, exist_ok=True)
    
    # Generate an installation log
    install_log = os.path.join(logs_dir, 'install.log')
    with open(install_log, 'w') as f:
        f.write(f"TerraFusion GAMA Installation Log\n")
        f.write(f"Installation started: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("-------------------------------------------\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Config folder check: Config folder does not exist. It will be created during installation.\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Creating folder: C:\\Program Files\\TerraFusion\\GAMA\\bin\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Creating folder: C:\\Program Files\\TerraFusion\\GAMA\\config\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Creating folder: C:\\Program Files\\TerraFusion\\GAMA\\data\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Creating folder: C:\\Program Files\\TerraFusion\\GAMA\\docs\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Creating folder: C:\\Program Files\\TerraFusion\\GAMA\\logs\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Creating folder: C:\\Program Files\\TerraFusion\\GAMA\\scripts\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Creating folder: C:\\Program Files\\TerraFusion\\GAMA\\ui\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Configuration hash verified: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Directory access check failed: C:\\Program Files\\TerraFusion\\GAMA\n")
        f.write(f"{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - Installation completed successfully\n")
    
    # Generate an application log
    app_log = os.path.join(logs_dir, 'application.log')
    with open(app_log, 'w') as f:
        f.write(f"TerraFusion GAMA Application Log\n")
        log_date = datetime.datetime.now()
        for i in range(20):
            log_time = log_date + datetime.timedelta(seconds=i*5)
            level = random.choice(['INFO', 'DEBUG', 'INFO', 'INFO', 'WARN'])
            component = random.choice(['UI', 'Database', 'Valuation', 'System', 'Config'])
            message = f"Sample log message #{i+1} from {component} component"
            f.write(f"{log_time.strftime('%Y-%m-%d %H:%M:%S')} [{level}] [{component}] {message}\n")
    
    logger.info(f"Generated sample logs in: {logs_dir}")
    
    return logs_dir

def generate_test_data_files(output_dir):
    """Generate sample test data files"""
    data_dir = os.path.join(output_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    
    # Generate a sample GeoJSON file
    geojson_file = os.path.join(data_dir, 'sample_parcels.geojson')
    with open(geojson_file, 'w') as f:
        f.write('{\n')
        f.write('  "type": "FeatureCollection",\n')
        f.write('  "features": [\n')
        for i in range(5):
            lat = 47.6062 + (random.random() - 0.5) * 0.1
            lon = -122.3321 + (random.random() - 0.5) * 0.1
            value = int(random.random() * 1000000)
            f.write('    {\n')
            f.write('      "type": "Feature",\n')
            f.write('      "properties": {\n')
            f.write(f'        "id": {i+1},\n')
            f.write(f'        "address": "123 Test St #{i+1}",\n')
            f.write(f'        "value": {value}\n')
            f.write('      },\n')
            f.write('      "geometry": {\n')
            f.write('        "type": "Point",\n')
            f.write(f'        "coordinates": [{lon}, {lat}]\n')
            f.write('      }\n')
            if i < 4:
                f.write('    },\n')
            else:
                f.write('    }\n')
        f.write('  ]\n')
        f.write('}\n')
    
    # Generate a sample CSV file
    csv_file = os.path.join(data_dir, 'sample_sales.csv')
    with open(csv_file, 'w') as f:
        f.write('id,address,sale_date,sale_price,bedrooms,bathrooms,sqft\n')
        for i in range(10):
            sale_date = datetime.date.today() - datetime.timedelta(days=random.randint(1, 365))
            sale_price = int(random.random() * 1000000)
            bedrooms = random.randint(1, 6)
            bathrooms = random.randint(1, 4)
            sqft = random.randint(500, 4000)
            f.write(f'{i+1},"123 Test St #{i+1}",{sale_date},{sale_price},{bedrooms},{bathrooms},{sqft}\n')
    
    logger.info(f"Generated sample data files in: {data_dir}")
    
    return data_dir

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Generate test data for TerraFusion GAMA Enterprise installer tests")
    parser.add_argument('--output-dir', dest='output_dir', default=DEFAULT_OUTPUT,
                        help='Output directory for test data')
    
    args = parser.parse_args()
    
    # Create output directory if it doesn't exist
    os.makedirs(args.output_dir, exist_ok=True)
    
    logger.info(f"Generating test data in: {args.output_dir}")
    
    # Generate test data
    generate_config_file(args.output_dir)
    generate_mock_executable(args.output_dir)
    generate_sample_logs(args.output_dir)
    generate_test_data_files(args.output_dir)
    
    logger.info(f"Test data generation complete")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())