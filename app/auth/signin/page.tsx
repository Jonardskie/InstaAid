"use client";

<<<<<<< HEAD
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Loader2 } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to sign in");
      }
=======
export const dynamic = "force-dynamic"

import { Suspense } from "react"
import type React from "react"
import { useState, useEffect } from "react"
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

function SignInPageContent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
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
    setError("")
    setResetMessage("")

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (user.email === "admin@instaaid.com") {
        router.push("/")
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      setError(error.message || "Failed to sign in")
>>>>>>> mike
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email first to reset your password.")
      return
    }

    try {
      await sendPasswordResetEmail(auth, email)
      setResetMessage("Password reset link sent! Please check your email.")
      setError("")
    } catch (error: any) {
      setError(error.message || "Failed to send password reset email.")
    }
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50">
      {/* Header with image background */}
      <div className="relative px-6 py-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/back.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Logo and text */}
        <div className="relative z-10 flex items-center space-x-4">
          <div className="bg-white rounded-full w-[80px] h-[80px] flex items-center justify-center">
            <Image
              src="/images/instaaid-logo.png"
              alt="InstaAid Logo"
              width={60}
              height={60}
              priority
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">Welcome to InstaAid!</h1>
            <p className="text-blue-100 text-sm">
              Smart Detection. Swift Response. Saved Lives.
            </p>
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
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Type your e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Type your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                className="mt-1"
                disabled={loading}
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-600 leading-relaxed"
              >
                By signing in, you agree to the{" "}
                <Link href="/terms" className="text-blue-600 underline">
                  Terms and Conditions
                </Link>{" "}
                and our{" "}
                <Link href="/privacy" className="text-blue-600 underline">
                  Privacy Policy
                </Link>.
              </label>
            </div>

            <div className="flex justify-center mt-8">
              <Button
                type="submit"
                className="w-[200px] h-[56px] bg-[#173C94] hover:bg-[#1E4ABF] text-white rounded-full text-lg font-semibold mt-6"
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
              <span className="text-sm">or sign in using</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-blue-600 font-semibold">
                Create Account
              </Link>
            </p>
          </div>

          <div className="flex justify-center pt-8">
            <div className="bg-green-500 rounded-full p-3">
              <Phone className="w-6 h-6 text-white" />
=======
    <div className="min-h-screen flex justify-center items-center bg-gray-200">
      <div className="border-[12px] border-black rounded-[36px] w-[375px] h-[812px] shadow-2xl overflow-hidden relative bg-white">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black rounded-b-2xl w-40 h-6 z-10"></div>

        <div className="h-full overflow-y-auto">
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
                <h1 className="text-white text-xl font-bold">Welcome to InstaAid!</h1>
                <p className="text-blue-100 text-sm">Smart Detection. Swift Response. Saved Lives.</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
                <p className="text-gray-600 mt-1">Sign in to continue</p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}
                {resetMessage && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-600 text-sm">{resetMessage}</p>
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

                  <div className="text-right mt-2">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-blue-600 text-sm font-semibold hover:underline"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
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
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <Link href="/auth/signup" className="text-blue-600 font-semibold">
                    Create Account
                  </Link>
                </p>
              </div>
>>>>>>> mike
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">Loading...</div>}>
      <SignInPageContent />
    </Suspense>
  )
}
