/**
 * Integrated Property Data Service
 * 
 * This service integrates property data with school district analysis and
 * economic indicators to provide a comprehensive view of properties.
 */

import schoolDistrictService, { 
  School, 
  SchoolDistrict 
} from './school-district.service';
import economicIndicatorsService, {
  EconomicRegion,
  EconomicIndicator,
  EconomicDashboardData
} from './economic-indicators.service';
import { apiRequest } from '@/lib/queryClient';

// Define the hazard risk assessment types
export enum RiskLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
  EXTREME = 'extreme'
}

export enum MarketPhase {
  RECOVERY = 'recovery',
  EXPANSION = 'expansion',
  HYPER_SUPPLY = 'hyper_supply',
  RECESSION = 'recession'
}

// Natural hazard risk types
export interface NaturalHazardRisk {
  floodRisk: RiskLevel;
  wildfireRisk: RiskLevel;
  earthquakeRisk: RiskLevel;
  hurricaneRisk?: RiskLevel;
  tornadoRisk?: RiskLevel;
  droughtRisk?: RiskLevel;
  overallRisk: RiskLevel;
  riskScores: {
    flood: number; // 0-100
    wildfire: number; // 0-100
    earthquake: number; // 0-100
    hurricane?: number; // 0-100
    tornado?: number; // 0-100
    drought?: number; // 0-100
    overall: number; // 0-100
  };
  riskDescription: string;
  mitigationTips: string[];
  insuranceImpact: {
    estimatedPremiumIncrease: number; // percentage
    coverageRecommendations: string[];
  };
}

// Market cycle prediction types
export interface MarketCyclePrediction {
  currentPhase: MarketPhase;
  nextPhase: MarketPhase;
  phaseDescription: string;
  estimatedTimeToNextPhase: number; // in months
  confidenceLevel: number; // 0-100
  keyIndicators: {
    name: string;
    trend: 'up' | 'down' | 'stable';
    impact: 'positive' | 'negative' | 'neutral';
    weight: number; // 0-1
  }[];
  investmentStrategyRecommendations: string[];
  historicalCycleComparison: {
    similarHistoricalPeriod: string;
    similarityScore: number; // 0-100
    outcomeDescription: string;
  };
}

// Property with integrated data
export interface IntegratedPropertyData {
  // Base property info
  propertyId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize: number;
  propertyType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  
  // School district info
  schoolDistrict?: SchoolDistrict;
  nearbySchools?: School[];
  schoolScorecard?: {
    averageRating: number; // 0-10
    bestSchoolName: string;
    bestSchoolRating: number;
    studentTeacherRatioAvg: number;
    distanceToNearestSchool: number; // miles
    schoolQualityImpactOnValue: number; // percentage
  };
  
  // Economic indicators
  economicIndicators?: {
    regionName: string;
    unemployment: number; // percentage
    jobGrowth: number; // percentage
    medianHouseholdIncome: number;
    medianHomePrice: number;
    homeValueGrowth: number; // percentage
    affordabilityIndex: number;
    economicHealthScore: number; // 0-100
    economicOutlook: 'improving' | 'stable' | 'declining';
  };
  
  // Natural hazard risks
  naturalHazardRisks?: NaturalHazardRisk;
  
  // Market cycle prediction
  marketCyclePrediction?: MarketCyclePrediction;
  
  // Investment metrics
  investmentMetrics?: {
    estimatedRentalIncome: number;
    capRate: number; // percentage
    cashOnCashReturn: number; // percentage
    breakEvenPoint: number; // months
    priceToIncomeRatio: number;
    priceToRentRatio: number;
    appreciationPotential: number; // percentage over 5 years
    overallInvestmentScore: number; // 0-100
  };
}

export interface PropertySearchParams {
  city?: string;
  state?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  propertyType?: string;
  nearSchoolId?: string;
  minSchoolRating?: number;
  maxFloodRisk?: RiskLevel;
  economicOutlook?: 'improving' | 'stable' | 'declining';
  sort?: string;
}

class IntegratedPropertyDataService {
  private static instance: IntegratedPropertyDataService;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): IntegratedPropertyDataService {
    if (!IntegratedPropertyDataService.instance) {
      IntegratedPropertyDataService.instance = new IntegratedPropertyDataService();
    }
    return IntegratedPropertyDataService.instance;
  }
  
  /**
   * Get integrated property data by ID
   * @param propertyId The property ID
   * @returns Integrated property data
   */
  async getPropertyById(propertyId: string): Promise<IntegratedPropertyData> {
    try {
      // In a production app, we would fetch from API:
      // const property = await apiRequest.get(`/api/properties/${propertyId}`);
      
      // For demo purposes, we'll generate mock data
      const property: IntegratedPropertyData = {
        propertyId,
        address: '123 Main St',
        city: 'Richland',
        state: 'WA',
        zip: '99352',
        price: 375000,
        bedrooms: 4,
        bathrooms: 2.5,
        squareFeet: 2200,
        yearBuilt: 2005,
        lotSize: 0.25,
        propertyType: 'single_family',
        location: {
          latitude: 46.2851,
          longitude: -119.2754
        }
      };
      
      // Enhance with school district data
      await this.enhanceWithSchoolData(property);
      
      // Enhance with economic indicators
      await this.enhanceWithEconomicData(property);
      
      // Add natural hazard risk assessment
      await this.enhanceWithHazardRiskData(property);
      
      // Add market cycle prediction
      await this.enhanceWithMarketCyclePrediction(property);
      
      // Add investment metrics
      this.calculateInvestmentMetrics(property);
      
      return property;
    } catch (error) {
      console.error('Error fetching integrated property data:', error);
      throw new Error('Failed to fetch property data');
    }
  }
  
  /**
   * Search for properties with integrated data
   * @param params Search parameters
   * @returns Array of integrated property data
   */
  async searchProperties(params: PropertySearchParams): Promise<IntegratedPropertyData[]> {
    try {
      // In a production app, we would fetch from API with all params:
      // const properties = await apiRequest.get('/api/properties', { params });
      
      // For demo purposes, we'll generate sample data
      const properties: IntegratedPropertyData[] = [];
      
      // Generate different properties based on city/state params
      const city = params.city || 'Richland';
      const state = params.state || 'WA';
      
      // Property details vary by city
      if (city === 'Richland' && state === 'WA') {
        properties.push({
          propertyId: 'rich-1',
          address: '2204 Hill Dr',
          city: 'Richland',
          state: 'WA',
          zip: '99352',
          price: 425000,
          bedrooms: 4,
          bathrooms: 3,
          squareFeet: 2500,
          yearBuilt: 2010,
          lotSize: 0.28,
          propertyType: 'single_family',
          location: {
            latitude: 46.2851,
            longitude: -119.2754
          }
        });
        
        properties.push({
          propertyId: 'rich-2',
          address: '1842 Birch Ave',
          city: 'Richland',
          state: 'WA',
          zip: '99352',
          price: 380000,
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1950,
          yearBuilt: 2000,
          lotSize: 0.22,
          propertyType: 'single_family',
          location: {
            latitude: 46.2836,
            longitude: -119.2805
          }
        });
        
        properties.push({
          propertyId: 'rich-3',
          address: '534 Cedar Lane',
          city: 'Richland',
          state: 'WA',
          zip: '99352',
          price: 520000,
          bedrooms: 5,
          bathrooms: 3.5,
          squareFeet: 3200,
          yearBuilt: 2018,
          lotSize: 0.32,
          propertyType: 'single_family',
          location: {
            latitude: 46.2792,
            longitude: -119.2881
          }
        });
      } else if (city === 'Grandview' && state === 'WA') {
        properties.push({
          propertyId: 'gv-1',
          address: '514 Elm Street',
          city: 'Grandview',
          state: 'WA',
          zip: '98930',
          price: 285000,
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1800,
          yearBuilt: 1995,
          lotSize: 0.25,
          propertyType: 'single_family',
          location: {
            latitude: 46.2551,
            longitude: -119.9105
          }
        });
        
        properties.push({
          propertyId: 'gv-2',
          address: '123 Washington Ave',
          city: 'Grandview',
          state: 'WA',
          zip: '98930',
          price: 240000,
          bedrooms: 3,
          bathrooms: 1.5,
          squareFeet: 1450,
          yearBuilt: 1980,
          lotSize: 0.18,
          propertyType: 'single_family',
          location: {
            latitude: 46.2534,
            longitude: -119.9126
          }
        });
      } else {
        // Default properties if city/state not specified
        properties.push({
          propertyId: 'default-1',
          address: '456 Oak St',
          city: 'Example City',
          state: 'WA',
          zip: '12345',
          price: 350000,
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1800,
          yearBuilt: 2000,
          lotSize: 0.2,
          propertyType: 'single_family',
          location: {
            latitude: 47.0,
            longitude: -120.0
          }
        });
      }
      
      // Enhance all properties with school, economic, hazard, and market data
      for (const property of properties) {
        await this.enhanceWithSchoolData(property);
        await this.enhanceWithEconomicData(property);
        await this.enhanceWithHazardRiskData(property);
        await this.enhanceWithMarketCyclePrediction(property);
        this.calculateInvestmentMetrics(property);
      }
      
      // Apply filtering based on search params
      const filteredProperties = properties.filter(property => {
        // Filter by price range
        if (params.minPrice && property.price < params.minPrice) return false;
        if (params.maxPrice && property.price > params.maxPrice) return false;
        
        // Filter by bedrooms
        if (params.bedrooms && property.bedrooms < params.bedrooms) return false;
        
        // Filter by bathrooms
        if (params.bathrooms && property.bathrooms < params.bathrooms) return false;
        
        // Filter by square feet
        if (params.minSquareFeet && property.squareFeet < params.minSquareFeet) return false;
        if (params.maxSquareFeet && property.squareFeet > params.maxSquareFeet) return false;
        
        // Filter by property type
        if (params.propertyType && property.propertyType !== params.propertyType) return false;
        
        // Filter by school rating
        if (params.minSchoolRating && 
            (!property.schoolScorecard || 
             property.schoolScorecard.averageRating < params.minSchoolRating)) {
          return false;
        }
        
        // Filter by flood risk
        if (params.maxFloodRisk && 
            property.naturalHazardRisks && 
            this.getRiskLevelValue(property.naturalHazardRisks.floodRisk) > 
            this.getRiskLevelValue(params.maxFloodRisk)) {
          return false;
        }
        
        // Filter by economic outlook
        if (params.economicOutlook && 
            property.economicIndicators && 
            property.economicIndicators.economicOutlook !== params.economicOutlook) {
          return false;
        }
        
        return true;
      });
      
      // Sort properties if sort parameter is provided
      if (params.sort) {
        this.sortProperties(filteredProperties, params.sort);
      }
      
      return filteredProperties;
    } catch (error) {
      console.error('Error searching properties:', error);
      throw new Error('Failed to search properties');
    }
  }
  
  /**
   * Get natural hazard risk assessment for a property
   * @param latitude Property latitude
   * @param longitude Property longitude
   * @returns Natural hazard risk assessment
   */
  async getNaturalHazardRisks(
    latitude: number, 
    longitude: number
  ): Promise<NaturalHazardRisk> {
    try {
      // In a production app, this would call an external risk assessment API:
      // return await apiRequest.get('/api/hazards/assessment', { 
      //   params: { latitude, longitude } 
      // });
      
      // For demo purposes, we'll generate demo risk assessment based on location
      
      // Richland, WA area coords
      const isRichlandArea = Math.abs(latitude - 46.28) < 0.1 && 
                              Math.abs(longitude - (-119.28)) < 0.2;
                                
      // Grandview, WA area coords
      const isGrandviewArea = Math.abs(latitude - 46.25) < 0.1 && 
                               Math.abs(longitude - (-119.91)) < 0.2;
                                 
      let floodRisk: RiskLevel;
      let floodScore: number;
      let wildfireRisk: RiskLevel;
      let wildfireScore: number;
      let earthquakeRisk: RiskLevel;
      let earthquakeScore: number;
      let droughtRisk: RiskLevel;
      let droughtScore: number;
      
      // Customize risks based on area
      if (isRichlandArea) {
        // Richland is near the Columbia River, so moderate flood risk
        floodRisk = RiskLevel.MODERATE;
        floodScore = 45;
        
        // Lower wildfire risk in urban areas, but still present in Washington
        wildfireRisk = RiskLevel.LOW;
        wildfireScore = 25;
        
        // Pacific Northwest has earthquake risk
        earthquakeRisk = RiskLevel.MODERATE;
        earthquakeScore = 40;
        
        // Eastern Washington can have drought conditions
        droughtRisk = RiskLevel.MODERATE;
        droughtScore = 50;
      } else if (isGrandviewArea) {
        // Grandview has farmland with irrigation systems
        floodRisk = RiskLevel.LOW;
        floodScore = 20;
        
        // More rural area with more vegetation and drier conditions
        wildfireRisk = RiskLevel.MODERATE;
        wildfireScore = 55;
        
        // Similar earthquake risk as Richland
        earthquakeRisk = RiskLevel.MODERATE;
        earthquakeScore = 35;
        
        // Higher drought risk in agricultural areas
        droughtRisk = RiskLevel.HIGH;
        droughtScore = 70;
      } else {
        // Default values for unknown areas
        floodRisk = RiskLevel.MODERATE;
        floodScore = 40;
        wildfireRisk = RiskLevel.MODERATE;
        wildfireScore = 40;
        earthquakeRisk = RiskLevel.MODERATE;
        earthquakeScore = 40;
        droughtRisk = RiskLevel.MODERATE;
        droughtScore = 40;
      }
      
      // Calculate overall risk
      const overallScore = Math.ceil(
        (floodScore + wildfireScore + earthquakeScore + droughtScore) / 4
      );
      
      let overallRisk: RiskLevel;
      if (overallScore < 20) overallRisk = RiskLevel.LOW;
      else if (overallScore < 40) overallRisk = RiskLevel.MODERATE;
      else if (overallScore < 60) overallRisk = RiskLevel.HIGH;
      else if (overallScore < 80) overallRisk = RiskLevel.VERY_HIGH;
      else overallRisk = RiskLevel.EXTREME;
      
      // Generate risk descriptions and mitigation tips
      const floodDescription = this.getFloodRiskDescription(floodRisk);
      const wildfireDescription = this.getWildfireRiskDescription(wildfireRisk);
      const earthquakeDescription = this.getEarthquakeRiskDescription(earthquakeRisk);
      
      const riskDescription = `This property has an overall ${overallRisk.toLowerCase()} natural hazard risk with ${floodDescription}, ${wildfireDescription}, and ${earthquakeDescription}.`;
      
      // Generate mitigation tips based on highest risks
      const mitigationTips: string[] = [];
      
      if (floodScore > 30) {
        mitigationTips.push('Consider flood insurance and elevating utilities above potential flood levels.');
        mitigationTips.push('Install backflow preventers on sewer lines and maintain proper drainage around the property.');
      }
      
      if (wildfireScore > 30) {
        mitigationTips.push('Create a defensible space by clearing vegetation within 30 feet of structures.');
        mitigationTips.push('Use fire-resistant building materials for roofing, siding, and decks.');
      }
      
      if (earthquakeScore > 30) {
        mitigationTips.push('Secure heavy furniture and appliances to walls to prevent tipping during earthquakes.');
        mitigationTips.push('Consider a seismic retrofit assessment, especially for older structures.');
      }
      
      if (droughtScore > 30) {
        mitigationTips.push('Install drought-resistant landscaping to reduce water needs and fire risk.');
        mitigationTips.push('Consider rainwater harvesting systems and high-efficiency appliances.');
      }
      
      // Calculate estimated insurance premium impact
      const premiumIncrease = Math.ceil(overallScore / 10) * 2; // 0-20% increase based on risk
      
      return {
        floodRisk,
        wildfireRisk,
        earthquakeRisk,
        droughtRisk,
        overallRisk,
        riskScores: {
          flood: floodScore,
          wildfire: wildfireScore,
          earthquake: earthquakeScore,
          drought: droughtScore,
          overall: overallScore
        },
        riskDescription,
        mitigationTips,
        insuranceImpact: {
          estimatedPremiumIncrease: premiumIncrease,
          coverageRecommendations: [
            floodRisk !== RiskLevel.LOW ? 'Flood insurance policy' : 'Standard homeowner policy',
            earthquakeRisk !== RiskLevel.LOW ? 'Earthquake insurance rider' : 'Standard foundation coverage'
          ]
        }
      };
    } catch (error) {
      console.error('Error getting natural hazard risks:', error);
      throw new Error('Failed to get natural hazard risk assessment');
    }
  }
  
  /**
   * Get market cycle prediction for a property's area
   * @param city City name
   * @param state State code
   * @returns Market cycle prediction
   */
  async getMarketCyclePrediction(city: string, state: string): Promise<MarketCyclePrediction> {
    try {
      // In a production app, this would call an API with ML backend:
      // return await apiRequest.get('/api/market/cycle-prediction', { 
      //   params: { city, state } 
      // });
      
      // For demo purposes, we'll provide customized predictions based on city
      let currentPhase: MarketPhase;
      let nextPhase: MarketPhase;
      let phaseDescription: string;
      let timeToNextPhase: number;
      let confidenceLevel: number;
      let keyIndicators: MarketCyclePrediction['keyIndicators'];
      let historicalPeriod: string;
      let similarityScore: number;
      let outcomeDescription: string;
      let recommendations: string[];
      
      if (city === 'Richland' && state === 'WA') {
        // Richland market prediction
        currentPhase = MarketPhase.EXPANSION;
        nextPhase = MarketPhase.HYPER_SUPPLY;
        phaseDescription = "Richland is in an expansion phase characterized by declining vacancy rates, increasing rent growth, and new construction. Property values are appreciating at above-inflation rates, and market sentiment is positive.";
        timeToNextPhase = 18; // 18 months until hyper supply
        confidenceLevel = 78;
        
        keyIndicators = [
          {
            name: "Job Growth",
            trend: "up",
            impact: "positive",
            weight: 0.25
          },
          {
            name: "Housing Affordability",
            trend: "down",
            impact: "negative",
            weight: 0.20
          },
          {
            name: "New Construction Permits",
            trend: "up",
            impact: "negative",
            weight: 0.20
          },
          {
            name: "Days on Market",
            trend: "down",
            impact: "positive",
            weight: 0.15
          },
          {
            name: "Price to Income Ratio",
            trend: "up",
            impact: "negative",
            weight: 0.20
          }
        ];
        
        historicalPeriod = "2016-2018 Pacific Northwest markets";
        similarityScore = 82;
        outcomeDescription = "Similar historical markets saw 3-5 years of sustained growth followed by a brief period of price stabilization before continuing upward.";
        
        recommendations = [
          "Consider buying or holding as property values are likely to continue appreciating",
          "Look for properties with value-add potential to maximize returns in the expansion phase",
          "Invest in areas with strong job growth and limited new construction",
          "Be cautious of overpaying in rapidly appreciating neighborhoods"
        ];
      } else if (city === 'Grandview' && state === 'WA') {
        // Grandview market prediction
        currentPhase = MarketPhase.RECOVERY;
        nextPhase = MarketPhase.EXPANSION;
        phaseDescription = "Grandview is in a recovery phase with gradually improving market fundamentals. Occupancy rates are climbing, rent growth is beginning to accelerate, and property values are starting to appreciate more consistently.";
        timeToNextPhase = 12; // 12 months until expansion
        confidenceLevel = 72;
        
        keyIndicators = [
          {
            name: "Agricultural Employment",
            trend: "stable",
            impact: "neutral",
            weight: 0.20
          },
          {
            name: "Housing Affordability",
            trend: "stable",
            impact: "positive",
            weight: 0.25
          },
          {
            name: "Population Growth",
            trend: "up",
            impact: "positive",
            weight: 0.20
          },
          {
            name: "Median Home Price",
            trend: "up",
            impact: "positive",
            weight: 0.20
          },
          {
            name: "New Business Formation",
            trend: "up",
            impact: "positive",
            weight: 0.15
          }
        ];
        
        historicalPeriod = "2011-2013 rural agricultural markets";
        similarityScore = 76;
        outcomeDescription = "Similar historical markets typically experienced 2-3 years of recovery before entering a sustained expansion phase lasting 5-7 years.";
        
        recommendations = [
          "Good time to buy as property values are likely to increase more rapidly in the coming phase",
          "Look for undervalued properties with good fundamentals",
          "Consider properties with proximity to expanding agricultural businesses",
          "Focus on rental properties serving essential workers in the agricultural sector"
        ];
      } else {
        // Default market prediction
        currentPhase = MarketPhase.EXPANSION;
        nextPhase = MarketPhase.HYPER_SUPPLY;
        phaseDescription = "The market is in an expansion phase characterized by declining vacancy rates, increasing rent growth, and new construction. Property values are appreciating at above-inflation rates.";
        timeToNextPhase = 24;
        confidenceLevel = 65;
        
        keyIndicators = [
          {
            name: "Job Growth",
            trend: "up",
            impact: "positive",
            weight: 0.25
          },
          {
            name: "Housing Affordability",
            trend: "down",
            impact: "negative",
            weight: 0.20
          },
          {
            name: "New Construction",
            trend: "up",
            impact: "negative",
            weight: 0.20
          },
          {
            name: "Days on Market",
            trend: "down",
            impact: "positive",
            weight: 0.15
          },
          {
            name: "Price to Income Ratio",
            trend: "up",
            impact: "negative",
            weight: 0.20
          }
        ];
        
        historicalPeriod = "2015-2017 national markets";
        similarityScore = 70;
        outcomeDescription = "Similar historical markets experienced 3-4 years of expansion before transitioning to a hyper supply phase with stabilizing prices.";
        
        recommendations = [
          "Consider buying or holding as property values are likely to continue appreciating in the near term",
          "Be selective with investments and focus on properties with strong fundamentals",
          "Monitor local construction activity as a potential early warning of oversupply",
          "Consider shorter-hold strategies as the market approaches the later stage of expansion"
        ];
      }
      
      return {
        currentPhase,
        nextPhase,
        phaseDescription,
        estimatedTimeToNextPhase: timeToNextPhase,
        confidenceLevel,
        keyIndicators,
        investmentStrategyRecommendations: recommendations,
        historicalCycleComparison: {
          similarHistoricalPeriod: historicalPeriod,
          similarityScore,
          outcomeDescription
        }
      };
    } catch (error) {
      console.error('Error getting market cycle prediction:', error);
      throw new Error('Failed to get market cycle prediction');
    }
  }
  
  /**
   * Enhance property with school district data
   * @param property Property to enhance
   */
  private async enhanceWithSchoolData(property: IntegratedPropertyData): Promise<void> {
    try {
      // Get nearby schools
      const nearbySchools = await schoolDistrictService.getSchoolsNearProperty(
        property.location.latitude,
        property.location.longitude,
        2 // 2 mile radius
      );
      
      if (nearbySchools.length > 0) {
        // Get school district
        const schoolDistricts = await schoolDistrictService.getSchoolDistricts(
          property.city,
          property.state
        );
        
        // Set school district info if available
        if (schoolDistricts.length > 0) {
          property.schoolDistrict = schoolDistricts[0];
        }
        
        // Set nearby schools
        property.nearbySchools = nearbySchools;
        
        // Calculate school scorecard
        const ratings = nearbySchools.map(school => school.rating);
        const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        
        const ratios = nearbySchools.map(school => school.studentTeacherRatio);
        const avgRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
        
        // Find best school
        const bestSchool = nearbySchools.reduce(
          (best, current) => current.rating > best.rating ? current : best,
          nearbySchools[0]
        );
        
        // Calculate distance to nearest school
        const distances = nearbySchools.map(school => 
          this.calculateDistance(
            property.location.latitude, 
            property.location.longitude,
            school.location.latitude,
            school.location.longitude
          )
        );
        const minDistance = Math.min(...distances);
        
        // Estimate school quality impact on property value
        // Higher impact for elementary and middle schools than high schools
        const elementarySchools = nearbySchools.filter(s => s.type === 'elementary');
        const middleSchools = nearbySchools.filter(s => s.type === 'middle');
        
        let valueImpact = 0;
        
        if (elementarySchools.length > 0) {
          const elemRatings = elementarySchools.map(s => s.rating);
          const avgElemRating = elemRatings.reduce((sum, r) => sum + r, 0) / elemRatings.length;
          // Elementary schools typically have the highest impact on home values
          valueImpact += (avgElemRating / 10) * 10; // Up to 10% impact
        }
        
        if (middleSchools.length > 0) {
          const midRatings = middleSchools.map(s => s.rating);
          const avgMidRating = midRatings.reduce((sum, r) => sum + r, 0) / midRatings.length;
          // Middle schools have moderate impact
          valueImpact += (avgMidRating / 10) * 5; // Up to 5% impact
        }
        
        // High schools have less direct impact on home values
        if (nearbySchools.some(s => s.type === 'high')) {
          const highSchools = nearbySchools.filter(s => s.type === 'high');
          const highRatings = highSchools.map(s => s.rating);
          const avgHighRating = highRatings.reduce((sum, r) => sum + r, 0) / highRatings.length;
          valueImpact += (avgHighRating / 10) * 3; // Up to 3% impact
        }
        
        // Set school scorecard
        property.schoolScorecard = {
          averageRating: avgRating,
          bestSchoolName: bestSchool.name,
          bestSchoolRating: bestSchool.rating,
          studentTeacherRatioAvg: avgRatio,
          distanceToNearestSchool: minDistance,
          schoolQualityImpactOnValue: valueImpact
        };
      }
    } catch (error) {
      console.error('Error enhancing property with school data:', error);
      // Don't throw, allow continuing with other enhancements
    }
  }
  
  /**
   * Enhance property with economic indicators
   * @param property Property to enhance
   */
  private async enhanceWithEconomicData(property: IntegratedPropertyData): Promise<void> {
    try {
      // Get economic regions
      const regions = await economicIndicatorsService.getRegions();
      
      // Find region matching property city
      const matchingRegion = regions.find(region => 
        region.name.toLowerCase() === property.city.toLowerCase() && 
        region.state === property.state
      );
      
      if (matchingRegion) {
        // Get economic dashboard data
        const dashboardData = await economicIndicatorsService.getDashboardData(
          matchingRegion.id,
          'year'
        );
        
        // Create economic indicators summary
        property.economicIndicators = {
          regionName: dashboardData.region.name,
          unemployment: dashboardData.indicators.employment.unemploymentRate.value,
          jobGrowth: dashboardData.indicators.employment.jobGrowth.value,
          medianHouseholdIncome: dashboardData.indicators.income.medianHouseholdIncome.value,
          medianHomePrice: dashboardData.indicators.housing.medianHomePrice.value,
          homeValueGrowth: dashboardData.indicators.housing.homeValueGrowth.value,
          affordabilityIndex: dashboardData.indicators.housing.affordabilityIndex.value,
          economicHealthScore: this.calculateEconomicHealthScore(dashboardData),
          economicOutlook: this.determineEconomicOutlook(dashboardData)
        };
      }
    } catch (error) {
      console.error('Error enhancing property with economic data:', error);
      // Don't throw, allow continuing with other enhancements
    }
  }
  
  /**
   * Enhance property with natural hazard risk data
   * @param property Property to enhance
   */
  private async enhanceWithHazardRiskData(property: IntegratedPropertyData): Promise<void> {
    try {
      property.naturalHazardRisks = await this.getNaturalHazardRisks(
        property.location.latitude,
        property.location.longitude
      );
    } catch (error) {
      console.error('Error enhancing property with hazard risk data:', error);
      // Don't throw, allow continuing with other enhancements
    }
  }
  
  /**
   * Enhance property with market cycle prediction
   * @param property Property to enhance
   */
  private async enhanceWithMarketCyclePrediction(property: IntegratedPropertyData): Promise<void> {
    try {
      property.marketCyclePrediction = await this.getMarketCyclePrediction(
        property.city,
        property.state
      );
    } catch (error) {
      console.error('Error enhancing property with market cycle prediction:', error);
      // Don't throw, allow continuing with other enhancements
    }
  }
  
  /**
   * Calculate investment metrics for a property
   * @param property Property to calculate metrics for
   */
  private calculateInvestmentMetrics(property: IntegratedPropertyData): void {
    try {
      // Estimate monthly rental income based on property price
      // National average is around 0.7% to 1% of property value monthly
      // Adjust based on local economic factors and market phase
      let rentalYield = 0.008; // Default 0.8% monthly (9.6% annual)
      
      // Adjust based on economic factors if available
      if (property.economicIndicators) {
        // Higher unemployment means lower rental yields
        if (property.economicIndicators.unemployment > 6) {
          rentalYield -= 0.001;
        } else if (property.economicIndicators.unemployment < 4) {
          rentalYield += 0.001;
        }
        
        // Strong job growth improves rental yields
        if (property.economicIndicators.jobGrowth > 3) {
          rentalYield += 0.001;
        }
        
        // Higher affordability index (more affordable) typically means lower rental yield
        if (property.economicIndicators.affordabilityIndex > 100) {
          rentalYield -= 0.0005;
        } else if (property.economicIndicators.affordabilityIndex < 80) {
          rentalYield += 0.0005;
        }
      }
      
      // Adjust based on market phase if available
      if (property.marketCyclePrediction) {
        if (property.marketCyclePrediction.currentPhase === MarketPhase.RECESSION) {
          rentalYield += 0.002; // Higher yields in recession due to lower property values
        } else if (property.marketCyclePrediction.currentPhase === MarketPhase.HYPER_SUPPLY) {
          rentalYield -= 0.001; // Lower yields due to oversupply
        }
      }
      
      // Calculate monthly rental income
      const monthlyRental = property.price * rentalYield;
      const annualRental = monthlyRental * 12;
      
      // Calculate cap rate (annual rental income / property price)
      // Deduct 40% for expenses (taxes, insurance, maintenance, vacancy, etc.)
      const operatingExpensePercent = 0.4;
      const netOperatingIncome = annualRental * (1 - operatingExpensePercent);
      const capRate = (netOperatingIncome / property.price) * 100;
      
      // Calculate cash on cash return assuming 20% down payment
      const downPaymentPercent = 0.2;
      const downPayment = property.price * downPaymentPercent;
      const loanAmount = property.price - downPayment;
      
      // Mortgage calculation (30-year fixed)
      const interestRate = 0.07; // 7% mortgage rate
      const monthlyRate = interestRate / 12;
      const loanTermMonths = 30 * 12;
      
      const monthlyMortgage = loanAmount * 
        (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / 
        (Math.pow(1 + monthlyRate, loanTermMonths) - 1);
      
      const annualMortgage = monthlyMortgage * 12;
      
      // Cash flow
      const annualCashFlow = netOperatingIncome - annualMortgage;
      const cashOnCashReturn = (annualCashFlow / downPayment) * 100;
      
      // Break-even point (months)
      const totalInvestment = downPayment + (property.price * 0.04); // Down payment + closing costs
      const monthlyCashFlow = annualCashFlow / 12;
      const breakEvenMonths = Math.ceil(totalInvestment / monthlyCashFlow);
      
      // Price to income ratio
      let priceToIncomeRatio = 0;
      if (property.economicIndicators && property.economicIndicators.medianHouseholdIncome) {
        priceToIncomeRatio = property.price / property.economicIndicators.medianHouseholdIncome;
      } else {
        // Use national average if local data not available
        const estimatedMedianIncome = 75000;
        priceToIncomeRatio = property.price / estimatedMedianIncome;
      }
      
      // Price to rent ratio
      const priceToRentRatio = property.price / annualRental;
      
      // Appreciation potential
      let appreciationPotential = 15; // Default 15% over 5 years
      
      // Adjust based on economic indicators
      if (property.economicIndicators) {
        if (property.economicIndicators.homeValueGrowth > 5) {
          appreciationPotential += 5;
        } else if (property.economicIndicators.homeValueGrowth < 2) {
          appreciationPotential -= 5;
        }
        
        if (property.economicIndicators.jobGrowth > 3) {
          appreciationPotential += 3;
        } else if (property.economicIndicators.jobGrowth < 1) {
          appreciationPotential -= 3;
        }
      }
      
      // Adjust based on market cycle
      if (property.marketCyclePrediction) {
        if (property.marketCyclePrediction.currentPhase === MarketPhase.RECOVERY) {
          appreciationPotential += 10; // Early in cycle, more room to grow
        } else if (property.marketCyclePrediction.currentPhase === MarketPhase.HYPER_SUPPLY) {
          appreciationPotential -= 10; // Late in cycle, less room to grow
        }
      }
      
      // Calculate overall investment score (0-100)
      let investmentScore = 0;
      
      // Cap rate (weight: 25%)
      const capRateScore = Math.min(100, (capRate / 10) * 100);
      investmentScore += capRateScore * 0.25;
      
      // Cash on cash return (weight: 25%)
      const cocScore = Math.min(100, (cashOnCashReturn / 15) * 100);
      investmentScore += cocScore * 0.25;
      
      // Appreciation potential (weight: 20%)
      const appScore = Math.min(100, (appreciationPotential / 25) * 100);
      investmentScore += appScore * 0.20;
      
      // Price to income ratio (weight: 15%) - lower is better
      const ptiScore = Math.min(100, 100 - (((priceToIncomeRatio - 2) / 5) * 100));
      investmentScore += Math.max(0, ptiScore) * 0.15;
      
      // Price to rent ratio (weight: 15%) - lower is better
      const ptrScore = Math.min(100, 100 - (((priceToRentRatio - 10) / 20) * 100));
      investmentScore += Math.max(0, ptrScore) * 0.15;
      
      // Set investment metrics
      property.investmentMetrics = {
        estimatedRentalIncome: Math.round(monthlyRental),
        capRate: parseFloat(capRate.toFixed(2)),
        cashOnCashReturn: parseFloat(cashOnCashReturn.toFixed(2)),
        breakEvenPoint: breakEvenMonths,
        priceToIncomeRatio: parseFloat(priceToIncomeRatio.toFixed(2)),
        priceToRentRatio: parseFloat(priceToRentRatio.toFixed(2)),
        appreciationPotential,
        overallInvestmentScore: Math.round(investmentScore)
      };
    } catch (error) {
      console.error('Error calculating investment metrics:', error);
      // Don't throw, allow continuing with other property data
    }
  }
  
  /**
   * Sort properties based on sort parameter
   * @param properties Properties to sort
   * @param sortBy Sort parameter
   */
  private sortProperties(
    properties: IntegratedPropertyData[],
    sortBy: string
  ): void {
    switch (sortBy) {
      case 'price_asc':
        properties.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        properties.sort((a, b) => b.price - a.price);
        break;
      case 'beds_desc':
        properties.sort((a, b) => b.bedrooms - a.bedrooms);
        break;
      case 'baths_desc':
        properties.sort((a, b) => b.bathrooms - a.bathrooms);
        break;
      case 'sqft_desc':
        properties.sort((a, b) => b.squareFeet - a.squareFeet);
        break;
      case 'year_desc':
        properties.sort((a, b) => b.yearBuilt - a.yearBuilt);
        break;
      case 'school_rating':
        properties.sort((a, b) => {
          const ratingA = a.schoolScorecard?.averageRating || 0;
          const ratingB = b.schoolScorecard?.averageRating || 0;
          return ratingB - ratingA;
        });
        break;
      case 'economic_health':
        properties.sort((a, b) => {
          const scoreA = a.economicIndicators?.economicHealthScore || 0;
          const scoreB = b.economicIndicators?.economicHealthScore || 0;
          return scoreB - scoreA;
        });
        break;
      case 'investment_score':
        properties.sort((a, b) => {
          const scoreA = a.investmentMetrics?.overallInvestmentScore || 0;
          const scoreB = b.investmentMetrics?.overallInvestmentScore || 0;
          return scoreB - scoreA;
        });
        break;
      case 'hazard_risk_asc':
        properties.sort((a, b) => {
          const riskA = a.naturalHazardRisks?.riskScores.overall || 0;
          const riskB = b.naturalHazardRisks?.riskScores.overall || 0;
          return riskA - riskB;
        });
        break;
      default:
        // Default: sort by price ascending
        properties.sort((a, b) => a.price - b.price);
    }
  }
  
  /**
   * Calculate economic health score from dashboard data
   * @param data Economic dashboard data
   * @returns Economic health score (0-100)
   */
  private calculateEconomicHealthScore(data: EconomicDashboardData): number {
    let score = 0;
    
    // Employment factors (40% weight)
    const unemploymentScore = Math.max(0, 100 - (data.indicators.employment.unemploymentRate.value * 10));
    const jobGrowthScore = Math.min(100, data.indicators.employment.jobGrowth.value * 20);
    const laborForceScore = Math.min(100, data.indicators.employment.laborForceParticipation.value);
    
    score += (unemploymentScore * 0.15);
    score += (jobGrowthScore * 0.15);
    score += (laborForceScore * 0.10);
    
    // Income factors (30% weight)
    const incomeScore = Math.min(100, 
      (data.indicators.income.medianHouseholdIncome.value / 100000) * 100);
    const wageGrowthScore = Math.min(100, data.indicators.income.wageGrowth.value * 20);
    
    score += (incomeScore * 0.15);
    score += (wageGrowthScore * 0.15);
    
    // Housing factors (30% weight)
    const affordabilityScore = Math.min(100, data.indicators.housing.affordabilityIndex.value);
    const priceGrowthScore = Math.min(100, data.indicators.housing.homeValueGrowth.value * 10);
    
    score += (affordabilityScore * 0.15);
    score += (priceGrowthScore * 0.15);
    
    return Math.round(score);
  }
  
  /**
   * Determine economic outlook from dashboard data
   * @param data Economic dashboard data
   * @returns Economic outlook
   */
  private determineEconomicOutlook(data: EconomicDashboardData): 'improving' | 'stable' | 'declining' {
    // Count positive and negative trends
    let positiveCount = 0;
    let negativeCount = 0;
    
    // Employment trends
    if (data.indicators.employment.unemploymentRate.trend === 'down') positiveCount++;
    if (data.indicators.employment.unemploymentRate.trend === 'up') negativeCount++;
    
    if (data.indicators.employment.jobGrowth.trend === 'up') positiveCount++;
    if (data.indicators.employment.jobGrowth.trend === 'down') negativeCount++;
    
    if (data.indicators.employment.laborForceParticipation.trend === 'up') positiveCount++;
    if (data.indicators.employment.laborForceParticipation.trend === 'down') negativeCount++;
    
    // Income trends
    if (data.indicators.income.medianHouseholdIncome.trend === 'up') positiveCount++;
    if (data.indicators.income.medianHouseholdIncome.trend === 'down') negativeCount++;
    
    if (data.indicators.income.wageGrowth.trend === 'up') positiveCount++;
    if (data.indicators.income.wageGrowth.trend === 'down') negativeCount++;
    
    // Housing trends
    if (data.indicators.housing.homeValueGrowth.trend === 'up') positiveCount++;
    if (data.indicators.housing.homeValueGrowth.trend === 'down') negativeCount++;
    
    // Determine outlook based on trend counts
    if (positiveCount >= negativeCount + 2) {
      return 'improving';
    } else if (negativeCount >= positiveCount + 2) {
      return 'declining';
    } else {
      return 'stable';
    }
  }
  
  /**
   * Get numeric value for risk level (for comparison)
   * @param level Risk level
   * @returns Numeric value (1-5)
   */
  private getRiskLevelValue(level: RiskLevel): number {
    switch (level) {
      case RiskLevel.LOW: return 1;
      case RiskLevel.MODERATE: return 2;
      case RiskLevel.HIGH: return 3;
      case RiskLevel.VERY_HIGH: return 4;
      case RiskLevel.EXTREME: return 5;
      default: return 1;
    }
  }
  
  /**
   * Get flood risk description
   * @param risk Flood risk level
   * @returns Description
   */
  private getFloodRiskDescription(risk: RiskLevel): string {
    switch (risk) {
      case RiskLevel.LOW:
        return "low flood risk (minimal chance of flooding over 30 years)";
      case RiskLevel.MODERATE:
        return "moderate flood risk (some potential for flooding during severe weather events)";
      case RiskLevel.HIGH:
        return "high flood risk (significant potential for flooding during severe weather)";
      case RiskLevel.VERY_HIGH:
        return "very high flood risk (property is in or near a FEMA-designated flood zone)";
      case RiskLevel.EXTREME:
        return "extreme flood risk (property is in a high-risk flood zone with history of flooding)";
      default:
        return "undetermined flood risk";
    }
  }
  
  /**
   * Get wildfire risk description
   * @param risk Wildfire risk level
   * @returns Description
   */
  private getWildfireRiskDescription(risk: RiskLevel): string {
    switch (risk) {
      case RiskLevel.LOW:
        return "low wildfire risk (minimal vegetation and wildfire fuel in the area)";
      case RiskLevel.MODERATE:
        return "moderate wildfire risk (some seasonal risk during dry periods)";
      case RiskLevel.HIGH:
        return "high wildfire risk (significant vegetation and potential for fire spread)";
      case RiskLevel.VERY_HIGH:
        return "very high wildfire risk (property is in a wildfire-prone area with limited escape routes)";
      case RiskLevel.EXTREME:
        return "extreme wildfire risk (property is in a high-risk area with history of wildfires)";
      default:
        return "undetermined wildfire risk";
    }
  }
  
  /**
   * Get earthquake risk description
   * @param risk Earthquake risk level
   * @returns Description
   */
  private getEarthquakeRiskDescription(risk: RiskLevel): string {
    switch (risk) {
      case RiskLevel.LOW:
        return "low earthquake risk (minimal seismic activity in the region)";
      case RiskLevel.MODERATE:
        return "moderate earthquake risk (some potential for seismic activity)";
      case RiskLevel.HIGH:
        return "high earthquake risk (property is in a seismically active region)";
      case RiskLevel.VERY_HIGH:
        return "very high earthquake risk (property is near active fault lines)";
      case RiskLevel.EXTREME:
        return "extreme earthquake risk (property is on or very near major fault lines)";
      default:
        return "undetermined earthquake risk";
    }
  }
  
  /**
   * Calculate distance between two coordinates (in miles)
   * @param lat1 Latitude 1
   * @param lon1 Longitude 1
   * @param lat2 Latitude 2
   * @param lon2 Longitude 2
   * @returns Distance in miles
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3958.8; // Earth radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Export singleton instance
const integratedPropertyDataService = IntegratedPropertyDataService.getInstance();
export default integratedPropertyDataService;