#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Cleaning Jest cache and running all tests...${NC}"

# Clear Jest cache
npx jest --clearCache

# Run all tests
npx jest --detectOpenHandles

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}All tests passed successfully!${NC}"
else
  echo -e "\n${RED}Tests failed with exit code: $EXIT_CODE${NC}"
fi

exit $EXIT_CODE