/**
 * Neighborhood Comparison Service
 * 
 * This service provides functionality for comparing neighborhoods
 * across multiple metrics and generating visualizations.
 */

import neighborhoodService, { NeighborhoodMetrics } from './neighborhood.service';

// Types
interface ComparisonResult {
  neighborhoodData: Record<string, NeighborhoodMetrics>;
  metrics: Record<string, { 
    label: string;
    description: string;
    min: number;
    max: number;
    format: string;
    higherIsBetter: boolean;
  }>;
  best: Record<string, number>;
  recommendation?: {
    neighborhood: string;
    score: number;
    reasons: string[];
  };
}

// Metric definitions with metadata
const METRIC_DEFINITIONS = {
  median_home_price: {
    label: 'Median Home Price',
    description: 'The median price of homes in the neighborhood',
    min: 0,
    max: 1000000,
    format: 'currency',
    higherIsBetter: false // Lower is better for affordability
  },
  price_per_sqft: {
    label: 'Price per Sqft',
    description: 'Average price per square foot of homes',
    min: 0,
    max: 1000,
    format: 'currency',
    higherIsBetter: false // Lower is better for affordability
  },
  median_rent: {
    label: 'Median Rent',
    description: 'The median monthly rent in the neighborhood',
    min: 0,
    max: 5000,
    format: 'currency',
    higherIsBetter: false // Lower is better for affordability
  },
  price_growth: {
    label: 'Price Growth',
    description: 'Annual percentage growth in home prices',
    min: -10,
    max: 30,
    format: 'percentage',
    higherIsBetter: true
  },
  inventory_level: {
    label: 'Inventory Level',
    description: 'Number of homes available for sale',
    min: 0,
    max: 100,
    format: 'number',
    higherIsBetter: true // More inventory is better for buyers
  },
  days_on_market: {
    label: 'Days on Market',
    description: 'Average number of days homes stay on the market before selling',
    min: 0,
    max: 180,
    format: 'number',
    higherIsBetter: false // Lower is faster selling
  },
  affordability_index: {
    label: 'Affordability Index',
    description: 'Rating of overall housing affordability (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  safety_score: {
    label: 'Safety Score',
    description: 'Rating of neighborhood safety (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  crime_rate: {
    label: 'Crime Rate',
    description: 'Annual crimes per 1,000 residents',
    min: 0,
    max: 100,
    format: 'number',
    higherIsBetter: false
  },
  noise_level: {
    label: 'Noise Level',
    description: 'Average ambient noise level (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: false
  },
  air_quality: {
    label: 'Air Quality',
    description: 'Rating of air quality (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  walkability_score: {
    label: 'Walkability Score',
    description: 'Rating of how walkable the neighborhood is (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  commute_time: {
    label: 'Commute Time',
    description: 'Average commute time in minutes',
    min: 0,
    max: 60,
    format: 'minutes',
    higherIsBetter: false
  },
  parks_access: {
    label: 'Parks Access',
    description: 'Rating of access to parks and green spaces (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  school_rating: {
    label: 'School Rating',
    description: 'Average rating of schools in the area (0-10)',
    min: 0,
    max: 10,
    format: 'score',
    higherIsBetter: true
  },
  student_teacher_ratio: {
    label: 'Student-Teacher Ratio',
    description: 'Average number of students per teacher',
    min: 5,
    max: 30,
    format: 'ratio',
    higherIsBetter: false
  },
  test_scores: {
    label: 'Test Scores',
    description: 'Average standardized test scores (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  college_readiness: {
    label: 'College Readiness',
    description: 'Rating of how well schools prepare students for college (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  graduation_rate: {
    label: 'Graduation Rate',
    description: 'Percentage of students who graduate high school',
    min: 0,
    max: 100,
    format: 'percentage',
    higherIsBetter: true
  },
  education_level: {
    label: 'Education Level',
    description: 'Percentage of residents with college degrees',
    min: 0,
    max: 100,
    format: 'percentage',
    higherIsBetter: true
  },
  restaurant_access: {
    label: 'Restaurant Access',
    description: 'Rating of access to restaurants (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  shopping_access: {
    label: 'Shopping Access',
    description: 'Rating of access to shopping (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  healthcare_access: {
    label: 'Healthcare Access',
    description: 'Rating of access to healthcare facilities (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  entertainment_venues: {
    label: 'Entertainment Venues',
    description: 'Number of entertainment venues within 5 miles',
    min: 0,
    max: 50,
    format: 'number',
    higherIsBetter: true
  },
  grocery_access: {
    label: 'Grocery Access',
    description: 'Rating of access to grocery stores (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  public_transport: {
    label: 'Public Transport',
    description: 'Rating of public transportation options (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  },
  population_density: {
    label: 'Population Density',
    description: 'People per square mile',
    min: 0,
    max: 10000,
    format: 'number',
    higherIsBetter: null // Neutral - preference varies
  },
  median_age: {
    label: 'Median Age',
    description: 'Median age of residents',
    min: 20,
    max: 65,
    format: 'number',
    higherIsBetter: null // Neutral - preference varies
  },
  household_size: {
    label: 'Household Size',
    description: 'Average number of people per household',
    min: 1,
    max: 5,
    format: 'number',
    higherIsBetter: null // Neutral - preference varies
  },
  income_level: {
    label: 'Income Level',
    description: 'Median household income',
    min: 30000,
    max: 200000,
    format: 'currency',
    higherIsBetter: true
  },
  diversity_index: {
    label: 'Diversity Index',
    description: 'Rating of neighborhood diversity (0-100)',
    min: 0,
    max: 100,
    format: 'score',
    higherIsBetter: true
  }
};

// Service implementation
class NeighborhoodComparisonService {
  /**
   * Compare neighborhoods across selected metrics
   * @param city The city name
   * @param state The state code
   * @param neighborhoods Array of neighborhood names to compare
   * @param metrics Array of metric keys to compare
   * @returns Comparison data and visualizations
   */
  async compareNeighborhoods(
    city: string,
    state: string,
    neighborhoods: string[],
    metrics: string[]
  ): Promise<ComparisonResult> {
    try {
      if (neighborhoods.length < 2) {
        throw new Error('At least two neighborhoods are required for comparison');
      }
      
      if (metrics.length === 0) {
        throw new Error('At least one metric is required for comparison');
      }
      
      // Get all neighborhoods to find IDs
      const allNeighborhoods = await neighborhoodService.getNeighborhoods(city, state);
      
      // Create neighborhood ID mapping
      const neighborhoodIdMap: Record<string, string> = {};
      for (const n of allNeighborhoods) {
        if (neighborhoods.includes(n.name)) {
          neighborhoodIdMap[n.name] = n.id;
        }
      }
      
      // Fetch metrics for each neighborhood
      const neighborhoodData: Record<string, NeighborhoodMetrics> = {};
      
      for (const name of neighborhoods) {
        const id = neighborhoodIdMap[name];
        if (!id) {
          console.warn(`Neighborhood ID not found for: ${name}`);
          continue;
        }
        
        const metricsData = await neighborhoodService.getNeighborhoodMetrics(id);
        neighborhoodData[name] = metricsData;
      }
      
      // Extract metric definitions for selected metrics
      const metricDefinitions: Record<string, any> = {};
      for (const metric of metrics) {
        if (METRIC_DEFINITIONS[metric as keyof typeof METRIC_DEFINITIONS]) {
          metricDefinitions[metric] = METRIC_DEFINITIONS[metric as keyof typeof METRIC_DEFINITIONS];
        }
      }
      
      // Find the best value for each metric
      const bestValues: Record<string, number> = {};
      
      for (const metric of metrics) {
        const definition = METRIC_DEFINITIONS[metric as keyof typeof METRIC_DEFINITIONS];
        if (!definition) continue;
        
        const higherIsBetter = definition.higherIsBetter;
        
        if (higherIsBetter === null) {
          // For neutral metrics, we don't calculate "best"
          bestValues[metric] = 0;
          continue;
        }
        
        let bestValue = higherIsBetter ? Number.MIN_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
        
        for (const name of neighborhoods) {
          const value = neighborhoodData[name]?.[metric as keyof NeighborhoodMetrics];
          if (value === undefined) continue;
          
          if (higherIsBetter && value > bestValue) {
            bestValue = value;
          } else if (!higherIsBetter && value < bestValue) {
            bestValue = value;
          }
        }
        
        bestValues[metric] = bestValue;
      }
      
      // Generate AI recommendation
      const recommendation = this.generateRecommendation(neighborhoods, neighborhoodData, metrics, metricDefinitions);
      
      return {
        neighborhoodData,
        metrics: metricDefinitions,
        best: bestValues,
        recommendation
      };
    } catch (error) {
      console.error('Error comparing neighborhoods:', error);
      throw new Error('Failed to compare neighborhoods');
    }
  }
  
  /**
   * Generate a recommendation based on comparison data
   * @param neighborhoods List of neighborhoods being compared
   * @param data Neighborhood metrics data
   * @param metrics List of metrics being compared
   * @param metricDefinitions Definitions of metrics
   * @returns Recommendation object with neighborhood, score and reasons
   */
  private generateRecommendation(
    neighborhoods: string[],
    data: Record<string, NeighborhoodMetrics>,
    metrics: string[],
    metricDefinitions: Record<string, any>
  ) {
    // Calculate scores for each neighborhood
    const scores: Record<string, { total: number; count: number; strengths: string[] }> = {};
    
    for (const neighborhood of neighborhoods) {
      scores[neighborhood] = { total: 0, count: 0, strengths: [] };
      
      for (const metric of metrics) {
        const definition = metricDefinitions[metric];
        if (!definition || definition.higherIsBetter === null) continue;
        
        const value = data[neighborhood]?.[metric as keyof NeighborhoodMetrics];
        if (value === undefined) continue;
        
        // Normalize the value to a 0-100 scale
        const min = definition.min;
        const max = definition.max;
        let normalizedValue = ((value - min) / (max - min)) * 100;
        
        // If lower is better, invert the normalized value
        if (!definition.higherIsBetter) {
          normalizedValue = 100 - normalizedValue;
        }
        
        // Add to the neighborhood's score
        scores[neighborhood].total += normalizedValue;
        scores[neighborhood].count++;
        
        // Check if this is a strength for this neighborhood
        let isStrength = true;
        for (const otherNeighborhood of neighborhoods) {
          if (otherNeighborhood === neighborhood) continue;
          
          const otherValue = data[otherNeighborhood]?.[metric as keyof NeighborhoodMetrics];
          if (otherValue === undefined) continue;
          
          if (definition.higherIsBetter && otherValue >= value) {
            isStrength = false;
            break;
          } else if (!definition.higherIsBetter && otherValue <= value) {
            isStrength = false;
            break;
          }
        }
        
        if (isStrength) {
          scores[neighborhood].strengths.push(
            `Best ${definition.label.toLowerCase()} among compared neighborhoods`
          );
        }
      }
    }
    
    // Find the neighborhood with the highest average score
    let bestNeighborhood = '';
    let highestScore = 0;
    
    for (const [neighborhood, score] of Object.entries(scores)) {
      if (score.count === 0) continue;
      
      const averageScore = Math.round(score.total / score.count);
      
      if (averageScore > highestScore) {
        highestScore = averageScore;
        bestNeighborhood = neighborhood;
      }
    }
    
    if (!bestNeighborhood) {
      return undefined;
    }
    
    // Generate general reasons if we don't have enough strengths
    const strengths = scores[bestNeighborhood].strengths;
    
    if (strengths.length < 2) {
      // Add generic reason based on top metrics
      for (const metric of metrics.slice(0, 3)) {
        const definition = metricDefinitions[metric];
        if (!definition) continue;
        
        const value = data[bestNeighborhood]?.[metric as keyof NeighborhoodMetrics];
        if (value === undefined) continue;
        
        let qualitativeDescription;
        const normalizedValue = ((value - definition.min) / (definition.max - definition.min)) * 100;
        
        if (normalizedValue > 80) {
          qualitativeDescription = 'excellent';
        } else if (normalizedValue > 60) {
          qualitativeDescription = 'very good';
        } else if (normalizedValue > 40) {
          qualitativeDescription = 'good';
        } else {
          continue; // Skip if not good enough to highlight
        }
        
        const reason = `Has ${qualitativeDescription} ${definition.label.toLowerCase()}`;
        if (!strengths.includes(reason)) {
          strengths.push(reason);
        }
      }
    }
    
    // Add a generic reason if we still don't have enough
    if (strengths.length === 0) {
      strengths.push('Best overall balance of your selected metrics');
    }
    
    // Generate the recommendation
    return {
      neighborhood: bestNeighborhood,
      score: highestScore,
      reasons: strengths
    };
  }
}

// Export singleton instance
const neighborhoodComparisonService = new NeighborhoodComparisonService();
export default neighborhoodComparisonService;