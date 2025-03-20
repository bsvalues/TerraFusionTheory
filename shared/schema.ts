import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// LogLevel enum for consistent log level typing
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical"
}

// LogCategory enum for categorizing logs
export enum LogCategory {
  SYSTEM = "system",
  USER = "user",
  API = "api",
  DATABASE = "database",
  SECURITY = "security",
  PERFORMANCE = "performance",
  AI = "ai"
}

// BadgeType enum for categorizing productivity badges
export enum BadgeType {
  EFFICIENCY = "efficiency",
  ACCURACY = "accuracy",
  SPEED = "speed",
  CONSISTENCY = "consistency",
  INNOVATION = "innovation",
  COLLABORATION = "collaboration",
  ACHIEVEMENT = "achievement"
}

// Badge level enum for badge hierarchy
export enum BadgeLevel {
  BRONZE = "bronze",
  SILVER = "silver",
  GOLD = "gold",
  PLATINUM = "platinum"
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type"),
  targetPlatform: text("target_platform"),
  technologyStack: text("technology_stack"),
  status: text("status").default("requirements_gathering"),
  overview: text("overview"),
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const analysis = pgTable("analysis", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  identifiedRequirements: jsonb("identified_requirements").default([]),
  suggestedTechStack: jsonb("suggested_tech_stack").default({}),
  missingInformation: jsonb("missing_information").default([]),
  nextSteps: jsonb("next_steps").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  level: text("level").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  details: jsonb("details").default({}),
  source: text("source"),
  userId: integer("user_id"),
  projectId: integer("project_id"),
  sessionId: text("session_id"),
  duration: integer("duration"), // for performance logs
  statusCode: integer("status_code"), // for API logs
  endpoint: text("endpoint"), // for API logs
  tags: text("tags").array(),
});

export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // Maps to BadgeType enum
  level: text("level").notNull(), // Maps to BadgeLevel enum
  criteria: jsonb("criteria").notNull().default({}), // JSON criteria for badge award
  icon: text("icon"), // Icon identifier
  color: text("color"), // Badge color
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  projectId: integer("project_id"), // Optional project association
  awardedAt: timestamp("awarded_at").defaultNow().notNull(),
  progress: integer("progress").default(0), // Progress toward completion (0-100)
  metadata: jsonb("metadata").default({}), // Additional context for the badge
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  type: true,
  targetPlatform: true,
  technologyStack: true,
  status: true,
  overview: true,
  progress: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  projectId: true,
  messages: true,
});

export const insertAnalysisSchema = createInsertSchema(analysis).pick({
  projectId: true,
  identifiedRequirements: true,
  suggestedTechStack: true,
  missingInformation: true,
  nextSteps: true,
});

export const insertLogSchema = createInsertSchema(logs).pick({
  timestamp: true,
  level: true,
  category: true,
  message: true,
  details: true,
  source: true,
  userId: true,
  projectId: true,
  sessionId: true,
  duration: true,
  statusCode: true,
  endpoint: true,
  tags: true,
});

export const insertBadgeSchema = createInsertSchema(badges).pick({
  name: true,
  description: true,
  type: true,
  level: true,
  criteria: true,
  icon: true,
  color: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).pick({
  userId: true,
  badgeId: true,
  projectId: true,
  progress: true,
  metadata: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysis.$inferSelect;

export type InsertLog = z.infer<typeof insertLogSchema>;
export type Log = typeof logs.$inferSelect;

export type InsertBadge = z.infer<typeof insertBadgeSchema>;
export type Badge = typeof badges.$inferSelect;

export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;

// Extended LogEntry type with additional frontend context
export type LogEntry = Log & {
  formatted?: string; // Optional preformatted message for display
  color?: string; // Optional color code for UI display
  expanded?: boolean; // UI state for expandable log entries
};

export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type FeedbackItem = {
  id: number;
  message: string;
  timestamp: string;
  resolved: boolean;
};

// Extended badge type with additional display information
export type BadgeDisplay = Badge & {
  variant?: string; // For styling with the Badge component
  tooltip?: string; // Optional tooltip with additional context
  isNew?: boolean; // To indicate newly awarded badges
  unlockDate?: string; // Formatted date when the badge was unlocked
};

// Represents a badge with progress information for a specific user
export type BadgeWithProgress = BadgeDisplay & {
  progress: number; // Progress percentage (0-100)
  isUnlocked: boolean; // Whether the badge is unlocked
  metadata: Record<string, any>; // Additional context
};
