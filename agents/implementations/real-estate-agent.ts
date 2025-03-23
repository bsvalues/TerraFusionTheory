/**
 * Real Estate Agent Implementation
 * 
 * This file implements a specialized agent for real estate analytics, market
 * analysis, and property recommendations.
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentCapability, AgentConfig, AgentStatus, AgentTask, BaseAgent, ExecutionResult } from '../interfaces/agent-interface';
import { Tool } from '../interfaces/tool-interface';
import { toolRegistry } from '../core/tool-registry';
import { vectorMemory, MemoryEntry } from '../memory/vector';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';

/**
 * Configuration specific to real estate agents
 */
export interface RealEstateAgentConfig extends AgentConfig {
  regions?: string[]; // e.g. 'pacific_northwest', 'southwest', etc.
  propertyTypes?: string[]; // e.g. 'residential', 'commercial', 'industrial', etc.
  dataSourcePreference?: 'cama' | 'mls' | 'both';
  marketMetricsConfig?: {
    defaultTimeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    trackTrends: boolean;
    alertThresholds?: {
      priceChangePct?: number;
      inventoryChangePct?: number;
      daysOnMarketChangePct?: number;
    };
  };
}

/**
 * Implementation of a specialized agent for real estate analytics
 */
export class RealEstateAgent extends BaseAgent implements Agent {
  protected regions: string[];
  protected propertyTypes: string[];
  protected dataSourcePreference: 'cama' | 'mls' | 'both';
  protected marketMetricsConfig: {
    defaultTimeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    trackTrends: boolean;
    alertThresholds: {
      priceChangePct: number;
      inventoryChangePct: number;
      daysOnMarketChangePct: number;
    };
  };
  protected marketKnowledge: Map<string, any> = new Map();
  
  constructor(id: string, config: RealEstateAgentConfig) {
    // Store local variable copies first
    const regions = config.regions || [];
    const propertyTypes = config.propertyTypes || ['residential', 'commercial'];
    const dataSourcePreference = config.dataSourcePreference || 'both';
    const marketMetricsConfig = {
      defaultTimeframe: config.marketMetricsConfig?.defaultTimeframe || 'monthly',
      trackTrends: config.marketMetricsConfig?.trackTrends ?? true,
      alertThresholds: {
        priceChangePct: config.marketMetricsConfig?.alertThresholds?.priceChangePct || 5,
        inventoryChangePct: config.marketMetricsConfig?.alertThresholds?.inventoryChangePct || 10,
        daysOnMarketChangePct: config.marketMetricsConfig?.alertThresholds?.daysOnMarketChangePct || 15
      }
    };
    
    // Create a local copy of capabilities array for modification
    const capabilities = [
      ...(config.capabilities || []),
      AgentCapability.REAL_ESTATE_ANALYSIS,
      AgentCapability.MARKET_PREDICTION,
      AgentCapability.GIS_DATA_PROCESSING,
      AgentCapability.TEXT_GENERATION,
      AgentCapability.TEXT_UNDERSTANDING,
      AgentCapability.TOOL_USE
    ];
    
    // Add additional capabilities based on configuration
    if (propertyTypes.includes('commercial')) {
      capabilities.push(AgentCapability.REASONING);
    }
    
    // Initialize the base agent with the enhanced capabilities
    super(id, {
      ...config,
      capabilities
    });
    
    // Now we can safely initialize instance properties
    this.regions = regions;
    this.propertyTypes = propertyTypes;
    this.dataSourcePreference = dataSourcePreference;
    this.marketMetricsConfig = marketMetricsConfig;
  }
  
  /**
   * Get the type of the agent
   */
  public getType(): string {
    return 'real_estate';
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    console.log(`Initializing RealEstateAgent: ${this.getId()}`);
    
    // Load relevant tools
    // Ensure MCP tool is available
    const mcpTool = toolRegistry.getTool('mcp');
    if (mcpTool) {
      this.toolRegistry.add('mcp');
    }
    
    // Store initial knowledge in vector memory
    await this.storeInitialKnowledge();
    
    // Log initialization
    await this.logActivity('Real estate agent initialized', LogLevel.INFO, {
      agentId: this.getId(),
      regions: this.regions,
      propertyTypes: this.propertyTypes,
      capabilities: this.getCapabilities()
    });
    
    this.status = AgentStatus.IDLE;
  }
  
  /**
   * Use a tool with the given inputs
   */
  public async useTool(toolName: string, inputs: Record<string, any>): Promise<any> {
    // Check if we have access to the tool
    if (!this.canUseTool(toolName)) {
      throw new Error(`Agent ${this.getId()} does not have access to tool: ${toolName}`);
    }
    
    // Get the tool from the registry
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    try {
      // Log tool usage
      await this.logActivity(`Using tool: ${toolName}`, LogLevel.INFO, {
        tool: toolName,
        inputs: JSON.stringify(inputs)
      });
      
      // Execute the tool
      const result = await tool.execute(inputs);
      
      // Remember the result in memory if successful
      if (result.success && toolName === 'mcp') {
        await this.storeToolResultInMemory(toolName, inputs, result.result);
      }
      
      return result;
    } catch (error) {
      // Log error
      await this.logActivity(`Error using tool: ${toolName}`, LogLevel.ERROR, {
        tool: toolName,
        inputs: JSON.stringify(inputs),
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Assign a task to the agent
   * This implementation extends the base addTask with type-specific handling
   */
  public async assignTask(taskRequest: {
    type: string;
    priority: 'low' | 'normal' | 'high';
    inputs: Record<string, any>;
  }): Promise<string> {
    // Convert priority string to numeric value
    let priorityValue = 5; // default to normal
    if (taskRequest.priority === 'low') priorityValue = 3;
    if (taskRequest.priority === 'high') priorityValue = 8;
    
    // Create description based on task type and inputs
    let description = '';
    
    switch (taskRequest.type) {
      case 'market_analysis':
        description = `Analyze ${taskRequest.inputs.region} ${taskRequest.inputs.propertyType} market`;
        break;
      
      case 'property_valuation':
        description = `Valuate property at ${taskRequest.inputs.address}`;
        break;
      
      case 'neighborhood_analysis':
        description = `Analyze ${taskRequest.inputs.neighborhood} neighborhood in ${taskRequest.inputs.city}`;
        break;
      
      case 'investment_recommendation':
        description = `Investment recommendations for ${taskRequest.inputs.region} with ${taskRequest.inputs.budget} budget`;
        break;
        
      case 'answer_question':
        description = `Answer question: ${taskRequest.inputs.question?.substring(0, 30)}...`;
        break;
      
      default:
        description = `Execute ${taskRequest.type} task`;
    }
    
    // Call the base class method to add the task
    return this.addTask({
      type: taskRequest.type,
      description,
      inputs: taskRequest.inputs,
      priority: priorityValue,
    });
  }
  
  /**
   * Execute a task (for agent coordinator)
   * This method overrides the one in BaseAgent to use our specialized task handling
   */
  public async execute(task: string, inputs: Record<string, any>, options?: Record<string, any>): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Create a task request
      const priority = options?.priority || 'normal';
      
      // Create a new task
      const taskId = await this.assignTask({
        type: task,
        priority,
        inputs
      });
      
      // Start the agent if it's idle
      if (this.status === AgentStatus.IDLE) {
        await this.start();
      }
      
      // Get the task result using the private method from the base class
      const taskResult = await this.executeTask(taskId);
      
      // Format result
      return {
        success: true,
        data: taskResult,
        metadata: {
          taskId,
          task,
          duration: Date.now() - startTime
        },
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          task,
          duration: Date.now() - startTime
        },
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute a task and wait for result
   * This method handles task execution and monitoring
   */
  private async executeTask(taskId: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const checkTaskStatus = async () => {
        const task = await this.getTask(taskId);
        
        if (!task) {
          reject(new Error(`Task ${taskId} not found`));
          return;
        }
        
        if (task.status === 'completed') {
          resolve(task.result);
          return;
        } else if (task.status === 'failed') {
          reject(new Error(task.error || 'Task failed without error message'));
          return;
        } else if (task.status === 'canceled') {
          reject(new Error('Task was canceled'));
          return;
        }
        
        // Check again after a short delay
        setTimeout(checkTaskStatus, 100);
      };
      
      checkTaskStatus();
    });
  }
  
  /**
   * Process a task assigned to the agent
   */
  protected async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    
    // Update task status
    task.status = 'running';
    task.startTime = Date.now();
    
    try {
      // Process based on task type
      switch (task.type) {
        case 'market_analysis':
          await this.handleMarketAnalysisTask(task);
          break;
        
        case 'property_valuation':
          await this.handlePropertyValuationTask(task);
          break;
        
        case 'neighborhood_analysis':
          await this.handleNeighborhoodAnalysisTask(task);
          break;
        
        case 'investment_recommendation':
          await this.handleInvestmentRecommendationTask(task);
          break;
        
        case 'answer_question':
          await this.handleQuestionTask(task);
          break;
        
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
      
      // Mark task as completed
      task.status = 'completed';
      task.endTime = Date.now();
      this.emit('taskCompleted', { agentId: this.getId(), taskId, task });
    } catch (error) {
      // Mark task as failed
      task.status = 'failed';
      task.endTime = Date.now();
      task.error = error instanceof Error ? error.message : String(error);
      
      this.emit('taskFailed', { agentId: this.getId(), taskId, task, error });
    }
  }
  
  /**
   * Handle market analysis task
   */
  private async handleMarketAnalysisTask(task: AgentTask): Promise<void> {
    const { region, propertyType, timeframe } = task.inputs;
    const effectiveTimeframe = timeframe || this.marketMetricsConfig.defaultTimeframe;
    
    // Log the start of market analysis
    await this.logActivity(`Starting market analysis for ${region} ${propertyType}`, LogLevel.INFO, {
      region,
      propertyType,
      timeframe: effectiveTimeframe
    });
    
    // Prepare the prompt for market analysis
    const prompt = this.buildMarketAnalysisPrompt(region, propertyType, effectiveTimeframe);
    
    // Create a custom memory query to find relevant market data
    const memoryQuery = `${region} ${propertyType} real estate market ${effectiveTimeframe} trends analysis`;
    
    // Use enhanced MCP tool for market analysis with vector memory integration
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.3,
      system_message: `You are a real estate market analyst with expertise in ${region} ${propertyType} properties. Provide an insightful analysis focusing on market trends, pricing, inventory, and future outlook.`,
      
      // Enhanced context-aware parameters
      use_vector_memory: true,
      memory_query: memoryQuery,
      memory_options: {
        limit: 5,
        threshold: 0.25,  // Lower threshold to get more potential matches for market data
        diversityFactor: 0.4,
        includeSources: true,
        timeWeighting: {
          enabled: true,
          halfLifeDays: 15,  // Market data becomes outdated more quickly
          maxBoost: 2.0
        }
      },
      context_integration: 'smart'
    });
    
    if (!result.success) {
      throw new Error(`Market analysis failed: ${result.error}`);
    }
    
    // Extract context sources and metadata
    const contextSourcesUsed = result.result.metadata?.contextSources || [];
    const contextEnhanced = result.result.metadata?.contextEnhanced || false;
    
    // Store the analysis in market knowledge
    const analysis = result.result.response;
    this.marketKnowledge.set(`market_analysis_${region}_${propertyType}_${Date.now()}`, analysis);
    
    // Set the task result with enhanced metadata
    task.result = {
      analysis,
      region,
      propertyType,
      timeframe: effectiveTimeframe,
      timestamp: new Date().toISOString(),
      metadata: {
        contextEnhanced,
        contextSources: contextSourcesUsed,
        responseTime: result.metadata?.responseTime || null,
        modelUsed: result.result.model,
        fromCache: result.result.fromCache || false
      }
    };
    
    // Store the analysis in vector memory for future reference
    await vectorMemory.addEntry(
      `Market Analysis for ${region} ${propertyType} (${effectiveTimeframe}): ${analysis}`,
      {
        source: 'market-analysis',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'market-analysis',
        tags: ['market-analysis', region, propertyType, effectiveTimeframe],
        region,
        propertyType,
        timeframe: effectiveTimeframe
      }
    );
    
    await this.logActivity(`Completed market analysis for ${region} ${propertyType}`, LogLevel.INFO, {
      region,
      propertyType,
      timeframe: effectiveTimeframe,
      analysisLength: analysis.length,
      contextSourcesUsed: contextSourcesUsed.length,
      contextEnhanced,
      responseTime: result.metadata?.responseTime
    });
  }
  
  /**
   * Handle property valuation task
   */
  private async handlePropertyValuationTask(task: AgentTask): Promise<void> {
    const { 
      address, 
      propertyType, 
      squareFeet, 
      bedrooms, 
      bathrooms, 
      yearBuilt, 
      lotSize,
      additionalFeatures 
    } = task.inputs;
    
    // Log the start of property valuation
    await this.logActivity(`Starting property valuation for ${address}`, LogLevel.INFO, {
      address,
      propertyType,
      squareFeet,
      bedrooms,
      bathrooms,
      yearBuilt
    });
    
    // Prepare the prompt for property valuation
    const prompt = this.buildPropertyValuationPrompt(
      address, 
      propertyType, 
      squareFeet, 
      bedrooms, 
      bathrooms, 
      yearBuilt, 
      lotSize,
      additionalFeatures
    );
    
    // Create a custom memory query for finding similar properties
    // Extract the location from the address for better context retrieval
    const addressParts = address.split(',').map((part: string) => part.trim());
    const city = addressParts.length > 1 ? addressParts[1] : '';
    const memoryQuery = `${propertyType} property valuation ${city} ${squareFeet} square feet ${bedrooms} bedrooms ${bathrooms} bathrooms ${yearBuilt}`;
    
    // Use enhanced MCP tool for property valuation with vector memory integration
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.2,
      system_message: 'You are a professional real estate appraiser with deep knowledge of property valuation methodologies. Provide a detailed and accurate valuation analysis with confidence intervals.',
      
      // Enhanced context-aware parameters
      use_vector_memory: true,
      memory_query: memoryQuery,
      memory_options: {
        limit: 5,
        threshold: 0.3,
        diversityFactor: 0.4,
        includeSources: true,
        timeWeighting: {
          enabled: true,
          halfLifeDays: 30,
          maxBoost: 1.5
        }
      },
      context_integration: 'smart'
    });
    
    if (!result.success) {
      throw new Error(`Property valuation failed: ${result.error}`);
    }
    
    // Extract context sources and metadata
    const contextSourcesUsed = result.result.metadata?.contextSources || [];
    const contextEnhanced = result.result.metadata?.contextEnhanced || false;
    
    // Set the task result with enhanced metadata
    task.result = {
      valuation: result.result.response,
      property: {
        address,
        propertyType,
        squareFeet,
        bedrooms,
        bathrooms,
        yearBuilt,
        lotSize,
        additionalFeatures
      },
      timestamp: new Date().toISOString(),
      metadata: {
        contextEnhanced,
        contextSources: contextSourcesUsed,
        responseTime: result.metadata?.responseTime || null,
        modelUsed: result.result.model,
        fromCache: result.result.fromCache || false
      }
    };
    
    // Store the valuation in vector memory for future reference
    await vectorMemory.addEntry(
      `Property Valuation for ${address} (${propertyType}, ${squareFeet} sq ft, ${bedrooms}BD/${bathrooms}BA, built ${yearBuilt}): ${result.result.response}`,
      {
        source: 'property-valuation',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'property-valuation',
        tags: ['property-valuation', propertyType, city],
        address,
        propertyType,
        squareFeet,
        bedrooms,
        bathrooms,
        yearBuilt
      }
    );
    
    await this.logActivity(`Completed property valuation for ${address}`, LogLevel.INFO, {
      address,
      propertyType,
      valuationLength: result.result.response.length,
      contextSourcesUsed: contextSourcesUsed.length,
      contextEnhanced,
      responseTime: result.metadata?.responseTime
    });
  }
  
  /**
   * Handle neighborhood analysis task
   */
  private async handleNeighborhoodAnalysisTask(task: AgentTask): Promise<void> {
    const { neighborhood, city, state, factors } = task.inputs;
    const requestedFactors = factors || ['schools', 'crime', 'amenities', 'transportation', 'growth'];
    
    // Log the start of neighborhood analysis
    await this.logActivity(`Starting neighborhood analysis for ${neighborhood}, ${city}, ${state}`, LogLevel.INFO, {
      neighborhood,
      city,
      state,
      factors: requestedFactors
    });
    
    // Prepare the prompt for neighborhood analysis
    const prompt = this.buildNeighborhoodAnalysisPrompt(neighborhood, city, state, requestedFactors);
    
    // Create a custom memory query for finding relevant neighborhood information
    const memoryQuery = `${neighborhood} ${city} ${state} neighborhood analysis ${requestedFactors.join(' ')}`;
    
    // Use enhanced MCP tool for neighborhood analysis with vector memory integration
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.4,
      system_message: 'You are a neighborhood analysis expert with knowledge of urban planning, demographics, and community development. Provide a comprehensive analysis of the specified neighborhood.',
      
      // Enhanced context-aware parameters
      use_vector_memory: true,
      memory_query: memoryQuery,
      memory_options: {
        limit: 6, // Get more context entries for neighborhood analysis
        threshold: 0.25,
        diversityFactor: 0.5,
        includeSources: true,
        timeWeighting: {
          enabled: true,
          halfLifeDays: 60, // Neighborhood information stays relevant longer
          maxBoost: 1.2
        }
      },
      context_integration: 'smart'
    });
    
    if (!result.success) {
      throw new Error(`Neighborhood analysis failed: ${result.error}`);
    }
    
    // Extract context sources and metadata
    const contextSourcesUsed = result.result.metadata?.contextSources || [];
    const contextEnhanced = result.result.metadata?.contextEnhanced || false;
    
    // Set the task result with enhanced metadata
    task.result = {
      analysis: result.result.response,
      location: {
        neighborhood,
        city,
        state
      },
      factors: requestedFactors,
      timestamp: new Date().toISOString(),
      metadata: {
        contextEnhanced,
        contextSources: contextSourcesUsed,
        responseTime: result.metadata?.responseTime || null,
        modelUsed: result.result.model,
        fromCache: result.result.fromCache || false
      }
    };
    
    // Store the neighborhood analysis in vector memory for future reference
    await vectorMemory.addEntry(
      `Neighborhood Analysis for ${neighborhood}, ${city}, ${state}: ${result.result.response.substring(0, 1000)}${result.result.response.length > 1000 ? '...' : ''}`,
      {
        source: 'neighborhood-analysis',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'neighborhood-analysis',
        tags: ['neighborhood-analysis', neighborhood, city, state, ...requestedFactors],
        neighborhood,
        city,
        state,
        factors: requestedFactors
      }
    );
    
    await this.logActivity(`Completed neighborhood analysis for ${neighborhood}, ${city}, ${state}`, LogLevel.INFO, {
      neighborhood,
      city,
      state,
      analysisLength: result.result.response.length,
      contextSourcesUsed: contextSourcesUsed.length,
      contextEnhanced,
      responseTime: result.metadata?.responseTime
    });
  }
  
  /**
   * Handle investment recommendation task
   */
  private async handleInvestmentRecommendationTask(task: AgentTask): Promise<void> {
    const { 
      budget, 
      investmentType, 
      region, 
      timeline,
      riskTolerance,
      goals
    } = task.inputs;
    
    // Log the start of investment recommendation
    await this.logActivity(`Starting investment recommendation for ${region}`, LogLevel.INFO, {
      budget,
      investmentType,
      region,
      timeline,
      riskTolerance,
      goalsCount: goals ? goals.length : 0
    });
    
    // Prepare the prompt for investment recommendation
    const prompt = this.buildInvestmentRecommendationPrompt(
      budget, 
      investmentType, 
      region, 
      timeline,
      riskTolerance,
      goals
    );
    
    // Create a custom memory query for investment recommendations
    const memoryQuery = `${region} real estate investment ${investmentType} ${budget} ${riskTolerance} risk ${timeline} ${goals ? goals.join(' ') : ''}`;
    
    // Use enhanced MCP tool for investment recommendation with vector memory integration
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.3,
      system_message: `You are an advanced real estate investment advisor with deep expertise in market analysis and investment strategies. Utilize comprehensive data analysis, pattern recognition, and predictive modeling to provide sophisticated investment recommendations. Consider:
- Market cycle position and momentum
- Supply-demand dynamics and elasticity
- Demographic trends and migration patterns
- Economic indicators and correlations
- Risk-adjusted return metrics
- Portfolio diversification impact`,
      
      // Enhanced context-aware parameters
      use_vector_memory: true,
      memory_query: memoryQuery,
      memory_options: {
        limit: 6,
        threshold: 0.3,
        diversityFactor: 0.6, // Higher diversity for investment options
        includeSources: true,
        timeWeighting: {
          enabled: true,
          halfLifeDays: 45,
          maxBoost: 1.3
        }
      },
      context_integration: 'smart'
    });
    
    if (!result.success) {
      throw new Error(`Investment recommendation failed: ${result.error}`);
    }
    
    // Extract context sources and metadata
    const contextSourcesUsed = result.result.metadata?.contextSources || [];
    const contextEnhanced = result.result.metadata?.contextEnhanced || false;
    
    // Set the task result with enhanced metadata
    task.result = {
      recommendations: result.result.response,
      investmentProfile: {
        budget,
        investmentType,
        region,
        timeline,
        riskTolerance,
        goals
      },
      timestamp: new Date().toISOString(),
      metadata: {
        contextEnhanced,
        contextSources: contextSourcesUsed,
        responseTime: result.metadata?.responseTime || null,
        modelUsed: result.result.model,
        fromCache: result.result.fromCache || false
      }
    };
    
    // Store the investment recommendation in vector memory for future reference
    await vectorMemory.addEntry(
      `Investment Recommendation for ${region} (${investmentType}, Budget: ${budget}, Timeline: ${timeline}, Risk: ${riskTolerance}): ${result.result.response.substring(0, 1000)}${result.result.response.length > 1000 ? '...' : ''}`,
      {
        source: 'investment-recommendation',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'investment-recommendation',
        tags: ['investment', region, investmentType, riskTolerance],
        budget: typeof budget === 'string' ? budget : budget.toString(),
        investmentType,
        region,
        timeline,
        riskTolerance
      }
    );
    
    await this.logActivity(`Completed investment recommendation for ${region}`, LogLevel.INFO, {
      region,
      investmentType,
      recommendationsLength: result.result.response.length,
      contextSourcesUsed: contextSourcesUsed.length,
      contextEnhanced,
      responseTime: result.metadata?.responseTime
    });
  }
  
  /**
   * Handle general question task
   */
  private async handleQuestionTask(task: AgentTask): Promise<void> {
    const { question, context } = task.inputs;
    
    // Detect if this is a collaborative request from another agent
    const isCollaborationRequest = this.isCollaborationRequest(question);
    const requestingAgentId = isCollaborationRequest ? this.extractRequestingAgentId(question) : null;
    
    // Log that we're processing a question
    await this.logActivity(`Processing question: "${question.substring(0, 30)}..."`, LogLevel.INFO, {
      questionLength: question.length,
      hasAdditionalContext: !!context,
      isCollaborationRequest,
      requestingAgentId
    });
    
    // Prepare a base prompt that will be enhanced with context by the MCP tool
    let prompt = `
Question about real estate: ${question}

${context ? `## Additional Context Provided\n${context}\n\n` : ''}

## Task
Please provide a clear, accurate, and helpful answer to the question based on:
1. Your expertise in real estate
2. The relevant information from your knowledge base
3. Current market understanding
4. The additional context (if provided)
`;

    // Adjust response style based on whether this is a collaboration request
    if (isCollaborationRequest) {
      prompt += `
Because this is a consultation request from another agent, focus on providing:
- Factual information about real estate concepts, metrics, and terms
- Technical details that would be relevant for software development
- Structured data where appropriate (using examples, lists, or tables)
- Clear explanations of domain-specific knowledge`;
    } else {
      prompt += `
Focus on providing actionable insights that would be valuable to someone interested in real estate.`;
    }
    
    // Determine memory search options based on request type
    const memoryOptions = {
      limit: isCollaborationRequest ? 7 : 5,       // More context for technical collaboration
      threshold: 0.3,                             // Lower threshold to get more potential matches
      diversityFactor: isCollaborationRequest ? 0.6 : 0.5,  // More diversity for technical questions
      includeSources: true,                       // Include source information in results
      timeWeighting: {                            // Prioritize recent information
        enabled: true,
        halfLifeDays: 30,                         // Information "half-life" of 30 days
        maxBoost: 1.5                             // Max boost factor for very recent information
      }
    };
    
    // Use enhanced MCP tool with vector memory integration
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: isCollaborationRequest ? 0.3 : 0.4,  // Lower temp for technical collaboration
      system_message: isCollaborationRequest
        ? 'You are a technical real estate expert providing domain knowledge to a developer. Provide precise, technically-oriented explanations about real estate concepts with a focus on accuracy and data relevance. Include technical definitions where appropriate.'
        : 'You are a knowledgeable real estate professional with expertise in market analysis, property valuation, and investment strategies. Your specialty is the Grandview, WA market and surrounding areas in the Pacific Northwest. Provide clear, accurate, and helpful answers to real estate questions.',
      cache: true,  // Enable caching for efficiency
      
      // Enhanced context-aware parameters
      use_vector_memory: true,  // Enable vector memory context enhancement
      memory_query: this.stripCollaborationPrefix(question),  // Clean question for memory search
      memory_options: memoryOptions,
      context_integration: 'smart'  // Use smart integration strategy
    });
    
    if (!result.success) {
      throw new Error(`Failed to answer question: ${result.error}`);
    }
    
    // Extract context sources used from the result metadata
    const contextSourcesUsed = result.result.metadata?.contextSources || [];
    const contextStrategy = result.result.metadata?.contextStrategy || 'none';
    
    // Set the task result with enhanced metadata
    task.result = {
      answer: result.result.response,
      sourcesUsed: contextSourcesUsed,
      metadata: {
        responseTime: result.metadata?.responseTime || null,
        modelUsed: result.result.model,
        timestamp: new Date().toISOString(),
        contextEnhanced: result.result.metadata?.contextEnhanced || false,
        contextStrategy: contextStrategy,
        fromCache: result.result.fromCache || false,
        collaborationContext: isCollaborationRequest ? {
          requestingAgentId,
          responseType: 'technical-consultation'
        } : undefined
      }
    };
    
    // Store the question and answer in memory with enhanced metadata
    // Use different tags and categories for collaborative vs regular queries
    const memoryTags = ['question', 'answer', 'real-estate'];
    if (isCollaborationRequest) {
      memoryTags.push('agent-collaboration', 'technical', 'consultation');
    }
    
    await vectorMemory.addEntry(
      `Q: ${this.stripCollaborationPrefix(question)}\nA: ${result.result.response}`,
      {
        source: isCollaborationRequest ? 'agent-collaboration' : 'question-answering',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: isCollaborationRequest ? 'cross-domain-collaboration' : 'real-estate-qa',
        tags: memoryTags,
        questionType: this.categorizeQuestion(question),
        responseQuality: 1.0,  // Can be updated later with user feedback
        modelUsed: result.result.model,
        contextEnhanced: result.result.metadata?.contextEnhanced || false,
        collaboratingAgentId: requestingAgentId  // Track collaboration if applicable
      }
    );
    
    await this.logActivity(`Answered question: "${question.substring(0, 30)}..."`, LogLevel.INFO, {
      questionLength: question.length,
      responseLength: result.result.response.length,
      contextSourcesUsed: contextSourcesUsed.length,
      contextStrategy: contextStrategy,
      responseTime: result.metadata?.responseTime,
      fromCache: result.result.fromCache || false,
      collaborationRequest: isCollaborationRequest,
      requestingAgentId
    });
  }
  
  /**
   * Categorize a question to help with organization and retrieval
   */
  private categorizeQuestion(question: string): string {
    // Simple pattern-based categorization
    if (/market\s+(trend|analysis|forecast|condition)/i.test(question)) {
      return 'market-trend';
    } else if (/property\s+valu(e|ation)/i.test(question)) {
      return 'property-valuation';
    } else if (/invest(ment|ing|or)/i.test(question)) {
      return 'investment';
    } else if (/(rent|rental|leasing)/i.test(question)) {
      return 'rental-market';
    } else if (/(buy|purchase|buying)/i.test(question)) {
      return 'buying';
    } else if (/(neighborhood|area|location)/i.test(question)) {
      return 'neighborhood';
    } else if (/(mortgage|loan|financing)/i.test(question)) {
      return 'financing';
    }
    
    return 'general';
  }
  
  /**
   * Build prompt for market analysis
   */
  private buildMarketAnalysisPrompt(
    region: string,
    propertyType: string,
    timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  ): string {
    return `Please analyze the ${region} real estate market for ${propertyType} properties over the ${timeframe} timeframe. Include:

1. Market overview and current conditions
2. Price trends and changes
3. Inventory levels and months of supply
4. Days on market metrics
5. Sales volume and velocity
6. Supply and demand balance
7. Key market drivers and influencing factors
8. Future outlook and predictions
9. Opportunities and risks for investors
10. Comparative analysis with neighboring markets (if applicable)`;
  }
  
  /**
   * Build prompt for property valuation
   */
  private buildPropertyValuationPrompt(
    address: string,
    propertyType: string,
    squareFeet: number,
    bedrooms: number,
    bathrooms: number,
    yearBuilt: number,
    lotSize: number | string,
    additionalFeatures?: string[]
  ): string {
    return `Please provide a comprehensive valuation analysis for the following property:

Property Details:
- Address: ${address}
- Type: ${propertyType}
- Size: ${squareFeet} square feet
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Year Built: ${yearBuilt}
- Lot Size: ${lotSize}
${additionalFeatures ? `- Additional Features: ${additionalFeatures.join(', ')}` : ''}

Please include:
1. Estimated market value with confidence interval
2. Valuation methodology explanation
3. Comparable property analysis
4. Value drivers and detractors
5. Market context affecting the valuation
6. Recommendations for value enhancement
7. Investment potential assessment`;
  }
  
  /**
   * Build prompt for neighborhood analysis
   */
  private buildNeighborhoodAnalysisPrompt(
    neighborhood: string,
    city: string,
    state: string,
    factors?: string[]
  ): string {
    const requestedFactors = factors || ['schools', 'crime', 'amenities', 'transportation', 'growth'];
    
    return `Please provide a detailed neighborhood analysis for ${neighborhood} in ${city}, ${state}. Focus on the following factors:

${requestedFactors.map(factor => `- ${factor.charAt(0).toUpperCase() + factor.slice(1)}`).join('\n')}

Please include:
1. Overall neighborhood profile and character
2. Demographics and population trends
3. Housing market conditions and trends
4. Quality of life assessment
5. Future development plans and potential
6. Investment outlook
7. Strengths and weaknesses compared to surrounding areas
8. Livability score and ranking`;
  }
  
  /**
   * Build prompt for investment recommendation
   */
  private buildInvestmentRecommendationPrompt(
    budget: number | string,
    investmentType: string,
    region: string,
    timeline: string,
    riskTolerance: 'low' | 'medium' | 'high',
    goals?: string[]
  ): string {
    return `Please provide real estate investment recommendations based on the following criteria:

Investment Profile:
- Budget: ${budget}
- Investment Type: ${investmentType}
- Region: ${region}
- Timeline: ${timeline}
- Risk Tolerance: ${riskTolerance}
${goals ? `- Investment Goals: ${goals.join(', ')}` : ''}

Please include:
1. Recommended property types and segments
2. Specific areas within the region to focus on
3. Expected returns and ROI analysis
4. Risk assessment and mitigation strategies
5. Market timing considerations
6. Entry and exit strategy recommendations
7. Financing options and leverage considerations
8. Portfolio diversification advice
9. Alternative investment options for comparison
10. Specific property recommendations if applicable`;
  }
  
  /**
   * Store initial knowledge in vector memory
   */
  private async storeInitialKnowledge(): Promise<void> {
    // Store information about regions the agent specializes in
    for (const region of this.regions) {
      await vectorMemory.addEntry(
        `I have expertise in ${region} real estate market analysis.`,
        {
          source: 'agent-initialization',
          agentId: this.getId(),
          timestamp: new Date().toISOString(),
          category: 'expertise',
          tags: ['region', region]
        }
      );
    }
    
    // Store information about property types the agent specializes in
    for (const propertyType of this.propertyTypes) {
      await vectorMemory.addEntry(
        `I specialize in ${propertyType} properties and their market dynamics.`,
        {
          source: 'agent-initialization',
          agentId: this.getId(),
          timestamp: new Date().toISOString(),
          category: 'expertise',
          tags: ['property-type', propertyType]
        }
      );
    }
    
    // Store information about the agent's data source preferences
    await vectorMemory.addEntry(
      `I prefer using ${this.dataSourcePreference === 'both' ? 'both CAMA and MLS data' : 
        this.dataSourcePreference === 'cama' ? 'CAMA (Computer Assisted Mass Appraisal) data' : 
        'MLS (Multiple Listing Service) data'} for my analyses.`,
      {
        source: 'agent-initialization',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'preferences',
        tags: ['data-source', this.dataSourcePreference]
      }
    );
    
    // Store information about the agent's market metrics configuration
    await vectorMemory.addEntry(
      `I track market metrics on a ${this.marketMetricsConfig.defaultTimeframe} basis${
        this.marketMetricsConfig.trackTrends ? ' and analyze trends over time' : ''
      }. I monitor for significant changes: ${this.marketMetricsConfig.alertThresholds.priceChangePct}% in prices, ${
        this.marketMetricsConfig.alertThresholds.inventoryChangePct
      }% in inventory, and ${this.marketMetricsConfig.alertThresholds.daysOnMarketChangePct}% in days on market.`,
      {
        source: 'agent-initialization',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'configuration',
        tags: ['market-metrics', 'alerts', 'thresholds']
      }
    );
  }
  
  /**
   * Store tool results in memory for future reference
   */
  private async storeToolResultInMemory(
    toolName: string,
    inputs: Record<string, any>,
    result: any
  ): Promise<void> {
    if (toolName === 'mcp') {
      // Store the prompt and response in vector memory
      await vectorMemory.addEntry(
        `Prompt: ${inputs.prompt}\nResponse: ${result.response}`,
        {
          source: 'mcp-tool',
          agentId: this.getId(),
          timestamp: new Date().toISOString(),
          category: 'tool-interaction',
          tags: ['mcp', 'prompt', 'response', 'real-estate']
        }
      );
    }
  }
  
  /**
   * Check if a question is a collaboration request from another agent
   */
  private isCollaborationRequest(question: string): boolean {
    // Check for collaboration markers in the question
    return question.includes('[Developer Agent Consultation]') || 
           question.includes('[Agent Collaboration]') || 
           question.includes('[Consultation Request]');
  }
  
  /**
   * Extract the ID of the requesting agent from a collaboration request
   */
  private extractRequestingAgentId(question: string): string | null {
    // Extract agent ID from collaboration request
    const match = question.match(/\[(Developer Agent|Agent) Consultation\]\s*\[(\w+)\]/i);
    if (match && match[2]) {
      return match[2];
    }
    
    // If no explicit ID is found but it's from the developer agent
    if (question.includes('[Developer Agent Consultation]')) {
      return 'developer_agent'; // Default ID for developer agent
    }
    
    return null;
  }
  
  /**
   * Remove collaboration prefixes from questions for cleaner processing
   */
  private stripCollaborationPrefix(question: string): string {
    // Remove collaboration markers for cleaner processing
    return question
      .replace(/\[Developer Agent Consultation\]\s*/i, '')
      .replace(/\[Agent Collaboration\]\s*/i, '')
      .replace(/\[Consultation Request\]\s*/i, '')
      .replace(/\[\w+\]\s*/g, '') // Remove any agent IDs
      .trim();
  }
  
  /**
   * Log an activity to the storage system
   */
  private async logActivity(message: string, level: LogLevel, details?: any): Promise<void> {
    try {
      await storage.createLog({
        level,
        category: LogCategory.AI,
        message: `[RealEstateAgent:${this.getId()}] ${message}`,
        details: details ? JSON.stringify(details) : null,
        source: 'real-estate-agent',
        projectId: null,
        userId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['agent', 'real-estate', ...this.regions, ...this.propertyTypes]
      });
    } catch (error) {
      console.error('Failed to log real estate agent activity:', error);
    }
  }
}

/**
 * Create a new real estate agent
 */
export async function createRealEstateAgent(config: RealEstateAgentConfig): Promise<RealEstateAgent> {
  const id = config.id || `re_agent_${uuidv4()}`;
  const agent = new RealEstateAgent(id, config);
  await agent.initialize();
  return agent;
}