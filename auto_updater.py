#!/usr/bin/env python3
"""
ICSF GAMA Auto-Updater

This script checks for updates to the ICSF GAMA Simulator from a local
network location or secure server. It's designed to run at application
startup and apply updates automatically if available.

The update process:
1. Reads local version from version.txt
2. Fetches update manifest from network share or server
3. Compares versions and downloads update if newer
4. Verifies SHA-256 checksums for security
5. Applies the update with minimal disruption

No external internet connection is required - updates come from the
county's secure intranet.
"""

import os
import sys
import json
import shutil
import hashlib
import logging
import argparse
import tempfile
import zipfile
import datetime
import subprocess
from pathlib import Path

# Setup logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "update_log.txt")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("ICSF_UPDATER")

# Default paths
DEFAULT_CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config")
VERSION_FILE = os.path.join(DEFAULT_CONFIG_PATH, "version.txt")
UPDATE_MANIFEST = os.path.join(DEFAULT_CONFIG_PATH, "update.json")

# Default network paths (configured for local network)
DEFAULT_UPDATE_SERVER = r"\\county-server\icsf-updates"
DEFAULT_MANIFEST_URL = os.path.join(DEFAULT_UPDATE_SERVER, "update.json")


def get_current_version():
    """Get the current version of the ICSF GAMA Simulator"""
    if not os.path.exists(VERSION_FILE):
        # If version file doesn't exist, create it with version 1.0.0
        os.makedirs(os.path.dirname(VERSION_FILE), exist_ok=True)
        with open(VERSION_FILE, "w") as f:
            f.write("1.0.0")
        return "1.0.0"
    
    with open(VERSION_FILE, "r") as f:
        return f.read().strip()


def fetch_update_manifest(manifest_url=None):
    """
    Fetch the update manifest from the server or local network
    
    This is designed to work with a local network share (\\server\share)
    or a local file, not requiring internet access
    """
    manifest_path = manifest_url or DEFAULT_MANIFEST_URL
    
    try:
        # Check if it's local or UNC path
        if os.path.exists(manifest_path):
            with open(manifest_path, "r") as f:
                return json.load(f)
        elif os.path.exists(UPDATE_MANIFEST):
            # Fall back to local copy
            with open(UPDATE_MANIFEST, "r") as f:
                return json.load(f)
        else:
            logger.error(f"Could not find update manifest at {manifest_path}")
            return None
    except Exception as e:
        logger.error(f"Error fetching update manifest: {e}")
        return None


def compare_versions(current, latest):
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


def download_update(update_url, checksum):
    """Download update from specified URL (local network path or file)"""
    try:
        # Create temp directory for download
        temp_dir = tempfile.mkdtemp()
        temp_file = os.path.join(temp_dir, "icsf_update.zip")
        
        # Copy file from network share or local path
        if os.path.exists(update_url):
            shutil.copy2(update_url, temp_file)
        else:
            logger.error(f"Update file not found at {update_url}")
            return None
        
        # Verify checksum
        if verify_checksum(temp_file, checksum):
            logger.info("Update package verified successfully")
            return temp_file
        else:
            logger.error("Update package checksum verification failed")
            return None
    except Exception as e:
        logger.error(f"Error downloading update: {e}")
        return None


def verify_checksum(file_path, expected_checksum):
    """Verify the SHA-256 checksum of the downloaded file"""
    try:
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        calculated_checksum = sha256_hash.hexdigest()
        return calculated_checksum == expected_checksum
    except Exception as e:
        logger.error(f"Error verifying checksum: {e}")
        return False


def backup_current_version():
    """Create a backup of the current installation"""
    try:
        # Create backup directory with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 
            "backups", 
            f"backup_{timestamp}"
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
        
        logger.info(f"Backup created at {backup_dir}")
        return backup_dir
    except Exception as e:
        logger.error(f"Error creating backup: {e}")
        return None


def apply_update(update_file):
    """Extract the update ZIP and apply it"""
    try:
        # Create backup first
        backup_dir = backup_current_version()
        if not backup_dir:
            logger.error("Backup failed, update aborted")
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
        
        logger.info("Update applied successfully")
        return True
    except Exception as e:
        logger.error(f"Error applying update: {e}")
        
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


def update_version_file(new_version):
    """Update the version file with the new version number"""
    try:
        with open(VERSION_FILE, "w") as f:
            f.write(new_version)
        logger.info(f"Version file updated to {new_version}")
        return True
    except Exception as e:
        logger.error(f"Error updating version file: {e}")
        return False


def check_for_updates(manifest_url=None, force=False):
    """
    Main function to check for and apply updates
    
    Args:
        manifest_url: Optional custom URL for update manifest
        force: If True, apply update even if version is the same
    
    Returns:
        bool: True if update was successful or not needed, False on error
    """
    try:
        current_version = get_current_version()
        logger.info(f"Current version: {current_version}")
        
        manifest = fetch_update_manifest(manifest_url)
        if not manifest:
            logger.info("Update manifest not available, skipping update check")
            return True
        
        latest_version = manifest.get("version")
        if not latest_version:
            logger.error("Invalid manifest: no version specified")
            return False
        
        logger.info(f"Latest available version: {latest_version}")
        
        if not force and not compare_versions(current_version, latest_version):
            logger.info("Already running the latest version")
            return True
        
        logger.info(f"Update available: {latest_version}")
        
        update_url = manifest.get("package_url")
        checksum = manifest.get("checksum")
        
        if not update_url or not checksum:
            logger.error("Invalid manifest: missing package_url or checksum")
            return False
        
        update_file = download_update(update_url, checksum)
        if not update_file:
            logger.error("Failed to download update package")
            return False
        
        if apply_update(update_file):
            update_version_file(latest_version)
            logger.info(f"Successfully updated to version {latest_version}")
            return True
        else:
            logger.error("Failed to apply update")
            return False
    except Exception as e:
        logger.error(f"Unexpected error during update process: {e}")
        return False


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="ICSF GAMA Auto-Updater")
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
        "--startup", 
        action="store_true", 
        help="Run in startup mode (quiet unless update available)"
    )
    return parser.parse_args()


def main():
    """Main entry point"""
    args = parse_arguments()
    
    if args.startup:
        # Reduce logging noise in startup mode
        logger.setLevel(logging.WARNING)
    
    logger.info("Starting ICSF GAMA Auto-Updater")
    
    success = check_for_updates(args.manifest, args.force)
    
    if success:
        logger.info("Update check completed successfully")
    else:
        logger.error("Update check failed")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())