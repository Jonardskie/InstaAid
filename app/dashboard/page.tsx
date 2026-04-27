"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import ProfileContent from "@/components/ProfileContent"
import Image from "next/image"
import dynamic from "next/dynamic"
import type { Map as LeafletMap } from "leaflet"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  User,
  MapPin,
  XCircle,
  CheckCircle,
  Navigation,
  Hospital,
} from "lucide-react"
import { rtdb } from "@/lib/firebase"
import { ref, onValue, set, type Unsubscribe } from "firebase/database"

const MapComponent = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">Loading map...</p>
      </div>
    </div>
  ),
})

type MapRef = LeafletMap | null

type Poi = {
  lat: number
  lon: number
  name: string
}

const importantContacts = [
  {
    title: "911",
    subtitle: "Emergency",
    number: "911",
    icon: "☎",
    color: "bg-red-100 text-red-500",
  },
  {
    title: "PNP",
    subtitle: "Police",
    number: "117",
    icon: "🛡",
    color: "bg-blue-100 text-blue-500",
  },
  {
    title: "CVMC",
    subtitle: "Health",
    number: "(078)-302-0000",
    icon: "✚",
    color: "bg-green-100 text-green-500",
  },
  {
    title: "BFP",
    subtitle: "Fire",
    number: "0917-811-3474",
    icon: "🔥",
    color: "bg-orange-100 text-orange-500",
  },
]

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [contactsOpen, setContactsOpen] = useState(false)

  const [status, setStatus] = useState("Loading...")
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 })
  const [battery, setBattery] = useState("Unknown")
  const [lastSeen, setLastSeen] = useState(0)
  const [speed, setSpeed] = useState(0)

  const [lastPosition, setLastPosition] = useState<{
    latitude: number
    longitude: number
    timestamp: number
  } | null>(null)

  const [accidentAlert, setAccidentAlert] = useState(false)
  const [rescueDispatched, setRescueDispatched] = useState(false)
  const [countdown, setCountdown] = useState(30)

  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cooldownRef = useRef<NodeJS.Timeout | null>(null)

  const [triggerCooldown, setTriggerCooldown] = useState(false)
  const [currentAccidentId, setCurrentAccidentId] = useState<string | null>(null)

  const [location, setLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    text: "Fetching location...",
    status: "locating",
  })

  const [pois, setPois] = useState<Poi[]>([])
  const [destination, setDestination] = useState<[number, number] | null>(null)
  const [isFetchingPois, setIsFetchingPois] = useState(false)
  const [hasFetchedInitialPois, setHasFetchedInitialPois] = useState(false)

  const mapRef = useRef<MapRef>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => setMounted(true), [])

  const fetchNearbyPois = useCallback(
    async (lat: number, lon: number) => {
      if (isFetchingPois) return

      setIsFetchingPois(true)

      try {
        const response = await fetch(`/api/pois?lat=${lat}&lon=${lon}&radius=5000`)

        if (response.ok) {
          const data = await response.json()
          setPois(data.pois || [])
        } else {
          throw new Error("API route failed")
        }
      } catch {
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
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            name: el.tags?.name || "Hospital",
          }))

          setPois(formattedPois)
        } catch (fallbackError) {
          console.error("Error fetching POIs:", fallbackError)
        }
      } finally {
        setIsFetchingPois(false)
        setHasFetchedInitialPois(true)
      }
    },
    [isFetchingPois],
  )

  useEffect(() => {
    if (!mounted) return

    const unsubscribers: Unsubscribe[] = []

    unsubscribers.push(
      onValue(ref(rtdb, "device/status"), (snap) =>
        setStatus(snap.val() || "No data"),
      ),
    )

    ;(["x", "y", "z"] as const).forEach((axis) => {
      unsubscribers.push(
        onValue(ref(rtdb, `device/accel/${axis}`), (snap) =>
          setAccel((prev) => ({ ...prev, [axis]: snap.val() || 0 })),
        ),
      )
    })

    unsubscribers.push(
      onValue(ref(rtdb, "device/battery"), (snap) =>
        setBattery(snap.val() !== null ? `${snap.val()}%` : "Unknown"),
      ),
    )

    unsubscribers.push(
      onValue(ref(rtdb, "device/lastSeen"), (snap) =>
        setLastSeen(snap.val() || 0),
      ),
    )

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

  useEffect(() => {
    if (!mounted || !("geolocation" in navigator)) {
      setLocation((s) => ({
        ...s,
        status: "unsupported",
        text: "Geolocation not supported.",
      }))
      return
    }

    const success = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng } = pos.coords
      const timestamp = pos.timestamp ?? Date.now()

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
          Math.cos((lastPosition.latitude * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c
        const timeDiff = (timestamp - lastPosition.timestamp) / 1000 / 3600

        const speedKmH = Number.parseFloat(
          (timeDiff > 0 ? distance / timeDiff : 0).toFixed(2),
        )

        setSpeed(speedKmH)
        set(ref(rtdb, "device/speed"), speedKmH)
      }

      setLastPosition({ latitude: lat, longitude: lng, timestamp })

      set(ref(rtdb, "device/location"), {
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
      })

      if (!hasFetchedInitialPois && !isFetchingPois) {
        setTimeout(() => {
          fetchNearbyPois(lat, lng)
        }, 2000)
      }
    }

    const error = (err: GeolocationPositionError) =>
      setLocation((s) => ({
        ...s,
        status: "error",
        text:
          err.code === 1
            ? "Location permission denied"
            : "Unable to retrieve location",
      }))

    const watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000,
    })

    watchIdRef.current = typeof watchId === "number" ? watchId : null

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [
    mounted,
    lastPosition,
    hasFetchedInitialPois,
    isFetchingPois,
    fetchNearbyPois,
  ])

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
      if (currentAccidentId) {
        await set(ref(rtdb, `accidents/${currentAccidentId}`), null)
      }
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

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((e) => console.log("Audio play failed:", e))
    }
  }

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const now = Math.floor(Date.now() / 1000)
  const deviceOnline = now - lastSeen < 10

  const userLatLon: [number, number] | undefined =
    location.latitude && location.longitude
      ? [location.latitude, location.longitude]
      : undefined

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef3f8]">
      {accidentAlert && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 animate-pulse mx-auto mb-2" />
            <h2 className="text-xl font-semibold text-red-600">
              Accident Detected
            </h2>
            <p className="text-gray-600 text-sm">
              Auto confirm in{" "}
              <span className="font-bold text-red-600 text-lg">
                {countdown}s
              </span>
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Location: {location.text}
            </p>

            <div className="flex gap-3 mt-4 w-full">
              <Button
                onClick={cancelAccident}
                className="bg-green-500 text-white flex-1 hover:bg-green-600"
              >
                <XCircle className="w-5 h-5" /> I am Safe
              </Button>

              <Button
                onClick={confirmAccident}
                className="bg-red-600 text-white flex-1 hover:bg-red-700"
              >
                <CheckCircle className="w-5 h-5" /> I need Help
              </Button>
            </div>
          </div>
        </div>
      )}

      {rescueDispatched && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 animate-pulse mx-auto mb-2" />
            <h2 className="text-xl font-semibold text-green-600">
              Help is on the Way!
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              Emergency services have been notified.
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Location: {location.text}
            </p>

            <Button
              onClick={() => setRescueDispatched(false)}
              className="mt-4 w-full bg-blue-600 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
        loop
        preload="auto"
      />

      <div className="absolute inset-0 z-0">
        <MapComponent
          center={userLatLon || [14.5995, 120.9842]}
          zoom={15}
          userPosition={userLatLon}
          pois={pois}
          destination={destination}
          onPoiClick={(lat: number, lon: number) => {
            setDestination([lat, lon])
            mapRef.current?.flyTo([lat, lon], 16)
          }}
          onMapInstance={(map: LeafletMap) => {
            mapRef.current = map
          }}
        />
      </div>

      <div className="absolute inset-0 z-10 bg-white/25 pointer-events-none" />

      <div className="absolute top-4 left-3 right-3 z-20 sm:top-8 sm:left-4 sm:right-4">
        <div className="flex items-center justify-between rounded-[22px] bg-white/95 px-3 py-2 shadow-xl sm:rounded-[32px] sm:px-5 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center sm:h-16 sm:w-16">
              <Image
                src="/images/Logo1.png"
                alt="InstaAid Logo"
                width={58}
                height={58}
                className="h-9 w-9 rounded-full object-contain sm:h-[58px] sm:w-[58px]"
                priority
              />
            </div>

            <div>
              <h1 className="text-sm font-bold text-[#09214a] leading-tight sm:text-2xl">
                InstaAid Response
              </h1>
              <p className="text-[10px] text-slate-500 sm:text-base">
                Always ready to help
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="relative h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center border border-slate-200 sm:h-14 sm:w-14"
          >
            <User className="h-5 w-5 text-[#09214a] sm:h-8 sm:w-8" />
            <span className="absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white sm:bottom-2 sm:right-2 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>

      <div className="absolute right-3 top-[128px] z-20 flex flex-col gap-3 sm:right-5 sm:top-[270px] sm:gap-7">
        <div className="text-center">
          <button
            onClick={() => {
              if (userLatLon) {
                mapRef.current?.flyTo(userLatLon, 16)
                setDestination(null)
              }
            }}
            disabled={!userLatLon}
            className="h-11 w-11 rounded-2xl bg-white shadow-lg flex items-center justify-center disabled:opacity-60 sm:h-20 sm:w-20 sm:rounded-[24px]"
          >
            <Navigation className="h-5 w-5 text-blue-500 sm:h-10 sm:w-10" />
          </button>
          <p className="mt-1 text-[10px] text-blue-500 font-medium sm:mt-2 sm:text-base">
            My Location
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              if (userLatLon && !isFetchingPois) {
                fetchNearbyPois(userLatLon[0], userLatLon[1])
              }
            }}
            disabled={!userLatLon || isFetchingPois}
            className="relative h-11 w-11 rounded-2xl bg-white shadow-lg flex items-center justify-center disabled:opacity-60 sm:h-20 sm:w-20 sm:rounded-[24px]"
          >
            {isFetchingPois && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 animate-ping sm:h-4 sm:w-4" />
            )}
            <Hospital className="h-5 w-5 text-red-500 sm:h-10 sm:w-10" />
          </button>
          <p className="mt-1 text-[10px] text-red-500 font-medium sm:mt-2 sm:text-base">
            Emergency
          </p>
        </div>
      </div>

      <div className="absolute bottom-4 left-3 right-3 z-20 space-y-2 sm:bottom-8 sm:left-4 sm:right-4 sm:space-y-4">
        <div className="rounded-[20px] bg-white/95 p-3 shadow-xl sm:rounded-[30px] sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center sm:h-16 sm:w-16 sm:rounded-2xl">
                <MapPin className="h-5 w-5 text-green-500 sm:h-8 sm:w-8" />
              </div>

              <div>
                <h2 className="text-sm font-bold text-[#09214a] sm:text-2xl">
                  IoT Status
                </h2>
                <p className="text-xs text-slate-500 sm:text-base">
                  Your device is {deviceOnline ? "online" : "offline"}
                </p>
              </div>
            </div>

            <span
              className={`rounded-xl px-3 py-1 text-xs font-bold sm:rounded-2xl sm:px-5 sm:py-3 sm:text-lg ${
                deviceOnline
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {deviceOnline ? "Online" : "Offline"}
            </span>
          </div>

          {isFetchingPois && (
            <div className="mt-2 flex items-center justify-center sm:mt-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
              <p className="text-xs text-gray-500">Loading hospitals...</p>
            </div>
          )}
        </div>

        <div className="rounded-[20px] bg-white/95 p-3 shadow-xl sm:rounded-[30px] sm:p-5">
          <div className="mb-3 flex items-center justify-between sm:mb-5">
            <h2 className="text-sm font-bold text-[#09214a] sm:text-xl">
              Important Contacts
            </h2>

            <button
              type="button"
              onClick={() => setContactsOpen(true)}
              className="text-xs text-blue-500 font-medium sm:text-base"
            >
              View All
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {importantContacts.map((contact) => (
              <ContactCard key={contact.title} {...contact} />
            ))}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[9998] ${
          contactsOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          onClick={() => setContactsOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            contactsOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute bottom-0 left-0 right-0 rounded-t-[32px] bg-white p-6 shadow-2xl transition-transform duration-300 ${
            contactsOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#09214a]">
              Important Contacts
            </h2>

            <button
              type="button"
              onClick={() => setContactsOpen(false)}
              className="h-10 w-10 rounded-full bg-slate-100 text-xl text-slate-500"
            >
              ×
            </button>
          </div>

          <div className="max-h-[60vh] space-y-3 overflow-y-auto pb-4">
            {importantContacts.map((contact) => (
              <a
                key={contact.title}
                href={`tel:${contact.number}`}
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center text-xl ${contact.color}`}
                  >
                    {contact.icon}
                  </div>

                  <div>
                    <p className="font-bold text-[#09214a]">{contact.title}</p>
                    <p className="text-sm text-slate-500">{contact.subtitle}</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {contact.number}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-600">
                  Call
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[9999] ${
          profileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          onClick={() => setProfileOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            profileOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute right-0 top-0 h-full w-[88%] max-w-md bg-[#eef3f8] shadow-2xl transition-transform duration-300 rounded-l-[36px] overflow-hidden ${
            profileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="relative overflow-hidden bg-white/95 px-6 pb-6 pt-8 shadow-sm">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-100/70" />
            <div className="absolute right-16 top-10 h-10 w-10 rounded-full bg-green-100/80" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-blue-500">
                  InstaAid Response
                </p>
                <h2 className="mt-1 text-3xl font-bold text-[#09214a]">
                  Profile
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl text-slate-500 shadow-md transition hover:scale-105 hover:bg-slate-50"
              >
                ×
              </button>
            </div>
          </div>

          <div className="h-[calc(100%-92px)] overflow-y-auto pb-10">
            <ProfileContent />
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactCard({
  title,
  subtitle,
  number,
  icon,
  color,
}: {
  title: string
  subtitle: string
  number: string
  icon: string
  color: string
}) {
  return (
    <a
      href={`tel:${number}`}
      className="rounded-xl bg-white p-2 shadow-md flex flex-col items-center justify-center text-center min-h-[68px] sm:rounded-2xl sm:p-3 sm:min-h-[92px]"
    >
      <div
        className={`mb-1 h-7 w-7 rounded-full flex items-center justify-center text-sm sm:mb-2 sm:h-10 sm:w-10 sm:text-xl ${color}`}
      >
        {icon}
      </div>
      <p className="text-[10px] font-bold text-[#09214a] sm:text-sm">{title}</p>
      <p className="text-[9px] text-slate-500 sm:text-xs">{subtitle}</p>
    </a>
  )
}