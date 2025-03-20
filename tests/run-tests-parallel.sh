#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get available CPU count (with fallback to 4)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  CPU_COUNT=$(sysctl -n hw.ncpu 2>/dev/null || echo 4)
else
  # Linux and others
  CPU_COUNT=$(nproc 2>/dev/null || grep -c ^processor /proc/cpuinfo 2>/dev/null || echo 4)
fi

# Use 75% of available CPUs, min 2, max 8
WORKER_COUNT=$(( (CPU_COUNT * 3) / 4 ))
WORKER_COUNT=$(( WORKER_COUNT < 2 ? 2 : WORKER_COUNT ))
WORKER_COUNT=$(( WORKER_COUNT > 8 ? 8 : WORKER_COUNT ))

echo -e "${BLUE}Running tests in parallel using ${YELLOW}${WORKER_COUNT}${BLUE} workers...${NC}"

# Run tests in parallel with the calculated number of workers
npx jest --maxWorkers=${WORKER_COUNT} --detectOpenHandles

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed successfully!${NC}"
else
  echo -e "\n${RED}Tests failed with exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE