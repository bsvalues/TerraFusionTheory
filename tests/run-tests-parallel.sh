#!/bin/bash

# Parallel test runner script for IntelligentEstate tests
# Runs tests in parallel for faster execution (useful in CI/CD pipelines)
# 
# Usage:
#   ./run-tests-parallel.sh [workers]
#
# If workers is provided, it specifies the number of parallel workers
# Default is 4 workers

# Set environment to test
export NODE_ENV=test

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Set number of workers (default: 4)
WORKERS=${1:-4}

echo -e "${YELLOW}Running IntelligentEstate tests in parallel mode...${NC}"
echo -e "Using ${WORKERS} workers"
echo "==========================================="

# Run Jest with the specified number of workers
npx jest --runInBand=false --maxWorkers=$WORKERS

# Store the exit code
EXIT_CODE=$?

# Print summary message
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}All parallel tests passed successfully!${NC}"
else
  echo -e "${RED}Parallel tests completed with failures.${NC}"
fi

echo "==========================================="
exit $EXIT_CODE