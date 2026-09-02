"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, User, Clock, FileText, X, Printer } from "lucide-react"
import { format } from "date-fns"
import { useRef } from "react"
import type { FirebaseAccident } from "@/lib/types"

interface ReportDetailsModalProps {
  open: boolean
  onClose: () => void
  accident: FirebaseAccident | null
}

export function ReportDetailsModal({ open, onClose, accident }: ReportDetailsModalProps) {
  const reportRef = useRef<HTMLDivElement>(null)

  if (!accident) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-destructive text-destructive-foreground"
      case "dispatched":
        return "bg-blue-500 text-white"
      case "resolved":
        return "bg-green-500 text-white"
      case "false-alarm":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 dark:text-red-400"
      case "high":
        return "text-orange-600 dark:text-orange-400"
      case "medium":
        return "text-yellow-600 dark:text-yellow-400"
      case "low":
        return "text-green-600 dark:text-green-400"
      default:
        return "text-muted-foreground"
    }
  }

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const handlePrintOrSave = async () => {
    if (!reportRef.current) return

    try {
      setIsGeneratingPdf(true)
      
      const html2canvas = (await import("html2canvas")).default
      const jsPDF = (await import("jspdf")).default
      
      const element = reportRef.current
      
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })
      
      const imgData = canvas.toDataURL("image/jpeg", 1.0)
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      
      const imgWidth = pdfWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, "JPEG", 10, 10, imgWidth, imgHeight)
      pdf.save(`Police_Report_${accident.id.substring(0, 8)}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {accident.policeReport ? (
          <>
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Police Report
              </DialogTitle>
              <Button size="sm" variant="outline" onClick={handlePrintOrSave} disabled={isGeneratingPdf}>
                {isGeneratingPdf ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </DialogHeader>

            <div ref={reportRef} className="space-y-6">
              {/* Police Report Document Header */}
              <div className="border-b-2 pb-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold tracking-wide">POLICE REPORT</h2>
                <p className="text-sm text-muted-foreground mt-3">
                  Report Date:{" "}
                  {accident.policeReportDate
                    ? format(new Date(accident.policeReportDate), "MMMM d, yyyy")
                    : "Date not available"}
                </p>
              </div>

              {/* Incident Details Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">INCIDENT DETAILS</h3>

                {/* Status and Severity */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(accident.status)}>{accident.status.toUpperCase()}</Badge>
                  {/* <span className={`text-sm font-semibold ${getSeverityColor(accident.severity)}`}>
                    {accident.severity.toUpperCase()} SEVERITY
                  </span> */}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Incident Date</p>
                      <p className="font-medium">{format(accident.timestamp, "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Incident Time</p>
                      <p className="font-medium">{format(accident.timestamp, "h:mm a")}</p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reported By</p>
                    <p className="font-medium">{accident.user?.name || accident.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{accident.user?.phone || accident.phone || "N/A"}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Incident Location</p>
                    <p className="font-medium">{accident.location?.address || accident.coordinates || "Location Unavailable"}</p>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Detection Count</p>
                    <p className="font-medium">{accident.detectionCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Device Battery</p>
                    <p className="font-medium">{accident.battery}%</p>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Report Content - Main Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3 tracking-wide">INCIDENT STATEMENT</h3>
                  <div className="bg-muted p-8 rounded-lg whitespace-pre-wrap text-sm leading-relaxed font-serif border-l-4 border-blue-600">
                    {accident.policeReport}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Personnel Section - Signature Block */}
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">PREPARED BY</h3>
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-12 tracking-wide">
                      OFFICER / PERSONNEL
                    </p>
                    <div className="border-t-2 border-black pt-3">
                      <p className="text-sm font-semibold">{accident.policeReportPersonnel || "Officer Name"}</p>
                      <p className="text-xs text-muted-foreground mt-1">Police Officer / Emergency Personnel</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-12 tracking-wide">DATE SUBMITTED</p>
                    <div className="border-t-2 border-black pt-3">
                      <p className="text-sm font-semibold">
                        {accident.policeReportDate ? format(new Date(accident.policeReportDate), "MMM d, yyyy") : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Accident Report Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Accident Information Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Accident Information</h3>

                {/* Status and Severity */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(accident.status)}>{accident.status.toUpperCase()}</Badge>
                  {/* <span className={`text-sm font-semibold ${getSeverityColor(accident.severity)}`}>
                    {accident.severity.toUpperCase()} SEVERITY
                  </span> */}
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{format(accident.timestamp, "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{format(accident.timestamp, "h:mm a")}</p>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">User</p>
                    <p className="font-medium">{accident.user?.name || accident.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{accident.user?.phone || accident.phone || "N/A"}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{accident.location?.address || accident.coordinates || "Location Unavailable"}</p>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Detection Count</p>
                    <p className="font-medium">{accident.detectionCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Battery Level</p>
                    <p className="font-medium">{accident.battery}%</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="rounded-lg bg-muted p-4 text-center text-muted-foreground">
                <p>No police report submitted yet</p>
              </div>

              {/* Close Button */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={onClose}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
