import OpenAI from 'openai';
import { BaseAIService, AIModelResponse, AIModelRequestOptions } from './base';
import { ExternalServiceError } from '../../errors';

/**
 * OpenAI-specific service implementation
 */
export class OpenAIService extends BaseAIService {
  private client: OpenAI;
  private defaultModel: string = 'gpt-4o'; // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  private defaultVisionModel: string = 'gpt-4o'; // gpt-4o supports vision capabilities

  constructor() {
    super('OpenAI');
    
    // Initialize OpenAI client with API key
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OPENAI_API_KEY is not set. OpenAI service will not work properly.');
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Generate text completion using OpenAI
   */
  async generateText(prompt: string, options?: AIModelRequestOptions): Promise<AIModelResponse> {
    const model = options?.maxTokens && options.maxTokens > 8192 ? 'gpt-4o-2024-05-13' : this.defaultModel;
    
    // Create properly typed request params
    const requestParams: any = {
      model,
      messages: [{ role: 'user' as const, content: prompt }],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      stop: options?.stopSequences
    };
    
    try {
      // Log the request
      await this.logRequest('text', requestParams, options);
      
      const startTime = Date.now();
      
      // Make the API call with timeout
      const response = await this.withTimeout(
        this.client.chat.completions.create(requestParams),
        options?.timeout || this.defaultTimeout,
        'OpenAI text generation request timed out'
      );
      
      const duration = Date.now() - startTime;
      
      // Prepare the response with safe property access
      const result: AIModelResponse = {
        text: response.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens
        },
        meta: {
          model: response.model,
          finishReason: response.choices?.[0]?.finish_reason
        }
      };
      
      // Log the response
      await this.logResponse('text', requestParams, result, duration, options);
      
      return result;
    } catch (error: any) {
      // Log the error
      await this.logError('text', requestParams, error, options);
      
      throw new ExternalServiceError(
        `OpenAI API error: ${error?.message || 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  /**
   * Generate chat completion using OpenAI
   */
  async generateChatCompletion(
    messages: Array<{ role: string; content: string | Array<any> }>,
    options?: AIModelRequestOptions
  ): Promise<AIModelResponse> {
    const model = options?.maxTokens && options.maxTokens > 8192 ? 'gpt-4o-2024-05-13' : this.defaultModel;
    
    // Detect if we need JSON response based on system message content
    const requestForJSON = messages.some(msg => 
      msg.role === 'system' && 
      typeof msg.content === 'string' && 
      (msg.content.includes('Format your response as JSON') || msg.content.includes('format": { "type": "json_object"'))
    );
    
    // Create properly typed request params
    const requestParams: any = {
      model,
      messages: messages.map(msg => ({
        role: msg.role as "user" | "system" | "assistant",
        content: msg.content
      })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
      stop: options?.stopSequences
    };
    
    // Add response_format only if JSON is requested
    if (requestForJSON) {
      requestParams.response_format = { type: "json_object" };
    }
    
    try {
      // Log the request
      await this.logRequest('chat', requestParams, options);
      
      const startTime = Date.now();
      
      // Make the API call with timeout
      const response = await this.withTimeout(
        this.client.chat.completions.create(requestParams),
        options?.timeout || this.defaultTimeout,
        'OpenAI chat completion request timed out'
      );
      
      const duration = Date.now() - startTime;
      
      // Handle response safely with type checking
      const content = response.choices?.[0]?.message?.content || '';
      
      // Prepare the response
      const result: AIModelResponse = {
        text: content,
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens
        },
        meta: {
          model: response.model,
          finishReason: response.choices?.[0]?.finish_reason
        }
      };
      
      // Log the response
      await this.logResponse('chat', requestParams, result, duration, options);
      
      return result;
    } catch (error: any) {
      // Log the error
      await this.logError('chat', requestParams, error, options);
      
      throw new ExternalServiceError(
        `OpenAI API error: ${error?.message || 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  /**
   * Process image and generate text description using OpenAI Vision
   */
  async processImage(
    base64Image: string,
    prompt: string,
    options?: AIModelRequestOptions
  ): Promise<AIModelResponse> {
    // Properly typed message structure for vision requests
    const messages = [
      {
        role: 'user' as const,
        content: [
          { type: 'text' as const, text: prompt },
          {
            type: 'image_url' as const,
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ];
    
    // Create properly typed request params
    const requestParams: any = {
      model: this.defaultVisionModel, 
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens,
    };
    
    try {
      // Log the request (but redact the base64 image data for storage efficiency)
      const logRequestParams = {
        ...requestParams,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: '[BASE64_IMAGE_REDACTED]' } }
            ]
          }
        ]
      };
      
      await this.logRequest('vision', logRequestParams, options);
      
      const startTime = Date.now();
      
      // Make the API call with timeout
      const response = await this.withTimeout(
        this.client.chat.completions.create(requestParams),
        options?.timeout || this.defaultTimeout * 2, // Double timeout for vision requests
        'OpenAI vision request timed out'
      );
      
      const duration = Date.now() - startTime;
      
      // Prepare the response with safe property access
      const result: AIModelResponse = {
        text: response.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens
        },
        meta: {
          model: response.model,
          finishReason: response.choices?.[0]?.finish_reason
        }
      };
      
      // Log the response
      await this.logResponse('vision', logRequestParams, result, duration, options);
      
      return result;
    } catch (error: any) {
      // Log the error
      const logRequestParams = {
        ...requestParams,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: '[BASE64_IMAGE_REDACTED]' } }
            ]
          }
        ]
      };
      
      await this.logError('vision', logRequestParams, error, options);
      
      throw new ExternalServiceError(
        `OpenAI Vision API error: ${error?.message || 'Unknown error'}`,
        { originalError: error }
      );
    }
  }
}