# ICSF GAMA Simulator
# Build Instructions

## Overview

The ICSF GAMA (Geographic Assisted Mass Appraisal) Simulator is a tool for simulating property 
valuation scenarios based on geographical and market factors. This README provides instructions
for building the executable package from the Python source code.

## Requirements

- Python 3.8 or higher
- PyInstaller 5.0 or higher
- NSIS (Nullsoft Scriptable Install System) for creating Windows installers

## Installation of Development Tools

1. Install Python from https://www.python.org/downloads/
2. Install required Python packages:
   ```
   pip install pyinstaller
   ```
3. Install NSIS from https://nsis.sourceforge.io/Download

## Building the Executable

1. Open a command prompt or terminal
2. Navigate to the project directory
3. Run the following command to create a standalone executable:
   ```
   pyinstaller --name="ICSF_GAMA_Launcher" --onefile --icon=assets/icsf_icon.ico icsf_gui_launcher.py
   ```

   This creates a standalone executable in the `dist` folder.

4. Copy any additional data files to the `dist` folder if needed.

## Creating the Windows Installer

1. After successfully building the executable, run NSIS
2. Load the included NSIS script (`ICSF_GAMA_Installer.nsi`)
3. Compile the script to generate the installer

## Alternative: Build Script

You can also use the included build script to automate the process:

```
python build_installer.py
```

This script:
1. Runs PyInstaller to create the executable
2. Copies necessary files to the distribution folder
3. Runs NSIS to create the installer

## Deployment Notes

- The executable requires the following folders in its directory:
  - `config/`: Stores simulation parameters
  - `output/`: Stores GeoJSON output files
  - `logs/`: Stores compliance and simulation logs

- If these folders don't exist, the application will create them at runtime.

## Troubleshooting

- If PyInstaller fails with import errors, try building with the `--hidden-import` option to include 
  any missing modules.
- For issues with NSIS, ensure the path to NSIS is in your system PATH variable.
- If the executable fails to run, check for missing dependencies with a tool like Dependency Walker.

## Contact

For technical support, contact the IT department at your county administration office.

## License

This software is licensed for use by authorized county assessment personnel only. 
Unauthorized distribution or use is prohibited.