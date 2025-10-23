"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Phone, AlertTriangle, User, Settings, Users, Monitor } from "lucide-react"

interface EmergencyService {
  id: string
  category: string
  name: string
  contact: string
  description: string
}

interface AccidentReport {
  id: string
  name: string
  contact: string
  status: "severe" | "moderate" | "stable"
  timestamp: string
}

export default function CombinedEmergencyPage() {
  // Emergency services data
  const services: EmergencyService[] = [
    {
      id: "1",
      category: "PNP Hot-line",
      name: "John Dela Cruz",
      contact: "09675654561",
      description: "Philippine National Police Emergency Response",
    },
    {
      id: "2",
      category: "BFP",
      name: "Fire Fighter Personnel",
      contact: "09675654561",
      description: "Bureau of Fire Protection Emergency Services",
    },
    {
      id: "3",
      category: "CVMC",
      name: "Emergency Doctors",
      contact: "09675654561",
      description: "Cebu Velez Medical Center Emergency Department",
    },
  ]

  // Accident reports data
  const reports: AccidentReport[] = [
    {
      id: "1",
      name: "John Dela Cruz",
      contact: "09675654561",
      status: "severe",
      timestamp: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      name: "Albert Torres",
      contact: "09676894561",
      status: "moderate",
      timestamp: "2024-01-15T09:15:00Z",
    },
    {
      id: "3",
      name: "Madison Grey",
      contact: "09976894561",
      status: "stable",
      timestamp: "2024-01-15T08:45:00Z",
    },
  ]

  const handleCall = (contact: string, serviceName: string) => {
    console.log(`Calling ${serviceName} at ${contact}`)
    window.location.href = `tel:${contact}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "severe":
        return "text-red-600"
      case "moderate":
        return "text-orange-500"
      case "stable":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case "severe":
        return "bg-red-50"
      case "moderate":
        return "bg-orange-50"
      case "stable":
        return "bg-green-50"
      default:
        return "bg-gray-50"
    }
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
      <div className="flex-1 pb-20 max-w-4xl mx-auto">
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Emergency Services Section */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Emergency Services</h2>

            {/* Emergency Services List */}
            <div className="space-y-4 mb-6">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{service.category}</h3>
                      <Button
                        onClick={() => handleCall(service.contact, service.category)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                      >
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Call
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Contact Person:</span>
                        <span className="text-xs sm:text-sm font-medium text-gray-900">{service.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Phone Number:</span>
                        <span className="text-xs sm:text-sm font-medium text-blue-600">{service.contact}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Emergency Hotlines */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-2">Emergency Hotlines</h3>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Button
                  onClick={() => handleCall("911", "Emergency Services")}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm py-2"
                >
                  911
                </Button>
                <Button
                  onClick={() => handleCall("117", "Police")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm py-2"
                >
                  117
                </Button>
                <Button
                  onClick={() => handleCall("116", "Fire Department")}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm py-2"
                >
                  116
                </Button>
              </div>
            </div>
          </section>

          {/* Accident Reports Section */}
          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Reported Accidents</h2>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-100 rounded-lg p-3 sm:p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">3</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Cases</div>
                <div className="text-xs text-gray-500">This Month</div>
              </div>

              <div className="bg-gray-100 rounded-lg p-3 sm:p-4 text-center">
                <div className="flex justify-center mb-2">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">0</div>
                <div className="text-xs sm:text-sm text-gray-600">Members</div>
                <div className="text-xs text-gray-500">This Month</div>
              </div>

              <div className="bg-gray-100 rounded-lg p-3 sm:p-4 text-center">
                <div className="flex justify-center mb-2">
                  <Monitor className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">0</div>
                <div className="text-xs sm:text-sm text-gray-600">Active</div>
                <div className="text-xs text-gray-500">This Month</div>
              </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 px-3 sm:px-4 py-3 bg-gray-50 border-b text-xs sm:text-sm font-medium text-gray-600">
                <div>User</div>
                <div>Contact</div>
                <div>Status</div>
              </div>

              <div className="divide-y divide-gray-100">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`grid grid-cols-3 gap-2 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 ${getStatusBg(report.status)}`}
                  >
                    <div className="flex items-center">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{report.name}</div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-xs sm:text-sm text-gray-600 truncate">{report.contact}</div>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-xs sm:text-sm font-medium capitalize ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col items-center space-y-5">
            <Link href="/emergency/sos">
              <Button className="w-[250px] bg-blue-600 hover:bg-[#173C94] text-white py-3 rounded-2xl flex items-center justify-center space-x-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Emergency SOS</span>
              </Button>
            </Link>

           
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300">
        <div className="flex max-w-4xl mx-auto">
          <Link href="/dashboard" className="flex-1 py-2 sm:py-3 px-2 sm:px-4 text-center text-gray-600">
            <Home className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1" />
            <span className="text-xs">Home</span>
          </Link>

          <div className="flex-1 py-2 sm:py-3 px-2 sm:px-4 text-center text-blue-600">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1" />
            <span className="text-xs">Reports</span>
          </div>

          <Link href="/dashboard/profile" className="flex-1 py-2 sm:py-3 px-2 sm:px-4 text-center text-gray-600">
            <User className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
        
      </div>
    </div>
  )
}
