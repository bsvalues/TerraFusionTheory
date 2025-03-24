/**
 * Market Trends Service
 * 
 * This service handles fetching and processing market trend data from the API.
 * It provides interfaces and methods to interact with market trend related endpoints.
 */

export interface MarketTrendData {
  month: string;
  medianPrice: number;
  averagePrice: number;
  inventory: number;
  daysOnMarket: number;
  listToSaleRatio: number;
  salesVolume: number;
}

export type TimeFrame = '6m' | '1y' | '2y' | '5y';

export interface MarketTrendParams {
  areaCode: string;
  propertyType: string;
  timeFrame: TimeFrame;
  metrics?: string[];
}

export interface MarketPrediction {
  month: string;
  predictedMedianPrice: number;
  confidenceMin: number;
  confidenceMax: number;
  probability: number;
}

export interface MarketRegion {
  id: string;
  name: string;
  code: string;
  parentRegion?: string;
  subRegions?: string[];
}

class MarketTrendsService {
  private static instance: MarketTrendsService;
  private apiUrl: string = '/api/market/trends';

  private constructor() {}

  public static getInstance(): MarketTrendsService {
    if (!MarketTrendsService.instance) {
      MarketTrendsService.instance = new MarketTrendsService();
    }
    return MarketTrendsService.instance;
  }

  /**
   * Fetch historical market trend data for a specific area and property type
   */
  public async getMarketTrends(params: MarketTrendParams): Promise<MarketTrendData[]> {
    try {
      const queryParams = new URLSearchParams({
        areaCode: params.areaCode,
        propertyType: params.propertyType,
        timeFrame: params.timeFrame,
        ...(params.metrics ? { metrics: params.metrics.join(',') } : {})
      });

      // In a production environment, this would be a real API call
      // For now, using a timeout to simulate network request
      // const response = await fetch(`${this.apiUrl}?${queryParams}`);
      // if (!response.ok) throw new Error('Failed to fetch market trends');
      // return await response.json();

      // Simulate API response with generated data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.generateTrendData(params));
        }, 800);
      });
    } catch (error) {
      console.error('Error fetching market trends:', error);
      throw error;
    }
  }

  /**
   * Fetch future market predictions
   */
  public async getMarketPredictions(params: MarketTrendParams): Promise<MarketPrediction[]> {
    try {
      const queryParams = new URLSearchParams({
        areaCode: params.areaCode,
        propertyType: params.propertyType,
        timeFrame: params.timeFrame
      });

      // Simulate API response with generated data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.generatePredictionData(params));
        }, 1000);
      });
    } catch (error) {
      console.error('Error fetching market predictions:', error);
      throw error;
    }
  }

  /**
   * Get available market regions
   */
  public async getMarketRegions(): Promise<MarketRegion[]> {
    try {
      // Simulate API response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: '1',
              name: 'Grandview',
              code: 'grandview',
              subRegions: ['grandview-north', 'grandview-south']
            },
            {
              id: '2',
              name: 'Yakima County',
              code: 'yakima',
              subRegions: ['yakima-valley', 'yakima-hills']
            },
            {
              id: '3',
              name: 'Sunnyside',
              code: 'sunnyside'
            },
            {
              id: '4',
              name: 'Prosser',
              code: 'prosser'
            }
          ]);
        }, 500);
      });
    } catch (error) {
      console.error('Error fetching market regions:', error);
      throw error;
    }
  }

  /**
   * Get year-over-year comparison data
   */
  public async getYearOverYearComparison(areaCode: string, propertyType: string): Promise<any> {
    try {
      // Simulate API response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            medianPriceChange: { 
              percent: 7.2, 
              lastYear: 265000, 
              currentYear: 284000 
            },
            inventoryChange: { 
              percent: -12.5, 
              lastYear: 80, 
              currentYear: 70 
            },
            daysOnMarketChange: { 
              percent: -18.2, 
              lastYear: 44, 
              currentYear: 36 
            },
            salesVolumeChange: { 
              percent: 5.8, 
              lastYear: 120, 
              currentYear: 127 
            }
          });
        }, 600);
      });
    } catch (error) {
      console.error('Error fetching year-over-year comparison:', error);
      throw error;
    }
  }

  /**
   * Generate market trend data for demonstration purposes
   * In a real application, this would be replaced with API data
   */
  private generateTrendData(params: MarketTrendParams): MarketTrendData[] {
    const data: MarketTrendData[] = [];
  
    // Base values that will be adjusted based on parameters
    const baseMedianPrice = params.areaCode === 'grandview' ? 285000 : 
                          params.areaCode === 'yakima' ? 325000 : 
                          params.areaCode === 'sunnyside' ? 250000 : 340000;
    
    const propertyMultiplier = params.propertyType === 'all' ? 1 : 
                              params.propertyType === 'single-family' ? 1.1 : 
                              params.propertyType === 'condo' ? 0.8 : 
                              params.propertyType === 'multi-family' ? 1.5 : 0.6;
    
    // Calculate number of months based on timeframe
    const months = params.timeFrame === '6m' ? 6 : 
                  params.timeFrame === '1y' ? 12 : 
                  params.timeFrame === '2y' ? 24 : 60;
    
    // Generate monthly data points
    for (let i = 0; i < months; i++) {
      // Create date object for the month (working backwards from current month)
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i - 1));
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Add some randomness and trends to data
      const trendFactor = 1 + (i / months) * 0.15; // Slight upward trend over time
      const seasonalFactor = 1 + Math.sin((i % 12) / 12 * Math.PI * 2) * 0.05; // Seasonal variations
      const randomFactor = 0.95 + Math.random() * 0.1; // Random noise
      
      const medianPrice = Math.round(baseMedianPrice * propertyMultiplier * trendFactor * seasonalFactor * randomFactor);
      const averagePrice = Math.round(medianPrice * (1 + (Math.random() * 0.2 - 0.1))); // Average is typically a bit higher
      
      data.push({
        month: monthLabel,
        medianPrice,
        averagePrice,
        inventory: Math.round(50 * propertyMultiplier * (1.1 - trendFactor * 0.2) * seasonalFactor * randomFactor), // Inventory tends to decrease as market heats up
        daysOnMarket: Math.round(45 * (1.2 - trendFactor * 0.3) * seasonalFactor * randomFactor), // DOM decreases over time
        listToSaleRatio: Math.min(1, 0.93 + (trendFactor - 1) * 0.1 * randomFactor), // Ratio tends to increase over time (up to 1.0)
        salesVolume: Math.round(30 * propertyMultiplier * trendFactor * seasonalFactor * randomFactor)
      });
    }
    
    return data;
  }

  /**
   * Generate market prediction data for demonstration purposes
   * In a real application, this would be replaced with API data
   */
  private generatePredictionData(params: MarketTrendParams): MarketPrediction[] {
    const data: MarketPrediction[] = [];
    
    // Base values adjusted by area and property type
    const baseMedianPrice = params.areaCode === 'grandview' ? 285000 : 
                          params.areaCode === 'yakima' ? 325000 : 
                          params.areaCode === 'sunnyside' ? 250000 : 340000;
    
    const propertyMultiplier = params.propertyType === 'all' ? 1 : 
                              params.propertyType === 'single-family' ? 1.1 : 
                              params.propertyType === 'condo' ? 0.8 : 
                              params.propertyType === 'multi-family' ? 1.5 : 0.6;
    
    // Generate monthly predictions for next 12 months
    for (let i = 0; i < 12; i++) {
      // Create date object for the month (going forward from current month)
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      // Add some trend factors and increasing uncertainty for future months
      const trendFactor = 1 + (i / 12) * 0.08; // Expected growth
      const uncertaintyFactor = 1 + (i / 12) * 0.5; // Uncertainty increases further into the future
      
      const predictedMedianPrice = Math.round(baseMedianPrice * propertyMultiplier * trendFactor);
      const confidenceMargin = Math.round(predictedMedianPrice * 0.05 * uncertaintyFactor);
      
      data.push({
        month: monthLabel,
        predictedMedianPrice,
        confidenceMin: predictedMedianPrice - confidenceMargin,
        confidenceMax: predictedMedianPrice + confidenceMargin,
        probability: Math.max(0.5, 0.9 - (i / 12) * 0.4) // Confidence decreases for further predictions
      });
    }
    
    return data;
  }
}

export const marketTrendsService = MarketTrendsService.getInstance();
export default marketTrendsService;