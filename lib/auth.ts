import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getServerSession, type NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { decrypt, generateBlindIndex } from "@/lib/crypto"

type AppRole = "admin" | "staff" | "customer"

const isAppRole = (role: unknown): role is AppRole =>
  role === "admin" || role === "staff" || role === "customer"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours activity limit
    updateAge: 2 * 60 * 60, // 2 hours update interval
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập email và mật khẩu")
        }

        let email = credentials.email
        let password = credentials.password

        if (email.startsWith("v1:")) {
          const decrypted = decrypt(email)
          if (!decrypted) throw new Error("Giải mã email thất bại")
          email = decrypted
        }
        if (password.startsWith("v1:")) {
          const decrypted = decrypt(password)
          if (!decrypted) throw new Error("Giải mã mật khẩu thất bại")
          password = decrypted
        }

        const normalizedEmail = email.toLowerCase().trim()
        const emailHashVal = generateBlindIndex(normalizedEmail)

        if (!emailHashVal) {
          throw new Error("Lỗi xác thực email")
        }

        const user = await db.query.users.findFirst({
          where: eq(users.emailHash, emailHashVal),
          columns: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
          },
        })

        if (!user || !user.password) {
          throw new Error("Tài khoản không tồn tại")
        }

        if (user.role !== "admin" && user.role !== "staff") {
          throw new Error("Tài khoản không có quyền truy cập")
        }

        const isValidPassword = await bcrypt.compare(password, user.password)

        if (!isValidPassword) {
          throw new Error("Sai mật khẩu")
        }

        const decryptedName = decrypt(user.name) || "Người dùng"
        const decryptedEmail = decrypt(user.email) || normalizedEmail

        return {
          id: user.id.toString(),
          name: decryptedName,
          email: decryptedEmail,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        const role = (user as { role?: string }).role
        if (isAppRole(role)) {
          token.role = role
        }
        token.createdAt = Math.floor(Date.now() / 1000)
      }
      // Absolute session expiration check (24 hours)
      const now = Math.floor(Date.now() / 1000)
      if (token.createdAt && typeof token.createdAt === "number") {
        const age = now - token.createdAt
        if (age > 24 * 60 * 60) {
          // Token exceeded absolute lifetime, invalidate it
          return {}
        }
      }
      return token
    },
    async session({ session, token }) {
      if (!token.id || !token.role) {
        return {
          ...session,
          user: undefined,
        } as any
      }
      if (session.user) {
        if (typeof token.id === "string") {
          session.user.id = token.id
        }
        if (isAppRole(token.role)) {
          session.user.role = token.role
        }
      }
      return session
    },
  },
}

export async function verifyAdminOrStaff() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || (session.user.role !== "admin" && session.user.role !== "staff")) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access" } },
        { status: 401 }
      ),
    } as const
  }
  return { authorized: true, session } as const
}

export async function verifyAdminOnly() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user || session.user.role !== "admin") {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized access" } },
        { status: 401 }
      ),
    } as const
  }
  return { authorized: true, session } as const
}


