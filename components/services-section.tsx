"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Scissors, Palette, Sparkles, Heart, Clock, HelpCircle, ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface ApiService {
  id: number
  name: string
  description: string | null
  price: string | number
  duration: number
  popular: boolean | null
  categoryId?: number | null
  category?: { id: number; name: string } | null
}

const categoryIconMap: { [key: string]: React.ElementType } = {
  "cắt tóc": Scissors,
  "tóc": Scissors,
  "hair": Scissors,
  "chăm sóc da": Sparkles,
  "da": Sparkles,
  "skin": Sparkles,
  "massage": Heart,
  "nails": Palette,
  "nail": Palette,
  "móng": Palette,
  "art": Palette,
  "gel": Palette,
  "sơn": Palette,
  "manicure": Sparkles,
  "pedicure": Sparkles,
  "care": Sparkles,
  "spa": Heart,
  "default": HelpCircle,
}

export function ServicesSection() {
  const [services, setServices] = useState<ApiService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPopularServices = async () => {
      try {
        const res = await fetch(`/api/services?limit=4`)

        if (res.ok) {
          const data = await res.json()
          setServices(data.data || [])
        }
      } catch (error) {
        console.error("Error fetching popular services:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPopularServices()
  }, [])

  return (
    <section className="py-24 bg-transparent relative overflow-hidden">

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-neutral-900">
            Dịch vụ <span className="font-serif italic font-medium text-primary">nổi bật.</span>
          </h2>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-medium">
            Khám phá các dịch vụ chăm sóc móng và làm đẹp được yêu thích nhất tại K.Tay Nails
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-3xl border border-neutral-200/80 bg-white/50 p-6 flex flex-col justify-between min-h-[280px]">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <Skeleton className="h-12 w-12 rounded-2xl" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-full" />
                  </div>
                </div>
              ))}
            </>
          ) : services.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Không có dịch vụ nổi bật</p>
            </div>
          ) : (
            services.map((service) => {
              const categoryName = service.category?.name?.toLowerCase() || "default"
              const Icon =
                categoryIconMap[categoryName] ||
                Object.entries(categoryIconMap).find(([key]) =>
                  categoryName.includes(key.toLowerCase()),
                )?.[1] ||
                categoryIconMap["default"]

              const priceNumber = typeof service.price === "string" ? Number(service.price) : service.price

              return (
                <div
                  key={service.id}
                  className="group relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 ease-out hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.18),0_1px_2px_rgba(0,0,0,0.02)] hover:-translate-y-1.5 flex flex-col justify-between min-h-[280px]"
                >
                  <div>
                    {/* Header: Icon and badge */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      {service.popular && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-600">
                          <Sparkles className="h-3 w-3" />
                          Nổi bật
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-neutral-900 group-hover:text-primary transition-colors duration-300 mb-2">
                      {service.name}
                    </h3>
                    <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3 mb-6">
                      {service.description || "Dịch vụ chăm sóc và làm đẹp móng cao cấp được thực hiện bởi các kỹ thuật viên giàu kinh nghiệm."}
                    </p>
                  </div>

                  {/* Footer info and button */}
                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
                        <Clock className="h-3 w-3" />
                        <span>{service.duration} phút</span>
                      </div>
                      <p className="text-base font-bold text-primary">
                        {`Từ ${new Intl.NumberFormat("vi-VN").format(priceNumber)} đ`}
                      </p>
                    </div>

                    <Link href={`/services`} className="h-9 w-9 rounded-full border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-500 transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="text-center">
          <Button size="lg" asChild className="hero-cta-secondary px-8">
            <Link href="/services">Xem tất cả dịch vụ</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}