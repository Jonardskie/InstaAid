"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Pages that don't need authentication or are public/waiting states
  const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/auth/waiting"]

  const isAdminOrApi = pathname.startsWith("/admin") || pathname.startsWith("/api")

  // Redirect unauthenticated users or users pending approval
  useEffect(() => {
    if (loading || isAdminOrApi) return

    if (!user && !publicRoutes.includes(pathname)) {
      router.replace("/auth/signin")
      return
    }

    if (user && !publicRoutes.includes(pathname)) {
      setCheckingStatus(true)
      const userRef = doc(db, "users", user.uid)
      getDoc(userRef)
        .then((snap) => {
          if (snap.exists()) {
            const status = snap.data()?.status
            if (status === "pending") {
              router.replace("/auth/waiting")
              return
            }
          }
          setCheckingStatus(false)
        })
        .catch((err) => {
          console.error("Error checking approval status:", err)
          setCheckingStatus(false)
        })
    } else {
      setCheckingStatus(false)
    }
  }, [user, loading, pathname, router, isAdminOrApi])

  // Allow admin and api routes to handle their own authentication directly
  if (isAdminOrApi) {
    return <>{children}</>
  }

  // Loading state (while Firebase checks user or verifies status)
  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Allow render only if public route or user is authenticated
  if (user || publicRoutes.includes(pathname)) {
    return <>{children}</>
  }

  // While redirecting
  return null
}
