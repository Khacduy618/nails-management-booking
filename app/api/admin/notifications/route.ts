import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { adminNotifications } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { fail, ok } from "@/lib/api-response"
import { logError } from "@/lib/logger"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Middleware auth check helper
async function checkAdminAuth() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user?.role !== "admin" && session.user?.role !== "staff")) {
        return false
    }
    return true
}

export async function GET(request: NextRequest) {
    try {
        if (!(await checkAdminAuth())) {
            return fail("UNAUTHORIZED", "Unauthorized access", 401)
        }

        // Lấy tất cả thông báo chưa đọc, sắp xếp mới nhất lên đầu
        const notificationsList = await db
            .select()
            .from(adminNotifications)
            .where(eq(adminNotifications.isRead, false))
            .orderBy(desc(adminNotifications.createdAt))

        return ok({ data: notificationsList })
    } catch (error) {
        logError(error, { route: "/api/admin/notifications", method: "GET" })
        return fail("SERVER_ERROR", "Unable to fetch notifications", 500)
    }
}

export async function PUT(request: NextRequest) {
    try {
        if (!(await checkAdminAuth())) {
            return fail("UNAUTHORIZED", "Unauthorized access", 401)
        }

        const body = await request.json()
        const { id, all } = body

        if (all === true) {
            // Đánh dấu đã đọc tất cả
            await db
                .update(adminNotifications)
                .set({ isRead: true })
                .where(eq(adminNotifications.isRead, false))

            return ok({ message: "All notifications marked as read" })
        }

        if (!id) {
            return fail("MISSING_FIELDS", "Notification ID or all flag is required", 400)
        }

        // Đánh dấu đã đọc cho thông báo cụ thể
        const result = await db
            .update(adminNotifications)
            .set({ isRead: true })
            .where(eq(adminNotifications.id, id))
            .returning()

        if (result.length === 0) {
            return fail("NOT_FOUND", "Notification not found", 404)
        }

        return ok({ message: "Notification marked as read", data: result[0] })
    } catch (error) {
        logError(error, { route: "/api/admin/notifications", method: "PUT" })
        return fail("SERVER_ERROR", "Unable to update notification", 500)
    }
}
