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
<<<<<<< HEAD

// 🔹 Firestore imports
import { doc, setDoc } from "firebase/firestore"
=======
import { doc, setDoc } from "firebase/firestore"
import { Dialog } from "@headlessui/react"

/* ✅ Validation Helpers */
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhilippinePhone(phone: string) {
  return /^09\d{9}$/.test(phone) // must start with 09 and have 11 digits
}

function isValidName(name: string) {
  return /^[A-Za-z\s'-]{2,30}$/.test(name) // allows letters, spaces, hyphen, apostrophe, min 2 max 30
}
>>>>>>> mike

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [emergencyName, setEmergencyName] = useState("")
  const [emergencyNumber, setEmergencyNumber] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otp, setOtp] = useState("")
  const [serverOtp, setServerOtp] = useState("")
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ Validation checks
    if (!isValidName(firstName)) return setError("First name must be 2–30 characters and contain only letters.")
    if (!isValidName(lastName)) return setError("Last name must be 2–30 characters and contain only letters.")
    if (!isValidEmail(email)) return setError("Please enter a valid email address.")
    if (!isValidPhilippinePhone(phoneNumber))
      return setError("Please enter a valid Philippine phone number (11 digits, starts with 09).")
    if (!isValidPhilippinePhone(emergencyNumber))
      return setError("Please enter a valid emergency contact number.")
    if (password.length < 8) return setError("Password must be at least 8 characters long.")
    if (password !== confirmPassword) return setError("Passwords do not match.")
    if (!agreeToTerms) return setError("Please agree to the terms and conditions.")

<<<<<<< HEAD
  if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
=======
>>>>>>> mike
    setError("")
    setSuccessMessage("")
    setLoading(true)

    try {
<<<<<<< HEAD
      // ✅ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // ✅ Update display name in Auth
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`,
=======
      const otpResponse = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
>>>>>>> mike
      })
      const data = await otpResponse.json()

<<<<<<< HEAD
      // ✅ Store extra user info in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        emergencyName,
        emergencyNumber,
        createdAt: new Date().toISOString(),
      })

      router.push("/dashboard")
    } catch (error: any) {
      setError(error.message || "Failed to create account")
=======
      if (data.success) {
        setServerOtp(data.otp)
        setOtpModalOpen(true)
        setSuccessMessage("OTP sent to your email. Please verify to continue.")
      } else {
        setError("Failed to send OTP. Please try again.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to send OTP")
>>>>>>> mike
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setVerifyingOtp(true)
    setError("")
    try {
      if (otp === serverOtp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        await updateProfile(user, { displayName: `${firstName} ${lastName}` })
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          firstName,
          lastName,
          email,
          phoneNumber,
          address,
          emergencyName,
          emergencyNumber,
          createdAt: new Date().toISOString(),
          emailVerified: true,
        })
        setSuccessMessage("✅ Account created successfully!")
        setOtpModalOpen(false)
        setTimeout(() => router.push("/auth/signin"), 1000)
      } else {
        setError("❌ Wrong OTP. Please try again.")
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setVerifyingOtp(false)
    }
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative px-6 py-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/back.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>
=======
    <div className="min-h-screen flex justify-center items-center bg-gray-200">
      <div className="border-[10px] border-gray-300 rounded-3xl w-[375px] h-[812px] shadow-2xl overflow-hidden relative bg-white">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black rounded-b-2xl w-36 h-6 z-10"></div>
>>>>>>> mike

        {/* Scrollable Content */}
        <div className="h-full overflow-y-auto">
          {/* Header */}
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
                <h1 className="text-white text-2xl font-bold">Join InstaAid!</h1>
                <p className="text-blue-200 text-sm mt-1">
                  Smart Detection · Swift Response · Saved Lives
                </p>
              </div>
            </div>
          </div>

<<<<<<< HEAD
            {/* First + Last Name */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
=======
          {/* Title */}
          <div className="px-6 mt-4">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-600 mt-1 text-sm">It's free and easy</p>
          </div>

          {/* Form */}
          <div className="px-6 py-8">
            <form onSubmit={handleSignUp} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-600 text-sm">{successMessage}</p>
                </div>
              )}

              {/* Inputs */}
              <div className="flex space-x-4">
>>>>>>> mike
                <Input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
<<<<<<< HEAD
                  required
                  disabled={loading}
                  className="w-full bg-gray-100 border-0 rounded-lg py-3"
=======
                  minLength={2}
                  maxLength={30}
                  required
                  disabled={loading}
                  className="bg-gray-100 border-0 rounded-lg py-3 w-1/2"
>>>>>>> mike
                />
                <Input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
<<<<<<< HEAD
                  required
                  disabled={loading}
                  className="w-full bg-gray-100 border-0 rounded-lg py-3"
=======
                  minLength={2}
                  maxLength={30}
                  required
                  disabled={loading}
                  className="bg-gray-100 border-0 rounded-lg py-3 w-1/2"
>>>>>>> mike
                />
              </div>

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
<<<<<<< HEAD
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
              />
            </div>

            {/* Current Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <Input
                type="text"
                placeholder="Enter your current address"
=======
                className="bg-gray-100 border-0 rounded-lg py-3"
              />

              <Input
                type="tel"
                placeholder="Phone number (09XXXXXXXXX)"
                maxLength={11}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />

              <Input
                type="text"
                placeholder="Address"
>>>>>>> mike
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={loading}
<<<<<<< HEAD
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
              />
            </div>

            {/* Emergency Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
              <Input
                type="text"
                placeholder="Enter emergency contact name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
              />
            </div>

            {/* Emergency Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Number</label>
              <Input
                type="tel"
                placeholder="Enter emergency contact number"
                value={emergencyNumber}
                onChange={(e) => setEmergencyNumber(e.target.value)}
                required
                disabled={loading}
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
=======
                className="bg-gray-100 border-0 rounded-lg py-3"
              />

              <Input
                type="text"
                placeholder="Emergency contact name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                minLength={2}
                maxLength={30}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />

              <Input
                type="tel"
                placeholder="Emergency contact number"
                maxLength={11}
                value={emergencyNumber}
                onChange={(e) => setEmergencyNumber(e.target.value.replace(/\D/g, ""))}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
>>>>>>> mike
              />

              <Input
                type="password"
                placeholder="Password (min 8 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
<<<<<<< HEAD
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
=======
                className="bg-gray-100 border-0 rounded-lg py-3"
>>>>>>> mike
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
<<<<<<< HEAD
                className="w-full bg-gray-100 border-0 rounded-lg py-3"
=======
                className="bg-gray-100 border-0 rounded-lg py-3"
>>>>>>> mike
              />

<<<<<<< HEAD
            {/* Terms */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                disabled={loading}
                className="mt-1"
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
=======
              {/* Terms Checkbox */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  disabled={loading}
                  className="mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  By creating an account you agree to our{" "}
                  <button
                    type="button"
                    className="text-blue-600 underline"
                    onClick={() => setShowTermsModal(true)}
                  >
                    Terms and Conditions
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="text-blue-600 underline"
                    onClick={() => setShowPrivacyModal(true)}
                  >
                    Privacy Policy
                  </button>.
                </label>
              </div>
>>>>>>> mike

              <Button
                type="submit"
                className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold mt-4"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Sending OTP...</span>
                  </div>
                ) : (
                  "Sign up"
                )}
              </Button>
            </form>

            {/* 🔁 Back to Sign In */}
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-blue-600 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
          
        </div>
      </div>

      {/* 📝 Terms Modal */}
      <Dialog open={showTermsModal} onClose={() => setShowTermsModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg bg-white rounded-2xl p-6 shadow-xl overflow-y-auto max-h-[80vh]">
            <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4">📜 Terms and Conditions</Dialog.Title>
            <div className="space-y-3 text-sm text-gray-700">
              <p>Last updated: October 11, 2025</p>
              <p>Welcome to InstaAid, an intelligent road accident detection and emergency response application. By accessing or using this app, you agree to comply with these Terms.</p>
              <p><strong>1.</strong> By using InstaAid, you agree to these Terms.</p>
              <p><strong>2.</strong> Description: Detect accidents, send alerts, and log crash data.</p>
              <p><strong>3.</strong> User must provide accurate info and not misuse the app.</p>
              <p><strong>4.</strong> Disclaimer: We are not liable for delays or failures due to signal loss or emergencies.</p>
              <p><strong>5.</strong> IP: All rights reserved.</p>
              <p><strong>6.</strong> Terms may change anytime.</p>
              <p><strong>7.</strong> Violators may be suspended.</p>
              <p><strong>8.</strong> Governed by PH law.</p>
            </div>
            <div className="mt-4 text-right">
              <Button onClick={() => setShowTermsModal(false)} className="bg-blue-600 text-white hover:bg-blue-700">
                Close
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* 🔐 Privacy Modal */}
      <Dialog open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg bg-white rounded-2xl p-6 shadow-xl overflow-y-auto max-h-[80vh]">
            <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4">🔒 Privacy Policy</Dialog.Title>
            <div className="space-y-3 text-sm text-gray-700">
              <p>Last updated: October 11, 2025</p>
              <p>This Privacy Policy explains how InstaAid collects and protects your information.</p>
              <p><strong>1.</strong> We collect personal, location, and sensor data.</p>
              <p><strong>2.</strong> Used only for emergency response and system improvements.</p>
              <p><strong>3.</strong> Shared only with emergency contacts/services.</p>
              <p><strong>4.</strong> Data is encrypted and secured.</p>
              <p><strong>5.</strong> Users may access, update, or delete data.</p>
              <p><strong>6.</strong> Retained while account is active or as required by law.</p>
              <p><strong>7.</strong> Not for children under 13 without consent.</p>
              <p><strong>8.</strong> Contact: support@instaaid.com</p>
            </div>
            <div className="mt-4 text-right">
              <Button onClick={() => setShowPrivacyModal(false)} className="bg-blue-600 text-white hover:bg-blue-700">
                Close
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* ✉️ OTP Modal */}
      <Dialog open={otpModalOpen} onClose={() => !verifyingOtp && setOtpModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <Dialog.Title className="text-lg font-semibold text-gray-800">Email Verification</Dialog.Title>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit OTP to <strong>{email}</strong>. Enter it below to verify your email and create your account.
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full border rounded-lg p-3 text-center text-lg tracking-widest bg-gray-50"
              placeholder="Enter OTP"
              disabled={verifyingOtp}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setOtpModalOpen(false)} disabled={verifyingOtp} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
                Cancel
              </Button>
              <Button onClick={handleVerifyOtp} disabled={verifyingOtp} className="bg-blue-600 text-white hover:bg-blue-700">
                {verifyingOtp ? "Creating Account..." : "Verify & Create Account"}
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}