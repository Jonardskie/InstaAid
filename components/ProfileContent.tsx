"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { db, rtdb } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { ref, onValue, update, get } from "firebase/database"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  User,
  ChevronDown,
  Loader2,
  Edit,
  Save,
  X,
  LogOut,
  MapPin,
  GraduationCap,
  Phone,
  Home,
  ShieldAlert,
} from "lucide-react"
import Link from "next/link"

export default function ProfileContent() {
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [locationExpanded, setLocationExpanded] = useState(false)

  const { user, logout } = useAuth()
  const router = useRouter()

  const [signingOut, setSigningOut] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  const emptyProfile = {
    name: "",
    phone: "",
    address: "",
    emergencyName: "",
    emergencyNumber: "",
  }

  const [userData, setUserData] = useState(emptyProfile)
  const [editedData, setEditedData] = useState(emptyProfile)

  const [deviceStatus, setDeviceStatus] = useState("Loading...")

  const [liveLocation, setLiveLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    text: "Fetching location...",
  })

  const [errors, setErrors] = useState({
    phone: "",
    emergencyNumber: "",
  })

  const getStatusLabel = (status: string) => {
    const s = status?.toLowerCase()

    if (s === "online" || s === "normal") return "Active"
    if (s === "offline") return "Offline"
    if (s === "loading...") return "Checking"

    return "Unknown"
  }

  const statusLabel = getStatusLabel(deviceStatus)
  const isActive = statusLabel === "Active"

  const validatePhone = (key: "phone" | "emergencyNumber", value: string) => {
    let error = ""

    if (!/^\d*$/.test(value)) {
      error = "Numbers only."
    } else if (value.length > 0 && value.length !== 11) {
      error = "Must be 11 digits."
    }

    setErrors((prev) => ({ ...prev, [key]: error }))
    return error === ""
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "users", user.uid))

        if (docSnap.exists()) {
          const data = docSnap.data()

          const formatted = {
            name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            phone: data.phoneNumber || "",
            address: data.address || "",
            emergencyName: data.emergencyName || "",
            emergencyNumber: data.emergencyNumber || "",
          }

          setUserData(formatted)
          setEditedData(formatted)
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  useEffect(() => {
    const statusRef = ref(rtdb, "device/status")

    const unsubscribe = onValue(statusRef, (snap) => {
      setDeviceStatus(snap.val() || "No data")
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLiveLocation({
        latitude: null,
        longitude: null,
        text: "Geolocation not supported",
      })
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          text: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        })
      },
      () => {
        setLiveLocation({
          latitude: null,
          longitude: null,
          text: "Location unavailable",
        })
      },
      { enableHighAccuracy: true },
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

    const handleSave = async () => {
  if (!user) return

  const phoneValid = validatePhone("phone", editedData.phone)
  const emergencyValid = validatePhone(
    "emergencyNumber",
    editedData.emergencyNumber,
  )

  if (!phoneValid || !emergencyValid) {
    alert("Please fix the phone number fields before saving.")
    return
  }

  try {
    const parts = editedData.name.trim().split(/\s+/)

    // KEEP OLD WORKING FIRESTORE SAVE
    await setDoc(
      doc(db, "users", user.uid),
      {
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
        phoneNumber: editedData.phone,
        address: editedData.address,
        emergencyName: editedData.emergencyName,
        emergencyNumber: editedData.emergencyNumber,
      },
      { merge: true },
    )

    // SYNC TO REALTIME DATABASE FOR ADMIN/ACCIDENT DATA
    try {
      const fullName = editedData.name.trim()

      await update(ref(rtdb, `users/${user.uid}`), {
        userId: user.uid,
        name: fullName,
        email: user.email || "",
        phone: editedData.phone,
        phoneNumber: editedData.phone,
        address: editedData.address,
        emergencyName: editedData.emergencyName,
        emergencyNumber: editedData.emergencyNumber,
      })

      const deviceUserSnap = await get(ref(rtdb, "device/user"))
      const deviceUser = deviceUserSnap.val()

      if (deviceUser?.userId === user.uid) {
        await update(ref(rtdb, "device/user"), {
          userId: user.uid,
          name: fullName,
          email: user.email || "",
          phone: editedData.phone,
          phoneNumber: editedData.phone,
          address: editedData.address,
          emergencyName: editedData.emergencyName,
          emergencyNumber: editedData.emergencyNumber,
        })
      }
    } catch (syncError) {
      console.warn("Profile saved, but RTDB sync failed:", syncError)
    }

    setUserData(editedData)
    setIsEditing(false)
    setErrors({ phone: "", emergencyNumber: "" })

    alert("Profile saved successfully!")
  } catch (err) {
    console.error("Error updating profile:", err)
    alert("Failed to save profile.")
  }
}

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(userData)
    setErrors({ phone: "", emergencyNumber: "" })
  }

  const handleSignOut = async () => {
    setSigningOut(true)

    try {
      await logout()
      router.push("/auth/signin")
    } catch (err) {
      console.error("Error signing out:", err)
    } finally {
      setSigningOut(false)
    }
  }

  const value = (key: keyof typeof userData) =>
    isEditing ? editedData[key] : userData[key]

  const updateField = (key: keyof typeof editedData, value: string) => {
    if (!isEditing) return
    setEditedData((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center text-[#09214a]">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="font-medium">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="rounded-[26px] bg-white/95 p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#09214a]">Profile</h2>

          <span
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
              isActive
                ? "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? "bg-green-500" : "bg-red-500"
              }`}
            />
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-[22px] bg-[#f8fafc] p-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-100">
            <GraduationCap className="h-8 w-8 text-yellow-500" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-[#09214a]">
              {userData.name || "Unnamed User"}
            </h3>
            <p className="mt-1 truncate text-xs font-medium text-slate-500">
              {userData.phone || "No Number"}
            </p>
          </div>
        </div>
      </div>

      <Section
        title="Profile Information"
        subtitle="Personal and emergency details"
        icon={<User className="h-8 w-8 text-blue-500" />}
        iconClass="bg-blue-100"
        expanded={profileExpanded}
        toggle={() => setProfileExpanded(!profileExpanded)}
      >
        <div className="space-y-4">
          <ProfileInput
            icon={<User className="h-5 w-5 text-blue-500" />}
            label="Name"
            value={value("name")}
            readOnly={!isEditing}
            onChange={(v) => updateField("name", v)}
          />

          <ProfileInput
            icon={<Home className="h-5 w-5 text-green-500" />}
            label="Address"
            value={value("address")}
            readOnly={!isEditing}
            onChange={(v) => updateField("address", v)}
          />

          <ProfileInput
            icon={<Phone className="h-5 w-5 text-green-500" />}
            label="Contact Number"
            value={value("phone")}
            readOnly={!isEditing}
            error={errors.phone}
            onChange={(v) => {
              updateField("phone", v)
              validatePhone("phone", v)
            }}
          />

          <ProfileInput
            icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
            label="Emergency Contact Name"
            value={value("emergencyName")}
            readOnly={!isEditing}
            emergency
            onChange={(v) => updateField("emergencyName", v)}
          />

          <ProfileInput
            icon={<Phone className="h-5 w-5 text-red-500" />}
            label="Emergency Contact Number"
            value={value("emergencyNumber")}
            readOnly={!isEditing}
            error={errors.emergencyNumber}
            emergency
            onChange={(v) => {
              updateField("emergencyNumber", v)
              validatePhone("emergencyNumber", v)
            }}
          />

          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="mt-2 w-full rounded-[20px] bg-blue-100 py-5 font-bold text-blue-600 hover:bg-blue-500 hover:text-white"
            >
              <Edit className="mr-2 h-5 w-5" />
              Edit Profile
            </Button>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Button
                onClick={handleSave}
                className="rounded-[20px] bg-blue-500 py-5 font-bold text-white hover:bg-blue-600"
              >
                <Save className="mr-2 h-5 w-5" />
                Save
              </Button>

              <Button
                onClick={handleCancel}
                className="rounded-[20px] bg-slate-200 py-5 font-bold text-slate-700 hover:bg-slate-300"
              >
                <X className="mr-2 h-5 w-5" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Location"
        subtitle="Live location access"
        icon={<MapPin className="h-8 w-8 text-red-500" />}
        iconClass="bg-red-100"
        expanded={locationExpanded}
        toggle={() => setLocationExpanded(!locationExpanded)}
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-500">
            Current Location
          </label>

          <Input
            value={liveLocation.text}
            readOnly
            className="h-12 rounded-2xl border-slate-200 bg-[#f8fafc] font-medium text-[#09214a]"
          />

          {liveLocation.latitude && liveLocation.longitude && (
            <Link
              href={`https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`}
              target="_blank"
              className="mt-3 inline-flex text-sm font-bold text-blue-500"
            >
              View on Google Maps
            </Link>
          )}
        </div>
      </Section>

      <Button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full rounded-[22px] bg-red-100 py-5 font-bold text-red-600 shadow-md hover:bg-red-500 hover:text-white"
      >
        {signingOut ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Signing Out...
          </>
        ) : (
          <>
            <LogOut className="mr-2 h-5 w-5" />
            Sign Out
          </>
        )}
      </Button>
    </div>
  )
}

function Section({
  title,
  subtitle,
  icon,
  iconClass,
  expanded,
  toggle,
  children,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  iconClass: string
  expanded: boolean
  toggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[26px] bg-white/95 shadow-xl">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between px-4 py-4 hover:bg-slate-50"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
          >
            {icon}
          </div>

          <div className="min-w-0 text-left">
            <p className="truncate font-bold text-[#09214a]">{title}</p>
            <p className="text-xs leading-snug text-slate-500">{subtitle}</p>
          </div>
        </div>

        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

function ProfileInput({
  icon,
  label,
  value,
  readOnly,
  onChange,
  error,
  emergency = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  readOnly: boolean
  onChange: (value: string) => void
  error?: string
  emergency?: boolean
}) {
  return (
    <div>
      <label
        className={`mb-2 flex items-center gap-2 text-sm font-medium ${
          emergency ? "text-red-600" : "text-slate-500"
        }`}
      >
        {icon}
        {label}
      </label>

      <Input
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 rounded-2xl border-slate-200 font-medium text-[#09214a] ${
          readOnly ? "bg-[#f8fafc]" : "bg-white"
        }`}
      />

      {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}