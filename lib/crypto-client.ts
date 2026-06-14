/**
 * Isomorphic/Browser-safe Cryptography utility using Web Crypto API.
 * This file does NOT import Node's 'crypto' module, making it safe for the browser.
 */

const getSecret = (): string => {
  let secret = process.env.ENCRYPTION_KEY || "nails-booking-app-default-secure-secret-32-chars"
  if (secret.startsWith('"') && secret.endsWith('"')) {
    secret = secret.slice(1, -1)
  }
  return secret
}

// Helper to convert hex string to Uint8Array
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

// Helper to convert Uint8Array to hex string
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Derive a CryptoKey from a secret string using SHA-256
async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const secretData = encoder.encode(secret)
  
  // Use globalThis.crypto for isomorphic environment support
  const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto
  const hashBuffer = await cryptoObj.subtle.digest("SHA-256", secretData)
  
  return cryptoObj.subtle.importKey(
    "raw",
    hashBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * Encrypt a text string using AES-256-GCM.
 * Output format: v1:iv_hex:ciphertext_hex:tag_hex (compatible with Node crypto)
 */
export async function encryptAsync(text: string | null | undefined): Promise<string | null> {
  if (text === null || text === undefined) return null
  try {
    const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto
    const secret = getSecret()
    const key = await getCryptoKey(secret)
    const iv = cryptoObj.getRandomValues(new Uint8Array(12)) // 12-byte IV for GCM
    
    const encoder = new TextEncoder()
    const encodedText = encoder.encode(text)
    
    const encryptedBuffer = await cryptoObj.subtle.encrypt(
      { name: "AES-GCM", iv: iv as any },
      key,
      encodedText
    )
    
    const encryptedBytes = new Uint8Array(encryptedBuffer)
    const ciphertextBytes = encryptedBytes.subarray(0, -16)
    const tagBytes = encryptedBytes.subarray(-16)
    
    return `v1:${bytesToHex(iv)}:${bytesToHex(ciphertextBytes)}:${bytesToHex(tagBytes)}`
  } catch (error) {
    console.error("Encryption failed:", error)
    return null
  }
}

/**
 * Decrypt a v1 AES-256-GCM ciphertext string.
 */
export async function decryptAsync(encryptedText: string | null | undefined): Promise<string | null> {
  if (!encryptedText) return null
  if (!encryptedText.startsWith("v1:")) {
    // Return direct if not encrypted (for backward compatibility)
    return encryptedText
  }
  
  try {
    const parts = encryptedText.split(":")
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted format")
    }
    
    const [, ivHex, ciphertextHex, tagHex] = parts
    const cryptoObj = typeof window !== "undefined" ? window.crypto : globalThis.crypto
    const secret = getSecret()
    const key = await getCryptoKey(secret)
    
    const iv = hexToBytes(ivHex)
    const ciphertext = hexToBytes(ciphertextHex)
    const tag = hexToBytes(tagHex)
    
    // Concatenate ciphertext and tag back together for Web Crypto API GCM decrypt
    const encryptedData = new Uint8Array(ciphertext.length + tag.length)
    encryptedData.set(ciphertext)
    encryptedData.set(tag, ciphertext.length)
    
    const decryptedBuffer = await cryptoObj.subtle.decrypt(
      { name: "AES-GCM", iv: iv as any },
      key,
      encryptedData as any
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (error) {
    console.error("Decryption failed:", error)
    return null
  }
}
