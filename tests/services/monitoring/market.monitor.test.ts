import { MarketMonitor, MarketCondition, MarketTrend } from '../../../server/services/monitoring/market.monitor';
import { PropertyListing } from '../../../server/services/connectors/market.connector';
import { connectorFactory } from '../../../server/services/connectors/connector.factory';

// Mock dependencies
jest.mock('../../../server/services/connectors/connector.factory', () => ({
  connectorFactory: {
    getConnectorsByType: jest.fn()
  }
}));

describe('MarketMonitor', () => {
  let marketMonitor: MarketMonitor;
  
  // Sample property listings for testing
  const activeListings: PropertyListing[] = [
    {
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
      daysOnMarket: 15
    },
    {
      mlsNumber: 'MLS12346',
      address: '456 Oak Ave',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      price: 550000,
      originalPrice: 550000,
      status: 'active',
      propertyType: 'single-family',
      beds: 4,
      baths: 3,
      squareFeet: 2500,
      yearBuilt: 2015,
      daysOnMarket: 7
    }
  ];
  
  const soldListings: PropertyListing[] = [
    {
      mlsNumber: 'MLS12347',
      address: '789 Pine St',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      price: 380000,
      originalPrice: 395000,
      status: 'sold',
      propertyType: 'single-family',
      beds: 3,
      baths: 2,
      squareFeet: 1700,
      yearBuilt: 2008,
      daysOnMarket: 25,
      closingDate: '2025-02-15'
    },
    {
      mlsNumber: 'MLS12348',
      address: '101 Elm St',
      city: 'Grandview',
      state: 'WA',
      zip: '98930',
      price: 425000,
      originalPrice: 430000,
      status: 'sold',
      propertyType: 'single-family',
      beds: 3,
      baths: 2.5,
      squareFeet: 1950,
      yearBuilt: 2012,
      daysOnMarket: 18,
      closingDate: '2025-02-20'
    }
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create market monitor with default thresholds
    marketMonitor = MarketMonitor.getInstance({
      priceChangePctHigh: 10,
      priceChangePctMedium: 5,
      inventoryChangePctHigh: 20,
      inventoryChangePctMedium: 10,
      domChangePctHigh: 30,
      domChangePctMedium: 15,
      listToSaleRatioChangeHigh: 0.05,
      listToSaleRatioChangeMedium: 0.02
    });
    
    // Mock market data connector
    const mockMarketConnector = {
      fetchData: jest.fn().mockImplementation((query) => {
        let listings = [];
        if (!query.status || query.status === 'active') {
          listings = [...activeListings];
        } else if (query.status === 'sold') {
          listings = [...soldListings];
        }
        return Promise.resolve({ listings, total: listings.length });
      })
    };
    
    (connectorFactory.getConnectorsByType as jest.Mock).mockReturnValue([mockMarketConnector]);
  });
  
  describe('generateSnapshot', () => {
    it('should generate a market snapshot with metrics', async () => {
      const snapshot = await marketMonitor.generateSnapshot('Grandview');
      
      // Check snapshot structure
      expect(snapshot).toHaveProperty('periodStart');
      expect(snapshot).toHaveProperty('periodEnd');
      expect(snapshot).toHaveProperty('totalListings');
      expect(snapshot).toHaveProperty('totalSales');
      expect(snapshot).toHaveProperty('medianPrice');
      expect(snapshot).toHaveProperty('averagePrice');
      expect(snapshot).toHaveProperty('pricePerSqFtAvg');
      expect(snapshot).toHaveProperty('avgDaysOnMarket');
      expect(snapshot).toHaveProperty('listToSaleRatio');
      expect(snapshot).toHaveProperty('marketCondition');
      expect(snapshot).toHaveProperty('marketTrend');
      expect(snapshot).toHaveProperty('segmentMetrics');
      
      // Check metrics values
      expect(snapshot.totalListings).toBe(2); // Active listings
      expect(snapshot.totalSales).toBe(2); // Sold listings
      expect(snapshot.medianPrice).toBeGreaterThan(0);
      expect(snapshot.listToSaleRatio).toBeLessThanOrEqual(1); // Should be a ratio between 0-1
    });
    
    it('should include segment metrics by property type', async () => {
      const snapshot = await marketMonitor.generateSnapshot('Grandview');
      
      // Check segment metrics
      expect(snapshot.segmentMetrics).toHaveProperty('single-family');
      expect(snapshot.segmentMetrics['single-family']).toHaveProperty('totalListings');
      expect(snapshot.segmentMetrics['single-family']).toHaveProperty('medianPrice');
      expect(snapshot.segmentMetrics['single-family']).toHaveProperty('avgDaysOnMarket');
    });
    
    it('should determine market condition based on metrics', async () => {
      const snapshot = await marketMonitor.generateSnapshot('Grandview');
      
      // Market condition should be one of the defined values
      expect(Object.values(MarketCondition)).toContain(snapshot.marketCondition);
      
      // Market trend should be one of the defined values
      expect(Object.values(MarketTrend)).toContain(snapshot.marketTrend);
    });
  });
  
  describe('checkForMarketChanges', () => {
    it('should detect significant market changes and generate alerts', async () => {
      // Set up current and previous snapshots with significant differences
      (marketMonitor as any).lastSnapshot = {
        medianPrice: 380000,
        avgDaysOnMarket: 30,
        totalListings: 20,
        listToSaleRatio: 0.95
      };
      
      (marketMonitor as any).currentSnapshot = {
        medianPrice: 410000, // 7.9% increase
        avgDaysOnMarket: 22, // 26.7% decrease
        totalListings: 15, // 25% decrease
        listToSaleRatio: 0.98 // 3.2% increase
      };
      
      const alerts = await marketMonitor.checkForMarketChanges();
      
      // Should generate alerts for these changes
      expect(alerts.length).toBeGreaterThan(0);
      
      // Check alert structure
      const alert = alerts[0];
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('timestamp');
      expect(alert).toHaveProperty('title');
      expect(alert).toHaveProperty('description');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('metrics');
    });
    
    it('should not generate alerts for minor changes', async () => {
      // Set up current and previous snapshots with minor differences
      (marketMonitor as any).lastSnapshot = {
        medianPrice: 400000,
        avgDaysOnMarket: 25,
        totalListings: 18,
        listToSaleRatio: 0.96
      };
      
      (marketMonitor as any).currentSnapshot = {
        medianPrice: 402000, // 0.5% increase
        avgDaysOnMarket: 24, // 4% decrease
        totalListings: 17, // 5.6% decrease
        listToSaleRatio: 0.965 // 0.5% increase
      };
      
      const alerts = await marketMonitor.checkForMarketChanges();
      
      // Should not generate alerts for these minor changes
      expect(alerts).toHaveLength(0);
    });
  });
  
  describe('predictMarketMetrics', () => {
    it('should predict future market metrics', async () => {
      const predictions = await marketMonitor.predictMarketMetrics('Grandview', 90);
      
      // Check prediction structure
      expect(predictions).toHaveProperty('predictedDate');
      expect(predictions).toHaveProperty('medianPrice');
      expect(predictions).toHaveProperty('inventory');
      expect(predictions).toHaveProperty('daysOnMarket');
      expect(predictions).toHaveProperty('confidence');
      
      // Predicted date should be in the future
      const predictedDate = new Date(predictions.predictedDate);
      const today = new Date();
      expect(predictedDate.getTime()).toBeGreaterThan(today.getTime());
      
      // Confidence should be between 0 and 1
      expect(predictions.confidence).toBeGreaterThan(0);
      expect(predictions.confidence).toBeLessThanOrEqual(1);
    });
  });
  
  describe('Market Alerts', () => {
    describe('createPriceChangeAlert', () => {
      it('should create a price change alert with correct data', () => {
        const oldValue = 380000;
        const newValue = 410000;
        const alert = (marketMonitor as any).createPriceChangeAlert(oldValue, newValue, 'Grandview');
        
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('title');
        expect(alert.title).toContain('Price');
        expect(alert).toHaveProperty('metrics');
        expect(alert.metrics).toHaveProperty('previous');
        expect(alert.metrics).toHaveProperty('current');
        expect(alert.metrics).toHaveProperty('changePct');
        expect(alert.metrics.changePct).toBeCloseTo(7.9, 1);
        expect(alert).toHaveProperty('affectedArea', 'Grandview');
      });
    });
    
    describe('createInventoryChangeAlert', () => {
      it('should create an inventory change alert with correct data', () => {
        const oldValue = 20;
        const newValue = 15;
        const alert = (marketMonitor as any).createInventoryChangeAlert(oldValue, newValue, 'Grandview');
        
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('title');
        expect(alert.title).toContain('Inventory');
        expect(alert).toHaveProperty('metrics');
        expect(alert.metrics).toHaveProperty('previous');
        expect(alert.metrics).toHaveProperty('current');
        expect(alert.metrics).toHaveProperty('changePct');
        expect(alert.metrics.changePct).toBeCloseTo(-25, 1);
        expect(alert).toHaveProperty('affectedArea', 'Grandview');
      });
    });
  });
});