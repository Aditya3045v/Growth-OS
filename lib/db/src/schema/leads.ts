import { pgTable, text, serial, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadsTable = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  businessName: text("business_name"),
  phone: text("phone"),
  email: text("email"),
  city: text("city"),
  industry: text("industry"),
  source: text("source"),
  status: text("status").notNull().default("new"),
  nextFollowUpDate: text("next_follow_up_date"),
  lastContactDate: text("last_contact_date"),
  notes: text("notes"),
  dealValue: real("deal_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leadsTable.$inferSelect;
