import { db } from './db';
import { 
    users, 
    serviceCategories, 
    services, 
    staff, 
    staffSchedules, 
    staffServices, 
    customers, 
    appointments, 
    appointmentServices, 
    reviews, 
    staffBaseSalaries, 
    adminNotifications, 
    otpTokens, 
    payrolls 
} from './db/schema';
import bcrypt from 'bcryptjs';

function getRelativeDate(offsetDays: number): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
}

async function seed() {
    console.log('🌱 Start seeding high-quality dynamic database...');

    try {
        console.log('🧹 Cleaning existing tables in order of dependencies...');
        await db.delete(otpTokens);
        await db.delete(reviews);
        await db.delete(appointmentServices);
        await db.delete(appointments);
        await db.delete(payrolls);
        await db.delete(staffBaseSalaries);
        await db.delete(staffSchedules);
        await db.delete(staffServices);
        await db.delete(staff);
        await db.delete(users);
        await db.delete(services);
        await db.delete(serviceCategories);
        await db.delete(customers);
        await db.delete(adminNotifications);
        console.log('✅ Tables cleaned successfully');

        const hashedPassword = await bcrypt.hash('password123', 12);

        // 1. Create Categories (5 categories)
        console.log('📦 Creating service categories...');
        const categories = await db.insert(serviceCategories).values([
            { name: 'Manicure', description: 'Chăm sóc móng tay chuyên nghiệp', status: 'active' as const },
            { name: 'Pedicure', description: 'Chăm sóc móng chân chuyên sâu', status: 'active' as const },
            { name: 'Nail Extensions', description: 'Nối móng và úp móng nghệ thuật', status: 'active' as const },
            { name: 'Nail Art', description: 'Thiết kế trang trí móng phong cách', status: 'active' as const },
            { name: 'Combos & Spas', description: 'Các gói combo chăm sóc móng toàn diện', status: 'active' as const },
        ]).returning();
        console.log('✅ Categories created');

        // 2. Create Services (20 services total)
        console.log('💅 Creating services with high quality Unsplash photos...');
        const createdServices = await db.insert(services).values([
            // Manicure (categories[0])
            { 
                name: 'Manicure Cơ Bản', 
                description: 'Dịch vụ làm sạch móng, cắt tỉa da thừa tay và sơn thường dưỡng móng tốt nhất.', 
                price: '120000', 
                duration: 30, 
                categoryId: categories[0].id, 
                status: 'active' as const, 
                popular: false,
                imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Sơn Gel Móng Tay', 
                description: 'Cắt da tay làm sạch móng và phủ lớp sơn gel cao cấp siêu bền màu, bóng đẹp dài lâu.', 
                price: '220000', 
                duration: 45, 
                categoryId: categories[0].id, 
                status: 'active' as const, 
                popular: true,
                imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Manicure Spa Cao Cấp', 
                description: 'Trải nghiệm chăm sóc móng tay kết hợp ngâm tay thảo dược, tẩy tế bào chết và massage thư giãn.', 
                price: '350000', 
                duration: 60, 
                categoryId: categories[0].id, 
                status: 'active' as const, 
                popular: true,
                imageUrl: 'https://images.unsplash.com/photo-1522337094135-05926b09ac2e?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Phục Hồi Móng Paraffin', 
                description: 'Ủ màng Paraffin nóng ấm giúp cấp ẩm sâu cho da tay khô ráp và phục hồi móng yếu xơ xác.', 
                price: '280000', 
                duration: 45, 
                categoryId: categories[0].id, 
                status: 'active' as const, 
                popular: false,
                imageUrl: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?q=80&w=800&auto=format&fit=crop'
            },

            // Pedicure (categories[1])
            { 
                name: 'Pedicure Cơ Bản', 
                description: 'Làm sạch móng chân, cắt tỉa da thừa chân nhẹ nhàng và phủ sơn thường bảo vệ.', 
                price: '140000', 
                duration: 40, 
                categoryId: categories[1].id, 
                status: 'active' as const, 
                popular: false,
                imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Sơn Gel Móng Chân', 
                description: 'Làm móng chân tỉ mỉ kết hợp phủ sơn gel bền màu, chống bong tróc khi di chuyển.', 
                price: '250000', 
                duration: 50, 
                categoryId: categories[1].id, 
                status: 'active' as const, 
                popular: true,
                imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Pedicure Chà Gót Chân Spa', 
                description: 'Chà gót chân chuyên sâu loại bỏ vết chai sần, ngâm chân thảo mộc kết hợp massage trị liệu.', 
                price: '380000', 
                duration: 70, 
                categoryId: categories[1].id, 
                status: 'active' as const, 
                popular: true,
                imageUrl: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Trị Liệu Foot Spa Thảo Dược', 
                description: 'Liệu trình giảm căng mỏi bàn chân với đá nóng muối gừng và đắp mặt nạ giữ ẩm chân.', 
                price: '450000', 
                duration: 80, 
                categoryId: categories[1].id, 
                status: 'active' as const, 
                popular: false,
                imageUrl: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=800&auto=format&fit=crop'
            },

            // Nail Extensions (categories[2])
            { 
                name: 'Úp Móng Gel Cao Cấp (Gel-X)', 
                description: 'Công nghệ úp móng bằng gel cao cấp mỏng nhẹ tự nhiên, không gây nặng móng hay hỏng móng thật.', 
                price: '380000', 
                duration: 75, 
                categoryId: categories[2].id, 
                status: 'active' as const, 
                popular: true,
                imageUrl: 'https://images.unsplash.com/photo-1629732047847-50b7ecfe0cbf?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Đắp Bột Móng Acrylic', 
                description: 'Tạo phom móng dài sắc sảo bằng bột acrylic siêu bền, chịu lực tốt, lý tưởng để đính phụ kiện lớn.', 
                price: '480000', 
                duration: 90, 
                categoryId: categories[2].id, 
                status: 'active' as const, 
                popular: false,
                imageUrl: 'https://images.unsplash.com/photo-1629732047847-50b7ecfe0cbf?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Đắp Gel Khóa Móng (Hard Gel)', 
                description: 'Phủ gel cứng bảo vệ phom móng thật hoặc kéo dài móng với đặc tính bóng bẩy và đàn hồi tốt.', 
                price: '450000', 
                duration: 80, 
                categoryId: categories[2].id, 
                status: 'active' as const, 
                popular: false,
                imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Dặm Bột / Dặm Gel (Fills)', 
                description: 'Dặm lại phần chân móng mọc ra sau 2-3 tuần nhằm bảo dưỡng độ chắc khỏe và vẻ đẹp nguyên vẹn.', 
                price: '250000', 
                duration: 45, 
                categoryId: categories[2].id, 
                status: 'active' as const, 
                popular: false,
                imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Tháo Móng Úp / Tháo Bột', 
                description: 'Tháo móng giả an toàn bằng máy mài chuyên nghiệp kết hợp dưỡng ẩm móng tránh hư hại.', 
                price: '80000', 
                duration: 30, 
                categoryId: categories[2].id, 
                status: 'active' as const, 
                popular: false,
                imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=800&auto=format&fit=crop'
            },

            // Nail Art (categories[3])
            { 
                name: 'Thiết Kế Móng Pháp (French Tip)', 
                description: 'Vẽ đầu móng kiểu Pháp trắng tinh tế hoặc màu sắc phá cách sang trọng thanh lịch.', 
                price: '150000', 
                duration: 30, 
                categoryId: categories[3].id, 
                status: 'active' as const, 
                popular: false,
                imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Hiệu Ứng Mắt Mèo / Tráng Gương', 
                description: 'Sử dụng sơn mắt mèo tạo dải sáng huyền ảo hoặc phủ bột ngọc trai chrome tráng gương thời trang.', 
                price: '180000', 
                duration: 40, 
                categoryId: categories[3].id, 
                status: 'active' as const, 
                popular: true,
                imageUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Vẽ Móng Nghệ Thuật Cơ Bản', 
                description: 'Vẽ nét thanh mảnh, họa tiết đơn giản hoặc dán sticker nhũ bạc cho cả bộ móng.', 
                price: '120000', 
                duration: 30, 
                categoryId: categories[3].id, 
                status: 'active' as const, 
                popular: false,
                imageUrl: 'https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Vẽ Móng Nghệ Thuật Nâng Cao', 
                description: 'Thiết kế vẽ tay tả thực độc quyền, phối màu phức tạp hoặc đắp gel tạo nổi 3D theo yêu cầu khách hàng.', 
                price: '280000', 
                duration: 60, 
                categoryId: categories[3].id, 
                status: 'active' as const, 
                popular: true,
                imageUrl: 'https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Đính Đá & Charm Sang Trọng', 
                description: 'Sắp xếp đính đá pha lê Swarovski bền chặt cùng charm kim loại phong cách hoàng gia sang trọng.', 
                price: '300000', 
                duration: 50, 
                categoryId: categories[3].id, 
                status: 'active' as const, 
                popular: true,
                imageUrl: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=800&auto=format&fit=crop'
            },

            // Combos & Spas (categories[4])
            { 
                name: 'Combo Sơn Gel Tay & Chân', 
                description: 'Chăm sóc đầy đủ cắt da tay chân kết hợp sơn gel bền màu cho cả tay và chân với mức giá ưu đãi.', 
                price: '420000', 
                duration: 90, 
                categoryId: categories[4].id, 
                status: 'active' as const, 
                popular: true,
                imageUrl: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?q=80&w=800&auto=format&fit=crop'
            },
            { 
                name: 'Combo Spa Sang Trọng Toàn Diện', 
                description: 'Gói chăm sóc tối thượng: Manicure Spa + Pedicure Spa + Sơn Gel tự chọn + Tặng kèm ngâm paraffin dưỡng tay.', 
                price: '680000', 
                duration: 120, 
                categoryId: categories[4].id, 
                status: 'active' as const, 
                popular: true,
                imageUrl: 'https://images.unsplash.com/photo-1522337094135-05926b09ac2e?q=80&w=800&auto=format&fit=crop'
            },
        ]).returning();
        console.log('✅ Services created successfully');

        // 3. Create Users
        console.log('👤 Creating users (Admin, Staff, and Customers)...');
        // Admin
        const adminUser = await db.insert(users).values({
            name: 'Quản Trị Viên',
            email: 'admin@example.com',
            phone: '1234567890',
            password: hashedPassword,
            role: 'admin' as const,
        }).returning();

        // Staff Users
        const staffUsers = await db.insert(users).values([
            { name: 'Sarah Nguyễn', email: 'sarah@example.com', phone: '0911223344', password: hashedPassword, role: 'staff' as const },
            { name: 'Elena Trần', email: 'elena@example.com', phone: '0922334455', password: hashedPassword, role: 'staff' as const },
            { name: 'David Lê', email: 'david@example.com', phone: '0933445566', password: hashedPassword, role: 'staff' as const },
            { name: 'Anna Lâm', email: 'anna@example.com', phone: '0944556677', password: hashedPassword, role: 'staff' as const },
        ]).returning();

        // 15 Customer Users
        const customerNames = [
            { name: 'Lê Thị Mai', phone: '0901234567', notes: 'Khách VIP, thích sơn gel thạch nhẹ nhàng.' },
            { name: 'Nguyễn Văn Nam', phone: '0907654321', notes: 'Khách quen chăm sóc chân thảo dược định kỳ.' },
            { name: 'Trần Thu Thủy', phone: '0908889999', notes: 'Móng mỏng, cần sơn dưỡng trước khi phủ sơn màu.' },
            { name: 'Phạm Minh Hằng', phone: '0905556666', notes: 'Thường đi làm nail cùng con gái vào cuối tuần.' },
            { name: 'Hoàng Anh Tuấn', phone: '0903332222', notes: 'Chăm sóc da chân khô sần, nứt nẻ.' },
            { name: 'Đặng Thùy Chi', phone: '0901112222', notes: 'Ưu tiên thợ Sarah làm vẽ nghệ thuật.' },
            { name: 'Vũ Minh Quân', phone: '0904445555', notes: 'Lấy da móng và massage chân.' },
            { name: 'Bùi Thị Ngọc', phone: '0906667777', notes: 'Thích đính đá sang trọng.' },
            { name: 'Ngô Minh Đức', phone: '0908887777', notes: 'Thường đặt lịch tối.' },
            { name: 'Lý Gia Hân', phone: '0909990000', notes: 'Móng Gel-X dài.' },
            { name: 'Phan Thanh Bình', phone: '0901234123', notes: 'Chăm sóc gót chân đá nóng.' },
            { name: 'Đỗ Hải Yến', phone: '0905678567', notes: 'Yêu cầu không gian yên tĩnh.' },
            { name: 'Hồ Phương Thảo', phone: '0909876987', notes: 'Thích vẽ thiết kế nhạt nhẹ Hàn Quốc.' },
            { name: 'Trịnh Quốc Bảo', phone: '0902468246', notes: 'Chăm sóc vệ sinh móng cơ bản.' },
            { name: 'Nguyễn Thị Kim', phone: '0901357135', notes: 'Yêu cầu sơn gel nhập khẩu cao cấp.' },
        ];

        const createdCustomerUsers = await db.insert(users).values(
            customerNames.map((cust: any) => ({
                name: cust.name,
                email: `${cust.phone}@customer.com`,
                phone: cust.phone,
                password: hashedPassword,
                role: 'customer' as const,
            }))
        ).returning();

        // Seed Customers table
        const seededCustomers = await db.insert(customers).values(
            createdCustomerUsers.map((usr: any, i: number) => ({
                phone: usr.phone,
                name: usr.name,
                email: usr.email,
                notes: customerNames[i].notes,
                lastAppointmentDate: getRelativeDate(-2),
            }))
        ).returning();

        console.log(`✅ Users & Customers seeded (1 Admin, 4 Staff, 15 Customers)`);

        // 4. Create Staff Profiles
        console.log('🛠️ Creating staff profiles...');
        const staffProfiles = await db.insert(staff).values([
            {
                userId: staffUsers[0].id,
                position: 'Kỹ thuật viên Trưởng',
                specialties: ['Nail Art 3D', 'Úp móng Gel-X', 'Đính đá cao cấp'],
                experience: '5 năm kinh nghiệm',
                status: 'active' as const,
                avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
                joinDate: getRelativeDate(-365),
                rating: '4.95',
            },
            {
                userId: staffUsers[1].id,
                position: 'Kỹ thuật viên Chuyên sâu Gel',
                specialties: ['Sơn Gel', 'Đắp móng Acrylic', 'Mắt mèo & Tráng gương'],
                experience: '3 năm kinh nghiệm',
                status: 'active' as const,
                avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
                joinDate: getRelativeDate(-200),
                rating: '4.78',
            },
            {
                userId: staffUsers[2].id,
                position: 'Chuyên viên Chăm sóc Chân & Trị liệu',
                specialties: ['Chà gót chân', 'Foot Spa thảo dược', 'Massage đá nóng'],
                experience: '4 năm kinh nghiệm',
                status: 'active' as const,
                avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop',
                joinDate: getRelativeDate(-250),
                rating: '4.85',
            },
            {
                userId: staffUsers[3].id,
                position: 'Kỹ thuật viên Cơ bản',
                specialties: ['Cắt da tạo phom', 'Sơn thường', 'Sơn gel trơn'],
                experience: '1 năm kinh nghiệm',
                status: 'active' as const,
                avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=400&auto=format&fit=crop',
                joinDate: getRelativeDate(-90),
                rating: '4.55',
            },
        ]).returning();
        console.log('✅ Staff profiles created');

        // 5. Create Staff Schedules (Mon - Sat)
        console.log('⏰ Creating schedules for staff...');
        const schedulesValues: any[] = [];
        staffProfiles.forEach((ktv: any) => {
            // Monday to Saturday
            for (let day = 1; day <= 6; day++) {
                schedulesValues.push({
                    staffId: ktv.id,
                    dayOfWeek: day,
                    startTime: ktv.position.includes('Trị liệu') ? '10:00' : '09:00',
                    endTime: ktv.position.includes('Trị liệu') ? '19:00' : '18:00',
                });
            }
        });
        await db.insert(staffSchedules).values(schedulesValues);
        console.log('✅ Staff schedules created');

        // 6. Create Staff Base Salaries
        console.log('💵 Seeding staff base salaries...');
        await db.insert(staffBaseSalaries).values([
            { staffId: staffProfiles[0].id, baseSalary: '12000000', notes: 'Lương cứng thợ trưởng + hỗ trợ quản lý.' },
            { staffId: staffProfiles[1].id, baseSalary: '9000000', notes: 'Lương cứng thợ gel chính.' },
            { staffId: staffProfiles[2].id, baseSalary: '10000000', notes: 'Lương cứng kỹ thuật viên massage & spa chân.' },
            { staffId: staffProfiles[3].id, baseSalary: '7500000', notes: 'Lương cứng thợ phụ cắt da cơ bản.' },
        ]);
        console.log('✅ Base salaries seeded');

        // 7. Link Staff to Services (Skills Mapping)
        console.log('🔗 Linking staff to specific services they can handle...');
        const staffServicesValues: any[] = [];

        // Sarah Nguyễn (staffProfiles[0]) - làm được tất cả
        const sarahServices = [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
        sarahServices.forEach((idx: number) => {
            staffServicesValues.push({ staffId: staffProfiles[0].id, serviceId: createdServices[idx].id });
        });

        // Elena Trần (staffProfiles[1]) - chuyên móng tay, gel, nối bột, vẽ móng
        const elenaServices = [0, 1, 2, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18];
        elenaServices.forEach((idx: number) => {
            staffServicesValues.push({ staffId: staffProfiles[1].id, serviceId: createdServices[idx].id });
        });

        // David Lê (staffProfiles[2]) - chuyên spa chân, chà gót chân, phục hồi paraffin, combo
        const davidServices = [0, 2, 3, 4, 5, 6, 7, 12, 18, 19];
        davidServices.forEach((idx: number) => {
            staffServicesValues.push({ staffId: staffProfiles[2].id, serviceId: createdServices[idx].id });
        });

        // Anna Lâm (staffProfiles[3]) - làm sạch cơ bản, sơn thường, tháo móng, combo gel
        const annaServices = [0, 1, 4, 5, 12, 13, 15, 18];
        annaServices.forEach((idx: number) => {
            staffServicesValues.push({ staffId: staffProfiles[3].id, serviceId: createdServices[idx].id });
        });

        await db.insert(staffServices).values(staffServicesValues);
        console.log('✅ Staff services (skills mapping) created');

        // 8. Create Appointments & Appointment Services
        console.log('📅 Creating 30+ dynamic appointments in diverse states...');

        const appointmentTemplates = [
            // Past Completed Appointments (Day -29 to -1)
            { customerIdx: 0, serviceIdxs: [1, 13], staffIdx: 0, dayOffset: -29, time: '09:30', status: 'completed' as const, rating: 5, comment: 'Sarah vẽ French móng rất đều và đẹp. Móng giữ gel bền lâu!' },
            { customerIdx: 1, serviceIdxs: [6], staffIdx: 2, dayOffset: -27, time: '10:00', status: 'completed' as const, rating: 5, comment: 'Dịch vụ chà gót rất thoải mái, gót chân mình bớt nứt nẻ hẳn.' },
            { customerIdx: 2, serviceIdxs: [8, 14], staffIdx: 1, dayOffset: -25, time: '14:00', status: 'completed' as const, rating: 4, comment: 'Úp móng gel mỏng nhẹ tự nhiên, hiệu ứng mắt mèo độc đáo.' },
            { customerIdx: 3, serviceIdxs: [19], staffIdx: 0, dayOffset: -24, time: '15:00', status: 'completed' as const, rating: 5, comment: 'Combo spa quá đáng đồng tiền bát gạo. Phòng ốc sạch sẽ mát mẻ.' },
            { customerIdx: 4, serviceIdxs: [0], staffIdx: 3, dayOffset: -22, time: '11:30', status: 'completed' as const, rating: 4, comment: 'Anna cắt da nhẹ tay, không bị chảy máu hay đau rát.' },
            { customerIdx: 5, serviceIdxs: [5], staffIdx: 2, dayOffset: -20, time: '16:00', status: 'completed' as const, rating: 5, comment: 'Sơn gel chân đều bóng loáng. Sẽ tiếp tục ủng hộ David.' },
            { customerIdx: 6, serviceIdxs: [9, 17], staffIdx: 0, dayOffset: -18, time: '13:00', status: 'completed' as const, rating: 5, comment: 'Đắp bột chắc chắn, đính đá lộng lẫy cực kỳ hợp đi tiệc!' },
            { customerIdx: 7, serviceIdxs: [2, 15], staffIdx: 1, dayOffset: -17, time: '10:30', status: 'completed' as const, rating: 4, comment: 'Mani spa và vẽ cơ bản tỉ mỉ. Rất thích Elena vẽ cúc họa mi.' },
            { customerIdx: 8, serviceIdxs: [18], staffIdx: 3, dayOffset: -15, time: '09:00', status: 'completed' as const, rating: 5, comment: 'Gói gel tay chân giá tốt, làm kỹ càng sạch da móng.' },
            { customerIdx: 9, serviceIdxs: [7], staffIdx: 2, dayOffset: -14, time: '14:30', status: 'completed' as const, rating: 5, comment: 'Trị liệu foot đá nóng siêu sảng khoái, giảm hẳn mỏi chân.' },
            { customerIdx: 10, serviceIdxs: [1, 16], staffIdx: 0, dayOffset: -12, time: '15:30', status: 'completed' as const, rating: 5, comment: 'Vẽ tả thực bông hồng tuyệt phẩm. Sarah quá tài hoa.' },
            { customerIdx: 11, serviceIdxs: [10], staffIdx: 1, dayOffset: -10, time: '11:00', status: 'completed' as const, rating: 4, comment: 'Elena đắp gel cứng đều đặn, giữ móng chắc chắn.' },
            { customerIdx: 12, serviceIdxs: [3], staffIdx: 2, dayOffset: -8, time: '17:00', status: 'completed' as const, rating: 5, comment: 'Ủ paraffin nóng thư giãn, tay mềm mại như em bé.' },
            { customerIdx: 13, serviceIdxs: [6], staffIdx: 3, dayOffset: -6, time: '13:30', status: 'completed' as const, rating: 3, comment: 'Dịch vụ tạm được nhưng thợ làm móng hơi vội, không chà kỹ gót.' },
            { customerIdx: 14, serviceIdxs: [8, 17], staffIdx: 0, dayOffset: -5, time: '10:00', status: 'completed' as const, rating: 5, comment: 'Gel-X úp cực chuẩn phom, gắn đá sang lấp lánh.' },
            { customerIdx: 0, serviceIdxs: [19], staffIdx: 2, dayOffset: -4, time: '16:00', status: 'completed' as const, rating: 5, comment: 'Tiệm phục vụ nước ép bưởi ngon, massage chân siêu phê.' },
            { customerIdx: 1, serviceIdxs: [1, 15], staffIdx: 1, dayOffset: -3, time: '14:00', status: 'completed' as const, rating: 4, comment: 'Thiết kế đẹp mắt, giá cả minh bạch rõ ràng.' },
            { customerIdx: 2, serviceIdxs: [5], staffIdx: 3, dayOffset: -2, time: '09:30', status: 'completed' as const, rating: 5, comment: 'Cảm ơn Anna nhé, sơn móng chân rất gọn gàng sạch đẹp.' },

            // Today In-Progress Appointments
            { customerIdx: 3, serviceIdxs: [2], staffIdx: 0, dayOffset: 0, time: '14:00', status: 'in-progress' as const, rating: null, comment: null },
            { customerIdx: 4, serviceIdxs: [6], staffIdx: 2, dayOffset: 0, time: '15:30', status: 'in-progress' as const, rating: null, comment: null },

            // Confirmed Appointments (Today / Future)
            { customerIdx: 5, serviceIdxs: [8, 14], staffIdx: 1, dayOffset: 0, time: '17:00', status: 'confirmed' as const, rating: null, comment: null },
            { customerIdx: 6, serviceIdxs: [19], staffIdx: 2, dayOffset: 1, time: '10:00', status: 'confirmed' as const, rating: null, comment: null },
            { customerIdx: 7, serviceIdxs: [1, 13], staffIdx: 0, dayOffset: 2, time: '14:30', status: 'confirmed' as const, rating: null, comment: null },
            { customerIdx: 8, serviceIdxs: [9, 17], staffIdx: 1, dayOffset: 3, time: '11:00', status: 'confirmed' as const, rating: null, comment: null },
            { customerIdx: 14, serviceIdxs: [18], staffIdx: 3, dayOffset: 4, time: '16:00', status: 'confirmed' as const, rating: null, comment: null },

            // Pending Appointments (Future)
            { customerIdx: 9, serviceIdxs: [18], staffIdx: 3, dayOffset: 1, time: '09:30', status: 'pending' as const, rating: null, comment: null },
            { customerIdx: 10, serviceIdxs: [7], staffIdx: 2, dayOffset: 2, time: '15:00', status: 'pending' as const, rating: null, comment: null },
            { customerIdx: 11, serviceIdxs: [1, 16], staffIdx: 0, dayOffset: 4, time: '13:00', status: 'pending' as const, rating: null, comment: null },
            { customerIdx: 12, serviceIdxs: [10], staffIdx: 1, dayOffset: 5, time: '16:00', status: 'pending' as const, rating: null, comment: null },

            // Cancelled Appointments
            { customerIdx: 13, serviceIdxs: [8, 17], staffIdx: 0, dayOffset: -10, time: '14:00', status: 'cancelled' as const, rating: null, comment: null },
            { customerIdx: 14, serviceIdxs: [19], staffIdx: 2, dayOffset: -12, time: '10:30', status: 'cancelled' as const, rating: null, comment: null },
            { customerIdx: 0, serviceIdxs: [9], staffIdx: 1, dayOffset: -15, time: '11:00', status: 'cancelled' as const, rating: null, comment: null },
            { customerIdx: 1, serviceIdxs: [6], staffIdx: 3, dayOffset: -20, time: '15:00', status: 'cancelled' as const, rating: null, comment: null },
        ];

        console.log(`Processing ${appointmentTemplates.length} appointment entries...`);

        for (const t of appointmentTemplates) {
            const customer = seededCustomers[t.customerIdx];
            const staffMemberSelected = staffProfiles[t.staffIdx];
            
            // Calculate total price and duration dynamically
            const totalPriceBooking = t.serviceIdxs.reduce((sum: number, idx: number) => sum + parseFloat(createdServices[idx].price), 0);
            const totalDurationBooking = t.serviceIdxs.reduce((sum: number, idx: number) => sum + createdServices[idx].duration, 0);

            // Insert single Appointment
            const [apt] = await db.insert(appointments).values({
                customerId: customer.id,
                customerName: customer.name,
                customerPhone: customer.phone,
                notes: `Đặt lịch dịch vụ: ${t.serviceIdxs.map(idx => createdServices[idx].name).join(', ')}`,
                appointmentDate: getRelativeDate(t.dayOffset),
                appointmentTime: t.time,
                status: t.status,
                priceAtBooking: totalPriceBooking.toString(),
                durationAtBooking: totalDurationBooking,
                isOvertime: false,
                reviewToken: t.status === 'completed' ? Math.random().toString(36).substring(7) : null,
            }).returning();

            // Insert Appointment Services
            for (const sIdx of t.serviceIdxs) {
                const service = createdServices[sIdx];
                await db.insert(appointmentServices).values({
                    appointmentId: apt.id,
                    serviceId: service.id,
                    staffId: staffMemberSelected.id,
                    priceAtBooking: service.price,
                    commissionPercentage: '10.00', // 10% hoa hồng cho thợ
                    workShare: '100.00',
                });
            }

            // Insert Review if completed and rating is provided
            if (t.status === 'completed' && t.rating !== null) {
                await db.insert(reviews).values({
                    appointmentId: apt.id,
                    staffId: staffMemberSelected.id,
                    rating: t.rating,
                    comment: t.comment || '',
                });
            }
        }

        console.log(`✅ Appointments, Services, and Reviews seeded successfully (${appointmentTemplates.length} appointments created)`);

        // 9. Admin Notifications
        console.log('🔔 Seeding admin notifications...');
        await db.insert(adminNotifications).values([
            { title: 'Lịch hẹn mới cần xác nhận', message: `Khách hàng Lý Gia Hân đã đặt Combo Sơn Gel lúc 09:30 ngày mai.`, isRead: false },
            { title: 'Khách hàng đánh giá 5 sao', message: `Khách hàng Lê Thị Mai đã gửi đánh giá 5 sao cho Sarah Nguyễn.`, isRead: false },
            { title: 'Lịch hẹn bị hủy', message: `Lịch hẹn lúc 10:30 của khách hàng Trịnh Quốc Bảo đã được hủy thành công.`, isRead: true },
            { title: 'Lịch hẹn mới cần xác nhận', message: `Khách hàng Đỗ Hải Yến đã gửi yêu cầu đặt lịch dịch vụ Trị Liệu Foot Spa.`, isRead: false },
            { title: 'Lịch làm việc cập nhật', message: `Lịch trực tuần mới của nhân viên đã được bộ phận nhân sự phê duyệt.`, isRead: true },
            { title: 'Đánh giá thợ mỏ', message: `Nhân viên David Lê vừa nhận đánh giá 5 sao kèm bình luận khen ngợi từ khách hàng Nguyễn Văn Nam.`, isRead: false },
        ]);
        console.log('✅ Admin notifications seeded');

        console.log('🎉 Database seeding completed successfully! All tables loaded with high quality dynamic data.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
    }
}

seed();
