"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Home,
  Phone,
  AlertTriangle,
  User,
  Settings,
  ChevronDown,
  Mail,
  MapPin,
  Monitor,
  GraduationCap,
  LogOut,
  Loader2,
  Edit,
  Save,
  X,
} from "lucide-react"

export default function UserProfilePage() {
  const [profileExpanded, setProfileExpanded] = useState(false)
  const [messageExpanded, setMessageExpanded] = useState(false)
  const [locationExpanded, setLocationExpanded] = useState(false)
  const { user, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)

  const [userData, setUserData] = useState({
    name: user?.displayName || "User",
    phone: "09675423345",
    email: user?.email || "",
    activeThisMonth: 0,
    status: "Active",
    location: "Berlin, Germany",
    emergencyContact: "Jane Stanley - 09675423346",
  })

  const [editedData, setEditedData] = useState({
    name: userData.name,
    phone: userData.phone,
    email: userData.email,
    emergencyContact: userData.emergencyContact,
    location: userData.location,
  })

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

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData({
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      emergencyContact: userData.emergencyContact,
      location: userData.location,
    })
  }

  const handleSave = () => {
    console.log("Saving profile data:", editedData)

    // Update the userData state with the edited values
    setUserData((prevData) => ({
      ...prevData,
      name: editedData.name,
      phone: editedData.phone,
      email: editedData.email,
      emergencyContact: editedData.emergencyContact,
      location: editedData.location,
    }))

    setIsEditing(false)

    // TODO: In a real app, you would also save to Firebase/backend here
    // Example: await updateUserProfile(user.uid, editedData)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData({
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      emergencyContact: userData.emergencyContact,
      location: userData.location,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">

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
          <div className="flex items-center justify-between mb-6  ">
            <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
            {!isEditing ? (
              <Button onClick={handleEdit}  size="sm" className=" hover:bg-gray-50  bg-white rounded-lg shadow-sm overflow-hidden">
                <Edit className="w-4 h-4 mr-2  hover:bg-gray-50 " />
                Edit
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleSave} size="sm" className="bg-[#eeeee4] hover:bg-[#76b5c5] ">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} size="sm" className="bg-[#eeeee4] hover:bg-[#76b5c5] ">
                  <X className="w-4 h-4 mr-2 " />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* User Profile Card */}
          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-yellow-400 rounded-full p-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{isEditing ? editedData.name : userData.name}</h3>
                <p className="text-gray-600">{isEditing ? editedData.phone : userData.phone}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{userData.activeThisMonth}</div>
                <div className="text-sm text-gray-600">Active</div>
                <div className="text-xs text-gray-500">This Month</div>
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center justify-between bg-white rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex items-center space-x-2">
              <Monitor className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700">Status</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-600 font-medium">{userData.status}</span>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="space-y-3">
            {/* Profile Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setProfileExpanded(!profileExpanded)}
                className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700 font-medium">Profile</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${profileExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {profileExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <Input
                        value={isEditing ? editedData.name : userData.name}
                        onChange={(e) => isEditing && setEditedData({ ...editedData, name: e.target.value })}
                        className={isEditing ? "bg-white" : "bg-gray-50"}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <Input
                        value={isEditing ? editedData.phone : userData.phone}
                        onChange={(e) => isEditing && setEditedData({ ...editedData, phone: e.target.value })}
                        className={isEditing ? "bg-white" : "bg-gray-50"}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <Input
                        value={isEditing ? editedData.email : userData.email}
                        onChange={(e) => isEditing && setEditedData({ ...editedData, email: e.target.value })}
                        className={isEditing ? "bg-white" : "bg-gray-50"}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                      <Input
                        value={isEditing ? editedData.emergencyContact : userData.emergencyContact}
                        onChange={(e) =>
                          isEditing && setEditedData({ ...editedData, emergencyContact: e.target.value })
                        }
                        className={isEditing ? "bg-white" : "bg-gray-50"}
                        readOnly={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setMessageExpanded(!messageExpanded)}
                className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700 font-medium">Message</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${messageExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {messageExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4">
                    <div className="text-center py-8 text-gray-500">
                      <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No messages</p>
                      <p className="text-sm">Emergency notifications will appear here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Location Section */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setLocationExpanded(!locationExpanded)}
                className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <span className="text-gray-700 font-medium">Location</span>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${locationExpanded ? "rotate-180" : ""}`}
                />
              </button>

              {locationExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                      <Input
                        value={isEditing ? editedData.location : userData.location}
                        onChange={(e) => isEditing && setEditedData({ ...editedData, location: e.target.value })}
                        className={isEditing ? "bg-white" : "bg-gray-50"}
                        readOnly={!isEditing}
                      />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">GPS Status</span>
                        <span className="text-green-600 font-medium text-sm">Good</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Location Sharing</span>
                        <span className="text-blue-600 font-medium text-sm">Enabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
         <div className="mt-8 flex flex-col items-center space-y-5">
              <Link href="/emergency/sos">
                <Button className="w-[250px] bg-blue-600 hover:bg-[#173C94] text-white py-3 rounded-2xl flex items-center justify-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Emergency SOS</span>
                </Button>
              </Link>

             
              <Button
                onClick={handleSignOut}
                
                className="w-[250px] py-3 rounded-2xl bg-[#b9baba] border-red-300 text-white-600 hover:bg-[#00D23E] "
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

          <div className="flex-1 py-3 px-4 text-center text-blue-600">
            <User className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Profile</span>
          </div>
        </div>
      </div>
    </div>
  )
}
