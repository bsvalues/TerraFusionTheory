// Setup file for data-focused tests
import { storage } from '../server/storage';

// Mock implementation of the storage interface
jest.mock('../server/storage', () => {
  const mockStorage = {
    // User methods
    getUser: jest.fn(),
    getUserByUsername: jest.fn(),
    createUser: jest.fn(),
    
    // Project methods
    getProject: jest.fn(),
    getAllProjects: jest.fn(),
    createProject: jest.fn(),
    updateProject: jest.fn(),
    
    // Conversation methods
    getConversation: jest.fn(),
    getConversationByProjectId: jest.fn(),
    createConversation: jest.fn(),
    updateConversation: jest.fn(),
    
    // Analysis methods
    getAnalysis: jest.fn(),
    getAnalysisByProjectId: jest.fn(),
    saveAnalysis: jest.fn(),
    updateAnalysis: jest.fn(),
    
    // Feedback methods
    getFeedback: jest.fn(),
    saveFeedback: jest.fn(),
    updateFeedbackStatus: jest.fn(),
    
    // Logging methods
    getLogs: jest.fn(),
    createLog: jest.fn(),
    getLogById: jest.fn(),
    getLogsByCategory: jest.fn(),
    getLogStats: jest.fn(),
    deleteLogById: jest.fn(),
    clearLogs: jest.fn(),
  };

  return {
    storage: mockStorage,
    MemStorage: jest.fn().mockImplementation(() => mockStorage)
  };
});

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Setup default mock implementations if needed
  storage.getProject.mockResolvedValue({
    id: 1,
    name: "Test Project",
    description: "A test project for unit tests",
    createdAt: new Date().toISOString()
  });
});