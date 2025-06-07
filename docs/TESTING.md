# GAMA Testing Guide

## Overview

This guide provides comprehensive information for testing the GAMA system.

## Testing Strategy

### Unit Testing

1. **Frontend Testing**
   ```javascript
   // Component Test
   describe('PropertyCard', () => {
     it('renders property details correctly', () => {
       const property = {
         id: '123',
         address: '123 Main St',
         value: 500000
       };
       const wrapper = shallow(<PropertyCard property={property} />);
       expect(wrapper.find('.address').text()).toBe('123 Main St');
       expect(wrapper.find('.value').text()).toBe('$500,000');
     });
   });

   // Redux Test
   describe('propertyReducer', () => {
     it('handles FETCH_PROPERTY_SUCCESS', () => {
       const initialState = {};
       const action = {
         type: 'FETCH_PROPERTY_SUCCESS',
         payload: { id: '123', value: 500000 }
       };
       const nextState = propertyReducer(initialState, action);
       expect(nextState['123'].value).toBe(500000);
     });
   });
   ```

2. **Backend Testing**
   ```javascript
   // API Test
   describe('Property API', () => {
     it('creates property successfully', async () => {
       const property = {
         address: '123 Main St',
         value: 500000
       };
       const response = await request(app)
         .post('/api/properties')
         .send(property);
       expect(response.status).toBe(201);
       expect(response.body.id).toBeDefined();
     });
   });

   // Service Test
   describe('PropertyService', () => {
     it('calculates property value correctly', () => {
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

3. **Agent Testing**
   ```python
   # Agent Test
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

       def test_analyze_market(self):
           agent = PropertyAgent()
           data = {
               'region': 'north',
               'period': 'monthly'
           }
           analysis = agent.analyze_market(data)
           assert 'trend' in analysis
           assert 'volatility' in analysis
   ```

### Integration Testing

1. **API Integration**
   ```javascript
   // API Integration Test
   describe('API Integration', () => {
     it('handles property creation flow', async () => {
       // Create property
       const property = await PropertyService.create({
         address: '123 Main St',
         value: 500000
       });

       // Verify property
       const saved = await PropertyService.get(property.id);
       expect(saved.address).toBe('123 Main St');

       // Update property
       await PropertyService.update(property.id, {
         value: 550000
       });

       // Verify update
       const updated = await PropertyService.get(property.id);
       expect(updated.value).toBe(550000);
     });
   });
   ```

2. **Service Integration**
   ```javascript
   // Service Integration Test
   describe('Service Integration', () => {
     it('handles market analysis flow', async () => {
       // Get market data
       const market = await MarketService.get('north');

       // Analyze market
       const analysis = await AnalysisService.analyze(market);

       // Generate report
       const report = await ReportService.generate(analysis);

       // Verify report
       expect(report.trend).toBeDefined();
       expect(report.predictions).toBeDefined();
     });
   });
   ```

3. **Database Integration**
   ```javascript
   // Database Integration Test
   describe('Database Integration', () => {
     it('handles property data flow', async () => {
       // Create property
       const property = await db.properties.create({
         address: '123 Main St',
         value: 500000
       });

       // Query property
       const saved = await db.properties.findOne({
         where: { id: property.id }
       });
       expect(saved.address).toBe('123 Main St');

       // Update property
       await db.properties.update(
         { value: 550000 },
         { where: { id: property.id } }
       );

       // Verify update
       const updated = await db.properties.findOne({
         where: { id: property.id }
       });
       expect(updated.value).toBe(550000);
     });
   });
   ```

### End-to-End Testing

1. **User Flow Testing**
   ```javascript
   // User Flow Test
   describe('User Flow', () => {
     it('completes property assessment flow', async () => {
       // Login
       await page.goto('/login');
       await page.fill('#email', 'user@example.com');
       await page.fill('#password', 'password');
       await page.click('#login');

       // Navigate to property
       await page.goto('/properties/123');

       // Update property
       await page.fill('#value', '550000');
       await page.click('#save');

       // Verify update
       const value = await page.textContent('#value');
       expect(value).toBe('$550,000');
     });
   });
   ```

2. **Market Analysis Flow**
   ```javascript
   // Market Analysis Flow Test
   describe('Market Analysis Flow', () => {
     it('completes market analysis flow', async () => {
       // Navigate to market
       await page.goto('/markets/north');

       // Select analysis period
       await page.select('#period', 'monthly');

       // Generate analysis
       await page.click('#analyze');

       // Verify analysis
       const trend = await page.textContent('#trend');
       expect(trend).toBeDefined();

       // Export report
       await page.click('#export');
       const download = await page.waitForEvent('download');
       expect(download.suggestedFilename()).toMatch(/report/);
     });
   });
   ```

3. **Report Generation Flow**
   ```javascript
   // Report Generation Flow Test
   describe('Report Generation Flow', () => {
     it('completes report generation flow', async () => {
       // Navigate to reports
       await page.goto('/reports');

       // Select report type
       await page.select('#type', 'market');

       // Configure report
       await page.fill('#title', 'Market Analysis');
       await page.select('#format', 'pdf');

       // Generate report
       await page.click('#generate');

       // Verify report
       const status = await page.textContent('#status');
       expect(status).toBe('Generated');

       // Download report
       await page.click('#download');
       const download = await page.waitForEvent('download');
       expect(download.suggestedFilename()).toMatch(/market/);
     });
   });
   ```

## Performance Testing

### Load Testing

1. **API Load Test**
   ```javascript
   // API Load Test
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export default function() {
     const response = http.get('https://api.gama-county.ai/v1/properties');
     check(response, {
       'status is 200': (r) => r.status === 200,
       'response time < 200ms': (r) => r.timings.duration < 200
     });
     sleep(1);
   }
   ```

2. **Service Load Test**
   ```javascript
   // Service Load Test
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export default function() {
     const response = http.post(
       'https://api.gama-county.ai/v1/analysis',
       JSON.stringify({
         type: 'market',
         region: 'north'
       })
     );
     check(response, {
       'status is 200': (r) => r.status === 200,
       'response time < 500ms': (r) => r.timings.duration < 500
     });
     sleep(1);
   }
   ```

3. **Database Load Test**
   ```javascript
   // Database Load Test
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export default function() {
     const response = http.get(
       'https://api.gama-county.ai/v1/properties/search?q=test'
     );
     check(response, {
       'status is 200': (r) => r.status === 200,
       'response time < 300ms': (r) => r.timings.duration < 300
     });
     sleep(1);
   }
   ```

### Stress Testing

1. **API Stress Test**
   ```javascript
   // API Stress Test
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export const options = {
     stages: [
       { duration: '30s', target: 100 },
       { duration: '1m', target: 100 },
       { duration: '30s', target: 0 }
     ]
   };

   export default function() {
     const response = http.get('https://api.gama-county.ai/v1/properties');
     check(response, {
       'status is 200': (r) => r.status === 200,
       'response time < 200ms': (r) => r.timings.duration < 200
     });
     sleep(1);
   }
   ```

2. **Service Stress Test**
   ```javascript
   // Service Stress Test
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export const options = {
     stages: [
       { duration: '30s', target: 50 },
       { duration: '1m', target: 50 },
       { duration: '30s', target: 0 }
     ]
   };

   export default function() {
     const response = http.post(
       'https://api.gama-county.ai/v1/analysis',
       JSON.stringify({
         type: 'market',
         region: 'north'
       })
     );
     check(response, {
       'status is 200': (r) => r.status === 200,
       'response time < 500ms': (r) => r.timings.duration < 500
     });
     sleep(1);
   }
   ```

3. **Database Stress Test**
   ```javascript
   // Database Stress Test
   import http from 'k6/http';
   import { check, sleep } from 'k6';

   export const options = {
     stages: [
       { duration: '30s', target: 200 },
       { duration: '1m', target: 200 },
       { duration: '30s', target: 0 }
     ]
   };

   export default function() {
     const response = http.get(
       'https://api.gama-county.ai/v1/properties/search?q=test'
     );
     check(response, {
       'status is 200': (r) => r.status === 200,
       'response time < 300ms': (r) => r.timings.duration < 300
     });
     sleep(1);
   }
   ```

## Security Testing

### Authentication Testing

1. **Login Test**
   ```javascript
   // Login Test
   describe('Authentication', () => {
     it('handles login correctly', async () => {
       const response = await request(app)
         .post('/api/auth/login')
         .send({
           email: 'user@example.com',
           password: 'password'
         });
       expect(response.status).toBe(200);
       expect(response.body.token).toBeDefined();
     });
   });
   ```

2. **Token Test**
   ```javascript
   // Token Test
   describe('Token', () => {
     it('validates token correctly', async () => {
       const token = await generateToken();
       const response = await request(app)
         .get('/api/properties')
         .set('Authorization', `Bearer ${token}`);
       expect(response.status).toBe(200);
     });
   });
   ```

3. **Permission Test**
   ```javascript
   // Permission Test
   describe('Permissions', () => {
     it('enforces permissions correctly', async () => {
       const token = await generateToken('user');
       const response = await request(app)
         .post('/api/properties')
         .set('Authorization', `Bearer ${token}`);
       expect(response.status).toBe(403);
     });
   });
   ```

### Authorization Testing

1. **Role Test**
   ```javascript
   // Role Test
   describe('Roles', () => {
     it('enforces roles correctly', async () => {
       const token = await generateToken('admin');
       const response = await request(app)
         .delete('/api/properties/123')
         .set('Authorization', `Bearer ${token}`);
       expect(response.status).toBe(200);
     });
   });
   ```

2. **Access Test**
   ```javascript
   // Access Test
   describe('Access', () => {
     it('enforces access correctly', async () => {
       const token = await generateToken('user');
       const response = await request(app)
         .get('/api/properties/123')
         .set('Authorization', `Bearer ${token}`);
       expect(response.status).toBe(200);
     });
   });
   ```

3. **Resource Test**
   ```javascript
   // Resource Test
   describe('Resources', () => {
     it('enforces resource access correctly', async () => {
       const token = await generateToken('user');
       const response = await request(app)
         .get('/api/admin/users')
         .set('Authorization', `Bearer ${token}`);
       expect(response.status).toBe(403);
     });
   });
   ```

## Support

### Documentation

1. **Testing Documentation**
   - [Testing Guide](docs/TESTING.md)
   - [Development Guide](docs/DEVELOPMENT.md)
   - [Architecture Guide](docs/ARCHITECTURE.md)

2. **Development Documentation**
   - [Development Guide](docs/DEVELOPMENT.md)
   - [Architecture Guide](docs/ARCHITECTURE.md)
   - [API Guide](docs/API.md)

3. **User Documentation**
   - [User Guide](docs/USER_GUIDE.md)
   - [Admin Guide](docs/ADMIN_GUIDE.md)
   - [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

### Contact

1. **Testing Team**
   - Email: testing@gama-county.ai
   - Slack: #testing
   - Discord: #testing

2. **Support Team**
   - Email: support@gama-county.ai
   - Phone: 1-800-GAMA-AI
   - Chat: chat.gama-county.ai

3. **Security Team**
   - Email: security@gama-county.ai
   - Phone: 1-800-GAMA-SEC
   - Bug Bounty: bugbounty.gama-county.ai 