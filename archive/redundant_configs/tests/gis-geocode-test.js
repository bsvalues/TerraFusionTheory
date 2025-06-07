/**
 * GIS Geocoding Test
 * 
 * This script tests the geocoding functionality in the GIS connector
 * to ensure proper address to coordinate mapping.
 * 
 * Run with: node tests/gis-geocode-test.js
 */

const axios = require('axios');
const API_ENDPOINT = 'http://localhost:5000/api';

// Define test addresses
const TEST_ADDRESSES = [
  "123 Main St, Grandview, WA 98930",
  "2204 Hill Dr, Grandview, WA 98930",
  "300 Elm Avenue, Grandview, WA 98930",
  "1450 W 5th St, Grandview, WA 98930",
  "745 Terrace Heights Dr, Grandview, WA 98930"
];

// Color formatting for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44;1m"
};

/**
 * Tests geocoding an address using the GIS connector
 */
async function testGeocoding(address) {
  console.log(`${colors.cyan}${colors.bright}Testing geocoding for address:${colors.reset} ${address}`);
  
  try {
    const response = await axios.post(`${API_ENDPOINT}/test-geocoding`, {
      address
    });
    
    const { success, result, duration } = response.data;
    
    if (success && result) {
      console.log(`${colors.green}✓ Successfully geocoded${colors.reset}`);
      console.log(`${colors.dim}• Latitude: ${result.latitude}`);
      console.log(`• Longitude: ${result.longitude}`);
      console.log(`• Confidence: ${result.confidence}`);
      console.log(`• Formatted Address: ${result.formattedAddress}`);
      
      if (result.neighborhood) console.log(`• Neighborhood: ${result.neighborhood}`);
      if (result.city) console.log(`• City: ${result.city}`);
      if (result.county) console.log(`• County: ${result.county}`);
      if (result.state) console.log(`• State: ${result.state}`);
      if (result.zip) console.log(`• ZIP: ${result.zip}${colors.reset}`);
      
      console.log(`${colors.bright}Duration:${colors.reset} ${duration}ms\n`);
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to geocode${colors.reset}`);
      console.log(`${colors.dim}• Error: ${response.data.error || 'Unknown error'}${colors.reset}\n`);
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error making request${colors.reset}`);
    console.log(`${colors.dim}• ${error.message}${colors.reset}\n`);
    return false;
  }
}

/**
 * Run all tests and generate a report
 */
async function runTests() {
  console.log(`${colors.bgBlue}GIS GEOCODING TEST${colors.reset}\n`);
  
  let successful = 0;
  let failed = 0;
  
  // First check if API server is running
  try {
    await axios.get(API_ENDPOINT);
    console.log(`${colors.green}✓ Connected to API server successfully${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}✗ Failed to connect to API server at ${API_ENDPOINT}${colors.reset}`);
    console.log(`${colors.dim}Make sure the server is running before executing tests.${colors.reset}`);
    return;
  }
  
  // Run each address test
  for (const address of TEST_ADDRESSES) {
    const passed = await testGeocoding(address);
    if (passed) {
      successful++;
    } else {
      failed++;
    }
  }
  
  // Print summary
  console.log(`${colors.bright}==== Test Summary =====${colors.reset}`);
  console.log(`${colors.green}Successful: ${successful}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.bright}Total: ${successful + failed}${colors.reset}`);
  console.log();
  
  if (failed === 0) {
    console.log(`${colors.green}${colors.bright}All geocoding tests passed successfully!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bright}Some geocoding tests failed. Check logs above for details.${colors.reset}`);
  }
}

// Run all tests
runTests();