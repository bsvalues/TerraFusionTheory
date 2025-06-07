@echo off
setlocal enabledelayedexpansion

echo GAMA Deployment Launcher
echo =======================
echo.

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: This script requires administrator privileges.
    echo Please run as administrator.
    pause
    exit /b 1
)

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

REM Create required directories
echo Creating required directories...
if not exist "logs" mkdir logs
if not exist "backups" mkdir backups
if not exist "data" mkdir data

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

REM Check for PostgreSQL
pg_isready >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: PostgreSQL is not installed or not running.
    echo Please contact IT support to install and configure PostgreSQL.
    pause
    exit /b 1
)

REM Install dependencies
echo Installing dependencies...

REM Frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorLevel% neq 0 (
    echo Error: Failed to install frontend dependencies.
    pause
    exit /b 1
)
cd ..

REM Backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %errorLevel% neq 0 (
    echo Error: Failed to install backend dependencies.
    pause
    exit /b 1
)
cd ..

REM Python dependencies
echo Installing Python dependencies...
cd agents
call pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo Error: Failed to install Python dependencies.
    pause
    exit /b 1
)
cd ..

REM Configure services
echo Configuring services...

REM Create Windows services
echo Creating Windows services...
sc create GAMAFrontend binPath= "%~dp0frontend\start.bat" start= auto
sc create GAMABackend binPath= "%~dp0backend\start.bat" start= auto
sc create GAMAAgent binPath= "%~dp0agents\start.bat" start= auto

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