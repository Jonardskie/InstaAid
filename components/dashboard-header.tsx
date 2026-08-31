"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { getAuth } from "firebase/auth"
import { Bell, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface DashboardHeaderProps {
  onMenuClick: () => void
  activeAccidents: number
}

export function DashboardHeader({ onMenuClick, activeAccidents }: DashboardHeaderProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      const auth = getAuth()
      await signOut(auth)
      router.push("/admin/login")
    } catch (error) {
      console.error("[v0] Error signing out:", error)
      setIsSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-[#173C94] p-2 text-white shadow-sm">
            <Image
              src="/images/instaaid-logo.png"
              alt="Logo"
              width={28}
              height={28}
              className="object-contain"
            />
          </div>

          <div>
            <h2 className="font-bold text-sm tracking-tight">InstaAid Command</h2>
            <p className="text-[11px] text-muted-foreground">Emergency Operations</p>
          </div>
        </div>

        {/* Live Emergency Badge */}
        {activeAccidents > 0 ? (
          <div className="hidden sm:flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse ml-4">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            <span>{activeAccidents} Active Incident{activeAccidents > 1 ? "s" : ""}</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 px-3 py-1 rounded-full text-xs font-medium ml-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>All Systems Normal</span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="hidden md:flex text-xs h-8"
          >
            Driver App View ↗
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Admin Console</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                Go to Driver Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="text-red-600 font-medium">
                {isSigningOut ? "Signing out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
