import type React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Toaster } from "@/components/ui/sonner"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

// Dynamic render for admin routes (don't try to prerender with redirects)
export const dynamic = "force-dynamic"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>
}

async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  // Redirect unauthenticated users to login
  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen premium-page-container">
      {/* Background decorations */}
      <div className="premium-page-bg" aria-hidden="true">
        <img src="/cleanstoneimg.webp" alt="" className="premium-page-texture opacity-[0.18]" />
        <div className="premium-page-overlay-top" />
        <div className="premium-page-overlay-bottom" />
        <div className="hero-blob hero-blob-1 opacity-20" />
        <div className="hero-blob hero-blob-2 opacity-15" />
      </div>

      <div className="hidden lg:flex relative z-10">
        <div className="sticky top-0 h-screen">
          <AdminSidebar />
        </div>
      </div>
      <div className="flex min-h-screen flex-1 flex-col relative z-10 min-w-0">
        <div className="sticky top-0 z-40">
          <AdminHeader />
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}
