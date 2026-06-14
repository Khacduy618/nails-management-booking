import { db } from '../db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('Truncating all tables...');
  const tables = [
    'otp_tokens',
    'reviews',
    'appointment_services',
    'appointments',
    'payrolls',
    'staff_base_salaries',
    'staff_schedules',
    'staff_services',
    'staff',
    'users',
    'services',
    'service_categories',
    'customers',
    'admin_notifications'
  ];
  for (const table of tables) {
    try {
      await db.execute(sql.raw(`TRUNCATE TABLE "${table}" CASCADE;`));
      console.log(`Truncated ${table}`);
    } catch (e) {
      console.error(`Failed to truncate ${table}:`, e);
    }
  }
  process.exit(0);
}

run();
