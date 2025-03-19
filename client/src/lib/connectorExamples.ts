/**
 * Example usage patterns for data connectors
 * These examples serve as documentation for developers
 */

/**
 * Example query for CAMA connector
 */
export const camaQueryExample = {
  // Query by parcel ID
  byParcelId: {
    parcelId: "123456789",
    includeHistory: true
  },
  
  // Query by address 
  byAddress: {
    address: "123 Main St",
    city: "Anytown",
    state: "CA"
  },
  
  // Query by owner name
  byOwner: {
    owner: "Smith",
    exactMatch: false
  },
  
  // Query by value range
  byValueRange: {
    minValue: 200000,
    maxValue: 500000,
    valueType: "assessed" // Options: "assessed", "market", "land", "improvement"
  },
  
  // Query by neighborhood
  byNeighborhood: {
    neighborhood: "Downtown",
    propertyClass: "residential" // Options: "residential", "commercial", "industrial", "agricultural"
  },
  
  // Query by sale date range
  bySaleDate: {
    saleStartDate: "2022-01-01",
    saleEndDate: "2022-12-31",
    minSaleAmount: 250000
  },
  
  // Pagination and sorting
  pagination: {
    page: 1,
    limit: 25,
    sortBy: "assessedValue",
    sortOrder: "desc"
  },
  
  // Complex query combining multiple filters
  complexQuery: {
    neighborhood: "Downtown",
    minValue: 300000,
    maxValue: 600000,
    propertyClass: "residential",
    saleStartDate: "2020-01-01",
    page: 1,
    limit: 50,
    sortBy: "lastSaleDate",
    sortOrder: "desc"
  }
};

/**
 * Example query for GIS connector
 */
export const gisQueryExample = {
  // Query by bounding box
  byBoundingBox: {
    bbox: [-122.48, 37.73, -122.35, 37.81], // [west, south, east, north]
    limit: 100
  },
  
  // Query by point and radius
  byPointAndRadius: {
    point: [-122.42, 37.78], // [longitude, latitude]
    distance: 1000, // meters
    limit: 50
  },
  
  // Query by polygon
  byPolygon: {
    polygon: [
      [-122.42, 37.78],
      [-122.40, 37.77],
      [-122.39, 37.79],
      [-122.41, 37.80],
      [-122.42, 37.78] // Close the polygon
    ],
    limit: 200
  },
  
  // Query by parcel ID
  byParcelId: {
    id: "123456789",
    includeAttributes: true
  },
  
  // Query with specific layer
  withLayer: {
    bbox: [-122.48, 37.73, -122.35, 37.81],
    layer: "parcels", // Specific layer to query
    fields: ["OBJECTID", "PARCELID", "ADDRESS", "ZONING", "ACRES"]
  },
  
  // Query for zoning
  forZoning: {
    bbox: [-122.48, 37.73, -122.35, 37.81],
    layer: "zoning",
    attributes: {
      ZONE_TYPE: "residential"
    },
    limit: 100
  }
};

/**
 * Helper function to create API request options
 */
export function createConnectorRequestOptions(connectorName: string, connectorType: 'cama' | 'gis', queryData: any) {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(queryData)
  };
}

/**
 * Utility to fetch data from a connector
 */
export async function fetchFromConnector(
  connectorName: string, 
  connectorType: 'cama' | 'gis', 
  queryData: any
): Promise<any> {
  try {
    const endpoint = `/api/connectors/${connectorName}/query/${connectorType}`;
    const response = await fetch(endpoint, createConnectorRequestOptions(connectorName, connectorType, queryData));
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching from ${connectorType} connector:`, error);
    throw error;
  }
}

/**
 * Example usage in a React component:
 * 
 * import { fetchFromConnector, camaQueryExample } from '@/lib/connectorExamples';
 * 
 * // In a React component:
 * const fetchPropertyData = async () => {
 *   try {
 *     setLoading(true);
 *     const queryData = {
 *       parcelId: parcelIdInput,
 *       includeHistory: true
 *     };
 *     const result = await fetchFromConnector('demo-cama', 'cama', queryData);
 *     setPropertyData(result.data);
 *   } catch (error) {
 *     setError(error.message);
 *   } finally {
 *     setLoading(false);
 *   }
 * };
 */