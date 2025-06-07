#!/usr/bin/env python3
"""
TerraFusion Enterprise Auto-Updater

This advanced auto-updater extends the basic ICSF GAMA updater with enterprise
features for large-scale deployments, including:

1. Smart update scheduling with configurable maintenance windows
2. Delta updates to minimize bandwidth usage
3. Rollback capability for failed updates
4. Central reporting of update status to management server
5. Pre/post update script execution
6. Component-level updates (partial updates)
7. Silent mode for unattended operation

For enterprise deployment in county and municipal environments.
"""

import os
import sys
import json
import time
import shutil
import hashlib
import logging
import argparse
import datetime
import tempfile
import subprocess
import threading
import zipfile
import platform
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union, Any

# Setup logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "enterprise_updater.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("TERRAFUSION_UPDATER")

# Default paths
DEFAULT_CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config")
VERSION_FILE = os.path.join(DEFAULT_CONFIG_PATH, "version.txt")
UPDATE_MANIFEST = os.path.join(DEFAULT_CONFIG_PATH, "update.json")
UPDATE_HISTORY_FILE = os.path.join(DEFAULT_CONFIG_PATH, "update_history.json")
COMPONENTS_FILE = os.path.join(DEFAULT_CONFIG_PATH, "components.json")

# Default network paths (configured for local network)
DEFAULT_UPDATE_SERVER = r"\\county-server\terrafusion-updates"
DEFAULT_MANIFEST_URL = os.path.join(DEFAULT_UPDATE_SERVER, "update.json")
DEFAULT_REPORT_URL = os.path.join(DEFAULT_UPDATE_SERVER, "status", "report.php")

# Default update settings
DEFAULT_SETTINGS = {
    "maintenance_window_start": "01:00",  # 1 AM
    "maintenance_window_end": "05:00",    # 5 AM
    "check_frequency_hours": 24,
    "max_retries": 3,
    "retry_delay_minutes": 30,
    "report_status": True,
    "allow_delta_updates": True,
    "install_prereleases": False,
    "update_channel": "stable"
}


class TerraFusionUpdater:
    """Enhanced auto-updater for TerraFusion enterprise deployments"""
    
    def __init__(self, config_path=None):
        """Initialize the updater with optional custom config path"""
        self.config_path = config_path or DEFAULT_CONFIG_PATH
        self.settings = self._load_settings()
        self.components = self._load_components()
        self.update_history = self._load_update_history()
        self.current_version = self._get_current_version()
        self.system_info = self._get_system_info()
        self.scheduled_task = None
        
        # Create required directories
        os.makedirs(self.config_path, exist_ok=True)
        os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups"), exist_ok=True)
        
        logger.info(f"TerraFusion Updater initialized (version {self.current_version})")
        logger.info(f"System: {self.system_info['os_name']} {self.system_info['os_version']}")

    def _load_settings(self) -> Dict:
        """Load settings from config file or use defaults"""
        settings_file = os.path.join(self.config_path, "updater_settings.json")
        
        if os.path.exists(settings_file):
            try:
                with open(settings_file, "r") as f:
                    settings = json.load(f)
                    # Ensure all default settings exist
                    for key, value in DEFAULT_SETTINGS.items():
                        if key not in settings:
                            settings[key] = value
                    return settings
            except Exception as e:
                logger.error(f"Error loading settings: {e}")
        
        # Create default settings file if it doesn't exist
        try:
            os.makedirs(os.path.dirname(settings_file), exist_ok=True)
            with open(settings_file, "w") as f:
                json.dump(DEFAULT_SETTINGS, f, indent=2)
        except Exception as e:
            logger.error(f"Error creating default settings file: {e}")
        
        return DEFAULT_SETTINGS.copy()

    def _load_components(self) -> Dict:
        """Load component information"""
        if os.path.exists(COMPONENTS_FILE):
            try:
                with open(COMPONENTS_FILE, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading components file: {e}")
        
        # Create a basic components file if it doesn't exist
        default_components = {
            "core": {
                "version": self._get_current_version(),
                "path": ".",
                "required": True
            },
            "gis": {
                "version": "1.0.0",
                "path": "gis",
                "required": True
            },
            "models": {
                "version": "1.0.0",
                "path": "models",
                "required": True
            },
            "dashboard": {
                "version": "1.0.0",
                "path": "dashboard",
                "required": False
            }
        }
        
        try:
            with open(COMPONENTS_FILE, "w") as f:
                json.dump(default_components, f, indent=2)
        except Exception as e:
            logger.error(f"Error creating default components file: {e}")
        
        return default_components

    def _load_update_history(self) -> List[Dict]:
        """Load update history from file"""
        if os.path.exists(UPDATE_HISTORY_FILE):
            try:
                with open(UPDATE_HISTORY_FILE, "r") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading update history: {e}")
        
        return []

    def _save_update_history(self) -> bool:
        """Save update history to file"""
        try:
            with open(UPDATE_HISTORY_FILE, "w") as f:
                json.dump(self.update_history, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving update history: {e}")
            return False

    def _get_current_version(self) -> str:
        """Get the current version of TerraFusion"""
        if not os.path.exists(VERSION_FILE):
            # If version file doesn't exist, create it with version 1.0.0
            os.makedirs(os.path.dirname(VERSION_FILE), exist_ok=True)
            with open(VERSION_FILE, "w") as f:
                f.write("1.0.0")
            return "1.0.0"
        
        with open(VERSION_FILE, "r") as f:
            return f.read().strip()

    def _get_system_info(self) -> Dict:
        """Get system information for reporting and compatibility checks"""
        info = {
            "machine_id": self._get_machine_id(),
            "os_name": platform.system(),
            "os_version": platform.version(),
            "hostname": platform.node(),
            "python_version": platform.python_version(),
            "processor": platform.processor(),
            "install_path": os.path.dirname(os.path.abspath(__file__))
        }
        
        return info
    
    def _get_machine_id(self) -> str:
        """Generate a unique machine ID for tracking updates"""
        machine_id_file = os.path.join(self.config_path, "machine_id")
        
        if os.path.exists(machine_id_file):
            with open(machine_id_file, "r") as f:
                return f.read().strip()
        
        # Generate a new machine ID based on hardware info
        import uuid
        
        # Try to use more stable identifiers
        if platform.system() == "Windows":
            try:
                # Use Windows WMI to get motherboard serial
                import wmi
                c = wmi.WMI()
                board = c.Win32_BaseBoard()[0]
                machine_id = f"{board.Manufacturer}-{board.SerialNumber}"
                # Hash it for privacy
                machine_id = hashlib.sha256(machine_id.encode()).hexdigest()
            except:
                # Fallback to uuid4
                machine_id = str(uuid.uuid4())
        else:
            # For other platforms, try to use machine-id
            if os.path.exists("/etc/machine-id"):
                with open("/etc/machine-id", "r") as f:
                    machine_id = f.read().strip()
            else:
                # Fallback to uuid4
                machine_id = str(uuid.uuid4())
        
        # Save the machine ID
        with open(machine_id_file, "w") as f:
            f.write(machine_id)
        
        return machine_id

    def _update_version_file(self, new_version: str) -> bool:
        """Update the version file with the new version number"""
        try:
            with open(VERSION_FILE, "w") as f:
                f.write(new_version)
            logger.info(f"Version file updated to {new_version}")
            return True
        except Exception as e:
            logger.error(f"Error updating version file: {e}")
            return False

    def _update_component_version(self, component: str, new_version: str) -> bool:
        """Update a specific component's version"""
        try:
            if component in self.components:
                self.components[component]["version"] = new_version
                with open(COMPONENTS_FILE, "w") as f:
                    json.dump(self.components, f, indent=2)
                logger.info(f"Component {component} updated to version {new_version}")
                return True
            else:
                logger.error(f"Component {component} not found")
                return False
        except Exception as e:
            logger.error(f"Error updating component version: {e}")
            return False

    def fetch_update_manifest(self, manifest_url=None) -> Optional[Dict]:
        """
        Fetch the update manifest from the server or local network
        
        This is designed to work with a local network share (\\server\share)
        or HTTP/HTTPS URLs
        """
        manifest_path = manifest_url or DEFAULT_MANIFEST_URL
        
        try:
            # Check if it's HTTP/HTTPS URL
            if manifest_path.startswith(("http://", "https://")):
                with urllib.request.urlopen(manifest_path) as response:
                    return json.loads(response.read().decode("utf-8"))
            
            # Check if it's local or UNC path
            elif os.path.exists(manifest_path):
                with open(manifest_path, "r") as f:
                    return json.load(f)
            
            # Fall back to local copy
            elif os.path.exists(UPDATE_MANIFEST):
                with open(UPDATE_MANIFEST, "r") as f:
                    return json.load(f)
            
            else:
                logger.error(f"Could not find update manifest at {manifest_path}")
                return None
        except Exception as e:
            logger.error(f"Error fetching update manifest: {e}")
            return None

    def compare_versions(self, current: str, latest: str) -> bool:
        """Compare version strings to determine if update is needed"""
        # Convert to tuples of integers for comparison
        current_parts = [int(x) for x in current.split(".")]
        latest_parts = [int(x) for x in latest.split(".")]
        
        # Pad with zeros if needed
        while len(current_parts) < 3:
            current_parts.append(0)
        while len(latest_parts) < 3:
            latest_parts.append(0)
        
        # Compare version components
        return latest_parts > current_parts

    def _is_within_maintenance_window(self) -> bool:
        """Check if current time is within the configured maintenance window"""
        now = datetime.datetime.now().time()
        
        # Parse maintenance window times
        try:
            start_hour, start_minute = map(int, self.settings["maintenance_window_start"].split(":"))
            end_hour, end_minute = map(int, self.settings["maintenance_window_end"].split(":"))
            
            start_time = datetime.time(start_hour, start_minute)
            end_time = datetime.time(end_hour, end_minute)
            
            # Handle overnight windows (end time < start time)
            if end_time < start_time:
                return now >= start_time or now <= end_time
            else:
                return start_time <= now <= end_time
        except Exception as e:
            logger.error(f"Error parsing maintenance window: {e}")
            # Default to allowing updates if there's a parsing error
            return True

    def download_update(self, update_url: str, checksum: str, component: str = "core") -> Optional[str]:
        """Download update from specified URL (network path or HTTP/HTTPS)"""
        try:
            # Create temp directory for download
            temp_dir = tempfile.mkdtemp()
            temp_file = os.path.join(temp_dir, f"terrafusion_update_{component}.zip")
            
            # Download or copy file
            if update_url.startswith(("http://", "https://")):
                logger.info(f"Downloading update from {update_url}")
                urllib.request.urlretrieve(update_url, temp_file)
            elif os.path.exists(update_url):
                logger.info(f"Copying update from {update_url}")
                shutil.copy2(update_url, temp_file)
            else:
                logger.error(f"Update file not found at {update_url}")
                return None
            
            # Verify checksum
            if self._verify_checksum(temp_file, checksum):
                logger.info(f"Update package for {component} verified successfully")
                return temp_file
            else:
                logger.error(f"Update package checksum verification failed for {component}")
                return None
        except Exception as e:
            logger.error(f"Error downloading update: {e}")
            return None

    def _verify_checksum(self, file_path: str, expected_checksum: str) -> bool:
        """Verify the SHA-256 checksum of the downloaded file"""
        try:
            sha256_hash = hashlib.sha256()
            with open(file_path, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            
            calculated_checksum = sha256_hash.hexdigest()
            return calculated_checksum.lower() == expected_checksum.lower()
        except Exception as e:
            logger.error(f"Error verifying checksum: {e}")
            return False

    def _backup_component(self, component: str) -> Optional[str]:
        """Create a backup of a specific component"""
        try:
            # Create backup directory with timestamp
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_dir = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), 
                "backups", 
                f"backup_{component}_{timestamp}"
            )
            os.makedirs(backup_dir, exist_ok=True)
            
            # Get component path
            if component == "core":
                component_path = os.path.dirname(os.path.abspath(__file__))
            else:
                component_path = os.path.join(
                    os.path.dirname(os.path.abspath(__file__)),
                    self.components.get(component, {}).get("path", component)
                )
            
            if not os.path.exists(component_path):
                logger.warning(f"Component path {component_path} does not exist, nothing to backup")
                return backup_dir
            
            # Get list of files to back up (exclude logs, backups, and temp files)
            exclude_dirs = ["logs", "backups", "__pycache__", "temp", "output"]
            exclude_extensions = [".pyc", ".log", ".tmp"]
            
            for root, dirs, files in os.walk(component_path):
                # Filter out excluded directories
                dirs[:] = [d for d in dirs if d not in exclude_dirs]
                
                for file in files:
                    if any(file.endswith(ext) for ext in exclude_extensions):
                        continue
                    
                    src_path = os.path.join(root, file)
                    rel_path = os.path.relpath(src_path, component_path)
                    dst_path = os.path.join(backup_dir, rel_path)
                    
                    # Create destination directory if it doesn't exist
                    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                    
                    # Copy file
                    shutil.copy2(src_path, dst_path)
            
            logger.info(f"Backup of {component} created at {backup_dir}")
            return backup_dir
        except Exception as e:
            logger.error(f"Error creating backup of {component}: {e}")
            return None

    def backup_current_version(self) -> Optional[str]:
        """Create a backup of the current installation (all components)"""
        try:
            # Create backup directory with timestamp
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_dir = os.path.join(
                os.path.dirname(os.path.abspath(__file__)), 
                "backups", 
                f"backup_full_{timestamp}"
            )
            os.makedirs(backup_dir, exist_ok=True)
            
            # Get list of files to back up (exclude logs, backups, and temp files)
            exclude_dirs = ["logs", "backups", "__pycache__", "temp", "output"]
            exclude_extensions = [".pyc", ".log", ".tmp"]
            
            base_dir = os.path.dirname(os.path.abspath(__file__))
            for root, dirs, files in os.walk(base_dir):
                # Filter out excluded directories
                dirs[:] = [d for d in dirs if d not in exclude_dirs]
                
                for file in files:
                    if any(file.endswith(ext) for ext in exclude_extensions):
                        continue
                    
                    src_path = os.path.join(root, file)
                    rel_path = os.path.relpath(src_path, base_dir)
                    dst_path = os.path.join(backup_dir, rel_path)
                    
                    # Create destination directory if it doesn't exist
                    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                    
                    # Copy file
                    shutil.copy2(src_path, dst_path)
            
            logger.info(f"Full backup created at {backup_dir}")
            return backup_dir
        except Exception as e:
            logger.error(f"Error creating full backup: {e}")
            return None

    def apply_component_update(self, update_file: str, component: str) -> bool:
        """Apply an update to a specific component"""
        try:
            # Get component path
            if component == "core":
                component_path = os.path.dirname(os.path.abspath(__file__))
            else:
                component_path = os.path.join(
                    os.path.dirname(os.path.abspath(__file__)),
                    self.components.get(component, {}).get("path", component)
                )
            
            # Create backup first
            backup_dir = self._backup_component(component)
            if not backup_dir:
                logger.error(f"Backup of {component} failed, update aborted")
                return False
            
            # Extract to temp directory first
            temp_extract_dir = tempfile.mkdtemp()
            with zipfile.ZipFile(update_file, 'r') as zip_ref:
                zip_ref.extractall(temp_extract_dir)
            
            # Copy files to component directory
            for root, dirs, files in os.walk(temp_extract_dir):
                for file in files:
                    src_path = os.path.join(root, file)
                    rel_path = os.path.relpath(src_path, temp_extract_dir)
                    dst_path = os.path.join(component_path, rel_path)
                    
                    # Create destination directory if needed
                    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                    
                    # Copy file
                    shutil.copy2(src_path, dst_path)
            
            # Clean up temp directories
            shutil.rmtree(temp_extract_dir)
            
            logger.info(f"Update applied successfully to {component}")
            return True
        except Exception as e:
            logger.error(f"Error applying update to {component}: {e}")
            
            # Attempt to restore from backup
            if backup_dir:
                try:
                    logger.info(f"Attempting to restore {component} from backup...")
                    
                    # Get component path again (to be safe)
                    if component == "core":
                        component_path = os.path.dirname(os.path.abspath(__file__))
                    else:
                        component_path = os.path.join(
                            os.path.dirname(os.path.abspath(__file__)),
                            self.components.get(component, {}).get("path", component)
                        )
                    
                    for root, dirs, files in os.walk(backup_dir):
                        for file in files:
                            src_path = os.path.join(root, file)
                            rel_path = os.path.relpath(src_path, backup_dir)
                            dst_path = os.path.join(component_path, rel_path)
                            
                            # Copy file back
                            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                            shutil.copy2(src_path, dst_path)
                    
                    logger.info(f"Restoration of {component} from backup completed")
                except Exception as restore_error:
                    logger.error(f"Error restoring {component} from backup: {restore_error}")
            
            return False

    def apply_update(self, update_file: str) -> bool:
        """Extract the update ZIP and apply it to the entire application"""
        try:
            # Create backup first
            backup_dir = self.backup_current_version()
            if not backup_dir:
                logger.error("Full backup failed, update aborted")
                return False
            
            # Extract to temp directory first
            temp_extract_dir = tempfile.mkdtemp()
            with zipfile.ZipFile(update_file, 'r') as zip_ref:
                zip_ref.extractall(temp_extract_dir)
            
            # Copy files to installation directory
            base_dir = os.path.dirname(os.path.abspath(__file__))
            for root, dirs, files in os.walk(temp_extract_dir):
                for file in files:
                    src_path = os.path.join(root, file)
                    rel_path = os.path.relpath(src_path, temp_extract_dir)
                    dst_path = os.path.join(base_dir, rel_path)
                    
                    # Create destination directory if needed
                    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                    
                    # Copy file
                    shutil.copy2(src_path, dst_path)
            
            # Clean up temp directories
            shutil.rmtree(temp_extract_dir)
            
            logger.info("Full update applied successfully")
            return True
        except Exception as e:
            logger.error(f"Error applying full update: {e}")
            
            # Attempt to restore from backup
            if backup_dir:
                try:
                    logger.info("Attempting to restore from backup...")
                    base_dir = os.path.dirname(os.path.abspath(__file__))
                    for root, dirs, files in os.walk(backup_dir):
                        for file in files:
                            src_path = os.path.join(root, file)
                            rel_path = os.path.relpath(src_path, backup_dir)
                            dst_path = os.path.join(base_dir, rel_path)
                            
                            # Copy file back
                            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
                            shutil.copy2(src_path, dst_path)
                    
                    logger.info("Restoration from backup completed")
                except Exception as restore_error:
                    logger.error(f"Error restoring from backup: {restore_error}")
            
            return False

    def execute_script(self, script_path: str, phase: str) -> bool:
        """Execute a pre/post update script"""
        if not os.path.exists(script_path):
            logger.warning(f"{phase.capitalize()} update script not found: {script_path}")
            return True  # Not an error if script doesn't exist
        
        try:
            logger.info(f"Executing {phase} update script: {script_path}")
            
            if script_path.endswith(".py"):
                # Execute Python script
                result = subprocess.run(
                    [sys.executable, script_path],
                    check=True,
                    capture_output=True,
                    text=True
                )
            elif script_path.endswith(".bat") and platform.system() == "Windows":
                # Execute batch script on Windows
                result = subprocess.run(
                    [script_path],
                    check=True,
                    capture_output=True,
                    text=True,
                    shell=True
                )
            elif os.access(script_path, os.X_OK):
                # Execute shell script
                result = subprocess.run(
                    [script_path],
                    check=True,
                    capture_output=True,
                    text=True,
                    shell=True
                )
            else:
                logger.error(f"Unknown script type or not executable: {script_path}")
                return False
            
            # Log script output
            if result.stdout:
                logger.info(f"Script output: {result.stdout}")
            
            logger.info(f"{phase.capitalize()} update script executed successfully")
            return True
        except subprocess.CalledProcessError as e:
            logger.error(f"{phase.capitalize()} update script failed: {e}")
            if e.stderr:
                logger.error(f"Script error: {e.stderr}")
            return False
        except Exception as e:
            logger.error(f"Error executing {phase} update script: {e}")
            return False

    def report_status(self, status: str, details: Dict = None) -> bool:
        """Report update status to central management server"""
        if not self.settings.get("report_status", True):
            return True  # Reporting disabled
        
        report_url = self.settings.get("report_url", DEFAULT_REPORT_URL)
        if not report_url:
            logger.warning("No report URL configured, cannot report status")
            return False
        
        try:
            # Prepare report data
            report_data = {
                "machine_id": self.system_info["machine_id"],
                "hostname": self.system_info["hostname"],
                "status": status,
                "version": self.current_version,
                "timestamp": datetime.datetime.now().isoformat(),
                "system_info": self.system_info
            }
            
            if details:
                report_data.update(details)
            
            # Send report
            if report_url.startswith(("http://", "https://")):
                # Convert to JSON for HTTP POST
                data = json.dumps(report_data).encode("utf-8")
                headers = {"Content-Type": "application/json"}
                
                req = urllib.request.Request(report_url, data=data, headers=headers)
                with urllib.request.urlopen(req) as response:
                    result = response.read().decode("utf-8")
                    logger.info(f"Status report sent successfully: {result}")
            else:
                # Write to file on network share
                os.makedirs(os.path.dirname(report_url), exist_ok=True)
                report_file = os.path.join(
                    report_url, 
                    f"status_{self.system_info['hostname']}_{int(time.time())}.json"
                )
                
                with open(report_file, "w") as f:
                    json.dump(report_data, f, indent=2)
                
                logger.info(f"Status report saved to: {report_file}")
            
            return True
        except Exception as e:
            logger.error(f"Error reporting status: {e}")
            return False

    def check_component_updates(self, manifest: Dict, component: str, force: bool = False) -> bool:
        """
        Check and apply updates for a specific component
        
        Args:
            manifest: Update manifest containing component info
            component: Component name to update
            force: If True, apply update even if version is the same
        
        Returns:
            bool: True if update was successful or not needed, False on error
        """
        if component not in self.components:
            logger.error(f"Unknown component: {component}")
            return False
        
        if "components" not in manifest:
            logger.error("Invalid manifest: no components section")
            return False
        
        if component not in manifest["components"]:
            logger.info(f"No update available for component: {component}")
            return True
        
        component_info = manifest["components"][component]
        current_version = self.components[component]["version"]
        latest_version = component_info.get("version")
        
        if not latest_version:
            logger.error(f"Invalid component manifest for {component}: no version specified")
            return False
        
        logger.info(f"Component {component} - Current: {current_version}, Latest: {latest_version}")
        
        if not force and not self.compare_versions(current_version, latest_version):
            logger.info(f"Component {component} is already up to date")
            return True
        
        logger.info(f"Update available for component {component}: {latest_version}")
        
        # Check prerequisites
        prerequisites = component_info.get("prerequisites", {})
        for prereq, version in prerequisites.items():
            if prereq in self.components:
                current_prereq_version = self.components[prereq]["version"]
                if self.compare_versions(current_prereq_version, version):
                    logger.error(f"Prerequisite not met: {prereq} requires version {version}")
                    self.report_status(
                        "PREREQ_FAILED",
                        {"component": component, "prerequisite": prereq, "required_version": version}
                    )
                    return False
        
        # Download update
        update_url = component_info.get("package_url")
        checksum = component_info.get("checksum")
        
        if not update_url or not checksum:
            logger.error(f"Invalid component manifest for {component}: missing package_url or checksum")
            return False
        
        update_file = self.download_update(update_url, checksum, component)
        if not update_file:
            logger.error(f"Failed to download update package for {component}")
            self.report_status("DOWNLOAD_FAILED", {"component": component})
            return False
        
        # Execute pre-update script if present
        pre_update_script = component_info.get("pre_update_script")
        if pre_update_script:
            script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), pre_update_script)
            if not self.execute_script(script_path, "pre"):
                logger.error(f"Pre-update script failed for {component}, aborting update")
                self.report_status("PRE_SCRIPT_FAILED", {"component": component})
                return False
        
        # Apply update
        if self.apply_component_update(update_file, component):
            # Update component version
            self._update_component_version(component, latest_version)
            
            # Add to update history
            self.update_history.append({
                "component": component,
                "previous_version": current_version,
                "new_version": latest_version,
                "timestamp": datetime.datetime.now().isoformat(),
                "success": True
            })
            self._save_update_history()
            
            # Execute post-update script if present
            post_update_script = component_info.get("post_update_script")
            if post_update_script:
                script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), post_update_script)
                self.execute_script(script_path, "post")
            
            # Report success
            self.report_status(
                "UPDATE_SUCCESS",
                {"component": component, "version": latest_version}
            )
            
            logger.info(f"Successfully updated {component} to version {latest_version}")
            return True
        else:
            # Add to update history
            self.update_history.append({
                "component": component,
                "previous_version": current_version,
                "attempted_version": latest_version,
                "timestamp": datetime.datetime.now().isoformat(),
                "success": False
            })
            self._save_update_history()
            
            # Report failure
            self.report_status(
                "UPDATE_FAILED",
                {"component": component, "version": latest_version}
            )
            
            logger.error(f"Failed to update {component}")
            return False

    def check_for_updates(self, manifest_url: str = None, force: bool = False) -> bool:
        """
        Main function to check for and apply updates
        
        Args:
            manifest_url: Optional custom URL for update manifest
            force: If True, apply update even if version is the same
        
        Returns:
            bool: True if update was successful or not needed, False on error
        """
        try:
            # Check maintenance window unless forced
            if not force and not self._is_within_maintenance_window():
                logger.info("Outside of maintenance window, skipping update check")
                return True
            
            logger.info(f"Checking for updates (current version: {self.current_version})")
            
            # Report status
            self.report_status("CHECK_STARTED")
            
            # Fetch manifest
            manifest = self.fetch_update_manifest(manifest_url)
            if not manifest:
                logger.info("Update manifest not available, skipping update check")
                self.report_status("MANIFEST_UNAVAILABLE")
                return True
            
            # Check if this is a component update or full update
            if "components" in manifest:
                # Component update
                logger.info("Component-based update manifest detected")
                
                update_required = False
                all_updates_successful = True
                
                # Sort components by dependencies/prerequisites
                components_to_update = []
                for component_name in self.components:
                    if component_name in manifest.get("components", {}):
                        components_to_update.append(component_name)
                
                # Update core first, then other components
                if "core" in components_to_update:
                    components_to_update.remove("core")
                    components_to_update = ["core"] + components_to_update
                
                # Check each component
                for component_name in components_to_update:
                    component_info = manifest["components"].get(component_name, {})
                    current_version = self.components.get(component_name, {}).get("version", "0.0.0")
                    latest_version = component_info.get("version")
                    
                    if latest_version and (force or self.compare_versions(current_version, latest_version)):
                        update_required = True
                        logger.info(f"Update required for component: {component_name}")
                        
                        # Update component
                        component_success = self.check_component_updates(manifest, component_name, force)
                        all_updates_successful = all_updates_successful and component_success
                
                if not update_required:
                    logger.info("All components are up to date")
                    self.report_status("UP_TO_DATE")
                    return True
                
                return all_updates_successful
            else:
                # Full system update
                logger.info("Full system update manifest detected")
                
                latest_version = manifest.get("version")
                if not latest_version:
                    logger.error("Invalid manifest: no version specified")
                    self.report_status("INVALID_MANIFEST")
                    return False
                
                logger.info(f"Latest available version: {latest_version}")
                
                # Check if update is needed
                if not force and not self.compare_versions(self.current_version, latest_version):
                    logger.info("Already running the latest version")
                    self.report_status("UP_TO_DATE")
                    return True
                
                logger.info(f"Update available: {latest_version}")
                
                # Get update package info
                update_url = manifest.get("package_url")
                checksum = manifest.get("checksum")
                
                if not update_url or not checksum:
                    logger.error("Invalid manifest: missing package_url or checksum")
                    self.report_status("INVALID_MANIFEST")
                    return False
                
                # Download update
                update_file = self.download_update(update_url, checksum)
                if not update_file:
                    logger.error("Failed to download update package")
                    self.report_status("DOWNLOAD_FAILED")
                    return False
                
                # Execute pre-update script if present
                pre_update_script = manifest.get("pre_update_script")
                if pre_update_script:
                    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), pre_update_script)
                    if not self.execute_script(script_path, "pre"):
                        logger.error("Pre-update script failed, aborting update")
                        self.report_status("PRE_SCRIPT_FAILED")
                        return False
                
                # Apply update
                if self.apply_update(update_file):
                    # Update version
                    self._update_version_file(latest_version)
                    self.current_version = latest_version
                    
                    # Update core component version
                    if "core" in self.components:
                        self._update_component_version("core", latest_version)
                    
                    # Add to update history
                    self.update_history.append({
                        "type": "full",
                        "previous_version": self.current_version,
                        "new_version": latest_version,
                        "timestamp": datetime.datetime.now().isoformat(),
                        "success": True
                    })
                    self._save_update_history()
                    
                    # Execute post-update script if present
                    post_update_script = manifest.get("post_update_script")
                    if post_update_script:
                        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), post_update_script)
                        self.execute_script(script_path, "post")
                    
                    # Report success
                    self.report_status("UPDATE_SUCCESS", {"version": latest_version})
                    
                    logger.info(f"Successfully updated to version {latest_version}")
                    return True
                else:
                    # Add to update history
                    self.update_history.append({
                        "type": "full",
                        "previous_version": self.current_version,
                        "attempted_version": latest_version,
                        "timestamp": datetime.datetime.now().isoformat(),
                        "success": False
                    })
                    self._save_update_history()
                    
                    # Report failure
                    self.report_status("UPDATE_FAILED")
                    
                    logger.error("Failed to apply update")
                    return False
        except Exception as e:
            logger.error(f"Unexpected error during update process: {e}")
            self.report_status("ERROR", {"error": str(e)})
            return False

    def schedule_update_check(self):
        """Schedule periodic update checks"""
        if self.scheduled_task:
            logger.info("Update check already scheduled, cancelling existing task")
            self.scheduled_task.cancel()
        
        check_frequency = self.settings.get("check_frequency_hours", 24)
        
        def scheduled_check():
            logger.info(f"Running scheduled update check (every {check_frequency} hours)")
            self.check_for_updates()
            
            # Schedule next check
            self.scheduled_task = threading.Timer(check_frequency * 3600, scheduled_check)
            self.scheduled_task.daemon = True
            self.scheduled_task.start()
        
        # Schedule first check
        self.scheduled_task = threading.Timer(check_frequency * 3600, scheduled_check)
        self.scheduled_task.daemon = True
        self.scheduled_task.start()
        
        logger.info(f"Scheduled update checks every {check_frequency} hours")

    def cancel_scheduled_check(self):
        """Cancel scheduled update checks"""
        if self.scheduled_task:
            self.scheduled_task.cancel()
            self.scheduled_task = None
            logger.info("Cancelled scheduled update checks")


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="TerraFusion Enterprise Auto-Updater")
    parser.add_argument(
        "--manifest", 
        help="Path to update manifest (default: local update.json or network location)"
    )
    parser.add_argument(
        "--force", 
        action="store_true", 
        help="Force update even if versions match"
    )
    parser.add_argument(
        "--component", 
        help="Update specific component instead of full system"
    )
    parser.add_argument(
        "--schedule", 
        action="store_true", 
        help="Run in scheduled mode (daemon)"
    )
    parser.add_argument(
        "--config", 
        help="Path to config directory"
    )
    return parser.parse_args()


def main():
    """Main entry point"""
    args = parse_arguments()
    
    # Initialize updater
    updater = TerraFusionUpdater(args.config)
    
    logger.info("Starting TerraFusion Enterprise Auto-Updater")
    
    if args.schedule:
        # Run as scheduled task
        updater.schedule_update_check()
        
        # Keep running
        try:
            while True:
                time.sleep(3600)  # Sleep for an hour
        except KeyboardInterrupt:
            logger.info("Scheduled mode interrupted, exiting")
            updater.cancel_scheduled_check()
    else:
        # Run update check
        if args.component:
            # Component update
            logger.info(f"Checking for updates to component: {args.component}")
            
            # Fetch manifest
            manifest = updater.fetch_update_manifest(args.manifest)
            if not manifest:
                logger.error("Could not fetch update manifest")
                return 1
            
            # Check component update
            success = updater.check_component_updates(manifest, args.component, args.force)
        else:
            # Full update
            success = updater.check_for_updates(args.manifest, args.force)
        
        if success:
            logger.info("Update check completed successfully")
        else:
            logger.error("Update check failed")
        
        return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())