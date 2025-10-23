  "use client"

  import { useState, useEffect, useRef } from "react"
  import React from 'react'
  import { Button } from "@/components/ui/button"
  import { Home, Phone, Mail, AlertTriangle, User, Settings, MessageCircle, Users, Siren, Building } from "lucide-react"
  import { initializeApp, getApps, getApp } from "firebase/app" // Import getApps and getApp
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

  // ✅ Init Firebase - More robust initialization for Next.js/HMR
  let app;
  let db;
  if (!getApps().length) {
      try {
          app = initializeApp(firebaseConfig);
          console.log("Firebase initialized successfully.");
      } catch (e) {
          console.error("Firebase initialization error:", e);
      }
  } else {
      app = getApp(); // Get existing app
      console.log("Using existing Firebase app instance.");
  }

  // Get database instance only if app was initialized successfully
  if (app) {
      try {
          db = getDatabase(app);
      } catch (e) {
          console.error("Failed to get Firebase database instance:", e);
      }
  } else {
      console.error("Firebase app not available.");
  }


  interface EmergencyService {
    id: string
    category: string
    name: string
    contact: string
    description: string
    icon: React.ElementType
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
    const chatMessagesRef = useRef<HTMLDivElement>(null);



    // ✅ Load messages in real-time
    useEffect(() => {
      if (!db) {
          console.error("Firebase database is not initialized. Cannot load messages.");
          // Maybe set an error state here
          return;
      }
      const messagesDbRef = ref(db, "emergencyChats")
      let unsubscribe: Function | null = null; // Initialize unsubscribe
      try {
          unsubscribe = onValue(messagesDbRef, (snapshot) => {
              const data = snapshot.val();
              if (data) {
                  const loaded = Object.entries(data).map(([id, msg]: [string, any]) => ({
                      id,
                      ...msg,
                  }));
                  loaded.sort((a, b) => a.timestamp - b.timestamp);
                  setMessages(loaded);
              } else {
                  setMessages([]);
              }
          }, (error) => { // Add error handling for onValue
              console.error("Error fetching messages from Firebase:", error);
              // Optionally set an error state to inform the user
          });
      } catch (error) {
          console.error("Error setting up Firebase listener:", error);
      }


      // Cleanup function
      return () => {
          if (typeof unsubscribe === 'function') {
              console.log("Unsubscribing from Firebase messages.");
              unsubscribe();
          }
      };
    }, []) // Empty dependency array

    // ✅ Auto-scroll to latest message
    useEffect(() => {
      if (chatMessagesRef.current) {
          requestAnimationFrame(() => {
              if (chatMessagesRef.current) {
                  chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
              }
          });
      }
    }, [messages]);


    // ✅ Send message
    const sendMessage = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!input.trim() || !db) {
          console.warn("Cannot send message: Input is empty or DB not initialized.");
          return;
      }

      const newMessage = {
        text: input,
        sender: "user" as "user" | "admin",
        timestamp: Date.now(),
      }

      try {
          await push(ref(db, "emergencyChats"), newMessage)
          setInput("")
      } catch (error) {
          console.error("Error sending message:", error);
      }
    }

    // ✅ Emergency services data
    const services: EmergencyService[] = [
      {
        id: "1",
        category: "PNP Hot-line",
        name: "PLTCOL Darwin John B. Urani",
        contact: "0905 800 5118 / 09171328755",
        description: "Tuguegarao Component City Police Station, Cagayan Police Provincial Office",
        icon: Users,
      },
      {
        id: "2",
        category: "BFP",
        name: "Fire Director Jesus Piedad Fernandez",
        contact: "09178113474",
        description: "Bureau of Fire Protection Regional Office 2",
        icon: Siren,
      },
      {
        id: "3",
        category: "Rescue 111",
        name: "Emergency",
        contact: "09066229924",
        description: "Tuguegarao City Rescue 111",
        icon: Building,
      },
      {
        id: "4",
        category: "Command Center",
        name: "Emergency Hotline",
        contact: "09171113500",
        description: "Tuguegarao City Command Center",
        icon: Building,
      },
    ]

    const handleCall = (contact: string, serviceName: string) => {
      console.log(`Calling ${serviceName} at ${contact}`);
      window.location.href = `tel:${contact.split('/')[0].trim()}` // Call the first number if multiple exist
    }

    // Helper to format timestamp
    const formatTimestamp = (timestamp: number | string) => {
        try {
          const date = new Date(timestamp);
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          const dateString = date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric'});
          return `${timeString}, ${dateString}`;
        } catch {
          return "Invalid date";
        }
    }

    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-200">
     

        {/* --- Adjusted Header to match mes.png --- */}
        {/* Removed flex-col, items-center. Added padding. Adjusted height slightly */}
        <div className="absolute top-0 left-0 right-0 z-10 h-[100px] bg-[url('/images/back.jpg')] bg-cover bg-center flex items-center px-4 pt-6">
            <div className="flex items-center space-x-3"> {/* Wrap logo and title */}
                <div className="bg-white rounded-full p-1.5 shadow-lg"> {/* Logo padding */}
                    <img
                        src="/images/Logo1.png" // Ensure this path is correct
                        alt="InstaAid Logo"
                        width={50} // Logo size
                        height={50}
                        className="object-contain rounded-full block"
                    />
                </div>
                <h1 className="text-white text-base font-semibold drop-shadow-md"> {/* Title */}
                    InstaAid Emergency Response
                </h1>
            </div>
            {/* Optional: Add settings button back if needed, aligned right */}
            {/* <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full w-9 h-9 ml-auto">
                <Settings className="w-5 h-5" />
            </Button> */}
        </div>

        {/* --- Scrollable Content Area --- */}
        {/* Adjusted top padding to match new header height */}
        <div className="absolute inset-0 top-[100px] bottom-[70px] overflow-y-auto scrollbar-hide bg-gray-100 px-4 pt-4 pb-6 space-y-4"> {/* Added bg-gray-100 */}

          <h2 className="text-lg font-bold text-gray-800 px-1">Emergency Services</h2>

          {/* Emergency Services List */}
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-xl shadow-md overflow-hidden p-4"> {/* Adjusted shadow and padding */}
              <div className="flex items-start justify-between mb-3 space-x-3">
                <h3 className="text-base font-semibold text-gray-800">{service.category}</h3>
                <Button
                  onClick={() => handleCall(service.contact, service.category)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 h-8 rounded-md flex-shrink-0 text-xs" // Made button smaller
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Call
                </Button>
              </div>

              {/* Use grid for better alignment */}
              <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 text-xs mb-2">
                  <span className="text-gray-500">Contact:</span>
                  <span className="font-medium text-gray-700 text-right truncate">{service.name}</span>

                  <span className="text-gray-500">Phone:</span>
                  {/* Split phone numbers onto new lines if necessary */}
                  <span className="font-medium text-blue-600 text-right">
                      {service.contact.split('/').map((num, index) => (
                          <React.Fragment key={index}>
                              {index > 0 && <br />}
                              {num.trim()}
                          </React.Fragment>
                      ))}
                  </span>
              </div>

              <p className="text-xs text-gray-500 mt-2">{service.description}</p>
            </div>
          ))}
            {/* Add some padding at the bottom */}
            <div className="h-4"></div>
        </div> {/* End Scrollable Content */}


        

        
          {/* --- Adjusted Bottom Navigation to match mes.png --- */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#182F66] z-20 h-[70px]"> {/* Dark blue background */}
            <div className="flex justify-around items-center h-full">
                <a href="/dashboard" className="flex-1 flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors duration-200"> {/* Lighter inactive color */}
                    <Home className="w-6 h-6 mb-0.5" />
                    <span className="text-xs font-medium">Home</span>
                </a>
                {/* Current Page Indicator - White text */}
                <div className="flex-1 flex flex-col items-center justify-center text-white"> {/* White active color */}
                    <Mail className="w-6 h-6 mb-0.5" />
                    <span className="text-xs font-medium">Message</span>
                </div>
                <a href="/dashboard/profile" className="flex-1 flex flex-col items-center justify-center text-gray-400 hover:text-white transition-colors duration-200"> {/* Lighter inactive color */}
                    <User className="w-6 h-6 mb-0.5" />
                    <span className="text-xs font-medium">Profile</span>
                </a>
            </div>
        </div>

      
    </div> // End Outer Container
    )
  }

