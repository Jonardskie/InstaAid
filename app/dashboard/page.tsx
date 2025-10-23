"use client"

<<<<<<< HEAD
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, Phone, Mail, AlertTriangle, User, Settings, MapPin } from "lucide-react";
import Link from "next/link";
import { getRtdb } from "../../lib/firebase";
import { ref, onValue, set } from "firebase/database";

/* Leaflet / React-Leaflet */
import dynamic from "next/dynamic";
// Dynamically import react-leaflet components to avoid SSR issues
const MapContainer: any = dynamic(() => import("react-leaflet").then(m => m.MapContainer as any), { ssr: false });
const TileLayer: any = dynamic(() => import("react-leaflet").then(m => m.TileLayer as any), { ssr: false });
const Marker: any = dynamic(() => import("react-leaflet").then(m => m.Marker as any), { ssr: false });
const Popup: any = dynamic(() => import("react-leaflet").then(m => m.Popup as any), { ssr: false });

/* Fix marker icons after mount */
function useEnsureLeafletCss() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
    link.crossOrigin = "";
    document.head.appendChild(link);
  }, []);
}

function useConfigureLeafletIcons() {
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const L = await import("leaflet");
      if (!isMounted) return;
      // @ts-ignore
      delete (L.Icon.Default as unknown as { prototype: { _getIconUrl?: unknown } }).prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
    })();
    return () => { isMounted = false; };
  }, []);
}

/* Smooth Animated Marker (no Leaflet types at module scope) */
function AnimatedMarker({ position }: { position: [number, number] }) {
  const markerRef = useRef<any>(null);
  useEffect(() => {
    if (!markerRef.current) return;
    const marker = markerRef.current;
    // setLatLng is available after marker is mounted
    marker.setLatLng(position);
  }, [position]);
  return (
    <Marker
      position={position as any}
      ref={(ref: any) => { if (ref) markerRef.current = ref; }}
    >
      <Popup>You are here</Popup>
    </Marker>
  );
}

export default function DashboardPage() {
  useEnsureLeafletCss();
  useConfigureLeafletIcons();
  const [activeTab, setActiveTab] = useState("home");
  const [status, setStatus] = useState("Loading...");
  const [accel, setAccel] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [battery, setBattery] = useState("Unknown");
  const [lastSeen, setLastSeen] = useState<number>(0);
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [wifiMessage, setWifiMessage] = useState("");

  /* Live location state */
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
    text: string;
    status: "locating" | "available" | "unsupported" | "denied" | "error";
  }>({
    latitude: null,
    longitude: null,
    text: "Fetching location...",
    status: "locating",
  });

  const [tracking, setTracking] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<any>(null);
=======
import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Home, AlertTriangle, User, MapPin, Mail, XCircle, CheckCircle, Navigation, Hospital } from "lucide-react"
import Link from "next/link"
import { rtdb } from "@/lib/firebase"
import { ref, onValue, set, type Unsubscribe } from "firebase/database"
import dynamic from "next/dynamic"
import type { Map as LeafletMap } from "leaflet"
import { useRedirectToSignin } from "@/lib/redirectToSignin";

// Optimized dynamic import for map
const MapComponent = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600 text-sm">Loading map...</p>
      </div>
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
  useRedirectToSignin(); 
  
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
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [triggerCooldown, setTriggerCooldown] = useState(false)
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentAccidentId, setCurrentAccidentId] = useState<string | null>(null)

  // Location
  const [location, setLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    text: "Fetching location...",
    status: "locating",
  })

  // Map states
  const [pois, setPois] = useState<Poi[]>([])
  const [destination, setDestination] = useState<[number, number] | null>(null)
  const [isFetchingPois, setIsFetchingPois] = useState(false)
  const [hasFetchedInitialPois, setHasFetchedInitialPois] = useState(false)
>>>>>>> mike

  const mapRef = useRef<MapRef>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => setMounted(true), [])

  // Optimized POI fetching function
  const fetchNearbyPois = useCallback(async (lat: number, lon: number) => {
    if (isFetchingPois) return
    setIsFetchingPois(true)
    console.log("Fetching nearby hospitals...")
    
    try {
      // Try to use API route first (more reliable)
      const response = await fetch(`/api/pois?lat=${lat}&lon=${lon}&radius=5000`)
      if (response.ok) {
        const data = await response.json()
        setPois(data.pois || [])
        console.log(`Found ${data.pois?.length || 0} hospitals via API.`)
      } else {
        // Fallback to direct Overpass query
        throw new Error('API route failed')
      }
    } catch (error) {
      console.log("Falling back to direct Overpass query...")
      // Fallback to direct Overpass query
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
        console.log(`Found ${formattedPois.length} hospitals via Overpass.`)
      } catch (fallbackError) {
        console.error("Error fetching POIs:", fallbackError)
      }
    } finally {
      setIsFetchingPois(false)
      setHasFetchedInitialPois(true)
    }
  }, [isFetchingPois])

  // Firebase listeners
  useEffect(() => {
<<<<<<< HEAD
    // Firebase listeners
    const statusRef = ref(getRtdb(), "device/status");
    onValue(statusRef, (snap) => setStatus(snap.val() || "No data"));

    ["x", "y", "z"].forEach((axis) => {
      onValue(ref(getRtdb(), `device/accel/${axis}`), (snap) =>
        setAccel((prev) => ({ ...prev, [axis]: snap.val() || 0 }))
      );
    });

    onValue(ref(getRtdb(), "device/battery"), (snap) =>
      setBattery(snap.val() !== null ? `${snap.val()}%` : "Unknown")
    );
    onValue(ref(getRtdb(), "device/lastSeen"), (snap) => setLastSeen(snap.val() || 0));
  }, []);

  // Recenter the map when location updates
  useEffect(() => {
    if (mapRef.current && typeof location.latitude === "number" && typeof location.longitude === "number") {
      const currentZoom = mapRef.current.getZoom?.() ?? 15;
      mapRef.current.setView([location.latitude, location.longitude], currentZoom, { animate: true });
    }
  }, [location.latitude, location.longitude]);

  /* Start/Stop Geolocation */
  const startTracking = () => {
    if (!("geolocation" in navigator)) {
      setLocation((s) => ({
        ...s,
        status: "unsupported",
        text: "Geolocation not supported",
      }));
      return;
    }

    const success = (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLocation({
        latitude: lat,
        longitude: lng,
        text: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        status: "available",
      });
    };

    const error = (err: GeolocationPositionError) => {
      console.error("Geolocation error:", err);
      if (err.code === err.PERMISSION_DENIED) {
        setLocation((s) => ({
          ...s,
          status: "denied",
          text: "Location permission denied",
        }));
      } else {
        setLocation((s) => ({
          ...s,
          status: "error",
          text: "Unable to retrieve location",
        }));
=======
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

  // Optimized geolocation with delayed POI fetching
  useEffect(() => {
    if (!mounted || !("geolocation" in navigator)) {
      setLocation((s) => ({ ...s, status: "unsupported", text: "Geolocation not supported." }))
      return
    }

    const success = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lng } = pos.coords
      const timestamp = pos.timestamp ?? Date.now()
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
>>>>>>> mike
      }

      setLastPosition({ latitude: lat, longitude: lng, timestamp })
      set(ref(rtdb, "device/location"), { latitude: lat, longitude: lng, timestamp: Date.now() })

      // Delayed POI fetching - wait for map to load first
      if (!hasFetchedInitialPois && !isFetchingPois) {
        const timeoutId = setTimeout(() => {
          fetchNearbyPois(lat, lng)
        }, 2000) // Wait 2 seconds after getting location to fetch POIs
        
        return () => clearTimeout(timeoutId)
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
<<<<<<< HEAD
      maximumAge: 5000,
      timeout: 10000,
    });
    watchIdRef.current = watchId;
    setTracking(true);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  };

  const now = Math.floor(Date.now() / 1000);
  const deviceOnline = now - lastSeen < 10;

const handleWifiSave = async () => {
  if (!ssid || !password) {
    setWifiMessage("⚠️ Please enter both SSID and Password.");
    return;
  }

  try {
    // Save Wi-Fi to Firebase
    await set(ref(getRtdb(), "device/wifi/ssid"), ssid);
    await set(ref(getRtdb(), "device/wifi/password"), password);

    setWifiMessage("✅ Wi-Fi credentials sent to device!");
    setSsid("");
    setPassword("");
  } catch (error) {
    console.error(error);
    setWifiMessage("❌ Failed to save Wi-Fi credentials.");
  }
};
=======
      maximumAge: 10000, // Increased from 1000 to 10000 for better performance
      timeout: 10000, // Increased timeout
    })
    watchIdRef.current = typeof watchId === "number" ? watchId : null

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [mounted, lastPosition, hasFetchedInitialPois, isFetchingPois, fetchNearbyPois])

  if (!mounted)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
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

  const userLatLon: [number, number] | undefined =
    location.latitude && location.longitude ? [location.latitude, location.longitude] : undefined
>>>>>>> mike

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200">
      
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

        <audio 
          ref={audioRef} 
          src="https://actions.google.com/sounds/v1/alarms/beep_short.ogg" 
          loop 
          preload="auto" 
        />

        {/* --- Map Container (Full Screen) --- */}
        <div className="absolute inset-0 z-10">
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
            onMapInstance={(map: MapRef) => {
              mapRef.current = map
            }}
          />
        </div>

        {/* --- Header (Floating) --- */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center space-x-3 mt-4">
            <div className="bg-white rounded-full p-2 shadow-lg">
              <Image 
                src="/images/Logo1.png" 
                alt="Logo" 
                width={50} 
                height={50} 
                className="rounded-full"
                priority // Add priority for above-the-fold image
              />
            </div>
            <h1 className="text-white text-base font-semibold drop-shadow-md">InstaAid Response</h1>
          </div>
        </div>

<<<<<<< HEAD
      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Wi-Fi Setup Card */}
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
          <Button
            onClick={handleWifiSave}
            
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
=======
        {/* --- Map Controls (Floating) --- */}
        <div className="absolute top-32 right-3 flex flex-col gap-2 z-20">
          <button
            onClick={() => {
              if (userLatLon) {
                mapRef.current?.flyTo(userLatLon, 16)
                setDestination(null)
              }
            }}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            disabled={!userLatLon}
>>>>>>> mike
          >
            <Navigation className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => {
              if (userLatLon && !isFetchingPois) {
                fetchNearbyPois(userLatLon[0], userLatLon[1])
              }
            }}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors relative"
            disabled={!userLatLon || isFetchingPois}
          >
            {isFetchingPois && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
            )}
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

            {/* POI Loading Indicator */}
            {isFetchingPois && (
              <div className="mt-3 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <p className="text-xs text-gray-500">Loading hospitals...</p>
              </div>
            )}
<<<<<<< HEAD

             {(() => {
               const mapCenter: [number, number] =
                 typeof location.latitude === "number" && typeof location.longitude === "number"
                   ? [location.latitude, location.longitude]
                   : [14.5995, 120.9842];
               return (
                 <MapContainer
                   center={mapCenter as any}
                   zoom={15}
                   scrollWheelZoom={false}
                   tap={false}
                   whenCreated={(map: any) => { mapRef.current = map; }}
                   style={{ height: "100%", width: "100%" }}
                   className="z-0"
                 >
                   <TileLayer
                     attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
                     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                   />
                   {location.latitude && location.longitude && (
                     <AnimatedMarker position={[location.latitude, location.longitude]} />
                   )}
                 </MapContainer>
               );
             })()}
          </div>

          {/* Action Bar */}
          <div className="p-4 flex gap-3 items-center justify-between">
            <div className="text-sm text-gray-600">
              {location.latitude && location.longitude ? (
                <>
                  Lat:{" "}
                  <span className="font-medium">
                    {location.latitude.toFixed(6)}
                  </span>{" "}
                  · Lon:{" "}
                  <span className="font-medium">
                    {location.longitude.toFixed(6)}
                  </span>
                </>
              ) : (
                "Location not available"
              )}
            </div>

            <div className="flex gap-2">
              {!tracking ? (
                <button
                  onClick={startTracking}
                  className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
                >
                  Start Tracking
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Stop Tracking
                </button>
              )}

              <a
                href={
                  location.latitude && location.longitude
                    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
                    : "https://www.google.com/maps"
                }
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-black border-gray-200 text-sm hover:bg-gray-100"
              >
                <MapPin className="w-10 h-10 text-red-500" />
                Open in Maps
              </a>
            </div>
=======
>>>>>>> mike
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
<<<<<<< HEAD

        {/* Accident Detection Card */}
        <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Accident Detection
          </h2>
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
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-gray-300 z-50">
        <div className="flex">
          <Link
            href="/dashboard"
            className="flex-1 py-3 px-4 text-center text-blue-600"
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
                {/*
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
=======
        
      
>>>>>>> mike
    </div>
  )
}