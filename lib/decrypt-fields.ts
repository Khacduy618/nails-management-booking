/**
 * Shared utility to decrypt PII fields from API responses.
 * Used by admin components to decrypt encrypted data before display.
 * Only decrypts fields that start with "v1:" (encrypted format).
 */
import { decryptAsync } from "@/lib/crypto-client"

/**
 * Decrypt a single field value if it's encrypted (starts with "v1:")
 */
export async function decryptField(value: string | null | undefined): Promise<string> {
  if (!value) return ""
  if (!value.startsWith("v1:")) return value
  return (await decryptAsync(value)) || ""
}

/**
 * Decrypt specific PII fields in an object.
 * Only processes fields listed in `fieldNames`.
 * Returns a new object with decrypted fields.
 */
export async function decryptPIIFields<T extends Record<string, any>>(
  obj: T,
  fieldNames: (keyof T)[]
): Promise<T> {
  const result = { ...obj }
  await Promise.all(
    fieldNames.map(async (field) => {
      const value = result[field]
      if (typeof value === "string" && value.startsWith("v1:")) {
        ;(result as any)[field] = (await decryptAsync(value)) || ""
      }
    })
  )
  return result
}

/**
 * Decrypt PII fields for an array of objects.
 */
export async function decryptPIIList<T extends Record<string, any>>(
  items: T[],
  fieldNames: (keyof T)[]
): Promise<T[]> {
  return Promise.all(items.map((item) => decryptPIIFields(item, fieldNames)))
}
