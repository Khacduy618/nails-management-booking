import { mysqlTable, int, varchar, text, decimal, time, date, boolean, timestamp, primaryKey, mysqlEnum, json } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// --- Bảng Users ---
export const users = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  role: mysqlEnum('role', ['customer', 'staff', 'admin']).default('customer').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// --- Bảng Staff (Nhân viên) ---
export const staff = mysqlTable('staff', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),
  position: varchar('position', { length: 100 }),
  specialties: json('specialties'),
  experience: varchar('experience', { length: 50 }),
  status: mysqlEnum('status', ['active', 'inactive']).default('active').notNull(),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  joinDate: date('join_date'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// --- Bảng Customers (Khách hàng) ---
export const customers = mysqlTable('customers', {
  id: int('id').autoincrement().primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  serviceCount: int('service_count').default(0).notNull(),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  lastAppointmentDate: date('last_appointment_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// --- Bảng Service Categories (Danh mục dịch vụ) ---
export const serviceCategories = mysqlTable('service_categories', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  status: mysqlEnum('status', ['active', 'deleted', 'inactive']).default('active').notNull(),
  deletedAt: timestamp('deleted_at'),
});

// --- Bảng Services (Dịch vụ) ---
export const services = mysqlTable('services', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  duration: int('duration').notNull(),
  imageUrl: varchar('image_url', { length: 255 }),
  popular: boolean('popular').default(false),
  status: mysqlEnum('status', ['active', 'archived']).default('active').notNull(),
  categoryId: int('category_id').references(() => serviceCategories.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// --- Bảng Staff Services (Kỹ năng của nhân viên) ---
export const staffServices = mysqlTable('staff_services', {
  staffId: int('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
  serviceId: int('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.staffId, t.serviceId] }),
}));

// --- Bảng Staff Schedules (Lịch làm của nhân viên) ---
export const staffSchedules = mysqlTable('staff_schedules', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: int('day_of_week').notNull(), // 0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7
  startTime: varchar('start_time', { length: 5 }).notNull(), // Format: "HH:MM"
  endTime: varchar('end_time', { length: 5 }).notNull(), // Format: "HH:MM"
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// --- Bảng Staff Base Salaries (Lương cứng của nhân viên) ---
export const staffBaseSalaries = mysqlTable('staff_base_salaries', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').notNull().unique().references(() => staff.id, { onDelete: 'cascade' }),
  baseSalary: decimal('base_salary', { precision: 10, scale: 2 }).notNull(), // Lương cứng (VND)
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// --- Bảng Payrolls (Bảng lương tổng hợp) ---
export const payrolls = mysqlTable('payrolls', {
  id: int('id').autoincrement().primaryKey(),
  staffId: int('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
  payPeriodStart: date('pay_period_start').notNull(),
  payPeriodEnd: date('pay_period_end').notNull(),
  baseSalary: decimal('base_salary', { precision: 10, scale: 2 }).default('0.00'),
  totalCommission: decimal('total_commission', { precision: 10, scale: 2 }).default('0.00'),
  totalBonus: decimal('total_bonus', { precision: 10, scale: 2 }).default('0.00'),
  totalDeduction: decimal('total_deduction', { precision: 10, scale: 2 }).default('0.00'),
  finalSalary: decimal('final_salary', { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum('status', ['pending', 'calculated', 'paid', 'cancelled']).default('pending').notNull(),
  paymentDate: date('payment_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// --- Bảng Appointments (Lịch hẹn chính) ---
export const appointments = mysqlTable('appointments', {
  id: int('id').autoincrement().primaryKey(),
  customerId: int('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  notes: text('notes'),
  appointmentDate: date('appointment_date').notNull(),
  appointmentTime: time('appointment_time').notNull(),
  status: mysqlEnum('status', ['pending', 'confirmed', 'completed', 'cancelled', 'in-progress']).default('pending').notNull(),
  priceAtBooking: decimal('price_at_booking', { precision: 10, scale: 2 }).notNull(),
  durationAtBooking: int('duration_at_booking').notNull(),
  isOvertime: boolean('is_overtime').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
  payrollId: int('payroll_id').references(() => payrolls.id, { onDelete: 'set null' }),
});

// --- Bảng Appointment Services (Chi tiết dịch vụ trong lịch hẹn) ---
export const appointmentServices = mysqlTable('appointment_services', {
  id: int('id').autoincrement().primaryKey(),
  appointmentId: int('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }).notNull(),
  serviceId: int('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  staffId: int('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  priceAtBooking: decimal('price_at_booking', { precision: 10, scale: 2 }).notNull(),
  commissionPercentage: decimal('commission_percentage', { precision: 5, scale: 2 }),
  workShare: decimal('work_share', { precision: 5, scale: 2 }).default('100.00'),
});

// --- (Các bảng payroll còn lại nếu có) ---
// ...

// --- RELATIONS ---
export const usersRelations = relations(users, ({ many }) => ({
  appointments: many(appointments),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  appointments: many(appointments),
}));

export const staffRelations = relations(staff, ({ many, one }) => ({
  staffServices: many(staffServices),
  staffSchedules: many(staffSchedules),
  staffBaseSalary: one(staffBaseSalaries),
  appointments: many(appointments),
  payrolls: many(payrolls),
  appointmentServices: many(appointmentServices)
}));

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  staffServices: many(staffServices),
  appointmentServices: many(appointmentServices),
}));

export const staffServicesRelations = relations(staffServices, ({ one }) => ({
  staff: one(staff, {
    fields: [staffServices.staffId],
    references: [staff.id],
  }),
  service: one(services, {
    fields: [staffServices.serviceId],
    references: [services.id],
  }),
}));

export const staffSchedulesRelations = relations(staffSchedules, ({ one }) => ({
  staff: one(staff, {
    fields: [staffSchedules.staffId],
    references: [staff.id],
  }),
}));

export const staffBaseSalariesRelations = relations(staffBaseSalaries, ({ one }) => ({
  staff: one(staff, {
    fields: [staffBaseSalaries.staffId],
    references: [staff.id],
  }),
}));

export const payrollsRelations = relations(payrolls, ({ one, many }) => ({
  staff: one(staff, {
    fields: [payrolls.staffId],
    references: [staff.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  customer: one(customers, {
    fields: [appointments.customerId],
    references: [customers.id],
  }),
  payroll: one(payrolls, {
    fields: [appointments.payrollId],
    references: [payrolls.id],
  }),
  appointmentServices: many(appointmentServices),
}));

export const appointmentServicesRelations = relations(appointmentServices, ({ one }) => ({
  appointment: one(appointments, {
    fields: [appointmentServices.appointmentId],
    references: [appointments.id],
  }),
  service: one(services, {
    fields: [appointmentServices.serviceId],
    references: [services.id],
  }),
  staff: one(staff, {
    fields: [appointmentServices.staffId],
    references: [staff.id],
  }),
}));