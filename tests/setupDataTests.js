/**
 * Setup file for data-intensive tests in the IntelligentEstate project
 * Handles mocking of file system, database connections, and external APIs
 */

// Import core testing utilities
import '@testing-library/jest-dom';

// Mock file system for data tests
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn().mockImplementation((path) => {
      // Mock CSV data for market data files
      if (path.endsWith('.csv')) {
        return Promise.resolve(
          'mlsNumber,address,city,state,zip,price,status,propertyType,beds,baths,squareFeet,yearBuilt,daysOnMarket\n' +
          'MLS12345,123 Main St,Grandview,WA,98930,400000,active,single-family,3,2,1800,2010,15\n' +
          'MLS12346,456 Oak Ave,Grandview,WA,98930,550000,active,single-family,4,3,2500,2015,7\n' +
          'MLS12347,789 Pine St,Grandview,WA,98930,380000,sold,single-family,3,2,1700,2008,25\n'
        );
      }
      
      // Mock JSON data for property data files
      if (path.endsWith('.json')) {
        return Promise.resolve(JSON.stringify({
          properties: [
            {
              id: 'PROP12345',
              parcelId: 'APN12345',
              address: '123 Main St',
              owner: 'John Doe',
              assessedValue: 380000,
              marketValue: 400000,
              landValue: 150000,
              improvementValue: 250000,
              assessmentYear: 2025,
              propertyClass: 'residential',
              acres: 0.25,
              squareFeet: 1800
            },
            {
              id: 'PROP12346',
              parcelId: 'APN12346',
              address: '456 Oak Ave',
              owner: 'Jane Smith',
              assessedValue: 520000,
              marketValue: 550000,
              landValue: 200000,
              improvementValue: 350000,
              assessmentYear: 2025,
              propertyClass: 'residential',
              acres: 0.3,
              squareFeet: 2500
            }
          ]
        }));
      }
      
      // Default for other file types
      return Promise.resolve('');
    }),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue(['test.csv', 'test.json']),
    stat: jest.fn().mockResolvedValue({ 
      isFile: () => true,
      isDirectory: () => false,
      size: 1024,
      mtime: new Date()
    }),
    mkdir: jest.fn().mockResolvedValue(undefined),
    access: jest.fn().mockResolvedValue(undefined)
  },
  readFileSync: jest.fn().mockImplementation(() => ''),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

// Mock for axios (used in API connectors)
jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ 
      data: {}, 
      status: 200 
    }),
    post: jest.fn().mockResolvedValue({ 
      data: {}, 
      status: 200 
    }),
    request: jest.fn().mockResolvedValue({ 
      data: {}, 
      status: 200 
    })
  }),
  get: jest.fn().mockResolvedValue({ 
    data: {}, 
    status: 200 
  }),
  post: jest.fn().mockResolvedValue({ 
    data: {}, 
    status: 200 
  }),
  isAxiosError: jest.fn().mockReturnValue(false)
}));

// Mock for database connection
jest.mock('@neondatabase/serverless', () => {
  const mockPool = {
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn()
    }),
    query: jest.fn().mockResolvedValue({ rows: [] }),
    end: jest.fn().mockResolvedValue(undefined)
  };
  return { Pool: jest.fn(() => mockPool) };
});

// Mock for the CSV parser
jest.mock('csv-parse', () => ({
  parse: jest.fn().mockImplementation((input, options, callback) => {
    const records = [
      ['mlsNumber', 'address', 'city', 'state', 'zip', 'price', 'status', 'propertyType', 'beds', 'baths', 'squareFeet', 'yearBuilt', 'daysOnMarket'],
      ['MLS12345', '123 Main St', 'Grandview', 'WA', '98930', '400000', 'active', 'single-family', '3', '2', '1800', '2010', '15'],
      ['MLS12346', '456 Oak Ave', 'Grandview', 'WA', '98930', '550000', 'active', 'single-family', '4', '3', '2500', '2015', '7']
    ];
    if (callback) {
      callback(null, records);
    }
    return {
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === 'readable') {
          handler();
        } else if (event === 'end') {
          handler();
        }
        return this;
      }),
      read: jest.fn().mockReturnValueOnce(records[0]).mockReturnValueOnce(records[1]).mockReturnValueOnce(records[2]).mockReturnValue(null)
    };
  })
}));

// Helper to create mock responses for property data
global.createMockPropertyData = (count = 5, baseValues = {}) => {
  const properties = [];
  for (let i = 0; i < count; i++) {
    properties.push({
      id: `PROP${10000 + i}`,
      parcelId: `APN${10000 + i}`,
      address: `${100 + i} Main St`,
      owner: `Owner ${i}`,
      assessedValue: 350000 + (i * 25000),
      marketValue: 400000 + (i * 30000),
      landValue: 150000 + (i * 10000),
      improvementValue: 250000 + (i * 20000),
      assessmentYear: 2025,
      propertyClass: 'residential',
      acres: 0.2 + (i * 0.05),
      squareFeet: 1800 + (i * 200),
      ...baseValues
    });
  }
  return properties;
};

// Helper to create mock property listings
global.createMockPropertyListings = (count = 5, baseValues = {}) => {
  const listings = [];
  for (let i = 0; i < count; i++) {
    listings.push({
      mlsNumber: `MLS${10000 + i}`,
      address: `${100 + i} Main St`,
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      price: 400000 + (i * 50000),
      originalPrice: 420000 + (i * 50000),
      status: i % 4 === 0 ? 'sold' : 'active',
      propertyType: i % 3 === 0 ? 'condo' : 'single-family',
      beds: 3 + (i % 3),
      baths: 2 + (i % 2),
      squareFeet: 1500 + (i * 250),
      yearBuilt: 2000 + i,
      daysOnMarket: 5 + (i * 3),
      ...baseValues
    });
  }
  return listings;
};

// Global cleanup
afterAll(() => {
  jest.restoreAllMocks();
});