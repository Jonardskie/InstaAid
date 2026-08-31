"use client"

export const dynamic = "force-dynamic"

import { Suspense, useState, useEffect } from "react"
import type React from "react"
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"

function SignInPageContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetMessage, setResetMessage] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const msg = searchParams.get("msg")
    if (msg) setResetMessage(msg)

    if (searchParams.get("rejected") === "true") {
      toast.error("Your account application was rejected by the administrator.")
    }
  }, [searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      const token = await user.getIdToken()

      document.cookie = `token=${token}; path=/; max-age=3600; secure; samesite=strict`

      // Verify approval status from Firestore
      try {
        const userDocRef = doc(db, "users", user.uid)
        const userDocSnap = await getDoc(userDocRef)

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()
          if (userData?.status === "pending") {
            toast("Your account is pending admin approval.", { icon: "⏳" })
            router.push("/auth/waiting")
            return
          }
          if (userData?.status === "rejected") {
            toast.error("Your account has been rejected by the administrator.")
            await auth.signOut()
            return
          }
        }
      } catch (checkErr) {
        console.warn("Could not check approval status:", checkErr)
      }

      toast.success("Signed in successfully!")
      router.push("/dashboard")
    } catch {
      toast.error("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first")
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setResetMessage("Password reset link sent!")
      toast.success("Check your email")
    } catch {
      toast.error("Failed to send reset email")
    }
  }

  const inputStyle =
    "mt-2 h-12 rounded-xl bg-slate-50 border border-slate-200 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#173C94] focus:ring-4 focus:ring-[#173C94]/10 transition"

  return (
    <div className="min-h-screen flex justify-center items-center bg-slate-100 py-10 px-4">

      <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-xl bg-white border border-slate-200/60">

        {/* HEADER */}
        <div className="relative px-7 py-8 bg-gradient-to-r from-[#0F1E47] via-[#173C94] to-[#1E40AF]">
          <div className="relative z-10 flex items-center space-x-4">
            <div className="bg-white p-2.5 rounded-2xl shadow-md w-16 h-16 flex items-center justify-center flex-shrink-0">
              <Image
                src="/images/instaaid-logo.png"
                alt="InstaAid Logo"
                width={50}
                height={50}
                className="object-contain"
              />
            </div>

            <div>
              <h1 className="text-white text-lg font-bold">
                Welcome to InstaAid!
              </h1>
              <p className="text-blue-100 text-xs mt-0.5">
                Smart Detection · Swift Response · Saved Lives
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="px-7 py-6 bg-white">

          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">
              Welcome back!
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">
              Sign in to access your driver dashboard
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">

            {resetMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-700">
                {resetMessage}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                E-mail
              </label>
              <Input
                type="email"
                placeholder="Type your e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>

              <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Type your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputStyle} pr-12`}
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2245a5] transition disabled:opacity-50"                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>
            {/* SIGN IN BUTTON */}
            <div className="flex justify-center mt-6">
              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#173C94] text-white font-semibold text-sm hover:bg-[#102B6A] shadow-md hover:shadow-[#173C94]/20 transition"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-4 mt-6">
              <div className="h-px flex-1 bg-gray-400/40" />
              <span className="text-xs font-medium text-gray-500">OR</span>
              <div className="h-px flex-1 bg-gray-400/40" />
            </div>

            {/* Admin */}
            <div className="mt-4">
              <Link
                href="/admin/login"
                className="group flex items-center justify-between rounded-xl border border-[#2245a5]/25 bg-gray-100 px-4 py-2.5 transition hover:bg-white hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#2245a5]/10 text-[#2245a5]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
                      <path d="M9.5 12.5l1.5 1.5 3.5-4" />
                    </svg>
                  </div>

                  <span className="text-sm font-semibold text-[#173C94]">
                    Sign in as Admin
                  </span>
                </div>

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 text-[#173C94] transition group-hover:translate-x-1"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            </div>

          </form>

          <div className="text-center mt-5 text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link href="/auth/signup" className="text-blue-600 font-semibold hover:underline">
              Create Account
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <SignInPageContent />
    </Suspense>
  )
}