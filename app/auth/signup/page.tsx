"use client"

import Image from "next/image"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
} from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 ,Eye, EyeOff} from "lucide-react"
import { doc, setDoc } from "firebase/firestore"
import { Dialog } from "@headlessui/react"
import { supabase } from "@/lib/supabase"
import { toast } from "react-hot-toast"

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhilippinePhone(phone: string) {
  return /^09\d{9}$/.test(phone)
}

function isValidName(name: string) {
  return /^[A-Za-z\s'-]{2,30}$/.test(name)
}

function validatePassword(password: string) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    specialChar: /[@$!%*?&.#_\-]/.test(password),
  }
}

function isStrongPassword(password: string) {
  const checks = validatePassword(password)
  return Object.values(checks).every(Boolean)
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

  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  const [vehicleOr, setVehicleOr] = useState<File | null>(null)
  const [vehicleCr, setVehicleCr] = useState<File | null>(null)

  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [serverOtp, setServerOtp] = useState("")
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""])

  const [timeLeft, setTimeLeft] = useState(120)
  const [otpExpired, setOtpExpired] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [canResend, setCanResend] = useState(false)

  const [otpError, setOtpError] = useState("")
  const [otpSuccess, setOtpSuccess] = useState("")

  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const router = useRouter()
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const inputStyle =
    "w-full h-12 rounded-xl bg-[#e6eaf0] border border-transparent px-4 text-sm text-gray-800 placeholder:text-gray-500 focus:bg-[#e6eaf0] focus:border-transparent focus:ring-2 focus:ring-blue-400/30 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? `0${s}` : s}`
  }
  const passwordChecks = validatePassword(password)

  const passwordRequirementStyle = (valid: boolean) =>
  `text-xs flex items-center gap-2 font-medium ${
    valid ? "text-green-600" : "text-gray-400"
  }`

  function clearFormMessages() {
    setFormError("")
    setFormSuccess("")
  }

  function clearOtpMessages() {
    setOtpError("")
    setOtpSuccess("")
  }

  function getFriendlyFirebaseError(err: any) {
    switch (err?.code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Please sign in instead."
      case "auth/invalid-email":
        return "Invalid email address."
      case "auth/weak-password":
        return "Password is too weak. Please use a stronger password."
      case "auth/network-request-failed":
        return "Network error. Please check your connection and try again."
      default:
        return err?.message || "Failed to create account. Please try again."
    }
  }

  useEffect(() => {
    if (!otpModalOpen) return

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
  }, [otpModalOpen, timeLeft])

  useEffect(() => {
    if (otpModalOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [otpModalOpen])

  async function sendOtpToEmail(targetEmail: string) {
    setSendingOtp(true)
    clearOtpMessages()

    try {
      const otpResponse = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      })

      const data = await otpResponse.json()
      console.log("OTP API response:", data)

      if (!otpResponse.ok || !data?.success) {
        const message = data?.message || data?.error || "Failed to send OTP. Please try again."
        setOtpError(message)
        setFormError(message)
        toast.error(message)
        return false
      }

      setServerOtp(String(data.otp))
      setTimeLeft(120)
      setOtpExpired(false)
      setCanResend(false)
      setOtpDigits(["", "", "", "", "", ""])
      setFormError("")
      setFormSuccess("")
      setOtpSuccess("OTP sent to your email. Please verify to continue.")
      setOtpModalOpen(true)

      setTimeout(() => inputRefs.current[0]?.focus(), 120)

      return true
    } catch (err: any) {
      console.error("OTP send error:", err)

      const message = "Failed to send OTP. Please try again."
      setOtpError(message)
      setFormError(message)
      toast.error(message)

      return false
    } finally {
      setSendingOtp(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    clearFormMessages()
    clearOtpMessages()

    if (!vehicleOr) {
      toast.error("Please upload your Vehicle OR image.")
      return
    }

    if (!vehicleCr) {
      toast.error("Please upload your Vehicle CR image.")
      return
    }

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

    if (!isStrongPassword(password)) {
    toast.error(
      "Password must include uppercase, lowercase, number, special character, and at least 8 characters."
    )
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

    try {
      const methods = await fetchSignInMethodsForEmail(auth, email)

      if (methods.length > 0) {
        const message = "This email is already registered. Please sign in instead."
        setFormError(message)
        toast.error(message)
        return
      }

      const ok = await sendOtpToEmail(email)

      if (ok) {
        toast.success("OTP sent! Check your email.")
      }
    } catch (err: any) {
      console.error("Signup OTP error:", err)
      const message = "Failed to send OTP. Please try again."
      setFormError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const enteredOtp = otpDigits.join("")

    if (enteredOtp.length !== 6) {
      setOtpError("Please enter all 6 digits.")
      return
    }

    if (otpExpired) {
      setOtpError("OTP expired. Please resend a new code.")
      return
    }

    if (enteredOtp !== serverOtp) {
      setOtpError("Wrong OTP. Please try again.")
      return
    }

    setVerifyingOtp(true)
    clearOtpMessages()

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      })

      let vehicleOrUrl = ""

      if (vehicleOr) {
        const { data, error } = await supabase.storage
          .from("users")
          .upload(`vehicleOR/${user.uid}_${Date.now()}_${vehicleOr.name}`, vehicleOr, {
            cacheControl: "3600",
            upsert: true,
          })

        if (error) throw error

        const { data: urlData } = supabase.storage.from("users").getPublicUrl(data.path)
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

        const { data: urlData } = supabase.storage.from("users").getPublicUrl(data.path)
        vehicleCrUrl = urlData.publicUrl
      }

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

      setOtpSuccess("Account created successfully!")
      toast.success("Account created successfully!")

      setTimeout(() => {
        setOtpModalOpen(false)
        router.push("/auth/waiting")
      }, 900)
    } catch (err: any) {
      const friendlyMessage = getFriendlyFirebaseError(err)
      setOtpError(friendlyMessage)
      setFormError(friendlyMessage)
      toast.error(friendlyMessage)
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    clearOtpMessages()
    setOtpDigits(["", "", "", "", "", ""])

    const ok = await sendOtpToEmail(email)

    if (ok) {
      setTimeout(() => inputRefs.current[0]?.focus(), 120)
    }
  }

  const handleOtpChange = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, "").slice(-1)
    const newDigits = [...otpDigits]
    newDigits[idx] = digit
    setOtpDigits(newDigits)
    setOtpError("")
    setOtpSuccess("")

    if (digit && idx < otpDigits.length - 1) {
      inputRefs.current[idx + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace") {
      if (otpDigits[idx]) {
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
    setOtpError("")
    setOtpSuccess("")

    const nextIndex = pasteDigits.length >= 6 ? 5 : pasteDigits.length
    setTimeout(() => inputRefs.current[nextIndex]?.focus(), 50)
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[375px] bg-white rounded-[26px] shadow-xl border border-gray-100 overflow-hidden">
        <div className="relative px-6 py-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/back.jpg')" }}
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative z-10 flex items-center space-x-4">
            <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center">
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

        <div className="px-6 pt-5 pb-3 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Create your account</h2>
          <p className="text-gray-500 mt-1 text-sm">It&apos;s free and easy</p>
        </div>

        <div className="px-6 pb-6 bg-white">
          <form onSubmit={handleSignUp} className="space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{formError}</p>
              </div>
            )}

            {formSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-600 text-sm">{formSuccess}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <Input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => {
                  clearFormMessages()
                  setFirstName(e.target.value)
                }}
                minLength={2}
                maxLength={30}
                required
                disabled={loading}
                className={`w-1/2 ${inputStyle}`}
              />

              <Input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => {
                  clearFormMessages()
                  setLastName(e.target.value)
                }}
                minLength={2}
                maxLength={30}
                required
                disabled={loading}
                className={`w-1/2 ${inputStyle}`}
              />
            </div>

            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                clearFormMessages()
                setEmail(e.target.value)
              }}
              required
              disabled={loading}
              className={inputStyle}
            />

            <Input
              type="tel"
              placeholder="Phone number (09XXXXXXXXX)"
              maxLength={11}
              value={phoneNumber}
              onChange={(e) => {
                clearFormMessages()
                setPhoneNumber(e.target.value.replace(/\D/g, ""))
              }}
              required
              disabled={loading}
              className={inputStyle}
            />

            <Input
              type="text"
              placeholder="Address"
              value={address}
              onChange={(e) => {
                clearFormMessages()
                setAddress(e.target.value)
              }}
              minLength={2}
              maxLength={80}
              required
              disabled={loading}
              className={inputStyle}
            />

            <Input
              type="text"
              placeholder="Emergency contact name"
              value={emergencyName}
              onChange={(e) => {
                clearFormMessages()
                setEmergencyName(e.target.value)
              }}
              minLength={2}
              maxLength={30}
              required
              disabled={loading}
              className={inputStyle}
            />

            <Input
              type="tel"
              placeholder="Emergency contact number"
              maxLength={11}
              value={emergencyNumber}
              onChange={(e) => {
                clearFormMessages()
                setEmergencyNumber(e.target.value.replace(/\D/g, ""))
              }}
              required
              disabled={loading}
              className={inputStyle}
            />

            <div className="flex flex-col w-full">
              {vehicleOr ? (
                <div className="relative flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 p-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={URL.createObjectURL(vehicleOr)}
                      alt="Vehicle OR"
                      className="w-16 h-16 object-cover rounded-md border"
                    />
                    <p className="text-sm text-gray-600 truncate max-w-[150px]">
                      {vehicleOr.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setVehicleOr(null)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-slate-300 rounded-lg cursor-pointer bg-[#f8fafc] hover:bg-white transition">
                  <p className="text-xs text-slate-500">Click to upload Vehicle OR</p>
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

            <div className="flex flex-col w-full">
              {vehicleCr ? (
                <div className="relative flex items-center justify-between border border-gray-200 rounded-lg bg-gray-50 p-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={URL.createObjectURL(vehicleCr)}
                      alt="Vehicle CR"
                      className="w-16 h-16 object-cover rounded-md border"
                    />
                    <p className="text-sm text-gray-600 truncate max-w-[150px]">
                      {vehicleCr.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setVehicleCr(null)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-20 border border-dashed border-slate-300 rounded-lg cursor-pointer bg-[#f8fafc] hover:bg-white transition">
                  <p className="text-xs text-slate-500">Click to upload Vehicle CR</p>
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

            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    clearFormMessages()
                    setPassword(e.target.value)
                  }}
                  minLength={8}
                  maxLength={30}
                  required
                  disabled={loading}
                  className={`${inputStyle} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2245a5] transition disabled:opacity-50"                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="space-y-2 pl-1">
                  {!isStrongPassword(password) && (
                    <p className="text-xs font-semibold text-red-500">
                      Password is required.
                    </p>
                  )}

                  <div className="space-y-1.5">
                    <p className={passwordRequirementStyle(passwordChecks.minLength)}>
                      {passwordChecks.minLength ? "●" : "○"} At least 8 characters
                    </p>

                    <p className={passwordRequirementStyle(passwordChecks.uppercase)}>
                      {passwordChecks.uppercase ? "●" : "○"} One uppercase letter
                    </p>

                    <p className={passwordRequirementStyle(passwordChecks.lowercase)}>
                      {passwordChecks.lowercase ? "●" : "○"} One lowercase letter
                    </p>

                    <p className={passwordRequirementStyle(passwordChecks.number)}>
                      {passwordChecks.number ? "●" : "○"} One number
                    </p>

                    <p className={passwordRequirementStyle(passwordChecks.specialChar)}>
                      {passwordChecks.specialChar ? "●" : "○"} One special character
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => {
                    clearFormMessages()
                    setConfirmPassword(e.target.value)
                  }}
                  minLength={8}
                  maxLength={30}
                  required
                  disabled={loading}
                  className={`${inputStyle} pr-12`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#2245a5] transition disabled:opacity-50"                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <p
                  className={`text-xs font-medium ${
                    password === confirmPassword ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {password === confirmPassword ? "● Passwords match" : "○ Passwords do not match"}
                </p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeToTerms}
                onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                disabled={loading}
                className="mt-0.5"
              />

              <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
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
                </button>
                .
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-lg bg-[#2245a5] text-white font-medium text-sm hover:bg-[#1d3d93]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending OTP...</span>
                </div>
              ) : (
                "Sign up"
              )}
            </Button>
          </form>

          <div className="text-center mt-5 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <Dialog open={showTermsModal} onClose={() => setShowTermsModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg bg-white rounded-2xl p-6 shadow-xl overflow-y-auto max-h-[80vh]">
            <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4">
              Terms and Conditions
            </Dialog.Title>

            <div className="space-y-3 text-sm text-gray-700">
              <p>Last updated: October 11, 2025</p>
              <p>
                Welcome to InstaAid, an intelligent road accident detection and emergency response
                application. By accessing or using this app, you agree to comply with these Terms.
              </p>
              <p><strong>1.</strong> By using InstaAid, you agree to these Terms.</p>
              <p><strong>2.</strong> Description: Detect accidents, send alerts, and log crash data.</p>
              <p><strong>3.</strong> User must provide accurate info and not misuse the app.</p>
              <p>
                <strong>4.</strong> Disclaimer: We are not liable for delays or failures due to signal
                loss or emergencies.
              </p>
              <p><strong>5.</strong> IP: All rights reserved.</p>
              <p><strong>6.</strong> Terms may change anytime.</p>
              <p><strong>7.</strong> Violators may be suspended.</p>
              <p><strong>8.</strong> Governed by PH law.</p>
            </div>

            <div className="mt-4 text-right">
              <Button
                onClick={() => setShowTermsModal(false)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-lg bg-white rounded-2xl p-6 shadow-xl overflow-y-auto max-h-[80vh]">
            <Dialog.Title className="text-lg font-semibold text-gray-800 mb-4">
              Privacy Policy
            </Dialog.Title>

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
              <Button
                onClick={() => setShowPrivacyModal(false)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Close
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <Dialog open={otpModalOpen} onClose={() => {}} className="relative z-[60]">
        <div className="fixed inset-0 bg-black/25 backdrop-blur-[1px]" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-3">
          <Dialog.Panel className="relative mx-auto w-full max-w-[350px] rounded-[20px] bg-white px-4 py-4 shadow-xl">
            <button
              type="button"
              onClick={() => {
                if (!verifyingOtp) setOtpModalOpen(false)
              }}
              disabled={verifyingOtp}
              aria-label="Close OTP modal"
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              ✕
            </button>

            <Dialog.Title className="pr-8 text-[15px] font-semibold text-slate-800">
              Email Verification
            </Dialog.Title>

            <p className="mt-3 text-[13px] leading-5 text-slate-600">
              We&apos;ve sent a 6-digit OTP to{" "}
              <strong className="text-slate-700">{email}</strong>. Enter it below to verify your
              email and create your account.
            </p>

            {!otpExpired ? (
              <p className="mt-4 text-[13px] font-semibold text-blue-600">
                OTP expires in <span className="font-bold">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <p className="mt-4 text-[13px] font-semibold text-red-500">
                OTP expired. Request a new code to continue.
              </p>
            )}

            <div className="mt-4 mb-3 flex justify-center gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  ref={(el) => {
                    inputRefs.current[idx] = el
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  onPaste={idx === 0 ? handlePaste : undefined}
                  disabled={verifyingOtp}
                  className="h-11 w-11 rounded-xl border border-slate-300 bg-slate-50 text-center text-base font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              ))}
            </div>

            {otpError && <p className="text-[12px] text-red-500">{otpError}</p>}
            {otpSuccess && <p className="text-[12px] text-green-600">{otpSuccess}</p>}

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  onClick={() => setOtpModalOpen(false)}
                  disabled={verifyingOtp}
                  className="h-9 rounded-lg bg-gray-200 px-4 text-sm text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || otpExpired}
                  className="h-9 rounded-lg bg-blue-600 px-4 text-sm text-white hover:bg-blue-700"
                >
                  {verifyingOtp ? "Creating..." : "Verify"}
                </Button>
              </div>

              <div className="mt-1 text-center text-[13px] text-gray-600">
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={sendingOtp || !canResend}
                  className={`font-semibold ${
                    canResend ? "text-blue-600 hover:underline" : "cursor-not-allowed text-gray-400"
                  }`}
                >
                  {sendingOtp ? "Resending..." : "Resend code"}
                </button>

                {!canResend && <span className="ml-1 text-gray-500">({formatTime(timeLeft)})</span>}
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}