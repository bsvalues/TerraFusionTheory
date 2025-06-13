/**
 * Script to execute the neighborhood data extraction
 * 
 * This is a simple wrapper to run the main extraction functionality
 */

const USAGE = `\nTerraFusionTheory Neighborhood Extraction Runner\n\nUsage:\n  npx ts-node scripts/run_neighborhood_extraction.ts <input.csv> [options]\n\nOptions:\n  --help       Show this help message and exit\n\nDescription:\n  Runs neighborhood extraction logic on a CSV file and saves results to the database.\n  Supports interactive prompts for missing fields.\n\nExample:\n  npx ts-node scripts/run_neighborhood_extraction.ts data/properties.csv\n\n`;

if (process.argv.includes('--help') || process.argv.length <= 2) {
  console.log(USAGE);
  process.exit(0);
}

import { main } from './extract_neighborhood_data';

// Run the main function
console.log('Starting neighborhood data extraction process...');
main()
  .then(() => {
    console.log('Neighborhood data extraction completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to extract neighborhood data:', error);
    process.exit(1);
  });