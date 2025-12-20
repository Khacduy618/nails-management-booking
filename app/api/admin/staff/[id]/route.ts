import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff, appointments, appointmentServices, services, staffBaseSalaries, users } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";

// --- GET: Lấy chi tiết nhân viên với lịch hẹn và thống kê ---
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_ID", message: "Invalid staff ID" } },
        { status: 400 }
      );
    }

    // Get staff info with user relationship
    const staffMember = await db.query.staff.findFirst({
      where: eq(staff.id, id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          }
        }
      }
    });

    if (!staffMember) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Staff member not found" } },
        { status: 404 }
      );
    }

    // Get appointments with services
    const appointmentList = await db
      .select({
        id: appointments.id,
        appointmentDate: appointments.appointmentDate,
        appointmentTime: appointments.appointmentTime,
        status: appointments.status,
        customerName: appointments.customerName,
        customerPhone: appointments.customerPhone,
        appointmentServiceId: appointmentServices.id,
        serviceName: services.name,
        priceAtBooking: appointmentServices.priceAtBooking,
      })
      .from(appointments)
      .leftJoin(
        appointmentServices,
        eq(appointments.id, appointmentServices.appointmentId)
      )
      .leftJoin(services, eq(appointmentServices.serviceId, services.id))
      .where(eq(appointmentServices.staffId, id));

    // Group appointments by appointment ID
    const appointmentsGrouped = appointmentList.reduce(
      (acc, row) => {
        const existing = acc.find((a) => a.id === row.id);
        if (existing) {
          existing.services.push({
            name: row.serviceName || "Unknown Service",
            priceAtBooking: row.priceAtBooking ? Number(row.priceAtBooking) : null,
          });
        } else {
          acc.push({
            id: row.id,
            appointmentDate: typeof row.appointmentDate === 'string'
              ? row.appointmentDate
              : new Date(row.appointmentDate as any).toISOString().split('T')[0],
            appointmentTime: row.appointmentTime,
            status: row.status,
            customerName: row.customerName,
            customerPhone: row.customerPhone,
            services: row.serviceName
              ? [
                {
                  name: row.serviceName,
                  priceAtBooking: row.priceAtBooking ? Number(row.priceAtBooking) : null,
                },
              ]
              : [],
          });
        }
        return acc;
      },
      [] as Array<{
        id: number;
        appointmentDate: string;
        appointmentTime: any;
        status: string;
        customerName: string;
        customerPhone: string;
        services: Array<{ name: string; priceAtBooking: number | null }>;
      }>
    );

    // Get statistics
    const totalAppointmentsResult = await db
      .select({ value: count() })
      .from(appointmentServices)
      .where(eq(appointmentServices.staffId, id));

    const totalRevenueResult = await db
      .select({ value: sql<string>`COALESCE(SUM(${appointmentServices.priceAtBooking}), 0)` })
      .from(appointmentServices)
      .where(eq(appointmentServices.staffId, id));

    const totalAppointments = totalAppointmentsResult[0]?.value || 0;
    const totalRevenue = Number(totalRevenueResult[0]?.value || 0);

    return NextResponse.json({
      success: true,
      data: {
        staff: staffMember,
        appointments: appointmentsGrouped.sort(
          (a, b) =>
            new Date(b.appointmentDate).getTime() -
            new Date(a.appointmentDate).getTime()
        ),
        statistics: {
          totalAppointments,
          totalRevenue,
          averageRating: staffMember.rating ? Number(staffMember.rating) : 0,
        },
      },
    });
  } catch (error) {
    console.error("[Staff Details GET] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "An unexpected error occurred" },
      },
      { status: 500 }
    );
  }
}

// --- PUT: Cập nhật nhân viên ---
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_ID", message: "Invalid staff ID" } },
        { status: 400 }
      );
    }

    const body = await request.json();

    // ===== VALIDATION =====

    // 1. Validate Email (optional but must be valid string if provided)
    if (body.email) {
      if (typeof body.email !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Email phải là một chuỗi" },
          },
          { status: 400 }
        )
      }
      if (body.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(body.email.trim())) {
          return NextResponse.json(
            {
              success: false,
              error: { code: "VALIDATION_ERROR", message: "Email không hợp lệ" },
            },
            { status: 400 }
          )
        }
        if (body.email.trim().length > 255) {
          return NextResponse.json(
            {
              success: false,
              error: { code: "VALIDATION_ERROR", message: "Email không được vượt quá 255 ký tự" },
            },
            { status: 400 }
          )
        }
      }
    }

    // 2. Validate Phone (optional, string, 10-11 digits)
    if (body.phone) {
      if (typeof body.phone !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Số điện thoại phải là một chuỗi" },
          },
          { status: 400 }
        )
      }
      const phoneDigits = body.phone.replace(/\D/g, '')
      if (!/^\d{10,11}$/.test(phoneDigits)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Số điện thoại không hợp lệ (10-11 chữ số)" },
          },
          { status: 400 }
        )
      }
    }

    // 3. Validate Position (optional, must be string if provided)
    if (body.position) {
      if (typeof body.position !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Chức vụ phải là một chuỗi" },
          },
          { status: 400 }
        )
      }
      if (body.position.trim().length > 100) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Chức vụ không được vượt quá 100 ký tự" },
          },
          { status: 400 }
        )
      }
    }

    // 4. Validate Experience (optional, must be string if provided)
    if (body.experience) {
      if (typeof body.experience !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Kinh nghiệm phải là một chuỗi" },
          },
          { status: 400 }
        )
      }
      if (body.experience.trim().length > 50) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Kinh nghiệm không được vượt quá 50 ký tự" },
          },
          { status: 400 }
        )
      }
    }

    // 5. Validate BaseSalary (optional, must be a valid positive number if provided)
    if (body.baseSalary !== undefined && body.baseSalary !== null) {
      const salaryNum = Number(body.baseSalary)
      if (isNaN(salaryNum)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Lương cứng phải là một số" },
          },
          { status: 400 }
        )
      }
      if (salaryNum < 0) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Lương cứng không được là số âm" },
          },
          { status: 400 }
        )
      }
      if (!Number.isInteger(salaryNum)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Lương cứng phải là số nguyên" },
          },
          { status: 400 }
        )
      }
      if (salaryNum > 999999999) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Lương cứng quá lớn" },
          },
          { status: 400 }
        )
      }
    }

    // 6. Validate Specialties (optional, must be array if provided)
    if (body.specialties !== undefined && body.specialties !== null) {
      if (!Array.isArray(body.specialties)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Chuyên môn phải là một mảng" },
          },
          { status: 400 }
        )
      }
      for (const specialty of body.specialties) {
        if (typeof specialty !== 'string') {
          return NextResponse.json(
            {
              success: false,
              error: { code: "VALIDATION_ERROR", message: "Mỗi chuyên môn phải là một chuỗi" },
            },
            { status: 400 }
          )
        }
      }
      const specialtiesStr = body.specialties.join(', ')
      if (specialtiesStr.length > 255) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Chuyên môn không được vượt quá 255 ký tự" },
          },
          { status: 400 }
        )
      }
    }

    // 7. Validate avatarUrl (optional, must be string if provided)
    if (body.avatarUrl && typeof body.avatarUrl !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Avatar URL phải là một chuỗi" },
        },
        { status: 400 }
      )
    }

    // Get the staff member first
    const existingStaff = await db.query.staff.findFirst({
      where: eq(staff.id, id),
      with: { user: true }
    })

    if (!existingStaff) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Staff member not found" } },
        { status: 404 }
      );
    }

    const updatedStaff = await db.transaction(async (tx) => {
      // Update user table if email or phone provided
      if (body.email || body.phone) {
        const userUpdateData: any = {}
        if (body.email) userUpdateData.email = body.email
        if (body.phone) userUpdateData.phone = body.phone

        await tx
          .update(users)
          .set(userUpdateData)
          .where(eq(users.id, existingStaff.userId))
      }

      // Update staff table
      const staffUpdateData: any = {}
      if (body.position !== undefined) staffUpdateData.position = body.position
      if (body.specialties !== undefined) staffUpdateData.specialties = body.specialties
      if (body.experience !== undefined) staffUpdateData.experience = body.experience
      if (body.avatarUrl !== undefined) staffUpdateData.avatarUrl = body.avatarUrl

      if (Object.keys(staffUpdateData).length > 0) {
        await tx
          .update(staff)
          .set(staffUpdateData)
          .where(eq(staff.id, id))
      }

      // Handle baseSalary if provided
      if (body.baseSalary !== undefined && body.baseSalary !== null) {
        const baseSalaryStr = String(body.baseSalary)
        const existing = await tx.query.staffBaseSalaries.findFirst({
          where: eq(staffBaseSalaries.staffId, id),
        });

        if (existing) {
          await tx
            .update(staffBaseSalaries)
            .set({
              baseSalary: baseSalaryStr,
              updatedAt: new Date(),
            })
            .where(eq(staffBaseSalaries.staffId, id));
        } else {
          await tx.insert(staffBaseSalaries).values({
            staffId: id,
            baseSalary: baseSalaryStr,
            notes: null,
          });
        }
      }

      return await tx.query.staff.findFirst({
        where: eq(staff.id, id),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            }
          }
        }
      });
    });

    if (!updatedStaff) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Staff member not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedStaff });
  } catch (error) {
    console.error("[Staff PUT] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to update staff" },
      },
      { status: 500 }
    );
  }
}

// --- PATCH: Thay đổi trạng thái nhân viên ---
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_ID", message: "Invalid staff ID" } },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Status is required" },
        },
        { status: 400 }
      );
    }

    const updatedStaff = await db.transaction(async (tx) => {
      const result = await tx
        .update(staff)
        .set({ status: body.status })
        .where(eq(staff.id, id))
        .returning();

      if (result.length === 0) {
        return null;
      }
      return result[0];
    });

    if (!updatedStaff) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Staff member not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updatedStaff });
  } catch (error) {
    console.error("[Staff PATCH] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message: "Failed to update staff status" },
      },
      { status: 500 }
    );
  }
}