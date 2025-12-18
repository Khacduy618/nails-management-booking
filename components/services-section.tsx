"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Scissors, Palette, Sparkles, Heart, Clock, HelpCircle } from "lucide-react"
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
  "móng": Palette,
  "default": HelpCircle,
}

export function ServicesSection() {
  const [services, setServices] = useState<ApiService[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPopularServices = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/"
        const res = await fetch(`${apiUrl}services?limit=4`)

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
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-balance">
            Dịch vụ <span className="text-primary">nổi bật</span>
          </h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            Khám phá các dịch vụ được yêu thích nhất tại salon của chúng tôi
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="text-center pb-4">
                    <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
                    <Skeleton className="h-6 w-3/4 mx-auto" />
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-6 w-1/2 mx-auto" />
                    <Skeleton className="h-6 w-full" />
                  </CardContent>
                </Card>
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
                <Card
                  key={service.id}
                  className="relative group hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {service.popular && (
                    <div className="absolute -top-3 left-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                      Nổi bật
                    </div>
                  )}
                  <CardHeader className="text-center pb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <CardDescription className="text-pretty leading-relaxed line-clamp-3">
                      {service.description || "Dịch vụ chất lượng cao"}
                    </CardDescription>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration} phút</span>
                      </div>
                      <p className="text-lg font-semibold text-primary">
                        {`Từ ${new Intl.NumberFormat("vi-VN").format(priceNumber)}đ`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        <div className="text-center">
          <Button size="lg" asChild>
            <Link href="/services">Xem tất cả dịch vụ</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}