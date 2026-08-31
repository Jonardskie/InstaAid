import admin from "firebase-admin"

let adminApp: admin.app.App | null = null

export function hasAdminConfig(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  )
}

function getAdminApp(): admin.app.App | null {
  if (adminApp) {
    return adminApp
  }

  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!
    return adminApp
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || "accident-detection-4db90"
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!clientEmail || !privateKey) {
    console.warn(
      "⚠️ Firebase Admin credentials not fully configured in environment. Running with client SDK integration."
    )
    return null
  }

  try {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
    return adminApp
  } catch (err) {
    console.error("Firebase Admin initialization error:", err)
    return null
  }
}

export function adminAuth() {
  const app = getAdminApp()
  return app ? app.auth() : null
}

export function adminDb() {
  const app = getAdminApp()
  return app ? app.firestore() : null
}
