"use client"

export const dynamic = "force-dynamic"

import { Suspense, useState, useEffect } from "react"
import type React from "react"
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"

function SignInPageContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState("")

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const msg = searchParams.get("msg")
    if (msg) setResetMessage(msg)
  }, [searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()

      document.cookie = `token=${token}; path=/; max-age=3600; secure; samesite=strict`

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
    "mt-2 h-12 rounded-xl bg-[#e6eaf0] border border-transparent px-4 text-sm text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400/30 transition"

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-200 px-4">

      <div className="w-full max-w-[375px] rounded-[26px] overflow-hidden shadow-xl bg-gray-300">

        {/* HEADER */}
        <div className="relative px-6 py-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/back.jpg')" }}
          />
          <div className="absolute inset-0 bg-black/40"></div>

          <div className="relative z-10 flex items-center space-x-4">
            <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center">
              <Image
                src="/images/instaaid-logo.png"
                alt="InstaAid Logo"
                width={60}
                height={60}
                className="object-contain"
              />
            </div>

            <div>
              <h1 className="text-white text-lg font-bold">
                Welcome to InstaAid!
              </h1>
              <p className="text-blue-100 text-xs">
                Smart Detection. Swift Response. Saved Lives.
              </p>
            </div>
          </div>
        </div>

        {/* FORM */}
        <div className="px-6 py-6 bg-gray-300">

          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Welcome back!
            </h2>
            <p className="text-gray-600 text-sm">
              Sign in to continue
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
              <Input
                type="password"
                placeholder="Type your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputStyle}
                disabled={loading}
              />

              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  Must be 8 characters at least
                </span>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            {/* ✅ FIXED SIGN IN BUTTON ONLY */}
            <div className="flex justify-center mt-6">
              <Button
                type="submit"
                className="w-full h-12 rounded-lg bg-[#2245a5] text-white font-medium text-sm hover:bg-[#1d3d93]"
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

            {/* Admin (UNCHANGED) */}
            <div className="mt-4">
              <Link
                href="https://admin-instaaid.vercel.app/admin/login"
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