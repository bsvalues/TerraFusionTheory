/**
 * Agent Interface Definitions
 * 
 * This file defines the core interfaces, types, and enums used throughout
 * the agent system of IntelligentEstate.
 */

/**
 * Types of agents supported by the system
 */
export enum AgentType {
  REAL_ESTATE = 'real-estate',
  DEVELOPER = 'developer', 
  ANALYTICS = 'analytics',
  ASSISTANT = 'assistant',
  EXPERT = 'expert',
  COORDINATOR = 'coordinator',
  CUSTOM = 'custom'
}

/**
 * Possible states an agent can be in
 */
export enum AgentState {
  INITIALIZING = 'initializing',
  READY = 'ready',
  BUSY = 'busy',
  PAUSED = 'paused',
  ERROR = 'error',
  TERMINATED = 'terminated',
  IDLE = 'idle'
}

/**
 * Agent capabilities
 */
export enum AgentCapability {
  // General capabilities
  TEXT_GENERATION = 'text-generation',
  CONVERSATION = 'conversation',
  TOOL_USE = 'tool-use',
  
  // Developer specific capabilities
  CODE_GENERATION = 'code-generation',
  CODE_REVIEW = 'code-review',
  DEBUGGING = 'debugging',
  DOCUMENTATION = 'documentation',
  
  // Real estate specific capabilities
  PROPERTY_ANALYSIS = 'property-analysis',
  MARKET_ANALYSIS = 'market-analysis',
  GEOSPATIAL_ANALYSIS = 'geospatial-analysis',
  
  // Analytic capabilities
  DATA_ANALYSIS = 'data-analysis',
  VISUALIZATION = 'visualization',
  PREDICTION = 'prediction',
  
  // Meta capabilities
  AGENT_COORDINATION = 'agent-coordination',
  LEARNING = 'learning',
  PLANNING = 'planning'
}

/**
 * The result of an agent execution
 */
export interface ExecutionResult {
  success: boolean;
  output: any;
  error?: Error;
  metadata?: Record<string, any>;
}

/**
 * Represents a message exchanged in the agent's history
 */
export interface AgentMessage {
  id: string;
  timestamp: Date;
  role: 'user' | 'agent' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Represents an agent's task
 */
export interface AgentTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  result?: ExecutionResult;
}

/**
 * The execution context of an agent
 */
export interface AgentContext {
  history: AgentMessage[];
  memory: Map<string, any>;
  currentTask: AgentTask | null;
  environment: Record<string, any>;
  metadata: Record<string, any>;
}

/**
 * Configuration options for an agent
 */
export interface AgentConfig {
  maxHistoryLength?: number;
  maxMemoryItems?: number;
  timeoutMs?: number;
  autoSave?: boolean;
  persistMemory?: boolean;
  model?: string;
  apiKey?: string;
  tools?: string[];
  additionalOptions?: Record<string, any>;
}

/**
 * Interface for agent factories
 */
export interface AgentFactory {
  createAgent(
    type: AgentType,
    name: string,
    description: string,
    capabilities?: AgentCapability[],
    config?: AgentConfig
  ): Promise<Agent>;
}

/**
 * Core agent interface
 */
export interface Agent {
  getId(): string;
  getType(): AgentType;
  getName(): string;
  getDescription(): string;
  hasCapability(capability: AgentCapability): boolean;
  getCapabilities(): AgentCapability[];
  getState(): AgentState;
  getContext(): AgentContext;
  updateContext(contextUpdate: Partial<AgentContext>): void;
  
  initialize(): Promise<boolean>;
  shutdown(): Promise<boolean>;
  pause(): Promise<boolean>;
  resume(): Promise<boolean>;
  
  execute(
    task: string,
    inputs: Record<string, any>,
    options?: Record<string, any>
  ): Promise<ExecutionResult>;
  
  isActiveAgent(): boolean;
  getDiagnostics(): Record<string, any>;
}

/**
 * Interface for a tool that can be used by an agent
 */
export interface AgentTool {
  id: string;
  name: string;
  description: string;
  requiredCapabilities: AgentCapability[];
  
  execute(
    inputs: Record<string, any>,
    context: AgentContext,
    agent: Agent
  ): Promise<any>;
}

/**
 * Interface for keeping track of agent status and history
 */
export interface AgentRegistry {
  registerAgent(agent: Agent): void;
  unregisterAgent(agentId: string): boolean;
  getAgent(agentId: string): Agent | undefined;
  getAgentsByType(type: AgentType): Agent[];
  getAllAgents(): Agent[];
  getActiveAgents(): Agent[];
}

/**
 * Interface for agent plugin system
 */
export interface AgentPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  
  install(agent: Agent): Promise<boolean>;
  uninstall(agent: Agent): Promise<boolean>;
}

/**
 * Interface for agent memory management
 */
export interface AgentMemory {
  store(key: string, value: any): Promise<void>;
  retrieve(key: string): Promise<any>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getAll(): Promise<Map<string, any>>;
  size(): Promise<number>;
}

/**
 * Interface for agent coordination
 */
export interface AgentCoordinator {
  addAgent(agent: Agent): void;
  removeAgent(agentId: string): boolean;
  assignTask(agentId: string, task: string, inputs: Record<string, any>): Promise<ExecutionResult>;
  broadcastTask(task: string, inputs: Record<string, any>): Promise<Record<string, ExecutionResult>>;
  getAgentStatus(agentId: string): AgentState;
  getAllAgentStatuses(): Record<string, AgentState>;
}