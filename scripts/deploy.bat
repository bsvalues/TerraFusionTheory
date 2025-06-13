@echo off
REM TerraFusionTheory Windows Deployment Script
REM Builds and deploys the project for production

REM Step 1: Install dependencies
call npm ci

REM Step 2: Build the project
call npm run build

REM Step 3: Deploy (customize as needed)
echo Deploying to production...
REM Example: call scp, rsync, or other deployment tools here
REM call scp -r dist/* user@server:/var/www/app

echo Deployment complete.
