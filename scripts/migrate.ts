import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from '../db/index.js'
import path from 'path'

async function main() {
  console.log('Running migrations...');
  const migrationsFolder = path.join(process.cwd(), 'drizzle');

  // Cast db to any to avoid type mismatch with the mock object used for build
  await migrate(db as any, { migrationsFolder });

  console.log('Migrations finished!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});