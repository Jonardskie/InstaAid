"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { doc, setDoc } from "firebase/firestore"
import { Dialog } from "@headlessui/react"
import { supabase } from "@/lib/supabase"
import { toast } from "react-hot-toast"


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

  // Upload OR/CR image
  const [vehicleOr, setVehicleOr] = useState<File | null>(null)
  const [vehicleCr, setVehicleCr] = useState<File | null>(null)

  // OTP related states
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [serverOtp, setServerOtp] = useState("")
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""])

  // Countdown & resend
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes in seconds
  const [otpExpired, setOtpExpired] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [canResend, setCanResend] = useState(false)

  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const router = useRouter()

  // refs for inputs to manage focus
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  /* Helper: format seconds -> M:SS */
  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? `0${s}` : s}`
  }

  /* Countdown effect: runs while modal is open */
  useEffect(() => {
    if (!otpModalOpen) return

    // reset expired if time left set externally
    if (timeLeft <= 0) {
      setOtpExpired(true)
      setCanResend(true)
      return
    }

    setOtpExpired(false)
    setCanResend(false)

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setOtpExpired(true)
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpModalOpen]) // only re-run when modal opened/closed

  // keep canResend in sync if timeLeft changes externally
  useEffect(() => {
    if (timeLeft <= 0) {
      setOtpExpired(true)
      setCanResend(true)
    } else {
      setOtpExpired(false)
      setCanResend(false)
    }
  }, [timeLeft])

  // autofocus first OTP box when modal opens
  useEffect(() => {
    if (otpModalOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [otpModalOpen])

  /* Send OTP function used by initial signup and by resend */
  async function sendOtpToEmail(targetEmail: string) {
    setSendingOtp(true)
    try {
      const otpResponse = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      })
      const data = await otpResponse.json()
      if (data.success) {
        setServerOtp(data.otp)
        // reset countdown
        setTimeLeft(120)
        setOtpExpired(false)
        setCanResend(false)
        setOtpModalOpen(true)
        setOtpDigits(["", "", "", "", "", ""])
        setSuccessMessage("OTP sent to your email. Please verify to continue.")
        setError("")
        // focus first box shortly after modal opens
        setTimeout(() => inputRefs.current[0]?.focus(), 120)
        return true
      } else {
        setError("Failed to send OTP. Please try again.")
        return false
      }
    } catch (err: any) {
      setError(err.message || "Failed to send OTP")
      return false
    } finally {
      setSendingOtp(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
  e.preventDefault()

  // ✅ Check if Vehicle OR and CR are uploaded
  if (!vehicleOr) {
    toast.error("Please upload your Vehicle OR image.")
    return
  }

  if (!vehicleCr) {
    toast.error("Please upload your Vehicle CR image.")
    return
  }

  // ✅ Validation checks
  if (!isValidName(firstName)) {
    toast.error("First name must be 2–30 characters and contain only letters.")
    return
  }
  if (!isValidName(lastName)) {
    toast.error("Last name must be 2–30 characters and contain only letters.")
    return
  }
  if (!isValidEmail(email)) {
    toast.error("Please enter a valid email address.")
    return
  }
  if (!isValidPhilippinePhone(phoneNumber)) {
    toast.error("Please enter a valid Philippine phone number (11 digits, starts with 09).")
    return
  }
  if (!isValidPhilippinePhone(emergencyNumber)) {
    toast.error("Please enter a valid emergency contact number.")
    return
  }
  if (password.length < 8) {
    toast.error("Password must be at least 8 characters long.")
    return
  }
  if (password !== confirmPassword) {
    toast.error("Passwords do not match.")
    return
  }
  if (!agreeToTerms) {
    toast.error("Please agree to the terms and conditions.")
    return
  }

  setLoading(true)
  setError("")
  setSuccessMessage("")

  try {
    // ✅ Check if email is already in use
    const methods = await fetchSignInMethodsForEmail(auth, email)
    if (methods.length > 0) {
      toast.error("This email is already registered. Please sign in instead.")
      setLoading(false)
      return
    }

    // ✅ Email is not used → send OTP
    const ok = await sendOtpToEmail(email)
    if (ok) toast.success("OTP sent! Check your email.")
      
  } catch (err: any) {
    toast.error(err.message || "Failed to send OTP. Please try again.")
  } finally {
    setLoading(false)
  }
}


  const handleVerifyOtp = async () => {
    setVerifyingOtp(true)
    setError("")
    try {
      const enteredOtp = otpDigits.join("")
      if (enteredOtp.length !== 6) {
        setError("Please enter all 6 digits.")
        return
      }

      if (enteredOtp === serverOtp && !otpExpired) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        await updateProfile(user, { displayName: `${firstName} ${lastName}` })

        // Upload Vehicle OR to Supabase Storage
        let vehicleOrUrl = ""
        if (vehicleOr) {
          const { data, error } = await supabase.storage
            .from("users")
            .upload(`vehicleOR/${user.uid}_${Date.now()}_${vehicleOr.name}`, vehicleOr, {
              cacheControl: "3600",
              upsert: true,
            })
          if (error) throw error

          const { data: urlData } = supabase.storage
            .from("users")
            .getPublicUrl(data.path)
          vehicleOrUrl = urlData.publicUrl
        }

        let vehicleCrUrl = ""
        if (vehicleCr) {
          const { data, error } = await supabase.storage
            .from("users")
            .upload(`vehicleCR/${user.uid}_${Date.now()}_${vehicleCr.name}`, vehicleCr, {
              cacheControl: "3600",
              upsert: true,
            })
          if (error) throw error

          const { data: urlData } = supabase.storage
            .from("users")
            .getPublicUrl(data.path)
          vehicleCrUrl = urlData.publicUrl
        }

        // Save all data in Firestore
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
          vehicleOrUrl,
          vehicleCrUrl,
          status: "pending", 
        })

        setSuccessMessage("Account created successfully!")
        setOtpModalOpen(false)
        setTimeout(() => router.push("/auth/waiting"), 1000)
      } else {
        if (otpExpired) {
          setError("OTP expired. Please resend a new code.")
        } else {
          setError("Wrong OTP. Please try again.")
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.")
    } finally {
      setVerifyingOtp(false)
    }
  }

  /* Resend OTP — called when user clicks the Resend OTP button (visible from start, but disabled until canResend) */
  const handleResendOtp = async () => {
    setError("")
    setSuccessMessage("")
    // Re-call the same endpoint and restart timer via sendOtpToEmail
    const ok = await sendOtpToEmail(email)
    if (ok) {
      // ensure boxes cleared
      setOtpDigits(["", "", "", "", "", ""])
      setTimeout(() => inputRefs.current[0]?.focus(), 120)
    }
  }

  /* helpers for OTP boxes: change, paste, keydown */
  const handleOtpChange = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, "").slice(-1) // keep only last numeric char
    const newDigits = [...otpDigits]
    newDigits[idx] = digit
    setOtpDigits(newDigits)
    if (digit && idx < otpDigits.length - 1) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      if (otpDigits[idx]) {
        // clear this box (default behavior will also remove value)
        const newDigits = [...otpDigits]
        newDigits[idx] = ""
        setOtpDigits(newDigits)
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus()
        const newDigits = [...otpDigits]
        newDigits[idx - 1] = ""
        setOtpDigits(newDigits)
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    } else if (e.key === "ArrowRight" && idx < otpDigits.length - 1) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData("Text").replace(/\D/g, "").slice(0, 6)
    if (!paste) return
    const pasteDigits = paste.split("")
    const newDigits = ["", "", "", "", "", ""]
    for (let i = 0; i < pasteDigits.length; i++) {
      newDigits[i] = pasteDigits[i]
    }
    setOtpDigits(newDigits)
    // focus next empty or last
    const nextIndex = pasteDigits.length >= 6 ? 5 : pasteDigits.length
    setTimeout(() => inputRefs.current[nextIndex]?.focus(), 50)
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-200">
      <div className="border-[10px] border-gray-300 rounded-3xl w-[375px] h-[812px] shadow-2xl overflow-hidden relative bg-white">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-black rounded-b-2xl w-36 h-6 z-10"></div>

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
                <Input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  minLength={2}
                  maxLength={30}
                  required
                  disabled={loading}
                  className="bg-gray-100 border-0 rounded-lg py-3 w-1/2"
                />
                <Input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  minLength={2}
                  maxLength={30}
                  required
                  disabled={loading}
                  className="bg-gray-100 border-0 rounded-lg py-3 w-1/2"
                />
              </div>

              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={loading}
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
              />

              {/* Upload Vehicle OR */}
              <div className="flex flex-col w-full">
                {vehicleOr ? (
                  <div className="relative flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 p-2">
                    {/* Image Preview */}
                    <div className="flex items-center space-x-3">
                      <img
                        src={URL.createObjectURL(vehicleOr)}
                        alt="Vehicle OR"
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <p className="text-sm text-gray-600 truncate max-w-[140px]">
                        {vehicleOr.name}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => setVehicleOr(null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  // Upload state
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                    <p className="text-xs text-gray-500">📷 Click to upload Vehicle OR</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setVehicleOr(e.target.files?.[0] || null)}
                      className="hidden"
                      required
                      disabled={loading}
                    />
                  </label>
                )}
              </div>

              {/* Upload Vehicle CR */}
              <div className="flex flex-col w-full">
                {vehicleCr ? (
                  <div className="relative flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 p-2">
                    {/* Image Preview */}
                    <div className="flex items-center space-x-3">
                      <img
                        src={URL.createObjectURL(vehicleCr)}
                        alt="Vehicle CR"
                        className="w-20 h-20 object-cover rounded-md border"
                      />
                      <p className="text-sm text-gray-600 truncate max-w-[140px]">
                        {vehicleCr.name}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => setVehicleCr(null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  // Upload state
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                    <p className="text-xs text-gray-500">📷 Click to upload Vehicle CR</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setVehicleCr(e.target.files?.[0] || null)}
                      className="hidden"
                      required
                      disabled={loading}
                    />
                  </label>
                )}
              </div>

              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />

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

      {/* Terms Modal */}
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

      {/* Privacy Modal */}
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

      {/* OTP Modal */}
      <Dialog open={otpModalOpen} onClose={() => !verifyingOtp && setOtpModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm bg-white rounded-2xl p-6 shadow-xl space-y-4">
            <Dialog.Title className="text-lg font-semibold text-gray-800">Email Verification</Dialog.Title>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit OTP to <strong>{email}</strong>. Enter it below to verify your email and create your account.
            </p>

            {/* Countdown */}
            {!otpExpired ? (
              <p className="text-blue-600 font-medium">
                ⏳ OTP expires in <span className="font-bold">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="text-red-600 font-semibold">OTP expired. Request a new code to continue.</p>
            )}

            {/* 6 OTP Boxes */}
            <div className="flex justify-center gap-2 mt-2 mb-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  ref={(el) => {inputRefs.current[idx] = el}}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined} // only handle paste on first box
                  className="w-12 h-12 text-center border border-gray-300 rounded-lg text-lg font-semibold focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none"
                  disabled={verifyingOtp}
                />
              ))}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}
            {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}

            <div className="flex flex-col gap-2">
              <div className="flex justify-end gap-2">
                <Button onClick={() => setOtpModalOpen(false)} disabled={verifyingOtp} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
                  Cancel
                </Button>
                <Button onClick={handleVerifyOtp} disabled={verifyingOtp || otpExpired} className="bg-blue-600 text-white hover:bg-blue-700">
                  {verifyingOtp ? "Creating Account..." : "Verify & Create Account"}
                </Button>
              </div>

              {/* Resend always visible, disabled until canResend */}
              <div className="mt-1 text-center text-sm text-gray-600">
                Didn&apos;t receive the code?{" "}
                <button
                  onClick={handleResendOtp}
                  disabled={sendingOtp || !canResend}
                  className={`font-semibold ${
                    canResend ? "text-blue-600 hover:underline" : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {sendingOtp ? "Resending..." : "Resend code"}
                </button>
                {!canResend && <span className="ml-2 text-gray-500">({formatTime(timeLeft)})</span>}
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}
