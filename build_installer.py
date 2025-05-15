#!/usr/bin/env python3
# ICSF GAMA Simulator Build Script
# This script automates the process of building the executable and installer

import os
import sys
import shutil
import subprocess
import platform
import time

# Configuration
MAIN_SCRIPT = "icsf_gui_launcher.py"
EXE_NAME = "ICSF_GAMA_Launcher"
NSIS_SCRIPT = "ICSF_GAMA_Installer.nsi"
ICON_PATH = "assets/icsf_icon.ico"
VERSION = "1.0"

# Create assets directory if it doesn't exist
os.makedirs("assets", exist_ok=True)

def create_icon_if_missing():
    """Create a simple icon file if it doesn't exist"""
    if os.path.exists(ICON_PATH):
        return
    
    try:
        # Try to create a very basic icon if PIL is installed
        try:
            from PIL import Image, ImageDraw
            
            img = Image.new('RGBA', (256, 256), color=(255, 255, 255, 0))
            d = ImageDraw.Draw(img)
            
            # Draw a simple house-like icon
            # Outer square
            d.rectangle([(50, 80), (206, 236)], fill=(0, 100, 150), outline=(0, 0, 0))
            # Roof
            d.polygon([(30, 80), (128, 20), (226, 80)], fill=(150, 30, 30), outline=(0, 0, 0))
            # Door
            d.rectangle([(110, 160), (146, 236)], fill=(200, 150, 100), outline=(0, 0, 0))
            # Window left
            d.rectangle([(70, 120), (100, 150)], fill=(200, 230, 255), outline=(0, 0, 0))
            # Window right
            d.rectangle([(156, 120), (186, 150)], fill=(200, 230, 255), outline=(0, 0, 0))
            
            os.makedirs(os.path.dirname(ICON_PATH), exist_ok=True)
            img.save(ICON_PATH)
            print(f"Created placeholder icon at {ICON_PATH}")
        except ImportError:
            print("PIL not installed, skipping icon creation")
            print("Warning: No icon will be used for the executable")
    except Exception as e:
        print(f"Error creating icon: {e}")
        print("Continuing without an icon...")

def run_pyinstaller():
    """Run PyInstaller to create the executable"""
    print("Step 1: Building executable with PyInstaller...")
    
    # Check if PyInstaller is installed
    try:
        subprocess.run([sys.executable, "-m", "pip", "show", "pyinstaller"], 
                      check=True, capture_output=True)
    except subprocess.CalledProcessError:
        print("PyInstaller not found. Installing...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Failed to install PyInstaller: {e}")
            return False
    
    # Create icon if needed
    create_icon_if_missing()
    
    # Build command
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name", EXE_NAME,
        "--onefile",
    ]
    
    if os.path.exists(ICON_PATH):
        cmd.extend(["--icon", ICON_PATH])
    
    cmd.append(MAIN_SCRIPT)
    
    # Run PyInstaller
    try:
        subprocess.run(cmd, check=True)
        print("PyInstaller completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"PyInstaller failed: {e}")
        return False

def prepare_distribution():
    """Prepare the distribution folder with required files"""
    print("Step 2: Preparing distribution folder...")
    
    dist_dir = "dist"
    if not os.path.exists(dist_dir):
        print(f"Error: Distribution directory '{dist_dir}' not found")
        return False
    
    # Create required directories
    os.makedirs(os.path.join(dist_dir, "config"), exist_ok=True)
    os.makedirs(os.path.join(dist_dir, "output"), exist_ok=True)
    os.makedirs(os.path.join(dist_dir, "logs"), exist_ok=True)
    
    # Copy default configuration
    try:
        import json
        from icsf_gui_launcher import DEFAULT_PARAMETERS
        
        config_file = os.path.join(dist_dir, "config", "simulation_params.json")
        with open(config_file, 'w') as f:
            json.dump(DEFAULT_PARAMETERS, f, indent=2)
        print(f"Created default configuration at {config_file}")
    except Exception as e:
        print(f"Warning: Could not create default configuration: {e}")
    
    # Copy README and any other documentation
    try:
        if os.path.exists("README.txt"):
            shutil.copy("README.txt", os.path.join(dist_dir, "README.txt"))
        
        # Copy any other necessary files here
        
        print("Distribution folder prepared successfully")
        return True
    except Exception as e:
        print(f"Error preparing distribution folder: {e}")
        return False

def run_nsis():
    """Run NSIS to create the installer"""
    print("Step 3: Building installer with NSIS...")
    
    if not os.path.exists(NSIS_SCRIPT):
        print(f"Error: NSIS script '{NSIS_SCRIPT}' not found")
        return False
    
    # Detect NSIS executable
    nsis_cmd = None
    if platform.system() == "Windows":
        # Common NSIS installation paths on Windows
        possible_paths = [
            r"C:\Program Files\NSIS\makensis.exe",
            r"C:\Program Files (x86)\NSIS\makensis.exe"
        ]
        for path in possible_paths:
            if os.path.exists(path):
                nsis_cmd = path
                break
        
        if not nsis_cmd:
            print("NSIS not found in common locations.")
            print("Please ensure NSIS is installed and try again.")
            return False
    else:
        # On Linux/Mac try to use command line 'makensis'
        try:
            result = subprocess.run(["which", "makensis"], 
                                   check=True, capture_output=True, text=True)
            nsis_cmd = result.stdout.strip()
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("NSIS not found on this system.")
            print("Please install NSIS and try again.")
            return False
    
    # Run NSIS
    try:
        subprocess.run([nsis_cmd, NSIS_SCRIPT], check=True)
        print("NSIS installer created successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"NSIS failed: {e}")
        return False
    except Exception as e:
        print(f"Error running NSIS: {e}")
        return False

def main():
    """Main build process"""
    start_time = time.time()
    print(f"=== ICSF GAMA Simulator Build Process ===")
    print(f"Version: {VERSION}")
    print(f"Starting build at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 40)
    
    # Step 1: Build executable
    if not run_pyinstaller():
        print("Build process failed at step 1")
        return 1
    
    # Step 2: Prepare distribution
    if not prepare_distribution():
        print("Build process failed at step 2")
        return 1
    
    # Step 3: Build installer (if on Windows or NSIS is available)
    if platform.system() == "Windows" or shutil.which("makensis"):
        if not run_nsis():
            print("Build process failed at step 3")
            return 1
    else:
        print("Step 3: Skipping NSIS installer (not available on this platform)")
    
    # Complete
    elapsed_time = time.time() - start_time
    print("=" * 40)
    print(f"Build completed successfully in {elapsed_time:.1f} seconds")
    print(f"Executable located at: dist/{EXE_NAME}.exe")
    if os.path.exists(f"ICSF_GAMA_Simulator-{VERSION}-setup.exe"):
        print(f"Installer located at: ICSF_GAMA_Simulator-{VERSION}-setup.exe")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())