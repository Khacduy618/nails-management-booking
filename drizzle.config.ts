import type { Config } from 'drizzle-kit'
import * as dotenv from 'dotenv'

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

// For migrations, use DIRECT_URL (port 5432) to bypass connection pooler
// For runtime queries, use DATABASE_URL (port 6543 with pgbouncer)
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || fallbackUrl

export default {
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl || '',
  },
  verbose: true,
  strict: true,
} satisfies Config