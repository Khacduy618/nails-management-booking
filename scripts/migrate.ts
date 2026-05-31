import { db } from '../db'
import path from 'path'

async function main() {
  console.log('Running migrations...');
  const migrationsFolder = path.join(process.cwd(), 'drizzle');

  const connectionString = process.env.DATABASE_URL
  const isNeon = connectionString?.includes('neon.tech')

  if (isNeon) {
    const { migrate } = await import('drizzle-orm/neon-serverless/migrator')
    await migrate(db as any, { migrationsFolder });
  } else {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator')
    await migrate(db as any, { migrationsFolder });
  }

  console.log('Migrations finished!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});