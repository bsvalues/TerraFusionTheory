/**
 * Types for real estate data visualization components
 */

// Market condition enum
export enum MarketCondition {
  HOT = 'hot',
  WARM = 'warm',
  BALANCED = 'balanced',
  COOL = 'cool',
  COLD = 'cold'
}

// Market trend direction enum
export enum MarketTrend {
  UP_STRONG = 'upStrong',
  UP_MODERATE = 'upModerate',
  STABLE = 'stable',
  DOWN_MODERATE = 'downModerate',
  DOWN_STRONG = 'downStrong'
}

/**
 * Market metrics snapshot for visualization
 */
export interface MarketMetricsSnapshot {
  periodStart: string;
  periodEnd: string;
  totalListings: number;
  totalSales: number;
  medianPrice: number;
  averagePrice: number;
  pricePerSqFtAvg: number;
  avgDaysOnMarket: number;
  listToSaleRatio: number;
  marketCondition: MarketCondition;
  marketTrend: MarketTrend;
  segmentMetrics: Record<string, {
    totalListings: number;
    medianPrice: number;
    avgDaysOnMarket: number;
  }>;
}

/**
 * Market alert for visualization
 */
export interface MarketAlert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metrics: {
    previous: any;
    current: any;
    changePct?: number;
    changeAbs?: number;
  };
  affectedArea: string;
  affectedSegment?: string;
  recommendations?: string[];
}

/**
 * Property listing data for visualization
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
  [key: string]: any;
}

/**
 * GeoJSON feature collection for map visualization
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: string;
      coordinates: number[] | number[][] | number[][][] | number[][][][];
    };
    properties: Record<string, any>;
    id?: string | number;
  }>;
  bbox?: number[];
}

/**
 * Neighborhood trend data for visualization
 */
export interface NeighborhoodTrend {
  name: string;
  priceChange: number;
  daysOnMarketChange: number;
  inventoryChange: number;
  demandLevel: number;
  hotness: number;
  trendDirection: 'up' | 'down' | 'stable';
  predictions: {
    medianPrice: number;
    inventory: number;
    daysOnMarket: number;
  };
}

/**
 * Prediction data point for visualization
 */
export interface PredictionData {
  date: string;
  value: number;
  confidenceLow?: number;
  confidenceHigh?: number;
}

/**
 * Market prediction for visualization
 */
export interface MarketPrediction {
  predictions: PredictionData[];
  confidenceScore: number;
  predictionDate: string; 
  metric: string;
  metricLabel: string;
}

/**
 * Price history data point for visualization
 */
export interface PriceHistoryData {
  date: string;
  median: number;
  average: number;
  sqft: number;
}

/**
 * Segment comparison data for visualization
 */
export interface SegmentComparisonData {
  name: string;
  value: number;
  average: number;
}

/**
 * Radar chart data point for visualization
 */
export interface RadarDataPoint {
  metric: string;
  value: number;
  average: number;
}