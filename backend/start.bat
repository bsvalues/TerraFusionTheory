@echo off
setlocal enabledelayedexpansion

REM Set environment variables
set "NODE_ENV=production"
set "PORT=8000"
set "DB_HOST=county-db"
set "DB_PORT=5432"
set "DB_NAME=gama"
set "DB_USER=gama_user"
set "JWT_SECRET=your-secure-jwt-secret"
set "SESSION_SECRET=your-secure-session-secret"

REM Load environment variables from config
if exist "config\env.bat" (
    call "config\env.bat"
)

REM Set security measures
set "RATE_LIMIT=100"
set "CORS_ORIGIN=http://localhost:3000"
set "SSL_KEY=config\ssl\private.key"
set "SSL_CERT=config\ssl\certificate.crt"

REM Start the backend service with security measures
echo Starting GAMA Backend...
node server.js ^
    --port %PORT% ^
    --db-host %DB_HOST% ^
    --db-port %DB_PORT% ^
    --db-name %DB_NAME% ^
    --db-user %DB_USER% ^
    --jwt-secret %JWT_SECRET% ^
    --session-secret %SESSION_SECRET% ^
    --rate-limit %RATE_LIMIT% ^
    --cors-origin %CORS_ORIGIN% ^
    --ssl-key %SSL_KEY% ^
    --ssl-cert %SSL_CERT% ^
    --security-headers ^
    --enable-audit-log ^
    --enable-request-logging

if %errorLevel% neq 0 (
    echo Error: Failed to start backend service.
    exit /b 1
) 