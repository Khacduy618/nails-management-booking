import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { services, serviceCategories, staffServices } from "@/db/schema";
import { eq, and, sql, asc, desc, count } from "drizzle-orm";

// --- GET: Lấy toàn bộ dịch vụ cho trang admin ---
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const searchTerm = searchParams.get("search");
    const categoryName = searchParams.get("category");
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "newest";

    const conditions = [];

    if (searchTerm) {
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      conditions.push(sql`LOWER(${services.name}) LIKE ${searchPattern}`);
    }

    if (categoryName && categoryName !== "all") {
      conditions.push(eq(serviceCategories.name, categoryName));
    }
    // Xử lý sắp xếp
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 2. Xây dựng logic sắp xếp
    let orderByClause;
    switch (sortBy) {
      case 'oldest':
        orderByClause = asc(services.createdAt);
        break;
      case 'popular':
        orderByClause = desc(services.popular); // Sắp xếp dịch vụ popular lên đầu
        break;
      case 'price-asc':
        orderByClause = asc(services.price);
        break;
      case 'price-desc':
        orderByClause = desc(services.price);
        break;
      case 'newest':
      default:
        orderByClause = desc(services.createdAt);
        break;
    }


    // Join với categories để lọc theo tên
    const query = db
      .select({
        id: services.id, name: services.name, price: services.price, duration: services.duration,
        status: services.status, imageUrl: services.imageUrl,
        category: { name: serviceCategories.name },
      })
      .from(services)
      .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(whereClause)
      .orderBy(orderByClause);

    // 4. Lấy tổng số lượng để phân trang (chạy song song)
    const totalQuery = db
      .select({ total: count() })
      .from(services)
      .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(whereClause);

    // 5. Thực thi cả hai truy vấn
    const [
      paginatedServices,
      totalResult
    ] = await Promise.all([
      query.limit(limit).offset((page - 1) * limit),
      totalQuery
    ]);

    const total = totalResult[0].total;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      services: paginatedServices,
      pagination: { page, limit, total, totalPages }
    });
  } catch (error) {
    console.error("Failed to fetch services for admin:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

// --- POST: Tạo dịch vụ mới ---
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffIds, ...serviceData } = body;

    // Validate
    if (!body.name || !body.price || !body.duration || !body.categoryId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newService = await db.transaction(async (tx) => {
        const [result] = await tx
        .insert(services)
        .values(body) as unknown as [{ insertId: number }];
      const newId = result.insertId;
      if (staffIds && staffIds.length > 0) {
        const staffServiceValues = staffIds.map((staffId: number) => ({
          serviceId: newId,
          staffId: staffId,
        }));
        await tx.insert(staffServices).values(staffServiceValues);
      }
        return await tx.query.services.findFirst({
            where: eq(services.id, newId),
        });
    });


    return NextResponse.json({ service: newService }, { status: 201 });
  } catch (error) {
    console.error("Failed to create service:", error);
    return NextResponse.json({ error: "Invalid request body or server error" }, { status: 500 });
  }
}