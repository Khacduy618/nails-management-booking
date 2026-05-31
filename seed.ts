import { db } from './db';
import { users, serviceCategories, services, staff, staffSchedules, staffServices } from './db/schema';
import bcrypt from 'bcryptjs';

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        console.log('🧹 Cleaning existing data...');
        await db.delete(staffSchedules);
        await db.delete(staffServices);
        await db.delete(staff);
        await db.delete(users);
        await db.delete(services);
        await db.delete(serviceCategories);

        const hashedPassword = await bcrypt.hash('password123', 12);

        // 1. Create Categories
        const categories = await db.insert(serviceCategories).values([
            { name: 'Manicure', description: 'Hand nail care services', status: 'active' },
            { name: 'Pedicure', description: 'Foot nail care services', status: 'active' },
            { name: 'Nail Art', description: 'Artistic nail designs', status: 'active' },
        ]).returning();
        console.log('✅ Categories created');

        // 2. Create Services
        const createdServices = await db.insert(services).values([
            // Manicure
            { name: 'Manicure Cơ Bản', description: 'Dịch vụ làm móng tay cơ bản, làm sạch và sơn móng', price: '150000', duration: 30, categoryId: categories[0].id, status: 'active', popular: true },
            { name: 'Gel Manicure', description: 'Làm móng tay gel bền dếp, giữ màu lâu', price: '250000', duration: 45, categoryId: categories[0].id, status: 'active', popular: true },
            { name: 'Manicure Cao Cấp', description: 'Trọi nghiệm làm móng tay cao cấp kèm massage tay', price: '350000', duration: 60, categoryId: categories[0].id, status: 'active' },
            // Pedicure
            { name: 'Pedicure Cơ Bản', description: 'Dịch vụ làm móng chân cơ bản', price: '180000', duration: 40, categoryId: categories[1].id, status: 'active' },
            { name: 'Pedicure Cao Cấp', description: 'Làm móng chân cao cấp kèm massage chân', price: '300000', duration: 60, categoryId: categories[1].id, status: 'active', popular: true },
            { name: 'Gel Pedicure', description: 'Làm móng chân gel siêu bền', price: '280000', duration: 50, categoryId: categories[1].id, status: 'active' },
            // Nail Art
            { name: 'Nail Art Cơ Bản', description: 'Vẽ họa tiết đơn giản trên móng', price: '200000', duration: 45, categoryId: categories[2].id, status: 'active' },
            { name: 'Nail Art 3D', description: 'Thiết kế móng nghệ thuật 3D độc đáo', price: '450000', duration: 90, categoryId: categories[2].id, status: 'active', popular: true },
            { name: 'Nail Art Đính Đá', description: 'Trang trí móng với đá và họa tiết cao cấp', price: '550000', duration: 120, categoryId: categories[2].id, status: 'active' },
        ]).returning();
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
            joinDate: new Date().toISOString().split('T')[0],
        }).returning();
        console.log('✅ Staff profile created');

        // 5. Create Staff Schedule
        await db.insert(staffSchedules).values([
            { staffId: staffMember[0].id, dayOfWeek: 1, startTime: '09:00', endTime: '18:00' }, // Monday
            { staffId: staffMember[0].id, dayOfWeek: 2, startTime: '09:00', endTime: '18:00' }, // Tuesday
            { staffId: staffMember[0].id, dayOfWeek: 3, startTime: '09:00', endTime: '18:00' }, // Wednesday
            { staffId: staffMember[0].id, dayOfWeek: 4, startTime: '09:00', endTime: '18:00' }, // Thursday
            { staffId: staffMember[0].id, dayOfWeek: 5, startTime: '09:00', endTime: '18:00' }, // Friday
            { staffId: staffMember[0].id, dayOfWeek: 6, startTime: '09:00', endTime: '18:00' }, // Saturday
        ]);
        console.log('✅ Staff schedule created');

        // 6. Link Staff to Services (Skills) so availability matches
        await db.insert(staffServices).values(
            createdServices.map((service: any) => ({
                staffId: staffMember[0].id,
                serviceId: service.id,
            }))
        );
        console.log('✅ Staff linked to services');

        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
