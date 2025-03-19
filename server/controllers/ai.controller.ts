import { Request, Response, NextFunction } from 'express';
import { 
  generateText, 
  generateChatCompletion, 
  processImage, 
  getAvailableAIProviders 
} from '../services/ai';
import type { AIProvider } from '../services/ai';
import { ValidationError, NotFoundError } from '../errors';
import { storage } from '../storage';
import { Message, Conversation } from '../../shared/schema';
import 'express-session';

/**
 * Helper function to extract JSON from text that might contain Markdown formatting
 * @param text The text that might contain JSON, possibly in a Markdown code block
 * @returns The extracted JSON string
 */
function extractJSONFromText(text: string): string {
  console.log('Original response text:', text);
  
  // Try to extract JSON from a markdown code block
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = text.match(jsonBlockRegex);
  
  if (match && match[1]) {
    const extracted = match[1].trim();
    console.log('Extracted JSON from markdown:', extracted);
    return extracted;
  }
  
  // Try to see if the entire text is already JSON
  try {
    JSON.parse(text);
    console.log('Text is already valid JSON');
    return text.trim();
  } catch (e) {
    // Not valid JSON, continue with other extraction methods
  }
  
  // Try to find any JSON-like structure with curly braces
  const jsonObjectRegex = /\{[\s\S]*\}/;
  const objectMatch = text.match(jsonObjectRegex);
  if (objectMatch) {
    const extracted = objectMatch[0].trim();
    console.log('Extracted JSON-like structure:', extracted);
    return extracted;
  }
  
  // If no JSON could be extracted, return the original text
  console.log('No JSON structure found, returning original text');
  return text.trim();
}

/**
 * Handle a message from the user to an AI assistant
 */
export const handleMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, projectId, provider } = req.body;
    
    if (!message) {
      throw new ValidationError('Message is required');
    }
    
    if (!projectId) {
      throw new ValidationError('Project ID is required');
    }
    
    // Get the user ID and session ID if available
    const userId = req.user?.id || null;
    const sessionId = req.sessionID || null;
    
    // Generate response using the AI service
    const response = await generateChatCompletion(
      [{ role: 'user', content: message }],
      { 
        provider: provider as AIProvider | undefined,
        projectId,
        userId,
        sessionId
      }
    );
    
    // Store the conversation in the database if needed
    const conversation = await storage.getConversationByProjectId(projectId);
    
    if (conversation) {
      // Ensure messages is an array
      const currentMessages = Array.isArray(conversation.messages) ? conversation.messages : [];
      
      const newUserMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      const newAssistantMessage: Message = {
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString()
      };
      
      const updatedMessages = [...currentMessages, newUserMessage, newAssistantMessage];
      
      await storage.updateConversation({
        ...conversation,
        messages: updatedMessages
      });
    }
    
    res.json({ response: response.text });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze project requirements
 */
export const analyzeRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { projectDetails, provider } = req.body;
    
    if (!projectDetails) {
      throw new ValidationError('Project details are required');
    }
    
    // Get the user ID and session ID if available
    const userId = req.user?.id || null;
    const sessionId = req.sessionID || null;
    
    // Generate analysis using the AI service
    const response = await generateChatCompletion(
      [
        {
          role: 'system',
          content: `You are an expert software architect and requirements analyst.
          Analyze the following project details and extract:
          1. Key functional requirements
          2. Technical requirements
          3. Suggested technology stack
          4. Missing information that should be clarified
          5. Recommended next steps
          
          Format your response as JSON with the following structure:
          {
            "identifiedRequirements": [{"name": string, "status": "success" | "warning" | "error"}],
            "suggestedTechStack": {
              "frontend": {"name": string, "description": string},
              "backend": {"name": string, "description": string},
              "database": {"name": string, "description": string},
              "hosting": {"name": string, "description": string}
            },
            "missingInformation": {"items": string[]},
            "nextSteps": [{"order": number, "description": string}]
          }
          
          IMPORTANT: Return only JSON with no additional text, explanation, or formatting. Your entire response must be valid JSON that can be parsed directly.`
        },
        {
          role: 'user',
          content: projectDetails
        }
      ],
      { 
        provider: provider as AIProvider | undefined,
        temperature: 0.5,
        userId,
        sessionId,
        tags: ['requirements', 'analysis']
      }
    );
    
    // Parse the response as JSON, handling potential markdown code blocks
    try {
      // Extract JSON from potential markdown code blocks
      const jsonText = extractJSONFromText(response.text);
      const analysis = JSON.parse(jsonText);
      res.json({ analysis });
    } catch (error) {
      throw new ValidationError('Failed to parse AI response as JSON', { 
        response: response.text,
        error
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Generate software architecture
 */
export const generateArchitecture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { requirements, provider } = req.body;
    
    if (!requirements) {
      throw new ValidationError('Requirements are required');
    }
    
    // Get the user ID and session ID if available
    const userId = req.user?.id || null;
    const sessionId = req.sessionID || null;
    
    // Generate architecture using the AI service
    const response = await generateChatCompletion(
      [
        {
          role: 'system',
          content: `You are an expert software architect.
          Generate a layered architecture for the described requirements.
          
          Format your response as JSON with the following structure:
          {
            "layers": [
              {
                "name": string,
                "components": [
                  {
                    "name": string,
                    "type": "ui" | "api" | "business" | "data" | "external"
                  }
                ]
              }
            ]
          }
          
          IMPORTANT: Return only JSON with no additional text, explanation, or formatting. Your entire response must be valid JSON that can be parsed directly.`
        },
        {
          role: 'user',
          content: requirements
        }
      ],
      { 
        provider: provider as AIProvider | undefined,
        temperature: 0.3,
        userId,
        sessionId,
        tags: ['architecture', 'design']
      }
    );
    
    // Parse the response as JSON, handling potential markdown code blocks
    try {
      // Extract JSON from potential markdown code blocks
      const jsonText = extractJSONFromText(response.text);
      const architecture = JSON.parse(jsonText);
      res.json({ architecture });
    } catch (error) {
      throw new ValidationError('Failed to parse AI response as JSON', { 
        response: response.text,
        error
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Generate code based on requirements and language
 */
export const generateCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { requirements, language, provider } = req.body;
    
    if (!requirements) {
      throw new ValidationError('Requirements are required');
    }
    
    if (!language) {
      throw new ValidationError('Programming language is required');
    }
    
    // Get the user ID and session ID if available
    const userId = req.user?.id || null;
    const sessionId = req.sessionID || null;
    
    // Generate code using the AI service
    const response = await generateChatCompletion(
      [
        {
          role: 'system',
          content: `You are an expert software developer specializing in ${language}.
          Generate high-quality, well-structured, and commented code based on the requirements.
          Include explanations for key parts of the implementation.`
        },
        {
          role: 'user',
          content: requirements
        }
      ],
      { 
        provider: provider as AIProvider | undefined,
        temperature: 0.2,
        userId,
        sessionId,
        tags: ['code-generation', language.toLowerCase()]
      }
    );
    
    res.json({ 
      code: response.text, 
      language
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Debug code based on error message
 */
export const debugCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, error: errorMsg, provider } = req.body;
    
    if (!code) {
      throw new ValidationError('Code is required');
    }
    
    if (!errorMsg) {
      throw new ValidationError('Error message is required');
    }
    
    // Get the user ID and session ID if available
    const userId = req.user?.id || null;
    const sessionId = req.sessionID || null;
    
    // Debug code using the AI service
    const response = await generateChatCompletion(
      [
        {
          role: 'system',
          content: `You are an expert software developer and debugger.
          Analyze the code and error message to identify issues and suggest fixes.
          Explain the root cause of the problem and provide a corrected version of the code.`
        },
        {
          role: 'user',
          content: `Code:\n\`\`\`\n${code}\n\`\`\`\n\nError:\n${errorMsg}`
        }
      ],
      { 
        provider: provider as AIProvider | undefined,
        temperature: 0.1,
        userId,
        sessionId,
        tags: ['debugging', 'error-analysis']
      }
    );
    
    res.json({ analysis: response.text });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate documentation for code
 */
export const generateDocumentation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, docType, provider } = req.body;
    
    if (!code) {
      throw new ValidationError('Code is required');
    }
    
    if (!docType) {
      throw new ValidationError('Documentation type is required');
    }
    
    // Get the user ID and session ID if available
    const userId = req.user?.id || null;
    const sessionId = req.sessionID || null;
    
    // Generate documentation using the AI service
    const response = await generateChatCompletion(
      [
        {
          role: 'system',
          content: `You are an expert technical writer specializing in software documentation.
          Generate high-quality ${docType} documentation for the provided code.
          Focus on clarity, completeness, and following best practices for ${docType} documentation.`
        },
        {
          role: 'user',
          content: code
        }
      ],
      { 
        provider: provider as AIProvider | undefined,
        temperature: 0.3,
        userId,
        sessionId,
        tags: ['documentation', docType.toLowerCase()]
      }
    );
    
    res.json({ 
      documentation: response.text,
      docType
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get available AI providers
 */
export const getProviders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const providers = getAvailableAIProviders();
    res.json(providers);
  } catch (error) {
    next(error);
  }
};