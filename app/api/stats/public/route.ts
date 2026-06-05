import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services, customers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getClientKey, rateLimit, LIMITS, rateLimitResponse } from "@/lib/rate-limit";

let cachedStats: { totalCustomers: number; totalServices: number } | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // Cache 5 phút

export async function GET(request: NextRequest) {
  try {
    const key = `stats-public:${getClientKey(request as unknown as Request)}`;
    const rl = await rateLimit(key, LIMITS.catalog);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429, headers: rateLimitResponse(rl.remaining, rl.resetMs) as any }
      );
    }

    const now = Date.now();
    if (cachedStats && now < cacheExpiry) {
      return NextResponse.json({
        success: true,
        data: cachedStats,
      });
    }

    // Truy vấn dữ liệu đếm
    // 1. Số lượng dịch vụ đang hoạt động
    const servicesCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(services)
      .where(eq(services.status, "active"));

    // 2. Số lượng khách hàng
    const customersCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers);

    const totalServices = Number(servicesCountResult[0]?.count || 0);
    const totalCustomers = Number(customersCountResult[0]?.count || 0);

    cachedStats = {
      totalCustomers,
      totalServices,
    };
    cacheExpiry = now + CACHE_TTL;

    return NextResponse.json({
      success: true,
      data: cachedStats,
    });
  } catch (error: any) {
    console.error("Failed to fetch public stats:", error);
    return NextResponse.json(
      { success: false, error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
