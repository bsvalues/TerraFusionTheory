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
    
    // Prepare the prompt for market analysis
    const prompt = this.buildMarketAnalysisPrompt(region, propertyType, timeframe || this.marketMetricsConfig.defaultTimeframe);
    
    // Use MCP tool for market analysis
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.3,
      system_message: `You are a real estate market analyst with expertise in ${region} ${propertyType} properties. Provide an insightful analysis focusing on market trends, pricing, inventory, and future outlook.`
    });
    
    if (!result.success) {
      throw new Error(`Market analysis failed: ${result.error}`);
    }
    
    // Store the analysis in market knowledge
    const analysis = result.result.response;
    this.marketKnowledge.set(`market_analysis_${region}_${propertyType}_${Date.now()}`, analysis);
    
    // Set the task result
    task.result = {
      analysis,
      region,
      propertyType,
      timeframe: timeframe || this.marketMetricsConfig.defaultTimeframe,
      timestamp: new Date().toISOString()
    };
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
    
    // Use MCP tool for property valuation
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.2,
      system_message: 'You are a professional real estate appraiser with deep knowledge of property valuation methodologies. Provide a detailed and accurate valuation analysis with confidence intervals.'
    });
    
    if (!result.success) {
      throw new Error(`Property valuation failed: ${result.error}`);
    }
    
    // Set the task result
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
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Handle neighborhood analysis task
   */
  private async handleNeighborhoodAnalysisTask(task: AgentTask): Promise<void> {
    const { neighborhood, city, state, factors } = task.inputs;
    
    // Prepare the prompt for neighborhood analysis
    const prompt = this.buildNeighborhoodAnalysisPrompt(neighborhood, city, state, factors);
    
    // Use MCP tool for neighborhood analysis
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.4,
      system_message: 'You are a neighborhood analysis expert with knowledge of urban planning, demographics, and community development. Provide a comprehensive analysis of the specified neighborhood.'
    });
    
    if (!result.success) {
      throw new Error(`Neighborhood analysis failed: ${result.error}`);
    }
    
    // Set the task result
    task.result = {
      analysis: result.result.response,
      location: {
        neighborhood,
        city,
        state
      },
      factors: factors || ['schools', 'crime', 'amenities', 'transportation', 'growth'],
      timestamp: new Date().toISOString()
    };
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
    
    // Prepare the prompt for investment recommendation
    const prompt = this.buildInvestmentRecommendationPrompt(
      budget, 
      investmentType, 
      region, 
      timeline,
      riskTolerance,
      goals
    );
    
    // Use MCP tool for investment recommendation
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.3,
      system_message: 'You are a real estate investment advisor with expertise in helping clients make sound investment decisions. Provide targeted recommendations based on the client\'s financial situation, goals, and risk tolerance.'
    });
    
    if (!result.success) {
      throw new Error(`Investment recommendation failed: ${result.error}`);
    }
    
    // Set the task result
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
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Handle general question task
   */
  private async handleQuestionTask(task: AgentTask): Promise<void> {
    const { question, context } = task.inputs;
    
    // Search relevant information in vector memory
    const memoryResults = await vectorMemory.search(question, { limit: 3, threshold: 0.7 });
    
    // Build context from relevant memories
    let contextFromMemory = '';
    if (memoryResults.length > 0) {
      contextFromMemory = "Relevant information from my knowledge base:\n" + 
        memoryResults.map(result => `- ${result.entry.text}`).join('\n');
    }
    
    // Prepare the prompt
    const prompt = `Question about real estate: ${question}\n\n${contextFromMemory}\n\n${context ? `Additional context: ${context}\n` : ''}Please provide a clear and helpful answer based on real estate expertise.`;
    
    // Use MCP tool to answer the question
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.5,
      system_message: 'You are a knowledgeable real estate professional with expertise in market analysis, property valuation, and investment strategies. Provide clear, accurate, and helpful answers to real estate questions.'
    });
    
    if (!result.success) {
      throw new Error(`Failed to answer question: ${result.error}`);
    }
    
    // Set the task result
    task.result = {
      answer: result.result.response,
      sourcesUsed: memoryResults.map(result => ({
        text: result.entry.text.substring(0, 100) + (result.entry.text.length > 100 ? '...' : ''),
        relevanceScore: result.score
      }))
    };
    
    // Store the question and answer in memory for future reference
    await vectorMemory.addEntry(
      `Q: ${question}\nA: ${result.result.response}`,
      {
        source: 'question-answering',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'real-estate-qa',
        tags: ['question', 'answer', 'real-estate']
      }
    );
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