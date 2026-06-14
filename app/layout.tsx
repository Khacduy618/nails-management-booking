import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Playfair_Display, Manrope } from "next/font/google"
import { headers } from "next/headers"

const playfair = Playfair_Display({
  subsets: ["vietnamese", "latin"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700", "800", "900"],
})

const manrope = Manrope({
  subsets: ["vietnamese", "latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
})
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/session-provider"
import "./globals.css"
import '@aejkatappaja/phantom-ui/ssr.css';

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

export const dynamic = 'force-dynamic'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined
  return (
    <html lang="vi" nonce={nonce} suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${playfair.variable} ${manrope.variable} antialiased relative min-h-screen bg-[#f5f4f2] text-neutral-800`} suppressHydrationWarning>
        {/* Global Background Texture */}
        <div className="pointer-events-none fixed inset-0 -z-50 bg-[#f5f4f2]" aria-hidden="true">
          <img
            src="/cleanstoneimg.webp"
            alt=""
            className="w-full h-full object-cover opacity-[0.55]"
          />
          {/* Top gradient glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#f5f4f2]/10 via-transparent to-transparent" />
        </div>

        <AuthProvider>
          <Suspense fallback={null}>
            <div className="relative z-10">
              {children}
            </div>
          </Suspense>
        </AuthProvider>
        <Analytics />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
