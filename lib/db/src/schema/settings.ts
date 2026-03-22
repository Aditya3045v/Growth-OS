import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  userName: text("user_name").notNull().default("User"),
  darkMode: boolean("dark_mode").notNull().default(true),
  morningReminderEnabled: boolean("morning_reminder_enabled").notNull().default(true),
  afternoonReminderEnabled: boolean("afternoon_reminder_enabled").notNull().default(true),
  eveningReminderEnabled: boolean("evening_reminder_enabled").notNull().default(true),
  morningReminderTime: text("morning_reminder_time").notNull().default("08:00"),
  afternoonReminderTime: text("afternoon_reminder_time").notNull().default("14:00"),
  eveningReminderTime: text("evening_reminder_time").notNull().default("20:00"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, createdAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
