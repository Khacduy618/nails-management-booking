import { type NextRequest } from "next/server"
import { db } from "@/db"
import { serviceCategories, services } from "@/db/schema"
import { eq, and, isNull, not, count, asc, desc, like, sql } from "drizzle-orm"
import { ok, fail } from "@/lib/api-response"
import { logError, logInfo } from "@/lib/logger"

type CreateCategoryPayload = {
    name: string
    description?: string
}

type UpdateCategoryPayload = {
    name?: string
    description?: string
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const includeDeleted = searchParams.get("includeDeleted") === "true"
        const includeInactive = searchParams.get("includeInactive") === "true"
        const searchQuery = (searchParams.get("search") || "").trim()
        const sortBy = searchParams.get("sort") || "name"

        let page = 1
        let limit = 12

        try {
            const pageParam = searchParams.get("page")
            if (pageParam) page = Math.max(1, parseInt(pageParam, 10))
        } catch (e) {
            page = 1
        }

        try {
            const limitParam = searchParams.get("limit")
            if (limitParam) limit = Math.max(1, Math.min(100, parseInt(limitParam, 10)))
        } catch (e) {
            limit = 12
        }

        const validPage = page
        const validLimit = limit
        const offset = (validPage - 1) * validLimit

        let whereCondition: any

        if (includeDeleted) {
            // Return only deleted categories
            whereCondition = eq(serviceCategories.status, "deleted")
        } else if (includeInactive) {
            // Return only inactive categories
            whereCondition = eq(serviceCategories.status, "inactive")
        } else {
            // Return only active categories (default)
            whereCondition = eq(serviceCategories.status, "active")
        }

        // Add search filter if provided and not empty
        if (searchQuery && searchQuery.length > 0) {
            whereCondition = and(whereCondition, like(serviceCategories.name, `%${searchQuery}%`))
        }

        // Determine sort order
        const orderByClause = sortBy === "created" ? desc(serviceCategories.id) : asc(serviceCategories.name)

        // Get total count for pagination
        const countResult = await db
            .select({ count: count() })
            .from(serviceCategories)
            .where(whereCondition)

        const total = countResult[0]?.count || 0
        const totalPages = Math.ceil(total / validLimit)

        // Get paginated data
        const categories = await db
            .select()
            .from(serviceCategories)
            .where(whereCondition)
            .orderBy(orderByClause)
            .limit(validLimit)
            .offset(offset)

        logInfo(`GET /api/admin/service-categories: Retrieved ${categories.length} categories`, {
            page: validPage,
            limit: validLimit,
            total,
            searchQuery,
            sortBy,
            includeDeleted,
            includeInactive,
        })

        return ok({
            data: categories,
            meta: {
                page: validPage,
                limit: validLimit,
                total,
                totalPages,
            },
        })
    } catch (error) {
        logError(error, { route: "/api/admin/service-categories", method: "GET" })
        return fail("SERVER_ERROR", "Unable to fetch service categories", 500)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as Partial<CreateCategoryPayload>
        const { name, description } = body

        if (!name || name.trim().length === 0) {
            logInfo("POST /api/admin/service-categories: VALIDATION FAILED - Missing name", { name })
            return fail("INVALID_INPUT", "Category name is required", 400)
        }

        // Kiểm tra tên đã tồn tại không (active categories)
        const existing = await db
            .select()
            .from(serviceCategories)
            .where(and(eq(serviceCategories.name, name.trim()), eq(serviceCategories.status, "active")))
            .limit(1)

        if (existing.length > 0) {
            logInfo("POST /api/admin/service-categories: NAME ALREADY EXISTS", { name: name.trim() })
            return fail("INVALID_INPUT", "Category name already exists", 409)
        }

        const result = await db.insert(serviceCategories).values({
            name: name.trim(),
            description: description?.trim() || null,
            status: "active",
        }).returning()

        const newCategory = result[0]

        logInfo(`POST /api/admin/service-categories: Category created successfully (ID: ${newCategory.id}, Name: ${name})`, {
            categoryId: newCategory.id,
            name: name.trim(),
        })

        return ok({ data: newCategory, message: "Category created successfully" }, 201)
    } catch (error) {
        logError(error, { route: "/api/admin/service-categories", method: "POST" })
        return fail("SERVER_ERROR", "Unable to create category", 500)
    }
}
