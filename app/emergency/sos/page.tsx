"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Settings, AlertTriangle, ShieldCheck, Activity, Wifi, X } from "lucide-react"
import { auth, db, rtdb } from "@/lib/firebase"
import { ref, set } from "firebase/database"
import { doc, getDoc } from "firebase/firestore"
import { DriverNav } from "@/components/driver-nav"
import toast from "react-hot-toast"

export default function EmergencySOSPage() {
  const [isPressed, setIsPressed] = useState(false)
  const [pressTimer, setPressTimer] = useState(0)
  const [sosActivated, setSosActivated] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const [settings, setSettings] = useState({
    accidentAlert: true,
    emergencyCall: true,
    gpsTracking: true,
    pushNotifications: true,
  })

  const toggleSetting = (settingKey: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [settingKey]: !prev[settingKey],
    }))
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPressed && !sosActivated) {
      interval = setInterval(() => {
        setPressTimer((prev) => {
          if (prev >= 3) {
            setSosActivated(true)
            setIsPressed(false)
            handleEmergencyAlert()
            return 0
          }
          return prev + 0.1
        })
      }, 100)
    } else {
      setPressTimer(0)
    }

    return () => clearInterval(interval)
  }, [isPressed, sosActivated])

  const handleEmergencyAlert = async () => {
    try {
      const user = auth.currentUser
      let userData: any = {}
      if (user) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid))
          if (userSnap.exists()) {
            userData = userSnap.data()
          }
        } catch (e) {
          console.error("Failed to fetch user data for SOS:", e)
        }
      }

      const accidentId = `sos-${Date.now()}`
      const timestamp = Math.floor(Date.now() / 1000)

      const dispatchAlert = async (lat?: number | null, lon?: number | null) => {
        const coordsStr = lat && lon ? `${lat.toFixed(6)},${lon.toFixed(6)}` : "Location unavailable"
        const userName =
          userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : user?.displayName || user?.email || "SOS User"

        // 1. Write to RTDB accidents
        await set(ref(rtdb, `accidents/${accidentId}`), {
          deviceId: "sos-mobile",
          userId: user?.uid || "unknown-user",
          name: userName,
          email: userData.email || user?.email || "N/A",
          phone: userData.phoneNumber || userData.phone || "N/A",
          emergencyName: userData.emergencyName || "N/A",
          emergencyNumber: userData.emergencyNumber || "N/A",
          timestamp,
          coordinates: coordsStr,
          latitude: lat || null,
          longitude: lon || null,
          status: "pending",
          adminStatus: "pending",
          severity: "critical",
          description: "Emergency SOS triggered manually from mobile app",
          confirmed: true,
        })

        // 2. Write to RTDB admin_alerts
        await set(ref(rtdb, `admin_alerts/${accidentId}`), {
          coordinates: coordsStr,
          viewed: false,
          timestamp: Date.now(),
        })

        // 3. Write to RTDB rescueRequest
        if (lat && lon) {
          await set(ref(rtdb, "device/rescueRequest"), {
            latitude: lat,
            longitude: lon,
            timestamp: Date.now(),
          })
        }
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await dispatchAlert(pos.coords.latitude, pos.coords.longitude)
          },
          async () => {
            await dispatchAlert(null, null)
          },
          { enableHighAccuracy: true, timeout: 5000 }
        )
      } else {
        await dispatchAlert(null, null)
      }

      toast.success("Emergency SOS alert dispatched to responders!", { duration: 5000 })
    } catch (err) {
      console.error("Failed to send SOS alert:", err)
      toast.error("Failed to send alert. Call 911 immediately.")
    }
  }

  const handleCall911 = () => {
    window.location.href = "tel:911"
  }

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        toast.success(`Coordinates copied: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
      })
    }
  }

  const progressPercent = Math.min((pressTimer / 3) * 100, 100)

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col pb-24">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0F1E47] via-[#173C94] to-[#1E40AF] px-5 py-5 text-white shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20">
                <Image
                  src="/images/instaaid-logo.png"
                  alt="InstaAid Logo"
                  width={38}
                  height={38}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-wide">Emergency SOS</h1>
                <p className="text-blue-200 text-xs">Immediate Assistance Portal</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition text-white backdrop-blur-sm"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-5 pt-6 space-y-6">
          
          {/* Status Alert Banner */}
          {sosActivated ? (
            <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 text-center animate-pulse">
              <div className="inline-flex p-2 bg-red-100 rounded-full text-red-600 mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-red-700 text-base">Emergency Dispatched!</h3>
              <p className="text-xs text-red-600 mt-1">
                Your location has been transmitted to emergency responders and command center.
              </p>
              <Button
                onClick={() => setSosActivated(false)}
                variant="outline"
                size="sm"
                className="mt-3 text-xs border-red-300 text-red-600 hover:bg-red-100"
              >
                Reset SOS State
              </Button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Hold the SOS button for 3 seconds in severe crash or medical emergencies.
              </p>
            </div>
          )}

          {/* High-Impact Animated SOS Button */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative flex items-center justify-center">
              {/* Outer Pulse Rings */}
              {isPressed && (
                <div className="absolute w-64 h-64 rounded-full bg-red-500/20 animate-ping" />
              )}
              <div
                className={`w-52 h-52 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isPressed ? "scale-105 shadow-red-500/50" : "shadow-xl"
                }`}
                style={{
                  background: isPressed
                    ? "radial-gradient(circle, #dc2626 0%, #991b1b 100%)"
                    : "radial-gradient(circle, #ef4444 0%, #b91c1c 100%)",
                }}
              >
                {/* SVG Progress Ring */}
                <svg className="absolute w-56 h-56 transform -rotate-90 pointer-events-none">
                  <circle
                    cx="112"
                    cy="112"
                    r="104"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="112"
                    cy="112"
                    r="104"
                    stroke="#ffffff"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="653.45"
                    strokeDashoffset={653.45 - (653.45 * progressPercent) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-100"
                  />
                </svg>

                {/* Interactive Trigger Button */}
                <button
                  onMouseDown={() => setIsPressed(true)}
                  onMouseUp={() => setIsPressed(false)}
                  onTouchStart={() => setIsPressed(true)}
                  onTouchEnd={() => setIsPressed(false)}
                  className="w-44 h-44 rounded-full flex flex-col items-center justify-center text-white focus:outline-none select-none active:scale-95 transition-transform"
                >
                  <AlertTriangle className="w-12 h-12 mb-1 drop-shadow-md" />
                  <span className="text-3xl font-black tracking-wider drop-shadow-md">SOS</span>
                  <span className="text-[11px] font-semibold text-red-100 uppercase tracking-widest mt-1">
                    {isPressed ? `${(3 - pressTimer).toFixed(1)}s` : "Hold 3s"}
                  </span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center mt-5 font-medium">
              {isPressed ? "Keep holding to send alert..." : "Press and hold for 3 seconds to activate"}
            </p>
          </div>

          {/* Quick Response Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCall911}
              className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              <span>Call 911</span>
            </Button>

            <Button
              onClick={handleShareLocation}
              variant="outline"
              className="h-12 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-red-500" />
              <span>Share Location</span>
            </Button>
          </div>

          {/* System Health Indicators */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Device & Telemetry Status</h4>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="text-[10px] text-slate-400">GPS</span>
                <span className="text-xs font-bold text-emerald-600">Active</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <Wifi className="w-4 h-4 text-blue-500 mb-1" />
                <span className="text-[10px] text-slate-400">Network</span>
                <span className="text-xs font-bold text-blue-600">Online</span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                <Activity className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="text-[10px] text-slate-400">Sensors</span>
                <span className="text-xs font-bold text-emerald-600">Ready</span>
              </div>
            </div>
          </div>

        </div>

        {/* System Settings Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-slate-800 text-base">System Settings</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Accident Alerts</span>
                  <input
                    type="checkbox"
                    checked={settings.accidentAlert}
                    onChange={() => toggleSetting("accidentAlert")}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </div>

                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Emergency Call</span>
                  <input
                    type="checkbox"
                    checked={settings.emergencyCall}
                    onChange={() => toggleSetting("emergencyCall")}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </div>

                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">GPS Tracking</span>
                  <input
                    type="checkbox"
                    checked={settings.gpsTracking}
                    onChange={() => toggleSetting("gpsTracking")}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </div>

                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Push Notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.pushNotifications}
                    onChange={() => toggleSetting("pushNotifications")}
                    className="w-4 h-4 accent-blue-600 rounded"
                  />
                </div>
              </div>

              <Button
                onClick={() => setIsOpen(false)}
                className="w-full bg-[#173C94] text-white rounded-xl"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Unified Bottom Nav */}
        <DriverNav />
      </div>
    </div>
  )
}
