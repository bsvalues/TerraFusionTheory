# IntelligentEstate Agent System Tests

This directory contains test scripts for the IntelligentEstate agent system.

## Running Tests

### Agent API Tests
To test the agent system API endpoints:

```bash
node agents-api-test.js
```

The test script will verify:
- Agent listing and discovery
- Developer agent functionality
- Real estate agent functionality  
- Vector memory search
- Agent collaboration (cross-agent communication)
- Advanced agent capabilities (question answering, code generation)

## Test Results

When the tests run successfully, you should see output similar to:

```
==========================
🤖 AGENT SYSTEM API TESTS
==========================
✅ Connected to API server successfully

[Test details here...]

==========================
📊 TEST SUMMARY
==========================
Total tests: 7
Passed: 7
Failed: 0
Skipped: 0
==========================
🎉 All tests passed!
```

## Understanding Test Failures

If a test fails, check:

1. Is the application server running?
2. Are the agent endpoints registered correctly?
3. Check the console logs on the server side for any errors

## Adding New Tests

To add new tests:
1. Create functions following the pattern in `agents-api-test.js`
2. Add the test to the `runTests()` function
3. Export the new test function for potential reuse