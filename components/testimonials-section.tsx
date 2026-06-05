import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote, Sparkles } from "lucide-react"

// Data từ khách hàng thực tế trong hệ thống - 100% Nails-focused
const testimonials = [
  {
    name: "Nguyễn Thị Lan",
    service: "Sơn Gel & Vẽ nghệ thuật",
    content: "Bộ móng sơn gel vẽ tỉ mỉ từng chi tiết, ai nhìn cũng khen. Nhân viên ở đây tay nghề siêu cao, rất vui vẻ nhiệt tình. Chắc chắn sẽ quay lại!",
    rating: 5,
    avatar: "/professional-woman-portrait.png",
  },
  {
    name: "Trần Văn Minh",
    service: "Nail Care & Cắt da combo",
    content: "Lần đầu đi chăm sóc móng nhưng cực kỳ hài lòng. Kỹ thuật viên cắt da rất êm, không hề đau hay rát. Không gian tiệm vô cùng sạch sẽ và sang trọng.",
    rating: 5,
    avatar: "/professional-man-portrait.png",
  },
  {
    name: "Lê Thị Hương",
    service: "Đắp bột & Đính đá Acrylic",
    content: "Bộ móng đắp bột đính đá lấp lánh sang chảnh hết nấc. Phom móng chuẩn, đá đính cực kỳ chắc chắn, mình đi tiệc ai cũng hỏi địa chỉ làm.",
    rating: 5,
    avatar: "/happy-woman-portrait.png",
  },
  {
    name: "Phạm Thảo Vy",
    service: "Spa Foot Care & Thảo dược",
    content: "Dịch vụ chà gót chân và massage thảo dược siêu thư giãn. Gót chân mềm mịn hẳn ra. Tiệm thơm mùi tinh dầu tự nhiên, rất dễ chịu.",
    rating: 5,
    avatar: "/young-man-portrait.png",
  },
]

export function TestimonialsSection() {
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

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-3xl border border-neutral-200/80 bg-white/70 p-6 shadow-[0_6px_18px_-6px_rgba(15,15,15,0.1),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-500 ease-out hover:border-neutral-300 hover:bg-white hover:shadow-[0_14px_30px_-8px_rgba(15,15,15,0.18),0_1px_2px_rgba(0,0,0,0.02)] hover:-translate-y-1.5 flex flex-col justify-between h-full"
            >
              <div className="space-y-4">
                {/* Rating and Quote Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-0.5">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="h-4 w-4 text-primary/30" />
                </div>

                {/* Content */}
                <p className="text-sm text-neutral-600 leading-relaxed font-medium">
                  "{testimonial.content}"
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center space-x-3 pt-4 mt-6 border-t border-neutral-100">
                <img
                  src={testimonial.avatar || "/placeholder.svg"}
                  alt={testimonial.name}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all duration-300"
                />
                <div>
                  <p className="font-bold text-sm text-neutral-900 group-hover:text-primary transition-colors duration-300">{testimonial.name}</p>
                  <p className="text-xs font-semibold text-neutral-400">{testimonial.service}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
