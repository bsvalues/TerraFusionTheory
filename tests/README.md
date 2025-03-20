# IntelligentEstate Test Suite

This directory contains comprehensive tests for the IntelligentEstate real estate analytics platform. The tests cover all major components of the system, including services, controllers, data validation, and UI components.

## Test Structure

The test suite follows the same structure as the main application code to make it easy to find and maintain tests:

```
tests/
├── components/        # UI component tests
├── controllers/       # API controller tests 
├── hooks/             # React hooks tests
├── services/          # Service layer tests
│   ├── ai/            # AI service tests
│   ├── connectors/    # Data connector tests
│   ├── enrichment/    # Data enrichment service tests
│   ├── monitoring/    # Monitoring service tests
├── utils/             # Test utilities and helpers
│   ├── test-mocks.ts  # Mock data generators
│   ├── test-utils.tsx # Test helper functions
│   ├── address-generator.ts # Realistic address generation
├── mocks/             # Mocked data and services
├── __mocks__/         # Auto-mocked modules
├── run-tests.sh       # Main test runner
├── run-tests-parallel.sh # Parallel test runner
├── run-coverage.sh    # Coverage test runner
```

## Running Tests

Several scripts are provided to run tests in different ways:

### Basic Test Run

```bash
./run-tests.sh
```

This runs all tests sequentially.

### Running Specific Tests

```bash
./run-tests.sh market
```

This runs only tests that match the pattern "market" in their descriptions.

### Parallel Test Execution

```bash
./run-tests-parallel.sh 6
```

This runs tests in parallel using 6 workers. The default is 4 workers if not specified.

### Test Coverage

```bash
./run-coverage.sh
```

This runs tests with coverage reporting. Coverage reports are generated in the `coverage/` directory.

## Test Utilities

### Test Mocks

The `test-mocks.ts` file provides factory functions to create consistent mock objects for testing:

- `createMockPropertyListing()`
- `createMockPropertyData()`
- `createMockGeoJSON()`
- `createMockMarketSnapshot()`
- `createMockAIResponse()`

### Address Generator

The `address-generator.ts` utility creates realistic addresses in the Grandview, WA area for testing:

- `generateRandomAddress()`
- `generateAddressBatch(count)`
- `generateSeededAddress(seed)`
- `getStandardTestAddresses()`

### React Testing Utilities

The `test-utils.tsx` file provides helper functions for React component testing:

- `renderWithQueryClient()`
- `renderWithAllProviders()`
- `customRender()`

## Best Practices

1. Use the mock factories from `test-mocks.ts` rather than creating new test data structures
2. Tests should be independent and not rely on the order of execution
3. Clean up any resources created during tests (e.g., timers, event listeners)
4. Use descriptive test names following the pattern "it should..."
5. Group related tests in describe blocks
6. Use realistic test data from the address generator when testing geospatial features

## Troubleshooting

If tests are failing with timeout errors, you can increase the timeout with:

```javascript
jest.setTimeout(10000); // 10 second timeout
```

For tests that have flaky behavior due to async operations, consider using:

```javascript
await waitMs(100); // Utility from test-mocks.ts
```