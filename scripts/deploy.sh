#!/bin/bash

set -e

echo "🚀 Starting GAMA-Genesis Deployment"

# Check environment
if [ ! -f .env ]; then
    echo "❌ .env file not found"
    exit 1
fi

# Build images
echo "📦 Building Docker images..."
docker-compose -f deploy.yaml build

# Start services
echo "🚀 Starting services..."
docker-compose -f deploy.yaml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗃️ Running database migrations..."
docker-compose -f deploy.yaml exec gama-backend python -m alembic upgrade head

# Initialize agent system
echo "🤖 Initializing agent system..."
docker-compose -f deploy.yaml exec gama-agents python -m agents.init

# Verify deployment
echo "✅ Verifying deployment..."
curl -f http://localhost:3000/health || exit 1
curl -f http://localhost:8000/health || exit 1
curl -f http://localhost:8080/health || exit 1

echo "🎉 GAMA-Genesis deployment completed successfully!" 