import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/session-provider"
import "./globals.css"

const siteIcon = "/fav.png"

export const metadata: Metadata = {
  title: "K-Tay Nails - Hệ thống đặt lịch hẹn",
  description: "Trung tâm làm đẹp cao cấp với dịch vụ chuyên nghiệp. Đặt lịch dễ dàng, không cần tài khoản.",
  generator: "v0.app",
  icons: {
    icon: [
      { url: siteIcon, sizes: "32x32", type: "image/png" },
      
    ],
    shortcut: [{ url: siteIcon }],
    apple: [{ url: "/logo.png", sizes: "180x180" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </AuthProvider>
        <Analytics />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
