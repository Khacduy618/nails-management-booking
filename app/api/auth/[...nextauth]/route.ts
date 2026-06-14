import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { encrypt } from "@/lib/crypto"
import { NextResponse } from "next/server"

const handler = NextAuth(authOptions)

async function encryptAuthSession(req: any, context: any) {
  const url = new URL(req.url)
  const isSessionEndpoint = url.pathname.endsWith("/api/auth/session")
  
  const response = await handler(req, context)
  
  if (isSessionEndpoint && response instanceof Response && response.status === 200 && process.env.NODE_ENV !== "test") {
    try {
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const clonedResponse = response.clone()
        const json = await clonedResponse.json()
        
        if (json && Object.keys(json).length > 0) {
          const jsonStr = JSON.stringify(json)
          const encrypted = encrypt(jsonStr)
          
          const headers = new Headers(response.headers)
          headers.delete("content-length")
          
          return NextResponse.json(
            { data: encrypted },
            {
              status: response.status,
              statusText: response.statusText,
              headers: headers,
            }
          )
        }
      }
    } catch (e) {
      // Ignore and return original
    }
  }
  
  return response
}

export { encryptAuthSession as GET, handler as POST }

