"use client"

import { Bell, User, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect } from "react"

export function AdminHeader() {
  const { data: session } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const userDisplay = isMounted ? (session?.user?.name || session?.user?.email || "Người dùng") : "Người dùng"
  const roleLabel = isMounted ? (session?.user?.role === "staff" ? "Nhân viên" : "Quản trị") : "Quản trị"

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/login", redirect: true })
  }

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-foreground">Bảng điều khiển</h2>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" title="Thông báo">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3 rounded-full border px-3 py-1">
          <div className="rounded-full bg-muted p-2">
            <User className="h-4 w-4" />
          </div>
          <div className="text-sm leading-tight">
            <p className="font-medium">{userDisplay}</p>
            <p className="text-muted-foreground text-xs capitalize">{roleLabel}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          disabled={isSigningOut}
          title="Đăng xuất"
        >
          {isSigningOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  )
}
