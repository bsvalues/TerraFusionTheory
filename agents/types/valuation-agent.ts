/**
 * Valuation Agent Type Definition
 * 
 * This file defines the type and configuration for a specialized AI agent
 * focused on property valuation and appraisal methodologies.
 */

import { AgentCapability, AgentConfig } from '../interfaces/agent-interface';

/**
 * Configuration specific to valuation agents
 */
export interface ValuationAgentConfig extends AgentConfig {
  appraisalMethodologies?: Array<
    'sales_comparison' | 
    'cost_approach' | 
    'income_approach' | 
    'mass_appraisal' | 
    'automated_valuation'
  >;
  
  confidenceScoring?: boolean;
  explainabilityLevel?: 'basic' | 'detailed' | 'comprehensive';
  
  // Configuration for specific approaches
  salesComparison?: {
    adjustmentFactors?: string[];
    maxComparables?: number;
    maxDistanceMiles?: number;
    maxAgeDays?: number;
    similarityThreshold?: number;
  };
  
  costApproach?: {
    depreciationModel?: 'linear' | 'age-life' | 'modified';
    costManualSource?: string;
    includeExternalObsolescence?: boolean;
  };
  
  incomeApproach?: {
    capitalizationRateSource?: 'market' | 'buildup' | 'band_of_investment';
    vacancyAssumption?: number;
    expenseRatioDefault?: number;
  };
  
  massAppraisal?: {
    modelType?: 'linear_regression' | 'random_forest' | 'gradient_boosting';
    qualityMetrics?: Array<'cod' | 'prd' | 'prb'>;
    stratification?: string[];
  };
  
  automatedValuation?: {
    confidenceInterval?: number;
    updateFrequency?: 'daily' | 'weekly' | 'monthly';
    dataSourcePriority?: string[];
  };
}

/**
 * Default valuation agent configuration
 */
export const DEFAULT_VALUATION_AGENT_CONFIG: ValuationAgentConfig = {
  name: 'Valuation Expert',
  description: 'Specialized agent for property valuation using multiple appraisal methodologies',
  capabilities: [
    AgentCapability.REAL_ESTATE_ANALYSIS,
    AgentCapability.REASONING,
    AgentCapability.TEXT_GENERATION,
    AgentCapability.TEXT_UNDERSTANDING,
    AgentCapability.TOOL_USE,
    AgentCapability.VECTOR_SEARCH
  ],
  tools: ['mcp'],
  appraisalMethodologies: [
    'sales_comparison',
    'cost_approach', 
    'income_approach',
    'mass_appraisal',
    'automated_valuation'
  ],
  confidenceScoring: true,
  explainabilityLevel: 'comprehensive',
  
  salesComparison: {
    adjustmentFactors: [
      'market_conditions',
      'location',
      'site_size',
      'quality',
      'age',
      'condition',
      'gross_building_area',
      'functionality',
      'amenities',
      'garage_parking'
    ],
    maxComparables: 5,
    maxDistanceMiles: 0.5,
    maxAgeDays: 180,
    similarityThreshold: 0.7
  },
  
  costApproach: {
    depreciationModel: 'modified',
    costManualSource: 'marshall_swift',
    includeExternalObsolescence: true
  },
  
  incomeApproach: {
    capitalizationRateSource: 'market',
    vacancyAssumption: 5,
    expenseRatioDefault: 35
  },
  
  massAppraisal: {
    modelType: 'gradient_boosting',
    qualityMetrics: ['cod', 'prd', 'prb'],
    stratification: ['neighborhood', 'property_type', 'age_group']
  },
  
  automatedValuation: {
    confidenceInterval: 95,
    updateFrequency: 'weekly',
    dataSourcePriority: ['recent_sales', 'active_listings', 'tax_assessment', 'previous_valuations']
  }
};