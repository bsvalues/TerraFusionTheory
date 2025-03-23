/**
 * Property Insights Service
 * 
 * This service detects property addresses in messages and fetches property data
 * to provide contextual insights during conversations.
 */

import { PropertyInsight } from "@/components/ai/PropertyInsightCard";

// Pattern to detect common property address formats in text
const ADDRESS_PATTERNS = [
  // Standard street address with optional apartment/unit
  /\b\d+\s+[A-Za-z0-9\s,.'()-]+(?:Avenue|Ave|Boulevard|Blvd|Circle|Cir|Court|Ct|Drive|Dr|Lane|Ln|Parkway|Pkwy|Place|Pl|Road|Rd|Square|Sq|Street|St|Terrace|Ter|Way)\b(?:\s+(?:Apt|Unit|#)\s*[A-Za-z0-9-]+)?/gi,
  
  // Address with city/state/zip
  /\b\d+\s+[A-Za-z0-9\s,.'()-]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/gi,
  
  // Addresses that specifically mention Grandview, WA
  /\b\d+\s+[A-Za-z0-9\s,.'()-]+(?:Grandview|GRANDVIEW|grandview)(?:,)?\s*(?:WA|Washington)?\s*(?:\d{5}(?:-\d{4})?)?\b/gi
];

// Mock data for properties (in a real application, this would come from an API)
const mockProperties: Record<string, PropertyInsight> = {
  "p1": {
    propertyId: "p1",
    address: "123 Main St, Grandview, WA 98930",
    price: 385000,
    priceHistory: [
      { date: "2023-01-15", price: 375000 },
      { date: "2023-06-20", price: 385000 }
    ],
    squareFeet: 2100,
    bedrooms: 3,
    bathrooms: 2.5,
    yearBuilt: 2005,
    lotSize: "0.25 acres",
    propertyType: "Single Family",
    listingStatus: "active",
    daysOnMarket: 45,
    neighborhood: "West Grandview",
    pricePerSqFt: 183.33,
    comparables: {
      avgPrice: 392000,
      avgPricePerSqFt: 187.50,
      avgDaysOnMarket: 38
    },
    valueChange: {
      percent: 5.2,
      period: "1year"
    },
    tags: ["Updated Kitchen", "Large Backyard", "Garage"],
    highlights: [
      "Recently renovated kitchen with stainless steel appliances",
      "Spacious backyard with mature landscaping",
      "Close to local schools and parks"
    ],
    imageUrl: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: {
      lat: 46.2508,
      lng: -119.9025
    }
  },
  "p2": {
    propertyId: "p2",
    address: "456 Vine Avenue, Grandview, WA 98930",
    price: 299000,
    squareFeet: 1750,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 1998,
    propertyType: "Single Family",
    listingStatus: "active",
    daysOnMarket: 28,
    pricePerSqFt: 170.86,
    comparables: {
      avgPrice: 305000,
      avgPricePerSqFt: 175.20,
      avgDaysOnMarket: 32
    },
    valueChange: {
      percent: 3.8,
      period: "1year"
    },
    tags: ["Move-in Ready", "Fenced Yard"],
    highlights: [
      "Well-maintained property in established neighborhood",
      "Fenced backyard perfect for pets",
      "Updated bathroom fixtures"
    ],
    coordinates: {
      lat: 46.2469,
      lng: -119.9048
    }
  },
  "p3": {
    propertyId: "p3",
    address: "789 Cherry Lane, Grandview, WA 98930",
    price: 425000,
    squareFeet: 2400,
    bedrooms: 4,
    bathrooms: 3,
    yearBuilt: 2015,
    lotSize: "0.3 acres",
    propertyType: "Single Family",
    listingStatus: "pending",
    daysOnMarket: 12,
    neighborhood: "North Heights",
    pricePerSqFt: 177.08,
    valueChange: {
      percent: 7.5,
      period: "1year"
    },
    tags: ["Modern", "Open Concept", "Energy Efficient"],
    highlights: [
      "Modern open concept floor plan",
      "Energy efficient appliances and HVAC",
      "Custom built-ins throughout"
    ],
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: {
      lat: 46.2530,
      lng: -119.8975
    }
  },
  "p4": {
    propertyId: "p4",
    address: "2204 Hill Dr, Grandview, WA 98930",
    price: 349000,
    squareFeet: 1950,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2001,
    propertyType: "Single Family",
    listingStatus: "active",
    daysOnMarket: 35,
    neighborhood: "Hill View Estates",
    pricePerSqFt: 178.97,
    comparables: {
      avgPrice: 352000,
      avgPricePerSqFt: 180.45,
      avgDaysOnMarket: 42
    },
    valueChange: {
      percent: 4.6,
      period: "1year"
    },
    tags: ["Corner Lot", "Mountain View", "Updated"],
    highlights: [
      "Corner lot with extra privacy",
      "Beautiful mountain views from the rear deck",
      "Freshly painted interior"
    ],
    imageUrl: "https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: {
      lat: 46.2492,
      lng: -119.8982
    }
  }
};

// Interface for the service response
interface PropertyInsightResponse {
  detected: boolean;
  properties: PropertyInsight[];
  addressMatches: string[];
}

/**
 * Detect property addresses in a message and return property insights
 * @param message The message to analyze for property addresses
 * @returns Object containing detected properties and address matches
 */
export async function detectPropertyInsights(message: string): Promise<PropertyInsightResponse> {
  // Default response with no detections
  const response: PropertyInsightResponse = {
    detected: false,
    properties: [],
    addressMatches: []
  };
  
  // Skip empty messages
  if (!message || message.trim() === '') {
    return response;
  }
  
  try {
    // Check each pattern for matches
    let allMatches: string[] = [];
    
    for (const pattern of ADDRESS_PATTERNS) {
      const matches = message.match(pattern);
      if (matches) {
        allMatches = [...allMatches, ...matches];
      }
    }
    
    // Remove duplicates
    const uniqueMatches = [...new Set(allMatches)];
    
    if (uniqueMatches.length === 0) {
      return response;
    }
    
    response.detected = true;
    response.addressMatches = uniqueMatches;
    
    // In a real application, we would fetch property data from an API
    // For now, we'll use mock data that approximately matches the detected addresses
    
    // Simulate an API call by returning properties that somewhat match the detected addresses
    for (const address of uniqueMatches) {
      // Look for properties that might match the detected address
      // This is a very simplistic matching for demonstration
      const matchedProperty = findMatchingProperty(address);
      
      if (matchedProperty) {
        response.properties.push(matchedProperty);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error detecting property insights:', error);
    return response;
  }
}

/**
 * Simple helper to find a property that might match a detected address
 * In a real application, this would perform a database query or API call
 */
function findMatchingProperty(address: string): PropertyInsight | null {
  // Normalize the address for comparison
  const normalizedAddress = address.toLowerCase().trim();
  
  // If we find an exact match in our mock data, return it
  for (const propertyId in mockProperties) {
    if (mockProperties[propertyId].address.toLowerCase().includes(normalizedAddress)) {
      return mockProperties[propertyId];
    }
  }
  
  // If we detect specific street names from our mock data
  for (const propertyId in mockProperties) {
    const propertyAddress = mockProperties[propertyId].address.toLowerCase();
    const streetName = propertyAddress.split(',')[0].split(' ').slice(1).join(' ');
    
    if (normalizedAddress.includes(streetName)) {
      return mockProperties[propertyId];
    }
  }
  
  // Check if certain addresses contain specific keywords
  if (normalizedAddress.includes('main')) {
    return mockProperties.p1;
  } else if (normalizedAddress.includes('vine')) {
    return mockProperties.p2;
  } else if (normalizedAddress.includes('cherry')) {
    return mockProperties.p3;
  } else if (normalizedAddress.includes('hill')) {
    return mockProperties.p4;
  }
  
  // If it's an address with Grandview, but we don't have a specific match,
  // return a random property as an example
  if (normalizedAddress.includes('grandview')) {
    const propertyIds = Object.keys(mockProperties);
    const randomPropertyId = propertyIds[Math.floor(Math.random() * propertyIds.length)];
    return mockProperties[randomPropertyId];
  }
  
  // No match found
  return null;
}

/**
 * Fetch property insights for a specific property ID
 * @param propertyId The ID of the property to fetch
 * @returns Property insight data or null if not found
 */
export async function getPropertyInsight(propertyId: string): Promise<PropertyInsight | null> {
  try {
    // In a real application, this would fetch from an API
    // For now, we'll use our mock data
    return mockProperties[propertyId] || null;
  } catch (error) {
    console.error('Error fetching property insight:', error);
    return null;
  }
}

/**
 * Search for properties matching a query (address, neighborhood, etc.)
 * @param query The search query
 * @param limit Maximum number of results to return
 * @returns Array of matching properties
 */
export async function searchProperties(query: string, limit: number = 5): Promise<PropertyInsight[]> {
  try {
    // In a real application, this would search via an API
    // For now, we'll filter our mock data
    const normalizedQuery = query.toLowerCase().trim();
    
    const matches = Object.values(mockProperties).filter(property => 
      property.address.toLowerCase().includes(normalizedQuery) ||
      (property.neighborhood && property.neighborhood.toLowerCase().includes(normalizedQuery))
    );
    
    return matches.slice(0, limit);
  } catch (error) {
    console.error('Error searching properties:', error);
    return [];
  }
}

// Default export for the service
const propertyInsightsService = {
  detectPropertyInsights,
  getPropertyInsight,
  searchProperties
};

export default propertyInsightsService;