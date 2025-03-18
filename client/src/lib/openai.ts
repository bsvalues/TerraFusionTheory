import { apiRequest } from './queryClient';

// Function to send a user message to the OpenAI API via our backend
export async function sendMessageToAI(message: string, projectId: number) {
  try {
    return await apiRequest<{response: string; timestamp: string}>('/api/ai/message', {
      method: 'POST',
      body: JSON.stringify({
        message,
        projectId
      })
    });
  } catch (error) {
    console.error('Error sending message to AI:', error);
    throw error;
  }
}

// Function to analyze project requirements
export async function analyzeRequirements(projectDetails: string, projectId: number) {
  try {
    return await apiRequest<{analysis: any}>('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({
        projectDetails,
        projectId
      })
    });
  } catch (error) {
    console.error('Error analyzing requirements:', error);
    throw error;
  }
}

// Function to generate code based on requirements
export async function generateCode(requirements: string, language: string, projectId: number) {
  try {
    return await apiRequest<{code: string; explanation: string}>('/api/ai/generate-code', {
      method: 'POST',
      body: JSON.stringify({
        requirements,
        language,
        projectId
      })
    });
  } catch (error) {
    console.error('Error generating code:', error);
    throw error;
  }
}

// Function to debug code
export async function debugCode(code: string, errorMsg: string, projectId: number) {
  try {
    return await apiRequest<{fixedCode: string; explanation: string}>('/api/ai/debug', {
      method: 'POST',
      body: JSON.stringify({
        code,
        error: errorMsg,
        projectId
      })
    });
  } catch (error) {
    console.error('Error debugging code:', error);
    throw error;
  }
}

// Function to generate documentation
export async function generateDocumentation(code: string, docType: string, projectId: number) {
  try {
    return await apiRequest<{documentation: string}>('/api/ai/documentation', {
      method: 'POST',
      body: JSON.stringify({
        code,
        docType,
        projectId
      })
    });
  } catch (error) {
    console.error('Error generating documentation:', error);
    throw error;
  }
}
