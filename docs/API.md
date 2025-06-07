# GAMA API Documentation

## Overview

The GAMA API provides a comprehensive interface for property assessment, market analysis, and data visualization. This documentation covers all available endpoints, authentication methods, and usage examples.

## Base URL

```
https://api.gama-county.ai/v1
```

## Authentication

### JWT Authentication

All API requests require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your_jwt_token>
```

### Obtaining a Token

```http
POST /auth/token
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

## Rate Limiting

- 100 requests per minute
- 1000 requests per hour
- Rate limit headers included in response:
  - X-RateLimit-Limit
  - X-RateLimit-Remaining
  - X-RateLimit-Reset

## Endpoints

### Property Assessment

#### Get Property Details

```http
GET /properties/{property_id}
```

Response:
```json
{
  "id": "string",
  "address": {
    "street": "string",
    "city": "string",
    "state": "string",
    "zip": "string"
  },
  "value": {
    "current": "number",
    "historical": [
      {
        "date": "string",
        "value": "number"
      }
    ]
  },
  "market_energy": {
    "score": "number",
    "trend": "string",
    "factors": [
      {
        "name": "string",
        "impact": "number"
      }
    ]
  }
}
```

#### Update Property Value

```http
PUT /properties/{property_id}/value
Content-Type: application/json

{
  "value": "number",
  "assessment_date": "string",
  "methodology": "string"
}
```

### Market Analysis

#### Get Market Energy

```http
GET /market/energy
Query Parameters:
  - region: string
  - timeframe: string
  - granularity: string
```

Response:
```json
{
  "region": "string",
  "timeframe": "string",
  "energy_map": [
    {
      "location": {
        "lat": "number",
        "lng": "number"
      },
      "energy": "number",
      "factors": [
        {
          "name": "string",
          "value": "number"
        }
      ]
    }
  ]
}
```

#### Get Market Trends

```http
GET /market/trends
Query Parameters:
  - region: string
  - metric: string
  - period: string
```

### Sacred Geometry

#### Generate Fibonacci Spiral

```http
POST /geometry/fibonacci
Content-Type: application/json

{
  "center": {
    "lat": "number",
    "lng": "number"
  },
  "radius": "number",
  "iterations": "number",
  "data_points": [
    {
      "position": {
        "lat": "number",
        "lng": "number"
      },
      "value": "number"
    }
  ]
}
```

Response:
```json
{
  "spiral": [
    {
      "point": {
        "x": "number",
        "y": "number",
        "z": "number"
      },
      "value": "number"
    }
  ],
  "metadata": {
    "golden_ratio": "number",
    "iterations": "number"
  }
}
```

#### Generate Voronoi Tessellation

```http
POST /geometry/voronoi
Content-Type: application/json

{
  "points": [
    {
      "lat": "number",
      "lng": "number",
      "value": "number"
    }
  ],
  "boundaries": {
    "min": {
      "lat": "number",
      "lng": "number"
    },
    "max": {
      "lat": "number",
      "lng": "number"
    }
  }
}
```

### AI Analysis

#### Get Property Prediction

```http
POST /ai/predict
Content-Type: application/json

{
  "property_id": "string",
  "timeframe": "string",
  "confidence_threshold": "number"
}
```

Response:
```json
{
  "prediction": {
    "value": "number",
    "confidence": "number",
    "factors": [
      {
        "name": "string",
        "impact": "number"
      }
    ]
  },
  "model_info": {
    "version": "string",
    "last_trained": "string",
    "accuracy": "number"
  }
}
```

#### Train AI Model

```http
POST /ai/train
Content-Type: application/json

{
  "model_type": "string",
  "parameters": {
    "learning_rate": "number",
    "epochs": "number",
    "batch_size": "number"
  },
  "training_data": {
    "start_date": "string",
    "end_date": "string",
    "region": "string"
  }
}
```

### System Management

#### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "components": {
    "database": "up",
    "cache": "up",
    "queue": "up",
    "ai_engine": "up"
  },
  "version": "string",
  "uptime": "number"
}
```

#### System Metrics

```http
GET /metrics
```

Response:
```json
{
  "cpu_usage": "number",
  "memory_usage": "number",
  "disk_usage": "number",
  "request_count": "number",
  "error_rate": "number",
  "response_time": "number"
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  }
}
```

### Common Error Codes

- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## Webhooks

### Configure Webhook

```http
POST /webhooks
Content-Type: application/json

{
  "url": "string",
  "events": ["string"],
  "secret": "string"
}
```

### Webhook Events

- property.updated
- market.energy.changed
- ai.prediction.ready
- system.alert

### Webhook Payload

```json
{
  "event": "string",
  "timestamp": "string",
  "data": "object",
  "signature": "string"
}
```

## SDKs

### Python

```python
from gama import GAMAClient

client = GAMAClient(api_key="your_api_key")
property_data = client.get_property("property_id")
```

### JavaScript

```javascript
import { GAMAClient } from '@gama/client';

const client = new GAMAClient({ apiKey: 'your_api_key' });
const propertyData = await client.getProperty('property_id');
```

## Best Practices

1. Always use HTTPS
2. Implement proper error handling
3. Cache responses when appropriate
4. Use pagination for large datasets
5. Implement retry logic with exponential backoff
6. Validate all input data
7. Monitor API usage and limits
8. Keep API keys secure
9. Use appropriate content types
10. Follow RESTful principles

## Support

- API Support: api@gama-county.ai
- Documentation: docs.gama-county.ai/api
- Status Page: status.gama-county.ai
- Developer Portal: developers.gama-county.ai 