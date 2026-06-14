import { withEncryption } from "@/lib/api-middleware";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services, serviceCategories } from "@/db/schema";
import { eq, and, sql, gte, lte, min, max, count, desc, gt, inArray } from "drizzle-orm";

function parseMetaQueryParams(searchParams: URLSearchParams) {
    const searchTerm = searchParams.get("search");
    const categories = searchParams.get("category")?.split(',').filter(Boolean);
    const durations = searchParams.get("duration")?.split(',').filter(Boolean);
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    return { searchTerm, categories, durations, minPrice, maxPrice };
}

function createDurationConditions(durationRanges: string[]) {
    const conditions = [];
    if (durationRanges.includes("30")) conditions.push(lte(services.duration, 30));
    if (durationRanges.includes("60")) conditions.push(and(gt(services.duration, 30), lte(services.duration, 60)));
    if (durationRanges.includes("90")) conditions.push(and(gt(services.duration, 60), lte(services.duration, 90)));
    if (durationRanges.includes("120")) conditions.push(gt(services.duration, 90));
    return conditions.length > 0 ? [sql.join(conditions, sql` OR `)] : [];
}

async function _GET(request: NextRequest) {
  try {
    const { searchTerm, categories, durations, minPrice, maxPrice } = parseMetaQueryParams(request.nextUrl.searchParams);

    // --- Xây dựng các nhóm điều kiện lọc ---
    const searchCondition = searchTerm 
      ? [sql`(LOWER(${services.name}) LIKE ${`%${searchTerm.toLowerCase()}%`} OR LOWER(${services.description}) LIKE ${`%${searchTerm.toLowerCase()}%`})`] 
      : [];
      
    const categoryCondition = (categories && categories.length > 0)
      ? [inArray(serviceCategories.name, categories)]
      : [];

    const durationCondition = (durations && durations.length > 0)
      ? createDurationConditions(durations)
      : [];

    const priceCondition = [
        ...(minPrice ? [gte(services.price, minPrice)] : []),
        ...(maxPrice ? [lte(services.price, maxPrice)] : []),
    ];

    // --- SỬA LỖI Ở ĐÂY: Xây dựng các điều kiện where một cách an toàn ---
    const whereForCategories = and(eq(services.status, "active"), ...searchCondition, ...durationCondition, ...priceCondition);
    const whereForDurations = and(eq(services.status, "active"), ...searchCondition, ...categoryCondition, ...priceCondition);
    const whereForPrice = and(eq(services.status, "active"), ...searchCondition, ...categoryCondition, ...durationCondition);

    // --- 1. Tính toán các CATEGORY có sẵn ---
    const categoryQuery = db
        .select({
            id: serviceCategories.id,
            name: serviceCategories.name,
            count: count(services.id),
        })
        .from(services)
        .rightJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .where(whereForCategories)
        .groupBy(serviceCategories.id, serviceCategories.name)
        .orderBy(desc(count(services.id)));

    // --- 2. Tính toán các DURATION có sẵn ---
    const durationQuery = db
        .select({
            range30: sql<number>`SUM(CASE WHEN ${services.duration} <= 30 THEN 1 ELSE 0 END)`.mapWith(Number),
            range60: sql<number>`SUM(CASE WHEN ${services.duration} > 30 AND ${services.duration} <= 60 THEN 1 ELSE 0 END)`.mapWith(Number),
            range90: sql<number>`SUM(CASE WHEN ${services.duration} > 60 AND ${services.duration} <= 90 THEN 1 ELSE 0 END)`.mapWith(Number),
            range120: sql<number>`SUM(CASE WHEN ${services.duration} > 90 THEN 1 ELSE 0 END)`.mapWith(Number),
        })
        .from(services)
        .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .where(whereForDurations);

    // --- 3. Tính toán KHOẢNG GIÁ có sẵn ---
    const priceRangeQuery = db
        .select({
            minPrice: min(services.price),
            maxPrice: max(services.price),
        })
        .from(services)
        .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
        .where(whereForPrice);

    // --- Chạy các query song song ---
    const [
        availableCategoriesResult, 
        durationResult, 
        priceRangeResult
    ] = await Promise.all([
        categoryQuery,
        durationQuery,
        priceRangeQuery
    ]);

    // Format lại dữ liệu
    const availableCategories = availableCategoriesResult.filter((c: any) => c.count > 0);
    const availableDurations = [
        { id: '30', label: "Dưới 30 phút", count: durationResult[0]?.range30 || 0 },
        { id: '60', label: "30 - 60 phút", count: durationResult[0]?.range60 || 0 },
        { id: '90', label: "60 - 90 phút", count: durationResult[0]?.range90 || 0 },
        { id: '120', label: "Trên 90 phút", count: durationResult[0]?.range120 || 0 },
    ].filter(d => d.count > 0);

    return NextResponse.json({
      meta: {
        categories: availableCategories,
        durations: availableDurations,
        priceRange: {
            min: Number(priceRangeResult[0].minPrice || 0),
            max: Number(priceRangeResult[0].maxPrice || 1000000)
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch services metadata:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

// Wrapped exports for encryption/decryption
export const GET = withEncryption(_GET);
