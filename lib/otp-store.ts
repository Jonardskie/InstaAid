interface OtpEntry {
  otp: string
  expiresAt: number
}

// Global store to persist across Next.js API requests in development and production
const globalForOtp = global as unknown as { otpStore?: Map<string, OtpEntry> }
export const otpStore = globalForOtp.otpStore || new Map<string, OtpEntry>()
if (process.env.NODE_ENV !== "production") globalForOtp.otpStore = otpStore

export function saveOtp(email: string, otp: string) {
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes
  otpStore.set(email.toLowerCase().trim(), { otp, expiresAt })
}

export function verifyOtpCode(
  email: string,
  enteredOtp: string
): { success: boolean; message: string } {
  const cleanEmail = email.toLowerCase().trim()
  const entry = otpStore.get(cleanEmail)

  if (!entry) {
    return {
      success: false,
      message: "No verification code found or code expired. Please request a new code.",
    }
  }

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(cleanEmail)
    return {
      success: false,
      message: "Verification code has expired. Please request a new one.",
    }
  }

  if (entry.otp !== enteredOtp.trim()) {
    return {
      success: false,
      message: "Incorrect verification code. Please check your email and try again.",
    }
  }

  // Once verified, delete so it cannot be reused
  otpStore.delete(cleanEmail)
  return { success: true, message: "Code verified successfully." }
}
