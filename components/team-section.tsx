"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface StaffMember {
  id: number
  firstName: string
  lastName: string
  role: string
  bio?: string | null
  image?: string | null
  createdAt?: string
}

export function TeamSection() {
  const [teamMembers, setTeamMembers] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/"
        const res = await fetch(`${apiUrl}staff?limit=4`)
        if (res.ok) {
          const data = await res.json()
          setTeamMembers(data.data || [])
        }
      } catch (error) {
        console.error("Error fetching staff:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [])

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-balance">
            Đội ngũ <span className="text-primary">chuyên nghiệp</span>
          </h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
            Gặp gỡ những chuyên gia giàu kinh nghiệm, tận tâm mang đến dịch vụ tốt nhất cho bạn
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-0 overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </Card>
              ))}
            </>
          ) : teamMembers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Không có thông tin nhân viên</p>
            </div>
          ) : (
            teamMembers.map((member) => (
              <Card key={member.id} className="group hover:shadow-lg transition-all p-0 duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {member.firstName} {member.lastName}
                    </h3>
                    <p className="text-primary font-medium">{member.role}</p>
                  </div>

                  {member.bio && (
                    <p className="text-sm text-muted-foreground text-pretty leading-relaxed line-clamp-3">
                      {member.bio}
                    </p>
                  )}

                  {/* Specialties - based on role */}
                  <div className="flex flex-wrap gap-2">
                    {member.role && (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          {member.role}
                        </Badge>
                        {member.role.toLowerCase().includes("tóc") && (
                          <>
                            <Badge variant="secondary" className="text-xs">
                              Cắt tóc
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Tạo kiểu
                            </Badge>
                          </>
                        )}
                        {member.role.toLowerCase().includes("massage") && (
                          <>
                            <Badge variant="secondary" className="text-xs">
                              Massage
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Trị liệu
                            </Badge>
                          </>
                        )}
                        {member.role.toLowerCase().includes("da") && (
                          <>
                            <Badge variant="secondary" className="text-xs">
                              Chăm sóc da
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Điều trị
                            </Badge>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
