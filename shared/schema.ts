import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const arenaSessions = pgTable("arena_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mode: text("mode").notNull(),
  prompt: text("prompt").notNull(),
  results: jsonb("results").notNull(),
  verdict: text("verdict"),
  chairman: text("chairman"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertArenaSessionSchema = createInsertSchema(arenaSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertArenaSession = z.infer<typeof insertArenaSessionSchema>;
export type ArenaSession = typeof arenaSessions.$inferSelect;

export const shares = pgTable("shares", {
  id: varchar("id", { length: 8 }).primaryKey(),
  code: text("code").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  views: integer("views").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertShareSchema = createInsertSchema(shares).omit({
  views: true,
  createdAt: true,
});

export type InsertShare = z.infer<typeof insertShareSchema>;
export type Share = typeof shares.$inferSelect;
