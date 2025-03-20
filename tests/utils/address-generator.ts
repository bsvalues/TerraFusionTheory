/**
 * Address Generator utility for generating realistic test addresses
 * for the Grandview, WA area to use in testing.
 */

// Common street names in Grandview, WA area
const STREET_NAMES = [
  'Main', 'Hill', 'Elm', 'Grandridge', 'Oak', 'Pine', 'Birch', 'Maple', 
  'Avenue A', 'Avenue B', 'Avenue C', 'Avenue D', 'Avenue E', 'Avenue F', 'Avenue G',
  'Avenue H', 'Wine Country', 'Stover', 'Larson', 'Euclid', 'Highland', 
  'Cherry', 'Apricot', 'Grape', 'Walnut', 'Peach', 'Grandview', 'Pleasant', 
  'Willoughby', 'Forsell', 'Chase', 'Vista', 'Valley', 'Yakima', 
  'Bonnieview', 'Appleway', 'Fir', 'Ash', 'Cedar', 'Spruce', 'Aspen'
];

// Common street types
const STREET_TYPES = [
  'St', 'Ave', 'Rd', 'Dr', 'Ln', 'Way', 'Pl', 'Ct', 'Blvd', 'Terrace', 'Loop'
];

// Grandview zip codes
const ZIP_CODES = ['98930'];

// Yakima County neighborhoods in Grandview area
const NEIGHBORHOODS = [
  'Downtown', 'North Grandview', 'South Hill', 'West Valley', 'East Valley', 
  'Mountview', 'Stover', 'Euclid', 'Vineyard Estates', 'Highland Park', 
  'Cherry Heights', 'Country View', 'Pleasant Valley', 'Wine Country', 'Orchard View'
];

/**
 * Generates a random address in the Grandview, WA area
 */
export function generateRandomAddress() {
  const houseNumber = Math.floor(Math.random() * 5000) + 100;
  const streetName = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
  const streetType = STREET_TYPES[Math.floor(Math.random() * STREET_TYPES.length)];
  const zip = ZIP_CODES[Math.floor(Math.random() * ZIP_CODES.length)];
  const neighborhood = NEIGHBORHOODS[Math.floor(Math.random() * NEIGHBORHOODS.length)];
  
  return {
    address: `${houseNumber} ${streetName} ${streetType}`,
    city: 'Grandview',
    state: 'WA',
    zip,
    neighborhood
  };
}

/**
 * Generates a batch of random addresses in the Grandview, WA area
 * 
 * @param count Number of addresses to generate
 * @returns Array of address objects
 */
export function generateAddressBatch(count: number = 10) {
  return Array.from({ length: count }, () => generateRandomAddress());
}

/**
 * Generates a specific address in the Grandview, WA area
 * using a seed (0-99) for deterministic generation
 * 
 * @param seed Seed number (0-99) for deterministic generation
 * @returns Address object
 */
export function generateSeededAddress(seed: number) {
  seed = seed % 100; // Keep seed between 0-99
  
  // Use seed to select components deterministically
  const houseNumber = (seed * 53 + 100) % 5000 + 100;
  const streetNameIndex = (seed * 17) % STREET_NAMES.length;
  const streetTypeIndex = (seed * 23) % STREET_TYPES.length;
  const neighborhoodIndex = (seed * 31) % NEIGHBORHOODS.length;
  
  return {
    address: `${houseNumber} ${STREET_NAMES[streetNameIndex]} ${STREET_TYPES[streetTypeIndex]}`,
    city: 'Grandview',
    state: 'WA',
    zip: '98930',
    neighborhood: NEIGHBORHOODS[neighborhoodIndex]
  };
}

/**
 * Returns a specific set of Grandview addresses for consistent test data
 * These addresses can be used as standards in tests
 */
export function getStandardTestAddresses() {
  return [
    {
      address: '2204 Hill Dr',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      neighborhood: 'Highland Park'
    },
    {
      address: '500 Main St',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      neighborhood: 'Downtown'
    },
    {
      address: '1420 Elm St',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      neighborhood: 'North Grandview'
    },
    {
      address: '303 Avenue C',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      neighborhood: 'Downtown'
    },
    {
      address: '1825 Wine Country Rd',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      neighborhood: 'Wine Country'
    }
  ];
}

// Geocoding coordinates for Grandview, WA
const GRANDVIEW_CENTER_LAT = 46.256;
const GRANDVIEW_CENTER_LON = -119.902;
const COORD_VARIANCE = 0.02; // Roughly ~2km in each direction

/**
 * Generates a random coordinate pair within the Grandview city bounds
 */
export function generateRandomCoordinates() {
  const latVariance = (Math.random() * 2 - 1) * COORD_VARIANCE;
  const lonVariance = (Math.random() * 2 - 1) * COORD_VARIANCE;
  
  return {
    latitude: GRANDVIEW_CENTER_LAT + latVariance,
    longitude: GRANDVIEW_CENTER_LON + lonVariance
  };
}

/**
 * Generates a coordinate pair based on a seed (0-99)
 * 
 * @param seed Seed number (0-99) for deterministic generation
 * @returns Coordinate pair
 */
export function generateSeededCoordinates(seed: number) {
  seed = seed % 100; // Keep seed between 0-99
  
  // Use a deterministic algorithm based on the seed
  const latRatio = Math.sin(seed * 0.1) * COORD_VARIANCE;
  const lonRatio = Math.cos(seed * 0.1) * COORD_VARIANCE;
  
  return {
    latitude: GRANDVIEW_CENTER_LAT + latRatio,
    longitude: GRANDVIEW_CENTER_LON + lonRatio
  };
}