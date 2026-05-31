"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles, Clock, Users } from "lucide-react"
import { useEffect, useState } from "react"

interface Stats {
  totalCustomers: number
  totalServices: number
}

export function HeroSection() {
  const [stats, setStats] = useState<Stats>({
    totalCustomers: 0,
    totalServices: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/";
        const res = await fetch(`${apiUrl.replace(/\/$/, "")}/stats/public`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setStats({
              totalCustomers: result.data.totalCustomers || 0,
              totalServices: result.data.totalServices || 0,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <section className="relative py-4 sm:py-4 from-card to-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-balance leading-tight">
                Làm đẹp tự nhiên,
                <span className="text-primary"> chăm sóc chuyên nghiệp</span>
              </h1>
              <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
                Trải nghiệm dịch vụ làm đẹp cao cấp với đội ngũ chuyên gia giàu kinh nghiệm. Đặt lịch dễ dàng, không cần
                tài khoản.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Dịch vụ cao cấp</p>
                  <p className="text-sm text-muted-foreground">Chất lượng hàng đầu</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-semibold">Đặt lịch nhanh</p>
                  <p className="text-sm text-muted-foreground">Chỉ cần số điện thoại</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Đội ngũ chuyên nghiệp</p>
                  <p className="text-sm text-muted-foreground">Kinh nghiệm 10+ năm</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="text-lg px-8">
                <Link href="/services">Đặt lịch ngay</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-transparent">
                <Link href="/lookup">Tra cứu lịch hẹn</Link>
              </Button>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
              <img
                src="/elegant-spa-salon-interior-with-modern-design.png"
                alt="K.Tay Nails"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-card border rounded-xl p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">
                    {loading ? "..." : `${Math.max(stats.totalCustomers, 1000)}+ khách hàng`}
                  </p>
                  <p className="text-sm text-muted-foreground">Tin tưởng & hài lòng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
