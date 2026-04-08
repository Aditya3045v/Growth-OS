import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const videosTable = pgTable("video_library", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  folder: text("folder").notNull().default("General"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Video = typeof videosTable.$inferSelect;
export type InsertVideo = typeof videosTable.$inferInsert;
