# ICSF GAMA Simulator

## Overview

The ICSF (Intelligent County Solutions Framework) GAMA (Geographic-Assisted Mass Appraisal) Simulator is a specialized tool for property assessment professionals. This simulator enables county assessors to model valuation changes based on policy adjustments, market conditions, and location factors.

## Key Features

- **Geospatial Simulation**: Models property values with location as a key factor
- **Policy Testing**: Test different assessment policy factors before implementation
- **Neighborhood Analysis**: Review valuation changes by neighborhood
- **GeoJSON Output**: View results on any GIS platform
- **Compliance Audit Logging**: Maintains detailed logs for compliance purposes

## Getting Started

### Installation

1. **Windows Installer**: Run the ICSF_GAMA_Installer.exe to install on Windows systems
2. **Manual Installation**: 
   - Ensure Python 3.8+ is installed
   - Clone or download this repository
   - Run `python icsf_gui_launcher.py` to start the application

### Usage

The simulator can be run in two modes:

#### Interactive Mode
Launch the application without parameters to access the menu interface:
```
python icsf_gui_launcher.py
```

#### Command Line Mode
Use command line parameters for scripted or automated operations:
```
python icsf_gui_launcher.py --run          # Run simulation and exit
python icsf_gui_launcher.py --view-map     # View output map and exit
python icsf_gui_launcher.py --view-log     # View compliance log and exit
```

## Simulation Parameters

The following parameters can be configured:

| Parameter | Description | Default |
|-----------|-------------|---------|
| policy_id | Identifier for the simulation run | policy_default |
| value_adjust_factor | Overall adjustment factor for property values | 1.0 |
| location_weight | Weight given to location factors (0.0-1.0) | 0.4 |
| market_condition_factor | Current market trend adjustment | 1.05 |
| neighborhood_factor | Neighborhood quality adjustment | 1.0 |
| randomize_factor | Random variation factor | 0.1 |
| sample_size | Number of sample properties to generate | 50 |
| market_year | Current tax year | 2025 |

## Output Files

- **GeoJSON**: Located in the `output` folder with filename pattern `valuation_layer_[policy_id].geojson`
- **Audit Logs**: Located in the `logs` folder as `compliance_audit.log`

## Interactive Map Viewer

The simulator includes an interactive web-based map viewer for visualizing simulation results:

- Located at `output/map_viewer.html`
- Automatically opened when choosing "View Output Map" in the menu
- Features color-coded property markers based on percent change
- Provides detailed property information on hover
- Works with any modern web browser

## Building from Source

See [README.txt](README.txt) for detailed build instructions with PyInstaller and NSIS.

## System Requirements

- **Operating System**: Windows 10/11, macOS 12+, or Linux
- **Python**: 3.8 or higher
- **Disk Space**: 50MB minimum
- **Memory**: 256MB minimum

## Support

For technical support, contact your county's IT department.

## License

This software is licensed for use by authorized county assessment personnel only. Unauthorized distribution or use is prohibited.