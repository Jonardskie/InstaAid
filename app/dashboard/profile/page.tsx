"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { db, rtdb } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { ref, onValue } from "firebase/database"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  User,
  Settings,
  ChevronDown,
  Loader2,
  Edit,
  Save,
  X,
  LogOut,
  AlertTriangle,
  Home,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"

export default function UserProfilePage() {
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [locationExpanded, setLocationExpanded] = useState(false)

  const { user, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    emergencyName: "",
    emergencyNumber: "",
  })

  const [editedData, setEditedData] = useState(userData)
  const [deviceStatus, setDeviceStatus] = useState("Loading...")

  const [liveLocation, setLiveLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    text: "Fetching location...",
  })

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      try {
        const docRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          const formatted = {
            name: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
            phone: data.phoneNumber || "",
            email: data.email || user.email || "",
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
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setLiveLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            text: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
          })
        },
        (err) => {
          console.error("Location error:", err)
          setLiveLocation({
            latitude: null,
            longitude: null,
            text: "Location unavailable",
          })
        },
        { enableHighAccuracy: true }
      )

      return () => navigator.geolocation.clearWatch(watchId)
    } else {
      setLiveLocation({
        latitude: null,
        longitude: null,
        text: "Geolocation not supported",
      })
    }
  }, [])

  const handleSave = async () => {
    if (!user) return
    try {
      const docRef = doc(db, "users", user.uid)
      await updateDoc(docRef, {
        firstName: editedData.name.split(" ")[0] || "",
        lastName: editedData.name.split(" ")[1] || "",
        phoneNumber: editedData.phone,
        email: editedData.email,
        address: editedData.address,
        emergencyName: editedData.emergencyName,
        emergencyNumber: editedData.emergencyNumber,
      })
      setUserData(editedData)
      setIsEditing(false)
    } catch (err) {
      console.error("Error updating profile:", err)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(userData)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logout()
      router.push("/auth/signin")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin w-6 h-6" />
        <span className="ml-2">Loading profile...</span>
      </div>
    )
  }

  return (

    <div className="flex justify-center items-center min-h-screen bg-gray-200">
      {/* 📱 Phone Frame */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-[375px] h-[812px]  overflow-hidden border-[10px] border-gray-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20"></div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto h-full pb-24">
      {/* Header */}
      <div className="px-4 py-4 bg-[url('/images/back.jpg')] bg-cover bg-center">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white rounded-full p-2">
              <Image
                src="/images/Logo1.png"
                alt="InstaAid Logo"
                width={60}
                height={60}
                className="object-contain rounded-full"
              />
            </div>
            <h1 className="text-white text-base font-semibold">
              InstaAid Emergency Response
            </h1>
          </div>
          <Button variant="ghost" size="sm" className="text-white">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200 mb-6">
          <h2 className="text-gray-800 font-semibold text-lg mb-3">Profile</h2>
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-inner">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-400 p-3 rounded-full">
                <GraduationCap className="text-white w-5 h-5" />
              </div>
              <div>
                <h3 className="text-gray-900 font-semibold text-lg">
                  {userData.name || "Unnamed User"}
                </h3>
                <p className="text-gray-600 text-sm">
                  {userData.phone || "No Number"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-3">
          <button
            onClick={() => setProfileExpanded(!profileExpanded)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">
                Profile Information
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                profileExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-4">
              {[["Name", "name"], ["Contact Number", "phone"], ["Email", "email"], ["Address", "address"]].map(
                ([label, key]) => (
                  <div key={key}>
                    <label className="text-sm text-gray-600">{label}</label>
                    <Input
                      value={isEditing ? editedData[key] : userData[key]}
                      onChange={(e) =>
                        isEditing && setEditedData({ ...editedData, [key]: e.target.value })
                      }
                      readOnly={!isEditing}
                    />
                  </div>
                )
              )}

              {/* ✅ Emergency Contact Info */}
              {[["Emergency Contact Name", "emergencyName"], ["Emergency Contact Number", "emergencyNumber"]].map(
                ([label, key]) => (
                  <div key={key}>
                    <label className="text-sm text-red-600 font-medium">
                      {label}
                    </label>
                    <Input
                      value={isEditing ? editedData[key] : userData[key]}
                      onChange={(e) =>
                        isEditing && setEditedData({ ...editedData, [key]: e.target.value })
                      }
                      readOnly={!isEditing}
                    />
                  </div>
                )
              )}

              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  size="sm"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSave}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    size="sm"
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Location */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-3 mt-4">
          <button
            onClick={() => setLocationExpanded(!locationExpanded)}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-red-600" />
              <span className="text-gray-700 font-medium">Location</span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                locationExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {locationExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
              <div>
                <label className="text-sm text-gray-600">Current Location</label>
                <Input value={liveLocation.text} readOnly className="bg-gray-50" />
                {liveLocation.latitude && liveLocation.longitude && (
                  <div className="mt-2">
                    <Link
                      href={`https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`}
                      target="_blank"
                      className="text-blue-600 text-sm underline"
                    >
                      View on Google Maps
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Device Status */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-gray-700 font-medium">Device Status</span>
            </div>
            <span className="text-gray-900 font-semibold">{deviceStatus}</span>
          </div>
        </div>

        {/* Sign Out */}
        <div className="mt-8 flex flex-col items-center space-y-5">
          <Button
            onClick={handleSignOut}
            className="w-[250px] py-3 rounded-2xl bg-gray-400 text-white hover:bg-red-500"
            disabled={signingOut}
          >
            {signingOut ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing Out...
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300">
        <div className="flex">
          <Link href="/dashboard" className="flex-1 py-3 px-4 text-center text-gray-600">
            <Home className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/emergency/services" className="flex-1 py-3 px-4 text-center text-gray-600">
            <Mail className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Message</span>
          </Link>
          {/* Remove*
          <Link href="/dashboard/reports" className="flex-1 py-3 px-4 text-center text-gray-600">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Reports</span>
          </Link>
          
          */}

          <div className="flex-1 py-3 px-4 text-center text-blue-600">
            <User className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Profile</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  )
}
