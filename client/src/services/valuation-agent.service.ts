/**
 * Valuation Agent Service
 * 
 * This service provides client-side functions to interact with the AI-powered
 * valuation agent API.
 */

import { apiRequest } from '@/lib/queryClient';

// Agent details type
export interface ValuationAgentDetails {
  id: string;
  name: string;
  description: string;
  type: string;
  capabilities: string[];
  availableTools: string[];
}

// Request types
export interface ComprehensiveValuationRequest {
  address: string;
  propertyType: string;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  lotSize?: number;
  additionalFeatures?: string;
  approaches?: string[];
}

export interface MethodologyRecommendationRequest {
  propertyType: string;
  location: string;
  purpose?: string;
  propertyDetails?: string;
}

export interface ValuationExplanationRequest {
  methodology: string;
  audienceLevel?: 'general' | 'beginner' | 'intermediate' | 'advanced' | 'professional';
  specificAspect?: string;
}

export interface ValueIndicationType {
  approach: string;
  value: number;
  confidence?: number;
  strengths?: string;
  weaknesses?: string;
  dataQuality?: string;
}

export interface ValueReconciliationRequest {
  address: string;
  valueIndications: ValueIndicationType[];
  propertyType?: string;
  valuePurpose?: string;
}

export interface ValuationQuestionRequest {
  question: string;
  propertyType?: string;
  location?: string;
  context?: string;
}

// Response interface
interface AgentTaskResponse {
  taskId: string;
  status: 'completed' | 'failed' | 'timeout';
  result: any;
  processingTime: number;
}

/**
 * Get valuation agent details
 */
export async function getValuationAgent(): Promise<ValuationAgentDetails> {
  return apiRequest('/api/agents/valuation');
}

/**
 * Request a comprehensive property valuation using multiple approaches
 */
export async function requestComprehensiveValuation(
  data: ComprehensiveValuationRequest
): Promise<AgentTaskResponse> {
  return apiRequest('/api/agents/valuation/comprehensive', {
    method: 'POST',
    data
  });
}

/**
 * Request a recommendation for which valuation methodology to use
 */
export async function requestMethodologyRecommendation(
  data: MethodologyRecommendationRequest
): Promise<AgentTaskResponse> {
  return apiRequest('/api/agents/valuation/methodology', {
    method: 'POST',
    data
  });
}

/**
 * Request an explanation of a valuation methodology
 */
export async function requestValuationExplanation(
  data: ValuationExplanationRequest
): Promise<AgentTaskResponse> {
  return apiRequest('/api/agents/valuation/explanation', {
    method: 'POST',
    data
  });
}

/**
 * Request value reconciliation from multiple approaches
 */
export async function requestValueReconciliation(
  data: ValueReconciliationRequest
): Promise<AgentTaskResponse> {
  return apiRequest('/api/agents/valuation/reconciliation', {
    method: 'POST',
    data
  });
}

/**
 * Ask a valuation-related question
 */
export async function askValuationQuestion(
  data: ValuationQuestionRequest
): Promise<AgentTaskResponse> {
  return apiRequest('/api/agents/valuation/question', {
    method: 'POST',
    data
  });
}