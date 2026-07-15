import crypto from "crypto"

const getEncryptionKey = (): Buffer => {
  let secret = process.env.NEXT_PUBLIC_ENCRYPTION_KEY
  if (!secret) {
    throw new Error("NEXT_PUBLIC_ENCRYPTION_KEY is not set. Please configure it in your environment variables.")
  }
  if (secret.startsWith('"') && secret.endsWith('"')) {
    secret = secret.slice(1, -1)
  }
  return crypto.createHash("sha256").update(secret).digest()
}

const getBlindIndexSecret = (): string => {
  let secret = process.env.NEXT_PUBLIC_ENCRYPTION_KEY
  if (!secret) {
    throw new Error("NEXT_PUBLIC_ENCRYPTION_KEY is not set. Please configure it in your environment variables.")
  }
  if (secret.startsWith('"') && secret.endsWith('"')) {
    secret = secret.slice(1, -1)
  }
  return secret
}

/**
 * Mã hóa dữ liệu bằng thuật toán AES-256-GCM
 * Định dạng lưu trữ: v1:iv_hex:ciphertext_hex:tag_hex
 */
export function encrypt(text: string | null | undefined): string | null {
  if (text === null || text === undefined) return null
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(12) // IV tiêu chuẩn cho GCM là 12 bytes
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
    
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    
    const tag = cipher.getAuthTag().toString("hex")
    
    return `v1:${iv.toString("hex")}:${encrypted}:${tag}`
  } catch (error) {
    console.error("Encryption failed:", error)
    return null
  }
}

/**
 * Giải mã dữ liệu sử dụng AES-256-GCM
 */
export function decrypt(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null
  if (!encryptedText.startsWith("v1:")) {
    // Trả về trực tiếp nếu dữ liệu chưa được mã hóa (để tương thích ngược)
    return encryptedText
  }
  
  try {
    const parts = encryptedText.split(":")
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted format")
    }
    
    const [, ivHex, ciphertextHex, tagHex] = parts
    const key = getEncryptionKey()
    const iv = Buffer.from(ivHex, "hex")
    const tag = Buffer.from(tagHex, "hex")
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(ciphertextHex, "hex", "utf8")
    decrypted += decipher.final("utf8")
    
    return decrypted
  } catch (error) {
    console.error("Decryption failed:", error)
    return null
  }
}

/**
 * Tạo Blind Index bằng HMAC-SHA256 để tìm kiếm chính xác trường đã mã hóa
 */
export function generateBlindIndex(text: string | null | undefined): string | null {
  if (text === null || text === undefined) return null
  try {
    // Chuẩn hóa chuỗi trước khi băm để đảm bảo tìm kiếm chính xác (ví dụ: viết thường, loại bỏ khoảng trắng)
    const normalized = text.trim().toLowerCase().replace(/\s/g, "")
    const secret = getBlindIndexSecret()
    return crypto
      .createHmac("sha256", secret)
      .update(normalized)
      .digest("hex")
  } catch (error) {
    console.error("Failed to generate blind index:", error)
    return null
  }
}
