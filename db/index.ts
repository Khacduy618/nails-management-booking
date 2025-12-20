import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool, neonConfig } from '@neondatabase/serverless'
import dotenv from 'dotenv'
import ws from 'ws'
import * as schema from './schema'

// Config neon to use ws package in Node.js environment
neonConfig.webSocketConstructor = ws

// Load env vars
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const connectionString = process.env.DATABASE_URL

// Allow build to proceed without DB connection (for static generation phases that don't need DB)
if (!connectionString) {
  console.warn('⚠️ DATABASE_URL is not set. Database connection will not be available.')
}

const pool = connectionString
  ? new Pool({ connectionString })
  : null

// Set timezone to Vietnam (UTC+7) for all connections
if (pool) {
  pool.on('connect', (client: any) => {
    client.query('SET timezone = "Asia/Ho_Chi_Minh"')
  })
}

export const db = (pool ? drizzle(pool, { schema }) : {
  // Mock db object that throws when accessed, to prevent crash at import time
  query: {},
  select: () => { throw new Error("Database not initialized") },
  insert: () => { throw new Error("Database not initialized") },
  update: () => { throw new Error("Database not initialized") },
  delete: () => { throw new Error("Database not initialized") },
  execute: () => { throw new Error("Database not initialized") },
  transaction: () => { throw new Error("Database not initialized") },
}) as ReturnType<typeof drizzle<typeof schema>>
