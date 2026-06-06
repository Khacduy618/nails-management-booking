"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface OTPVerificationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    appointmentId: number
    phone: string
    onVerified: () => void
    isLoadingOTP?: boolean
}

export function OTPVerificationDialog({
    open,
    onOpenChange,
    appointmentId,
    phone,
    onVerified,
    isLoadingOTP = false,
}: OTPVerificationDialogProps) {
    const [otp, setOtp] = useState("")
    const [isVerifying, setIsVerifying] = useState(false)
    const [error, setError] = useState("")
    const [resendCountdown, setResendCountdown] = useState(0)

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            setError("Vui lòng nhập mã OTP")
            return
        }

        if (otp.length !== 6 || !/^\d+$/.test(otp)) {
            setError("Mã OTP phải là 6 chữ số")
            return
        }

        setIsVerifying(true)
        setError("")

        try {
            const res = await fetch("/api/otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId,
                    code: otp,
                    phone,
                }),
            })

            const result = await res.json()

            if (!res.ok || !result.success) {
                throw new Error(result.error?.message || "Xác thực OTP thất bại")
            }

            toast.success("Hủy lịch hẹn thành công!")
            onOpenChange(false)
            onVerified()
            setOtp("")
        } catch (err: any) {
            setError(err.message)
            toast.error(err.message)
        } finally {
            setIsVerifying(false)
        }
    }

    const handleResendOTP = async () => {
        setResendCountdown(60)
        setError("")
        setOtp("")

        try {
            const res = await fetch("/api/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId,
                    phone,
                }),
            })

            const result = await res.json()

            if (!res.ok || !result.success) {
                throw new Error(result.error?.message || "Không thể gửi lại OTP")
            }

            toast.success("Mã OTP đã được gửi lại")

            // Countdown timer
            const interval = setInterval(() => {
                setResendCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval)
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } catch (err: any) {
            setError(err.message)
            toast.error(err.message)
            setResendCountdown(0)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Xác thực mã OTP</DialogTitle>
                    <DialogDescription>
                        Nhập mã OTP được gửi đến số điện thoại <strong>{phone}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Development Mode - Show OTP from console */}
                    {process.env.NODE_ENV === "development" && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <strong>Development Mode:</strong> Mã OTP sẽ hiển thị ở browser console (F12). Kiểm tra console.log
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mã OTP (6 chữ số)</label>
                        <Input
                            type="text"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                                setOtp(value)
                                setError("")
                            }}
                            maxLength={6}
                            className="text-center text-lg tracking-widest font-mono"
                            disabled={isVerifying || isLoadingOTP}
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground">
                            Mã OTP có hiệu lực trong 5 phút
                        </p>
                    </div>                    <div className="flex gap-2">
                        <Button
                            onClick={handleVerifyOTP}
                            disabled={isVerifying || isLoadingOTP || otp.length !== 6}
                            className="flex-1"
                        >
                            {isVerifying ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang xác thực...
                                </>
                            ) : (
                                "Xác thực"
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleResendOTP}
                            disabled={resendCountdown > 0 || isLoadingOTP}
                            className="flex-1"
                        >
                            {resendCountdown > 0
                                ? `Gửi lại (${resendCountdown}s)`
                                : "Gửi lại OTP"}
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isVerifying || isLoadingOTP}
                        className="w-full"
                    >
                        Hủy
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
