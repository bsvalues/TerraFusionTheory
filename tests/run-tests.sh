#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test groups
function run_service_tests() {
  echo -e "${BLUE}Running service tests...${NC}"
  npx jest --testPathPattern='tests/services' --detectOpenHandles
}

function run_connector_tests() {
  echo -e "${BLUE}Running connector tests...${NC}"
  npx jest --testPathPattern='tests/services/connectors' --detectOpenHandles
}

function run_ai_tests() {
  echo -e "${BLUE}Running AI service tests...${NC}"
  npx jest --testPathPattern='tests/services/ai' --detectOpenHandles
}

function run_monitor_tests() {
  echo -e "${BLUE}Running monitoring system tests...${NC}"
  npx jest --testPathPattern='tests/services/monitoring' --detectOpenHandles
}

function run_enrichment_tests() {
  echo -e "${BLUE}Running data enrichment tests...${NC}"
  npx jest --testPathPattern='tests/services/enrichment' --detectOpenHandles
}

function run_controller_tests() {
  echo -e "${BLUE}Running controller tests...${NC}"
  npx jest --testPathPattern='tests/controllers' --detectOpenHandles
}

function run_component_tests() {
  echo -e "${BLUE}Running React component tests...${NC}"
  npx jest --testPathPattern='tests/components' --detectOpenHandles
}

function run_hook_tests() {
  echo -e "${BLUE}Running React hook tests...${NC}"
  npx jest --testPathPattern='tests/hooks' --detectOpenHandles
}

function run_all_tests() {
  echo -e "${BLUE}Running all tests...${NC}"
  npx jest --detectOpenHandles
}

function run_coverage() {
  echo -e "${BLUE}Running tests with coverage...${NC}"
  npx jest --coverage --detectOpenHandles
}

# Display menu
clear
echo -e "${GREEN}IntelligentEstate Test Runner${NC}"
echo -e "${YELLOW}==============================${NC}"
echo "1) Run all tests"
echo "2) Run service tests only"
echo "3) Run connector tests only"
echo "4) Run AI service tests only"
echo "5) Run monitoring system tests only"
echo "6) Run data enrichment tests only"
echo "7) Run controller tests only"
echo "8) Run component tests only"
echo "9) Run hook tests only"
echo "c) Run tests with coverage report"
echo "q) Quit"
echo ""
echo -e "${YELLOW}Select an option:${NC}"
read -n 1 option

echo ""
case $option in
  1) run_all_tests ;;
  2) run_service_tests ;;
  3) run_connector_tests ;;
  4) run_ai_tests ;;
  5) run_monitor_tests ;;
  6) run_enrichment_tests ;;
  7) run_controller_tests ;;
  8) run_component_tests ;;
  9) run_hook_tests ;;
  c) run_coverage ;;
  q) echo -e "${GREEN}Exiting...${NC}"; exit 0 ;;
  *) echo -e "${RED}Invalid option${NC}"; exit 1 ;;
esac