import { pgTable, text, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").unique().notNull(),
  subscription: jsonb("subscription").notNull(),
  morningEnabled: boolean("morning_enabled").notNull().default(true),
  morningTime: text("morning_time").notNull().default("07:00"),
  morningMessage: text("morning_message").notNull().default("Time for your daily check-in!"),
  eveningEnabled: boolean("evening_enabled").notNull().default(true),
  eveningTime: text("evening_time").notNull().default("22:00"),
  eveningMessage: text("evening_message").notNull().default("Review your day."),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptionsTable).omit({ id: true, createdAt: true });
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
export type PushSubscription = typeof pushSubscriptionsTable.$inferSelect;
