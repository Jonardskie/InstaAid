"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export default function WaitingPage() {
  const router = useRouter()

  useEffect(() => {
    const checkApprovalStatus = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push("/auth/signin")
        return
      }

      const userRef = doc(db, "users", user.uid)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const status = userSnap.data().status
        if (status === "approved") {
          router.push("/dashboard") // 👈 redirect to main page once approved
        }
      }
    }

    const interval = setInterval(checkApprovalStatus, 5000) // check every 5s
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
      <h1 className="text-2xl font-semibold mb-3">Waiting for Admin Approval</h1>
      <p className="text-gray-500">
        Your account is currently under review by our team. Please wait until the admin approves your registration.
      </p>
      <p className="text-sm text-gray-400 mt-4">
        (This page will automatically redirect once your account is approved)
      </p>
    </div>
  )
}
