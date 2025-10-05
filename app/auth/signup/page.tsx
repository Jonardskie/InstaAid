"use client"

import type React from "react"
import { useState } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { ref, set } from "firebase/database"

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    setError("")

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update display name in Firebase Auth
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`,
      })

      // Store user info in Realtime Database
      await set(ref(db, `users/${userCredential.user.uid}`), {
        firstName,
        lastName,
        email,
        createdAt: new Date().toISOString(),
      })

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    // 📱 Phone Frame Wrapper
    <div className="min-h-screen flex justify-center items-center bg-gray-200">
      <div className="border-[12px] border-black rounded-[36px] w-[375px] h-[812px] shadow-2xl overflow-hidden relative bg-white">
        {/* 🔘 Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black rounded-b-2xl w-40 h-6 z-10"></div>

        {/* Scrollable content */}
        <div className="h-full overflow-y-auto">
          {/* Header with image background */}
          <div className="relative px-6 py-8">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/images/back.jpg')" }}
            ></div>
            <div className="absolute inset-0 bg-black/40"></div>

            <div className="relative z-10 flex items-center space-x-4">
              <div className="bg-white rounded-full w-20 h-15 flex items-center justify-center">
                <Image
                  src="/images/instaaid-logo.png"
                  alt="InstaAid Logo"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-white text-xl font-bold">Join InstaAid!</h1>
                <p className="text-blue-100 text-sm">Smart Detection. Swift Response. Saved Lives.</p>
              </div>
            </div>
          </div>

          {/* Sign up form */}
          <div className="px-6 py-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
                <p className="text-gray-600 mt-1">It's free and easy</p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* First and Last Name */}
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <Input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-gray-100 border-0 rounded-lg py-3"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <Input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-gray-100 border-0 rounded-lg py-3"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                  <Input
                    type="email"
                    placeholder="Type your e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-100 border-0 rounded-lg py-3"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Password */}
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-100 border-0 rounded-lg py-3"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Terms */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    className="mt-1"
                    disabled={loading}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                    By creating an account you agree to the{" "}
                    <Link href="/terms" className="text-blue-600 underline">
                      Terms and Conditions
                    </Link>
                    , and our{" "}
                    <Link href="/privacy" className="text-blue-600 underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-6">
                  <Button
                    type="submit"
                    className="w-64 h-14 bg-[#173C94] hover:bg-[#1E4ABF] text-white rounded-xl text-lg font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </div>
              </form>

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-gray-600">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="text-blue-600 font-semibold">
                    Sign In
                  </Link>
                </p>
              </div>

              {/* 🧩 Extra space for bottom scroll */}
              <div className="h-24"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
