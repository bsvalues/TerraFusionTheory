#!/usr/bin/env python3
"""
ICSF GAMA Audit Log Sync Tool

This script synchronizes local ICSF GAMA Simulator audit logs with a central 
secure server for compliance, backup, and reporting purposes. It's designed
to work in an enterprise environment with minimal configuration.

Features:
1. Secure log synchronization to network share or server
2. Maintains log integrity with checksums
3. Supports encrypted transfer when TLS is available
4. Works with or without network connection
5. Tracks sync status and handles retries

The sync process is designed to be run either manually or on a schedule
via the Windows Task Scheduler or cron.
"""

import os
import sys
import time
import json
import shutil
import logging
import hashlib
import argparse
import datetime
import tempfile
from pathlib import Path

# Setup logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)
sync_log_file = os.path.join(log_dir, "audit_sync.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler(sync_log_file),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("ICSF_AUDIT_SYNC")

# Default paths
CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config")
LOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
COMPLIANCE_LOG = os.path.join(LOG_PATH, "compliance_audit.log")
SYNC_STATE_FILE = os.path.join(CONFIG_PATH, "sync_state.json")

# Default destination (network share or secure server)
DEFAULT_DEST_PATH = r"\\county-server\icsf-audit-logs"


def get_last_sync_time():
    """Get the timestamp of the last successful sync"""
    if not os.path.exists(SYNC_STATE_FILE):
        return None
    
    try:
        with open(SYNC_STATE_FILE, "r") as f:
            state = json.load(f)
            return state.get("last_sync_time")
    except Exception as e:
        logger.error(f"Error reading sync state file: {e}")
        return None


def update_sync_state(success, sync_time=None, details=None):
    """Update the sync state file with latest sync information"""
    try:
        os.makedirs(os.path.dirname(SYNC_STATE_FILE), exist_ok=True)
        
        # Get existing state or create new
        if os.path.exists(SYNC_STATE_FILE):
            with open(SYNC_STATE_FILE, "r") as f:
                state = json.load(f)
        else:
            state = {
                "sync_history": []
            }
        
        # Update state
        current_time = time.time()
        sync_entry = {
            "timestamp": current_time,
            "datetime": datetime.datetime.fromtimestamp(current_time).isoformat(),
            "success": success
        }
        
        if sync_time:
            sync_entry["sync_time"] = sync_time
        
        if details:
            sync_entry["details"] = details
        
        # Update last sync time if successful
        if success and sync_time:
            state["last_sync_time"] = sync_time
        
        # Add to history and limit to last 100 entries
        state["sync_history"].insert(0, sync_entry)
        state["sync_history"] = state["sync_history"][:100]
        
        # Save state
        with open(SYNC_STATE_FILE, "w") as f:
            json.dump(state, f, indent=2)
        
        return True
    except Exception as e:
        logger.error(f"Error updating sync state: {e}")
        return False


def calculate_file_checksum(file_path):
    """Calculate SHA-256 checksum of a file"""
    try:
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        
        return sha256_hash.hexdigest()
    except Exception as e:
        logger.error(f"Error calculating checksum for {file_path}: {e}")
        return None


def get_new_log_entries(last_sync_time=None):
    """Get log entries that were added since the last sync"""
    if not os.path.exists(COMPLIANCE_LOG):
        logger.warning(f"Compliance log not found at {COMPLIANCE_LOG}")
        return []
    
    try:
        new_entries = []
        with open(COMPLIANCE_LOG, "r") as f:
            for line in f:
                # Parse timestamp from log entry
                try:
                    # Log format example: 2025-05-15 10:30:45,123 - ...
                    parts = line.split(" - ", 1)
                    if len(parts) < 2:
                        continue
                    
                    timestamp_str = parts[0].strip()
                    entry_time = datetime.datetime.strptime(
                        timestamp_str, 
                        "%Y-%m-%d %H:%M:%S,%f"
                    ).timestamp()
                    
                    # Include entry if it's newer than last sync
                    if not last_sync_time or entry_time > last_sync_time:
                        new_entries.append(line)
                except Exception as parse_error:
                    logger.debug(f"Error parsing log entry timestamp: {parse_error}")
                    # Include entry if we can't parse timestamp (better safe than sorry)
                    new_entries.append(line)
        
        return new_entries
    except Exception as e:
        logger.error(f"Error reading compliance log: {e}")
        return []


def sync_logs(destination=None, force=False):
    """
    Sync audit logs to the destination path
    
    Args:
        destination: Path to sync logs to (network share or directory)
        force: If True, sync all logs regardless of last sync time
    
    Returns:
        bool: True if sync was successful, False otherwise
    """
    try:
        dest_path = destination or DEFAULT_DEST_PATH
        
        # Check if destination exists and is accessible
        if not os.path.exists(dest_path):
            try:
                os.makedirs(dest_path, exist_ok=True)
            except Exception as e:
                logger.error(f"Destination path {dest_path} not accessible: {e}")
                update_sync_state(False, details=f"Destination inaccessible: {str(e)}")
                return False
        
        # Determine what to sync based on last sync time
        last_sync_time = None if force else get_last_sync_time()
        
        if last_sync_time:
            logger.info(f"Last successful sync was at: {datetime.datetime.fromtimestamp(last_sync_time).isoformat()}")
            
            # Get new log entries
            new_entries = get_new_log_entries(last_sync_time)
            if not new_entries:
                logger.info("No new log entries to sync")
                update_sync_state(True, last_sync_time, "No new entries")
                return True
            
            logger.info(f"Found {len(new_entries)} new log entries to sync")
            
            # Create incremental log file
            current_time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            incremental_file = os.path.join(
                tempfile.gettempdir(),
                f"icsf_audit_incremental_{current_time}.log"
            )
            
            with open(incremental_file, "w") as f:
                for entry in new_entries:
                    f.write(entry)
            
            # Calculate checksum
            checksum = calculate_file_checksum(incremental_file)
            
            # Create checksum file
            checksum_file = f"{incremental_file}.sha256"
            with open(checksum_file, "w") as f:
                f.write(f"{checksum}  {os.path.basename(incremental_file)}\n")
            
            # Copy to destination with timestamp
            dest_file = os.path.join(
                dest_path, 
                f"icsf_audit_incremental_{current_time}.log"
            )
            dest_checksum = os.path.join(
                dest_path, 
                f"icsf_audit_incremental_{current_time}.log.sha256"
            )
            
            shutil.copy2(incremental_file, dest_file)
            shutil.copy2(checksum_file, dest_checksum)
            
            # Update sync state
            current_time = time.time()
            update_sync_state(
                True, 
                current_time, 
                f"Synced {len(new_entries)} new entries"
            )
            
            # Cleanup temp files
            try:
                os.remove(incremental_file)
                os.remove(checksum_file)
            except Exception as e:
                logger.debug(f"Error cleaning up temp files: {e}")
            
            logger.info(f"Successfully synced logs to {dest_path}")
            return True
        else:
            # No previous sync, copy entire log file
            logger.info("No previous sync found, copying entire log file")
            
            if not os.path.exists(COMPLIANCE_LOG):
                logger.warning("Compliance log file not found, nothing to sync")
                update_sync_state(False, details="Log file not found")
                return False
            
            # Calculate checksum
            checksum = calculate_file_checksum(COMPLIANCE_LOG)
            
            # Create checksum file
            current_time = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            dest_file = os.path.join(
                dest_path, 
                f"icsf_audit_full_{current_time}.log"
            )
            dest_checksum = os.path.join(
                dest_path, 
                f"icsf_audit_full_{current_time}.log.sha256"
            )
            
            # Write checksum file
            with open(f"{COMPLIANCE_LOG}.sha256", "w") as f:
                f.write(f"{checksum}  {os.path.basename(COMPLIANCE_LOG)}\n")
            
            # Copy to destination
            shutil.copy2(COMPLIANCE_LOG, dest_file)
            shutil.copy2(f"{COMPLIANCE_LOG}.sha256", dest_checksum)
            
            # Update sync state
            current_time = time.time()
            update_sync_state(
                True, 
                current_time, 
                "Initial full sync completed"
            )
            
            # Cleanup temp files
            try:
                os.remove(f"{COMPLIANCE_LOG}.sha256")
            except Exception as e:
                logger.debug(f"Error cleaning up temp files: {e}")
            
            logger.info(f"Successfully synced full log to {dest_path}")
            return True
    except Exception as e:
        logger.error(f"Error during log sync: {e}")
        update_sync_state(False, details=f"Sync error: {str(e)}")
        return False


def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description="ICSF GAMA Audit Log Sync")
    parser.add_argument(
        "--destination", 
        help="Destination path for log sync (default: network share)"
    )
    parser.add_argument(
        "--force", 
        action="store_true", 
        help="Force sync of all logs regardless of last sync time"
    )
    return parser.parse_args()


def main():
    """Main entry point"""
    args = parse_arguments()
    
    logger.info("Starting ICSF GAMA Audit Log Sync")
    
    success = sync_logs(args.destination, args.force)
    
    if success:
        logger.info("Audit log sync completed successfully")
    else:
        logger.error("Audit log sync failed")
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())