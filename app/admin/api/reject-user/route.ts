import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { uid, email, name } = body

    if (!uid && !email) {
      return NextResponse.json({ error: "Missing uid or email" }, { status: 400 })
    }

    const { adminDb, adminAuth, hasAdminConfig } = await import("@/lib/firebase-admin")

    let recipientEmail = email
    let recipientName = name || "Driver"

    // 1. If Firebase Admin SDK is configured, delete via Admin SDK
    if (hasAdminConfig()) {
      const db = adminDb()
      const auth = adminAuth()
      
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
          await db.collection("users").doc(uid).delete()
        } catch (dbErr) {
          console.warn("⚠️ Admin SDK Firestore delete skipped:", dbErr)
        }
      }

      if (auth && uid) {
        try {
          await auth.deleteUser(uid)
          console.log(`✅ [InstaAid] Successfully deleted user ${uid} from Firebase Auth.`)
        } catch (authErr: any) {
          console.error("⚠️ Admin SDK Auth delete failed:", authErr)
          return NextResponse.json({ error: "Failed to delete user from Firebase Auth: " + authErr.message }, { status: 500 })
        }
      } else if (hasAdminConfig() && !auth) {
        return NextResponse.json({ error: "Firebase Admin SDK is configured but failed to initialize. Check your private key format in .env.local." }, { status: 500 })
      }
    }

    // 2. Send professional rejection notification email via Gmail SMTP
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
          subject: "Your InstaAid Account Request Was Rejected",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: auto; background: #f8fafc; padding: 32px 20px; border-radius: 16px; border: 1px solid #e2e8f0;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #173C94; margin: 0; font-size: 24px; font-weight: 800;">InstaAid</h1>
              </div>

              <div style="background: #ffffff; padding: 28px 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">Hello, ${recipientName}</h2>
                <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                  We regret to inform you that your account request has been <strong>rejected</strong>.
                </p>
                <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                  You are welcome to register again anytime.
                </p>
                <p style="font-size: 14px; color: #888; margin-top: 20px;">
                  Please make sure your submitted information is complete and correct before trying again.
                </p>
              </div>

              <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8;">
                <p>© ${new Date().getFullYear()} InstaAid. All rights reserved.</p>
              </div>
            </div>
          `,
        })

        console.log(`✅ [InstaAid] Rejection notification email sent to: ${recipientEmail}`)
      } catch (mailError) {
        console.warn("⚠️ Rejection notification email failed:", mailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Driver has been successfully rejected.",
    })
  } catch (error: any) {
    console.error("❌ Reject user error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process user rejection" },
      { status: 500 }
    )
  }
}