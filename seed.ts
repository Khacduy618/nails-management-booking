
import { db } from './db/index.js';
import { users, serviceCategories, services, staff, staffSchedules } from './db/schema.js';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Create Categories
        const categories = await db.insert(serviceCategories).values([
            { name: 'Manicure', description: 'Hand nail care services', status: 'active' },
            { name: 'Pedicure', description: 'Foot nail care services', status: 'active' },
            { name: 'Nail Art', description: 'Artistic nail designs', status: 'active' },
        ]).returning();
        console.log('✅ Categories created');

        // 2. Create Services
        await db.insert(services).values([
            { name: 'Classic Manicure', description: 'Basic manicure service', price: '25.00', duration: 30, categoryId: categories[0].id, status: 'active' },
            { name: 'Gel Manicure', description: 'Long-lasting gel manicure', price: '40.00', duration: 45, categoryId: categories[0].id, status: 'active' },
            { name: 'Classic Pedicure', description: 'Basic pedicure service', price: '35.00', duration: 40, categoryId: categories[1].id, status: 'active' },
            { name: 'Deluxe Pedicure', description: 'Premium pedicure with massage', price: '55.00', duration: 60, categoryId: categories[1].id, status: 'active' },
        ]);
        console.log('✅ Services created');

        // 3. Create Users
        const adminUser = await db.insert(users).values({
            name: 'Admin User',
            email: 'admin@example.com',
            phone: '1234567890',
            password: hashedPassword,
            role: 'admin',
        }).returning();

        const staffUser1 = await db.insert(users).values({
            name: 'Sarah Staff',
            email: 'sarah@example.com',
            phone: '0987654321',
            password: hashedPassword,
            role: 'staff',
        }).returning();

        const customerUser1 = await db.insert(users).values({
            name: 'John Customer',
            email: 'john@example.com',
            phone: '5555555555',
            password: hashedPassword,
            role: 'customer',
        }).returning();
        console.log('✅ Users created');

        // 4. Create Staff Profile
        const staffMember = await db.insert(staff).values({
            userId: staffUser1[0].id,
            position: 'Senior Technician',
            status: 'active',
            joinDate: new Date().toISOString(),
        }).returning();
        console.log('✅ Staff profile created');

        // 5. Create Staff Schedule
        await db.insert(staffSchedules).values([
            { staffId: staffMember[0].id, dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }, // Monday
            { staffId: staffMember[0].id, dayOfWeek: 2, startTime: '09:00', endTime: '18:00' }, // Tuesday
            { staffId: staffMember[0].id, dayOfWeek: 3, startTime: '09:00', endTime: '18:00' }, // Wednesday
            { staffId: staffMember[0].id, dayOfWeek: 4, startTime: '09:00', endTime: '18:00' }, // Thursday
            { staffId: staffMember[0].id, dayOfWeek: 5, startTime: '09:00', endTime: '18:00' }, // Friday
        ]);
        console.log('✅ Staff schedule created');

        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
