"use client"

import ProfileContent from "@/components/ProfileContent"
import { DriverNav } from "@/components/driver-nav"

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center pb-20">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col">
        <ProfileContent />
        <DriverNav />
      </div>
    </div>
  )
}
