import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // ✅ Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 📩 Setup transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // 📨 Send professional email
    await transporter.sendMail({
      from: `"InstaAid Support" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "🔐 Your InstaAid Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f9f9f9; padding: 30px; border-radius: 12px;">
          <div style="text-align: center; padding-bottom: 20px;">
            <h2 style="color: #173C94; margin: 0;">InstaAid</h2>
          </div>

          <div style="background: #ffffff; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style="color: #333; margin-bottom: 10px;">Your One-Time Password (OTP)</h3>
            <p style="font-size: 16px; color: #555;">
              Please use the code below to verify your account. This code will expire in <strong>5 minutes</strong>.
            </p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #173C94; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #888;">
              If you didn’t request this code, please ignore this email or contact support immediately.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
            <p>© ${new Date().getFullYear()} InstaAid. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, otp });
  } catch (error) {
    console.error("OTP Send Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}
