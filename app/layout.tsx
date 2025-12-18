import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/session-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "K-Tay Nails - Hệ thống đặt lịch hẹn",
  description: "Trung tâm làm đẹp cao cấp với dịch vụ chuyên nghiệp. Đặt lịch dễ dàng, không cần tài khoản.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </AuthProvider>
        <Analytics />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
