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
} from "lucide-react"
import Link from "next/link"

export default function UserProfilePage() {
  const [profileExpanded, setProfileExpanded] = useState(false)
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

  // 🔹 Fetch user data
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

  // 🔹 Listen for device status
  useEffect(() => {
    const statusRef = ref(rtdb, "device/status")
    const unsubscribe = onValue(statusRef, (snap) => {
      setDeviceStatus(snap.val() || "No data")
    })
    return () => unsubscribe()
  }, [])

  // 🔹 Save profile
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
    <div className="min-h-screen bg-gray-50 pb-20">
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
      <div className="flex-1 pb-20">
        <div className="p-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button
              onClick={() => setProfileExpanded(!profileExpanded)}
              className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-blue-600" />
                <span className="text-gray-700 font-medium">Profile Info</span>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  profileExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                <div className="space-y-4 pt-4">
                  {/* Name */}
                  <div>
                    <label className="text-sm text-gray-600">Name</label>
                    <Input
                      value={isEditing ? editedData.name : userData.name}
                      onChange={(e) =>
                        isEditing &&
                        setEditedData({ ...editedData, name: e.target.value })
                      }
                      readOnly={!isEditing}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-sm text-gray-600">Contact Number</label>
                    <Input
                      value={isEditing ? editedData.phone : userData.phone}
                      onChange={(e) =>
                        isEditing &&
                        setEditedData({ ...editedData, phone: e.target.value })
                      }
                      readOnly={!isEditing}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm text-gray-600">Gmail</label>
                    <Input
                      value={isEditing ? editedData.email : userData.email}
                      onChange={(e) =>
                        isEditing &&
                        setEditedData({ ...editedData, email: e.target.value })
                      }
                      readOnly={!isEditing}
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="text-sm text-gray-600">Address</label>
                    <Input
                      value={isEditing ? editedData.address : userData.address}
                      onChange={(e) =>
                        isEditing &&
                        setEditedData({ ...editedData, address: e.target.value })
                      }
                      readOnly={!isEditing}
                    />
                  </div>

                  {/* Emergency Name */}
                  <div>
                    <label className="text-sm text-gray-600">Emergency Contact Name</label>
                    <Input
                      value={
                        isEditing
                          ? editedData.emergencyName
                          : userData.emergencyName
                      }
                      onChange={(e) =>
                        isEditing &&
                        setEditedData({
                          ...editedData,
                          emergencyName: e.target.value,
                        })
                      }
                      readOnly={!isEditing}
                    />
                  </div>

                  {/* Emergency Number */}
                  <div>
                    <label className="text-sm text-gray-600">Emergency Contact Number</label>
                    <Input
                      value={
                        isEditing
                          ? editedData.emergencyNumber
                          : userData.emergencyNumber
                      }
                      onChange={(e) =>
                        isEditing &&
                        setEditedData({
                          ...editedData,
                          emergencyNumber: e.target.value,
                        })
                      }
                      readOnly={!isEditing}
                    />
                  </div>

                  {/* Edit / Save / Cancel */}
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
              </div>
            )}
          </div>

          {/* Device Status */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mt-4">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-gray-700 font-medium">Device Status</span>
              </div>
              <span className="text-gray-900 font-semibold">
                {deviceStatus}
              </span>
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
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300">
        <div className="flex">
          <Link href="/dashboard" className="flex-1 py-3 px-4 text-center text-gray-600">
            <Home className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link
            href="/emergency/services"
            className="flex-1 py-3 px-4 text-center text-gray-600"
          >
            <Phone className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Hotline</span>
          </Link>
          <Link href="/dashboard/reports" className="flex-1 py-3 px-4 text-center text-gray-600">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Reports</span>
          </Link>
          <Link href="/dashboard/profile" className="flex-1 py-3 px-4 text-center text-blue-600">
            <User className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
