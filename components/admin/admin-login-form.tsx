"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { validateEmail, validateText } from "@/lib/form-validation"
import { encryptAsync } from "@/lib/crypto-client"

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Validate email
    const emailValidation = validateEmail(email, true)
    if (!emailValidation.valid) {
      setError(emailValidation.error || 'Email không hợp lệ')
      return
    }

    // Validate password (min 6 characters)
    const passwordValidation = validateText(password, 'Mật khẩu', 1, 255, true)
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || 'Mật khẩu không hợp lệ')
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const encryptedEmail = await encryptAsync(email)
      const encryptedPassword = await encryptAsync(password)

      if (!encryptedEmail || !encryptedPassword) {
        throw new Error("Mã hóa thông tin thất bại")
      }

      const result = await signIn("credentials", {
        email: encryptedEmail,
        password: encryptedPassword,
        redirect: false,
      })

      setIsLoading(false)

      if (result?.error) {
        setError(result.error)
        return
      }

      if (result?.ok) {
        router.push("/admin")
        router.refresh()
      }
    } catch (err: any) {
      setIsLoading(false)
      setError(err.message || "Đã xảy ra lỗi đăng nhập")
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) setError(null)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (error) setError(null)
  }

  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Đăng nhập hệ thống</h1>
        <p className="text-sm text-muted-foreground">Chỉ dành cho quản trị viên và nhân viên</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={handleEmailChange}
            disabled={isLoading}
            autoComplete="email"
            required
          />
        </div>

        <div>
          <Label htmlFor="password">Mật khẩu</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={handlePasswordChange}
            disabled={isLoading}
            autoComplete="current-password"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      {/* Demo credentials info */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="pt-4 border-t bg-muted/50 rounded-lg p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Demo Credentials:</p>
          <div className="space-y-1 text-xs text-muted-foreground font-mono">
            <p><span className="text-foreground">Admin:</span> admin@example.com / password123</p>
            <p><span className="text-foreground">Staff:</span> sarah@example.com / password123</p>
          </div>
        </div>
      )}
    </div>
  )
}
