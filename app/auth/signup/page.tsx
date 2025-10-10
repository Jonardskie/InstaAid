"use client";

import type React from "react";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { Dialog } from "@headlessui/react"; // 🧠 for OTP modal

/* ✅ Validation Helpers */
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidPhilippinePhone(phone: string) {
  return /^09\d{9}$/.test(phone);
}

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyNumber, setEmergencyNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const router = useRouter();

  // 🧩 OTP States
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [serverOtp, setServerOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // ✅ Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeToTerms) return setError("Please agree to the terms and conditions");
    if (!isValidEmail(email)) return setError("Please enter a valid email address");
    if (!isValidPhilippinePhone(phoneNumber))
      return setError("Please enter a valid 11-digit Philippine phone number (starts with 09)");
    if (!isValidPhilippinePhone(emergencyNumber))
      return setError("Please enter a valid emergency contact number");
    if (password.length < 8) return setError("Password must be at least 8 characters long");
    if (password !== confirmPassword) return setError("Passwords do not match");

    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      // ✅ 1. Create account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ 2. Update display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      });

      // ✅ 3. Save user data to Firestore
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
      });

      // ✅ 4. Send OTP email via API
      const otpResponse = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await otpResponse.json();
      if (data.success) {
        setServerOtp(data.otp);
        setOtpModalOpen(true);
      } else {
        setError("Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  // 🧠 OTP Verification
  const handleVerifyOtp = async () => {
    setVerifyingOtp(true);
    setError("");

    try {
      if (otp === serverOtp) {
        setSuccessMessage("✅ Email verified successfully!");
        setOtpModalOpen(false);

        // 🧭 Redirect to dashboard
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        setError("❌ Wrong OTP. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="relative px-6 py-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/back.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>
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
            <h1 className="text-white text-xl font-bold">Join InstaAid!</h1>
            <p className="text-blue-100 text-sm">
              Smart Detection. Swift Response. Saved Lives.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
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

            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-green-600 text-sm">{successMessage}</p>
              </div>
            )}

            {/* First + Last Name */}
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-gray-100 border-0 rounded-lg py-3"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <Input
                  type="text"
                  placeholder="e.g. Dela Cruz"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-gray-100 border-0 rounded-lg py-3"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
              <Input
                type="email"
                placeholder="e.g. juan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={11}
                placeholder="09XXXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <Input
                type="text"
                placeholder="e.g. Manila, Philippines"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Name
              </label>
              <Input
                type="text"
                placeholder="e.g. Maria Dela Cruz"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Number
              </label>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={11}
                placeholder="09XXXXXXXXX"
                value={emergencyNumber}
                onChange={(e) => setEmergencyNumber(e.target.value.replace(/\D/g, ""))}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-100 border-0 rounded-lg py-3"
              />
            </div>

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
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit */}
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

          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-blue-600 font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* 🧩 OTP Modal */}
      <Dialog
        open={otpModalOpen}
        onClose={() => !verifyingOtp && setOtpModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm bg-white rounded-lg p-6 shadow-lg space-y-4">
            <Dialog.Title className="text-lg font-semibold text-gray-800">
              Email Verification
            </Dialog.Title>
            <p className="text-sm text-gray-600">
              We’ve sent a 6-digit OTP to <strong>{email}</strong>. Enter it below to verify your email.
            </p>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              className="w-full border rounded-lg p-2 text-center text-lg tracking-widest"
              placeholder="Enter OTP"
              disabled={verifyingOtp}
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setOtpModalOpen(false)}
                disabled={verifyingOtp}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyOtp}
                disabled={verifyingOtp}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {verifyingOtp ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
