export type NavItem = {
  label: string;
  icon: string;
  href: string;
  active?: boolean;
};

export type ProjectInfo = {
  id: number;
  name: string;
  description: string;
  type: string;
  targetPlatform: string;
  technologyStack: string[];
  status: string;
  overview: string;
  progress: number;
};

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type Conversation = {
  id: number;
  projectId: number;
  messages: Message[];
};

export type RequirementStatus = 'success' | 'warning' | 'error';

export type Requirement = {
  name: string;
  status: RequirementStatus;
};

export type TechStackItem = {
  name: string;
  description: string;
};

export type TechStack = {
  frontend: TechStackItem;
  backend: TechStackItem;
  database: TechStackItem;
  hosting: TechStackItem;
};

export type MissingInfo = {
  items: string[];
};

export type NextStep = {
  order: number;
  description: string;
};

export type Analysis = {
  id: number;
  projectId: number;
  identifiedRequirements: Requirement[];
  suggestedTechStack: TechStack;
  missingInformation: MissingInfo;
  nextSteps: NextStep[];
};

export type ArchitectureComponent = {
  name: string;
  type: 'ui' | 'api' | 'business' | 'data' | 'external';
};

export type ArchitectureLayer = {
  name: string;
  components: ArchitectureComponent[];
};

export type Architecture = {
  layers: ArchitectureLayer[];
};

export enum BadgeType {
  EFFICIENCY = "efficiency",
  ACCURACY = "accuracy",
  SPEED = "speed",
  CONSISTENCY = "consistency",
  INNOVATION = "innovation",
  COLLABORATION = "collaboration",
  ACHIEVEMENT = "achievement"
}

export enum BadgeLevel {
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum"
}

export type UserBadge = {
  id: number;
  userId: number;
  badgeId: number;
  projectId: number;
  progress: number;
  awardedAt: string;
  metadata: Record<string, any>;
};

export type Badge = {
  id: number;
  name: string;
  description: string;
  type: BadgeType;
  level: BadgeLevel;
  criteria: Record<string, any>;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type BadgeDisplay = Badge & {
  variant?: string;
  tooltip?: string;
  isNew?: boolean;
  unlockDate?: string;
};

export type BadgeWithProgress = BadgeDisplay & {
  progress: number;
  isUnlocked: boolean;
  metadata: Record<string, any>;
};
