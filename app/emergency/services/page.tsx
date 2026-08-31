"use client"

import React from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone, Shield, Flame, Cross, MapPin, Search } from "lucide-react"
import { DriverNav } from "@/components/driver-nav"

interface EmergencyService {
  id: string
  category: string
  name: string
  contact: string
  description: string
  badgeColor: string
  icon: React.ElementType
}

export default function EmergencyServicesPage() {
  const services: EmergencyService[] = [
    {
      id: "1",
      category: "Philippine National Police (PNP)",
      name: "Tuguegarao City Police Station",
      contact: "0905 800 5118",
      description: "Law enforcement, incident reporting, and immediate road security response.",
      badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
      icon: Shield,
    },
    {
      id: "2",
      category: "Bureau of Fire Protection (BFP)",
      name: "Tuguegarao Fire Station",
      contact: "0917 811 3474",
      description: "Fire rescue, vehicular extrication, and hazard containment operations.",
      badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
      icon: Flame,
    },
    {
      id: "3",
      category: "Emergency Medical Services (CVMC)",
      name: "Cagayan Valley Medical Center",
      contact: "(078) 302-0000",
      description: "Level 3 tertiary hospital emergency trauma center and ambulance dispatch.",
      badgeColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: Cross,
    },
    {
      id: "4",
      category: "National Emergency Hotline",
      name: "Emergency 911 Dispatch",
      contact: "911",
      description: "Centralized 24/7 public safety answering point for multi-agency response.",
      badgeColor: "bg-red-100 text-red-700 border-red-200",
      icon: Phone,
    },
  ]

  const handleCall = (contact: string) => {
    const cleaned = contact.replace(/[^\d+]/g, "")
    window.location.href = `tel:${cleaned}`
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col pb-24">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F1E47] via-[#173C94] to-[#1E40AF] px-5 py-5 text-white shadow-md">
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
              <h1 className="font-bold text-base tracking-wide">Emergency Directory</h1>
              <p className="text-blue-200 text-xs">Direct Responders & Hotlines</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 pt-5 space-y-4">
          
          <div className="bg-blue-50 border border-blue-200/70 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600 flex-shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-900">Direct Emergency Dial</h4>
              <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
                Tap the call button beside any emergency department to initiate a direct hotline connection.
              </p>
            </div>
          </div>

          {/* Directory Cards */}
          <div className="space-y-3.5 pt-1">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <div
                  key={service.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-200 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${service.badgeColor}`}>
                          {service.category}
                        </span>
                        <h3 className="font-bold text-slate-800 text-sm mt-1">{service.name}</h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    {service.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Hotline:</span>
                      <span className="text-sm font-bold text-slate-800 tracking-tight">{service.contact}</span>
                    </div>

                    <Button
                      onClick={() => handleCall(service.contact)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 h-9 rounded-xl shadow-sm hover:shadow-emerald-600/20 transition flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Unified Driver Nav */}
        <DriverNav />
      </div>
    </div>
  )
}
