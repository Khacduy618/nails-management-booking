import 'dotenv/config';
import { db } from '../db';
import { users, staff, staffSchedules, staffServices, staffBaseSalaries } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { encrypt, generateBlindIndex } from '../lib/crypto';

async function main() {
    console.log('🔄 Running credentials update migration script...');

    // 1. Update Admin User
    const newAdminEmail = 'admin@nails.com';
    const hashedAdminPassword = await bcrypt.hash('phuongjoy123@', 12);
    
    // Find admin user
    const adminRecord = await db.query.users.findFirst({
        where: eq(users.role, 'admin'),
    });

    if (adminRecord) {
        console.log(`Updating existing Admin user (ID: ${adminRecord.id})...`);
        await db.update(users).set({
            email: encrypt(newAdminEmail)!,
            emailHash: generateBlindIndex(newAdminEmail)!,
            password: hashedAdminPassword,
        }).where(eq(users.id, adminRecord.id));
    } else {
        console.log('Admin user not found. Creating a new one...');
        await db.insert(users).values({
            name: encrypt('Quản Trị Viên')!,
            email: encrypt(newAdminEmail)!,
            emailHash: generateBlindIndex(newAdminEmail)!,
            phone: encrypt('1234567890')!,
            phoneHash: generateBlindIndex('1234567890')!,
            password: hashedAdminPassword,
            role: 'admin',
        });
    }

    // 2. Update/Create 3 Staff Members
    const hashedStaffPassword = await bcrypt.hash('staff1234567', 12);
    const staffEmails = ['staff1@nails.com', 'staff2@nails.com', 'staff3@nails.com'];
    const staffNames = ['Nhân Viên 1', 'Nhân Viên 2', 'Nhân Viên 3'];
    const staffPhones = ['0911223344', '0922334455', '0933445566'];

    // Find existing staff users
    const existingStaffUsers = await db.query.users.findMany({
        where: eq(users.role, 'staff'),
        orderBy: [users.id],
    });

    const activeStaffProfileIds: number[] = [];
    const activeUserIds: number[] = [];

    for (let i = 0; i < 3; i++) {
        const email = staffEmails[i];
        const name = staffNames[i];
        const phone = staffPhones[i];
        const emailHash = generateBlindIndex(email)!;
        const phoneHash = generateBlindIndex(phone)!;

        let userId: number;

        if (existingStaffUsers[i]) {
            // Update existing user
            userId = existingStaffUsers[i].id;
            console.log(`Updating existing Staff user ${i+1} (ID: ${userId})...`);
            await db.update(users).set({
                name: encrypt(name)!,
                email: encrypt(email)!,
                emailHash,
                phone: encrypt(phone)!,
                phoneHash,
                password: hashedStaffPassword,
            }).where(eq(users.id, userId));
        } else {
            // Create new staff user
            console.log(`Creating new Staff user ${i+1} (${email})...`);
            const [newUser] = await db.insert(users).values({
                name: encrypt(name)!,
                email: encrypt(email)!,
                emailHash,
                phone: encrypt(phone)!,
                phoneHash,
                password: hashedStaffPassword,
                role: 'staff',
            }).returning();
            userId = newUser.id;
        }
        activeUserIds.push(userId);

        // Check if matching staff profile exists
        let staffProfile = await db.query.staff.findFirst({
            where: eq(staff.userId, userId),
        });

        if (!staffProfile) {
            console.log(`Creating staff profile for userId: ${userId}...`);
            const [newProfile] = await db.insert(staff).values({
                userId,
                position: i === 0 ? 'Kỹ thuật viên Trưởng' : i === 1 ? 'Kỹ thuật viên Chuyên sâu Gel' : 'Chuyên viên Chăm sóc Chân & Trị liệu',
                experience: `${i === 0 ? 5 : i === 1 ? 3 : 4} năm kinh nghiệm`,
                status: 'active',
                joinDate: new Date().toISOString().split('T')[0],
            }).returning();
            staffProfile = newProfile;
        } else {
            console.log(`Updating staff profile for userId: ${userId} to active...`);
            await db.update(staff).set({
                status: 'active',
            }).where(eq(staff.id, staffProfile.id));
        }
        activeStaffProfileIds.push(staffProfile.id);
    }

    // Deactivate/clean up any extra staff users beyond 3
    if (existingStaffUsers.length > 3) {
        console.log(`Found ${existingStaffUsers.length - 3} extra staff users. Cleaning up...`);
        const extraStaffUsers = existingStaffUsers.slice(3);
        
        for (const extraUser of extraStaffUsers) {
            const staffProfile = await db.query.staff.findFirst({
                where: eq(staff.userId, extraUser.id),
            });

            if (staffProfile) {
                console.log(`Reassigning appointments from extra staff (ID: ${staffProfile.id}) to staff 1 (ID: ${activeStaffProfileIds[0]})...`);
                // Execute raw SQL update to avoid circular schema dependencies
                await db.execute(
                    sql`UPDATE appointment_services SET staff_id = ${activeStaffProfileIds[0]} WHERE staff_id = ${staffProfile.id}`
                );

                console.log(`Deleting extra staff profile relations (ID: ${staffProfile.id})...`);
                await db.delete(staffServices).where(eq(staffServices.staffId, staffProfile.id));
                await db.delete(staffSchedules).where(eq(staffSchedules.staffId, staffProfile.id));
                await db.delete(staffBaseSalaries).where(eq(staffBaseSalaries.staffId, staffProfile.id));
                await db.delete(staff).where(eq(staff.id, staffProfile.id));
            }
            console.log(`Deleting extra user account (ID: ${extraUser.id})...`);
            await db.delete(users).where(eq(users.id, extraUser.id));
        }
    }

    console.log('✅ Credentials update migration finished successfully!');
    process.exit(0);
}

main().catch(err => {
    console.error('Credentials update migration failed:', err);
    process.exit(1);
});
