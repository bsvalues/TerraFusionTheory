# IntelligentEstate Testing Suite

This directory contains the testing infrastructure for the IntelligentEstate project, a comprehensive real estate analytics platform.

## Getting Started

To run the test suite, you can use one of the following scripts:

```bash
# Run all tests
./tests/run-tests.sh

# Run a single test file
./tests/run-single-test.sh services/monitoring/market.monitor.test.ts

# Generate coverage report
./tests/generate-coverage-report.sh

# Run tests with clean cache
./tests/run-tests-clean.sh
```

## Test Suite Organization

The test suite is organized according to the application's architecture:

```
tests/
  ├── components/            # React component tests
  ├── controllers/           # API controller tests
  ├── hooks/                 # React custom hook tests
  ├── mocks/                 # Mock data and mock implementations
  ├── services/              # Service layer tests
  │   ├── ai/                # AI service tests
  │   ├── connectors/        # Data connector tests
  │   ├── enrichment/        # Data enrichment tests
  │   └── monitoring/        # Monitoring service tests
  └── utils/                 # Test utilities
```

## Testing Practices

### Backend Testing

For backend service tests, we use Jest to test each service's functionality:

1. **Service Tests**: Verify that services correctly implement their business logic
2. **Connector Tests**: Ensure data connectors properly interface with external data sources
3. **Enrichment Tests**: Validate data enrichment and validation functions
4. **Monitoring Tests**: Test monitoring and alerting capabilities

### Frontend Testing

For frontend component tests, we use Jest with React Testing Library:

1. **Component Tests**: Test React components rendering and behavior
2. **Hook Tests**: Verify custom hooks work correctly
3. **Integration Tests**: Test component interactions

## Test Setup Files

- `setupTests.js`: Main test setup for all tests
- `setupDataTests.js`: Additional setup for data-intensive tests
- `testUtils.ts`: Utilities for testing (rendering components, etc.)

## Mock Data

Mock data for tests is generally provided in one of two ways:

1. **Inline**: Small datasets defined directly in test files
2. **Mock Factories**: Helper functions to generate test data (see `setupDataTests.js`)

## Test Coverage

Run the coverage report script to generate a detailed coverage report:

```bash
./tests/generate-coverage-report.sh
```

Coverage thresholds are set to:
- Statements: 70%
- Branches: 60%
- Functions: 75%
- Lines: 70%

## Debugging Failed Tests

When tests fail, you can:

1. Run a single test file with the `run-single-test.sh` script
2. Add `console.log` statements to your tests
3. Use the `--verbose` flag with Jest for more detailed output:
   ```bash
   npx jest --verbose tests/services/real-estate-analytics.service.test.ts
   ```

## Best Practices

When writing new tests, follow these practices:

1. **Test Organization**: Group related tests with `describe` blocks
2. **Setup/Teardown**: Use `beforeEach`/`afterEach` for test preparation and cleanup
3. **Isolation**: Mock dependencies to ensure tests are isolated
4. **Naming**: Name tests clearly to describe what they're testing
5. **Coverage**: Aim to test both happy paths and error scenarios

## Writing New Tests

Here's a template for writing a new test file:

```typescript
import { ServiceToTest } from '../../server/services/service-to-test';

describe('ServiceToTest', () => {
  let service: ServiceToTest;
  
  beforeEach(() => {
    // Setup: create service instance and mock dependencies
    service = new ServiceToTest();
  });
  
  afterEach(() => {
    // Cleanup: reset mocks
    jest.clearAllMocks();
  });
  
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange: prepare test data
      const input = { /* test data */ };
      
      // Act: call the method
      const result = service.methodName(input);
      
      // Assert: verify the result
      expect(result).toEqual(/* expected output */);
    });
    
    it('should handle errors', () => {
      // Test error scenarios
    });
  });
});
```

## Continuous Integration

These tests are part of the project's CI pipeline. They run automatically on:
- Every pull request
- Every merge to the main branch