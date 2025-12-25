import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";

const sanitizePhone = (phone: string) => phone.replace(/\D/g, "");
// --- PUT: Cập nhật lịch hẹn (chủ yếu là status) ---
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = Number.parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body; // Chỉ cho phép cập nhật một số trường an toàn, ví dụ status

    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required for update" }, { status: 400 });
    }

    const updatedAppointment = await db.transaction(async (tx) => {
      const result = await tx
        .update(appointments)
        .set({ status: status })
        .where(eq(appointments.id, id))
        .returning();

      if (result.length === 0) {
        return null;
      }

      return result[0];
    });


    if (!updatedAppointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedAppointment,
      message: "Appointment updated successfully",
    });

  } catch (error) {
    console.error("Failed to update appointment:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}

// --- DELETE (logic hủy lịch) ---
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = Number.parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    // Require phone ownership verification
    const url = new URL(request.url)
    const phoneParam = url.searchParams.get("phone") || ""
    const sanitizedPhone = sanitizePhone(phoneParam)
    if (!sanitizedPhone) {
      return NextResponse.json({ success: false, error: "Phone verification required" }, { status: 401 })
    }

    const apt = await db.query.appointments.findFirst({ where: eq(appointments.id, id) })
    if (!apt) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 })
    }

    const ownerPhone = sanitizePhone(apt.customerPhone)
    if (ownerPhone !== sanitizedPhone) {
      return NextResponse.json({ success: false, error: "Not authorized to cancel this appointment" }, { status: 403 })
    }

    // Thay vì xóa, chúng ta cập nhật trạng thái thành 'cancelled'
    const result = await db
      .update(appointments)
      .set({ status: 'cancelled' })
      .where(eq(appointments.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
    });

  } catch (error) {
    console.error("Failed to cancel appointment:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}