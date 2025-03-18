import { apiRequest } from './queryClient';

// Function to send a user message to the OpenAI API via our backend
export async function sendMessageToAI(message: string, projectId: number) {
  try {
    const response = await apiRequest(
      'POST',
      '/api/ai/message',
      {
        message,
        projectId
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error('Error sending message to AI:', error);
    throw error;
  }
}

// Function to analyze project requirements
export async function analyzeRequirements(projectDetails: string, projectId: number) {
  try {
    const response = await apiRequest(
      'POST',
      '/api/ai/analyze',
      {
        projectDetails,
        projectId
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error('Error analyzing requirements:', error);
    throw error;
  }
}

// Function to generate code based on requirements
export async function generateCode(requirements: string, language: string, projectId: number) {
  try {
    const response = await apiRequest(
      'POST',
      '/api/ai/generate-code',
      {
        requirements,
        language,
        projectId
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
}

// Function to debug code
export async function debugCode(code: string, error: string, projectId: number) {
  try {
    const response = await apiRequest(
      'POST',
      '/api/ai/debug',
      {
        code,
        error,
        projectId
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error('Error debugging code:', error);
    throw error;
  }
}

// Function to generate documentation
export async function generateDocumentation(code: string, docType: string, projectId: number) {
  try {
    const response = await apiRequest(
      'POST',
      '/api/ai/documentation',
      {
        code,
        docType,
        projectId
      }
    );
    
    return await response.json();
  } catch (error) {
    console.error('Error generating documentation:', error);
    throw error;
  }
}
