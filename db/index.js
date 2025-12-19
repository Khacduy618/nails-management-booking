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

const connectionString = process.env.DATABASE_URL || fallbackUrl

if (!connectionString) {
  throw new Error('DATABASE_URL hoặc thông tin host/port/user/password/database chưa được cấu hình')
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL_DISABLE === 'true' ? false : { rejectUnauthorized: false },
})

// Set timezone to Vietnam (UTC+7) for all connections
pool.on('connect', (client) => {
  client.query('SET timezone = "Asia/Ho_Chi_Minh"')
})

export const db = drizzle(pool, { schema })
