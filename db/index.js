import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import dotenv from 'dotenv'
import * as schema from './schema.js'

// Load env vars
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const fallbackUrl = (() => {
  const host = process.env.DATABASE_HOST
  const port = process.env.DATABASE_PORT || '5432'
  const user = process.env.DATABASE_USER
  const password = process.env.DATABASE_PASSWORD
  const database = process.env.DATABASE_NAME

  if (!host || !user || !password || !database) return undefined

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`
})()

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || fallbackUrl

// Allow build to proceed without DB connection (for static generation phases that don't need DB)
if (!connectionString) {
  console.warn('⚠️ DATABASE_URL is not set. Database connection will not be available.')
}

const pool = connectionString
  ? new Pool({
    connectionString,
    ssl: process.env.PGSSL_DISABLE === 'true' ? false : { rejectUnauthorized: false },
  })
  : null

// Set timezone to Vietnam (UTC+7) for all connections
if (pool) {
  pool.on('connect', (client) => {
    client.query('SET timezone = "Asia/Ho_Chi_Minh"')
  })
}

export const db = pool ? drizzle(pool, { schema }) : {
  // Mock db object that throws when accessed, to prevent crash at import time
  query: {},
  select: () => { throw new Error("Database not initialized") },
  insert: () => { throw new Error("Database not initialized") },
  update: () => { throw new Error("Database not initialized") },
  delete: () => { throw new Error("Database not initialized") },
  execute: () => { throw new Error("Database not initialized") },
  transaction: () => { throw new Error("Database not initialized") },
}
