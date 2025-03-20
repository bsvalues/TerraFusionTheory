import 'openai/shims/node';
import OpenAI from 'openai';
import * as openaiService from '../../server/services/openai.service';
import { storage } from '../../server/storage';

// Mock the OpenAI client
jest.mock('openai');
jest.mock('../../server/storage', () => ({
  storage: {
    createLog: jest.fn().mockResolvedValue({})
  }
}));

describe('OpenAI Service', () => {
  let mockCreateCompletion: jest.Mock;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup the mock for create completions
    mockCreateCompletion = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'Mock response' } }],
      usage: { total_tokens: 100 }
    });
    
    // Cast OpenAI to unknown first to avoid TypeScript errors
    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateCompletion
        }
      }
    }));
  });

  describe('analyzeMessage', () => {
    it('should call OpenAI with correct parameters and return response', async () => {
      const result = await openaiService.analyzeMessage('Test message', 1);
      
      expect(mockCreateCompletion).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-4o',
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user', content: 'Test message' })
        ])
      }));
      
      expect(result).toBe('Mock response');
      expect(storage.createLog).toHaveBeenCalledTimes(2);
    });
    
    it('should handle errors properly', async () => {
      const errorMessage = 'API error';
      mockCreateCompletion.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(openaiService.analyzeMessage('Test message', 1)).rejects.toThrow(errorMessage);
      expect(storage.createLog).toHaveBeenCalledTimes(2); // One for request, one for error
    });
  });
  
  describe('analyzeRequirements', () => {
    it('should format the request correctly and parse JSON response', async () => {
      const mockJsonResponse = '{"identifiedRequirements":[],"suggestedTechStack":{},"missingInformation":{"items":[]},"nextSteps":[]}';
      mockCreateCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: mockJsonResponse } }],
        usage: { total_tokens: 100 }
      });
      
      const result = await openaiService.analyzeRequirements('Project requirements');
      
      expect(mockCreateCompletion).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-4o',
        response_format: { type: 'json_object' }
      }));
      
      expect(result).toEqual({
        identifiedRequirements: [],
        suggestedTechStack: {},
        missingInformation: { items: [] },
        nextSteps: []
      });
    });
  });
  
  describe('generateArchitecture', () => {
    it('should format the request correctly and parse JSON response', async () => {
      const mockJsonResponse = '{"layers":[]}';
      mockCreateCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: mockJsonResponse } }],
        usage: { total_tokens: 100 }
      });
      
      const result = await openaiService.generateArchitecture('Architecture requirements');
      
      expect(mockCreateCompletion).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-4o',
        response_format: { type: 'json_object' }
      }));
      
      expect(result).toEqual({ layers: [] });
    });
  });
  
  describe('generateCode', () => {
    it('should call OpenAI with language specific parameters', async () => {
      await openaiService.generateCode('Code requirements', 'typescript');
      
      expect(mockCreateCompletion).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-4o',
        messages: expect.arrayContaining([
          expect.objectContaining({ 
            content: expect.stringContaining('typescript') 
          })
        ])
      }));
    });
  });
  
  describe('debugCode', () => {
    it('should include code and error message in the prompt', async () => {
      const code = 'const x = 1;';
      const errorMsg = 'TypeError: x is not a function';
      
      await openaiService.debugCode(code, errorMsg);
      
      expect(mockCreateCompletion).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gpt-4o',
        messages: expect.arrayContaining([
          expect.objectContaining({ 
            content: expect.stringContaining(code) 
          }),
          expect.objectContaining({ 
            content: expect.stringContaining(errorMsg) 
          })
        ])
      }));
    });
  });
  
  describe('generateDocumentation', () => {
    it('should use different system prompts based on docType', async () => {
      // Test JSDoc type
      await openaiService.generateDocumentation('const x = 1;', 'jsdoc');
      
      expect(mockCreateCompletion).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ 
            content: expect.stringContaining('JSDoc') 
          })
        ])
      }));
      
      // Reset and test README type
      jest.clearAllMocks();
      mockCreateCompletion.mockResolvedValueOnce({
        choices: [{ message: { content: 'Mock README' } }],
        usage: { total_tokens: 100 }
      });
      
      await openaiService.generateDocumentation('const x = 1;', 'readme');
      
      expect(mockCreateCompletion).toHaveBeenCalledWith(expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ 
            content: expect.stringContaining('README') 
          })
        ])
      }));
    });
  });
});