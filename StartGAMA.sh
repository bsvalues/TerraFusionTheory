#!/bin/bash

echo "GAMA Deployment Launcher"
echo "======================="
echo

# Check for root privileges
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script requires root privileges."
    echo "Please run with sudo."
    exit 1
fi

# Check system requirements
echo "Checking system requirements..."

# Check RAM
TOTAL_MEM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_MEM" -lt 8000 ]; then
    echo "Warning: Less than 8GB RAM detected. GAMA may not perform optimally."
    echo
fi

# Check disk space
FREE_SPACE=$(df -k . | awk 'NR==2 {print $4}')
if [ "$FREE_SPACE" -lt 50000000 ]; then
    echo "Error: Less than 50GB free disk space required."
    exit 1
fi

# Create required directories
echo "Creating required directories..."
mkdir -p logs backups data

# Check for Docker
echo "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    echo "Please install Docker using:"
    echo "curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check for Docker Compose
echo "Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed."
    echo "Please install Docker Compose using:"
    echo "sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

# Start Docker if not running
echo "Checking Docker service..."
if ! systemctl is-active --quiet docker; then
    echo "Starting Docker service..."
    systemctl start docker
    sleep 10
fi

# Build and start containers
echo "Building and starting GAMA services..."
docker-compose -f deploy.yaml build
if [ $? -ne 0 ]; then
    echo "Error: Failed to build Docker images."
    exit 1
fi

docker-compose -f deploy.yaml up -d
if [ $? -ne 0 ]; then
    echo "Error: Failed to start services."
    exit 1
fi

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 30

# Check service health
echo "Checking service health..."
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo "Warning: Frontend service may not be ready."
fi

if ! curl -s http://localhost:8000/health > /dev/null; then
    echo "Warning: Backend service may not be ready."
fi

if ! curl -s http://localhost:8080/health > /dev/null; then
    echo "Warning: AI Engine may not be ready."
fi

# Open browser if possible
echo "Attempting to open GAMA in your default browser..."
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
fi

echo
echo "GAMA has been successfully deployed!"
echo
echo "System is accessible at: http://localhost:3000"
echo "Default credentials:"
echo "Username: admin"
echo "Password: ChangeMe123!"
echo
echo "IMPORTANT: Change the default password immediately after first login."
echo
echo "For support, contact: support@gama-county.ai"
echo

read -p "Press Enter to continue..." 