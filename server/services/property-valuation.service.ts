/**
 * Property Valuation Service
 * 
 * This service integrates external data (weather, climate, demographics) into
 * the property valuation algorithms for more accurate pricing models.
 */

import { WeatherData, ClimateData, DemographicData } from '../types/external-data';

/**
 * Property base information
 */
interface PropertyBaseInfo {
  address: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt: number;
  lotSize: number;
  propertyType: string;
  basePrice: number; // Initial valuation without external factors
}

/**
 * Property valuation modifiers from external data
 */
interface ValuationModifiers {
  climateScore: number;      // 0.8 to 1.2 factor
  demographicScore: number;  // 0.85 to 1.15 factor
  seasonalityFactor: number; // 0.95 to 1.05 factor
  weatherRiskFactor: number; // 0.9 to 1.1 factor
}

/**
 * Detailed property valuation result
 */
interface PropertyValuation {
  basePrice: number;
  adjustedPrice: number;
  modifiers: ValuationModifiers;
  factors: {
    climateFactors: {
      extremeTemperatures: boolean;
      highPrecipitation: boolean;
      seasonalVariability: boolean;
    };
    demographicFactors: {
      incomeLevel: 'low' | 'moderate' | 'high';
      educationLevel: 'low' | 'moderate' | 'high';
      homeownershipRate: 'low' | 'moderate' | 'high';
    };
    seasonalFactors: {
      currentSeason: 'winter' | 'spring' | 'summer' | 'fall';
      seasonalDemand: 'low' | 'moderate' | 'high';
    };
    weatherRiskFactors: {
      floodRisk: 'low' | 'moderate' | 'high';
      windRisk: 'low' | 'moderate' | 'high';
      extremeWeatherFrequency: 'low' | 'moderate' | 'high';
    };
  };
  confidence: number; // 0-100 valuation confidence score
}

/**
 * Evaluates climate data to determine impact on property value
 */
function evaluateClimateData(climateData: ClimateData[]): { 
  score: number; 
  factors: PropertyValuation['factors']['climateFactors'] 
} {
  if (!climateData || climateData.length === 0) {
    return { 
      score: 1.0, 
      factors: {
        extremeTemperatures: false,
        highPrecipitation: false,
        seasonalVariability: false
      } 
    };
  }

  // Calculate temperature extremes
  const maxTemp = Math.max(...climateData.map(m => m.temperatureMax));
  const minTemp = Math.min(...climateData.map(m => m.temperatureMin));
  const temperatureRange = maxTemp - minTemp;
  const extremeTemperatures = maxTemp > 95 || minTemp < 20;

  // Calculate precipitation
  const annualPrecipitation = climateData.reduce((sum, m) => sum + m.precipitationAvg, 0);
  const highPrecipitation = annualPrecipitation > 40;

  // Calculate seasonal variability
  const avgTemps = climateData.map(m => m.temperatureAvg);
  const maxTempDiff = Math.max(...avgTemps) - Math.min(...avgTemps);
  const seasonalVariability = maxTempDiff > 40;

  // Calculate overall climate score
  let score = 1.0;
  
  // Moderate climates generally preferred
  if (extremeTemperatures) {
    score -= 0.1;
  }
  
  // High precipitation can affect maintenance
  if (highPrecipitation) {
    score -= 0.05;
  }
  
  // High variability means more adaptation costs
  if (seasonalVariability) {
    score -= 0.05;
  }

  return {
    score: Math.max(0.8, Math.min(1.2, score)),
    factors: {
      extremeTemperatures,
      highPrecipitation,
      seasonalVariability
    }
  };
}

/**
 * Evaluates demographic data to determine impact on property value
 */
function evaluateDemographicData(demographicData: DemographicData): {
  score: number;
  factors: PropertyValuation['factors']['demographicFactors']
} {
  if (!demographicData) {
    return { 
      score: 1.0, 
      factors: {
        incomeLevel: 'moderate',
        educationLevel: 'moderate',
        homeownershipRate: 'moderate'
      } 
    };
  }

  // Evaluate income level
  let incomeLevel: 'low' | 'moderate' | 'high' = 'moderate';
  if (demographicData.medianHouseholdIncome > 100000) {
    incomeLevel = 'high';
  } else if (demographicData.medianHouseholdIncome < 50000) {
    incomeLevel = 'low';
  }

  // Evaluate education level
  let educationLevel: 'low' | 'moderate' | 'high' = 'moderate';
  if (demographicData.educationBachelor > 40) {
    educationLevel = 'high';
  } else if (demographicData.educationBachelor < 20) {
    educationLevel = 'low';
  }

  // Evaluate homeownership rate
  let homeownershipRate: 'low' | 'moderate' | 'high' = 'moderate';
  if (demographicData.homeownershipRate > 70) {
    homeownershipRate = 'high';
  } else if (demographicData.homeownershipRate < 40) {
    homeownershipRate = 'low';
  }

  // Calculate demographic score
  let score = 1.0;
  
  // Higher income areas typically have higher property values
  if (incomeLevel === 'high') {
    score += 0.1;
  } else if (incomeLevel === 'low') {
    score -= 0.05;
  }
  
  // Higher education levels correlate with property values
  if (educationLevel === 'high') {
    score += 0.05;
  } else if (educationLevel === 'low') {
    score -= 0.03;
  }
  
  // Homeownership rates affect neighborhood stability
  if (homeownershipRate === 'high') {
    score += 0.03;
  } else if (homeownershipRate === 'low') {
    score -= 0.02;
  }

  return {
    score: Math.max(0.85, Math.min(1.15, score)),
    factors: {
      incomeLevel,
      educationLevel,
      homeownershipRate
    }
  };
}

/**
 * Evaluates current weather conditions for seasonal adjustment
 */
function evaluateSeasonalFactors(weatherData: WeatherData, month: number): {
  score: number;
  factors: PropertyValuation['factors']['seasonalFactors']
} {
  if (!weatherData) {
    return { 
      score: 1.0, 
      factors: {
        currentSeason: 'summer',
        seasonalDemand: 'moderate'
      } 
    };
  }

  // Determine current season
  let currentSeason: 'winter' | 'spring' | 'summer' | 'fall';
  if (month >= 3 && month <= 5) {
    currentSeason = 'spring';
  } else if (month >= 6 && month <= 8) {
    currentSeason = 'summer';
  } else if (month >= 9 && month <= 11) {
    currentSeason = 'fall';
  } else {
    currentSeason = 'winter';
  }

  // Determine seasonal demand based on season and weather
  let seasonalDemand: 'low' | 'moderate' | 'high' = 'moderate';
  
  // Spring and summer typically have higher demand
  if (currentSeason === 'spring' || currentSeason === 'summer') {
    seasonalDemand = 'high';
  } else if (currentSeason === 'winter') {
    seasonalDemand = 'low';
  }
  
  // Extreme weather can dampen seasonal demand
  if (weatherData.temperature > 95 || weatherData.temperature < 32) {
    seasonalDemand = seasonalDemand === 'high' ? 'moderate' : 'low';
  }

  // Calculate seasonality score
  let score = 1.0;
  
  if (seasonalDemand === 'high') {
    score += 0.05;
  } else if (seasonalDemand === 'low') {
    score -= 0.05;
  }

  return {
    score: Math.max(0.95, Math.min(1.05, score)),
    factors: {
      currentSeason,
      seasonalDemand
    }
  };
}

/**
 * Evaluates weather risks based on climate data
 */
function evaluateWeatherRisks(climateData: ClimateData[]): {
  score: number;
  factors: PropertyValuation['factors']['weatherRiskFactors']
} {
  if (!climateData || climateData.length === 0) {
    return { 
      score: 1.0, 
      factors: {
        floodRisk: 'low',
        windRisk: 'low',
        extremeWeatherFrequency: 'low'
      } 
    };
  }

  // Calculate flood risk
  const annualPrecipitation = climateData.reduce((sum, m) => sum + m.precipitationAvg, 0);
  let floodRisk: 'low' | 'moderate' | 'high' = 'low';
  if (annualPrecipitation > 50) {
    floodRisk = 'high';
  } else if (annualPrecipitation > 35) {
    floodRisk = 'moderate';
  }

  // Placeholder for wind risk (would need more detailed data)
  const windRisk: 'low' | 'moderate' | 'high' = 'low';

  // Calculate extreme weather frequency
  const extremeMonths = climateData.filter(m => 
    m.temperatureMax > 95 || m.temperatureMin < 20 || m.precipitationAvg > 5
  ).length;
  
  let extremeWeatherFrequency: 'low' | 'moderate' | 'high' = 'low';
  if (extremeMonths > 4) {
    extremeWeatherFrequency = 'high';
  } else if (extremeMonths > 2) {
    extremeWeatherFrequency = 'moderate';
  }

  // Calculate risk score
  let score = 1.0;
  
  if (floodRisk === 'high') {
    score -= 0.1;
  } else if (floodRisk === 'moderate') {
    score -= 0.05;
  }
  
  if (extremeWeatherFrequency === 'high') {
    score -= 0.05;
  } else if (extremeWeatherFrequency === 'moderate') {
    score -= 0.02;
  }

  return {
    score: Math.max(0.9, Math.min(1.1, score)),
    factors: {
      floodRisk,
      windRisk,
      extremeWeatherFrequency
    }
  };
}

/**
 * Calculates property valuation with external data factors
 * @param property Base property information
 * @param weatherData Current weather data
 * @param climateData Historical climate data
 * @param demographicData Demographic data for the area
 * @returns Detailed property valuation with adjustments
 */
export function calculatePropertyValuation(
  property: PropertyBaseInfo,
  weatherData?: WeatherData,
  climateData?: ClimateData[],
  demographicData?: DemographicData
): PropertyValuation {
  // Get current month for seasonality calculations
  const currentMonth = new Date().getMonth() + 1; // 1-12

  // Evaluate different external factors
  const climateEvaluation = evaluateClimateData(climateData || []);
  const demographicEvaluation = evaluateDemographicData(demographicData);
  const seasonalEvaluation = evaluateSeasonalFactors(weatherData, currentMonth);
  const weatherRiskEvaluation = evaluateWeatherRisks(climateData || []);

  // Combine modifiers
  const modifiers: ValuationModifiers = {
    climateScore: climateEvaluation.score,
    demographicScore: demographicEvaluation.score,
    seasonalityFactor: seasonalEvaluation.score,
    weatherRiskFactor: weatherRiskEvaluation.score
  };

  // Calculate adjusted price
  const adjustmentFactor = 
    modifiers.climateScore * 
    modifiers.demographicScore * 
    modifiers.seasonalityFactor * 
    modifiers.weatherRiskFactor;
  
  const adjustedPrice = Math.round(property.basePrice * adjustmentFactor);

  // Calculate confidence score based on data completeness
  let confidence = 70; // Base confidence
  
  if (weatherData) confidence += 5;
  if (climateData && climateData.length > 0) confidence += 10;
  if (demographicData) confidence += 15;

  return {
    basePrice: property.basePrice,
    adjustedPrice,
    modifiers,
    factors: {
      climateFactors: climateEvaluation.factors,
      demographicFactors: demographicEvaluation.factors,
      seasonalFactors: seasonalEvaluation.factors,
      weatherRiskFactors: weatherRiskEvaluation.factors
    },
    confidence
  };
}

/**
 * Get comparable properties with external data adjustment
 * @param property Base property information
 * @param comparables List of comparable properties
 * @param climateData Climate data for the area
 * @param demographicData Demographic data for the area
 * @returns Adjusted list of comparables with similarity scores
 */
export function getAdjustedComparables(
  property: PropertyBaseInfo,
  comparables: PropertyBaseInfo[],
  climateData?: ClimateData[],
  demographicData?: DemographicData
): Array<{
  property: PropertyBaseInfo,
  similarityScore: number,
  adjustedPrice: number,
  priceAdjustmentFactor: number
}> {
  if (!comparables || comparables.length === 0) {
    return [];
  }

  const propertyValuation = calculatePropertyValuation(
    property,
    undefined,
    climateData,
    demographicData
  );

  return comparables.map(comparable => {
    // Calculate basic similarity score based on property features
    let similarityScore = 100;
    
    // Adjust for bedrooms
    const bedroomDiff = Math.abs(property.bedrooms - comparable.bedrooms);
    similarityScore -= bedroomDiff * 5;
    
    // Adjust for bathrooms
    const bathroomDiff = Math.abs(property.bathrooms - comparable.bathrooms);
    similarityScore -= bathroomDiff * 5;
    
    // Adjust for square footage (per 250 sq ft)
    const sqftDiff = Math.abs(property.squareFeet - comparable.squareFeet);
    similarityScore -= (sqftDiff / 250) * 2;
    
    // Adjust for age of home (per 5 years)
    const ageDiff = Math.abs(property.yearBuilt - comparable.yearBuilt);
    similarityScore -= (ageDiff / 5) * 1;
    
    // Adjust for lot size
    const lotSizeDiff = Math.abs(property.lotSize - comparable.lotSize);
    similarityScore -= (lotSizeDiff / 0.1) * 1; // Per 0.1 acre
    
    // Different property type is a bigger penalty
    if (property.propertyType !== comparable.propertyType) {
      similarityScore -= 15;
    }

    // Ensure score doesn't go below 0
    similarityScore = Math.max(0, similarityScore);

    // Calculate the external data adjustment factor
    // This simplifies the full calculation from above
    const priceAdjustmentFactor = (
      propertyValuation.modifiers.climateScore *
      propertyValuation.modifiers.demographicScore
    );

    const adjustedPrice = Math.round(comparable.basePrice * priceAdjustmentFactor);

    return {
      property: comparable,
      similarityScore,
      adjustedPrice,
      priceAdjustmentFactor
    };
  }).sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Singleton service for property valuation
 */
class PropertyValuationService {
  private static instance: PropertyValuationService;

  private constructor() {}

  public static getInstance(): PropertyValuationService {
    if (!PropertyValuationService.instance) {
      PropertyValuationService.instance = new PropertyValuationService();
    }
    return PropertyValuationService.instance;
  }

  /**
   * Get a property valuation with external data factors
   */
  public getPropertyValuation(
    property: PropertyBaseInfo,
    weatherData?: WeatherData,
    climateData?: ClimateData[],
    demographicData?: DemographicData
  ): PropertyValuation {
    return calculatePropertyValuation(
      property,
      weatherData,
      climateData,
      demographicData
    );
  }

  /**
   * Get adjusted comparable properties with similarity scores
   */
  public getComparableProperties(
    property: PropertyBaseInfo,
    comparables: PropertyBaseInfo[],
    climateData?: ClimateData[],
    demographicData?: DemographicData
  ) {
    return getAdjustedComparables(
      property,
      comparables,
      climateData,
      demographicData
    );
  }
}

export const propertyValuationService = PropertyValuationService.getInstance();