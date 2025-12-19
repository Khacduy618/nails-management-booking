import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        success: true,
        message: "API is working!",
        env: process.env.NEXT_PUBLIC_API_URL,
        timestamp: new Date().toISOString()
    });
}
