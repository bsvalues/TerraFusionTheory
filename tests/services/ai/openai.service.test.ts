import { OpenAIService } from '../../../server/services/ai/openai.service';

// Mock modules
const mockCreate = jest.fn().mockResolvedValue({
  choices: [{ 
    message: { content: 'Mock response content' },
    finish_reason: 'stop'
  }],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150
  },
  model: 'gpt-4o'
});

// Setup mock for OpenAI
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

describe('OpenAIService', () => {
  let openaiService: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key';
    openaiService = new OpenAIService();
    
    // Mock internal methods
    openaiService.logRequest = jest.fn();
    openaiService.logResponse = jest.fn();
    openaiService.logError = jest.fn();
  });
  
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });
  
  describe('generateText', () => {
    it('should call OpenAI API with correct parameters', async () => {
      const prompt = 'Test prompt';
      const options = {
        temperature: 0.5,
        maxTokens: 200,
        projectId: 123
      };
      
      await openaiService.generateText(prompt, options);
      
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: prompt
            })
          ]),
          temperature: options.temperature,
          max_tokens: options.maxTokens
        })
      );
      
      expect(openaiService.logRequest).toHaveBeenCalled();
      expect(openaiService.logResponse).toHaveBeenCalled();
    });
    
    it('should return the expected response format', async () => {
      const result = await openaiService.generateText('Test prompt');
      
      expect(result).toEqual(
        expect.objectContaining({
          text: 'Mock response content',
          usage: expect.objectContaining({
            promptTokens: 100,
            completionTokens: 50,
            totalTokens: 150
          }),
          meta: expect.objectContaining({
            model: 'gpt-4o',
            finishReason: 'stop'
          })
        })
      );
    });
  });
  
  describe('generateChatCompletion', () => {
    it('should call OpenAI API with correct messages', async () => {
      const messages = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' }
      ];
      
      await openaiService.generateChatCompletion(messages);
      
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.any(String),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: 'You are a helpful assistant.'
            }),
            expect.objectContaining({
              role: 'user',
              content: 'Hello, how are you?'
            })
          ])
        })
      );
    });
  });
  
  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      // Setup mock to throw an error
      const mockError = new Error('API Error');
      mockCreate.mockRejectedValueOnce(mockError);
      
      await expect(openaiService.generateText('Test prompt')).rejects.toThrow();
      
      expect(openaiService.logError).toHaveBeenCalled();
    });
  });
});