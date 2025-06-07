#!/bin/bash

set -e

echo "🚀 Starting GAMA-Genesis WSL Deployment"

# Check WSL status
if ! command -v wsl.exe &> /dev/null; then
    echo "❌ WSL not found. Please install WSL first."
    exit 1
fi

# Verify WSL configuration
if [ ! -f /etc/wsl.conf ]; then
    echo "⚠️ WSL configuration not found. Creating..."
    sudo cp wsl.conf /etc/wsl.conf
    echo "🔄 Please restart WSL for changes to take effect"
    wsl.exe --shutdown
    exit 1
fi

# Check Docker status
if ! systemctl is-active --quiet docker; then
    echo "⚠️ Docker service not running. Starting..."
    sudo service docker start
    sleep 10
fi

# Verify disk space
DISK_SPACE=$(df -h / | awk 'NR==2 {print $4}' | sed 's/G//')
if (( $(echo "$DISK_SPACE < 10" | bc -l) )); then
    echo "❌ Insufficient disk space. Please free up at least 10GB"
    exit 1
fi

# Build images with WSL-specific optimizations
echo "📦 Building Docker images..."
DOCKER_BUILDKIT=1 docker-compose -f deploy.yaml build \
    --build-arg WSL_MODE=true \
    --build-arg DISABLE_GPU=true

# Start services with resource limits
echo "🚀 Starting services..."
docker-compose -f deploy.yaml up -d \
    --scale gama-frontend=1 \
    --scale gama-backend=1 \
    --scale gama-agents=1 \
    --scale gama-spatial=1

# Wait for services with timeout
echo "⏳ Waiting for services to be ready..."
timeout=300
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3000/health > /dev/null && \
       curl -s http://localhost:8000/health > /dev/null && \
       curl -s http://localhost:8080/health > /dev/null; then
        break
    fi
    sleep 5
    timeout=$((timeout-5))
done

if [ $timeout -eq 0 ]; then
    echo "❌ Services failed to start within timeout"
    exit 1
fi

# Run database migrations with retry
echo "🗃️ Running database migrations..."
max_retries=3
retry_count=0
while [ $retry_count -lt $max_retries ]; do
    if docker-compose -f deploy.yaml exec gama-backend python -m alembic upgrade head; then
        break
    fi
    retry_count=$((retry_count+1))
    sleep 10
done

if [ $retry_count -eq $max_retries ]; then
    echo "❌ Database migrations failed after $max_retries attempts"
    exit 1
fi

# Initialize agent system with resource monitoring
echo "🤖 Initializing agent system..."
docker-compose -f deploy.yaml exec gama-agents python -m agents.init

# Verify deployment with detailed checks
echo "✅ Verifying deployment..."
for service in frontend backend spatial; do
    if ! curl -f http://localhost:$(case $service in
        frontend) echo "3000";;
        backend) echo "8000";;
        spatial) echo "8080";;
    esac)/health; then
        echo "❌ $service health check failed"
        exit 1
    fi
done

echo "🎉 GAMA-Genesis WSL deployment completed successfully!"

# Print resource usage
echo "📊 Resource Usage:"
docker stats --no-stream 