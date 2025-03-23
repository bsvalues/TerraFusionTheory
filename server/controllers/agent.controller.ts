/**
 * Agent Controller
 * 
 * This controller handles interactions with specialized AI agents for the IntelligentEstate platform.
 * It provides endpoints for both property-focused real estate agents and technical developer agents.
 */

import { Request, Response } from 'express';
import { ServiceError, ValidationError } from '../errors';
import { LogCategory, LogLevel } from '@shared/schema';
import { optimizedLogger } from '../services/optimized-logging';

/**
 * Ask a question to the real estate agent specialist
 */
export async function askRealEstateAgent(req: Request, res: Response) {
  const { question, context } = req.body;
  
  if (!question) {
    throw new ValidationError('Question is required');
  }
  
  try {
    optimizedLogger.info(
      LogCategory.AI, 
      `User asked real estate agent: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`,
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
    optimizedLogger.error(
      LogCategory.AI, 
      `Error processing real estate agent query: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    optimizedLogger.info(
      LogCategory.AI, 
      `User asked developer agent: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`,
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
    optimizedLogger.error(
      LogCategory.AI, 
      `Error processing developer agent query: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
 */
export async function handleAgentCollaboration(req: Request, res: Response) {
  const { question, context } = req.body;
  
  if (!question) {
    throw new ValidationError('Question is required');
  }
  
  try {
    optimizedLogger.info(
      LogCategory.AI, 
      `User requested agent collaboration: ${question.substring(0, 100)}${question.length > 100 ? '...' : ''}`,
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
    optimizedLogger.error(
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