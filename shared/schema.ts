import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
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
