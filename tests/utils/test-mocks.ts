/**
 * Centralized mock data and mock functions for IntelligentEstate tests
 */

import { 
  PropertyData 
} from '../../server/services/connectors/cama.connector';
import { 
  PropertyListing 
} from '../../server/services/connectors/market.connector';
import { 
  GeoJSONFeatureCollection 
} from '../../server/services/connectors/gis.connector';
import {
  ExtractedDocument,
  DocumentField
} from '../../server/services/connectors/pdf.connector';
import {
  MarketMetricsSnapshot,
  MarketCondition,
  MarketTrend,
  MarketAlert
} from '../../server/services/monitoring/market.monitor';
import {
  AIModelResponse
} from '../../server/services/ai/base';

// Mock Market Data
export const createMockPropertyListing = (
  overrides: Partial<PropertyListing> = {}
): PropertyListing => {
  return {
    mlsNumber: 'MLS12345',
    address: '123 Main St',
    city: 'Grandview',
    state: 'WA',
    zip: '98930',
    price: 400000,
    originalPrice: 420000,
    status: 'active',
    propertyType: 'single-family',
    beds: 3,
    baths: 2,
    squareFeet: 1800,
    yearBuilt: 2010,
    daysOnMarket: 15,
    description: 'Beautiful family home',
    neighborhood: 'Downtown',
    ...overrides
  };
};

export const createMockPropertyListings = (
  count: number = 5,
  baseOverrides: Partial<PropertyListing> = {}
): PropertyListing[] => {
  return Array.from({ length: count }, (_, i) => createMockPropertyListing({
    mlsNumber: `MLS${10000 + i}`,
    address: `${100 + i} Main St`,
    price: 400000 + (i * 50000),
    originalPrice: 420000 + (i * 50000),
    status: i % 4 === 0 ? 'sold' : 'active',
    propertyType: i % 3 === 0 ? 'condo' : 'single-family',
    beds: 3 + (i % 3),
    baths: 2 + (i % 2),
    squareFeet: 1500 + (i * 250),
    yearBuilt: 2000 + i,
    daysOnMarket: 5 + (i * 3),
    ...baseOverrides
  }));
};

// Mock Property Data
export const createMockPropertyData = (
  overrides: Partial<PropertyData> = {}
): PropertyData => {
  return {
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
    squareFeet: 1800,
    zoning: 'R1',
    neighborhood: 'Downtown',
    lastSaleDate: '2023-06-15',
    lastSalePrice: 395000,
    latitude: 46.2541,
    longitude: -119.9025,
    ...overrides
  };
};

export const createMockPropertyDataArray = (
  count: number = 5,
  baseOverrides: Partial<PropertyData> = {}
): PropertyData[] => {
  return Array.from({ length: count }, (_, i) => createMockPropertyData({
    id: `PROP${10000 + i}`,
    parcelId: `APN${10000 + i}`,
    address: `${100 + i} Main St`,
    assessedValue: 350000 + (i * 25000),
    marketValue: 400000 + (i * 30000),
    landValue: 150000 + (i * 10000),
    improvementValue: 250000 + (i * 20000),
    ...baseOverrides
  }));
};

// Mock GeoJSON Data
export const createMockGeoJSON = (
  listings: PropertyListing[] = createMockPropertyListings(3)
): GeoJSONFeatureCollection => {
  return {
    type: 'FeatureCollection',
    features: listings
      .filter(listing => listing.latitude && listing.longitude)
      .map(listing => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [listing.longitude!, listing.latitude!]
        },
        properties: {
          ...listing
        },
        id: listing.mlsNumber
      }))
  };
};

// Mock Document Data
export const createMockDocumentField = (
  overrides: Partial<DocumentField> = {}
): DocumentField => {
  return {
    name: 'address',
    value: '123 Main St',
    confidence: 0.95,
    pageNumber: 1,
    ...overrides
  };
};

export const createMockExtractedDocument = (
  overrides: Partial<ExtractedDocument> = {}
): ExtractedDocument => {
  return {
    documentId: 'DOC12345',
    fileName: 'property_report.pdf',
    documentType: 'property_report',
    extractionDate: new Date().toISOString(),
    fields: [
      createMockDocumentField({ name: 'address', value: '123 Main St' }),
      createMockDocumentField({ name: 'parcelId', value: 'APN12345' }),
      createMockDocumentField({ name: 'owner', value: 'John Doe' }),
      createMockDocumentField({ name: 'assessedValue', value: 380000 })
    ],
    metadata: {
      author: 'County Assessor',
      creationDate: '2025-01-15',
      pages: 3
    },
    pageCount: 3,
    rawText: 'Sample property report text content...',
    ...overrides
  };
};

// Mock Market Metrics
export const createMockMarketSnapshot = (
  overrides: Partial<MarketMetricsSnapshot> = {}
): MarketMetricsSnapshot => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return {
    periodStart: thirtyDaysAgo,
    periodEnd: now,
    totalListings: 45,
    totalSales: 12,
    medianPrice: 425000,
    averagePrice: 450000,
    pricePerSqFtAvg: 250,
    avgDaysOnMarket: 22,
    listToSaleRatio: 0.97,
    marketCondition: MarketCondition.BALANCED,
    marketTrend: MarketTrend.STABLE,
    segmentMetrics: {
      'single-family': {
        totalListings: 30,
        medianPrice: 450000,
        avgDaysOnMarket: 20
      },
      'condo': {
        totalListings: 15,
        medianPrice: 350000,
        avgDaysOnMarket: 25
      }
    },
    ...overrides
  };
};

export const createMockMarketAlert = (
  overrides: Partial<MarketAlert> = {}
): MarketAlert => {
  return {
    id: 'ALERT12345',
    timestamp: new Date(),
    title: 'Rising Home Prices in Downtown',
    description: 'Home prices in Downtown have increased by 8% in the last month.',
    severity: 'warning',
    metrics: {
      previous: 450000,
      current: 486000,
      changePct: 8,
      changeAbs: 36000
    },
    affectedArea: 'Downtown',
    affectedSegment: 'single-family',
    recommendations: [
      'Consider accelerating purchase decisions',
      'Evaluate investment opportunity in adjacent neighborhoods'
    ],
    ...overrides
  };
};

// Mock AI Responses
export const createMockAIResponse = (
  overrides: Partial<AIModelResponse> = {}
): AIModelResponse => {
  return {
    text: 'This is a sample AI response for testing purposes.',
    usage: {
      promptTokens: 150,
      completionTokens: 200,
      totalTokens: 350
    },
    meta: {
      model: 'gpt-4',
      requestId: 'req-12345',
      durationMs: 1500
    },
    ...overrides
  };
};

// Mock connectors
export const mockConnector = {
  getName: jest.fn().mockReturnValue('test-connector'),
  getType: jest.fn().mockReturnValue('test'),
  testConnection: jest.fn().mockResolvedValue(true),
  fetchData: jest.fn().mockResolvedValue({}),
  getAvailableModels: jest.fn().mockResolvedValue(['model1', 'model2']),
  getModelSchema: jest.fn().mockResolvedValue({})
};

// Helper utilities
export const waitMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getMockPromise = <T>(data: T, delayMs: number = 0) => 
  new Promise<T>(resolve => setTimeout(() => resolve(data), delayMs));