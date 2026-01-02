import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

let db_instance: any;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set. Falling back to in-memory mode (mock DB).");

  // Create a mock DB interface for in-memory operation
  const mockStorage = new Map();

  db_instance = {
    isMock: true,
    insert: (table: any) => ({
      values: (val: any) => {
        const id = val.id;
        mockStorage.set(id, { ...val, views: 0 });
        return Promise.resolve();
      }
    }),
    select: () => ({
      from: (table: any) => ({
        where: (condition: any) => {
          // This is a very simplified mock for shares
          const id = condition.right.value;
          const share = mockStorage.get(id);
          return Promise.resolve(share ? [share] : []);
        }
      })
    }),
    update: (table: any) => ({
      set: (data: any) => ({
        where: (condition: any) => {
          const id = condition.right.value;
          const share = mockStorage.get(id);
          if (share) {
            if (data.views) share.views++;
            mockStorage.set(id, share);
          }
          return Promise.resolve();
        }
      })
    })
  };
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db_instance = drizzle(pool, { schema });
}

export const db = db_instance;
