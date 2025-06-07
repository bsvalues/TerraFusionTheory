#!/bin/bash

set -e

echo "🔄 Starting GAMA-Genesis Rollback"

# Stop all services
echo "🛑 Stopping services..."
docker-compose -f deploy.yaml down

# Restore database backup if exists
if [ -f "backups/db_backup.sql" ]; then
    echo "🗃️ Restoring database..."
    docker-compose -f deploy.yaml exec -T gama-backend psql -U postgres -d gama < backups/db_backup.sql
fi

# Restore configuration files
echo "📝 Restoring configurations..."
if [ -d "backups/config" ]; then
    cp -r backups/config/* config/
fi

# Start services with previous version
echo "🚀 Starting previous version..."
docker-compose -f deploy.yaml up -d

# Verify rollback
echo "✅ Verifying rollback..."
curl -f http://localhost:3000/health || exit 1
curl -f http://localhost:8000/health || exit 1
curl -f http://localhost:8080/health || exit 1

echo "🎉 GAMA-Genesis rollback completed successfully!" 