import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi, expect } from "vitest"
import { BookingForm } from "../booking-form"

vi.mock("@/components/ui/calendar", () => ({
  Calendar: (props: { onSelect?: (date?: Date) => void }) => (
    <button onClick={() => props.onSelect?.(new Date("2030-01-15"))}>
      Chọn ngày mock
    </button>
  ),
}))

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const getFetchMock = () => global.fetch as unknown as ReturnType<typeof vi.fn>

describe("BookingForm", () => {
  beforeEach(() => {
    const mock = getFetchMock()
    mock.mockReset()
    mock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as Response)
  })

  it("renders the first step with search input", async () => {
    render(<BookingForm />)

    await waitFor(() => expect(getFetchMock()).toHaveBeenCalled())

    expect(screen.getByText("Bước 1: Chọn Dịch vụ")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Tìm dịch vụ...")).toBeInTheDocument()
  })

  it("enables the next button after selecting at least one service", async () => {
    getFetchMock().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          { id: 1, name: "Gội đầu thư giãn", price: "150000", duration: 30, description: null },
        ],
      }),
    } as Response)

    render(<BookingForm />)

    const nextButton = await screen.findByRole("button", { name: "Chọn Ngày & Giờ" })
    expect(nextButton).toBeDisabled()

    const user = userEvent.setup()
    const checkboxes = await screen.findAllByRole("checkbox")
    await user.click(checkboxes[0])

    expect(nextButton).toBeEnabled()
  })

  it("allows users to complete the booking flow", async () => {
    const fetchMock = getFetchMock()
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: [
            { id: 1, name: "Gội đầu thư giãn", price: "150000", duration: 30, description: null },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, slots: ["09:00", "09:30"] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, staff: [{ id: 5, name: "Chuyên viên A" }] }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { id: 99 } }),
      } as Response)

    render(<BookingForm />)
    const user = userEvent.setup()

    const serviceCheckboxes = await screen.findAllByRole("checkbox")
    await user.click(serviceCheckboxes[0])
    await user.click(screen.getByRole("button", { name: "Chọn Ngày & Giờ" }))
    await user.click(screen.getByRole("button", { name: "Chọn ngày mock" }))

    // Wait for dynamic slots to load before clicking slot button
    await screen.findByRole("button", { name: "09:00" })
    await user.click(screen.getByRole("button", { name: "09:00" }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))

    await user.click(screen.getByRole("button", { name: "Chọn Nhân viên" }))
    await user.click(screen.getByRole("button", { name: "Điền thông tin" }))

    await user.type(screen.getByLabelText("Họ và tên *"), "Khách Test")
    await user.type(screen.getByLabelText("Số điện thoại *"), "0901234567")
    await user.type(screen.getByLabelText("Ghi chú"), "Ghi chú kiểm thử")

    await user.click(screen.getByRole("button", { name: "Xác nhận đặt lịch" }))

    await waitFor(() => expect(screen.getByText("Đặt lịch thành công!")).toBeInTheDocument())

    const payload = JSON.parse((fetchMock.mock.calls[3][1] as RequestInit).body as string)
    expect(payload).toMatchObject({
      customerName: "Khách Test",
      customerPhone: "0901234567",
      serviceIds: [1],
      staffId: 5,
      time: "09:00",
    })
  })
})
