import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staffBaseSalaries, staff } from "@/db/schema";
import { eq } from "drizzle-orm";

// --- GET: Lấy lương cứng của nhân viên ---
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const staffId = Number.parseInt(params.id);
        if (isNaN(staffId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "INVALID_ID", message: "Invalid staff ID" },
                },
                { status: 400 }
            );
        }

        // Check if staff exists
        const staffMember = await db.query.staff.findFirst({
            where: eq(staff.id, staffId),
        });

        if (!staffMember) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "NOT_FOUND", message: "Staff member not found" },
                },
                { status: 404 }
            );
        }

        // Get base salary
        const salary = await db.query.staffBaseSalaries.findFirst({
            where: eq(staffBaseSalaries.staffId, staffId),
        });

        return NextResponse.json({
            success: true,
            data: {
                staffId,
                baseSalary: salary ? Number(salary.baseSalary) : null,
                notes: salary?.notes || null,
            },
        });
    } catch (error) {
        console.error("[Staff Salary GET] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: { code: "SERVER_ERROR", message: "Failed to fetch salary" },
            },
            { status: 500 }
        );
    }
}

// --- PUT: Cập nhật lương cứng của nhân viên ---
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const staffId = Number.parseInt(params.id);
        if (isNaN(staffId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "INVALID_ID", message: "Invalid staff ID" },
                },
                { status: 400 }
            );
        }

        const body = await request.json();

        if (!body.baseSalary && body.baseSalary !== 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "INVALID_INPUT", message: "Base salary is required" },
                },
                { status: 400 }
            );
        }

        // Check if staff exists
        const staffMember = await db.query.staff.findFirst({
            where: eq(staff.id, staffId),
        });

        if (!staffMember) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: "NOT_FOUND", message: "Staff member not found" },
                },
                { status: 404 }
            );
        }

        const result = await db.transaction(async (tx) => {
            // Check if salary record exists
            const existing = await tx.query.staffBaseSalaries.findFirst({
                where: eq(staffBaseSalaries.staffId, staffId),
            });

            if (existing) {
                // Update existing
                await tx
                    .update(staffBaseSalaries)
                    .set({
                        baseSalary: body.baseSalary.toString(),
                        notes: body.notes || null,
                        updatedAt: new Date(),
                    })
                    .where(eq(staffBaseSalaries.staffId, staffId));
            } else {
                // Create new
                await tx.insert(staffBaseSalaries).values({
                    staffId,
                    baseSalary: body.baseSalary.toString(),
                    notes: body.notes || null,
                });
            }

            return await tx.query.staffBaseSalaries.findFirst({
                where: eq(staffBaseSalaries.staffId, staffId),
            });
        });

        return NextResponse.json({
            success: true,
            data: {
                staffId,
                baseSalary: result ? Number(result.baseSalary) : null,
                notes: result?.notes || null,
            },
        });
    } catch (error) {
        console.error("[Staff Salary PUT] Error:", error);
        return NextResponse.json(
            {
                success: false,
                error: { code: "SERVER_ERROR", message: "Failed to update salary" },
            },
            { status: 500 }
        );
    }
}
