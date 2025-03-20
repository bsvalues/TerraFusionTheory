#!/bin/bash

# Main test runner script for IntelligentEstate tests
# 
# Usage:
#   ./run-tests.sh [test-pattern]
#
# If test-pattern is provided, only tests matching that pattern will be run
# Example: ./run-tests.sh market to run tests with "market" in their name

# Set environment to test
export NODE_ENV=test

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running IntelligentEstate tests...${NC}"
echo "==========================================="

# Check if a specific test pattern was requested
if [ $# -eq 0 ]; then
  echo -e "${YELLOW}Running all tests${NC}"
  npx jest
else
  echo -e "${YELLOW}Running tests matching pattern: $1${NC}"
  npx jest -t "$1"
fi

# Store the exit code
EXIT_CODE=$?

# Print summary message
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
else
  echo -e "${RED}Tests completed with failures.${NC}"
fi

echo "==========================================="
exit $EXIT_CODE