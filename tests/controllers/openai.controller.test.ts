import { Request, Response } from 'express';
import * as openaiController from '../../server/controllers/openai.controller';
import * as openaiService from '../../server/services/openai.service';
import { storage } from '../../server/storage';

// Mock the OpenAI service
jest.mock('../../server/services/openai.service');

// Mock the storage
jest.mock('../../server/storage', () => ({
  storage: {
    getConversationByProjectId: jest.fn(),
    createConversation: jest.fn(),
    updateConversation: jest.fn(),
    saveAnalysis: jest.fn()
  }
}));

describe('OpenAI Controller', () => {
  // Create mock request and response objects
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock request and response
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('handleMessage', () => {
    it('should return 400 if message or projectId is missing', async () => {
      // Set up the request with missing data
      mockRequest.body = { message: 'Test message' }; // Missing projectId
      
      // Call the controller
      await openaiController.handleMessage(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Message and project ID are required' });
    });
    
    it('should handle a new conversation correctly', async () => {
      // Setup mock data
      mockRequest.body = { message: 'Test message', projectId: 1 };
      
      // Mock the storage to return no existing conversation
      (storage.getConversationByProjectId as jest.Mock).mockResolvedValueOnce(undefined);
      
      // Mock the OpenAI service response
      const aiResponse = {
        message: 'AI response',
        timestamp: new Date().toISOString()
      };
      (openaiService.analyzeMessage as jest.Mock).mockResolvedValueOnce(aiResponse);
      
      // Mock conversation creation
      const createdConversation = {
        id: 1,
        projectId: 1,
        messages: [
          { role: 'user', content: 'Test message', timestamp: expect.any(String) },
          { role: 'assistant', content: 'AI response', timestamp: expect.any(String) }
        ]
      };
      (storage.createConversation as jest.Mock).mockResolvedValueOnce(createdConversation);
      
      // Call the controller
      await openaiController.handleMessage(mockRequest as Request, mockResponse as Response);
      
      // Verify service was called
      expect(openaiService.analyzeMessage).toHaveBeenCalledWith('Test message', 1);
      
      // Verify storage was called to create a new conversation
      expect(storage.createConversation).toHaveBeenCalled();
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: expect.objectContaining({
          role: 'assistant',
          content: 'AI response'
        })
      });
    });
    
    it('should update an existing conversation correctly', async () => {
      // Setup mock data
      mockRequest.body = { message: 'Test message', projectId: 1 };
      
      // Mock existing conversation
      const existingConversation = {
        id: 1,
        projectId: 1,
        messages: [
          { role: 'user', content: 'Previous message', timestamp: '2025-03-17T12:00:00.000Z' }
        ]
      };
      (storage.getConversationByProjectId as jest.Mock).mockResolvedValueOnce(existingConversation);
      
      // Mock the OpenAI service response
      const aiResponse = {
        message: 'AI response',
        timestamp: new Date().toISOString()
      };
      (openaiService.analyzeMessage as jest.Mock).mockResolvedValueOnce(aiResponse);
      
      // Mock conversation update
      const updatedConversation = {
        id: 1,
        projectId: 1,
        messages: [
          { role: 'user', content: 'Previous message', timestamp: '2025-03-17T12:00:00.000Z' },
          { role: 'user', content: 'Test message', timestamp: expect.any(String) },
          { role: 'assistant', content: 'AI response', timestamp: expect.any(String) }
        ]
      };
      (storage.updateConversation as jest.Mock).mockResolvedValueOnce(updatedConversation);
      
      // Call the controller
      await openaiController.handleMessage(mockRequest as Request, mockResponse as Response);
      
      // Verify service was called
      expect(openaiService.analyzeMessage).toHaveBeenCalledWith('Test message', 1);
      
      // Verify storage was called to update the conversation
      expect(storage.updateConversation).toHaveBeenCalled();
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: expect.objectContaining({
          role: 'assistant',
          content: 'AI response'
        })
      });
    });
    
    it('should handle errors correctly', async () => {
      // Setup mock data
      mockRequest.body = { message: 'Test message', projectId: 1 };
      
      // Mock the storage to throw an error
      (storage.getConversationByProjectId as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Call the controller
      await openaiController.handleMessage(mockRequest as Request, mockResponse as Response);
      
      // Verify error response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to process message' });
    });
  });
  
  describe('analyzeRequirements', () => {
    it('should return 400 if required fields are missing', async () => {
      // Set up the request with missing data
      mockRequest.body = { projectDetails: 'Project details' }; // Missing projectId
      
      // Call the controller
      await openaiController.analyzeRequirements(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Project details and project ID are required' });
    });
    
    it('should analyze requirements correctly', async () => {
      // Setup mock data
      mockRequest.body = { projectDetails: 'Project details', projectId: 1 };
      
      // Mock the OpenAI service response
      const analysisResult = {
        identifiedRequirements: [{ name: 'Requirement 1', status: 'success' }],
        suggestedTechStack: { frontend: { name: 'React', description: 'UI library' } },
        missingInformation: { items: [] },
        nextSteps: [{ order: 1, description: 'Set up project' }]
      };
      (openaiService.analyzeRequirements as jest.Mock).mockResolvedValueOnce(analysisResult);
      
      // Mock saved analysis
      const savedAnalysis = {
        id: 1,
        projectId: 1,
        ...analysisResult
      };
      (storage.saveAnalysis as jest.Mock).mockResolvedValueOnce(savedAnalysis);
      
      // Call the controller
      await openaiController.analyzeRequirements(mockRequest as Request, mockResponse as Response);
      
      // Verify service was called
      expect(openaiService.analyzeRequirements).toHaveBeenCalledWith('Project details');
      
      // Verify storage was called to save analysis
      expect(storage.saveAnalysis).toHaveBeenCalledWith({
        projectId: 1,
        ...analysisResult
      });
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        analysis: savedAnalysis
      });
    });
    
    it('should handle errors correctly', async () => {
      // Setup mock data
      mockRequest.body = { projectDetails: 'Project details', projectId: 1 };
      
      // Mock the service to throw an error
      (openaiService.analyzeRequirements as jest.Mock).mockRejectedValueOnce(new Error('Service error'));
      
      // Call the controller
      await openaiController.analyzeRequirements(mockRequest as Request, mockResponse as Response);
      
      // Verify error response
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to analyze requirements' });
    });
  });
  
  describe('generateCode', () => {
    it('should return 400 if required fields are missing', async () => {
      // Set up the request with missing data
      mockRequest.body = { requirements: 'Requirements', language: 'javascript' }; // Missing projectId
      
      // Call the controller
      await openaiController.generateCode(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Requirements, language, and project ID are required' });
    });
    
    it('should generate code correctly', async () => {
      // Setup mock data
      mockRequest.body = { requirements: 'Requirements', language: 'javascript', projectId: 1 };
      
      // Mock the OpenAI service response
      const codeResult = {
        code: 'function test() { return true; }',
        language: 'javascript'
      };
      (openaiService.generateCode as jest.Mock).mockResolvedValueOnce(codeResult);
      
      // Call the controller
      await openaiController.generateCode(mockRequest as Request, mockResponse as Response);
      
      // Verify service was called
      expect(openaiService.generateCode).toHaveBeenCalledWith('Requirements', 'javascript');
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        code: codeResult
      });
    });
  });
  
  describe('debugCode', () => {
    it('should return 400 if required fields are missing', async () => {
      // Set up the request with missing data
      mockRequest.body = { code: 'const x = 5;', error: 'Error message' }; // Missing projectId
      
      // Call the controller
      await openaiController.debugCode(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Code, error message, and project ID are required' });
    });
    
    it('should debug code correctly', async () => {
      // Setup mock data
      mockRequest.body = { code: 'const x = 5;', error: 'Error message', projectId: 1 };
      
      // Mock the OpenAI service response
      const debugResult = {
        analysis: 'The issue is...',
        timestamp: new Date().toISOString()
      };
      (openaiService.debugCode as jest.Mock).mockResolvedValueOnce(debugResult);
      
      // Call the controller
      await openaiController.debugCode(mockRequest as Request, mockResponse as Response);
      
      // Verify service was called
      expect(openaiService.debugCode).toHaveBeenCalledWith('const x = 5;', 'Error message');
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        result: debugResult
      });
    });
  });
  
  describe('generateDocumentation', () => {
    it('should return 400 if required fields are missing', async () => {
      // Set up the request with missing data
      mockRequest.body = { code: 'function test() {}', docType: 'API' }; // Missing projectId
      
      // Call the controller
      await openaiController.generateDocumentation(mockRequest as Request, mockResponse as Response);
      
      // Verify response
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Code, documentation type, and project ID are required' });
    });
    
    it('should generate documentation correctly', async () => {
      // Setup mock data
      mockRequest.body = { code: 'function test() {}', docType: 'API', projectId: 1 };
      
      // Mock the OpenAI service response
      const docResult = {
        documentation: '# API Documentation\n...',
        type: 'API',
        timestamp: new Date().toISOString()
      };
      (openaiService.generateDocumentation as jest.Mock).mockResolvedValueOnce(docResult);
      
      // Call the controller
      await openaiController.generateDocumentation(mockRequest as Request, mockResponse as Response);
      
      // Verify service was called
      expect(openaiService.generateDocumentation).toHaveBeenCalledWith('function test() {}', 'API');
      
      // Verify response
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        documentation: docResult
      });
    });
  });
});