import { analyzeMessage, analyzeRequirements, generateArchitecture, generateCode, debugCode, generateDocumentation } from '../../server/services/openai.service';
import OpenAI from 'openai';

// Mock the OpenAI module
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

describe('OpenAI Service', () => {
  let mockOpenAIInstance: any;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get the mocked OpenAI instance
    mockOpenAIInstance = (OpenAI as jest.Mock).mock.results[0].value;
    
    // Save the original environment
    process.env = { ...process.env };
    process.env.OPENAI_API_KEY = 'test-api-key';
  });
  
  afterEach(() => {
    // Restore environment
    jest.resetModules();
  });
  
  describe('analyzeMessage', () => {
    it('should call OpenAI API with correct parameters and return result', async () => {
      // Setup mock response
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This is a test response'
            }
          }
        ]
      };
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockResponse);
      
      // Call the function
      const result = await analyzeMessage('Test message', 1);
      
      // Assert OpenAI was called with correct parameters
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('You are BS, an expert AI Developer Assistant')
          },
          { role: 'user', content: 'Test message' }
        ]
      });
      
      // Assert result contains expected properties
      expect(result).toHaveProperty('message', 'This is a test response');
      expect(result).toHaveProperty('timestamp');
    });
    
    it('should throw an error when OpenAI API fails', async () => {
      // Setup mock to throw error
      mockOpenAIInstance.chat.completions.create.mockRejectedValueOnce(new Error('API error'));
      
      // Call and expect error
      await expect(analyzeMessage('Test message', 1)).rejects.toThrow('Failed to process message with AI');
    });
  });
  
  describe('analyzeRequirements', () => {
    it('should call OpenAI API with correct parameters and return parsed JSON result', async () => {
      // Setup mock response with JSON string
      const mockJsonResponse = {
        identifiedRequirements: [{ name: 'Requirement 1', status: 'success' }],
        suggestedTechStack: { 
          frontend: { name: 'React', description: 'UI library' }
        },
        missingInformation: { items: ['User authentication details'] },
        nextSteps: [{ order: 1, description: 'Set up project structure' }]
      };
      
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify(mockJsonResponse)
            }
          }
        ]
      };
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockResponse);
      
      // Call the function
      const result = await analyzeRequirements('Project details');
      
      // Assert OpenAI was called with correct parameters
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: expect.any(Array),
        response_format: { type: 'json_object' }
      });
      
      // Assert result is parsed JSON
      expect(result).toEqual(mockJsonResponse);
    });
  });
  
  describe('generateArchitecture', () => {
    it('should call OpenAI API and return parsed architecture JSON', async () => {
      const mockArchitecture = {
        layers: [
          {
            name: 'UI Layer',
            components: [
              { name: 'Dashboard', type: 'ui' }
            ]
          }
        ]
      };
      
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify(mockArchitecture)
            }
          }
        ]
      };
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockResponse);
      
      // Call function
      const result = await generateArchitecture('Architecture requirements');
      
      // Assert correct parameters
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: expect.any(Array),
        response_format: { type: 'json_object' }
      });
      
      // Assert result
      expect(result).toEqual(mockArchitecture);
    });
  });
  
  describe('generateCode', () => {
    it('should call OpenAI API and return code generation result', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'function test() { return true; }'
            }
          }
        ]
      };
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockResponse);
      
      // Call function
      const result = await generateCode('Generate a test function', 'javascript');
      
      // Assert
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('Generate clean, production-ready code in javascript')
          },
          { role: 'user', content: 'Generate a test function' }
        ]
      });
      
      expect(result).toEqual({
        code: 'function test() { return true; }',
        language: 'javascript'
      });
    });
  });
  
  describe('debugCode', () => {
    it('should call OpenAI API and return debugging analysis', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'The issue is a missing semicolon on line 2.'
            }
          }
        ]
      };
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockResponse);
      
      // Call function
      const result = await debugCode('const x = 5\nconsole.log(x)', 'SyntaxError: missing semicolon');
      
      // Assert
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: expect.any(Array)
      });
      
      expect(result).toHaveProperty('analysis', 'The issue is a missing semicolon on line 2.');
      expect(result).toHaveProperty('timestamp');
    });
  });
  
  describe('generateDocumentation', () => {
    it('should call OpenAI API and return documentation', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '# API Documentation\n## Endpoints\n...'
            }
          }
        ]
      };
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce(mockResponse);
      
      // Call function
      const result = await generateDocumentation('function getData() { return api.get("/data"); }', 'API');
      
      // Assert
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system', 
            content: expect.stringContaining('Generate comprehensive API documentation')
          },
          { 
            role: 'user', 
            content: 'function getData() { return api.get("/data"); }' 
          }
        ]
      });
      
      expect(result).toEqual({
        documentation: '# API Documentation\n## Endpoints\n...',
        type: 'API',
        timestamp: expect.any(String)
      });
    });
  });
});