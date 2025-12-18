import "@testing-library/jest-dom/vitest"
import { vi } from "vitest"

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

const defaultFetchMock = vi.fn()

beforeEach(() => {
  defaultFetchMock.mockReset()
  defaultFetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ data: [] }),
  } as Response)
  global.fetch = defaultFetchMock as unknown as typeof fetch
  process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/"
})

afterEach(() => {
  vi.clearAllMocks()
})
