@echo off
setlocal enabledelayedexpansion

REM Set environment variables
set "NODE_ENV=production"
set "PORT=3000"
set "API_URL=http://localhost:8000"
set "AGENT_URL=http://localhost:8080"

REM Load environment variables from config
if exist "config\env.bat" (
    call "config\env.bat"
)

REM Set security headers
set "SECURITY_HEADERS=--security-headers"
set "CSP_HEADER=default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"

REM Start the frontend service with security measures
echo Starting GAMA Frontend...
node server.js %SECURITY_HEADERS% --csp "%CSP_HEADER%" --port %PORT% --api-url %API_URL% --agent-url %AGENT_URL%

if %errorLevel% neq 0 (
    echo Error: Failed to start frontend service.
    exit /b 1
) 