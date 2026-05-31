import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi, expect, describe, it, beforeEach } from "vitest"
import { ServicesList } from "../services-list"
import { BookingForm } from "../booking-form"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/services",
}))

// Mock Calendar component
vi.mock("@/components/ui/calendar", () => ({
  Calendar: (props: { onSelect?: (date?: Date) => void }) => (
    <button onClick={() => props.onSelect?.(new Date("2030-01-15"))}>
      Chọn ngày mock
    </button>
  ),
}))

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const getFetchMock = () => global.fetch as unknown as ReturnType<typeof vi.fn>

describe("Booking Flow Add-ons", () => {
  beforeEach(() => {
    mockPush.mockReset()
    const fetchMock = getFetchMock()
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response)

    // Reset URL query params
    if (typeof window !== "undefined") {
      window.history.pushState({}, "Test Page", "/services")
    }
  })

  describe("ServicesList Component", () => {
    const mockServices = [
      {
        id: 101,
        name: "Sơn Gel Cao Cấp",
        description: "Dịch vụ sơn gel bền đẹp",
        price: "200000",
        duration: 45,
        popular: true,
        imageUrl: null,
      },
    ]

    it("should redirect to booking page with serviceId when 'Đặt lịch ngay' is clicked", async () => {
      const user = userEvent.setup()
      render(
        <ServicesList
          services={mockServices}
          pagination={{ page: 1, limit: 6, total: 1, totalPages: 1 }}
          isLoading={false}
          error={null}
          currentPage={1}
          onPageChange={vi.fn()}
        />
      )

      const bookButton = screen.getByRole("button", { name: /Đặt lịch ngay/i })
      expect(bookButton).toBeInTheDocument()

      await user.click(bookButton)

      expect(mockPush).toHaveBeenCalledWith("/book?serviceId=101")
    })
  })

  describe("BookingForm URL Parsing Integration", () => {
    it("should auto-select service and skip to Step 2 when serviceId is present in URL", async () => {
      // Giả lập URL có param ?serviceId=102
      if (typeof window !== "undefined") {
        window.history.pushState({}, "Booking Page", "/book?serviceId=102")
      }

      const fetchMock = getFetchMock()
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: 102, name: "Nối Mi Tự Nhiên", price: "250000", duration: 60, description: "Nối mi tự nhiên" },
            { id: 103, name: "Chăm Sóc Da Mặt", price: "300000", duration: 45, description: "Chăm sóc da" },
          ],
        }),
      } as Response)

      render(<BookingForm />)

      // Chờ API services được gọi
      await waitFor(() => expect(fetchMock).toHaveBeenCalled())

      // Chờ cho logic useEffect parse URL chạy xong và giao diện chuyển sang Bước 2
      await waitFor(() => {
        expect(screen.getByText("Bước 2: Chọn Ngày & Giờ")).toBeInTheDocument()
      })

      // Đảm bảo Bước 1 không còn hiển thị tiêu đề chính nữa
      expect(screen.queryByText("Bước 1: Chọn Dịch vụ")).not.toBeInTheDocument()

      // Kiểm tra xem dịch vụ 102 đã được chọn bằng cách xem tổng tiền/thời gian ở panel tóm tắt (nếu có)
      // Hoặc click quay lại Bước 1 để check checkbox
      const user = userEvent.setup()
      const backButton = screen.getByRole("button", { name: "" }) // Nút quay lại (icon ArrowLeft)
      await user.click(backButton)

      // Bây giờ phải quay lại Bước 1
      expect(screen.getByText("Bước 1: Chọn Dịch vụ")).toBeInTheDocument()

      // Checkbox của "Nối Mi Tự Nhiên" phải được checked
      const checkboxes = screen.getAllByRole("checkbox")
      // Checkbox đầu tiên tương ứng với Nối Mi Tự Nhiên (id 102) vì nó được render đầu tiên
      expect(checkboxes[0]).toBeChecked()
      // Checkbox thứ hai tương ứng với Chăm Sóc Da Mặt (id 103) không được checked
      expect(checkboxes[1]).not.toBeChecked()
    })
  })
})
