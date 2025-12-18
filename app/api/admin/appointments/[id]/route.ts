import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";

// --- GET: Lấy chi tiết một lịch hẹn ---
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: {
        appointmentServices: {
          with: {
            service: { columns: { name: true } },
            staff: { columns: { name: true } }
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error(`Failed to fetch appointment ${params.id}:`, error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}

// --- PUT: Cập nhật một lịch hẹn (trạng thái, ghi chú, etc.) ---
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }
    const body = await request.json();

    // Chỉ cho phép cập nhật các trường an toàn
    const { status, notes } = body;
    const updateData: { status?: any, notes?: string } = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const [result] = (await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))) as unknown as [{ affectedRows: number }];

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Appointment not found or no changes made" }, { status: 404 });
    }

    // Lấy lại dữ liệu đã cập nhật để trả về
    const updatedAppointment = await db.query.appointments.findFirst({ where: eq(appointments.id, id) });

    return NextResponse.json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    console.error(`Failed to update appointment ${params.id}:`, error);
    return NextResponse.json({ success: false, error: "Invalid request body or server error" }, { status: 500 });
  }
}

// --- DELETE: Xóa mềm một lịch hẹn (cập nhật status thành 'cancelled') ---
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    // Thay vì db.delete, chúng ta dùng db.update để xóa mềm
    const [result] = (await db
      .update(appointments)
      .set({ status: 'cancelled' })
      .where(eq(appointments.id, id))) as unknown as [{ affectedRows: number }];

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error(`Failed to cancel appointment ${params.id}:`, error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}