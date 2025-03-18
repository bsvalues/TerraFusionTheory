import OpenAI from "openai";
import { BaseAIService, AIModelResponse, AIModelRequestOptions } from "./base";
import { TimeoutError } from "../../errors";

/**
 * xAI-specific service implementation using their Grok models
 */
export class XaiService extends BaseAIService {
  private client: OpenAI;
  private defaultModel: string = 'grok-2-1212';
  private defaultVisionModel: string = 'grok-2-vision-1212';
  
  constructor() {
    super('XAI');
    
    // xAI uses the OpenAI-compatible client with a different base URL
    this.client = new OpenAI({
      baseURL: "https://api.x.ai/v1", 
      apiKey: process.env.XAI_API_KEY
    });
  }
  
  /**
   * Generate text completion using xAI
   */
  async generateText(prompt: string, options?: AIModelRequestOptions): Promise<AIModelResponse> {
    const startTime = Date.now();
    
    try {
      await this.logRequest('text', { prompt }, options);
      
      // Use OpenAI compatible client with text completion
      const response = await this.withTimeout(
        this.client.chat.completions.create({
          model: this.defaultModel,
          messages: [{ role: 'user', content: prompt }],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens,
          stop: options?.stopSequences,
        }),
        options?.timeout || this.defaultTimeout
      );
      
      const duration = Date.now() - startTime;
      
      const result: AIModelResponse = {
        text: response.choices[0].message.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens
        },
        meta: { provider: 'xai', model: this.defaultModel }
      };
      
      await this.logResponse('text', { prompt }, result, duration, options);
      
      return result;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      await this.logError('text', { prompt }, error, options);
      
      if (error instanceof TimeoutError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`XAI text generation failed: ${errorMessage}`);
    }
  }
  
  /**
   * Generate chat completion using xAI
   */
  async generateChatCompletion(
    messages: Array<{ role: string; content: string | Array<any> }>,
    options?: AIModelRequestOptions
  ): Promise<AIModelResponse> {
    const startTime = Date.now();
    
    try {
      await this.logRequest('chat', { messages }, options);
      
      // Use OpenAI compatible client with chat completion
      const response = await this.withTimeout(
        this.client.chat.completions.create({
          model: this.defaultModel,
          messages: messages as any,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens,
          stop: options?.stopSequences,
          response_format: { type: 'text' }
        }),
        options?.timeout || this.defaultTimeout
      );
      
      const duration = Date.now() - startTime;
      
      const result: AIModelResponse = {
        text: response.choices[0].message.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens
        },
        meta: { provider: 'xai', model: this.defaultModel }
      };
      
      await this.logResponse('chat', { messages }, result, duration, options);
      
      return result;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      await this.logError('chat', { messages }, error, options);
      
      if (error instanceof TimeoutError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`XAI chat completion failed: ${errorMessage}`);
    }
  }
  
  /**
   * Process image and generate text description using xAI Vision
   */
  async processImage(
    base64Image: string,
    prompt: string,
    options?: AIModelRequestOptions
  ): Promise<AIModelResponse> {
    const startTime = Date.now();
    
    try {
      await this.logRequest('vision', { prompt, imagePresent: true }, options);
      
      // Format the messages with image content
      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ];
      
      // Use OpenAI compatible client with vision model
      const response = await this.withTimeout(
        this.client.chat.completions.create({
          model: this.defaultVisionModel,
          messages: messages as any,
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens || 1000
        }),
        options?.timeout || this.defaultTimeout
      );
      
      const duration = Date.now() - startTime;
      
      const result: AIModelResponse = {
        text: response.choices[0].message.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          totalTokens: response.usage?.total_tokens
        },
        meta: { provider: 'xai', model: this.defaultVisionModel }
      };
      
      await this.logResponse('vision', { prompt, imagePresent: true }, result, duration, options);
      
      return result;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      await this.logError('vision', { prompt, imagePresent: true }, error, options);
      
      if (error instanceof TimeoutError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`XAI vision processing failed: ${errorMessage}`);
    }
  }
}