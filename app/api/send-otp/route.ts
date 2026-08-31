import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { saveOtp } from "@/lib/otp-store"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      )
    }

    const smtpEmail = process.env.SMTP_EMAIL?.trim()
    const smtpPassword = process.env.SMTP_PASSWORD?.replace(/\s+/g, "").trim()

    if (!smtpEmail || !smtpPassword) {
      console.error("❌ SMTP configuration missing: SMTP_EMAIL or SMTP_PASSWORD not set in .env.local")
      return NextResponse.json(
        {
          success: false,
          error: "Email service is not configured. Please set SMTP_EMAIL and SMTP_PASSWORD in your .env.local file.",
        },
        { status: 500 }
      )
    }

    // 1. Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // 2. Save in server-side verification store (5 minute expiration)
    saveOtp(email, otp)

    // 3. Create Gmail transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    })

    // 4. Send email to user
    await transporter.sendMail({
      from: `"InstaAid Emergency Network" <${smtpEmail}>`,
      to: email.trim(),
      subject: "Your InstaAid Verification Code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 540px; margin: auto; background: #f8fafc; padding: 32px 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #173C94; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">InstaAid</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Smart Detection · Swift Response · Saved Lives</p>
          </div>

          <div style="background: #ffffff; padding: 28px 24px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 18px; font-weight: 700;">Driver Account Verification</h2>
            <p style="font-size: 14px; color: #475569; line-height: 1.5; margin: 12px 0 20px;">
              Please use the verification code below to complete your registration. This code will expire in <strong>5 minutes</strong>.
            </p>
            
            <div style="display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; padding: 14px 32px; border-radius: 10px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #173C94; font-family: monospace; margin: 8px 0 20px;">
              ${otp}
            </div>

            <p style="font-size: 12px; color: #94a3b8; margin: 0;">
              If you did not request this verification code, please ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8;">
            <p style="margin: 0;">© ${new Date().getFullYear()} InstaAid Emergency Response Network. All rights reserved.</p>
          </div>
        </div>
      `,
    })

    console.log(`✅ [InstaAid] Real OTP email successfully sent to: ${email}`)

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email.",
    })
  } catch (error: any) {
    console.error("❌ OTP Send Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to send email. Check your Gmail App Password.",
      },
      { status: 500 }
    )
  }
}
