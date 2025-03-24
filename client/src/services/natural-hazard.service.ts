/**
 * Natural Hazard Risk Assessment Service
 * 
 * This service provides risk assessments for various natural hazards (flood, fire, earthquake)
 * based on property location and historical data.
 */

export enum RiskLevel {
  VERY_LOW = 'very-low',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very-high'
}

export interface HazardRisk {
  level: RiskLevel;
  score: number; // 0-100 score
  description: string;
  factors: string[];
  mitigationTips?: string[];
}

export interface FloodRisk extends HazardRisk {
  floodZone?: string;
  elevationAboveSeaLevel?: number;
  historicalFloodEvents?: number;
  proximityToWaterBodies?: number; // Distance in meters
}

export interface FireRisk extends HazardRisk {
  vegetationDensity?: number; // 0-100 score
  dryConditionFrequency?: number; // Days per year
  historicalFireEvents?: number;
  proximityToWildlands?: number; // Distance in meters
}

export interface EarthquakeRisk extends HazardRisk {
  seismicZone?: string;
  distanceToFault?: number; // Distance in km
  soilType?: string;
  historicalMagnitudes?: number[]; // Historical earthquake magnitudes
}

export interface PropertyRiskAssessment {
  propertyId: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  overallRisk: RiskLevel;
  floodRisk: FloodRisk;
  fireRisk: FireRisk;
  earthquakeRisk: EarthquakeRisk;
  assessmentDate: string;
  dataQuality: number; // 0-100 score indicating data reliability
}

class NaturalHazardService {
  private static instance: NaturalHazardService;
  private apiUrl: string = '/api/hazards';

  private constructor() {}

  public static getInstance(): NaturalHazardService {
    if (!NaturalHazardService.instance) {
      NaturalHazardService.instance = new NaturalHazardService();
    }
    return NaturalHazardService.instance;
  }

  /**
   * Get comprehensive risk assessment for a property
   */
  public async getPropertyRiskAssessment(
    propertyId: string, 
    includeDetailedData: boolean = false
  ): Promise<PropertyRiskAssessment> {
    try {
      // In a production environment, this would call a real API
      // For demo purposes, we'll generate sample data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.generateRiskAssessment(propertyId, includeDetailedData));
        }, 800);
      });
    } catch (error) {
      console.error('Error fetching property risk assessment:', error);
      throw error;
    }
  }

  /**
   * Get risk assessment for a specific location by coordinates
   */
  public async getLocationRiskAssessment(
    latitude: number, 
    longitude: number, 
    includeDetailedData: boolean = false
  ): Promise<PropertyRiskAssessment> {
    try {
      // Generate a deterministic propertyId from coordinates to ensure consistent results
      const propertyId = `loc-${latitude.toFixed(6)}-${longitude.toFixed(6)}`;
      
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.generateRiskAssessment(propertyId, includeDetailedData, latitude, longitude));
        }, 800);
      });
    } catch (error) {
      console.error('Error fetching location risk assessment:', error);
      throw error;
    }
  }

  /**
   * Get natural hazard statistics for a region
   */
  public async getRegionHazardStatistics(regionCode: string): Promise<{
    averageFloodRisk: number;
    averageFireRisk: number;
    averageEarthquakeRisk: number;
    highRiskProperties: number;
    lowRiskProperties: number;
    historicalEvents: Array<{
      type: 'flood' | 'fire' | 'earthquake';
      date: string;
      severity: number;
      impact: string;
    }>;
  }> {
    try {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Deterministic "random" values based on region code
          const regionHash = this.hashString(regionCode);
          const seedValue = regionHash % 100;
          
          resolve({
            averageFloodRisk: 25 + (seedValue % 40),
            averageFireRisk: 20 + ((seedValue + 10) % 50),
            averageEarthquakeRisk: 15 + ((seedValue + 20) % 30),
            highRiskProperties: 50 + ((seedValue + 30) % 200),
            lowRiskProperties: 500 + ((seedValue + 40) % 1000),
            historicalEvents: [
              {
                type: 'flood',
                date: '2021-03-15',
                severity: 3,
                impact: 'Moderate flooding affecting low-lying areas'
              },
              {
                type: 'fire',
                date: '2020-08-23',
                severity: 4,
                impact: 'Significant wildfire, 500 acres burned'
              },
              {
                type: 'earthquake',
                date: '2018-10-05',
                severity: 2,
                impact: 'Minor earthquake, minimal structural damage'
              }
            ]
          });
        }, 600);
      });
    } catch (error) {
      console.error('Error fetching region hazard statistics:', error);
      throw error;
    }
  }

  /**
   * Generate sample risk assessment data for demo purposes
   */
  private generateRiskAssessment(
    propertyId: string, 
    includeDetailedData: boolean = false,
    latitude?: number,
    longitude?: number
  ): PropertyRiskAssessment {
    // Use propertyId hash to generate deterministic "random" values
    const idHash = this.hashString(propertyId);
    
    // Default coordinates for Grandview, WA area if not provided
    const lat = latitude || 46.25 + ((idHash % 100) / 1000);
    const lng = -119.9 + ((idHash % 100) / 1000);
    
    // Generate risk levels based on the hash
    const floodRiskBase = (idHash % 5) + 1; // 1-5
    const fireRiskBase = ((idHash + 7) % 5) + 1; // 1-5
    const earthquakeRiskBase = ((idHash + 13) % 5) + 1; // 1-5
    
    // Convert 1-5 scale to RiskLevel enum
    const floodRiskLevel = this.numberToRiskLevel(floodRiskBase);
    const fireRiskLevel = this.numberToRiskLevel(fireRiskBase);
    const earthquakeRiskLevel = this.numberToRiskLevel(earthquakeRiskBase);
    
    // Calculate scores (0-100) based on risk levels
    const floodScore = this.riskLevelToScore(floodRiskLevel);
    const fireScore = this.riskLevelToScore(fireRiskLevel);
    const earthquakeScore = this.riskLevelToScore(earthquakeRiskLevel);
    
    // Calculate overall risk as weighted average, bias slightly toward the highest risk
    const maxRisk = Math.max(floodScore, fireScore, earthquakeScore);
    const averageRisk = (floodScore + fireScore + earthquakeScore) / 3;
    const overallScore = Math.round(averageRisk * 0.7 + maxRisk * 0.3);
    const overallRiskLevel = this.scoreToRiskLevel(overallScore);
    
    // Generate flood risk details
    const floodRisk: FloodRisk = {
      level: floodRiskLevel,
      score: floodScore,
      description: this.getFloodRiskDescription(floodRiskLevel),
      factors: this.getFloodRiskFactors(floodRiskLevel),
      mitigationTips: this.getFloodMitigationTips(floodRiskLevel),
    };
    
    // Generate fire risk details
    const fireRisk: FireRisk = {
      level: fireRiskLevel,
      score: fireScore,
      description: this.getFireRiskDescription(fireRiskLevel),
      factors: this.getFireRiskFactors(fireRiskLevel),
      mitigationTips: this.getFireMitigationTips(fireRiskLevel),
    };
    
    // Generate earthquake risk details
    const earthquakeRisk: EarthquakeRisk = {
      level: earthquakeRiskLevel,
      score: earthquakeScore,
      description: this.getEarthquakeRiskDescription(earthquakeRiskLevel),
      factors: this.getEarthquakeRiskFactors(earthquakeRiskLevel),
      mitigationTips: this.getEarthquakeMitigationTips(earthquakeRiskLevel),
    };
    
    // Add detailed data if requested
    if (includeDetailedData) {
      floodRisk.floodZone = this.getFloodZone(floodRiskLevel);
      floodRisk.elevationAboveSeaLevel = 180 + (idHash % 120); // 180-300m
      floodRisk.historicalFloodEvents = Math.max(0, Math.floor(floodScore / 20) - 1);
      floodRisk.proximityToWaterBodies = 200 + (idHash % 800); // 200-1000m
      
      fireRisk.vegetationDensity = 20 + (idHash % 60); // 20-80
      fireRisk.dryConditionFrequency = 30 + (idHash % 90); // 30-120 days
      fireRisk.historicalFireEvents = Math.max(0, Math.floor(fireScore / 25));
      fireRisk.proximityToWildlands = 300 + (idHash % 1700); // 300-2000m
      
      earthquakeRisk.seismicZone = this.getSeismicZone(earthquakeRiskLevel);
      earthquakeRisk.distanceToFault = 5 + (idHash % 20); // 5-25km
      earthquakeRisk.soilType = this.getSoilType(earthquakeRiskLevel);
      earthquakeRisk.historicalMagnitudes = this.getHistoricalMagnitudes(earthquakeRiskLevel, idHash);
    }
    
    return {
      propertyId,
      address: this.generateAddress(idHash),
      coordinates: {
        latitude: lat,
        longitude: lng,
      },
      overallRisk: overallRiskLevel,
      floodRisk,
      fireRisk,
      earthquakeRisk,
      assessmentDate: new Date().toISOString(),
      dataQuality: 75 + (idHash % 20), // 75-95
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
   * Convert number 1-5 to RiskLevel enum
   */
  private numberToRiskLevel(num: number): RiskLevel {
    switch (num) {
      case 1: return RiskLevel.VERY_LOW;
      case 2: return RiskLevel.LOW;
      case 3: return RiskLevel.MODERATE;
      case 4: return RiskLevel.HIGH;
      case 5: return RiskLevel.VERY_HIGH;
      default: return RiskLevel.LOW;
    }
  }

  /**
   * Convert RiskLevel to score (0-100)
   */
  private riskLevelToScore(level: RiskLevel): number {
    switch (level) {
      case RiskLevel.VERY_LOW: return 5 + Math.floor(Math.random() * 15); // 5-20
      case RiskLevel.LOW: return 25 + Math.floor(Math.random() * 15); // 25-40
      case RiskLevel.MODERATE: return 45 + Math.floor(Math.random() * 15); // 45-60
      case RiskLevel.HIGH: return 65 + Math.floor(Math.random() * 15); // 65-80
      case RiskLevel.VERY_HIGH: return 85 + Math.floor(Math.random() * 15); // 85-100
      default: return 30; // Default moderate-low
    }
  }

  /**
   * Convert score (0-100) to RiskLevel
   */
  private scoreToRiskLevel(score: number): RiskLevel {
    if (score < 20) return RiskLevel.VERY_LOW;
    if (score < 40) return RiskLevel.LOW;
    if (score < 60) return RiskLevel.MODERATE;
    if (score < 80) return RiskLevel.HIGH;
    return RiskLevel.VERY_HIGH;
  }

  /**
   * Generate an address for demo purposes
   */
  private generateAddress(seed: number): string {
    const streetNumbers = [123, 456, 789, 1024, 1776, 2204, 3011, 4125, 5280, 6421];
    const streetNames = ['Main St', 'Hill Dr', 'Maple Ave', 'Oak Ln', 'Cedar Rd', 'Vineyard Way', 'Orchard Ave', 'Valley View Dr', 'Highland Ave', 'Grant St'];
    const cities = ['Grandview', 'Sunnyside', 'Yakima', 'Prosser', 'Zillah'];
    
    const streetNumber = streetNumbers[seed % streetNumbers.length];
    const streetName = streetNames[(seed + 3) % streetNames.length];
    const city = cities[(seed + 7) % cities.length];
    
    return `${streetNumber} ${streetName}, ${city}, WA 98930`;
  }

  /**
   * Get flood risk description based on risk level
   */
  private getFloodRiskDescription(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.VERY_LOW:
        return 'Minimal flood risk. The property is located in an area with very low probability of flooding.';
      case RiskLevel.LOW:
        return 'Low flood risk. The property is in an area with minimal historical flooding and good drainage.';
      case RiskLevel.MODERATE:
        return 'Moderate flood risk. The property may experience occasional flooding during extreme weather events.';
      case RiskLevel.HIGH:
        return 'High flood risk. The property is in an area prone to flooding and has experienced events in the past.';
      case RiskLevel.VERY_HIGH:
        return 'Very high flood risk. The property is located in a designated flood plain with frequent flooding issues.';
      default:
        return 'Assessment pending';
    }
  }

  /**
   * Get fire risk description based on risk level
   */
  private getFireRiskDescription(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.VERY_LOW:
        return 'Minimal fire risk. The property is located in an area with very low wildfire probability.';
      case RiskLevel.LOW:
        return 'Low fire risk. The property is in a developed area with limited exposure to wildfire conditions.';
      case RiskLevel.MODERATE:
        return 'Moderate fire risk. The property has some exposure to potential wildfire conditions during dry seasons.';
      case RiskLevel.HIGH:
        return 'High fire risk. The property is in an area with significant wildfire history and favorable wildfire conditions.';
      case RiskLevel.VERY_HIGH:
        return 'Very high fire risk. The property is located in a wildfire-prone area with frequent fire events.';
      default:
        return 'Assessment pending';
    }
  }

  /**
   * Get earthquake risk description based on risk level
   */
  private getEarthquakeRiskDescription(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.VERY_LOW:
        return 'Minimal earthquake risk. The property is in a region with very low seismic activity.';
      case RiskLevel.LOW:
        return 'Low earthquake risk. The property is in an area with minimal historical seismic activity.';
      case RiskLevel.MODERATE:
        return 'Moderate earthquake risk. The property is in a region that experiences occasional seismic activity.';
      case RiskLevel.HIGH:
        return 'High earthquake risk. The property is located near fault lines with significant seismic history.';
      case RiskLevel.VERY_HIGH:
        return 'Very high earthquake risk. The property is in a major seismic zone with frequent earthquake activity.';
      default:
        return 'Assessment pending';
    }
  }

  /**
   * Get flood risk factors based on risk level
   */
  private getFloodRiskFactors(level: RiskLevel): string[] {
    const commonFactors = ['Historical precipitation patterns', 'Local drainage systems'];
    
    switch (level) {
      case RiskLevel.VERY_LOW:
      case RiskLevel.LOW:
        return [...commonFactors, 'Higher elevation', 'Distance from water bodies', 'Well-maintained drainage'];
      case RiskLevel.MODERATE:
        return [...commonFactors, 'Moderate elevation', 'Some proximity to water bodies', 'Seasonal heavy rainfall'];
      case RiskLevel.HIGH:
      case RiskLevel.VERY_HIGH:
        return [...commonFactors, 'Low-lying area', 'Proximity to water bodies', 'Poor drainage system', 'Historical flood events', 'Floodplain designation'];
      default:
        return commonFactors;
    }
  }

  /**
   * Get fire risk factors based on risk level
   */
  private getFireRiskFactors(level: RiskLevel): string[] {
    const commonFactors = ['Regional climate conditions', 'Seasonal dry periods'];
    
    switch (level) {
      case RiskLevel.VERY_LOW:
      case RiskLevel.LOW:
        return [...commonFactors, 'Urban or suburban location', 'Low vegetation density', 'Distance from wildlands'];
      case RiskLevel.MODERATE:
        return [...commonFactors, 'Mixed development', 'Moderate vegetation', 'Some wildland proximity'];
      case RiskLevel.HIGH:
      case RiskLevel.VERY_HIGH:
        return [...commonFactors, 'Wildland-urban interface', 'High vegetation density', 'Extended dry seasons', 'Historical fire events', 'Limited access roads'];
      default:
        return commonFactors;
    }
  }

  /**
   * Get earthquake risk factors based on risk level
   */
  private getEarthquakeRiskFactors(level: RiskLevel): string[] {
    const commonFactors = ['Regional seismic activity', 'Soil composition'];
    
    switch (level) {
      case RiskLevel.VERY_LOW:
      case RiskLevel.LOW:
        return [...commonFactors, 'Distance from fault lines', 'Stable bedrock', 'Low historical seismicity'];
      case RiskLevel.MODERATE:
        return [...commonFactors, 'Moderate distance from faults', 'Variable soil stability', 'Some historical activity'];
      case RiskLevel.HIGH:
      case RiskLevel.VERY_HIGH:
        return [...commonFactors, 'Proximity to fault lines', 'Unstable soil types', 'Liquefaction potential', 'Historical large magnitude events'];
      default:
        return commonFactors;
    }
  }

  /**
   * Get flood mitigation tips based on risk level
   */
  private getFloodMitigationTips(level: RiskLevel): string[] {
    const commonTips = ['Maintain proper drainage around the property', 'Keep gutters and downspouts clear'];
    
    switch (level) {
      case RiskLevel.VERY_LOW:
      case RiskLevel.LOW:
        return commonTips;
      case RiskLevel.MODERATE:
        return [...commonTips, 'Consider flood insurance', 'Install water sensors in basements'];
      case RiskLevel.HIGH:
      case RiskLevel.VERY_HIGH:
        return [
          ...commonTips,
          'Obtain flood insurance',
          'Consider flood barriers or sandbags during heavy rain seasons',
          'Elevate utilities above potential flood levels',
          'Develop an emergency evacuation plan',
          'Install check valves in plumbing'
        ];
      default:
        return commonTips;
    }
  }

  /**
   * Get fire mitigation tips based on risk level
   */
  private getFireMitigationTips(level: RiskLevel): string[] {
    const commonTips = ['Install smoke detectors', 'Have fire extinguishers available'];
    
    switch (level) {
      case RiskLevel.VERY_LOW:
      case RiskLevel.LOW:
        return commonTips;
      case RiskLevel.MODERATE:
        return [...commonTips, 'Clear dead vegetation', 'Keep roof and gutters clear of debris'];
      case RiskLevel.HIGH:
      case RiskLevel.VERY_HIGH:
        return [
          ...commonTips,
          'Create a defensible space around the property',
          'Use fire-resistant landscaping and building materials',
          'Clear all flammable materials from around the structure',
          'Develop an evacuation plan',
          'Consider a fire-resistant roof'
        ];
      default:
        return commonTips;
    }
  }

  /**
   * Get earthquake mitigation tips based on risk level
   */
  private getEarthquakeMitigationTips(level: RiskLevel): string[] {
    const commonTips = ['Secure heavy furniture to walls', 'Know how to shut off utilities'];
    
    switch (level) {
      case RiskLevel.VERY_LOW:
      case RiskLevel.LOW:
        return commonTips;
      case RiskLevel.MODERATE:
        return [...commonTips, 'Secure water heaters', 'Prepare emergency kit'];
      case RiskLevel.HIGH:
      case RiskLevel.VERY_HIGH:
        return [
          ...commonTips,
          'Consider a seismic retrofit for the property',
          'Secure all heavy objects that could fall during shaking',
          'Install automatic gas shutoff valves',
          'Develop an emergency plan',
          'Consider earthquake insurance'
        ];
      default:
        return commonTips;
    }
  }

  /**
   * Get flood zone designation
   */
  private getFloodZone(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.VERY_LOW: return 'Zone X (Minimal Risk)';
      case RiskLevel.LOW: return 'Zone X (Reduced Risk)';
      case RiskLevel.MODERATE: return 'Zone B/Zone X (Moderate Risk)';
      case RiskLevel.HIGH: return 'Zone A (High Risk)';
      case RiskLevel.VERY_HIGH: return 'Zone AE (High Risk)';
      default: return 'Zone X';
    }
  }

  /**
   * Get seismic zone designation
   */
  private getSeismicZone(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.VERY_LOW: return 'Zone 0 (Very Low Seismicity)';
      case RiskLevel.LOW: return 'Zone 1 (Low Seismicity)';
      case RiskLevel.MODERATE: return 'Zone 2 (Moderate Seismicity)';
      case RiskLevel.HIGH: return 'Zone 3 (High Seismicity)';
      case RiskLevel.VERY_HIGH: return 'Zone 4 (Very High Seismicity)';
      default: return 'Zone 1';
    }
  }

  /**
   * Get soil type based on risk level
   */
  private getSoilType(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.VERY_LOW: return 'Type A (Hard Rock)';
      case RiskLevel.LOW: return 'Type B (Rock)';
      case RiskLevel.MODERATE: return 'Type C (Very Dense Soil/Soft Rock)';
      case RiskLevel.HIGH: return 'Type D (Stiff Soil)';
      case RiskLevel.VERY_HIGH: return 'Type E (Soft Soil)';
      default: return 'Type C';
    }
  }

  /**
   * Get historical earthquake magnitudes
   */
  private getHistoricalMagnitudes(level: RiskLevel, seed: number): number[] {
    const result: number[] = [];
    const count = level === RiskLevel.VERY_LOW ? 0 :
                 level === RiskLevel.LOW ? 1 :
                 level === RiskLevel.MODERATE ? 2 :
                 level === RiskLevel.HIGH ? 3 : 4;
    
    for (let i = 0; i < count; i++) {
      // Generate magnitudes ranging from 3.0 to 7.0 based on risk level
      const baseValue = 3.0 + (i * 0.5);
      const magnitude = baseValue + ((seed + i * 7) % 10) / 10;
      result.push(Number(magnitude.toFixed(1)));
    }
    
    return result;
  }
}

export const naturalHazardService = NaturalHazardService.getInstance();
export default naturalHazardService;