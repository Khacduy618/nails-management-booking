import { drizzle as neonDrizzle } from "drizzle-orm/neon-serverless";
import {
  Pool as NeonPool,
  neonConfig,
} from "@neondatabase/serverless";
import { drizzle as nodeDrizzle } from "drizzle-orm/node-postgres";
import { Pool as NodePool } from "pg";
import dotenv from "dotenv";
import ws from "ws";
import * as schema from "./schema";

// Configure WebSocket for Neon in Node.js.
neonConfig.webSocketConstructor = ws;

// Load environment variables.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "DATABASE_URL is not set. Database access will fail if queried.",
  );
}

// Use Neon as the canonical database type so relational queries
// retain their schema-derived TypeScript types.
type Database = ReturnType<typeof neonDrizzle<typeof schema>>;

function createConnectedDb(url: string): Database {
  if (url.includes("neon.tech")) {
    const pool = new NeonPool({ connectionString: url });

    pool.on(
      "connect",
      (client: import("@neondatabase/serverless").PoolClient) => {
        void client
          .query('SET timezone = "Asia/Ho_Chi_Minh"')
          .catch((error: unknown) => {
            console.error("Failed to set Neon timezone:", error);
          });
      },
    );

    return neonDrizzle(pool, { schema });
  }

  const pool = new NodePool({ connectionString: url });

  pool.on("connect", (client: import("pg").PoolClient) => {
    void client
      .query('SET timezone = "Asia/Ho_Chi_Minh"')
      .catch((error: unknown) => {
        console.error("Failed to set PostgreSQL timezone:", error);
      });
  });

  // node-postgres and Neon use different driver types.
  // Keep one public database type for consistent query inference.
  return nodeDrizzle(pool, { schema }) as unknown as Database;
}

function createUnavailableDb(): Database {
  return new Proxy({} as Database, {
    get(_target, property) {
      throw new Error(
        `Database is not initialized. Cannot access "${String(property)}" because DATABASE_URL is missing.`,
      );
    },
  });
}

export const db: Database = connectionString
  ? createConnectedDb(connectionString)
  : createUnavailableDb();