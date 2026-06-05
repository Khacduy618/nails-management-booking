import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services, serviceCategories } from "@/db/schema";
// SỬA Ở ĐÂY: Thêm import gte và lte
import { eq, and, sql, gte, gt, lte, inArray, desc } from "drizzle-orm";
import { getClientKey, rateLimit, LIMITS, rateLimitResponse } from "@/lib/rate-limit";

// Validate and parse query parameters
function parseQueryParams(searchParams: URLSearchParams) {
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const page = Number.parseInt(searchParams.get("page") || "1");
  const limit = Number.parseInt(searchParams.get("limit") || "10");
  const popular = searchParams.get("popular");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const duration = searchParams.get("duration");

  if (isNaN(page) || page < 1) {
    throw new Error("Invalid page number");
  }
  if (isNaN(limit) || limit < 1) {
    throw new Error("Invalid limit number");
  }

  return { category, search, page, limit, popular, minPrice, maxPrice, duration };
}

export async function GET(request: NextRequest) {
  try {
    const key = `catalog:${getClientKey(request as unknown as Request)}`
    const rl = await rateLimit(key, LIMITS.catalog)
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Too many requests" }, { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetMs) as any })
    }
    const { searchParams } = request.nextUrl; // Lấy searchParams ở đây
    const { category, search, page, limit, popular, minPrice, maxPrice, duration } = parseQueryParams(searchParams);

    // Build the query conditions
    const conditions = [];

    // Condition: Service status must be active
    conditions.push(eq(services.status, "active"));

    // Condition: Filter by popular
    if (popular === 'true') {
      conditions.push(eq(services.popular, true));
    }

    // Condition: Filter by category name(s)
    if (category && category !== "all") {
      // API giờ hỗ trợ nhiều category, ví dụ: "hair,skin"
      const categoryNames = category.split(',');

      // Chúng ta cần join để lọc theo tên category
      // Cách làm này hiệu quả hơn là query trước
      // Drizzle chưa hỗ trợ join trực tiếp trong `findMany`'s `where`, ta dùng `db.select()...`
      // Tuy nhiên, để đơn giản và giữ `with`, ta sẽ query ID trước.
      const categoriesRecords = await db.query.serviceCategories.findMany({
        where: inArray(serviceCategories.name, categoryNames)
      });
      const categoryIds = categoriesRecords.map((c: any) => c.id);

      if (categoryIds.length > 0) {
        conditions.push(inArray(services.categoryId, categoryIds));
      } else {
        // Nếu không tìm thấy category nào, trả về mảng rỗng
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }
    if (duration) {
      const durationRanges = duration.split(',');
      const durationConditions = [];

      if (durationRanges.includes("30")) durationConditions.push(lte(services.duration, 30));
      if (durationRanges.includes("60")) durationConditions.push(and(gt(services.duration, 30), lte(services.duration, 60)));
      if (durationRanges.includes("90")) durationConditions.push(and(gt(services.duration, 60), lte(services.duration, 90)));
      if (durationRanges.includes("120")) durationConditions.push(gt(services.duration, 90));

      if (durationConditions.length > 0) {
        // Kết hợp các điều kiện duration bằng OR
        conditions.push(sql.join(durationConditions, sql` OR `));
      }
    }
    // Condition: Filter by price range (cast để tránh so sánh string lexicographic)
    if (minPrice) {
      const minNum = Number(minPrice);
      if (!isNaN(minNum) && minNum > 0) {
        conditions.push(gte(services.price, String(minNum)));
      }
    }
    if (maxPrice) {
      const maxNum = Number(maxPrice);
      if (!isNaN(maxNum) && maxNum > 0) {
        conditions.push(lte(services.price, String(maxNum)));
      }
    }

    // Condition: Filter by search term (name or description)
    if (search) {
      const searchPattern = `%${search.toLowerCase()}%`;
      // Sử dụng sql.raw để tránh lỗi escape ký tự '%'
      conditions.push(
        sql`(LOWER(${services.name}) LIKE ${searchPattern} OR LOWER(${services.description}) LIKE ${searchPattern})`
      );
    }

    // Combine all conditions with AND
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // --- Execute queries ---

    // 1. Query for the total count of matching services
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    if (page > totalPages && total > 0) {
      throw new Error("Page number out of range");
    }

    // 2. Query for the paginated data
    const paginatedServices = await db.query.services.findMany({
      where: whereClause,
      limit: limit,
      offset: (page - 1) * limit,
      orderBy: [desc(services.popular), desc(services.id)], // Ưu tiên dịch vụ popular
      with: {
        category: {
          columns: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: paginatedServices,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

  } catch (error: any) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}