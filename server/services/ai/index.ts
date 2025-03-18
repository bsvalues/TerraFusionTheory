import { AIServiceFactory } from './factory';
import type { AIProvider } from './factory';
import { BaseAIService } from './base';

// Also import types directly from base
import type { AIModelResponse, AIModelRequestOptions } from './base';

// Export all AI-related types and classes
export { AIServiceFactory, BaseAIService };
export type { AIProvider, AIModelResponse, AIModelRequestOptions };

// Export a factory instance for getting AI services
export const aiFactory = AIServiceFactory.getInstance();

// Helper functions

/**
 * Get the default AI service based on environment configuration
 */
export function getDefaultAIService(): BaseAIService {
  return aiFactory.getDefaultService();
}

/**
 * Get an AI service by provider name
 */
export function getAIService(provider: AIProvider): BaseAIService {
  return aiFactory.getService(provider);
}

/**
 * Generate text using the default AI provider
 */
export async function generateText(
  prompt: string,
  options?: AIModelRequestOptions & { provider?: AIProvider }
): Promise<AIModelResponse> {
  const provider = options?.provider;
  const service = provider ? aiFactory.getService(provider) : aiFactory.getDefaultService();
  
  // Remove provider from options if it exists
  if (options?.provider) {
    const { provider, ...restOptions } = options;
    options = restOptions;
  }
  
  return service.generateText(prompt, options);
}

/**
 * Generate chat completion using the default AI provider
 */
export async function generateChatCompletion(
  messages: Array<{ role: string; content: string | Array<any> }>,
  options?: AIModelRequestOptions & { provider?: AIProvider }
): Promise<AIModelResponse> {
  const provider = options?.provider;
  const service = provider ? aiFactory.getService(provider) : aiFactory.getDefaultService();
  
  // Remove provider from options if it exists
  if (options?.provider) {
    const { provider, ...restOptions } = options;
    options = restOptions;
  }
  
  return service.generateChatCompletion(messages, options);
}

/**
 * Process image and generate text using the default AI provider
 */
export async function processImage(
  base64Image: string,
  prompt: string,
  options?: AIModelRequestOptions & { provider?: AIProvider }
): Promise<AIModelResponse> {
  const provider = options?.provider;
  const service = provider ? aiFactory.getService(provider) : aiFactory.getDefaultService();
  
  // Remove provider from options if it exists
  if (options?.provider) {
    const { provider, ...restOptions } = options;
    options = restOptions;
  }
  
  return service.processImage(base64Image, prompt, options);
}

/**
 * Get a list of all available AI providers
 */
export function getAvailableAIProviders(): AIProvider[] {
  return aiFactory.getAvailableProviders();
}