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
  Mail,
  MapPin,
  GraduationCap,
} from "lucide-react"
import Link from "next/link"

type UserData = {
  name: string;
  phone: string;
  email: string;
  address: string;
  emergencyName: string;
  emergencyNumber: string;
};

export default function UserProfilePage() {
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [locationExpanded, setLocationExpanded] = useState(false)

  const { user, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)

  const [userData, setUserData] = useState<UserData>({
    name: "",
    phone: "",
    email: "",
    address: "",
    emergencyName: "",
    emergencyNumber: "",
  })

  const [editedData, setEditedData] = useState<UserData>(userData)
  const [deviceStatus, setDeviceStatus] = useState("Loading...")

  const [liveLocation, setLiveLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    text: "Fetching location...",
  })

  // ✅ Validation states
  const [errors, setErrors] = useState({
    phone: "",
    emergencyNumber: "",
  })

  // 📞 Phone validation
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
    if (!user) return
    const fetchData = async () => {
      try {
        const docRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          const formatted: UserData = {
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
// Line 99 - Replace the existing useEffect for geolocation with this block

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newLatitude = pos.coords.latitude;
          const newLongitude = pos.coords.longitude;
          const accuracy = pos.coords.accuracy; // We can use this to filter later

          // 💡 OPTIMIZATION 1: Check if the new reading is significantly different.
          // This prevents unnecessary state updates if the GPS reading is still on the same spot.
          // (0.00001 degree is about 1 meter)
          const isSignificantChange = 
              !liveLocation.latitude || // Always update if it's the first reading
              Math.abs(newLatitude - liveLocation.latitude) > 0.00001 || 
              Math.abs(newLongitude - liveLocation.longitude) > 0.00001;

          if (isSignificantChange) {
            setLiveLocation({
              latitude: newLatitude,
              longitude: newLongitude,
              text: `Lat: ${newLatitude.toFixed(5)}, Lon: ${newLongitude.toFixed(5)} (±${accuracy.toFixed(0)}m)`,
            });
          }
        },
        (err) => {
          console.error("Location error:", err);
          setLiveLocation((prev) => ({
            ...prev,
            text: "Location unavailable",
          }));
        },
        // 💡 OPTIMIZATION 2: Highly tuned options for maximum accuracy
        { 
            enableHighAccuracy: true, // Crucial: Requests GPS, not just Wi-Fi/Cell tower location
            timeout: 5000,           // Give it 5 seconds to get a good reading
            maximumAge: 1000,        // Accept location up to 1 second old (more accurate than 0)
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLiveLocation({
        latitude: null,
        longitude: null,
        text: "Geolocation not supported",
      });
    }
  }, [liveLocation.latitude, liveLocation.longitude]); // Dependency added to allow comparison with previous values

  // ✅ Updated handleSave with validation
  const handleSave = async () => {
    if (!user) return

    const phoneValid = validatePhone("phone", editedData.phone)
    const emergencyValid = validatePhone("emergencyNumber", editedData.emergencyNumber)

    if (!phoneValid || !emergencyValid) {
      alert("Please fix the phone number fields before saving.")
      return
    }

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
              {[["Name", "name"], ["Email", "email"], ["Address", "address"]].map(
                ([label, key]) => (
                  <div key={key}>
                    <label className="text-sm text-gray-600">{label}</label>
                    <Input
                      value={isEditing ? editedData[key as keyof UserData] : userData[key as keyof UserData]}
                      onChange={(e) =>
                        isEditing &&
                        setEditedData({ ...editedData, [key]: e.target.value })
                      }
                      readOnly={!isEditing}
                    />
                  </div>
                )
              )}

              {/* Phone number with validation */}
              <div>
                <label className="text-sm text-gray-600">Contact Number</label>
                <Input
                  value={isEditing ? editedData.phone : userData.phone}
                  onChange={(e) => {
                    if (isEditing) {
                      setEditedData({ ...editedData, phone: e.target.value })
                      validatePhone("phone", e.target.value)
                    }
                  }}
                  readOnly={!isEditing}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Emergency Contact Info */}
              <div>
                <label className="text-sm text-red-600 font-medium">
                  Emergency Contact Name
                </label>
                <Input
                  value={isEditing ? editedData.emergencyName : userData.emergencyName}
                  onChange={(e) =>
                    isEditing &&
                    setEditedData({ ...editedData, emergencyName: e.target.value })
                  }
                  readOnly={!isEditing}
                />
              </div>

              <div>
                <label className="text-sm text-red-600 font-medium">
                  Emergency Contact Number
                </label>
                <Input
                  value={isEditing ? editedData.emergencyNumber : userData.emergencyNumber}
                  onChange={(e) => {
                    if (isEditing) {
                      setEditedData({ ...editedData, emergencyNumber: e.target.value })
                      validatePhone("emergencyNumber", e.target.value)
                    }
                  }}
                  readOnly={!isEditing}
                />
                {errors.emergencyNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.emergencyNumber}</p>
                )}
              </div>

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

        {/* Sign Out */}
        <div className="mt-2 flex flex-col items-center space-y-5">
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
      <div className="absolute bottom-0 left-0 right-0 bg-[#182F66] border-t">
        <div className="flex">
          <Link
            href="/dashboard"
            className="flex-1 py-3 px-4 text-center text-white hover:text-blue-400 transition-colors duration-300"
          >
            <Home className="w-6 h-6 mx-auto mb-1 transform transition-transform duration-300 hover:scale-125 hover:-translate-y-1" />
            <span className="text-xs">Home</span>
          </Link>

          <Link
            href="/emergency/services"
            className="flex-1 py-3 px-4 text-center text-white hover:text-blue-400 transition-colors duration-300"
          >
            <Mail className="w-6 h-6 mx-auto mb-1 transform transition-transform duration-300 hover:scale-125 hover:-translate-y-1" />
            <span className="text-xs">Message</span>
          </Link>

          <Link
            href="/dashboard/profile"
            className="flex-1 py-3 px-4 text-center text-white hover:text-blue-400 transition-colors duration-300"
          >
            <User className="w-6 h-6 mx-auto mb-1 transform transition-transform duration-300 hover:scale-125 hover:-translate-y-1" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}