import { type User, type InsertUser, type ArenaSession, type InsertArenaSession, users, arenaSessions } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createArenaSession(session: InsertArenaSession): Promise<ArenaSession>;
  getArenaSessions(limit?: number): Promise<ArenaSession[]>;
  getArenaSession(id: string): Promise<ArenaSession | undefined>;
  deleteArenaSession(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async createArenaSession(session: InsertArenaSession): Promise<ArenaSession> {
    const result = await db.insert(arenaSessions).values(session).returning();
    return result[0];
  }

  async getArenaSessions(limit: number = 50): Promise<ArenaSession[]> {
    return db.select().from(arenaSessions).orderBy(desc(arenaSessions.createdAt)).limit(limit);
  }

  async getArenaSession(id: string): Promise<ArenaSession | undefined> {
    const result = await db.select().from(arenaSessions).where(eq(arenaSessions.id, id));
    return result[0];
  }

  async deleteArenaSession(id: string): Promise<boolean> {
    const result = await db.delete(arenaSessions).where(eq(arenaSessions.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
