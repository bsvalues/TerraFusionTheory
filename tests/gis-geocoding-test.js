/**
 * GIS Connector Geocoding Test
 * 
 * This script tests the geocoding functionality of the GIS connector.
 * It verifies that the geocodeAddress method works correctly for different address formats.
 * 
 * Run with: node tests/gis-geocoding-test.js
 */

const axios = require('axios');
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  brightCyan: '\x1b[96m',
  brightGreen: '\x1b[92m',
  brightRed: '\x1b[91m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgBlue: '\x1b[44m'
};

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_ADDRESSES = [
  '123 Main St, Grandview, WA 98930',
  '2204 Hill Dr, Grandview, WA 98930',
  'Grandview School District, Grandview, WA',
  'Yakima Valley, WA',
  'Invalid Address That Should Fail, XX 00000'
];

/**
 * Test the GIS connector's geocoding functionality
 */
async function testGeocoding() {
  console.log(`\n${colors.cyan}${colors.bright}GIS CONNECTOR GEOCODING TEST${colors.reset}\n`);
  
  try {
    // Check if API is accessible
    await axios.get(API_BASE_URL);
    console.log(`${colors.green}✓ Connected to API server successfully${colors.reset}\n`);
  } catch (error) {
    console.error(`${colors.red}✕ Failed to connect to API server: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
  let successCount = 0;
  let failCount = 0;
  
  // Test each address
  for (const address of TEST_ADDRESSES) {
    console.log(`${colors.blue}${colors.bright}Testing address:${colors.reset} ${address}`);
    
    try {
      const startTime = Date.now();
      const response = await axios.post(`${API_BASE_URL}/gis/geocode`, { address });
      const duration = Date.now() - startTime;
      
      if (response.data.success) {
        const result = response.data.result;
        successCount++;
        
        console.log(`  ${colors.green}✓ Successfully geocoded in ${duration}ms${colors.reset}`);
        console.log(`  ${colors.dim}Coordinates: ${result.latitude}, ${result.longitude}${colors.reset}`);
        console.log(`  ${colors.dim}Formatted address: ${result.formattedAddress}${colors.reset}`);
        
        if (result.neighborhood) {
          console.log(`  ${colors.dim}Neighborhood: ${result.neighborhood}${colors.reset}`);
        }
        
        // Check confidence score
        if (result.confidence < 0.5) {
          console.log(`  ${colors.yellow}⚠ Low confidence score: ${result.confidence}${colors.reset}`);
        } else {
          console.log(`  ${colors.dim}Confidence: ${result.confidence}${colors.reset}`);
        }
      } else {
        failCount++;
        console.log(`  ${colors.yellow}⚠ Geocoding returned no results${colors.reset}`);
        
        // If this is the "Invalid Address" test, it's expected to fail
        if (address.includes('Invalid Address')) {
          console.log(`  ${colors.green}✓ Expected failure for invalid address${colors.reset}`);
          successCount++; // Count this as a success since we expected it to fail
          failCount--;
        }
      }
    } catch (error) {
      failCount++;
      console.error(`  ${colors.red}✕ Error: ${error.message}${colors.reset}`);
      
      if (error.response) {
        console.error(`  ${colors.dim}Status: ${error.response.status}${colors.reset}`);
        console.error(`  ${colors.dim}Response: ${JSON.stringify(error.response.data)}${colors.reset}`);
      }
      
      // If this is the "Invalid Address" test, it's expected to fail
      if (address.includes('Invalid Address')) {
        console.log(`  ${colors.green}✓ Expected failure for invalid address${colors.reset}`);
        successCount++; // Count this as a success since we expected it to fail
        failCount--;
      }
    }
    
    console.log(); // Empty line for readability
  }
  
  // Print summary
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`${colors.bright}${colors.green}✓ ${successCount} addresses processed successfully${colors.reset}`);
  
  if (failCount > 0) {
    console.log(`${colors.bright}${colors.red}✕ ${failCount} addresses failed${colors.reset}`);
  } else {
    console.log(`${colors.bright}${colors.green}✓ All addresses processed successfully${colors.reset}`);
  }
}

// Run the test
testGeocoding().catch(error => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});