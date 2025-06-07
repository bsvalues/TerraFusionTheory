/**
 * GAMA Comparable Sales Agent
 * 
 * Specialized agent for selecting and analyzing comparable sales for property valuation.
 * Handles similarity scoring, adjustment calculations, and comp validation.
 */

export interface ComparableSale {
  id: string;
  address: string;
  salePrice: number;
  saleDate: string;
  livingArea: number;
  lotSize: number;
  bedrooms: number;
  bathrooms: number;
  age: number;
  condition: string;
  quality: string;
  latitude: number;
  longitude: number;
  neighborhood: string;
  daysOnMarket: number;
  financing: string;
  propertyType: string;
}

export interface SimilarityScore {
  overall: number;
  factors: {
    location: number;
    size: number;
    age: number;
    quality: number;
    timing: number;
  };
  adjustments: {
    locationAdjustment: number;
    sizeAdjustment: number;
    ageAdjustment: number;
    qualityAdjustment: number;
    timeAdjustment: number;
    netAdjustment: number;
  };
}

export interface CompAnalysis {
  selectedComps: Array<ComparableSale & { similarityScore: SimilarityScore; adjustedPrice: number }>;
  indicatedValue: number;
  confidence: number;
  qualityMetrics: {
    sampleSize: number;
    averageSimilarity: number;
    adjustmentRange: number;
    timeSpread: number;
  };
  recommendations: string[];
  warnings: string[];
}

export class CompAgent {
  private id: string;
  private name: string = 'GAMA Comparable Sales Agent';
  private capabilities: string[] = [
    'comp-selection',
    'similarity-analysis',
    'price-adjustment',
    'market-validation',
    'comp-quality-assessment'
  ];

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Observe subject property for comp analysis
   */
  async observe(subjectProperty: any): Promise<any> {
    try {
      return {
        address: subjectProperty.address,
        livingArea: subjectProperty.living_area || subjectProperty.grossLivingArea || 0,
        lotSize: subjectProperty.lot_size || subjectProperty.landSize || 0,
        bedrooms: subjectProperty.bedrooms || 0,
        bathrooms: subjectProperty.bathrooms || 0,
        age: subjectProperty.year_built ? new Date().getFullYear() - subjectProperty.year_built : 0,
        condition: subjectProperty.condition || 'average',
        quality: subjectProperty.quality || 'average',
        latitude: subjectProperty.latitude || 0,
        longitude: subjectProperty.longitude || 0,
        neighborhood: subjectProperty.neighborhood || 'unknown',
        propertyType: subjectProperty.property_type || 'single_family'
      };
    } catch (error) {
      console.error(`[CompAgent] Error observing subject property:`, error);
      return null;
    }
  }

  /**
   * Suggest comp selection actions
   */
  async suggestAction(subjectProperty: any, marketData: any): Promise<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    parameters: any;
  }[]> {
    const suggestions = [];

    // Assess available sales data
    const dataAvailability = this.assessDataAvailability(marketData);
    if (dataAvailability.recentSales < 5) {
      suggestions.push({
        action: 'expand_search_radius',
        priority: 'high' as const,
        reasoning: 'Insufficient recent sales in immediate area',
        parameters: { newRadius: dataAvailability.suggestedRadius }
      });
    }

    // Check time window
    if (dataAvailability.averageAge > 6) {
      suggestions.push({
        action: 'expand_time_window',
        priority: 'medium' as const,
        reasoning: 'Recent sales are limited, consider older sales with time adjustments',
        parameters: { timeWindow: 18 }
      });
    }

    // Assess property uniqueness
    const uniqueness = this.assessPropertyUniqueness(subjectProperty, marketData);
    if (uniqueness > 0.8) {
      suggestions.push({
        action: 'use_cost_approach',
        priority: 'high' as const,
        reasoning: 'Property appears unique, comparable sales may not be reliable',
        parameters: { fallbackMethod: 'cost_approach' }
      });
    }

    return suggestions;
  }

  /**
   * Score agent contribution to valuation
   */
  async scoreContribution(analysis: CompAnalysis): Promise<number> {
    let score = 0.4; // Base contribution

    // Increase score based on comp quality
    if (analysis.qualityMetrics.sampleSize >= 5) score += 0.2;
    if (analysis.qualityMetrics.averageSimilarity >= 0.8) score += 0.2;
    if (analysis.qualityMetrics.adjustmentRange <= 0.2) score += 0.1;
    if (analysis.qualityMetrics.timeSpread <= 6) score += 0.1;

    // Reduce score for warnings
    score -= analysis.warnings.length * 0.05;

    return Math.min(Math.max(score, 0), 1.0);
  }

  /**
   * Select and analyze comparable sales
   */
  async selectComparables(subjectProperty: any, availableSales: ComparableSale[], 
                         criteria: {
                           maxDistance?: number;
                           maxAge?: number;
                           minSimilarity?: number;
                           maxComps?: number;
                         } = {}): Promise<CompAnalysis> {
    
    const {
      maxDistance = 1.0, // miles
      maxAge = 12, // months
      minSimilarity = 0.6,
      maxComps = 10
    } = criteria;

    // Filter sales by basic criteria
    const filteredSales = this.filterSales(availableSales, {
      maxDistance,
      maxAge,
      propertyType: subjectProperty.propertyType,
      subjectLocation: { lat: subjectProperty.latitude, lng: subjectProperty.longitude }
    });

    // Calculate similarity scores for each sale
    const scoredSales = filteredSales.map(sale => ({
      ...sale,
      similarityScore: this.calculateSimilarityScore(subjectProperty, sale),
      adjustedPrice: 0 // Will be calculated after similarity scoring
    }));

    // Filter by minimum similarity and sort by score
    const qualifiedSales = scoredSales
      .filter(sale => sale.similarityScore.overall >= minSimilarity)
      .sort((a, b) => b.similarityScore.overall - a.similarityScore.overall)
      .slice(0, maxComps);

    // Calculate adjusted prices
    qualifiedSales.forEach(sale => {
      sale.adjustedPrice = this.calculateAdjustedPrice(sale.salePrice, sale.similarityScore.adjustments);
    });

    // Calculate indicated value
    const indicatedValue = this.calculateIndicatedValue(qualifiedSales);
    
    // Assess analysis quality
    const qualityMetrics = this.assessAnalysisQuality(qualifiedSales);
    const confidence = this.calculateConfidence(qualityMetrics);
    
    // Generate recommendations and warnings
    const recommendations = this.generateRecommendations(qualifiedSales, qualityMetrics);
    const warnings = this.generateWarnings(qualifiedSales, qualityMetrics);

    return {
      selectedComps: qualifiedSales,
      indicatedValue,
      confidence,
      qualityMetrics,
      recommendations,
      warnings
    };
  }

  /**
   * Private helper methods
   */
  private assessDataAvailability(marketData: any): {
    recentSales: number;
    averageAge: number;
    suggestedRadius: number;
  } {
    // Simulate data availability assessment
    const recentSales = marketData?.recentSales?.length || 3;
    const averageAge = marketData?.averageSaleAge || 8;
    
    let suggestedRadius = 0.5; // Start with 0.5 mile radius
    if (recentSales < 3) suggestedRadius = 1.0;
    if (recentSales < 5) suggestedRadius = 1.5;
    
    return { recentSales, averageAge, suggestedRadius };
  }

  private assessPropertyUniqueness(subject: any, marketData: any): number {
    // Assess how unique the subject property is compared to market
    let uniquenessScore = 0;
    
    // Size uniqueness
    const avgSize = marketData?.averageLivingArea || 2000;
    const sizeDiff = Math.abs(subject.livingArea - avgSize) / avgSize;
    uniquenessScore += Math.min(sizeDiff, 0.3);
    
    // Lot size uniqueness
    const avgLotSize = marketData?.averageLotSize || 8000;
    const lotDiff = Math.abs(subject.lotSize - avgLotSize) / avgLotSize;
    uniquenessScore += Math.min(lotDiff, 0.3);
    
    // Age uniqueness
    const avgAge = marketData?.averageAge || 25;
    const ageDiff = Math.abs(subject.age - avgAge) / avgAge;
    uniquenessScore += Math.min(ageDiff, 0.2);
    
    // Quality uniqueness
    if (subject.quality === 'excellent' || subject.quality === 'poor') {
      uniquenessScore += 0.2;
    }
    
    return Math.min(uniquenessScore, 1.0);
  }

  private filterSales(sales: ComparableSale[], filters: any): ComparableSale[] {
    return sales.filter(sale => {
      // Distance filter
      const distance = this.calculateDistance(
        filters.subjectLocation.lat, filters.subjectLocation.lng,
        sale.latitude, sale.longitude
      );
      if (distance > filters.maxDistance) return false;
      
      // Age filter
      const saleAge = this.calculateSaleAge(sale.saleDate);
      if (saleAge > filters.maxAge) return false;
      
      // Property type filter
      if (sale.propertyType !== filters.propertyType) return false;
      
      return true;
    });
  }

  private calculateSimilarityScore(subject: any, comp: ComparableSale): SimilarityScore {
    // Location similarity
    const distance = this.calculateDistance(
      subject.latitude, subject.longitude,
      comp.latitude, comp.longitude
    );
    const locationScore = Math.max(0, 1 - (distance / 2)); // Max 2 miles for full score

    // Size similarity
    const sizeDiff = Math.abs(subject.livingArea - comp.livingArea) / subject.livingArea;
    const sizeScore = Math.max(0, 1 - sizeDiff);

    // Age similarity
    const ageDiff = Math.abs(subject.age - comp.age);
    const ageScore = Math.max(0, 1 - (ageDiff / 20)); // 20-year span for full range

    // Quality similarity
    const qualityScore = this.compareQuality(subject.quality, comp.quality);

    // Timing similarity
    const saleAge = this.calculateSaleAge(comp.saleDate);
    const timingScore = Math.max(0, 1 - (saleAge / 12)); // 12 months for full score

    // Overall similarity (weighted average)
    const overall = (
      locationScore * 0.3 +
      sizeScore * 0.25 +
      ageScore * 0.2 +
      qualityScore * 0.15 +
      timingScore * 0.1
    );

    // Calculate adjustments
    const adjustments = this.calculateAdjustments(subject, comp);

    return {
      overall,
      factors: {
        location: locationScore,
        size: sizeScore,
        age: ageScore,
        quality: qualityScore,
        timing: timingScore
      },
      adjustments
    };
  }

  private calculateAdjustments(subject: any, comp: ComparableSale): any {
    const adjustments = {
      locationAdjustment: 0,
      sizeAdjustment: 0,
      ageAdjustment: 0,
      qualityAdjustment: 0,
      timeAdjustment: 0,
      netAdjustment: 0
    };

    // Size adjustment ($50 per sq ft difference)
    const sizeDiff = subject.livingArea - comp.livingArea;
    adjustments.sizeAdjustment = sizeDiff * 50;

    // Age adjustment (2% per year difference)
    const ageDiff = comp.age - subject.age;
    adjustments.ageAdjustment = comp.salePrice * (ageDiff * 0.02);

    // Quality adjustment
    adjustments.qualityAdjustment = this.calculateQualityAdjustment(subject.quality, comp.quality, comp.salePrice);

    // Time adjustment (0.5% per month)
    const saleAge = this.calculateSaleAge(comp.saleDate);
    adjustments.timeAdjustment = comp.salePrice * (saleAge * 0.005);

    // Location adjustment (simplified)
    const distance = this.calculateDistance(
      subject.latitude, subject.longitude,
      comp.latitude, comp.longitude
    );
    if (distance > 0.5) {
      adjustments.locationAdjustment = comp.salePrice * (-0.02 * distance);
    }

    // Net adjustment
    adjustments.netAdjustment = Object.values(adjustments)
      .filter(val => typeof val === 'number' && val !== adjustments.netAdjustment)
      .reduce((sum, val) => sum + val, 0);

    return adjustments;
  }

  private calculateAdjustedPrice(salePrice: number, adjustments: any): number {
    return salePrice + adjustments.netAdjustment;
  }

  private calculateIndicatedValue(comps: Array<{ adjustedPrice: number; similarityScore: SimilarityScore }>): number {
    if (comps.length === 0) return 0;

    // Weight by similarity score
    let weightedSum = 0;
    let totalWeights = 0;

    comps.forEach(comp => {
      const weight = comp.similarityScore.overall;
      weightedSum += comp.adjustedPrice * weight;
      totalWeights += weight;
    });

    return totalWeights > 0 ? weightedSum / totalWeights : 0;
  }

  private assessAnalysisQuality(comps: Array<{ similarityScore: SimilarityScore; adjustedPrice: number; saleDate: string }>): any {
    const sampleSize = comps.length;
    const averageSimilarity = comps.reduce((sum, comp) => sum + comp.similarityScore.overall, 0) / sampleSize;
    
    // Calculate adjustment range
    const adjustmentPercentages = comps.map(comp => 
      Math.abs(comp.similarityScore.adjustments.netAdjustment) / comp.adjustedPrice
    );
    const adjustmentRange = Math.max(...adjustmentPercentages) - Math.min(...adjustmentPercentages);
    
    // Calculate time spread
    const saleAges = comps.map(comp => this.calculateSaleAge(comp.saleDate));
    const timeSpread = Math.max(...saleAges) - Math.min(...saleAges);

    return {
      sampleSize,
      averageSimilarity,
      adjustmentRange,
      timeSpread
    };
  }

  private calculateConfidence(qualityMetrics: any): number {
    let confidence = 0.5; // Base confidence

    // Sample size impact
    if (qualityMetrics.sampleSize >= 5) confidence += 0.2;
    else if (qualityMetrics.sampleSize >= 3) confidence += 0.1;

    // Similarity impact
    confidence += qualityMetrics.averageSimilarity * 0.3;

    // Adjustment range impact (lower is better)
    confidence += Math.max(0, 0.2 - qualityMetrics.adjustmentRange);

    // Time spread impact (lower is better)
    confidence += Math.max(0, 0.1 - (qualityMetrics.timeSpread / 12 * 0.1));

    return Math.min(Math.max(confidence, 0.1), 0.95);
  }

  private generateRecommendations(comps: any[], qualityMetrics: any): string[] {
    const recommendations = [];

    if (qualityMetrics.sampleSize < 3) {
      recommendations.push('Consider expanding search radius or time window for more comparables');
    }

    if (qualityMetrics.averageSimilarity < 0.7) {
      recommendations.push('Low similarity scores suggest relying more heavily on regression analysis');
    }

    if (qualityMetrics.adjustmentRange > 0.3) {
      recommendations.push('Large adjustment range indicates potential market heterogeneity');
    }

    if (qualityMetrics.timeSpread > 9) {
      recommendations.push('Wide time spread in sales - ensure time adjustments are accurate');
    }

    return recommendations;
  }

  private generateWarnings(comps: any[], qualityMetrics: any): string[] {
    const warnings = [];

    if (qualityMetrics.sampleSize < 2) {
      warnings.push('Insufficient comparable sales for reliable analysis');
    }

    if (qualityMetrics.averageSimilarity < 0.5) {
      warnings.push('Poor similarity scores - comparable sales approach may not be reliable');
    }

    if (qualityMetrics.adjustmentRange > 0.5) {
      warnings.push('Excessive adjustments required - verify comp selection criteria');
    }

    return warnings;
  }

  // Utility methods
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private calculateSaleAge(saleDate: string): number {
    const sale = new Date(saleDate);
    const now = new Date();
    return (now.getTime() - sale.getTime()) / (1000 * 60 * 60 * 24 * 30);
  }

  private compareQuality(subjectQuality: string, compQuality: string): number {
    const qualityLevels: Record<string, number> = {
      'poor': 1,
      'fair': 2,
      'average': 3,
      'good': 4,
      'very good': 5,
      'excellent': 6
    };

    const subjectLevel = qualityLevels[subjectQuality.toLowerCase()] || 3;
    const compLevel = qualityLevels[compQuality.toLowerCase()] || 3;
    const diff = Math.abs(subjectLevel - compLevel);
    
    return Math.max(0, 1 - (diff / 5));
  }

  private calculateQualityAdjustment(subjectQuality: string, compQuality: string, compPrice: number): number {
    const qualityLevels: Record<string, number> = {
      'poor': 1,
      'fair': 2,
      'average': 3,
      'good': 4,
      'very good': 5,
      'excellent': 6
    };

    const subjectLevel = qualityLevels[subjectQuality.toLowerCase()] || 3;
    const compLevel = qualityLevels[compQuality.toLowerCase()] || 3;
    const diff = subjectLevel - compLevel;
    
    // 5% adjustment per quality level difference
    return compPrice * (diff * 0.05);
  }

  // Public getters
  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getCapabilities(): string[] { return [...this.capabilities]; }
}