import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { appointments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { sendReviewRequestEmail, sendConfirmationEmail, sendCancellationEmail } from "@/lib/email-service";

async function executeQuery<T>(query: any): Promise<T[]> {
  if (query && typeof query.returning === "function") {
    return query.returning();
  }
  if (query && typeof query.execute === "function") {
    return query.execute();
  }
  return query as T[];
}

// --- GET: Lấy chi tiết một lịch hẹn ---
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params
  try {
    const id = Number.parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    const appointment = await db.query.appointments.findFirst({
      where: eq(appointments.id, id),
      with: {
        appointmentServices: {
          with: {
            service: { columns: { name: true } },
            staff: {
              with: {
                user: {
                  columns: { email: true, phone: true }
                }
              }
            }
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error(`Failed to fetch appointment ${paramId}:`, error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}

// --- PUT: Cập nhật một lịch hẹn (trạng thái, ghi chú, etc.) ---
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params
  try {
    const id = Number.parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }
    const body = await request.json();

    // Chỉ cho phép cập nhật các trường an toàn
    const { status, notes } = body;
    const updateData: { status?: any, notes?: string, reviewToken?: string } = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    // Check status transitions and set email flags
    let shouldSendReviewEmail = false;
    let shouldSendConfirmationEmail = false;
    let shouldSendCancellationEmail = false;

    if (status) {
      const existing = await db.query.appointments.findFirst({
        where: eq(appointments.id, id),
        columns: { status: true, reviewToken: true }
      });
      if (existing) {
        if (status === 'completed' && existing.status !== 'completed') {
          if (!existing.reviewToken) {
            updateData.reviewToken = randomUUID();
          }
          shouldSendReviewEmail = true;
        } else if (status === 'confirmed' && existing.status !== 'confirmed') {
          shouldSendConfirmationEmail = true;
        } else if (status === 'cancelled' && existing.status !== 'cancelled') {
          shouldSendCancellationEmail = true;
        }
      }
    }

    const updateQuery = db.update(appointments).set(updateData).where(eq(appointments.id, id))

    const result = await executeQuery<any>(updateQuery)

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Appointment not found or no changes made" }, { status: 404 });
    }

    const updatedAppointment = result[0];

    // If completed, confirmed, or cancelled, send the appropriate email
    if (shouldSendReviewEmail || shouldSendConfirmationEmail || shouldSendCancellationEmail) {
      const fullApt = await db.query.appointments.findFirst({
        where: eq(appointments.id, id),
        with: {
          customer: true,
          appointmentServices: {
            with: {
              service: true,
              staff: {
                with: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (fullApt && fullApt.customer?.email) {
        const staffName = fullApt.appointmentServices?.[0]?.staff?.user?.name || "Nhân viên";
        const emailData = {
          appointmentId: fullApt.id,
          customerName: fullApt.customerName,
          customerEmail: fullApt.customer.email,
          customerPhone: fullApt.customerPhone,
          appointmentDate: fullApt.appointmentDate,
          appointmentTime: fullApt.appointmentTime,
          services: fullApt.appointmentServices.map((as: any) => ({
            name: as.service.name,
            price: as.priceAtBooking.toString(),
          })),
          staffName,
          totalPrice: Number(fullApt.priceAtBooking),
          totalDuration: fullApt.durationAtBooking,
          notes: fullApt.notes,
          reviewToken: fullApt.reviewToken || updateData.reviewToken || "",
        };
        
        if (shouldSendReviewEmail && emailData.reviewToken) {
          sendReviewRequestEmail(emailData).catch(err => {
            console.error("Error sending review request email:", err);
          });
        } else if (shouldSendConfirmationEmail) {
          sendConfirmationEmail(emailData).catch(err => {
            console.error("Error sending confirmation email:", err);
          });
        } else if (shouldSendCancellationEmail) {
          sendCancellationEmail(emailData).catch(err => {
            console.error("Error sending cancellation email:", err);
          });
        }
      }
    }

    return NextResponse.json({ success: true, appointment: updatedAppointment });
  } catch (error) {
    console.error(`Failed to update appointment ${paramId}:`, error);
    return NextResponse.json({ success: false, error: "Invalid request body or server error" }, { status: 500 });
  }
}

// --- DELETE: Xóa mềm một lịch hẹn (cập nhật status thành 'cancelled') ---
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: paramId } = await params
  try {
    const id = Number.parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointment ID" }, { status: 400 });
    }

    // Thay vì db.delete, chúng ta dùng db.update để xóa mềm
    const deleteQuery = db.update(appointments).set({ status: 'cancelled' }).where(eq(appointments.id, id))

    const result = await executeQuery(deleteQuery)

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error(`Failed to cancel appointment ${paramId}:`, error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}