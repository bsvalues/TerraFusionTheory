# TerraFusion Technical Integration Guide

This document provides technical specifications for integrating TerraFusion Alpha with existing firm systems during the pilot deployment.

## Core Components

### 1. Field PWA (Progressive Web App)
- **Technology Stack**: React + TypeScript + IndexedDB + Service Workers
- **Offline Capabilities**: Full offline data collection with sync when connection restores
- **Device Support**: iOS 14+, Android 9+, Modern browsers (Chrome, Safari, Edge)
- **Data Storage**: Local encryption of cached data with AES-256
- **Authentication**: OAuth 2.0 + Refresh Token pattern with biometric options

### 2. Event Timeline UI
- **Purpose**: SHAP + comp decision playback for audit and review
- **Data Structure**: Chronological event sequence with decision points
- **Storage Requirements**: ~50KB per valuation session
- **Performance Target**: <100ms for full timeline reconstruction
- **Retention Policy**: Configurable (default: 90 days)

### 3. Voice to Narrative Engine
- **Input Format**: WAV/MP3 audio or streaming microphone
- **Processing**: Edge inference with cloud fallback
- **Accuracy Requirement**: >95% for real estate terminology
- **Output Format**: Structured JSON with normalized data points
- **Integration Points**: Field app dictation, desktop comments, report generation

### 4. CV Scoring System
- **Purpose**: Computer vision analysis of property images
- **Features**: Auto-classification, condition assessment, feature detection
- **Processing**: Client-side inference with TensorFlow.js
- **Model Size**: ~25MB (one-time download)
- **Batch Processing**: Up to 50 images per session

### 5. Smart Ledger v2
- **Data Storage**: Immutable action log for all valuation decisions
- **Schema**: Event-sourced architecture with complete state reconstruction
- **Security**: SHA-256 hashing of event chains for tamper detection
- **Export Formats**: JSON, CSV, structured XML
- **Retention**: Full history with configurable archiving

## Integration Points

### MLS System Integration
- **Connection Methods**:
  - REST API (preferred)
  - RETS legacy support
  - CSV/XML batch import
- **Authentication**: OAuth 2.0 or API key with IP restriction
- **Rate Limits**: 1000 requests/hour per organization
- **Data Mapping**: Standardized schema available via `/api/schema/mls`

### CRM Integration
- **Supported Platforms**:
  - Salesforce
  - Microsoft Dynamics
  - Custom REST endpoints
- **Data Exchange**: Bi-directional with webhook notifications
- **User Mapping**: Active Directory or SAML federation
- **Custom Fields**: Dynamic mapping via configuration UI

### Document Management
- **Export Formats**: PDF/A, PDF/UA (accessibility compliant)
- **Metadata**: XMP embedded property data
- **Storage Options**: Direct to cloud storage (S3, Azure, GCP)
- **Workflow Integration**: Automated filing based on client/property tags
- **Version Control**: Full revision history with differential comparison

### Authentication Systems
- **Supported Methods**:
  - SAML 2.0
  - OAuth 2.0 + OIDC
  - Azure AD
  - Google Workspace
- **MFA Support**: TOTP, SMS, Push notifications
- **Session Management**: Configurable timeout (default: 4 hours)
- **User Provisioning**: SCIM 2.0 or manual CSV import

## Technical Requirements

### Hosting Environment
- **Cloud Deployment**: AWS, Azure, or GCP
- **On-Premises Option**: Docker containers + Kubernetes
- **Minimum Specs**:
  - 4 vCPUs
  - 16GB RAM
  - 100GB SSD storage
  - 100Mbps network
- **Scaling**: Horizontal auto-scaling with load balancers

### Client Requirements
- **Desktop**:
  - Modern browsers (Chrome, Firefox, Edge, Safari)
  - 8GB RAM minimum
  - Hardware acceleration for WebGL
- **Mobile**:
  - iOS 14+ or Android 9+
  - 3GB RAM minimum
  - GPS and camera access

### Network Requirements
- **Bandwidth**: 5Mbps minimum per user
- **Latency**: <100ms for optimal experience
- **Ports**: 443 (HTTPS), optional websocket support
- **Firewall Rules**: Outbound access to TerraFusion API endpoints
- **VPN Compatibility**: Tested with major VPN providers

### Security Compliance
- **Data Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Regulatory**: SOC 2 Type II certified
- **Privacy**: GDPR and CCPA compliant
- **Audit Logging**: Complete activity tracking with user attribution
- **Penetration Testing**: Quarterly by independent security firms

## Data Exchange Formats

### Property Data
```json
{
  "property_id": "TF-12345",
  "address": {
    "street": "123 Main St",
    "city": "Anytown",
    "state": "CA",
    "zip": "90210"
  },
  "characteristics": {
    "bedrooms": 4,
    "bathrooms": 2.5,
    "sqft": 2500,
    "lot_size": 0.25,
    "year_built": 2005
  },
  "valuation": {
    "estimate": 520000,
    "confidence": 0.92,
    "date": "2025-05-01T10:00:00Z"
  },
  "comps": [
    {
      "comp_id": "MLS-55555",
      "similarity": 0.95,
      "adjustments": [...]
    }
  ]
}
```

### Event Timeline Format
```json
{
  "session_id": "session-6789",
  "user_id": "appraiser-123",
  "subject_property": "TF-12345",
  "timestamp_start": "2025-05-01T10:00:00Z",
  "timestamp_end": "2025-05-01T10:45:23Z",
  "events": [
    {
      "event_id": "evt-001",
      "timestamp": "2025-05-01T10:02:15Z",
      "action": "comp_selected",
      "data": {
        "comp_id": "MLS-55555",
        "similarity": 0.95,
        "selection_method": "manual"
      }
    },
    {
      "event_id": "evt-002",
      "timestamp": "2025-05-01T10:03:48Z",
      "action": "adjustment_applied",
      "data": {
        "comp_id": "MLS-55555",
        "feature": "square_footage",
        "original_value": 2300,
        "adjusted_value": 2500,
        "adjustment_amount": 15000,
        "confidence": 0.94
      }
    }
  ]
}
```

### Voice Narration Schema
```json
{
  "narration_id": "nar-12345",
  "audio_reference": "s3://terrafusion-assets/narrations/nar-12345.mp3",
  "transcript": "The subject property is a four bedroom, two and a half bath home built in 2005 with approximately 2,500 square feet on a quarter acre lot.",
  "structured_data": {
    "property_type": "single_family",
    "bedrooms": 4,
    "bathrooms": 2.5,
    "year_built": 2005,
    "square_footage": 2500,
    "lot_size": 0.25
  },
  "confidence": 0.97,
  "timestamp": "2025-05-01T10:15:32Z"
}
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Obtain access token
- `POST /api/v1/auth/refresh` - Refresh expired token
- `POST /api/v1/auth/logout` - Invalidate token

### Properties
- `GET /api/v1/properties` - List properties (paginated)
- `GET /api/v1/properties/:id` - Get property details
- `POST /api/v1/properties` - Create new property
- `PUT /api/v1/properties/:id` - Update property
- `GET /api/v1/properties/:id/comps` - Get comparable properties

### Valuations
- `POST /api/v1/valuations` - Create new valuation
- `GET /api/v1/valuations/:id` - Get valuation details
- `PUT /api/v1/valuations/:id` - Update valuation
- `POST /api/v1/valuations/:id/report` - Generate valuation report
- `GET /api/v1/valuations/:id/timeline` - Get valuation event timeline

### Field Data
- `POST /api/v1/field/sync` - Synchronize offline data
- `POST /api/v1/field/photos` - Upload property photos
- `POST /api/v1/field/audio` - Upload voice narrations
- `GET /api/v1/field/assignments` - Get field assignments

### Analytics
- `GET /api/v1/analytics/usage` - Get usage statistics
- `GET /api/v1/analytics/performance` - Get performance metrics
- `GET /api/v1/analytics/valuation_accuracy` - Get valuation accuracy metrics

## Implementation Timeline

### Week 1: Environment Setup
- Deploy TerraFusion infrastructure
- Configure authentication integration
- Set up data connectors for MLS/CRM
- Establish secure network connections

### Week 2: Data Migration
- Import pilot firm property database
- Configure comp selection parameters
- Set up user accounts and permissions
- Initialize Field PWA on pilot devices

### Week 3: Integration Testing
- Verify end-to-end data flow
- Test offline/online synchronization
- Validate report generation
- Conduct security penetration testing

### Week 4: Performance Optimization
- Fine-tune response times
- Optimize mobile experience
- Adjust SHAP calculation parameters
- Calibrate narrative generation

## Support Channels

### Technical Support
- Priority email: pilot-support@terrafusion.ai
- Integration Slack channel: #tf-pilot-integration
- API documentation: https://docs.terrafusion.ai
- SDK resources: https://developer.terrafusion.ai

### Emergency Contact
- 24/7 Pilot Support Hotline: +1-888-TERRAFUSION
- On-call engineer: Available within 30 minutes for critical issues

---

For detailed integration assistance, please contact the TerraFusion implementation team at implementation@terrafusion.ai