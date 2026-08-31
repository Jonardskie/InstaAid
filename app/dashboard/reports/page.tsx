"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { auth, rtdb } from "@/lib/firebase"
import { ref, onValue } from "firebase/database"
import { AlertTriangle, Clock, MapPin, CheckCircle2, ShieldAlert, Loader2, FileText } from "lucide-react"
import { DriverNav } from "@/components/driver-nav"
import { format } from "date-fns"

interface AccidentItem {
  id: string
  coordinates: string
  timestamp: number
  status: string
  adminStatus?: string
  severity?: string
  description?: string
  name?: string
}

export default function AccidentReportsPage() {
  const [reports, setReports] = useState<AccidentItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const accidentsRef = ref(rtdb, "accidents")
    const unsubscribe = onValue(accidentsRef, (snapshot) => {
      const data = snapshot.val() || {}
      const userUid = auth.currentUser?.uid

      const list: AccidentItem[] = Object.entries(data)
        .map(([id, val]: [string, any]) => ({
          id,
          coordinates: val.coordinates || `${val.latitude || 0}, ${val.longitude || 0}`,
          timestamp: val.timestamp ? (val.timestamp > 10000000000 ? val.timestamp : val.timestamp * 1000) : Date.now(),
          status: val.adminStatus || val.status || "pending",
          severity: val.severity || "medium",
          description: val.description || "Automatic Crash Detection Trigger",
          name: val.name || "Unknown User",
          userId: val.userId,
        }))
        // Filter for this user, or show all if in dev/demo
        .filter((item: any) => !userUid || item.userId === userUid || item.userId === "unknown-user")
        .sort((a, b) => b.timestamp - a.timestamp)

      setReports(list)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const totalReports = reports.length
  const dispatchedReports = reports.filter((r) => r.status === "dispatched").length
  const resolvedReports = reports.filter((r) => r.status === "resolved").length

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
        )
      case "dispatched":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
            <ShieldAlert className="w-3 h-3" />
            Help Dispatched
          </span>
        )
      case "false-alarm":
      case "false_alarm":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            False Alarm
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            Pending Review
          </span>
        )
    }
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
              <h1 className="font-bold text-base tracking-wide">Incident Reports</h1>
              <p className="text-blue-200 text-xs">Crash History & Dispatch Logs</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 pt-5 space-y-4">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center">
              <span className="text-[11px] text-slate-500 font-medium block">Total</span>
              <span className="text-xl font-bold text-slate-800">{totalReports}</span>
            </div>

            <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-3 text-center">
              <span className="text-[11px] text-blue-600 font-medium block">Dispatched</span>
              <span className="text-xl font-bold text-blue-700">{dispatchedReports}</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-center">
              <span className="text-[11px] text-emerald-600 font-medium block">Resolved</span>
              <span className="text-xl font-bold text-emerald-700">{resolvedReports}</span>
            </div>
          </div>

          {/* Incident List */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Dispatches</h3>

            {loading ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <p className="text-xs">Loading incident records...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center p-6 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-400" />
                <h4 className="text-sm font-bold text-slate-700">No Incident Records Found</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  When an emergency is detected or triggered, your real-time response log and status will appear here.
                </p>
              </div>
            ) : (
              reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-700">#{report.id.slice(-8)}</span>
                    {getStatusBadge(report.status)}
                  </div>

                  <p className="text-xs text-slate-600 font-medium">
                    {report.description}
                  </p>

                  <div className="space-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{format(new Date(report.timestamp), "MMM d, yyyy · h:mm a")}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span className="truncate font-mono">{report.coordinates}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unified Navigation */}
        <DriverNav />
      </div>
    </div>
  )
}
