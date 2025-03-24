/**
 * Economic Indicators Service
 * 
 * This service provides economic data for real estate market analysis,
 * including employment trends, income statistics, business development,
 * and other economic indicators at various geographic levels.
 */

export enum TrendDirection {
  UP_STRONG = 'up-strong',
  UP_MODERATE = 'up-moderate',
  STABLE = 'stable',
  DOWN_MODERATE = 'down-moderate',
  DOWN_STRONG = 'down-strong'
}

export interface EconomicTrend {
  direction: TrendDirection;
  percentChange: number;
  description: string;
}

export interface EmploymentData {
  unemploymentRate: number;
  employmentTrend: EconomicTrend;
  laborForceParticipation: number;
  majorEmployers: Array<{
    name: string;
    sector: string;
    employees: number;
  }>;
  sectorBreakdown: Array<{
    sector: string;
    percentage: number;
    trend: EconomicTrend;
  }>;
  jobGrowthRate: number;
}

export interface IncomeData {
  medianHouseholdIncome: number;
  incomeTrend: EconomicTrend;
  perCapitaIncome: number;
  incomeDistribution: Array<{
    range: string;
    percentage: number;
  }>;
  povertyRate: number;
  affordabilityIndex: number; // 0-100 (higher is more affordable)
  medianHomeValueToIncomeRatio: number;
}

export interface BusinessData {
  totalBusinesses: number;
  businessGrowthRate: number;
  businessTrend: EconomicTrend;
  newBusinessFormation: number;
  businessClosures: number;
  topGrowingSectors: Array<{
    sector: string;
    growthRate: number;
  }>;
  retailSalesTrend: EconomicTrend;
}

export interface HousingMarketData {
  constructionPermits: number;
  constructionTrend: EconomicTrend;
  vacancyRate: number;
  rentalMarketStrength: number; // 0-100 (higher is stronger)
  medianRent: number;
  rentTrend: EconomicTrend;
  housingAffordability: number; // 0-100 (higher is more affordable)
  homeownershipRate: number;
}

export interface EconomicIndicators {
  locationName: string;
  locationType: 'city' | 'county' | 'zip' | 'metro' | 'state';
  lastUpdated: string;
  overallEconomicHealth: number; // 0-100 score
  economicHealthTrend: EconomicTrend;
  employment: EmploymentData;
  income: IncomeData;
  business: BusinessData;
  housingMarket: HousingMarketData;
  dataQuality: number; // 0-100 score for data reliability
}

class EconomicIndicatorsService {
  private static instance: EconomicIndicatorsService;
  private apiUrl: string = '/api/economic-indicators';

  private constructor() {}

  public static getInstance(): EconomicIndicatorsService {
    if (!EconomicIndicatorsService.instance) {
      EconomicIndicatorsService.instance = new EconomicIndicatorsService();
    }
    return EconomicIndicatorsService.instance;
  }

  /**
   * Get economic indicators for a specific location
   */
  public async getEconomicIndicators(
    locationCode: string,
    locationType: 'city' | 'county' | 'zip' | 'metro' | 'state' = 'city'
  ): Promise<EconomicIndicators> {
    try {
      // For demo purposes - generate deterministic data based on location code
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.generateEconomicData(locationCode, locationType));
        }, 800);
      });
    } catch (error) {
      console.error('Error fetching economic indicators:', error);
      throw error;
    }
  }

  /**
   * Get economic comparisons between multiple locations
   */
  public async compareEconomicIndicators(
    locationCodes: string[],
    locationType: 'city' | 'county' | 'zip' | 'metro' | 'state' = 'city'
  ): Promise<EconomicIndicators[]> {
    try {
      const results: EconomicIndicators[] = [];
      
      for (const locationCode of locationCodes) {
        results.push(await this.getEconomicIndicators(locationCode, locationType));
      }
      
      return results;
    } catch (error) {
      console.error('Error comparing economic indicators:', error);
      throw error;
    }
  }

  /**
   * Get historical economic data for trend analysis
   */
  public async getHistoricalEconomicData(
    locationCode: string, 
    locationType: 'city' | 'county' | 'zip' | 'metro' | 'state' = 'city',
    years: number = 5
  ): Promise<{
    years: string[];
    unemploymentRate: number[];
    medianIncome: number[];
    businessGrowth: number[];
    housingPermits: number[];
    jobGrowth: number[];
  }> {
    try {
      return new Promise((resolve) => {
        setTimeout(() => {
          const currentYear = new Date().getFullYear();
          const yearsArr = Array.from(
            { length: years }, 
            (_, i) => (currentYear - years + 1 + i).toString()
          );
          
          // Base values - use locationCode hash for deterministic randomness
          const hash = this.hashString(locationCode);
          const baseUnemployment = 3 + (hash % 4); // 3-6%
          const baseIncome = 40000 + (hash % 40000); // $40k-$80k
          const baseBusinessGrowth = 1 + (hash % 4); // 1-4%
          const baseHousingPermits = 50 + (hash % 450); // 50-500
          const baseJobGrowth = 1 + (hash % 3); // 1-3%
          
          // Generate trend data with realistic fluctuations
          const unemploymentRate = yearsArr.map((year, i) => 
            Math.max(2, baseUnemployment - (i * 0.3) + (this.deterministicRandom(locationCode + year, -0.8, 0.8)))
          );
          
          const medianIncome = yearsArr.map((year, i) => 
            Math.round(baseIncome * (1 + (i * 0.03) + (this.deterministicRandom(locationCode + year, -0.01, 0.05))))
          );
          
          const businessGrowth = yearsArr.map((year, i) => 
            baseBusinessGrowth + (this.deterministicRandom(locationCode + year, -1, 1.5))
          );
          
          const housingPermits = yearsArr.map((year, i) => 
            Math.round(baseHousingPermits * (1 + (i * 0.04) + (this.deterministicRandom(locationCode + year, -0.2, 0.3))))
          );
          
          const jobGrowth = yearsArr.map((year, i) => 
            baseJobGrowth + (this.deterministicRandom(locationCode + year, -0.8, 1.2))
          );
          
          resolve({
            years: yearsArr,
            unemploymentRate,
            medianIncome,
            businessGrowth,
            housingPermits,
            jobGrowth
          });
        }, 600);
      });
    } catch (error) {
      console.error('Error fetching historical economic data:', error);
      throw error;
    }
  }

  /**
   * Generate sample economic data for demo purposes
   */
  private generateEconomicData(
    locationCode: string, 
    locationType: 'city' | 'county' | 'zip' | 'metro' | 'state'
  ): EconomicIndicators {
    // Use the locationCode to generate deterministic "random" values
    const hash = this.hashString(locationCode);
    
    // Adjust scale based on location type
    const locationScalar = locationType === 'city' ? 1 :
                          locationType === 'zip' ? 1.1 :
                          locationType === 'county' ? 1.2 :
                          locationType === 'metro' ? 1.4 :
                          locationType === 'state' ? 1.6 : 1;
    
    // Generate base metrics with appropriate ranges
    const unemploymentBase = 3 + (hash % 4); // 3-6%
    const unemploymentTrend = this.deterministicRandom(locationCode + 'uetrend', -0.5, 0.5);
    
    const incomeBase = 40000 + (hash % 40000); // $40k-$80k
    const incomeTrend = this.deterministicRandom(locationCode + 'inctrend', 0.5, 4.5);
    
    const businessGrowthBase = 1 + (hash % 4); // 1-4%
    const businessTrend = this.deterministicRandom(locationCode + 'biztrend', -1, 5);
    
    const constructionPermitsBase = 50 + (hash % 450); // 50-500
    const constructionTrend = this.deterministicRandom(locationCode + 'constrtrend', -5, 15);
    
    const locationName = this.getLocationName(locationCode, locationType);
    
    return {
      locationName,
      locationType,
      lastUpdated: new Date().toISOString(),
      overallEconomicHealth: 50 + (hash % 40), // 50-90
      economicHealthTrend: this.getTrendFromPercent(
        this.deterministicRandom(locationCode + 'ecohealth', -3, 6)
      ),
      
      employment: {
        unemploymentRate: unemploymentBase,
        employmentTrend: this.getTrendFromPercent(unemploymentTrend * -1), // Invert because lower unemployment is positive
        laborForceParticipation: 60 + (hash % 20), // 60-80%
        majorEmployers: [
          {
            name: this.getEmployerName(locationCode, 0),
            sector: this.getSectorName(locationCode, 0),
            employees: Math.round((500 + (hash % 2000)) * locationScalar)
          },
          {
            name: this.getEmployerName(locationCode, 1),
            sector: this.getSectorName(locationCode, 1),
            employees: Math.round((400 + (hash % 1500)) * locationScalar)
          },
          {
            name: this.getEmployerName(locationCode, 2),
            sector: this.getSectorName(locationCode, 2),
            employees: Math.round((300 + (hash % 1000)) * locationScalar)
          }
        ],
        sectorBreakdown: [
          {
            sector: 'Healthcare',
            percentage: 10 + (hash % 15),
            trend: this.getTrendFromPercent(this.deterministicRandom(locationCode + 'health', -1, 5))
          },
          {
            sector: 'Retail',
            percentage: 8 + (hash % 12),
            trend: this.getTrendFromPercent(this.deterministicRandom(locationCode + 'retail', -3, 2))
          },
          {
            sector: 'Manufacturing',
            percentage: 5 + (hash % 15),
            trend: this.getTrendFromPercent(this.deterministicRandom(locationCode + 'manuf', -4, 3))
          },
          {
            sector: 'Education',
            percentage: 7 + (hash % 10),
            trend: this.getTrendFromPercent(this.deterministicRandom(locationCode + 'edu', -1, 3))
          },
          {
            sector: 'Technology',
            percentage: 3 + (hash % 12),
            trend: this.getTrendFromPercent(this.deterministicRandom(locationCode + 'tech', 0, 7))
          }
        ],
        jobGrowthRate: 1 + this.deterministicRandom(locationCode + 'jobgrowth', -0.5, 3)
      },
      
      income: {
        medianHouseholdIncome: Math.round(incomeBase * locationScalar),
        incomeTrend: this.getTrendFromPercent(incomeTrend),
        perCapitaIncome: Math.round((incomeBase * 0.4) * locationScalar),
        incomeDistribution: [
          { range: '<$25K', percentage: 10 + (hash % 15) },
          { range: '$25K-$50K', percentage: 15 + (hash % 15) },
          { range: '$50K-$75K', percentage: 20 + (hash % 15) },
          { range: '$75K-$100K', percentage: 15 + (hash % 15) },
          { range: '$100K-$150K', percentage: 10 + (hash % 15) },
          { range: '>$150K', percentage: 5 + (hash % 15) }
        ],
        povertyRate: 5 + (hash % 10),
        affordabilityIndex: 50 + (hash % 40),
        medianHomeValueToIncomeRatio: 2.5 + this.deterministicRandom(locationCode + 'homeratio', 0, 5)
      },
      
      business: {
        totalBusinesses: Math.round((500 + (hash % 4500)) * locationScalar),
        businessGrowthRate: businessGrowthBase,
        businessTrend: this.getTrendFromPercent(businessTrend),
        newBusinessFormation: Math.round((20 + (hash % 80)) * locationScalar),
        businessClosures: Math.round((10 + (hash % 40)) * locationScalar),
        topGrowingSectors: [
          { 
            sector: this.getSectorName(locationCode, 3), 
            growthRate: 3 + this.deterministicRandom(locationCode + 'sector3', 0, 7) 
          },
          { 
            sector: this.getSectorName(locationCode, 4), 
            growthRate: 2 + this.deterministicRandom(locationCode + 'sector4', 0, 6) 
          },
          { 
            sector: this.getSectorName(locationCode, 5), 
            growthRate: 1 + this.deterministicRandom(locationCode + 'sector5', 0, 5) 
          }
        ],
        retailSalesTrend: this.getTrendFromPercent(
          this.deterministicRandom(locationCode + 'retail', -2, 5)
        )
      },
      
      housingMarket: {
        constructionPermits: Math.round(constructionPermitsBase * locationScalar),
        constructionTrend: this.getTrendFromPercent(constructionTrend),
        vacancyRate: 3 + this.deterministicRandom(locationCode + 'vacancy', -1, 7),
        rentalMarketStrength: 50 + (hash % 40),
        medianRent: Math.round(((800 + (hash % 1200)) * locationScalar)),
        rentTrend: this.getTrendFromPercent(
          this.deterministicRandom(locationCode + 'rent', 0, 6)
        ),
        housingAffordability: 40 + (hash % 50),
        homeownershipRate: 55 + (hash % 30)
      },
      
      dataQuality: 70 + (hash % 25) // 70-95
    };
  }

  /**
   * Simple string hash function for deterministic "randomness"
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate a deterministic "random" number in a range based on a seed
   */
  private deterministicRandom(seed: string, min: number, max: number): number {
    const hash = this.hashString(seed);
    return min + (hash % 1000) / 1000 * (max - min);
  }

  /**
   * Convert a percentage change to a trend direction
   */
  private getTrendFromPercent(percentChange: number): EconomicTrend {
    let direction: TrendDirection;
    
    if (percentChange <= -3) {
      direction = TrendDirection.DOWN_STRONG;
    } else if (percentChange < 0) {
      direction = TrendDirection.DOWN_MODERATE;
    } else if (percentChange < 1) {
      direction = TrendDirection.STABLE;
    } else if (percentChange < 3) {
      direction = TrendDirection.UP_MODERATE;
    } else {
      direction = TrendDirection.UP_STRONG;
    }
    
    let description = '';
    switch (direction) {
      case TrendDirection.UP_STRONG:
        description = 'Strong growth';
        break;
      case TrendDirection.UP_MODERATE:
        description = 'Moderate growth';
        break;
      case TrendDirection.STABLE:
        description = 'Stable';
        break;
      case TrendDirection.DOWN_MODERATE:
        description = 'Moderate decline';
        break;
      case TrendDirection.DOWN_STRONG:
        description = 'Strong decline';
        break;
    }
    
    return {
      direction,
      percentChange: Number(percentChange.toFixed(1)),
      description
    };
  }

  /**
   * Get a simulated location name
   */
  private getLocationName(code: string, type: string): string {
    const cityNames = ['Grandview', 'Sunnyside', 'Yakima', 'Prosser', 'Zillah', 'Toppenish', 'Richland', 'Pasco', 'Kennewick'];
    const countyNames = ['Yakima County', 'Benton County', 'Franklin County', 'Grant County', 'Kittitas County'];
    const zipCodes = ['98930', '98944', '98901', '98901', '98953', '98948', '99352', '99301', '99336'];
    const metroNames = ['Yakima Metro', 'Tri-Cities Metro', 'Ellensburg Metro', 'Moses Lake Metro'];
    const stateNames = ['Washington', 'Oregon', 'Idaho', 'California', 'Nevada'];
    
    const hash = this.hashString(code);
    
    if (type === 'city') {
      return cityNames[hash % cityNames.length];
    } else if (type === 'county') {
      return countyNames[hash % countyNames.length];
    } else if (type === 'zip') {
      return zipCodes[hash % zipCodes.length];
    } else if (type === 'metro') {
      return metroNames[hash % metroNames.length];
    } else if (type === 'state') {
      return stateNames[hash % stateNames.length];
    } else {
      return 'Unknown Location';
    }
  }

  /**
   * Get a simulated employer name
   */
  private getEmployerName(seed: string, index: number): string {
    const employers = [
      ['Memorial Hospital', 'Regional Medical Center', 'Community Health Systems', 'St. Mary\'s Hospital', 'Valley Medical Center'],
      ['School District #123', 'County Public Schools', 'State University', 'Community College', 'Technical Institute'],
      ['City Government', 'County Administration', 'Public Works Department', 'Parks & Recreation', 'Sheriff\'s Department'],
      ['First National Bank', 'Community Bank & Trust', 'Pacific Credit Union', 'Valley Financial', 'Mountain Savings'],
      ['Hometown Foods', 'Valley Grocery', 'Cascade Foods', 'Pacific Agricultural', 'Northwest Farms'],
      ['Northwest Manufacturing', 'Valley Fabricators', 'Pacific Industries', 'Precision Components', 'Tech Innovations'],
      ['Regional Distributors', 'Valley Logistics', 'Pacific Transport', 'Northwest Shipping', 'Mountain Warehousing'],
      ['TechSoft Solutions', 'Digital Innovations', 'Pacific Systems', 'Northwest Technologies', 'Valley IT Services'],
      ['Valley Retail Group', 'Cascade Shopping Centers', 'Pacific Retail', 'Mountain Stores', 'Northwest Outlets']
    ];
    
    const hash = this.hashString(seed + index.toString());
    const groupIndex = hash % employers.length;
    const nameIndex = (hash + index) % employers[groupIndex].length;
    
    return employers[groupIndex][nameIndex];
  }

  /**
   * Get a simulated business sector
   */
  private getSectorName(seed: string, index: number): string {
    const sectors = [
      'Healthcare',
      'Education',
      'Government',
      'Financial Services',
      'Agriculture',
      'Manufacturing',
      'Logistics',
      'Technology',
      'Retail',
      'Construction',
      'Hospitality',
      'Energy',
      'Professional Services',
      'Real Estate'
    ];
    
    const hash = this.hashString(seed + index.toString());
    return sectors[hash % sectors.length];
  }
}

export const economicIndicatorsService = EconomicIndicatorsService.getInstance();
export default economicIndicatorsService;