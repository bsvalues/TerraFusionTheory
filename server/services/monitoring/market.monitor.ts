import { LogLevel, LogCategory } from '@shared/schema';
import { storage } from '../../storage';
import { PropertyListing } from '../connectors/market.connector';
import { connectorFactory } from '../connectors/connector.factory';
import { AppError } from '../../errors';

/**
 * Market condition status
 */
export enum MarketCondition {
  HOT = 'hot',
  WARM = 'warm',
  BALANCED = 'balanced',
  COOL = 'cool',
  COLD = 'cold'
}

/**
 * Market trend direction
 */
export enum MarketTrend {
  UP_STRONG = 'upStrong',
  UP_MODERATE = 'upModerate',
  STABLE = 'stable',
  DOWN_MODERATE = 'downModerate',
  DOWN_STRONG = 'downStrong'
}

/**
 * Alert trigger thresholds
 */
export interface MarketAlertThresholds {
  // Price change thresholds (percentage)
  priceChangePctHigh: number;
  priceChangePctMedium: number;
  
  // Inventory change thresholds (percentage)
  inventoryChangePctHigh: number;
  inventoryChangePctMedium: number;
  
  // Days on market change thresholds (percentage)
  domChangePctHigh: number;
  domChangePctMedium: number;
  
  // List to sale price ratio change thresholds (percentage points)
  listToSaleRatioChangeHigh: number;
  listToSaleRatioChangeMedium: number;
}

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
 * Market alert for significant changes
 */
export interface MarketAlert {
  id: string;
  timestamp: Date;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metrics: {
    previous: any;
    current: any;
    changePct?: number;
    changeAbs?: number;
  };
  affectedArea: string; // e.g., neighborhood, city, zip code
  affectedSegment?: string; // e.g., "luxury homes", "condos", "first-time buyers"
  recommendations?: string[];
}

/**
 * Service for monitoring market changes and generating alerts
 */
export class MarketMonitor {
  private static instance: MarketMonitor;
  private lastSnapshot: MarketMetricsSnapshot | null = null;
  private currentSnapshot: MarketMetricsSnapshot | null = null;
  private alertThresholds: MarketAlertThresholds;
  
  private constructor(thresholds?: Partial<MarketAlertThresholds>) {
    this.alertThresholds = {
      priceChangePctHigh: 5.0,
      priceChangePctMedium: 2.5,
      inventoryChangePctHigh: 15.0,
      inventoryChangePctMedium: 7.5,
      domChangePctHigh: 20.0,
      domChangePctMedium: 10.0,
      listToSaleRatioChangeHigh: 3.0,
      listToSaleRatioChangeMedium: 1.5,
      ...thresholds
    };
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(thresholds?: Partial<MarketAlertThresholds>): MarketMonitor {
    if (!MarketMonitor.instance) {
      MarketMonitor.instance = new MarketMonitor(thresholds);
    }
    return MarketMonitor.instance;
  }
  
  /**
   * Generate a market snapshot based on current listings
   * @param area The area to analyze (city, zip, etc.)
   * @param timeframeInDays The number of days to consider for current data
   */
  async generateSnapshot(area: string, timeframeInDays: number = 30): Promise<MarketMetricsSnapshot> {
    try {
      const now = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframeInDays);
      
      // Get market data connectors
      const marketConnectors = connectorFactory.getConnectorsByType('market');
      
      if (marketConnectors.length === 0) {
        throw new Error('No market data connectors available');
      }
      
      // Get listings for the area
      let allListings: PropertyListing[] = [];
      
      for (const connector of marketConnectors) {
        // Fetch listings
        const result = await connector.fetchData({
          city: area,
          limit: 1000 // Get a large batch for analysis
        });
        
        allListings = [...allListings, ...result.data];
      }
      
      // Calculate market metrics
      const snapshot = this.calculateMarketMetrics(allListings, startDate, now, area);
      
      // Save the snapshot
      this.lastSnapshot = this.currentSnapshot;
      this.currentSnapshot = snapshot;
      
      // Log the snapshot
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Generated market snapshot for ${area}`,
        details: JSON.stringify(snapshot),
        source: 'market-monitor',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['market-monitor', 'snapshot', area]
      });
      
      return snapshot;
    } catch (error) {
      console.error(`Error generating market snapshot for ${area}:`, error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to generate market snapshot for ${area}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          area,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'market-monitor',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['market-monitor', 'snapshot', 'error', area]
      });
      
      throw error;
    }
  }
  
  /**
   * Check for significant market changes and generate alerts
   * @returns Array of market alerts
   */
  async checkForMarketChanges(): Promise<MarketAlert[]> {
    if (!this.lastSnapshot || !this.currentSnapshot) {
      return [];
    }
    
    const alerts: MarketAlert[] = [];
    
    try {
      // Check for significant price changes
      const pricePctChange = this.calculatePercentChange(
        this.lastSnapshot.medianPrice,
        this.currentSnapshot.medianPrice
      );
      
      if (Math.abs(pricePctChange) >= this.alertThresholds.priceChangePctHigh) {
        alerts.push(this.createPriceChangeAlert(pricePctChange, 'critical'));
      } else if (Math.abs(pricePctChange) >= this.alertThresholds.priceChangePctMedium) {
        alerts.push(this.createPriceChangeAlert(pricePctChange, 'warning'));
      }
      
      // Check for significant inventory changes
      const inventoryPctChange = this.calculatePercentChange(
        this.lastSnapshot.totalListings,
        this.currentSnapshot.totalListings
      );
      
      if (Math.abs(inventoryPctChange) >= this.alertThresholds.inventoryChangePctHigh) {
        alerts.push(this.createInventoryChangeAlert(inventoryPctChange, 'critical'));
      } else if (Math.abs(inventoryPctChange) >= this.alertThresholds.inventoryChangePctMedium) {
        alerts.push(this.createInventoryChangeAlert(inventoryPctChange, 'warning'));
      }
      
      // Check for significant days on market changes
      const domPctChange = this.calculatePercentChange(
        this.lastSnapshot.avgDaysOnMarket,
        this.currentSnapshot.avgDaysOnMarket
      );
      
      if (Math.abs(domPctChange) >= this.alertThresholds.domChangePctHigh) {
        alerts.push(this.createDaysOnMarketChangeAlert(domPctChange, 'critical'));
      } else if (Math.abs(domPctChange) >= this.alertThresholds.domChangePctMedium) {
        alerts.push(this.createDaysOnMarketChangeAlert(domPctChange, 'warning'));
      }
      
      // Check for significant list-to-sale ratio changes
      const listToSaleRatioChange = this.currentSnapshot.listToSaleRatio - this.lastSnapshot.listToSaleRatio;
      
      if (Math.abs(listToSaleRatioChange) >= this.alertThresholds.listToSaleRatioChangeHigh) {
        alerts.push(this.createListToSaleRatioChangeAlert(listToSaleRatioChange, 'critical'));
      } else if (Math.abs(listToSaleRatioChange) >= this.alertThresholds.listToSaleRatioChangeMedium) {
        alerts.push(this.createListToSaleRatioChangeAlert(listToSaleRatioChange, 'warning'));
      }
      
      // Log alerts
      if (alerts.length > 0) {
        await storage.createLog({
          level: LogLevel.WARNING,
          category: LogCategory.SYSTEM,
          message: `Generated ${alerts.length} market alerts`,
          details: JSON.stringify(alerts),
          source: 'market-monitor',
          projectId: null,
          userId: null,
          sessionId: null,
          duration: null,
          statusCode: null,
          endpoint: null,
          tags: ['market-monitor', 'alerts']
        });
      }
      
      return alerts;
    } catch (error) {
      console.error('Error checking for market changes:', error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to check for market changes: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'market-monitor',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['market-monitor', 'alerts', 'error']
      });
      
      return [];
    }
  }
  
  /**
   * Predict future market metrics based on historical data
   * @param area The area to analyze
   * @param daysAhead Number of days ahead to forecast
   * @returns Predicted market metrics
   */
  async predictMarketMetrics(area: string, daysAhead: number = 90): Promise<{
    predictedMetrics: Partial<MarketMetricsSnapshot>;
    confidenceScore: number;
  }> {
    try {
      // Get past snapshots (would typically come from a database)
      // For this example, we'll just use the current snapshot if available
      if (!this.currentSnapshot) {
        await this.generateSnapshot(area);
      }
      
      // In a real implementation, this would use time series forecasting algorithms
      // or machine learning models trained on historical data
      // For this example, we'll make a simple projection based on current trends
      
      const predictedMetrics: Partial<MarketMetricsSnapshot> = {
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
        totalListings: this.currentSnapshot!.totalListings,
        medianPrice: this.currentSnapshot!.medianPrice,
        averagePrice: this.currentSnapshot!.averagePrice,
        pricePerSqFtAvg: this.currentSnapshot!.pricePerSqFtAvg,
        avgDaysOnMarket: this.currentSnapshot!.avgDaysOnMarket,
        marketCondition: this.currentSnapshot!.marketCondition,
        marketTrend: this.currentSnapshot!.marketTrend
      };
      
      // Apply a simple trend projection if we have a previous snapshot
      if (this.lastSnapshot) {
        const daysBetweenSnapshots = (this.currentSnapshot!.periodEnd.getTime() - this.lastSnapshot.periodEnd.getTime()) / (24 * 60 * 60 * 1000);
        const dailyPriceChange = (this.currentSnapshot!.medianPrice - this.lastSnapshot.medianPrice) / daysBetweenSnapshots;
        const dailyDomChange = (this.currentSnapshot!.avgDaysOnMarket - this.lastSnapshot.avgDaysOnMarket) / daysBetweenSnapshots;
        
        // Project metrics forward
        predictedMetrics.medianPrice = this.currentSnapshot!.medianPrice + (dailyPriceChange * daysAhead);
        predictedMetrics.averagePrice = this.currentSnapshot!.averagePrice + (dailyPriceChange * daysAhead * 0.9); // Assuming average changes slightly differently
        predictedMetrics.pricePerSqFtAvg = this.currentSnapshot!.pricePerSqFtAvg * (predictedMetrics.medianPrice! / this.currentSnapshot!.medianPrice);
        predictedMetrics.avgDaysOnMarket = this.currentSnapshot!.avgDaysOnMarket + (dailyDomChange * daysAhead);
        
        // Project market condition and trend based on price and DOM changes
        if (dailyPriceChange > 0 && dailyDomChange < 0) {
          // Prices rising, days on market falling = heating up
          predictedMetrics.marketCondition = MarketCondition.HOT;
          predictedMetrics.marketTrend = MarketTrend.UP_STRONG;
        } else if (dailyPriceChange > 0 && dailyDomChange > 0) {
          // Prices rising, days on market rising = slowing down
          predictedMetrics.marketCondition = MarketCondition.WARM;
          predictedMetrics.marketTrend = MarketTrend.UP_MODERATE;
        } else if (dailyPriceChange < 0 && dailyDomChange > 0) {
          // Prices falling, days on market rising = cooling down
          predictedMetrics.marketCondition = MarketCondition.COOL;
          predictedMetrics.marketTrend = MarketTrend.DOWN_MODERATE;
        } else if (dailyPriceChange < 0 && dailyDomChange < 0) {
          // Prices falling, days on market falling = readjusting
          predictedMetrics.marketCondition = MarketCondition.BALANCED;
          predictedMetrics.marketTrend = MarketTrend.STABLE;
        } else {
          // Little change
          predictedMetrics.marketCondition = MarketCondition.BALANCED;
          predictedMetrics.marketTrend = MarketTrend.STABLE;
        }
      }
      
      // Confidence score - would be calculated based on model accuracy in a real implementation
      // For this example, we'll just use a simple heuristic
      let confidenceScore = 0.7; // Base confidence
      
      // Reduce confidence for longer forecasts
      confidenceScore -= (daysAhead / 365) * 0.2;
      
      // Reduce confidence if we don't have historical data
      if (!this.lastSnapshot) {
        confidenceScore *= 0.6;
      }
      
      // Log the prediction
      await storage.createLog({
        level: LogLevel.INFO,
        category: LogCategory.SYSTEM,
        message: `Generated market prediction for ${area} ${daysAhead} days ahead`,
        details: JSON.stringify({
          predictedMetrics,
          confidenceScore
        }),
        source: 'market-monitor',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['market-monitor', 'prediction', area]
      });
      
      return {
        predictedMetrics,
        confidenceScore
      };
    } catch (error) {
      console.error(`Error predicting market metrics for ${area}:`, error);
      await storage.createLog({
        level: LogLevel.ERROR,
        category: LogCategory.SYSTEM,
        message: `Failed to predict market metrics for ${area}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: JSON.stringify({
          area,
          daysAhead,
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        }),
        source: 'market-monitor',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['market-monitor', 'prediction', 'error', area]
      });
      
      throw error;
    }
  }
  
  /**
   * Calculate market metrics from a set of listings
   * @param listings Array of property listings
   * @param startDate Start date for the period
   * @param endDate End date for the period
   * @param area Area name
   * @returns Market metrics snapshot
   */
  private calculateMarketMetrics(
    listings: PropertyListing[],
    startDate: Date,
    endDate: Date,
    area: string
  ): MarketMetricsSnapshot {
    // Filter active and sold listings
    const activeListings = listings.filter(l => 
      l.status.toLowerCase() === 'active' || 
      l.status.toLowerCase() === 'pending' ||
      l.status.toLowerCase() === 'new'
    );
    
    const soldListings = listings.filter(l => 
      l.status.toLowerCase() === 'sold' &&
      l.closingDate
    );
    
    // Calculate median and average prices
    const activePrices = activeListings.map(l => l.price).sort((a, b) => a - b);
    const soldPrices = soldListings.map(l => l.price).sort((a, b) => a - b);
    
    // Calculate median price
    let medianPrice = 0;
    if (activePrices.length > 0) {
      const mid = Math.floor(activePrices.length / 2);
      medianPrice = activePrices.length % 2 === 0
        ? (activePrices[mid - 1] + activePrices[mid]) / 2
        : activePrices[mid];
    }
    
    // Calculate average price
    const averagePrice = activePrices.length > 0
      ? activePrices.reduce((sum, price) => sum + price, 0) / activePrices.length
      : 0;
    
    // Calculate average price per square foot
    const pricesPerSqFt = activeListings
      .filter(l => l.squareFeet > 0)
      .map(l => l.price / l.squareFeet);
    
    const pricePerSqFtAvg = pricesPerSqFt.length > 0
      ? pricesPerSqFt.reduce((sum, price) => sum + price, 0) / pricesPerSqFt.length
      : 0;
    
    // Calculate average days on market
    const daysOnMarket = activeListings
      .filter(l => l.daysOnMarket != null && l.daysOnMarket > 0)
      .map(l => l.daysOnMarket!);
    
    const avgDaysOnMarket = daysOnMarket.length > 0
      ? daysOnMarket.reduce((sum, days) => sum + days, 0) / daysOnMarket.length
      : 0;
    
    // Calculate list to sale ratio (if we have sold listings with original prices)
    const listSaleRatios = soldListings
      .filter(l => l.price > 0 && l.originalPrice && l.originalPrice > 0)
      .map(l => l.price / l.originalPrice!);
    
    const listToSaleRatio = listSaleRatios.length > 0
      ? listSaleRatios.reduce((sum, ratio) => sum + ratio, 0) / listSaleRatios.length
      : 1.0;
    
    // Determine market condition based on days on market and list to sale ratio
    let marketCondition = MarketCondition.BALANCED;
    
    if (avgDaysOnMarket < 15 && listToSaleRatio >= 1.0) {
      marketCondition = MarketCondition.HOT;
    } else if (avgDaysOnMarket < 30 && listToSaleRatio >= 0.98) {
      marketCondition = MarketCondition.WARM;
    } else if (avgDaysOnMarket > 60 && listToSaleRatio <= 0.95) {
      marketCondition = MarketCondition.COLD;
    } else if (avgDaysOnMarket > 45 && listToSaleRatio <= 0.97) {
      marketCondition = MarketCondition.COOL;
    }
    
    // Determine market trend (would typically use time series analysis with more data points)
    // For this example, we'll just use a placeholder
    const marketTrend = MarketTrend.STABLE;
    
    // Calculate segment metrics by property type
    const segmentMetrics: {
      [key: string]: {
        totalListings: number;
        medianPrice: number;
        avgDaysOnMarket: number;
      }
    } = {};
    
    // Group by property type
    const propertyTypes = [...new Set(listings.map(l => l.propertyType))];
    
    for (const propType of propertyTypes) {
      const segmentListings = activeListings.filter(l => l.propertyType === propType);
      
      if (segmentListings.length === 0) continue;
      
      const segmentPrices = segmentListings.map(l => l.price).sort((a, b) => a - b);
      const mid = Math.floor(segmentPrices.length / 2);
      const medianPrice = segmentPrices.length % 2 === 0
        ? (segmentPrices[mid - 1] + segmentPrices[mid]) / 2
        : segmentPrices[mid];
      
      const segmentDaysOnMarket = segmentListings
        .filter(l => l.daysOnMarket != null && l.daysOnMarket > 0)
        .map(l => l.daysOnMarket!);
      
      const avgDaysOnMarket = segmentDaysOnMarket.length > 0
        ? segmentDaysOnMarket.reduce((sum, days) => sum + days, 0) / segmentDaysOnMarket.length
        : 0;
      
      segmentMetrics[propType] = {
        totalListings: segmentListings.length,
        medianPrice,
        avgDaysOnMarket
      };
    }
    
    return {
      periodStart: startDate,
      periodEnd: endDate,
      totalListings: activeListings.length,
      totalSales: soldListings.length,
      medianPrice,
      averagePrice,
      pricePerSqFtAvg,
      avgDaysOnMarket,
      listToSaleRatio,
      marketCondition,
      marketTrend,
      segmentMetrics
    };
  }
  
  /**
   * Calculate percent change between two values
   */
  private calculatePercentChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }
  
  /**
   * Create a price change alert
   */
  private createPriceChangeAlert(
    pricePctChange: number,
    severity: 'info' | 'warning' | 'critical'
  ): MarketAlert {
    const direction = pricePctChange > 0 ? 'increased' : 'decreased';
    const area = this.currentSnapshot?.segmentMetrics ? Object.keys(this.currentSnapshot.segmentMetrics)[0] : 'the area';
    
    return {
      id: `price-change-${Date.now()}`,
      timestamp: new Date(),
      title: `Median home prices have ${direction} by ${Math.abs(pricePctChange).toFixed(1)}%`,
      description: `The median home price in ${area} has ${direction} from $${this.lastSnapshot!.medianPrice.toLocaleString()} to $${this.currentSnapshot!.medianPrice.toLocaleString()}, representing a ${Math.abs(pricePctChange).toFixed(1)}% change.`,
      severity,
      metrics: {
        previous: this.lastSnapshot!.medianPrice,
        current: this.currentSnapshot!.medianPrice,
        changePct: pricePctChange
      },
      affectedArea: area,
      recommendations: pricePctChange > 0
        ? ['Consider adjusting pricing strategy for new listings', 'Review comparable sales for recent transactions']
        : ['Monitor inventory levels for potential market slowdown', 'Adjust pricing expectations accordingly']
    };
  }
  
  /**
   * Create an inventory change alert
   */
  private createInventoryChangeAlert(
    inventoryPctChange: number,
    severity: 'info' | 'warning' | 'critical'
  ): MarketAlert {
    const direction = inventoryPctChange > 0 ? 'increased' : 'decreased';
    const area = this.currentSnapshot?.segmentMetrics ? Object.keys(this.currentSnapshot.segmentMetrics)[0] : 'the area';
    
    return {
      id: `inventory-change-${Date.now()}`,
      timestamp: new Date(),
      title: `Housing inventory has ${direction} by ${Math.abs(inventoryPctChange).toFixed(1)}%`,
      description: `The number of active listings in ${area} has ${direction} from ${this.lastSnapshot!.totalListings} to ${this.currentSnapshot!.totalListings}, representing a ${Math.abs(inventoryPctChange).toFixed(1)}% change.`,
      severity,
      metrics: {
        previous: this.lastSnapshot!.totalListings,
        current: this.currentSnapshot!.totalListings,
        changePct: inventoryPctChange
      },
      affectedArea: area,
      recommendations: inventoryPctChange > 0
        ? ['Monitor price trends as increased inventory may impact market dynamics', 'Highlight property differentiators in marketing materials']
        : ['Consider accelerating buying decisions as options become limited', 'Expect potential multiple offer scenarios in desirable neighborhoods']
    };
  }
  
  /**
   * Create a days on market change alert
   */
  private createDaysOnMarketChangeAlert(
    domPctChange: number,
    severity: 'info' | 'warning' | 'critical'
  ): MarketAlert {
    const direction = domPctChange > 0 ? 'increased' : 'decreased';
    const area = this.currentSnapshot?.segmentMetrics ? Object.keys(this.currentSnapshot.segmentMetrics)[0] : 'the area';
    
    return {
      id: `dom-change-${Date.now()}`,
      timestamp: new Date(),
      title: `Average days on market has ${direction} by ${Math.abs(domPctChange).toFixed(1)}%`,
      description: `The average days on market in ${area} has ${direction} from ${this.lastSnapshot!.avgDaysOnMarket.toFixed(1)} to ${this.currentSnapshot!.avgDaysOnMarket.toFixed(1)} days, representing a ${Math.abs(domPctChange).toFixed(1)}% change.`,
      severity,
      metrics: {
        previous: this.lastSnapshot!.avgDaysOnMarket,
        current: this.currentSnapshot!.avgDaysOnMarket,
        changePct: domPctChange
      },
      affectedArea: area,
      recommendations: domPctChange > 0
        ? ['Review pricing strategies for current listings', 'Consider enhancing property marketing and presentation']
        : ['Prepare buyers for quick decision making', 'Ensure pre-approval and financing is in place before making offers']
    };
  }
  
  /**
   * Create a list-to-sale ratio change alert
   */
  private createListToSaleRatioChangeAlert(
    ratioChange: number,
    severity: 'info' | 'warning' | 'critical'
  ): MarketAlert {
    const direction = ratioChange > 0 ? 'increased' : 'decreased';
    const area = this.currentSnapshot?.segmentMetrics ? Object.keys(this.currentSnapshot.segmentMetrics)[0] : 'the area';
    
    return {
      id: `list-sale-ratio-change-${Date.now()}`,
      timestamp: new Date(),
      title: `List-to-sale price ratio has ${direction} by ${Math.abs(ratioChange * 100).toFixed(1)} percentage points`,
      description: `The average list-to-sale price ratio in ${area} has ${direction} from ${(this.lastSnapshot!.listToSaleRatio * 100).toFixed(1)}% to ${(this.currentSnapshot!.listToSaleRatio * 100).toFixed(1)}%, representing a ${Math.abs(ratioChange * 100).toFixed(1)} percentage point change.`,
      severity,
      metrics: {
        previous: this.lastSnapshot!.listToSaleRatio,
        current: this.currentSnapshot!.listToSaleRatio,
        changeAbs: ratioChange
      },
      affectedArea: area,
      recommendations: ratioChange > 0
        ? ['Sellers may have increased negotiating leverage', 'Be prepared for potential multiple offer situations']
        : ['Consider pricing listings more competitively', 'Budget for potential negotiations below asking price']
    };
  }
}

// Export singleton instance
export const marketMonitor = MarketMonitor.getInstance();