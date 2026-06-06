import { db } from '../db';
import { appointments } from '../db/schema';
import { gte } from 'drizzle-orm';

async function check() {
  const result = await db.select().from(appointments).where(gte(appointments.id, 90));
  console.log('Appointments ID >= 90:', result);
  process.exit(0);
}

check().catch(console.error);
