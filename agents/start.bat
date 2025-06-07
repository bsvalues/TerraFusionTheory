@echo off
setlocal enabledelayedexpansion

REM Set environment variables
set "PYTHONPATH=%~dp0"
set "PORT=8080"
set "DB_HOST=county-db"
set "DB_PORT=5432"
set "DB_NAME=gama"
set "DB_USER=gama_user"
set "MODEL_PATH=models"
set "LOG_LEVEL=INFO"

REM Load environment variables from config
if exist "config\env.bat" (
    call "config\env.bat"
)

REM Set security measures
set "API_KEY=your-secure-api-key"
set "MAX_WORKERS=4"
set "MEMORY_LIMIT=4096"
set "SSL_KEY=config\ssl\private.key"
set "SSL_CERT=config\ssl\certificate.crt"

REM Start the agent system with security measures
echo Starting GAMA Agent System...
python main.py ^
    --port %PORT% ^
    --db-host %DB_HOST% ^
    --db-port %DB_PORT% ^
    --db-name %DB_NAME% ^
    --db-user %DB_USER% ^
    --model-path %MODEL_PATH% ^
    --log-level %LOG_LEVEL% ^
    --api-key %API_KEY% ^
    --max-workers %MAX_WORKERS% ^
    --memory-limit %MEMORY_LIMIT% ^
    --ssl-key %SSL_KEY% ^
    --ssl-cert %SSL_CERT% ^
    --enable-audit-log ^
    --enable-request-logging ^
    --enable-model-versioning

if %errorLevel% neq 0 (
    echo Error: Failed to start agent system.
    exit /b 1
) 