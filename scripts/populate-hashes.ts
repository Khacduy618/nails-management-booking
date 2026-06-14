import 'dotenv/config';
import { db } from '../db';
import { appointments, customers, users } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { decrypt, generateBlindIndex } from '../lib/crypto';

export async function populateHashes() {
    console.log('🔄 Running data migration to populate encryption hashes...');

    // 1. Fetch and update all appointments missing customerPhoneHash
    const appointmentsList = await db.select().from(appointments);
    let updatedAppointmentsCount = 0;
    
    for (const apt of appointmentsList) {
        if (!apt.customerPhoneHash && apt.customerPhone) {
            const decryptedPhone = decrypt(apt.customerPhone);
            if (decryptedPhone) {
                const phoneHash = generateBlindIndex(decryptedPhone);
                if (phoneHash) {
                    await db.update(appointments)
                        .set({ customerPhoneHash: phoneHash })
                        .where(eq(appointments.id, apt.id));
                    updatedAppointmentsCount++;
                }
            }
        }
    }
    console.log(`✅ Updated ${updatedAppointmentsCount} appointments with phone hashes.`);

    // 2. Fetch and update all customers missing phoneHash/emailHash, cleaning duplicates
    const customersList = await db.select().from(customers);
    const seenHashes = new Set<string>();
    let updatedCustomersCount = 0;
    let deletedDuplicatesCount = 0;

    for (const cust of customersList) {
        if (!cust.phone) continue;

        const decryptedPhone = decrypt(cust.phone);
        if (!decryptedPhone) continue;

        const phoneHash = generateBlindIndex(decryptedPhone);
        if (!phoneHash) continue;

        // Check for duplicate customer records (since phoneHash must be unique)
        if (seenHashes.has(phoneHash)) {
            console.warn(`⚠️ Duplicate customer record found for phone: ${decryptedPhone}. Deleting duplicate ID: ${cust.id}`);
            await db.delete(customers).where(eq(customers.id, cust.id));
            deletedDuplicatesCount++;
            continue;
        }
        seenHashes.add(phoneHash);

        // Compute email hash if email is present
        let emailHash: string | null = null;
        if (cust.email) {
            const decryptedEmail = decrypt(cust.email);
            if (decryptedEmail) {
                emailHash = generateBlindIndex(decryptedEmail);
            }
        }

        // Always update the hashes to ensure they are populated
        await db.update(customers)
            .set({ 
                phoneHash, 
                emailHash 
            })
            .where(eq(customers.id, cust.id));
        updatedCustomersCount++;
    }
    console.log(`✅ Updated ${updatedCustomersCount} customers with hashes. Deleted ${deletedDuplicatesCount} duplicates.`);

    // 3. Fetch and update all users missing emailHash/phoneHash, cleaning duplicates
    const usersList = await db.select().from(users);
    const seenUserEmailHashes = new Set<string>();
    const seenUserPhoneHashes = new Set<string>();
    let updatedUsersCount = 0;
    let deletedUserDuplicatesCount = 0;

    for (const u of usersList) {
        if (!u.email || !u.phone) continue;

        const decryptedEmail = decrypt(u.email);
        const decryptedPhone = decrypt(u.phone);
        if (!decryptedEmail || !decryptedPhone) continue;

        const emailHash = generateBlindIndex(decryptedEmail);
        const phoneHash = generateBlindIndex(decryptedPhone);
        if (!emailHash || !phoneHash) continue;

        // Clean duplicates
        if (seenUserEmailHashes.has(emailHash) || seenUserPhoneHashes.has(phoneHash)) {
            console.warn(`⚠️ Duplicate user record found. Deleting duplicate user ID: ${u.id}`);
            await db.delete(users).where(eq(users.id, u.id));
            deletedUserDuplicatesCount++;
            continue;
        }
        seenUserEmailHashes.add(emailHash);
        seenUserPhoneHashes.add(phoneHash);

        await db.update(users)
            .set({ 
                emailHash, 
                phoneHash 
            })
            .where(eq(users.id, u.id));
        updatedUsersCount++;
    }
    console.log(`✅ Updated ${updatedUsersCount} users with hashes. Deleted ${deletedUserDuplicatesCount} duplicates.`);

    // 4. Apply database-level constraints
    console.log('🔒 Applying NOT NULL and UNIQUE database constraints...');
    await db.execute(sql`
        -- Set NOT NULL constraints
        ALTER TABLE "appointments" ALTER COLUMN "customer_phone_hash" SET NOT NULL;
        ALTER TABLE "customers" ALTER COLUMN "phone_hash" SET NOT NULL;
        ALTER TABLE "users" ALTER COLUMN "email_hash" SET NOT NULL;
        ALTER TABLE "users" ALTER COLUMN "phone_hash" SET NOT NULL;
        
        -- Apply UNIQUE constraints
        ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "customers_phone_hash_unique";
        ALTER TABLE "customers" ADD CONSTRAINT "customers_phone_hash_unique" UNIQUE("phone_hash");
        
        ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_hash_unique";
        ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_phone_hash_unique";
        ALTER TABLE "users" ADD CONSTRAINT "users_email_hash_unique" UNIQUE("email_hash");
        ALTER TABLE "users" ADD CONSTRAINT "users_phone_hash_unique" UNIQUE("phone_hash");
    `);
    console.log('✅ Database constraints applied successfully!');
}

// Support executing directly if called via command line
if (process.argv[1]?.endsWith('populate-hashes.ts') || process.argv[1]?.endsWith('populate-hashes')) {
    populateHashes()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Data migration failed:', err);
            process.exit(1);
        });
}
