@echo off
setlocal enabledelayedexpansion

echo GAMA Installation Wizard
echo ======================
echo.
echo This will install GAMA and all required components.
echo Please do not close this window during installation.
echo.
pause

REM Check for administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Error: This installer requires administrator privileges.
    echo Please right-click and select "Run as administrator".
    pause
    exit /b 1
)

REM Set environment variables
set "GAMA_HOME=%~dp0"
set "POSTGRES_VERSION=15.4"
set "POSTGRES_INSTALLER=postgresql-%POSTGRES_VERSION%-windows-x64.exe"
set "POSTGRES_URL=https://get.enterprisedb.com/postgresql/%POSTGRES_INSTALLER%"

REM Create required directories
echo Creating required directories...
if not exist "%GAMA_HOME%logs" mkdir "%GAMA_HOME%logs"
if not exist "%GAMA_HOME%data" mkdir "%GAMA_HOME%data"
if not exist "%GAMA_HOME%backup" mkdir "%GAMA_HOME%backup"
if not exist "%GAMA_HOME%config" mkdir "%GAMA_HOME%config"

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

REM Check for PostgreSQL
echo Checking for PostgreSQL...
sc query postgresql >nul 2>&1
if %errorLevel% neq 0 (
    echo PostgreSQL not found. Installing...
    
    REM Download PostgreSQL installer
    echo Downloading PostgreSQL...
    powershell -Command "& {Invoke-WebRequest -Uri '%POSTGRES_URL%' -OutFile '%TEMP%\%POSTGRES_INSTALLER%'}"
    
    REM Install PostgreSQL silently
    echo Installing PostgreSQL...
    "%TEMP%\%POSTGRES_INSTALLER%" --unattendedmodeui minimal --mode unattended --superpassword "GAMA@123" --serverport 5432
    
    REM Wait for installation to complete
    timeout /t 30 /nobreak
    
    REM Start PostgreSQL service
    echo Starting PostgreSQL service...
    net start postgresql
)

REM Create GAMA database and user
echo Configuring database...
psql -U postgres -c "CREATE DATABASE gama;" -c "CREATE USER gama_user WITH PASSWORD 'GAMA@123';" -c "GRANT ALL PRIVILEGES ON DATABASE gama TO gama_user;"

REM Install Node.js if not present
echo Checking for Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing Node.js...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v16.20.0/node-v16.20.0-x64.msi' -OutFile '%TEMP%\node.msi'}"
    msiexec /i "%TEMP%\node.msi" /qn
)

REM Install Python if not present
echo Checking for Python...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo Installing Python...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.8.10/python-3.8.10-amd64.exe' -OutFile '%TEMP%\python.exe'}"
    "%TEMP%\python.exe" /quiet InstallAllUsers=1 PrependPath=1
)

REM Install dependencies
echo Installing GAMA dependencies...
cd "%GAMA_HOME%frontend"
call npm install --production
cd "%GAMA_HOME%backend"
call npm install --production
cd "%GAMA_HOME%agents"
call pip install -r requirements.txt
cd "%GAMA_HOME%"

REM Create Windows services
echo Configuring GAMA services...
sc create GAMAFrontend binPath= "\"%GAMA_HOME%frontend\start.bat\"" start= auto obj= "NT AUTHORITY\NETWORK SERVICE"
sc create GAMABackend binPath= "\"%GAMA_HOME%backend\start.bat\"" start= auto obj= "NT AUTHORITY\NETWORK SERVICE"
sc create GAMAAgent binPath= "\"%GAMA_HOME%agents\start.bat\"" start= auto obj= "NT AUTHORITY\NETWORK SERVICE"

REM Start services
echo Starting GAMA services...
sc start GAMAFrontend
sc start GAMABackend
sc start GAMAAgent

REM Create desktop shortcut
echo Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\GAMA.lnk'); $Shortcut.TargetPath = '%GAMA_HOME%StartGAMA.bat'; $Shortcut.Save()"

echo.
echo GAMA has been successfully installed!
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

REM Open browser
echo Opening GAMA in your default browser...
start http://localhost:3000

pause 