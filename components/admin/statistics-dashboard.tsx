"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar
} from "recharts"
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, Users, Scissors,
  Star, Award, Target, ChevronDown, RefreshCw, BarChart2, PieChart as PieIcon,
  Activity, Zap, ArrowUpRight, ArrowDownRight
} from "lucide-react"
import { format, subDays, subMonths, eachDayOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { vi } from "date-fns/locale"

// ─── Types ───────────────────────────────────────────────────────────────────

interface OverviewStats {
  totalRevenue: number
  totalAppointments: number
  completedAppointments: number
  totalCustomers: number
}

interface ServiceRevenue {
  serviceName: string
  serviceId: string
  count: number
  totalRevenue: number
}

interface StaffPerformance {
  staffName: string
  staffId: string
  revenue: number
  appointments: number
}

interface DayData {
  date: string
  name: string
  revenue: number
  appointments: number
}

interface PeriodOption {
  label: string
  days: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (v: number) => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M₫`
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K₫`
  return `${v}₫`
}

const formatCurrencyFull = (v: number) =>
  `${Math.round(v).toLocaleString("vi-VN")}₫`

const PERIOD_OPTIONS: PeriodOption[] = [
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: 30 },
  { label: "90 ngày", days: 90 },
]

const CHART_COLORS = [
  "#f97316", "#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b",
]

// ─── Scroll-reveal hook (modern: @starting-style + IntersectionObserver) ────

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RevealCard({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const { ref, visible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

interface KpiCardProps {
  title: string
  value: string
  subtitle: string
  icon: React.ElementType
  trend?: number
  gradient: string
  delay?: number
}

function KpiCard({ title, value, subtitle, icon: Icon, trend, gradient, delay = 0 }: KpiCardProps) {
  const isPositive = (trend ?? 0) >= 0
  return (
    <RevealCard delay={delay}>
      <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.05)] border border-white/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.15)] ${gradient}`}
        style={{ minHeight: 140 }}>
        {/* decorative circles */}
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/[0.08] blur-sm" />
        <div className="absolute -bottom-8 -right-2 h-20 w-20 rounded-full bg-white/[0.04] blur-xs" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80">{title}</p>
            <p className="mt-2 text-3xl font-extrabold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-white/70 font-medium">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-xs ring-1 ring-white/10">
            <Icon className="h-5.5 w-5.5 text-white" />
          </div>
        </div>

        {trend !== undefined && (
          <div className="relative z-10 mt-4 flex items-center gap-1 text-[11px] font-bold">
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            <span>{Math.abs(trend)}% so với kỳ trước</span>
          </div>
        )}
      </div>
    </RevealCard>
  )
}

function SectionTitle({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle?: string
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="rounded-2xl bg-primary/10 p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="font-sans font-bold text-neutral-800 tracking-tight leading-tight">{title}</h2>
        {subtitle && <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}

// Glassmorphism card wrapper
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border border-neutral-200/50 bg-white/70 p-6 shadow-[0_8px_30px_-6px_rgba(15,15,15,0.06),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-300 hover:shadow-[0_12px_40px_-8px_rgba(15,15,15,0.12),0_1px_2px_rgba(0,0,0,0.02)] ${className}`}
    >
      {children}
    </div>
  )
}

// Custom tooltip for recharts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === "number" && entry.name?.includes("Doanh thu")
            ? formatCurrencyFull(entry.value)
            : entry.value}
        </p>
      ))}
    </div>
  )
}

// ─── Staff Performance Row ────────────────────────────────────────────────────

function StaffRow({ staff, rank, maxRevenue }: {
  staff: StaffPerformance; rank: number; maxRevenue: number
}) {
  const pct = maxRevenue > 0 ? (staff.revenue / maxRevenue) * 100 : 0
  const medals = ["🥇", "🥈", "🥉"]
  const name = staff.staffName?.includes("@")
    ? staff.staffName.split("@")[0]
    : (staff.staffName || "N/A")

  return (
    <div className="flex items-center gap-4 py-3">
      <span className="w-6 shrink-0 text-center text-lg">
        {rank <= 3 ? medals[rank - 1] : <span className="text-sm text-muted-foreground">{rank}</span>}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="truncate text-sm font-medium text-foreground capitalize">{name}</span>
          <span className="shrink-0 ml-2 text-xs text-muted-foreground">{staff.appointments} lịch</span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #f97316, #ec4899)",
            }}
          />
        </div>
        <span className="mt-0.5 block text-xs font-semibold text-orange-500">
          {formatCurrencyFull(staff.revenue)}
        </span>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StatisticsDashboard() {
  const [period, setPeriod] = useState(30)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [serviceRevenue, setServiceRevenue] = useState<ServiceRevenue[]>([])
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance[]>([])
  const [dailyData, setDailyData] = useState<DayData[]>([])

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "")

  const fetchData = useCallback(async (days: number, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const endDate = new Date()
      endDate.setHours(23, 59, 59, 999)
      const startDate = subDays(endDate, days - 1)
      startDate.setHours(0, 0, 0, 0)

      const url = `${apiBase}/admin/revenue?startDate=${format(startDate, "yyyy-MM-dd")}&endDate=${format(endDate, "yyyy-MM-dd")}`
      const res = await fetch(url)
      if (!res.ok) throw new Error("Lỗi tải dữ liệu")
      const result = await res.json()
      const d = result.data

      setOverview(d.overview)
      setServiceRevenue(d.serviceRevenue || [])
      setStaffPerformance(d.staffPerformance || [])

      // Build daily chart
      const allDays = eachDayOfInterval({ start: startDate, end: endDate })
      const revenueByDate: Record<string, number> = {}
      const countByDate: Record<string, number> = {}

      ;(d.appointments || []).forEach((apt: any) => {
        const key = apt.appointmentDate?.slice(0, 10) ?? ""
        revenueByDate[key] = (revenueByDate[key] || 0) + (parseFloat(apt.revenue) || 0)
        countByDate[key] = (countByDate[key] || 0) + 1
      })

      const chartData = allDays.map((day) => {
        const key = format(day, "yyyy-MM-dd")
        const isToday = key === format(new Date(), "yyyy-MM-dd")
        return {
          date: key,
          name: isToday ? "Hôm nay" : format(day, days <= 14 ? "dd/MM" : "dd/MM", { locale: vi }),
          revenue: revenueByDate[key] || 0,
          appointments: countByDate[key] || 0,
        }
      })

      setDailyData(chartData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [apiBase])

  useEffect(() => { fetchData(period) }, [period, fetchData])

  // Pie chart data
  const pieData = serviceRevenue.slice(0, 6).map((s, i) => ({
    name: s.serviceName,
    value: s.totalRevenue,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }))

  // Completion rate
  const completionRate = overview
    ? overview.totalAppointments > 0
      ? Math.round((overview.completedAppointments / overview.totalAppointments) * 100)
      : 0
    : 0

  const maxStaffRevenue = staffPerformance.length > 0
    ? Math.max(...staffPerformance.map((s) => s.revenue))
    : 1

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2 h-80 animate-pulse rounded-2xl bg-muted" />
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-neutral-800 tracking-tight leading-[1.15]">
            Thống kê & <span className="font-serif italic font-medium text-primary">phân tích.</span>
          </h1>
          <p className="text-sm text-neutral-500 font-medium mt-1">
            Tổng quan dữ liệu kinh doanh K.Tay Nails
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Period selector */}
          <div className="flex overflow-hidden rounded-2xl border border-neutral-200 bg-white/80 p-1 shadow-sm backdrop-blur-md">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setPeriod(opt.days)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                  period === opt.days
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchData(period, true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white/80 px-4 py-2.5 text-xs font-bold text-neutral-600 shadow-sm hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tổng doanh thu"
          value={formatCurrency(overview?.totalRevenue ?? 0)}
          subtitle={formatCurrencyFull(overview?.totalRevenue ?? 0)}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-orange-500 to-pink-500"
          delay={0}
        />
        <KpiCard
          title="Lịch hẹn"
          value={(overview?.totalAppointments ?? 0).toString()}
          subtitle={`${overview?.completedAppointments ?? 0} hoàn thành`}
          icon={Calendar}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          delay={80}
        />
        <KpiCard
          title="Khách hàng"
          value={(overview?.totalCustomers ?? 0).toString()}
          subtitle="khách hàng duy nhất"
          icon={Users}
          gradient="bg-gradient-to-br from-cyan-500 to-blue-500"
          delay={160}
        />
        <KpiCard
          title="Tỷ lệ hoàn thành"
          value={`${completionRate}%`}
          subtitle="tỷ lệ hoàn thành lịch"
          icon={Target}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-500"
          delay={240}
        />
      </div>

      {/* ── Revenue Area Chart + Pie ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <RevealCard className="xl:col-span-2" delay={100}>
          <GlassCard>
            <SectionTitle icon={Activity} title="Doanh thu theo ngày" subtitle={`${period} ngày gần đây`} />
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  interval={period > 14 ? Math.floor(period / 8) : 0}
                  angle={period > 14 ? -30 : 0}
                  textAnchor={period > 14 ? "end" : "middle"}
                  height={period > 14 ? 48 : 32}
                  tick={{ dy: 6 }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickFormatter={formatCurrency}
                  width={72}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Doanh thu"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 6, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </RevealCard>

        {/* Pie chart – top services */}
        <RevealCard delay={200}>
          <GlassCard className="flex flex-col h-full">
            <SectionTitle icon={PieIcon} title="Dịch vụ" subtitle="Theo doanh thu" />
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrencyFull(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {pieData.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="flex-1 truncate text-muted-foreground">{s.name}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(s.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-8">Chưa có dữ liệu</p>
            )}
          </GlassCard>
        </RevealCard>
      </div>

      {/* ── Appointment Bar + Staff ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Appointment bar chart */}
        <RevealCard delay={100}>
          <GlassCard>
            <SectionTitle icon={BarChart2} title="Số lịch hẹn theo ngày" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dailyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.6} />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  interval={period > 14 ? Math.floor(period / 8) : 0}
                  angle={period > 14 ? -30 : 0}
                  textAnchor={period > 14 ? "end" : "middle"}
                  height={period > 14 ? 48 : 32}
                  tick={{ dy: 6 }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="appointments"
                  name="Lịch hẹn"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                >
                  {dailyData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={`hsl(${265 + i * 2}, 75%, ${58 + (i % 3) * 4}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </GlassCard>
        </RevealCard>

        {/* Staff leaderboard */}
        <RevealCard delay={200}>
          <GlassCard className="flex flex-col">
            <SectionTitle icon={Award} title="Hiệu suất nhân viên" subtitle="Xếp hạng theo doanh thu" />
            {staffPerformance.length > 0 ? (
              <div className="flex-1 divide-y divide-border/50">
                {staffPerformance.slice(0, 6).map((s, i) => (
                  <StaffRow
                    key={s.staffId ?? i}
                    staff={s}
                    rank={i + 1}
                    maxRevenue={maxStaffRevenue}
                  />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu nhân viên</p>
            )}
          </GlassCard>
        </RevealCard>
      </div>

      {/* ── Service Table ── */}
      <RevealCard delay={80}>
        <GlassCard>
          <SectionTitle icon={Scissors} title="Chi tiết dịch vụ" subtitle="Doanh thu & số lần phục vụ" />
          {serviceRevenue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">#</th>
                    <th className="pb-3 pr-4 font-medium">Dịch vụ</th>
                    <th className="pb-3 pr-4 font-medium text-right">Số lần</th>
                    <th className="pb-3 pr-4 font-medium text-right">Doanh thu</th>
                    <th className="pb-3 font-medium text-right">Trung bình/lần</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {serviceRevenue.map((s, i) => (
                    <tr key={s.serviceId ?? i} className="group hover:bg-neutral-50/50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium text-neutral-800">{s.serviceName}</td>
                      <td className="py-3 pr-4 text-right text-muted-foreground">
                        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-600">
                          {s.count}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-bold text-neutral-800">
                        {formatCurrencyFull(s.totalRevenue)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {s.count > 0 ? formatCurrencyFull(s.totalRevenue / s.count) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/20">
                    <td colSpan={2} className="py-3 pr-4 text-sm font-bold text-neutral-800">Tổng cộng</td>
                    <td className="py-3 pr-4 text-right text-sm font-semibold text-neutral-800">
                      {serviceRevenue.reduce((a, s) => a + s.count, 0)} lần
                    </td>
                    <td className="py-3 pr-4 text-right text-sm font-extrabold text-primary">
                      {formatCurrencyFull(serviceRevenue.reduce((a, s) => a + s.totalRevenue, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có dữ liệu dịch vụ</p>
          )}
        </GlassCard>
      </RevealCard>

      {/* ── Completion rate radial ── */}
      <RevealCard delay={100}>
        <GlassCard>
          <SectionTitle icon={Zap} title="Tổng quan kỳ" subtitle={`${period} ngày gần nhất`} />
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              {
                label: "Tổng lịch hẹn",
                value: overview?.totalAppointments ?? 0,
                sub: "lịch hẹn",
                color: "#8b5cf6",
              },
              {
                label: "Hoàn thành",
                value: overview?.completedAppointments ?? 0,
                sub: "lịch hoàn thành",
                color: "#10b981",
              },
              {
                label: "Tỷ lệ HT",
                value: `${completionRate}%`,
                sub: "completion rate",
                color: "#f97316",
              },
              {
                label: "TB/ngày",
                value: formatCurrency((overview?.totalRevenue ?? 0) / period),
                sub: "doanh thu TB",
                color: "#ec4899",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-2xl border border-border/50 bg-muted/30 p-5 text-center"
              >
                <span className="text-3xl font-bold" style={{ color: item.color }}>
                  {item.value}
                </span>
                <span className="mt-1 text-sm font-medium text-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.sub}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </RevealCard>
    </div>
  )
}
