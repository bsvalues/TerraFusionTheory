import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysis.$inferSelect;

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
