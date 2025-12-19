import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, services, staff, appointmentServices, users } from "@/db/schema";
import { sql, sum, count, eq, and, gte, lte } from "drizzle-orm";
import { parseISO, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        // Lấy ngày bắt đầu và kết thúc từ query, ví dụ: ?startDate=2024-07-01&endDate=2024-07-31
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const dateConditions = [];
        if (startDate) {
            try {
                const parsedStart = parseISO(startDate);
                dateConditions.push(gte(appointments.appointmentDate, parsedStart));
            } catch (e) {
                console.error('Invalid startDate:', startDate);
            }
        }
        if (endDate) {
            try {
                const parsedEnd = parseISO(endDate);
                const eod = endOfDay(parsedEnd);
                dateConditions.push(lte(appointments.appointmentDate, eod));
            } catch (e) {
                console.error('Invalid endDate:', endDate);
            }
        }

        // 1. Tính tổng quan
        const overviewResult = await db
            .select({
                totalRevenue: sql<number>`COALESCE(sum(case when ${appointments.status} = 'completed' then ${appointmentServices.priceAtBooking} else 0 end), 0)`,
                totalAppointments: sql<number>`count(case when ${appointments.status} != 'cancelled' then 1 end)`,
                completedAppointments: sql<number>`count(case when ${appointments.status} = 'completed' then 1 end)`,
                totalCustomers: sql<number>`count(distinct ${appointments.customerPhone})`,
            })
            .from(appointments)
            .leftJoin(appointmentServices, eq(appointments.id, appointmentServices.appointmentId))
            .where(and(...dateConditions));

        // 2. Doanh thu theo dịch vụ
        const serviceRevenue = await db
            .select({
                serviceName: services.name,
                serviceId: services.id,
                count: sql<number>`count(distinct ${appointments.id})`.mapWith(Number),
                totalRevenue: sql<number>`COALESCE(sum(${appointmentServices.priceAtBooking}), 0)`.mapWith(Number),
            })
            .from(appointments)
            .innerJoin(appointmentServices, eq(appointments.id, appointmentServices.appointmentId))
            .leftJoin(services, eq(appointmentServices.serviceId, services.id))
            .where(and(eq(appointments.status, 'completed'), ...dateConditions))
            .groupBy(services.id, services.name)
            .orderBy(sql`COALESCE(sum(${appointmentServices.priceAtBooking}), 0) desc`);

        // 3. Hiệu suất nhân viên
        const staffPerformance = await db
            .select({
                staffName: users.email,
                staffId: staff.id,
                revenue: sql<number>`CAST(COALESCE(sum(${appointmentServices.priceAtBooking}), 0) AS DECIMAL(10,2))`.mapWith(Number),
                appointments: sql<number>`count(distinct ${appointments.id})`.mapWith(Number),
            })
            .from(appointments)
            .innerJoin(appointmentServices, eq(appointments.id, appointmentServices.appointmentId))
            .leftJoin(staff, eq(appointmentServices.staffId, staff.id))
            .leftJoin(users, eq(staff.userId, users.id))
            .where(and(eq(appointments.status, 'completed'), ...dateConditions))
            .groupBy(staff.id, users.email)
            .orderBy(sql`COALESCE(sum(${appointmentServices.priceAtBooking}), 0) desc`);

        // 4. Doanh thu theo ngày cho chart - GROUP BY date và SUM revenue
        const dailyRevenueRaw = await db
            .select({
                id: appointments.id,
                appointmentDate: appointments.appointmentDate,
                appointmentTime: appointments.appointmentTime,
                customerName: appointments.customerName,
                customerPhone: appointments.customerPhone,
                customerId: appointments.customerId,
                status: appointments.status,
                serviceName: services.name,
                staffId: staff.id,
                staffName: users.email,
                priceAtBooking: appointmentServices.priceAtBooking,
                revenue: appointmentServices.priceAtBooking,
            })
            .from(appointments)
            .leftJoin(appointmentServices, eq(appointments.id, appointmentServices.appointmentId))
            .leftJoin(services, eq(appointmentServices.serviceId, services.id))
            .leftJoin(staff, eq(appointmentServices.staffId, staff.id))
            .leftJoin(users, eq(staff.userId, users.id))
            .where(and(eq(appointments.status, 'completed'), ...dateConditions))
            .orderBy(appointments.appointmentDate);

        // Transform to appointments array for frontend
        const appointmentsList = dailyRevenueRaw.map(record => ({
            id: record.id,
            appointmentDate: record.appointmentDate,
            appointmentTime: record.appointmentTime,
            customerName: record.customerName,
            customerPhone: record.customerPhone,
            customerId: record.customerId,
            status: record.status,
            serviceName: record.serviceName,
            staffId: record.staffId,
            staffName: record.staffName,
            priceAtBooking: record.priceAtBooking,
            revenue: record.revenue,
        }));

        // 5. Customers with total spent (summing all services per appointment)
        const customerSpendingRaw = await db
            .select({
                customerId: appointments.customerId,
                customerName: appointments.customerName,
                customerPhone: appointments.customerPhone,
                appointmentId: appointments.id,
                priceAtBooking: appointmentServices.priceAtBooking,
            })
            .from(appointments)
            .leftJoin(appointmentServices, eq(appointments.id, appointmentServices.appointmentId))
            .where(and(eq(appointments.status, 'completed'), ...dateConditions))
            .orderBy(appointments.customerId);

        // Group by customer and sum spending
        const customerMap: Record<string, any> = {};
        customerSpendingRaw.forEach((record) => {
            const customerId = record.customerId;
            if (!customerId) return;

            if (!customerMap[customerId]) {
                customerMap[customerId] = {
                    customerId,
                    customerName: record.customerName,
                    customerPhone: record.customerPhone,
                    appointmentIds: new Set<string>(),
                    totalSpent: 0,
                };
            }

            // Add appointment count (unique)
            if (record.appointmentId) {
                customerMap[customerId].appointmentIds.add(record.appointmentId);
            }

            // Sum spending from all services
            if (record.priceAtBooking) {
                customerMap[customerId].totalSpent += parseFloat(String(record.priceAtBooking)) || 0;
            }
        });

        // Convert to array and calculate appointment count
        const customersList = Object.values(customerMap).map((customer) => ({
            customerId: customer.customerId,
            customerName: customer.customerName,
            customerPhone: customer.customerPhone,
            appointmentCount: customer.appointmentIds.size,
            totalSpent: customer.totalSpent,
        }));        // Ensure overview has default values
        const overview = overviewResult[0] || {
            totalRevenue: 0,
            totalAppointments: 0,
            completedAppointments: 0,
            totalCustomers: 0,
        };

        return NextResponse.json({
            data: {
                overview,
                serviceRevenue: serviceRevenue || [],
                staffPerformance: staffPerformance || [],
                appointments: appointmentsList || [],
                customers: customersList || [],
            }
        });

    } catch (error) {
        console.error("Failed to fetch revenue data:", error);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}