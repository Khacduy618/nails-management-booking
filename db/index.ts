import { drizzle as neonDrizzle } from 'drizzle-orm/neon-serverless'
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless'
import { drizzle as nodeDrizzle } from 'drizzle-orm/node-postgres'
import { Pool as NodePool } from 'pg'
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

const isNeon = connectionString?.includes('neon.tech')

export const db = (() => {
  if (!connectionString) {
    return {
      // Mock db object that throws when accessed, to prevent crash at import time
      query: {},
      select: () => { throw new Error("Database not initialized") },
      insert: () => { throw new Error("Database not initialized") },
      update: () => { throw new Error("Database not initialized") },
      delete: () => { throw new Error("Database not initialized") },
      execute: () => { throw new Error("Database not initialized") },
      transaction: () => { throw new Error("Database not initialized") },
    } as any
  }

  if (isNeon) {
    const pool = new NeonPool({ connectionString })
    pool.on('connect', (client: any) => {
      client.query('SET timezone = "Asia/Ho_Chi_Minh"')
    })
    return neonDrizzle(pool, { schema })
  } else {
    const pool = new NodePool({ connectionString })
    pool.on('connect', (client: any) => {
      client.query('SET timezone = "Asia/Ho_Chi_Minh"')
    })
    return nodeDrizzle(pool, { schema })
  }
})()

