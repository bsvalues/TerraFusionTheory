#!/bin/bash

# Coverage test runner script for IntelligentEstate tests
# Runs tests with coverage reporting
# 
# Usage:
#   ./run-coverage.sh

# Set environment to test
export NODE_ENV=test

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running IntelligentEstate tests with coverage...${NC}"
echo "==========================================="

# Run Jest with coverage options
npx jest --coverage

# Store the exit code
EXIT_CODE=$?

# Print summary message
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  echo -e "${YELLOW}Coverage report generated in coverage/ directory${NC}"
else
  echo -e "${RED}Tests completed with failures.${NC}"
fi

echo "==========================================="
exit $EXIT_CODE