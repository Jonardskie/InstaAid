"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Phone, AlertTriangle, User, Settings } from "lucide-react"

interface EmergencyService {
  id: string
  category: string
  name: string
  contact: string
  description: string
}

export default function EmergencyServicesPage() {
  // Emergency services data
  const services: EmergencyService[] = [
    {
      id: "1",
      category: "PNP Hot-line",
      name: "PLTCOL Darwin John B. Urani",
      contact: "0905 800 5118",
      description: "Tuguegarao Component City Police Station, Cagayan Police Provincial Office",
    },
    {
      id: "2",
      category: "BFP",
      name: "Fire Director Jesus Piedad Fernandez",
      contact: "09173239365",
      description: "Bureau of Fire Protection Regional Office 2",
    },
    {
      id: "3",
      category: "CVMC",
      name: "Emergency Doctors",
      contact: "(078) 302 0000",
      description: "Cagayan Valley Medical Center",
    },
  ]

  const handleCall = (contact: string, serviceName: string) => {
    console.log(`Calling ${serviceName} at ${contact}`)
    window.location.href = `tel:${contact}`
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Emergency Services</h2>

          {/* Emergency Services List */}
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{service.category}</h3>
                    <Button
                      onClick={() => handleCall(service.contact, service.category)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Phone className="w-4 h-4 mr-1" />
                      Call
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Contact Person:</span>
                      <span className="text-sm font-medium text-gray-900">{service.name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Phone Number:</span>
                      <span className="text-sm font-medium text-blue-600">{service.contact}</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-3">{service.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 flex flex-col items-center space-y-5">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Emergency Hotlines</h3>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleCall("911", "Emergency Services")}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm py-2"
                >
                  911
                </Button>
                <Button
                  onClick={() => handleCall("117", "Police")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                >
                  117
                </Button>
                <Button
                  onClick={() => handleCall("116", "Fire Department")}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-sm py-2"
                >
                  116
                </Button>
              </div>
            </div>

            <Link href="/emergency/sos">
              <Button className="w-[250px] bg-blue-600 hover:bg-[#173C94] text-white py-3 rounded-2xl flex items-center justify-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Emergency SOS</span>
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

          <div className="flex-1 py-3 px-4 text-center text-blue-600">
            <Phone className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Hotline</span>
          </div>

          <Link href="/dashboard/reports" className="flex-1 py-3 px-4 text-center text-gray-600">
            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Reports</span>
          </Link>

          <Link href="/dashboard/profile" className="flex-1 py-3 px-4 text-center text-gray-600">
            <User className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
