import { relations } from 'drizzle-orm'
import {
  pgTable,
  serial,
  integer,
  varchar,
  text,
  numeric,
  time,
  date,
  boolean,
  timestamp,
  primaryKey,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['customer', 'staff', 'admin'])
export const staffStatusEnum = pgEnum('staff_status', ['active', 'inactive'])
export const categoryStatusEnum = pgEnum('category_status', ['active', 'deleted', 'inactive'])
export const serviceStatusEnum = pgEnum('service_status', ['active', 'archived'])
export const payrollStatusEnum = pgEnum('payroll_status', ['pending', 'calculated', 'paid', 'cancelled'])
export const appointmentStatusEnum = pgEnum('appointment_status', ['pending', 'confirmed', 'completed', 'cancelled', 'in-progress'])

// --- Bảng Users (Authentication) ---
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  role: roleEnum('role').default('customer').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

// --- Bảng Staff (Nhân viên) ---
export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  position: varchar('position', { length: 100 }),
  specialties: jsonb('specialties'),
  experience: varchar('experience', { length: 50 }),
  status: staffStatusEnum('status').default('active').notNull(),
  avatarUrl: varchar('avatar_url', { length: 255 }),
  joinDate: date('join_date'),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

// --- Bảng Customers (Khách hàng) ---
export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  serviceCount: integer('service_count').default(0).notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0.00').notNull(),
  lastAppointmentDate: date('last_appointment_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

// --- Bảng Service Categories (Danh mục dịch vụ) ---
export const serviceCategories = pgTable('service_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  status: categoryStatusEnum('status').default('active').notNull(),
  deletedAt: timestamp('deleted_at'),
})

// --- Bảng Services (Dịch vụ) ---
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  duration: integer('duration').notNull(),
  imageUrl: varchar('image_url', { length: 255 }),
  popular: boolean('popular').default(false),
  status: serviceStatusEnum('status').default('active').notNull(),
  categoryId: integer('category_id').references(() => serviceCategories.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

// --- Bảng Staff Services (Kỹ năng của nhân viên) ---
export const staffServices = pgTable('staff_services', {
  staffId: integer('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
  serviceId: integer('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.staffId, t.serviceId] }),
}))

// --- Bảng Staff Schedules (Lịch làm của nhân viên) ---
export const staffSchedules = pgTable('staff_schedules', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

// --- Bảng Staff Base Salaries (Lương cứng của nhân viên) ---
export const staffBaseSalaries = pgTable('staff_base_salaries', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').notNull().unique().references(() => staff.id, { onDelete: 'cascade' }),
  baseSalary: numeric('base_salary', { precision: 10, scale: 2 }).notNull(), // Lương cứng (VND)
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

// --- Bảng Payrolls (Bảng lương tổng hợp) ---
export const payrolls = pgTable('payrolls', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
  payPeriodStart: date('pay_period_start').notNull(),
  payPeriodEnd: date('pay_period_end').notNull(),
  baseSalary: numeric('base_salary', { precision: 10, scale: 2 }).default('0.00'),
  totalCommission: numeric('total_commission', { precision: 10, scale: 2 }).default('0.00'),
  totalBonus: numeric('total_bonus', { precision: 10, scale: 2 }).default('0.00'),
  totalDeduction: numeric('total_deduction', { precision: 10, scale: 2 }).default('0.00'),
  finalSalary: numeric('final_salary', { precision: 10, scale: 2 }).notNull(),
  status: payrollStatusEnum('status').default('pending').notNull(),
  paymentDate: date('payment_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
})

// --- Bảng Appointments (Lịch hẹn chính) ---
export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
  notes: text('notes'),
  appointmentDate: date('appointment_date').notNull(),
  appointmentTime: time('appointment_time').notNull(),
  status: appointmentStatusEnum('status').default('pending').notNull(),
  priceAtBooking: numeric('price_at_booking', { precision: 10, scale: 2 }).notNull(),
  durationAtBooking: integer('duration_at_booking').notNull(),
  isOvertime: boolean('is_overtime').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
})

// --- Bảng Appointment Services (Chi tiết dịch vụ trong lịch hẹn) ---
export const appointmentServices = pgTable('appointment_services', {
  id: serial('id').primaryKey(),
  appointmentId: integer('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }).notNull(),
  serviceId: integer('service_id').references(() => services.id, { onDelete: 'cascade' }).notNull(),
  staffId: integer('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  priceAtBooking: numeric('price_at_booking', { precision: 10, scale: 2 }).notNull(),
  commissionPercentage: numeric('commission_percentage', { precision: 5, scale: 2 }),
  workShare: numeric('work_share', { precision: 5, scale: 2 }).default('100.00'),
  payrollId: integer('payroll_id').references(() => payrolls.id, { onDelete: 'set null' }),
})

// --- Bảng OTP Tokens (Mã xác thực hủy lịch hẹn) ---
export const otpTokens = pgTable('otp_tokens', {
  appointmentId: integer('appointment_id').primaryKey().references(() => appointments.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 6 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// --- Bảng Admin Notifications (Thông báo quản trị) ---
export const adminNotifications = pgTable('admin_notifications', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// --- RELATIONS ---
export const usersRelations = relations(users, ({ one, many }) => ({
  staff: one(staff),
}))

export const customersRelations = relations(customers, ({ many }) => ({
  appointments: many(appointments),
}))

export const staffRelations = relations(staff, ({ many, one }) => ({
  user: one(users, {
    fields: [staff.userId],
    references: [users.id],
  }),
  staffServices: many(staffServices),
  staffSchedules: many(staffSchedules),
  staffBaseSalary: one(staffBaseSalaries),
  payrolls: many(payrolls),
  appointmentServices: many(appointmentServices),
}))

export const serviceCategoriesRelations = relations(serviceCategories, ({ many }) => ({
  services: many(services),
}))

export const servicesRelations = relations(services, ({ one, many }) => ({
  category: one(serviceCategories, {
    fields: [services.categoryId],
    references: [serviceCategories.id],
  }),
  staffServices: many(staffServices),
  appointmentServices: many(appointmentServices),
}))

export const staffServicesRelations = relations(staffServices, ({ one }) => ({
  staff: one(staff, {
    fields: [staffServices.staffId],
    references: [staff.id],
  }),
  service: one(services, {
    fields: [staffServices.serviceId],
    references: [services.id],
  }),
}))

export const staffSchedulesRelations = relations(staffSchedules, ({ one }) => ({
  staff: one(staff, {
    fields: [staffSchedules.staffId],
    references: [staff.id],
  }),
}))

export const staffBaseSalariesRelations = relations(staffBaseSalaries, ({ one }) => ({
  staff: one(staff, {
    fields: [staffBaseSalaries.staffId],
    references: [staff.id],
  }),
}))

export const payrollsRelations = relations(payrolls, ({ one, many }) => ({
  staff: one(staff, {
    fields: [payrolls.staffId],
    references: [staff.id],
  }),
  appointmentServices: many(appointmentServices),
}))

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  customer: one(customers, {
    fields: [appointments.customerId],
    references: [customers.id],
  }),
  appointmentServices: many(appointmentServices),
  otpToken: one(otpTokens),
}))

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
  payroll: one(payrolls, {
    fields: [appointmentServices.payrollId],
    references: [payrolls.id],
  }),
}))

export const otpTokensRelations = relations(otpTokens, ({ one }) => ({
  appointment: one(appointments, {
    fields: [otpTokens.appointmentId],
    references: [appointments.id],
  }),
}))