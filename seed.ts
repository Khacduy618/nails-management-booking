import { db } from './db/index.js';
import {
  serviceCategories,
  staff,
  services,
  staffServices,
  appointments,
  staffSchedules,
  appointmentServices,
  payrolls
} from './db/schema.js';
import type { InferInsertModel } from 'drizzle-orm';

// Định nghĩa kiểu dữ liệu để chèn
type NewServiceCategory = InferInsertModel<typeof serviceCategories>;
type NewStaff = InferInsertModel<typeof staff>;
type NewService = InferInsertModel<typeof services>;
type NewStaffService = InferInsertModel<typeof staffServices>;
type NewAppointment = InferInsertModel<typeof appointments>;
type NewStaffSchedule = InferInsertModel<typeof staffSchedules>;
type NewAppointmentService = InferInsertModel<typeof appointmentServices>;
type NewPayroll = InferInsertModel<typeof payrolls>;


async function seed() {
  console.log('Seeding database...');

  // Xóa dữ liệu cũ
  console.log('Clearing old data...');
  await db.delete(appointments);
  await db.delete(appointmentServices);
  await db.delete(payrolls);
  await db.delete(staffServices);
  await db.delete(services);
  await db.delete(staffSchedules);
  await db.delete(staff);
  await db.delete(serviceCategories);

  // 1. Chèn danh mục
  console.log('Inserting service categories...');

  // Danh sách category hoạt động (active)
  const activeCategoryValues: NewServiceCategory[] = [
    { name: 'Cắt tóc nam', description: 'Cắt tóc kiểu dáng hiện đại cho nam giới' },
    { name: 'Cắt tóc nữ', description: 'Cắt tóc các kiểu cho phụ nữ' },
    { name: 'Nhuộm tóc', description: 'Nhuộm tóc các màu đẹp từ chuyên gia' },
    { name: 'Uốn tóc', description: 'Dịch vụ uốn tóc mềm và xoăn' },
    { name: 'Massage thư giãn', description: 'Massage toàn thân thư giãn cơ thể' },
    { name: 'Massage vai gáy', description: 'Massage đặc biệt cho vai gáy căng thẳng' },
    { name: 'Làm móng tay', description: 'Chăm sóc và làm đẹp móng tay' },
    { name: 'Làm móng chân', description: 'Chăm sóc móng chân hoàn toàn' },
    { name: 'Skin care cơ bản', description: 'Chăm sóc da mặt quy trình cơ bản' },
    { name: 'Skin care nâng cao', description: 'Chăm sóc da nâng cao với công nghệ mới' },
    { name: 'Trị mụn', description: 'Điều trị mụn an toàn hiệu quả' },
    { name: 'Tẩy tế bào chết', description: 'Tẩy tế bào chết để da sáng mịn' },
    { name: 'Đắp mặt nạ', description: 'Đắp mặt nạ dưỡng ẩm chuyên sâu' },
    { name: 'Chăm sóc body', description: 'Chăm sóc toàn bộ cơ thể' },
    { name: 'Waxing/Shaving', description: 'Tẩy lông an toàn từ chuyên gia' },
    { name: 'Nhuộm lông mày', description: 'Nhuộm và định hình lông mày' },
    { name: 'Dệt lông mày', description: 'Dệt lông mày theo kiểu mong muốn' },
    { name: 'Trang điểm cá nhân', description: 'Trang điểm tự nhiên theo yêu cầu' },
    { name: 'Trang điểm cô dâu', description: 'Trang điểm cô dâu hoàn hảo' },
    { name: 'Tẩy sạch lông mặt', description: 'Tẩy sạch lông mặt bằng công nghệ' },
    { name: 'Làm sáng da', description: 'Làm sáng da mặt toàn diện' },
    { name: 'Điều trị nếp nhăn', description: 'Giảm nếp nhăn trên khuôn mặt' },
    { name: 'Spa chân tay', description: 'Spa toàn bộ chân tay chuyên sâu' },
    { name: 'Gội đầu massage', description: 'Gội đầu kèm massage thư giãn' },
    { name: 'Hấp tóc trị liệu', description: 'Hấp tóc phục hồi tóc hư tổn' },
    { name: 'Cắt tóc bé', description: 'Cắt tóc an toàn cho trẻ em' },
    { name: 'Cắt tóc cho ông bà', description: 'Cắt tóc đặc biệt cho ông bà' },
    { name: 'Nối tóc', description: 'Nối tóc để tăng độ dài' },
    { name: 'Duỗi tóc', description: 'Duỗi tóc bằng công nghệ hiện đại' },
    { name: 'Spa mặt chuyên sâu', description: 'Spa mặt quy trình chuyên sâu 2 tiếng' },
    { name: 'Xóa hình xăm', description: 'Xóa hình xăm bằng công nghệ laser' },
    { name: 'Điều trị da nhạy cảm', description: 'Điều trị và chăm sóc da nhạy cảm' },
    { name: 'Đơn giản hóa da', description: 'Quy trình chăm sóc da đơn giản' },
  ];

  // Danh sách category không hoạt động (inactive) - các dịch vụ cũ/deprecated
  const inactiveCategoryValues: NewServiceCategory[] = [
    {
      name: 'Dịch vụ cắt tóc bằng kéo cổ điển',
      description: 'Dịch vụ cũ - không còn sử dụng',
      status: 'inactive'
    },
    {
      name: 'Nhuộm tóc bằng hóa chất cũ',
      description: 'Công thức cũ - đã thay thế bằng hóa chất mới',
      status: 'inactive'
    },
    {
      name: 'Massage truyền thống cổ điển',
      description: 'Dịch vụ deprecated - thay bằng phương pháp mới',
      status: 'inactive'
    },
    {
      name: 'Skincare bằng phương pháp cũ',
      description: 'Không còn phổ biến - đã ngừng cung cấp',
      status: 'inactive'
    },
    {
      name: 'Làm móng tay bằng sơn thường',
      description: 'Dịch vụ cũ - nâng cấp thành gel/acryl',
      status: 'inactive'
    },
    {
      name: 'Tẩy lông tay công thức cũ',
      description: 'Công thức cũ - không còn sử dụng',
      status: 'inactive'
    },
    {
      name: 'Gói chăm sóc toàn thân 2023',
      description: 'Gói cũ - đã thay thế bằng gói mới 2024',
      status: 'inactive'
    },
    {
      name: 'Massage bấm huyệt cổ xưa',
      description: 'Kỹ thuật cũ - nâng cấp thành phương pháp mới',
      status: 'inactive'
    },
    {
      name: 'Uốn tóc bằng kẽm nóng',
      description: 'Công nghệ cũ - thay bằng công nghệ mới',
      status: 'inactive'
    },
    {
      name: 'Trang điểm kinh điển quá cũ',
      description: 'Phong cách cũ - không còn phù hợp',
      status: 'inactive'
    },
    {
      name: 'Trị mụn bằng phương pháp cũ',
      description: 'Phương pháp cũ - nâng cấp công nghệ mới',
      status: 'inactive'
    },
  ];

  // Danh sách category đã xóa (deleted) - trong thùng rác
  const now = new Date();
  const deletedCategoryValues: NewServiceCategory[] = [
    {
      name: 'Dịch vụ thử nghiệm hè 2024',
      description: 'Dịch vụ thử nghiệm - không được chấp nhận',
      status: 'deleted',
      deletedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) // 15 ngày trước
    },
    {
      name: 'Chương trình Beta test',
      description: 'Chương trình thử nghiệm - đã hủy',
      status: 'deleted',
      deletedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) // 20 ngày trước
    },
    {
      name: 'Gói khuyến mãi đặc biệt',
      description: 'Gói khuyến mãi hết hạn - xóa khỏi hệ thống',
      status: 'deleted',
      deletedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000) // 25 ngày trước
    },
    {
      name: 'Dịch vụ ngoại lệ không sử dụng',
      description: 'Dịch vụ tạm thời - đã loại bỏ',
      status: 'deleted',
      deletedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 ngày trước
    },
    {
      name: 'Thử nghiệm công nghệ mới',
      description: 'Dịch vụ thử công nghệ mới - không tiếp tục',
      status: 'deleted',
      deletedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 ngày trước
    },
  ];

  // Gộp tất cả category values
  const categoryValues: NewServiceCategory[] = [
    ...activeCategoryValues,
    ...inactiveCategoryValues,
    ...deletedCategoryValues,
  ];

  await db.insert(serviceCategories).values(categoryValues);
  const categories = await db.select().from(serviceCategories);

  console.log(`✓ Inserted ${activeCategoryValues.length} active categories`);
  console.log(`✓ Inserted ${inactiveCategoryValues.length} inactive categories`);
  console.log(`✓ Inserted ${deletedCategoryValues.length} deleted categories`);
  console.log(`✓ Total: ${categoryValues.length} categories`);

  // 2. Chèn nhân viên
  console.log('Inserting staff...');
  const staffValues: NewStaff[] = [
    { name: 'Nguyễn Thị Mai', email: 'mai.nt@example.com', phone: '0901112221', position: 'Chuyên viên tóc', specialties: ["Cắt", "Nhuộm", "Uốn"], experience: '5 năm', status: 'active', joinDate: new Date('2022-01-15') },
    { name: 'Trần Văn Đức', email: 'duc.tv@example.com', phone: '0901112222', position: 'Chuyên viên massage', specialties: ["Massage Thái", "Massage đá nóng"], experience: '3 năm', status: 'active', joinDate: new Date('2022-01-15') },
    { name: 'Lê Thị Hoa', email: 'hoa.lt@example.com', phone: '0901112223', position: 'Chuyên viên chăm sóc da', specialties: ["Trị mụn", "Làm trắng"], experience: '4 năm', status: 'active', joinDate: new Date('2022-01-15') },
    { name: 'Phạm Anh Tuấn', email: 'tuan.pa@example.com', phone: '0901112224', position: 'Thợ làm móng', specialties: ["Sơn gel", "Đắp bột"], experience: '2 năm', status: 'active', joinDate: new Date('2022-01-15') },
  ];
  await db.insert(staff).values(staffValues);
  const staffMembers = await db.select().from(staff);

  // 3. Chèn dịch vụ
  console.log('Inserting services...');
  const serviceValues: NewService[] = [
    // Tóc (Hair)
    { name: 'Cắt tóc nam cơ bản', description: 'Cắt tóc nam theo yêu cầu', price: '150000', duration: 60, imageUrl: '/images/haircut-service.png', popular: true, categoryId: categories[0].id },
    { name: 'Nhuộm tóc thời trang', description: 'Nhuộm màu tóc theo xu hướng', price: '350000', duration: 120, imageUrl: '/images/hair-coloring-service.png', popular: true, categoryId: categories[0].id },
    { name: 'Uốn tóc xoăn', description: 'Uốn tóc xoăn sóng hoặc duỗi', price: '400000', duration: 150, imageUrl: '/images/perm-service.png', popular: true, categoryId: categories[0].id },
    { name: 'Cắt tóc nữ', description: 'Cắt tóc nữ kiểu dáng mới', price: '200000', duration: 90, imageUrl: '/images/womens-cut.png', popular: true, categoryId: categories[0].id },

    // Da (Skin)
    { name: 'Chăm sóc da mặt cơ bản', description: 'Làm sạch sâu, tẩy tế bào chết', price: '200000', duration: 90, imageUrl: '/images/facial-treatment-service.png', popular: true, categoryId: categories[1].id },
    { name: 'Trị mụn chuyên sâu', description: 'Điều trị mụn bằng công nghệ hiện đại', price: '350000', duration: 120, imageUrl: '/images/acne-treatment.png', popular: true, categoryId: categories[1].id },
    { name: 'Làm trắng da', description: 'Trị liệu làm trắng da toàn thân', price: '500000', duration: 90, imageUrl: '/images/whitening.png', popular: false, categoryId: categories[1].id },

    // Massage
    { name: 'Massage toàn thân thư giãn', description: 'Giảm căng thẳng, mệt mỏi', price: '300000', duration: 75, imageUrl: '/images/massage-service.png', popular: true, categoryId: categories[2].id },
    { name: 'Massage Thái truyền thống', description: 'Massage Thái xứ sở với các kỹ thuật truyền thống', price: '350000', duration: 90, imageUrl: '/images/thai-massage.png', popular: true, categoryId: categories[2].id },
    { name: 'Massage đầu & vai gáy', description: 'Massage chuyên biệt cho đầu, vai, gáy', price: '200000', duration: 60, imageUrl: '/images/head-massage.png', popular: true, categoryId: categories[2].id },

    // Móng (Nails)
    { name: 'Sơn gel OPI', description: 'Sơn gel thương hiệu OPI cao cấp', price: '250000', duration: 60, imageUrl: '/images/gel-polish-service.png', popular: true, categoryId: categories[3].id },
    { name: 'Sơn gel Shellac', description: 'Sơn gel Shellac bền màu lên đến 2-3 tuần', price: '280000', duration: 60, imageUrl: '/images/shellac.png', popular: true, categoryId: categories[3].id },
    { name: 'Nail art nổi bật', description: 'Vẽ nail art sáng tạo theo ý muốn', price: '320000', duration: 90, imageUrl: '/images/nail-art.png', popular: true, categoryId: categories[3].id },
    { name: 'Làm đẹp móng tay', description: 'Chăm sóc, cắt, sửa móng tay', price: '180000', duration: 45, imageUrl: '/images/nail-care.png', popular: false, categoryId: categories[3].id },
  ];
  await db.insert(services).values(serviceValues);
  const serviceItems = await db.select().from(services);

  // 4. Liên kết nhân viên - dịch vụ
  console.log('Linking staff to services...');
  const staffServiceValues: NewStaffService[] = [
    // Mai - Tóc (0, 1, 2, 3)
    { staffId: staffMembers[0].id, serviceId: serviceItems[0].id },
    { staffId: staffMembers[0].id, serviceId: serviceItems[1].id },
    { staffId: staffMembers[0].id, serviceId: serviceItems[2].id },
    { staffId: staffMembers[0].id, serviceId: serviceItems[3].id },

    // Đức - Massage (7, 8, 9)
    { staffId: staffMembers[1].id, serviceId: serviceItems[7].id },
    { staffId: staffMembers[1].id, serviceId: serviceItems[8].id },
    { staffId: staffMembers[1].id, serviceId: serviceItems[9].id },

    // Hoa - Da (4, 5, 6)
    { staffId: staffMembers[2].id, serviceId: serviceItems[4].id },
    { staffId: staffMembers[2].id, serviceId: serviceItems[5].id },
    { staffId: staffMembers[2].id, serviceId: serviceItems[6].id },

    // Tuấn - Móng (10, 11, 12, 13)
    { staffId: staffMembers[3].id, serviceId: serviceItems[10].id },
    { staffId: staffMembers[3].id, serviceId: serviceItems[11].id },
    { staffId: staffMembers[3].id, serviceId: serviceItems[12].id },
    { staffId: staffMembers[3].id, serviceId: serviceItems[13].id },
  ];
  await db.insert(staffServices).values(staffServiceValues);

  // 5. Chèn lịch làm của nhân viên (Staff Schedules)
  console.log('Inserting staff schedules...');
  const staffScheduleValues: NewStaffSchedule[] = [
    // Nguyễn Thị Mai (Chuyên viên tóc) - Làm Thứ 2 đến Thứ 7, Nghỉ Chủ nhật
    { staffId: staffMembers[0].id, dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[0].id, dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[0].id, dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[0].id, dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[0].id, dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[0].id, dayOfWeek: 6, startTime: '09:00', endTime: '17:00' },

    // Trần Văn Đức (Chuyên viên massage) - Làm Thứ 2 đến Chủ nhật
    { staffId: staffMembers[1].id, dayOfWeek: 1, startTime: '14:00', endTime: '18:00' },
    { staffId: staffMembers[1].id, dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[1].id, dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[1].id, dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[1].id, dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[1].id, dayOfWeek: 6, startTime: '10:00', endTime: '19:00' },
    { staffId: staffMembers[1].id, dayOfWeek: 0, startTime: '10:00', endTime: '17:00' },

    // Lê Thị Hoa (Chuyên viên chăm sóc da) - Làm Thứ 3 đến Chủ nhật, Nghỉ Thứ 2
    { staffId: staffMembers[2].id, dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[2].id, dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[2].id, dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[2].id, dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[2].id, dayOfWeek: 6, startTime: '09:00', endTime: '17:00' },
    { staffId: staffMembers[2].id, dayOfWeek: 0, startTime: '10:00', endTime: '16:00' },

    // Phạm Anh Tuấn (Thợ làm móng) - Làm cả tuần
    { staffId: staffMembers[3].id, dayOfWeek: 0, startTime: '10:00', endTime: '16:00' },
    { staffId: staffMembers[3].id, dayOfWeek: 1, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[3].id, dayOfWeek: 2, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[3].id, dayOfWeek: 3, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[3].id, dayOfWeek: 4, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[3].id, dayOfWeek: 5, startTime: '09:00', endTime: '18:00' },
    { staffId: staffMembers[3].id, dayOfWeek: 6, startTime: '09:00', endTime: '17:00' },
  ];
  await db.insert(staffSchedules).values(staffScheduleValues);

  // 6. Chèn lịch hẹn
  console.log('Inserting appointments...');

  // Hàm để tạo ngày trong quá khứ và tương lai
  const createDateWithTime = (daysOffset: number, timeStr: string) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const appointmentValues: NewAppointment[] = [
    // Dữ liệu quá khứ (hoàn thành) - 30 ngày
    { customerName: 'Trần Thị Bích', customerPhone: '0987654321', notes: 'Cắt layer', appointmentDate: createDateWithTime(-30, '10:00'), appointmentTime: '10:00:00', status: 'completed', priceAtBooking: '150000', durationAtBooking: 60 },
    { customerName: 'Lê Minh Hoàng', customerPhone: '0912345678', notes: '', appointmentDate: createDateWithTime(-28, '14:30'), appointmentTime: '14:30:00', status: 'completed', priceAtBooking: '300000', durationAtBooking: 75 },
    { customerName: 'Phạm Quỳnh Anh', customerPhone: '0334455667', notes: 'Da em nhạy cảm', appointmentDate: createDateWithTime(-27, '16:00'), appointmentTime: '16:00:00', status: 'completed', priceAtBooking: '200000', durationAtBooking: 90 },
    { customerName: 'Võ Thanh Tùng', customerPhone: '0345566778', notes: '', appointmentDate: createDateWithTime(-26, '09:30'), appointmentTime: '09:30:00', status: 'completed', priceAtBooking: '250000', durationAtBooking: 60 },
    { customerName: 'Nguyễn Hữu Phát', customerPhone: '0356677889', notes: 'Cắt kiểu nam', appointmentDate: createDateWithTime(-25, '11:00'), appointmentTime: '11:00:00', status: 'completed', priceAtBooking: '150000', durationAtBooking: 60 },
    { customerName: 'Tạ Minh Châu', customerPhone: '0367788990', notes: '', appointmentDate: createDateWithTime(-24, '15:00'), appointmentTime: '15:00:00', status: 'completed', priceAtBooking: '350000', durationAtBooking: 90 },
    { customerName: 'Đặng Thảo Nhi', customerPhone: '0378899001', notes: 'Uốn xoăn', appointmentDate: createDateWithTime(-23, '13:30'), appointmentTime: '13:30:00', status: 'completed', priceAtBooking: '400000', durationAtBooking: 120 },
    { customerName: 'Hoàng Văn Sơn', customerPhone: '0389900112', notes: '', appointmentDate: createDateWithTime(-22, '10:00'), appointmentTime: '10:00:00', status: 'completed', priceAtBooking: '200000', durationAtBooking: 60 },
    { customerName: 'Lưu Thị Giang', customerPhone: '0390011223', notes: 'Chăm sóc da sau sinh', appointmentDate: createDateWithTime(-21, '14:00'), appointmentTime: '14:00:00', status: 'completed', priceAtBooking: '250000', durationAtBooking: 75 },
    { customerName: 'Bùi Minh Quân', customerPhone: '0301122334', notes: '', appointmentDate: createDateWithTime(-20, '16:30'), appointmentTime: '16:30:00', status: 'completed', priceAtBooking: '300000', durationAtBooking: 90 },

    // Tiếp tục dữ liệu quá khứ
    { customerName: 'Trần Hồng Diệu', customerPhone: '0312233445', notes: 'Nail gel OPI', appointmentDate: createDateWithTime(-19, '11:00'), appointmentTime: '11:00:00', status: 'completed', priceAtBooking: '280000', durationAtBooking: 75 },
    { customerName: 'Phan Văn Hải', customerPhone: '0323344556', notes: '', appointmentDate: createDateWithTime(-18, '09:00'), appointmentTime: '09:00:00', status: 'completed', priceAtBooking: '150000', durationAtBooking: 60 },
    { customerName: 'Đỗ Thanh Hương', customerPhone: '0334455667', notes: 'Massage Thái', appointmentDate: createDateWithTime(-17, '15:30'), appointmentTime: '15:30:00', status: 'completed', priceAtBooking: '400000', durationAtBooking: 120 },
    { customerName: 'Ngô Tú Quyên', customerPhone: '0345566778', notes: '', appointmentDate: createDateWithTime(-16, '13:00'), appointmentTime: '13:00:00', status: 'completed', priceAtBooking: '200000', durationAtBooking: 60 },
    { customerName: 'Hồ Chí Minh', customerPhone: '0356677889', notes: 'Trị mụn', appointmentDate: createDateWithTime(-15, '10:30'), appointmentTime: '10:30:00', status: 'completed', priceAtBooking: '300000', durationAtBooking: 90 },
    { customerName: 'Kiều Vân Anh', customerPhone: '0367788990', notes: '', appointmentDate: createDateWithTime(-14, '14:30'), appointmentTime: '14:30:00', status: 'completed', priceAtBooking: '350000', durationAtBooking: 75 },
    { customerName: 'Vương Thái Hà', customerPhone: '0378899001', notes: 'Nhuộm tóc', appointmentDate: createDateWithTime(-13, '11:00'), appointmentTime: '11:00:00', status: 'completed', priceAtBooking: '450000', durationAtBooking: 120 },
    { customerName: 'Bàn Thị Hạnh', customerPhone: '0389900112', notes: '', appointmentDate: createDateWithTime(-12, '16:00'), appointmentTime: '16:00:00', status: 'completed', priceAtBooking: '280000', durationAtBooking: 75 },
    { customerName: 'Tây Hồ Khánh', customerPhone: '0390011223', notes: 'Massage toàn thân', appointmentDate: createDateWithTime(-11, '09:30'), appointmentTime: '09:30:00', status: 'completed', priceAtBooking: '320000', durationAtBooking: 90 },
    { customerName: 'Giang Sơn Tây', customerPhone: '0301122334', notes: '', appointmentDate: createDateWithTime(-10, '13:30'), appointmentTime: '13:30:00', status: 'completed', priceAtBooking: '150000', durationAtBooking: 60 },

    // Dữ liệu gần đây - mix status
    { customerName: 'Lý Thái Bình', customerPhone: '0312233445', notes: '', appointmentDate: createDateWithTime(-5, '10:00'), appointmentTime: '10:00:00', status: 'completed', priceAtBooking: '150000', durationAtBooking: 60 },
    { customerName: 'Cơ Lôi Khánh', customerPhone: '0323344556', notes: 'Làm đẹp móng', appointmentDate: createDateWithTime(-3, '14:00'), appointmentTime: '14:00:00', status: 'completed', priceAtBooking: '250000', durationAtBooking: 75 },
    { customerName: 'Tự Dân Ái', customerPhone: '0334455667', notes: '', appointmentDate: createDateWithTime(-2, '11:30'), appointmentTime: '11:30:00', status: 'confirmed', priceAtBooking: '300000', durationAtBooking: 90 },

    // Dữ liệu tương lai - pending/confirmed
    { customerName: 'Nguyễn Thị Lựu', customerPhone: '0345566778', notes: 'Cắt tóc nữ', appointmentDate: createDateWithTime(2, '09:00'), appointmentTime: '09:00:00', status: 'confirmed', priceAtBooking: '180000', durationAtBooking: 60 },
    { customerName: 'Sở Thị Thanh', customerPhone: '0356677889', notes: '', appointmentDate: createDateWithTime(3, '15:00'), appointmentTime: '15:00:00', status: 'pending', priceAtBooking: '400000', durationAtBooking: 120 },
    { customerName: 'Điềm Thị Sáng', customerPhone: '0367788990', notes: 'Nhuộm + uốn', appointmentDate: createDateWithTime(5, '10:30'), appointmentTime: '10:30:00', status: 'pending', priceAtBooking: '600000', durationAtBooking: 150 },
    { customerName: 'Linh Thị Mộc', customerPhone: '0378899001', notes: '', appointmentDate: createDateWithTime(7, '13:00'), appointmentTime: '13:00:00', status: 'confirmed', priceAtBooking: '300000', durationAtBooking: 90 },
    { customerName: 'Thảo Thị Yến', customerPhone: '0389900112', notes: 'Massage đầu vai gáy', appointmentDate: createDateWithTime(8, '16:30'), appointmentTime: '16:30:00', status: 'pending', priceAtBooking: '250000', durationAtBooking: 60 },
    { customerName: 'Hương Thị Thùy', customerPhone: '0390011223', notes: '', appointmentDate: createDateWithTime(10, '11:00'), appointmentTime: '11:00:00', status: 'confirmed', priceAtBooking: '280000', durationAtBooking: 75 },
  ];
  await db.insert(appointments).values(appointmentValues);
  const appointmentItems = await db.select().from(appointments);

  // 7. Liên kết dịch vụ với lịch hẹn (Appointment Services)
  console.log('Linking services to appointments...');
  const appointmentServiceValues: NewAppointmentService[] = [
    // Appointment 0: Cắt tóc nam - Mai (Staff 0, Service 0)
    { appointmentId: appointmentItems[0].id, serviceId: serviceItems[0].id, staffId: staffMembers[0].id, priceAtBooking: '150000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 1: Massage toàn thân - Đức (Staff 1, Service 7)
    { appointmentId: appointmentItems[1].id, serviceId: serviceItems[7].id, staffId: staffMembers[1].id, priceAtBooking: '300000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 2: Chăm sóc da - Hoa (Staff 2, Service 4)
    { appointmentId: appointmentItems[2].id, serviceId: serviceItems[4].id, staffId: staffMembers[2].id, priceAtBooking: '200000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 3: Cắt tóc nam - Mai (Service 0)
    { appointmentId: appointmentItems[3].id, serviceId: serviceItems[0].id, staffId: staffMembers[0].id, priceAtBooking: '250000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 4: Cắt tóc nam - Mai (Service 0)
    { appointmentId: appointmentItems[4].id, serviceId: serviceItems[0].id, staffId: staffMembers[0].id, priceAtBooking: '150000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 5: Massage Thái - Đức (Service 8)
    { appointmentId: appointmentItems[5].id, serviceId: serviceItems[8].id, staffId: staffMembers[1].id, priceAtBooking: '350000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 6: Uốn tóc - Mai (Service 2)
    { appointmentId: appointmentItems[6].id, serviceId: serviceItems[2].id, staffId: staffMembers[0].id, priceAtBooking: '400000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 7: Chăm sóc da - Hoa (Service 4)
    { appointmentId: appointmentItems[7].id, serviceId: serviceItems[4].id, staffId: staffMembers[2].id, priceAtBooking: '200000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 8: Trị mụn - Hoa (Service 5)
    { appointmentId: appointmentItems[8].id, serviceId: serviceItems[5].id, staffId: staffMembers[2].id, priceAtBooking: '250000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 9: Massage toàn thân - Đức (Service 7)
    { appointmentId: appointmentItems[9].id, serviceId: serviceItems[7].id, staffId: staffMembers[1].id, priceAtBooking: '300000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 10: Sơn gel OPI - Tuấn (Service 10)
    { appointmentId: appointmentItems[10].id, serviceId: serviceItems[10].id, staffId: staffMembers[3].id, priceAtBooking: '280000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 11: Cắt tóc nam - Mai (Service 0)
    { appointmentId: appointmentItems[11].id, serviceId: serviceItems[0].id, staffId: staffMembers[0].id, priceAtBooking: '150000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 12: Massage Thái - Đức (Service 8)
    { appointmentId: appointmentItems[12].id, serviceId: serviceItems[8].id, staffId: staffMembers[1].id, priceAtBooking: '400000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 13: Làm trắng da - Hoa (Service 6)
    { appointmentId: appointmentItems[13].id, serviceId: serviceItems[6].id, staffId: staffMembers[2].id, priceAtBooking: '200000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 14: Trị mụn - Hoa (Service 5)
    { appointmentId: appointmentItems[14].id, serviceId: serviceItems[5].id, staffId: staffMembers[2].id, priceAtBooking: '300000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 15: Nhuộm tóc - Mai (Service 1)
    { appointmentId: appointmentItems[15].id, serviceId: serviceItems[1].id, staffId: staffMembers[0].id, priceAtBooking: '350000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 16: Shellac nail - Tuấn (Service 11)
    { appointmentId: appointmentItems[16].id, serviceId: serviceItems[11].id, staffId: staffMembers[3].id, priceAtBooking: '280000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 17: Massage đầu vai gáy - Đức (Service 9)
    { appointmentId: appointmentItems[17].id, serviceId: serviceItems[9].id, staffId: staffMembers[1].id, priceAtBooking: '320000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 18: Cắt tóc nam - Mai (Service 0)
    { appointmentId: appointmentItems[18].id, serviceId: serviceItems[0].id, staffId: staffMembers[0].id, priceAtBooking: '150000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 19: Uốn tóc - Mai (Service 2)
    { appointmentId: appointmentItems[19].id, serviceId: serviceItems[2].id, staffId: staffMembers[0].id, priceAtBooking: '150000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 20: Cắt tóc nam - Mai (Service 0)
    { appointmentId: appointmentItems[20].id, serviceId: serviceItems[0].id, staffId: staffMembers[0].id, priceAtBooking: '150000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 21: Nail art - Tuấn (Service 12)
    { appointmentId: appointmentItems[21].id, serviceId: serviceItems[12].id, staffId: staffMembers[3].id, priceAtBooking: '250000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 22: Nhuộm tóc - Mai (Service 1)
    { appointmentId: appointmentItems[22].id, serviceId: serviceItems[1].id, staffId: staffMembers[0].id, priceAtBooking: '300000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 23: Cắt tóc nữ - Mai (Service 3)
    { appointmentId: appointmentItems[23].id, serviceId: serviceItems[3].id, staffId: staffMembers[0].id, priceAtBooking: '180000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 24: Uốn tóc - Mai (Service 2)
    { appointmentId: appointmentItems[24].id, serviceId: serviceItems[2].id, staffId: staffMembers[0].id, priceAtBooking: '400000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 25: Nhuộm tóc - Mai (Service 1)
    { appointmentId: appointmentItems[25].id, serviceId: serviceItems[1].id, staffId: staffMembers[0].id, priceAtBooking: '300000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 26: Massage đầu vai gáy - Đức (Service 9)
    { appointmentId: appointmentItems[26].id, serviceId: serviceItems[9].id, staffId: staffMembers[1].id, priceAtBooking: '250000', commissionPercentage: '10.00', workShare: '100.00' },

    // Appointment 27: Chăm sóc da - Hoa (Service 4)
    { appointmentId: appointmentItems[27].id, serviceId: serviceItems[4].id, staffId: staffMembers[2].id, priceAtBooking: '280000', commissionPercentage: '10.00', workShare: '100.00' },
  ];
  await db.insert(appointmentServices).values(appointmentServiceValues);

  // 8. Tính toán và chèn dữ liệu Payroll từ các lịch hẹn hoàn thành
  console.log('Calculating and inserting payrolls...');

  // Grouping appointments by staff and calculating commissions
  interface StaffPayrollData {
    staffId: number;
    totalCommission: number;
    completedAppointments: number;
  }

  const staffPayrollMap = new Map<number, StaffPayrollData>();

  // Calculate commissions for each completed appointment
  for (const appService of appointmentServiceValues) {
    const appointment = appointmentItems.find(a => a.id === appService.appointmentId);
    if (appointment && appointment.status === 'completed' && appService.staffId && appService.priceAtBooking && appService.commissionPercentage) {
      const commission = Math.round(
        (parseFloat(appService.priceAtBooking) * parseFloat(appService.commissionPercentage)) / 100
      );

      const staffId = appService.staffId;
      if (!staffPayrollMap.has(staffId)) {
        staffPayrollMap.set(staffId, {
          staffId,
          totalCommission: 0,
          completedAppointments: 0
        });
      }

      const data = staffPayrollMap.get(staffId)!;
      data.totalCommission += commission;
      data.completedAppointments += 1;
    }
  }

  // Create payroll records for each staff member
  const payrollValues: NewPayroll[] = [];

  // October 2024 payroll (1-31 Oct)
  for (const [staffId, data] of staffPayrollMap) {
    const baseSalary = 5000000; // 5 triệu VND base salary
    const finalSalary = baseSalary + data.totalCommission;

    payrollValues.push({
      staffId,
      payPeriodStart: new Date('2024-10-01'),
      payPeriodEnd: new Date('2024-10-31'),
      baseSalary: baseSalary.toString(),
      totalCommission: data.totalCommission.toString(),
      totalBonus: '0.00',
      totalDeduction: '0.00',
      finalSalary: finalSalary.toString(),
      status: 'paid',
      paymentDate: new Date('2024-11-05'),
      notes: `October 2024: ${data.completedAppointments} completed appointments, Commission: ${data.totalCommission.toLocaleString('vi-VN')}đ`
    });
  }

  // November 2024 payroll with bonus variations
  for (const [staffId, data] of staffPayrollMap) {
    const baseSalary = 5000000;
    let bonus = 0;

    // Add bonus based on staff performance
    if (data.completedAppointments >= 8) {
      bonus = 500000; // 500k bonus for 8+ appointments
    } else if (data.completedAppointments >= 5) {
      bonus = 300000; // 300k bonus for 5+ appointments
    }

    const finalSalary = baseSalary + data.totalCommission + bonus;

    payrollValues.push({
      staffId,
      payPeriodStart: new Date('2024-11-01'),
      payPeriodEnd: new Date('2024-11-30'),
      baseSalary: baseSalary.toString(),
      totalCommission: data.totalCommission.toString(),
      totalBonus: bonus.toString(),
      totalDeduction: '0.00',
      finalSalary: finalSalary.toString(),
      status: 'calculated',
      paymentDate: null,
      notes: `November 2024: ${data.completedAppointments} completed appointments, Bonus: ${bonus.toLocaleString('vi-VN')}đ`
    });
  }

  // September 2024 payroll (previous month)
  for (const [staffId, data] of staffPayrollMap) {
    const baseSalary = 5000000;
    const septemberCommission = Math.round(data.totalCommission * 0.8); // 80% of current commission as estimate
    const finalSalary = baseSalary + septemberCommission;

    payrollValues.push({
      staffId,
      payPeriodStart: new Date('2024-09-01'),
      payPeriodEnd: new Date('2024-09-30'),
      baseSalary: baseSalary.toString(),
      totalCommission: septemberCommission.toString(),
      totalBonus: '0.00',
      totalDeduction: '0.00',
      finalSalary: finalSalary.toString(),
      status: 'paid',
      paymentDate: new Date('2024-10-05'),
      notes: `September 2024: Estimated 18 completed appointments, Commission: ${septemberCommission.toLocaleString('vi-VN')}đ`
    });
  }

  await db.insert(payrolls).values(payrollValues);

  console.log('Database seeding finished successfully!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Failed to seed database:', error);
  process.exit(1);
});