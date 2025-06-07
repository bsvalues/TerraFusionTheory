# TerraFusion GAMA Enterprise Installation Guide

This guide provides detailed instructions for installing the TerraFusion GAMA Enterprise system on county assessment workstations. The Geographic Assisted Mass Appraisal (GAMA) system enables assessment professionals to leverage advanced geospatial technologies for accurate property valuation.

## System Requirements

Before installation, ensure your system meets the following requirements:

- **Operating System**: Windows 10/11 (64-bit) or Windows Server 2016/2019/2022
- **Processor**: Intel/AMD 64-bit processor, 2.0 GHz or faster
- **Memory**: 8 GB RAM minimum (16 GB recommended)
- **Disk Space**: 2 GB available hard disk space for application files
- **Additional**: 
  - Microsoft .NET Framework 4.7.2 or higher
  - Internet connection for updates (optional)
  - Administrative privileges for installation

## Pre-Installation Checklist

- [ ] Verify system meets minimum requirements
- [ ] Ensure you have administrative privileges
- [ ] Close all running applications
- [ ] Backup any existing configuration files if upgrading
- [ ] Disable antivirus temporarily during installation (optional)

## Installation Steps

### Standard Installation

1. **Download the Installer**
   - Obtain the TerraFusion GAMA Enterprise installer (`.msi` file) from your IT department
   - Verify the SHA-256 checksum if provided

2. **Run the Installer**
   - Right-click the installer and select "Run as administrator"
   - If prompted by User Account Control, click "Yes"

3. **Installation Wizard**
   - The TerraFusion GAMA Enterprise installation wizard will launch
   - Click "Next" to proceed

4. **License Agreement**
   - Read the End User License Agreement
   - Select "I accept the terms in the License Agreement" if you agree
   - Click "Next"

5. **Installation Location**
   - Choose the installation directory or accept the default location
   - Click "Next"

6. **Installation Options**
   - Select the components you wish to install:
     - Core Application (required)
     - Documentation
     - Sample Data
     - Desktop Shortcut
   - Click "Next"

7. **Ready to Install**
   - Review your installation settings
   - Click "Install" to begin the installation process

8. **Installation Progress**
   - The wizard will display the installation progress
   - This may take several minutes to complete

9. **Configuration Validation**
   - The installer will verify the configuration files
   - Any warnings or issues will be displayed

10. **Installation Complete**
    - Click "Finish" to complete the installation
    - Optionally select "Launch TerraFusion GAMA" to start the application

### Silent Installation (for IT Administrators)

For automated deployment across multiple workstations, you can use the silent installation method:

```cmd
msiexec /i TerraFusion_GAMA_Enterprise_1.2.0.msi /qn INSTALLLOCATION="C:\Program Files\TerraFusion"
```

Additional command-line parameters:
- `/qn`: No user interface
- `/qb`: Basic user interface
- `/l*v install.log`: Create verbose log file
- `INSTALLLOCATION`: Custom installation path
- `ADDDESKTOPSHORTCUT=0`: Disable desktop shortcut (default is 1)

## Post-Installation Setup

### First Launch Configuration

1. **Launch the Application**
   - Start TerraFusion GAMA Enterprise from the Start menu or desktop shortcut
   - The application will perform initial setup

2. **Authentication**
   - Enter your county credentials when prompted
   - Contact your system administrator if you don't have credentials

3. **Initial Configuration**
   - The application will guide you through initial configuration
   - Set up database connection (if applicable)
   - Configure default working directory

### DriftGuard Configuration (Optional)

If your county uses Kubernetes for deployment, you can enable DriftGuard configuration protection:

1. Open the configuration panel from Settings > System > Configuration Protection
2. Enable "Use DriftGuard for configuration protection"
3. Enter the DriftGuard service endpoint provided by your IT department
4. Click "Test Connection" to verify
5. Click "Apply" to save settings

## Troubleshooting

### Common Installation Issues

#### Error: "Installation failed with error code 1603"
- Ensure you have administrative privileges
- Temporarily disable antivirus software
- Verify the installer file is not corrupted

#### Warning: "Configuration validation failed"
- This is a non-critical warning
- The application will create default configuration files
- You can update configurations after installation

#### Error: ".NET Framework is missing"
- Download and install the required .NET Framework version
- Restart the installation process

### Getting Help

If you encounter issues during installation:

1. Check the installation log:
   - `C:\Program Files\TerraFusion\GAMA\logs\install.log`

2. Contact Technical Support:
   - Email: support@terrafusion.com
   - Phone: (555) 123-4567
   - Hours: Monday-Friday, 9am-5pm EST

## Updating TerraFusion GAMA Enterprise

TerraFusion GAMA Enterprise includes an auto-update feature that can check for and apply updates automatically:

1. Navigate to Settings > System > Updates
2. Click "Check for Updates" to manually check
3. If updates are available, follow the prompts to install

For environments without internet access, contact your IT department for manual update packages.

## Uninstalling

To uninstall TerraFusion GAMA Enterprise:

1. Open Control Panel > Programs > Programs and Features
2. Find "TerraFusion GAMA Enterprise" in the list
3. Click "Uninstall"
4. Follow the prompts to complete uninstallation

*Note: Uninstalling will not remove data files or custom configurations by default. To remove all files, select "Remove all files" during uninstallation.*

---

© 2025 TerraFusion. All rights reserved.
Version 1.2.0