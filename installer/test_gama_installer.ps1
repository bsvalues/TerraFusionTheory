# PowerShell script to automate testing of GAMA Enterprise Installer
# Usage: Run as Administrator on a clean Windows VM or user account

$installer = "GAMA_Setup_Enterprise_Pro.exe"
$logDir = "$env:ProgramFiles\GAMA"
$logFile = "$logDir\install_log.txt"

Write-Host "--- GAMA Installer Automated Test ---"

# 1. Interactive Install
Write-Host "[1] Starting INTERACTIVE install..."
Start-Process -FilePath ".\$installer" -Wait
Write-Host "[1] Interactive install complete."

# Check logs and shortcuts
if (Test-Path $logFile) {
    Write-Host "[1] Install log found: $logFile"
    Get-Content $logFile | Write-Host
} else {
    Write-Host "[1] ERROR: Install log not found."
}

if (Test-Path "$logDir\App\start.js") {
    Write-Host "[1] App installed successfully."
} else {
    Write-Host "[1] ERROR: App not found."
}

# 2. Silent Install
Write-Host "[2] Starting SILENT install..."
# Uninstall previous (if present)
$uninstaller = "$logDir\uninstall.exe"
if (Test-Path $uninstaller) {
    Write-Host "[2] Uninstalling previous version..."
    Start-Process -FilePath $uninstaller -ArgumentList "/S" -Wait
    Start-Sleep -Seconds 3
}

Start-Process -FilePath ".\$installer" -ArgumentList "/S" -Wait
Write-Host "[2] Silent install complete."

# Check logs and shortcuts again
if (Test-Path $logFile) {
    Write-Host "[2] Install log found: $logFile"
    Get-Content $logFile | Write-Host
} else {
    Write-Host "[2] ERROR: Install log not found."
}

if (Test-Path "$logDir\App\start.js") {
    Write-Host "[2] App installed successfully."
} else {
    Write-Host "[2] ERROR: App not found."
}

Write-Host "--- Test Complete ---"
