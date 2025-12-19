import { describe, it, expect, beforeEach, vi } from "vitest"
import { NextRequest } from "next/server"
import { GET, PUT, DELETE } from "./route"

const mockedDb = vi.hoisted(() => {
  const findFirstMock = vi.fn()
  const updateWhereMock = vi.fn()
  const updateSetMock = vi.fn(() => ({ where: updateWhereMock }))
  const updateMock = vi.fn(() => ({ set: updateSetMock }))
  return {
    findFirstMock,
    updateWhereMock,
    updateSetMock,
    updateMock,
    db: {
      query: {
        appointments: {
          findFirst: findFirstMock,
        },
      },
      update: updateMock,
    },
  }
})

vi.mock("@/db", () => ({ db: mockedDb.db }))

const { findFirstMock, updateWhereMock, updateSetMock, updateMock } = mockedDb

const createRequest = (method: string, body?: unknown) =>
  new NextRequest("http://localhost/api/admin/appointments/1", {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
  })

describe("/api/admin/appointments/[id]", () => {
  beforeEach(() => {
    findFirstMock.mockReset()
    updateWhereMock.mockReset()
    updateSetMock.mockClear()
    updateMock.mockClear()
  })

  it("returns 400 when id is invalid (GET)", async () => {
    const res = await GET(createRequest("GET"), { params: { id: "abc" } })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("returns 404 when appointment missing (GET)", async () => {
    findFirstMock.mockResolvedValueOnce(null)
    const res = await GET(createRequest("GET"), { params: { id: "1" } })
    expect(res.status).toBe(404)
  })

  it("returns appointment details when found", async () => {
    const appointment = { id: 1, appointmentServices: [] }
    findFirstMock.mockResolvedValueOnce(appointment)
    const res = await GET(createRequest("GET"), { params: { id: "1" } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, appointment })
  })

  it("validates id on PUT", async () => {
    const res = await PUT(createRequest("PUT", { status: "confirmed" }), { params: { id: "foo" } })
    expect(res.status).toBe(400)
  })

  it("returns 404 when updating missing appointment", async () => {
    updateWhereMock.mockResolvedValueOnce([])
    const res = await PUT(createRequest("PUT", { status: "confirmed" }), { params: { id: "1" } })
    expect(res.status).toBe(404)
  })

  it("updates appointment and returns refreshed data", async () => {
    const updatedAppointment = { id: 1, status: "confirmed" }
    updateWhereMock.mockResolvedValueOnce([updatedAppointment])
    const res = await PUT(createRequest("PUT", { status: "confirmed" }), { params: { id: "1" } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, appointment: updatedAppointment })
  })

  it("validates id on DELETE", async () => {
    const res = await DELETE(createRequest("DELETE"), { params: { id: "bar" } })
    expect(res.status).toBe(400)
  })

  it("returns 404 when cancelling missing appointment", async () => {
    updateWhereMock.mockResolvedValueOnce([])
    const res = await DELETE(createRequest("DELETE"), { params: { id: "1" } })
    expect(res.status).toBe(404)
  })

  it("cancels appointment successfully", async () => {
    updateWhereMock.mockResolvedValueOnce([{ id: 1, status: 'cancelled' }])
    const res = await DELETE(createRequest("DELETE"), { params: { id: "1" } })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ success: true, message: "Appointment cancelled successfully" })
  })
})
