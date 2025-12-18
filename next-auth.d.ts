import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user?: DefaultSession["user"] & {
      id: string
      role: "admin" | "staff" | "customer"
    }
  }

  interface User {
    id: string
    role: "admin" | "staff" | "customer"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: "admin" | "staff" | "customer"
  }
}
