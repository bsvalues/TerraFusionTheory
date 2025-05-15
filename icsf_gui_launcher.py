#!/usr/bin/env python3
# ICSF GAMA GUI Launcher (Fallback CLI version)
# Entry point for county IT deployment if tkinter is not available
import subprocess
import os
import sys
import webbrowser
import platform
import json
import time
import argparse

# Configuration paths
BASE_PATH = os.path.abspath(".")
SIM_SCRIPT = os.path.join(BASE_PATH, "icsf_gama_simulation.py")
OUTPUT_GEOJSON = os.path.join(BASE_PATH, "output", "valuation_layer_policy.geojson")
LOG_FILE = os.path.join(BASE_PATH, "logs", "compliance_audit.log")
CONFIG_FILE = os.path.join(BASE_PATH, "config", "simulation_params.json")

# Create required directories
os.makedirs(os.path.join(BASE_PATH, "output"), exist_ok=True)
os.makedirs(os.path.join(BASE_PATH, "logs"), exist_ok=True)
os.makedirs(os.path.join(BASE_PATH, "config"), exist_ok=True)

# Default simulation parameters
DEFAULT_PARAMETERS = {
    "policy_id": "policy_default",
    "value_adjust_factor": 1.0,
    "location_weight": 0.4,
    "market_condition_factor": 1.05,
    "neighborhood_factor": 1.0,
    "randomize_factor": 0.1,
    "sample_size": 50,
    "market_year": time.localtime().tm_year
}

# Save default parameters if config file doesn't exist
if not os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(DEFAULT_PARAMETERS, f, indent=2)
        print(f"Created default configuration file at {CONFIG_FILE}")
    except Exception as e:
        print(f"Warning: Could not create default configuration file: {e}")

MENU = """
╔════════════════════════════════════╗
║         ICSF GAMA Simulator        ║
╠════════════════════════════════════╣
║ 1. Run Valuation Simulation        ║
║ 2. View Output Map                 ║
║ 3. Open Compliance Log             ║
║ 4. Configure Simulation Parameters ║
║ 5. Generate Sample Data            ║
║ 6. Exit                            ║
╚════════════════════════════════════╝
"""

def load_parameters():
    """Load simulation parameters from config file"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading configuration file: {e}")
            print("Using default parameters instead.")
    return DEFAULT_PARAMETERS.copy()

def save_parameters(params):
    """Save simulation parameters to config file"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(params, f, indent=2)
        print(f"Configuration saved to {CONFIG_FILE}")
        return True
    except Exception as e:
        print(f"Error saving configuration file: {e}")
        return False

def run_simulation():
    """Execute the GAMA simulation script with error handling"""
    print("Running simulation...")
    
    params = load_parameters()
    cmd = [sys.executable, SIM_SCRIPT]
    
    # Future enhancement: Add command line parameters to pass to simulation
    
    try:
        result = subprocess.run(cmd, 
                               check=True, 
                               capture_output=True, 
                               text=True)
        print("Simulation completed successfully.")
        if result.stdout:
            print("\nOutput:")
            print(result.stdout)
        print()
    except subprocess.CalledProcessError as e:
        print("ERROR: Simulation failed. Check the log file.")
        if e.stderr:
            print("\nError details:")
            print(e.stderr)
        print()
    except FileNotFoundError:
        print(f"ERROR: Simulation script not found at '{SIM_SCRIPT}'")
        print("Please ensure the script exists and you have the correct permissions.\n")

def open_output_map():
    """Open the GeoJSON output map in the default browser"""
    if os.path.exists(OUTPUT_GEOJSON):
        try:
            success = webbrowser.open(f"file://{os.path.abspath(OUTPUT_GEOJSON)}")
            if success:
                print("Opened output map in default browser.\n")
            else:
                print("Failed to open browser. The output map is located at:")
                print(f"  {os.path.abspath(OUTPUT_GEOJSON)}\n")
        except Exception as e:
            print(f"Error opening map: {e}")
            print(f"The output map is located at: {os.path.abspath(OUTPUT_GEOJSON)}\n")
    else:
        print("Output map not found. Run the simulation first.\n")
        os.makedirs(os.path.dirname(OUTPUT_GEOJSON), exist_ok=True)

def open_log_file():
    """Open the log file with platform-specific methods"""
    if os.path.exists(LOG_FILE):
        try:
            if platform.system() == "Windows":
                os.startfile(os.path.abspath(LOG_FILE))
            elif platform.system() == "Darwin":
                subprocess.run(["open", os.path.abspath(LOG_FILE)])
            else:
                subprocess.run(["xdg-open", os.path.abspath(LOG_FILE)])
            print(f"Opening log file: {os.path.abspath(LOG_FILE)}\n")
        except Exception as e:
            print(f"Error opening log file: {e}")
            print(f"The log file is located at: {os.path.abspath(LOG_FILE)}\n")
    else:
        print("Log file not found.\n")
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        print(f"Log directory created at: {os.path.dirname(LOG_FILE)}")

def configure_parameters():
    """Interactive configuration of simulation parameters"""
    params = load_parameters()
    
    print("\n=== Simulation Parameter Configuration ===")
    print("Enter new values or press Enter to keep current values")
    
    try:
        # Policy ID
        new_policy = input(f"Policy ID [{params['policy_id']}]: ").strip()
        if new_policy:
            params['policy_id'] = new_policy
        
        # Value adjustment factor
        value_factor = input(f"Value Adjustment Factor [{params['value_adjust_factor']}]: ").strip()
        if value_factor:
            params['value_adjust_factor'] = float(value_factor)
        
        # Location weight
        loc_weight = input(f"Location Weight [{params['location_weight']}]: ").strip()
        if loc_weight:
            params['location_weight'] = float(loc_weight)
        
        # Market condition factor
        market_factor = input(f"Market Condition Factor [{params['market_condition_factor']}]: ").strip()
        if market_factor:
            params['market_condition_factor'] = float(market_factor)
        
        # Sample size
        sample_size = input(f"Sample Size [{params['sample_size']}]: ").strip()
        if sample_size:
            params['sample_size'] = int(sample_size)
        
        # Save parameters
        if save_parameters(params):
            print("Parameters updated successfully.\n")
        else:
            print("Failed to save parameters.\n")
    
    except ValueError as e:
        print(f"Invalid input: {e}. Parameters not updated.\n")
    except Exception as e:
        print(f"Error during configuration: {e}. Parameters not updated.\n")

def generate_sample_data():
    """Generate sample data without running full simulation"""
    print("Generating sample data...")
    
    # Future enhancement: Implement proper sample data generation
    print("Feature not yet implemented.\n")
    
    # For future implementation - use a subset of simulation functionality
    # from icsf_gama_simulation import GamaSimulation
    # sim = GamaSimulation()
    # sim.generate_sample_data()
    # print("Sample data generated successfully.\n")

def parse_command_line():
    """Parse command line arguments for headless operation"""
    parser = argparse.ArgumentParser(description='ICSF GAMA Simulator CLI Launcher')
    parser.add_argument('--run', action='store_true', help='Run the simulation and exit')
    parser.add_argument('--view-map', action='store_true', help='View the output map and exit')
    parser.add_argument('--view-log', action='store_true', help='View the log file and exit')
    
    return parser.parse_args()

def main():
    """Main program loop"""
    # Create required directories
    os.makedirs(os.path.dirname(OUTPUT_GEOJSON), exist_ok=True)
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    
    # Check for command line arguments for headless operation
    args = parse_command_line()
    
    if args.run:
        run_simulation()
        return 0
    elif args.view_map:
        open_output_map()
        return 0
    elif args.view_log:
        open_log_file()
        return 0
    
    # Interactive mode
    while True:
        print(MENU)
        choice = input("Select an option [1-6]: ").strip()
        
        if choice == "1":
            run_simulation()
        elif choice == "2":
            open_output_map()
        elif choice == "3":
            open_log_file()
        elif choice == "4":
            configure_parameters()
        elif choice == "5":
            generate_sample_data()
        elif choice == "6":
            print("Exiting ICSF GAMA Simulator.")
            break
        else:
            print("Invalid option. Please try again.\n")
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nProgram interrupted. Exiting ICSF GAMA Simulator.")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        print("Please report this issue to your system administrator.")
        sys.exit(1)