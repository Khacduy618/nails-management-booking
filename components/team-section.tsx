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
    <section className="py-24 bg-transparent relative overflow-hidden">

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.05] text-neutral-900">
            Đội ngũ <span className="font-serif italic font-medium text-primary">chuyên nghiệp.</span>
          </h2>
          <p className="text-lg text-neutral-500 max-w-2xl mx-auto font-medium">
            Gặp gỡ những chuyên gia làm móng giàu kinh nghiệm, tận tâm mang đến sự tự tin cho đôi bàn tay của bạn
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-3xl border border-neutral-200/80 bg-white/50 p-0 overflow-hidden flex flex-col h-full min-h-[400px]">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-6 space-y-4">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </>
          ) : teamMembers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Không có thông tin nhân viên</p>
            </div>
          ) : (
            teamMembers.map((member) => (
              <div
                key={member.id}
                className="group relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-white/70 p-0 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 ease-out hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.18),0_1px_2px_rgba(0,0,0,0.02)] hover:-translate-y-1.5 flex flex-col h-full"
              >
                {/* Image */}
                <div className="aspect-square overflow-hidden bg-neutral-100">
                  <img
                    src={member.image || "/placeholder.svg"}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                  />
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 group-hover:text-primary transition-colors duration-300">
                        {member.firstName} {member.lastName}
                      </h3>
                      <p className="text-sm font-semibold text-primary">{member.role}</p>
                    </div>

                    {member.bio && (
                      <p className="text-sm text-neutral-500 leading-relaxed line-clamp-3">
                        {member.bio}
                      </p>
                    )}
                  </div>

                  {/* Specialties - based on role */}
                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-neutral-100">
                    {member.role && (
                      <>
                        <Badge variant="secondary" className="text-[10px] font-semibold tracking-wider uppercase bg-primary/10 text-primary border-none hover:bg-primary/20">
                          {member.role}
                        </Badge>
                        {(member.role.toLowerCase().includes("móng") || member.role.toLowerCase().includes("nail") || member.role.toLowerCase().includes("art")) && (
                          <>
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase border-neutral-200 text-neutral-500">
                              Nail Art
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase border-neutral-200 text-neutral-500">
                              Sơn Gel
                            </Badge>
                          </>
                        )}
                        {(member.role.toLowerCase().includes("chăm sóc") || member.role.toLowerCase().includes("care") || member.role.toLowerCase().includes("kỹ thuật")) && (
                          <>
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase border-neutral-200 text-neutral-500">
                              Cắt da sạch
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase border-neutral-200 text-neutral-500">
                              Dưỡng móng
                            </Badge>
                          </>
                        )}
                        {(member.role.toLowerCase().includes("spa") || member.role.toLowerCase().includes("chân") || member.role.toLowerCase().includes("foot")) && (
                          <>
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase border-neutral-200 text-neutral-500">
                              Foot Spa
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-semibold tracking-wider uppercase border-neutral-200 text-neutral-500">
                              Chà gót
                            </Badge>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
