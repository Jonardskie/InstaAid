"use client"

import type React from "react"
import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Phone, Loader2 } from "lucide-react"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions")
      return
    }

    setLoading(true)
    setError("")

    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with image background */}
      <div className="relative px-6 py-8">
        {/* Background Image */}
        <div className="absolute inset-0 bg-cover bg-center"style={{ backgroundImage: "url('/images/back.jpg')" }}></div>
        {/* Overlay for text readability */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Logo and text */}
        <div className="relative z-10 flex items-center space-x-4">
      <div className="bg-white rounded-full w-20 h-18 flex items-center justify-center">
        <Image
          src="/images/instaaid-logo.png"
          alt="InstaAid Logo"
          width={80}
          height={80}
          className="object-contain"
        />
      </div>

          <div>
            <h1 className="text-white text-xl font-bold">Welcome to InstaAid!</h1>
            <p className="text-blue-100 text-sm">Smart Detection. Swift Response. Saved Lives.</p>
          </div>
        </div>
      </div>

      {/* Sign in form */}
      <div className="px-6 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
            <p className="text-gray-600 mt-1">It's free and easy</p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail or phone number</label>
              <Input
                type="email"
                placeholder="Type your e-mail or phone number"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <Input
                type="password"
                placeholder="Type your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Must be 8 characters at least</p>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                className="mt-1"
                disabled={loading}
              />
              <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                By creating an account means you agree to the{" "}
                <Link href="/terms" className="text-blue-600 underline">
                  Terms and Conditions
                </Link>
                , and our{" "}
                <Link href="/privacy" className="text-blue-600 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            <div className="flex justify-center mt-8">
            <Button
              type="submit"
              className="w-50 h-14 bg-[#173C94] hover:bg-[#1E4ABF] text-white rounded-full text-lg font-semibold mt-6"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
            </div>


          </form>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 text-gray-400">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-sm">or do it via other accounts</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-blue-600 font-semibold">
                Create Account
              </Link>
            </p>
          </div>

          {/* Bottom phone icon */}
          <div className="flex justify-center pt-8">
            <div className="bg-green-500 rounded-full p-3">
              <Phone className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
