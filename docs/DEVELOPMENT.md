# GAMA Development Guide

## Overview

This guide provides comprehensive information for developers working on the GAMA system.

## Development Environment

### Prerequisites

1. **Required Software**
   ```bash
   # Node.js
   node -v  # v16.x or higher
   npm -v   # v8.x or higher

   # Python
   python --version  # Python 3.8 or higher
   pip --version     # pip 20.x or higher

   # Docker
   docker --version  # Docker 20.x or higher
   docker-compose --version  # Docker Compose 2.x or higher

   # Git
   git --version  # Git 2.x or higher
   ```

2. **Development Tools**
   ```bash
   # VS Code Extensions
   - ESLint
   - Prettier
   - Python
   - Docker
   - GitLens
   - Jest Runner
   - Python Test Explorer
   ```

3. **Browser Extensions**
   ```bash
   # Chrome Extensions
   - React Developer Tools
   - Redux DevTools
   - Apollo Client DevTools
   - GraphQL Network Inspector
   ```

### Setup

1. **Clone Repository**
   ```bash
   # Clone repository
   git clone https://github.com/terrafusion/gama.git
   cd gama

   # Add upstream remote
   git remote add upstream https://github.com/terrafusion/gama.git
   ```

2. **Install Dependencies**
   ```bash
   # Frontend dependencies
   cd frontend
   npm install

   # Backend dependencies
   cd ../backend
   npm install

   # Agent system dependencies
   cd ../agents
   pip install -r requirements.txt
   ```

3. **Environment Setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   cp backend/.env.example backend/.env
   cp agents/.env.example agents/.env
   ```

4. **Database Setup**
   ```bash
   # Start PostgreSQL
   docker-compose up -d postgres

   # Run migrations
   cd backend
   npm run migrate
   ```

5. **Start Development Servers**
   ```bash
   # Start all services
   docker-compose up -d

   # Start frontend
   cd frontend
   npm run dev

   # Start backend
   cd backend
   npm run dev

   # Start agent system
   cd agents
   python run.py
   ```

## Architecture

### System Components

1. **Frontend**
   ```javascript
   // React SPA
   - Components
   - Redux store
   - API clients
   - Utilities
   ```

2. **Backend**
   ```javascript
   // Node.js API
   - Controllers
   - Services
   - Models
   - Middleware
   ```

3. **Agent System**
   ```python
   # Python Services
   - Property agents
   - Market agents
   - Analysis agents
   - Training agents
   ```

4. **Infrastructure**
   ```yaml
   # Docker Services
   - PostgreSQL
   - Redis
   - RabbitMQ
   - Elasticsearch
   ```

### Data Flow

1. **Property Flow**
   ```javascript
   // Property data flow
   Frontend -> API -> Database
   API -> Agent System -> Database
   Agent System -> API -> Frontend
   ```

2. **Market Flow**
   ```javascript
   // Market data flow
   Frontend -> API -> Database
   API -> Agent System -> Database
   Agent System -> API -> Frontend
   ```

3. **Analysis Flow**
   ```javascript
   // Analysis data flow
   Frontend -> API -> Agent System
   Agent System -> Database -> API
   API -> Frontend
   ```

## Coding Standards

### General

1. **Code Style**
   ```javascript
   // JavaScript/TypeScript
   {
     "semi": true,
     "singleQuote": true,
     "trailingComma": "es5",
     "printWidth": 80,
     "tabWidth": 2
   }

   # Python
   {
     "max_line_length": 88,
     "indent_size": 4,
     "quote_style": "double"
   }
   ```

2. **Version Control**
   ```bash
   # Branch naming
   feature/feature-name
   bugfix/bug-name
   hotfix/issue-name
   release/version

   # Commit messages
   feat: add new feature
   fix: fix bug
   docs: update documentation
   style: format code
   refactor: refactor code
   test: add tests
   chore: update dependencies
   ```

3. **Documentation**
   ```javascript
   /**
    * Function description
    * @param {string} param1 - Parameter description
    * @param {number} param2 - Parameter description
    * @returns {Promise<Object>} Return description
    */
   async function example(param1, param2) {
     // Implementation
   }
   ```

### Frontend

1. **Component Structure**
   ```javascript
   // Component file structure
   Component/
     ├── index.js
     ├── Component.js
     ├── Component.test.js
     ├── Component.styles.js
     └── Component.types.js
   ```

2. **State Management**
   ```javascript
   // Redux store structure
   store/
     ├── index.js
     ├── rootReducer.js
     ├── rootSaga.js
     └── modules/
         ├── property/
         ├── market/
         └── user/
   ```

3. **API Integration**
   ```javascript
   // API client structure
   api/
     ├── index.js
     ├── property.js
     ├── market.js
     └── user.js
   ```

### Backend

1. **API Structure**
   ```javascript
   // API structure
   api/
     ├── index.js
     ├── routes/
     ├── controllers/
     ├── services/
     ├── models/
     └── middleware/
   ```

2. **Error Handling**
   ```javascript
   // Error handling
   class AppError extends Error {
     constructor(message, statusCode) {
       super(message);
       this.statusCode = statusCode;
       this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
       this.isOperational = true;

       Error.captureStackTrace(this, this.constructor);
     }
   }
   ```

3. **Validation**
   ```javascript
   // Request validation
   const validateRequest = (schema) => {
     return (req, res, next) => {
       const { error } = schema.validate(req.body);
       if (error) {
         return res.status(400).json({
           status: 'error',
           message: error.details[0].message
         });
       }
       next();
     };
   };
   ```

### Agent System

1. **Agent Structure**
   ```python
   # Agent structure
   agents/
       ├── __init__.py
       ├── base.py
       ├── property.py
       ├── market.py
       └── analysis.py
   ```

2. **Model Structure**
   ```python
   # Model structure
   models/
       ├── __init__.py
       ├── base.py
       ├── property.py
       ├── market.py
       └── analysis.py
   ```

3. **Training Structure**
   ```python
   # Training structure
   training/
       ├── __init__.py
       ├── data.py
       ├── model.py
       └── trainer.py
   ```

## Testing

### Frontend Testing

1. **Unit Tests**
   ```javascript
   // Component test
   describe('PropertyCard', () => {
     it('renders property details', () => {
       const property = {
         id: '123',
         address: '123 Main St',
         value: 500000
       };
       const wrapper = shallow(<PropertyCard property={property} />);
       expect(wrapper.find('.address').text()).toBe('123 Main St');
     });
   });
   ```

2. **Integration Tests**
   ```javascript
   // Integration test
   describe('Property Flow', () => {
     it('handles property creation', async () => {
       const property = {
         address: '123 Main St',
         value: 500000
       };
       const response = await api.createProperty(property);
       expect(response.status).toBe(201);
     });
   });
   ```

3. **E2E Tests**
   ```javascript
   // E2E test
   describe('Property Assessment', () => {
     it('completes assessment flow', async () => {
       await page.goto('/properties/123');
       await page.fill('#value', '550000');
       await page.click('#save');
       const value = await page.textContent('#value');
       expect(value).toBe('$550,000');
     });
   });
   ```

### Backend Testing

1. **Unit Tests**
   ```javascript
   // Service test
   describe('PropertyService', () => {
     it('calculates property value', () => {
       const property = {
         size: 2000,
         rooms: 4,
         location: 'urban'
       };
       const value = PropertyService.calculateValue(property);
       expect(value).toBeGreaterThan(0);
     });
   });
   ```

2. **Integration Tests**
   ```javascript
   // API test
   describe('Property API', () => {
     it('creates property', async () => {
       const property = {
         address: '123 Main St',
         value: 500000
       };
       const response = await request(app)
         .post('/api/properties')
         .send(property);
       expect(response.status).toBe(201);
     });
   });
   ```

3. **Database Tests**
   ```javascript
   // Database test
   describe('Property Model', () => {
     it('saves property to database', async () => {
       const property = await Property.create({
         address: '123 Main St',
         value: 500000
       });
       const saved = await Property.findOne(property.id);
       expect(saved.address).toBe('123 Main St');
     });
   });
   ```

### Agent Testing

1. **Unit Tests**
   ```python
   # Agent test
   class TestPropertyAgent:
       def test_predict_value(self):
           agent = PropertyAgent()
           data = {
               'size': 2000,
               'rooms': 4,
               'location': 'urban'
           }
           prediction = agent.predict_value(data)
           assert prediction > 0
   ```

2. **Integration Tests**
   ```python
   # Integration test
   class TestPropertyAnalysis:
       def test_analyze_property(self):
           agent = PropertyAgent()
           data = {
               'property_id': '123',
               'market_data': {...}
           }
           analysis = agent.analyze_property(data)
           assert 'value' in analysis
           assert 'confidence' in analysis
   ```

3. **Model Tests**
   ```python
   # Model test
   class TestPropertyModel:
       def test_train_model(self):
           model = PropertyModel()
           data = load_test_data()
           model.train(data)
           assert model.is_trained
   ```

## Deployment

### CI/CD Pipeline

1. **GitHub Actions**
   ```yaml
   # GitHub Actions workflow
   name: GAMA CI/CD

   on:
     push:
       branches: [ main ]
     pull_request:
       branches: [ main ]

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - name: Setup Node.js
           uses: actions/setup-node@v2
           with:
             node-version: '16'
         - name: Install dependencies
           run: npm install
         - name: Run tests
           run: npm test
   ```

2. **Docker Build**
   ```dockerfile
   # Dockerfile
   FROM node:16-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm install

   COPY . .
   RUN npm run build

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

3. **Kubernetes Deployment**
   ```yaml
   # Kubernetes deployment
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: gama-frontend
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: gama-frontend
     template:
       metadata:
         labels:
           app: gama-frontend
       spec:
         containers:
         - name: gama-frontend
           image: gama-frontend:latest
           ports:
           - containerPort: 3000
   ```

## Monitoring

### Prometheus

1. **Metrics**
   ```yaml
   # Prometheus metrics
   metrics:
     - name: http_requests_total
       type: counter
       help: Total number of HTTP requests
     - name: http_request_duration_seconds
       type: histogram
       help: HTTP request duration in seconds
     - name: active_users
       type: gauge
       help: Number of active users
   ```

2. **Alerts**
   ```yaml
   # Prometheus alerts
   alerts:
     - name: HighErrorRate
       expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
       for: 5m
       labels:
         severity: critical
       annotations:
         summary: High error rate
         description: Error rate is above 10% for 5 minutes
   ```

### Grafana

1. **Dashboards**
   ```json
   // Grafana dashboard
   {
     "dashboard": {
       "title": "GAMA Overview",
       "panels": [
         {
           "title": "Request Rate",
           "type": "graph",
           "datasource": "Prometheus",
           "targets": [
             {
               "expr": "rate(http_requests_total[5m])"
             }
           ]
         }
       ]
     }
   }
   ```

2. **Alerts**
   ```json
   // Grafana alerts
   {
     "alert": {
       "name": "High Latency",
       "conditions": [
         {
           "evaluator": {
             "params": [1000],
             "type": "gt"
           },
           "operator": {
             "type": "and"
           },
           "query": {
             "params": ["A", "5m", "now"]
           },
           "reducer": {
             "params": [],
             "type": "avg"
           },
           "type": "query"
         }
       ]
     }
   }
   ```

## Best Practices

### Code Quality

1. **Linting**
   ```javascript
   // ESLint configuration
   module.exports = {
     extends: [
       'eslint:recommended',
       'plugin:react/recommended',
       'plugin:@typescript-eslint/recommended'
     ],
     rules: {
       'no-console': 'warn',
       'no-unused-vars': 'error',
       'react/prop-types': 'off'
     }
   };
   ```

2. **Type Checking**
   ```typescript
   // TypeScript configuration
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true,
       "strictBindCallApply": true,
       "strictPropertyInitialization": true,
       "noImplicitThis": true,
       "alwaysStrict": true
     }
   }
   ```

3. **Code Coverage**
   ```javascript
   // Jest configuration
   module.exports = {
     collectCoverage: true,
     coverageDirectory: 'coverage',
     coverageReporters: ['text', 'lcov', 'html'],
     coverageThreshold: {
       global: {
         branches: 80,
         functions: 80,
         lines: 80,
         statements: 80
       }
     }
   };
   ```

### Security

1. **Input Validation**
   ```javascript
   // Input validation
   const validateInput = (schema) => {
     return (req, res, next) => {
       const { error } = schema.validate(req.body);
       if (error) {
         return res.status(400).json({
           status: 'error',
           message: error.details[0].message
         });
       }
       next();
     };
   };
   ```

2. **Authentication**
   ```javascript
   // Authentication middleware
   const authenticate = async (req, res, next) => {
     try {
       const token = req.headers.authorization?.split(' ')[1];
       if (!token) {
         throw new Error('No token provided');
       }
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded;
       next();
     } catch (error) {
       res.status(401).json({
         status: 'error',
         message: 'Invalid token'
       });
     }
   };
   ```

3. **Authorization**
   ```javascript
   // Authorization middleware
   const authorize = (roles) => {
     return (req, res, next) => {
       if (!roles.includes(req.user.role)) {
         return res.status(403).json({
           status: 'error',
           message: 'Unauthorized'
         });
       }
       next();
     };
   };
   ```

### Performance

1. **Caching**
   ```javascript
   // Redis caching
   const cache = async (key, ttl, fn) => {
     const cached = await redis.get(key);
     if (cached) {
       return JSON.parse(cached);
     }
     const result = await fn();
     await redis.set(key, JSON.stringify(result), 'EX', ttl);
     return result;
   };
   ```

2. **Database Optimization**
   ```sql
   -- Database indexes
   CREATE INDEX idx_property_address ON properties(address);
   CREATE INDEX idx_property_value ON properties(value);
   CREATE INDEX idx_market_region ON markets(region);
   ```

3. **API Optimization**
   ```javascript
   // API pagination
   const paginate = (req, res, next) => {
     const page = parseInt(req.query.page) || 1;
     const limit = parseInt(req.query.limit) || 10;
     req.pagination = {
       skip: (page - 1) * limit,
       limit
     };
     next();
   };
   ```

## Support

### Documentation

1. **Development Documentation**
   - [Development Guide](docs/DEVELOPMENT.md)
   - [Architecture Guide](docs/ARCHITECTURE.md)
   - [API Guide](docs/API.md)

2. **Testing Documentation**
   - [Testing Guide](docs/TESTING.md)
   - [Development Guide](docs/DEVELOPMENT.md)
   - [Architecture Guide](docs/ARCHITECTURE.md)

3. **User Documentation**
   - [User Guide](docs/USER_GUIDE.md)
   - [Admin Guide](docs/ADMIN_GUIDE.md)
   - [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

### Contact

1. **Development Team**
   - Email: dev@gama-county.ai
   - Slack: #development
   - Discord: #development

2. **Support Team**
   - Email: support@gama-county.ai
   - Phone: 1-800-GAMA-AI
   - Chat: chat.gama-county.ai

3. **Security Team**
   - Email: security@gama-county.ai
   - Phone: 1-800-GAMA-SEC
   - Bug Bounty: bugbounty.gama-county.ai 