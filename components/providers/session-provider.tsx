"use client"

import type { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"
import { initFetchInterceptor } from "@/lib/fetch-interceptor"

if (typeof window !== "undefined") {
  initFetchInterceptor()
}

interface Props {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>
}
