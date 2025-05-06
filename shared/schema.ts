import { pgTable, text, serial, integer, boolean, jsonb, timestamp, numeric, date, varchar, real, unique, index, doublePrecision } from "drizzle-orm/pg-core";
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

// Property type enum for categorizing properties
export enum PropertyType {
  RESIDENTIAL = "residential",
  COMMERCIAL = "commercial",
  INDUSTRIAL = "industrial",
  AGRICULTURAL = "agricultural",
  VACANT_LAND = "vacant_land",
  MIXED_USE = "mixed_use",
  SPECIAL_PURPOSE = "special_purpose"
}

// Property status enum
export enum PropertyStatus {
  ACTIVE = "active",
  PENDING = "pending",
  SOLD = "sold",
  OFF_MARKET = "off_market",
  FORECLOSURE = "foreclosure",
  SHORT_SALE = "short_sale"
}

// Transaction type enum
export enum TransactionType {
  SALE = "sale",
  REFINANCE = "refinance",
  FORECLOSURE = "foreclosure",
  AUCTION = "auction",
  SHORT_SALE = "short_sale",
  OTHER = "other"
}

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
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

// Property table for storing real estate property data
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  parcelId: text("parcel_id").notNull().unique(), // Unique parcel ID from county/tax records
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  county: text("county").notNull(),
  propertyType: text("property_type").notNull(), // Residential, Commercial, etc.
  landUse: text("land_use"), // More specific use: Single Family, Multi-Family, Retail, etc.
  yearBuilt: integer("year_built"),
  buildingArea: numeric("building_area"), // In square feet
  lotSize: numeric("lot_size"), // In square feet or acres
  bedrooms: integer("bedrooms"),
  bathrooms: numeric("bathrooms"), // Can be decimal for half baths
  stories: integer("stories"),
  condition: text("condition"), // Excellent, Good, Average, Fair, Poor
  quality: text("quality"), // Luxury, High, Average, Low
  heatingType: text("heating_type"),
  coolingType: text("cooling_type"),
  garageType: text("garage_type"),
  garageCapacity: integer("garage_capacity"),
  basement: boolean("basement").default(false),
  roofType: text("roof_type"),
  externalWallType: text("external_wall_type"),
  foundationType: text("foundation_type"),
  porchType: text("porch_type"),
  deckType: text("deck_type"),
  poolType: text("pool_type"),
  assessedValue: numeric("assessed_value"), // Current assessed value
  marketValue: numeric("market_value"), // Estimated market value
  taxableValue: numeric("taxable_value"), // Value used for taxation
  lastSalePrice: numeric("last_sale_price"),
  lastSaleDate: date("last_sale_date"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  zoning: text("zoning"), // Zoning code
  floodZone: text("flood_zone"),
  parcelGeometry: jsonb("parcel_geometry"), // GeoJSON geometry of parcel
  taxDistrict: text("tax_district"),
  school: text("school"),
  neighborhood: text("neighborhood"), // Neighborhood or subdivision name
  neighborhoodCode: text("neighborhood_code"), // Code for classification
  metadata: jsonb("metadata").default({}), // Additional property data
  images: text("images").array(), // Array of image URLs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sales table for storing property transactions
export const propertySales = pgTable("property_sales", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(), // Reference to properties table
  parcelId: text("parcel_id").notNull(), // Redundant for faster queries
  salePrice: numeric("sale_price").notNull(),
  saleDate: date("sale_date").notNull(),
  transactionType: text("transaction_type").notNull(), // Regular, Foreclosure, etc.
  deedType: text("deed_type"), // Warranty, Quitclaim, etc.
  buyerName: text("buyer_name"),
  sellerName: text("seller_name"),
  verified: boolean("verified").default(false), // Whether sale has been verified as valid
  validForAnalysis: boolean("valid_for_analysis").default(true), // Used in ratio studies
  financingType: text("financing_type"), // Cash, Conventional, FHA, VA, etc.
  assessedValueAtSale: numeric("assessed_value_at_sale"), // Assessment at time of sale
  salePricePerSqFt: numeric("sale_price_per_sqft"), // Price per square foot
  assessmentRatio: numeric("assessment_ratio"), // Assessed value / sale price
  metadata: jsonb("metadata").default({}), // Additional sale data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Indexes will be added separately after database creation

// Neighborhoods table for storing neighborhood boundaries and characteristics
export const neighborhoods = pgTable("neighborhoods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  city: text("city").notNull(),
  county: text("county").notNull(),
  state: text("state").notNull(),
  description: text("description"),
  characteristics: jsonb("characteristics").default({}), // Housing stock, demographics, etc.
  boundaries: jsonb("boundaries"), // GeoJSON polygon of neighborhood boundaries
  medianHomeValue: numeric("median_home_value"),
  avgHomeValue: numeric("avg_home_value"),
  avgYearBuilt: numeric("avg_year_built"),
  totalProperties: integer("total_properties"),
  totalSales: integer("total_sales"),
  avgSalePrice: numeric("avg_sale_price"),
  medianSalePrice: numeric("median_sale_price"),
  avgDaysOnMarket: numeric("avg_days_on_market"),
  schoolRating: numeric("school_rating"),
  crimeRate: numeric("crime_rate"),
  walkScore: numeric("walk_score"),
  transitScore: numeric("transit_score"),
  metadata: jsonb("metadata").default({}), // Additional neighborhood data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
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

// Schema for inserting property data
export const insertPropertySchema = createInsertSchema(properties).pick({
  parcelId: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  county: true,
  propertyType: true,
  landUse: true,
  yearBuilt: true,
  buildingArea: true,
  lotSize: true,
  bedrooms: true,
  bathrooms: true,
  stories: true,
  condition: true,
  quality: true,
  heatingType: true,
  coolingType: true,
  garageType: true,
  garageCapacity: true,
  basement: true,
  roofType: true,
  externalWallType: true,
  foundationType: true,
  porchType: true,
  deckType: true,
  poolType: true,
  assessedValue: true,
  marketValue: true,
  taxableValue: true,
  lastSalePrice: true,
  lastSaleDate: true,
  latitude: true,
  longitude: true,
  zoning: true,
  floodZone: true,
  parcelGeometry: true,
  taxDistrict: true,
  school: true,
  neighborhood: true,
  neighborhoodCode: true,
  metadata: true,
  images: true,
});

// Schema for inserting property sales data
export const insertPropertySaleSchema = createInsertSchema(propertySales).pick({
  propertyId: true,
  parcelId: true,
  salePrice: true,
  saleDate: true,
  transactionType: true,
  deedType: true,
  buyerName: true,
  sellerName: true,
  verified: true,
  validForAnalysis: true,
  financingType: true,
  assessedValueAtSale: true,
  salePricePerSqFt: true,
  assessmentRatio: true,
  metadata: true,
});

// Schema for inserting neighborhood data
export const insertNeighborhoodSchema = createInsertSchema(neighborhoods).pick({
  name: true,
  code: true,
  city: true,
  county: true,
  state: true,
  description: true,
  characteristics: true,
  boundaries: true,
  medianHomeValue: true,
  avgHomeValue: true,
  avgYearBuilt: true,
  totalProperties: true,
  totalSales: true,
  avgSalePrice: true,
  medianSalePrice: true,
  avgDaysOnMarket: true,
  schoolRating: true,
  crimeRate: true,
  walkScore: true,
  transitScore: true,
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
