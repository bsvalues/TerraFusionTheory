/**
 * Agent Controller
 * 
 * This controller handles interactions with specialized AI agents for the IntelligentEstate platform.
 * It provides endpoints for both property-focused real estate agents and technical developer agents.
 */

import { Request, Response } from 'express';
import { ServiceError, ValidationError } from '../errors';
import { LogCategory, LogLevel } from '@shared/schema';
import { OptimizedLogger } from '../services/optimized-logging';

// Create a shared logger instance
const logger = OptimizedLogger.getInstance();

/**
 * List all available AI agents in the system
 */
export async function listAllAgents(req: Request, res: Response) {
  try {
    const agents = [
      {
        id: "real-estate",
        name: "Real Estate Specialist",
        description: "Specialized in property valuation, market trends, and real estate investments",
        capabilities: [
          "Property valuation",
          "Market trend analysis",
          "Investment strategy",
          "Neighborhood insights"
        ]
      },
      {
        id: "developer",
        name: "Technical Integration Specialist",
        description: "Specialized in technical implementation, data integration, and system architecture",
        capabilities: [
          "API integration",
          "Data pipeline setup",
          "System troubleshooting",
          "Feature implementation"
        ]
      }
    ];
    
    return res.json({
      success: true,
      agents
    });
  } catch (error) {
    logger.error(
      `Error listing agents: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LogCategory.AI,
      { error }
    );
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve agent list'
    });
  }
}

/**
 * Get details about the real estate agent
 */
export async function getRealEstateAgent(req: Request, res: Response) {
  try {
    const agent = {
      id: "real-estate",
      name: "Real Estate Specialist",
      description: "Specialized in property valuation, market trends, and real estate investments",
      capabilities: [
        "Property valuation",
        "Market trend analysis",
        "Investment strategy",
        "Neighborhood insights"
      ],
      trainingData: [
        "Market valuation principles",
        "Regional property trends",
        "Investment ROI calculation",
        "Property feature value assessment"
      ]
    };
    
    return res.json({
      success: true,
      agent
    });
  } catch (error) {
    logger.error(
      `Error retrieving real estate agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LogCategory.AI,
      { error }
    );
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve real estate agent details'
    });
  }
}

/**
 * Get details about the developer agent
 */
export async function getDeveloperAgent(req: Request, res: Response) {
  try {
    const agent = {
      id: "developer",
      name: "Technical Integration Specialist",
      description: "Specialized in technical implementation, data integration, and system architecture",
      capabilities: [
        "API integration",
        "Data pipeline setup",
        "System troubleshooting",
        "Feature implementation"
      ],
      trainingData: [
        "Full-stack development patterns",
        "Database optimization techniques",
        "API design principles",
        "GIS data integration"
      ]
    };
    
    return res.json({
      success: true,
      agent
    });
  } catch (error) {
    logger.error(
      `Error retrieving developer agent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LogCategory.AI,
      { error }
    );
    
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve developer agent details'
    });
  }
}

/**
 * Ask a question to the real estate agent specialist
 */
export async function askRealEstateAgent(req: Request, res: Response) {
  const { question, context } = req.body;
  
  if (!question) {
    throw new ValidationError('Question is required');
  }
  
  try {
    // Log with correct type for LogCategory
    logger.info(
      `User asked real estate agent: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`,
      LogCategory.AI,
      { userSessionId: req.sessionID }
    );
    
    // Call to MCP (Model Context Protocol) tool to get specialized real estate response
    const response = await fetch('http://localhost:5000/api/tools/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'process_real_estate_query',
        question,
        context: {
          ...context,
          source: 'ai_specialist_chat',
          agentType: 'real_estate'
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ServiceError(`MCP tool responded with error: ${errorData.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    return res.json({
      success: true,
      response: data.result || data.response || "I'm not sure how to answer that question about real estate."
    });
  } catch (error) {
    logger.error(
      `Error processing real estate agent query: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LogCategory.AI,
      { error, question }
    );
    
    return res.status(500).json({
      success: false,
      message: 'Failed to process your question'
    });
  }
}

/**
 * Ask a question to the developer/technical agent specialist
 */
export async function askDeveloperAgent(req: Request, res: Response) {
  const { question, context } = req.body;
  
  if (!question) {
    throw new ValidationError('Question is required');
  }
  
  try {
    logger.info(
      `User asked developer agent: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`,
      LogCategory.AI,
      { userSessionId: req.sessionID }
    );
    
    // Call to MCP tool to get specialized technical/developer response
    const response = await fetch('http://localhost:5000/api/tools/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'process_technical_query',
        question,
        context: {
          ...context,
          source: 'ai_specialist_chat',
          agentType: 'developer'
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ServiceError(`MCP tool responded with error: ${errorData.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    return res.json({
      success: true,
      response: data.result || data.response || "I'm not sure how to answer that technical question."
    });
  } catch (error) {
    logger.error(
      `Error processing developer agent query: ${error instanceof Error ? error.message : 'Unknown error'}`,
      LogCategory.AI,
      { error, question }
    );
    
    return res.status(500).json({
      success: false,
      message: 'Failed to process your question'
    });
  }
}

/**
 * Handle collaboration between agents for complex questions
 * (Function name updated to match route definition)
 */
export async function collaborateAgents(req: Request, res: Response) {
  const { question, context } = req.body;
  
  if (!question) {
    throw new ValidationError('Question is required');
  }
  
  try {
    logger.info(
      `User requested agent collaboration: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`,
      LogCategory.AI,
      { userSessionId: req.sessionID }
    );
    
    // Call to MCP tool with collaboration flag
    const response = await fetch('http://localhost:5000/api/tools/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'handle_collaboration',
        question,
        context: {
          ...context,
          source: 'ai_specialist_chat',
          enableCollaboration: true
        }
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ServiceError(`MCP tool responded with error: ${errorData.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    return res.json({
      success: true,
      response: data.result || data.response || "I'm sorry, I couldn't process your request at this time."
    });
  } catch (error) {
    logger.error(
      LogCategory.AI, 
      `Error processing agent collaboration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { error, question }
    );
    
    return res.status(500).json({
      success: false,
      message: 'Failed to process your collaborative question'
    });
  }
}

/**
 * Search agent memory for relevant information
 */
export async function searchAgentMemory(req: Request, res: Response) {
  const { query, limit = 5 } = req.body;
  
  if (!query) {
    throw new ValidationError('Search query is required');
  }
  
  try {
    logger.info(
      LogCategory.AI,
      `Searching agent memory: ${query}`,
      { userSessionId: req.sessionID }
    );
    
    // Call to MCP tool to search vector memory
    const response = await fetch('http://localhost:5000/api/tools/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'search_vector_memory',
        query,
        limit: parseInt(limit.toString(), 10)
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new ServiceError(`MCP memory search responded with error: ${errorData.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    return res.json({
      success: true,
      results: data.results || []
    });
  } catch (error) {
    logger.error(
      LogCategory.AI,
      `Error searching agent memory: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { error, query }
    );
    
    return res.status(500).json({
      success: false,
      message: 'Failed to search agent memory'
    });
  }
}