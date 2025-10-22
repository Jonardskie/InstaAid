"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Home, AlertTriangle, User, MapPin, Mail, XCircle, CheckCircle, Navigation, Hospital } from "lucide-react"
import Link from "next/link"
import { rtdb } from "@/lib/firebase"
import { ref, onValue, set, type Unsubscribe } from "firebase/database"
import dynamic from "next/dynamic"
import type { Map as LeafletMap } from "leaflet"

// Dynamically import the Map component with no SSR
const MapComponent = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p>Loading map...</p>
    </div>
  ),
})

type MapRef = LeafletMap | null

// Define a type for our POIs
type Poi = {
  lat: number
  lon: number
  name: string
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  // Device states
  const [status, setStatus] = useState("Loading...")
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 })
  const [battery, setBattery] = useState("Unknown")
  const [lastSeen, setLastSeen] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [lastPosition, setLastPosition] = useState<{ latitude: number; longitude: number; timestamp: number } | null>(
    null
  )

  // Accident states
  const [accidentAlert, setAccidentAlert] = useState(false)
  const [rescueDispatched, setRescueDispatched] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [triggerCooldown, setTriggerCooldown] = useState(false)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)
  const [currentAccidentId, setCurrentAccidentId] = useState<string | null>(null)

  // Location
  const [location, setLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    text: "Fetching location...",
    status: "locating",
  })

  // --- NEW STATES FOR INTERACTIVE MAP ---
  const [pois, setPois] = useState<Poi[]>([])
  const [destination, setDestination] = useState<[number, number] | null>(null)
  const [isFetchingPois, setIsFetchingPois] = useState(false)
  // --- END NEW STATES ---

  const mapRef = useRef<MapRef>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => setMounted(true), [])

  // Firebase listeners
  useEffect(() => {
    if (!mounted) return
    const unsubscribers: Unsubscribe[] = []

    unsubscribers.push(onValue(ref(rtdb, "device/status"), (snap) => setStatus(snap.val() || "No data")))
    ;(["x", "y", "z"] as const).forEach((axis) => {
      unsubscribers.push(
        onValue(ref(rtdb, `device/accel/${axis}`), (snap) =>
          setAccel((prev) => ({ ...prev, [axis]: snap.val() || 0 })),
        ),
      )
    })
    unsubscribers.push(
      onValue(ref(rtdb, "device/battery"), (snap) => setBattery(snap.val() !== null ? `${snap.val()}%` : "Unknown")),
    )
    unsubscribers.push(onValue(ref(rtdb, "device/lastSeen"), (snap) => setLastSeen(snap.val() || 0)))
    unsubscribers.push(
      onValue(ref(rtdb, "triggered"), (snap) => {
        const val = snap.val()
        if (val === true && !triggerCooldown) startAccidentCountdown()
      }),
    )

    return () => {
      unsubscribers.forEach((u) => u())
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (cooldownRef.current) clearTimeout(cooldownRef.current)
      stopSound()
    }
  }, [mounted, triggerCooldown])

  // --- NEW FUNCTION TO FETCH POIS ---
  const fetchNearbyPois = async (lat: number, lon: number) => {
    if (isFetchingPois) return
    setIsFetchingPois(true)
    console.log("Fetching nearby hospitals...")
    // Overpass query to find hospitals within a 5km radius
    const radius = 5000
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        way["amenity"="hospital"](around:${radius},${lat},${lon});
        relation["amenity"="hospital"](around:${radius},${lat},${lon});
      );
      out center;
    `
    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      })
      const data = await response.json()
      const formattedPois = data.elements.map((el: any) => ({
        lat: el.lat || el.center.lat,
        lon: el.lon || el.center.lon,
        name: el.tags?.name || "Hospital",
      }))
      setPois(formattedPois)
      console.log(`Found ${formattedPois.length} hospitals.`)
    } catch (error) {
      console.error("Error fetching POIs:", error)
    } finally {
      setIsFetchingPois(false)
    }
  }

  // Geolocation
  useEffect(() => {
    if (!mounted || !("geolocation" in navigator)) {
      setLocation((s) => ({ ...s, status: "unsupported", text: "Geolocation not supported." }))
      return
    }

    const success = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, timestamp } = pos.coords
      setLocation({ latitude: lat, longitude: lng, text: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, status: "available" })

      if (lastPosition) {
        const R = 6371
        const dLat = ((lat - lastPosition.latitude) * Math.PI) / 180
        const dLng = ((lng - lastPosition.longitude) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lastPosition.latitude * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c
        const timeDiff = (timestamp - lastPosition.timestamp) / 1000 / 3600
        const speedKmH = Number.parseFloat((timeDiff > 0 ? distance / timeDiff : 0).toFixed(2))
        setSpeed(speedKmH)
        set(ref(rtdb, "device/speed"), speedKmH)
      }

      setLastPosition({ latitude: lat, longitude: lng, timestamp })
      set(ref(rtdb, "device/location"), { latitude: lat, longitude: lng, timestamp: Date.now() })

      // --- FETCH POIS ONCE WE HAVE A LOCATION (and haven't fetched yet) ---
      if (pois.length === 0 && !isFetchingPois) {
        fetchNearbyPois(lat, lng)
      }
    }

    const error = (err: GeolocationPositionError) =>
      setLocation((s) => ({
        ...s,
        status: "error",
        text: err.code === 1 ? "Location permission denied" : "Unable to retrieve location",
      }))

    const watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 5000,
    })
    watchIdRef.current = typeof watchId === "number" ? watchId : null

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [lastPosition, mounted, pois.length, isFetchingPois]) // Added dependencies

  if (!mounted)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-200">
        <div className="text-gray-600">Loading...</div>
      </div>
    )

  const now = Math.floor(Date.now() / 1000)
  const deviceOnline = now - lastSeen < 10

  // Accident handlers
  const startAccidentCountdown = () => {
    const id = `device-${Math.floor(Date.now() / 1000)}`
    setCurrentAccidentId(id)
    setAccidentAlert(true)
    setCountdown(30)
    playSound()

    if (countdownRef.current) clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!)
          confirmAccident()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const cancelAccident = async () => {
    setAccidentAlert(false)
    stopSound()
    if (countdownRef.current) clearInterval(countdownRef.current)
    try {
      if (currentAccidentId) await set(ref(rtdb, `accidents/${currentAccidentId}`), null)
    } catch (e) {
      console.error(e)
    }
    await set(ref(rtdb, "triggered"), false)
    setCurrentAccidentId(null)
    setTriggerCooldown(true)
    cooldownRef.current = setTimeout(() => setTriggerCooldown(false), 5000)
  }

  const confirmAccident = async () => {
    setAccidentAlert(false)
    stopSound()
    await set(ref(rtdb, "triggered"), false)
    if (location.latitude && location.longitude && currentAccidentId) {
      await set(ref(rtdb, `accidents/${currentAccidentId}`), {
        deviceId: "device",
        userId: "device",
        timestamp: Math.floor(Date.now() / 1000),
        coordinates: `${location.latitude},${location.longitude}`,
        status: "pending",
        adminStatus: "pending",
        confirmed: true,
      })
      await set(ref(rtdb, "device/rescueRequest"), {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: Date.now(),
      })
    }
    setCurrentAccidentId(null)
    setRescueDispatched(true)
  }

  const playSound = () => audioRef.current?.play().catch(() => {})
  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  const userLatLon: [number, number] | undefined =
    location.latitude && location.longitude ? [location.latitude, location.longitude] : undefined

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200">
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-[375px] h-[812px] overflow-hidden border-[10px] border-gray-800">
        {/* --- Modals --- */}
        {accidentAlert && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 animate-pulse mx-auto mb-2" />
              <h2 className="text-xl font-semibold text-red-600">Accident Detected</h2>
              <p className="text-gray-600 text-sm">
                Auto confirm in <span className="font-bold text-red-600 text-lg">{countdown}s</span>
              </p>
              <p className="text-gray-600 text-sm mt-2">Location: {location.text}</p>
              <div className="flex gap-3 mt-4 w-full">
                <Button onClick={cancelAccident} className="bg-gray-200 text-black flex-1 hover:bg-gray-300">
                  <XCircle className="w-5 h-5" /> Cancel
                </Button>
                <Button onClick={confirmAccident} className="bg-red-600 text-white flex-1 hover:bg-red-700">
                  <CheckCircle className="w-5 h-5" /> Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {rescueDispatched && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 animate-pulse mx-auto mb-2" />
              <h2 className="text-xl font-semibold text-green-600">Help is on the Way!</h2>
              <p className="text-gray-600 text-sm mt-2">Emergency services have been notified.</p>
              <p className="text-gray-600 text-sm mt-1">Location: {location.text}</p>
              <Button onClick={() => setRescueDispatched(false)} className="mt-4 w-full bg-blue-600 text-white">
                Close
              </Button>
            </div>
          </div>
        )}

        <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" loop preload="auto" />

        {/* --- NEW MAP-FIRST LAYOUT --- */}

        {/* --- Map Container (Full Screen) --- */}
        <div className="absolute inset-0 z-10">
          <MapComponent
            center={userLatLon || [14.5995, 120.9842]} // Default to Manila if no location
            zoom={15}
            userPosition={userLatLon}
            pois={pois}
            destination={destination}
            onPoiClick={(lat, lon) => {
              setDestination([lat, lon])
              // Fly to the destination
              mapRef.current?.flyTo([lat, lon], 16)
            }}
            onMapInstance={(map) => {
              mapRef.current = map
            }}
          />
        </div>

        {/* --- Header (Floating) --- */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center space-x-3 mt-4">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <Image src="/images/Logo1.png" alt="Logo" width={50} height={50} className="rounded-full" />
            </div>
            <h1 className="text-white text-base font-semibold drop-shadow-md">InstaAid Response</h1>
          </div>
        </div>

        {/* --- Map Controls (Floating) --- */}
        <div className="absolute top-32 right-3 flex flex-col gap-2 z-20">
          <button
            onClick={() => {
              if (userLatLon) {
                mapRef.current?.flyTo(userLatLon, 16) // Use flyTo for a smooth animation
                setDestination(null) // Clear destination on re-center
              }
            }}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100"
          >
            <Navigation className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => {
              if (userLatLon) fetchNearbyPois(userLatLon[0], userLatLon[1])
            }}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100"
          >
            <Hospital className="w-5 h-5 text-red-600" />
          </button>
        </div>

        {/* --- System Status (Floating Bottom Sheet) --- */}
        <div className="absolute bottom-24 left-4 right-4 z-20">
          <div className="bg-white rounded-xl p-4 shadow-xl">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
              <span className={`flex items-center text-xs font-medium ${deviceOnline ? "text-green-600" : "text-red-600"}`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 ${deviceOnline ? "bg-green-500" : "bg-red-500"}`}></span>
                {deviceOnline ? "Online" : "Offline"}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-sm text-gray-500">Battery</p>
                <p className="font-medium text-gray-800">{battery}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Speed</p>
                <p className="font-medium text-blue-600">{speed.toFixed(1)} km/h</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className={`font-medium text-sm ${location.status === 'available' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {location.status === 'available' ? 'Locked' : 'Pending...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Nav (Stays at bottom) */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#182F66] border-t border-gray-300 z-40">
          <div className="flex">
            <Link href="/dashboard" className="flex-1 py-3 text-center text-blue-400">
              <Home className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/emergency/services" className="flex-1 py-3 text-center text-white">
              <Mail className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs">Message</span>
            </Link>
            <Link href="/dashboard/profile" className="flex-1 py-3 text-center text-white">
              <User className="w-6 h-6 mx-auto mb-1" />
              <span className="text-xs">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}