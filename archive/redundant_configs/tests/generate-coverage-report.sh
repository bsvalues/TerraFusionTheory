#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Generating comprehensive test coverage report...${NC}"

# Define coverage thresholds
THRESHOLD_STATEMENTS=70
THRESHOLD_BRANCHES=60
THRESHOLD_FUNCTIONS=75
THRESHOLD_LINES=70

# Run Jest with coverage
npx jest --coverage --coverageReporters=text-summary,lcov,html

EXIT_CODE=$?

# Check if coverage thresholds are met
if [ -f "coverage/coverage-summary.json" ]; then
  STATEMENTS=$(jq '.total.statements.pct' coverage/coverage-summary.json)
  BRANCHES=$(jq '.total.branches.pct' coverage/coverage-summary.json)
  FUNCTIONS=$(jq '.total.functions.pct' coverage/coverage-summary.json)
  LINES=$(jq '.total.lines.pct' coverage/coverage-summary.json)
  
  echo -e "\n${YELLOW}Coverage Summary:${NC}"
  echo -e "Statements: ${STATEMENTS}% (threshold: ${THRESHOLD_STATEMENTS}%)"
  echo -e "Branches  : ${BRANCHES}% (threshold: ${THRESHOLD_BRANCHES}%)"
  echo -e "Functions : ${FUNCTIONS}% (threshold: ${THRESHOLD_FUNCTIONS}%)"
  echo -e "Lines     : ${LINES}% (threshold: ${THRESHOLD_LINES}%)"
  
  # Check if any coverage is below threshold
  if (( $(echo "$STATEMENTS < $THRESHOLD_STATEMENTS" | bc -l) )) || \
     (( $(echo "$BRANCHES < $THRESHOLD_BRANCHES" | bc -l) )) || \
     (( $(echo "$FUNCTIONS < $THRESHOLD_FUNCTIONS" | bc -l) )) || \
     (( $(echo "$LINES < $THRESHOLD_LINES" | bc -l) )); then
    echo -e "\n${RED}Coverage thresholds not met!${NC}"
    EXIT_CODE=1
  else
    echo -e "\n${GREEN}All coverage thresholds met!${NC}"
  fi
fi

# Show note about viewing HTML report
echo -e "\n${BLUE}HTML report generated at: ${YELLOW}coverage/lcov-report/index.html${NC}"
echo -e "${BLUE}You can view this in your browser for a detailed breakdown.${NC}"

exit $EXIT_CODE