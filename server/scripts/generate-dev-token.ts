/**
 * Developer Token Generator Script
 * 
 * This script generates a one-time authentication token for development purposes.
 * 
 * Usage:
 *   npx tsx server/scripts/generate-dev-token.ts [userId] [expirationMinutes]
 * 
 * Example:
 *   npx tsx server/scripts/generate-dev-token.ts 1 120
 */

import { devAuthService } from '../services/dev-auth.service';

// Get command line arguments
const args = process.argv.slice(2);
const userId = parseInt(args[0], 10) || 1; // Default to user ID 1
const expirationMinutes = parseInt(args[1], 10) || 60; // Default to 60 minutes

// Generate token
const token = devAuthService.generateToken(userId, expirationMinutes);

if (!token) {
  console.error('Failed to generate token. Dev auth service may be disabled.');
  process.exit(1);
}

// Generate login URL
const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
const loginUrl = devAuthService.createLoginUrl(token, baseUrl);

// Display results
console.log('\n=== DEV AUTH TOKEN GENERATED ===');
console.log(`User ID: ${userId}`);
console.log(`Expires in: ${expirationMinutes} minutes`);
console.log(`Token: ${token}`);
console.log(`\nLogin URL: ${loginUrl}`);
console.log('\nNote: This token can only be used once and will expire after the specified time.');
console.log('=================================\n');

// Create a curl command example for convenience
console.log('To authenticate via API:');
console.log(`curl -X GET "${baseUrl}/api/dev-auth/login?token=${token}"\n`);