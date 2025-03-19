import { Request, Response, NextFunction } from 'express';
import { connectorFactory } from '../services/connectors/connector.factory';
import { MarketDataConnector, MarketDataQueryParams } from '../services/connectors/market.connector';
import { LogCategory, LogLevel } from '@shared/schema';
import { storage } from '../storage';
import { AppError } from '../errors';

/**
 * Get market data listings
 */
export async function getMarketListings(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Get query parameters
    const {
      mlsNumber,
      address,
      city = 'Grandview', // Default to Grandview
      zip = '98930', // Default to Grandview area
      minPrice,
      maxPrice,
      minBeds,
      maxBeds,
      minBaths,
      maxBaths,
      minSquareFeet,
      maxSquareFeet,
      propertyType,
      status,
      yearBuilt,
      minYearBuilt,
      maxYearBuilt,
      neighborhood,
      limit = 20,
      offset = 0,
      sortBy = 'price',
      sortOrder = 'desc'
    } = req.query;
    
    // Format query parameters
    const queryParams: MarketDataQueryParams = {
      mlsNumber: mlsNumber as string,
      address: address as string,
      city: city as string,
      zip: zip as string,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      minBeds: minBeds ? parseInt(minBeds as string) : undefined,
      maxBeds: maxBeds ? parseInt(maxBeds as string) : undefined,
      minBaths: minBaths ? parseFloat(minBaths as string) : undefined,
      maxBaths: maxBaths ? parseFloat(maxBaths as string) : undefined,
      minSquareFeet: minSquareFeet ? parseInt(minSquareFeet as string) : undefined,
      maxSquareFeet: maxSquareFeet ? parseInt(maxSquareFeet as string) : undefined,
      propertyType: propertyType as string,
      status: status as string,
      yearBuilt: yearBuilt ? parseInt(yearBuilt as string) : undefined,
      minYearBuilt: minYearBuilt ? parseInt(minYearBuilt as string) : undefined,
      maxYearBuilt: maxYearBuilt ? parseInt(maxYearBuilt as string) : undefined,
      neighborhood: neighborhood as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as string,
      sortOrder: (sortOrder as string === 'asc' ? 'asc' : 'desc')
    };
    
    // Get the market data connector
    const connector = connectorFactory.getConnector('grandview-market') as MarketDataConnector;
    
    if (!connector) {
      throw new AppError('Market data connector not found', 500, 'CONNECTOR_ERROR', true);
    }
    
    // Fetch listings
    const result = await connector.fetchData(queryParams);
    
    // Log successful request
    const duration = Date.now() - startTime;
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: `Retrieved ${result.data.length} market listings`,
      details: JSON.stringify({
        query: queryParams,
        resultCount: result.data.length,
        total: result.total
      }),
      source: 'market-controller',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: 200,
      endpoint: req.path,
      tags: ['market', 'listings', 'query']
    });
    
    res.status(200).json(result);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: `Failed to get market listings: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        query: req.query
      }),
      source: 'market-controller',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      endpoint: req.path,
      tags: ['market', 'listings', 'error']
    });
    
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: error instanceof AppError ? error.statusCode : 500
    });
  }
}

/**
 * Get market data listing by MLS number
 */
export async function getMarketListingByMLS(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    const { mlsNumber } = req.params;
    
    // Get the market data connector
    const connector = connectorFactory.getConnector('grandview-market') as MarketDataConnector;
    
    if (!connector) {
      throw new AppError('Market data connector not found', 500, 'CONNECTOR_ERROR', true);
    }
    
    // Fetch listing
    const result = await connector.fetchData({ mlsNumber });
    
    if (result.data.length === 0) {
      throw new AppError(`Listing with MLS number ${mlsNumber} not found`, 404, 'NOT_FOUND', true);
    }
    
    // Log successful request
    const duration = Date.now() - startTime;
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: `Retrieved market listing with MLS number ${mlsNumber}`,
      details: JSON.stringify({
        mlsNumber,
        listing: result.data[0]
      }),
      source: 'market-controller',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: 200,
      endpoint: req.path,
      tags: ['market', 'listing', 'mls']
    });
    
    res.status(200).json(result.data[0]);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: `Failed to get market listing by MLS: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        mlsNumber: req.params.mlsNumber
      }),
      source: 'market-controller',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      endpoint: req.path,
      tags: ['market', 'listing', 'mls', 'error']
    });
    
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: error instanceof AppError ? error.statusCode : 500
    });
  }
}

/**
 * Get market stats
 */
export async function getMarketStats(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Get query parameters for filtering stats by area
    const { city = 'Grandview', zip = '98930' } = req.query;
    
    // Get the market data connector
    const connector = connectorFactory.getConnector('grandview-market') as MarketDataConnector;
    
    if (!connector) {
      throw new AppError('Market data connector not found', 500, 'CONNECTOR_ERROR', true);
    }
    
    // Fetch all listings to compute stats
    const allListings = await connector.fetchData({
      city: city as string,
      zip: zip as string,
      limit: 1000 // Get a larger sample for more accurate stats
    });
    
    // Calculate market statistics
    const stats = calculateMarketStats(allListings.data);
    
    // Log successful request
    const duration = Date.now() - startTime;
    await storage.createLog({
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: `Retrieved market statistics for ${city}, ${zip}`,
      details: JSON.stringify({
        city,
        zip,
        statsGenerated: Object.keys(stats)
      }),
      source: 'market-controller',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: 200,
      endpoint: req.path,
      tags: ['market', 'stats']
    });
    
    res.status(200).json(stats);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error
    await storage.createLog({
      level: LogLevel.ERROR,
      category: LogCategory.API,
      message: `Failed to get market stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: JSON.stringify({
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        query: req.query
      }),
      source: 'market-controller',
      projectId: null,
      userId: req.session?.user?.id || null,
      sessionId: req.sessionID || null,
      duration,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      endpoint: req.path,
      tags: ['market', 'stats', 'error']
    });
    
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      statusCode: error instanceof AppError ? error.statusCode : 500
    });
  }
}

/**
 * Calculate market statistics from property listings
 */
function calculateMarketStats(listings: any[]): any {
  if (!listings || listings.length === 0) {
    return {
      medianPrice: 0,
      averagePrice: 0,
      pricePerSqFt: 0,
      totalListings: 0,
      activeListings: 0,
      soldListings: 0,
      averageDaysOnMarket: 0,
      priceTrend: 'stable',
      propertyTypes: {}
    };
  }
  
  // Filter sold listings
  const soldListings = listings.filter(listing => 
    listing.status.toLowerCase() === 'sold' || 
    listing.status.toLowerCase() === 'closed'
  );
  
  // Filter active listings
  const activeListings = listings.filter(listing => 
    listing.status.toLowerCase() === 'active' || 
    listing.status.toLowerCase() === 'new' ||
    listing.status.toLowerCase() === 'pending'
  );
  
  // Calculate prices
  const allPrices = listings.map(listing => listing.price).filter(price => price > 0);
  const soldPrices = soldListings.map(listing => listing.price).filter(price => price > 0);
  
  // Sort prices for median calculation
  allPrices.sort((a, b) => a - b);
  soldPrices.sort((a, b) => a - b);
  
  // Calculate median price
  const medianPrice = allPrices.length > 0 
    ? allPrices[Math.floor(allPrices.length / 2)] 
    : 0;
  
  const medianSoldPrice = soldPrices.length > 0 
    ? soldPrices[Math.floor(soldPrices.length / 2)] 
    : 0;
  
  // Calculate average price
  const averagePrice = allPrices.length > 0 
    ? allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length 
    : 0;
  
  // Calculate average days on market
  const daysOnMarket = listings
    .map(listing => listing.daysOnMarket)
    .filter(dom => dom !== undefined && dom !== null && dom > 0);
  
  const averageDaysOnMarket = daysOnMarket.length > 0 
    ? daysOnMarket.reduce((sum, dom) => sum + dom, 0) / daysOnMarket.length 
    : 0;
  
  // Calculate price per square foot
  const pricesPerSqFt = listings
    .filter(listing => listing.squareFeet > 0 && listing.price > 0)
    .map(listing => listing.price / listing.squareFeet);
  
  const averagePricePerSqFt = pricesPerSqFt.length > 0 
    ? pricesPerSqFt.reduce((sum, ppsf) => sum + ppsf, 0) / pricesPerSqFt.length 
    : 0;
  
  // Calculate property type distribution
  const propertyTypes: Record<string, number> = {};
  listings.forEach(listing => {
    const type = listing.propertyType || 'Unknown';
    propertyTypes[type] = (propertyTypes[type] || 0) + 1;
  });
  
  // Calculate bedroom distribution
  const bedroomCounts: Record<string, number> = {};
  listings.forEach(listing => {
    const beds = listing.beds || 0;
    const key = beds > 4 ? '5+' : beds.toString();
    bedroomCounts[key] = (bedroomCounts[key] || 0) + 1;
  });
  
  // Calculate bathroom distribution
  const bathroomCounts: Record<string, number> = {};
  listings.forEach(listing => {
    const baths = listing.baths || 0;
    const key = baths >= 3 ? '3+' : baths.toString();
    bathroomCounts[key] = (bathroomCounts[key] || 0) + 1;
  });
  
  // Determine price trend
  // This is a simplified approach - in a real implementation, you'd want to
  // compare historical data over time to determine trends
  let priceTrend = 'stable';
  if (soldListings.length > 0 && activeListings.length > 0) {
    const avgSoldPrice = soldPrices.reduce((sum, price) => sum + price, 0) / soldPrices.length;
    const activePrices = activeListings.map(listing => listing.price).filter(price => price > 0);
    const avgActivePrice = activePrices.length > 0 
      ? activePrices.reduce((sum, price) => sum + price, 0) / activePrices.length 
      : 0;
    
    // Compare current active listings to sold listings
    const priceDiffPercent = ((avgActivePrice - avgSoldPrice) / avgSoldPrice) * 100;
    
    if (priceDiffPercent > 5) {
      priceTrend = 'increasing';
    } else if (priceDiffPercent < -5) {
      priceTrend = 'decreasing';
    }
  }
  
  return {
    medianPrice,
    medianSoldPrice,
    averagePrice: Math.round(averagePrice),
    pricePerSqFt: Math.round(averagePricePerSqFt * 100) / 100,
    totalListings: listings.length,
    activeListings: activeListings.length,
    soldListings: soldListings.length,
    averageDaysOnMarket: Math.round(averageDaysOnMarket),
    priceTrend,
    propertyTypes,
    bedroomCounts,
    bathroomCounts,
    // Additional stats
    lowestPrice: allPrices.length > 0 ? allPrices[0] : 0,
    highestPrice: allPrices.length > 0 ? allPrices[allPrices.length - 1] : 0,
    priceRange: allPrices.length > 0 ? allPrices[allPrices.length - 1] - allPrices[0] : 0
  };
}