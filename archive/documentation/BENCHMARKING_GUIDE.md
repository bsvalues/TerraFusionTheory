# TerraFusion GAMA Benchmarking Guide

This guide provides instructions for using the GAMA Valuation Benchmarking tool to evaluate and improve property valuation accuracy.

## Overview

The GAMA Valuation Benchmarking tool allows you to:

1. Compare different valuation model configurations
2. Evaluate accuracy against industry standards (IAAO)
3. Identify areas for improvement in the valuation model
4. Generate comprehensive reports with visualizations
5. Receive automatic recommendations for parameter optimization

## Quick Start

To run a benchmark with default settings:

```bash
python gama_benchmarking.py
```

This will:
- Generate synthetic benchmark data if no test data is provided
- Run all default benchmark scenarios
- Generate a comprehensive HTML report with charts
- Open the report in your default browser (if available)

## Using Real Market Data

For the most accurate benchmarking, provide a dataset with known market values:

```bash
python gama_benchmarking.py --test-data path/to/market_data.json
```

The test data should be a GeoJSON file or JSON array containing property data with both 
property attributes and actual `market_value` fields.

## Custom Benchmark Scenarios

Create a JSON file with custom scenarios to test specific parameter combinations:

```json
[
  {
    "name": "Base Configuration",
    "description": "Standard valuation model settings",
    "parameters": {}
  },
  {
    "name": "High Location Weight",
    "description": "Emphasize location factors",
    "parameters": {
      "location_weight": 0.8,
      "neighborhood_factor": 1.2
    }
  },
  {
    "name": "Conservative Valuation",
    "description": "More conservative value adjustments",
    "parameters": {
      "value_adjust_factor": 0.95,
      "market_condition_factor": 1.02
    }
  }
]
```

Run with custom scenarios:

```bash
python gama_benchmarking.py --scenarios-file path/to/scenarios.json
```

## Understanding the Report

The benchmark report includes:

### Accuracy Metrics

- **COD (Coefficient of Dispersion)**: Measures valuation uniformity. IAAO standard is <15%.
- **PRD (Price-Related Differential)**: Detects systematic bias in valuations. IAAO standard is 0.98-1.03.
- **PRB (Price-Related Bias)**: Measures price-related bias using regression. IAAO standard is ±0.05.
- **RMSE (Root Mean Square Error)**: Average magnitude of valuation errors.
- **MAPE (Mean Absolute Percentage Error)**: Average percentage error.
- **R² (R-squared)**: How well the model explains value variation.

### Neighborhood Analysis

The report breaks down performance by neighborhood, helping identify areas with inconsistent valuations that may need specific attention.

### Value Tier Analysis

Examines how well the model performs across different value ranges (low, medium, high), helping detect systematic biases in valuation.

### Visualization Charts

The report includes visual charts for:
- COD comparison across scenarios
- PRD comparison across scenarios
- RMSE comparison across scenarios
- R² comparison across scenarios

### Recommendations

The tool automatically generates specific recommendations for parameter adjustments based on benchmark results.

## Integration with CI/CD

The benchmarking tool can be integrated into your CI/CD pipeline to ensure valuation models maintain accuracy standards over time:

```yaml
- name: Run GAMA benchmarks
  run: python gama_benchmarking.py --test-data ./data/benchmark_set.json
  
- name: Archive benchmark reports
  uses: actions/upload-artifact@v3
  with:
    name: benchmark-reports
    path: benchmark_reports/
```

## Troubleshooting

If you encounter issues:

- Ensure you have all required dependencies installed (see DEPENDENCIES.md)
- Verify test data format contains required fields (id, coordinates, property attributes, market_value)
- Check for sufficient data sample size (minimum 30 properties recommended)
- Review log file at logs/benchmark.log for detailed information

## Best Practices

1. Use real market data whenever possible
2. Include a diverse range of property types and values
3. Test multiple parameter combinations
4. Focus on IAAO compliance metrics
5. Review neighborhood-specific results for localized issues
6. Re-benchmark after any significant model changes

## Additional Resources

- `icsf_gama_simulation.py` - Core simulation logic
- `extended_auto_updater.py` - Enterprise updater system
- `audit_ai_review.py` - AI-driven audit review tool

## Contact

For more information or assistance with benchmarking, contact info@terrafusion.ai