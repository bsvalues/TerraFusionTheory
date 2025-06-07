import * as openaiService from '../../../server/services/openai.service';
import { storage } from '../../../server/storage';

// Mock OpenAI library
jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return {
    OpenAI: jest.fn(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

// Mock storage
jest.mock('../../../server/storage', () => ({
  storage: {
    createLog: jest.fn(),
    getProject: jest.fn(),
    saveAnalysis: jest.fn()
  }
}));

describe('OpenAI Service', () => {
  // Access the mocked OpenAI instance
  let mockOpenAIInstance: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get reference to the mock
    mockOpenAIInstance = require('openai').OpenAI();
    
    // Mock project data
    (storage.getProject as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Test Project',
      description: 'Test project description'
    });
  });
  
  describe('analyzeMessage', () => {
    it('should analyze user message and return AI response', async () => {
      // Mock OpenAI response
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'This is an AI-generated response'
            }
          }
        ]
      });
      
      const result = await openaiService.analyzeMessage('How can I improve my project?', 1);
      
      expect(result).toBe('This is an AI-generated response');
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalled();
      expect(storage.getProject).toHaveBeenCalledWith(1);
      expect(storage.createLog).toHaveBeenCalled();
    });
    
    it('should handle errors during analysis', async () => {
      // Mock OpenAI error
      mockOpenAIInstance.chat.completions.create.mockRejectedValueOnce(new Error('API error'));
      
      await expect(openaiService.analyzeMessage('Test message', 1)).rejects.toThrow();
      expect(storage.createLog).toHaveBeenCalled();
    });
  });
  
  describe('analyzeRequirements', () => {
    it('should analyze project requirements and return structured recommendations', async () => {
      // Mock OpenAI response with JSON output
      const mockAnalysisData = {
        identifiedRequirements: ['Requirement 1', 'Requirement 2'],
        recommendedTechStack: {
          frontend: ['React'],
          backend: ['Node.js'],
          database: ['PostgreSQL']
        },
        missingInformation: {
          questions: ['Question 1']
        }
      };
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify(mockAnalysisData)
            }
          }
        ]
      });
      
      const result = await openaiService.analyzeRequirements('Build a web application for real estate analytics');
      
      expect(result).toHaveProperty('identifiedRequirements');
      expect(result).toHaveProperty('recommendedTechStack');
      expect(result).toHaveProperty('missingInformation');
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalled();
      expect(storage.createLog).toHaveBeenCalled();
    });
    
    it('should handle malformed JSON in response', async () => {
      // Mock OpenAI response with invalid JSON
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'Not valid JSON'
            }
          }
        ]
      });
      
      await expect(openaiService.analyzeRequirements('Test requirements')).rejects.toThrow();
      expect(storage.createLog).toHaveBeenCalled();
    });
  });
  
  describe('generateArchitecture', () => {
    it('should generate software architecture based on requirements', async () => {
      // Mock OpenAI response with JSON output
      const mockArchData = {
        layers: [
          {
            name: 'UI Layer',
            components: ['Component 1']
          },
          {
            name: 'API Layer',
            components: ['API Controller']
          }
        ],
        dataFlow: [
          {
            from: 'Component 1',
            to: 'API Controller',
            description: 'Data flow'
          }
        ]
      };
      
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify(mockArchData)
            }
          }
        ]
      });
      
      const result = await openaiService.generateArchitecture('Build a scalable web application');
      
      expect(result).toHaveProperty('layers');
      expect(result).toHaveProperty('dataFlow');
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalled();
      expect(storage.createLog).toHaveBeenCalled();
    });
  });
  
  describe('generateCode', () => {
    it('should generate code based on requirements and language', async () => {
      // Mock OpenAI response
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '```javascript\nconst test = "hello";\n```'
            }
          }
        ]
      });
      
      const result = await openaiService.generateCode('Create a function that says hello', 'javascript');
      
      expect(result).toContain('```javascript');
      expect(result).toContain('const test = "hello";');
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalled();
      expect(storage.createLog).toHaveBeenCalled();
    });
  });
  
  describe('debugCode', () => {
    it('should analyze error message and suggest fixes', async () => {
      // Mock OpenAI response
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: 'The issue is X. Try fixing it by doing Y.'
            }
          }
        ]
      });
      
      const result = await openaiService.debugCode('const x = y;', 'ReferenceError: y is not defined');
      
      expect(result).toContain('The issue is X');
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalled();
      expect(storage.createLog).toHaveBeenCalled();
    });
  });
  
  describe('generateDocumentation', () => {
    it('should generate documentation for code', async () => {
      // Mock OpenAI response
      mockOpenAIInstance.chat.completions.create.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: '/**\n * This function does X\n * @param {string} input\n * @returns {string}\n */'
            }
          }
        ]
      });
      
      const result = await openaiService.generateDocumentation('function doX(input) { return input; }', 'jsdoc');
      
      expect(result).toContain('This function does X');
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalled();
      expect(storage.createLog).toHaveBeenCalled();
    });
  });
});