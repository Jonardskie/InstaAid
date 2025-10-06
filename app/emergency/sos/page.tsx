"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Phone, Mail, User, Settings, MapPin, ChevronDown } from "lucide-react"

export default function EmergencySOSPage() {
  const [isPressed, setIsPressed] = useState(false)
  const [pressTimer, setPressTimer] = useState(0)
  const [networkStatusOpen, setNetworkStatusOpen] = useState(false)
  const [sosActivated, setSosActivated] = useState(false)



  /*Settings states */

  const [isOpen, setIsOpen] = useState(false);

  const [settings, setSettings] = useState({
    accidentAlert: true,
    emergencyCall: true,
    gpsTracking: true,
    pushNotifications: true,
  });


  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPressed && !sosActivated) {
      interval = setInterval(() => {
        setPressTimer((prev) => {
          if (prev >= 3) {
            setSosActivated(true)
            setIsPressed(false)
            // Trigger emergency alert
            handleEmergencyAlert()
            return 0
          }
          return prev + 0.1
        })
      }, 100)
    } else {
      setPressTimer(0)
    }

    return () => clearInterval(interval)
  }, [isPressed, sosActivated])

  const handleEmergencyAlert = () => {
    // TODO: Implement actual emergency alert logic
    console.log("Emergency alert activated!")
    alert("Emergency alert sent! Emergency services have been notified.")
  }

  const handleCall911 = () => {
    // TODO: Implement actual phone call
    console.log("Calling 911...")
    window.location.href = "tel:911"
  }

  const handleShareLocation = () => {
    // TODO: Implement location sharing
    console.log("Sharing location...")
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        console.log(`Location: ${latitude}, ${longitude}`)
        alert(`Location shared: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
      })
    }
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


               {/* Settings Button */}
                           <div className="relative">
                                 {/* Your dashboard content */}
               
                                 {/* Settings Button */}
                                 <button
                                   onClick={() => setIsOpen(true)}
                                   className="flex-1 py-3 px-4 text-center text-white"
                                 >
                                   <Settings className="w-6 h-6 mx-auto mb-1" />
                                   <span className="text-xs"></span>
                                 </button>
               
                                 {/* Pop-up Modal */}
                                 {isOpen && (
                                   <div className="absolute top-10 right-10 w-64 bg-none p-4 rounded shadow z-50">
                                     <div className="bg-white rounded-xl p-6 w-70 shadow-lg relative">
                                       <h2 className="text-xl font-bold mb-4 text-gray-500">System Settings</h2>
               
                                       <div className="space-y-3">
                                         <div className="flex justify-between items-center text-gray-500">
                                           <span>Accident Alerts</span>
                                           <input
                                             type="checkbox"
                                             checked={settings.accidentAlert}
                                             onChange={() => toggleSetting("accidentAlert")}
                                             className="w-5 h-5"
                                           />
                                         </div>
               
                                         <div className="flex justify-between items-center text-gray-500">
                                           <span>Emergency Call</span>
                                           <input
                                             type="checkbox"
                                             checked={settings.emergencyCall}
                                             onChange={() => toggleSetting("emergencyCall")}
                                             className="w-5 h-5"
                                           />
                                         </div>
               
                                         <div className="flex justify-between items-center text-gray-500">
                                           <span>GPS Tracking</span>
                                           <input
                                             type="checkbox"
                                             checked={settings.gpsTracking}
                                             onChange={() => toggleSetting("gpsTracking")}
                                             className="w-5 h-5"
                                           />
                                         </div>
               
                                         <div className="flex justify-between items-center text-gray-500 ">
                                           <span>Push Notifications</span>
                                           <input
                                             type="checkbox"
                                             checked={settings.pushNotifications}
                                             onChange={() => toggleSetting("pushNotifications")}
                                             className="w-5 h-5 "
                                           />
                                         </div>
                                       </div>
               
                                       {/* Close Button */}
                                       <button
                                         onClick={() => setIsOpen(false)}
                                         className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 font-bold text-3xl p-1  "
                                       >
                                         &times;
                                       </button>
               
                                       {/* Save Button */}
                                       <button
                                         onClick={() => {
                                           alert("Settings saved!");
                                           setIsOpen(false);
                                         }}
                                         className="mt-5 w-full px-4 py-2 bg-[#173C94] text-white rounded-lg hover:bg-green-700"
                                       >
                                         Save Settings
                                       </button>
                                     </div>
                                   </div>
                                 )}
                               </div>



             </div>
           </div>


      {/* Main Content */}
      <div className="flex-1 pb-20 px-4 py-6">
        {/* SOS Button */}
        <div className="text-center mb-8">
          <div className="relative">
            <button
              onMouseDown={() => setIsPressed(true)}
              onMouseUp={() => setIsPressed(false)}
              onTouchStart={() => setIsPressed(true)}
              onTouchEnd={() => setIsPressed(false)}
              className={`w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-2xl transition-all duration-200 ${
                isPressed ? "bg-red-600 scale-95" : sosActivated ? "bg-green-600" : "bg-blue-600"
              }`}
            >
              {sosActivated ? "✓" : "SOS"}
            </button>

            {isPressed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border-4 border-red-500 animate-pulse"></div>
              </div>
            )}

            {isPressed && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                  {(3 - pressTimer).toFixed(1)}s
                </div>
              </div>
            )}
          </div>

          <p className="text-gray-600 text-sm">
            {sosActivated ? "Emergency alert sent!" : "Press and hold for 3 seconds to send emergency"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button
            onClick={handleCall911}
            className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg flex items-center justify-center space-x-2"
          >
            <Phone className="w-5 h-5" />
            <span>Call 911</span>
          </Button>

          <Button
            onClick={handleShareLocation}
            className="bg-red-600 hover:bg-[#00D23E] text-white py-4 rounded-lg flex items-center justify-center space-x-2"
          >
            <MapPin className="w-5 h-5" />
            <span>Share Location</span>
          </Button>
        </div>

        {/* Network Status Dropdown */}
        <div className="bg-gray-200 rounded-lg mb-4">
          <button
            onClick={() => setNetworkStatusOpen(!networkStatusOpen)}
            className="w-full px-4 py-3 flex items-center justify-between text-gray-600"
          >
            <span>Network status</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${networkStatusOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* System Status */}
        <div className="space-y-3 mb-6">
          <div className="bg-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-gray-600">GPS Status</span>
            <span className="text-green-600 font-medium">Good</span>
          </div>

          <div className="bg-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-gray-600">Network</span>
            <span className="text-green-600 font-medium">5G/20mbps</span>
          </div>

          <div className="bg-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-gray-600">Sensors</span>
            <span className="text-green-600 font-medium">Good</span>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-gray-300 rounded-lg h-48 flex items-center justify-center">
          <div className="text-center text-gray-600">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <p>Map View</p>
            <p className="text-sm">Location: Berlin, Germany</p>
          </div>
        </div>
      </div>

     {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300 z-50">
        <div className="flex">
          <Link
            href="/dashboard"
            className="flex-1 py-3 px-4 text-center text-gray-600"
          >
            <Home className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Home</span>
          </Link>

          <Link
            href="/emergency/services"
            className="flex-1 py-3 px-4 text-center text-gray-600"
          >
            <Mail className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Message</span>
          </Link>
                   {/* Accident Detection Card 
          <Link
            href="/dashboard/reports"
            className="flex-1 py-3 px-4 text-center text-gray-600"
          >
            <AlertTriangle className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Reports</span>
          </Link>
         */}
         
          <Link
            href="/dashboard/profile"
            className="flex-1 py-3 px-4 text-center text-gray-600"
          >
            <User className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Profile</span>
          </Link>
        </div>
      </div>
    </div>

    
      </div>
    </div>
  )
}
