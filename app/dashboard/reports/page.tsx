"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Phone, AlertTriangle, User, Settings, Users, Monitor } from "lucide-react"

interface AccidentReport {
  id: string
  name: string
  contact: string
  status: "severe" | "moderate" | "stable"
  timestamp: string
}

export default function AccidentReportsPage() {
  // Mock data for demonstration
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
              <h1 className="text-white text-lg font-semibold">
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Reported Accidents</h2>

          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-600">Total Cases</div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Members</div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="flex justify-center mb-2">
                <Monitor className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-sm text-gray-600">Active</div>
              <div className="text-xs text-gray-500">This Month</div>
            </div>
          </div>

          {/* Reports Table Header */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 gap-4 px-4 py-3 bg-gray-50 border-b text-sm font-medium text-gray-600">
              <div>User</div>
              <div>Contact</div>
              <div>Status</div>
            </div>

            {/* Reports List */}
            <div className="divide-y divide-gray-100">
              {reports.map((report) => (
                <div key={report.id} className={`grid grid-cols-3 gap-4 px-4 py-4 ${getStatusBg(report.status)}`}>
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{report.name}</div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm text-gray-600">{report.contact}</div>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-sm font-medium capitalize ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State for Additional Reports */}
          {reports.length === 0 && (
            <div className="bg-white rounded-lg p-8 text-center shadow-sm">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Accident Reports</h3>
              <p className="text-gray-600">All clear! No accidents reported recently.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col items-center space-y-5">
            <Link href="/emergency/sos">
              <Button className="w-[250px] bg-blue-600 hover:bg-[#173C94] text-white py-3 rounded-2xl flex items-center justify-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Report New Emergency</span>
              </Button>
            </Link>

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

          <Link href="/emergency/services" className="flex-1 py-3 px-4 text-center text-gray-600">
            <Phone className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Hotline</span>
          </Link>

          <div className="flex-1 py-3 px-4 text-center text-blue-600">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Reports</span>
          </div>

          <Link href="/dashboard/profile" className="flex-1 py-3 px-4 text-center text-gray-600">
            <User className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
