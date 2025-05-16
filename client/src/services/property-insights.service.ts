/**
 * Property Insights Service
 * 
 * This service detects property addresses in messages and fetches property data
 * to provide contextual insights during conversations.
 */

import { PropertyInsight } from "@/components/ai/PropertyInsightCard";
import Fuse from 'fuse.js';

// Pattern to detect common property address formats in text
const ADDRESS_PATTERNS = [
  // Standard street address with optional apartment/unit - extended street types
  /\b\d+\s+[A-Za-z0-9\s,.'()-]+(?:Avenue|Ave|Boulevard|Blvd|Circle|Cir|Court|Ct|Drive|Dr|Lane|Ln|Parkway|Pkwy|Place|Pl|Road|Rd|Square|Sq|Street|St|Terrace|Ter|Way|Loop|Point|Pt|Trail|Trl|Run|Pass|Ridge|View|Vw|Bend|Canyon|Heights|Ht|Highway|Hwy)\b(?:\s+(?:Apt|Unit|#)\s*[A-Za-z0-9-]+)?/gi,
  
  // Address with city/state/zip
  /\b\d+\s+[A-Za-z0-9\s,.'()-]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?\b/gi,
  
  // Addresses that specifically mention Grandview, WA
  /\b\d+\s+[A-Za-z0-9\s,.'()-]+(?:Grandview|GRANDVIEW|grandview)(?:,)?\s*(?:WA|Washington)?\s*(?:\d{5}(?:-\d{4})?)?\b/gi,
  
  // Addresses that specifically mention Richland, WA
  /\b\d+\s+[A-Za-z0-9\s,.'()-]+(?:Richland|RICHLAND|richland)(?:,)?\s*(?:WA|Washington)?\s*(?:\d{5}(?:-\d{4})?)?\b/gi,
  
  // Specific Richland neighborhoods
  /\b(?:Columbia Point|South Richland|Horn Rapids|Meadow Springs|Central Richland|Badger Mountain|Bellerive)\b/gi,
  
  // Named streets in Richland with house number detection
  /\b\d+\s+(?:Newcomer|Columbia Point|Aaron|Jadwin|Bellerive|George Washington|Lee|Thayer|Williams|Duportail|Keene|Leslie|Gage|Wright|Stevens|Swift|Goethals|Wellsian|Comstock|Torbett|Van Giesen)\b/gi
];

// Property data including real Richland, WA listings in Benton County
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
  },
  // Richland, WA Properties (Benton County)
  "r1": {
    propertyId: "r1",
    address: "1205 Newcomer St, Richland, WA 99354",
    price: 549000,
    priceHistory: [
      { date: "2023-10-15", price: 565000 },
      { date: "2024-01-10", price: 549000 }
    ],
    squareFeet: 2450,
    bedrooms: 4,
    bathrooms: 3,
    yearBuilt: 2010,
    lotSize: "0.28 acres",
    propertyType: "Single Family",
    listingStatus: "active",
    daysOnMarket: 32,
    neighborhood: "South Richland",
    pricePerSqFt: 224.08,
    comparables: {
      avgPrice: 560000,
      avgPricePerSqFt: 230.15,
      avgDaysOnMarket: 25
    },
    valueChange: {
      percent: 8.2,
      period: "1year"
    },
    tags: ["Upgraded", "Smart Home", "Energy Efficient"],
    highlights: [
      "Recent kitchen remodel with quartz countertops",
      "Smart home technology throughout",
      "Energy efficient windows and appliances"
    ],
    imageUrl: "https://images.unsplash.com/photo-1592595896616-c37162298647?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: {
      lat: 46.2716,
      lng: -119.2840
    }
  },
  "r2": {
    propertyId: "r2",
    address: "324 Columbia Point Dr, Richland, WA 99352",
    price: 875000,
    squareFeet: 3200,
    bedrooms: 5,
    bathrooms: 3.5,
    yearBuilt: 2018,
    lotSize: "0.35 acres",
    propertyType: "Single Family",
    listingStatus: "active",
    daysOnMarket: 15,
    neighborhood: "Columbia Point",
    pricePerSqFt: 273.44,
    comparables: {
      avgPrice: 890000,
      avgPricePerSqFt: 280.10,
      avgDaysOnMarket: 18
    },
    valueChange: {
      percent: 10.5,
      period: "1year"
    },
    tags: ["Waterfront", "Luxury", "Custom Built"],
    highlights: [
      "Stunning Columbia River views from multiple rooms",
      "Custom built with high-end finishes throughout",
      "Luxurious primary suite with walk-in closet and spa bath"
    ],
    imageUrl: "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: {
      lat: 46.2569,
      lng: -119.2762
    }
  },
  "r3": {
    propertyId: "r3",
    address: "850 Aaron Dr, Richland, WA 99352",
    price: 425000,
    squareFeet: 1950,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 1995,
    lotSize: "0.18 acres",
    propertyType: "Single Family",
    listingStatus: "pending",
    daysOnMarket: 7,
    neighborhood: "Horn Rapids",
    pricePerSqFt: 217.95,
    valueChange: {
      percent: 6.8,
      period: "1year"
    },
    tags: ["Golf Course", "Updated", "Single Level"],
    highlights: [
      "Single level home located near Horn Rapids Golf Course",
      "Updated kitchen with stainless steel appliances",
      "Low maintenance landscaping with desert plantings"
    ],
    imageUrl: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: {
      lat: 46.3301,
      lng: -119.3058
    }
  },
  "r4": {
    propertyId: "r4",
    address: "1521 Jadwin Ave, Richland, WA 99354",
    price: 389000,
    squareFeet: 1850,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 1978,
    propertyType: "Single Family",
    listingStatus: "active",
    daysOnMarket: 42,
    neighborhood: "Central Richland",
    pricePerSqFt: 210.27,
    comparables: {
      avgPrice: 395000,
      avgPricePerSqFt: 215.50,
      avgDaysOnMarket: 35
    },
    valueChange: {
      percent: 5.3,
      period: "1year"
    },
    tags: ["Corner Lot", "Remodeled", "Mature Trees"],
    highlights: [
      "Recently remodeled with new flooring throughout",
      "Large corner lot with mature trees providing shade",
      "Close to parks, schools, and Uptown Shopping Center"
    ],
    imageUrl: "https://images.unsplash.com/photo-1625602812206-5ec545ca1231?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: {
      lat: 46.2840,
      lng: -119.2724
    }
  },
  "r5": {
    propertyId: "r5",
    address: "2150 Bellerive Dr, Richland, WA 99352",
    price: 725000,
    squareFeet: 2900,
    bedrooms: 4,
    bathrooms: 3,
    yearBuilt: 2012,
    lotSize: "0.30 acres",
    propertyType: "Single Family",
    listingStatus: "active",
    daysOnMarket: 23,
    neighborhood: "Meadow Springs",
    pricePerSqFt: 250.00,
    comparables: {
      avgPrice: 740000,
      avgPricePerSqFt: 255.75,
      avgDaysOnMarket: 21
    },
    valueChange: {
      percent: 9.2,
      period: "1year"
    },
    tags: ["Golf Course", "Pool", "Gourmet Kitchen"],
    highlights: [
      "Overlooks the 7th fairway of Meadow Springs Country Club",
      "Inground heated pool with covered patio area",
      "Gourmet kitchen with double ovens and large island"
    ],
    imageUrl: "https://images.unsplash.com/photo-1615529182904-14819c35db37?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    coordinates: {
      lat: 46.2375,
      lng: -119.3112
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
 * Enhanced helper to find a property that might match a detected address
 * Uses fuzzy matching for more flexible address recognition
 */
function findMatchingProperty(address: string): PropertyInsight | null {
  if (!address || address.trim() === '') {
    return null;
  }
  
  // Configure Fuse.js for address matching
  const options = {
    includeScore: true,
    threshold: 0.5, // Slightly more lenient threshold for address matching
    keys: [
      { name: 'address', weight: 1.0 },
      { name: 'neighborhood', weight: 0.7 }
    ]
  };
  
  // Create Fuse instance with our properties
  const fuse = new Fuse(Object.values(mockProperties), options);
  
  // Perform fuzzy search
  const results = fuse.search(address);
  
  // If we have any matches, return the best one
  if (results.length > 0) {
    return results[0].item;
  }
  
  // Fallback: Check for city or neighborhood matches
  const normalizedAddress = address.toLowerCase().trim();
  
  // Check for city names and return a relevant property
  if (normalizedAddress.includes('grandview')) {
    const grandviewProperties = ['p1', 'p2', 'p3', 'p4'];
    const randomPropertyId = grandviewProperties[Math.floor(Math.random() * grandviewProperties.length)];
    return mockProperties[randomPropertyId];
  } else if (normalizedAddress.includes('richland')) {
    const richlandProperties = ['r1', 'r2', 'r3', 'r4', 'r5'];
    const randomPropertyId = richlandProperties[Math.floor(Math.random() * richlandProperties.length)];
    return mockProperties[randomPropertyId];
  }
  
  // Additional fallback for common street names
  if (normalizedAddress.includes('main')) {
    return mockProperties.p1;
  } else if (normalizedAddress.includes('vine')) {
    return mockProperties.p2;
  } else if (normalizedAddress.includes('cherry')) {
    return mockProperties.p3;
  } else if (normalizedAddress.includes('hill')) {
    return mockProperties.p4;
  } else if (normalizedAddress.includes('newcomer')) {
    return mockProperties.r1;
  } else if (normalizedAddress.includes('columbia')) {
    return mockProperties.r2;
  } else if (normalizedAddress.includes('aaron')) {
    return mockProperties.r3;
  } else if (normalizedAddress.includes('jadwin')) {
    return mockProperties.r4;
  } else if (normalizedAddress.includes('bellerive')) {
    return mockProperties.r5;
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
    if (!query || query.trim() === '') {
      return [];
    }

    // Configure Fuse.js for fuzzy searching
    const options = {
      includeScore: true,
      threshold: 0.4, // Lower threshold = stricter matching
      keys: [
        { name: 'address', weight: 1.0 },
        { name: 'neighborhood', weight: 0.8 },
        { name: 'propertyType', weight: 0.4 },
        { name: 'tags', weight: 0.3 }
      ]
    };

    // Create a new Fuse instance with our properties
    const fuse = new Fuse(Object.values(mockProperties), options);
    
    // Perform the fuzzy search
    const results = fuse.search(query);
    
    // Return the items, sorted by match score (best matches first)
    return results.map(result => result.item).slice(0, limit);
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