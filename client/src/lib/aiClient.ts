import { apiRequest } from './queryClient';

export type AIProvider = 'openai' | 'xai';

/**
 * Send a message to the AI assistant
 */
export async function sendMessage(message: string, projectId: number, provider?: AIProvider) {
  const response = await apiRequest<{ response: string }>('/v2/ai/message', {
    method: 'POST',
    body: JSON.stringify({ message, projectId, provider }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return response.response;
}

/**
 * Analyze project requirements
 */
export async function analyzeRequirements(projectDetails: string, provider?: AIProvider) {
  const response = await apiRequest<{ analysis: any }>('/v2/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ projectDetails, provider }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return response.analysis;
}

/**
 * Generate software architecture
 */
export async function generateArchitecture(requirements: string, provider?: AIProvider) {
  const response = await apiRequest<{ architecture: any }>('/v2/ai/architecture', {
    method: 'POST',
    body: JSON.stringify({ requirements, provider }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return response.architecture;
}

/**
 * Generate code based on requirements
 */
export async function generateCode(requirements: string, language: string, provider?: AIProvider) {
  const response = await apiRequest<{ code: string, language: string }>('/v2/ai/code', {
    method: 'POST',
    body: JSON.stringify({ requirements, language, provider }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return response;
}

/**
 * Debug code based on error message
 */
export async function debugCode(code: string, error: string, provider?: AIProvider) {
  const response = await apiRequest<{ analysis: string }>('/v2/ai/debug', {
    method: 'POST',
    body: JSON.stringify({ code, error, provider }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return response;
}

/**
 * Generate documentation for code
 */
export async function generateDocumentation(code: string, docType: string, provider?: AIProvider) {
  const response = await apiRequest<{ documentation: string, docType: string }>('/v2/ai/documentation', {
    method: 'POST',
    body: JSON.stringify({ code, docType, provider }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return response;
}

/**
 * Get available AI providers
 */
export async function getAvailableProviders() {
  const response = await apiRequest<{ providers: AIProvider[] }>('/v2/ai/providers');
  return response.providers;
}