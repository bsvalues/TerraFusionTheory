#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

if [ $# -eq 0 ]; then
  echo -e "${RED}Error: No test file specified${NC}"
  echo -e "Usage: $0 <test-file-path>"
  echo -e "Example: $0 services/monitoring/market.monitor.test.ts"
  exit 1
fi

TEST_FILE=$1

# Check if file exists
if [ ! -f "tests/$TEST_FILE" ]; then
  echo -e "${RED}Error: Test file 'tests/$TEST_FILE' not found${NC}"
  exit 1
fi

echo -e "${BLUE}Running test: ${TEST_FILE}${NC}"
npx jest --testPathPattern="tests/$TEST_FILE" --detectOpenHandles --verbose

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}Test completed successfully!${NC}"
else
  echo -e "${RED}Test failed with exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE