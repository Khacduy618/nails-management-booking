export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "in-progress";
export type StaffStatus = "active" | "inactive";

export interface ApiStaff {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    position?: string;
    specialties?: string[];
    experience?: string;
    baseSalary?: string;
    status: StaffStatus;
    avatarUrl?: string;
    joinDate?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ApiCustomer {
    id: number;
    phone: string;
    name: string;
    email?: string;
    serviceCount: number;
    totalAmount: string;
    lastAppointmentDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceSummary {
    serviceId: number;
    serviceName: string;
    price: string;
    count: number;
    totalAmount: string;
}

export interface CustomerDetail {
    customer: {
        id: number;
        name: string;
        email: string;
        phone: string;
        notes: string;
        createdAt: Date | string;
    };
    appointments: Array<{
        appointmentId: number;
        appointmentDate: string;
        appointmentTime: string;
        status: AppointmentStatus;
        totalPrice: string;
        createdAt: string;
        services: Array<{
            id: number;
            name: string;
            price: string;
            duration: number;
        }>;
    }>;
    servicesSummary: ServiceSummary[];
    statistics: {
        totalAppointments: number;
        totalServices: number;
        totalAmount: string;
        lastAppointmentDate: string | null;
    };
}

export interface ApiAppointment {
    id: number;
    appointmentDate: string;
    appointmentTime: string;
    durationAtBooking: number;
    priceAtBooking: string;
    customerName: string;
    customerPhone: string;
    status: AppointmentStatus;
    notes: string | null;
    appointmentServices: {
        service: { name: string };
        staff: { name: string } | null;
    }[];
    createdAt: string;
    updatedAt: string;
}

export interface PaginationInfo { page: number; limit: number; total: number; totalPages: number; }