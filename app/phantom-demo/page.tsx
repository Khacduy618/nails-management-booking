"use client"

import { useState } from "react"
import PhantomWrapper from "@/components/ui/phantom-wrapper"

export default function PhantomDemoPage() {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl transition-all duration-300">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Phantom UI Demo
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Hiệu ứng morphing skeleton loaders tự động theo cấu trúc DOM
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center p-4 bg-slate-850 rounded-xl border border-slate-700/50">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-slate-300">Trạng thái:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isLoading 
                ? "bg-amber-400/10 text-amber-400 border border-amber-400/20" 
                : "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
            }`}>
              {isLoading ? "Đang tải (Skeleton)" : "Đã tải xong (Content)"}
            </span>
          </div>

          <button
            onClick={() => setIsLoading(!isLoading)}
            className="mt-4 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-150 cursor-pointer"
          >
            Toggle Trạng thái Loading
          </button>
        </div>

        {/* Target Component Wrapped in PhantomWrapper */}
        <div className="relative">
          <PhantomWrapper loading={isLoading} className="block transition-all duration-500">
            <div className="p-6 bg-slate-900/50 rounded-xl border border-slate-700/80 space-y-4">
              
              {/* Header with Profile Image & Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 p-0.5 flex-shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                    <span className="text-xl font-bold text-slate-200">SD</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-200">Sarah Staff</h3>
                  <p className="text-xs text-violet-400 font-semibold tracking-wider uppercase">Senior Technician</p>
                </div>
              </div>

              <hr className="border-slate-800" />

              {/* Bio Description */}
              <div className="space-y-1">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Chuyên viên thiết kế móng với hơn 5 năm kinh nghiệm nghệ thuật nail art nâng cao, đắp gel và vẽ móng 3D nghệ thuật.
                </p>
              </div>

              {/* Badges / Skills */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition">
                  Gel Manicure
                </span>
                <span className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition">
                  Nail Art 3D
                </span>
                <span className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition">
                  Pedicure Deluxe
                </span>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-semibold rounded-lg border border-slate-700 transition active:scale-[0.98]">
                  Đặt lịch hẹn ngay
                </button>
              </div>

            </div>
          </PhantomWrapper>
        </div>

        {/* Documentation Tip */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            * Mẹo: Các nút và khối text sẽ tự động sinh lớp shimmer tương ứng với kích thước thực tế của chúng.
          </p>
        </div>

      </div>
    </div>
  )
}
