/**
 * Valuation Agent Implementation
 * 
 * This file implements a specialized agent for property valuation and
 * appraisal methodology expertise.
 */

import { v4 as uuidv4 } from 'uuid';
import { Agent, AgentCapability, AgentConfig, AgentStatus, AgentTask, BaseAgent, ExecutionResult } from '../interfaces/agent-interface';
import { Tool } from '../interfaces/tool-interface';
import { toolRegistry } from '../core/tool-registry';
import { vectorMemory, MemoryEntry } from '../memory/vector';
import { LogCategory, LogLevel } from '../../shared/schema';
import { storage } from '../../server/storage';
import { ValuationAgentConfig, DEFAULT_VALUATION_AGENT_CONFIG } from '../types/valuation-agent';
import { RealEstateAgent } from './real-estate-agent';

/**
 * Implementation of a specialized agent for property valuation and appraisal
 */
export class ValuationAgent extends RealEstateAgent implements Agent {
  protected appraisalMethodologies: Array<string>;
  protected confidenceScoring: boolean;
  protected explainabilityLevel: 'basic' | 'detailed' | 'comprehensive';
  protected salesComparisonConfig: Record<string, any>;
  protected costApproachConfig: Record<string, any>;
  protected incomeApproachConfig: Record<string, any>;
  protected massAppraisalConfig: Record<string, any>;
  protected automatedValuationConfig: Record<string, any>;
  protected valuationKnowledge: Map<string, any> = new Map();
  
  constructor(id: string, config: ValuationAgentConfig) {
    // Merge with default config
    const mergedConfig = {
      ...DEFAULT_VALUATION_AGENT_CONFIG,
      ...config,
      capabilities: [
        ...(config.capabilities || []),
        AgentCapability.REAL_ESTATE_ANALYSIS,
        AgentCapability.REASONING,
        AgentCapability.TEXT_GENERATION,
        AgentCapability.TEXT_UNDERSTANDING,
        AgentCapability.TOOL_USE,
        AgentCapability.VECTOR_SEARCH
      ]
    };
    
    // Call parent constructor with merged config
    super(id, mergedConfig);
    
    // Initialize valuation-specific properties
    this.appraisalMethodologies = mergedConfig.appraisalMethodologies || 
      DEFAULT_VALUATION_AGENT_CONFIG.appraisalMethodologies || [];
    
    this.confidenceScoring = mergedConfig.confidenceScoring ?? 
      DEFAULT_VALUATION_AGENT_CONFIG.confidenceScoring;
    
    this.explainabilityLevel = mergedConfig.explainabilityLevel || 
      DEFAULT_VALUATION_AGENT_CONFIG.explainabilityLevel || 'detailed';
    
    // Initialize approach-specific configurations
    this.salesComparisonConfig = mergedConfig.salesComparison || 
      DEFAULT_VALUATION_AGENT_CONFIG.salesComparison || {};
    
    this.costApproachConfig = mergedConfig.costApproach || 
      DEFAULT_VALUATION_AGENT_CONFIG.costApproach || {};
    
    this.incomeApproachConfig = mergedConfig.incomeApproach || 
      DEFAULT_VALUATION_AGENT_CONFIG.incomeApproach || {};
    
    this.massAppraisalConfig = mergedConfig.massAppraisal || 
      DEFAULT_VALUATION_AGENT_CONFIG.massAppraisal || {};
    
    this.automatedValuationConfig = mergedConfig.automatedValuation || 
      DEFAULT_VALUATION_AGENT_CONFIG.automatedValuation || {};
  }
  
  /**
   * Get the type of the agent
   */
  public getType(): string {
    return 'valuation';
  }
  
  /**
   * Initialize the agent
   */
  public async initialize(): Promise<void> {
    console.log(`Initializing ValuationAgent: ${this.getId()}`);
    
    // Load relevant tools
    // Ensure MCP tool is available
    const mcpTool = toolRegistry.getTool('mcp');
    if (mcpTool) {
      this.toolRegistry.add('mcp');
    }
    
    // Store initial valuation knowledge in vector memory
    await this.storeValuationKnowledge();
    
    // Log initialization
    await this.logActivity('Valuation agent initialized', LogLevel.INFO, {
      agentId: this.getId(),
      appraisalMethodologies: this.appraisalMethodologies,
      confidenceScoring: this.confidenceScoring,
      explainabilityLevel: this.explainabilityLevel,
      capabilities: this.getCapabilities()
    });
    
    this.status = AgentStatus.IDLE;
  }
  
  /**
   * Store initial valuation knowledge in vector memory
   */
  private async storeValuationKnowledge(): Promise<void> {
    try {
      // Store basic valuation methodologies information
      await vectorMemory.addEntry(
        "The Sales Comparison Approach (also called Market Approach) is a real estate valuation method that compares a property with recently sold properties of similar characteristics. Adjustments are made for differences between the subject property and comparables to determine the subject property's value.",
        {
          source: 'valuation-knowledge',
          category: 'appraisal-methodology',
          subcategory: 'sales-comparison',
          timestamp: new Date().toISOString(),
          tags: ['valuation', 'sales-comparison', 'methodology']
        }
      );
      
      await vectorMemory.addEntry(
        "The Cost Approach is a real estate valuation method that estimates the value by calculating the cost to replace or reproduce the property, minus depreciation, plus the land value. This approach is particularly useful for new properties, special-purpose properties, or when there are few comparable sales.",
        {
          source: 'valuation-knowledge',
          category: 'appraisal-methodology',
          subcategory: 'cost-approach',
          timestamp: new Date().toISOString(),
          tags: ['valuation', 'cost-approach', 'methodology']
        }
      );
      
      await vectorMemory.addEntry(
        "The Income Approach is a real estate valuation method that values a property based on the income it generates. It estimates value by dividing the net operating income (NOI) by the capitalization rate. This approach is primarily used for income-producing properties like apartment buildings, office buildings, and retail centers.",
        {
          source: 'valuation-knowledge',
          category: 'appraisal-methodology',
          subcategory: 'income-approach',
          timestamp: new Date().toISOString(),
          tags: ['valuation', 'income-approach', 'methodology']
        }
      );
      
      await vectorMemory.addEntry(
        "Mass Appraisal is a valuation process used by assessors that utilizes standardized procedures and statistical testing to value many properties simultaneously. It typically involves computerized modeling, standardized adjustments, and ratio studies to ensure assessment accuracy across an entire jurisdiction.",
        {
          source: 'valuation-knowledge',
          category: 'appraisal-methodology',
          subcategory: 'mass-appraisal',
          timestamp: new Date().toISOString(),
          tags: ['valuation', 'mass-appraisal', 'methodology']
        }
      );
      
      await vectorMemory.addEntry(
        "Automated Valuation Models (AVMs) use mathematical modeling and statistical analysis to determine property values. They incorporate data from various sources including property transactions, property characteristics, and economic data. AVMs are commonly used by lenders, online real estate platforms, and assessment jurisdictions for quick valuations.",
        {
          source: 'valuation-knowledge',
          category: 'appraisal-methodology',
          subcategory: 'automated-valuation',
          timestamp: new Date().toISOString(),
          tags: ['valuation', 'automated-valuation', 'avm', 'methodology']
        }
      );
      
      // Store knowledge about quality metrics
      await vectorMemory.addEntry(
        "The Coefficient of Dispersion (COD) is a statistical measure used in mass appraisal to evaluate assessment uniformity. It represents the average percentage deviation from the median assessment ratio. Lower COD values indicate greater uniformity in assessments. IAAO standards suggest residential properties should have a COD less than 15%, while more heterogeneous areas may accept up to 20%.",
        {
          source: 'valuation-knowledge',
          category: 'appraisal-quality',
          subcategory: 'cod',
          timestamp: new Date().toISOString(),
          tags: ['valuation', 'quality-metric', 'cod', 'uniformity']
        }
      );
      
      await vectorMemory.addEntry(
        "The Price-Related Differential (PRD) is a statistical indicator used in mass appraisal to measure assessment regressivity or progressivity. A PRD greater than 1.03 suggests assessment regressivity (higher-valued properties are under-assessed relative to lower-valued ones), while a PRD less than 0.98 indicates progressivity. IAAO standards recommend PRD values between 0.98 and 1.03.",
        {
          source: 'valuation-knowledge',
          category: 'appraisal-quality',
          subcategory: 'prd',
          timestamp: new Date().toISOString(),
          tags: ['valuation', 'quality-metric', 'prd', 'vertical-equity']
        }
      );
      
      await vectorMemory.addEntry(
        "The Price-Related Bias (PRB) measures the relationship between assessment ratios and property values using regression analysis. It's a more robust alternative to the PRD for detecting assessment bias. A PRB value of zero indicates no bias, while positive values suggest regressivity and negative values indicate progressivity. IAAO standards suggest PRB values between -0.05 and 0.05.",
        {
          source: 'valuation-knowledge',
          category: 'appraisal-quality',
          subcategory: 'prb',
          timestamp: new Date().toISOString(),
          tags: ['valuation', 'quality-metric', 'prb', 'vertical-equity']
        }
      );
      
      // Store knowledge about confidence scoring
      await vectorMemory.addEntry(
        "Confidence scoring in automated valuation models provides a statistical reliability measure for the estimated value. Typically expressed as a confidence score (e.g., 1-5 stars or 0-100%) or as a forecast standard deviation (FSD), it helps users understand the reliability of the valuation estimate. Factors affecting confidence include data quality, market volatility, property uniqueness, and comparable availability.",
        {
          source: 'valuation-knowledge',
          category: 'confidence-scoring',
          timestamp: new Date().toISOString(),
          tags: ['valuation', 'confidence', 'reliability', 'avm']
        }
      );
    } catch (error) {
      console.error('Error storing valuation knowledge:', error);
    }
  }
  
  /**
   * Assign a task to the agent
   * This implementation extends the parent with valuation-specific tasks
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
      case 'comprehensive_valuation':
        description = `Comprehensive valuation for ${taskRequest.inputs.address}`;
        break;
      
      case 'valuation_recommendation':
        description = `Valuation methodology recommendation for ${taskRequest.inputs.propertyType} in ${taskRequest.inputs.location}`;
        break;
      
      case 'valuation_explanation':
        description = `Explain valuation method: ${taskRequest.inputs.methodology}`;
        break;
      
      case 'value_reconciliation':
        description = `Reconcile values from multiple approaches for ${taskRequest.inputs.address}`;
        break;
      
      case 'answer_valuation_question':
        description = `Valuation question: ${taskRequest.inputs.question?.substring(0, 30)}...`;
        break;
      
      // Default to parent method for other tasks
      default:
        return super.assignTask(taskRequest);
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
   * Process a task assigned to the agent
   * This extends the parent class implementation with valuation-specific tasks
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
        case 'comprehensive_valuation':
          await this.handleComprehensiveValuationTask(task);
          break;
        
        case 'valuation_recommendation':
          await this.handleValuationRecommendationTask(task);
          break;
        
        case 'valuation_explanation':
          await this.handleValuationExplanationTask(task);
          break;
        
        case 'value_reconciliation':
          await this.handleValueReconciliationTask(task);
          break;
        
        case 'answer_valuation_question':
          await this.handleValuationQuestionTask(task);
          break;
        
        // For other task types, call the parent method
        default:
          await super.processTask(taskId);
          return;
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
   * Handle comprehensive valuation task
   */
  private async handleComprehensiveValuationTask(task: AgentTask): Promise<void> {
    const { 
      address, 
      propertyType, 
      squareFeet, 
      bedrooms, 
      bathrooms, 
      yearBuilt, 
      lotSize,
      additionalFeatures,
      approaches 
    } = task.inputs;
    
    // Determine which approaches to use
    const enabledApproaches = approaches || this.appraisalMethodologies;
    
    // Log the start of comprehensive valuation
    await this.logActivity(`Starting comprehensive valuation for ${address}`, LogLevel.INFO, {
      address,
      propertyType,
      squareFeet,
      bedrooms,
      bathrooms,
      yearBuilt,
      approaches: enabledApproaches
    });
    
    // Building the prompt for comprehensive valuation
    const propertyDescription = this.buildPropertyDescription(
      address, 
      propertyType, 
      squareFeet, 
      bedrooms, 
      bathrooms, 
      yearBuilt, 
      lotSize, 
      additionalFeatures
    );
    
    const approachesDescription = this.buildApproachesDescription(enabledApproaches);
    
    // Create the primary prompt
    const prompt = `
COMPREHENSIVE PROPERTY VALUATION REQUEST

SUBJECT PROPERTY DETAILS:
${propertyDescription}

VALUATION APPROACHES TO USE:
${approachesDescription}

REQUIREMENTS:
1. Provide a detailed valuation analysis using each specified approach
2. For each approach, explain the methodology, data used, adjustments made, and final value indication
3. Include confidence scores for each approach (1-5 scale where 5 is highest confidence)
4. Reconcile the different value indications into a final value conclusion
5. Explain the reconciliation process and the weight given to each approach
6. Provide a value range in addition to a point estimate
7. Note any limitations or assumptions made in the valuation process
8. Explainability level: ${this.explainabilityLevel}
`;
    
    // Create a custom memory query
    // Extract the location from the address for better context retrieval
    const addressParts = address.split(',').map((part: string) => part.trim());
    const city = addressParts.length > 1 ? addressParts[1] : '';
    const memoryQuery = `${propertyType} property valuation ${city} ${squareFeet} square feet ${bedrooms} bedrooms ${bathrooms} bathrooms ${yearBuilt}`;
    
    // Use enhanced MCP tool for comprehensive valuation with vector memory integration
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.2,
      system_message: 'You are an expert real estate appraiser with extensive knowledge of all valuation methodologies. Provide a comprehensive and professional valuation analysis with clear explanations of your process and conclusions.',
      
      // Enhanced context-aware parameters
      use_vector_memory: true,
      memory_query: memoryQuery,
      memory_options: {
        limit: 7, // More context for comprehensive valuation
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
      throw new Error(`Comprehensive valuation failed: ${result.error}`);
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
      approachesUsed: enabledApproaches,
      timestamp: new Date().toISOString(),
      metadata: {
        contextEnhanced,
        contextSources: contextSourcesUsed,
        responseTime: result.metadata?.responseTime || null,
        modelUsed: result.result.model,
        explainabilityLevel: this.explainabilityLevel,
        fromCache: result.result.fromCache || false
      }
    };
    
    // Store the valuation in vector memory for future reference
    await vectorMemory.addEntry(
      `Comprehensive Valuation for ${address} (${propertyType}, ${squareFeet} sq ft, ${bedrooms}BD/${bathrooms}BA, built ${yearBuilt}): ${result.result.response}`,
      {
        source: 'comprehensive-valuation',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'property-valuation',
        subcategory: 'comprehensive',
        tags: ['valuation', 'comprehensive', propertyType, city],
        property: {
          address,
          propertyType,
          squareFeet,
          bedrooms,
          bathrooms,
          yearBuilt
        },
        approachesUsed: enabledApproaches
      }
    );
    
    await this.logActivity(`Completed comprehensive valuation for ${address}`, LogLevel.INFO, {
      address,
      propertyType,
      squareFeet,
      bedrooms,
      bathrooms,
      yearBuilt,
      approachesUsed: enabledApproaches,
      valuationLength: result.result.response.length,
      contextSourcesUsed: contextSourcesUsed.length,
      contextEnhanced,
      responseTime: result.metadata?.responseTime
    });
  }
  
  /**
   * Handle valuation recommendation task
   */
  private async handleValuationRecommendationTask(task: AgentTask): Promise<void> {
    const { 
      propertyType, 
      location, 
      purpose,
      propertyDetails 
    } = task.inputs;
    
    // Log the start of valuation recommendation
    await this.logActivity(`Starting valuation methodology recommendation for ${propertyType} in ${location}`, LogLevel.INFO, {
      propertyType,
      location,
      purpose,
      hasDetails: !!propertyDetails
    });
    
    // Building the prompt
    const prompt = `
VALUATION METHODOLOGY RECOMMENDATION REQUEST

PROPERTY INFORMATION:
- Type: ${propertyType}
- Location: ${location}
- Valuation Purpose: ${purpose || 'Not specified'}
${propertyDetails ? `- Additional Details: ${propertyDetails}` : ''}

REQUIREMENTS:
1. Recommend the most appropriate valuation methodology or methodologies for this property type and location
2. Explain why each recommended approach is suitable for this specific situation
3. Identify any challenges or limitations that might be encountered when valuing this property
4. Suggest data sources that would be helpful for the valuation
5. If multiple approaches are recommended, explain how they should be reconciled
6. Provide practical implementation steps for each recommended approach
`;
    
    // Create a custom memory query
    const memoryQuery = `${propertyType} valuation methodology ${location} ${purpose || ''}`;
    
    // Use enhanced MCP tool for valuation recommendation
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.3,
      system_message: 'You are a senior real estate appraiser with decades of experience in selecting the most appropriate valuation methodologies for different property types and situations. Provide expert guidance on the best valuation approach(es) to use.',
      
      // Enhanced context-aware parameters
      use_vector_memory: true,
      memory_query: memoryQuery,
      memory_options: {
        limit: 5,
        threshold: 0.3,
        diversityFactor: 0.5,
        includeSources: true,
        timeWeighting: {
          enabled: true,
          halfLifeDays: 90, // Methodology recommendations don't change as quickly
          maxBoost: 1.2
        }
      },
      context_integration: 'smart'
    });
    
    if (!result.success) {
      throw new Error(`Valuation recommendation failed: ${result.error}`);
    }
    
    // Extract context sources and metadata
    const contextSourcesUsed = result.result.metadata?.contextSources || [];
    const contextEnhanced = result.result.metadata?.contextEnhanced || false;
    
    // Set the task result with enhanced metadata
    task.result = {
      recommendation: result.result.response,
      requestDetails: {
        propertyType,
        location,
        purpose,
        propertyDetails
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
    
    // Store the recommendation in vector memory for future reference
    await vectorMemory.addEntry(
      `Valuation Methodology Recommendation for ${propertyType} in ${location} (Purpose: ${purpose || 'Not specified'}): ${result.result.response}`,
      {
        source: 'valuation-recommendation',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'valuation-methodology',
        subcategory: 'recommendation',
        tags: ['valuation', 'methodology', 'recommendation', propertyType, location],
        propertyType,
        location,
        purpose
      }
    );
    
    await this.logActivity(`Completed valuation methodology recommendation for ${propertyType} in ${location}`, LogLevel.INFO, {
      propertyType,
      location,
      purpose,
      recommendationLength: result.result.response.length,
      contextSourcesUsed: contextSourcesUsed.length,
      contextEnhanced,
      responseTime: result.metadata?.responseTime
    });
  }
  
  /**
   * Handle valuation explanation task
   */
  private async handleValuationExplanationTask(task: AgentTask): Promise<void> {
    const { 
      methodology,
      audienceLevel,
      specificAspect
    } = task.inputs;
    
    // Determine the audience expertise level
    const audience = audienceLevel || 'general';
    
    // Log the start of valuation explanation
    await this.logActivity(`Starting valuation methodology explanation for ${methodology}`, LogLevel.INFO, {
      methodology,
      audienceLevel: audience,
      specificAspect
    });
    
    // Building the prompt
    const prompt = `
VALUATION METHODOLOGY EXPLANATION REQUEST

METHODOLOGY: ${methodology}
AUDIENCE EXPERTISE LEVEL: ${audience}
${specificAspect ? `SPECIFIC ASPECT TO FOCUS ON: ${specificAspect}` : ''}

REQUIREMENTS:
1. Provide a clear explanation of the ${methodology} valuation methodology
2. Explain when and why this approach is typically used
3. Outline the key steps in implementing this methodology
4. Identify the data requirements for this approach
5. Discuss strengths and limitations of this methodology
6. Provide examples of situations where this methodology is particularly appropriate
7. Tailor the explanation to a ${audience}-level audience
${specificAspect ? `8. Provide additional detail on the ${specificAspect} aspect of this methodology` : ''}
9. Include any relevant formulas or calculations typically used
`;
    
    // Create a custom memory query
    const memoryQuery = `${methodology} valuation methodology explanation ${specificAspect || ''} ${audience}`;
    
    // Use enhanced MCP tool for valuation explanation
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.2,
      system_message: 'You are an expert real estate appraiser and educator who specializes in explaining complex valuation concepts in clear, understandable terms. Provide a thorough and accessible explanation of the requested valuation methodology.',
      
      // Enhanced context-aware parameters
      use_vector_memory: true,
      memory_query: memoryQuery,
      memory_options: {
        limit: 6,
        threshold: 0.3,
        diversityFactor: 0.4,
        includeSources: true,
        timeWeighting: {
          enabled: true,
          halfLifeDays: 180, // Methodological explanations are very stable
          maxBoost: 1.1
        }
      },
      context_integration: 'smart'
    });
    
    if (!result.success) {
      throw new Error(`Valuation explanation failed: ${result.error}`);
    }
    
    // Extract context sources and metadata
    const contextSourcesUsed = result.result.metadata?.contextSources || [];
    const contextEnhanced = result.result.metadata?.contextEnhanced || false;
    
    // Set the task result with enhanced metadata
    task.result = {
      explanation: result.result.response,
      requestDetails: {
        methodology,
        audienceLevel: audience,
        specificAspect
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
    
    // Store the explanation in vector memory for future reference
    await vectorMemory.addEntry(
      `${methodology} Valuation Methodology Explanation (Audience: ${audience}): ${result.result.response}`,
      {
        source: 'valuation-explanation',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'valuation-methodology',
        subcategory: 'explanation',
        tags: ['valuation', 'methodology', 'explanation', methodology, audience],
        methodology,
        audienceLevel: audience,
        specificAspect
      }
    );
    
    await this.logActivity(`Completed valuation methodology explanation for ${methodology}`, LogLevel.INFO, {
      methodology,
      audienceLevel: audience,
      specificAspect,
      explanationLength: result.result.response.length,
      contextSourcesUsed: contextSourcesUsed.length,
      contextEnhanced,
      responseTime: result.metadata?.responseTime
    });
  }
  
  /**
   * Handle value reconciliation task
   */
  private async handleValueReconciliationTask(task: AgentTask): Promise<void> {
    const { 
      address,
      valueIndications,
      propertyType,
      valuePurpose
    } = task.inputs;
    
    // Validate inputs
    if (!valueIndications || !Array.isArray(valueIndications) || valueIndications.length < 2) {
      throw new Error('Value reconciliation requires at least two value indications');
    }
    
    // Log the start of value reconciliation
    await this.logActivity(`Starting value reconciliation for ${address}`, LogLevel.INFO, {
      address,
      propertyType,
      valuePurpose,
      valueIndicationsCount: valueIndications.length
    });
    
    // Format the value indications for the prompt
    const valueIndicationsText = valueIndications.map((indication, index) => {
      return `
VALUE INDICATION ${index + 1}:
- Approach: ${indication.approach}
- Value: ${indication.value}
- Confidence: ${indication.confidence || 'Not specified'}
- Strengths: ${indication.strengths || 'Not specified'}
- Weaknesses: ${indication.weaknesses || 'Not specified'}
- Data Quality: ${indication.dataQuality || 'Not specified'}
`;
    }).join('');
    
    // Building the prompt
    const prompt = `
VALUE RECONCILIATION REQUEST

PROPERTY INFORMATION:
- Address: ${address}
- Property Type: ${propertyType || 'Not specified'}
- Valuation Purpose: ${valuePurpose || 'Not specified'}

VALUE INDICATIONS TO RECONCILE:
${valueIndicationsText}

REQUIREMENTS:
1. Analyze the strengths and weaknesses of each value indication
2. Determine appropriate weighting for each approach based on property type, available data, and valuation purpose
3. Reconcile the different value indications into a final value conclusion
4. Explain your reconciliation process and the rationale for the weights assigned
5. Provide a final value range in addition to a point estimate
6. Identify the most reliable approach(es) for this specific situation and why
7. Discuss the confidence level in the final reconciled value
8. Note any limitations in the reconciliation process
`;
    
    // Create a custom memory query
    const addressParts = address.split(',').map((part: string) => part.trim());
    const city = addressParts.length > 1 ? addressParts[1] : '';
    const memoryQuery = `value reconciliation ${propertyType || ''} property ${city} ${valuePurpose || ''}`;
    
    // Use enhanced MCP tool for value reconciliation
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.2,
      system_message: 'You are an expert real estate appraiser specializing in value reconciliation, with deep understanding of how to weight different approaches based on property characteristics, market conditions, and data quality. Provide a thorough and well-reasoned value reconciliation.',
      
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
          halfLifeDays: 60,
          maxBoost: 1.3
        }
      },
      context_integration: 'smart'
    });
    
    if (!result.success) {
      throw new Error(`Value reconciliation failed: ${result.error}`);
    }
    
    // Extract context sources and metadata
    const contextSourcesUsed = result.result.metadata?.contextSources || [];
    const contextEnhanced = result.result.metadata?.contextEnhanced || false;
    
    // Set the task result with enhanced metadata
    task.result = {
      reconciliation: result.result.response,
      property: {
        address,
        propertyType,
        valuePurpose
      },
      valueIndications,
      timestamp: new Date().toISOString(),
      metadata: {
        contextEnhanced,
        contextSources: contextSourcesUsed,
        responseTime: result.metadata?.responseTime || null,
        modelUsed: result.result.model,
        fromCache: result.result.fromCache || false
      }
    };
    
    // Store the reconciliation in vector memory for future reference
    await vectorMemory.addEntry(
      `Value Reconciliation for ${address} (${propertyType || 'Not specified'}): ${result.result.response}`,
      {
        source: 'value-reconciliation',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'value-reconciliation',
        tags: ['valuation', 'reconciliation', propertyType || '', city],
        property: {
          address,
          propertyType,
          valuePurpose
        },
        approaches: valueIndications.map(v => v.approach)
      }
    );
    
    await this.logActivity(`Completed value reconciliation for ${address}`, LogLevel.INFO, {
      address,
      propertyType,
      valuePurpose,
      valueIndicationsCount: valueIndications.length,
      reconciliationLength: result.result.response.length,
      contextSourcesUsed: contextSourcesUsed.length,
      contextEnhanced,
      responseTime: result.metadata?.responseTime
    });
  }
  
  /**
   * Handle valuation question task
   */
  private async handleValuationQuestionTask(task: AgentTask): Promise<void> {
    const { 
      question,
      propertyType,
      location,
      context
    } = task.inputs;
    
    // Log the start of answering valuation question
    await this.logActivity(`Starting to answer valuation question: ${question.substring(0, 50)}...`, LogLevel.INFO, {
      questionLength: question.length,
      propertyType,
      location,
      hasContext: !!context
    });
    
    // Building the prompt
    const prompt = `
VALUATION QUESTION:
${question}

${propertyType ? `PROPERTY TYPE: ${propertyType}` : ''}
${location ? `LOCATION: ${location}` : ''}
${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

REQUIREMENTS:
1. Provide a clear, thorough answer to the valuation question
2. Base your response on established appraisal principles and methodologies
3. When appropriate, reference specific appraisal approaches (Sales Comparison, Cost, Income, etc.)
4. Consider the specific property type and location in your response
5. Include practical examples or applications when relevant
6. Provide a comprehensive explanation at the ${this.explainabilityLevel} level
7. Note any limitations or assumptions in your response
8. When applicable, suggest additional considerations the questioner should be aware of
`;
    
    // Create a custom memory query
    const memoryQuery = `${question} ${propertyType || ''} ${location || ''}`;
    
    // Use enhanced MCP tool for answering valuation questions
    const result = await this.useTool('mcp', {
      model: 'gpt-4',
      prompt,
      temperature: 0.3,
      system_message: 'You are a real estate valuation expert with extensive knowledge of appraisal methodologies and market dynamics. Provide clear, accurate, and thorough answers to valuation questions.',
      
      // Enhanced context-aware parameters
      use_vector_memory: true,
      memory_query: memoryQuery,
      memory_options: {
        limit: 6,
        threshold: 0.25, // Lower threshold to get more potential context for questions
        diversityFactor: 0.5,
        includeSources: true,
        timeWeighting: {
          enabled: true,
          halfLifeDays: 90,
          maxBoost: 1.2
        }
      },
      context_integration: 'smart'
    });
    
    if (!result.success) {
      throw new Error(`Answering valuation question failed: ${result.error}`);
    }
    
    // Extract context sources and metadata
    const contextSourcesUsed = result.result.metadata?.contextSources || [];
    const contextEnhanced = result.result.metadata?.contextEnhanced || false;
    
    // Set the task result with enhanced metadata
    task.result = {
      answer: result.result.response,
      question,
      requestContext: {
        propertyType,
        location,
        additionalContext: context
      },
      timestamp: new Date().toISOString(),
      metadata: {
        contextEnhanced,
        contextSources: contextSourcesUsed,
        responseTime: result.metadata?.responseTime || null,
        modelUsed: result.result.model,
        explainabilityLevel: this.explainabilityLevel,
        fromCache: result.result.fromCache || false
      }
    };
    
    // Store the question and answer in vector memory for future reference
    await vectorMemory.addEntry(
      `Valuation Question: ${question}\nAnswer: ${result.result.response}`,
      {
        source: 'valuation-qa',
        agentId: this.getId(),
        timestamp: new Date().toISOString(),
        category: 'valuation-question',
        tags: [
          'valuation', 
          'question', 
          'answer', 
          propertyType || '', 
          location || ''
        ],
        question,
        propertyType,
        location
      }
    );
    
    await this.logActivity(`Completed answering valuation question`, LogLevel.INFO, {
      questionLength: question.length,
      answerLength: result.result.response.length,
      propertyType,
      location,
      contextSourcesUsed: contextSourcesUsed.length,
      contextEnhanced,
      responseTime: result.metadata?.responseTime
    });
  }
  
  /**
   * Build a formatted property description string
   */
  private buildPropertyDescription(
    address: string, 
    propertyType: string, 
    squareFeet: number, 
    bedrooms: number, 
    bathrooms: number, 
    yearBuilt: number,
    lotSize?: number,
    additionalFeatures?: string
  ): string {
    return `
- Address: ${address}
- Property Type: ${propertyType}
- Size: ${squareFeet} square feet
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Year Built: ${yearBuilt}
${lotSize ? `- Lot Size: ${lotSize} ${typeof lotSize === 'number' && lotSize > 20000 ? 'square feet' : 'acres'}` : ''}
${additionalFeatures ? `- Additional Features: ${additionalFeatures}` : ''}
`;
  }
  
  /**
   * Build a formatted description of valuation approaches
   */
  private buildApproachesDescription(approaches: string[]): string {
    return approaches.map(approach => {
      switch(approach.toLowerCase()) {
        case 'sales_comparison':
        case 'sales comparison':
          return `1. Sales Comparison Approach
   - Using comparables within ${this.salesComparisonConfig.maxDistanceMiles || 0.5} miles
   - Maximum property age difference: ${this.salesComparisonConfig.maxAgeDays || 180} days
   - Adjustment factors to consider: ${(this.salesComparisonConfig.adjustmentFactors || []).join(', ')}`;
          
        case 'cost_approach':
        case 'cost approach':
          return `2. Cost Approach
   - Using ${this.costApproachConfig.costManualSource || 'Marshall & Swift'} cost data
   - Depreciation model: ${this.costApproachConfig.depreciationModel || 'modified age-life'}
   - ${this.costApproachConfig.includeExternalObsolescence ? 'Including' : 'Excluding'} external obsolescence`;
          
        case 'income_approach':
        case 'income approach':
          return `3. Income Approach
   - Cap rate source: ${this.incomeApproachConfig.capitalizationRateSource || 'market extraction'}
   - Vacancy assumption: ${this.incomeApproachConfig.vacancyAssumption || 5}%
   - Expense ratio: ${this.incomeApproachConfig.expenseRatioDefault || 35}%`;
          
        case 'mass_appraisal':
        case 'mass appraisal':
          return `4. Mass Appraisal Approach
   - Model type: ${this.massAppraisalConfig.modelType || 'gradient boosting'}
   - Quality metrics: ${(this.massAppraisalConfig.qualityMetrics || []).join(', ')}
   - Stratification factors: ${(this.massAppraisalConfig.stratification || []).join(', ')}`;
          
        case 'automated_valuation':
        case 'automated valuation':
          return `5. Automated Valuation Model
   - Confidence interval: ${this.automatedValuationConfig.confidenceInterval || 95}%
   - Update frequency: ${this.automatedValuationConfig.updateFrequency || 'weekly'}
   - Data source priority: ${(this.automatedValuationConfig.dataSourcePriority || []).join(', ')}`;
          
        default:
          return `- ${approach} Approach (standard methodology)`;
      }
    }).join('\n\n');
  }
  
  /**
   * Log activity and errors
   */
  private async logActivity(message: string, level: LogLevel, details?: any): Promise<void> {
    try {
      await storage.createLog({
        message: `[ValuationAgent] ${message}`,
        level,
        category: LogCategory.AI,
        details: details ? JSON.stringify(details) : null,
        source: 'valuation-agent',
        userId: null,
        projectId: null,
        sessionId: null,
        duration: null,
        statusCode: null,
        endpoint: null,
        tags: ['valuation', 'agent', level.toLowerCase()]
      });
    } catch (error) {
      console.error('Error logging valuation agent activity:', error);
    }
  }
}