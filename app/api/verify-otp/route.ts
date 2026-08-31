import { NextResponse } from "next/server"
import { verifyOtpCode } from "@/lib/otp-store"

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and verification code are required" },
        { status: 400 }
      )
    }

    const result = verifyOtpCode(email, otp)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    })
  } catch (err: any) {
    console.error("Error verifying OTP:", err)
    return NextResponse.json(
      { success: false, error: "Server error during verification" },
      { status: 500 }
    )
  }
}
