import { withEncryption } from "@/lib/api-middleware";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { serviceCategories } from "@/db/schema";
import { asc } from "drizzle-orm";

async function _GET() {
  try {
    // Truy vấn tất cả các danh mục từ database, sắp xếp theo tên
    const allCategories = await db.query.serviceCategories.findMany({
      orderBy: [asc(serviceCategories.name)],
    });

    return NextResponse.json({ categories: allCategories });
  } catch (error) {
    console.error("Failed to fetch service categories:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

// Thêm dòng này để Next.js không cache kết quả API một cách tĩnh
// Điều này đảm bảo rằng nếu bạn thêm category mới, nó sẽ xuất hiện ngay lập tức
export const dynamic = 'force-dynamic';

// Wrapped exports for encryption/decryption
export const GET = withEncryption(_GET);
