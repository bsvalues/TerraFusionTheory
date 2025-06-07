import { BadgeType, BadgeLevel } from '../../../shared/schema';

export interface ProjectInfo {
  id: number;
  name: string;
  description?: string;
  type?: string;
  targetPlatform?: string;
  technologyStack?: string[] | string;
  status: string;
  overview?: string;
  progress: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface BadgeWithProgress {
  id: number;
  name: string;
  description: string;
  type: BadgeType;
  level: BadgeLevel;
  criteria: Record<string, any>;
  icon?: string;
  color?: string;
  progress: number;
  earned: boolean;
  earnedAt?: string;
  metadata?: Record<string, any>;
  variant?: string;
  tooltip?: string;
  unlockDate?: string;
}

export interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  projectId?: number;
  awardedAt: Date;
  progress: number;
  metadata: Record<string, any>;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  type: BadgeType;
  level: BadgeLevel;
  criteria: Record<string, any>;
  icon?: string;
  color?: string;
  createdAt?: Date;
  updatedAt?: Date;
}