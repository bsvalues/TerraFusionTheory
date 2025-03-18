import { BaseAIService } from './base';
import { OpenAIService } from './openai.service';
import { XaiService } from './xai.service';

/**
 * Available AI providers
 */
export type AIProvider = 'openai' | 'xai';

/**
 * Factory for creating and caching AI service instances
 */
export class AIServiceFactory {
  private static instance: AIServiceFactory;
  private services: Map<AIProvider, BaseAIService> = new Map();
  
  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of the factory
   */
  public static getInstance(): AIServiceFactory {
    if (!AIServiceFactory.instance) {
      AIServiceFactory.instance = new AIServiceFactory();
    }
    
    return AIServiceFactory.instance;
  }

  /**
   * Get an AI service by provider
   */
  public getService(provider: AIProvider): BaseAIService {
    if (!this.services.has(provider)) {
      this.services.set(provider, this.createService(provider));
    }
    
    return this.services.get(provider)!;
  }

  /**
   * Create a new instance of an AI service
   */
  private createService(provider: AIProvider): BaseAIService {
    switch (provider) {
      case 'openai':
        return new OpenAIService();
      case 'xai':
        return new XaiService();
      default:
        // Return OpenAI as the default provider
        console.warn(`Unknown AI provider: ${provider}. Using OpenAI as default.`);
        return new OpenAIService();
    }
  }

  /**
   * Get the default AI service
   * This will be determined based on the environment configuration
   */
  public getDefaultService(): BaseAIService {
    const defaultProvider = process.env.DEFAULT_AI_PROVIDER?.toLowerCase() as AIProvider || 'openai';
    return this.getService(defaultProvider);
  }

  /**
   * Check if a provider is available (has the required API key)
   */
  public isProviderAvailable(provider: AIProvider): boolean {
    switch (provider) {
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      case 'xai':
        return !!process.env.XAI_API_KEY;
      default:
        return false;
    }
  }

  /**
   * Get all available AI providers
   */
  public getAvailableProviders(): AIProvider[] {
    // Only include OpenAI for now, until xAI integration is requested
    const providers: AIProvider[] = ['openai'];
    return providers.filter(provider => this.isProviderAvailable(provider));
  }
}