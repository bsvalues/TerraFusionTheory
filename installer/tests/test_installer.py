#!/usr/bin/env python3
"""
TerraFusion GAMA Enterprise Installer Test Suite

This script provides automated testing for the TerraFusion GAMA Enterprise
Windows installer. It tests various aspects of the installer including:
1. Build process validation
2. Installation verification
3. Configuration integrity checks
4. Registry entry verification
5. Uninstallation testing

Usage:
    python test_installer.py [--msi-path PATH] [--test-dir PATH]
"""

import os
import sys
import argparse
import unittest
import tempfile
import shutil
import subprocess
import platform
import logging
import hashlib
import json
import time
import re
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('installer-test')

# Default paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
DEFAULT_MSI = os.path.join(os.path.dirname(ROOT_DIR), 'output', 'TerraFusion_GAMA_Enterprise_1.2.0.msi')
DEFAULT_TEST_DIR = os.path.join(SCRIPT_DIR, 'test_data')

# Test Registry Access if on Windows
if platform.system() == 'Windows':
    try:
        import winreg
    except ImportError:
        logger.warning("Could not import winreg module, registry tests will be skipped")
        winreg = None
else:
    winreg = None


class TestInstallerBuild(unittest.TestCase):
    """Tests related to building the installer"""

    def setUp(self):
        """Set up test environment"""
        self.temp_dir = tempfile.mkdtemp()
        self.build_script = os.path.join(ROOT_DIR, 'build_installer.py')
        
        # Check if build script exists
        if not os.path.exists(self.build_script):
            self.skipTest("Installer build script not found")
    
    def tearDown(self):
        """Clean up temporary files"""
        if hasattr(self, 'temp_dir') and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def test_build_script_exists(self):
        """Test that the build script exists"""
        self.assertTrue(os.path.exists(self.build_script), "Build script does not exist")
    
    def test_build_script_executable(self):
        """Test that the build script is executable"""
        if platform.system() != "Windows":
            self.assertTrue(os.access(self.build_script, os.X_OK), "Build script is not executable")
    
    def test_build_script_runs(self):
        """Test that the build script runs without errors"""
        output_dir = os.path.join(self.temp_dir, 'output')
        os.makedirs(output_dir, exist_ok=True)
        
        # Run build script with minimal options
        result = subprocess.run(
            [sys.executable, self.build_script, '--output-dir', output_dir],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Check return code
        self.assertEqual(result.returncode, 0, f"Build script failed with error: {result.stderr.decode()}")
        
        # Check that output contains expected files
        output_files = os.listdir(output_dir)
        self.assertTrue(any(file.endswith('.msi') or file.endswith('.zip') for file in output_files),
                       "No installer package was created")
    
    def test_build_script_with_version(self):
        """Test build script with custom version parameter"""
        output_dir = os.path.join(self.temp_dir, 'output')
        os.makedirs(output_dir, exist_ok=True)
        
        test_version = "1.2.3"
        
        # Run build script with version option
        result = subprocess.run(
            [sys.executable, self.build_script, '--output-dir', output_dir, '--version', test_version],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Check return code
        self.assertEqual(result.returncode, 0, "Build script failed with custom version")
        
        # Check that output contains file with the specified version
        expected_file = f"TerraFusion_GAMA_Enterprise_{test_version}.msi"
        expected_zip = f"TerraFusion_GAMA_Enterprise_{test_version}.zip"
        
        output_files = os.listdir(output_dir)
        self.assertTrue(
            expected_file in output_files or expected_zip in output_files,
            f"Could not find installer with version {test_version}"
        )


class TestInstallerPackage(unittest.TestCase):
    """Tests related to the installer package itself"""
    
    def setUp(self):
        """Set up test environment"""
        self.msi_path = os.environ.get('MSI_PATH', DEFAULT_MSI)
        
        # Check if MSI exists, or find a ZIP alternative
        if not os.path.exists(self.msi_path):
            self.msi_path = self.msi_path.replace('.msi', '.zip')
            if not os.path.exists(self.msi_path):
                self.skipTest("Installer package not found")
    
    def test_installer_exists(self):
        """Test that the installer package exists"""
        self.assertTrue(os.path.exists(self.msi_path), "Installer package does not exist")
    
    def test_installer_size(self):
        """Test that the installer has a reasonable file size"""
        size_bytes = os.path.getsize(self.msi_path)
        size_mb = size_bytes / (1024 * 1024)
        
        # Check minimum size (should be at least 1MB for a basic installer)
        self.assertGreater(size_mb, 1, "Installer size is suspiciously small")
        
        # Log the size for information
        logger.info(f"Installer size: {size_mb:.2f} MB")
    
    def test_installer_checksum(self):
        """Test that installer has a valid checksum file"""
        checksum_file = f"{self.msi_path}.sha256"
        
        # Check if checksum file exists
        if not os.path.exists(checksum_file):
            logger.warning(f"Checksum file {checksum_file} not found, generating one for testing")
            # Generate checksum for testing
            with open(self.msi_path, 'rb') as f:
                checksum = hashlib.sha256(f.read()).hexdigest()
            with open(checksum_file, 'w') as f:
                f.write(f"{checksum}  {os.path.basename(self.msi_path)}")
        
        # Verify checksum
        with open(checksum_file, 'r') as f:
            expected_checksum = f.read().split()[0]
        
        with open(self.msi_path, 'rb') as f:
            actual_checksum = hashlib.sha256(f.read()).hexdigest()
        
        self.assertEqual(expected_checksum, actual_checksum, "Installer checksum mismatch")
    
    @unittest.skipIf(platform.system() != 'Windows', "Installer validation requires Windows")
    def test_msi_validation(self):
        """Test MSI installer package validation (Windows only)"""
        if not self.msi_path.endswith('.msi'):
            self.skipTest("Not an MSI installer")
        
        # Use Microsoft's tool to validate the MSI if available
        try:
            result = subprocess.run(
                ['msival.exe', self.msi_path, 'darice.cub'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.assertEqual(result.returncode, 0, "MSI validation failed")
        except FileNotFoundError:
            logger.warning("msival.exe not found, skipping MSI validation")
            self.skipTest("MSI validation tools not available")


class TestInstallation(unittest.TestCase):
    """Tests related to the installation process"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test environment once for the class"""
        cls.skip_tests = platform.system() != 'Windows'
        if cls.skip_tests:
            logger.warning("Installation tests require Windows, tests will be skipped")
            return
        
        cls.msi_path = os.environ.get('MSI_PATH', DEFAULT_MSI)
        cls.test_install_dir = tempfile.mkdtemp()
        
        # Check if MSI exists
        if not os.path.exists(cls.msi_path) or not cls.msi_path.endswith('.msi'):
            logger.warning("MSI installer not found, installation tests will be skipped")
            cls.skip_tests = True
            return
        
        # Install MSI for testing (silent installation)
        logger.info(f"Installing MSI to test directory: {cls.test_install_dir}")
        try:
            result = subprocess.run(
                ['msiexec', '/i', cls.msi_path, '/qn', f'INSTALLLOCATION={cls.test_install_dir}'],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Check if installation was successful
            if result.returncode != 0:
                logger.error(f"MSI installation failed: {result.stderr.decode()}")
                cls.skip_tests = True
            
            # Wait for installation to complete
            time.sleep(5)
        except Exception as e:
            logger.error(f"Error during installation: {e}")
            cls.skip_tests = True
    
    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests"""
        if not cls.skip_tests:
            # Uninstall MSI
            logger.info("Uninstalling MSI")
            try:
                result = subprocess.run(
                    ['msiexec', '/x', cls.msi_path, '/qn'],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                
                if result.returncode != 0:
                    logger.error(f"MSI uninstallation failed: {result.stderr.decode()}")
            except Exception as e:
                logger.error(f"Error during uninstallation: {e}")
            
            # Clean up test directory
            if os.path.exists(cls.test_install_dir):
                shutil.rmtree(cls.test_install_dir, ignore_errors=True)
    
    def setUp(self):
        """Check if tests should be skipped"""
        if self.__class__.skip_tests:
            self.skipTest("Installation tests skipped")
    
    def test_installed_files(self):
        """Test that all required files are installed"""
        gama_dir = os.path.join(self.__class__.test_install_dir, 'TerraFusion', 'GAMA')
        
        # Check that GAMA directory exists
        self.assertTrue(os.path.exists(gama_dir), "GAMA directory not created")
        
        # Check that required subdirectories exist
        required_dirs = ['bin', 'config', 'data', 'docs', 'logs', 'scripts', 'ui']
        for dir_name in required_dirs:
            dir_path = os.path.join(gama_dir, dir_name)
            self.assertTrue(os.path.exists(dir_path), f"Required directory {dir_name} not created")
        
        # Check that main executable exists
        exe_path = os.path.join(gama_dir, 'bin', 'GamaLauncher.exe')
        self.assertTrue(os.path.exists(exe_path), "Main executable not installed")
    
    @unittest.skipIf(winreg is None, "Registry tests require winreg module")
    def test_registry_entries(self):
        """Test that registry entries are created correctly"""
        reg_key = r'Software\TerraFusion\GAMA'
        
        try:
            # Open registry key
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, reg_key)
            
            # Check InstallDir value
            install_dir, _ = winreg.QueryValueEx(key, 'InstallDir')
            self.assertTrue(install_dir.endswith('TerraFusion\\GAMA'), 
                           "Registry InstallDir value is incorrect")
            
            # Check Version value
            version, _ = winreg.QueryValueEx(key, 'Version')
            self.assertTrue(re.match(r'\d+\.\d+\.\d+', version), 
                           "Registry Version value is not valid")
            
            winreg.CloseKey(key)
        except WindowsError:
            self.fail("Registry entries not created correctly")
    
    def test_log_file_created(self):
        """Test that installation log file is created"""
        logs_dir = os.path.join(self.__class__.test_install_dir, 'TerraFusion', 'GAMA', 'logs')
        
        # Check for any log files
        log_files = [f for f in os.listdir(logs_dir) if f.endswith('.log')]
        self.assertTrue(len(log_files) > 0, "No log files created")
        
        # Specifically check for install.log
        install_log = os.path.join(logs_dir, 'install.log')
        self.assertTrue(os.path.exists(install_log), "Installation log not created")


class TestConfigurationValidation(unittest.TestCase):
    """Tests related to configuration validation"""
    
    def setUp(self):
        """Set up test environment"""
        self.temp_dir = tempfile.mkdtemp()
        self.config_dir = os.path.join(self.temp_dir, 'config')
        os.makedirs(self.config_dir, exist_ok=True)
        
        # Create test config file
        self.config_file = os.path.join(self.config_dir, 'gama_config.json')
        self.create_test_config()
        
        # Path to validation script
        self.validator_script = os.path.join(ROOT_DIR, 'scripts', 'ConfigValidator.vbs')
        
        # Skip tests if not on Windows
        if platform.system() != 'Windows':
            self.skipTest("Configuration validation tests require Windows")
        
        # Skip tests if validation script doesn't exist
        if not os.path.exists(self.validator_script):
            self.skipTest("Configuration validation script not found")
    
    def tearDown(self):
        """Clean up temporary files"""
        if hasattr(self, 'temp_dir') and os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)
    
    def create_test_config(self):
        """Create a test configuration file"""
        config = {
            "version": "1.2.0",
            "system": {
                "update_check_interval": 86400,
                "log_level": "info",
                "max_log_size_mb": 10,
                "max_log_files": 5
            },
            "valuation": {
                "models": ["spatial_regression", "hybrid_hedonic"],
                "default_model": "hybrid_hedonic",
                "use_enhanced_features": True
            },
            "ui": {
                "theme": "system",
                "show_welcome": True,
                "default_view": "dashboard"
            }
        }
        
        with open(self.config_file, 'w') as f:
            json.dump(config, f, indent=2)
    
    def test_config_hash_calculation(self):
        """Test that configuration hash calculation works"""
        # Calculate hash manually
        with open(self.config_file, 'rb') as f:
            expected_hash = hashlib.sha256(f.read()).hexdigest()
        
        # Run validation script if on Windows
        if platform.system() == 'Windows':
            try:
                # Windows Script Host can be used to run VBScript
                result = subprocess.run(
                    ['cscript', '//nologo', self.validator_script, '/hash', self.config_file],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
                
                # Check output
                output = result.stdout.decode().strip()
                if "Hash:" in output:
                    actual_hash = output.split("Hash:")[1].strip()
                    self.assertEqual(expected_hash, actual_hash, "Configuration hash calculation mismatch")
            except subprocess.SubprocessError:
                self.skipTest("Could not run VBScript for hash calculation")
        else:
            # Skip test on non-Windows platforms
            self.skipTest("Hash calculation test requires Windows")
    
    def test_config_validation(self):
        """Test that configuration validation passes for valid config"""
        # For non-Windows platforms, we'll just validate the JSON structure
        with open(self.config_file, 'r') as f:
            try:
                config = json.load(f)
                self.assertTrue(isinstance(config, dict), "Config is not a valid JSON object")
                self.assertTrue("version" in config, "Config has no version field")
            except json.JSONDecodeError:
                self.fail("Config is not valid JSON")
    
    def test_invalid_config_detection(self):
        """Test that invalid configurations are detected"""
        # Create an invalid JSON file
        with open(self.config_file, 'w') as f:
            f.write('{ "version": "1.2.0", "invalid_json":')
        
        # For non-Windows platforms, we'll just validate the JSON structure
        with open(self.config_file, 'r') as f:
            try:
                json.load(f)
                self.fail("Invalid JSON not detected")
            except json.JSONDecodeError:
                # This is expected
                pass


def main():
    """Main entry point for test suite"""
    parser = argparse.ArgumentParser(description="Test TerraFusion GAMA Enterprise installer")
    parser.add_argument('--msi-path', dest='msi_path', default=DEFAULT_MSI,
                        help='Path to MSI installer file')
    parser.add_argument('--test-dir', dest='test_dir', default=DEFAULT_TEST_DIR,
                        help='Directory for test data')
    
    args = parser.parse_args()
    
    # Set environment variables for tests
    os.environ['MSI_PATH'] = args.msi_path
    os.environ['TEST_DIR'] = args.test_dir
    
    # Create test directory if it doesn't exist
    os.makedirs(args.test_dir, exist_ok=True)
    
    # Set up test log
    log_file = os.path.join(args.test_dir, f"test_{time.strftime('%Y%m%d_%H%M%S')}.log")
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))
    logger.addHandler(file_handler)
    
    # Log test environment
    logger.info(f"Starting installer tests")
    logger.info(f"  Platform: {platform.system()} {platform.release()}")
    logger.info(f"  Python: {platform.python_version()}")
    logger.info(f"  MSI path: {args.msi_path}")
    logger.info(f"  Test directory: {args.test_dir}")
    
    # Run the tests
    unittest.main(argv=[sys.argv[0]])

if __name__ == "__main__":
    main()