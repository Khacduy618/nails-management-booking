import { encryptAsync, decryptAsync } from "./crypto-client"

// Function to recursively decrypt any string in an object starting with "v1:"
async function decryptObject(obj: any): Promise<any> {
  if (!obj) return obj
  if (typeof obj === "string") {
    if (obj.startsWith("v1:")) {
      return (await decryptAsync(obj)) || obj
    }
    return obj
  }
  if (Array.isArray(obj)) {
    return Promise.all(obj.map((item) => decryptObject(item)))
  }
  if (typeof obj === "object") {
    const res: any = {}
    for (const key of Object.keys(obj)) {
      res[key] = await decryptObject(obj[key])
    }
    return res
  }
  return obj
}

export function initFetchInterceptor() {
  if (typeof window === "undefined" || (window as any).__fetchInterceptorInitialized) {
    return
  }
  (window as any).__fetchInterceptorInitialized = true

  const originalFetch = window.fetch
  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url

    // Check if the request is to our own API, and not to /api/auth
    const isLocalApi = url.startsWith("/") || url.startsWith("http://localhost") || url.includes(window.location.host)
    const isAuth = url.includes("/api/auth")

    let newInit = { ...init }

    if (isLocalApi && !isAuth) {
      // 1. Encrypt request body if present and is JSON string
      if (init && init.body && typeof init.body === "string") {
        try {
          // Verify it's JSON
          JSON.parse(init.body)
          const encrypted = await encryptAsync(init.body)
          newInit.body = JSON.stringify({ data: encrypted })

          // Merge headers
          const headers = new Headers(newInit.headers)
          headers.set("Content-Type", "application/json")
          newInit.headers = headers
        } catch (e) {
          // Not JSON or failed to parse, leave it as-is
        }
      }
    }

    const response = await originalFetch(input, newInit)

    const shouldDecrypt = isLocalApi && (!isAuth || url.includes("/api/auth/session"))

    if (shouldDecrypt) {
      // 2. Wrap the response json() method to decrypt the data
      const originalJson = response.json.bind(response)
      response.json = async () => {
        const json = await originalJson()
        if (json && json.data && typeof json.data === "string" && json.data.startsWith("v1:")) {
          const decryptedStr = await decryptAsync(json.data)
          if (decryptedStr) {
            const parsed = JSON.parse(decryptedStr)
            return decryptObject(parsed)
          }
        }
        return decryptObject(json)
      }
    }

    return response
  }
}
