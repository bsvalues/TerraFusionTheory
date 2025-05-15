#!/usr/bin/env python3
# ICSF GAMA Simulation Module
# Core simulation logic for geographically-assisted mass appraisal

import os
import sys
import json
import time
import datetime
import random
import logging
import math
from typing import Dict, List, Tuple, Optional, Union, Any

# Configure logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)
log_path = os.path.join(log_dir, "compliance_audit.log")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_path),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("ICSF_GAMA")

# Output directory for GeoJSON files
output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
os.makedirs(output_dir, exist_ok=True)

# Default simulation parameters
DEFAULT_PARAMETERS = {
    "policy_id": "policy_default",
    "value_adjust_factor": 1.0,
    "location_weight": 0.4,
    "market_condition_factor": 1.05,
    "neighborhood_factor": 1.0,
    "randomize_factor": 0.1,
    "sample_size": 50,
    "market_year": datetime.datetime.now().year
}

class GamaSimulation:
    """Core simulation logic for GAMA"""
    
    def __init__(self, parameters: Dict = None):
        """Initialize the simulation with optional custom parameters"""
        self.parameters = DEFAULT_PARAMETERS.copy()
        if parameters:
            self.parameters.update(parameters)
        
        self.properties = []
        self.neighborhoods = {}
        self.results = {}
        logger.info(f"Simulation initialized with parameters: {self.parameters}")
    
    def generate_sample_data(self) -> None:
        """Generate sample property data for simulation"""
        logger.info(f"Generating sample data with size {self.parameters['sample_size']}")
        
        # Generate neighborhoods
        neighborhood_count = max(3, round(self.parameters['sample_size'] / 15))
        for i in range(neighborhood_count):
            # Create neighborhood centers
            center_lat = 47.6062 + (random.random() - 0.5) * 0.1
            center_lon = -122.3321 + (random.random() - 0.5) * 0.1
            
            quality_factor = random.uniform(0.8, 1.2)
            neighborhood_id = f"N{i+1:03d}"
            
            self.neighborhoods[neighborhood_id] = {
                "id": neighborhood_id,
                "name": f"Neighborhood {i+1}",
                "center": (center_lat, center_lon),
                "quality_factor": quality_factor
            }
        
        # Generate properties
        for i in range(self.parameters['sample_size']):
            # Randomly assign to neighborhood
            neighborhood_id = random.choice(list(self.neighborhoods.keys()))
            neighborhood = self.neighborhoods[neighborhood_id]
            
            # Property coordinates (near neighborhood center)
            lat = neighborhood["center"][0] + (random.random() - 0.5) * 0.02
            lon = neighborhood["center"][1] + (random.random() - 0.5) * 0.02
            
            # Property attributes
            sqft = round(random.uniform(1000, 3500))
            year_built = random.randint(1950, 2020)
            bedrooms = random.randint(2, 5)
            bathrooms = random.randint(1, 4)
            
            # Base value calculation
            base_value = (
                sqft * 120 +
                (2023 - year_built) * -300 +
                bedrooms * 15000 +
                bathrooms * 10000
            )
            
            # Apply neighborhood factor
            base_value *= neighborhood["quality_factor"]
            
            # Add some randomness
            rand_factor = 1.0 + (random.random() - 0.5) * 0.3
            base_value *= rand_factor
            
            # Round to nearest 1000
            base_value = round(base_value / 1000) * 1000
            
            self.properties.append({
                "id": f"P{i+1:04d}",
                "neighborhood_id": neighborhood_id,
                "coordinates": [lon, lat],  # GeoJSON format: [longitude, latitude]
                "sqft": sqft,
                "year_built": year_built,
                "bedrooms": bedrooms,
                "bathrooms": bathrooms,
                "base_value": base_value
            })
        
        logger.info(f"Generated {len(self.properties)} properties in {neighborhood_count} neighborhoods")
    
    def run_simulation(self) -> None:
        """Run the valuation simulation"""
        if not self.properties:
            self.generate_sample_data()
        
        logger.info("Starting simulation run...")
        
        # Apply policy factors to calculate simulated values
        for prop in self.properties:
            # Get neighborhood factor
            neighborhood = self.neighborhoods[prop["neighborhood_id"]]
            
            # Calculate current market value
            market_value = prop["base_value"] * self.parameters["market_condition_factor"]
            
            # Apply location weight
            location_adjusted = market_value * (
                1.0 + (self.parameters["location_weight"] * (neighborhood["quality_factor"] - 1.0))
            )
            
            # Apply policy adjustment factor
            policy_adjusted = location_adjusted * self.parameters["value_adjust_factor"]
            
            # Apply randomization
            random_factor = 1.0 + (random.random() - 0.5) * self.parameters["randomize_factor"]
            final_value = policy_adjusted * random_factor
            
            # Store results
            prop["simulated_value"] = round(final_value / 1000) * 1000
            prop["percent_change"] = round((prop["simulated_value"] / prop["base_value"] - 1.0) * 100, 1)
        
        logger.info("Simulation completed successfully")
    
    def save_results(self) -> str:
        """Save simulation results as GeoJSON"""
        if not self.properties:
            raise ValueError("No simulation results to save")
        
        # Create GeoJSON structure
        geojson = {
            "type": "FeatureCollection",
            "features": []
        }
        
        # Add properties as features
        for prop in self.properties:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": prop["coordinates"]
                },
                "properties": {
                    "id": prop["id"],
                    "neighborhood": prop["neighborhood_id"],
                    "sqft": prop["sqft"],
                    "year_built": prop["year_built"],
                    "bedrooms": prop["bedrooms"],
                    "bathrooms": prop["bathrooms"],
                    "base_value": prop["base_value"],
                    "simulated_value": prop["simulated_value"],
                    "percent_change": prop["percent_change"]
                }
            }
            geojson["features"].append(feature)
        
        # Save to file
        policy_id = self.parameters["policy_id"]
        timestamp = int(time.time())
        filename = f"valuation_layer_{policy_id}.geojson"
        filepath = os.path.join(output_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(geojson, f, indent=2)
        
        logger.info(f"Saved simulation results to {filepath}")
        
        # Create a symbolic link or copy for the most recent output
        latest_file = os.path.join(output_dir, "valuation_layer_policy.geojson")
        if os.path.exists(latest_file):
            try:
                os.remove(latest_file)
            except Exception as e:
                logger.warning(f"Couldn't remove old latest file: {e}")
        
        try:
            with open(latest_file, 'w') as f:
                json.dump(geojson, f, indent=2)
            logger.info(f"Updated latest results reference at {latest_file}")
        except Exception as e:
            logger.error(f"Failed to update latest results reference: {e}")
        
        return filepath
    
    def generate_summary_statistics(self) -> Dict:
        """Generate summary statistics for the simulation results"""
        if not self.properties or "simulated_value" not in self.properties[0]:
            raise ValueError("No simulation results available")
        
        # Calculate statistics
        total_properties = len(self.properties)
        total_base_value = sum(p["base_value"] for p in self.properties)
        total_simulated_value = sum(p["simulated_value"] for p in self.properties)
        avg_base_value = total_base_value / total_properties
        avg_simulated_value = total_simulated_value / total_properties
        avg_percent_change = sum(p["percent_change"] for p in self.properties) / total_properties
        
        # Neighborhood statistics
        neighborhood_stats = {}
        for n_id, neighborhood in self.neighborhoods.items():
            n_properties = [p for p in self.properties if p["neighborhood_id"] == n_id]
            if n_properties:
                n_count = len(n_properties)
                n_base_value = sum(p["base_value"] for p in n_properties)
                n_simulated_value = sum(p["simulated_value"] for p in n_properties)
                n_percent_change = sum(p["percent_change"] for p in n_properties) / n_count
                
                neighborhood_stats[n_id] = {
                    "name": neighborhood["name"],
                    "property_count": n_count,
                    "avg_base_value": round(n_base_value / n_count),
                    "avg_simulated_value": round(n_simulated_value / n_count),
                    "avg_percent_change": round(n_percent_change, 1)
                }
        
        # Build summary
        summary = {
            "simulation_parameters": self.parameters,
            "total_properties": total_properties,
            "total_base_value": total_base_value,
            "total_simulated_value": total_simulated_value,
            "avg_base_value": round(avg_base_value),
            "avg_simulated_value": round(avg_simulated_value),
            "avg_percent_change": round(avg_percent_change, 1),
            "neighborhood_statistics": neighborhood_stats
        }
        
        logger.info("Generated summary statistics")
        return summary


def main():
    """Main entry point for running simulation from command line"""
    logger.info("Starting ICSF GAMA simulation")
    
    # Parse command line arguments (future enhancement)
    parameters = DEFAULT_PARAMETERS.copy()
    
    # Initialize and run simulation
    sim = GamaSimulation(parameters)
    sim.generate_sample_data()
    sim.run_simulation()
    output_file = sim.save_results()
    
    # Generate and log summary statistics
    summary = sim.generate_summary_statistics()
    logger.info(f"Simulation summary: {json.dumps(summary, indent=2)}")
    
    # Print summary to stdout
    print("\n=== ICSF GAMA SIMULATION SUMMARY ===")
    print(f"Policy ID: {summary['simulation_parameters']['policy_id']}")
    print(f"Total Properties: {summary['total_properties']}")
    print(f"Average Base Value: ${summary['avg_base_value']:,}")
    print(f"Average Simulated Value: ${summary['avg_simulated_value']:,}")
    print(f"Average Percent Change: {summary['avg_percent_change']}%")
    print(f"Output saved to: {output_file}")
    print("====================================")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())