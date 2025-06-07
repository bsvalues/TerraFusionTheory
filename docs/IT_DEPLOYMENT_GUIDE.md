# GAMA IT Deployment Guide for County Networks

## Overview
This guide provides comprehensive instructions for deploying the GAMA system in a county network environment. It covers security requirements, network configuration, and system setup.

## Prerequisites

### Hardware Requirements
- Server with minimum 8GB RAM (16GB recommended)
- 50GB free disk space
- Multi-core processor (4+ cores recommended)
- Network connectivity to county database server

### Software Requirements
- Windows Server 2016 or later
- Node.js 16.x or higher
- Python 3.8 or higher
- PostgreSQL 13 or higher
- SSL certificates for secure communication

### Network Requirements
- Static IP address for the GAMA server
- Access to county database server
- Required ports:
  - 3000 (Frontend)
  - 8000 (Backend)
  - 8080 (Agent System)
  - 5432 (PostgreSQL)

## Security Considerations

### Network Security
1. Configure firewall rules:
   ```powershell
   # Allow inbound traffic for GAMA services
   New-NetFirewallRule -DisplayName "GAMA Frontend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "GAMA Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "GAMA Agent" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
   ```

2. Enable SSL/TLS:
   - Install SSL certificates in `config/ssl/`
   - Configure HTTPS for all services
   - Enable HSTS

3. Network isolation:
   - Place GAMA server in DMZ
   - Configure VLAN for GAMA services
   - Implement network segmentation

### System Security
1. Service accounts:
   - Create dedicated service accounts
   - Apply principle of least privilege
   - Use strong passwords

2. File permissions:
   - Restrict access to configuration files
   - Secure log directories
   - Protect sensitive data

3. Audit logging:
   - Enable system audit logs
   - Configure application logging
   - Set up log rotation

## Deployment Steps

### 1. System Preparation
1. Install required software:
   ```powershell
   # Install Node.js
   winget install OpenJS.NodeJS.LTS

   # Install Python
   winget install Python.Python.3.8

   # Install PostgreSQL
   winget install PostgreSQL.PostgreSQL
   ```

2. Configure system settings:
   ```powershell
   # Set system time to UTC
   Set-TimeZone -Id "UTC"

   # Configure power settings
   powercfg /change monitor-timeout-ac 0
   powercfg /change disk-timeout-ac 0
   ```

### 2. Database Setup
1. Create database and user:
   ```sql
   CREATE DATABASE gama;
   CREATE USER gama_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE gama TO gama_user;
   ```

2. Configure database security:
   ```sql
   ALTER USER gama_user WITH CONNECTION LIMIT 100;
   ALTER USER gama_user WITH VALID UNTIL 'infinity';
   ```

### 3. Service Configuration
1. Create service accounts:
   ```powershell
   # Create service accounts
   New-LocalUser -Name "GAMAService" -Password (ConvertTo-SecureString "secure_password" -AsPlainText -Force)
   Add-LocalGroupMember -Group "Users" -Member "GAMAService"
   ```

2. Configure Windows services:
   ```powershell
   # Create services
   sc create GAMAFrontend binPath= "C:\GAMA\frontend\start.bat" start= auto obj= "NT AUTHORITY\NETWORK SERVICE"
   sc create GAMABackend binPath= "C:\GAMA\backend\start.bat" start= auto obj= "NT AUTHORITY\NETWORK SERVICE"
   sc create GAMAAgent binPath= "C:\GAMA\agents\start.bat" start= auto obj= "NT AUTHORITY\NETWORK SERVICE"
   ```

### 4. Monitoring Setup
1. Configure performance monitoring:
   ```powershell
   # Enable performance counters
   lodctr /r
   lodctr GAMA.ini
   ```

2. Set up alerting:
   ```powershell
   # Configure event log alerts
   $action = New-ScheduledTaskAction -Execute "C:\GAMA\scripts\alert.bat"
   $trigger = New-ScheduledTaskTrigger -AtStartup
   Register-ScheduledTask -TaskName "GAMAAlert" -Action $action -Trigger $trigger
   ```

## Maintenance Procedures

### Daily Tasks
1. Check service status:
   ```powershell
   Get-Service GAMAFrontend, GAMABackend, GAMAAgent
   ```

2. Review logs:
   ```powershell
   Get-EventLog -LogName Application -Source "GAMA*" -After (Get-Date).AddDays(-1)
   ```

### Weekly Tasks
1. Database maintenance:
   ```sql
   VACUUM ANALYZE;
   REINDEX DATABASE gama;
   ```

2. Log rotation:
   ```powershell
   C:\GAMA\scripts\rotate-logs.ps1
   ```

### Monthly Tasks
1. Security updates:
   ```powershell
   # Check for updates
   winget upgrade --all
   ```

2. Performance review:
   ```powershell
   # Generate performance report
   C:\GAMA\scripts\performance-report.ps1
   ```

## Backup and Recovery

### Backup Configuration
1. Database backup:
   ```powershell
   # Create backup task
   $action = New-ScheduledTaskAction -Execute "C:\GAMA\scripts\backup-db.ps1"
   $trigger = New-ScheduledTaskTrigger -Daily -At 2AM
   Register-ScheduledTask -TaskName "GAMABackup" -Action $action -Trigger $trigger
   ```

2. File backup:
   ```powershell
   # Configure file backup
   C:\GAMA\scripts\configure-backup.ps1
   ```

### Recovery Procedures
1. Database recovery:
   ```powershell
   # Restore database
   C:\GAMA\scripts\restore-db.ps1 -BackupFile "backup.bak"
   ```

2. Service recovery:
   ```powershell
   # Restart services
   Restart-Service GAMAFrontend, GAMABackend, GAMAAgent
   ```

## Troubleshooting

### Common Issues
1. Service won't start:
   - Check service account permissions
   - Verify port availability
   - Review service logs

2. Database connection issues:
   - Verify network connectivity
   - Check database credentials
   - Review PostgreSQL logs

3. Performance problems:
   - Monitor system resources
   - Check database performance
   - Review application logs

### Support Resources
- Technical Support: support@gama-county.ai
- Emergency Contact: emergency@gama-county.ai
- Documentation: https://docs.gama-county.ai

## Compliance and Auditing

### Security Audits
1. Regular security scans:
   ```powershell
   # Run security scan
   C:\GAMA\scripts\security-scan.ps1
   ```

2. Vulnerability assessment:
   ```powershell
   # Check for vulnerabilities
   C:\GAMA\scripts\vulnerability-check.ps1
   ```

### Compliance Checks
1. Access control review:
   ```powershell
   # Review access permissions
   C:\GAMA\scripts\audit-access.ps1
   ```

2. Configuration validation:
   ```powershell
   # Validate system configuration
   C:\GAMA\scripts\validate-config.ps1
   ```

## Appendix

### A. Network Diagram
```
[County Network] <-> [Firewall] <-> [GAMA Server]
                          |
                    [Database Server]
```

### B. Port Configuration
| Service    | Port | Protocol | Purpose          |
|------------|------|----------|------------------|
| Frontend   | 3000 | TCP      | Web Interface    |
| Backend    | 8000 | TCP      | API Services     |
| Agent      | 8080 | TCP      | AI Processing    |
| Database   | 5432 | TCP      | PostgreSQL       |

### C. Service Accounts
| Service    | Account Type | Permissions                    |
|------------|--------------|--------------------------------|
| Frontend   | Network      | Read-only access to resources  |
| Backend    | Network      | Full access to API resources   |
| Agent      | Network      | Full access to AI resources    |

### D. Backup Schedule
| Type       | Frequency | Retention | Location          |
|------------|-----------|-----------|-------------------|
| Database   | Daily     | 30 days   | Local + Cloud     |
| Files      | Weekly    | 90 days   | Local + Cloud     |
| Logs       | Monthly   | 365 days  | Local + Archive   | 