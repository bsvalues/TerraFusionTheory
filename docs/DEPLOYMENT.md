# GAMA Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the GAMA system in various environments, from development to production.

## Prerequisites

### System Requirements

#### Minimum Requirements
- CPU: 4 cores
- RAM: 8GB
- Storage: 20GB
- OS: Ubuntu 20.04 LTS or Windows Server 2019
- Network: 100Mbps

#### Recommended Requirements
- CPU: 8 cores
- RAM: 16GB
- Storage: 50GB
- OS: Ubuntu 22.04 LTS or Windows Server 2022
- Network: 1Gbps

### Software Requirements

#### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Node.js 16+
- Python 3.8+
- PostgreSQL 13+
- Redis 6+
- RabbitMQ 3.8+

#### Optional Software
- Nginx 1.18+
- Certbot
- Prometheus
- Grafana
- ELK Stack

## Environment Setup

### Development Environment

1. Clone the repository:
```bash
git clone https://github.com/terrafusion/gama.git
cd gama
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables:
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gama
DB_USER=gama
DB_PASSWORD=secure_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secure_password

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=gama
RABBITMQ_PASSWORD=secure_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=3600

# API
API_PORT=8000
API_HOST=localhost
```

4. Start development services:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Staging Environment

1. Set up staging server:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.0.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. Configure staging environment:
```bash
# Create staging directory
mkdir -p /opt/gama/staging
cd /opt/gama/staging

# Copy configuration
cp /path/to/gama/.env.staging .env
```

3. Deploy staging services:
```bash
docker-compose -f docker-compose.staging.yml up -d
```

### Production Environment

1. Set up production server:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.0.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. Configure production environment:
```bash
# Create production directory
mkdir -p /opt/gama/production
cd /opt/gama/production

# Copy configuration
cp /path/to/gama/.env.production .env
```

3. Deploy production services:
```bash
docker-compose -f docker-compose.production.yml up -d
```

## Deployment Process

### 1. Pre-deployment Checks

#### System Checks
```bash
# Check system resources
free -h
df -h
nproc

# Check network
ping -c 4 google.com
curl -I https://api.gama-county.ai

# Check ports
netstat -tulpn | grep LISTEN
```

#### Configuration Checks
```bash
# Validate environment variables
./scripts/validate_env.sh

# Check configuration files
./scripts/validate_config.sh

# Verify SSL certificates
./scripts/verify_ssl.sh
```

### 2. Database Setup

#### PostgreSQL
```bash
# Create database
createdb gama

# Run migrations
npm run migrate

# Seed data
npm run seed
```

#### Redis
```bash
# Test Redis connection
redis-cli ping

# Clear Redis cache
redis-cli FLUSHALL
```

#### RabbitMQ
```bash
# Create virtual host
rabbitmqctl add_vhost gama

# Create user
rabbitmqctl add_user gama secure_password

# Set permissions
rabbitmqctl set_permissions -p gama gama ".*" ".*" ".*"
```

### 3. Service Deployment

#### Frontend
```bash
# Build frontend
cd frontend
npm install
npm run build

# Deploy frontend
docker-compose -f docker-compose.frontend.yml up -d
```

#### Backend
```bash
# Build backend
cd backend
npm install
npm run build

# Deploy backend
docker-compose -f docker-compose.backend.yml up -d
```

#### Agent System
```bash
# Build agent system
cd agents
pip install -r requirements.txt
python setup.py install

# Deploy agent system
docker-compose -f docker-compose.agents.yml up -d
```

### 4. Monitoring Setup

#### Prometheus
```bash
# Configure Prometheus
cp prometheus.yml /etc/prometheus/

# Start Prometheus
docker-compose -f docker-compose.monitoring.yml up -d prometheus
```

#### Grafana
```bash
# Configure Grafana
cp grafana.ini /etc/grafana/

# Start Grafana
docker-compose -f docker-compose.monitoring.yml up -d grafana
```

#### ELK Stack
```bash
# Configure ELK
cp elasticsearch.yml /etc/elasticsearch/
cp logstash.conf /etc/logstash/
cp kibana.yml /etc/kibana/

# Start ELK
docker-compose -f docker-compose.monitoring.yml up -d elk
```

## Post-deployment

### 1. Health Checks

#### Service Health
```bash
# Check service status
docker-compose ps

# Check service logs
docker-compose logs

# Check service health
curl http://localhost:8000/health
```

#### Database Health
```bash
# Check PostgreSQL
pg_isready

# Check Redis
redis-cli ping

# Check RabbitMQ
rabbitmqctl status
```

### 2. Performance Testing

#### Load Testing
```bash
# Run load test
k6 run load-test.js

# Monitor performance
curl http://localhost:8000/metrics
```

#### Stress Testing
```bash
# Run stress test
k6 run stress-test.js

# Monitor system
top
htop
```

### 3. Backup Setup

#### Database Backup
```bash
# Configure backup
cp backup.sh /opt/gama/scripts/

# Schedule backup
crontab -e
0 0 * * * /opt/gama/scripts/backup.sh
```

#### Configuration Backup
```bash
# Backup configuration
tar -czf config-backup.tar.gz /opt/gama/config/

# Schedule backup
crontab -e
0 0 * * 0 tar -czf /opt/gama/backups/config-$(date +%Y%m%d).tar.gz /opt/gama/config/
```

## Maintenance

### 1. Regular Maintenance

#### System Updates
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Docker
sudo apt-get update && sudo apt-get upgrade docker-ce

# Update Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.0.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

#### Service Updates
```bash
# Update services
docker-compose pull
docker-compose up -d

# Clean up
docker system prune -f
```

### 2. Monitoring

#### System Monitoring
```bash
# Check system metrics
curl http://localhost:9090/metrics

# Check service metrics
curl http://localhost:8000/metrics
```

#### Log Monitoring
```bash
# Check logs
docker-compose logs -f

# Check ELK
curl http://localhost:5601
```

### 3. Troubleshooting

#### Common Issues
1. Service not starting
2. Database connection issues
3. Memory issues
4. Disk space issues
5. Network issues

#### Debug Commands
```bash
# Check service status
docker-compose ps

# Check service logs
docker-compose logs

# Check system resources
top
htop
df -h
free -h

# Check network
netstat -tulpn
ping -c 4 google.com
```

## Rollback Procedures

### 1. Service Rollback
```bash
# Stop services
docker-compose down

# Restore previous version
git checkout v1.0.0

# Start services
docker-compose up -d
```

### 2. Database Rollback
```bash
# Restore database
pg_restore -d gama backup.sql

# Verify data
psql -d gama -c "SELECT COUNT(*) FROM properties;"
```

### 3. Configuration Rollback
```bash
# Restore configuration
tar -xzf config-backup.tar.gz -C /opt/gama/

# Restart services
docker-compose restart
```

## Security

### 1. SSL Setup
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d gama-county.ai

# Configure Nginx
cp nginx.conf /etc/nginx/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Firewall Setup
```bash
# Configure UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp
sudo ufw enable
```

### 3. Security Monitoring
```bash
# Check security logs
tail -f /var/log/auth.log

# Check Docker logs
docker-compose logs -f

# Check application logs
tail -f /var/log/gama/app.log
```

## Support

### 1. Documentation
- [User Guide](docs/USER_GUIDE.md)
- [API Documentation](docs/API.md)
- [Security Guide](docs/SECURITY.md)
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

### 2. Contact
- Technical Support: support@gama-county.ai
- Security Issues: security@gama-county.ai
- Emergency: emergency@gama-county.ai

### 3. Resources
- [GitHub Repository](https://github.com/terrafusion/gama)
- [Documentation](https://docs.gama-county.ai)
- [Status Page](https://status.gama-county.ai)
- [Community Forum](https://community.gama-county.ai) 