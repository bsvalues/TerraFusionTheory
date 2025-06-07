@echo off
setlocal enabledelayedexpansion

echo GAMA County Network Deployment
echo ============================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: This script requires administrator privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)

REM Set environment variables
set "GAMA_HOME=%~dp0"
set "GAMA_CONFIG=%GAMA_HOME%config"
set "GAMA_LOGS=%GAMA_HOME%logs"
set "GAMA_DATA=%GAMA_HOME%data"
set "GAMA_BACKUP=%GAMA_HOME%backup"

REM Create required directories
echo Creating required directories...
if not exist "%GAMA_LOGS%" mkdir "%GAMA_LOGS%"
if not exist "%GAMA_DATA%" mkdir "%GAMA_DATA%"
if not exist "%GAMA_BACKUP%" mkdir "%GAMA_BACKUP%"
if not exist "%GAMA_CONFIG%" mkdir "%GAMA_CONFIG%"

REM Check system requirements
echo Checking system requirements...
systeminfo | findstr /B /C:"Total Physical Memory" > temp.txt
set /p MEMORY=<temp.txt
del temp.txt
for /f "tokens=3" %%a in ("!MEMORY!") do set MEMORY=%%a
set MEMORY=!MEMORY:,=!

if !MEMORY! LSS 8000 (
    echo Warning: Less than 8GB RAM detected. GAMA may not perform optimally.
    echo.
)

REM Check disk space
for /f "tokens=3" %%a in ('dir /-c 2^>nul ^| find "bytes free"') do set FREE_SPACE=%%a
if !FREE_SPACE! LSS 50000000000 (
    echo Error: Less than 50GB free disk space required.
    echo Please free up some disk space and try again.
    pause
    exit /b 1
)

REM Check network connectivity
echo Checking network connectivity...
ping -n 1 county-db >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: Cannot connect to county database server.
    echo Please check network connectivity and try again.
    pause
    exit /b 1
)

REM Check for required software
echo Checking required software...

REM Check for Node.js
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: Node.js is not installed.
    echo Please contact IT support to install Node.js 16.x or higher.
    pause
    exit /b 1
)

REM Check for Python
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: Python is not installed.
    echo Please contact IT support to install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check for PostgreSQL client
psql --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: PostgreSQL client is not installed.
    echo Please contact IT support to install PostgreSQL client tools.
    pause
    exit /b 1
)

REM Verify network security
echo Verifying network security...
netsh advfirewall show currentprofile >nul 2>&1
if %errorLevel% neq 0 (
    echo Warning: Unable to verify firewall settings.
    echo Please ensure required ports are open:
    echo - Frontend: 3000
    echo - Backend: 8000
    echo - Agent System: 8080
)

REM Install dependencies
echo Installing dependencies...

REM Frontend dependencies
echo Installing frontend dependencies...
cd "%GAMA_HOME%frontend"
call npm install --production
if %errorLevel% neq 0 (
    echo Error: Failed to install frontend dependencies.
    pause
    exit /b 1
)
cd ..

REM Backend dependencies
echo Installing backend dependencies...
cd "%GAMA_HOME%backend"
call npm install --production
if %errorLevel% neq 0 (
    echo Error: Failed to install backend dependencies.
    pause
    exit /b 1
)
cd ..

REM Python dependencies
echo Installing Python dependencies...
cd "%GAMA_HOME%agents"
call pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo Error: Failed to install Python dependencies.
    pause
    exit /b 1
)
cd ..

REM Configure services
echo Configuring services...

REM Create Windows services with proper security
echo Creating Windows services...
sc create GAMAFrontend binPath= "\"%GAMA_HOME%frontend\start.bat\"" start= auto obj= "NT AUTHORITY\NETWORK SERVICE"
sc create GAMABackend binPath= "\"%GAMA_HOME%backend\start.bat\"" start= auto obj= "NT AUTHORITY\NETWORK SERVICE"
sc create GAMAAgent binPath= "\"%GAMA_HOME%agents\start.bat\"" start= auto obj= "NT AUTHORITY\NETWORK SERVICE"

REM Configure service recovery
sc failure GAMAFrontend reset= 86400 actions= restart/60000/restart/60000/restart/60000
sc failure GAMABackend reset= 86400 actions= restart/60000/restart/60000/restart/60000
sc failure GAMAAgent reset= 86400 actions= restart/60000/restart/60000/restart/60000

REM Start services
echo Starting services...
sc start GAMAFrontend
sc start GAMABackend
sc start GAMAAgent

REM Wait for services to be ready
echo Waiting for services to initialize...
timeout /t 30 /nobreak

REM Check service health
echo Checking service health...
curl -s http://localhost:3000/health >nul 2>&1
if %errorLevel% neq 0 (
    echo Warning: Frontend service may not be ready.
)

curl -s http://localhost:8000/health >nul 2>&1
if %errorLevel% neq 0 (
    echo Warning: Backend service may not be ready.
)

curl -s http://localhost:8080/health >nul 2>&1
if %errorLevel% neq 0 (
    echo Warning: AI Engine may not be ready.
)

REM Configure automatic backups
echo Configuring automatic backups...
schtasks /create /tn "GAMABackup" /tr "\"%GAMA_HOME%scripts\backup.bat\"" /sc daily /st 02:00 /ru "SYSTEM"

REM Open browser
echo Opening GAMA in your default browser...
start http://localhost:3000

echo.
echo GAMA has been successfully deployed!
echo.
echo System is accessible at: http://localhost:3000
echo Default credentials:
echo Username: admin
echo Password: ChangeMe123!
echo.
echo IMPORTANT: Change the default password immediately after first login.
echo.
echo For support, contact: support@gama-county.ai
echo.

REM Create desktop shortcut
echo Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\GAMA.lnk'); $Shortcut.TargetPath = '%~f0'; $Shortcut.Save()"

pause 