BEGIN;

-- 1. Remove existing sample data (cascades through FK chains)
TRUNCATE TABLE
  appointment_services,
  appointments,
  payrolls,
  staff_base_salaries,
  staff_schedules,
  staff_services,
  services,
  service_categories,
  customers,
  staff,
  users
RESTART IDENTITY CASCADE;

-- 2. Seed users (admin + staff accounts)
INSERT INTO users (id, name, email, phone, password, role, created_at, updated_at) VALUES
  (1, 'Admin Quản Lý', 'admin@nailsalon.com', '0900000000', '$2y$10$5puiMVJAuO39ILpAHtw9/OT/EBmMzZ7MbMmAfU9ztD7kTgV0vbYD2', 'admin', TIMESTAMP '2025-11-18 12:00:00', TIMESTAMP '2025-11-18 12:00:00'),
  (2, 'Nguyễn Thị Mai', 'mai.nt@nailsalon.com', '0901112221', '$2y$10$kLo9jVZrSmGpVzD26CNO3uG9RHTncO36Uc9WX5HOjp2aWqkrG6XWW', 'staff', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-25 05:53:54'),
  (3, 'Trần Văn Đức', 'duc.tv@nailsalon.com', '0901112222', '$2y$10$kLo9jVZrSmGpVzD26CNO3uG9RHTncO36Uc9WX5HOjp2aWqkrG6XWW', 'staff', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (4, 'Lê Thị Hoa', 'hoa.lt@nailsalon.com', '0901112223', '$2y$10$kLo9jVZrSmGpVzD26CNO3uG9RHTncO36Uc9WX5HOjp2aWqkrG6XWW', 'staff', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (5, 'Phạm Anh Tuấn', 'tuan.pa@nailsalon.com', '0901112224', '$2y$10$kLo9jVZrSmGpVzD26CNO3uG9RHTncO36Uc9WX5HOjp2aWqkrG6XWW', 'staff', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (6, 'Vũ Thị Linh', 'linh.vu@nailsalon.com', '0901112225', '$2y$10$kLo9jVZrSmGpVzD26CNO3uG9RHTncO36Uc9WX5HOjp2aWqkrG6XWW', 'staff', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (7, 'Hoàng Thị Hương', 'huong.hoang@nailsalon.com', '0901112226', '$2y$10$kLo9jVZrSmGpVzD26CNO3uG9RHTncO36Uc9WX5HOjp2aWqkrG6XWW', 'staff', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33');

-- 3. Seed staff profiles (Option B: users ↔ staff OneToOne)
INSERT INTO staff (id, user_id, position, specialties, experience, status, avatar_url, join_date, rating, created_at, updated_at) VALUES
  (1, 2, 'Chuyên viên tóc', '["Cắt","Nhuộm","Uốn"]'::jsonb, '5 năm', 'active', '/uploads/manicure-584ec9cb0814.png', DATE '2020-06-15', 4.80, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-23 06:47:31'),
  (2, 3, 'Chuyên viên massage', '["Massage Thái","Massage đá nóng","Massage toàn thân"]'::jsonb, '6 năm', 'active', NULL, DATE '2019-03-20', 4.90, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (3, 4, 'Chuyên viên da liễu', '["Spa mặt","Trị mụn","Làm trắng da"]'::jsonb, '4 năm', 'active', NULL, DATE '2021-08-10', 4.75, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (4, 5, 'Thợ làm móng', '["Sơn gel","Nail art","Đắp acryl"]'::jsonb, '3 năm', 'active', NULL, DATE '2022-01-15', 4.70, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (5, 6, 'Chuyên viên tóc', '["Cắt","Nhuộm","Chăm sóc tóc"]'::jsonb, '2 năm', 'active', NULL, DATE '2023-05-01', 4.60, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (6, 7, 'Trang điểm', '["Trang điểm cô dâu","Trang điểm cá nhân","Nhuộm lông mày"]'::jsonb, '3 năm', 'active', NULL, DATE '2022-02-20', 4.85, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33');

-- 4. Staff base salaries
INSERT INTO staff_base_salaries (id, staff_id, base_salary, notes, created_at, updated_at) VALUES
  (1, 1, 8000000.00, 'Nguyễn Thị Mai - Cấp độ: Cao', TIMESTAMP '2025-11-18 12:14:07', TIMESTAMP '2025-11-23 06:47:31'),
  (2, 2, 7000000.00, 'Trần Văn Đức - Cấp độ: Trung bình', TIMESTAMP '2025-11-18 12:14:07', TIMESTAMP '2025-11-18 12:14:07'),
  (3, 3, 6600000.00, 'Lê Thị Hoa - Chuyên viên da liễu', TIMESTAMP '2025-11-18 12:14:07', TIMESTAMP '2025-11-19 07:08:04'),
  (4, 4, 6000000.00, 'Phạm Anh Tuấn - Cấp độ: Mới', TIMESTAMP '2025-11-18 12:14:07', TIMESTAMP '2025-11-18 12:14:07'),
  (5, 5, 5500000.00, 'Vũ Thị Linh - Cấp độ: Mới', TIMESTAMP '2025-11-18 12:14:07', TIMESTAMP '2025-11-18 12:14:07'),
  (6, 6, 5000000.00, 'Hoàng Thị Hương - Cấp độ: Trang điểm', TIMESTAMP '2025-11-18 12:14:07', TIMESTAMP '2025-11-18 12:14:07');

-- 5. Service categories
INSERT INTO service_categories (id, name, description, status, deleted_at) VALUES
  (1, 'Cắt Tóc Nam', 'Dịch vụ cắt tóc nam chuyên nghiệp', 'active', NULL),
  (2, 'Cắt Tóc Nữ', 'Dịch vụ cắt tóc nữ theo xu hướng', 'active', NULL),
  (3, 'Nhuộm Tóc', 'Nhuộm tóc các màu theo yêu cầu', 'active', NULL),
  (4, 'Uốn Tóc', 'Uốn xoăn, duỗi và tạo kiểu tóc', 'active', NULL),
  (5, 'Chăm Sóc Tóc', 'Hấp tóc, gội đầu massage', 'active', NULL),
  (6, 'Chăm Sóc Da Mặt', 'Spa mặt, trị mụn, làm trắng da', 'active', NULL);

-- 6. Services
INSERT INTO services (id, name, description, price, duration, image_url, popular, status, category_id, created_at, updated_at) VALUES
  (1, 'Cắt Tóc Nam Cơ Bản', 'Cắt tóc nam kiểu cơ bản, gọn gàng', 150000.00, 45, '/images/haircut-men.png', TRUE, 'active', 1, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (2, 'Cắt Tóc Nam Kiểu', 'Cắt tóc nam kiểu hiện đại, fade', 200000.00, 60, '/images/haircut-men-style.png', TRUE, 'active', 1, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (3, 'Cắt Tóc Nữ Cơ Bản', 'Cắt tóc nữ layer đơn giản', 200000.00, 60, '/images/haircut-women.png', TRUE, 'active', 2, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (4, 'Cắt Tóc Nữ Kiểu Mới', 'Cắt tóc nữ kiểu trendy, chic', 250000.00, 75, '/images/haircut-women-trendy.png', TRUE, 'active', 2, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (5, 'Nhuộm Tóc Toàn Đầu', 'Nhuộm toàn bộ tóc màu tươi', 350000.00, 120, '/images/hair-dye-full.png', TRUE, 'active', 3, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (6, 'Nhuộm Tóc Highlight', 'Nhuộm phần tóc, tạo highlight', 400000.00, 150, '/images/hair-dye-highlight.png', TRUE, 'active', 3, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (7, 'Uốn Xoăn Cơ Bản', 'Uốn xoăn tự nhiên', 400000.00, 180, '/images/perm-basic.png', TRUE, 'active', 4, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (8, 'Uốn Xoăn Ngoạn Mục', 'Uốn xoăn to, ngoạn mục', 500000.00, 200, '/images/perm-glamour.png', TRUE, 'active', 4, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (9, 'Hấp Tóc Dầu Dừa', 'Hấp tóc phục hồi với dầu dừa', 250000.00, 60, '/images/hair-treatment-coconut.png', TRUE, 'active', 5, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (10, 'Hấp Tóc Keratin', 'Hấp tóc keratin chuyên sâu', 350000.00, 75, '/images/hair-treatment-keratin.png', TRUE, 'active', 5, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (11, 'Spa Mặt Cơ Bản', 'Làm sạch da, tẩy tế bào chết', 250000.00, 60, '/images/facial-basic.png', TRUE, 'active', 6, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (12, 'Spa Mặt Chuyên Sâu', 'Spa mặt 2 tiếng toàn bộ quy trình', 450000.00, 120, '/images/facial-deep.png', TRUE, 'active', 6, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33');

-- 7. Customers
INSERT INTO customers (id, phone, name, email, service_count, total_amount, last_appointment_date, notes, created_at, updated_at) VALUES
  (1, '0987654321', 'Trần Thị Bích', 'tran.bich@email.com', 6, 1350000.00, DATE '2025-11-24', 'Khách quen, thích cắt layer', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (2, '0912345678', 'Lê Minh Hoàng', 'le.hoang@email.com', 5, 1500000.00, DATE '2025-11-24', NULL, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (3, '0934455667', 'Phạm Quỳnh Anh', 'pham.quynh@email.com', 7, 1750000.00, DATE '2025-11-24', 'VIP, da nhạy cảm cần chăm sóc', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (4, '0945566778', 'Võ Thanh Tùng', 'vo.tung@email.com', 4, 950000.00, DATE '2025-11-23', NULL, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (5, '0956677889', 'Nguyễn Hữu Phát', 'nguyen.phat@email.com', 5, 1250000.00, DATE '2025-11-23', 'Nam, thích cắt kiểu', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (6, '0967788990', 'Tạ Minh Châu', 'ta.chau@email.com', 3, 900000.00, DATE '2025-11-23', NULL, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (7, '0978899001', 'Đặng Thảo Nhi', 'dang.nhi@email.com', 4, 1100000.00, DATE '2025-11-22', 'Thích uốn xoăn', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (8, '0989900112', 'Hoàng Văn Sơn', 'hoang.son@email.com', 4, 1300000.00, DATE '2025-11-22', 'Nam, khách thường xuyên', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (9, '0990011223', 'Lưu Thị Giang', 'luu.giang@email.com', 4, 950000.00, DATE '2025-11-22', 'Chăm sóc da', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (10, '0901122334', 'Bùi Minh Quân', 'bui.quan@email.com', 4, 1200000.00, DATE '2025-11-21', NULL, TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33');

-- 8. Staff schedules (sample working slots per staff)
INSERT INTO staff_schedules (id, staff_id, day_of_week, start_time, end_time, created_at, updated_at) VALUES
  (1, 1, 1, '09:00', '18:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (2, 1, 3, '09:00', '18:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (3, 2, 2, '10:00', '19:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (4, 2, 4, '09:00', '18:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (5, 3, 5, '09:00', '17:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (6, 3, 6, '10:00', '16:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (7, 4, 3, '08:30', '17:30', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (8, 4, 6, '09:00', '17:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (9, 5, 1, '09:00', '18:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (10, 5, 5, '09:00', '18:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (11, 6, 5, '10:00', '18:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33'),
  (12, 6, 6, '10:00', '17:00', TIMESTAMP '2025-11-18 12:08:33', TIMESTAMP '2025-11-18 12:08:33');

-- 9. Staff skills mapping
INSERT INTO staff_services (staff_id, service_id) VALUES
  (1, 1), (1, 2), (1, 5), (1, 6), (1, 7), (1, 8),
  (2, 11), (2, 12),
  (3, 11), (3, 12),
  (4, 9), (4, 10),
  (5, 3), (5, 4), (5, 5),
  (6, 11), (6, 12);

-- 10. Payroll snapshots
INSERT INTO payrolls (id, staff_id, pay_period_start, pay_period_end, base_salary, total_commission, total_bonus, total_deduction, final_salary, status, payment_date, notes, created_at) VALUES
  (1, 1, DATE '2025-11-01', DATE '2025-11-15', 8000000.00, 2750000.00, 500000.00, 200000.00, 11050000.00, 'paid', DATE '2025-11-16', 'Nguyễn Thị Mai - Kỳ lương giữa tháng 11', TIMESTAMP '2025-11-16 08:00:00'),
  (2, 2, DATE '2025-11-01', DATE '2025-11-15', 7000000.00, 1750000.00, 300000.00, 150000.00, 8900000.00, 'paid', DATE '2025-11-16', 'Trần Văn Đức - Kỳ lương giữa tháng 11', TIMESTAMP '2025-11-16 08:10:00'),
  (3, 3, DATE '2025-11-01', DATE '2025-11-15', 6500000.00, 1680000.00, 200000.00, 100000.00, 8280000.00, 'paid', DATE '2025-11-16', 'Lê Thị Hoa - Kỳ lương giữa tháng 11', TIMESTAMP '2025-11-16 08:20:00'),
  (4, 4, DATE '2025-11-01', DATE '2025-11-15', 6000000.00, 1640000.00, 250000.00, 120000.00, 7770000.00, 'paid', DATE '2025-11-16', 'Phạm Anh Tuấn - Kỳ lương giữa tháng 11', TIMESTAMP '2025-11-16 08:30:00'),
  (5, 5, DATE '2025-11-01', DATE '2025-11-15', 5500000.00, 827000.00, 150000.00, 100000.00, 6477000.00, 'paid', DATE '2025-11-16', 'Vũ Thị Linh - Kỳ lương giữa tháng 11', TIMESTAMP '2025-11-16 08:40:00'),
  (6, 6, DATE '2025-11-01', DATE '2025-11-15', 5000000.00, 620000.00, 120000.00, 80000.00, 5660000.00, 'paid', DATE '2025-11-16', 'Hoàng Thị Hương - Kỳ lương giữa tháng 11', TIMESTAMP '2025-11-16 08:50:00');

-- 11. Appointments
INSERT INTO appointments (id, customer_id, customer_name, customer_phone, notes, appointment_date, appointment_time, status, price_at_booking, duration_at_booking, is_overtime, created_at, updated_at, payroll_id) VALUES
  (1, 1, 'Trần Thị Bích', '0987654321', 'Cắt tóc nam cơ bản', DATE '2025-11-24', TIME '09:00:00', 'completed', 150000.00, 45, FALSE, TIMESTAMP '2025-11-24 09:00:00', TIMESTAMP '2025-11-24 09:45:00', NULL),
  (2, 2, 'Lê Minh Hoàng', '0912345678', 'Nhuộm tóc toàn đầu', DATE '2025-11-24', TIME '10:30:00', 'completed', 350000.00, 120, FALSE, TIMESTAMP '2025-11-24 10:30:00', TIMESTAMP '2025-11-24 12:30:00', NULL),
  (3, 3, 'Phạm Quỳnh Anh', '0934455667', 'Spa mặt chuyên sâu', DATE '2025-11-24', TIME '14:00:00', 'completed', 450000.00, 120, FALSE, TIMESTAMP '2025-11-24 14:00:00', TIMESTAMP '2025-11-24 16:00:00', NULL),
  (4, 4, 'Võ Thanh Tùng', '0945566778', 'Hấp tóc dầu dừa', DATE '2025-11-23', TIME '15:30:00', 'completed', 250000.00, 60, FALSE, TIMESTAMP '2025-11-23 15:30:00', TIMESTAMP '2025-11-23 16:30:00', NULL),
  (5, 5, 'Nguyễn Hữu Phát', '0956677889', 'Cắt tóc nam kiểu', DATE '2025-11-23', TIME '09:00:00', 'completed', 200000.00, 60, FALSE, TIMESTAMP '2025-11-23 09:00:00', TIMESTAMP '2025-11-23 10:00:00', NULL),
  (6, 6, 'Tạ Minh Châu', '0967788990', 'Cắt tóc nữ cơ bản', DATE '2025-11-23', TIME '11:00:00', 'completed', 200000.00, 60, FALSE, TIMESTAMP '2025-11-23 11:00:00', TIMESTAMP '2025-11-23 12:00:00', NULL),
  (7, 7, 'Đặng Thảo Nhi', '0978899001', 'Nhuộm tóc highlight', DATE '2025-11-22', TIME '10:00:00', 'completed', 400000.00, 150, FALSE, TIMESTAMP '2025-11-22 10:00:00', TIMESTAMP '2025-11-22 12:30:00', NULL),
  (8, 8, 'Hoàng Văn Sơn', '0989900112', 'Uốn xoăn cơ bản', DATE '2025-11-22', TIME '13:00:00', 'completed', 400000.00, 180, FALSE, TIMESTAMP '2025-11-22 13:00:00', TIMESTAMP '2025-11-22 16:00:00', NULL),
  (9, 9, 'Lưu Thị Giang', '0990011223', 'Uốn xoăn ngoạn mục', DATE '2025-11-22', TIME '16:00:00', 'completed', 500000.00, 200, FALSE, TIMESTAMP '2025-11-22 16:00:00', TIMESTAMP '2025-11-22 19:20:00', NULL),
  (10, 10, 'Bùi Minh Quân', '0901122334', 'Hấp tóc keratin', DATE '2025-11-21', TIME '15:00:00', 'completed', 350000.00, 75, FALSE, TIMESTAMP '2025-11-21 15:00:00', TIMESTAMP '2025-11-21 16:15:00', NULL),
  (11, 3, 'Phạm Quỳnh Anh', '0934455667', 'Spa mặt cơ bản', DATE '2025-11-20', TIME '09:00:00', 'completed', 250000.00, 60, FALSE, TIMESTAMP '2025-11-20 09:00:00', TIMESTAMP '2025-11-20 10:00:00', NULL),
  (12, 1, 'Trần Thị Bích', '0987654321', 'Cắt tóc nữ kiểu mới', DATE '2025-11-19', TIME '11:00:00', 'completed', 250000.00, 75, FALSE, TIMESTAMP '2025-11-19 11:00:00', TIMESTAMP '2025-11-19 12:15:00', NULL);

-- 12. Appointment service breakdown
INSERT INTO appointment_services (id, appointment_id, service_id, staff_id, price_at_booking, commission_percentage, work_share) VALUES
  (1, 1, 1, 1, 150000.00, 10.00, 100.00),
  (2, 2, 5, 1, 350000.00, 10.00, 100.00),
  (3, 3, 12, 3, 450000.00, 10.00, 100.00),
  (4, 4, 9, 4, 250000.00, 10.00, 100.00),
  (5, 5, 2, 1, 200000.00, 10.00, 100.00),
  (6, 6, 3, 5, 200000.00, 10.00, 100.00),
  (7, 7, 6, 1, 400000.00, 10.00, 100.00),
  (8, 8, 7, 1, 400000.00, 10.00, 100.00),
  (9, 9, 8, 1, 500000.00, 10.00, 100.00),
  (10, 10, 10, 4, 350000.00, 10.00, 100.00),
  (11, 11, 11, 6, 250000.00, 10.00, 100.00),
  (12, 12, 4, 5, 250000.00, 10.00, 100.00);

-- 13. Reset sequences so future inserts continue correctly
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true);
SELECT setval(pg_get_serial_sequence('staff', 'id'), COALESCE((SELECT MAX(id) FROM staff), 1), true);
SELECT setval(pg_get_serial_sequence('staff_base_salaries', 'id'), COALESCE((SELECT MAX(id) FROM staff_base_salaries), 1), true);
SELECT setval(pg_get_serial_sequence('service_categories', 'id'), COALESCE((SELECT MAX(id) FROM service_categories), 1), true);
SELECT setval(pg_get_serial_sequence('services', 'id'), COALESCE((SELECT MAX(id) FROM services), 1), true);
SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 1), true);
SELECT setval(pg_get_serial_sequence('staff_schedules', 'id'), COALESCE((SELECT MAX(id) FROM staff_schedules), 1), true);
SELECT setval(pg_get_serial_sequence('payrolls', 'id'), COALESCE((SELECT MAX(id) FROM payrolls), 1), true);
SELECT setval(pg_get_serial_sequence('appointments', 'id'), COALESCE((SELECT MAX(id) FROM appointments), 1), true);
SELECT setval(pg_get_serial_sequence('appointment_services', 'id'), COALESCE((SELECT MAX(id) FROM appointment_services), 1), true);

COMMIT;
