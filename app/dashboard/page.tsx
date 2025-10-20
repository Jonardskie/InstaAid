"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Home, AlertTriangle, User, MapPin, Mail, XCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { rtdb } from "@/lib/firebase"
import { ref, onValue, set, type Unsubscribe } from "firebase/database"
import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"

function RecenterAutomatically({
  lat,
  lng,
}: {
  lat: number | null
  lng: number | null
}) {
  const map = useMap()
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], 15, { animate: true })
    }
  }, [lat, lng, map])
  return null
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)

  // --- Device & system states ---
  const [status, setStatus] = useState("Loading...")
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 })
  const [battery, setBattery] = useState("Unknown")
  const [lastSeen, setLastSeen] = useState(0)
  const [ssid, setSsid] = useState("")
  const [password, setPassword] = useState("")
  const [wifiMessage, setWifiMessage] = useState("")

  // --- Speed detection ---
  const [speed, setSpeed] = useState(0)
  const [lastPosition, setLastPosition] = useState<{
    latitude: number
    longitude: number
    timestamp: number
  } | null>(null)

  // --- Accident modal & countdown ---
  const [accidentAlert, setAccidentAlert] = useState(false)
  const [rescueDispatched, setRescueDispatched] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [triggerCooldown, setTriggerCooldown] = useState(false)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)
  const [currentAccidentId, setCurrentAccidentId] = useState<string | null>(null)

  // --- Location ---
  const [location, setLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    text: "Fetching location...",
    status: "locating",
  })

  const mapRef = useRef<L.Map | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    })
  }, [])

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
        if (val === true && !triggerCooldown) {
          startAccidentCountdown()
        }
      }),
    )

    return () => {
      unsubscribers.forEach((u) => u())
      if (countdownRef.current) clearInterval(countdownRef.current)
      if (cooldownRef.current) clearTimeout(cooldownRef.current)
      stopSound()
    }
  }, [mounted, triggerCooldown])

  // --- Geolocation + Speed Detection ---
  useEffect(() => {
    if (!mounted || !("geolocation" in navigator)) {
      if (!mounted) return
      setLocation((s) => ({
        ...s,
        status: "unsupported",
        text: "Geolocation not supported.",
      }))
      return
    }

    const success = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      const timestamp = pos.timestamp

      setLocation({
        latitude: lat,
        longitude: lng,
        text: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        status: "available",
      })

      if (lastPosition) {
        const R = 6371
        const dLat = ((lat - lastPosition.latitude) * Math.PI) / 180
        const dLng = ((lng - lastPosition.longitude) * Math.PI) / 180
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((lastPosition.latitude * Math.PI) / 180) * Math.cos((lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        const timeDiff = (timestamp - lastPosition.timestamp) / 1000 / 3600
        const newSpeed = timeDiff > 0 ? distance / timeDiff : 0
        const speedKmH = Number.parseFloat(newSpeed.toFixed(2))

        setSpeed(speedKmH)
        set(ref(rtdb, "device/speed"), speedKmH)
      }

      setLastPosition({ latitude: lat, longitude: lng, timestamp })

      set(ref(rtdb, "device/location"), {
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
      })
    }

    const error = (err: GeolocationPositionError) => {
      setLocation((s) => ({
        ...s,
        status: "error",
        text: err.code === 1 ? "Location permission denied" : "Unable to retrieve location",
      }))
    }

    const watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    })
    watchIdRef.current = typeof watchId === "number" ? watchId : null

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [lastPosition, mounted])

  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-200">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const now = Math.floor(Date.now() / 1000)
  const deviceOnline = now - lastSeen < 10

  // --- Wi-Fi ---
  const handleWifiSave = async () => {
    if (!ssid || !password) {
      setWifiMessage("Please enter both SSID and Password.")
      return
    }
    try {
      await set(ref(rtdb, "device/wifi"), { ssid, password })
      setWifiMessage("Wi-Fi credentials sent to device!")
      setSsid("")
      setPassword("")
    } catch {
      setWifiMessage("Failed to save Wi-Fi credentials.")
    }
  }

  // --- Accident modal functions ---
  const startAccidentCountdown = () => {
    const accidentId = `device-${Math.floor(Date.now() / 1000)}`
    setCurrentAccidentId(accidentId)
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
      if (currentAccidentId) {
        await set(ref(rtdb, `accidents/${currentAccidentId}`), null)
      }
    } catch (error) {
      console.error("Error deleting accident:", error)
    }

    await set(ref(rtdb, "triggered"), false)
    setCurrentAccidentId(null)

    setTriggerCooldown(true)
    if (cooldownRef.current) clearTimeout(cooldownRef.current)
    cooldownRef.current = setTimeout(() => {
      setTriggerCooldown(false)
    }, 5000)
  }

  const confirmAccident = async () => {
    setAccidentAlert(false)
    stopSound()
    await set(ref(rtdb, "triggered"), false)

    if (location.latitude && location.longitude && currentAccidentId) {
      try {
        await set(ref(rtdb, `accidents/${currentAccidentId}`), {
          deviceId: "device",
          userId: "device",
          timestamp: Math.floor(Date.now() / 1000),
          coordinates: `${location.latitude},${location.longitude}`,
          status: "pending",
          adminStatus: "pending",
          confirmed: true,
          device: {
            accel: accel,
            battery: battery,
            lastSeen: Math.floor(Date.now() / 1000),
          },
          dispatchedPersonnel: [],
        })

        await set(ref(rtdb, "device/rescueRequest"), {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error("Error confirming accident:", error)
      }
    }

    setCurrentAccidentId(null)
    setRescueDispatched(true)
  }

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {})
    }
  }

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  return (
    <div
      className={`flex justify-center items-center min-h-screen ${
        accidentAlert || rescueDispatched ? "bg-gray-800/80 backdrop-blur-sm" : "bg-gray-200"
      }`}
    >
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-[375px] h-[812px] overflow-hidden border-[10px] border-gray-800">
        {/* --- Modals --- */}
        {accidentAlert && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center animate-in zoom-in duration-200">
              <AlertTriangle className="w-12 h-12 text-red-600 animate-pulse" />
              <h2 className="text-xl font-semibold text-red-600">Accident Detected</h2>
              <p className="text-gray-600 text-sm">
                Auto confirm in <span className="font-bold text-red-600 text-lg">{countdown}s</span>
              </p>
              <p className="text-gray-600 text-sm mt-2">Location: {location.text}</p>
              <div className="flex gap-3 mt-4 w-full">
                <Button onClick={cancelAccident} className="bg-gray-200 text-black hover:bg-gray-300 flex-1">
                  <XCircle className="w-5 h-5" /> Cancel
                </Button>
                <Button onClick={confirmAccident} className="bg-red-600 hover:bg-red-700 text-white flex-1">
                  <CheckCircle className="w-5 h-5" /> Confirm
                </Button>
              </div>
            </div>
          </div>
        )}

        {rescueDispatched && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center animate-in zoom-in duration-200">
              <CheckCircle className="w-12 h-12 text-green-600 animate-pulse" />
              <h2 className="text-xl font-semibold text-green-600">Help is on the Way!</h2>
              <p className="text-gray-600 text-sm mt-2">Emergency services have been notified.</p>
              <p className="text-gray-600 text-sm mt-1">Location: {location.text}</p>
              <Button
                onClick={() => setRescueDispatched(false)}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close
              </Button>
            </div>
          </div>
        )}

        <audio ref={audioRef} src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" loop preload="auto" />

        {/* --- Dashboard --- */}
        <div className="overflow-y-auto h-full pb-24">
          {/* Header */}
          <div className="px-4 py-4 bg-[url('/images/back.jpg')] bg-cover bg-center">
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
          </div>

          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            {/* Wi-Fi Setup */}
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Wi-Fi Setup</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Wi-Fi SSID"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  className="w-full border p-2 rounded-lg focus:ring-2 text-black focus:ring-blue-400"
                />
                <input
                  type="password"
                  placeholder="Wi-Fi Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border p-2 rounded-lg focus:ring-2 text-black focus:ring-blue-400"
                />
              </div>
              <Button onClick={handleWifiSave} className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white">
                Save Wi-Fi
              </Button>
              {wifiMessage && <p className="mt-2 text-sm text-gray-700">{wifiMessage}</p>}
            </div>

            {/* System Status */}
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Device</p>
                  <p className={`mt-1 font-medium ${deviceOnline ? "text-green-600" : "text-red-600"}`}>
                    {deviceOnline ? "Online" : "Offline"}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Battery</p>
                  <p className="mt-1 font-medium text-yellow-600">{battery}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Sensors</p>
                  <p className="mt-1 font-medium text-green-600">Good</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-500">Speed</p>
                  <p className="mt-1 font-medium text-blue-600">{speed.toFixed(2)} km/h</p>
                </div>
              </div>
            </div>

            {/* Accident Detection */}
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Accident Detection</h2>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="mt-1 font-medium text-green-600">{status}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Accelerometer</p>
                  <ul className="mt-1 text-gray-700">
                    <li>X: {accel.x}</li>
                    <li>Y: {accel.y}</li>
                    <li>Z: {accel.z}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Live Location Map */}
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition relative">
              <div className="p-5 border-b">
                <h2 className="text-lg font-semibold text-gray-900">Live Location Map</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Shows your current position in real time. Location status:{" "}
                  <span
                    className={`font-medium ${
                      location.status === "available"
                        ? "text-green-600"
                        : location.status === "denied"
                          ? "text-red-600"
                          : "text-gray-600"
                    }`}
                  >
                    {location.text}
                  </span>
                </p>
              </div>

              <div className="w-full h-72 sm:h-96 md:h-[520px] overflow-hidden rounded-lg mt-4 relative mb-4">
                {location.status !== "available" && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center">
                    <div>
                      <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-500 opacity-70" />
                      <p className="text-sm text-gray-700">
                        {location.status === "locating" ? "Obtaining location..." : location.text}
                      </p>
                      {location.status === "denied" && (
                        <p className="text-xs text-gray-500 mt-1">Please allow location in your browser settings.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
                  <button
                    onClick={() => {
                      if (location.latitude && location.longitude) {
                        mapRef.current?.setView([location.latitude, location.longitude], 15, { animate: true })
                      }
                    }}
                    className="bg-white p-2 rounded-full shadow hover:bg-gray-100 "
                    title="Recenter"
                  >
                    <MapPin className="w-5 h-5 text-red-600" />
                  </button>
                  {location.latitude && location.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white p-2 rounded-full shadow hover:bg-gray-100"
                      title="Open in Maps"
                    >
                      <Home className="w-5 h-5 text-blue-600 " />
                    </a>
                  )}
                </div>

                <MapContainer
                  center={
                    location.latitude != null && location.longitude != null
                      ? [location.latitude, location.longitude]
                      : [14.5995, 120.9842]
                  }
                  zoom={15}
                  scrollWheelZoom={false}
                  tap={false}
                  style={{ height: "100%", width: "100%" }}
                  className="z-0"
                  whenCreated={(mapInstance) => (mapRef.current = mapInstance)}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterAutomatically lat={location.latitude} lng={location.longitude} />
                  {location.latitude != null && location.longitude != null && (
                    <Marker position={[location.latitude, location.longitude]}>
                      <Popup>
                        You are here <br />
                        {location.text}
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#182F66] border-t border-gray-300 z-10">
            <div className="flex">
              <Link href="/dashboard" className="flex-1 py-3 px-4 text-center text-blue-600 hover:text-blue-400">
                <Home className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">Home</span>
              </Link>
              <Link href="/emergency/services" className="flex-1 py-3 px-4 text-center text-white hover:text-blue-400">
                <Mail className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">Message</span>
              </Link>
              <Link href="/dashboard/profile" className="flex-1 py-3 px-4 text-center text-white hover:text-blue-400">
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
