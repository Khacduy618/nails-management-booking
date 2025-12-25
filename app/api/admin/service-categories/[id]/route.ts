import { type NextRequest } from "next/server"
import { db } from "@/db"
import { serviceCategories, services } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"
import { logError, logInfo } from "@/lib/logger"

type UpdateCategoryPayload = {
    name?: string
    description?: string
    status?: "active" | "inactive"
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const categoryId = parseInt(id)
        if (isNaN(categoryId)) {
            return fail("INVALID_INPUT", "Invalid category ID", 400)
        }

        const body = (await request.json()) as Partial<UpdateCategoryPayload>
        const { name, description, status } = body

        // Kiểm tra danh mục tồn tại
        const category = await db
            .select()
            .from(serviceCategories)
            .where(eq(serviceCategories.id, categoryId))
            .limit(1)

        if (category.length === 0) {
            logInfo(`PUT /api/admin/service-categories/:id: CATEGORY NOT FOUND (ID: ${categoryId})`, { categoryId })
            return fail("INVALID_INPUT", "Category not found", 404)
        }

        // Nếu đổi tên, kiểm tra tên mới không trùng
        if (name && name.trim().length > 0) {
            const existing = await db
                .select()
                .from(serviceCategories)
                .where(eq(serviceCategories.name, name.trim()))
                .limit(1)

            if (existing.length > 0 && existing[0].id !== categoryId) {
                logInfo(`PUT /api/admin/service-categories/:id: NAME ALREADY EXISTS (ID: ${categoryId}, Name: ${name})`, { categoryId, name })
                return fail("INVALID_INPUT", "Category name already exists", 409)
            }
        }

        // Update
        const updateData: Record<string, any> = {}
        if (name && name.trim().length > 0) updateData.name = name.trim()
        if (description !== undefined) updateData.description = description?.trim() || null
        if (status && ["active", "inactive"].includes(status)) updateData.status = status

        if (Object.keys(updateData).length === 0) {
            return fail("INVALID_INPUT", "No fields to update", 400)
        }

        await db.update(serviceCategories).set(updateData).where(eq(serviceCategories.id, categoryId))

        const updated = await db
            .select()
            .from(serviceCategories)
            .where(eq(serviceCategories.id, categoryId))
            .limit(1)

        logInfo(`PUT /api/admin/service-categories/:id: Category updated successfully (ID: ${categoryId}, Name: ${name || category[0].name}, Status: ${status || category[0].status})`, {
            categoryId,
            updatedFields: Object.keys(updateData),
        })

        return ok({ data: updated[0], message: "Category updated successfully" })
    } catch (error) {
        logError(error, { route: "/api/admin/service-categories/:id", method: "PUT" })
        return fail("SERVER_ERROR", "Unable to update category", 500)
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const categoryId = parseInt(id)
        if (isNaN(categoryId)) {
            return fail("INVALID_INPUT", "Invalid category ID", 400)
        }

        // Kiểm tra danh mục tồn tại
        const category = await db
            .select()
            .from(serviceCategories)
            .where(eq(serviceCategories.id, categoryId))
            .limit(1)

        if (category.length === 0) {
            logInfo(`DELETE /api/admin/service-categories/:id: CATEGORY NOT FOUND (ID: ${categoryId})`, { categoryId })
            return fail("INVALID_INPUT", "Category not found", 404)
        }

        // Đếm dịch vụ trong danh mục
        const serviceCount = await db
            .select({ count: count() })
            .from(services)
            .where(eq(services.categoryId, categoryId))

        const serviceCountValue = serviceCount[0]?.count || 0

        if (serviceCountValue > 0) {
            logInfo(`DELETE /api/admin/service-categories/:id: CANNOT DELETE - Category has services (ID: ${categoryId}, ServiceCount: ${serviceCountValue})`, {
                categoryId,
                serviceCount: serviceCountValue,
            })
            return fail("INVALID_INPUT", `Cannot delete category with ${serviceCountValue} service(s). Please move or delete services first.`, 409)
        }

        // Soft delete: cập nhật status và deletedAt
        const now = new Date()
        await db
            .update(serviceCategories)
            .set({
                status: "deleted",
                deletedAt: now,
            })
            .where(eq(serviceCategories.id, categoryId))

        logInfo(`DELETE /api/admin/service-categories/:id: Category soft-deleted successfully (ID: ${categoryId}, Name: ${category[0].name})`, {
            categoryId,
            categoryName: category[0].name,
        })

        return ok({ message: "Category deleted successfully" })
    } catch (error) {
        logError(error, { route: "/api/admin/service-categories/:id", method: "DELETE" })
        return fail("SERVER_ERROR", "Unable to delete category", 500)
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const categoryId = parseInt(id)
        if (isNaN(categoryId)) {
            return fail("INVALID_INPUT", "Invalid category ID", 400)
        }

        const action = new URL(request.url).searchParams.get("action")

        if (action !== "restore") {
            return fail("INVALID_INPUT", "Invalid action", 400)
        }

        // Kiểm tra danh mục bị xóa tồn tại
        const category = await db
            .select()
            .from(serviceCategories)
            .where(eq(serviceCategories.id, categoryId))
            .limit(1)

        if (category.length === 0 || category[0].status !== "deleted") {
            logInfo(`POST /api/admin/service-categories/:id (restore): CATEGORY NOT FOUND OR NOT DELETED (ID: ${categoryId})`, { categoryId })
            return fail("INVALID_INPUT", "Deleted category not found", 404)
        }

        // Restore: cập nhật status thành active
        await db
            .update(serviceCategories)
            .set({
                status: "active",
                deletedAt: null,
            })
            .where(eq(serviceCategories.id, categoryId))

        const restored = await db
            .select()
            .from(serviceCategories)
            .where(eq(serviceCategories.id, categoryId))
            .limit(1)

        logInfo(`POST /api/admin/service-categories/:id (restore): Category restored successfully (ID: ${categoryId}, Name: ${category[0].name})`, {
            categoryId,
            categoryName: category[0].name,
        })

        return ok({ data: restored[0], message: "Category restored successfully" })
    } catch (error) {
        logError(error, { route: "/api/admin/service-categories/:id", method: "POST (restore)" })
        return fail("SERVER_ERROR", "Unable to restore category", 500)
    }
}
