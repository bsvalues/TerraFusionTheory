#!/usr/bin/env python3
"""
TerraFusion GAMA Valuation Benchmarking Tool

This tool evaluates the accuracy and performance of the GAMA simulation system
by comparing its valuations against known market values. It generates detailed
reports and metrics to help improve valuation models.

Key features:
1. Statistical accuracy analysis (COD, PRD, PRB, etc.)
2. Performance benchmarking of different valuation methods
3. Spatial accuracy analysis with GIS visualization
4. Calibration recommendations for model parameters
5. Automated regression testing for model changes

For use by county assessment professionals to validate and improve the
GAMA valuation system's accuracy and compliance with professional standards.
"""

import os
import sys
import json
import time
import math
import logging
import argparse
import datetime
import tempfile
import statistics
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple, Optional, Union, Any
from pathlib import Path

# Import the GAMA simulation module
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)
from icsf_gama_simulation import GamaSimulation

# Setup logging
log_dir = os.path.join(script_dir, "logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "benchmark.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("GAMA_BENCHMARK")

# Output directory for benchmark reports
output_dir = os.path.join(script_dir, "benchmark_reports")
os.makedirs(output_dir, exist_ok=True)

# Define accuracy metrics
ACCURACY_METRICS = {
    "COD": "Coefficient of Dispersion (under 15% is good)",
    "PRD": "Price-Related Differential (0.98-1.03 is good)",
    "PRB": "Price-Related Bias (±0.05 is good)",
    "RMSE": "Root Mean Square Error",
    "MAPE": "Mean Absolute Percentage Error",
    "R2": "R-squared (Coefficient of Determination)"
}

# Define benchmark scenarios
DEFAULT_SCENARIOS = [
    {
        "name": "Default Parameters",
        "description": "Baseline scenario with default parameters",
        "parameters": {}
    },
    {
        "name": "High Location Weight",
        "description": "Increased importance of location factors",
        "parameters": {"location_weight": 0.7}
    },
    {
        "name": "Market Boom",
        "description": "Simulating a hot real estate market",
        "parameters": {"market_condition_factor": 1.15}
    },
    {
        "name": "Market Decline",
        "description": "Simulating a declining real estate market",
        "parameters": {"market_condition_factor": 0.95}
    },
    {
        "name": "Precise Valuation",
        "description": "Minimal randomization for more consistent values",
        "parameters": {"randomize_factor": 0.05}
    }
]


class ValuationBenchmark:
    """GAMA Valuation Benchmarking System"""
    
    def __init__(self, test_data_path=None, scenarios=None):
        """Initialize the benchmarking system"""
        self.test_data_path = test_data_path
        self.scenarios = scenarios or DEFAULT_SCENARIOS
        self.test_data = self._load_test_data()
        self.results = {}
        
        logger.info("GAMA Valuation Benchmark initialized")
        if self.test_data:
            logger.info(f"Loaded {len(self.test_data)} test properties")
        
    def _load_test_data(self) -> List[Dict]:
        """Load test data with known market values"""
        if not self.test_data_path:
            # Generate synthetic test data with GAMA
            logger.info("No test data provided, generating synthetic benchmark data")
            return self._generate_synthetic_data()
        
        try:
            if os.path.exists(self.test_data_path):
                with open(self.test_data_path, 'r') as f:
                    data = json.load(f)
                
                # Check if it's a GeoJSON file
                if 'type' in data and data['type'] == 'FeatureCollection':
                    properties = []
                    for feature in data['features']:
                        prop = feature['properties']
                        prop['coordinates'] = feature['geometry']['coordinates']
                        properties.append(prop)
                    return properties
                else:
                    # Assume it's a direct list of properties
                    return data
            else:
                logger.error(f"Test data file not found: {self.test_data_path}")
                return self._generate_synthetic_data()
        except Exception as e:
            logger.error(f"Error loading test data: {e}")
            return self._generate_synthetic_data()
    
    def _generate_synthetic_data(self) -> List[Dict]:
        """Generate synthetic test data for benchmarking"""
        # Use GAMA simulation to generate base data
        sim = GamaSimulation()
        sim.generate_sample_data()
        
        # Add known "market_value" to each property
        properties = []
        for prop in sim.properties:
            # Create a synthetic "true" market value with some variation
            # from the base value to simulate real market conditions
            market_factor = np.random.normal(1.0, 0.15)  # 15% standard deviation
            market_value = round(prop["base_value"] * market_factor / 1000) * 1000
            
            # Ensure minimum variation from base value
            if abs(market_value - prop["base_value"]) < (0.05 * prop["base_value"]):
                direction = 1 if np.random.random() > 0.5 else -1
                market_value = prop["base_value"] + direction * (0.05 * prop["base_value"])
                market_value = round(market_value / 1000) * 1000
            
            # Add market value to property data
            prop_with_market = prop.copy()
            prop_with_market["market_value"] = market_value
            properties.append(prop_with_market)
        
        # Save synthetic data for reference
        synthetic_data_path = os.path.join(output_dir, "synthetic_benchmark_data.json")
        with open(synthetic_data_path, 'w') as f:
            json.dump(properties, f, indent=2)
        
        logger.info(f"Generated synthetic benchmark data with {len(properties)} properties")
        logger.info(f"Saved synthetic data to {synthetic_data_path}")
        
        return properties
    
    def run_benchmark(self) -> Dict:
        """Run benchmark for all scenarios"""
        results = {}
        start_time = time.time()
        
        logger.info(f"Starting benchmark with {len(self.scenarios)} scenarios")
        
        for i, scenario in enumerate(self.scenarios):
            logger.info(f"Running scenario {i+1}/{len(self.scenarios)}: {scenario['name']}")
            
            # Run scenario
            scenario_start = time.time()
            scenario_results = self._run_scenario(scenario)
            scenario_duration = time.time() - scenario_start
            
            # Add execution time
            scenario_results["execution_time"] = scenario_duration
            
            # Store results
            results[scenario["name"]] = scenario_results
            
            logger.info(f"Completed scenario '{scenario['name']}' in {scenario_duration:.2f} seconds")
        
        # Calculate comparative results
        baseline_name = self.scenarios[0]["name"]
        if baseline_name in results:
            for name, result in results.items():
                if name != baseline_name:
                    # Calculate improvements vs baseline
                    baseline = results[baseline_name]
                    for metric in ["cod", "prd", "prb", "rmse", "mape", "r2"]:
                        if metric in result and metric in baseline:
                            if metric == "r2":  # Higher is better
                                result[f"{metric}_vs_baseline"] = (
                                    (result[metric] - baseline[metric]) / baseline[metric]
                                ) * 100
                            else:  # Lower is better
                                result[f"{metric}_vs_baseline"] = (
                                    (baseline[metric] - result[metric]) / baseline[metric]
                                ) * 100
        
        # Store overall execution time
        total_time = time.time() - start_time
        results["_meta"] = {
            "total_execution_time": total_time,
            "timestamp": datetime.datetime.now().isoformat(),
            "num_scenarios": len(self.scenarios),
            "num_properties": len(self.test_data)
        }
        
        self.results = results
        logger.info(f"Benchmark completed in {total_time:.2f} seconds")
        
        return results
    
    def _run_scenario(self, scenario: Dict) -> Dict:
        """Run a single benchmark scenario"""
        # Initialize GAMA simulation with scenario parameters
        sim = GamaSimulation(scenario.get("parameters", {}))
        
        # Use test data as basis if possible
        if hasattr(sim, 'properties') and not sim.properties and self.test_data:
            # Copy test data but remove market_value as that's what we're calculating
            properties = []
            for prop in self.test_data:
                p = prop.copy()
                p.pop("market_value", None)
                p.pop("simulated_value", None)  # Remove any existing simulation results
                properties.append(p)
            
            sim.properties = properties
        
        # Run simulation
        sim.run_simulation()
        
        # Calculate accuracy metrics
        return self._calculate_metrics(sim.properties, scenario)
    
    def _calculate_metrics(self, simulated_properties: List[Dict], scenario: Dict) -> Dict:
        """Calculate accuracy metrics for simulated properties"""
        # Pair properties with test data
        paired_data = []
        
        for sim_prop in simulated_properties:
            # Find matching property in test data
            test_prop = next(
                (p for p in self.test_data if p["id"] == sim_prop["id"]),
                None
            )
            
            if test_prop and "market_value" in test_prop:
                paired_data.append({
                    "id": sim_prop["id"],
                    "market_value": test_prop["market_value"],
                    "simulated_value": sim_prop["simulated_value"],
                    "ratio": sim_prop["simulated_value"] / test_prop["market_value"],
                    "abs_error": abs(sim_prop["simulated_value"] - test_prop["market_value"]),
                    "pct_error": abs(sim_prop["simulated_value"] - test_prop["market_value"]) / test_prop["market_value"] * 100,
                    "neighborhood": sim_prop.get("neighborhood_id", "unknown")
                })
        
        if not paired_data:
            logger.error("No matching properties found between simulation and test data")
            return {
                "error": "No matching properties found",
                "scenario": scenario["name"]
            }
        
        # Convert to DataFrame for easier analysis
        df = pd.DataFrame(paired_data)
        
        # Calculate statistical accuracy metrics
        metrics = {}
        
        # 1. Coefficient of Dispersion (COD)
        median_ratio = df["ratio"].median()
        absolute_deviations = np.abs(df["ratio"] - median_ratio)
        cod = (absolute_deviations.mean() / median_ratio) * 100
        metrics["cod"] = cod
        
        # 2. Price-Related Differential (PRD)
        mean_ratio = df["ratio"].mean()
        weighted_mean_ratio = (df["simulated_value"].sum() / df["market_value"].sum())
        prd = mean_ratio / weighted_mean_ratio
        metrics["prd"] = prd
        
        # 3. Price-Related Bias (PRB)
        # Use linear regression to measure bias related to value
        if len(df) >= 5:  # Need enough data points
            log_ratios = np.log(df["ratio"])
            log_values = np.log(df["market_value"])
            slope, _ = np.polyfit(log_values, log_ratios, 1)
            prb = slope
        else:
            prb = 0  # Not enough data
        metrics["prb"] = prb
        
        # 4. Root Mean Square Error (RMSE)
        squared_errors = (df["market_value"] - df["simulated_value"]) ** 2
        rmse = np.sqrt(squared_errors.mean())
        metrics["rmse"] = rmse
        
        # 5. Mean Absolute Percentage Error (MAPE)
        mape = df["pct_error"].mean()
        metrics["mape"] = mape
        
        # 6. R-squared (coefficient of determination)
        correlation_matrix = np.corrcoef(df["market_value"], df["simulated_value"])
        correlation = correlation_matrix[0, 1]
        r2 = correlation ** 2
        metrics["r2"] = r2
        
        # 7. Per-neighborhood metrics
        neighborhood_metrics = {}
        for neighborhood, group in df.groupby("neighborhood"):
            if len(group) >= 3:  # Need at least a few properties
                neighborhood_metrics[neighborhood] = {
                    "count": len(group),
                    "median_ratio": group["ratio"].median(),
                    "mean_error_pct": group["pct_error"].mean(),
                    "cod": (np.abs(group["ratio"] - group["ratio"].median()).mean() / 
                           group["ratio"].median()) * 100
                }
        
        # 8. Value tier analysis
        df["value_quartile"] = pd.qcut(df["market_value"], 4, labels=["Low", "Medium-Low", "Medium-High", "High"])
        tier_metrics = {}
        for tier, group in df.groupby("value_quartile"):
            tier_metrics[str(tier)] = {
                "count": len(group),
                "median_ratio": group["ratio"].median(),
                "mean_error_pct": group["pct_error"].mean(),
                "cod": (np.abs(group["ratio"] - group["ratio"].median()).mean() / 
                       group["ratio"].median()) * 100
            }
        
        # Compile all metrics and data
        result = {
            "scenario": scenario["name"],
            "description": scenario.get("description", ""),
            "parameters": scenario.get("parameters", {}),
            "sample_size": len(paired_data),
            "accuracy": {
                "cod": cod,  # Coefficient of Dispersion
                "prd": prd,  # Price-Related Differential
                "prb": prb,  # Price-Related Bias
                "rmse": rmse,  # Root Mean Square Error
                "mape": mape,  # Mean Absolute Percentage Error
                "r2": r2  # R-squared
            },
            "summary_statistics": {
                "median_ratio": median_ratio,
                "mean_ratio": mean_ratio,
                "weighted_mean_ratio": weighted_mean_ratio,
                "min_ratio": df["ratio"].min(),
                "max_ratio": df["ratio"].max(),
                "stddev_ratio": df["ratio"].std(),
                "median_abs_error": df["abs_error"].median(),
                "median_pct_error": df["pct_error"].median()
            },
            "neighborhood_metrics": neighborhood_metrics,
            "tier_metrics": tier_metrics,
            "iaao_compliance": {
                "cod_compliant": cod < 15.0,
                "prd_compliant": 0.98 <= prd <= 1.03,
                "prb_compliant": abs(prb) <= 0.05,
                "overall_compliant": (cod < 15.0 and 0.98 <= prd <= 1.03 and abs(prb) <= 0.05)
            }
        }
        
        # Add detailed percentiles
        result["summary_statistics"]["ratio_percentiles"] = {
            "p10": df["ratio"].quantile(0.1),
            "p25": df["ratio"].quantile(0.25),
            "p50": df["ratio"].quantile(0.5),
            "p75": df["ratio"].quantile(0.75),
            "p90": df["ratio"].quantile(0.9)
        }
        
        return result
    
    def generate_report(self, output_path=None) -> str:
        """Generate a comprehensive benchmark report"""
        if not self.results:
            logger.error("No benchmark results available. Run benchmark first.")
            return None
        
        # Create timestamp for report
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        report_dir = output_path or os.path.join(output_dir, f"benchmark_report_{timestamp}")
        os.makedirs(report_dir, exist_ok=True)
        
        # Generate HTML report
        html_path = os.path.join(report_dir, "benchmark_report.html")
        self._generate_html_report(html_path)
        
        # Generate JSON results
        json_path = os.path.join(report_dir, "benchmark_results.json")
        with open(json_path, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        # Generate comparison charts
        charts_dir = os.path.join(report_dir, "charts")
        os.makedirs(charts_dir, exist_ok=True)
        self._generate_comparison_charts(charts_dir)
        
        logger.info(f"Benchmark report generated at: {report_dir}")
        return report_dir
    
    def _generate_html_report(self, output_path: str) -> None:
        """Generate an HTML report of benchmark results"""
        # Get scenarios and metrics
        scenarios = [s["name"] for s in self.scenarios]
        meta = self.results.get("_meta", {})
        
        # Start HTML content
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GAMA Valuation Benchmark Report</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }}
        h1, h2, h3, h4 {{ color: #2c3e50; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .summary {{ background-color: #f8f9fa; border-left: 4px solid #4CAF50; padding: 15px; margin-bottom: 20px; }}
        table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
        tr:nth-child(even) {{ background-color: #f9f9f9; }}
        tr:hover {{ background-color: #f5f5f5; }}
        .success {{ color: #28a745; }}
        .warning {{ color: #ffc107; }}
        .danger {{ color: #dc3545; }}
        .chart-container {{ display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }}
        .chart {{ margin-bottom: 20px; text-align: center; }}
        .small-table {{ width: auto; }}
        .small-table th, .small-table td {{ padding: 5px 10px; }}
        .key-metric {{ font-weight: bold; }}
        footer {{ margin-top: 30px; text-align: center; font-size: 0.8em; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>GAMA Valuation Benchmark Report</h1>
        <p>Report generated on: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        
        <div class="summary">
            <h2>Benchmark Summary</h2>
            <p>Total scenarios: {len(scenarios)}</p>
            <p>Properties evaluated: {meta.get("num_properties", "N/A")}</p>
            <p>Total execution time: {meta.get("total_execution_time", 0):.2f} seconds</p>
        </div>
        
        <h2>Accuracy Metrics Comparison</h2>
        <p>Lower values are better for COD, PRD, PRB, RMSE, and MAPE. Higher is better for R².</p>
        <table>
            <tr>
                <th>Scenario</th>
                <th>COD (%)</th>
                <th>PRD</th>
                <th>PRB</th>
                <th>RMSE</th>
                <th>MAPE (%)</th>
                <th>R²</th>
                <th>IAAO Compliant</th>
            </tr>
        """
        
        # Add rows for each scenario
        for scenario_name in scenarios:
            scenario_data = self.results.get(scenario_name, {})
            accuracy = scenario_data.get("accuracy", {})
            compliance = scenario_data.get("iaao_compliance", {})
            
            # Determine compliance CSS class
            compliance_class = "success" if compliance.get("overall_compliant", False) else "danger"
            
            html_content += f"""
            <tr>
                <td>{scenario_name}</td>
                <td class="{'success' if compliance.get('cod_compliant', False) else 'danger'}">{accuracy.get("cod", "N/A"):.2f}</td>
                <td class="{'success' if compliance.get('prd_compliant', False) else 'danger'}">{accuracy.get("prd", "N/A"):.3f}</td>
                <td class="{'success' if compliance.get('prb_compliant', False) else 'danger'}">{accuracy.get("prb", "N/A"):.3f}</td>
                <td>${accuracy.get("rmse", "N/A"):,.0f}</td>
                <td>{accuracy.get("mape", "N/A"):.2f}</td>
                <td>{accuracy.get("r2", "N/A"):.3f}</td>
                <td class="{compliance_class}">{compliance.get("overall_compliant", False)}</td>
            </tr>
            """
        
        html_content += """
        </table>
        
        <h2>Performance Comparison</h2>
        <p>Execution time for each scenario:</p>
        <table class="small-table">
            <tr>
                <th>Scenario</th>
                <th>Execution Time (seconds)</th>
            </tr>
        """
        
        # Add rows for execution time
        for scenario_name in scenarios:
            execution_time = self.results.get(scenario_name, {}).get("execution_time", "N/A")
            if execution_time != "N/A":
                execution_time = f"{execution_time:.2f}"
            
            html_content += f"""
            <tr>
                <td>{scenario_name}</td>
                <td>{execution_time}</td>
            </tr>
            """
        
        html_content += """
        </table>
        
        <h2>Detailed Scenario Reports</h2>
        """
        
        # Add detailed section for each scenario
        for scenario_name in scenarios:
            scenario_data = self.results.get(scenario_name, {})
            if "scenario" not in scenario_data:
                continue
                
            params = scenario_data.get("parameters", {})
            summary = scenario_data.get("summary_statistics", {})
            accuracy = scenario_data.get("accuracy", {})
            iaao = scenario_data.get("iaao_compliance", {})
            
            # Format parameter list
            param_html = "<p>Default parameters</p>" if not params else "<ul>"
            for k, v in params.items():
                param_html += f"<li><strong>{k}:</strong> {v}</li>"
            if params:
                param_html += "</ul>"
            
            html_content += f"""
            <h3>{scenario_name}</h3>
            <p>{scenario_data.get("description", "")}</p>
            
            <h4>Configuration</h4>
            {param_html}
            
            <h4>Key Statistics</h4>
            <table class="small-table">
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>IAAO Standard</th>
                    <th>Compliance</th>
                </tr>
                <tr>
                    <td>Coefficient of Dispersion (COD)</td>
                    <td>{accuracy.get("cod", "N/A"):.2f}%</td>
                    <td>&lt; 15.0%</td>
                    <td class="{'success' if iaao.get('cod_compliant', False) else 'danger'}">
                        {'✓' if iaao.get('cod_compliant', False) else '✗'}
                    </td>
                </tr>
                <tr>
                    <td>Price-Related Differential (PRD)</td>
                    <td>{accuracy.get("prd", "N/A"):.3f}</td>
                    <td>0.98 - 1.03</td>
                    <td class="{'success' if iaao.get('prd_compliant', False) else 'danger'}">
                        {'✓' if iaao.get('prd_compliant', False) else '✗'}
                    </td>
                </tr>
                <tr>
                    <td>Price-Related Bias (PRB)</td>
                    <td>{accuracy.get("prb", "N/A"):.3f}</td>
                    <td>-0.05 to 0.05</td>
                    <td class="{'success' if iaao.get('prb_compliant', False) else 'danger'}">
                        {'✓' if iaao.get('prb_compliant', False) else '✗'}
                    </td>
                </tr>
                <tr>
                    <td>Root Mean Square Error (RMSE)</td>
                    <td>${accuracy.get("rmse", "N/A"):,.0f}</td>
                    <td>Lower is better</td>
                    <td>N/A</td>
                </tr>
                <tr>
                    <td>Mean Absolute Percentage Error (MAPE)</td>
                    <td>{accuracy.get("mape", "N/A"):.2f}%</td>
                    <td>Lower is better</td>
                    <td>N/A</td>
                </tr>
                <tr>
                    <td>R-squared (R²)</td>
                    <td>{accuracy.get("r2", "N/A"):.3f}</td>
                    <td>Higher is better</td>
                    <td>N/A</td>
                </tr>
            </table>
            
            <h4>Ratio Statistics</h4>
            <table class="small-table">
                <tr>
                    <th>Statistic</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Median Ratio</td>
                    <td>{summary.get("median_ratio", "N/A"):.3f}</td>
                </tr>
                <tr>
                    <td>Mean Ratio</td>
                    <td>{summary.get("mean_ratio", "N/A"):.3f}</td>
                </tr>
                <tr>
                    <td>Minimum Ratio</td>
                    <td>{summary.get("min_ratio", "N/A"):.3f}</td>
                </tr>
                <tr>
                    <td>Maximum Ratio</td>
                    <td>{summary.get("max_ratio", "N/A"):.3f}</td>
                </tr>
                <tr>
                    <td>Standard Deviation</td>
                    <td>{summary.get("stddev_ratio", "N/A"):.3f}</td>
                </tr>
                <tr>
                    <td>Median Percentage Error</td>
                    <td>{summary.get("median_pct_error", "N/A"):.2f}%</td>
                </tr>
            </table>
            """
            
            # Add neighborhood metrics if available
            neighborhood_metrics = scenario_data.get("neighborhood_metrics", {})
            if neighborhood_metrics:
                html_content += """
                <h4>Neighborhood Performance</h4>
                <table>
                    <tr>
                        <th>Neighborhood</th>
                        <th>Properties</th>
                        <th>Median Ratio</th>
                        <th>Mean Error (%)</th>
                        <th>COD (%)</th>
                    </tr>
                """
                
                for n_id, n_data in neighborhood_metrics.items():
                    html_content += f"""
                    <tr>
                        <td>{n_id}</td>
                        <td>{n_data.get("count", "N/A")}</td>
                        <td>{n_data.get("median_ratio", "N/A"):.3f}</td>
                        <td>{n_data.get("mean_error_pct", "N/A"):.2f}%</td>
                        <td>{n_data.get("cod", "N/A"):.2f}%</td>
                    </tr>
                    """
                
                html_content += """
                </table>
                """
            
            # Add value tier metrics if available
            tier_metrics = scenario_data.get("tier_metrics", {})
            if tier_metrics:
                html_content += """
                <h4>Performance by Value Tier</h4>
                <table>
                    <tr>
                        <th>Value Tier</th>
                        <th>Properties</th>
                        <th>Median Ratio</th>
                        <th>Mean Error (%)</th>
                        <th>COD (%)</th>
                    </tr>
                """
                
                # Use consistent tier order
                tier_order = ["Low", "Medium-Low", "Medium-High", "High"]
                for tier in tier_order:
                    if tier in tier_metrics:
                        t_data = tier_metrics[tier]
                        html_content += f"""
                        <tr>
                            <td>{tier}</td>
                            <td>{t_data.get("count", "N/A")}</td>
                            <td>{t_data.get("median_ratio", "N/A"):.3f}</td>
                            <td>{t_data.get("mean_error_pct", "N/A"):.2f}%</td>
                            <td>{t_data.get("cod", "N/A"):.2f}%</td>
                        </tr>
                        """
                
                html_content += """
                </table>
                """
        
        # Finish HTML
        html_content += """
        <div class="chart-container">
            <div class="chart">
                <img src="charts/cod_comparison.png" alt="COD Comparison">
            </div>
            <div class="chart">
                <img src="charts/prd_comparison.png" alt="PRD Comparison">
            </div>
            <div class="chart">
                <img src="charts/rmse_comparison.png" alt="RMSE Comparison">
            </div>
            <div class="chart">
                <img src="charts/r2_comparison.png" alt="R² Comparison">
            </div>
        </div>
        
        <h2>Conclusions and Recommendations</h2>
        """
        
        # Add auto-generated recommendations
        recommendations = self._generate_recommendations()
        html_content += f"""
        <p>{recommendations}</p>
        
        <footer>
            <p>Generated by TerraFusion GAMA Valuation Benchmarking Tool</p>
            <p>Report Date: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
        </footer>
    </div>
</body>
</html>
        """
        
        # Write HTML to file
        with open(output_path, 'w') as f:
            f.write(html_content)
        
        logger.info(f"HTML report generated at: {output_path}")
    
    def _generate_comparison_charts(self, charts_dir: str) -> None:
        """Generate comparison charts for metrics"""
        # Get scenario names and metrics
        scenarios = [s["name"] for s in self.scenarios]
        
        # Make sure directories exist
        os.makedirs(charts_dir, exist_ok=True)
        
        # Set aesthetic style for plots
        sns.set_style("whitegrid")
        plt.rcParams.update({'font.size': 11})
        
        # 1. COD Comparison
        plt.figure(figsize=(10, 6))
        cod_values = [self.results.get(s, {}).get("accuracy", {}).get("cod", 0) for s in scenarios]
        bars = plt.bar(scenarios, cod_values, color='skyblue')
        
        # Add threshold line for IAAO standard
        plt.axhline(y=15, color='red', linestyle='--', alpha=0.7, label='IAAO Standard (15%)')
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height + 0.5,
                    f'{height:.2f}%', ha='center', va='bottom', fontsize=10)
        
        plt.title('Coefficient of Dispersion (COD) by Scenario')
        plt.ylabel('COD (%)')
        plt.xlabel('Scenario')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.ylim(0, max(cod_values) * 1.15 if cod_values else 20)
        plt.legend()
        plt.savefig(os.path.join(charts_dir, "cod_comparison.png"), dpi=100, bbox_inches='tight')
        plt.close()
        
        # 2. PRD Comparison
        plt.figure(figsize=(10, 6))
        prd_values = [self.results.get(s, {}).get("accuracy", {}).get("prd", 0) for s in scenarios]
        bars = plt.bar(scenarios, prd_values, color='lightgreen')
        
        # Add threshold lines for IAAO standard
        plt.axhline(y=0.98, color='red', linestyle='--', alpha=0.7, label='IAAO Min (0.98)')
        plt.axhline(y=1.03, color='red', linestyle='--', alpha=0.7, label='IAAO Max (1.03)')
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height + 0.005,
                    f'{height:.3f}', ha='center', va='bottom', fontsize=10)
        
        plt.title('Price-Related Differential (PRD) by Scenario')
        plt.ylabel('PRD')
        plt.xlabel('Scenario')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.ylim(0.9, 1.1)  # Reasonable range for PRD
        plt.legend()
        plt.savefig(os.path.join(charts_dir, "prd_comparison.png"), dpi=100, bbox_inches='tight')
        plt.close()
        
        # 3. RMSE Comparison
        plt.figure(figsize=(10, 6))
        rmse_values = [self.results.get(s, {}).get("accuracy", {}).get("rmse", 0) for s in scenarios]
        bars = plt.bar(scenarios, rmse_values, color='salmon')
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height + (max(rmse_values) * 0.02),
                    f'${height:,.0f}', ha='center', va='bottom', fontsize=10)
        
        plt.title('Root Mean Square Error (RMSE) by Scenario')
        plt.ylabel('RMSE ($)')
        plt.xlabel('Scenario')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.ylim(0, max(rmse_values) * 1.1 if rmse_values else 100000)
        plt.savefig(os.path.join(charts_dir, "rmse_comparison.png"), dpi=100, bbox_inches='tight')
        plt.close()
        
        # 4. R² Comparison
        plt.figure(figsize=(10, 6))
        r2_values = [self.results.get(s, {}).get("accuracy", {}).get("r2", 0) for s in scenarios]
        bars = plt.bar(scenarios, r2_values, color='mediumpurple')
        
        # Add value labels on bars
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height + 0.02,
                    f'{height:.3f}', ha='center', va='bottom', fontsize=10)
        
        plt.title('R-squared (R²) by Scenario')
        plt.ylabel('R²')
        plt.xlabel('Scenario')
        plt.xticks(rotation=45, ha='right')
        plt.tight_layout()
        plt.ylim(0, 1.0)  # R² is always between 0 and 1
        plt.savefig(os.path.join(charts_dir, "r2_comparison.png"), dpi=100, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Comparison charts generated in {charts_dir}")
    
    def _generate_recommendations(self) -> str:
        """Generate automatic recommendations based on benchmark results"""
        if not self.results:
            return "No benchmark results available to generate recommendations."
        
        # Find best performing scenario for different metrics
        scenarios = [s["name"] for s in self.scenarios]
        
        best_cod_scenario = min(scenarios, 
                               key=lambda s: self.results.get(s, {}).get("accuracy", {}).get("cod", float('inf')))
        best_cod = self.results.get(best_cod_scenario, {}).get("accuracy", {}).get("cod", None)
        
        best_rmse_scenario = min(scenarios, 
                                key=lambda s: self.results.get(s, {}).get("accuracy", {}).get("rmse", float('inf')))
        best_rmse = self.results.get(best_rmse_scenario, {}).get("accuracy", {}).get("rmse", None)
        
        best_r2_scenario = max(scenarios, 
                              key=lambda s: self.results.get(s, {}).get("accuracy", {}).get("r2", 0))
        best_r2 = self.results.get(best_r2_scenario, {}).get("accuracy", {}).get("r2", None)
        
        # Check IAAO compliance
        compliant_scenarios = [s for s in scenarios 
                              if self.results.get(s, {}).get("iaao_compliance", {}).get("overall_compliant", False)]
        
        # Build recommendations
        recommendations = []
        
        # Overall best scenario
        if compliant_scenarios:
            best_compliant = compliant_scenarios[0]  # Simple approach: take first compliant scenario
            recommendations.append(f"<strong>IAAO Compliance:</strong> The '{best_compliant}' scenario meets all IAAO standards for mass appraisal accuracy.")
        else:
            recommendations.append("<strong>IAAO Compliance:</strong> No tested scenario fully meets IAAO standards. Further calibration is recommended.")
        
        # Specific metric recommendations
        if best_cod is not None:
            recommendations.append(f"<strong>Uniformity (COD):</strong> The '{best_cod_scenario}' scenario provides the best uniformity with a COD of {best_cod:.2f}%.")
        
        if best_rmse is not None:
            recommendations.append(f"<strong>Overall Accuracy (RMSE):</strong> The '{best_rmse_scenario}' scenario provides the lowest error with RMSE of ${best_rmse:,.0f}.")
        
        if best_r2 is not None:
            recommendations.append(f"<strong>Predictive Power (R²):</strong> The '{best_r2_scenario}' scenario provides the best model fit with R² of {best_r2:.3f}.")
        
        # Analyze parameters of best scenarios
        param_recommendations = []
        
        for scenario_name in scenarios:
            scenario_data = self.results.get(scenario_name, {})
            params = scenario_data.get("parameters", {})
            
            # Generate parameter-specific insights
            for param_name, param_value in params.items():
                if param_name == "location_weight" and scenario_name == best_cod_scenario:
                    param_recommendations.append(f"Setting location_weight to {param_value} improves valuation uniformity.")
                
                if param_name == "market_condition_factor" and scenario_name == best_rmse_scenario:
                    param_recommendations.append(f"A market_condition_factor of {param_value} produces more accurate overall valuations.")
                
                if param_name == "randomize_factor" and scenario_name == best_r2_scenario:
                    param_recommendations.append(f"Using randomize_factor of {param_value} improves model predictive power.")
        
        # Add parameter recommendations if any
        if param_recommendations:
            recommendations.append("<strong>Parameter Settings:</strong>")
            for rec in param_recommendations:
                recommendations.append(f"• {rec}")
        
        # Add general recommendations
        recommendations.append("<strong>Next Steps:</strong>")
        
        if not compliant_scenarios:
            recommendations.append("• Adjust model parameters to improve uniformity (reduce COD below 15%).")
            recommendations.append("• Review the PRD values to ensure they fall within the 0.98-1.03 range.")
        
        # Add neighborhood-specific recommendations
        neighborhood_issues = []
        for scenario_name in scenarios:
            neighborhood_metrics = self.results.get(scenario_name, {}).get("neighborhood_metrics", {})
            
            for n_id, n_data in neighborhood_metrics.items():
                if n_data.get("cod", 0) > 20:  # Very high COD
                    neighborhood_issues.append(f"• Neighborhood {n_id} shows high variability (COD: {n_data.get('cod', 0):.2f}%). Consider review of comparable selection criteria for this area.")
        
        if neighborhood_issues:
            recommendations.append("<strong>Neighborhood-Specific Recommendations:</strong>")
            recommendations.extend(neighborhood_issues[:3])  # Limit to top 3 issues
            if len(neighborhood_issues) > 3:
                recommendations.append(f"• Plus {len(neighborhood_issues) - 3} additional neighborhood issues (see detailed report).")
        
        return "<br>".join(recommendations)


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="GAMA Valuation Benchmarking Tool")
    parser.add_argument(
        "--test-data", 
        help="Path to test data file with known market values"
    )
    parser.add_argument(
        "--output-dir", 
        help="Directory to write reports to (default: benchmark_reports)"
    )
    parser.add_argument(
        "--scenarios-file", 
        help="JSON file with benchmark scenarios"
    )
    return parser.parse_args()


def main():
    """Main entry point"""
    args = parse_arguments()
    
    # Load custom scenarios if provided
    scenarios = None
    if args.scenarios_file and os.path.exists(args.scenarios_file):
        try:
            with open(args.scenarios_file, 'r') as f:
                scenarios = json.load(f)
        except Exception as e:
            logger.error(f"Error loading scenarios file: {e}")
    
    # Initialize benchmarking system
    benchmark = ValuationBenchmark(args.test_data, scenarios)
    
    # Run benchmark
    results = benchmark.run_benchmark()
    
    # Generate report
    report_dir = benchmark.generate_report(args.output_dir)
    
    if report_dir:
        print(f"\nBenchmark completed successfully!")
        print(f"Detailed report available at: {report_dir}")
        
        # Open the report if on a desktop system
        html_report = os.path.join(report_dir, "benchmark_report.html")
        if os.path.exists(html_report):
            try:
                import webbrowser
                webbrowser.open(f"file://{os.path.abspath(html_report)}")
            except:
                pass
    
    return 0


if __name__ == "__main__":
    sys.exit(main())