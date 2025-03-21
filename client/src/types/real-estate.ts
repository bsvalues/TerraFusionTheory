/**
 * Market condition status
 */
export type MarketCondition = 'hot' | 'warm' | 'balanced' | 'cool' | 'cold';

/**
 * Market trend direction
 */
export type MarketTrend = 'upStrong' | 'upModerate' | 'stable' | 'downModerate' | 'downStrong';

/**
 * Market metrics snapshot for a specific time period
 */
export interface MarketMetricsSnapshot {
  // Time period
  periodStart: Date;
  periodEnd: Date;
  
  // Overall metrics
  totalListings: number;
  totalSales: number;
  
  // Price metrics
  medianPrice: number;
  averagePrice: number;
  pricePerSqFtAvg: number;
  
  // Time metrics
  avgDaysOnMarket: number;
  
  // Ratio metrics
  listToSaleRatio: number; // sale price / list price
  
  // Condition and trend
  marketCondition: MarketCondition;
  marketTrend: MarketTrend;
  
  // Segment metrics (by property type, price range, etc.)
  segmentMetrics: {
    [key: string]: {
      totalListings: number;
      medianPrice: number;
      avgDaysOnMarket: number;
    }
  };
}

/**
 * Property Listing Data structure
 */
export interface PropertyListing {
  mlsNumber: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  originalPrice?: number;
  status: string;
  propertyType: string;
  beds: number;
  baths: number;
  squareFeet: number;
  lotSize?: number | string;
  yearBuilt?: number;
  daysOnMarket?: number;
  closingDate?: string;
  description?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  garage?: string;
  photos?: number;
  [key: string]: any;
}

/**
 * Market prediction result
 */
export interface MarketPrediction {
  predictedMetrics: Partial<MarketMetricsSnapshot>;
  confidenceScore: number;
}