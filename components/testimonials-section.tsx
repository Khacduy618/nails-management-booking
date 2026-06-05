"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface Testimonial {
  id?: number
  name: string
  service: string
  content: string
  rating: number
  avatar?: string
}

// Fallback data in case API returns empty or fails
const fallbackTestimonials: Testimonial[] = [
  {
    name: "Nguyễn Thị Lan",
    service: "Sơn Gel & Vẽ nghệ thuật",
    content: "Bộ móng sơn gel vẽ tỉ mỉ từng chi tiết, ai nhìn cũng khen. Nhân viên ở đây tay nghề siêu cao, rất vui vẻ nhiệt tình. Chắc chắn sẽ quay lại!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100&auto=format&fit=crop",
  },
  {
    name: "Trần Văn Minh",
    service: "Nail Care & Cắt da combo",
    content: "Lần đầu đi chăm sóc móng nhưng cực kỳ hài lòng. Kỹ thuật viên cắt da rất êm, không hề đau hay rát. Không gian tiệm vô cùng sạch sẽ và sang trọng.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop",
  },
  {
    name: "Lê Thị Hương",
    service: "Đắp bột & Đính đá Acrylic",
    content: "Bộ móng đắp bột đính đá lấp lánh sang chảnh hết nấc. Phom móng chuẩn, đá đính cực kỳ chắc chắn, mình đi tiệc ai cũng hỏi địa chỉ làm.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop",
  },
  {
    name: "Phạm Thảo Vy",
    service: "Spa Foot Care & Thảo dược",
    content: "Dịch vụ chà gót chân và massage thảo dược siêu thư giãn. Gót chân mềm mịn hẳn ra. Tiệm thơm mùi tinh dầu tự nhiên, rất dễ chịu.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop",
  },
]

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch("/api/reviews?limit=12")
        if (res.ok) {
          const result = await res.json()
          if (result.success && result.data && result.data.length > 0) {
            setTestimonials(result.data)
          } else {
            setTestimonials(fallbackTestimonials)
          }
        } else {
          setTestimonials(fallbackTestimonials)
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error)
        setTestimonials(fallbackTestimonials)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [])

  const getAvatarFallback = (name: string) => {
    const parts = name.trim().split(/\s+/)
    const initials = parts
      .map((p) => p[0])
      .join("")
      .substring(0, 2)
      .toUpperCase()
    return (
      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300">
        {initials || "?"}
      </div>
    )
  }

  // Ensure we have enough items to loop seamlessly without leaving empty spaces
  const baseList = [...testimonials]
  if (baseList.length > 0) {
    while (baseList.length < 8) {
      baseList.push(...testimonials)
    }
  }
  const marqueeItems = baseList.length > 0 ? [...baseList, ...baseList] : []

  return (
    <section className="py-24 bg-transparent relative overflow-hidden">
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-neutral-900">
            Ý kiến <span className="font-serif italic font-medium text-primary">khách hàng.</span>
          </h2>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-medium">
            Hàng nghìn khách hàng đã tin tưởng và hài lòng với dịch vụ chăm sóc móng tại K.Tay Nails
          </p>
        </div>

        {/* Testimonials Marquee */}
        <div className="relative w-full overflow-hidden reviews-mask py-4">
          {loading ? (
            <div className="flex w-max gap-6 py-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-neutral-200/80 bg-white/50 p-6 flex flex-col justify-between h-full min-h-[220px] w-[300px] sm:w-[350px] shrink-0"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="flex items-center space-x-3 pt-4 mt-6 border-t border-neutral-100">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex w-max gap-6 reviews-marquee will-change-transform py-4">
              {marqueeItems.map((testimonial, index) => (
                <div
                  key={`${testimonial.id || testimonial.name}-${index}`}
                  className="group relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 ease-out hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.18),0_1px_2px_rgba(0,0,0,0.02)] hover:-translate-y-1.5 flex flex-col justify-between w-[300px] sm:w-[350px] shrink-0 min-h-[220px]"
                >
                  <div className="space-y-4">
                    {/* Rating and Quote Icon */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < testimonial.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-200"
                            }`}
                          />
                        ))}
                      </div>
                      <Quote className="h-4 w-4 text-primary/30" />
                    </div>

                    {/* Content */}
                    <p className="text-sm text-neutral-600 leading-relaxed font-medium line-clamp-4">
                      "{testimonial.content}"
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center space-x-3 pt-4 mt-6 border-t border-neutral-100">
                    {testimonial.avatar ? (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300"
                      />
                    ) : (
                      getAvatarFallback(testimonial.name)
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-neutral-900 group-hover:text-primary transition-colors duration-300 truncate">
                        {testimonial.name}
                      </p>
                      <p className="text-xs font-semibold text-neutral-400 truncate">
                        {testimonial.service}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
