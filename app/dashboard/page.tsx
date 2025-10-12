"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle, User, MapPin, Mail } from "lucide-react";
import Link from "next/link";
import { rtdb } from "@/lib/firebase";
import { ref, onValue, set, Unsubscribe } from "firebase/database";

/* Leaflet / React-Leaflet */
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

/* Fix for default icon URLs */
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function RecenterAutomatically({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], 15, { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export default function DashboardPage() {
  const [status, setStatus] = useState("Loading...");
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [battery, setBattery] = useState("Unknown");
  const [lastSeen, setLastSeen] = useState(0);

  // ✅ Wi-Fi states
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [wifiMessage, setWifiMessage] = useState("");
  const [wifiNetworks, setWifiNetworks] = useState<string[]>([]);
  const [showManual, setShowManual] = useState(false);

  // ✅ Location state
  const [location, setLocation] = useState({
    latitude: null as number | null,
    longitude: null as number | null,
    text: "Fetching location...",
    status: "locating" as "locating" | "available" | "denied" | "unsupported" | "error",
  });

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribers: Unsubscribe[] = [];

    unsubscribers.push(
      onValue(ref(rtdb, "device/status"), (snap) =>
        setStatus(snap.val() || "No data")
      )
    );

    (["x", "y", "z"] as const).forEach((axis) => {
      unsubscribers.push(
        onValue(ref(rtdb, `device/accel/${axis}`), (snap) =>
          setAccel((prev) => ({ ...prev, [axis]: snap.val() || 0 }))
        )
      );
    });

    unsubscribers.push(
      onValue(ref(rtdb, "device/battery"), (snap) =>
        setBattery(snap.val() !== null ? `${snap.val()}%` : "Unknown")
      )
    );

    unsubscribers.push(
      onValue(ref(rtdb, "device/lastSeen"), (snap) => setLastSeen(snap.val() || 0))
    );

    // ✅ Listen for available Wi-Fi networks from ESP32
    unsubscribers.push(
      onValue(ref(rtdb, "device/wifi/networks"), (snap) => {
        const data = snap.val();
        if (data && Array.isArray(data)) {
          setWifiNetworks(data);
        } else {
          setWifiNetworks([]);
        }
      })
    );

    return () => unsubscribers.forEach((u) => u && u());
  }, []);

  /* ✅ Geolocation Sync */
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation((s) => ({
        ...s,
        status: "unsupported",
        text: "Geolocation not supported by this browser.",
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
      set(ref(rtdb, "device/location"), {
        latitude: lat,
        longitude: lng,
        timestamp: Date.now(),
      });
    };

    const error = (err: GeolocationPositionError) => {
      if (err.code === 1) {
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
      }
    };

    const watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    });
    watchIdRef.current = typeof watchId === "number" ? watchId : null;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const now = Math.floor(Date.now() / 1000);
  const deviceOnline = now - lastSeen < 10;

  // ✅ Handle Wi-Fi save
  const handleWifiSave = async () => {
    if (!ssid || !password) {
      setWifiMessage("⚠️ Please enter both SSID and Password.");
      return;
    }
    try {
      await set(ref(rtdb, "device/wifi/credentials"), { ssid, password });
      setWifiMessage("✅ Wi-Fi credentials sent to device!");
      setSsid("");
      setPassword("");
    } catch {
      setWifiMessage("❌ Failed to save Wi-Fi credentials.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200">
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-[375px] h-[812px] overflow-hidden border-[10px] border-gray-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-20"></div>
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
            </div>
          </div>

          {/* ✅ Wi-Fi Setup Card */}
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Wi-Fi Setup
              </h2>

              {/* List of scanned networks */}
              {wifiNetworks.length > 0 ? (
                <div className="mb-3 space-y-2">
                  <p className="text-sm text-gray-600">Available Networks:</p>
                  {wifiNetworks.map((network) => (
                    <button
                      key={network}
                      onClick={() => {
                        setSsid(network);
                        setShowManual(false);
                      }}
                      className="w-full text-left px-3 py-2 border rounded-lg hover:bg-blue-50"
                    >
                      {network}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">
                  Scanning for networks...
                </p>
              )}

              {/* Manual SSID option */}
              <button
                onClick={() => setShowManual(!showManual)}
                className="text-blue-600 underline mb-3 text-sm"
              >
                {showManual ? "Hide Manual Input" : "Enter SSID Manually"}
              </button>

              {(showManual || ssid) && (
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
              )}
              <Button
                onClick={handleWifiSave}
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Save Wi-Fi
              </Button>
              {wifiMessage && (
                <p className="mt-2 text-sm text-gray-700">{wifiMessage}</p>
              )}
            </div>
          </div>

          {/* ✅ System Status */}
          <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition mx-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              System Status
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded-lg shadow-sm">
                <p className="text-sm text-gray-500">Device</p>
                <p
                  className={`mt-1 font-medium ${
                    deviceOnline ? "text-green-600" : "text-red-600"
                  }`}
                >
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
            </div>
          </div>

          {/* ✅ Accident Detection */}
          <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition mx-4 mb-4">
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

          {/* ✅ Live Location Map */}
          <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition mx-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Live Location Map
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              Shows your current position in real time. Status:{" "}
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

            <div className="w-full h-72 overflow-hidden rounded-lg mt-2 relative mb-4">
              {location.status !== "available" && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg p-3 text-center">
                  <div>
                    <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-gray-500 opacity-70" />
                    <p className="text-sm text-gray-700">
                      {location.status === "locating"
                        ? "Obtaining location..."
                        : location.text}
                    </p>
                  </div>
                </div>
              )}

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
              >
                <TileLayer
                  attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <RecenterAutomatically
                  lat={location.latitude}
                  lng={location.longitude}
                />
                {location.latitude != null && location.longitude != null && (
                  <Marker position={[location.latitude, location.longitude]}>
                    <Popup>You are here<br />{location.text}</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            <div className="p-2 flex justify-between items-center text-sm">
              <div>
                {location.latitude != null && location.longitude != null
                  ? `Lat: ${location.latitude.toFixed(
                      6
                    )} · Lon: ${location.longitude.toFixed(6)}`
                  : "Location not available"}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    if (location.latitude && location.longitude) {
                      setLocation((s) => ({ ...s }));
                    } else {
                      alert("Location not available yet.");
                    }
                  }}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  Recenter
                </button>
                <a
                  href={
                    location.latitude != null && location.longitude != null
                      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
                      : "https://www.google.com/maps"
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border text-black border-gray-200 text-sm hover:bg-gray-100"
                >
                  <MapPin className="w-5 h-5 text-red-500" />
                  Maps
                </a>
              </div>
            </div>
          </div>

          {/* ✅ Bottom Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#182F66] border-t border-gray-300 z-10">
            <div className="flex">
              <Link
                href="/dashboard"
                className="flex-1 py-3 px-4 text-center text-blue-600 hover:text-blue-400"
              >
                <Home className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">Home</span>
              </Link>
              <Link
                href="/emergency/services"
                className="flex-1 py-3 px-4 text-center text-white hover:text-blue-400"
              >
                <Mail className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">Message</span>
              </Link>
              <Link
                href="/dashboard/profile"
                className="flex-1 py-3 px-4 text-center text-white hover:text-blue-400"
              >
                <User className="w-6 h-6 mx-auto mb-1" />
                <span className="text-xs">Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
