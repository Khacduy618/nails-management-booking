import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

type AppRole = "admin" | "staff" | "customer"

const isAppRole = (role: unknown): role is AppRole =>
  role === "admin" || role === "staff" || role === "customer"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
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

        const normalizedEmail = credentials.email.toLowerCase().trim()

        const user = await db.query.users.findFirst({
          where: eq(users.email, normalizedEmail),
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

        const isValidPassword = await bcrypt.compare(credentials.password, user.password)

        if (!isValidPassword) {
          throw new Error("Sai mật khẩu")
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
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
      }
      return token
    },
    async session({ session, token }) {
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
