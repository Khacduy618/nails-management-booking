import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments, appointmentServices, services, staff } from "@/db/schema";
import { eq, and, inArray, sql, asc, desc, like, or, SQL, count} from "drizzle-orm";

const validStatuses = appointments.status.enumValues;
type AppointmentStatus = (typeof validStatuses)[number];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const staffId = searchParams.get("staffId");
    const status = searchParams.get("status");
    const searchTerm = searchParams.get("search");
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");


    const conditions: (SQL | undefined)[] = [];

    if (date) {
      conditions.push(eq(appointments.appointmentDate, new Date(date)));
    }

    if (status && status !== "all" && validStatuses.includes(status as AppointmentStatus)) {
      conditions.push(eq(appointments.status, status as AppointmentStatus));
    }

    // Subquery cho staffId và searchTerm
    if ((staffId && staffId !== "all") || searchTerm) {
      const subqueryConditions: (SQL | undefined)[] = [];
      if (staffId && staffId !== "all") {
        subqueryConditions.push(eq(appointmentServices.staffId, Number(staffId)));
      }
      if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        const customerCondition = or(like(sql`LOWER(${appointments.customerName})`, searchPattern), like(appointments.customerPhone, `%${searchTerm}%`));
        const serviceIdsSubquery = db.select({ id: services.id }).from(services).where(like(sql`LOWER(${services.name})`, searchPattern));
        subqueryConditions.push(or(inArray(appointmentServices.appointmentId, db.select({ id: appointments.id }).from(appointments).where(customerCondition)), inArray(appointmentServices.serviceId, serviceIdsSubquery)));
      }
      const relevantAppointmentIdsQuery = db.selectDistinct({ id: appointmentServices.appointmentId }).from(appointmentServices).where(and(...subqueryConditions));
      const relevantAppointmentIdsResult = await relevantAppointmentIdsQuery;
      const relevantIds = relevantAppointmentIdsResult.map(item => item.id);
      if (relevantIds.length > 0) {
        conditions.push(inArray(appointments.id, relevantIds));
      } else {
        return NextResponse.json({ appointments: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      }
    }

    const whereClause = and(...conditions.filter(Boolean));

    // --- Truy vấn dữ liệu và tổng số lượng song song ---
    const [allAppointments, totalResult] = await Promise.all([
      db.query.appointments.findMany({
        where: whereClause,
        with: {
          appointmentServices: { with: { service: { columns: { name: true } }, staff: { columns: { name: true } } } }
        },
        orderBy: [desc(appointments.appointmentDate), desc(appointments.appointmentTime)],
        limit: limit,
        offset: (page - 1) * limit,
      }),
      db.select({ total: count() }).from(appointments).where(whereClause)
    ]);

    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      appointments: allAppointments,
      pagination: { page, limit, total, totalPages }
    });
  } catch (error) {
    console.error("Failed to fetch admin appointments:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}