import { withEncryption } from "@/lib/api-middleware";
import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fileTypeFromBuffer } from "file-type";

const ALLOWED_MIME: Record<string, { ext: string; maxSize: number }> = {
  "image/png": { ext: "png", maxSize: 4.5 * 1024 * 1024 },
  "image/jpeg": { ext: "jpg", maxSize: 4.5 * 1024 * 1024 },
  "image/webp": { ext: "webp", maxSize: 4.5 * 1024 * 1024 },
  "image/gif": { ext: "gif", maxSize: 4.5 * 1024 * 1024 },
  // "video/mp4": { ext: "mp4", maxSize: 4.5 * 1024 * 1024 }, // Tạm tắt video vì giới hạn 4.5MB của Serverless
}

async function _POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  // 1. Kiểm tra quyền truy cập
  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Lấy file từ request
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
  }

  // 3. Kiểm tra sơ bộ kích thước (4.5MB limit của Vercel Serverless)
  if (file.size > 4.5 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: "File size too large (Max 4.5MB)." }, { status: 413 });
  }

  // 4. Validate loại file (Magic Number Check)
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const detected = await fileTypeFromBuffer(buffer);

  const mime = detected?.mime || (file.type?.toLowerCase() || "");
  const rule = ALLOWED_MIME[mime];

  if (!rule) {
    return NextResponse.json({
      success: false,
      error: `Unsupported file type: ${mime}. Allowed: png, jpg, webp, gif.`
    }, { status: 415 });
  }

  try {
    // 5. Upload lên Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
      contentType: mime, // Đảm bảo content-type chính xác
    });

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Error uploading to Vercel Blob:", error);
    return NextResponse.json({ success: false, error: "Failed to upload file." }, { status: 500 });
  }
}


// Wrapped exports for encryption/decryption
export const POST = withEncryption(_POST);
