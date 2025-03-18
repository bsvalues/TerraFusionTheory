import { Request, Response } from 'express';
import * as openaiController from '../../server/controllers/openai.controller';
import * as openaiService from '../../server/services/openai.service';
import { storage } from '../../server/storage';

// Mock dependencies
jest.mock('../../server/services/openai.service');
jest.mock('../../server/storage', () => ({
  storage: {
    createLog: jest.fn().mockResolvedValue({}),
    getProject: jest.fn(),
    getConversation: jest.fn(),
    updateConversation: jest.fn(),
    getConversationByProjectId: jest.fn(),
    createConversation: jest.fn(),
    getAnalysisByProjectId: jest.fn(),
    saveAnalysis: jest.fn(),
    updateAnalysis: jest.fn()
  }
}));

describe('OpenAI Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockSend = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ send: mockSend });
  const mockJson = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup request and response objects
    mockRequest = {
      body: {},
      params: {},
      query: {},
      sessionID: 'test-session'
    };
    
    mockResponse = {
      status: mockStatus,
      json: mockJson,
      locals: {}
    };
    
    // Mock storage methods
    (storage.getProject as jest.Mock).mockResolvedValue({ id: 1, name: 'Test Project' });
    (storage.getConversation as jest.Mock).mockResolvedValue(null);
    (storage.getConversationByProjectId as jest.Mock).mockResolvedValue(null);
    (storage.createConversation as jest.Mock).mockImplementation(async (data) => ({
      id: 1,
      ...data,
      messages: JSON.parse(data.messages)
    }));
    (storage.updateConversation as jest.Mock).mockImplementation(async (data) => data);
    (storage.getAnalysisByProjectId as jest.Mock).mockResolvedValue(null);
    (storage.saveAnalysis as jest.Mock).mockImplementation(async (data) => ({
      id: 1,
      ...data
    }));
    (storage.updateAnalysis as jest.Mock).mockImplementation(async (data) => data);
  });
  
  describe('handleMessage', () => {
    it('should handle new messages and create conversation if none exists', async () => {
      // Setup
      mockRequest.body = { message: 'Test message', projectId: 1 };
      (openaiService.analyzeMessage as jest.Mock).mockResolvedValue('AI response');
      
      // Execute
      await openaiController.handleMessage(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(openaiService.analyzeMessage).toHaveBeenCalledWith('Test message', 1);
      expect(storage.getConversationByProjectId).toHaveBeenCalledWith(1);
      expect(storage.createConversation).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({ response: 'AI response' });
      expect(storage.createLog).toHaveBeenCalledTimes(2);
    });
    
    it('should update existing conversation with new messages', async () => {
      // Setup
      mockRequest.body = { message: 'Test message', projectId: 1 };
      const existingConversation = {
        id: 1,
        projectId: 1,
        messages: [
          { role: 'user', content: 'Previous message', timestamp: '2023-01-01T00:00:00Z' }
        ]
      };
      (storage.getConversationByProjectId as jest.Mock).mockResolvedValue(existingConversation);
      (openaiService.analyzeMessage as jest.Mock).mockResolvedValue('AI response');
      
      // Execute
      await openaiController.handleMessage(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(storage.updateConversation).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({ response: 'AI response' });
    });
    
    it('should handle errors properly', async () => {
      // Setup
      mockRequest.body = { message: 'Test message', projectId: 1 };
      const error = new Error('Service error');
      (openaiService.analyzeMessage as jest.Mock).mockRejectedValue(error);
      
      // Execute
      await openaiController.handleMessage(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith({ error: 'Error processing message: Service error' });
      expect(storage.createLog).toHaveBeenCalledWith(expect.objectContaining({
        level: 'error',
        category: 'ai'
      }));
    });
    
    it('should validate required fields', async () => {
      // Setup - missing message field
      mockRequest.body = { projectId: 1 };
      
      // Execute
      await openaiController.handleMessage(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('message is required')
      }));
    });
  });
  
  describe('analyzeRequirements', () => {
    it('should analyze project requirements and save analysis', async () => {
      // Setup
      mockRequest.body = { projectDetails: 'Test requirements', projectId: 1 };
      const analysisResult = {
        identifiedRequirements: [],
        suggestedTechStack: {},
        missingInformation: { items: [] },
        nextSteps: []
      };
      (openaiService.analyzeRequirements as jest.Mock).mockResolvedValue(analysisResult);
      
      // Execute
      await openaiController.analyzeRequirements(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(openaiService.analyzeRequirements).toHaveBeenCalledWith('Test requirements');
      expect(storage.saveAnalysis).toHaveBeenCalledWith({
        projectId: 1,
        ...analysisResult
      });
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        projectId: 1,
        ...analysisResult
      }));
    });
    
    it('should update existing analysis if it exists', async () => {
      // Setup
      mockRequest.body = { projectDetails: 'Test requirements', projectId: 1 };
      const existingAnalysis = {
        id: 1,
        projectId: 1,
        identifiedRequirements: [{ name: 'Old requirement', status: 'success' }],
        suggestedTechStack: { frontend: { name: 'React', description: 'UI library' } },
        missingInformation: { items: ['Old missing info'] },
        nextSteps: [{ order: 1, description: 'Old next step' }]
      };
      const analysisResult = {
        identifiedRequirements: [],
        suggestedTechStack: {},
        missingInformation: { items: [] },
        nextSteps: []
      };
      (storage.getAnalysisByProjectId as jest.Mock).mockResolvedValue(existingAnalysis);
      (openaiService.analyzeRequirements as jest.Mock).mockResolvedValue(analysisResult);
      
      // Execute
      await openaiController.analyzeRequirements(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(storage.updateAnalysis).toHaveBeenCalledWith(expect.objectContaining({
        id: 1,
        projectId: 1,
        ...analysisResult
      }));
    });
    
    it('should handle errors properly', async () => {
      // Setup
      mockRequest.body = { projectDetails: 'Test requirements', projectId: 1 };
      const error = new Error('Analysis error');
      (openaiService.analyzeRequirements as jest.Mock).mockRejectedValue(error);
      
      // Execute
      await openaiController.analyzeRequirements(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Analysis error')
      }));
    });
  });
  
  describe('generateCode', () => {
    it('should generate code based on requirements and language', async () => {
      // Setup
      mockRequest.body = { 
        requirements: 'Create a login form', 
        language: 'javascript',
        projectId: 1
      };
      (openaiService.generateCode as jest.Mock).mockResolvedValue('const loginForm = () => {...}');
      
      // Execute
      await openaiController.generateCode(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(openaiService.generateCode).toHaveBeenCalledWith(
        'Create a login form', 
        'javascript'
      );
      expect(mockJson).toHaveBeenCalledWith({ code: 'const loginForm = () => {...}' });
    });
    
    it('should validate required fields', async () => {
      // Setup - missing requirements field
      mockRequest.body = { language: 'javascript', projectId: 1 };
      
      // Execute
      await openaiController.generateCode(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('requirements is required')
      }));
    });
  });
  
  describe('debugCode', () => {
    it('should debug code with error message', async () => {
      // Setup
      mockRequest.body = { 
        code: 'const x = 1; x();', 
        error: 'TypeError: x is not a function',
        projectId: 1
      };
      (openaiService.debugCode as jest.Mock).mockResolvedValue('x is a number, not a function...');
      
      // Execute
      await openaiController.debugCode(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(openaiService.debugCode).toHaveBeenCalledWith(
        'const x = 1; x();', 
        'TypeError: x is not a function'
      );
      expect(mockJson).toHaveBeenCalledWith({ analysis: 'x is a number, not a function...' });
    });
  });
  
  describe('generateDocumentation', () => {
    it('should generate documentation based on code and docType', async () => {
      // Setup
      mockRequest.body = { 
        code: 'function sum(a, b) { return a + b; }', 
        docType: 'jsdoc',
        projectId: 1
      };
      (openaiService.generateDocumentation as jest.Mock).mockResolvedValue(
        '/**\n * Adds two numbers\n * @param {number} a First number\n * @param {number} b Second number\n * @returns {number} Sum of a and b\n */'
      );
      
      // Execute
      await openaiController.generateDocumentation(mockRequest as Request, mockResponse as Response);
      
      // Verify
      expect(openaiService.generateDocumentation).toHaveBeenCalledWith(
        'function sum(a, b) { return a + b; }', 
        'jsdoc'
      );
      expect(mockJson).toHaveBeenCalledWith({ 
        documentation: '/**\n * Adds two numbers\n * @param {number} a First number\n * @param {number} b Second number\n * @returns {number} Sum of a and b\n */' 
      });
    });
  });
});