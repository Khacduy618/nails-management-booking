import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { db } from '../db/index.js'
import path from 'path'

async function main() {
  console.log('Running migrations...');
  const migrationsFolder = path.join(process.cwd(), 'drizzle');

  await migrate(db, { migrationsFolder });

  console.log('Migrations finished!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});