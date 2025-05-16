/**
 * Script to execute the neighborhood data extraction
 * 
 * This is a simple wrapper to run the main extraction functionality
 */

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