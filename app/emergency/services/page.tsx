"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Phone, Mail, AlertTriangle, User, Settings, MessageCircle } from "lucide-react"
import { initializeApp } from "firebase/app"
import { getDatabase, ref, push, onValue } from "firebase/database"



// ✅ Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAxMScPcc4pR_0cFwiQ_xqPHBVieuzq-HY",
  authDomain: "accident-detection-4db90.firebaseapp.com",
  databaseURL: "https://accident-detection-4db90-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "accident-detection-4db90",
  storageBucket: "accident-detection-4db90.firebasestorage.app",
  messagingSenderId: "241082823017",
  appId: "1:241082823017:web:54fb429894447691114df8",
  measurementId: "G-TED67F7VHD",
}

// ✅ Init Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

interface EmergencyService {
  id: string
  category: string
  name: string
  contact: string
  description: string
}

interface ChatMessage {
  id: string
  text: string
  sender: "user" | "admin"
  timestamp: number
}

export default function EmergencyServicesPage() {
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")

/*Settings states */

  const [isOpen, setIsOpen] = useState(false);

  const [settings, setSettings] = useState({
    accidentAlert: true,
    emergencyCall: true,
    gpsTracking: false,
    pushNotifications: true,
  });

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  


  // ✅ Load messages in real-time
  useEffect(() => {
    const messagesRef = ref(db, "emergencyChats")
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const loaded = Object.entries(data).map(([id, msg]: any) => ({
          id,
          ...msg,
        }))
        setMessages(loaded)

        // ✅ Auto-scroll to latest message
        const chatBox = document.getElementById("chatMessages")
        if (chatBox) {
          setTimeout(() => {
            chatBox.scrollTop = chatBox.scrollHeight
          }, 100)
        }
      }
    })
  }, [])

  // ✅ Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const newMessage = {
      text: input,
      sender: "user",
      timestamp: Date.now(),
    }

    await push(ref(db, "emergencyChats"), newMessage)
    setInput("")
  }

  // ✅ Emergency services data
  const services: EmergencyService[] = [
    {
      id: "1",
      category: "PNP Hot-line",
      name: "PLTCOL Darwin John B. Urani",
      contact: "0905 800 5118 / 09066229924",
      description: "Tuguegarao Component City Police Station, Cagayan Police Provincial Office",
    },
    {
      id: "2",
      category: "BFP",
      name: "Fire Director Jesus Piedad Fernandez",
      contact: "09178113474",
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
    window.location.href = `tel:${contact}`
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
            <h1 className="text-white text-base font-semibold">InstaAid Emergency Response</h1>
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

      {/* Floating Chat Button */}
      <div className="fixed bottom-40  right-10 z-50">
        <Button
          onClick={() => setShowChat(true)}
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-14 h-14 flex items-center justify-center"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      </div>

      {/* ✅ Chat Popup (Updated Messenger-style) */}
      {showChat && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 ">
         <div className="bg-white w-[80%] max-w-md h-[60%] rounded-t-xl rounded-b-xl shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">

            
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-[#182F66] text-white rounded-t-2xl ">
              <div className="flex items-center space-x-2">
                <Image
                  src="/images/Logo1.png"
                  alt="Admin"
                  width={36}
                  height={36}
                  className="rounded-full border border-white"
                />
                <div>
                  <h3 className="font-semibold text-base leading-tight">Emergency Support</h3>
                  <p className="text-xs text-blue-100">Online now</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                className="text-white hover:text-gray-200 text-xl"
              >
                ✖
              </button>
            </div>

            {/* Messages */}
            <div
              id="chatMessages"
              className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-20">
                  No messages yet. Start a conversation.
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender !== "user" && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-700" />
                      </div>
                    )}
                    <div
                      className={`p-3 max-w-[70%] rounded-2xl text-sm shadow-sm ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="block text-[10px] mt-1 opacity-70 text-right">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 border-t bg-white flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2">
                Send
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300">
        <div className="flex">
          <Link href="/dashboard" className="flex-1 py-3 px-4 text-center text-gray-600">
            <Home className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Home</span>
          </Link>

          <div className="flex-1 py-3 px-4 text-center text-blue-600">
            <Mail className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Message</span>
          </div>

          <Link href="/dashboard/profile" className="flex-1 py-3 px-4 text-center text-gray-600">
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
