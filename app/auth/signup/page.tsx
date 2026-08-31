"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"
import {
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Upload,
  ShieldCheck,
  Check,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  FileText,
  CheckCircle2,
  X,
} from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1: Account
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Step 2: Contact
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [emergencyName, setEmergencyName] = useState("")
  const [emergencyNumber, setEmergencyNumber] = useState("")

  // Step 3: Vehicle & Verification
  const [vehicleOr, setVehicleOr] = useState<File | null>(null)
  const [vehicleCr, setVehicleCr] = useState<File | null>(null)
  const [vehicleOrPreview, setVehicleOrPreview] = useState<string | null>(null)
  const [vehicleCrPreview, setVehicleCrPreview] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // OTP State
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""])
  const [serverOtp, setServerOtp] = useState("")
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [otpError, setOtpError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)

  // Terms Modal
  const [termsModalOpen, setTermsModalOpen] = useState(false)

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Password rules
  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  }
  const isPasswordValid = Object.values(passwordChecks).every(Boolean)
  const passwordsMatch = password && password === confirmPassword

  // Validation handlers per step
  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your full name.")
      return false
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.")
      return false
    }
    if (!isPasswordValid) {
      toast.error("Password must meet all security requirements.")
      return false
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match.")
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!phoneNumber.trim()) {
      toast.error("Please provide your phone number.")
      return false
    }
    if (!address.trim()) {
      toast.error("Please enter your address.")
      return false
    }
    if (!emergencyName.trim()) {
      toast.error("Emergency contact person is required.")
      return false
    }
    if (!emergencyNumber.trim()) {
      toast.error("Emergency contact number is required.")
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const handleFileChange = (file: File | null, type: "or" | "cr") => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, JPEG).")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      if (type === "or") {
        setVehicleOr(file)
        setVehicleOrPreview(e.target?.result as string)
      } else {
        setVehicleCr(file)
        setVehicleCrPreview(e.target?.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  // OTP Sending
  const triggerOtpProcess = async () => {
    if (!agreedToTerms) {
      toast.error("You must agree to the Terms and Conditions.")
      return
    }

    setSendingOtp(true)
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to send verification email.")
      }

      setOtpDigits(["", "", "", "", "", ""])
      setOtpModalOpen(true)
      setResendCooldown(60)
      toast.success("Verification code sent to your Gmail inbox!")

      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      toast.error(err.message || "Failed to send verification email.")
    } finally {
      setSendingOtp(false)
    }
  }

  // Account creation after OTP
  const handleVerifyAndRegister = async () => {
    const enteredOtp = otpDigits.join("")
    if (enteredOtp.length < 6) {
      setOtpError("Please enter the complete 6-digit code from your email.")
      return
    }

    setVerifyingOtp(true)
    setOtpError("")

    try {
      // 1. Verify OTP with server route
      const verifyRes = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: enteredOtp,
        }),
      })

      const verifyData = await verifyRes.json()
      if (!verifyRes.ok || !verifyData.success) {
        setOtpError(verifyData.error || "Incorrect or expired verification code.")
        setVerifyingOtp(false)
        return
      }

      // 2. Create in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      const user = userCredential.user

      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`,
      })

      // 2. Upload vehicle OR to Supabase
      let vehicleOrUrl = ""
      if (vehicleOr) {
        try {
          const { data, error } = await supabase.storage
            .from("users")
            .upload(`vehicleOR/${user.uid}_${Date.now()}_${vehicleOr.name}`, vehicleOr, {
              cacheControl: "3600",
              upsert: true,
            })
          if (error) {
            console.error("Supabase vehicleOR upload error:", error)
          } else if (data) {
            const { data: urlData } = supabase.storage.from("users").getPublicUrl(data.path)
            vehicleOrUrl = urlData.publicUrl
          }
        } catch (uploadErr) {
          console.warn("Supabase vehicleOR upload:", uploadErr)
        }
      }

      // 3. Upload vehicle CR to Supabase
      let vehicleCrUrl = ""
      if (vehicleCr) {
        try {
          const { data, error } = await supabase.storage
            .from("users")
            .upload(`vehicleCR/${user.uid}_${Date.now()}_${vehicleCr.name}`, vehicleCr, {
              cacheControl: "3600",
              upsert: true,
            })
          if (error) {
            console.error("Supabase vehicleCR upload error:", error)
          } else if (data) {
            const { data: urlData } = supabase.storage.from("users").getPublicUrl(data.path)
            vehicleCrUrl = urlData.publicUrl
          }
        } catch (uploadErr) {
          console.warn("Supabase vehicleCR upload:", uploadErr)
        }
      }

      // 4. Save to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        emergencyName: emergencyName.trim(),
        emergencyNumber: emergencyNumber.trim(),
        createdAt: new Date().toISOString(),
        emailVerified: true,
        vehicleOrUrl,
        vehicleCrUrl,
        status: "pending",
      })

      toast.success("Account created successfully! Awaiting administrator approval.")
      setOtpModalOpen(false)
      router.push("/auth/waiting")
    } catch (err: any) {
      console.error("Registration error:", err)
      setOtpError(err.message || "Failed to create account.")
      toast.error(err.message || "Failed to create account.")
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleOtpInput = (val: string, idx: number) => {
    const digit = val.replace(/\D/g, "").slice(-1)
    const next = [...otpDigits]
    next[idx] = digit
    setOtpDigits(next)
    setOtpError("")

    if (digit && idx < 5) {
      otpInputRefs.current[idx + 1]?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-center py-10 px-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/70">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F1E47] via-[#173C94] to-[#1E40AF] px-7 py-6 text-white">
          <div className="flex items-center space-x-3.5">
            <div className="bg-white p-2 rounded-2xl shadow-md w-14 h-14 flex items-center justify-center flex-shrink-0">
              <Image
                src="/images/instaaid-logo.png"
                alt="InstaAid Logo"
                width={42}
                height={42}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Driver Registration</h1>
              <p className="text-blue-200 text-xs mt-0.5">Join the InstaAid Emergency Network</p>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-6 flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-emerald-400 -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
            />

            {[
              { num: 1, label: "Account" },
              { num: 2, label: "Profile" },
              { num: 3, label: "Vehicle" },
            ].map((s) => {
              const isCompleted = step > s.num
              const isCurrent = step === s.num
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-400 text-slate-900 shadow-md"
                        : isCurrent
                        ? "bg-white text-[#173C94] ring-4 ring-white/30"
                        : "bg-[#102B6A] text-white/60 border border-white/20"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className="text-[10px] font-medium mt-1 text-white/80">{s.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Wizard Step Forms */}
        <div className="p-7">
          
          {/* STEP 1: Account Credentials */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Account Credentials</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter your basic identification and password</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">First Name</label>
                  <Input
                    placeholder="e.g. Jonard"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Last Name</label>
                  <Input
                    placeholder="e.g. Santocildes"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">E-mail Address</label>
                <Input
                  type="email"
                  placeholder="driver@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm pr-10 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm pr-10 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-600">
                <p className="font-bold text-slate-700 text-[11px] mb-1">Security Requirements:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <span className={`flex items-center gap-1.5 ${passwordChecks.length ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> 8+ Characters
                  </span>
                  <span className={`flex items-center gap-1.5 ${passwordChecks.upper ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uppercase (A-Z)
                  </span>
                  <span className={`flex items-center gap-1.5 ${passwordChecks.lower ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Lowercase (a-z)
                  </span>
                  <span className={`flex items-center gap-1.5 ${passwordChecks.number ? "text-emerald-600 font-semibold" : "text-slate-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Number (0-9)
                  </span>
                </div>
              </div>

              <Button
                onClick={handleNext}
                className="w-full h-12 rounded-xl bg-[#173C94] hover:bg-[#102B6A] text-white font-semibold mt-2 shadow-md hover:shadow-[#173C94]/20 transition flex items-center justify-center gap-2"
              >
                <span>Continue to Profile</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: Contact & Emergency Information */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Contact & Emergency Details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Used during crash dispatches and emergency notifications</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Driver Mobile Number</label>
                <Input
                  placeholder="e.g. 09123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Permanent / Home Address</label>
                <Input
                  placeholder="e.g. Tuguegarao City, Cagayan"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm focus:bg-white"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">Emergency Contact</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Contact Person Name</label>
                    <Input
                      placeholder="e.g. Maria Santocildes (Mother)"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="mt-1 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Emergency Phone Number</label>
                    <Input
                      placeholder="e.g. 09987654321"
                      value={emergencyNumber}
                      onChange={(e) => setEmergencyNumber(e.target.value)}
                      className="mt-1 h-11 rounded-xl bg-slate-50 border-slate-200 text-sm focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="w-1/3 h-12 rounded-xl border-slate-300 text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>

                <Button
                  onClick={handleNext}
                  className="w-2/3 h-12 rounded-xl bg-[#173C94] hover:bg-[#102B6A] text-white font-semibold shadow-md transition flex items-center justify-center gap-2"
                >
                  <span>Vehicle Documents</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Vehicle Verification & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Vehicle Documents</h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload official LTO documents for administrator verification</p>
              </div>

              {/* Vehicle OR */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Official Receipt (OR)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-blue-500 transition relative bg-slate-50">
                  {vehicleOrPreview ? (
                    <div className="space-y-2">
                      <div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 mx-auto">
                        <Image src={vehicleOrPreview} alt="Vehicle OR" fill className="object-cover" />
                      </div>
                      <span className="text-xs text-emerald-600 font-bold block">✓ OR Image Selected</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-2">
                      <Upload className="w-7 h-7 mx-auto text-slate-400" />
                      <p className="text-xs font-semibold text-slate-600">Tap to upload Vehicle OR</p>
                      <p className="text-[10px] text-slate-400">JPG, PNG (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null, "or")}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Vehicle CR */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Certificate of Registration (CR)</label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-blue-500 transition relative bg-slate-50">
                  {vehicleCrPreview ? (
                    <div className="space-y-2">
                      <div className="relative h-28 w-full rounded-xl overflow-hidden border border-slate-200 mx-auto">
                        <Image src={vehicleCrPreview} alt="Vehicle CR" fill className="object-cover" />
                      </div>
                      <span className="text-xs text-emerald-600 font-bold block">✓ CR Image Selected</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-2">
                      <Upload className="w-7 h-7 mx-auto text-slate-400" />
                      <p className="text-xs font-semibold text-slate-600">Tap to upload Vehicle CR</p>
                      <p className="text-[10px] text-slate-400">JPG, PNG (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null, "cr")}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-600 rounded"
                />
                <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-blue-600 underline font-semibold"
                  >
                    Terms & Conditions
                  </button>{" "}
                  and consent to automated crash telemetry transmission.
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="w-1/3 h-12 rounded-xl border-slate-300 text-slate-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>

                <Button
                  onClick={triggerOtpProcess}
                  disabled={sendingOtp || !agreedToTerms}
                  className="w-2/3 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md transition flex items-center justify-center gap-2"
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Register</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Already have an account */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-[#173C94] font-bold hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

      </div>

      {/* OTP Verification Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Enter Verification Code</h3>
              <p className="text-xs text-slate-500">
                We sent a 6-digit verification code to <span className="font-semibold text-slate-700">{email}</span>
              </p>
            </div>

            {/* 6 Digit Inputs */}
            <div className="flex justify-between gap-2">
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpInputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpInput(e.target.value, i)}
                  className="w-11 h-12 text-center text-lg font-bold rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 focus:outline-none"
                />
              ))}
            </div>

            {otpError && (
              <p className="text-xs text-red-600 font-semibold text-center">{otpError}</p>
            )}

            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-500">Didn't receive email?</span>
              <button
                type="button"
                onClick={triggerOtpProcess}
                disabled={resendCooldown > 0 || sendingOtp}
                className="font-bold text-[#173C94] hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend Code"}
              </button>
            </div>

            <Button
              onClick={handleVerifyAndRegister}
              disabled={verifyingOtp}
              className="w-full h-12 bg-[#173C94] hover:bg-[#102B6A] text-white font-semibold rounded-xl"
            >
              {verifyingOtp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                "Confirm & Submit"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setOtpModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Cancel Registration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">Terms and Conditions</h3>
              <button onClick={() => setTermsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto text-xs text-slate-600 space-y-3 pr-2">
              <p>
                <strong>1. Acceptance of Terms:</strong> By registering with InstaAid, you consent to real-time telemetry tracking and accident detection services.
              </p>
              <p>
                <strong>2. Vehicle Verification:</strong> Submitted Official Receipts (OR) and Certificates of Registration (CR) must be authentic. Accounts remain pending until reviewed by administrators.
              </p>
              <p>
                <strong>3. Emergency Dispatches:</strong> When a crash is confirmed manually or automatically, your GPS location and contact details will be shared with emergency dispatchers (PNP, BFP, CVMC).
              </p>
            </div>

            <Button onClick={() => setTermsModalOpen(false)} className="w-full bg-[#173C94] text-white rounded-xl">
              I Understand
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
