"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import ProfileContent from "@/components/ProfileContent"
import { DriverNav } from "@/components/driver-nav"
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
  ChevronUp,
} from "lucide-react"
import { rtdb, auth } from "@/lib/firebase"
import { ref, onValue, set, get, type Unsubscribe } from "firebase/database"
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth"

const MapComponent = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="text-sm text-gray-600">Loading map...</p>
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
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false)
  const [isConfirmingSOS, setIsConfirmingSOS] = useState(false)
  const [isCallingPolice, setIsCallingPolice] = useState(false)
  const [alertDismissed, setAlertDismissed] = useState(false)

  const { toast } = useToast()

  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null)

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

  const triggerCooldownRef = useRef(false)

  const [triggerCooldown, setTriggerCooldown] = useState(false)
  const [currentAccidentId, setCurrentAccidentId] = useState<string | null>(null)

  const [connectedDeviceId, setConnectedDeviceId] = useState("")
  const [connectingDevice, setConnectingDevice] = useState(false)

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
  
  const [adjustedLocation, setAdjustedLocation] = useState<[number, number] | null>(null)

  const mapRef = useRef<MapRef>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [])

      const fetchNearbyPois = useCallback(
      async (lat: number, lon: number) => {
        if (isFetchingPois) return

        setIsFetchingPois(true)

        try {
          const radius = 10000

          const response = await fetch(
            `/api/pois?lat=${lat}&lon=${lon}&radius=${radius}`,
          )

          if (response.ok) {
            const data = await response.json()
            const apiPois = (data.pois || []).filter(
              (poi: Poi) => poi.lat && poi.lon,
            )

            if (apiPois.length > 0) {
              setPois(apiPois)
              return
            }
          }

          throw new Error("API returned no POIs")
        } catch {
          const radius = 10000

          const query = `
            [out:json][timeout:25];
            (
              node["amenity"="hospital"](around:${radius},${lat},${lon});
              way["amenity"="hospital"](around:${radius},${lat},${lon});
              relation["amenity"="hospital"](around:${radius},${lat},${lon});

              node["amenity"="clinic"](around:${radius},${lat},${lon});
              way["amenity"="clinic"](around:${radius},${lat},${lon});
              relation["amenity"="clinic"](around:${radius},${lat},${lon});

              node["healthcare"="hospital"](around:${radius},${lat},${lon});
              way["healthcare"="hospital"](around:${radius},${lat},${lon});
              relation["healthcare"="hospital"](around:${radius},${lat},${lon});

              node["healthcare"="clinic"](around:${radius},${lat},${lon});
              way["healthcare"="clinic"](around:${radius},${lat},${lon});
              relation["healthcare"="clinic"](around:${radius},${lat},${lon});

              node["healthcare"="doctor"](around:${radius},${lat},${lon});
              way["healthcare"="doctor"](around:${radius},${lat},${lon});
              relation["healthcare"="doctor"](around:${radius},${lat},${lon});

              node["emergency"="yes"](around:${radius},${lat},${lon});
              way["emergency"="yes"](around:${radius},${lat},${lon});
              relation["emergency"="yes"](around:${radius},${lat},${lon});
            );
            out center tags;
          `

          try {
            const response = await fetch(
              "https://overpass-api.de/api/interpreter",
              {
                method: "POST",
                headers: {
                  "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
                },
                body: new URLSearchParams({ data: query }),
              },
            )

            if (!response.ok) {
              console.warn("Overpass API failed:", response.status)
              setPois([])
              return
            }

            const data = await response.json()

            const formattedPois: Poi[] = data.elements
              .map((el: any) => ({
                lat: el.lat ?? el.center?.lat,
                lon: el.lon ?? el.center?.lon,
                name:
                  el.tags?.name ||
                  el.tags?.official_name ||
                  el.tags?.operator ||
                  "Medical Facility",
              }))
              .filter((poi: Poi) => poi.lat && poi.lon)

            console.log("Nearby hospitals/clinics:", formattedPois)
            setPois(formattedPois)
          } catch (fallbackError) {
            console.error("Error fetching POIs:", fallbackError)
            setPois([])
          }
        } finally {
          setIsFetchingPois(false)
          setHasFetchedInitialPois(true)
        }
      },
      [isFetchingPois],
    )

      const connectDevice = async () => {
      const deviceId = "device"

      if (!currentUser) {
        toast({
          title: "Login Required",
          description: "Please log in first before connecting a device.",
          variant: "destructive",
        })
        return
      }

      setConnectingDevice(true)

      try {
        const userId = currentUser.uid

        const userSnap = await get(ref(rtdb, `users/${userId}`))
        const savedUserData = userSnap.val() || {}

        const userData = {
          userId,
          name:
            savedUserData.name ||
            savedUserData.fullName ||
            currentUser.displayName ||
            currentUser.email ||
            "Unknown User",
          email: savedUserData.email || currentUser.email || "N/A",
          phone:
            savedUserData.phone ||
            savedUserData.phoneNumber ||
            savedUserData.contactNumber ||
            savedUserData.mobileNumber ||
            "N/A",
          emergencyName: savedUserData.emergencyName || "N/A",
          emergencyNumber: savedUserData.emergencyNumber || "N/A",
          connectedAt: Date.now(),
          status: "connected",
        }

        await set(ref(rtdb, `users/${userId}/deviceId`), deviceId)
        await set(ref(rtdb, "device/user"), userData)
        await set(ref(rtdb, "device/currentUserId"), userId)

        setConnectedDeviceId(deviceId)

        toast({
          title: "Device Connected",
          description: "Your IoT device has been successfully connected.",
        })
      } catch (error) {
        console.error(error)

        toast({
          title: "Connection Failed",
          description: "Unable to connect device. Please try again.",
          variant: "destructive",
        })
      } finally {
        setConnectingDevice(false)
      }
    }

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

        if (val === true && !triggerCooldownRef.current) {
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
  }, [mounted])

  useEffect(() => {
  triggerCooldownRef.current = triggerCooldown
  }, [triggerCooldown])

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

      if (currentUser) {
        set(ref(rtdb, `users/${currentUser.uid}/location`), {
          latitude: lat,
          longitude: lng,
          timestamp: Date.now(),
        })
        set(ref(rtdb, `users/${currentUser.uid}/status`), "online")
        set(ref(rtdb, `users/${currentUser.uid}/lastSeen`), Date.now())
      }

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
          confirmAccident(id)
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
        await set(ref(rtdb, `admin_alerts/${currentAccidentId}`), null)
      }
    } catch (e) {
      console.error(e)
    }

    await set(ref(rtdb, "triggered"), false)

    setCurrentAccidentId(null)
    setTriggerCooldown(true)

    cooldownRef.current = setTimeout(() => setTriggerCooldown(false), 5000)
  }

      const confirmAccident = async (accidentId?: string) => {
      setAccidentAlert(false)
      stopSound()

      await set(ref(rtdb, "triggered"), false)

      const id = accidentId || currentAccidentId || `device-${Math.floor(Date.now() / 1000)}`
      const deviceId = connectedDeviceId || "device"

      const latestLocationSnap = await get(ref(rtdb, "device/location"))
      const latestLocation = latestLocationSnap.val() || {}

      const finalLat = adjustedLocation ? adjustedLocation[0] : (location.latitude ?? latestLocation.latitude ?? null)
      const finalLng = adjustedLocation ? adjustedLocation[1] : (location.longitude ?? latestLocation.longitude ?? null)

      const userSnap = await get(ref(rtdb, "device/user"))
      const userData = userSnap.val() || {}

      const coordsStr =
        finalLat && finalLng ? `${finalLat},${finalLng}` : "Location unavailable"

      const parsedBattery =
        battery !== "Unknown" ? parseInt(battery.replace("%", ""), 10) || 0 : 100

      // 1. Write to RTDB accidents
      await set(ref(rtdb, `accidents/${id}`), {
        deviceId,
        userId: userData.userId || currentUser?.uid || "unknown-user",
        name:
          userData.name ||
          currentUser?.displayName ||
          currentUser?.email ||
          "Unknown User",
        email: userData.email || currentUser?.email || "N/A",
        phone: userData.phone || "N/A",
        emergencyName: userData.emergencyName || "N/A",
        emergencyNumber: userData.emergencyNumber || "N/A",
        timestamp: Math.floor(Date.now() / 1000),
        coordinates: coordsStr,
        latitude: finalLat,
        longitude: finalLng,
        status: "pending",
        adminStatus: "pending",
        confirmed: true,
        device: {
          accel: accel,
          battery: parsedBattery,
          lastSeen: lastSeen || Date.now(),
          location: {
            latitude: finalLat,
            longitude: finalLng,
          },
        },
        description: `X=${accel.x}, Y=${accel.y}, Z=${accel.z}`,
      })

      // 2. Write to RTDB admin_alerts (triggers Admin05 live toast notification & sound)
      await set(ref(rtdb, `admin_alerts/${id}`), {
        coordinates: coordsStr,
        viewed: false,
        timestamp: Date.now(),
      })

      // 3. Write rescueRequest for responders
      if (finalLat && finalLng) {
        await set(ref(rtdb, "device/rescueRequest"), {
          latitude: finalLat,
          longitude: finalLng,
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
      <div className="flex min-h-screen items-center justify-center bg-gray-200">
        <div className="text-center">
          <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
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
          <div className="w-80 rounded-2xl bg-white p-6 text-center shadow-2xl">
            <AlertTriangle className="mx-auto mb-2 h-12 w-12 animate-pulse text-red-600" />
            <h2 className="text-xl font-semibold text-red-600">
              Accident Detected
            </h2>
            <p className="text-sm text-gray-600">
              Auto confirm in{" "}
              <span className="text-lg font-bold text-red-600">
                {countdown}s
              </span>
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Location: {location.text}
            </p>

            <div className="mt-4 flex w-full gap-3">
              <Button
                onClick={cancelAccident}
                className="flex-1 bg-green-500 text-white hover:bg-green-600"
              >
                <XCircle className="h-5 w-5" /> I am Safe
              </Button>

              <Button
              onClick={() => confirmAccident(currentAccidentId || undefined)}
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
            >
              <CheckCircle className="h-5 w-5" /> I need Help
            </Button>
            </div>
          </div>
        </div>
      )}

      {rescueDispatched && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-80 rounded-2xl bg-white p-6 text-center shadow-2xl">
            <CheckCircle className="mx-auto mb-2 h-12 w-12 animate-pulse text-green-600" />
            <h2 className="text-xl font-semibold text-green-600">
              Help is on the Way!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Emergency services have been notified.
            </p>
            <p className="mt-1 text-sm text-gray-600">
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
          center={(adjustedLocation || userLatLon) || [14.5995, 120.9842]}
          zoom={15}
          userPosition={adjustedLocation || userLatLon}
          pois={pois}
          destination={destination}
          onPoiClick={(lat: number, lon: number) => {
            setDestination([lat, lon])
            mapRef.current?.flyTo([lat, lon], 16)
          }}
          onLocationAdjusted={(lat: number, lon: number) => {
            setAdjustedLocation([lat, lon])
          }}
          onMapInstance={(map: LeafletMap) => {
            mapRef.current = map
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 bg-white/20" />

      <div className="absolute left-4 right-4 top-4 z-20">
        <div className="flex items-center justify-between rounded-[28px] bg-white/95 px-4 py-3 shadow-xl">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md">
              <Image
                src="/images/Logo1.png"
                alt="InstaAid Logo"
                width={48}
                height={48}
                className="h-11 w-11 rounded-full object-contain"
                priority
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight text-[#09214a]">
                InstaAid Response
              </h1>
              <p className="text-xs text-slate-500">Always ready to help</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md"
          >
            <User className="h-8 w-8 text-[#09214a]" />
            <span className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
          </button>
        </div>
      </div>

      <div className="absolute right-4 top-[118px] z-20 flex flex-col gap-3">
        <button
          onClick={() => {
            if (userLatLon) {
              setAdjustedLocation(null) // clear manual pin
              mapRef.current?.flyTo(userLatLon, 16)
              setDestination(null)
            }
          }}
          disabled={!userLatLon}
          className="flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 shadow-xl transition active:scale-95 disabled:opacity-60"
        >
          <Navigation className="h-7 w-7 text-blue-500" />
          <span className="text-xs font-bold text-blue-500">Locate</span>
        </button>

        <button
          onClick={() => {
            if (userLatLon && !isFetchingPois) {
              fetchNearbyPois(userLatLon[0], userLatLon[1])
            }
          }}
          disabled={!userLatLon || isFetchingPois}
          className="relative flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl transition active:scale-95 disabled:opacity-60"
        >
          {isFetchingPois && (
            <span className="absolute -right-1 -top-1 h-4 w-4 animate-ping rounded-full bg-blue-500" />
          )}
          <Hospital className="h-7 w-7 text-blue-500" />
          <span className="text-xs font-bold text-blue-500">Hospitals</span>
        </button>

        <button
          onClick={() => {
            // Manual SOS trigger
            startAccidentCountdown()
          }}
          className="relative flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-3 shadow-xl transition active:scale-95 shadow-red-500/40"
        >
          <span className="absolute inset-0 rounded-2xl animate-ping bg-red-400 opacity-30" />
          <AlertTriangle className="h-7 w-7 text-white" />
          <span className="text-xs font-bold text-white">Manual SOS</span>
        </button>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-20 space-y-3">
        <div className="rounded-[26px] bg-white/95 p-4 shadow-xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100">
                <MapPin className="h-8 w-8 text-green-500" />
              </div>

              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#09214a]">
                  IoT Status
                </h2>
                <p className="truncate text-sm text-slate-500">
                  Your device is {deviceOnline ? "online" : "offline"}
                </p>
              </div>
            </div>

            <span
              className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-bold ${
                deviceOnline
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {deviceOnline ? "Online" : "Offline"}
            </span>
          </div>

          <div className="mt-4 space-y-2">

            <Button
            onClick={connectDevice}
            disabled={connectingDevice || !!connectedDeviceId}
            className={`w-full rounded-2xl py-3 font-bold text-white ${
              connectedDeviceId
                ? "bg-green-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {connectingDevice
              ? "Connecting..."
              : connectedDeviceId
              ? `Connected to ${connectedDeviceId}`
              : "Connect Device"}
          </Button>
          </div>

          {isFetchingPois && (
            <div className="mt-3 flex items-center justify-center">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-xs text-gray-500">Loading hospitals...</p>
            </div>
          )}
        </div>

        <div className="rounded-[26px] bg-white/95 p-4 shadow-xl">
          <button
            type="button"
            onClick={() => setContactsOpen((prev) => !prev)}
            className="flex w-full items-center justify-between"
          >
            <h2 className="text-lg font-bold text-[#09214a]">
              Hotline Contacts
            </h2>

            <ChevronUp
              className={`h-6 w-6 text-[#09214a] transition-transform duration-300 ${
                contactsOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${
              contactsOpen
                ? "mt-4 max-h-[260px] opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="grid grid-cols-2 gap-3">
              {importantContacts.map((contact) => (
                <ContactCard key={contact.title} {...contact} />
              ))}
            </div>
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
          className={`absolute right-0 top-0 h-full w-[78%] max-w-[340px] overflow-hidden rounded-l-[30px] bg-[#eef3f8] shadow-2xl transition-transform duration-300 ${
            profileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="relative overflow-hidden bg-white/95 px-5 pb-5 pt-7 shadow-sm">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-100/70" />
            <div className="absolute right-14 top-9 h-10 w-10 rounded-full bg-green-100/80" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-500">
                  InstaAid Response
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#09214a]">
                  Profile
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-2xl text-slate-500 shadow-md transition hover:scale-105 hover:bg-slate-50"
              >
                ×
              </button>
            </div>
          </div>

          <div className="h-[calc(100%-84px)] overflow-y-auto pb-10">
            <ProfileContent />
          </div>
        </div>
      </div>

      {/* Persistent Bottom Navigation */}
      <DriverNav />
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
      className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-md transition active:scale-95"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-2xl ${color}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-[#09214a]">{title}</p>
        <p className="truncate text-xs text-slate-500">{subtitle}</p>
      </div>
    </a>
  )
}