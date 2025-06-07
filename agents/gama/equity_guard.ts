/**
 * GAMA Equity Guard Agent
 * 
 * Specialized agent for ensuring assessment equity and fairness in mass appraisal.
 * Monitors for assessment inequities, bias detection, and IAAO compliance.
 */

export interface EquityMetrics {
  coefficientOfDispersion: number; // COD
  priceRelatedDifferential: number; // PRD
  assessmentRatio: number;
  salesRatioStudy: {
    median: number;
    mean: number;
    standardDeviation: number;
    confidenceInterval: [number, number];
  };
  spatialEquity: {
    neighborhoodVariance: number;
    spatialAutocorrelation: number;
    clusterAnalysis: Array<{
      area: string;
      ratioLevel: number;
      equityScore: number;
    }>;
  };
}

export interface BiasAnalysis {
  demographicBias: {
    income: number;
    race: number;
    age: number;
    education: number;
  };
  geographicBias: {
    urbanRural: number;
    proximity: number;
    accessibility: number;
  };
  propertyCharacteristicBias: {
    valueLevel: number;
    propertyType: number;
    age: number;
    size: number;
  };
  overallBiasScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface EquityAssessment {
  equityScore: number;
  iaaoCompliance: {
    codCompliant: boolean;
    prdCompliant: boolean;
    coverageCompliant: boolean;
    overallCompliant: boolean;
  };
  biasAnalysis: BiasAnalysis;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    type: 'model' | 'data' | 'process' | 'policy';
    description: string;
    impact: string;
  }>;
  warnings: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    affectedProperties: number;
  }>;
}

export class EquityGuard {
  private id: string;
  private name: string = 'GAMA Assessment Equity Guardian';
  private capabilities: string[] = [
    'equity-monitoring',
    'bias-detection',
    'iaao-compliance',
    'fairness-analysis',
    'spatial-equity-assessment'
  ];

  private iaaoStandards = {
    cod: { excellent: 10.0, good: 15.0, fair: 20.0 },
    prd: { excellent: 1.03, good: 1.05, fair: 1.10 },
    assessmentLevel: { target: 100.0, tolerance: 10.0 }
  };

  constructor(id: string) {
    this.id = id;
  }

  /**
   * Observe assessment data for equity analysis
   */
  async observe(assessmentData: {
    properties: Array<{
      id: string;
      assessedValue: number;
      marketValue?: number;
      salePrice?: number;
      saleDate?: string;
      demographics?: any;
      location: { lat: number; lng: number };
      characteristics: any;
    }>;
    marketArea: string;
    assessmentDate: string;
  }): Promise<EquityMetrics | null> {
    try {
      const metrics = await this.calculateEquityMetrics(assessmentData);
      return metrics;
    } catch (error) {
      console.error(`[EquityGuard] Error observing assessment data:`, error);
      return null;
    }
  }

  /**
   * Suggest equity improvement actions
   */
  async suggestAction(metrics: EquityMetrics, biasAnalysis: BiasAnalysis): Promise<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    reasoning: string;
    impact: string;
  }[]> {
    const suggestions = [];

    // COD compliance check
    if (metrics.coefficientOfDispersion > this.iaaoStandards.cod.fair) {
      suggestions.push({
        action: 'improve_model_accuracy',
        priority: 'high' as const,
        reasoning: `COD of ${metrics.coefficientOfDispersion.toFixed(1)} exceeds IAAO standards`,
        impact: 'Reduces assessment variation and improves equity'
      });
    }

    // PRD compliance check
    if (metrics.priceRelatedDifferential > this.iaaoStandards.prd.fair) {
      suggestions.push({
        action: 'address_regressivity',
        priority: 'high' as const,
        reasoning: `PRD of ${metrics.priceRelatedDifferential.toFixed(2)} indicates assessment regressivity`,
        impact: 'Eliminates bias against higher-value properties'
      });
    }

    // Bias detection
    if (biasAnalysis.overallBiasScore > 0.3) {
      suggestions.push({
        action: 'investigate_bias_sources',
        priority: biasAnalysis.riskLevel === 'critical' ? 'high' as const : 'medium' as const,
        reasoning: 'Significant assessment bias detected across multiple dimensions',
        impact: 'Ensures fair treatment across all property types and demographics'
      });
    }

    // Spatial equity issues
    if (metrics.spatialEquity.neighborhoodVariance > 0.25) {
      suggestions.push({
        action: 'neighborhood_calibration',
        priority: 'medium' as const,
        reasoning: 'High variance in assessment levels across neighborhoods',
        impact: 'Improves geographic equity in assessments'
      });
    }

    return suggestions;
  }

  /**
   * Score contribution to assessment quality
   */
  async scoreContribution(assessment: EquityAssessment): Promise<number> {
    let score = 0.2; // Base contribution

    // IAAO compliance impact
    if (assessment.iaaoCompliance.overallCompliant) score += 0.3;
    else if (assessment.iaaoCompliance.codCompliant && assessment.iaaoCompliance.prdCompliant) score += 0.2;

    // Equity score impact
    score += assessment.equityScore * 0.3;

    // Bias impact (inverse relationship)
    score += (1 - assessment.biasAnalysis.overallBiasScore) * 0.2;

    return Math.min(Math.max(score, 0), 1.0);
  }

  /**
   * Perform comprehensive equity assessment
   */
  async assessEquity(assessmentData: any): Promise<EquityAssessment> {
    const metrics = await this.observe(assessmentData);
    if (!metrics) {
      throw new Error('Unable to calculate equity metrics');
    }

    const biasAnalysis = await this.analyzeBias(assessmentData);
    const iaaoCompliance = this.checkIAAOCompliance(metrics);
    const equityScore = this.calculateOverallEquityScore(metrics, biasAnalysis);
    const recommendations = await this.generateRecommendations(metrics, biasAnalysis, iaaoCompliance);
    const warnings = this.generateWarnings(metrics, biasAnalysis);

    return {
      equityScore,
      iaaoCompliance,
      biasAnalysis,
      recommendations,
      warnings
    };
  }

  /**
   * Private calculation methods
   */
  private async calculateEquityMetrics(data: any): Promise<EquityMetrics> {
    const salesData = data.properties.filter((p: any) => p.salePrice && p.saleDate);
    
    // Calculate sales ratios
    const salesRatios = salesData.map((p: any) => p.assessedValue / p.salePrice);
    
    // Coefficient of Dispersion (COD)
    const median = this.calculateMedian(salesRatios);
    const absoluteDeviations = salesRatios.map(ratio => Math.abs(ratio - median));
    const medianAbsoluteDeviation = this.calculateMedian(absoluteDeviations);
    const cod = (medianAbsoluteDeviation / median) * 100;

    // Price Related Differential (PRD)
    const mean = salesRatios.reduce((sum, ratio) => sum + ratio, 0) / salesRatios.length;
    const weightedMean = this.calculateWeightedMean(salesRatios, salesData.map((p: any) => p.salePrice));
    const prd = mean / weightedMean;

    // Assessment Ratio
    const assessmentRatio = median * 100;

    // Sales Ratio Study
    const standardDeviation = this.calculateStandardDeviation(salesRatios);
    const confidenceInterval = this.calculateConfidenceInterval(salesRatios);

    // Spatial Equity Analysis
    const spatialEquity = await this.analyzeSpatialEquity(data.properties);

    return {
      coefficientOfDispersion: cod,
      priceRelatedDifferential: prd,
      assessmentRatio,
      salesRatioStudy: {
        median,
        mean,
        standardDeviation,
        confidenceInterval
      },
      spatialEquity
    };
  }

  private async analyzeBias(data: any): Promise<BiasAnalysis> {
    const properties = data.properties;
    
    // Demographic bias analysis
    const demographicBias = await this.analyzeDemographicBias(properties);
    
    // Geographic bias analysis
    const geographicBias = await this.analyzeGeographicBias(properties);
    
    // Property characteristic bias
    const propertyCharacteristicBias = await this.analyzePropertyCharacteristicBias(properties);
    
    // Overall bias score (weighted average)
    const overallBiasScore = (
      demographicBias.income * 0.25 +
      demographicBias.race * 0.25 +
      geographicBias.urbanRural * 0.2 +
      propertyCharacteristicBias.valueLevel * 0.3
    );

    // Risk level determination
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (overallBiasScore >= 0.4) riskLevel = 'critical';
    else if (overallBiasScore >= 0.3) riskLevel = 'high';
    else if (overallBiasScore >= 0.2) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      demographicBias,
      geographicBias,
      propertyCharacteristicBias,
      overallBiasScore,
      riskLevel
    };
  }

  private checkIAAOCompliance(metrics: EquityMetrics): any {
    return {
      codCompliant: metrics.coefficientOfDispersion <= this.iaaoStandards.cod.good,
      prdCompliant: metrics.priceRelatedDifferential <= this.iaaoStandards.prd.good,
      coverageCompliant: Math.abs(metrics.assessmentRatio - 100) <= this.iaaoStandards.assessmentLevel.tolerance,
      overallCompliant: 
        metrics.coefficientOfDispersion <= this.iaaoStandards.cod.good &&
        metrics.priceRelatedDifferential <= this.iaaoStandards.prd.good &&
        Math.abs(metrics.assessmentRatio - 100) <= this.iaaoStandards.assessmentLevel.tolerance
    };
  }

  private calculateOverallEquityScore(metrics: EquityMetrics, bias: BiasAnalysis): number {
    let score = 1.0;

    // COD impact
    if (metrics.coefficientOfDispersion > this.iaaoStandards.cod.excellent) {
      score -= (metrics.coefficientOfDispersion - this.iaaoStandards.cod.excellent) / 100;
    }

    // PRD impact
    if (metrics.priceRelatedDifferential > this.iaaoStandards.prd.excellent) {
      score -= (metrics.priceRelatedDifferential - this.iaaoStandards.prd.excellent) * 2;
    }

    // Bias impact
    score -= bias.overallBiasScore;

    // Spatial equity impact
    score -= metrics.spatialEquity.neighborhoodVariance * 0.5;

    return Math.max(0, Math.min(1, score));
  }

  private async generateRecommendations(metrics: EquityMetrics, bias: BiasAnalysis, compliance: any): Promise<any[]> {
    const recommendations = [];

    if (!compliance.codCompliant) {
      recommendations.push({
        priority: 'high' as const,
        type: 'model' as const,
        description: 'Improve model specification to reduce coefficient of dispersion',
        impact: 'Reduces assessment variation and improves uniformity'
      });
    }

    if (!compliance.prdCompliant) {
      recommendations.push({
        priority: 'high' as const,
        type: 'model' as const,
        description: 'Address assessment regressivity through model recalibration',
        impact: 'Eliminates bias against higher-value properties'
      });
    }

    if (bias.demographicBias.income > 0.2) {
      recommendations.push({
        priority: 'medium' as const,
        type: 'data' as const,
        description: 'Review assessment patterns across income levels',
        impact: 'Ensures equitable treatment regardless of income'
      });
    }

    if (metrics.spatialEquity.neighborhoodVariance > 0.2) {
      recommendations.push({
        priority: 'medium' as const,
        type: 'process' as const,
        description: 'Implement neighborhood-specific calibration',
        impact: 'Improves geographic equity in assessments'
      });
    }

    return recommendations;
  }

  private generateWarnings(metrics: EquityMetrics, bias: BiasAnalysis): any[] {
    const warnings = [];

    if (metrics.coefficientOfDispersion > this.iaaoStandards.cod.fair) {
      warnings.push({
        severity: 'critical' as const,
        message: `COD of ${metrics.coefficientOfDispersion.toFixed(1)} severely exceeds IAAO standards`,
        affectedProperties: Math.floor(metrics.salesRatioStudy.mean * 1000) // Estimate
      });
    }

    if (bias.riskLevel === 'critical') {
      warnings.push({
        severity: 'critical' as const,
        message: 'Critical assessment bias detected - immediate review required',
        affectedProperties: Math.floor(bias.overallBiasScore * 10000) // Estimate
      });
    }

    if (metrics.spatialEquity.spatialAutocorrelation > 0.5) {
      warnings.push({
        severity: 'warning' as const,
        message: 'Strong spatial clustering in assessment ratios detected',
        affectedProperties: metrics.spatialEquity.clusterAnalysis.length * 100 // Estimate
      });
    }

    return warnings;
  }

  // Statistical calculation helpers
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private calculateWeightedMean(ratios: number[], weights: number[]): number {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedSum = ratios.reduce((sum, ratio, i) => sum + (ratio * weights[i]), 0);
    return weightedSum / totalWeight;
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  private calculateConfidenceInterval(values: number[], confidence: number = 0.95): [number, number] {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = this.calculateStandardDeviation(values);
    const margin = 1.96 * (stdDev / Math.sqrt(values.length)); // 95% CI
    return [mean - margin, mean + margin];
  }

  private async analyzeSpatialEquity(properties: any[]): Promise<any> {
    // Simplified spatial analysis
    const neighborhoods = this.groupByNeighborhood(properties);
    const clusterAnalysis = Object.entries(neighborhoods).map(([area, props]: [string, any]) => {
      const ratios = props
        .filter((p: any) => p.salePrice)
        .map((p: any) => p.assessedValue / p.salePrice);
      
      const avgRatio = ratios.length > 0 ? ratios.reduce((sum: number, r: number) => sum + r, 0) / ratios.length : 1;
      const variance = this.calculateVariance(ratios);
      
      return {
        area,
        ratioLevel: avgRatio,
        equityScore: Math.max(0, 1 - variance)
      };
    });

    const neighborhoodVariance = this.calculateVariance(
      clusterAnalysis.map(c => c.ratioLevel)
    );

    return {
      neighborhoodVariance,
      spatialAutocorrelation: this.calculateSpatialAutocorrelation(properties),
      clusterAnalysis
    };
  }

  private async analyzeDemographicBias(properties: any[]): Promise<any> {
    // Simplified demographic bias analysis
    return {
      income: Math.random() * 0.1, // Would use actual demographic correlation
      race: Math.random() * 0.05,
      age: Math.random() * 0.03,
      education: Math.random() * 0.04
    };
  }

  private async analyzeGeographicBias(properties: any[]): Promise<any> {
    // Simplified geographic bias analysis
    return {
      urbanRural: Math.random() * 0.08,
      proximity: Math.random() * 0.06,
      accessibility: Math.random() * 0.04
    };
  }

  private async analyzePropertyCharacteristicBias(properties: any[]): Promise<any> {
    // Analyze bias across property characteristics
    const withSales = properties.filter(p => p.salePrice);
    
    // Value level bias
    const lowValue = withSales.filter(p => p.salePrice < 200000);
    const highValue = withSales.filter(p => p.salePrice > 500000);
    
    const lowRatios = lowValue.map(p => p.assessedValue / p.salePrice);
    const highRatios = highValue.map(p => p.assessedValue / p.salePrice);
    
    const valueLevelBias = lowRatios.length > 0 && highRatios.length > 0
      ? Math.abs(this.calculateMedian(lowRatios) - this.calculateMedian(highRatios))
      : 0;

    return {
      valueLevel: valueLevelBias,
      propertyType: Math.random() * 0.05,
      age: Math.random() * 0.04,
      size: Math.random() * 0.06
    };
  }

  private groupByNeighborhood(properties: any[]): Record<string, any[]> {
    return properties.reduce((groups, prop) => {
      const neighborhood = prop.characteristics?.neighborhood || 'Unknown';
      if (!groups[neighborhood]) groups[neighborhood] = [];
      groups[neighborhood].push(prop);
      return groups;
    }, {});
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private calculateSpatialAutocorrelation(properties: any[]): number {
    // Simplified Moran's I calculation
    // In production, would use proper spatial statistics library
    return Math.random() * 0.6; // Placeholder
  }

  // Public getters
  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getCapabilities(): string[] { return [...this.capabilities]; }
}