import { db } from '../db';
import { customers, appointments, appointmentServices } from '../db/schema';
import { desc, sql, count } from 'drizzle-orm';

async function test() {
  try {
    console.log('Running count query...');
    const countResult = await db.select({ count: count() }).from(customers);
    console.log('Count result:', countResult);

    console.log('Running data query...');
    const totalAmountSql = sql<string>`COALESCE((
        SELECT SUM(price_at_booking)::numeric 
        FROM "appointments" 
        WHERE "customer_id" = "customers"."id" AND "status" != 'cancelled'
    ), '0.00')`;

    const serviceCountSql = sql<number>`COALESCE((
        SELECT COUNT(asv.id)::int
        FROM "appointment_services" asv
        JOIN "appointments" apt ON asv.appointment_id = apt.id
        WHERE apt.customer_id = "customers"."id" AND apt.status != 'cancelled'
    ), 0)`;

    const data = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        email: customers.email,
        totalAmount: totalAmountSql,
        serviceCount: serviceCountSql,
      })
      .from(customers)
      .limit(10);
    console.log('Data query result:', data);
  } catch (error) {
    console.error('Query failed with error:', error);
  }
  process.exit(0);
}

test();
