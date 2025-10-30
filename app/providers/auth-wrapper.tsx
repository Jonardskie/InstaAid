"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  // Pages that don't need authentication (add root so landing page is public)
  const publicRoutes = ["/", "/auth/signin", "/auth/signup"]

  // Redirect unauthenticated users
  useEffect(() => {
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.replace("/auth/signin") // ✅ replace() prevents going back to protected route
    }
  }, [user, loading, pathname, router])

  // Loading state (while Firebase checks user)
  if (loading) {
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
