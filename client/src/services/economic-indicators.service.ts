/**
 * Economic Indicators Service
 * 
 * This service provides economic data and indicators for regional analysis.
 */

import { apiRequest } from '@/lib/queryClient';

// Economic data types and interfaces
export interface EconomicIndicator {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  lastUpdated: Date;
  source: string;
  description: string;
}

export interface EconomicRegion {
  id: string;
  name: string;
  type: 'metro' | 'county' | 'state' | 'city';
  state: string;
  population: number;
  area: number; // square miles
  boundaries: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  indicators: EconomicIndicator[];
  lastUpdated: Date;
}

export interface EconomicDashboardData {
  region: EconomicRegion;
  keyMetrics: {
    unemployment: number;
    jobGrowth: number;
    medianIncome: number;
    costOfLiving: number;
    housingAffordability: number;
    businessGrowth: number;
  };
  trends: {
    employment: EconomicIndicator[];
    housing: EconomicIndicator[];
    business: EconomicIndicator[];
    demographics: EconomicIndicator[];
  };
  comparisons: {
    stateAverage: Record<string, number>;
    nationalAverage: Record<string, number>;
    regionRanking: Record<string, number>;
  };
  forecast: {
    nextQuarter: Record<string, number>;
    nextYear: Record<string, number>;
    confidence: number; // 0-100
  };
}

class EconomicIndicatorsService {
  private static instance: EconomicIndicatorsService;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): EconomicIndicatorsService {
    if (!EconomicIndicatorsService.instance) {
      EconomicIndicatorsService.instance = new EconomicIndicatorsService();
    }
    return EconomicIndicatorsService.instance;
  }
  
  /**
   * Get economic data for a region by location
   */
  async getEconomicDataByLocation(latitude: number, longitude: number): Promise<EconomicDashboardData | null> {
    try {
      // In production, this would call a real economic data API
      // const data = await apiRequest.get('/api/economic-data/by-location', {
      //   params: { latitude, longitude }
      // });
      
      // For demo purposes, return mock data based on location
      const isRichlandArea = Math.abs(latitude - 46.28) < 0.1 && 
                              Math.abs(longitude - (-119.28)) < 0.2;
      const isGrandviewArea = Math.abs(latitude - 46.25) < 0.1 && 
                               Math.abs(longitude - (-119.91)) < 0.2;
      
      if (isRichlandArea) {
        return this.getRichlandEconomicData();
      } else if (isGrandviewArea) {
        return this.getGrandviewEconomicData();
      }
      
      return this.getDefaultEconomicData();
    } catch (error) {
      console.error('Error fetching economic data:', error);
      return null;
    }
  }
  
  /**
   * Get economic region by ID
   */
  async getEconomicRegionById(regionId: string): Promise<EconomicRegion | null> {
    try {
      // In production, this would call a real API
      // const region = await apiRequest.get(`/api/economic-regions/${regionId}`);
      
      // For demo purposes, return mock data
      if (regionId === 'richland-metro') {
        return this.getRichlandEconomicData().region;
      } else if (regionId === 'grandview-county') {
        return this.getGrandviewEconomicData().region;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching economic region:', error);
      return null;
    }
  }
  
  /**
   * Get economic indicators for a region
   */
  async getIndicatorsByRegion(regionId: string): Promise<EconomicIndicator[]> {
    try {
      // In production, this would call a real API
      // const indicators = await apiRequest.get(`/api/economic-indicators`, {
      //   params: { regionId }
      // });
      
      const region = await this.getEconomicRegionById(regionId);
      return region?.indicators || [];
    } catch (error) {
      console.error('Error fetching economic indicators:', error);
      return [];
    }
  }
  
  private getRichlandEconomicData(): EconomicDashboardData {
    const now = new Date();
    
    const region: EconomicRegion = {
      id: 'richland-metro',
      name: 'Richland Metro Area',
      type: 'metro',
      state: 'WA',
      population: 295000,
      area: 1580,
      boundaries: {
        type: 'Polygon',
        coordinates: [[
          [-119.5, 46.1],
          [-119.0, 46.1],
          [-119.0, 46.4],
          [-119.5, 46.4],
          [-119.5, 46.1]
        ]]
      },
      indicators: [
        {
          id: 'unemployment-rate',
          name: 'Unemployment Rate',
          value: 4.2,
          unit: '%',
          trend: 'down',
          changePercent: -0.3,
          lastUpdated: now,
          source: 'Bureau of Labor Statistics',
          description: 'Percentage of labor force that is unemployed'
        },
        {
          id: 'job-growth',
          name: 'Job Growth Rate',
          value: 2.8,
          unit: '%',
          trend: 'up',
          changePercent: 0.5,
          lastUpdated: now,
          source: 'Bureau of Labor Statistics',
          description: 'Year-over-year employment growth'
        },
        {
          id: 'median-income',
          name: 'Median Household Income',
          value: 78500,
          unit: '$',
          trend: 'up',
          changePercent: 3.2,
          lastUpdated: now,
          source: 'Census Bureau',
          description: 'Median household income in the area'
        }
      ],
      lastUpdated: now
    };
    
    return {
      region,
      keyMetrics: {
        unemployment: 4.2,
        jobGrowth: 2.8,
        medianIncome: 78500,
        costOfLiving: 102.5,
        housingAffordability: 85.3,
        businessGrowth: 3.1
      },
      trends: {
        employment: [
          {
            id: 'emp-1',
            name: 'Total Employment',
            value: 142000,
            unit: 'jobs',
            trend: 'up',
            changePercent: 2.8,
            lastUpdated: now,
            source: 'BLS',
            description: 'Total non-farm employment'
          }
        ],
        housing: [
          {
            id: 'house-1',
            name: 'Median Home Price',
            value: 425000,
            unit: '$',
            trend: 'up',
            changePercent: 8.5,
            lastUpdated: now,
            source: 'MLS',
            description: 'Median price of homes sold'
          }
        ],
        business: [
          {
            id: 'biz-1',
            name: 'Business Permits',
            value: 145,
            unit: 'permits',
            trend: 'up',
            changePercent: 12.3,
            lastUpdated: now,
            source: 'City Records',
            description: 'New business permits issued monthly'
          }
        ],
        demographics: [
          {
            id: 'demo-1',
            name: 'Population Growth',
            value: 1.8,
            unit: '%',
            trend: 'up',
            changePercent: 0.2,
            lastUpdated: now,
            source: 'Census',
            description: 'Annual population growth rate'
          }
        ]
      },
      comparisons: {
        stateAverage: {
          unemployment: 5.1,
          jobGrowth: 2.2,
          medianIncome: 75000,
          housingAffordability: 78.5
        },
        nationalAverage: {
          unemployment: 3.8,
          jobGrowth: 1.9,
          medianIncome: 70000,
          housingAffordability: 72.1
        },
        regionRanking: {
          unemployment: 25, // out of 100 metro areas (lower is better)
          jobGrowth: 15,
          medianIncome: 18,
          housingAffordability: 12
        }
      },
      forecast: {
        nextQuarter: {
          unemployment: 4.0,
          jobGrowth: 3.1,
          medianIncome: 79500,
          housingAffordability: 84.8
        },
        nextYear: {
          unemployment: 3.8,
          jobGrowth: 3.5,
          medianIncome: 82000,
          housingAffordability: 82.1
        },
        confidence: 78
      }
    };
  }
  
  private getGrandviewEconomicData(): EconomicDashboardData {
    const now = new Date();
    
    const region: EconomicRegion = {
      id: 'grandview-county',
      name: 'Yakima County (Grandview Area)',
      type: 'county',
      state: 'WA',
      population: 250000,
      area: 4296,
      boundaries: {
        type: 'Polygon',
        coordinates: [[
          [-120.5, 46.0],
          [-119.5, 46.0],
          [-119.5, 47.0],
          [-120.5, 47.0],
          [-120.5, 46.0]
        ]]
      },
      indicators: [
        {
          id: 'unemployment-rate',
          name: 'Unemployment Rate',
          value: 6.8,
          unit: '%',
          trend: 'stable',
          changePercent: -0.1,
          lastUpdated: now,
          source: 'Bureau of Labor Statistics',
          description: 'Percentage of labor force that is unemployed'
        },
        {
          id: 'job-growth',
          name: 'Job Growth Rate',
          value: 1.2,
          unit: '%',
          trend: 'up',
          changePercent: 0.3,
          lastUpdated: now,
          source: 'Bureau of Labor Statistics',
          description: 'Year-over-year employment growth'
        },
        {
          id: 'median-income',
          name: 'Median Household Income',
          value: 52000,
          unit: '$',
          trend: 'up',
          changePercent: 2.1,
          lastUpdated: now,
          source: 'Census Bureau',
          description: 'Median household income in the area'
        }
      ],
      lastUpdated: now
    };
    
    return {
      region,
      keyMetrics: {
        unemployment: 6.8,
        jobGrowth: 1.2,
        medianIncome: 52000,
        costOfLiving: 94.2,
        housingAffordability: 92.1,
        businessGrowth: 1.8
      },
      trends: {
        employment: [
          {
            id: 'emp-1',
            name: 'Total Employment',
            value: 98000,
            unit: 'jobs',
            trend: 'up',
            changePercent: 1.2,
            lastUpdated: now,
            source: 'BLS',
            description: 'Total non-farm employment'
          }
        ],
        housing: [
          {
            id: 'house-1',
            name: 'Median Home Price',
            value: 285000,
            unit: '$',
            trend: 'up',
            changePercent: 6.2,
            lastUpdated: now,
            source: 'MLS',
            description: 'Median price of homes sold'
          }
        ],
        business: [
          {
            id: 'biz-1',
            name: 'Business Permits',
            value: 32,
            unit: 'permits',
            trend: 'stable',
            changePercent: 2.1,
            lastUpdated: now,
            source: 'County Records',
            description: 'New business permits issued monthly'
          }
        ],
        demographics: [
          {
            id: 'demo-1',
            name: 'Population Growth',
            value: 0.8,
            unit: '%',
            trend: 'stable',
            changePercent: 0.0,
            lastUpdated: now,
            source: 'Census',
            description: 'Annual population growth rate'
          }
        ]
      },
      comparisons: {
        stateAverage: {
          unemployment: 5.1,
          jobGrowth: 2.2,
          medianIncome: 75000,
          housingAffordability: 78.5
        },
        nationalAverage: {
          unemployment: 3.8,
          jobGrowth: 1.9,
          medianIncome: 70000,
          housingAffordability: 72.1
        },
        regionRanking: {
          unemployment: 78, // out of 100 metro areas (lower is better)
          jobGrowth: 65,
          medianIncome: 82,
          housingAffordability: 35
        }
      },
      forecast: {
        nextQuarter: {
          unemployment: 6.5,
          jobGrowth: 1.4,
          medianIncome: 52800,
          housingAffordability: 91.8
        },
        nextYear: {
          unemployment: 6.2,
          jobGrowth: 1.8,
          medianIncome: 54500,
          housingAffordability: 90.5
        },
        confidence: 65
      }
    };
  }
  
  private getDefaultEconomicData(): EconomicDashboardData {
    const now = new Date();
    
    const region: EconomicRegion = {
      id: 'default-region',
      name: 'Washington State Average',
      type: 'state',
      state: 'WA',
      population: 7700000,
      area: 71362,
      boundaries: {
        type: 'Polygon',
        coordinates: [[
          [-125.0, 45.5],
          [-116.0, 45.5],
          [-116.0, 49.0],
          [-125.0, 49.0],
          [-125.0, 45.5]
        ]]
      },
      indicators: [
        {
          id: 'unemployment-rate',
          name: 'Unemployment Rate',
          value: 5.1,
          unit: '%',
          trend: 'down',
          changePercent: -0.2,
          lastUpdated: now,
          source: 'Bureau of Labor Statistics',
          description: 'State unemployment rate'
        }
      ],
      lastUpdated: now
    };
    
    return {
      region,
      keyMetrics: {
        unemployment: 5.1,
        jobGrowth: 2.2,
        medianIncome: 75000,
        costOfLiving: 108.3,
        housingAffordability: 78.5,
        businessGrowth: 2.5
      },
      trends: {
        employment: [],
        housing: [],
        business: [],
        demographics: []
      },
      comparisons: {
        stateAverage: {
          unemployment: 5.1,
          jobGrowth: 2.2,
          medianIncome: 75000,
          housingAffordability: 78.5
        },
        nationalAverage: {
          unemployment: 3.8,
          jobGrowth: 1.9,
          medianIncome: 70000,
          housingAffordability: 72.1
        },
        regionRanking: {
          unemployment: 50,
          jobGrowth: 40,
          medianIncome: 30,
          housingAffordability: 45
        }
      },
      forecast: {
        nextQuarter: {
          unemployment: 4.9,
          jobGrowth: 2.4,
          medianIncome: 76000,
          housingAffordability: 77.8
        },
        nextYear: {
          unemployment: 4.7,
          jobGrowth: 2.8,
          medianIncome: 78500,
          housingAffordability: 76.2
        },
        confidence: 72
      }
    };
  }
}

const economicIndicatorsService = EconomicIndicatorsService.getInstance();
export default economicIndicatorsService;