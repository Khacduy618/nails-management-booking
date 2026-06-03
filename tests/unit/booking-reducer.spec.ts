import { describe, it, expect } from "vitest"
import { bookingReducer, initialState, ApiService, ApiStaff } from "@/lib/booking-reducer"

describe("bookingReducer", () => {
  it("should return the initial state", () => {
    // Verify default initialization values
    expect(initialState.step).toBe(1)
    expect(initialState.isLoading).toBe(false)
    expect(initialState.error).toBe("")
    expect(initialState.success).toBe(false)
    expect(initialState.allServices).toEqual([])
    expect(initialState.availableStaff).toEqual([])
    expect(initialState.selectedServices).toEqual([])
    expect(initialState.selectedDate).toBeUndefined()
    expect(initialState.selectedTime).toBe("")
    expect(initialState.selectedStaffId).toBeNull()
    expect(initialState.autoAssign).toBe(true)
    expect(initialState.availabilityInfo).toBeNull()
    expect(initialState.customerName).toBe("")
    expect(initialState.customerPhone).toBe("")
    expect(initialState.customerEmail).toBe("")
    expect(initialState.notes).toBe("")
    expect(initialState.searchTerm).toBe("")
  })

  it("should handle SET_STEP action", () => {
    const state = bookingReducer(initialState, { type: "SET_STEP", payload: 3 })
    expect(state.step).toBe(3)
  })

  it("should handle SET_IS_LOADING action", () => {
    const state = bookingReducer(initialState, { type: "SET_IS_LOADING", payload: true })
    expect(state.isLoading).toBe(true)
  })

  it("should handle SET_ERROR action", () => {
    const state = bookingReducer(initialState, { type: "SET_ERROR", payload: "Error message" })
    expect(state.error).toBe("Error message")
  })

  it("should handle SET_SUCCESS action", () => {
    const state = bookingReducer(initialState, { type: "SET_SUCCESS", payload: true })
    expect(state.success).toBe(true)
  })

  it("should handle SET_ALL_SERVICES action", () => {
    const mockServices: ApiService[] = [
      { id: 1, name: "Manicure", description: "Clean nails", price: "150000", duration: 30 },
      { id: 2, name: "Pedicure", description: "Clean feet", price: "180000", duration: 40 }
    ]
    const state = bookingReducer(initialState, { type: "SET_ALL_SERVICES", payload: mockServices })
    expect(state.allServices).toEqual(mockServices)
  })

  it("should handle SET_AVAILABLE_STAFF action", () => {
    const mockStaff: ApiStaff[] = [
      { id: 10, name: "Sarah Staff" },
      { id: 11, name: "John Staff" }
    ]
    const state = bookingReducer(initialState, { type: "SET_AVAILABLE_STAFF", payload: mockStaff })
    expect(state.availableStaff).toEqual(mockStaff)
  })

  it("should handle SET_SELECTED_SERVICES action", () => {
    const mockServices: ApiService[] = [
      { id: 1, name: "Manicure", description: "Clean nails", price: "150000", duration: 30 }
    ]
    const state = bookingReducer(initialState, { type: "SET_SELECTED_SERVICES", payload: mockServices })
    expect(state.selectedServices).toEqual(mockServices)
  })

  it("should handle TOGGLE_SERVICE action (checking and unchecking)", () => {
    const service1: ApiService = { id: 1, name: "Manicure", description: "Clean nails", price: "150000", duration: 30 }
    const service2: ApiService = { id: 2, name: "Pedicure", description: "Clean feet", price: "180000", duration: 40 }

    // Toggle service 1 ON
    let state = bookingReducer(initialState, { type: "TOGGLE_SERVICE", payload: { service: service1, checked: true } })
    expect(state.selectedServices).toEqual([service1])

    // Toggle service 2 ON
    state = bookingReducer(state, { type: "TOGGLE_SERVICE", payload: { service: service2, checked: true } })
    expect(state.selectedServices).toEqual([service1, service2])

    // Toggle service 1 OFF
    state = bookingReducer(state, { type: "TOGGLE_SERVICE", payload: { service: service1, checked: false } })
    expect(state.selectedServices).toEqual([service2])
  })

  it("should handle CLEAR_SELECTED_SERVICES action", () => {
    const service1: ApiService = { id: 1, name: "Manicure", description: "Clean nails", price: "150000", duration: 30 }
    const initialStateWithServices = { ...initialState, selectedServices: [service1] }
    const state = bookingReducer(initialStateWithServices, { type: "CLEAR_SELECTED_SERVICES" })
    expect(state.selectedServices).toEqual([])
  })

  it("should handle SET_SELECTED_DATE action and reset associated selection fields", () => {
    const testDate = new Date("2026-06-01")
    const customState = {
      ...initialState,
      selectedTime: "15:00",
      availableTimeSlots: ["15:00", "15:30"],
      availableStaff: [{ id: 1, name: "Staff 1" }],
      availabilityInfo: "Some info"
    }
    const state = bookingReducer(customState, { type: "SET_SELECTED_DATE", payload: testDate })
    expect(state.selectedDate).toBe(testDate)
    expect(state.selectedTime).toBe("")
    expect(state.availableTimeSlots).toEqual([])
    expect(state.availableStaff).toEqual([])
    expect(state.availabilityInfo).toBeNull()
  })

  it("should handle SET_SELECTED_TIME action", () => {
    const state = bookingReducer(initialState, { type: "SET_SELECTED_TIME", payload: "15:00" })
    expect(state.selectedTime).toBe("15:00")
  })

  it("should handle SET_SELECTED_STAFF_ID action", () => {
    const state = bookingReducer(initialState, { type: "SET_SELECTED_STAFF_ID", payload: 5 })
    expect(state.selectedStaffId).toBe(5)
  })

  it("should handle SET_AUTO_ASSIGN action", () => {
    const state = bookingReducer(initialState, { type: "SET_AUTO_ASSIGN", payload: false })
    expect(state.autoAssign).toBe(false)
  })

  it("should handle SET_AVAILABILITY_INFO action", () => {
    const state = bookingReducer(initialState, { type: "SET_AVAILABILITY_INFO", payload: "2 available staff" })
    expect(state.availabilityInfo).toBe("2 available staff")
  })

  it("should handle customer field setters", () => {
    let state = bookingReducer(initialState, { type: "SET_CUSTOMER_NAME", payload: "Nguyễn Khắc Duy" })
    state = bookingReducer(state, { type: "SET_CUSTOMER_PHONE", payload: "0932105214" })
    state = bookingReducer(state, { type: "SET_CUSTOMER_EMAIL", payload: "duy@test.com" })
    state = bookingReducer(state, { type: "SET_NOTES", payload: "Test note" })
    state = bookingReducer(state, { type: "SET_SEARCH_TERM", payload: "Nail" })

    expect(state.customerName).toBe("Nguyễn Khắc Duy")
    expect(state.customerPhone).toBe("0932105214")
    expect(state.customerEmail).toBe("duy@test.com")
    expect(state.notes).toBe("Test note")
    expect(state.searchTerm).toBe("Nail")
  })

  it("should handle SET_AVAILABLE_TIME_SLOTS action", () => {
    const slots = ["09:00", "10:30"]
    const state = bookingReducer(initialState, { type: "SET_AVAILABLE_TIME_SLOTS", payload: slots })
    expect(state.availableTimeSlots).toEqual(slots)
  })

  it("should handle RESET action and keep pre-loaded services", () => {
    const mockServices: ApiService[] = [
      { id: 1, name: "Manicure", description: "Clean nails", price: "150000", duration: 30 }
    ]
    const stateWithInputs = {
      ...initialState,
      allServices: mockServices,
      step: 4,
      selectedTime: "15:00",
      customerName: "Nguyễn Khắc Duy"
    }

    const stateAfterReset = bookingReducer(stateWithInputs, { type: "RESET" })
    expect(stateAfterReset.allServices).toEqual(mockServices)
    expect(stateAfterReset.step).toBe(1)
    expect(stateAfterReset.selectedTime).toBe("")
    expect(stateAfterReset.customerName).toBe("")
  })
})
