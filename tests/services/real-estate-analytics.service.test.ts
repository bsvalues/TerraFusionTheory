import { realEstateAnalyticsService } from '../../server/services/real-estate-analytics.service';
import { storage } from '../../server/storage';
import { connectorFactory } from '../../server/services/connectors/connector.factory';
import { dataValidator } from '../../server/services/enrichment/data.validator';
import { geospatialEnricher } from '../../server/services/enrichment/geospatial.enricher';
import { marketMonitor } from '../../server/services/monitoring/market.monitor';
import { GeoJSONFeatureCollection } from '../../server/services/connectors/gis.connector';
import { PropertyListing } from '../../server/services/connectors/market.connector';
import { PropertyData } from '../../server/services/connectors/cama.connector';

// Mock dependencies
jest.mock('../../server/storage');
jest.mock('../../server/services/connectors/connector.factory');
jest.mock('../../server/services/enrichment/data.validator');
jest.mock('../../server/services/enrichment/geospatial.enricher');
jest.mock('../../server/services/monitoring/market.monitor');
jest.mock('../../server/services/scheduler.service', () => ({
  scheduler: {
    addJob: jest.fn()
  }
}));

describe('RealEstateAnalyticsService', () => {
  const mockMarketSnapshot = {
    periodStart: new Date('2025-01-01'),
    periodEnd: new Date('2025-02-01'),
    totalListings: 150,
    totalSales: 45,
    medianPrice: 425000,
    averagePrice: 450000,
    pricePerSqFtAvg: 225,
    avgDaysOnMarket: 28,
    listToSaleRatio: 0.97,
    marketCondition: 'balanced',
    marketTrend: 'stable',
    segmentMetrics: {
      'luxury': {
        totalListings: 20,
        medianPrice: 950000,
        avgDaysOnMarket: 45
      },
      'entry-level': {
        totalListings: 65,
        medianPrice: 295000,
        avgDaysOnMarket: 14
      }
    }
  };

  const mockPropertyListing: PropertyListing = {
    mlsNumber: 'MLS123456',
    address: '123 Main St',
    city: 'Grandview',
    state: 'TX',
    zip: '75050',
    price: 450000,
    status: 'active',
    propertyType: 'single-family',
    beds: 4,
    baths: 3,
    squareFeet: 2500,
    yearBuilt: 2015,
    daysOnMarket: 14,
    latitude: 32.745,
    longitude: -96.998
  };

  const mockPropertyData: PropertyData = {
    id: 'P12345',
    parcelId: 'GV-12345-67',
    address: '123 Main St',
    owner: 'John Doe',
    assessedValue: 420000,
    marketValue: 450000,
    landValue: 120000,
    improvementValue: 330000,
    assessmentYear: 2024,
    propertyClass: 'single-family',
    acres: 0.25,
    squareFeet: 2500,
    zoning: 'R1',
    neighborhood: 'Grandview Heights',
    lastSaleDate: '2020-06-15',
    lastSalePrice: 425000,
    latitude: 32.745,
    longitude: -96.998
  };

  const mockGeoJSON: GeoJSONFeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-96.998, 32.745]
        },
        properties: {
          mlsNumber: 'MLS123456',
          address: '123 Main St',
          price: 450000,
          beds: 4,
          baths: 3
        }
      }
    ]
  };

  const mockAlerts = [
    {
      id: 'alert1',
      timestamp: new Date(),
      title: 'Price Increase in Grandview Heights',
      description: 'Median home prices have increased by 5.2% in the last month',
      severity: 'info',
      metrics: {
        previous: { medianPrice: 403000 },
        current: { medianPrice: 425000 },
        changePct: 5.2
      },
      affectedArea: 'Grandview Heights'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the marketMonitor
    (marketMonitor.generateSnapshot as jest.Mock).mockResolvedValue(mockMarketSnapshot);
    (marketMonitor.checkForMarketChanges as jest.Mock).mockResolvedValue(mockAlerts);

    // Mock the connectors
    const mockMarketConnector = {
      fetchData: jest.fn().mockResolvedValue({ 
        listings: [mockPropertyListing],
        total: 1 
      })
    };
    
    const mockGISConnector = {
      fetchData: jest.fn().mockResolvedValue(mockGeoJSON)
    };
    
    const mockCAMAConnector = {
      fetchData: jest.fn().mockResolvedValue({
        properties: [mockPropertyData],
        total: 1
      })
    };
    
    (connectorFactory.getConnectorsByType as jest.Mock).mockImplementation((type) => {
      if (type === 'market') return [mockMarketConnector];
      if (type === 'gis') return [mockGISConnector];
      if (type === 'cama') return [mockCAMAConnector];
      return [];
    });

    // Mock geospatial enricher
    (geospatialEnricher.convertListingsToGeoJSON as jest.Mock).mockReturnValue(mockGeoJSON);
    (geospatialEnricher.analyzeNeighborhoodTrends as jest.Mock).mockReturnValue({
      'Grandview Heights': {
        priceChange: 5.2,
        inventoryChange: -2.5,
        avgDOMChange: -5.0,
        trend: 'appreciation'
      }
    });
  });

  describe('getMarketSnapshot', () => {
    it('should return market snapshot for area', async () => {
      const result = await realEstateAnalyticsService.getMarketSnapshot('Grandview');
      
      expect(marketMonitor.generateSnapshot).toHaveBeenCalledWith('Grandview', 30);
      expect(result).toEqual(mockMarketSnapshot);
    });

    it('should use cached data if available and not expired', async () => {
      // First call to cache the data
      await realEstateAnalyticsService.getMarketSnapshot('Grandview');
      
      // Clear the mock to verify it's not called again
      (marketMonitor.generateSnapshot as jest.Mock).mockClear();
      
      // Second call should use cached data
      const result = await realEstateAnalyticsService.getMarketSnapshot('Grandview');
      
      expect(marketMonitor.generateSnapshot).not.toHaveBeenCalled();
      expect(result).toEqual(mockMarketSnapshot);
    });

    it('should fetch fresh data if forceRefresh is true', async () => {
      // First call to cache the data
      await realEstateAnalyticsService.getMarketSnapshot('Grandview');
      
      // Clear the mock to verify it's called again
      (marketMonitor.generateSnapshot as jest.Mock).mockClear();
      
      // Call with forceRefresh should ignore cache
      const result = await realEstateAnalyticsService.getMarketSnapshot('Grandview', true);
      
      expect(marketMonitor.generateSnapshot).toHaveBeenCalledWith('Grandview', 30);
      expect(result).toEqual(mockMarketSnapshot);
    });
  });

  describe('getPropertyListings', () => {
    it('should fetch property listings based on query parameters', async () => {
      const queryParams = { 
        minPrice: 300000, 
        maxPrice: 500000,
        minBeds: 3,
        propertyType: 'single-family'
      };
      
      const result = await realEstateAnalyticsService.getPropertyListings(queryParams);
      
      expect(connectorFactory.getConnectorsByType).toHaveBeenCalledWith('market');
      expect(result.listings).toHaveLength(1);
      expect(result.listings[0]).toEqual(mockPropertyListing);
    });

    it('should validate data when validate flag is true', async () => {
      const queryParams = { minPrice: 300000 };
      
      await realEstateAnalyticsService.getPropertyListings(queryParams, true);
      
      expect(dataValidator.validateListing).toHaveBeenCalled();
    });

    it('should enrich data when enrich flag is true', async () => {
      const queryParams = { minPrice: 300000 };
      
      await realEstateAnalyticsService.getPropertyListings(queryParams, false, true);
      
      expect(geospatialEnricher.enrichPropertyListing).toHaveBeenCalled();
    });
  });

  describe('getGeoJsonData', () => {
    it('should return GeoJSON data for property listings', async () => {
      const queryParams = { 
        minPrice: 300000, 
        maxPrice: 500000 
      };
      
      const result = await realEstateAnalyticsService.getGeoJsonData(queryParams);
      
      expect(geospatialEnricher.convertListingsToGeoJSON).toHaveBeenCalled();
      expect(result).toEqual(mockGeoJSON);
    });

    it('should use cached GeoJSON data when available', async () => {
      const queryParams = { minPrice: 300000 };
      
      // First call to cache the data
      await realEstateAnalyticsService.getGeoJsonData(queryParams);
      
      // Clear the mock to verify it's not called again
      (geospatialEnricher.convertListingsToGeoJSON as jest.Mock).mockClear();
      
      // Second call should use cached data
      await realEstateAnalyticsService.getGeoJsonData(queryParams);
      
      expect(geospatialEnricher.convertListingsToGeoJSON).not.toHaveBeenCalled();
    });
  });

  describe('analyzeNeighborhoodTrends', () => {
    it('should return neighborhood trends for specified area', async () => {
      const result = await realEstateAnalyticsService.analyzeNeighborhoodTrends('Grandview');
      
      expect(geospatialEnricher.analyzeNeighborhoodTrends).toHaveBeenCalled();
      expect(result).toHaveProperty('Grandview Heights');
    });
  });

  describe('getMarketAlerts', () => {
    it('should return market alerts', async () => {
      const result = await realEstateAnalyticsService.getMarketAlerts();
      
      expect(result).toEqual(mockAlerts);
    });

    it('should generate new alerts if none are cached', async () => {
      // Force the service to regenerate alerts
      (realEstateAnalyticsService as any).cache.alerts = [];
      
      const result = await realEstateAnalyticsService.getMarketAlerts();
      
      expect(marketMonitor.checkForMarketChanges).toHaveBeenCalled();
      expect(result).toEqual(mockAlerts);
    });
  });

  describe('refreshAllData', () => {
    it('should refresh all data sources', async () => {
      await realEstateAnalyticsService.refreshAllData();
      
      // Clear all caches
      expect((realEstateAnalyticsService as any).cache.marketSnapshots.size).toBe(0);
      expect((realEstateAnalyticsService as any).cache.geoJsonData.size).toBe(0);
      expect((realEstateAnalyticsService as any).cache.propertyDetails.size).toBe(0);
      expect((realEstateAnalyticsService as any).cache.alerts.length).toBe(0);
    });
  });
});