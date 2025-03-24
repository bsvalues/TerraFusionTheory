/**
 * Economic Indicators Service
 * 
 * This service handles fetching and processing economic indicator data
 * for the Local Economic Indicators Dashboard.
 */

import { apiRequest } from '@/lib/queryClient';

// Types for economic indicator data
export interface EconomicIndicator {
  id: string;
  name: string;
  description: string;
  category: 'employment' | 'income' | 'housing' | 'business' | 'demographic' | 'other';
  unit: string; // e.g., "percent", "dollars", "number", "index"
  higherIsBetter: boolean; // Indicates if higher values are considered better
}

export interface EconomicDataPoint {
  indicatorId: string;
  regionId: string;
  date: string; // ISO date string
  value: number;
  change?: number; // Percentage change from previous period
  trend?: 'up' | 'down' | 'stable';
  rank?: number; // Rank compared to other regions (if available)
  percentile?: number; // Percentile compared to other regions (if available)
  source?: string;
}

export interface EconomicRegion {
  id: string;
  name: string;
  type: 'city' | 'county' | 'metro' | 'state' | 'zip' | 'neighborhood';
  parentRegion?: string; // ID of parent region
  state: string;
  population?: number;
  boundaries?: GeoJSON.Polygon;
}

export interface EconomicTrendData {
  indicator: EconomicIndicator;
  region: EconomicRegion;
  timeframe: 'month' | 'quarter' | 'year' | 'fiveYear' | 'tenYear';
  data: EconomicDataPoint[];
  statistics: {
    min: number;
    max: number;
    average: number;
    median: number;
    currentValue: number;
    currentTrend: 'up' | 'down' | 'stable';
    percentChange: number; // From beginning to end of period
    forecastValue?: number; // If forecast is available
    forecastTrend?: 'up' | 'down' | 'stable';
  };
  benchmarks?: {
    national?: number;
    state?: number;
    comparable?: number; // Average of comparable regions
  };
}

export interface CorrelationResult {
  indicatorX: string; // ID of first indicator
  indicatorY: string; // ID of second indicator
  region: string; // ID of region
  timeframe: 'month' | 'quarter' | 'year' | 'fiveYear' | 'tenYear';
  correlationCoefficient: number; // -1 to 1
  significanceLevel: number; // p-value
  scatterPlotData: Array<{x: number; y: number; date: string}>;
  regressionLine?: {
    slope: number;
    intercept: number;
    r2: number;
  };
  insight: string; // Text explanation of the correlation
}

export interface PropertyValueImpact {
  indicator: string; // ID of economic indicator
  region: string; // ID of region
  impact: number; // -1 to 1, where 1 is strong positive impact, -1 is strong negative impact
  confidenceLevel: 'low' | 'medium' | 'high';
  lagPeriod?: string; // How long before indicator changes affect property values
  explanation: string; // Text explanation
}

export interface EconomicDashboardData {
  region: EconomicRegion;
  indicators: {
    employment: {
      unemploymentRate: EconomicDataPoint;
      jobGrowth: EconomicDataPoint;
      laborForceParticipation: EconomicDataPoint;
      topIndustries: Array<{
        name: string;
        share: number;
        jobGrowth: number;
        averageWage: number;
      }>;
    };
    income: {
      medianHouseholdIncome: EconomicDataPoint;
      perCapitaIncome: EconomicDataPoint;
      wageGrowth: EconomicDataPoint;
      incomeDistribution?: Array<{
        category: string;
        percentage: number;
      }>;
    };
    housing: {
      medianHomePrice: EconomicDataPoint;
      homeValueGrowth: EconomicDataPoint;
      affordabilityIndex: EconomicDataPoint;
      constructionPermits: EconomicDataPoint;
    };
    business: {
      businessGrowth: EconomicDataPoint;
      newBusinessFormation: EconomicDataPoint;
      commercialVacancyRate?: EconomicDataPoint;
      retailSales?: EconomicDataPoint;
    };
    demographic: {
      populationGrowth: EconomicDataPoint;
      medianAge?: EconomicDataPoint;
      educationalAttainment?: EconomicDataPoint;
    };
  };
  trends: {
    employment: EconomicTrendData[];
    income: EconomicTrendData[];
    housing: EconomicTrendData[];
    business: EconomicTrendData[];
    demographic: EconomicTrendData[];
  };
  propertyValueCorrelations: PropertyValueImpact[];
  regionComparisons: {
    indicator: string;
    regions: string[];
    values: number[];
    regionNames: string[];
  }[];
}

export interface EconomicSearchParams {
  regionId?: string;
  regionType?: string;
  state?: string;
  indicator?: string;
  indicatorId?: string; // Used internally in the service
  category?: string;
  timeframe?: string;
  startDate?: string;
  endDate?: string;
}

class EconomicIndicatorsService {
  /**
   * Get all available economic indicators
   * @returns Array of economic indicators
   */
  async getIndicators(): Promise<EconomicIndicator[]> {
    try {
      // In a production app, this would be an API call:
      // return await apiRequest.get('/api/economic-indicators');
      
      // Demo implementation
      return [
        {
          id: 'unemployment-rate',
          name: 'Unemployment Rate',
          description: 'Percentage of labor force that is unemployed and actively seeking employment',
          category: 'employment',
          unit: 'percent',
          higherIsBetter: false
        },
        {
          id: 'job-growth',
          name: 'Job Growth',
          description: 'Year-over-year percentage change in total employment',
          category: 'employment',
          unit: 'percent',
          higherIsBetter: true
        },
        {
          id: 'labor-force-participation',
          name: 'Labor Force Participation',
          description: 'Percentage of working-age population in the labor force',
          category: 'employment',
          unit: 'percent',
          higherIsBetter: true
        },
        {
          id: 'median-household-income',
          name: 'Median Household Income',
          description: 'Median annual income of households in the region',
          category: 'income',
          unit: 'dollars',
          higherIsBetter: true
        },
        {
          id: 'per-capita-income',
          name: 'Per Capita Income',
          description: 'Average income per person in the region',
          category: 'income',
          unit: 'dollars',
          higherIsBetter: true
        },
        {
          id: 'wage-growth',
          name: 'Wage Growth',
          description: 'Year-over-year percentage change in average wages',
          category: 'income',
          unit: 'percent',
          higherIsBetter: true
        },
        {
          id: 'median-home-price',
          name: 'Median Home Price',
          description: 'Median sale price of homes in the region',
          category: 'housing',
          unit: 'dollars',
          higherIsBetter: true
        },
        {
          id: 'home-value-growth',
          name: 'Home Value Growth',
          description: 'Year-over-year percentage change in home values',
          category: 'housing',
          unit: 'percent',
          higherIsBetter: true
        },
        {
          id: 'affordability-index',
          name: 'Housing Affordability Index',
          description: 'Index measuring housing affordability relative to income (higher means more affordable)',
          category: 'housing',
          unit: 'index',
          higherIsBetter: true
        },
        {
          id: 'construction-permits',
          name: 'Construction Permits',
          description: 'Number of new construction permits issued',
          category: 'housing',
          unit: 'number',
          higherIsBetter: true
        },
        {
          id: 'business-growth',
          name: 'Business Growth',
          description: 'Year-over-year percentage change in number of businesses',
          category: 'business',
          unit: 'percent',
          higherIsBetter: true
        },
        {
          id: 'new-business-formation',
          name: 'New Business Formation',
          description: 'Number of new business licenses issued per 1,000 residents',
          category: 'business',
          unit: 'number',
          higherIsBetter: true
        },
        {
          id: 'population-growth',
          name: 'Population Growth',
          description: 'Year-over-year percentage change in population',
          category: 'demographic',
          unit: 'percent',
          higherIsBetter: true
        }
      ];
    } catch (error) {
      console.error('Error fetching economic indicators:', error);
      throw new Error('Failed to fetch economic indicators');
    }
  }

  /**
   * Get economic regions
   * @param state Optional state filter
   * @param type Optional region type filter
   * @returns Array of economic regions
   */
  async getRegions(state?: string, type?: string): Promise<EconomicRegion[]> {
    try {
      // In a production app, this would be an API call:
      // return await apiRequest.get('/api/economic-regions', { params: { state, type } });
      
      // Demo implementation
      const allRegions = [
        {
          id: 'richland-city',
          name: 'Richland',
          type: 'city' as const,
          state: 'WA',
          population: 58225,
          boundaries: {
            type: 'Polygon',
            coordinates: [[
              [-119.35, 46.22],
              [-119.25, 46.22],
              [-119.25, 46.32],
              [-119.35, 46.32],
              [-119.35, 46.22]
            ]]
          }
        },
        {
          id: 'grandview-city',
          name: 'Grandview',
          type: 'city' as const,
          state: 'WA',
          population: 11520,
          boundaries: {
            type: 'Polygon',
            coordinates: [[
              [-119.95, 46.22],
              [-119.85, 46.22],
              [-119.85, 46.28],
              [-119.95, 46.28],
              [-119.95, 46.22]
            ]]
          }
        },
        {
          id: 'benton-county',
          name: 'Benton County',
          type: 'county' as const,
          state: 'WA',
          population: 205700,
          boundaries: {
            type: 'Polygon',
            coordinates: [[
              [-119.6, 46.0],
              [-118.8, 46.0],
              [-118.8, 46.5],
              [-119.6, 46.5],
              [-119.6, 46.0]
            ]]
          }
        },
        {
          id: 'yakima-county',
          name: 'Yakima County',
          type: 'county' as const,
          state: 'WA',
          population: 256728,
          boundaries: {
            type: 'Polygon',
            coordinates: [[
              [-120.8, 46.2],
              [-119.8, 46.2],
              [-119.8, 46.8],
              [-120.8, 46.8],
              [-120.8, 46.2]
            ]]
          }
        },
        {
          id: 'tri-cities-metro',
          name: 'Tri-Cities Metro Area',
          type: 'metro' as const,
          parentRegion: 'benton-county',
          state: 'WA',
          population: 307150,
          boundaries: {
            type: 'Polygon',
            coordinates: [[
              [-119.6, 46.1],
              [-118.9, 46.1],
              [-118.9, 46.4],
              [-119.6, 46.4],
              [-119.6, 46.1]
            ]]
          }
        },
        {
          id: 'wa-state',
          name: 'Washington',
          type: 'state' as const,
          state: 'WA',
          population: 7738692
        }
      ];
      
      // Filter regions if state or type is provided
      return allRegions.filter(region => {
        const stateMatch = !state || region.state === state;
        const typeMatch = !type || region.type === type;
        return stateMatch && typeMatch;
      });
    } catch (error) {
      console.error('Error fetching economic regions:', error);
      throw new Error('Failed to fetch economic regions');
    }
  }

  /**
   * Get indicator data for a specific region over time
   * @param params Search parameters
   * @returns Trend data for the indicator and region
   */
  async getIndicatorTrend(params: EconomicSearchParams): Promise<EconomicTrendData> {
    try {
      // In a production app, this would be an API call:
      // return await apiRequest.get('/api/economic-trends', { params });
      
      // Demo implementation
      if (!params.indicatorId || !params.regionId) {
        throw new Error('Indicator ID and Region ID are required');
      }
      
      // Get indicator and region details
      const indicators = await this.getIndicators();
      const regions = await this.getRegions();
      
      const indicator = indicators.find(i => i.id === params.indicatorId);
      const region = regions.find(r => r.id === params.regionId);
      
      if (!indicator || !region) {
        throw new Error('Invalid indicator or region ID');
      }
      
      // Generate sample trend data
      const timeframe = params.timeframe || 'year';
      
      // Calculate number of data points based on timeframe
      let numPoints = 10;
      if (timeframe === 'month') numPoints = 36; // 3 years of monthly data
      if (timeframe === 'quarter') numPoints = 20; // 5 years of quarterly data
      if (timeframe === 'fiveYear') numPoints = 5;
      if (timeframe === 'tenYear') numPoints = 10;
      
      // Generate data points with some randomness but following a trend
      let trend = 'stable';
      let baseValue = 0;
      let volatility = 0.1;
      
      // Set base values for different indicators
      if (indicator.id === 'unemployment-rate') {
        baseValue = 5.5;
        volatility = 0.8;
        trend = region.id === 'richland-city' ? 'down' : 'up';
      } else if (indicator.id === 'job-growth') {
        baseValue = 2.2;
        volatility = 1.5;
        trend = region.id === 'tri-cities-metro' ? 'up' : 'stable';
      } else if (indicator.id === 'median-household-income') {
        baseValue = 70000;
        volatility = 5000;
        trend = 'up';
      } else if (indicator.id === 'per-capita-income') {
        baseValue = 32000;
        volatility = 2000;
        trend = 'up';
      } else if (indicator.id === 'median-home-price') {
        baseValue = 350000;
        volatility = 20000;
        trend = 'up';
      } else if (indicator.id === 'home-value-growth') {
        baseValue = 8;
        volatility = 3;
        trend = region.id.includes('richland') ? 'up' : 'stable';
      } else if (indicator.id === 'affordability-index') {
        baseValue = 120;
        volatility = 10;
        trend = 'down';
      } else if (indicator.id === 'population-growth') {
        baseValue = 1.5;
        volatility = 0.5;
        trend = region.id.includes('richland') ? 'up' : 'stable';
      } else {
        baseValue = 100;
        volatility = 10;
      }
      
      // Adjust base values for different regions
      if (region.id.includes('grandview')) {
        baseValue = baseValue * 0.85;
      } else if (region.id.includes('yakima')) {
        baseValue = baseValue * 0.9;
      } else if (region.id.includes('benton')) {
        baseValue = baseValue * 1.05;
      } else if (region.id.includes('tri-cities')) {
        baseValue = baseValue * 1.1;
      } else if (region.id.includes('wa-state')) {
        baseValue = baseValue * 1.15;
      }
      
      // Generate the data points
      const dataPoints: EconomicDataPoint[] = [];
      let currentValue = baseValue;
      
      for (let i = 0; i < numPoints; i++) {
        // Calculate date based on timeframe
        const date = new Date();
        if (timeframe === 'month') {
          date.setMonth(date.getMonth() - (numPoints - i - 1));
        } else if (timeframe === 'quarter') {
          date.setMonth(date.getMonth() - ((numPoints - i - 1) * 3));
        } else {
          date.setFullYear(date.getFullYear() - (numPoints - i - 1));
        }
        
        // Adjust value based on trend
        let trendFactor = 0;
        if (trend === 'up') trendFactor = volatility * 0.5;
        if (trend === 'down') trendFactor = -volatility * 0.5;
        
        // Add some random variation
        const randomFactor = (Math.random() - 0.5) * volatility;
        
        // Update current value
        currentValue = currentValue + trendFactor + randomFactor;
        
        // Ensure value doesn't go below 0 for percentage metrics
        if (indicator.unit === 'percent' && currentValue < 0) {
          currentValue = Math.abs(randomFactor * 0.5);
        }
        
        // Round to 2 decimal places
        currentValue = Math.round(currentValue * 100) / 100;
        
        // Create data point
        dataPoints.push({
          indicatorId: indicator.id,
          regionId: region.id,
          date: date.toISOString().substring(0, 10),
          value: currentValue,
          change: i > 0 ? ((currentValue / dataPoints[i-1].value) - 1) * 100 : 0,
          trend: i > 0 ? (currentValue > dataPoints[i-1].value ? 'up' : currentValue < dataPoints[i-1].value ? 'down' : 'stable') : 'stable'
        });
      }
      
      // Calculate statistics
      const values = dataPoints.map(dp => dp.value);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const avg = sum / values.length;
      
      // Sort values for median
      const sortedValues = [...values].sort((a, b) => a - b);
      const median = sortedValues.length % 2 === 0 
        ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
        : sortedValues[Math.floor(sortedValues.length / 2)];
      
      // Calculate percent change from first to last
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      const percentChange = ((lastValue / firstValue) - 1) * 100;
      
      // Determine current trend based on last few values
      const recentValues = values.slice(-3);
      let currentTrend: 'up' | 'down' | 'stable' = 'stable';
      if (recentValues[2] > recentValues[0]) {
        currentTrend = 'up';
      } else if (recentValues[2] < recentValues[0]) {
        currentTrend = 'down';
      }
      
      // Generate forecast value
      const forecastValue = lastValue * (1 + (Math.random() * 0.1 * (currentTrend === 'up' ? 1 : currentTrend === 'down' ? -1 : 0.5)));
      const forecastTrend = forecastValue > lastValue ? 'up' : forecastValue < lastValue ? 'down' : 'stable';
      
      // Generate benchmarks
      const nationalBenchmark = lastValue * (0.85 + Math.random() * 0.3);
      const stateBenchmark = lastValue * (0.9 + Math.random() * 0.2);
      const comparableBenchmark = lastValue * (0.95 + Math.random() * 0.1);
      
      return {
        indicator,
        region,
        timeframe: timeframe as any,
        data: dataPoints,
        statistics: {
          min,
          max,
          average: avg,
          median,
          currentValue: lastValue,
          currentTrend,
          percentChange,
          forecastValue,
          forecastTrend
        },
        benchmarks: {
          national: nationalBenchmark,
          state: stateBenchmark,
          comparable: comparableBenchmark
        }
      };
    } catch (error) {
      console.error('Error fetching indicator trend:', error);
      throw new Error('Failed to fetch indicator trend data');
    }
  }

  /**
   * Get a comprehensive economic dashboard for a region
   * @param regionId ID of the region to analyze
   * @param timeframe Timeframe for trend data
   * @returns Dashboard data for the region
   */
  async getDashboardData(regionId: string, timeframe: string = 'year'): Promise<EconomicDashboardData> {
    try {
      // In a production app, this would be an API call:
      // return await apiRequest.get(`/api/economic-dashboard/${regionId}`, { params: { timeframe } });
      
      // Demo implementation
      
      // Get region details
      const regions = await this.getRegions();
      const region = regions.find(r => r.id === regionId);
      
      if (!region) {
        throw new Error('Invalid region ID');
      }
      
      // Get indicator trends for all key indicators
      const indicators = await this.getIndicators();
      
      // Fetch current data points for main indicators
      const unemploymentTrend = await this.getIndicatorTrend({
        indicatorId: 'unemployment-rate',
        regionId,
        timeframe
      });
      
      const jobGrowthTrend = await this.getIndicatorTrend({
        indicatorId: 'job-growth',
        regionId,
        timeframe
      });
      
      const laborForceTrend = await this.getIndicatorTrend({
        indicatorId: 'labor-force-participation',
        regionId,
        timeframe
      });
      
      const medianIncomeTrend = await this.getIndicatorTrend({
        indicatorId: 'median-household-income',
        regionId,
        timeframe
      });
      
      const perCapitaIncomeTrend = await this.getIndicatorTrend({
        indicatorId: 'per-capita-income',
        regionId,
        timeframe
      });
      
      const wageGrowthTrend = await this.getIndicatorTrend({
        indicatorId: 'wage-growth',
        regionId,
        timeframe
      });
      
      const homeValueTrend = await this.getIndicatorTrend({
        indicatorId: 'median-home-price',
        regionId,
        timeframe
      });
      
      const homeGrowthTrend = await this.getIndicatorTrend({
        indicatorId: 'home-value-growth',
        regionId,
        timeframe
      });
      
      const affordabilityTrend = await this.getIndicatorTrend({
        indicatorId: 'affordability-index',
        regionId,
        timeframe
      });
      
      const constructionTrend = await this.getIndicatorTrend({
        indicatorId: 'construction-permits',
        regionId,
        timeframe
      });
      
      const businessGrowthTrend = await this.getIndicatorTrend({
        indicatorId: 'business-growth',
        regionId,
        timeframe
      });
      
      const newBusinessTrend = await this.getIndicatorTrend({
        indicatorId: 'new-business-formation',
        regionId,
        timeframe
      });
      
      const populationTrend = await this.getIndicatorTrend({
        indicatorId: 'population-growth',
        regionId,
        timeframe
      });
      
      // Generate top industries
      const topIndustries = [
        {
          name: 'Healthcare',
          share: 18.5,
          jobGrowth: 5.2,
          averageWage: 68000
        },
        {
          name: 'Government',
          share: 16.8,
          jobGrowth: 1.3,
          averageWage: 72000
        },
        {
          name: 'Retail',
          share: 12.3,
          jobGrowth: -0.5,
          averageWage: 42000
        },
        {
          name: 'Manufacturing',
          share: 9.5,
          jobGrowth: 2.1,
          averageWage: 65000
        }
      ];
      
      // Generate income distribution
      const incomeDistribution = [
        { category: 'Under $25K', percentage: 14.2 },
        { category: '$25K-$50K', percentage: 22.5 },
        { category: '$50K-$75K', percentage: 20.8 },
        { category: '$75K-$100K', percentage: 18.5 },
        { category: '$100K-$150K', percentage: 15.6 },
        { category: 'Over $150K', percentage: 8.4 }
      ];
      
      // Generate property value correlations
      const propertyValueCorrelations: PropertyValueImpact[] = [
        {
          indicator: 'job-growth',
          region: regionId,
          impact: 0.82,
          confidenceLevel: 'high',
          lagPeriod: '3-6 months',
          explanation: 'Strong job growth typically precedes home value increases by 3-6 months as housing demand grows.'
        },
        {
          indicator: 'median-household-income',
          region: regionId,
          impact: 0.74,
          confidenceLevel: 'high',
          lagPeriod: '0-3 months',
          explanation: 'Rising incomes directly correlate with increasing home values as buyers can afford higher prices.'
        },
        {
          indicator: 'unemployment-rate',
          region: regionId,
          impact: -0.65,
          confidenceLevel: 'medium',
          lagPeriod: '3-6 months',
          explanation: 'Higher unemployment negatively impacts home values with a short lag as housing demand decreases.'
        },
        {
          indicator: 'population-growth',
          region: regionId,
          impact: 0.58,
          confidenceLevel: 'medium',
          lagPeriod: '6-12 months',
          explanation: 'Population growth typically precedes home value increases by 6-12 months as housing demand rises.'
        },
        {
          indicator: 'new-business-formation',
          region: regionId,
          impact: 0.62,
          confidenceLevel: 'medium',
          lagPeriod: '6-12 months',
          explanation: 'New businesses indicate economic vitality and create jobs, leading to increased housing demand.'
        }
      ];
      
      // Generate region comparisons for key metrics
      const regionComparisons = [
        {
          indicator: 'median-home-price',
          regions: ['richland-city', 'grandview-city', 'tri-cities-metro', 'wa-state'],
          regionNames: ['Richland', 'Grandview', 'Tri-Cities Metro', 'Washington State'],
          values: [350000, 285000, 325000, 450000]
        },
        {
          indicator: 'job-growth',
          regions: ['richland-city', 'grandview-city', 'tri-cities-metro', 'wa-state'],
          regionNames: ['Richland', 'Grandview', 'Tri-Cities Metro', 'Washington State'],
          values: [3.1, 1.8, 2.7, 2.5]
        },
        {
          indicator: 'median-household-income',
          regions: ['richland-city', 'grandview-city', 'tri-cities-metro', 'wa-state'],
          regionNames: ['Richland', 'Grandview', 'Tri-Cities Metro', 'Washington State'],
          values: [78500, 52000, 72000, 82400]
        }
      ];
      
      return {
        region,
        indicators: {
          employment: {
            unemploymentRate: unemploymentTrend.data[unemploymentTrend.data.length - 1],
            jobGrowth: jobGrowthTrend.data[jobGrowthTrend.data.length - 1],
            laborForceParticipation: laborForceTrend.data[laborForceTrend.data.length - 1],
            topIndustries
          },
          income: {
            medianHouseholdIncome: medianIncomeTrend.data[medianIncomeTrend.data.length - 1],
            perCapitaIncome: perCapitaIncomeTrend.data[perCapitaIncomeTrend.data.length - 1],
            wageGrowth: wageGrowthTrend.data[wageGrowthTrend.data.length - 1],
            incomeDistribution
          },
          housing: {
            medianHomePrice: homeValueTrend.data[homeValueTrend.data.length - 1],
            homeValueGrowth: homeGrowthTrend.data[homeGrowthTrend.data.length - 1],
            affordabilityIndex: affordabilityTrend.data[affordabilityTrend.data.length - 1],
            constructionPermits: constructionTrend.data[constructionTrend.data.length - 1]
          },
          business: {
            businessGrowth: businessGrowthTrend.data[businessGrowthTrend.data.length - 1],
            newBusinessFormation: newBusinessTrend.data[newBusinessTrend.data.length - 1]
          },
          demographic: {
            populationGrowth: populationTrend.data[populationTrend.data.length - 1]
          }
        },
        trends: {
          employment: [unemploymentTrend, jobGrowthTrend, laborForceTrend],
          income: [medianIncomeTrend, perCapitaIncomeTrend, wageGrowthTrend],
          housing: [homeValueTrend, homeGrowthTrend, affordabilityTrend, constructionTrend],
          business: [businessGrowthTrend, newBusinessTrend],
          demographic: [populationTrend]
        },
        propertyValueCorrelations,
        regionComparisons
      };
    } catch (error) {
      console.error('Error fetching economic dashboard data:', error);
      throw new Error('Failed to fetch economic dashboard data');
    }
  }

  /**
   * Get a correlation analysis between two economic indicators
   * @param indicatorX ID of first indicator
   * @param indicatorY ID of second indicator
   * @param regionId ID of the region
   * @param timeframe Timeframe for trend data
   * @returns Correlation analysis
   */
  async getCorrelationAnalysis(
    indicatorX: string,
    indicatorY: string,
    regionId: string,
    timeframe: string = 'year'
  ): Promise<CorrelationResult> {
    try {
      // In a production app, this would be an API call:
      // return await apiRequest.get('/api/economic-correlation', {
      //   params: { indicatorX, indicatorY, regionId, timeframe }
      // });
      
      // Demo implementation
      
      // Get trends for both indicators
      const trendX = await this.getIndicatorTrend({
        indicatorId: indicatorX,
        regionId,
        timeframe
      });
      
      const trendY = await this.getIndicatorTrend({
        indicatorId: indicatorY,
        regionId,
        timeframe
      });
      
      // Make sure we have the same number of data points
      const numPoints = Math.min(trendX.data.length, trendY.data.length);
      const dataX = trendX.data.slice(-numPoints);
      const dataY = trendY.data.slice(-numPoints);
      
      // Create scatter plot data
      const scatterPlotData = dataX.map((pointX, i) => ({
        x: pointX.value,
        y: dataY[i].value,
        date: pointX.date
      }));
      
      // Calculate correlation coefficient (simplified)
      const valuesX = dataX.map(d => d.value);
      const valuesY = dataY.map(d => d.value);
      
      const meanX = valuesX.reduce((sum, val) => sum + val, 0) / valuesX.length;
      const meanY = valuesY.reduce((sum, val) => sum + val, 0) / valuesY.length;
      
      let numerator = 0;
      let denominatorX = 0;
      let denominatorY = 0;
      
      for (let i = 0; i < valuesX.length; i++) {
        const xDiff = valuesX[i] - meanX;
        const yDiff = valuesY[i] - meanY;
        
        numerator += xDiff * yDiff;
        denominatorX += xDiff * xDiff;
        denominatorY += yDiff * yDiff;
      }
      
      const correlation = numerator / (Math.sqrt(denominatorX) * Math.sqrt(denominatorY));
      
      // Calculate regression line
      const slope = numerator / denominatorX;
      const intercept = meanY - slope * meanX;
      
      // Calculate R-squared
      const predicted = valuesX.map(x => slope * x + intercept);
      const ssTotal = valuesY.reduce((sum, y) => sum + Math.pow(y - meanY, 2), 0);
      const ssResidual = valuesY.reduce((sum, y, i) => sum + Math.pow(y - predicted[i], 2), 0);
      const r2 = 1 - (ssResidual / ssTotal);
      
      // Generate insight
      let insight = '';
      if (Math.abs(correlation) < 0.3) {
        insight = `There is a weak correlation between ${trendX.indicator.name} and ${trendY.indicator.name} in ${trendX.region.name}, suggesting these metrics don't significantly influence each other.`;
      } else if (Math.abs(correlation) < 0.7) {
        insight = `There is a moderate ${correlation > 0 ? 'positive' : 'negative'} correlation between ${trendX.indicator.name} and ${trendY.indicator.name} in ${trendX.region.name}, indicating some relationship between these metrics.`;
      } else {
        insight = `There is a strong ${correlation > 0 ? 'positive' : 'negative'} correlation between ${trendX.indicator.name} and ${trendY.indicator.name} in ${trendX.region.name}, suggesting that changes in one metric are closely related to changes in the other.`;
      }
      
      return {
        indicatorX,
        indicatorY,
        region: regionId,
        timeframe: timeframe as any,
        correlationCoefficient: correlation,
        significanceLevel: 0.05, // p-value (simplified)
        scatterPlotData,
        regressionLine: {
          slope,
          intercept,
          r2
        },
        insight
      };
    } catch (error) {
      console.error('Error calculating correlation:', error);
      throw new Error('Failed to calculate correlation analysis');
    }
  }
}

// Export singleton instance
const economicIndicatorsService = new EconomicIndicatorsService();
export default economicIndicatorsService;