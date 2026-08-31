"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PhoneCall, AlertTriangle, FileText, User } from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  isCenter?: boolean
}

const navItems: NavItem[] = [
  {
    label: "Map",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Services",
    href: "/emergency/services",
    icon: PhoneCall,
  },
  {
    label: "SOS",
    href: "/emergency/sos",
    icon: AlertTriangle,
    isCenter: true,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: FileText,
  },
  {
    label: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
]

export function DriverNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-4 flex flex-col items-center group focus:outline-none"
                aria-label="Emergency SOS"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105 active:scale-95 ${
                    isActive
                      ? "bg-red-600 text-white ring-4 ring-red-200 animate-pulse"
                      : "bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-red-500/30"
                  }`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <span
                  className={`text-[11px] font-bold mt-1 ${
                    isActive ? "text-red-600" : "text-slate-600"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
                isActive
                  ? "text-[#173C94] font-semibold"
                  : "text-slate-500 hover:text-[#173C94]"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : ""}`} />
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#173C94] rounded-full" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default DriverNav
