import { NextResponse } from "next/server"

export type ApiErrorCode =
  | "MISSING_PHONE"
  | "INVALID_INPUT"
  | "SERVICE_NOT_FOUND"
  | "STAFF_CONFLICT"
  | "NO_AVAILABILITY"
  | "SERVER_ERROR"
  | "FETCH_ERROR"
  | "CONFLICT"
  | "NOT_FOUND"
  | "UNAUTHORIZED"

export function ok<T extends object>(payload: T, status = 200) {
  return NextResponse.json({ success: true, ...payload }, { status })
}

export function fail(code: ApiErrorCode, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}
