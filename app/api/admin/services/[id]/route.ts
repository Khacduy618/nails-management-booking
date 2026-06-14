import { withEncryption } from "@/lib/api-middleware";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services, staffServices } from "@/db/schema";
import { eq } from "drizzle-orm";

// --- GET: Lấy chi tiết một dịch vụ ---
async function _GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = Number.parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
    }
    const service = await db.query.services.findFirst({
      where: eq(services.id, id),
      with: {
        category: {
          columns: { name: true }
        },
        staffServices: {
          with: {
            staff: {
              with: {
                user: {
                  columns: { email: true, name: true }
                }
              },
              columns: {
                id: true,
                position: true,
              }
            }
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Failed to fetch service details:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

// --- PUT: Cập nhật dịch vụ ---
async function _PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = Number.parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
    }

    const body = await request.json();
    const { staffIds, ...serviceData } = body;

    const updatedService = await db.transaction(async (tx: any) => {
      await tx.update(services).set(serviceData).where(eq(services.id, id));

      // 2. Cập nhật bảng staff_services: Xóa liên kết cũ, thêm liên kết mới
      await tx.delete(staffServices).where(eq(staffServices.serviceId, id));
      if (staffIds && staffIds.length > 0) {
        const staffServiceValues = staffIds.map((staffId: number) => ({
          serviceId: id,
          staffId: staffId,
        }));

        await tx.insert(staffServices).values(staffServiceValues);
      }
      return await tx.query.services.findFirst({ where: eq(services.id, id) });
    });

    if (!updatedService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ service: updatedService });
  } catch (error) {
    console.error("Failed to update service:", error);
    return NextResponse.json({ error: "Invalid request body or server error" }, { status: 500 });
  }
}

// --- DELETE: Xóa dịch vụ ---
async function _DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paramId } = await params
    const id = Number.parseInt(paramId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
    }

    // Thay vì db.delete, chúng ta dùng db.update
    const result = await db
      .update(services)
      .set({ status: 'archived' }) // Chuyển trạng thái thành 'archived'
      .where(eq(services.id, id))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Service archived successfully" });
  } catch (error: any) {
    console.error("Failed to archive service:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}

// Wrapped exports for encryption/decryption
export const GET = withEncryption(_GET);
export const PUT = withEncryption(_PUT);
export const DELETE = withEncryption(_DELETE);
