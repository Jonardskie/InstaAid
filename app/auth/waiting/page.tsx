"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { signOut } from "firebase/auth"
import { Clock, ShieldCheck, LogOut, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WaitingPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) {
      router.push("/auth/signin")
      return
    }

    const userRef = doc(db, "users", user.uid)

    // Listen to real-time changes
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      setChecking(false)
      
      if (!docSnap.exists()) {
        // Document deleted by admin -> rejected
        signOut(auth).then(() => {
          router.push("/auth/signin?rejected=true")
        })
        return
      }

      const status = docSnap.data()?.status
      if (status === "approved") {
        router.push("/dashboard")
      }
    }, (error) => {
      console.error("Error listening to approval status:", error)
      setChecking(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/70 text-center p-8 space-y-6">
        
        {/* Animated Clock / Review Graphic */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-75" />
          <div className="relative w-20 h-20 rounded-full bg-[#173C94] text-white flex items-center justify-center shadow-lg">
            <Clock className="w-10 h-10 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Account Under Review
          </h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Your registration and vehicle documents (OR/CR) have been submitted to the InstaAid administrative team.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2.5 text-left text-xs text-slate-600">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Registration details received</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Vehicle documents stored securely</span>
          </div>
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span>Awaiting administrator approval</span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          This window automatically redirects as soon as your account is approved.
        </p>

        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs flex items-center justify-center gap-2"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out / Return to Sign In</span>
        </Button>

      </div>
    </div>
  )
}
