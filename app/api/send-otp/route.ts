import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // ✅ Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"InstaAid" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Your InstaAid OTP Code",
      html: `<p>Your OTP code is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`,
    });

    return NextResponse.json({ success: true, otp }); // (you can store or return this for verification)
  } catch (error) {
    console.error("OTP Send Error:", error);
    return NextResponse.json({ success: false, error: "Failed to send OTP" }, { status: 500 });
  }
}
