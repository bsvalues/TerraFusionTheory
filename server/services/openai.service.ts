import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "your-api-key" });

export async function analyzeMessage(message: string, projectId: number) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are BS, an expert AI Developer Assistant. You help analyze requirements, propose architectures, and assist with software development tasks. Provide helpful, accurate, and thoughtful responses to development questions."
        },
        { role: "user", content: message }
      ],
    });

    return {
      message: response.choices[0].message.content,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw new Error("Failed to process message with AI");
  }
}

export async function analyzeRequirements(projectDetails: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are BS, an expert AI Developer Assistant. Analyze the following project details and identify:
          1. Key requirements (list them individually)
          2. Suggested technology stack (frontend, backend, database, hosting)
          3. Missing information that needs to be clarified
          4. Next steps for the project
          
          Format your response as JSON with these keys: identifiedRequirements, suggestedTechStack, missingInformation, nextSteps`
        },
        { role: "user", content: projectDetails }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing requirements:", error);
    throw new Error("Failed to analyze project requirements");
  }
}

export async function generateArchitecture(requirements: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are BS, an expert AI Developer Assistant. Based on the following requirements, create a high-level system architecture. Include UI layer, API layer, business logic layer, data layer and external integrations.
          
          Format your response as JSON with a layers array containing components for each architectural layer.`
        },
        { role: "user", content: requirements }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating architecture:", error);
    throw new Error("Failed to generate system architecture");
  }
}

export async function generateCode(requirements: string, language: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are BS, an expert AI Developer Assistant. Generate clean, production-ready code in ${language} based on the following requirements. Include comments and documentation.`
        },
        { role: "user", content: requirements }
      ]
    });

    return {
      code: response.choices[0].message.content,
      language
    };
  } catch (error) {
    console.error("Error generating code:", error);
    throw new Error("Failed to generate code");
  }
}

export async function debugCode(code: string, error: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are BS, an expert AI Developer Assistant. Debug the following code and explain the issue and solution clearly."
        },
        { 
          role: "user", 
          content: `I have the following code:\n\n${code}\n\nI'm getting this error:\n\n${error}\n\nPlease help me debug it.` 
        }
      ]
    });

    return {
      analysis: response.choices[0].message.content,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error debugging code:", error);
    throw new Error("Failed to debug code");
  }
}

export async function generateDocumentation(code: string, docType: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: `You are BS, an expert AI Developer Assistant. Generate comprehensive ${docType} documentation for the following code. Include usage examples, parameters, and return values where applicable.`
        },
        { role: "user", content: code }
      ]
    });

    return {
      documentation: response.choices[0].message.content,
      type: docType,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error generating documentation:", error);
    throw new Error("Failed to generate documentation");
  }
}
