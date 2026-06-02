"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Loader2, Calendar, Clock, Sparkles, CheckCircle2, User, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

function ReviewContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [appointment, setAppointment] = useState<any>(null)
  const [isAllowed, setIsAllowed] = useState(false)
  const [allowedTime, setAllowedTime] = useState<Date | null>(null)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [existingReview, setExistingReview] = useState<any>(null)

  // Form states
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [success, setSuccess] = useState(false)

  const fetchReviewDetails = async () => {
    if (!token) {
      setError("Không tìm thấy mã token đánh giá. Vui lòng kiểm tra lại liên kết trong email của bạn.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/reviews?token=${token}`)
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error?.message || "Không thể lấy thông tin đánh giá.")
        return
      }

      setAppointment(data.appointment)
      setIsAllowed(data.isAllowed)
      setAllowedTime(data.allowedTime ? new Date(data.allowedTime) : null)
      setAlreadyReviewed(data.alreadyReviewed)
      setExistingReview(data.review)
    } catch (err: any) {
      setError("Có lỗi xảy ra khi kết nối đến hệ thống.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviewDetails()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error("Vui lòng chọn số sao để đánh giá.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          comment,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        toast.error(data.error?.message || "Không thể gửi đánh giá.")
        return
      }

      toast.success("Cảm ơn bạn đã gửi đánh giá!")
      setSuccess(true)
    } catch (err: any) {
      toast.error("Có lỗi mạng xảy ra. Vui lòng thử lại sau.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Đang tải thông tin lịch hẹn...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto border-destructive/20 bg-destructive/5 shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive font-bold text-lg flex items-center gap-2">
            ⚠️ Lỗi liên kết đánh giá
          </CardTitle>
          <CardDescription>Liên kết của bạn không hợp lệ hoặc đã hết hạn.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/")}>
            Quay về Trang chủ
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (success) {
    return (
      <Card className="max-w-md mx-auto shadow-2xl border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-10 w-10 text-primary animate-bounce" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-foreground">Gửi Đánh Giá Thành Công!</CardTitle>
          <CardDescription>Cảm ơn bạn đã đóng góp ý kiến giúp K-Tay Nails hoàn thiện dịch vụ.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-center">
          <p className="text-muted-foreground text-sm">
            Hệ thống đã nhận được ý kiến của bạn dành cho nhân viên <strong>{appointment?.staffName}</strong>. Chúc bạn một ngày tốt lành!
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
            Trang chủ
          </Button>
          <Button className="flex-1" onClick={() => router.push("/book")}>
            Đặt lịch mới <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Trường hợp đã đánh giá rồi
  if (alreadyReviewed) {
    return (
      <Card className="max-w-md mx-auto shadow-xl border-primary/10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">Lịch Hẹn Đã Được Đánh Giá</CardTitle>
          <CardDescription>Cảm ơn bạn, bạn đã đánh giá thợ cho lịch hẹn này.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold flex items-center gap-1.5"><User className="h-4 w-4 text-primary" /> Nhân viên:</span>
              <span className="text-sm text-foreground font-medium">{appointment?.staffName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Điểm số:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4.5 w-4.5 ${
                      star <= (existingReview?.rating || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
            {existingReview?.comment && (
              <div className="space-y-1">
                <span className="text-sm font-semibold">Bình luận của bạn:</span>
                <p className="text-sm text-muted-foreground italic bg-background p-2.5 rounded border border-dashed">
                  "{existingReview.comment}"
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/")}>
            Quay về Trang chủ
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Trường hợp chưa đến giờ đánh giá
  if (!isAllowed) {
    const formattedAllowedTime = allowedTime
      ? allowedTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) +
        " ngày " +
        allowedTime.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : ""

    return (
      <Card className="max-w-md mx-auto border-amber-200 bg-amber-500/5 shadow-lg">
        <CardHeader>
          <CardTitle className="text-amber-500 font-bold text-lg flex items-center gap-2">
            ⏳ Đánh giá chưa khả dụng
          </CardTitle>
          <CardDescription>Vui lòng đợi thêm một thời gian để đánh giá.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Để đảm bảo dịch vụ đã được trải nghiệm đầy đủ, bạn chỉ có thể đánh giá nhân viên từ **1 giờ sau khi dịch vụ kết thúc**.
          </p>
          <div className="bg-amber-500/10 p-3 rounded border border-amber-200/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
            Thời điểm mở khóa đánh giá: {formattedAllowedTime}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={() => router.push("/")}>
            Quay về Trang chủ
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="max-w-lg mx-auto shadow-2xl border-primary/10 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Đánh giá nhân viên
        </CardTitle>
        <CardDescription>
          Hãy chia sẻ trải nghiệm dịch vụ của bạn dành cho nhân viên phục vụ.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Appointment Summary Box */}
          <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border border-muted-foreground/10 text-sm">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Nhân viên phục vụ</p>
              <p className="font-semibold flex items-center gap-1.5 text-foreground">
                <User className="h-4 w-4 text-primary" /> {appointment?.staffName}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Dịch vụ thực hiện</p>
              <p className="font-semibold text-foreground truncate">
                {appointment?.services?.join(", ")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Ngày hẹn
              </p>
              <p className="font-medium text-foreground">
                {appointment?.date ? new Date(appointment.date).toLocaleDateString("vi-VN") : ""}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Giờ làm
              </p>
              <p className="font-medium text-foreground">
                {appointment?.time ? appointment.time.substring(0, 5) : ""}
              </p>
            </div>
          </div>

          {/* Star Selection Section */}
          <div className="space-y-3 text-center py-2">
            <label className="text-sm font-semibold block text-foreground">
              Đánh giá chất lượng phục vụ *
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform active:scale-95 duration-100 hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 transition-all ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {rating === 5 && "Tuyệt vời (5/5 sao) 😍"}
                {rating === 4 && "Rất tốt (4/5 sao) 😊"}
                {rating === 3 && "Bình thường (3/5 sao) 🙂"}
                {rating === 2 && "Chưa hài lòng (2/5 sao) 🙁"}
                {rating === 1 && "Rất kém (1/5 sao) 😡"}
              </p>
            )}
          </div>

          {/* Comment Textarea */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-semibold text-foreground">
              Bình luận & Đóng góp ý kiến (Không bắt buộc)
            </label>
            <Textarea
              id="comment"
              placeholder="Chia sẻ cảm nhận của bạn về sự chu đáo, tay nghề của nhân viên..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none h-28 focus-visible:ring-primary focus-visible:border-primary"
            />
          </div>
        </CardContent>

        <CardFooter className="pt-2">
          <Button
            type="submit"
            className="w-full font-bold shadow-lg"
            disabled={submitting || rating === 0}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang gửi đánh giá...
              </>
            ) : (
              "Gửi Đánh Giá"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function ReviewPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Header />
      <main className="py-12 bg-gradient-to-b from-background to-muted/20 flex-grow">
        <div className="container mx-auto px-4">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Đang tải biểu mẫu...</p>
              </div>
            }
          >
            <ReviewContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
