import { db } from '../db';
import { customers, appointments } from '../db/schema';

async function check() {
  const allCustomers = await db.select().from(customers);
  const allAppointments = await db.select().from(appointments);
  console.log('Customers count:', allCustomers.length);
  console.log('Customers:', allCustomers);
  console.log('Appointments count:', allAppointments.length);
  console.log('Appointments:', allAppointments);
  process.exit(0);
}

check().catch(console.error);
