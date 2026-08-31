import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { uid, email, name } = body

    if (!uid && !email) {
      return NextResponse.json({ error: "Missing uid or email" }, { status: 400 })
    }

    const { adminDb, hasAdminConfig } = await import("@/lib/firebase-admin")

    let recipientEmail = email
    let recipientName = name || "Driver"

    // 1. If Firebase Admin SDK is configured, update via Admin SDK
    if (hasAdminConfig()) {
      const db = adminDb()
      if (db && uid) {
        try {
          const userDoc = await db.collection("users").doc(uid).get()
          if (userDoc.exists) {
            const data = userDoc.data()
            recipientEmail = recipientEmail || data?.email
            recipientName =
              recipientName !== "Driver"
                ? recipientName
                : `${data?.firstName || ""} ${data?.lastName || ""}`.trim() || "Driver"
          }
          await db.collection("users").doc(uid).update({
            status: "approved",
            approvedAt: new Date().toISOString(),
          })
        } catch (dbErr) {
          console.warn("⚠️ Admin SDK Firestore update skipped:", dbErr)
        }
      }
    }

    // 2. Send professional approval notification email via Gmail SMTP
    const smtpEmail = process.env.SMTP_EMAIL?.trim()
    const smtpPassword = process.env.SMTP_PASSWORD?.replace(/\s+/g, "").trim()

    if (smtpEmail && smtpPassword && recipientEmail) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: smtpEmail,
            pass: smtpPassword,
          },
        })

        await transporter.sendMail({
          from: `"InstaAid Support" <${smtpEmail}>`,
          to: recipientEmail,
          subject: "🎉 Your InstaAid Driver Account Has Been Approved!",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; background: #f8fafc; padding: 32px 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #173C94; margin: 0; font-size: 24px; font-weight: 800;">InstaAid</h1>
                <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Smart Detection · Swift Response · Saved Lives</p>
              </div>

              <div style="background: #ffffff; padding: 28px 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Welcome to InstaAid, ${recipientName}!</h2>
                <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                  Great news! Your driver registration and vehicle documents (OR/CR) have been verified and <strong>approved</strong> by the administrator.
                </p>
                <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                  You now have full access to your driver emergency dashboard, automated crash alerts, and local responder network.
                </p>

                <div style="text-align: center; margin: 28px 0 20px;">
                  <a href="http://localhost:3000/auth/signin" style="background: #173C94; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; display: inline-block;">
                    Sign in to Driver Dashboard
                  </a>
                </div>
              </div>

              <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8;">
                <p>© ${new Date().getFullYear()} InstaAid Emergency Response Network. All rights reserved.</p>
              </div>
            </div>
          `,
        })

        console.log(`✅ [InstaAid] Approval notification email sent to: ${recipientEmail}`)
      } catch (mailError) {
        console.warn("⚠️ Approval notification email failed:", mailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Driver has been successfully approved.",
    })
  } catch (error: any) {
    console.error("❌ Approve user error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process user approval" },
      { status: 500 }
    )
  }
}
