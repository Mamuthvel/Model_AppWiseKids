import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("parent"), // "parent" or "child"
  parentId: integer("parent_id"), // For child accounts
  createdAt: timestamp("created_at").defaultNow(),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  deviceInfo: text("device_info"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apps = pgTable("apps", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  ageRating: integer("age_rating").notNull(),
  safetyBadge: text("safety_badge").notNull(), // "safe", "moderate", "high-risk"
  description: text("description"),
  expertReview: text("expert_review"),
  iconUrl: text("icon_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const childApps = pgTable("child_apps", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  appId: integer("app_id").notNull(),
  isBlocked: boolean("is_blocked").default(false),
  screenTimeToday: integer("screen_time_today").default(0), // in minutes
  installedAt: timestamp("installed_at").defaultNow(),
});

export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  childId: integer("child_id").notNull(),
  type: text("type").notNull(), // "app_install", "screen_time", "high_risk", "restriction"
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull(), // "info", "warning", "danger"
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"), // Additional data like app info, time limits, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").notNull(),
  childId: integer("child_id").notNull(),
  dailyScreenTimeLimit: integer("daily_screen_time_limit").default(180), // in minutes
  bedtimeStart: text("bedtime_start").default("20:00"),
  bedtimeEnd: text("bedtime_end").default("07:00"),
  weekendExtendedHours: boolean("weekend_extended_hours").default(true),
  autoBlockHighRisk: boolean("auto_block_high_risk").default(true),
  reviewModerateApps: boolean("review_moderate_apps").default(true),
  ageOverride: integer("age_override"), // null means use actual age
  emailNotifications: boolean("email_notifications").default(true),
  notificationFrequency: text("notification_frequency").default("real-time"), // "real-time", "daily", "weekly"
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const screenTimeData = pgTable("screen_time_data", {
  id: serial("id").primaryKey(),
  childId: integer("child_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalMinutes: integer("total_minutes").notNull(),
  appBreakdown: jsonb("app_breakdown"), // { appId: minutes, ... }
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
});

export const insertAppSchema = createInsertSchema(apps).omit({
  id: true,
  createdAt: true,
});

export const insertChildAppSchema = createInsertSchema(childApps).omit({
  id: true,
  installedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export const insertScreenTimeDataSchema = createInsertSchema(screenTimeData).omit({
  id: true,
  createdAt: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type App = typeof apps.$inferSelect;
export type InsertApp = z.infer<typeof insertAppSchema>;
export type ChildApp = typeof childApps.$inferSelect;
export type InsertChildApp = z.infer<typeof insertChildAppSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type ScreenTimeData = typeof screenTimeData.$inferSelect;
export type InsertScreenTimeData = z.infer<typeof insertScreenTimeDataSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
