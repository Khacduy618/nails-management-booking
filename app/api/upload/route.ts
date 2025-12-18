import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir, stat } from "fs/promises"
import path from "path"
import { randomBytes } from "crypto"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { fileTypeFromBuffer } from "file-type"

const ALLOWED_MIME: Record<string, { ext: string; maxSize: number }> = {
  "image/png": { ext: "png", maxSize: 5 * 1024 * 1024 },
  "image/jpeg": { ext: "jpg", maxSize: 5 * 1024 * 1024 },
  "image/webp": { ext: "webp", maxSize: 5 * 1024 * 1024 },
  "image/gif": { ext: "gif", maxSize: 2 * 1024 * 1024 },
  "video/mp4": { ext: "mp4", maxSize: 50 * 1024 * 1024 },
}

const sanitizeFilename = (input: string) =>
  input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "file"

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const data = await request.formData()
  const file = data.get("file") as File | null

  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 })
  }

  // Server-side sniff MIME
  if (file.size > 50 * 1024 * 1024) {
    return NextResponse.json({ success: false, error: "File exceeds size limit." }, { status: 413 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const detected = await fileTypeFromBuffer(buffer)
  const mime = detected?.mime || (file.type?.toLowerCase() || "")
  const rule = ALLOWED_MIME[mime]
  if (!rule) {
    return NextResponse.json({ success: false, error: "Unsupported file type." }, { status: 415 })
  }
  if (buffer.length > rule.maxSize) {
    return NextResponse.json({ success: false, error: "File exceeds size limit." }, { status: 413 })
  }

  const relativeUploadDir = "/uploads"
  const uploadDir = path.join(process.cwd(), "public", relativeUploadDir)

  try {
    if (!(await pathExists(uploadDir))) {
      await mkdir(uploadDir, { recursive: true })
    }
  } catch (e) {
    console.error("Error creating upload directory:", e)
    return NextResponse.json({ success: false, error: "Failed to create upload directory." }, { status: 500 })
  }

  const originalName = file.name.replace(/\.[^/.]+$/, "")
  const safeName = sanitizeFilename(originalName)
  const uniqueSuffix = randomBytes(6).toString("hex")
  const filename = `${safeName}-${uniqueSuffix}.${rule.ext}`

  try {
    await writeFile(path.join(uploadDir, filename), buffer)
    const fileUrl = path.posix.join(relativeUploadDir, filename)
    return NextResponse.json({ success: true, url: fileUrl })
  } catch (e) {
    console.error("Error writing file:", e)
    return NextResponse.json({ success: false, error: "Failed to write file." }, { status: 500 })
  }
}
