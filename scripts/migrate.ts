import 'dotenv/config';
import { db } from '../db'
import path from 'path'
import { execSync } from 'child_process'

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

  // Run data migration to populate hashes on existing data
  try {
    console.log('Running data migration to populate hashes...');
    execSync('npx tsx ./scripts/populate-hashes.ts', {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (err) {
    console.error('Failed to run populate-hashes data migration:', err);
    process.exit(1);
  }

  // Run credentials update script automatically
  try {
    console.log('Running credentials update script...');
    execSync('npx tsx ./scripts/update-credentials.ts', {
      stdio: 'inherit',
      env: process.env,
    });
  } catch (err) {
    console.error('Failed to run credentials update script:', err);
    process.exit(1);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});